# sample-express-ts-api

A small but realistic **Express 4 + TypeScript** REST API. It is the test subject for the
Express to **Spring Boot 4** migration toolkit in this repository. It deliberately exercises
behaviours that are easy to get wrong when porting an Express app to Spring (see
[Deliberate parity pitfalls](#deliberate-parity-pitfalls)), so a migrated service can be
compared against it response by response.

Stack: Express 4.21, TypeScript (strict), TypeORM 0.3 + PostgreSQL (`pg`), zod, jsonwebtoken
(HS256), bcryptjs, helmet, cors, pino-http, node-cron. Tests use Jest, ts-jest and supertest.

## Running it

```bash
npm ci
npm test                 # in-memory repositories, no database needed
npm run test:coverage
npm run build && npm start   # needs a Postgres reachable via DATABASE_URL
npm run dev              # ts-node, no build step

docker compose up -d --build                       # Postgres 16 + API on http://localhost:3000
docker compose down -v && docker compose up -d     # reset to the seed data
```

Configuration comes from environment variables (see `.env.example`):

| Variable         | Default                                   | Notes                                       |
|------------------|-------------------------------------------|---------------------------------------------|
| `PORT`           | `3000`                                    |                                             |
| `DATABASE_URL`   | `postgres://app:app@localhost:5432/app`   |                                             |
| `JWT_SECRET`     | `dev-secret-change-me`                    | must be set when `NODE_ENV=production`      |
| `JWT_EXPIRES_IN` | `3600`                                    | seconds                                     |
| `CORS_ORIGIN`    | `*`                                       | `*` or a comma-separated list               |
| `LOG_LEVEL`      | `info`                                    | pino level                                  |
| `CLEANUP_CRON`   | `*/5 * * * *`                             | `off` disables the job; also off in `NODE_ENV=test` |

`docker-compose.yml` sets `CLEANUP_CRON=off` by default. Seeded `pending` orders are older
than 24h, so the job would otherwise expire them within five minutes and the data would no
longer be deterministic. To enable it, run `CLEANUP_CRON='*/5 * * * *' docker compose up -d`.

## Seed data and credentials

The schema and seed data live in `db/init/001-schema.sql` and `db/init/002-seed.sql`. Both are
mounted into `/docker-entrypoint-initdb.d`, and TypeORM runs with `synchronize: false`. All ids,
UUIDs and timestamps are fixed.

| id | email               | password   | role  | status  | notes        |
|----|---------------------|------------|-------|---------|--------------|
| 1  | `admin@example.com` | `admin123` | admin | active  |              |
| 2  | `alice@example.com` | `user123`  | user  | active  |              |
| 3  | `bob@example.com`   | `user123`  | user  | blocked | cannot log in |
| 4  | `carol@example.com` | `user123`  | user  | active  |              |
| 5  | `dave@example.com`  | `user123`  | user  | active  | lowercase name (sort/collation) |
| 6  | `eve@example.com`   | `user123`  | user  | active  | soft-deleted |

There are 8 orders, with ids `a1b2c3d4-000N-4000-8000-00000000000N`: 4 paid, 2 pending and 2 expired.

## Routes

| Method | Path                 | Auth            | Notes |
|--------|----------------------|-----------------|-------|
| GET    | `/health`            | none            | `{ "status": "ok" }` |
| POST   | `/api/auth/login`    | none            | `{email,password}` → `{ token, expiresIn: 3600 }`, 401 on bad credentials |
| GET    | `/api/users`         | bearer          | `page` (1-based, default 1), `limit` (default 20, max 100), `status[]`, `sort=name\|-createdAt` → `{ data, page, limit, total }` |
| GET    | `/api/users/:id`     | bearer          | 404 envelope if missing, soft-deleted or non-numeric |
| POST   | `/api/users`         | bearer + admin  | 201 + `Location: /api/users/<id>`, 400 VALIDATION_ERROR, 409 CONFLICT |
| PATCH  | `/api/users/:id`     | bearer + admin  | partial update; omitted fields untouched; `"name": null` → 400 |
| DELETE | `/api/users/:id`     | bearer + admin  | soft delete → 204, empty body |
| GET    | `/api/orders`        | bearer          | `status[]`, `from`/`to` (ISO, inclusive), `page`/`limit`; non-admins see only their own orders |
| GET    | `/api/orders/:id`    | bearer          | 404 envelope if missing, not a UUID, or owned by another user (non-admins) |

Without a sort, users come back ordered by id ascending. Orders are ordered by `createdAt`
ascending, then by id.

Every error has this shape (the only exception is an unknown route, see below):

```json
{ "error": { "code": "NOT_FOUND", "message": "User 999 not found", "details": [] }, "requestId": "..." }
```

The possible codes are `NOT_FOUND`, `VALIDATION_ERROR`, `UNAUTHORIZED`, `FORBIDDEN`, `CONFLICT`
and `INTERNAL`. `details` appears only for validation errors, as a list of `{ path, message, code }`
items taken from the zod issues.

Example:

```bash
TOKEN=$(curl -s -XPOST localhost:3000/api/auth/login -H 'content-type: application/json' \
  -d '{"email":"admin@example.com","password":"admin123"}' | jq -r .token)
curl -g "localhost:3000/api/users?page=1&limit=2&status[]=active" -H "Authorization: Bearer $TOKEN"
```

## Layout

```
src/
  app.ts            createApp(deps): DI of repositories, so tests use in-memory fakes
  server.ts         boots TypeORM DataSource + app + cron job
  config.ts         env parsing
  errors.ts         AppError hierarchy
  types.ts          Express Request augmentation (requestId, user)
  db/               TypeORM DataSource
  entities/         User, Order + DTO mappers
  repositories/     interfaces, typeorm/ implementations, memory/ implementations
  services/         AuthService, UserService, OrderService
  schemas/          zod schemas (bodies + query strings)
  middleware/       requestId, auth (authenticate, requireRole), errorHandler, asyncHandler
  routes/           health, auth, users, orders
  jobs/             expirePendingOrders (node-cron)
tests/              integration (supertest) + unit tests
db/init/            schema + seed SQL
```

## Deliberate parity pitfalls

A faithful Spring Boot port has to reproduce, or consciously change, each of these behaviours:

1. **qs array query syntax.** Express 4's extended `qs` parser turns `?status[]=active&status[]=blocked`
   into an array, `?status=active` into a string, and `?status[0]=a` into an array as well. Indices
   above 20 turn into an object, because of qs's `arrayLimit`. Spring binds `status` and not `status[]`.
2. **bigint ids come back as strings.** node-postgres returns `int8` as a string, so the JSON has
   `"id": "1"` and `"userId": "2"`. Jackson would serialize a `Long` as a number.
3. **numeric amounts come back as strings.** `NUMERIC(10,2)` is returned as `"19.90"` or `"5.00"`, with
   trailing zeros kept. Jackson writes a `BigDecimal` as the number `19.9` by default.
4. **Date format.** JS `Date#toJSON()` always writes UTC with exactly three millisecond digits
   (`2024-01-01T09:00:00.000Z`). Jackson's default `OffsetDateTime`/`Instant` output drops or
   varies the fraction and may keep the offset.
5. **Express default HTML 404.** No catch-all is registered, so unknown routes return
   `text/html` `Cannot GET /api/nope` instead of the JSON envelope. Spring returns its own
   JSON or whitelabel error.
6. **Routing is case-insensitive and ignores trailing slashes.** `/HEALTH` and `/health/` both
   match. Spring 6+ matches trailing slashes strictly and paths case-sensitively.
7. **201 + Location.** `POST /api/users` sends back a *relative* `Location: /api/users/7`.
   `ServletUriComponentsBuilder` usually produces an absolute URL.
8. **204 has an empty body.** `DELETE` sends no body and no `Content-Type`.
9. **charset in Content-Type.** Express sends `application/json; charset=utf-8`. Spring sends
   `application/json`.
10. **ETag.** Express adds a weak `ETag: W/"..."` to every `res.json`/`res.send` and answers
    `If-None-Match` with 304. Spring does neither unless you add `ShallowEtagHeaderFilter`.
11. **Cron has 5 fields.** `CLEANUP_CRON=*/5 * * * *` is in node-cron's 5-field format, with an
    optional leading seconds field. Spring `@Scheduled(cron=...)` needs 6 fields (seconds first).
12. **zod drops unknown keys.** `{"isSuperuser": true}` is silently dropped rather than rejected.
    Jackson's behaviour depends on `FAIL_ON_UNKNOWN_PROPERTIES`.
13. **X-Powered-By: Express is still sent.** helmet is configured with `xPoweredBy: false`, so
    the header survives.

Other behaviours worth checking:

- Express 4 does not catch rejected promises, which is why `asyncHandler` exists.
- A non-numeric `:id` returns 404, not 400.
- Login returns the same 401 for a blocked user, a soft-deleted user and a wrong password.
- PATCH treats a missing field differently from `null`.
- `x-request-id` is echoed back on every response.
- The default 100kb JSON body limit applies.
- Malformed JSON returns 400 `VALIDATION_ERROR`.
- Postgres collation on Alpine sorts `dave davis` after the capitalised names.
