import { z } from 'zod';
import {
  EventIdPrefixSchema,
  EventKindSchema,
  PubkeyPrefixSchema,
  TimestampInSecSchema,
} from './common.schema';

const TagFilterValuesSchema = z.array(z.string().max(1024)).max(256);

const TagsFilterSchema = z.record(
  z.string().regex(/^[a-zA-Z]$/),
  TagFilterValuesSchema,
);

export const FilterDtoSchema = z.preprocess(
  (obj: object) => {
    const filter = {};
    const tags = {};

    Object.entries(obj).forEach(([key, value]) => {
      if (!key.startsWith('#')) {
        filter[key] = value;
        return;
      }

      tags[key[1]] = value;
    });

    return {
      ...filter,
      tags,
    };
  },
  z
    .object({
      ids: z.array(EventIdPrefixSchema).max(1000),
      authors: z.array(PubkeyPrefixSchema).max(1000),
      kinds: z.array(EventKindSchema).max(20),
      since: TimestampInSecSchema,
      until: TimestampInSecSchema,
      limit: z.number().int().min(0),
      tags: TagsFilterSchema,
      search: z.string().max(256),
    })
    .partial(),
);
export type FilterDto = z.infer<typeof FilterDtoSchema>;
