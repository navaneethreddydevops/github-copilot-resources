import cron from 'node-cron';
import {
  expirePendingOrders,
  isCleanupJobEnabled,
  scheduleCleanupJob,
} from '../../src/jobs/expirePendingOrders';
import { InMemoryOrderRepository } from '../../src/repositories/memory/InMemoryOrderRepository';
import { seedOrders } from '../helpers';

const logger = { info: jest.fn(), error: jest.fn() };

describe('expirePendingOrders', () => {
  it('expires only pending orders older than 24h', async () => {
    const repo = new InMemoryOrderRepository(seedOrders());
    // 2024-03-02T07:59:59.999Z: order 5 (pending, 2024-03-01T08:00Z) is just under 24h old.
    const count = await expirePendingOrders(repo, new Date('2024-03-02T07:59:59.999Z'));
    expect(count).toBe(1);
    expect((await repo.findById('a1b2c3d4-0002-4000-8000-000000000002'))!.status).toBe('expired');
    expect((await repo.findById('a1b2c3d4-0005-4000-8000-000000000005'))!.status).toBe('pending');
    expect((await repo.findById('a1b2c3d4-0001-4000-8000-000000000001'))!.status).toBe('paid');

    expect(await expirePendingOrders(repo, new Date('2024-03-02T08:00:00.001Z'))).toBe(1);
    expect(await expirePendingOrders(repo, new Date('2030-01-01T00:00:00Z'))).toBe(0);
  });
});

describe('scheduleCleanupJob', () => {
  afterEach(() => jest.restoreAllMocks());

  it('is disabled for NODE_ENV=test and CLEANUP_CRON=off', () => {
    expect(isCleanupJobEnabled('*/5 * * * *', 'test')).toBe(false);
    expect(isCleanupJobEnabled('off', 'production')).toBe(false);
    expect(isCleanupJobEnabled('*/5 * * * *', 'production')).toBe(true);
    const repo = new InMemoryOrderRepository();
    expect(scheduleCleanupJob({ cronExpression: '*/5 * * * *', nodeEnv: 'test', orders: repo, logger })).toBeNull();
  });

  it('schedules with the configured expression and rejects invalid ones', () => {
    const fakeTask = { stop: jest.fn() } as unknown as cron.ScheduledTask;
    const spy = jest.spyOn(cron, 'schedule').mockReturnValue(fakeTask);
    const repo = new InMemoryOrderRepository();
    const task = scheduleCleanupJob({ cronExpression: '*/5 * * * *', nodeEnv: 'production', orders: repo, logger });
    expect(task).toBe(fakeTask);
    expect(spy).toHaveBeenCalledWith('*/5 * * * *', expect.any(Function));
    expect(() =>
      scheduleCleanupJob({ cronExpression: 'every five minutes', nodeEnv: 'production', orders: repo, logger }),
    ).toThrow(/Invalid CLEANUP_CRON/);
  });
});
