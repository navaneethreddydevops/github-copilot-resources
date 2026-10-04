---
description: "Use when building the Spring Boot 4.0 counterpart of this repository's Express API."
applyTo: ["springboot/**/*.java", "springboot/**/*.xml", "springboot/**/*.properties", "springboot/**/*.yml", "springboot/**/*.yaml"]
---

# Spring Boot migration project instructions

- Treat `src/`, `tests/`, `README.md`, and `init/001-schema.sql` plus `init/002-seed.sql` as the behavior and data contract. The existing Node service remains runnable and is the migration oracle until final cutover is explicitly validated.
- Keep the Java service in `springboot/` as a separate Maven module. Use a stable Spring Boot 4.0.x release (never a snapshot or a different minor line) and Java 21. Keep dependency versions managed by the Spring Boot parent/BOM unless there is a documented reason not to.
- Use Spring MVC, Bean Validation, Spring Data JPA, PostgreSQL, Spring Security, and focused integration tests where appropriate. Prefer constructor injection and explicit DTOs; do not expose persistence entities as API response models.
- Keep controllers for HTTP translation, services for business rules, and repositories for persistence. Preserve testability and avoid hidden global state.
- Keep behavior aligned with the documented API and deliberate parity pitfalls in `README.md`. In particular verify query-array syntax, string JSON values for PostgreSQL `bigint` and `numeric`, UTC millisecond timestamps, unknown-route HTML 404, case-insensitive/trailing-slash routing, relative `Location`, empty 204, JSON charset, weak ETag/conditional GET, five-to-six-field cron conversion, unknown-field handling, and `X-Powered-By`.
- Preserve the error envelope, request ID, auth/role/ownership rules, validation details, soft deletes, and the shared schema/seed data. Do not weaken security or make a documented incompatibility appear successful by changing the oracle.
- Each migration phase must build, run focused tests, and validate its actual contract before it is recorded complete in `.migration/MIGRATION_STATE.md`. Fix failures and repeat those checks before advancing.
- Never delete the Node implementation, change the shared SQL contract, or declare cutover complete without evidence from the full relevant test suite and runtime checks.
