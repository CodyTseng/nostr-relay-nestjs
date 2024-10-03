import { Kysely, sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .createTable('nip05')
    .addColumn('name', 'varchar(20)', (col) => col.primaryKey())
    .addColumn('pubkey', 'char(64)', (col) => col.notNull())
    .addColumn('create_date', 'timestamp', (col) =>
      col.defaultTo(sql`now()`).notNull(),
    )
    .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropTable('nip05').execute();
}
