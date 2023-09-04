import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { chain, isNil } from 'lodash';
import {
  EMPTY,
  Observable,
  from,
  fromEvent,
  map,
  merge,
  takeUntil,
} from 'rxjs';
import { Brackets, QueryFailedError, Repository } from 'typeorm';
import { ReadStream } from 'typeorm/platform/PlatformTools';
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
    const limit = this.getLimitFrom(filter);
    if (limit === 0) return EMPTY;

    const qb = this.createQueryBuilder(filter);

    // HACK: deceive the query planner to use the index
    if (filter.genericTagsCollection?.length) {
      const count = await qb.getCount();
      if (count < 1000) {
        const events = await qb.getMany();
        return from(
          chain(events)
            .sortBy((event) => -event.createdAt)
            .take(limit)
            .value(),
        );
      }
    }

    return this.transformQueryStream(
      await qb.take(limit).orderBy('event.createdAtStr', 'DESC').stream(),
    );
  }

  async findOne(filter: EventRepositoryFilter) {
    return await this.createQueryBuilder(filter)
      .orderBy('event.createdAtStr', 'DESC')
      .getOne();
  }

  async findTopIdsWithScore(
    filter: EventRepositoryFilter,
  ): Promise<TEventIdWithScore[]> {
    const limit = this.getLimitFrom(filter, 1000);
    if (limit === 0) return [];

    const partialEvents = await this.createQueryBuilder(filter)
      .select(['event.id', 'event.createdAtStr'])
      .take(limit)
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

  private transformQueryStream(stream: ReadStream): Observable<Event> {
    const end$ = fromEvent(stream, 'end');
    const data$ = fromEvent(stream, 'data');

    // FIXME: I'm not sure if this is correct lol
    const error$ = fromEvent(stream, 'error').pipe(
      map((error) => {
        throw error;
      }),
    );
    return merge(data$, error$).pipe(map(this.convertToEvent), takeUntil(end$));
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
    return Math.min(isNil(filter.limit) ? defaultLimit : filter.limit, 1000);
  }
}
