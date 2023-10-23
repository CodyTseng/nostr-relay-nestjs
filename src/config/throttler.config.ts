import { Environment } from './environment';

export function throttlerConfig(env: Environment) {
  return [
    {
      limit: env.THROTTLER_LIMIT ?? 100,
      ttl: env.THROTTLER_TTL ?? 1000, // 1 second
    },
  ];
}
