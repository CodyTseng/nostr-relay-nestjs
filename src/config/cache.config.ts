import { isNil } from 'lodash';
import { Environment } from './environment';

export function cacheConfig(env: Environment) {
  return {
    // default to true
    eventHandlingResultCacheEnabled: isNil(
      env.EVENT_HANDLING_RESULT_CACHE_ENABLED,
    )
      ? true
      : env.EVENT_HANDLING_RESULT_CACHE_ENABLED,
    // default to 5 minutes
    eventHandlingResultCacheTtl:
      env.EVENT_HANDLING_RESULT_CACHE_TTL ?? 5 * 60 * 1000,
  };
}
