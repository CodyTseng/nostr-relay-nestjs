import { z } from 'zod';

export const arraySchema = <T extends z.ZodTypeAny>(schema: T) =>
  z.preprocess((v) => (Array.isArray(v) ? v : [v]), z.array(schema));

export const EnvironmentSchema = z.object({
  DATABASE_URL: z.string(),

  /*==== optional ====*/
  HOSTNAME: z.string().optional(),
  DOMAIN: z.string().optional(),
  NODE_ENV: z.string().default('development'),
  PORT: z.number().int().positive().optional(),
  GIT_COMMIT_SHA: z.string().optional(),
  DATABASE_MAX_CONNECTIONS: z.number().int().positive().optional(),

  LOG_DIR: z.string().optional(),
  LOG_LEVEL: z.string().optional(),
  LOG_SLOW_EXECUTION_THRESHOLD: z.number().int().positive().optional(),

  MEILI_SEARCH_HOST: z.string().optional(),
  MEILI_SEARCH_API_KEY: z.string().optional(),
  MEILI_SEARCH_SYNC_EVENT_KINDS: arraySchema(
    z.number().nonnegative(),
  ).optional(),

  RELAY_NAME: z.string().optional(),
  RELAY_DESCRIPTION: z.string().optional(),
  RELAY_PUBKEY: z
    .string()
    .regex(/^[0-9a-f]+$/)
    .length(64)
    .optional(),
  RELAY_CONTACT: z.string().optional(),

  CREATED_AT_UPPER_LIMIT: z.number().int().positive().optional(),
  CREATED_AT_LOWER_LIMIT: z.number().int().positive().optional(),
  MIN_POW_DIFFICULTY: z.number().int().positive().optional(),
  MAX_SUBSCRIPTIONS_PER_CLIENT: z.number().int().positive().optional(),
  BLACKLIST: arraySchema(
    z
      .string()
      .regex(/^[0-9a-f]+$/)
      .length(64),
  ).optional(),
  WHITELIST: arraySchema(
    z
      .string()
      .regex(/^[0-9a-f]+$/)
      .length(64),
  ).optional(),

  THROTTLER_TTL: z.number().int().positive().optional(),
  THROTTLER_LIMIT: z.number().int().positive().optional(),
  THROTTLER_EVENT_TTL: z.number().int().positive().optional(),
  THROTTLER_EVENT_LIMIT: z.number().int().positive().optional(),
  THROTTLER_EVENT_BLOCK_DURATION: z.number().int().positive().optional(),
  THROTTLER_REQ_TTL: z.number().int().positive().optional(),
  THROTTLER_REQ_LIMIT: z.number().int().positive().optional(),
  THROTTLER_REQ_BLOCK_DURATION: z.number().int().positive().optional(),

  EVENT_HANDLING_RESULT_CACHE_TTL: z.number().int().positive().optional(),
  FILTER_RESULT_CACHE_TTL: z.number().int().positive().optional(),

  EVENT_MESSAGE_HANDLING_ENABLED: z.boolean().optional(),
  REQ_MESSAGE_HANDLING_ENABLED: z.boolean().optional(),
  CLOSE_MESSAGE_HANDLING_ENABLED: z.boolean().optional(),
  TOP_MESSAGE_HANDLING_ENABLED: z.boolean().optional(),
  AUTH_MESSAGE_HANDLING_ENABLED: z.boolean().optional(),

  WOT_TRUST_ANCHOR_PUBKEY: z
    .string()
    .regex(/^[0-9a-f]{64}$/)
    .optional(),
  WOT_TRUST_DEPTH: z.number().positive().int().max(2).optional(),
  WOT_REFRESH_INTERVAL: z.number().positive().int().optional(),
  WOT_FETCH_FOLLOW_LIST_FROM: arraySchema(
    z.string().regex(/^wss?:\/\/.+/),
  ).optional(),
  WOT_SKIP_FILTERS: arraySchema(
    z.any(), // TODO: add filter schema
  ).optional(),

  // WebSocket Security Settings
  WS_MAX_MESSAGE_SIZE: z.number().int().positive().optional(),
  WS_MAX_CONNECTIONS_PER_IP: z.number().int().positive().optional(),
  WS_RATE_LIMIT_TTL: z.number().int().positive().optional(),
  WS_RATE_LIMIT_COUNT: z.number().int().positive().optional(),
  WS_AUTH_TIMEOUT: z.number().int().positive().optional(),
  WS_MAX_EVENT_SIZE: z.number().int().positive().optional(),
  WS_MAX_SUBSCRIPTION_FILTERS: z.number().int().positive().optional(),
  WS_MAX_FILTER_LENGTH: z.number().int().positive().optional(),
});

export type Environment = z.infer<typeof EnvironmentSchema>;

export function validateEnvironment(env: Record<string, unknown>) {
  return EnvironmentSchema.parse(preprocess(env));
}

function preprocess(env: Record<string, unknown>) {
  return Object.entries(env).reduce((acc, [key, value]) => {
    if (typeof value !== 'string') {
      return acc;
    }

    return {
      ...acc,
      [key]: tryToParse(value),
    };
  }, {});
}

function tryToParse(value: string) {
  if (/^\d+$/.test(value)) {
    return parseInt(value, 10);
  }
  if (value === 'true' || value === 'false') {
    return value === 'true';
  }

  try {
    const json = JSON.parse(value);
    if (typeof json === 'object') {
      return json;
    }
  } catch {
    // ignore
  }

  if (value.includes(',')) {
    return value.split(',').map((v) => tryToParse(v.trim()));
  }

  return value;
}
