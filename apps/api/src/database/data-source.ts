import { DataSource } from 'typeorm';
import { config } from 'dotenv';

config();

export const AppDataSource = new DataSource({
  type: 'mariadb',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306'),
  username: process.env.DB_USERNAME || 'ku-ai-ctl',
  password: process.env.DB_PASSWORD || 'password',
  database: process.env.DB_DATABASE || '!ku-ai-ctl@',
  entities: [__dirname + '/../**/*.entity{.ts,.js}'],
  migrations: [__dirname + '/migrations/**/*{.ts,.js}'],
  synchronize: false,
  logging: process.env.NODE_ENV === 'development',
  charset: 'utf8mb4',
});
