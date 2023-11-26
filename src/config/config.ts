import { cacheConfig } from './cache.config';
import { databaseConfig } from './database.config';
import { validateEnvironment } from './environment';
import { limitConfig } from './limit.config';
import { loggerConfig } from './logger.config';
import { meiliSearchConfig } from './meili-search.config';
import { messageHandlingConfig } from './message-handling.config';
import { relayInfoConfig } from './relay-info.config';
import { throttlerConfig } from './throttler.config';

export function config() {
  const env = validateEnvironment(process.env);
  return {
    domain: env.DOMAIN,
    port: env.PORT ?? 3000,
    database: databaseConfig(env),
    meiliSearch: meiliSearchConfig(env),
    limit: limitConfig(env),
    relayInfo: relayInfoConfig(env),
    logger: loggerConfig(env),
    throttler: throttlerConfig(env),
    cache: cacheConfig(env),
    messageHandling: messageHandlingConfig(env),
  };
}
export type Config = ReturnType<typeof config>;
