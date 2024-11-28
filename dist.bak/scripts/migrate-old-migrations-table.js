"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.migrateMigrationsTable = migrateMigrationsTable;
const kysely_1 = require("kysely");
async function migrateMigrationsTable(db) {
    const oldMigrationsTableExistsResult = await (0, kysely_1.sql) `
    SELECT EXISTS (
      SELECT 1
      FROM information_schema.tables
      WHERE table_name = 'migrations'
    )
  `.execute(db);
    if (!oldMigrationsTableExistsResult.rows[0].exists) {
        return;
    }
    const newMigrationsTableExistsResult = await (0, kysely_1.sql) `
    SELECT EXISTS (
      SELECT 1
      FROM information_schema.tables
      WHERE table_name = 'kysely_migrations'
    )
  `.execute(db);
    if (newMigrationsTableExistsResult.rows[0].exists) {
        return;
    }
    await db.schema
        .createTable('kysely_migrations')
        .addColumn('name', 'varchar(255)', (col) => col.primaryKey())
        .addColumn('timestamp', 'varchar(255)', (col) => col.notNull())
        .execute();
    const oldMigrations = await db
        .selectFrom('migrations')
        .select(['name', 'timestamp'])
        .execute();
    function convertMigrationName(input) {
        const match = input.match(/(\d+)$/);
        if (!match) {
            throw new Error('Invalid input format');
        }
        const timestamp = match[1];
        let name = input.slice(0, -timestamp.length);
        name = name.replace(/([A-Z])/g, '-$1').toLowerCase();
        return `${timestamp}${name}`;
    }
    const formattedOldMigrations = oldMigrations
        .map((it) => ({
        name: convertMigrationName(it.name),
        timestamp: new Date(parseInt(it.timestamp)).toISOString(),
    }))
        .sort((a, b) => a.name.localeCompare(b.name));
    console.log('migrating old migrations to new table');
    await db.transaction().execute(async (trx) => {
        for (const migration of formattedOldMigrations) {
            console.log(`migrating ${migration.name}, ${migration.timestamp}`);
            await trx.insertInto('kysely_migrations').values(migration).execute();
        }
    });
}
//# sourceMappingURL=migrate-old-migrations-table.js.map