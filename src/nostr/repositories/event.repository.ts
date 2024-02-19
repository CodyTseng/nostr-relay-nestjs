import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  Event,
  EventRepositoryUpsertResult,
  EventType,
  Filter,
  EventRepository as IEventRepository,
  getTimestampInSeconds,
} from '@nostr-relay/common';
import { isNil } from 'lodash';
import { Brackets, DataSource, QueryFailedError, Repository } from 'typeorm';
import { EventEntity, GenericTagEntity } from '../entities';
import { TEventIdWithScore } from '../types';
import { toGenericTag } from '../utils';
import { EventSearchRepository } from './event-search.repository';

@Injectable()
export class EventRepository extends IEventRepository {
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
    try {
      await this.dataSource.transaction(async (manager) => {
        await manager.query(
          `
            INSERT INTO events (
                id,
                pubkey,
                author,
                created_at,
                kind,
                tags,
                content,
                sig,
                expired_at,
                d_tag_value,
                generic_tags,
                create_date
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW())
            ON CONFLICT (author, kind, d_tag_value) WHERE d_tag_value IS NOT NULL
            DO UPDATE SET
                id = EXCLUDED.id,
                pubkey = EXCLUDED.pubkey,
                created_at = EXCLUDED.created_at,
                tags = EXCLUDED.tags,
                content = EXCLUDED.content,
                sig = EXCLUDED.sig,
                expired_at = EXCLUDED.expired_at,
                generic_tags = EXCLUDED.generic_tags,
                create_date = EXCLUDED.create_date
            WHERE
                events.created_at < EXCLUDED.created_at
                OR (
                    events.created_at = EXCLUDED.created_at
                    AND events.id > EXCLUDED.id
                )
        `,
          [
            eventEntity.id,
            eventEntity.pubkey,
            eventEntity.author,
            eventEntity.createdAt,
            eventEntity.kind,
            JSON.stringify(eventEntity.tags),
            eventEntity.content,
            eventEntity.sig,
            eventEntity.expiredAt,
            eventEntity.dTagValue,
            `{${eventEntity.genericTags.join(',')}}`,
          ],
        );

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

    if (
      (
        [
          EventType.REPLACEABLE,
          EventType.PARAMETERIZED_REPLACEABLE,
        ] as EventType[]
      ).includes(eventEntity.type)
    ) {
      const dbEvent = await this.eventRepository.findOneBy({
        author: eventEntity.author,
        kind: eventEntity.kind,
        dTagValue: eventEntity.dTagValue!,
      });
      if (dbEvent && dbEvent.id !== eventEntity.id) {
        return { isDuplicate: true };
      }

      await this.eventSearchRepository.deleteByReplaceableEvent(eventEntity);
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

    const genericTags = this.extractGenericTagsCollectionFrom(filter);
    if (!filter.ids?.length && genericTags.length) {
      const rows = await this.createGenericTagsQueryBuilder(filter, genericTags)
        .take(limit)
        .orderBy('genericTag.createdAt', 'DESC')
        .getMany();
      return rows.map((genericTag) => genericTag.event.toEvent());
    }

    const eventEntities = await this.createQueryBuilder(filter)
      .take(limit)
      .orderBy('event.createdAtStr', 'DESC')
      .getMany();
    return eventEntities.map((eventEntity) => eventEntity.toEvent());
  }

  async findTopIds(filter: Filter): Promise<TEventIdWithScore[]> {
    const limit = this.getLimitFrom(filter, 1000);
    if (limit === 0) return [];

    if (filter.search) {
      return this.eventSearchRepository.findTopIds(filter);
    }

    let partialEvents: Pick<EventEntity, 'id' | 'createdAt'>[] = [];

    const genericTags = this.extractGenericTagsCollectionFrom(filter);
    if (!filter.ids?.length && genericTags.length) {
      const rows = await this.createGenericTagsQueryBuilder(
        filter,
        genericTags,
        ['event.id', 'event.createdAtStr'],
      )
        .take(limit)
        .orderBy('genericTag.createdAt', 'DESC')
        .getMany();
      partialEvents = rows.map((genericTag) => genericTag.event);
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

  async deleteExpiredEvents() {
    return await this.eventRepository
      .createQueryBuilder()
      .delete()
      .from(EventEntity)
      .where('expired_at < :expiredAt', {
        expiredAt: getTimestampInSeconds(),
      })
      .execute();
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

    const genericTagsCollection = this.extractGenericTagsCollectionFrom(filter);
    if (genericTagsCollection.length) {
      genericTagsCollection.forEach((genericTags) => {
        queryBuilder.andWhere('event.generic_tags && (:genericTags)', {
          genericTags,
        });
      });
    }

    return queryBuilder;
  }

  private createGenericTagsQueryBuilder(
    filter: Filter,
    genericTags: string[][],
    selection?: string[],
  ) {
    // TODO: select more appropriate generic tags
    const [mainGenericTagsFilter, ...restGenericTagsCollection] = genericTags;

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
      })
      .sort((a, b) => a.length - b.length);
  }
}
