import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateExpiredAtIndex1708354541968 implements MigrationInterface {
  name = 'CreateExpiredAtIndex1708354541968';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE INDEX "e_expired_at_idx" ON "events" ("expired_at") `,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "public"."e_expired_at_idx"`);
  }
}
