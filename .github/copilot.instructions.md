---
description: "Use when working on this Express + TypeScript REST API, especially routes, services, repositories, schemas, middleware, or tests. Covers project structure, validation, error handling, and regression testing for the sample API."
applyTo: ["src/**/*.ts", "tests/**/*.ts", "init/**/*.sql"]
---

# Project standards for this repository

- Follow the existing Express 4 + TypeScript architecture: routes orchestrate HTTP concerns, services hold business logic, and repositories encapsulate persistence.
- Keep the dependency flow consistent with the app factory: `createApp(deps)` composes repositories, services, and middleware; prefer that pattern over ad hoc globals or hidden side effects.
- Validate request data with the existing Zod schemas under `src/schemas` before business logic runs. Preserve the project’s validation error shape and do not silently accept unknown keys.
- Centralize HTTP errors through `AppError` and the shared `errorHandler`; keep status codes, `requestId`, and error envelopes consistent with the established API contract.
- Use `asyncHandler` for async route handlers; avoid unhandled promise rejections and do not bypass the middleware/error pipeline.
- Match the repository conventions: keep repository interfaces in `src/repositories`, concrete implementations under `src/repositories/typeorm` or `src/repositories/memory`, and update the relevant contracts when adding or changing persistence behavior.
- For route changes, update the corresponding schema, service, repository contract, and tests together so the API contract remains coherent.
- Favor small, explicit code changes that fit the existing project layout instead of introducing new frameworks or architectural patterns unless the task explicitly requires them.
- When modifying API behavior, preserve intentional parity behaviors described in the project docs unless the change is explicitly intended to alter that behavior.
- Prefer focused integration tests with `supertest` for endpoints and unit tests for service logic; add or update regression coverage whenever a bug fix or API contract change is made.
- Keep database assumptions aligned with the project setup: TypeORM sync is intentionally off, seeded data is fixed, and IDs/timestamps are meaningful test fixtures.
- Prefer the existing naming and file organization patterns already in this repo instead of creating parallel utilities or duplicate abstractions.

## Preferred implementation patterns

- Route files should focus on HTTP parsing, auth, validation, and delegation to services.
- Service files should contain domain/business rules and not directly depend on Express request/response objects.
- Repository implementations should hide database details behind the project’s repository interfaces.
- Middleware should be reusable and keep concerns such as request IDs, authentication, and error translation separate.
- New tests should validate the real request/response contract, not mock-only behavior.

## Guardrails

- Do not “fix” deliberate compatibility behaviors unless the task clearly calls for a behavioral change.
- Do not add one-off database logic or broad refactors without updating tests.
- Do not bypass standard auth, validation, or error handling flows.
