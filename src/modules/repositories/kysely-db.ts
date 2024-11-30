import { BeforeApplicationShutdown, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Kysely, PostgresDialect } from 'kysely';
import * as pg from 'pg';
import { Config } from 'src/config';
import { Database } from './types';

@Injectable()
export class KyselyDb implements BeforeApplicationShutdown {
  public readonly db: Kysely<Database>;

  constructor(
    config: ConfigService<Config, true>,
    private readonly logger: Logger,
  ) {
    const databaseConfig = config.get('database', { infer: true });

    // Configure int8 parsing
    const int8TypeId = 20;
    pg.types.setTypeParser(int8TypeId, (val) => parseInt(val, 10));

    // Create connection pool with enhanced security
    const pool = new pg.Pool({
      connectionString: databaseConfig.url,
      ...databaseConfig.pool,
      ssl: databaseConfig.security.ssl ? {
        rejectUnauthorized: true,
      } : false,
      statement_timeout: databaseConfig.security.statementTimeout,
      query_timeout: databaseConfig.security.queryTimeout,
    });

    // Add pool error handling
    pool.on('error', (err, client) => {
      this.logger.error({ err, client }, 'Unexpected error on idle client');
    });

    pool.on('connect', (client) => {
      this.logger.debug('New client connected to database');
      client.on('error', (err) => {
        this.logger.error({ err }, 'Database client error');
      });
    });

    const dialect = new PostgresDialect({ pool });
    this.db = new Kysely<Database>({ dialect });
  }

  getDb() {
    return this.db;
  }

  async beforeApplicationShutdown() {
    await this.db.destroy();
  }
}
