---
name: express-to-springboot-migration
description: "Run or resume the complete, phased migration of this Express TypeScript API to Spring Boot 4.0. Use when asked to migrate, port, or continue the migration."
---

# Express to Spring Boot 4.0 replacement workflow

Use this skill with `springboot-migration-orchestrator` and `.migration/MIGRATION_STATE.md`.
A migration request means execute all ordered phases in this invocation; do not stop at a plan,
scaffold, or side-by-side implementation.

## Branch and replacement rules

- The target is the existing `feature/NAVDEVOPS-1` branch. Confirm it exists and the worktree is
  safe; switch to it before implementation. Never create a second branch, modify `master`, or
  discard unrelated changes. If the branch is absent or switching would overwrite work, stop and
  report the concrete blocker.
- Inspect `master` read-only to capture the source contracts. Use `git show`, a detached archive,
  or another read-only view; do not edit or commit on `master`.
- Before any source removal, capture actual Node build/test results and the endpoint, persistence,
  runtime, and HTTP compatibility inventory in `.migration/MIGRATION_STATE.md`. Preserve the
  original Node implementation on `master`.
- On `feature/NAVDEVOPS-1`, remove the Node application/runtime and Node-only files after recording
  the source baseline. Implement Spring Boot directly at the repository root; do not create or
  retain `springboot/`. Keep and adapt shared SQL, docs, migration records, CI and packaging as
  appropriate. Do not claim Node tests ran after source removal.
- Target Java 21 and a published stable Spring Boot 4.0.x patch. Verify the exact patch from
  published metadata/repository before pinning it; do not use a milestone, snapshot, or another
  minor line.

## Before coding and baseline inventory

1. Read this skill, the root README, `.github/instructions/springboot-migration.instructions.md`,
   `.migration/MIGRATION_STATE.md`, and all relevant master source/tests/SQL.
2. Check branch and worktree state. The user may ask to switch from master to the existing feature
   branch; never create another branch. If the current branch is already the target, verify that
   fact and continue.
3. Run the master-source `npm ci` only when needed to provision absent dependencies, followed by
   `npm run build`, focused contract tests, and the full Node suite when feasible. Record the exact
   commands, versions, counts, and failures/skips before removal. If source already disappeared
   from the target branch, run baseline checks in a temporary read-only archive of master.
4. Record contracts for endpoints, DTOs, errors, authentication/authorization, configuration,
   database schema/seed, job behavior, status/body/headers, parsing, and compatibility pitfalls.
5. Check Java 21, Maven, and database availability. Use fake/in-memory tests for fast slices, and
   real PostgreSQL integration tests if configured/available. Do not reset or destructively alter
   a database.

## Ordered migration phases

### Phase 0 — Baseline, root build, and source replacement
- Record the actual Node baseline and contract inventory before any removal.
- Remove Node app/runtime files from the feature branch and restore/preserve shared
  `init/001-schema.sql` and `init/002-seed.sql`.
- Add a minimal Maven Spring Boot 4.0.x application at repository root, Java 21, and root-level
  Java source/test layout. Confirm no `springboot/` directory remains.

### Phase 1 — Runtime, configuration, health, and HTTP foundation
- Port environment configuration, startup/readiness, health, request ID echo/generation, structured
  logging, centralized errors, MVC/security filter ordering, CORS, and core HTTP behavior.
- Test response content type/headers, malformed/oversized JSON, error envelope, and unknown route.

### Phase 2 — PostgreSQL persistence and representation
- Port User and Order entities/repositories using the shared SQL as authority. Do not auto-create
  or mutate schema.
- Preserve string `bigint`/`numeric`, UUIDs, collation/order, soft-delete, and UTC millisecond dates.
- Test repository and DTO behavior with fixtures and PostgreSQL where available.

### Phase 3 — Users and authentication
- Port login/JWT/password verification, roles, user list/detail/create/patch/delete, validation,
  paging, filters, sorting, ownership and soft-delete rules.
- Cover blocked/deleted login, admin-only writes, conflicts, invalid/missing IDs, and omitted versus
  explicit-null PATCH behavior.

### Phase 4 — Orders API
- Port list/detail, status and inclusive date filters, pagination/order, admin visibility and
  ownership checks. Preserve serialized amounts/user IDs and UUID behavior.

### Phase 5 — Full Express contract parity
- Validate `status[]` extended query parsing, unknown-field stripping, error details, case and
  trailing slash behavior, HTML 404, relative `Location`, empty 204, UTF-8 JSON charset, weak ETag
  and `If-None-Match`, 100kb JSON limit, `X-Powered-By`, security/CORS headers, and every route.
- Compare against recorded baseline/tests and read-only master source. Add Java regression tests for
  each pitfall. No intentional divergence without explicit user approval and evidence.

### Phase 6 — Cleanup job, packaging, operations, final validation
- Port pending-order expiry (24 hours), disabled/test behavior, Node five-field cron conversion to
  Spring six-field expression, error logging, and graceful shutdown.
- Update root README, container/local run setup, CI, and operations docs. Keep shared SQL intact.
- Run all Java unit/integration tests, package/build, and available runtime/PostgreSQL checks.
- Confirm all Node source/runtime files are gone only from the feature branch, there is no
  `springboot/`, root Java sources/tests and docs are accurate, and master still contains the exact
  original Node baseline. The Node baseline is historical evidence, not a post-removal check.

## Required loop for every phase

For each phase, in order: inspect master evidence; implement a complete slice and focused tests;
build the root Maven application; run focused Java tests and applicable recorded-contract checks;
validate actual status/body/headers/edge cases using the implementer and validator role checklists;
fix issues and repeat build → test → validate; then persist exact files, commands/results, parity
evidence, limitations, and next phase in `.migration/MIGRATION_STATE.md` before advancing.
Never mark an unverified phase complete or infer runtime parity from compilation alone.
