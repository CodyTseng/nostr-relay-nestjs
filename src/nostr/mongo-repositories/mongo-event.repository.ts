import { InjectModel } from '@nestjs/mongoose';
import { difference } from 'lodash';
import { MongoServerError } from 'mongodb';
import { FilterQuery, Model } from 'mongoose';
import { from, map, Observable } from 'rxjs';
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

  async findByFilters(filters: Filter[]): Promise<Observable<Event>> {
    const filterQueries = filters.map((filter) => {
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
            author.length === PUBKEY_LENGTH ? author : new RegExp(`^${author}`),
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
    });

    const cursor = this.eventModel
      .find(
        filterQueries.length === 1
          ? { ...filterQueries[0], deleted: false }
          : { $or: filterQueries, deleted: false },
      )
      .limit(Math.max(...filters.map((filter) => filter.limit ?? 1000)))
      .sort({ created_at: -1 })
      .cursor({ batchSize: 100 });

    return from(cursor).pipe(map(this.toEvent));
  }

  async upsert(event: Event): Promise<boolean> {
    const oldDbEvent = await this.eventModel.findOne({
      kind: event.kind,
      pubkey: event.pubkey,
      deleted: false,
    });
    if (oldDbEvent && oldDbEvent.created_at > event.created_at) {
      return false;
    }

    if (oldDbEvent) {
      await this.eventModel.deleteOne({ _id: oldDbEvent.id });
    }

    return this.create(event);
  }

  async delete(pubkey: Pubkey, eventIds: EventId[]): Promise<number> {
    const dbEvents = await this.eventModel
      .find({ _id: { $in: eventIds }, deleted: false })
      .select({ _id: 1, pubkey: 1 });

    const eventIdsNotBelongToPubkey = dbEvents
      .filter((dbEvent) => dbEvent.pubkey !== pubkey)
      .map((dbEvent) => dbEvent._id);
    const eventIdsToBeDeleted = difference(eventIds, eventIdsNotBelongToPubkey);

    const { modifiedCount } = await this.eventModel.updateMany(
      {
        _id: { $in: eventIdsToBeDeleted },
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
}
