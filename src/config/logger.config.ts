import { Environment } from './environment';

export function loggerConfig(env: Environment) {
  return {
    dir: env.LOG_DIR,
    level: env.LOG_LEVEL ?? 'info',
    slowExecutionThreshold: env.LOG_SLOW_EXECUTION_THRESHOLD ?? 500,
  };
}
