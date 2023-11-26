import { Environment } from './environment';

export function cacheConfig(env: Environment) {
  return {
    // default to 5 minutes
    eventHandlingResultCacheTtl:
      env.EVENT_HANDLING_RESULT_CACHE_TTL ?? 5 * 60 * 1000,
    // default to 10 seconds
    filterResultCacheTtl: env.FILTER_RESULT_CACHE_TTL ?? 10 * 1000,
  };
}
