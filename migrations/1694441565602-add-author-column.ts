import { Kysely, sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  await sql`DROP INDEX "public"."pubkey_kind_created_at_idx"`.execute(db);
  await sql`DROP INDEX "public"."delegator_kind_created_at_idx"`.execute(db);
  await sql`ALTER TABLE "events" RENAME COLUMN "delegator" TO "author"`.execute(
    db,
  );
  await sql`UPDATE "events" SET "author" = "pubkey" WHERE "author" IS NULL`.execute(
    db,
  );
  await sql`ALTER TABLE "events" ALTER COLUMN "author" SET NOT NULL`.execute(
    db,
  );
  await sql`CREATE INDEX "author_kind_created_at_idx" ON "events" ("author", "kind", "created_at")`.execute(
    db,
  );
}

export async function down(db: Kysely<any>): Promise<void> {
  await sql`DROP INDEX "public"."author_kind_created_at_idx"`.execute(db);
  await sql`ALTER TABLE "events" ALTER COLUMN "author" DROP NOT NULL`.execute(
    db,
  );
  await sql`UPDATE "events" SET "author" = NULL WHERE "author" = "pubkey"`.execute(
    db,
  );
  await sql`ALTER TABLE "events" RENAME COLUMN "author" TO "delegator"`.execute(
    db,
  );
  await sql`CREATE INDEX "delegator_kind_created_at_idx" ON "events" ("delegator", "kind", "created_at") `.execute(
    db,
  );
  await sql`CREATE INDEX "pubkey_kind_created_at_idx" ON "events" ("pubkey", "kind", "created_at") `.execute(
    db,
  );
}
