import { MigrationInterface, QueryRunner } from 'typeorm';

export class RefactorGenericTagsUniqueIdx1695480500024
  implements MigrationInterface
{
  name = 'RefactorGenericTagsUniqueIdx1695480500024';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "public"."g_tag_event_id_idx"`);
    await queryRunner.query(
      `CREATE UNIQUE INDEX "g_event_id_tag_idx" ON "generic_tags" ("event_id", "tag") `,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "public"."g_event_id_tag_idx"`);
    await queryRunner.query(
      `CREATE UNIQUE INDEX "g_tag_event_id_idx" ON "generic_tags" ("tag", "event_id") `,
    );
  }
}
