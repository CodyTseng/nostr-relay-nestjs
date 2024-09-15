import { EventEntity } from '../entities';

export class RequestEventsVo {
  /**
   * The events that match the given filters.
   */
  data: EventEntity[];
}
