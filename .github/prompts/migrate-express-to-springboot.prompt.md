---
name: migrate-express-to-springboot
description: "Start or resume the complete phased migration of this Express API to Spring Boot 4.0 in one invocation."
agent: springboot-migration-orchestrator
---

Migrate this repository's Express + TypeScript API to a stable Spring Boot 4.0.x service.

Run the full ordered workflow in `.github/skills/express-to-springboot-migration/SKILL.md` in this invocation, not just a plan or scaffold. Use `.migration/MIGRATION_STATE.md` as persistent progress memory: reconcile it with the actual worktree, start at the first incomplete or failed phase, and update it after every verified phase. For each phase, develop the slice, build it, run focused tests, validate parity against the Express source/tests/README, fix failures, and repeat build → test → validate before moving forward.

First verify the starting branch is `master` and the worktree is safe, then establish the Node source baseline on `master`. Create `feature/NAVDEVOPS-1` from `master` before implementing the migration. Perform all migration edits, tests, documentation/state updates, and eventual cleanup on `feature/NAVDEVOPS-1`; do not modify `master`.

Keep the Node service available as the executable behavior oracle until every migration phase, full Node and Java checks, and parity validation have passed and been recorded. When further Node source information is needed from `master`, inspect it read-only, then return to and verify `feature/NAVDEVOPS-1` before editing. Never force a branch switch or discard feature work; if switching is unsafe, inspect the master version without checking it out.

After all required evidence is recorded, remove the Node implementation, Node-only dependencies/configuration/scripts/tests, and obsolete user-facing Node references on `feature/NAVDEVOPS-1` only. Retain migration records that explain the source contract and evidence. Re-run the full Spring Boot build/test suite and applicable runtime checks after cleanup. Confirm `master` still contains the original Node baseline. Continue phase by phase until complete or a concrete external blocker prevents safe progress; record exact commands/results and the blocker in the state file. Do not report unrun checks as passing.
