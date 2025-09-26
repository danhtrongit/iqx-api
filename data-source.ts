import { DataSource } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { config } from 'dotenv';

// Load environment variables
config();

const configService = new ConfigService();

export const AppDataSource = new DataSource({
  type: 'mysql',
  host: configService.get('DB_HOST', '127.0.0.1'),
  port: configService.get('DB_PORT', 3306),
  username: configService.get('DB_USER', 'root'),
  password: configService.get('DB_PASSWORD', ''),
  database: configService.get('DB_NAME', 'iqx'),
  entities: ['src/entities/*.entity.ts'],
  migrations: ['src/migrations/*.ts'],
  synchronize: false,
  logging: false,
});