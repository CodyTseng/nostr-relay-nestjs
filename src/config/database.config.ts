import { Environment } from './environment';

export function databaseConfig(env: Environment) {
  return {
    url: env.DATABASE_URL,
    maxConnections: env.DATABASE_MAX_CONNECTIONS ?? 50,
  };
}
export type DatabaseConfig = ReturnType<typeof databaseConfig>;
