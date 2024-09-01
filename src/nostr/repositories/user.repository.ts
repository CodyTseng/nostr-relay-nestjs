import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  ColumnType,
  Kysely,
  PostgresDialect,
  sql,
} from 'kysely';
import * as pg from 'pg';
import { Config } from 'src/config';
import { EventSearchRepository } from './event-search.repository';

export interface UserDatabase {
  users: UserTable;
}

interface UserTable {
  pubkey: string;
  admission_fee: number;
  expire_at: ColumnType<Date, string, string>;
  create_date: ColumnType<Date, string, string>;
}

@Injectable()
export class UserRepository {
  private readonly db: Kysely<UserDatabase>;

  constructor(
    private readonly eventSearchRepository: EventSearchRepository,
    configService: ConfigService<Config, true>,
  ) {
    const databaseConfig = configService.get('database', { infer: true });

    const int8TypeId = 20;
    pg.types.setTypeParser(int8TypeId, (val) => parseInt(val, 10));

    const dialect = new PostgresDialect({
      pool: new pg.Pool({
        connectionString: databaseConfig.url,
        max: databaseConfig.maxConnections,
      }),
    });
    this.db = new Kysely<UserDatabase>({ dialect });
  }

  async upsert(pubkey: string, admissionFee: number) {
    try {
      await this.db.transaction().execute(async (trx) => {
        const eventInsertResult = await trx
          .insertInto('users')
          .values({
            pubkey: pubkey,
            admission_fee: admissionFee,
            expire_at: sql`NOW() + INTERVAL '1 MONTH'`,
            create_date: sql`NOW()`,
          })
          .onConflict((oc) =>
            oc.columns(['pubkey']).doUpdateSet({
              admission_fee: (eb) => eb.ref('excluded.admission_fee'),
              create_date: sql`NOW()`, // Update create_date to current timestamp
              expire_at: sql`NOW() + INTERVAL '1 MONTH'`, // Update expire_at to 1 month in the future
            }),
          )
          .executeTakeFirst();

        return eventInsertResult;
      });

      return { isDuplicate: false };
    } catch (error) {
      if (error.code === '23505') {
        // 23505 is unique_violation
        return { isDuplicate: true };
      }
      throw error;
    }
  }

  async findExpireAt(pubkey: string): Promise<Date | null> {
    try {
      const result = await this.db
        .selectFrom('users')
        .select('expire_at')
        .where('pubkey', '=', pubkey)
        .executeTakeFirst();

      if (result) {
        return result.expire_at;
      } else {
        return null;
      }
    } catch (error) {
      throw error;
    }
  }
}
