import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddEmptyDTagValueToReplaceableEvents1695447388041
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `UPDATE "events" SET "d_tag_value" = '' WHERE "kind" >= 10000 AND "kind" < 20000`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `UPDATE "events" SET "d_tag_value" = NULL WHERE "kind" >= 10000 AND "kind" < 20000`,
    );
  }
}
