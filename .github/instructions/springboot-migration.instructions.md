---
description: "Use when implementing or validating the root-level Spring Boot 4.0 replacement for this repository's former Express API."
applyTo: ["pom.xml", "src/main/java/**/*.java", "src/test/java/**/*.java", "src/main/resources/**/*.properties", "src/main/resources/**/*.yml", "src/main/resources/**/*.yaml"]
---

# Spring Boot migration project instructions

- Treat the original `master` versions of `src/`, `tests/`, `README.md`, and `init/` SQL as the behavior/data contract. Record the real Node build/test baseline before removing source. The existing target is `feature/NAVDEVOPS-1`; switch to it before implementation if needed, never create another branch, and keep master read-only.
- Inspect master using read-only tools/archive and verify the target branch before editing. Never force a checkout or discard in-progress feature work.
- Implement the service at repository root, not in `springboot/`. Use a published stable Spring Boot 4.0.x release (never a snapshot or different minor line) and Java 21. Keep dependency versions managed by the Spring Boot parent/BOM unless documented.
- Use Spring MVC, Bean Validation, Spring Data JPA, PostgreSQL, Spring Security, and focused integration tests where appropriate. Prefer constructor injection and explicit DTOs; do not expose persistence entities as API response models.
- Keep controllers for HTTP translation, services for business rules, and repositories for persistence. Preserve testability and avoid hidden global state.
- Keep behavior aligned with the recorded API contract and source-derived parity pitfalls in `README.md`. Verify query-array syntax, string JSON values for PostgreSQL `bigint` and `numeric`, UTC millisecond timestamps, unknown-route HTML 404, case-insensitive/trailing-slash routing, relative `Location`, empty 204, JSON charset, weak ETag/conditional GET, five-to-six-field cron conversion, unknown-field handling, and `X-Powered-By`.
- Preserve the error envelope, request ID, auth/role/ownership rules, validation details, soft deletes, and the shared schema/seed data. Do not weaken security or make a documented incompatibility appear successful by changing the oracle.
- Each migration phase must build, run focused tests, and validate its actual contract before it is recorded complete in `.migration/MIGRATION_STATE.md`. Fix failures and repeat those checks before advancing.
- The feature branch removes Node application/runtime files after the pre-removal baseline is recorded. Never report Node tests after removal; master remains the read-only source oracle. Retain/adapt shared SQL, migration evidence, and docs. Confirm no Node app files or `springboot/` remain, then run full Java checks/runtime checks before cutover. Never change the shared SQL contract.
