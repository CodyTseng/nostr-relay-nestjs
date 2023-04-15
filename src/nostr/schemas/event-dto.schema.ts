import { z } from 'zod';
import {
  EventContentSchema,
  EventIdSchema,
  EventKindSchema,
  EventSigSchema,
  EventTagSchema,
  PubkeySchema,
  TimestampInSecSchema,
} from './common.schema';

export const EventDtoSchema = z.object({
  id: EventIdSchema,
  pubkey: PubkeySchema,
  created_at: TimestampInSecSchema,
  kind: EventKindSchema,
  tags: z.array(EventTagSchema).max(2000),
  content: EventContentSchema,
  sig: EventSigSchema,
});
