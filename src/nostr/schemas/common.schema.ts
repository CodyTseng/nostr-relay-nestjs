import { z } from 'zod';
import { EVENT_ID_LENGTH, PUBKEY_LENGTH, SIGNATURE_LENGTH } from '../constants';

export const TimestampInSecSchema = z.number().int().min(0);
export type TimestampInSeconds = z.infer<typeof TimestampInSecSchema>;

export const HexStringSchema = z.string().regex(/^[0-9a-f]+$/);

export const EventIdSchema = HexStringSchema.length(EVENT_ID_LENGTH);
export type EventId = z.infer<typeof EventIdSchema>;

export const EventIdPrefixSchema = HexStringSchema.min(4).max(EVENT_ID_LENGTH);

export const PubkeySchema = HexStringSchema.length(PUBKEY_LENGTH);
export type Pubkey = z.infer<typeof PubkeySchema>;

export const PubkeyPrefixSchema = HexStringSchema.min(4).max(PUBKEY_LENGTH);

export const EventKindSchema = z.number().int().min(0);
export type EventKind = z.infer<typeof EventKindSchema>;

export const EventTagSchema = z.array(z.string().max(1024)).max(10);
export type EventTag = z.infer<typeof EventTagSchema>;

export const EventContentSchema = z.string().max(100 * 1024);
export type EventContent = z.infer<typeof EventContentSchema>;

export const EventSigSchema = HexStringSchema.length(SIGNATURE_LENGTH);
export type EventSig = z.infer<typeof EventSigSchema>;

export const SubscriptionIdSchema = z.string().min(1).max(64);
export type SubscriptionId = z.infer<typeof SubscriptionIdSchema>;
