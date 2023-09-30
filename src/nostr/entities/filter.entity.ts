import { intersection, uniq } from 'lodash';
import { EventKind, TagName } from '../constants';
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
    filter.genericTagsCollection = undefined;

    if (filterDto.tags) {
      const shouldUseDTagValueIndex =
        filter.authors?.length &&
        filter.kinds?.length &&
        filter.kinds.every(
          (kind) =>
            kind >= EventKind.PARAMETERIZED_REPLACEABLE_FIRST &&
            kind <= EventKind.PARAMETERIZED_REPLACEABLE_LAST,
        );

      Object.entries(filterDto.tags).forEach(([key, values]) => {
        if (key === TagName.D && shouldUseDTagValueIndex) {
          filter.dTagValues = uniq(values);
          return;
        }

        if (!filter.genericTagsCollection) {
          filter.genericTagsCollection = [];
        }

        filter.genericTagsCollection.push(
          uniq(values.map((value) => toGenericTag(key, value))),
        );
      });
    }

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

  isSearchFilter(): this is SearchFilter {
    return !!this.search;
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

    if (
      this.genericTagsCollection &&
      this.genericTagsCollection.some(
        (genericTags) =>
          intersection(genericTags, event.genericTags).length === 0,
      )
    ) {
      return false;
    }

    if (
      this.search &&
      this.search
        .split(' ')
        .some((searchWord) => !new RegExp(searchWord, 'i').test(event.content))
    ) {
      return false;
    }

    return true;
  }
}
