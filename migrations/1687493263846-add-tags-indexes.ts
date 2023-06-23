import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddTagsIndexes1687493263846 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE INDEX "a_idx" ON "event" USING GIN ("a")`);
    await queryRunner.query(`CREATE INDEX "b_idx" ON "event" USING GIN ("b")`);
    await queryRunner.query(`CREATE INDEX "c_idx" ON "event" USING GIN ("c")`);
    await queryRunner.query(`CREATE INDEX "d_idx" ON "event" USING GIN ("d")`);
    await queryRunner.query(`CREATE INDEX "e_idx" ON "event" USING GIN ("e")`);
    await queryRunner.query(`CREATE INDEX "f_idx" ON "event" USING GIN ("f")`);
    await queryRunner.query(`CREATE INDEX "g_idx" ON "event" USING GIN ("g")`);
    await queryRunner.query(`CREATE INDEX "h_idx" ON "event" USING GIN ("h")`);
    await queryRunner.query(`CREATE INDEX "i_idx" ON "event" USING GIN ("i")`);
    await queryRunner.query(`CREATE INDEX "j_idx" ON "event" USING GIN ("j")`);
    await queryRunner.query(`CREATE INDEX "k_idx" ON "event" USING GIN ("k")`);
    await queryRunner.query(`CREATE INDEX "l_idx" ON "event" USING GIN ("l")`);
    await queryRunner.query(`CREATE INDEX "m_idx" ON "event" USING GIN ("m")`);
    await queryRunner.query(`CREATE INDEX "n_idx" ON "event" USING GIN ("n")`);
    await queryRunner.query(`CREATE INDEX "o_idx" ON "event" USING GIN ("o")`);
    await queryRunner.query(`CREATE INDEX "p_idx" ON "event" USING GIN ("p")`);
    await queryRunner.query(`CREATE INDEX "q_idx" ON "event" USING GIN ("q")`);
    await queryRunner.query(`CREATE INDEX "r_idx" ON "event" USING GIN ("r")`);
    await queryRunner.query(`CREATE INDEX "s_idx" ON "event" USING GIN ("s")`);
    await queryRunner.query(`CREATE INDEX "t_idx" ON "event" USING GIN ("t")`);
    await queryRunner.query(`CREATE INDEX "u_idx" ON "event" USING GIN ("u")`);
    await queryRunner.query(`CREATE INDEX "v_idx" ON "event" USING GIN ("v")`);
    await queryRunner.query(`CREATE INDEX "w_idx" ON "event" USING GIN ("w")`);
    await queryRunner.query(`CREATE INDEX "x_idx" ON "event" USING GIN ("x")`);
    await queryRunner.query(`CREATE INDEX "y_idx" ON "event" USING GIN ("y")`);
    await queryRunner.query(`CREATE INDEX "z_idx" ON "event" USING GIN ("z")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "z_idx"`);
    await queryRunner.query(`DROP INDEX "y_idx"`);
    await queryRunner.query(`DROP INDEX "x_idx"`);
    await queryRunner.query(`DROP INDEX "w_idx"`);
    await queryRunner.query(`DROP INDEX "v_idx"`);
    await queryRunner.query(`DROP INDEX "u_idx"`);
    await queryRunner.query(`DROP INDEX "t_idx"`);
    await queryRunner.query(`DROP INDEX "s_idx"`);
    await queryRunner.query(`DROP INDEX "r_idx"`);
    await queryRunner.query(`DROP INDEX "q_idx"`);
    await queryRunner.query(`DROP INDEX "p_idx"`);
    await queryRunner.query(`DROP INDEX "o_idx"`);
    await queryRunner.query(`DROP INDEX "n_idx"`);
    await queryRunner.query(`DROP INDEX "m_idx"`);
    await queryRunner.query(`DROP INDEX "l_idx"`);
    await queryRunner.query(`DROP INDEX "k_idx"`);
    await queryRunner.query(`DROP INDEX "j_idx"`);
    await queryRunner.query(`DROP INDEX "i_idx"`);
    await queryRunner.query(`DROP INDEX "h_idx"`);
    await queryRunner.query(`DROP INDEX "g_idx"`);
    await queryRunner.query(`DROP INDEX "f_idx"`);
    await queryRunner.query(`DROP INDEX "e_idx"`);
    await queryRunner.query(`DROP INDEX "d_idx"`);
    await queryRunner.query(`DROP INDEX "c_idx"`);
    await queryRunner.query(`DROP INDEX "b_idx"`);
    await queryRunner.query(`DROP INDEX "a_idx"`);
  }
}
