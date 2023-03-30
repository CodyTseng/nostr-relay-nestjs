import { validateEnvironment } from './environment';
import { limitConfig } from './limit.config';
import { loggerConfig } from './logger.config';
import { relayInfoDocConfig } from './relay-info-doc.config';

export function config() {
  const env = validateEnvironment(process.env);
  return {
    port: env.PORT ?? 3000,
    limit: limitConfig(env),
    relayInfoDoc: relayInfoDocConfig(env),
    logger: loggerConfig(env),
  };
}
export type Config = ReturnType<typeof config>;
