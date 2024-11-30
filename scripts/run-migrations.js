const { DataSource } = require('typeorm');
require('dotenv').config();

const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://nostr_user:nostr_password@localhost:5432/nostr_relay';

const dataSource = new DataSource({
  type: 'postgres',
  url: DATABASE_URL,
  entities: [],
  migrations: ['migrations/*.ts'],
  migrationsTableName: 'migrations',
  synchronize: false,
  ssl: process.env.DATABASE_SSL === 'true' ? {
    rejectUnauthorized: false
  } : false,
});

dataSource.initialize()
  .then(async () => {
    console.log('Running migrations...');
    await dataSource.runMigrations();
    console.log('Migrations completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Error during migration:', error);
    process.exit(1);
  });
