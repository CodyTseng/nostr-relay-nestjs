import { Kysely, sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  await sql`DROP INDEX "public"."generic_tags_kind_idx"`.execute(db);
  await sql`DROP INDEX "public"."created_at_kind_idx"`.execute(db);
  await sql`DROP INDEX "public"."author_kind_created_at_idx"`.execute(db);
  await sql`DROP EXTENSION "btree_gin"`.execute(db);
  await sql`CREATE INDEX "e_created_at_idx" ON "events" ("created_at") `.execute(
    db,
  );
  await sql`CREATE INDEX "e_kind_created_at_idx" ON "events" ("kind", "created_at") `.execute(
    db,
  );
  await sql`CREATE UNIQUE INDEX "e_author_kind_d_tag_value_created_at_idx" ON "events" ("author", "kind", "d_tag_value", "created_at") `.execute(
    db,
  );
  await sql`CREATE INDEX "e_author_created_at_idx" ON "events" ("author", "created_at") `.execute(
    db,
  );
  await sql`CREATE INDEX "e_author_kind_created_at_idx" ON "events" ("author", "kind", "created_at") `.execute(
    db,
  );
}

export async function down(db: Kysely<any>): Promise<void> {
  await sql`DROP INDEX "public"."e_author_kind_created_at_idx"`.execute(db);
  await sql`DROP INDEX "public"."e_author_created_at_idx"`.execute(db);
  await sql`DROP INDEX "public"."e_author_kind_d_tag_value_created_at_idx"`.execute(
    db,
  );
  await sql`DROP INDEX "public"."e_kind_created_at_idx"`.execute(db);
  await sql`DROP INDEX "public"."e_created_at_idx"`.execute(db);
  await sql`CREATE EXTENSION IF NOT EXISTS btree_gin`.execute(db);
  await sql`CREATE INDEX "author_kind_created_at_idx" ON "events" ("created_at", "kind", "author") `.execute(
    db,
  );
  await sql`CREATE INDEX "created_at_kind_idx" ON "events" ("created_at", "kind") `.execute(
    db,
  );
  await sql`CREATE INDEX "generic_tags_kind_idx" ON "events" USING gin ("generic_tags", "kind")`.execute(
    db,
  );
}
