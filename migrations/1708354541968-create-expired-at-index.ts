import { Kysely, sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  await sql`CREATE INDEX "e_expired_at_idx" ON "events" ("expired_at") `.execute(
    db,
  );
}

export async function down(db: Kysely<any>): Promise<void> {
  await sql`DROP INDEX "public"."e_expired_at_idx"`.execute(db);
}
