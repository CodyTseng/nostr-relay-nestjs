import { Kysely, sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  await sql`CREATE TABLE IF NOT EXISTS "events" ("id" character(64) NOT NULL, "pubkey" character(64) NOT NULL, "created_at" bigint NOT NULL, "kind" integer NOT NULL, "tags" jsonb NOT NULL DEFAULT '[]', "generic_tags" text array NOT NULL DEFAULT '{}', "content" text NOT NULL DEFAULT '', "sig" character(128) NOT NULL, "expired_at" bigint, "d_tag_value" text, "delegator" character(64), "create_date" TIMESTAMP NOT NULL DEFAULT now(), "update_date" TIMESTAMP NOT NULL DEFAULT now(), "delete_date" TIMESTAMP, CONSTRAINT "PK_30c2f3bbaf6d34a55f8ae6e4614" PRIMARY KEY ("id"))`.execute(
    db,
  );

  await sql`CREATE EXTENSION IF NOT EXISTS btree_gin`.execute(db);
  await sql`CREATE INDEX IF NOT EXISTS "generic_tags_kind_idx" ON "events" USING gin ("generic_tags", "kind")`.execute(
    db,
  );
  await sql`CREATE INDEX IF NOT EXISTS "pubkey_kind_created_at_idx" ON "events" ("pubkey", "kind", "created_at")`.execute(
    db,
  );
  await sql`CREATE INDEX IF NOT EXISTS "delegator_kind_created_at_idx" ON "events" ("delegator", "kind", "created_at")`.execute(
    db,
  );
  await sql`CREATE INDEX IF NOT EXISTS "created_at_kind_idx" ON "events" ("created_at", "kind")`.execute(
    db,
  );
}

export async function down(db: Kysely<any>): Promise<void> {
  await sql`DROP INDEX "created_at_kind_idx"`.execute(db);
  await sql`DROP INDEX "delegator_kind_created_at_idx"`.execute(db);
  await sql`DROP INDEX "pubkey_kind_created_at_idx"`.execute(db);
  await sql`DROP INDEX "generic_tags_kind_idx"`.execute(db);
  await sql`DROP EXTENSION "btree_gin"`.execute(db);
  await sql`DROP TABLE "events"`.execute(db);
}
