"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.up = up;
exports.down = down;
const kysely_1 = require("kysely");
async function up(db) {
    await (0, kysely_1.sql) `CREATE INDEX "g_author_tag_kind_created_at_desc_event_id_idx" ON "generic_tags" ("author", "tag", "kind", "created_at" DESC, "event_id") `.execute(db);
}
async function down(db) {
    await (0, kysely_1.sql) `DROP INDEX "public"."g_author_tag_kind_created_at_desc_event_id_idx"`.execute(db);
}
//# sourceMappingURL=1705208624369-create-generic-tag-kind-author-index.js.map