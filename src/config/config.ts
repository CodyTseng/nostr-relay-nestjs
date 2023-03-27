import { validateEnvironment } from './environment';
import { loggerConfig } from './logger.config';
import { relayInfoDocConfig } from './relay-info-doc.config';

export function config() {
  const env = validateEnvironment(process.env);
  return {
    port: env.PORT ?? 3000,
    relayInfoDoc: relayInfoDocConfig(env),
    logger: loggerConfig(env),
  };
}
export type Config = ReturnType<typeof config>;
