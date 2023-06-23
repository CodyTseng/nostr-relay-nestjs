import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCreatedAtKindPubkeyDelegatorIndex1687494219898
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE INDEX "create_at_kind_pubkey_delegator_idx" ON "event" ("created_at", "kind", "pubkey", "delegator")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "create_at_kind_pubkey_delegator_idx"`);
  }
}
