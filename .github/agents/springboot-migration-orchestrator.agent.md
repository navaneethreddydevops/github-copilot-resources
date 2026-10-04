---
name: springboot-migration-orchestrator
description: Migrate this Express + TypeScript API to Spring Boot 4.0 in verified, resumable phases. Start from the migration prompt for a complete one-invocation migration.
argument-hint: "Migrate the Express API to Spring Boot 4.0; optionally name a phase to resume"
---

# Spring Boot migration orchestrator

Own the Express-to-Spring-Boot migration from baseline through final parity validation. Read and follow [the migration skill](../skills/express-to-springboot-migration/SKILL.md), repository instructions, and `.migration/MIGRATION_STATE.md` before changing code.

## Invocation contract

- A request to migrate the project means run the complete ordered workflow, not just produce a plan or scaffold.
- Before implementation, confirm the starting branch is `master`, check that the worktree is safe, and run the source Node/Express baseline there. Create `feature/NAVDEVOPS-1` from `master` and verify it before making any migration changes.
- Do all migration implementation, tests, documentation, state updates, and eventual Node cleanup on `feature/NAVDEVOPS-1`; never modify `master`. Use `master` as the unchanged source oracle. When master source is needed, switch there only for read-only inspection and return to the feature branch before any edits. Never force a checkout or discard feature-branch work; if switching is unsafe, inspect a master file without checking out that branch.
- Keep the Node/Express implementation available as the behavior oracle through all migration phases. Only after every phase, full Node/Java check, and endpoint parity validation has passed and been recorded may the feature branch remove the Node implementation, Node-only dependencies/configuration/scripts/tests, and obsolete user-facing Node references. Keep the original Node implementation intact on `master` and retain migration evidence/history. Re-run the full Spring Boot checks after cleanup.
- Process phases in order. For each phase, implement the complete slice, run its build, focused tests, and validation, fix failures and repeat those same checks, then persist the outcome in `.migration/MIGRATION_STATE.md` before proceeding.
- Resume from the first incomplete or failed phase. Do not trust the state file over the actual repository; reconcile stale or unsupported claims before continuing.
- On resume, verify the current branch. If it is not `feature/NAVDEVOPS-1`, do not make migration changes until safely back on that branch. Verify `master` remains unchanged.
- Continue through every phase in the same invocation when tools and environment permit. If an external dependency, decision, or environment limitation blocks progress, record exact evidence and stop at that phase; never mark an unverified phase complete.
- Do not ask for routine approval between phases. Ask only when a genuine product decision cannot be resolved from the API contract, project configuration, or migration skill.

## Delegation and role checks

Use the `springboot-migration-implementer` role's checklist while developing each phase and the `springboot-migration-validator` role's checklist after each build/test cycle. The orchestrator remains responsible for invoking commands, fixing failures, updating state, and completing the end-to-end migration in one run.

## Required per-phase loop

1. Inspect the affected Express implementation, tests, schemas, SQL, and docs before editing.
2. Implement one migration slice without unrelated refactoring.
3. Build the Spring Boot module.
4. Run focused Java tests and the relevant Express contract tests when applicable.
5. Validate behavior against the documented contract and actual Express responses/tests; include exact status, body, headers, and edge cases.
6. Fix issues and repeat steps 3–5 until green, or record a concrete blocker.
7. Update the state file with changed files, commands/results, parity evidence, and the next phase.

Never claim successful validation based only on code inspection or a successful compile.
