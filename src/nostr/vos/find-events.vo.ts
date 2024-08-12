import { EventEntity } from '../entities';

export class FindEventsVo {
  /**
   * The events that match the given filter.
   */
  data: EventEntity[];
}
