import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Kysely, PostgresDialect } from 'kysely';
import * as pg from 'pg';
import { Config } from 'src/config';
import { KYSELY_DB } from './constants';
import { EventSearchRepository } from './event-search.repository';
import { EventRepository } from './event.repository';

@Module({
  providers: [
    {
      provide: KYSELY_DB,
      useFactory: (configService: ConfigService<Config, true>) => {
        const databaseConfig = configService.get('database', { infer: true });

        const int8TypeId = 20;
        pg.types.setTypeParser(int8TypeId, (val) => parseInt(val, 10));

        const dialect = new PostgresDialect({
          pool: new pg.Pool({
            connectionString: databaseConfig.url,
            max: databaseConfig.maxConnections,
          }),
        });
        return new Kysely<any>({ dialect });
      },
      inject: [ConfigService],
    },
    EventRepository,
    EventSearchRepository,
  ],
  exports: [EventRepository, EventSearchRepository],
})
export class RepositoriesModule {}
