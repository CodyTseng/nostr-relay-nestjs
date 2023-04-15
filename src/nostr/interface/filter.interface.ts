import { z } from 'zod';
import { FilterDtoSchema, SubscriptionIdSchema } from '../schemas';

export type SubscriptionId = z.infer<typeof SubscriptionIdSchema>;
export type FilterDto = z.infer<typeof FilterDtoSchema>;
