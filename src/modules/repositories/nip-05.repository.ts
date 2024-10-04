import { Injectable } from '@nestjs/common';
import { Kysely } from 'kysely';
import { KyselyDb } from './kysely-db';
import { Database, Nip05Row } from './types';

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

  async getByName(name: string): Promise<Nip05Row | undefined> {
    return this.db
      .selectFrom('nip05')
      .selectAll()
      .where('name', '=', name)
      .executeTakeFirst();
  }

  async list(limit = 10, after?: string): Promise<Nip05Row[]> {
    let query = this.db.selectFrom('nip05').selectAll();

    if (after) {
      query = query.where('name', '>', after);
    }

    return query.orderBy('name').limit(limit).execute();
  }

  async register(name: string, pubkey: string): Promise<void> {
    await this.db.insertInto('nip05').values({ name, pubkey }).execute();
  }

  async delete(name: string): Promise<void> {
    await this.db.deleteFrom('nip05').where('name', '=', name).execute();
  }
}
