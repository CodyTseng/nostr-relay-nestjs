import { databaseConfig } from './database.config';
import { validateEnvironment } from './environment';
import { limitConfig } from './limit.config';
import { loggerConfig } from './logger.config';
import { relayInfoDocConfig } from './relay-info-doc.config';

export function config() {
  const env = validateEnvironment(process.env);
  return {
    domain: env.DOMAIN,
    port: env.PORT ?? 3000,
    database: databaseConfig(env),
    limit: limitConfig(env),
    relayInfoDoc: relayInfoDocConfig(env),
    logger: loggerConfig(env),
  };
}
export type Config = ReturnType<typeof config>;
