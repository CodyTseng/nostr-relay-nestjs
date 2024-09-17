import { Kysely, sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  await sql`DROP INDEX "public"."e_author_kind_d_tag_value_created_at_idx"`.execute(
    db,
  );
  await sql`ALTER TABLE "generic_tags" DROP CONSTRAINT "FK_5c845879328f9e991bbb43ef96a"`.execute(
    db,
  );
  await sql`CREATE UNIQUE INDEX "e_author_kind_d_tag_value_idx" ON "events" ("author", "kind", "d_tag_value") WHERE "d_tag_value" IS NOT NULL`.execute(
    db,
  );
  await sql`ALTER TABLE "generic_tags" ADD CONSTRAINT "FK_5c845879328f9e991bbb43ef96a" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE`.execute(
    db,
  );
}

export async function down(db: Kysely<any>): Promise<void> {
  await sql`ALTER TABLE "generic_tags" DROP CONSTRAINT "FK_5c845879328f9e991bbb43ef96a"`.execute(
    db,
  );
  await sql`DROP INDEX "public"."e_author_kind_d_tag_value_idx"`.execute(db);
  await sql`ALTER TABLE "generic_tags" ADD CONSTRAINT "FK_5c845879328f9e991bbb43ef96a" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE NO ACTION`.execute(
    db,
  );
  await sql`CREATE UNIQUE INDEX "e_author_kind_d_tag_value_created_at_idx" ON "events" ("created_at", "kind", "d_tag_value", "author") `.execute(
    db,
  );
}
