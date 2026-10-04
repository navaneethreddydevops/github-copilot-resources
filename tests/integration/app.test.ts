import request from 'supertest';
import { buildTestApp } from '../helpers';

describe('app basics', () => {
  const { app } = buildTestApp();

  it('GET /health returns {status: ok} without auth', async () => {
    const res = await request(app).get('/health').expect(200);
    expect(res.body).toEqual({ status: 'ok' });
    expect(res.headers['content-type']).toBe('application/json; charset=utf-8');
    expect(res.headers['x-powered-by']).toBe('Express');
    expect(res.headers.etag).toMatch(/^W\//);
  });

  it('echoes an incoming x-request-id and generates one otherwise', async () => {
    const echoed = await request(app).get('/health').set('x-request-id', 'abc-123');
    expect(echoed.headers['x-request-id']).toBe('abc-123');
    const generated = await request(app).get('/health');
    expect(generated.headers['x-request-id']).toMatch(/^[0-9a-f-]{36}$/);
  });

  it('unknown routes fall through to the default Express HTML 404', async () => {
    const res = await request(app).get('/api/nope').expect(404);
    expect(res.headers['content-type']).toMatch(/^text\/html/);
    expect(res.text).toContain('Cannot GET /api/nope');
  });

  it('routing is case-insensitive and tolerates a trailing slash', async () => {
    await request(app).get('/HEALTH').expect(200);
    await request(app).get('/health/').expect(200);
  });

  it('malformed JSON yields a 400 VALIDATION_ERROR envelope', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .set('content-type', 'application/json')
      .send('{"email":')
      .expect(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(typeof res.body.requestId).toBe('string');
  });
});
