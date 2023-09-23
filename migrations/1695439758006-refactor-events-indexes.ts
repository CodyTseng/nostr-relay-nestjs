import { MigrationInterface, QueryRunner } from 'typeorm';

export class RefactorEventsIndexes1695439758006 implements MigrationInterface {
  name = 'RefactorEventsIndexes1695439758006';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "public"."generic_tags_kind_idx"`);
    await queryRunner.query(`DROP INDEX "public"."created_at_kind_idx"`);
    await queryRunner.query(`DROP INDEX "public"."author_kind_created_at_idx"`);
    await queryRunner.query(`DROP EXTENSION "btree_gin"`);
    await queryRunner.query(
      `CREATE INDEX "e_created_at_idx" ON "events" ("created_at") `,
    );
    await queryRunner.query(
      `CREATE INDEX "e_kind_created_at_idx" ON "events" ("kind", "created_at") `,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "e_author_kind_d_tag_value_created_at_idx" ON "events" ("author", "kind", "d_tag_value", "created_at") `,
    );
    await queryRunner.query(
      `CREATE INDEX "e_author_created_at_idx" ON "events" ("author", "created_at") `,
    );
    await queryRunner.query(
      `CREATE INDEX "e_author_kind_created_at_idx" ON "events" ("author", "kind", "created_at") `,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX "public"."e_author_kind_created_at_idx"`,
    );
    await queryRunner.query(`DROP INDEX "public"."e_author_created_at_idx"`);
    await queryRunner.query(
      `DROP INDEX "public"."e_author_kind_d_tag_value_created_at_idx"`,
    );
    await queryRunner.query(`DROP INDEX "public"."e_kind_created_at_idx"`);
    await queryRunner.query(`DROP INDEX "public"."e_created_at_idx"`);
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS btree_gin`);
    await queryRunner.query(
      `CREATE INDEX "author_kind_created_at_idx" ON "events" ("created_at", "kind", "author") `,
    );
    await queryRunner.query(
      `CREATE INDEX "created_at_kind_idx" ON "events" ("created_at", "kind") `,
    );
    await queryRunner.query(
      `CREATE INDEX "generic_tags_kind_idx" ON "events" USING gin ("generic_tags", "kind")`,
    );
  }
}
