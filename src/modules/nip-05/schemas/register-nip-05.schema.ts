import { z } from 'zod';

export const RegisterNip05Schema = z.object({
  name: z.string().max(20),
  pubkey: z.string().regex(/^[0-9a-f]{64}$/),
});
