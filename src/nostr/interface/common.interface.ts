import { z } from 'zod';
import { PubkeySchema, TimestampInSecSchema } from '../schemas';

export type TimestampInSeconds = z.infer<typeof TimestampInSecSchema>;
export type Pubkey = z.infer<typeof PubkeySchema>;
