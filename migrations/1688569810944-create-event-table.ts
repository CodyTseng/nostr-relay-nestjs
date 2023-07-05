import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateEventTable1688569810944 implements MigrationInterface {
  name = 'CreateEventTable1688569810944';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE IF NOT EXISTS "event" ("id" character(64) NOT NULL, "pubkey" character(64) NOT NULL, "created_at" bigint NOT NULL, "kind" integer NOT NULL, "tags" jsonb NOT NULL DEFAULT '[]', "generic_tags" text array NOT NULL DEFAULT '{}', "content" text NOT NULL DEFAULT '', "sig" character(128) NOT NULL, "expired_at" bigint NOT NULL DEFAULT '9999999999', "d_tag_value" text, "delegator" character(64), "create_date" TIMESTAMP NOT NULL DEFAULT now(), "update_date" TIMESTAMP NOT NULL DEFAULT now(), "delete_date" TIMESTAMP, CONSTRAINT "PK_30c2f3bbaf6d34a55f8ae6e4614" PRIMARY KEY ("id"))`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "event"`);
  }
}
