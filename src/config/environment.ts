import { z } from 'zod';

export const EnvironmentSchema = z.object({
  DOMAIN: z.string(),

  DATABASE_URL: z.string(),

  /*==== optional ====*/
  PORT: z
    .string()
    .transform((port) => parseInt(port))
    .optional(),

  LOG_DIR: z.string().optional(),
  LOG_LEVEL: z.string().optional(),

  MEILI_SEARCH_HOST: z.string().optional(),
  MEILI_SEARCH_API_KEY: z.string().optional(),

  RELAY_NAME: z.string().optional(),
  RELAY_DESCRIPTION: z.string().optional(),
  RELAY_PUBKEY: z
    .string()
    .regex(/^[0-9a-f]+$/)
    .length(64)
    .optional(),
  RELAY_CONTACT: z.string().optional(),
  RELAY_SUPPORTED_NIPS: z.array(z.number().int()).optional(),

  EVENT_CREATED_AT_UPPER_LIMIT: z
    .string()
    .transform((upperLimit) => parseInt(upperLimit))
    .optional(),
  EVENT_ID_MIN_LEADING_ZERO_BITS: z
    .string()
    .transform((minLeadingZeroBits) => parseInt(minLeadingZeroBits))
    .optional(),

  THROTTLER_LIMIT: z
    .string()
    .transform((limit) => parseInt(limit))
    .optional(),
  THROTTLER_TTL: z
    .string()
    .transform((ttl) => parseInt(ttl))
    .optional(),
});
export type Environment = z.infer<typeof EnvironmentSchema>;

export function validateEnvironment(env: Record<string, unknown>) {
  return EnvironmentSchema.parse(env);
}
