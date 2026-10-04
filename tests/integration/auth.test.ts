import jwt from 'jsonwebtoken';
import request from 'supertest';
import { buildTestApp, TEST_CONFIG } from '../helpers';

describe('POST /api/auth/login', () => {
  const { app } = buildTestApp();

  it('returns a HS256 token for valid credentials', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@example.com', password: 'admin123' })
      .expect(200);
    expect(res.body.expiresIn).toBe(3600);
    const decoded = jwt.verify(res.body.token, TEST_CONFIG.jwtSecret, { algorithms: ['HS256'] }) as jwt.JwtPayload;
    expect(decoded.sub).toBe('1');
    expect(decoded.role).toBe('admin');
  });

  it('returns 401 envelope for a wrong password', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .set('x-request-id', 'req-login-1')
      .send({ email: 'admin@example.com', password: 'nope' })
      .expect(401);
    expect(res.body).toEqual({
      error: { code: 'UNAUTHORIZED', message: 'Invalid email or password' },
      requestId: 'req-login-1',
    });
  });

  it('returns 401 for blocked and soft-deleted users', async () => {
    await request(app).post('/api/auth/login').send({ email: 'bob@example.com', password: 'user123' }).expect(401);
    await request(app).post('/api/auth/login').send({ email: 'eve@example.com', password: 'user123' }).expect(401);
  });

  it('returns 400 VALIDATION_ERROR for a malformed body', async () => {
    const res = await request(app).post('/api/auth/login').send({ email: 'not-an-email' }).expect(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(res.body.error.details.map((d: { path: string }) => d.path).sort()).toEqual(['email', 'password']);
  });
});
