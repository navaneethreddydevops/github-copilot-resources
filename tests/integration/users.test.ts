import request from 'supertest';
import { adminToken, buildTestApp, userToken } from '../helpers';

describe('/api/users', () => {
  let ctx: ReturnType<typeof buildTestApp>;
  let admin: string;
  let user: string;

  beforeEach(async () => {
    ctx = buildTestApp();
    admin = await adminToken(ctx.app);
    user = await userToken(ctx.app);
  });

  const auth = (token: string) => ({ Authorization: `Bearer ${token}` });

  describe('authentication', () => {
    it('returns 401 without a token', async () => {
      const res = await request(ctx.app).get('/api/users').expect(401);
      expect(res.body.error.code).toBe('UNAUTHORIZED');
    });

    it('returns 401 with an invalid token', async () => {
      const res = await request(ctx.app).get('/api/users').set(auth('garbage')).expect(401);
      expect(res.body.error.code).toBe('UNAUTHORIZED');
    });

    it('returns 403 FORBIDDEN for a non-admin on admin routes', async () => {
      const res = await request(ctx.app)
        .post('/api/users')
        .set(auth(user))
        .send({ email: 'x@example.com', name: 'X', password: 'password1' })
        .expect(403);
      expect(res.body.error.code).toBe('FORBIDDEN');
    });
  });

  describe('GET /api/users', () => {
    it('returns the paging envelope with string ids and ISO ms dates (soft-deleted excluded)', async () => {
      const res = await request(ctx.app).get('/api/users').set(auth(user)).expect(200);
      expect(res.body).toMatchObject({ page: 1, limit: 20, total: 5 });
      expect(res.body.data).toHaveLength(5);
      expect(res.body.data[1]).toEqual({
        id: '2',
        email: 'alice@example.com',
        name: 'Alice Anderson',
        role: 'user',
        status: 'active',
        createdAt: '2024-01-02T10:15:30.123Z',
        updatedAt: '2024-01-02T10:15:30.123Z',
      });
      expect(res.body.data[0]).not.toHaveProperty('passwordHash');
    });

    it('pages with page/limit', async () => {
      const res = await request(ctx.app).get('/api/users?page=2&limit=2').set(auth(user)).expect(200);
      expect(res.body).toMatchObject({ page: 2, limit: 2, total: 5 });
      expect(res.body.data.map((u: { id: string }) => u.id)).toEqual(['3', '4']);
    });

    it('filters with qs bracket array syntax status[]', async () => {
      const blocked = await request(ctx.app).get('/api/users?status[]=blocked').set(auth(user)).expect(200);
      expect(blocked.body.data.map((u: { email: string }) => u.email)).toEqual(['bob@example.com']);

      const both = await request(ctx.app)
        .get('/api/users?status[]=active&status[]=blocked')
        .set(auth(user))
        .expect(200);
      expect(both.body.total).toBe(5);
    });

    it('sorts by name and by -createdAt', async () => {
      const byName = await request(ctx.app).get('/api/users?sort=name').set(auth(user)).expect(200);
      expect(byName.body.data.map((u: { name: string }) => u.name)).toEqual([
        'Admin User',
        'Alice Anderson',
        'Bob Brown',
        'Carol Clark',
        'dave davis',
      ]);
      const newest = await request(ctx.app).get('/api/users?sort=-createdAt').set(auth(user)).expect(200);
      expect(newest.body.data[0].id).toBe('5');
    });

    it('rejects limit > 100 and unknown status values', async () => {
      const res = await request(ctx.app).get('/api/users?limit=101').set(auth(user)).expect(400);
      expect(res.body.error.details[0].path).toBe('limit');
      await request(ctx.app).get('/api/users?status[]=gone').set(auth(user)).expect(400);
    });
  });

  describe('GET /api/users/:id', () => {
    it('returns a user', async () => {
      const res = await request(ctx.app).get('/api/users/4').set(auth(user)).expect(200);
      expect(res.body.email).toBe('carol@example.com');
    });

    it('returns 404 envelope for missing, soft-deleted and non-numeric ids', async () => {
      const res = await request(ctx.app).get('/api/users/999').set(auth(user)).expect(404);
      expect(res.body.error).toEqual({ code: 'NOT_FOUND', message: 'User 999 not found' });
      await request(ctx.app).get('/api/users/6').set(auth(user)).expect(404);
      await request(ctx.app).get('/api/users/abc').set(auth(user)).expect(404);
    });
  });

  describe('POST /api/users', () => {
    it('creates a user: 201 + Location header, unknown keys stripped', async () => {
      const res = await request(ctx.app)
        .post('/api/users')
        .set(auth(admin))
        .send({ email: 'frank@example.com', name: 'Frank', password: 'password1', isSuperuser: true })
        .expect(201);
      expect(res.headers.location).toBe('/api/users/7');
      expect(res.body).toMatchObject({ id: '7', email: 'frank@example.com', role: 'user', status: 'active' });
      expect(res.body).not.toHaveProperty('isSuperuser');
      await request(ctx.app).get('/api/users/7').set(auth(admin)).expect(200);
    });

    it('returns 400 VALIDATION_ERROR with zod details', async () => {
      const res = await request(ctx.app)
        .post('/api/users')
        .set(auth(admin))
        .send({ email: 'bad', name: '', password: 'short', role: 'root' })
        .expect(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
      const paths = res.body.error.details.map((d: { path: string }) => d.path).sort();
      expect(paths).toEqual(['email', 'name', 'password', 'role']);
    });

    it('returns 409 CONFLICT on duplicate email (including soft-deleted users)', async () => {
      const dup = await request(ctx.app)
        .post('/api/users')
        .set(auth(admin))
        .send({ email: 'alice@example.com', name: 'Alice 2', password: 'password1' })
        .expect(409);
      expect(dup.body.error.code).toBe('CONFLICT');
      await request(ctx.app)
        .post('/api/users')
        .set(auth(admin))
        .send({ email: 'eve@example.com', name: 'Eve 2', password: 'password1' })
        .expect(409);
    });
  });

  describe('PATCH /api/users/:id', () => {
    it('updates only the provided fields', async () => {
      const res = await request(ctx.app)
        .patch('/api/users/2')
        .set(auth(admin))
        .send({ status: 'blocked' })
        .expect(200);
      expect(res.body).toMatchObject({ id: '2', name: 'Alice Anderson', email: 'alice@example.com', status: 'blocked' });
      expect(res.body.updatedAt).not.toBe(res.body.createdAt);
    });

    it('rejects an explicit null name', async () => {
      const res = await request(ctx.app).patch('/api/users/2').set(auth(admin)).send({ name: null }).expect(400);
      expect(res.body.error.details[0].path).toBe('name');
    });

    it('returns 404 for an unknown user and 409 for a taken email', async () => {
      await request(ctx.app).patch('/api/users/999').set(auth(admin)).send({ name: 'X' }).expect(404);
      await request(ctx.app).patch('/api/users/2').set(auth(admin)).send({ email: 'bob@example.com' }).expect(409);
    });
  });

  describe('DELETE /api/users/:id', () => {
    it('soft-deletes: 204 with an empty body, then 404', async () => {
      const res = await request(ctx.app).delete('/api/users/4').set(auth(admin)).expect(204);
      expect(res.text).toBe('');
      expect(res.headers['content-type']).toBeUndefined();
      await request(ctx.app).get('/api/users/4').set(auth(admin)).expect(404);
      await request(ctx.app).delete('/api/users/4').set(auth(admin)).expect(404);
    });
  });
});
