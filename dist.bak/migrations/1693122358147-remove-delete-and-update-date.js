"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.up = up;
exports.down = down;
const kysely_1 = require("kysely");
async function up(db) {
    await (0, kysely_1.sql) `ALTER TABLE "events" DROP COLUMN "update_date"`.execute(db);
    await (0, kysely_1.sql) `ALTER TABLE "events" DROP COLUMN "delete_date"`.execute(db);
}
async function down(db) {
    await (0, kysely_1.sql) `ALTER TABLE "events" ADD "delete_date" TIMESTAMP`.execute(db);
    await (0, kysely_1.sql) `ALTER TABLE "events" ADD "update_date" TIMESTAMP NOT NULL DEFAULT now()`.execute(db);
}
//# sourceMappingURL=1693122358147-remove-delete-and-update-date.js.map