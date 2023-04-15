import { Event, Filter } from '../entities';
import { EventId, Pubkey } from '../schemas';

export type EventRepositoryFilter = Pick<
  Filter,
  | 'ids'
  | 'authors'
  | 'kinds'
  | 'limit'
  | 'since'
  | 'until'
  | 'tags'
  | 'dTagValues'
>;

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
