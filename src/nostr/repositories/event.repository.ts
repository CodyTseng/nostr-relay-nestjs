import { Observable } from 'rxjs';
import { Event, EventId, Filter, Pubkey } from '../schemas';

export abstract class EventRepository {
  abstract create(event: Event): Promise<boolean>;
  abstract findByFilters(
    filters: Filter[],
  ): Promise<Observable<Event>> | Promise<Event[]>;
  abstract upsert(event: Event): Promise<boolean>;
  abstract delete(pubkey: Pubkey, eventIds: EventId[]): Promise<number>;
}
