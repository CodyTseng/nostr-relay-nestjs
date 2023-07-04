import { MigrationInterface, QueryRunner } from 'typeorm';

const STANDARD_SINGLE_LETTER_TAG_NAMES = [
  'a',
  'd',
  'e',
  'g',
  'i',
  'l',
  'L',
  'p',
  'r',
  't',
];

export class AddGenericTagsColumn1688478617771 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "event" ADD "generic_tags" text array NOT NULL DEFAULT '{}'`,
    );
    await queryRunner.query(
      `CREATE INDEX "generic_tags_idx" ON "event" USING GIN ("generic_tags")`,
    );

    const limit = 100;
    let results: { id: string; tags: string[][]; created_at: string }[] = [],
      until = Math.ceil(Date.now() / 1000).toString();
    do {
      results = await queryRunner.query(
        `SELECT "id", "tags", "created_at" from "event" where "created_at" < ${until} ORDER BY "created_at" DESC LIMIT ${limit}`,
      );
      await Promise.all(
        results.map(async (item) => {
          const genericTagSet = new Set<string>();
          item.tags.forEach(([tagName, tagValue]) => {
            if (/^[a-zA-Z]$/.test(tagName)) {
              genericTagSet.add(`${tagName}:${tagValue}`);
            }
          });
          if (genericTagSet.size === 0) return;

          const genericTags = [...genericTagSet];
          await queryRunner.query(
            `UPDATE "event" SET "generic_tags" = ARRAY[${genericTags
              .map((i) => `'${i}'`)
              .join(',')}] WHERE "id" = '${item.id}'`,
          );
        }),
      );
      until = results[results.length - 1].created_at;
    } while (results.length >= limit);

    await Promise.all(
      STANDARD_SINGLE_LETTER_TAG_NAMES.map((tagName) =>
        queryRunner.query(`DROP INDEX "public"."${tagName}_idx"`),
      ),
    );
    await Promise.all(
      STANDARD_SINGLE_LETTER_TAG_NAMES.map((tagName) =>
        queryRunner.query(`ALTER TABLE "event" DROP COLUMN "${tagName}"`),
      ),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await Promise.all(
      STANDARD_SINGLE_LETTER_TAG_NAMES.map((tagName) =>
        queryRunner.query(
          `ALTER TABLE "event" ADD "${tagName}" text array NOT NULL DEFAULT '{}'`,
        ),
      ),
    );
    await Promise.all(
      STANDARD_SINGLE_LETTER_TAG_NAMES.map((tagName) =>
        queryRunner.query(
          `CREATE INDEX "${tagName}_idx" ON "event" ("${tagName}") `,
        ),
      ),
    );

    const limit = 100;
    let results: { id: string; tags: string[][]; created_at: string }[] = [],
      until = Math.ceil(Date.now() / 1000).toString();
    do {
      results = await queryRunner.query(
        `SELECT "id", "tags", "created_at" from "event" where "created_at" < ${until} ORDER BY "created_at" DESC LIMIT ${limit}`,
      );
      await Promise.all(
        results.map(async (item) => {
          const standardTagsMap: Record<string, string[]> = {};
          item.tags.forEach(([tagName, tagValue]) => {
            if (!STANDARD_SINGLE_LETTER_TAG_NAMES.includes(tagName)) return;
            if (standardTagsMap[tagName]) {
              standardTagsMap[tagName].push(tagValue);
            } else {
              standardTagsMap[tagName] = [tagValue];
            }
          });

          return queryRunner.query(
            `UPDATE "event" SET ${Object.entries(standardTagsMap)
              .map(([tagName, tagValues]) => {
                return `"${tagName}" = ARRAY[${tagValues
                  .map((i) => `'${i}'`)
                  .join(',')}]`;
              })
              .join(',')} WHERE "id" = '${item.id}'`,
          );
        }),
      );
      until = results[results.length - 1].created_at;
    } while (results.length >= limit);

    await queryRunner.query(`DROP INDEX "public"."generic_tags_idx"`);
    await queryRunner.query(`ALTER TABLE "event" DROP COLUMN "generic_tags"`);
  }
}
