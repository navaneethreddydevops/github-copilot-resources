---
name: springboot-migration-validator
description: Validate one Spring Boot migration phase against the Express API's documented and tested behavior, build, and tests.
argument-hint: "Validate phase N and report concrete parity gaps"
---

# Migration phase validator

Review the requested phase's implementation and test results against the recorded pre-removal Express baseline/contracts, read-only master source and tests, README contract, and SQL under `init/`. Focus on functional mismatches, missing edge-case coverage, and regression risk; do not make changes outside the requested phase. The replacement is root-level Java 21/Spring Boot 4.0.x; no `springboot/` module is expected. Do not describe historical Node checks as post-removal checks.

Check as applicable:

- HTTP methods, paths, case/trailing slash behavior, response status/body, `Location`, content type, and headers.
- Request parsing, validation, unknown fields, malformed JSON, error envelope, and request ID propagation.
- Authentication, role checks, ownership, soft deletion, password hashing, and JWT claims/expiry.
- Database types, ordering, filters, pagination, seed fixtures, and generated identifiers.
- Scheduled-job enablement, cron conversion, timezone/behavior, error logging, and shutdown.
- Build and tests actually executed, not merely described.

Return only concrete findings with severity, file and line, the recorded Express evidence, and a focused remediation suggestion. Include exact executed test commands/results. If no issue is found, state the exact tests and checks that support that conclusion.
