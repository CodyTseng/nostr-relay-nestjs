import { MigrationInterface, QueryRunner } from 'typeorm';

export class FixReplaceableEventIndex1704721959496
  implements MigrationInterface
{
  name = 'FixReplaceableEventIndex1704721959496';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX "public"."e_author_kind_d_tag_value_created_at_idx"`,
    );
    await queryRunner.query(
      `ALTER TABLE "generic_tags" DROP CONSTRAINT "FK_5c845879328f9e991bbb43ef96a"`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "e_author_kind_d_tag_value_idx" ON "events" ("author", "kind", "d_tag_value") WHERE "d_tag_value" IS NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "generic_tags" ADD CONSTRAINT "FK_5c845879328f9e991bbb43ef96a" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "generic_tags" DROP CONSTRAINT "FK_5c845879328f9e991bbb43ef96a"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."e_author_kind_d_tag_value_idx"`,
    );
    await queryRunner.query(
      `ALTER TABLE "generic_tags" ADD CONSTRAINT "FK_5c845879328f9e991bbb43ef96a" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "e_author_kind_d_tag_value_created_at_idx" ON "events" ("created_at", "kind", "d_tag_value", "author") `,
    );
  }
}
