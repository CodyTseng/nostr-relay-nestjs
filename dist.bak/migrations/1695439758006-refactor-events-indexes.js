"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.up = up;
exports.down = down;
const kysely_1 = require("kysely");
async function up(db) {
    await (0, kysely_1.sql) `DROP INDEX "public"."generic_tags_kind_idx"`.execute(db);
    await (0, kysely_1.sql) `DROP INDEX "public"."created_at_kind_idx"`.execute(db);
    await (0, kysely_1.sql) `DROP INDEX "public"."author_kind_created_at_idx"`.execute(db);
    await (0, kysely_1.sql) `DROP EXTENSION "btree_gin"`.execute(db);
    await (0, kysely_1.sql) `CREATE INDEX "e_created_at_idx" ON "events" ("created_at") `.execute(db);
    await (0, kysely_1.sql) `CREATE INDEX "e_kind_created_at_idx" ON "events" ("kind", "created_at") `.execute(db);
    await (0, kysely_1.sql) `CREATE UNIQUE INDEX "e_author_kind_d_tag_value_created_at_idx" ON "events" ("author", "kind", "d_tag_value", "created_at") `.execute(db);
    await (0, kysely_1.sql) `CREATE INDEX "e_author_created_at_idx" ON "events" ("author", "created_at") `.execute(db);
    await (0, kysely_1.sql) `CREATE INDEX "e_author_kind_created_at_idx" ON "events" ("author", "kind", "created_at") `.execute(db);
}
async function down(db) {
    await (0, kysely_1.sql) `DROP INDEX "public"."e_author_kind_created_at_idx"`.execute(db);
    await (0, kysely_1.sql) `DROP INDEX "public"."e_author_created_at_idx"`.execute(db);
    await (0, kysely_1.sql) `DROP INDEX "public"."e_author_kind_d_tag_value_created_at_idx"`.execute(db);
    await (0, kysely_1.sql) `DROP INDEX "public"."e_kind_created_at_idx"`.execute(db);
    await (0, kysely_1.sql) `DROP INDEX "public"."e_created_at_idx"`.execute(db);
    await (0, kysely_1.sql) `CREATE EXTENSION IF NOT EXISTS btree_gin`.execute(db);
    await (0, kysely_1.sql) `CREATE INDEX "author_kind_created_at_idx" ON "events" ("created_at", "kind", "author") `.execute(db);
    await (0, kysely_1.sql) `CREATE INDEX "created_at_kind_idx" ON "events" ("created_at", "kind") `.execute(db);
    await (0, kysely_1.sql) `CREATE INDEX "generic_tags_kind_idx" ON "events" USING gin ("generic_tags", "kind")`.execute(db);
}
//# sourceMappingURL=1695439758006-refactor-events-indexes.js.map