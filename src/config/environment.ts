import { z } from 'zod';

export const EnvironmentSchema = z.object({
  DATABASE_URL: z.string(),

  /*==== optional ====*/
  HOSTNAME: z.string().optional(),
  DOMAIN: z.string().optional(),
  NODE_ENV: z.string().default('development'),
  PORT: z
    .preprocess((port: string) => parseInt(port), z.number().positive())
    .optional(),
  GIT_COMMIT_SHA: z.string().optional(),
  DATABASE_MAX_CONNECTIONS: z
    .preprocess((max: string) => parseInt(max), z.number().positive())
    .optional(),

  LOG_DIR: z.string().optional(),
  LOG_LEVEL: z.string().optional(),
  LOG_SLOW_EXECUTION_THRESHOLD: z
    .preprocess(
      (threshold: string) => parseInt(threshold),
      z.number().positive(),
    )
    .optional(),

  MEILI_SEARCH_HOST: z.string().optional(),
  MEILI_SEARCH_API_KEY: z.string().optional(),
  MEILI_SEARCH_SYNC_EVENT_KINDS: z
    .preprocess(
      (str: string) => str.split(',').map((item) => parseInt(item)),
      z.array(z.number().nonnegative()),
    )
    .optional(),

  RELAY_NAME: z.string().optional(),
  RELAY_DESCRIPTION: z.string().optional(),
  RELAY_PUBKEY: z
    .string()
    .regex(/^[0-9a-f]+$/)
    .length(64)
    .optional(),
  RELAY_CONTACT: z.string().optional(),

  CREATED_AT_UPPER_LIMIT: z
    .preprocess(
      (upperLimit: string) => parseInt(upperLimit),
      z.number().positive().int(),
    )
    .optional(),
  CREATED_AT_LOWER_LIMIT: z
    .preprocess(
      (lowerLimit: string) => parseInt(lowerLimit),
      z.number().positive().int(),
    )
    .optional(),
  MIN_POW_DIFFICULTY: z
    .preprocess(
      (difficulty: string) => parseInt(difficulty),
      z.number().positive().int(),
    )
    .optional(),
  MAX_SUBSCRIPTIONS_PER_CLIENT: z
    .preprocess((max: string) => parseInt(max), z.number().nonnegative())
    .optional(),
  BLACKLIST: z
    .preprocess(
      (str: string) => str.split(','),
      z.array(
        z
          .string()
          .regex(/^[0-9a-f]+$/)
          .length(64),
      ),
    )
    .optional(),
  WHITELIST: z
    .preprocess(
      (str: string) => str.split(','),
      z.array(
        z
          .string()
          .regex(/^[0-9a-f]+$/)
          .length(64),
      ),
    )
    .optional(),

  THROTTLER_LIMIT: z
    .preprocess((limit: string) => parseInt(limit), z.number().nonnegative())
    .optional(),
  THROTTLER_TTL: z
    .preprocess((ttl: string) => parseInt(ttl), z.number().nonnegative())
    .optional(),

  EVENT_HANDLING_RESULT_CACHE_TTL: z
    .preprocess((ttl: string) => parseInt(ttl), z.number().nonnegative())
    .optional(),
  FILTER_RESULT_CACHE_TTL: z
    .preprocess((ttl: string) => parseInt(ttl), z.number().nonnegative())
    .optional(),

  EVENT_MESSAGE_HANDLING_ENABLED: z
    .preprocess((enabled: string) => enabled === 'true', z.boolean())
    .optional(),
  REQ_MESSAGE_HANDLING_ENABLED: z
    .preprocess((enabled: string) => enabled === 'true', z.boolean())
    .optional(),
  CLOSE_MESSAGE_HANDLING_ENABLED: z
    .preprocess((enabled: string) => enabled === 'true', z.boolean())
    .optional(),
  TOP_MESSAGE_HANDLING_ENABLED: z
    .preprocess((enabled: string) => enabled === 'true', z.boolean())
    .optional(),
  AUTH_MESSAGE_HANDLING_ENABLED: z
    .preprocess((enabled: string) => enabled === 'true', z.boolean())
    .optional(),
});
export type Environment = z.infer<typeof EnvironmentSchema>;

export function validateEnvironment(env: Record<string, unknown>) {
  return EnvironmentSchema.parse(env);
}
