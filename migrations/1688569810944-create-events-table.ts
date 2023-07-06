import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateEventsTable1688569810944 implements MigrationInterface {
  name = 'CreateEventsTable1688569810944';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE IF NOT EXISTS "events" ("id" character(64) NOT NULL, "pubkey" character(64) NOT NULL, "created_at" bigint NOT NULL, "kind" integer NOT NULL, "tags" jsonb NOT NULL DEFAULT '[]', "generic_tags" text array NOT NULL DEFAULT '{}', "content" text NOT NULL DEFAULT '', "sig" character(128) NOT NULL, "expired_at" bigint NOT NULL DEFAULT '9999999999', "d_tag_value" text, "delegator" character(64), "create_date" TIMESTAMP NOT NULL DEFAULT now(), "update_date" TIMESTAMP NOT NULL DEFAULT now(), "delete_date" TIMESTAMP, CONSTRAINT "PK_30c2f3bbaf6d34a55f8ae6e4614" PRIMARY KEY ("id"))`,
    );

    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS btree_gin`);
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "generic_tags_kind_idx" ON "events" USING gin ("generic_tags", "kind")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "pubkey_kind_created_at_idx" ON "events" ("pubkey", "kind", "created_at")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "delegator_kind_created_at_idx" ON "events" ("delegator", "kind", "created_at")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "created_at_kind_idx" ON "events" ("created_at", "kind")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "created_at_kind_idx"`);
    await queryRunner.query(`DROP INDEX "delegator_kind_created_at_idx"`);
    await queryRunner.query(`DROP INDEX "pubkey_kind_created_at_idx"`);
    await queryRunner.query(`DROP INDEX "generic_tags_kind_idx"`);
    await queryRunner.query(`DROP EXTENSION "btree_gin"`);
    await queryRunner.query(`DROP TABLE "events"`);
  }
}
