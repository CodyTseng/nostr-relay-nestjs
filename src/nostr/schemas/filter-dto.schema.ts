import { z } from 'zod';
import {
  EventIdPrefixSchema,
  EventKindSchema,
  PubkeyPrefixSchema,
  TimestampInSecSchema,
} from './common.schema';

const TagFilterValuesSchema = z
  .array(
    z.string({ invalid_type_error: 'must be a string' }).max(1024, {
      message: 'must be less than or equal to 1024 characters',
    }),
  )
  .max(256, { message: 'must be less than or equal to 256 tagValues' });

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
      ids: z
        .array(EventIdPrefixSchema)
        .max(1000, { message: 'must be less than or equal to 1000 ids' }),
      authors: z
        .array(PubkeyPrefixSchema)
        .max(1000, { message: 'must be less than or equal to 1000 authors' }),
      kinds: z
        .array(EventKindSchema)
        .max(20, { message: 'must be less than or equal to 20 kinds' }),
      since: TimestampInSecSchema,
      until: TimestampInSecSchema,
      limit: z
        .number({ invalid_type_error: 'must be a number' })
        .int({ message: 'must be an integer' })
        .min(0, { message: 'must be greater than or equal to 0' }),
      tags: TagsFilterSchema,
      search: z.string({ invalid_type_error: 'must be a string' }).max(256, {
        message: 'must be less than or equal to 256 chars',
      }),
    })
    .partial(),
);
export type FilterDto = z.infer<typeof FilterDtoSchema>;
