import cron, { type ScheduledTask } from 'node-cron';
import type { Logger } from 'pino';
import type { OrderRepository } from '../repositories/OrderRepository';

export const PENDING_ORDER_MAX_AGE_MS = 24 * 60 * 60 * 1000;

/** Marks pending orders older than 24h (relative to `now`) as expired. Returns the affected count. */
export async function expirePendingOrders(
  orders: OrderRepository,
  now: Date = new Date(),
  maxAgeMs: number = PENDING_ORDER_MAX_AGE_MS,
): Promise<number> {
  return orders.expirePendingOlderThan(new Date(now.getTime() - maxAgeMs));
}

export interface CleanupJobOptions {
  /** 5-field cron expression (node-cron also accepts an optional leading seconds field), or 'off'. */
  cronExpression: string;
  nodeEnv: string;
  orders: OrderRepository;
  logger: Pick<Logger, 'info' | 'error'>;
}

export function isCleanupJobEnabled(cronExpression: string, nodeEnv: string): boolean {
  return nodeEnv !== 'test' && cronExpression.trim().toLowerCase() !== 'off';
}

/** Schedules the cleanup job; returns null when disabled (NODE_ENV=test or CLEANUP_CRON=off). */
export function scheduleCleanupJob(options: CleanupJobOptions): ScheduledTask | null {
  const { cronExpression, nodeEnv, orders, logger } = options;
  if (!isCleanupJobEnabled(cronExpression, nodeEnv)) {
    logger.info({ cronExpression, nodeEnv }, 'Order cleanup job disabled');
    return null;
  }
  if (!cron.validate(cronExpression)) {
    throw new Error(`Invalid CLEANUP_CRON expression: "${cronExpression}"`);
  }
  const task = cron.schedule(cronExpression, () => {
    expirePendingOrders(orders)
      .then((count) => logger.info({ count }, 'Expired stale pending orders'))
      .catch((err: unknown) => logger.error({ err }, 'Order cleanup job failed'));
  });
  logger.info({ cronExpression }, 'Order cleanup job scheduled');
  return task;
}
