import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { chain, sumBy } from 'lodash';
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

  async find(filters: EventRepositoryFilter[] | EventRepositoryFilter) {
    filters = Array.isArray(filters) ? filters : [filters];

    if (filters.length === 0) return [];

    const qb = this.createQueryBuilder(filters);

    // HACK: deceive the query planner to use the index
    if (filters.some((filter) => filter.genericTagsCollection?.length)) {
      const count = await qb.getCount();
      if (count < 1000) {
        const events = await qb.getMany();
        return chain(events)
          .sortBy((event) => -event.createdAt)
          .take(this.getLimitFrom(filters))
          .value();
      }
    }

    return await qb
      .take(this.getLimitFrom(filters))
      .orderBy('event.createdAtStr', 'DESC')
      .getMany();
  }

  async findOne(filters: EventRepositoryFilter[] | EventRepositoryFilter) {
    return await this.createQueryBuilder(filters)
      .orderBy('event.createdAtStr', 'DESC')
      .getOne();
  }

  async findTopIdsWithScore(
    filters: EventRepositoryFilter | EventRepositoryFilter[],
  ): Promise<TEventIdWithScore[]> {
    if (Array.isArray(filters) && filters.length === 0) return [];

    const partialEvents = await this.createQueryBuilder(filters)
      .select(['event.id', 'event.createdAtStr'])
      .take(this.getLimitFrom(filters, 1000))
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

  private createQueryBuilder(
    filters: EventRepositoryFilter[] | EventRepositoryFilter,
  ) {
    const queryBuilder = this.repository.createQueryBuilder('event');

    (Array.isArray(filters) ? filters : [filters]).forEach((filter, index) => {
      const brackets = new Brackets((qb) => {
        qb.where('1 = 1');

        if (filter.ids?.length) {
          const ids: string[] = [];
          const prefixes: string[] = [];
          filter.ids.forEach((id) => {
            if (id.length === 64) {
              ids.push(id);
            } else {
              prefixes.push(id);
            }
          });

          qb.andWhere(
            new Brackets((subQb) => {
              if (ids.length > 0) {
                subQb.where('event.id IN (:...ids)', { ids });
              } else {
                subQb.where('1 = 0');
              }
              prefixes.forEach((prefix, index) => {
                const lowPrefixKey = `lowIdPrefix${index}`;
                const highPrefixKey = `highIdPrefix${index}`;
                subQb.orWhere(
                  `event.id BETWEEN :${lowPrefixKey} AND :${highPrefixKey}`,
                  {
                    [lowPrefixKey]: prefix.padEnd(64, '0'),
                    [highPrefixKey]: prefix.padEnd(64, 'f'),
                  },
                );
              });
            }),
          );
        }

        if (filter.genericTagsCollection) {
          filter.genericTagsCollection.forEach((genericTags) => {
            qb.andWhere('event.generic_tags && (:genericTags)', {
              genericTags,
            });
          });
        }

        if (filter.since) {
          qb.andWhere('event.created_at >= :since', { since: filter.since });
        }

        if (filter.until) {
          qb.andWhere('event.created_at <= :until', { until: filter.until });
        }

        if (filter.authors?.length) {
          const authors: string[] = [];
          const prefixes: string[] = [];
          filter.authors.forEach((author) => {
            if (author.length === 64) {
              authors.push(author);
            } else {
              prefixes.push(author);
            }
          });

          qb.andWhere(
            new Brackets((subQb) => {
              if (authors.length > 0) {
                subQb
                  .where('event.pubkey IN (:...authors)', { authors })
                  .orWhere('event.delegator IN (:...authors)', { authors });
              } else {
                subQb.where('1 = 0');
              }
              prefixes.forEach((prefix, index) => {
                const lowPrefixKey = `lowAuthorPrefix${index}`;
                const highPrefixKey = `highAuthorPrefix${index}`;
                subQb.orWhere(
                  `event.pubkey BETWEEN :${lowPrefixKey} AND :${highPrefixKey}`,
                  {
                    [lowPrefixKey]: prefix.padEnd(64, '0'),
                    [highPrefixKey]: prefix.padEnd(64, 'f'),
                  },
                );
                subQb.orWhere(
                  `event.delegator BETWEEN :${lowPrefixKey} AND :${highPrefixKey}`,
                  {
                    [lowPrefixKey]: prefix.padEnd(64, '0'),
                    [highPrefixKey]: prefix.padEnd(64, 'f'),
                  },
                );
              });
            }),
          );
        }

        if (filter.kinds?.length) {
          qb.andWhere('event.kind IN (:...kinds)', { kinds: filter.kinds });
        }

        if (filter.dTagValues) {
          qb.andWhere('event.d_tag_value IN (:...dTagValues)', {
            dTagValues: filter.dTagValues,
          });
        }

        qb.andWhere(
          new Brackets((subQb) => {
            subQb
              .where('event.expired_at IS NULL')
              .orWhere('event.expired_at > :expiredAt', {
                expiredAt: getTimestampInSeconds(),
              });
          }),
        );
      });

      queryBuilder[index === 0 ? 'where' : 'orWhere'](brackets);
    });

    return queryBuilder;
  }

  private getLimitFrom(
    filters: EventRepositoryFilter[] | EventRepositoryFilter,
    defaultLimit = 100,
  ) {
    return Math.min(
      Array.isArray(filters)
        ? sumBy(filters, (filter) => filter.limit ?? defaultLimit)
        : filters.limit ?? defaultLimit,
      1000,
    );
  }
}
