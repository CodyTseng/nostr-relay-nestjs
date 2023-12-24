import { z } from 'zod';

export const SubscriptionIdSchema = z
  .string({ invalid_type_error: 'must be a string' })
  .min(1, { message: 'must be at least 1 character' })
  .max(128, {
    message: 'must be less than or equal to 128 characters',
  });
