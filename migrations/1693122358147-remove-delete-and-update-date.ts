import { Kysely, sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  await sql`ALTER TABLE "events" DROP COLUMN "update_date"`.execute(db);
  await sql`ALTER TABLE "events" DROP COLUMN "delete_date"`.execute(db);
}

export async function down(db: Kysely<any>): Promise<void> {
  await sql`ALTER TABLE "events" ADD "delete_date" TIMESTAMP`.execute(db);
  await sql`ALTER TABLE "events" ADD "update_date" TIMESTAMP NOT NULL DEFAULT now()`.execute(
    db,
  );
}
