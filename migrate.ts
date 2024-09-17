import 'dotenv/config';

import { promises as fs } from 'fs';
import {
  FileMigrationProvider,
  Kysely,
  Migrator,
  PostgresDialect,
  sql,
} from 'kysely';
import * as path from 'path';
import { Pool } from 'pg';

async function migrateToLatest() {
  const db = new Kysely<any>({
    dialect: new PostgresDialect({
      pool: new Pool({
        connectionString: process.env.DATABASE_URL,
      }),
    }),
  });

  await migrateMigrationsTable(db);

  const migrator = new Migrator({
    db,
    provider: new FileMigrationProvider({
      fs,
      path,
      // This needs to be an absolute path.
      migrationFolder: path.join(__dirname, './migrations'),
    }),
    migrationTableName: 'kysely_migrations',
  });

  const { error, results } = await migrator.migrateToLatest();

  results?.forEach((it) => {
    if (it.status === 'Success') {
      console.log(`migration "${it.migrationName}" was executed successfully`);
    } else if (it.status === 'Error') {
      console.error(`failed to execute migration "${it.migrationName}"`);
    }
  });

  if (error) {
    console.error('failed to migrate');
    console.error(error);
    process.exit(1);
  }

  await db.destroy();
}

migrateToLatest();

// This function migrates the old migrations table to the new one.
async function migrateMigrationsTable(db: Kysely<any>) {
  const existsQueryResult = await sql<{ exists: boolean }>`
    SELECT EXISTS (
      SELECT 1
      FROM information_schema.tables
      WHERE table_name = 'migrations'
    )
  `.execute(db);
  if (!existsQueryResult.rows[0].exists) {
    return;
  }

  await db.schema
    .createTable('kysely_migrations')
    .ifNotExists()
    .addColumn('name', 'varchar(255)', (col) => col.primaryKey())
    .addColumn('timestamp', 'varchar(255)', (col) => col.notNull())
    .execute();

  const result = await db
    .selectFrom('kysely_migrations')
    .select(({ fn }) => fn.countAll<number>().as('count'))
    .execute();

  if (result[0].count > 0) {
    console.log('migrations table already exists');
    return;
  }

  const oldMigrations = await db
    .selectFrom('migrations')
    .select(['name', 'timestamp'])
    .execute();

  function convertMigrationName(input: string): string {
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
