import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { Order } from '../entities/Order';
import { User } from '../entities/User';

export function createDataSource(databaseUrl: string): DataSource {
  return new DataSource({
    type: 'postgres',
    url: databaseUrl,
    entities: [User, Order],
    // Schema is owned by db/init/*.sql - never let TypeORM alter it.
    synchronize: false,
    migrationsRun: false,
    logging: false,
  });
}
