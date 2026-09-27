# Lab 4 Test Plan and Traceability

Status: Initial plan created before implementation; results are updated as each feature is verified. Final `main` evidence remains pending until the Lab 4 release merge.

| Test ID | Type | AC | Planned assertion | Intended test path | Final |
|---|---|---|---|---|---|
| API-01 | API | AC-01, AC-02 | Create valid Action Taken; validate required follow-up, performer/date rules and replay-safe Idempotency-Key behaviour | `server/tests/lab-04/actions-taken.api.test.ts` | Passed on feature branch, 2026-09-27 (9 tests in file) |
| API-02 | API/Auth | AC-03 | Enforce requester ownership and Staff/Admin write restrictions | `server/tests/lab-04/actions-taken.api.test.ts` | Passed on feature branch, 2026-09-27 (included in 9 tests above) |
| API-03 | API | AC-04 | Different Staff record separate actions on one Ticket | `server/tests/lab-04/actions-taken.api.test.ts` | Planned |
| API-04 | API/Workflow | AC-05 | Enforce active-owner, open-action, latest-completion, follow-up, post-reopen and summary gates; retain transition, authorization, version-conflict and audit-event behavior | `server/tests/lab-04/ticket-workflow.api.test.ts`, `server/tests/lab-04/ticket-workflow.unit.test.ts` | Passed on feature branch, 2026-09-27 (8 API and 4 unit tests) |
| API-05 | API | AC-06 | Requester metrics/rows match owned Ticket query and empty state | `server/tests/lab-04/dashboards.api.test.ts`, `server/tests/lab-02/ticket-query.unit.test.ts` | Implemented; feature-branch verification pending |
| API-06 | API | AC-07 | Staff metric calculations, recent ordering and role restrictions | `server/tests/lab-04/dashboards.api.test.ts`, `server/tests/lab-04/dashboard-filters.unit.test.ts` | Implemented; feature-branch verification pending |
| UNIT-01 | Unit | AC-01, AC-02, AC-05 | Validate Action status/assignee/follow-up transitions, terminal immutability, completion-after-reopen and pure resolution-gate decisions | `server/tests/lab-04/actions-taken.unit.test.ts`, `server/tests/lab-04/ticket-workflow.unit.test.ts` | Passed on feature branch, 2026-09-27 (5 Action and 4 workflow unit tests) |
| INT-01 | Integration | AC-08 | Migration preserves Lab 3 records; repeat seed is idempotent | `server/tests/lab-04/migration-actions.integration.test.ts` | Planned |
| INT-02 | Integration/Recovery | AC-08 | Restore a captured database-and-attachment backup to a disposable recovery target; compare manifest row counts and sampled Ticket relationships | `server/tests/lab-04/migration-recovery.integration.test.ts` | Planned |
| UI-01 | UI | AC-01, AC-03 | Action list, create/edit form, required-field validation, assignee-only completion, paginated retrieval, accurate totals after creation, and requester read-only view | `client/tests/lab-04/ActionsTaken.test.tsx` | Passed on feature branch, 2026-09-27 (6 tests in file) |
| UI-02 | UI | AC-05 | Show actionable resolution-gate feedback while preserving the stale-version reload instruction | `client/tests/lab-04/TicketWorkflow.test.tsx` | Passed on feature branch, 2026-09-27 (2 tests in file) |
| UI-03 | UI | AC-06 | Requester cards, zero state and drill-down links | `client/tests/lab-04/RequesterDashboard.test.tsx` | Implemented; feature-branch verification pending |
| UI-04 | UI | AC-07 | Staff cards, recent rows, safe failure and drill-down links | `client/tests/lab-04/StaffDashboard.test.tsx` | Implemented; feature-branch verification pending |
| STYLE-01 | UI style | AC-09 | Zen Green focus, responsive/card layout and no overflow | `client/tests/lab-04/ZenGreenLab4.styles.test.tsx` | Planned |
| RESP-01 | Responsive | AC-09 | Dashboard, Ticket Detail and Actions Taken work at 1440x900, 820x1180 and 390x844 without page-level overflow | `e2e/lab-04/responsive.spec.ts` | Planned |
| PERF-01 | Performance smoke | AC-06, AC-07 | Seed a representative dashboard dataset and confirm each dashboard endpoint has p95 <= 500 ms across 20 warm local requests; record machine/database context as non-portable smoke evidence | `server/tests/lab-04/dashboard-performance.smoke.test.ts` | Planned |
| E2E-01 | E2E | AC-01-05 | Staff adds/edits multiple actions; requester sees read-only; resolve/close lifecycle | `e2e/lab-04/actions-taken-flow.spec.ts`, `ticket-resolution.spec.ts` | Planned |
| E2E-02 | E2E | AC-06-07 | Requester/Staff dashboards calculate, drill down and respect roles at three viewports | `e2e/lab-04/dashboards.spec.ts` | Implemented; isolated browser verification pending |
| REG-01 | Regression | AC-09 | Run Labs 1-3 server/client/auth/attachment/comment/note/admin tests | existing suites | Passed on feature branch, 2026-09-27 (server 118 passed / 4 intentional skips; client 32 passed) |

## Execution commands

```bash
npm --prefix server test
npm --prefix client test
npm run e2e
```

Final evidence will record commit SHA, branch, discovered files/tests, command output and intentional skips. Migration tests use only a dedicated disposable schema; production/local user data is never reset for test execution.

## Feature-branch verification, 2026-09-27

The developer ran `npm test` from `server/` and `client/` on branch `feature/lab4-resolution-workflow` after commit `7fa005a` and supplied the terminal output. Server Vitest reported **22 files passed, 2 skipped; 118 tests passed, 4 skipped**. The skipped files were the opt-in Lab 3 migration and Administrator integration suites, which require an isolated database. Client Vitest reported **9 files passed; 32 tests passed**. The new Lab 4 workflow files contributed 8 API, 4 unit and 2 UI passing tests. Server `npm run build`, client `npx tsc --noEmit`, and `git diff --check` also passed. These are feature-branch results, not a claim that the final merged `main` has already been tested.
