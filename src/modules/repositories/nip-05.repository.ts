import { Injectable } from '@nestjs/common';
import { Kysely } from 'kysely';
import { KyselyDb } from './kysely-db';
import { Database } from './types';

@Injectable()
export class Nip05Repository {
  private readonly db: Kysely<Database>;

  constructor(kyselyDb: KyselyDb) {
    this.db = kyselyDb.getDb();
  }

  async getPubkeyByName(name: string): Promise<string | undefined> {
    const result = await this.db
      .selectFrom('nip05')
      .select('pubkey')
      .where('name', '=', name)
      .executeTakeFirst();

    return result?.pubkey;
  }

  async register(name: string, pubkey: string): Promise<void> {
    await this.db.insertInto('nip05').values({ name, pubkey }).execute();
  }

  async delete(name: string): Promise<void> {
    await this.db.deleteFrom('nip05').where('name', '=', name).execute();
  }
}
