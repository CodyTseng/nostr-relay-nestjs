import { MigrationInterface, QueryRunner } from 'typeorm';

export class RefactorTagIndexes1688137006198 implements MigrationInterface {
  name = 'RefactorTagIndexes1688137006198';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "public"."b_idx"`);
    await queryRunner.query(`DROP INDEX "public"."c_idx"`);
    await queryRunner.query(`DROP INDEX "public"."f_idx"`);
    await queryRunner.query(`DROP INDEX "public"."h_idx"`);
    await queryRunner.query(`DROP INDEX "public"."j_idx"`);
    await queryRunner.query(`DROP INDEX "public"."k_idx"`);
    await queryRunner.query(`DROP INDEX "public"."m_idx"`);
    await queryRunner.query(`DROP INDEX "public"."n_idx"`);
    await queryRunner.query(`DROP INDEX "public"."o_idx"`);
    await queryRunner.query(`DROP INDEX "public"."q_idx"`);
    await queryRunner.query(`DROP INDEX "public"."s_idx"`);
    await queryRunner.query(`DROP INDEX "public"."u_idx"`);
    await queryRunner.query(`DROP INDEX "public"."v_idx"`);
    await queryRunner.query(`DROP INDEX "public"."w_idx"`);
    await queryRunner.query(`DROP INDEX "public"."x_idx"`);
    await queryRunner.query(`DROP INDEX "public"."y_idx"`);
    await queryRunner.query(`DROP INDEX "public"."z_idx"`);
    await queryRunner.query(`ALTER TABLE "event" DROP COLUMN "b"`);
    await queryRunner.query(`ALTER TABLE "event" DROP COLUMN "c"`);
    await queryRunner.query(`ALTER TABLE "event" DROP COLUMN "f"`);
    await queryRunner.query(`ALTER TABLE "event" DROP COLUMN "h"`);
    await queryRunner.query(`ALTER TABLE "event" DROP COLUMN "j"`);
    await queryRunner.query(`ALTER TABLE "event" DROP COLUMN "k"`);
    await queryRunner.query(`ALTER TABLE "event" DROP COLUMN "m"`);
    await queryRunner.query(`ALTER TABLE "event" DROP COLUMN "n"`);
    await queryRunner.query(`ALTER TABLE "event" DROP COLUMN "o"`);
    await queryRunner.query(`ALTER TABLE "event" DROP COLUMN "q"`);
    await queryRunner.query(`ALTER TABLE "event" DROP COLUMN "s"`);
    await queryRunner.query(`ALTER TABLE "event" DROP COLUMN "u"`);
    await queryRunner.query(`ALTER TABLE "event" DROP COLUMN "v"`);
    await queryRunner.query(`ALTER TABLE "event" DROP COLUMN "w"`);
    await queryRunner.query(`ALTER TABLE "event" DROP COLUMN "x"`);
    await queryRunner.query(`ALTER TABLE "event" DROP COLUMN "y"`);
    await queryRunner.query(`ALTER TABLE "event" DROP COLUMN "z"`);
    await queryRunner.query(
      `CREATE INDEX "tags_idx" ON "event" USING GIN ("tags")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "tags_idx"`);
    await queryRunner.query(
      `ALTER TABLE "event" ADD "z" text array NOT NULL DEFAULT '{}'`,
    );
    await queryRunner.query(
      `ALTER TABLE "event" ADD "y" text array NOT NULL DEFAULT '{}'`,
    );
    await queryRunner.query(
      `ALTER TABLE "event" ADD "x" text array NOT NULL DEFAULT '{}'`,
    );
    await queryRunner.query(
      `ALTER TABLE "event" ADD "w" text array NOT NULL DEFAULT '{}'`,
    );
    await queryRunner.query(
      `ALTER TABLE "event" ADD "v" text array NOT NULL DEFAULT '{}'`,
    );
    await queryRunner.query(
      `ALTER TABLE "event" ADD "u" text array NOT NULL DEFAULT '{}'`,
    );
    await queryRunner.query(
      `ALTER TABLE "event" ADD "s" text array NOT NULL DEFAULT '{}'`,
    );
    await queryRunner.query(
      `ALTER TABLE "event" ADD "q" text array NOT NULL DEFAULT '{}'`,
    );
    await queryRunner.query(
      `ALTER TABLE "event" ADD "o" text array NOT NULL DEFAULT '{}'`,
    );
    await queryRunner.query(
      `ALTER TABLE "event" ADD "n" text array NOT NULL DEFAULT '{}'`,
    );
    await queryRunner.query(
      `ALTER TABLE "event" ADD "m" text array NOT NULL DEFAULT '{}'`,
    );
    await queryRunner.query(
      `ALTER TABLE "event" ADD "k" text array NOT NULL DEFAULT '{}'`,
    );
    await queryRunner.query(
      `ALTER TABLE "event" ADD "j" text array NOT NULL DEFAULT '{}'`,
    );
    await queryRunner.query(
      `ALTER TABLE "event" ADD "h" text array NOT NULL DEFAULT '{}'`,
    );
    await queryRunner.query(
      `ALTER TABLE "event" ADD "f" text array NOT NULL DEFAULT '{}'`,
    );
    await queryRunner.query(
      `ALTER TABLE "event" ADD "c" text array NOT NULL DEFAULT '{}'`,
    );
    await queryRunner.query(
      `ALTER TABLE "event" ADD "b" text array NOT NULL DEFAULT '{}'`,
    );
    await queryRunner.query(`CREATE INDEX "z_idx" ON "event" ("z") `);
    await queryRunner.query(`CREATE INDEX "y_idx" ON "event" ("y") `);
    await queryRunner.query(`CREATE INDEX "x_idx" ON "event" ("x") `);
    await queryRunner.query(`CREATE INDEX "w_idx" ON "event" ("w") `);
    await queryRunner.query(`CREATE INDEX "v_idx" ON "event" ("v") `);
    await queryRunner.query(`CREATE INDEX "u_idx" ON "event" ("u") `);
    await queryRunner.query(`CREATE INDEX "s_idx" ON "event" ("s") `);
    await queryRunner.query(`CREATE INDEX "q_idx" ON "event" ("q") `);
    await queryRunner.query(`CREATE INDEX "o_idx" ON "event" ("o") `);
    await queryRunner.query(`CREATE INDEX "n_idx" ON "event" ("n") `);
    await queryRunner.query(`CREATE INDEX "m_idx" ON "event" ("m") `);
    await queryRunner.query(`CREATE INDEX "k_idx" ON "event" ("k") `);
    await queryRunner.query(`CREATE INDEX "j_idx" ON "event" ("j") `);
    await queryRunner.query(`CREATE INDEX "h_idx" ON "event" ("h") `);
    await queryRunner.query(`CREATE INDEX "f_idx" ON "event" ("f") `);
    await queryRunner.query(`CREATE INDEX "c_idx" ON "event" ("c") `);
    await queryRunner.query(`CREATE INDEX "b_idx" ON "event" ("b") `);
  }
}
