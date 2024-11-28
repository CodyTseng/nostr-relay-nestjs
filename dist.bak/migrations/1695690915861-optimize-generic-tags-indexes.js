"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.up = up;
exports.down = down;
const kysely_1 = require("kysely");
async function up(db) {
    await (0, kysely_1.sql) `DROP INDEX "public"."g_tag_kind_created_at_idx"`.execute(db);
    await (0, kysely_1.sql) `DROP INDEX "public"."g_tag_created_at_idx"`.execute(db);
    await (0, kysely_1.sql) `CREATE INDEX "g_tag_kind_created_at_event_id_idx" ON "generic_tags" ("tag", "kind", "created_at", "event_id") `.execute(db);
    await (0, kysely_1.sql) `CREATE INDEX "g_tag_created_at_event_id_idx" ON "generic_tags" ("tag", "created_at", "event_id") `.execute(db);
}
async function down(db) {
    await (0, kysely_1.sql) `DROP INDEX "public"."g_tag_created_at_event_id_idx"`.execute(db);
    await (0, kysely_1.sql) `DROP INDEX "public"."g_tag_kind_created_at_event_id_idx"`.execute(db);
    await (0, kysely_1.sql) `CREATE INDEX "g_tag_created_at_idx" ON "generic_tags" ("tag", "created_at") `.execute(db);
    await (0, kysely_1.sql) `CREATE INDEX "g_tag_kind_created_at_idx" ON "generic_tags" ("tag", "kind", "created_at") `.execute(db);
}
//# sourceMappingURL=1695690915861-optimize-generic-tags-indexes.js.map