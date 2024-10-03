import { z } from 'zod';

export const RegisterNip05Schema = z.object({
  name: z.string().regex(/^[a-zA-Z0-9_]{1,20}$/),
  pubkey: z.string().regex(/^[0-9a-f]{64}$/),
});
