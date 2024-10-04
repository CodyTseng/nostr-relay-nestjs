import { BeforeApplicationShutdown, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Kysely, PostgresDialect } from 'kysely';
import * as pg from 'pg';
import { Config } from 'src/config';
import { Database } from './types';

@Injectable()
export class KyselyDb implements BeforeApplicationShutdown {
  private readonly db: Kysely<Database>;

  constructor(config: ConfigService<Config, true>) {
    const databaseConfig = config.get('database', { infer: true });

    const int8TypeId = 20;
    pg.types.setTypeParser(int8TypeId, (val) => parseInt(val, 10));

    const dialect = new PostgresDialect({
      pool: new pg.Pool({
        connectionString: databaseConfig.url,
        max: databaseConfig.maxConnections,
      }),
    });
    this.db = new Kysely<any>({ dialect });
  }

  getDb() {
    return this.db;
  }

  async beforeApplicationShutdown() {
    await this.db.destroy();
  }
}
