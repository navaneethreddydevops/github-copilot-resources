---
name: migrate-express-to-springboot
description: "Start or resume the complete phased migration of this Express API to Spring Boot 4.0 in one invocation."
agent: springboot-migration-orchestrator
---

Replace this repository's Express + TypeScript API with a stable Spring Boot 4.0.x service at the repository root, targeting Java 21.

Run the full ordered workflow in `.github/skills/express-to-springboot-migration/SKILL.md` in this invocation, not just a plan or scaffold. Use `.migration/MIGRATION_STATE.md` as persistent progress memory: reconcile it with the actual worktree, start at the first incomplete or failed phase, and update it after every verified phase. For each phase, develop the slice, build it, run focused tests, validate parity against the Express source/tests/README, fix failures, and repeat build → test → validate before moving forward.

Verify that the existing `feature/NAVDEVOPS-1` branch is available and the worktree is safe; switch to it before implementation if necessary. Do not create another branch or modify `master`. Inspect master read-only and record actual Node build/test results plus the complete API, DB, runtime, and compatibility contract inventory in `.migration/MIGRATION_STATE.md` before removing source. If the target branch already lacks source, run the baseline from a temporary master archive.

After recording the baseline, remove Node application/runtime files on `feature/NAVDEVOPS-1` and implement Java directly at repository root; do not create or retain `springboot/`. Preserve/adapt shared SQL, README, CI, and deployment tooling. Use master read-only and recorded baseline evidence for parity. Never force a branch switch or discard feature work; never claim Node tests ran after removal.

After all required evidence is recorded, remove the Node implementation, Node-only dependencies/configuration/scripts/tests, and obsolete user-facing Node references on `feature/NAVDEVOPS-1` only. Retain migration records that explain the source contract and evidence. Re-run the full Spring Boot build/test suite and applicable runtime checks after cleanup. Confirm `master` still contains the original Node baseline. Continue phase by phase until complete or a concrete external blocker prevents safe progress; record exact commands/results and the blocker in the state file. Do not report unrun checks as passing.
