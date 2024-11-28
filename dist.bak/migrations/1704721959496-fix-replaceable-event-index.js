"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.up = up;
exports.down = down;
const kysely_1 = require("kysely");
async function up(db) {
    await (0, kysely_1.sql) `DROP INDEX "public"."e_author_kind_d_tag_value_created_at_idx"`.execute(db);
    await (0, kysely_1.sql) `ALTER TABLE "generic_tags" DROP CONSTRAINT "FK_5c845879328f9e991bbb43ef96a"`.execute(db);
    await (0, kysely_1.sql) `CREATE UNIQUE INDEX "e_author_kind_d_tag_value_idx" ON "events" ("author", "kind", "d_tag_value") WHERE "d_tag_value" IS NOT NULL`.execute(db);
    await (0, kysely_1.sql) `ALTER TABLE "generic_tags" ADD CONSTRAINT "FK_5c845879328f9e991bbb43ef96a" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE`.execute(db);
}
async function down(db) {
    await (0, kysely_1.sql) `ALTER TABLE "generic_tags" DROP CONSTRAINT "FK_5c845879328f9e991bbb43ef96a"`.execute(db);
    await (0, kysely_1.sql) `DROP INDEX "public"."e_author_kind_d_tag_value_idx"`.execute(db);
    await (0, kysely_1.sql) `ALTER TABLE "generic_tags" ADD CONSTRAINT "FK_5c845879328f9e991bbb43ef96a" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE NO ACTION`.execute(db);
    await (0, kysely_1.sql) `CREATE UNIQUE INDEX "e_author_kind_d_tag_value_created_at_idx" ON "events" ("created_at", "kind", "d_tag_value", "author") `.execute(db);
}
//# sourceMappingURL=1704721959496-fix-replaceable-event-index.js.map