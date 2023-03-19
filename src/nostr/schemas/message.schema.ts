import { z } from 'zod';
import { SubscriptionIdSchema } from './common.schema';
import { EventSchema } from './event.schema';
import { FilterSchema } from './filter.schema';

export const EventMessageSchema = z.tuple([EventSchema]);
export type EventMessage = z.infer<typeof EventMessageSchema>;

export const ReqMessageSchema = z
  .tuple([SubscriptionIdSchema])
  .rest(FilterSchema);
export type ReqMessage = z.infer<typeof ReqMessageSchema>;

export const CloseMessageSchema = z.tuple([SubscriptionIdSchema]);
export type CloseMessage = z.infer<typeof CloseMessageSchema>;
