import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateEventTable1684848956237 implements MigrationInterface {
  name = 'CreateEventTable1684848956237';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "event" ("id" character(64) NOT NULL, "pubkey" character(64) NOT NULL, "created_at" bigint NOT NULL, "kind" integer NOT NULL, "tags" jsonb NOT NULL DEFAULT '[]', "content" text NOT NULL DEFAULT '', "sig" character(128) NOT NULL, "expired_at" bigint NOT NULL DEFAULT '9999999999', "d_tag_value" text, "delegator" character(64), "a" text array NOT NULL DEFAULT '{}', "b" text array NOT NULL DEFAULT '{}', "c" text array NOT NULL DEFAULT '{}', "d" text array NOT NULL DEFAULT '{}', "e" text array NOT NULL DEFAULT '{}', "f" text array NOT NULL DEFAULT '{}', "g" text array NOT NULL DEFAULT '{}', "h" text array NOT NULL DEFAULT '{}', "i" text array NOT NULL DEFAULT '{}', "j" text array NOT NULL DEFAULT '{}', "k" text array NOT NULL DEFAULT '{}', "l" text array NOT NULL DEFAULT '{}', "m" text array NOT NULL DEFAULT '{}', "n" text array NOT NULL DEFAULT '{}', "o" text array NOT NULL DEFAULT '{}', "p" text array NOT NULL DEFAULT '{}', "q" text array NOT NULL DEFAULT '{}', "r" text array NOT NULL DEFAULT '{}', "s" text array NOT NULL DEFAULT '{}', "t" text array NOT NULL DEFAULT '{}', "u" text array NOT NULL DEFAULT '{}', "v" text array NOT NULL DEFAULT '{}', "w" text array NOT NULL DEFAULT '{}', "x" text array NOT NULL DEFAULT '{}', "y" text array NOT NULL DEFAULT '{}', "z" text array NOT NULL DEFAULT '{}', "create_date" TIMESTAMP NOT NULL DEFAULT now(), "update_date" TIMESTAMP NOT NULL DEFAULT now(), "delete_date" TIMESTAMP, CONSTRAINT "PK_30c2f3bbaf6d34a55f8ae6e4614" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(`CREATE INDEX "pubkey-idx" ON "event" ("pubkey") `);
    await queryRunner.query(
      `CREATE INDEX "create_at-idx" ON "event" ("created_at") `,
    );
    await queryRunner.query(`CREATE INDEX "kind-idx" ON "event" ("kind") `);
    await queryRunner.query(
      `CREATE INDEX "d_tag_value-idx" ON "event" ("d_tag_value") `,
    );
    await queryRunner.query(
      `CREATE INDEX "delegator-idx" ON "event" ("delegator") `,
    );
    await queryRunner.query(`CREATE INDEX "a-idx" ON "event" ("a") `);
    await queryRunner.query(`CREATE INDEX "b-idx" ON "event" ("b") `);
    await queryRunner.query(`CREATE INDEX "c-idx" ON "event" ("c") `);
    await queryRunner.query(`CREATE INDEX "d-idx" ON "event" ("d") `);
    await queryRunner.query(`CREATE INDEX "e-idx" ON "event" ("e") `);
    await queryRunner.query(`CREATE INDEX "f-idx" ON "event" ("f") `);
    await queryRunner.query(`CREATE INDEX "g-idx" ON "event" ("g") `);
    await queryRunner.query(`CREATE INDEX "h-idx" ON "event" ("h") `);
    await queryRunner.query(`CREATE INDEX "i-idx" ON "event" ("i") `);
    await queryRunner.query(`CREATE INDEX "j-idx" ON "event" ("j") `);
    await queryRunner.query(`CREATE INDEX "k-idx" ON "event" ("k") `);
    await queryRunner.query(`CREATE INDEX "l-idx" ON "event" ("l") `);
    await queryRunner.query(`CREATE INDEX "m-idx" ON "event" ("m") `);
    await queryRunner.query(`CREATE INDEX "n-idx" ON "event" ("n") `);
    await queryRunner.query(`CREATE INDEX "o-idx" ON "event" ("o") `);
    await queryRunner.query(`CREATE INDEX "p-idx" ON "event" ("p") `);
    await queryRunner.query(`CREATE INDEX "q-idx" ON "event" ("q") `);
    await queryRunner.query(`CREATE INDEX "r-idx" ON "event" ("r") `);
    await queryRunner.query(`CREATE INDEX "s-idx" ON "event" ("s") `);
    await queryRunner.query(`CREATE INDEX "t-idx" ON "event" ("t") `);
    await queryRunner.query(`CREATE INDEX "u-idx" ON "event" ("u") `);
    await queryRunner.query(`CREATE INDEX "v-idx" ON "event" ("v") `);
    await queryRunner.query(`CREATE INDEX "w-idx" ON "event" ("w") `);
    await queryRunner.query(`CREATE INDEX "x-idx" ON "event" ("x") `);
    await queryRunner.query(`CREATE INDEX "y-idx" ON "event" ("y") `);
    await queryRunner.query(`CREATE INDEX "z-idx" ON "event" ("z") `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "public"."z-idx"`);
    await queryRunner.query(`DROP INDEX "public"."y-idx"`);
    await queryRunner.query(`DROP INDEX "public"."x-idx"`);
    await queryRunner.query(`DROP INDEX "public"."w-idx"`);
    await queryRunner.query(`DROP INDEX "public"."v-idx"`);
    await queryRunner.query(`DROP INDEX "public"."u-idx"`);
    await queryRunner.query(`DROP INDEX "public"."t-idx"`);
    await queryRunner.query(`DROP INDEX "public"."s-idx"`);
    await queryRunner.query(`DROP INDEX "public"."r-idx"`);
    await queryRunner.query(`DROP INDEX "public"."q-idx"`);
    await queryRunner.query(`DROP INDEX "public"."p-idx"`);
    await queryRunner.query(`DROP INDEX "public"."o-idx"`);
    await queryRunner.query(`DROP INDEX "public"."n-idx"`);
    await queryRunner.query(`DROP INDEX "public"."m-idx"`);
    await queryRunner.query(`DROP INDEX "public"."l-idx"`);
    await queryRunner.query(`DROP INDEX "public"."k-idx"`);
    await queryRunner.query(`DROP INDEX "public"."j-idx"`);
    await queryRunner.query(`DROP INDEX "public"."i-idx"`);
    await queryRunner.query(`DROP INDEX "public"."h-idx"`);
    await queryRunner.query(`DROP INDEX "public"."g-idx"`);
    await queryRunner.query(`DROP INDEX "public"."f-idx"`);
    await queryRunner.query(`DROP INDEX "public"."e-idx"`);
    await queryRunner.query(`DROP INDEX "public"."d-idx"`);
    await queryRunner.query(`DROP INDEX "public"."c-idx"`);
    await queryRunner.query(`DROP INDEX "public"."b-idx"`);
    await queryRunner.query(`DROP INDEX "public"."a-idx"`);
    await queryRunner.query(`DROP INDEX "public"."delegator-idx"`);
    await queryRunner.query(`DROP INDEX "public"."d_tag_value-idx"`);
    await queryRunner.query(`DROP INDEX "public"."kind-idx"`);
    await queryRunner.query(`DROP INDEX "public"."create_at-idx"`);
    await queryRunner.query(`DROP INDEX "public"."pubkey-idx"`);
    await queryRunner.query(`DROP TABLE "event"`);
  }
}
