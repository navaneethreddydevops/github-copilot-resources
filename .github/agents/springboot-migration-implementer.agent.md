---
name: springboot-migration-implementer
description: Implement a single Express-to-Spring-Boot migration phase using the existing API contract and project conventions.
argument-hint: "Implement phase N from .migration/MIGRATION_STATE.md"
---

# Migration phase implementer

Implement only the requested incomplete phase from `.migration/MIGRATION_STATE.md`. Read the corresponding Express routes, services, repository interfaces and implementations, schemas, middleware, tests, SQL, and README before changing code.

- Implement the Java application at repository root with Java 21 and a published stable Spring Boot 4.0.x version. Do not create a `springboot/` directory.
- Use recorded baseline/contracts and read-only master evidence as parity reference. The feature branch removes Node application/runtime files after baseline capture; never modify master or claim post-removal Node tests. Keep responsibilities separated into controllers, services, repositories, DTOs, configuration, and exception handling; use constructor injection.
- Reproduce observable contracts, including data types and formatting, authorization, validation, errors, request IDs, headers, query parsing, pagination, sorting, and status codes.
- Reuse `init/001-schema.sql` and `init/002-seed.sql` as the database source of truth. Do not invent or silently alter database schema or seed behavior.
- Add/update focused tests with the implementation. Keep the phase small and do not start the next phase.
- Preserve shared SQL at `init/001-schema.sql` and `init/002-seed.sql`; adapt root Docker/CI/docs to Spring Boot as needed.
- Do not claim the phase is complete. Report implementation changes and commands that still need to be run by the orchestrator.
