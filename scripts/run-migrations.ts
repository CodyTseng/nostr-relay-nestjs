import { DataSource } from 'typeorm';
import { config } from 'dotenv';
import { join } from 'path';

config();

const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://nostr_user:nostr_password@localhost:5432/nostr_relay';

const dataSource = new DataSource({
  type: 'postgres',
  url: DATABASE_URL,
  entities: [],
  migrations: [join(__dirname, '..', 'migrations', '*.ts')],
  migrationsTableName: 'migrations',
  synchronize: false,
  ssl: process.env.DATABASE_SSL === 'true' ? {
    rejectUnauthorized: false
  } : false,
});

async function runMigrations() {
  try {
    await dataSource.initialize();
    console.log('Running migrations...');
    await dataSource.runMigrations();
    console.log('Migrations completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error during migration:', error);
    process.exit(1);
  }
}

runMigrations();
