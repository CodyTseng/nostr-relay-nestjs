import { Environment } from './environment';

export function databaseConfig(env: Environment) {
  return {
    url: env.DATABASE_URL,
  };
}
export type DatabaseConfig = ReturnType<typeof databaseConfig>;
