"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.up = up;
exports.down = down;
const kysely_1 = require("kysely");
async function up(db) {
    await (0, kysely_1.sql) `ALTER TABLE "generic_tags" DROP CONSTRAINT "FK_5c845879328f9e991bbb43ef96a"`.execute(db);
    await (0, kysely_1.sql) `ALTER TABLE "generic_tags" ADD CONSTRAINT "FK_5c845879328f9e991bbb43ef96a" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE NO ACTION`.execute(db);
}
async function down(db) {
    await (0, kysely_1.sql) `ALTER TABLE "generic_tags" DROP CONSTRAINT "FK_5c845879328f9e991bbb43ef96a"`.execute(db);
    await (0, kysely_1.sql) `ALTER TABLE "generic_tags" ADD CONSTRAINT "FK_5c845879328f9e991bbb43ef96a" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`.execute(db);
}
//# sourceMappingURL=1696598218433-cascade-delete.js.map