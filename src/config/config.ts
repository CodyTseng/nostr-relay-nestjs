import { Environment } from './environment';
import { loggerConfig } from './logger.config';
import { relayInfoDocConfig } from './relay-info-doc.config';

export function config() {
  const env = process.env as Environment;
  return {
    port: env.PORT ?? 3000,
    relayInfoDoc: relayInfoDocConfig(env),
    logger: loggerConfig(env),
  };
}
export type Config = ReturnType<typeof config>;
