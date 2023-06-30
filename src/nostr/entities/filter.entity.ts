import { intersection } from 'lodash';
import { EventKind, STANDARD_SINGLE_LETTER_TAG_NAMES } from '../constants';
import { FilterDto } from '../schemas';
import { Event } from './event.entity';

export class Filter {
  ids?: string[];
  authors?: string[];
  kinds?: EventKind[];
  since?: number;
  until?: number;
  limit?: number;
  tags?: { [key: string]: string[] };
  dTagValues?: string[];

  static fromFilterDto(filterDto: FilterDto) {
    const filter = new Filter();
    filter.ids = filterDto.ids;
    filter.authors = filterDto.authors;
    filter.kinds = filterDto.kinds;
    filter.since = filterDto.since;
    filter.until = filterDto.until;
    filter.limit = filterDto.limit;
    filter.tags = filterDto.tags;

    return filter;
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

    if (this.since && event.createdAt < this.since) {
      return false;
    }

    if (this.until && event.createdAt > this.until) {
      return false;
    }

    return this.tags
      ? Object.entries(this.tags).every(([filterTagKey, filterTagValues]) => {
          if (STANDARD_SINGLE_LETTER_TAG_NAMES.includes(filterTagKey)) {
            return event[filterTagKey]?.length
              ? intersection(event[filterTagKey], filterTagValues).length > 0
              : false;
          }
          return !!event.tags.find(
            ([tagName, tagValue]) =>
              tagName === filterTagKey && filterTagValues.includes(tagValue),
          );
        })
      : true;
  }
}
