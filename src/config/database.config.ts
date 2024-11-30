import { Environment } from './environment';

export interface DatabaseConfig {
  url: string;
  pool: {
    max: number;
    min: number;
    idleTimeoutMillis: number;
    connectionTimeoutMillis: number;
  };
  security: {
    ssl: boolean;
    sslMode: string;
    statementTimeout: number;
    queryTimeout: number;
  };
}

export function databaseConfig(env: Environment): DatabaseConfig {
  return {
    url: env.DATABASE_URL,
    pool: {
      max: env.DATABASE_MAX_CONNECTIONS ?? 50,
      min: env.DATABASE_MIN_CONNECTIONS ?? 5,
      idleTimeoutMillis: env.DATABASE_IDLE_TIMEOUT ?? 30000,
      connectionTimeoutMillis: env.DATABASE_CONNECTION_TIMEOUT ?? 5000,
    },
    security: {
      ssl: env.DATABASE_SSL ?? false,
      sslMode: env.DATABASE_SSL_MODE ?? 'disable',
      statementTimeout: env.DATABASE_STATEMENT_TIMEOUT ?? 30000,
      queryTimeout: env.DATABASE_QUERY_TIMEOUT ?? 10000,
    },
  };
}
