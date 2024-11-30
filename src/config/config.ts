import { cacheConfig } from './cache.config';
import { databaseConfig } from './database.config';
import { validateEnvironment } from './environment';
import { limitConfig } from './limit.config';
import { loggerConfig } from './logger.config';
import { meiliSearchConfig } from './meili-search.config';
import { messageHandlingConfig } from './message-handling.config';
import { relayInfoConfig } from './relay-info.config';
import { securityConfig } from './security.config';
import { throttlerConfig } from './throttler.config';
import { wotConfig } from './wot.config';

export function config() {
  const env = validateEnvironment(process.env);
  return {
    hostname: env.HOSTNAME ?? env.DOMAIN,
    port: env.PORT ?? 3000,
    environment: env.NODE_ENV,
    database: databaseConfig(env),
    meiliSearch: meiliSearchConfig(env),
    limit: limitConfig(env),
    relayInfo: relayInfoConfig(env),
    logger: loggerConfig(env),
    throttler: throttlerConfig(env),
    cache: cacheConfig(env),
    messageHandling: messageHandlingConfig(env),
    wot: wotConfig(env),
    security: securityConfig(env),
    swagger: {
      enabled: env.NODE_ENV === 'development' || env.ENABLE_SWAGGER === 'true',
    },
  };
}
export type Config = ReturnType<typeof config>;
