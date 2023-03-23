import { Event, EventId, Filter, Pubkey } from '../schemas';

export abstract class EventRepository {
  abstract create(event: Event): Promise<boolean>;
  abstract find(filters: Filter[] | Filter): Promise<Event[]>;
  abstract findOne(filters: Filter[] | Filter): Promise<Event | null>;
  abstract replace(event: Event, oldEventId?: EventId): Promise<boolean>;
  abstract delete(pubkey: Pubkey, eventIds: EventId[]): Promise<number>;
}
