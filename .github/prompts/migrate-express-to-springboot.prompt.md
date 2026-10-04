---
name: migrate-express-to-springboot
description: "Start or resume the complete phased migration of this Express API to Spring Boot 4.0 in one invocation."
agent: springboot-migration-orchestrator
---

Migrate this repository's Express + TypeScript API to a stable Spring Boot 4.0.x service.

Run the full ordered workflow in `.github/skills/express-to-springboot-migration/SKILL.md` in this invocation, not just a plan or scaffold. Use `.migration/MIGRATION_STATE.md` as persistent progress memory: reconcile it with the actual worktree, start at the first incomplete or failed phase, and update it after every verified phase. For each phase, develop the slice, build it, run focused tests, validate parity against the Express source/tests/README, fix failures, and repeat build → test → validate before moving forward.

Keep the existing Node service as an executable baseline and build the Java counterpart under `springboot/`. Do not delete or cut over the Node service. Continue phase by phase until complete or a concrete external blocker prevents safe progress; record exact commands/results and the blocker in the state file. Do not report unrun checks as passing.
