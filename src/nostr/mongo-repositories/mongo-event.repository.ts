import { InjectModel } from '@nestjs/mongoose';
import { MongoServerError } from 'mongodb';
import { FilterQuery, Model } from 'mongoose';
import { EventKind, EVENT_ID_LENGTH, PUBKEY_LENGTH } from '../constants';
import { Event } from '../entities';
import {
  EventRepository,
  EventRepositoryFilter,
} from '../repositories/event.repository';
import { EventId, Pubkey } from '../schemas';
import { getTimestampInSeconds } from '../utils';
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

  async find(
    filters: EventRepositoryFilter[] | EventRepositoryFilter,
  ): Promise<Event[]> {
    const dbEvents = await this.eventModel
      .find(this.buildMongoFilter(filters))
      .limit(this.getLimitFrom(filters))
      .sort({ created_at: -1 });

    return dbEvents.map(this.toEvent);
  }

  async findOne(
    filters: EventRepositoryFilter[] | EventRepositoryFilter,
  ): Promise<Event | null> {
    const dbEvent = await this.eventModel
      .findOne(this.buildMongoFilter(filters))
      .sort({ created_at: -1 });
    return dbEvent ? this.toEvent(dbEvent) : null;
  }

  async count(
    filters: EventRepositoryFilter | EventRepositoryFilter[],
  ): Promise<number> {
    return this.eventModel.countDocuments(this.buildMongoFilter(filters));
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
        created_at: getTimestampInSeconds(),
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
    return new Event({
      type: Event.getEventType({ kind: dbEvent.kind }),
      id: dbEvent._id,
      pubkey: dbEvent.pubkey,
      created_at: dbEvent.created_at,
      kind: dbEvent.kind,
      tags: dbEvent.tags,
      content: dbEvent.content,
      sig: dbEvent.sig,
      expirationTimestamp: dbEvent.expirationTimestamp,
      dTagValue: dbEvent.dTagValue,
    });
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
      expirationTimestamp: event.expirationTimestamp,
      dTagValue: event.dTagValue,
      deleted: false,
    };
  }

  private buildMongoFilter(
    filters: EventRepositoryFilter[] | EventRepositoryFilter,
  ) {
    const filterQueries = (Array.isArray(filters) ? filters : [filters]).map(
      (filter) => {
        const filterQuery: FilterQuery<DbEventDocument> = {};

        if (filter.ids?.length) {
          filterQuery._id = {
            $in: filter.ids.map((id) =>
              id.length === EVENT_ID_LENGTH ? id : new RegExp(`^${id}`),
            ),
          };
        }

        if (filter.authors?.length) {
          filterQuery.pubkey = {
            $in: filter.authors.map((author) =>
              author.length === PUBKEY_LENGTH
                ? author
                : new RegExp(`^${author}`),
            ),
          };
        }

        if (filter.kinds?.length) {
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

        const tagFilters = filter.tags
          ? Object.entries(filter.tags).map(([tagKey, tagValues]) => ({
              tags: {
                $elemMatch: {
                  '0': tagKey,
                  '1': { $in: tagValues },
                },
              },
            }))
          : [];
        if (tagFilters.length > 0) {
          filterQuery.$and = tagFilters;
        }

        if (filter.dTagValues?.length) {
          filterQuery.dTagValue = { $in: filter.dTagValues };
        }

        return filterQuery;
      },
    );

    const now = getTimestampInSeconds();
    return filterQueries.length === 1
      ? {
          ...filterQueries[0],
          expirationTimestamp: { $gte: now },
          deleted: false,
        }
      : {
          $or: filterQueries,
          expirationTimestamp: { $gte: now },
          deleted: false,
        };
  }

  private getLimitFrom(
    filters: EventRepositoryFilter[] | EventRepositoryFilter,
  ) {
    return Array.isArray(filters)
      ? Math.max(...filters.map((filter) => filter.limit ?? 100))
      : filters.limit ?? 100;
  }
}
