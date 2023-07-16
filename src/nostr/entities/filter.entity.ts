import { intersection } from 'lodash';
import { EventKind } from '../constants';
import { FilterDto } from '../schemas';
import { toGenericTag } from '../utils';
import { Event } from './event.entity';

export type SearchFilter = Filter & { search: string };

export class Filter {
  ids?: string[];
  authors?: string[];
  kinds?: EventKind[];
  since?: number;
  until?: number;
  limit?: number;
  genericTagsCollection?: string[][];
  dTagValues?: string[];
  search?: string;
  searchOptions?: Record<string, string>;

  static fromFilterDto(filterDto: FilterDto) {
    const filter = new Filter();
    filter.ids = filterDto.ids;
    filter.authors = filterDto.authors;
    filter.kinds = filterDto.kinds;
    filter.since = filterDto.since;
    filter.until = filterDto.until;
    filter.limit = filterDto.limit;
    filter.genericTagsCollection = filterDto.tags
      ? Object.entries(filterDto.tags).map(([key, values]) =>
          values.map((value) => toGenericTag(key, value)),
        )
      : undefined;

    if (filterDto.search) {
      const { search, searchOptions } = Filter.parseSearch(filterDto.search);
      filter.search = search;
      filter.searchOptions = searchOptions;
    }

    return filter;
  }

  static parseSearch(search: string) {
    const searchWords: string[] = [];
    const searchOptions: Record<string, string> = {};

    search.split(' ').forEach((item) => {
      if (/.+:.+/.test(item)) {
        const [key, value] = item.split(':');
        searchOptions[key] = value;
      } else {
        searchWords.push(item);
      }
    });

    return {
      search: searchWords.join(' '),
      searchOptions,
    };
  }

  static isSearchFilter(filter: Filter): filter is SearchFilter {
    return !!filter.search;
  }

  hasEncryptedDirectMessageKind() {
    return (
      !!this.kinds && this.kinds.includes(EventKind.ENCRYPTED_DIRECT_MESSAGE)
    );
  }

  isEventMatching(event: Event) {
    if (this.search) {
      // TODO: Implement search
      return false;
    }

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

    return this.genericTagsCollection
      ? this.genericTagsCollection.every(
          (genericTags) =>
            intersection(genericTags, event.genericTags).length > 0,
        )
      : true;
  }
}
