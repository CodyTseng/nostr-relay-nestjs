import { z } from 'zod';
import { SubscriptionIdSchema } from './common.schema';
import { EventDtoSchema } from './event-dto.schema';
import { FilterDtoSchema } from './filter-dto.schema';

export const EventMessageSchema = z.tuple([EventDtoSchema]);
export type EventMessageDto = z.infer<typeof EventMessageSchema>;

export const ReqMessageSchema = z
  .tuple([SubscriptionIdSchema])
  .rest(FilterDtoSchema);
export type ReqMessageDto = z.infer<typeof ReqMessageSchema>;

export const CloseMessageSchema = z.tuple([SubscriptionIdSchema]);
export type CloseMessageDto = z.infer<typeof CloseMessageSchema>;

export const CountMessageSchema = z
  .tuple([SubscriptionIdSchema])
  .rest(FilterDtoSchema);
export type CountMessageDto = z.infer<typeof CountMessageSchema>;
