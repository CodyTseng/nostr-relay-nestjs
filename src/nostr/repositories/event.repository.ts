import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  Event,
  EventRepository,
  EventRepositoryUpsertResult,
  Filter,
  getTimestampInSeconds,
} from '@nostr-relay/common';
import { isNil } from 'lodash';
import { Brackets, DataSource, QueryFailedError, Repository } from 'typeorm';
import { EventType } from '../constants';
import { EventEntity, GenericTagEntity } from '../entities';
import { TEventIdWithScore } from '../types';
import { toGenericTag } from '../utils';
import { EventSearchRepository } from './event-search.repository';

@Injectable()
export class PgEventRepository extends EventRepository {
  readonly isSearchSupported = true;

  constructor(
    @InjectRepository(EventEntity)
    private readonly eventRepository: Repository<EventEntity>,
    @InjectRepository(GenericTagEntity)
    private readonly genericTagRepository: Repository<GenericTagEntity>,
    private readonly dataSource: DataSource,
    private readonly eventSearchRepository: EventSearchRepository,
  ) {
    super();
  }

  async upsert(event: Event): Promise<EventRepositoryUpsertResult> {
    const eventEntity = EventEntity.fromEvent(event);
    let oldEventEntity: EventEntity | undefined | null;
    let isDuplicate = false;
    try {
      await this.dataSource.transaction(async (manager) => {
        if (
          [EventType.PARAMETERIZED_REPLACEABLE, EventType.REPLACEABLE].includes(
            eventEntity.type,
          )
        ) {
          oldEventEntity = await manager.findOneBy(EventEntity, {
            kind: eventEntity.kind,
            author: eventEntity.author,
            dTagValue: eventEntity.dTagValue!,
          });

          if (
            oldEventEntity &&
            (oldEventEntity.createdAt > eventEntity.createdAt ||
              (oldEventEntity.createdAt === eventEntity.createdAt &&
                oldEventEntity.id <= eventEntity.id))
          ) {
            isDuplicate = true;
            return;
          }

          if (oldEventEntity) {
            await manager.delete(EventEntity, { id: oldEventEntity.id });
          }
        }

        await manager.insert(EventEntity, eventEntity);
        await manager.insert(
          GenericTagEntity,
          eventEntity.genericTags.map((tag) => ({
            tag,
            eventId: eventEntity.id,
            kind: eventEntity.kind,
            author: eventEntity.author,
            createdAt: eventEntity.createdAtStr,
          })),
        );
        return;
      });
    } catch (error) {
      if (
        error instanceof QueryFailedError &&
        error.driverError.code === '23505'
      ) {
        // 23505 is unique_violation
        return { isDuplicate: true };
      }
      throw error;
    }

    if (isDuplicate) {
      return { isDuplicate: true };
    }

    if (oldEventEntity) {
      await this.eventSearchRepository.deleteMany([oldEventEntity.id]);
    }

    await this.eventSearchRepository.add(eventEntity);
    return { isDuplicate: false };
  }

  async find(filter: Filter): Promise<Event[]> {
    const limit = this.getLimitFrom(filter);
    if (limit === 0) return [];

    if (filter.search) {
      return this.eventSearchRepository.find(filter);
    }

    if (this.shouldQueryFromGenericTags(filter)) {
      const genericTags = await this.createGenericTagsQueryBuilder(filter)
        .take(limit)
        .orderBy('genericTag.createdAt', 'DESC')
        .getMany();
      return genericTags.map((genericTag) => genericTag.event.toEvent());
    }

    const eventEntities = await this.createQueryBuilder(filter)
      .take(limit)
      .orderBy('event.createdAtStr', 'DESC')
      .getMany();
    return eventEntities.map((eventEntity) => eventEntity.toEvent());
  }

  async findTopIdsWithScore(filter: Filter): Promise<TEventIdWithScore[]> {
    const limit = this.getLimitFrom(filter, 1000);
    if (limit === 0) return [];

    if (filter.search) {
      return this.eventSearchRepository.findTopIdsWithScore(filter);
    }

    let partialEvents: Pick<EventEntity, 'id' | 'createdAt'>[] = [];

    if (this.shouldQueryFromGenericTags(filter)) {
      const genericTags = await this.createGenericTagsQueryBuilder(filter, [
        'event.id',
        'event.createdAtStr',
      ])
        .take(limit)
        .orderBy('genericTag.createdAt', 'DESC')
        .getMany();
      partialEvents = genericTags.map((genericTag) => genericTag.event);
    } else {
      partialEvents = await this.createQueryBuilder(filter)
        .select(['event.id', 'event.createdAtStr'])
        .take(limit)
        .orderBy('event.createdAtStr', 'DESC')
        .getMany();
    }

    // TODO: algorithm to calculate score
    return partialEvents.map((event) => ({
      id: event.id,
      score: event.createdAt,
    }));
  }

  private createQueryBuilder(filter: Filter) {
    const queryBuilder = this.eventRepository.createQueryBuilder('event');

    queryBuilder.where('1 = 1');

    if (filter.ids?.length) {
      queryBuilder.andWhere('event.id IN (:...ids)', { ids: filter.ids });
    }

    if (filter.since) {
      queryBuilder.andWhere('event.created_at >= :since', {
        since: filter.since,
      });
    }

    if (filter.until) {
      queryBuilder.andWhere('event.created_at <= :until', {
        until: filter.until,
      });
    }

    if (filter.authors?.length) {
      queryBuilder.andWhere('event.author IN (:...authors)', {
        authors: filter.authors,
      });
    }

    if (filter.kinds?.length) {
      queryBuilder.andWhere('event.kind IN (:...kinds)', {
        kinds: filter.kinds,
      });
    }

    if (filter['#d']?.length) {
      queryBuilder.andWhere('event.d_tag_value IN (:...dTagValues)', {
        dTagValues: filter['#d'],
      });
    }

    const genericTagsCollection = this.extractGenericTagsCollectionFrom(filter);
    if (genericTagsCollection.length) {
      genericTagsCollection.forEach((genericTags) => {
        queryBuilder.andWhere('event.generic_tags && (:genericTags)', {
          genericTags,
        });
      });
    }

    queryBuilder.andWhere(
      new Brackets((subQb) => {
        subQb
          .where('event.expired_at IS NULL')
          .orWhere('event.expired_at > :expiredAt', {
            expiredAt: getTimestampInSeconds(),
          });
      }),
    );

    return queryBuilder;
  }

  private shouldQueryFromGenericTags(filter: Filter): boolean {
    return (
      !!this.extractGenericTagsCollectionFrom(filter).length &&
      !filter.ids?.length &&
      !filter['#d']?.length
    );
  }

  private createGenericTagsQueryBuilder(filter: Filter, selection?: string[]) {
    // TODO: select more appropriate generic tags
    const [mainGenericTagsFilter, ...restGenericTagsCollection] =
      this.extractGenericTagsCollectionFrom(filter);

    const queryBuilder = this.genericTagRepository
      .createQueryBuilder('genericTag')
      .distinctOn(['genericTag.eventId', 'genericTag.createdAt']);

    if (selection?.length) {
      queryBuilder.leftJoin(
        'genericTag.event',
        'event',
        'genericTag.eventId = event.id',
      );
      queryBuilder.addSelect(selection);
    } else {
      queryBuilder.leftJoinAndSelect(
        'genericTag.event',
        'event',
        'genericTag.eventId = event.id',
      );
    }

    queryBuilder.where('genericTag.tag IN (:...mainGenericTagsFilter)', {
      mainGenericTagsFilter,
    });

    if (restGenericTagsCollection.length) {
      restGenericTagsCollection.forEach((genericTags) => {
        queryBuilder.andWhere('event.generic_tags && (:genericTags)', {
          genericTags,
        });
      });
    }

    if (filter.since) {
      queryBuilder.andWhere('genericTag.createdAt >= :since', {
        since: filter.since,
      });
    }

    if (filter.until) {
      queryBuilder.andWhere('genericTag.createdAt <= :until', {
        until: filter.until,
      });
    }

    if (filter.authors?.length) {
      queryBuilder.andWhere('genericTag.author IN (:...authors)', {
        authors: filter.authors,
      });
    }

    if (filter.kinds?.length) {
      queryBuilder.andWhere('genericTag.kind IN (:...kinds)', {
        kinds: filter.kinds,
      });
    }

    queryBuilder.andWhere(
      new Brackets((subQb) => {
        subQb
          .where('event.expired_at IS NULL')
          .orWhere('event.expired_at > :expiredAt', {
            expiredAt: getTimestampInSeconds(),
          });
      }),
    );

    return queryBuilder;
  }

  private getLimitFrom(filter: Filter, defaultLimit = 100) {
    return Math.min(isNil(filter.limit) ? defaultLimit : filter.limit, 1000);
  }

  private extractGenericTagsCollectionFrom(filter: Filter): string[][] {
    return Object.keys(filter)
      .filter((key) => key.startsWith('#'))
      .map((key) => {
        const tagName = key[1];
        return filter[key].map((v: string) => toGenericTag(tagName, v));
      });
  }
}
