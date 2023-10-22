import { MigrationInterface, QueryRunner } from 'typeorm';

export class OptimizeGenericTagsIndexes1695690915861
  implements MigrationInterface
{
  name = 'OptimizeGenericTagsIndexes1695690915861';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "public"."g_tag_kind_created_at_idx"`);
    await queryRunner.query(`DROP INDEX "public"."g_tag_created_at_idx"`);
    await queryRunner.query(
      `CREATE INDEX "g_tag_kind_created_at_event_id_idx" ON "generic_tags" ("tag", "kind", "created_at", "event_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "g_tag_created_at_event_id_idx" ON "generic_tags" ("tag", "created_at", "event_id") `,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX "public"."g_tag_created_at_event_id_idx"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."g_tag_kind_created_at_event_id_idx"`,
    );
    await queryRunner.query(
      `CREATE INDEX "g_tag_created_at_idx" ON "generic_tags" ("tag", "created_at") `,
    );
    await queryRunner.query(
      `CREATE INDEX "g_tag_kind_created_at_idx" ON "generic_tags" ("tag", "kind", "created_at") `,
    );
  }
}
