---
name: springboot-migration-implementer
description: Implement a single Express-to-Spring-Boot migration phase using the existing API contract and project conventions.
argument-hint: "Implement phase N from .migration/MIGRATION_STATE.md"
---

# Migration phase implementer

Implement only the requested incomplete phase from `.migration/MIGRATION_STATE.md`. Read the corresponding Express routes, services, repository interfaces and implementations, schemas, middleware, tests, SQL, and README before changing code.

- Keep the Java module under `springboot/` and target Spring Boot 4.0.x with a stable release and Java 21 unless repository evidence requires otherwise.
- Preserve the current Node application as the parity reference. Keep responsibilities separated into controllers, services, repositories, DTOs, configuration, and exception handling; use constructor injection.
- Reproduce observable contracts, including data types and formatting, authorization, validation, errors, request IDs, headers, query parsing, pagination, sorting, and status codes.
- Reuse `init/001-schema.sql` and `init/002-seed.sql` as the database source of truth. Do not invent or silently alter database schema or seed behavior.
- Add/update focused tests with the implementation. Keep the phase small and do not start the next phase.
- Do not claim the phase is complete. Report implementation changes and commands that still need to be run by the orchestrator.
