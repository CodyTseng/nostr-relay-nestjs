"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.up = up;
exports.down = down;
const kysely_1 = require("kysely");
async function up(db) {
    await (0, kysely_1.sql) `DROP INDEX "public"."pubkey_kind_created_at_idx"`.execute(db);
    await (0, kysely_1.sql) `DROP INDEX "public"."delegator_kind_created_at_idx"`.execute(db);
    await (0, kysely_1.sql) `ALTER TABLE "events" RENAME COLUMN "delegator" TO "author"`.execute(db);
    await (0, kysely_1.sql) `UPDATE "events" SET "author" = "pubkey" WHERE "author" IS NULL`.execute(db);
    await (0, kysely_1.sql) `ALTER TABLE "events" ALTER COLUMN "author" SET NOT NULL`.execute(db);
    await (0, kysely_1.sql) `CREATE INDEX "author_kind_created_at_idx" ON "events" ("author", "kind", "created_at")`.execute(db);
}
async function down(db) {
    await (0, kysely_1.sql) `DROP INDEX "public"."author_kind_created_at_idx"`.execute(db);
    await (0, kysely_1.sql) `ALTER TABLE "events" ALTER COLUMN "author" DROP NOT NULL`.execute(db);
    await (0, kysely_1.sql) `UPDATE "events" SET "author" = NULL WHERE "author" = "pubkey"`.execute(db);
    await (0, kysely_1.sql) `ALTER TABLE "events" RENAME COLUMN "author" TO "delegator"`.execute(db);
    await (0, kysely_1.sql) `CREATE INDEX "delegator_kind_created_at_idx" ON "events" ("delegator", "kind", "created_at") `.execute(db);
    await (0, kysely_1.sql) `CREATE INDEX "pubkey_kind_created_at_idx" ON "events" ("pubkey", "kind", "created_at") `.execute(db);
}
//# sourceMappingURL=1694441565602-add-author-column.js.map