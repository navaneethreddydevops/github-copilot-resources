import 'reflect-metadata';
import pino from 'pino';
import { createApp } from './app';
import { loadConfig } from './config';
import { createDataSource } from './db/data-source';
import { scheduleCleanupJob } from './jobs/expirePendingOrders';
import { TypeOrmOrderRepository } from './repositories/typeorm/TypeOrmOrderRepository';
import { TypeOrmUserRepository } from './repositories/typeorm/TypeOrmUserRepository';

async function main(): Promise<void> {
  const config = loadConfig();
  const logger = pino({ level: config.logLevel });

  const dataSource = createDataSource(config.databaseUrl);
  await dataSource.initialize();
  logger.info('Database connected');

  const userRepository = new TypeOrmUserRepository(dataSource);
  const orderRepository = new TypeOrmOrderRepository(dataSource);

  const app = createApp({ userRepository, orderRepository, config, logger });
  const task = scheduleCleanupJob({
    cronExpression: config.cleanupCron,
    nodeEnv: config.nodeEnv,
    orders: orderRepository,
    logger,
  });

  const server = app.listen(config.port, () => {
    logger.info({ port: config.port }, 'HTTP server listening');
  });

  const shutdown = (signal: string) => {
    logger.info({ signal }, 'Shutting down');
    task?.stop();
    server.close(() => {
      dataSource
        .destroy()
        .catch((err: unknown) => logger.error({ err }, 'Error closing database'))
        .finally(() => process.exit(0));
    });
  };
  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

main().catch((err: unknown) => {
  // eslint-disable-next-line no-console
  console.error('Failed to start server', err);
  process.exit(1);
});
