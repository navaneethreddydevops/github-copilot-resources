# Express to Spring Boot 4.0 migration state

This file is the persistent progress record for `.github/prompts/migrate-express-to-springboot.prompt.md`.
Update it after every verified phase. The repository's Node implementation remains the behavior
oracle and must remain intact until all phases are validated.

## Current status

- Overall: Not started
- Active phase: Phase 0 — Baseline and Java module
- Last verified phase: None
- Target: Stable Spring Boot 4.0.x, Java 21, Maven module at `springboot/`
- Last updated: 2026-10-04
- Blocker: None recorded

## Phase checklist

| Phase | Scope | Status | Build / test / validation evidence |
|---|---|---|---|
| 0 | Baseline and Java module | Not started | |
| 1 | Runtime, configuration, health, and HTTP foundation | Not started | |
| 2 | PostgreSQL persistence and data representation | Not started | |
| 3 | User API and authentication | Not started | |
| 4 | Orders API | Not started | |
| 5 | Express compatibility and complete contract parity | Not started | |
| 6 | Cleanup job, packaging, operations, and cutover readiness | Not started | |

## Verified phase notes

For each phase, record:

- Completion date and changed files.
- Exact build, test, and validation commands with pass/fail results.
- Contracts covered and concrete parity evidence.
- Any approved divergence, skipped check with reason, or blocker.
- The next phase to run.

No phase is complete until its build, focused tests, and parity validation have all passed.
