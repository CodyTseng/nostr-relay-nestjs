import { EventKind } from '../constants';
import { EventId, FilterDto, Pubkey, TimestampInSeconds } from '../schemas';
import { Event } from './event.entity';

export class Filter {
  readonly ids?: EventId[];
  readonly authors?: Pubkey[];
  readonly kinds?: EventKind[];
  readonly since?: TimestampInSeconds;
  readonly until?: TimestampInSeconds;
  readonly limit?: number;
  readonly tags?: { [key: string]: string[] };
  readonly dTagValues?: string[];

  constructor(
    filter: Pick<
      Filter,
      | 'ids'
      | 'authors'
      | 'kinds'
      | 'since'
      | 'until'
      | 'limit'
      | 'tags'
      | 'dTagValues'
    >,
  ) {
    this.ids = filter.ids;
    this.authors = filter.authors;
    this.kinds = filter.kinds;
    this.since = filter.since;
    this.until = filter.until;
    this.limit = filter.limit;
    this.tags = filter.tags;
    this.dTagValues = filter.dTagValues;
  }

  static fromFilterDto(filterDto: FilterDto) {
    return new Filter(filterDto);
  }

  hasEncryptedDirectMessageKind() {
    return (
      !!this.kinds && this.kinds.includes(EventKind.ENCRYPTED_DIRECT_MESSAGE)
    );
  }

  isEventMatching(event: Event) {
    if (this.ids && !this.ids.some((id) => event.id.startsWith(id))) {
      return false;
    }

    if (
      this.authors &&
      !this.authors.some((author) => event.pubkey.startsWith(author))
    ) {
      return false;
    }

    if (this.kinds && !this.kinds.includes(event.kind)) {
      return false;
    }

    if (this.since && event.created_at < this.since) {
      return false;
    }

    if (this.until && event.created_at > this.until) {
      return false;
    }

    if (this.dTagValues) {
      return event.dTagValue
        ? this.dTagValues.includes(event.dTagValue)
        : false;
    }

    return this.tags
      ? Object.entries(this.tags).every(([filterTagKey, filterTagValues]) =>
          event.tags.some(
            ([tagName, tagValue]) =>
              tagName === filterTagKey && filterTagValues.includes(tagValue),
          ),
        )
      : true;
  }
}
