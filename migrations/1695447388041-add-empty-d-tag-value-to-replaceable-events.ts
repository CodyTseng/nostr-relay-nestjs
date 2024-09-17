import { Kysely, sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  await sql`UPDATE "events" SET "d_tag_value" = '' WHERE "kind" >= 10000 AND "kind" < 20000`.execute(
    db,
  );
}

export async function down(db: Kysely<any>): Promise<void> {
  await sql`UPDATE "events" SET "d_tag_value" = NULL WHERE "kind" >= 10000 AND "kind" < 20000`.execute(
    db,
  );
}
