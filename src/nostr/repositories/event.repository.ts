import { Event, EventId, Filter, Pubkey } from '../schemas';

export type EventRepositoryFilter = Filter & { dTagValues?: string[] };

export abstract class EventRepository {
  abstract create(event: Event): Promise<boolean>;
  abstract find(
    filters: EventRepositoryFilter[] | EventRepositoryFilter,
  ): Promise<Event[]>;
  abstract findOne(
    filters: EventRepositoryFilter[] | EventRepositoryFilter,
  ): Promise<Event | null>;
  abstract count(
    filters: EventRepositoryFilter[] | EventRepositoryFilter,
  ): Promise<number>;
  abstract replace(event: Event, oldEventId?: EventId): Promise<boolean>;
  abstract delete(pubkey: Pubkey, eventIds: EventId[]): Promise<number>;
}
