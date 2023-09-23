import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateGenericTagsTable1695096642043 implements MigrationInterface {
  name = 'CreateGenericTagsTable1695096642043';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "generic_tags" ("id" SERIAL NOT NULL, "tag" text NOT NULL, "author" character(64) NOT NULL, "kind" integer NOT NULL, "event_id" character(64) NOT NULL, "created_at" bigint NOT NULL, CONSTRAINT "PK_dd58c903cc9b525d70253989867" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "g_tag_event_id_idx" ON "generic_tags" ("tag", "event_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "g_tag_kind_created_at_idx" ON "generic_tags" ("tag", "kind", "created_at") `,
    );
    await queryRunner.query(
      `CREATE INDEX "g_tag_created_at_idx" ON "generic_tags" ("tag", "created_at") `,
    );
    await queryRunner.query(
      `ALTER TABLE "generic_tags" ADD CONSTRAINT "FK_5c845879328f9e991bbb43ef96a" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "generic_tags" DROP CONSTRAINT "FK_5c845879328f9e991bbb43ef96a"`,
    );
    await queryRunner.query(`DROP INDEX "public"."g_tag_created_at_idx"`);
    await queryRunner.query(`DROP INDEX "public"."g_tag_kind_created_at_idx"`);
    await queryRunner.query(`DROP INDEX "public"."g_tag_event_id_idx"`);
    await queryRunner.query(`DROP TABLE "generic_tags"`);
  }
}
