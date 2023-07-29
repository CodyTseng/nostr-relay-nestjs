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
  tags: z
    .array(EventTagSchema)
    .max(2000, { message: 'must less than or equal to 2000 tags' }),
  content: EventContentSchema,
  sig: EventSigSchema,
});

export type EventDto = z.infer<typeof EventDtoSchema>;
