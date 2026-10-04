---
name: express-to-springboot-migration
description: "Run or resume the complete, phased migration of this Express TypeScript API to Spring Boot 4.0. Use when asked to migrate, port, or continue the migration."
---

# Express to Spring Boot 4.0 migration

Use this skill with `springboot-migration-orchestrator` and `.migration/MIGRATION_STATE.md`. A single migration invocation must run each phase in order and repeat the develop → build → test → validate loop for that phase before starting the next. Do not stop after planning or scaffolding.

## Before implementation

1. Read `.migration/MIGRATION_STATE.md`, root `README.md`, `.github/instructions/springboot-migration.instructions.md`, and the relevant source/tests.
2. Confirm the working tree has no task-related uncommitted changes that would be overwritten. Do not revert existing work.
3. Establish the source baseline using the available Node build and tests (`npm run build`, focused `npm test -- --runInBand ...`, and full `npm test` when needed). Record actual command results; if the environment cannot run a check, record why.
4. Keep Node and Spring Boot side by side in `springboot/`. Do not assume a database is available. Use the existing in-memory/fake tests for contract slices and add database-backed checks when the configured environment supports them.
5. Use Spring Boot 4.0.x stable with Java 21. Determine an available stable 4.0.x patch rather than guessing a version or selecting a snapshot/newer minor version. Avoid downloading dependencies unless a required build tool or dependency is missing.

## Ordered migration phases

### Phase 0 — Baseline and Java module

- Confirm the current Express tests/build and extract endpoint, DTO, error, auth, SQL, and parity contracts from code and docs.
- Add a minimal independently buildable Maven Spring Boot 4.0.x application under `springboot/`, with Java 21 and a documented local build command.
- Keep the Node application unchanged. Test the new module and confirm the original tests still pass.

### Phase 1 — Runtime, configuration, health, and HTTP foundation

- Port environment configuration, startup/readiness behavior, health response, request ID echo/generation, and structured request logging.
- Establish centralized error response translation and MVC/security filter ordering.
- Test health and error contracts, including content type, headers, malformed JSON, and unknown-route behavior.

### Phase 2 — PostgreSQL persistence and data representation

- Port User and Order persistence and repository contracts. Use `init/001-schema.sql` and `init/002-seed.sql` as authoritative; do not enable schema auto-creation against the existing schema.
- Preserve `bigint` and `numeric` string serialization, UUID values, ordering/collation, soft-delete semantics, and UTC millisecond timestamps.
- Test repository behavior against fixtures and PostgreSQL where available.

### Phase 3 — User API and authentication

- Port login, JWT issuance/verification, password checks, roles, user list/detail/create/patch/delete, pagination, filters, sorting, and ownership/authentication rules.
- Preserve blocked/deleted login behavior, admin-only writes, duplicate conflicts, missing/non-numeric ID behavior, and omitted-versus-null PATCH semantics.
- Test success, validation, conflict, unauthorized/forbidden, soft-delete, and edge cases.

### Phase 4 — Orders API

- Port order list/detail, date/status filters, pagination/sort order, admin visibility, and user ownership restrictions.
- Preserve string `userId`/amounts, inclusive date bounds, UUID validation/not-found behavior, and stable ordering.
- Test filtering, authorization, pagination, response shape, and missing/invalid identifiers.

### Phase 5 — Express compatibility and complete contract parity

- Reconcile cross-cutting parity: Express extended query parsing (`status[]`), unknown fields, error envelope/details, route case and trailing slash, default HTML unknown-route 404, relative `Location`, empty 204, JSON charset, weak ETag/If-None-Match, 100kb body limit, and `X-Powered-By`.
- Add focused tests for every documented parity pitfall. Record any intentional divergence with evidence and user approval; do not silently waive one.
- Run an endpoint-by-endpoint comparison against Node tests or actual responses and close all unexplained differences.

### Phase 6 — Cleanup job, packaging, operations, and cutover readiness

- Port pending-order expiry and scheduling, including disabled/test behavior, five-field Node cron conversion to Spring's six-field expression, error reporting, and graceful shutdown.
- Add or update Spring Boot container/local run documentation and ensure the shared Postgres/seed setup works without destructive resets.
- Run the full Node and Java build/test suites and available integration/runtime checks. Do not remove the Node service; mark cutover readiness only after all required evidence is recorded.

## Required loop for every phase

For each phase above, in order:

1. **Develop:** make the smallest complete implementation and focused regression tests; update directly related documentation.
2. **Build:** compile/package the Spring Boot module with the repository's available Maven wrapper or Maven command.
3. **Test:** run focused Java tests and relevant Express contract tests; broaden to full suites when a shared behavior is touched.
4. **Validate:** review the implementation against source and docs; execute runtime checks where feasible; invoke the validator role/checklist and report exact parity evidence.
5. Fix every build/test/validation issue and repeat **build → test → validate** until green. Do not advance on red, skipped-without-explanation, or guessed results.
6. Record phase status, files, exact commands/results, parity coverage/gaps, blocker (if any), and next phase in `.migration/MIGRATION_STATE.md`.

At completion, verify all phases and their required checks, summarize any approved divergences or environmental limitations, and leave the original Node baseline intact.
