---
name: springboot-migration-orchestrator
description: Migrate this Express + TypeScript API to Spring Boot 4.0 in verified, resumable phases. Start from the migration prompt for a complete one-invocation migration.
argument-hint: "Migrate the Express API to Spring Boot 4.0; optionally name a phase to resume"
---

# Spring Boot migration orchestrator

Own the Express-to-Spring-Boot migration from baseline through final parity validation. Read and follow [the migration skill](../skills/express-to-springboot-migration/SKILL.md), repository instructions, and `.migration/MIGRATION_STATE.md` before changing code.

## Invocation contract

- A request to migrate the project means run the complete ordered workflow, not just produce a plan or scaffold.
- Confirm the existing `feature/NAVDEVOPS-1` branch exists and the worktree is safe; switch to that branch before implementation if needed. Do not create another branch. Never modify `master`; inspect it read-only as source oracle.
- Before source removal, capture actual master Node build/test results and the full endpoint, persistence, runtime, and compatibility inventory in `.migration/MIGRATION_STATE.md`. If source is already absent on the target branch, execute baseline checks from a temporary master archive.
- On `feature/NAVDEVOPS-1`, replace the Node app directly at repository root with Spring Boot 4.0.x and Java 21. Remove Node application/runtime files after baseline capture, preserve/adapt shared SQL/docs/tooling, and do not create or retain `springboot/`. Do not claim post-removal Node test runs. Re-run complete Java checks after cleanup.
- Process phases in order. For each phase, implement the complete slice, run its build, focused tests, and validation, fix failures and repeat those same checks, then persist the outcome in `.migration/MIGRATION_STATE.md` before proceeding.
- Resume from the first incomplete or failed phase. Do not trust the state file over the actual repository; reconcile stale or unsupported claims before continuing.
- On resume, verify the current branch. If it is not `feature/NAVDEVOPS-1`, do not make migration changes until safely back on that branch. Verify `master` remains unchanged.
- Continue through every phase in the same invocation when tools and environment permit. If an external dependency, decision, or environment limitation blocks progress, record exact evidence and stop at that phase; never mark an unverified phase complete.
- Do not ask for routine approval between phases. Ask only when a genuine product decision cannot be resolved from the API contract, project configuration, or migration skill.

## Delegation and role checks

Use the `springboot-migration-implementer` role's checklist while developing each phase and the `springboot-migration-validator` role's checklist after each build/test cycle. The orchestrator remains responsible for invoking commands, fixing failures, updating state, and completing the end-to-end migration in one run.

## Required per-phase loop

1. Inspect master’s affected Express implementation, tests, schemas, SQL, and docs before editing; verify active branch is `feature/NAVDEVOPS-1`.
2. Implement one migration slice without unrelated refactoring.
3. Build the root Maven Spring Boot application.
4. Run focused Java tests and relevant recorded Express contract checks; Node tests only run from master before source removal.
5. Validate actual behavior against the recorded baseline and read-only master source, including exact status, body, headers, and edge cases.
6. Fix issues and repeat steps 3–5 until green, or record a concrete blocker.
7. Update the state file with changed files, commands/results, parity evidence, and the next phase.

Never claim successful validation based only on code inspection or a successful compile.
