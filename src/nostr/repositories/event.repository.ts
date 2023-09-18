import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { isNil } from 'lodash';
import { Brackets, QueryFailedError, Repository } from 'typeorm';
import { Event, Filter, GenericTag } from '../entities';
import { TEventIdWithScore } from '../types';
import { getTimestampInSeconds } from '../utils';

export type EventRepositoryFilter = Pick<
  Filter,
  | 'ids'
  | 'authors'
  | 'kinds'
  | 'limit'
  | 'since'
  | 'until'
  | 'genericTagsCollection'
  | 'dTagValues'
>;

@Injectable()
export class EventRepository {
  constructor(
    @InjectRepository(Event)
    private readonly event: Repository<Event>,
    @InjectRepository(GenericTag)
    private readonly genericTag: Repository<GenericTag>,
  ) {}

  async create(event: Event) {
    try {
      await this.event.insert(event);
    } catch (error) {
      if (
        error instanceof QueryFailedError &&
        error.driverError.code === '23505'
      ) {
        // 23505 is unique_violation
        return false;
      }
      throw error;
    }

    return true;
  }

  async find(filter: EventRepositoryFilter): Promise<Event[]> {
    const limit = this.getLimitFrom(filter);
    if (limit === 0) return [];

    if (filter.genericTagsCollection?.length && !filter.ids?.length) {
      const genericTags = await this.createGenericTagsQueryBuilder(filter)
        .take(limit)
        .orderBy('genericTag.createdAt', 'DESC')
        .getMany();
      return genericTags.map((genericTag) => genericTag.event);
    }

    return await this.createQueryBuilder(filter)
      .take(limit)
      .orderBy('event.createdAtStr', 'DESC')
      .getMany();
  }

  async findOne(filter: EventRepositoryFilter) {
    if (filter.genericTagsCollection?.length && !filter.ids?.length) {
      const genericTag = await this.createGenericTagsQueryBuilder(filter)
        .orderBy('genericTag.createdAt', 'DESC')
        .getOne();
      return genericTag?.event ?? null;
    }

    return await this.createQueryBuilder(filter)
      .orderBy('event.createdAtStr', 'DESC')
      .getOne();
  }

  async findTopIdsWithScore(
    filter: EventRepositoryFilter,
  ): Promise<TEventIdWithScore[]> {
    const limit = this.getLimitFrom(filter, 1000);
    if (limit === 0) return [];

    let partialEvents: Pick<Event, 'id' | 'createdAt'>[] = [];

    if (filter.genericTagsCollection?.length && !filter.ids?.length) {
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

  async replace(event: Event, oldEventId?: string) {
    if (event.id === oldEventId) {
      return false;
    }

    if (oldEventId) {
      await this.event.delete({ id: oldEventId });
    }

    return this.create(event);
  }

  private createQueryBuilder(filter: EventRepositoryFilter) {
    const queryBuilder = this.event.createQueryBuilder('event');

    queryBuilder.where('1 = 1');

    if (filter.ids?.length) {
      queryBuilder.andWhere('event.id IN (:...ids)', { ids: filter.ids });
    }

    if (filter.genericTagsCollection) {
      filter.genericTagsCollection.forEach((genericTags) => {
        queryBuilder.andWhere('event.generic_tags && (:genericTags)', {
          genericTags,
        });
      });
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

    if (filter.dTagValues) {
      queryBuilder.andWhere('event.d_tag_value IN (:...dTagValues)', {
        dTagValues: filter.dTagValues,
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

  private createGenericTagsQueryBuilder(
    filter: EventRepositoryFilter,
    selection?: string[],
  ) {
    if (!filter.genericTagsCollection?.length)
      throw new Error('genericTagsCollection is required');

    // TODO: select more appropriate generic tags
    const [firstGenericTags, ...restGenericTags] = filter.genericTagsCollection;
    if (!firstGenericTags.length) throw new Error('genericTags is required');

    const queryBuilder = this.genericTag
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

    queryBuilder.where('genericTag.tag IN (:...firstGenericTags)', {
      firstGenericTags,
    });

    if (restGenericTags.length) {
      restGenericTags.forEach((genericTags) => {
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

  private getLimitFrom(filter: EventRepositoryFilter, defaultLimit = 100) {
    return Math.min(isNil(filter.limit) ? defaultLimit : filter.limit, 1000);
  }
}
