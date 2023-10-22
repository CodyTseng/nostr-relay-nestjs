import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddAuthorColumn1694441565602 implements MigrationInterface {
  name = 'AddAuthorColumn1694441565602';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "public"."pubkey_kind_created_at_idx"`);
    await queryRunner.query(
      `DROP INDEX "public"."delegator_kind_created_at_idx"`,
    );
    await queryRunner.query(
      `ALTER TABLE "events" RENAME COLUMN "delegator" TO "author"`,
    );
    await queryRunner.query(
      `UPDATE "events" SET "author" = "pubkey" WHERE "author" IS NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "events" ALTER COLUMN "author" SET NOT NULL`,
    );
    await queryRunner.query(
      `CREATE INDEX "author_kind_created_at_idx" ON "events" ("author", "kind", "created_at")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "public"."author_kind_created_at_idx"`);
    await queryRunner.query(
      `ALTER TABLE "events" ALTER COLUMN "author" DROP NOT NULL`,
    );
    await queryRunner.query(
      `UPDATE "events" SET "author" = NULL WHERE "author" = "pubkey"`,
    );
    await queryRunner.query(
      `ALTER TABLE "events" RENAME COLUMN "author" TO "delegator"`,
    );
    await queryRunner.query(
      `CREATE INDEX "delegator_kind_created_at_idx" ON "events" ("delegator", "kind", "created_at") `,
    );
    await queryRunner.query(
      `CREATE INDEX "pubkey_kind_created_at_idx" ON "events" ("pubkey", "kind", "created_at") `,
    );
  }
}
