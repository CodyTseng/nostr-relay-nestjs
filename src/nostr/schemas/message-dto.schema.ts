import { z } from 'zod';
import { MessageType } from '../constants';
import { SubscriptionIdSchema } from './common.schema';
import { EventDtoSchema } from './event-dto.schema';
import { FilterDtoSchema } from './filter-dto.schema';

export const EventMessageDto = z.tuple([
  z.literal(MessageType.EVENT),
  EventDtoSchema,
]);
export type EventMessageDto = z.infer<typeof EventMessageDto>;

export const ReqMessageDto = z
  .tuple([z.literal(MessageType.REQ), SubscriptionIdSchema])
  .rest(FilterDtoSchema);
export type ReqMessageDto = z.infer<typeof ReqMessageDto>;

export const CloseMessageDto = z.tuple([
  z.literal(MessageType.CLOSE),
  SubscriptionIdSchema,
]);
export type CloseMessageDto = z.infer<typeof CloseMessageDto>;

export const AuthMessageDto = z.tuple([
  z.literal(MessageType.AUTH),
  EventDtoSchema,
]);
export type AuthMessageDto = z.infer<typeof AuthMessageDto>;

export const TopMessageDto = z
  .tuple([z.literal(MessageType.TOP), SubscriptionIdSchema, FilterDtoSchema])
  .rest(FilterDtoSchema);
export type TopMessageDto = z.infer<typeof TopMessageDto>;
