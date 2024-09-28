import { Environment } from './environment';

export function throttlerConfig(env: Environment) {
  return {
    restApi: [
      {
        ttl: env.THROTTLER_TTL ?? 1000, // 1 second
        limit: env.THROTTLER_LIMIT ?? 100,
      },
    ],
    ws: {
      EVENT: {
        ttl: env.THROTTLER_EVENT_TTL ?? 1000, // 1 second
        limit: env.THROTTLER_EVENT_LIMIT ?? 10,
        blockDuration: env.THROTTLER_EVENT_BLOCK_DURATION ?? 600000, // 10 minutes
      },
      REQ: {
        ttl: env.THROTTLER_REQ_TTL ?? 1000, // 1 second
        limit: env.THROTTLER_REQ_LIMIT ?? 100,
        blockDuration: env.THROTTLER_REQ_BLOCK_DURATION ?? 600000, // 10 minutes
      },
    },
  };
}
