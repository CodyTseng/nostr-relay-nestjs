import { z } from 'zod';

export const EnvironmentSchema = z.object({
  DOMAIN: z.string(),

  DATABASE_URL: z.string(),

  /*==== optional ====*/
  PORT: z
    .string()
    .transform((port) => parseInt(port))
    .optional(),
  GIT_COMMIT_SHA: z.string().optional(),

  LOG_DIR: z.string().optional(),
  LOG_LEVEL: z.string().optional(),
  LOG_SLOW_EXECUTION_THRESHOLD: z
    .string()
    .transform((threshold) => parseInt(threshold))
    .optional(),

  MEILI_SEARCH_HOST: z.string().optional(),
  MEILI_SEARCH_API_KEY: z.string().optional(),
  MEILI_SEARCH_SYNC_EVENT_KINDS: z
    .string()
    .transform((str) => str.split(',').map((item) => parseInt(item)))
    .optional(),

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
  EVENT_CREATED_AT_LOWER_LIMIT: z
    .string()
    .transform((lowerLimit) => parseInt(lowerLimit))
    .optional(),
  EVENT_ID_MIN_LEADING_ZERO_BITS: z
    .string()
    .transform((minLeadingZeroBits) => parseInt(minLeadingZeroBits))
    .optional(),
  MAX_SUBSCRIPTIONS_PER_CLIENT: z
    .string()
    .transform((limit) => parseInt(limit))
    .optional(),

  THROTTLER_LIMIT: z
    .string()
    .transform((limit) => parseInt(limit))
    .optional(),
  THROTTLER_TTL: z
    .string()
    .transform((ttl) => parseInt(ttl))
    .optional(),

  EVENT_HANDLING_RESULT_CACHE_ENABLED: z
    .string()
    .transform((enabled) => enabled === 'true')
    .optional(),
  EVENT_HANDLING_RESULT_CACHE_TTL: z
    .string()
    .transform((ttl) => parseInt(ttl))
    .optional(),
  FILTER_RESULT_CACHE_TTL: z
    .string()
    .transform((ttl) => parseInt(ttl))
    .optional(),

  EVENT_MESSAGE_HANDLING_ENABLED: z
    .string()
    .transform((enabled) => enabled === 'true')
    .optional(),
  REQ_MESSAGE_HANDLING_ENABLED: z
    .string()
    .transform((enabled) => enabled === 'true')
    .optional(),
  CLOSE_MESSAGE_HANDLING_ENABLED: z
    .string()
    .transform((enabled) => enabled === 'true')
    .optional(),
  TOP_MESSAGE_HANDLING_ENABLED: z
    .string()
    .transform((enabled) => enabled === 'true')
    .optional(),
  AUTH_MESSAGE_HANDLING_ENABLED: z
    .string()
    .transform((enabled) => enabled === 'true')
    .optional(),
});
export type Environment = z.infer<typeof EnvironmentSchema>;

export function validateEnvironment(env: Record<string, unknown>) {
  return EnvironmentSchema.parse(env);
}
