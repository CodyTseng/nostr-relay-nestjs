import { DataSource } from 'typeorm';
import 'dotenv/config';

const datasource = new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  entities: [
    './src/nostr/entities/event.entity.ts',
    './src/nostr/entities/generic-tag.entity.ts',
  ],
  migrations: ['./migrations/*.ts'],
});
datasource.initialize();
export default datasource;
