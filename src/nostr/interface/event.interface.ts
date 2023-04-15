import { z } from 'zod';
import {
  EventContentSchema,
  EventIdSchema,
  EventKindSchema,
  EventDtoSchema,
  EventSigSchema,
  EventTagSchema,
} from '../schemas';

export type EventDto = z.infer<typeof EventDtoSchema>;
export type EventId = z.infer<typeof EventIdSchema>;
export type EventKind = z.infer<typeof EventKindSchema>;
export type EventTag = z.infer<typeof EventTagSchema>;
export type EventContent = z.infer<typeof EventContentSchema>;
export type EventSig = z.infer<typeof EventSigSchema>;
