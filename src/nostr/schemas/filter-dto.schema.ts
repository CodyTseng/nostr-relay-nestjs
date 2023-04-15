import { z } from 'zod';
import { TAG_NAME_REGEX } from '../constants';
import {
  EventIdPrefixSchema,
  EventKindSchema,
  PubkeyPrefixSchema,
  TimestampInSecSchema,
} from './common.schema';

const NormalFilterSchema = z
  .object({
    ids: z.array(EventIdPrefixSchema).max(1000),
    authors: z.array(PubkeyPrefixSchema).max(1000),
    kinds: z.array(EventKindSchema).max(20),
    since: TimestampInSecSchema,
    until: TimestampInSecSchema,
    limit: z.number().int().min(0).max(1000),
  })
  .partial();

const TagFilterSchema = z.record(
  z.string().regex(TAG_NAME_REGEX),
  z.array(z.string().max(1024)).max(256),
);

export const FilterDtoSchema = z
  .preprocess(
    (obj: object) => {
      const normalFilter = {};
      const tagFilter = {};

      for (const key of Object.keys(obj)) {
        if (key.startsWith('#')) tagFilter[key] = obj[key];
        else normalFilter[key] = obj[key];
      }
      return {
        normalFilter,
        tagFilter,
      };
    },
    z.object({
      normalFilter: NormalFilterSchema,
      tagFilter: TagFilterSchema,
    }),
  )
  .transform(({ normalFilter, tagFilter }) => {
    return Object.assign(
      normalFilter,
      tagFilter as Record<`#${string}`, string[]>,
    );
  });
