---
description: "Use when building the Spring Boot 4.0 counterpart of this repository's Express API."
applyTo: ["springboot/**/*.java", "springboot/**/*.xml", "springboot/**/*.properties", "springboot/**/*.yml", "springboot/**/*.yaml"]
---

# Spring Boot migration project instructions

- Treat the original `master` versions of `src/`, `tests/`, `README.md`, and `init/001-schema.sql` plus `init/002-seed.sql` as the behavior and data contract. Establish the Node baseline on `master`, then create `feature/NAVDEVOPS-1` before implementation. Keep `master` unchanged and do all migration work on the feature branch.
- When source details from `master` are needed, use it only for read-only inspection, then return to `feature/NAVDEVOPS-1` and verify the branch before editing. Never force a checkout or discard in-progress feature work; if switching is unsafe, inspect the required master file without checking out that branch.
- Keep the Java service in `springboot/` as a separate Maven module. Use a stable Spring Boot 4.0.x release (never a snapshot or a different minor line) and Java 21. Keep dependency versions managed by the Spring Boot parent/BOM unless there is a documented reason not to.
- Use Spring MVC, Bean Validation, Spring Data JPA, PostgreSQL, Spring Security, and focused integration tests where appropriate. Prefer constructor injection and explicit DTOs; do not expose persistence entities as API response models.
- Keep controllers for HTTP translation, services for business rules, and repositories for persistence. Preserve testability and avoid hidden global state.
- Keep behavior aligned with the documented API and deliberate parity pitfalls in `README.md`. In particular verify query-array syntax, string JSON values for PostgreSQL `bigint` and `numeric`, UTC millisecond timestamps, unknown-route HTML 404, case-insensitive/trailing-slash routing, relative `Location`, empty 204, JSON charset, weak ETag/conditional GET, five-to-six-field cron conversion, unknown-field handling, and `X-Powered-By`.
- Preserve the error envelope, request ID, auth/role/ownership rules, validation details, soft deletes, and the shared schema/seed data. Do not weaken security or make a documented incompatibility appear successful by changing the oracle.
- Each migration phase must build, run focused tests, and validate its actual contract before it is recorded complete in `.migration/MIGRATION_STATE.md`. Fix failures and repeat those checks before advancing.
- Keep the Node implementation available as the behavior oracle until every migration phase, full Node and Java checks, and parity validation have passed and been recorded. Then remove the Node implementation, Node-only dependencies/configuration/scripts/tests, and obsolete user-facing Node references on `feature/NAVDEVOPS-1` only; preserve the original Node baseline on `master` and retain migration evidence. Run the full Spring Boot checks and applicable runtime checks again after cleanup before declaring cutover complete. Never change the shared SQL contract.
