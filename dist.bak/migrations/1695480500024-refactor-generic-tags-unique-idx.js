"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.up = up;
exports.down = down;
const kysely_1 = require("kysely");
async function up(db) {
    await (0, kysely_1.sql) `DROP INDEX "public"."g_tag_event_id_idx"`.execute(db);
    await (0, kysely_1.sql) `CREATE UNIQUE INDEX "g_event_id_tag_idx" ON "generic_tags" ("event_id", "tag") `.execute(db);
}
async function down(db) {
    await (0, kysely_1.sql) `DROP INDEX "public"."g_event_id_tag_idx"`.execute(db);
    await (0, kysely_1.sql) `CREATE UNIQUE INDEX "g_tag_event_id_idx" ON "generic_tags" ("tag", "event_id") `.execute(db);
}
//# sourceMappingURL=1695480500024-refactor-generic-tags-unique-idx.js.map