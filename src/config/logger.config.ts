import { Environment } from './environment';

export function loggerConfig(env: Environment) {
  return {
    dir: env.LOG_DIR,
    level: env.LOG_LEVEL ?? 'info',
    slowRequestThreshold: env.LOG_SLOW_REQUEST_THRESHOLD ?? 500,
  };
}
