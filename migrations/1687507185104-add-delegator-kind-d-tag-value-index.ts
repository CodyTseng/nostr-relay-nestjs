import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddDelegatorKindDTagValueIndex1687507185104
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE INDEX "delegator_kind_d_tag_value_idx" ON "event" ("delegator", "kind", "d_tag_value")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "delegator_kind_d_tag_value_idx"`);
  }
}
