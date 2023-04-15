import { z } from 'zod';
import { SubscriptionIdSchema } from './common.schema';
import { EventDtoSchema } from './event-dto.schema';
import { FilterDtoSchema } from './filter-dto.schema';

export const EventMessageSchema = z.tuple([EventDtoSchema]);

export const ReqMessageSchema = z
  .tuple([SubscriptionIdSchema])
  .rest(FilterDtoSchema);

export const CloseMessageSchema = z.tuple([SubscriptionIdSchema]);

export const CountMessageSchema = z
  .tuple([SubscriptionIdSchema])
  .rest(FilterDtoSchema);
