import request from 'supertest';
import { adminToken, buildTestApp, userToken } from '../helpers';

describe('/api/orders', () => {
  const { app } = buildTestApp();
  let token: string;
  let aliceToken: string;

  beforeAll(async () => {
    token = await adminToken(app);
    aliceToken = await userToken(app);
  });

  const get = (url: string) => request(app).get(url).set('Authorization', `Bearer ${token}`);
  const getAsAlice = (url: string) => request(app).get(url).set('Authorization', `Bearer ${aliceToken}`);

  it('requires authentication', async () => {
    await request(app).get('/api/orders').expect(401);
  });

  it('lists orders with string amounts, string userIds and ISO ms dates', async () => {
    const res = await get('/api/orders').expect(200);
    expect(res.body).toMatchObject({ page: 1, limit: 20, total: 8 });
    expect(res.body.data[0]).toEqual({
      id: 'a1b2c3d4-0001-4000-8000-000000000001',
      userId: '2',
      status: 'paid',
      amount: '19.90',
      createdAt: '2024-02-01T10:00:00.000Z',
    });
  });

  it('filters by status[] and pages', async () => {
    const res = await get('/api/orders?status[]=pending&status[]=expired&limit=3&page=1').expect(200);
    expect(res.body.total).toBe(4);
    expect(res.body.data).toHaveLength(3);
    expect(res.body.data.every((o: { status: string }) => ['pending', 'expired'].includes(o.status))).toBe(true);
  });

  it('filters by from/to (inclusive)', async () => {
    const res = await get('/api/orders?from=2024-02-10T16:45:12.345Z&to=2024-03-15T12:00:00Z').expect(200);
    expect(res.body.data.map((o: { amount: string }) => o.amount)).toEqual(['1234.50', '0.99', '250.00']);
  });

  it('rejects an invalid date', async () => {
    const res = await get('/api/orders?from=yesterday').expect(400);
    expect(res.body.error.details[0].path).toBe('from');
  });

  it('gets an order by id, 404 otherwise', async () => {
    const ok = await get('/api/orders/a1b2c3d4-0004-4000-8000-000000000004').expect(200);
    expect(ok.body.amount).toBe('1234.50');
    const missing = await get('/api/orders/00000000-0000-4000-8000-000000000000').expect(404);
    expect(missing.body.error.code).toBe('NOT_FOUND');
    await get('/api/orders/not-a-uuid').expect(404);
  });

  it('limits non-admin users to their own orders', async () => {
    const res = await getAsAlice('/api/orders').expect(200);
    expect(res.body.total).toBe(3);
    expect(res.body.data.every((o: { userId: string }) => o.userId === '2')).toBe(true);
  });

  it("returns 404 for another user's order", async () => {
    await getAsAlice('/api/orders/a1b2c3d4-0001-4000-8000-000000000001').expect(200);
    const res = await getAsAlice('/api/orders/a1b2c3d4-0004-4000-8000-000000000004').expect(404);
    expect(res.body.error.code).toBe('NOT_FOUND');
  });
});
