import { MigrationInterface, QueryRunner } from 'typeorm';

export class RemoveDeleteAndUpdateDate1693122358147
  implements MigrationInterface
{
  name = 'RemoveDeleteAndUpdateDate1693122358147';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "events" DROP COLUMN "update_date"`);
    await queryRunner.query(`ALTER TABLE "events" DROP COLUMN "delete_date"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "events" ADD "delete_date" TIMESTAMP`);
    await queryRunner.query(
      `ALTER TABLE "events" ADD "update_date" TIMESTAMP NOT NULL DEFAULT now()`,
    );
  }
}
