import { z } from 'zod';
import { TagName } from '../constants';
import {
  EventIdPrefixSchema,
  EventKindSchema,
  PubkeyPrefixSchema,
  TimestampInSecSchema,
} from './common.schema';

const TagFilterValuesSchema = z.array(z.string().max(1024)).max(256);

const TagsFilterSchema = z.record(
  z.string().regex(/^[a-z]$/),
  TagFilterValuesSchema,
);

export const FilterDtoSchema = z.preprocess(
  (obj: object) => {
    const filter = {};
    const tags = {};

    let dTagValues = undefined;

    Object.entries(obj).forEach(([key, value]) => {
      if (!key.startsWith('#')) {
        filter[key] = value;
        return;
      }

      const tagName = key[1];
      if (tagName === TagName.D) {
        dTagValues = value;
        return;
      }

      tags[tagName] = value;
    });

    return {
      ...filter,
      tags,
      dTagValues,
    };
  },
  z
    .object({
      ids: z.array(EventIdPrefixSchema).max(1000),
      authors: z.array(PubkeyPrefixSchema).max(1000),
      kinds: z.array(EventKindSchema).max(20),
      since: TimestampInSecSchema,
      until: TimestampInSecSchema,
      limit: z.number().int().min(0).max(1000),
      tags: TagsFilterSchema,
      dTagValues: TagFilterValuesSchema,
    })
    .partial(),
);
