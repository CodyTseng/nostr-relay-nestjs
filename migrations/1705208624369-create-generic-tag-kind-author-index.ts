import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateGenericTagKindAuthorIndex1705208624369
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE INDEX "g_tag_kind_author_created_at_desc_event_id_idx" ON "generic_tags" ("tag", "kind", "author", "created_at" DESC, "event_id") `,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX "public"."g_tag_kind_author_created_at_desc_event_id_idx"`,
    );
  }
}
