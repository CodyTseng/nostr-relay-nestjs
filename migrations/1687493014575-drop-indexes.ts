import { MigrationInterface, QueryRunner } from 'typeorm';

export class DropIndexes1687493014575 implements MigrationInterface {
  name = 'DropIndexes1687493014575';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "public"."pubkey-idx"`);
    await queryRunner.query(`DROP INDEX "public"."create_at-idx"`);
    await queryRunner.query(`DROP INDEX "public"."kind-idx"`);
    await queryRunner.query(`DROP INDEX "public"."d_tag_value-idx"`);
    await queryRunner.query(`DROP INDEX "public"."delegator-idx"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE INDEX "delegator-idx" ON "event" ("delegator") `,
    );
    await queryRunner.query(
      `CREATE INDEX "d_tag_value-idx" ON "event" ("d_tag_value") `,
    );
    await queryRunner.query(`CREATE INDEX "kind-idx" ON "event" ("kind") `);
    await queryRunner.query(
      `CREATE INDEX "create_at-idx" ON "event" ("created_at") `,
    );
    await queryRunner.query(`CREATE INDEX "pubkey-idx" ON "event" ("pubkey") `);
  }
}
