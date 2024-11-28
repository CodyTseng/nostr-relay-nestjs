"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.up = up;
exports.down = down;
const kysely_1 = require("kysely");
async function up(db) {
    await (0, kysely_1.sql) `UPDATE "events" SET "d_tag_value" = '' WHERE "kind" >= 10000 AND "kind" < 20000`.execute(db);
}
async function down(db) {
    await (0, kysely_1.sql) `UPDATE "events" SET "d_tag_value" = NULL WHERE "kind" >= 10000 AND "kind" < 20000`.execute(db);
}
//# sourceMappingURL=1695447388041-add-empty-d-tag-value-to-replaceable-events.js.map