import { MigrationInterface, QueryRunner } from 'typeorm';

export class DropTagIndex1684856154100 implements MigrationInterface {
  name = 'DropTagIndex1684856154100';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "public"."a-idx"`);
    await queryRunner.query(`DROP INDEX "public"."b-idx"`);
    await queryRunner.query(`DROP INDEX "public"."c-idx"`);
    await queryRunner.query(`DROP INDEX "public"."d-idx"`);
    await queryRunner.query(`DROP INDEX "public"."e-idx"`);
    await queryRunner.query(`DROP INDEX "public"."f-idx"`);
    await queryRunner.query(`DROP INDEX "public"."g-idx"`);
    await queryRunner.query(`DROP INDEX "public"."h-idx"`);
    await queryRunner.query(`DROP INDEX "public"."i-idx"`);
    await queryRunner.query(`DROP INDEX "public"."j-idx"`);
    await queryRunner.query(`DROP INDEX "public"."k-idx"`);
    await queryRunner.query(`DROP INDEX "public"."l-idx"`);
    await queryRunner.query(`DROP INDEX "public"."m-idx"`);
    await queryRunner.query(`DROP INDEX "public"."n-idx"`);
    await queryRunner.query(`DROP INDEX "public"."o-idx"`);
    await queryRunner.query(`DROP INDEX "public"."p-idx"`);
    await queryRunner.query(`DROP INDEX "public"."q-idx"`);
    await queryRunner.query(`DROP INDEX "public"."r-idx"`);
    await queryRunner.query(`DROP INDEX "public"."s-idx"`);
    await queryRunner.query(`DROP INDEX "public"."t-idx"`);
    await queryRunner.query(`DROP INDEX "public"."u-idx"`);
    await queryRunner.query(`DROP INDEX "public"."v-idx"`);
    await queryRunner.query(`DROP INDEX "public"."w-idx"`);
    await queryRunner.query(`DROP INDEX "public"."x-idx"`);
    await queryRunner.query(`DROP INDEX "public"."y-idx"`);
    await queryRunner.query(`DROP INDEX "public"."z-idx"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE INDEX "z-idx" ON "event" ("z") `);
    await queryRunner.query(`CREATE INDEX "y-idx" ON "event" ("y") `);
    await queryRunner.query(`CREATE INDEX "x-idx" ON "event" ("x") `);
    await queryRunner.query(`CREATE INDEX "w-idx" ON "event" ("w") `);
    await queryRunner.query(`CREATE INDEX "v-idx" ON "event" ("v") `);
    await queryRunner.query(`CREATE INDEX "u-idx" ON "event" ("u") `);
    await queryRunner.query(`CREATE INDEX "t-idx" ON "event" ("t") `);
    await queryRunner.query(`CREATE INDEX "s-idx" ON "event" ("s") `);
    await queryRunner.query(`CREATE INDEX "r-idx" ON "event" ("r") `);
    await queryRunner.query(`CREATE INDEX "q-idx" ON "event" ("q") `);
    await queryRunner.query(`CREATE INDEX "p-idx" ON "event" ("p") `);
    await queryRunner.query(`CREATE INDEX "o-idx" ON "event" ("o") `);
    await queryRunner.query(`CREATE INDEX "n-idx" ON "event" ("n") `);
    await queryRunner.query(`CREATE INDEX "m-idx" ON "event" ("m") `);
    await queryRunner.query(`CREATE INDEX "l-idx" ON "event" ("l") `);
    await queryRunner.query(`CREATE INDEX "k-idx" ON "event" ("k") `);
    await queryRunner.query(`CREATE INDEX "j-idx" ON "event" ("j") `);
    await queryRunner.query(`CREATE INDEX "i-idx" ON "event" ("i") `);
    await queryRunner.query(`CREATE INDEX "h-idx" ON "event" ("h") `);
    await queryRunner.query(`CREATE INDEX "g-idx" ON "event" ("g") `);
    await queryRunner.query(`CREATE INDEX "f-idx" ON "event" ("f") `);
    await queryRunner.query(`CREATE INDEX "e-idx" ON "event" ("e") `);
    await queryRunner.query(`CREATE INDEX "d-idx" ON "event" ("d") `);
    await queryRunner.query(`CREATE INDEX "c-idx" ON "event" ("c") `);
    await queryRunner.query(`CREATE INDEX "b-idx" ON "event" ("b") `);
    await queryRunner.query(`CREATE INDEX "a-idx" ON "event" ("a") `);
  }
}
