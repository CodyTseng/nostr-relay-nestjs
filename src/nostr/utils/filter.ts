import { TAG_NAME_REGEX } from '../constants';
import { Event } from '../entities';
import { FilterDto } from '../interface';

export function isGenericTagName(tagName: string) {
  return TAG_NAME_REGEX.test(tagName);
}

export function isEventMatchingFilter(event: Event, filter: FilterDto) {
  if (filter.ids && !filter.ids.some((id) => event.id.startsWith(id))) {
    return false;
  }

  if (
    filter.authors &&
    !filter.authors.some((author) => event.pubkey.startsWith(author))
  ) {
    return false;
  }

  if (filter.kinds && !filter.kinds.includes(event.kind)) {
    return false;
  }

  if (filter.since && event.created_at < filter.since) {
    return false;
  }

  if (filter.until && event.created_at > filter.until) {
    return false;
  }

  return Object.keys(filter)
    .filter(isGenericTagName)
    .every((key) =>
      event.tags.some(
        ([tagName, tagValue]) =>
          tagName === key[1] && (filter[key] as string[]).includes(tagValue),
      ),
    );
}
