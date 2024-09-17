import { Kysely, sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  await sql`DROP INDEX "public"."g_tag_created_at_event_id_idx"`.execute(db);
  await sql`DROP INDEX "public"."g_tag_kind_created_at_event_id_idx"`.execute(
    db,
  );
  await sql`CREATE INDEX "g_tag_kind_created_at_desc_event_id_idx" ON "generic_tags" ("tag", "kind", "created_at" DESC, "event_id") `.execute(
    db,
  );
  await sql`CREATE INDEX "g_tag_created_at_desc_event_id_idx" ON "generic_tags" ("tag", "created_at" DESC, "event_id") `.execute(
    db,
  );
}

export async function down(db: Kysely<any>): Promise<void> {
  await sql`DROP INDEX "public"."g_tag_kind_created_at_desc_event_id_idx"`.execute(
    db,
  );
  await sql`DROP INDEX "public"."g_tag_created_at_desc_event_id_idx"`.execute(
    db,
  );
  await sql`CREATE INDEX "g_tag_kind_created_at_event_id_idx" ON "generic_tags" ("tag", "kind", "created_at", "event_id") `.execute(
    db,
  );
  await sql`CREATE INDEX "g_tag_created_at_event_id_idx" ON "generic_tags" ("tag", "created_at", "event_id") `.execute(
    db,
  );
}
