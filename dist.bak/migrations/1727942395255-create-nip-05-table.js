"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.up = up;
exports.down = down;
const kysely_1 = require("kysely");
async function up(db) {
    await db.schema
        .createTable('nip05')
        .addColumn('name', 'varchar(20)', (col) => col.primaryKey())
        .addColumn('pubkey', 'char(64)', (col) => col.notNull())
        .addColumn('create_date', 'timestamp', (col) => col.defaultTo((0, kysely_1.sql) `now()`).notNull())
        .execute();
}
async function down(db) {
    await db.schema.dropTable('nip05').execute();
}
//# sourceMappingURL=1727942395255-create-nip-05-table.js.map