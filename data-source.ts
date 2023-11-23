import { DataSource } from 'typeorm';
import 'dotenv/config';

const datasource = new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  entities: [
    './src/nostr/entities/event.entity{.ts,.js}',
    './src/nostr/entities/generic-tag.entity{.ts,.js}',
  ],
  migrations: ['./migrations/*{.ts,.js}'],
});
datasource.initialize();
export default datasource;
