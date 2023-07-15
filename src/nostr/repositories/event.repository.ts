import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { sumBy } from 'lodash';
import { Brackets, In, QueryFailedError, Repository } from 'typeorm';
import { SEARCHABLE_EVENT_KINDS } from '../constants';
import { Event, Filter } from '../entities';
import { getTimestampInSeconds } from '../utils';
import { EventSearchRepository } from './event-search.repository';

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
    private readonly searchRepository: EventSearchRepository,
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

    if (SEARCHABLE_EVENT_KINDS.includes(event.kind)) {
      await this.searchRepository.add(event);
    }

    return true;
  }

  async find(filters: EventRepositoryFilter[] | EventRepositoryFilter) {
    return await this.createQueryBuilder(filters)
      .take(this.getLimitFrom(filters))
      .orderBy('event.createdAtStr', 'DESC')
      .getMany();
  }

  async findOne(filters: EventRepositoryFilter[] | EventRepositoryFilter) {
    return await this.createQueryBuilder(filters)
      .orderBy('event.createdAtStr', 'DESC')
      .getOne();
  }

  async count(filters: EventRepositoryFilter | EventRepositoryFilter[]) {
    return await this.createQueryBuilder(filters).getCount();
  }

  async replace(event: Event, oldEventId?: string) {
    if (event.id === oldEventId) {
      return false;
    }

    if (oldEventId) {
      await Promise.all([
        this.repository.delete({ id: oldEventId }),
        this.searchRepository.deleteMany([oldEventId]),
      ]);
    }

    return this.create(event);
  }

  async delete(eventIds: string[]) {
    const [{ affected }] = await Promise.all([
      this.repository.softDelete({
        id: In(eventIds),
      }),
      this.searchRepository.deleteMany(eventIds),
    ]);

    return affected ?? 0;
  }

  private createQueryBuilder(
    filters: EventRepositoryFilter[] | EventRepositoryFilter,
  ) {
    const queryBuilder = this.repository.createQueryBuilder('event');

    (Array.isArray(filters) ? filters : [filters]).forEach((filter, index) => {
      const brackets = new Brackets((qb) => {
        qb.where('1 = 1');

        if (filter.ids?.length) {
          qb.andWhere('event.id ILIKE ANY (:ids)', {
            ids: filter.ids.map((id) => `${id}%`),
          });
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
          const authors = filter.authors.map((author) => `${author}%`);
          qb.andWhere(
            new Brackets((qb) => {
              qb.where('event.pubkey ILIKE ANY (:authors)', {
                authors,
              }).orWhere('event.delegator ILIKE ANY (:authors)', {
                authors,
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
  ) {
    return Math.min(
      Array.isArray(filters)
        ? sumBy(filters, (filter) => filter.limit ?? 100)
        : filters.limit ?? 100,
      1000,
    );
  }
}
