"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.up = up;
exports.down = down;
const kysely_1 = require("kysely");
async function up(db) {
    await (0, kysely_1.sql) `CREATE INDEX "e_expired_at_idx" ON "events" ("expired_at") `.execute(db);
}
async function down(db) {
    await (0, kysely_1.sql) `DROP INDEX "public"."e_expired_at_idx"`.execute(db);
}
//# sourceMappingURL=1708354541968-create-expired-at-index.js.map