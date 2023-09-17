import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateGenericTagsTable1694964632118 implements MigrationInterface {
  name = 'CreateGenericTagsTable1694964632118';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "generic_tags" ("id" SERIAL NOT NULL, "tag" text NOT NULL, "created_at" bigint NOT NULL, "eventId" character(64), CONSTRAINT "PK_dd58c903cc9b525d70253989867" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "generic_tags" ADD CONSTRAINT "FK_d76a12a029daf7f2e5481d7cd26" FOREIGN KEY ("eventId") REFERENCES "events"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `CREATE INDEX "tag_created_at_idx" ON "generic_tags" ("tag", "created_at")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "tag_created_at_idx"`);
    await queryRunner.query(
      `ALTER TABLE "generic_tags" DROP CONSTRAINT "FK_d76a12a029daf7f2e5481d7cd26"`,
    );
    await queryRunner.query(`DROP TABLE "generic_tags"`);
  }
}
