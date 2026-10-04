# Express to Spring Boot 4.0 migration state

This file is the persistent progress record for `.github/prompts/migrate-express-to-springboot.prompt.md`.
Update it after every verified phase. The original Node implementation on `master` is the behavior
oracle. Perform migration work and final legacy cleanup only on `feature/NAVDEVOPS-1`; keep `master`
unchanged.

## Branch workflow

- Verify the starting branch is `master` and the worktree is safe before establishing the Node build/test baseline.
- Create `feature/NAVDEVOPS-1` from `master` before any migration implementation or migration-file edits.
- Use `master` only for read-only source inspection when further Node details are needed. Return to and verify `feature/NAVDEVOPS-1` before editing; never force a checkout or discard feature work.
- Keep Node files available through all parity phases. After every phase and full pre-cleanup check passes and is recorded, remove the Node implementation and obsolete Node-only project references on the feature branch only.
- After cleanup, rerun the full Spring Boot build/test suite and applicable runtime checks. Retain this state file and other migration evidence; the original Node source remains on `master`.

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
