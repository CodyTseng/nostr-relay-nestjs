import { DataSource } from 'typeorm';
import 'dotenv/config';

const dataSource = new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  migrations: ['./migrations/*{.ts,.js}'],
});
dataSource.initialize();
export default dataSource;
