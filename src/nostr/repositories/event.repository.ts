import { Observable, from, map } from 'rxjs';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { chain } from 'lodash';
import { Brackets, QueryFailedError, Repository } from 'typeorm';
import { Event, Filter } from '../entities';
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
    private readonly repository: Repository<Event>,
  ) {}

  async create(event: Event) {
    try {
      await this.repository.insert(event);
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

  async find(filter: EventRepositoryFilter): Promise<Observable<Event>> {
    const qb = this.createQueryBuilder(filter);

    // HACK: deceive the query planner to use the index
    if (filter.genericTagsCollection?.length) {
      const count = await qb.getCount();
      if (count < 1000) {
        const events = await qb.getMany();
        return from(
          chain(events)
            .sortBy((event) => -event.createdAt)
            .take(this.getLimitFrom(filter))
            .value(),
        );
      }
    }

    return from(
      await qb
        .take(this.getLimitFrom(filter))
        .orderBy('event.createdAtStr', 'DESC')
        .stream(),
    ).pipe(map(this.convertToEvent));
  }

  async findOne(filter: EventRepositoryFilter) {
    return await this.createQueryBuilder(filter)
      .orderBy('event.createdAtStr', 'DESC')
      .getOne();
  }

  async findTopIdsWithScore(
    filter: EventRepositoryFilter,
  ): Promise<TEventIdWithScore[]> {
    const partialEvents = await this.createQueryBuilder(filter)
      .select(['event.id', 'event.createdAtStr'])
      .take(this.getLimitFrom(filter, 1000))
      .orderBy('event.createdAtStr', 'DESC')
      .getMany();

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
      await this.repository.delete({ id: oldEventId });
    }

    return this.create(event);
  }

  private convertToEvent(raw: {
    event_id: string;
    event_pubkey: string;
    event_created_at: string;
    event_kind: number;
    event_tags: string[][];
    event_generic_tags: string[];
    event_content: string;
    event_sig: string;
    event_expired_at: string;
    event_d_tag_value: string;
    event_delegator: string;
  }) {
    const event = new Event();
    event.id = raw.event_id;
    event.pubkey = raw.event_pubkey;
    event.createdAtStr = raw.event_created_at;
    event.kind = raw.event_kind;
    event.tags = raw.event_tags;
    event.genericTags = raw.event_generic_tags;
    event.content = raw.event_content;
    event.sig = raw.event_sig;
    event.expiredAtStr = raw.event_expired_at;
    event.dTagValue = raw.event_d_tag_value;
    event.delegator = raw.event_delegator;
    return event;
  }

  private createQueryBuilder(filter: EventRepositoryFilter) {
    const queryBuilder = this.repository.createQueryBuilder('event');

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
      queryBuilder.andWhere(
        new Brackets((subQb) => {
          subQb
            .where('event.pubkey IN (:...authors)', {
              authors: filter.authors,
            })
            .orWhere('event.delegator IN (:...authors)', {
              authors: filter.authors,
            });
        }),
      );
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

  private getLimitFrom(filter: EventRepositoryFilter, defaultLimit = 100) {
    return filter.limit ?? defaultLimit;
  }
}
