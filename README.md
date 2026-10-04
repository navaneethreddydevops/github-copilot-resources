# Spring Boot REST API

This repository replaces its former Express 4 + TypeScript API with a Java 21 / Spring Boot
4.0.x service. The Maven application, Java sources, resources, and tests live at repository root;
there is no `springboot/` submodule or Node runtime. PostgreSQL remains the persistence store and
the shared schema/seed SQL is in `init/`.

The original Express implementation remains on `master` as the read-only behavior oracle. This
feature branch uses the pre-removal baseline and source-derived contract inventory in
[`.migration/MIGRATION_STATE.md`](.migration/MIGRATION_STATE.md). The recorded Node checks are
historical pre-removal evidence, not checks run after source removal.

## Build and run

Requirements: JDK 21, Maven 3.9+, and PostgreSQL 16 for database-backed operation.

```bash
mvn clean verify
mvn spring-boot:run
```

For a local PostgreSQL/API stack, use Docker Compose:

```bash
docker compose up -d --build
# API: http://localhost:3000
docker compose down
```

Compose initializes a new empty database from `init/001-schema.sql` and
`init/002-seed.sql`. Do not use `docker compose down -v` on a database whose data must be kept.
The application uses `spring.jpa.hibernate.ddl-auto=none`; it does not create or synchronize the
schema.

## Configuration

Configure the service with environment variables:

| Variable | Default | Notes |
|---|---|---|
| `PORT` | `3000` | HTTP listener |
| `DATABASE_URL` | Local PostgreSQL `app` database | JDBC connection |
| `JWT_SECRET` | `dev-secret-change-me` | Production must provide a non-default secret |
| `JWT_EXPIRES_IN` | `3600` | Token lifetime in seconds |
| `CORS_ORIGIN` | `*` | Wildcard or comma-separated origin list |
| `LOG_LEVEL` | `info` | Application/request log threshold |
| `CLEANUP_CRON` | `*/5 * * * *` | Five-field cron; `off` disables cleanup |

Compose disables cleanup by default so seeded pending orders remain deterministic. If enabled,
pending orders older than 24 hours are expired.

## Seed data and credentials

The authoritative database definition and fixtures are `init/001-schema.sql` and
`init/002-seed.sql`. Startup never creates or synchronizes schema. Fixtures contain six users and
eight orders:

| id | email | password | role / status | Notes |
|---|---|---|---|---|
| 1 | `admin@example.com` | `admin123` | admin / active | |
| 2 | `alice@example.com` | `user123` | user / active | |
| 3 | `bob@example.com` | `user123` | user / blocked | Cannot log in |
| 4 | `carol@example.com` | `user123` | user / active | |
| 5 | `dave@example.com` | `user123` | user / active | Lowercase name exercises sorting |
| 6 | `eve@example.com` | `user123` | user / active | Soft-deleted |

The eight orders have fixed UUIDs and timestamps: four paid, two pending, and two expired.

## API contract

| Method | Path | Authentication | Behavior |
|---|---|---|---|
| GET | `/health` | None | `{"status":"ok"}` |
| POST | `/api/auth/login` | None | Email/password to HS256 bearer JWT; same 401 for invalid, blocked, or deleted user |
| GET | `/api/users` | Bearer | Page/limit, `status[]`, `sort=name|-createdAt`; `{data,page,limit,total}` |
| GET | `/api/users/{id}` | Bearer | Missing, deleted, or nonnumeric ID returns 404 |
| POST | `/api/users` | Bearer + admin | Create; 201 with relative `Location`; validation 400/conflict 409 |
| PATCH | `/api/users/{id}` | Bearer + admin | Partial update; omitted fields untouched; explicit null rejected |
| DELETE | `/api/users/{id}` | Bearer + admin | Soft-delete; 204 with empty body |
| GET | `/api/orders` | Bearer | Page/limit, `status[]`, inclusive ISO `from`/`to`; non-admins see own orders |
| GET | `/api/orders/{id}` | Bearer | Invalid/missing UUID or another user's order returns 404 |

Users default to ID ascending; orders sort by creation time then ID. PostgreSQL `bigint` values
(`id`, `userId`) and `numeric(10,2)` amounts are JSON strings. Timestamps are UTC with exactly
three millisecond digits. Errors use `{error:{code,message,details?},requestId}`; unknown routes
retain the source contract's HTML 404 behavior.

## Source-derived compatibility requirements

The compatibility list below documents behavior captured from the original Express implementation
on `master`; it is an implementation and validation contract, not an active Node runtime guide.

1. Extended query parsing supports `status[]=active&status[]=blocked`; a scalar status is also
   accepted. Express `qs` index-array parsing has an array limit of 20.
2. PostgreSQL `bigint` IDs and order `userId` values serialize as decimal strings.
3. `NUMERIC(10,2)` amounts serialize as strings with trailing zeroes preserved.
4. Dates serialize in UTC using exactly three millisecond digits.
5. An unknown route returns HTML containing `Cannot GET /...`, not the JSON error envelope.
6. Paths match case-insensitively and tolerate a trailing slash.
7. User creation uses a relative `Location: /api/users/<id>`.
8. Successful delete is 204 with no body and no `Content-Type`.
9. JSON responses use `application/json; charset=utf-8`.
10. JSON/send responses have weak ETags and honor `If-None-Match` with 304.
11. The source cleanup schedule accepts a five-field cron expression (optionally seconds-prefixed);
    Spring scheduling uses a six-field expression.
12. Unknown JSON object fields are stripped rather than rejected.
13. Responses include `X-Powered-By: Express` for exact legacy compatibility.
14. A valid `x-request-id` matching `[A-Za-z0-9._:-]{1,128}` is echoed; otherwise a UUID is
    generated. Malformed JSON is a 400 validation error and JSON is limited to 100kb.
15. Login uses the same 401 result for wrong password, blocked, deleted, and unknown users.
    Non-numeric user IDs and invalid/foreign order IDs are deliberately reported as 404.

The error envelope is
`{"error":{"code":"NOT_FOUND","message":"User 999 not found"},"requestId":"..."}`. Validation
errors include `details` items shaped as `{path,message,code}`. Error codes are `NOT_FOUND`,
`VALIDATION_ERROR`, `UNAUTHORIZED`, `FORBIDDEN`, `CONFLICT`, and `INTERNAL`.

## Migration workflow and evidence

To continue the phased migration, invoke `/migrate-express-to-springboot` or the
`springboot-migration-orchestrator` agent. The durable workflow is in
[`.github/skills/express-to-springboot-migration/SKILL.md`](.github/skills/express-to-springboot-migration/SKILL.md);
agent prompts and root-Java instructions are under `.github/agents/` and `.github/instructions/`.
Implementation is feature-branch-only on the existing `feature/NAVDEVOPS-1`; master is read-only.
The migration state file records baseline, per-phase build/test/parity evidence, limitations, and
final validation.

Root layout: `pom.xml`, `src/main/java/`, `src/main/resources/`, `src/test/java/`, shared `init/`
SQL, and repository-level workflow/evidence.
