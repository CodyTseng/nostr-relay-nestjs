import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddLColumn1688139748266 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "event" ADD "L" text array NOT NULL DEFAULT '{}'`,
    );
    await queryRunner.query(`CREATE INDEX "L_idx" ON "event" USING GIN ("L")`);

    const limit = 100;
    let results: { id: string; tags: string[][]; created_at: string }[] = [],
      until = Math.ceil(Date.now() / 1000).toString();
    do {
      results = await queryRunner.query(
        `SELECT "id", "tags", "created_at" from "event" where "tags" @> '[["L"]]' and "created_at" < ${until} ORDER BY "created_at" DESC LIMIT ${limit}`,
      );
      await Promise.all(
        results.map(async (item) => {
          const L: string[] = [];
          item.tags.forEach(([tagName, tagValue]) => {
            if (tagName === 'L') L.push(tagValue);
          });
          await queryRunner.query(
            `UPDATE "event" SET "L" = ARRAY[${L.map((i) => `'${i}'`).join(
              ',',
            )}] WHERE "id" = '${item.id}'`,
          );
        }),
      );
      until = results[results.length - 1].created_at;
    } while (results.length >= limit);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "L_idx"`);
    await queryRunner.query(`ALTER TABLE "event" DROP COLUMN "L"`);
  }
}
