import { z } from 'zod';
import {
  CloseMessageSchema,
  CountMessageSchema,
  EventMessageSchema,
  ReqMessageSchema,
} from '../schemas';

export type EventMessageDto = z.infer<typeof EventMessageSchema>;
export type ReqMessageDto = z.infer<typeof ReqMessageSchema>;
export type CloseMessageDto = z.infer<typeof CloseMessageSchema>;
export type CountMessageDto = z.infer<typeof CountMessageSchema>;
