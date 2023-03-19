import { Environment } from './environment';

export function loggerConfig(env: Environment) {
  return {
    dir: env.LOG_DIR,
    level: env.LOG_LEVEL ?? 'info',
  };
}
