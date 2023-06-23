import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPubkeyKindDTagValueIndex1687507064691
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE INDEX "pubkey_kind_d_tag_value_idx" ON "event" ("pubkey", "kind", "d_tag_value")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "pubkey_kind_d_tag_value_idx"`);
  }
}
