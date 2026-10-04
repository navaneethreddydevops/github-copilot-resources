# Express to Spring Boot 4.0 migration state

Persistent progress record for `.github/prompts/migrate-express-to-springboot.prompt.md`.
This branch replaces the Node application at the repository root with a Java 21 / stable
Spring Boot 4.0.x service at the repository root. `master` is a read-only behavior oracle and
must remain unchanged. Update this file after every verified phase.

## Branch and replacement contract

- Target branch: `feature/NAVDEVOPS-1` (already existed and was checked out at invocation start).
- Starting worktree: clean on `feature/NAVDEVOPS-1`; master was inspected using read-only `git show`
  and a temporary `git archive`, not checked out or modified.
- The feature branch HEAD already contained the prior removal of the Express application and
  database SQL before this invocation (`9638e6a`); this is a pre-existing branch condition, not a
  deletion performed by this migration run. The source baseline below was therefore executed from
  an isolated archive of `master`, before any implementation edits in this run.
- Keep no Node application/runtime code, Node package manager files, or `springboot/` directory on
  this feature branch. Preserve/restore the shared `init/001-schema.sql` and `init/002-seed.sql`.
- Never claim Node tests were run after their removal from the feature branch. No source/behavior
  parity divergence is accepted without explicit user approval.

## Source baseline and captured contract inventory (2026-10-04)

### Exact baseline commands and results

Source: read-only `master` commit `9388ce67783b3912f06970131466a12dfede4c99`, exported to
`/tmp/express-baseline.WdTcsc` using `git archive master` (outside the repository).

- `npm ci` — PASS; installed 504 packages. npm reported 35 dependency audit findings
  (4 moderate, 31 high); no dependency changes were made to master.
- `npm run build` — PASS (`tsc -p tsconfig.build.json`).
- `npm test -- --runInBand` — PASS; 8 suites, 45 tests, 0 snapshots failed.
- Node/npm versions: Node `v26.10.0`, npm `11.19.1`.
- Database-backed runtime checks were not run; no PostgreSQL availability has been established.

### API and HTTP contract inventoried from master source, README, tests, and SQL

- `GET /health`: 200 `{"status":"ok"}`, unauthenticated. Express emits
  `application/json; charset=utf-8`, weak ETag, `X-Powered-By: Express`, security headers,
  and `X-Request-Id`.
- `POST /api/auth/login`: validates email/password, issues HS256 JWT with `sub`, `email`, `role`,
  returns `{token, expiresIn}`. Unknown/deleted/blocked users and wrong passwords share the same
  401 envelope/message. Bearer parsing is case-insensitive.
- `GET /api/users`: bearer auth; page default 1, limit default 20/max 100, `status[]` filter,
  `sort=name|-createdAt`; returns `{data,page,limit,total}` ordered by ID ascending by default.
- `GET /api/users/:id`: bearer auth; deleted/missing/non-numeric IDs return 404 envelope.
- `POST /api/users`: admin only; zod trims/validates values, default role/status are `user`/`active`,
  strips unknown keys, conflicts (including deleted-email duplicate) return 409, success is 201 with
  relative `Location: /api/users/<id>`.
- `PATCH /api/users/:id`: admin only; omitted fields are unchanged; explicit null fails validation;
  duplicate email conflicts; writes remain partial.
- `DELETE /api/users/:id`: admin only; soft delete, 204 with empty body/no content type; subsequent
  reads/login no longer expose the deleted user.
- `GET /api/orders`: bearer auth; `status[]`, inclusive ISO `from`/`to`, page/limit; admin sees all,
  non-admin sees own; order by `createdAt` then UUID ID.
- `GET /api/orders/:id`: bearer auth; malformed/missing UUID and another user's order are 404.
- User `bigint` IDs and order `userId` serialize as strings; numeric amounts preserve decimal
  strings/trailing zeroes; timestamps serialize UTC with exactly millisecond precision.
- Error envelope: `{error:{code,message,details?},requestId}`; details are validation issue
  `{path,message,code}` records. Codes include `NOT_FOUND`, `VALIDATION_ERROR`, `UNAUTHORIZED`,
  `FORBIDDEN`, `CONFLICT`, `INTERNAL`. Unknown routes intentionally remain Express HTML 404, not
  this envelope. Malformed JSON is 400 `VALIDATION_ERROR`; JSON parser limit is 100kb.
- Incoming `x-request-id` is echoed only when matching `[A-Za-z0-9._:-]{1,128}`, otherwise UUID is
  generated. Responses preserve JSON charset, relative Location, empty 204, weak ETag and
  `If-None-Match` behavior, case-insensitive paths/trailing slash tolerance, and `X-Powered-By`.
- Environment defaults: `PORT=3000`, `DATABASE_URL` points to local `app`, dev JWT secret,
  `JWT_EXPIRES_IN=3600`, `CORS_ORIGIN=*`, `LOG_LEVEL=info`,
  `CLEANUP_CRON=*/5 * * * *`; default JWT secret is rejected in production.
- Cleanup expires pending orders older than 24 hours, is disabled for `NODE_ENV=test` or cron `off`,
  logs success/failure, and converts Node's five-field cron semantics for Spring.
- Authoritative PostgreSQL schema is `users`/`orders` in shared `init/001-schema.sql`; fixed seed
  data in `init/002-seed.sql` provides 6 users (including blocked and soft-deleted cases) and 8
  orders. TypeORM synchronization was disabled. SQL is restored from master unchanged.

Primary source evidence: master `README.md`, `src/app.ts`, `src/server.ts`, `src/config.ts`,
`src/errors.ts`, `src/middleware/{auth,errorHandler,requestId}.ts`, `src/routes/*.ts`,
`src/schemas/*.ts`, `src/services/{AuthService,UserService,OrderService}.ts`,
`src/jobs/expirePendingOrders.ts`, `tests/integration/*.test.ts`, `tests/unit/*.test.ts`,
`init/001-schema.sql`, and `init/002-seed.sql`.

## Current status

- Overall: In progress
- Active phase: Phase 0 — Baseline and root-level Java application
- Last verified phase: Node baseline/contract inventory only (phase 0 remains incomplete)
- Target: Stable Spring Boot 4.0.x, Java 21, Maven application at repository root
- Last updated: 2026-10-04
- Blocker: None recorded

## Phase checklist

| Phase | Scope | Status | Build / test / validation evidence |
|---|---|---|---|
| 0 | Baseline and root-level Java application | In progress | Master Node baseline recorded above; Java module/build checks pending |
| 1 | Runtime, configuration, health, and HTTP foundation | Not started | |
| 2 | PostgreSQL persistence and data representation | Not started | |
| 3 | User API and authentication | Not started | |
| 4 | Orders API | Not started | |
| 5 | Express compatibility and complete contract parity | Not started | |
| 6 | Cleanup job, packaging, operations, and cutover readiness | Not started | |

## Verified phase notes

For each phase, record completion date, changed files, exact build/test/validation commands and
results, concrete contract evidence, any approved divergence or skipped check with reason, blocker,
and next phase. No phase is complete without a passing build, focused tests, and actual parity
validation. Final cutover requires complete Java checks and a confirmation that master is unchanged.
