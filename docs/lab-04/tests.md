# Lab 4 Test Plan and Traceability

Status: Initial plan created before implementation; results are updated as each feature is verified. Final `main` evidence remains pending until the Lab 4 release merge.

| Test ID | Type | AC | Planned assertion | Intended test path | Final |
|---|---|---|---|---|---|
| API-01 | API | AC-01, AC-02 | Create valid Action Taken; validate required follow-up, performer/date rules and replay-safe Idempotency-Key behaviour | `server/tests/lab-04/actions-taken.api.test.ts` | Passed on feature branch, 2026-09-27 (9 tests in file) |
| API-02 | API/Auth | AC-03 | Enforce requester ownership and Staff/Admin write restrictions | `server/tests/lab-04/actions-taken.api.test.ts` | Passed on feature branch, 2026-09-27 (included in 9 tests above) |
| API-03 | API | AC-04 | Different Staff record separate actions on one Ticket | `server/tests/lab-04/actions-taken.api.test.ts` | Planned |
| API-04 | API/Workflow | AC-05 | Enforce active-owner, open-action, latest-completion, follow-up, post-reopen and summary gates; retain transition, authorization, version-conflict and audit-event behavior | `server/tests/lab-04/ticket-workflow.api.test.ts`, `server/tests/lab-04/ticket-workflow.unit.test.ts` | Passed on feature branch, 2026-09-27 (8 API and 4 unit tests) |
| API-05 | API | AC-06 | Requester metrics/rows match owned Ticket query and empty state | `server/tests/lab-04/dashboards.api.test.ts`, `server/tests/lab-02/ticket-query.unit.test.ts` | Passed on feature branch, 2026-09-27 (dashboard API: 7 tests shared with API-06; query unit: 6 tests) |
| API-06 | API | AC-07 | Staff metric calculations, recent ordering and role restrictions | `server/tests/lab-04/dashboards.api.test.ts`, `server/tests/lab-04/dashboard-filters.unit.test.ts` | Passed on feature branch, 2026-09-27 (dashboard API: 7 tests shared with API-05; filter unit: 2 tests) |
| UNIT-01 | Unit | AC-01, AC-02, AC-05 | Validate Action status/assignee/follow-up transitions, terminal immutability, completion-after-reopen and pure resolution-gate decisions | `server/tests/lab-04/actions-taken.unit.test.ts`, `server/tests/lab-04/ticket-workflow.unit.test.ts` | Passed on feature branch, 2026-09-27 (5 Action and 4 workflow unit tests) |
| INT-01 | Integration | AC-08 | Migration preserves Lab 3 records; repeat seed is idempotent | `server/tests/lab-04/migration-actions.integration.test.ts` | Planned |
| INT-02 | Integration/Recovery | AC-08 | Restore a captured database-and-attachment backup to a disposable recovery target; compare manifest row counts and sampled Ticket relationships | `server/tests/lab-04/migration-recovery.integration.test.ts` | Planned |
| SEED-01 | Unit/Regression | AC-08 | Keep the Action fixture key out of the Action row and avoid duplicate rows on a repeated seed | `server/tests/lab-04/seed-data.unit.test.ts` | Passed on feature branch, 2026-09-28 (1 test) |
| UI-01 | UI | AC-01, AC-03 | Action list, create/edit form, required-field validation, assignee-only completion, paginated retrieval, accurate totals after creation, and requester read-only view | `client/tests/lab-04/ActionsTaken.test.tsx` | Passed on feature branch, 2026-09-27 (6 tests in file) |
| UI-02 | UI | AC-05 | Show actionable resolution-gate feedback while preserving the stale-version reload instruction | `client/tests/lab-04/TicketWorkflow.test.tsx` | Passed on feature branch, 2026-09-27 (2 tests in file) |
| UI-03 | UI | AC-06 | Requester cards, zero state and drill-down links | `client/tests/lab-04/RequesterDashboard.test.tsx` | Passed on feature branch, 2026-09-27 (2 tests) |
| UI-04 | UI | AC-07 | Staff cards, recent rows, safe failure and drill-down links | `client/tests/lab-04/StaffDashboard.test.tsx` | Passed on feature branch, 2026-09-27 (2 tests) |
| STYLE-01 | UI style | AC-09 | Zen Green focus, responsive/card layout and no overflow | `client/tests/lab-04/ZenGreenLab4.styles.test.tsx` | Planned |
| RESP-01 | Responsive | AC-09 | Dashboard, Ticket Detail and Actions Taken work at 1440x900, 820x1180 and 390x844 without page-level overflow | `e2e/lab-04/responsive.spec.ts` | Implemented on feature branch, 2026-09-28 (3 browser tests); execution pending |
| PERF-01 | Performance smoke | AC-06, AC-07 | Seed a representative dashboard dataset and confirm each dashboard endpoint has p95 <= 500 ms across 20 warm local requests; record machine/database context as non-portable smoke evidence | `server/tests/lab-04/dashboard-performance.smoke.test.ts` | Planned |
| E2E-01 | E2E | AC-01-05 | Staff adds/edits multiple actions; requester sees read-only; resolve/close lifecycle | `e2e/lab-04/actions-taken-flow.spec.ts` | Passed on feature branch, 2026-09-28 (2 browser tests) |
| E2E-02 | E2E | AC-06-07 | Requester/Staff dashboards calculate, drill down and respect roles at three viewports | `e2e/lab-04/dashboards.spec.ts` | Implemented; isolated browser verification pending |
| REG-01 | Regression | AC-09 | Run Labs 1-3 server/client/auth/attachment/comment/note/admin tests | existing suites | Passed on feature branch, 2026-09-27 (server 128 passed / 4 intentional skips; client 36 passed, including Lab 4 dashboard coverage) |

## Execution commands

```bash
npm --prefix server test
npm --prefix client test
npm run e2e
```

Final evidence will record commit SHA, branch, discovered files/tests, command output and intentional skips. Migration tests use only a dedicated disposable schema; production/local user data is never reset for test execution.

## Feature-branch verification, 2026-09-27

The developer ran `npm test` from `server/` and `client/` on branch `feature/lab4-resolution-workflow` after commit `7fa005a` and supplied the terminal output. Server Vitest reported **22 files passed, 2 skipped; 118 tests passed, 4 skipped**. The skipped files were the opt-in Lab 3 migration and Administrator integration suites, which require an isolated database. Client Vitest reported **9 files passed; 32 tests passed**. The new Lab 4 workflow files contributed 8 API, 4 unit and 2 UI passing tests. Server `npm run build`, client `npx tsc --noEmit`, and `git diff --check` also passed. These are feature-branch results, not a claim that the final merged `main` has already been tested.

The developer then ran the full suites on `feature/lab4-dashboards` after commits `ff2adf9` and `6f2cf1a` and supplied the terminal output. Server Vitest reported **24 files passed, 2 skipped; 128 tests passed, 4 skipped**. Client Vitest reported **11 files passed; 36 tests passed**. The new dashboard coverage contributed 7 API, 2 queue-filter unit and 4 UI passing tests; the requester query unit file now has 6 passing tests. Server TypeScript build and client TypeScript checks passed in the feature workspace. The developer's client production build transformed **37 modules** and completed successfully. Isolated dashboard E2E, performance smoke and final `main` verification are still pending; this paragraph does not imply that they have passed.

## Lab 4 browser workflow preparation, 2026-09-28

Two browser scenarios were added on `feature/lab4-regression-e2e-release`: one creates a Requester Ticket, verifies that an open Action blocks resolution, completes the Action, resolves/closes the Ticket and verifies Requester read-only/API denial; the other checks that a second Staff member can record and edit work without changing the primary Ticket Owner. TypeScript checking of the new E2E spec and `git diff --check` passed. These scenarios have **not** been reported as passing E2E tests: this checkout lacks `server/.env`/`E2E_DATABASE_URL`, and E2E preparation resets only the dedicated `lab3_e2e` schema. The sandbox also denied directory access while Vitest loaded its Vite configuration, so it did not produce a new server/client regression result for this branch. Run the exact browser command below only with a disposable PostgreSQL test target; retain its Playwright report and terminal output for final evidence.

```bash
npm run e2e -- --grep "an open Action|another Staff member"
```

The first browser attempt stopped during test-server preparation, before any browser case executed. Prisma rejected the seed's private `key` field on `ActionTaken.create`. The seed now removes `key` from the Action data and stores it only in `ActionTakenIdempotency`; a focused repeat-seed regression test was added. Server TypeScript build passed after the fix. The developer ran `npm --prefix server test -- tests/lab-04/seed-data.unit.test.ts` and supplied output showing **1 test passed in 1 file**.

The developer reran `npm run e2e -- --grep "an open Action|another Staff member"` against the isolated E2E schema and supplied output showing **2 browser tests passed in 26.1 seconds**. This verifies the Action/resolve lifecycle and the second-Staff ownership case; it does not claim the full browser suite passed. A separate three-viewport responsive suite now captures Staff and Requester dashboards plus Ticket/Action details at desktop (1440x900), tablet (820x1180) and mobile (390x844). Its three cases are type-checked and discoverable by Playwright, but execution and screenshot evidence are pending.
