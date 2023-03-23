import { InjectModel } from '@nestjs/mongoose';
import { MongoServerError } from 'mongodb';
import { FilterQuery, Model } from 'mongoose';
import { EventKind, EVENT_ID_LENGTH, PUBKEY_LENGTH } from '../constants';
import { EventRepository } from '../repositories/event.repository';
import { Event, EventId, Filter, Pubkey } from '../schemas';
import { isGenericTagName } from '../utils';
import { DbEvent, DbEventDocument } from './db-event.schema';

export class MongoEventRepository extends EventRepository {
  @InjectModel(DbEvent.name)
  private readonly eventModel: Model<DbEventDocument>;

  async create(event: Event): Promise<boolean> {
    try {
      await this.eventModel.create(this.toDbEvent(event));
      return true;
    } catch (error) {
      // DuplicateKey Error: the event already exists.
      if (error instanceof MongoServerError && error.code === 11000) {
        return false;
      }
      throw error;
    }
  }

  async find(filters: Filter[] | Filter): Promise<Event[]> {
    const dbEvents = await this.eventModel
      .find(this.buildMongoFilter(filters))
      .limit(this.getLimitFrom(filters))
      .sort({ created_at: -1 });

    return dbEvents.map(this.toEvent);
  }

  async findOne(filters: Filter[] | Filter): Promise<Event | null> {
    const dbEvent = await this.eventModel
      .findOne(this.buildMongoFilter(filters))
      .sort({ created_at: -1 });
    return dbEvent ? this.toEvent(dbEvent) : null;
  }

  async replace(event: Event, oldEventId?: EventId): Promise<boolean> {
    if (event.id === oldEventId) {
      return false;
    }
    if (oldEventId) {
      await this.eventModel.deleteOne({ _id: oldEventId });
    }

    return this.create(event);
  }

  async delete(pubkey: Pubkey, eventIds: EventId[]): Promise<number> {
    const { modifiedCount } = await this.eventModel.updateMany(
      {
        _id: { $in: eventIds },
        deleted: false,
      },
      {
        pubkey,
        created_at: Math.floor(Date.now() / 1000),
        kind: EventKind.DELETION,
        tags: [],
        content: '',
        sig: '',
        deleted: true,
      },
    );
    return modifiedCount;
  }

  private toEvent(dbEvent: DbEventDocument): Event {
    return {
      id: dbEvent._id,
      pubkey: dbEvent.pubkey,
      created_at: dbEvent.created_at,
      kind: dbEvent.kind,
      tags: dbEvent.tags,
      content: dbEvent.content,
      sig: dbEvent.sig,
    };
  }

  private toDbEvent(event: Event): DbEvent {
    return {
      _id: event.id,
      pubkey: event.pubkey,
      created_at: event.created_at,
      kind: event.kind,
      tags: event.tags,
      content: event.content,
      sig: event.sig,
      deleted: false,
    };
  }

  private buildMongoFilter(filters: Filter[] | Filter) {
    const filterQueries = (Array.isArray(filters) ? filters : [filters]).map(
      (filter) => {
        const filterQuery: FilterQuery<DbEventDocument> = {};

        if (filter.ids) {
          filterQuery._id = {
            $in: filter.ids.map((id) =>
              id.length === EVENT_ID_LENGTH ? id : new RegExp(`^${id}`),
            ),
          };
        }

        if (filter.authors) {
          filterQuery.pubkey = {
            $in: filter.authors.map((author) =>
              author.length === PUBKEY_LENGTH
                ? author
                : new RegExp(`^${author}`),
            ),
          };
        }

        if (filter.kinds) {
          filterQuery.kind = { $in: filter.kinds };
        }

        if (filter.since) {
          filterQuery.created_at = { $gte: filter.since };
        }

        if (filter.until) {
          if (!filterQuery.created_at) {
            filterQuery.created_at = {};
          }
          filterQuery.created_at.$lte = filter.until;
        }

        const tagFilters = Object.keys(filter)
          .filter(isGenericTagName)
          .map((key) => ({
            tags: {
              $elemMatch: {
                '0': key[1],
                '1': { $in: filter[key] },
              },
            },
          }));
        if (tagFilters.length > 0) {
          filterQuery.$and = tagFilters;
        }

        return filterQuery;
      },
    );

    return filterQueries.length === 1
      ? { ...filterQueries[0], deleted: false }
      : { $or: filterQueries, deleted: false };
  }

  private getLimitFrom(filters: Filter[] | Filter) {
    return Array.isArray(filters)
      ? Math.max(...filters.map((filter) => filter.limit ?? 100))
      : filters.limit ?? 100;
  }
}
