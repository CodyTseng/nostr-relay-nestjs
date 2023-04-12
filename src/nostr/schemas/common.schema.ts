import { z } from 'zod';
import { EVENT_ID_LENGTH, PUBKEY_LENGTH, SIGNATURE_LENGTH } from '../constants';

export const TimestampInSecSchema = z.number().int().min(0);

export const HexStringSchema = z.string().regex(/^[0-9a-f]+$/);

export const EventIdSchema = HexStringSchema.length(EVENT_ID_LENGTH);
export type EventId = z.infer<typeof EventIdSchema>;

export const EventIdPrefixSchema = HexStringSchema.min(4).max(EVENT_ID_LENGTH);

export const PubkeySchema = HexStringSchema.length(PUBKEY_LENGTH);
export type Pubkey = z.infer<typeof PubkeySchema>;

export const PubkeyPrefixSchema = HexStringSchema.min(4).max(PUBKEY_LENGTH);

export const EventKindSchema = z.number().int().min(0);

export const EventTagSchema = z.array(z.string().max(1024)).max(10);

export const EventContentSchema = z.string().max(100 * 1024);

export const EventSigSchema = HexStringSchema.length(SIGNATURE_LENGTH);

export const SubscriptionIdSchema = z.string().min(1).max(64);
export type SubscriptionId = z.infer<typeof SubscriptionIdSchema>;
