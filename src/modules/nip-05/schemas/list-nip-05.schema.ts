import { z } from 'zod';

export const ListNip05Schema = z.object({
  limit: z
    .preprocess((val: string) => parseInt(val), z.number().int().positive())
    .optional(),
  after: z.string().max(20).optional(),
});
