import { Kysely, sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  await sql`DROP INDEX "public"."g_tag_event_id_idx"`.execute(db);
  await sql`CREATE UNIQUE INDEX "g_event_id_tag_idx" ON "generic_tags" ("event_id", "tag") `.execute(
    db,
  );
}

export async function down(db: Kysely<any>): Promise<void> {
  await sql`DROP INDEX "public"."g_event_id_tag_idx"`.execute(db);
  await sql`CREATE UNIQUE INDEX "g_tag_event_id_idx" ON "generic_tags" ("tag", "event_id") `.execute(
    db,
  );
}
