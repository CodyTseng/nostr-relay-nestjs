import { MigrationInterface, QueryRunner } from 'typeorm';

export class GenericTagsCreatedAtIndexesDesc1696130943084
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX "public"."g_tag_created_at_event_id_idx"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."g_tag_kind_created_at_event_id_idx"`,
    );
    await queryRunner.query(
      `CREATE INDEX "g_tag_kind_created_at_desc_event_id_idx" ON "generic_tags" ("tag", "kind", "created_at" DESC, "event_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "g_tag_created_at_desc_event_id_idx" ON "generic_tags" ("tag", "created_at" DESC, "event_id") `,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX "public"."g_tag_kind_created_at_desc_event_id_idx"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."g_tag_created_at_desc_event_id_idx"`,
    );
    await queryRunner.query(
      `CREATE INDEX "g_tag_kind_created_at_event_id_idx" ON "generic_tags" ("tag", "kind", "created_at", "event_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "g_tag_created_at_event_id_idx" ON "generic_tags" ("tag", "created_at", "event_id") `,
    );
  }
}
