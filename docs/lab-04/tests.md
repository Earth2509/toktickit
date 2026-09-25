# Lab 4 Test Plan and Traceability

Status: Planned. This plan was created before implementation. Every row must be updated with the final main result and authentic command output.

| Test ID | Type | AC | Planned assertion | Intended test path | Final |
|---|---|---|---|---|---|
| API-01 | API | AC-01, AC-02 | Create valid Action Taken; validate required follow-up, performer/date rules and replay-safe Idempotency-Key behaviour | `server/tests/lab-04/actions-taken.api.test.ts` | Planned |
| API-02 | API/Auth | AC-03 | Enforce requester ownership and Staff/Admin write restrictions | `server/tests/lab-04/actions-taken.api.test.ts` | Planned |
| API-03 | API | AC-04 | Different Staff record separate actions on one Ticket | `server/tests/lab-04/actions-taken.api.test.ts` | Planned |
| API-04 | API/Workflow | AC-05 | Enforce owner/action/resolution gates, transition matrix and version conflict | `server/tests/lab-04/ticket-workflow.api.test.ts` | Planned |
| API-05 | API | AC-06 | Requester metrics/rows match owned Ticket query and empty state | `server/tests/lab-04/requester-dashboard.api.test.ts` | Planned |
| API-06 | API | AC-07 | Staff metric calculations, recent ordering and role restrictions | `server/tests/lab-04/staff-dashboard.api.test.ts` | Planned |
| UNIT-01 | Unit | AC-01, AC-02, AC-05 | Validate Action status/assignee/follow-up transitions, terminal immutability, completion-after-reopen and pure resolution-gate decisions | `server/tests/lab-04/actions-taken.unit.test.ts` | Planned |
| INT-01 | Integration | AC-08 | Migration preserves Lab 3 records; repeat seed is idempotent | `server/tests/lab-04/migration-actions.integration.test.ts` | Planned |
| INT-02 | Integration/Recovery | AC-08 | Restore a captured database-and-attachment backup to a disposable recovery target; compare manifest row counts and sampled Ticket relationships | `server/tests/lab-04/migration-recovery.integration.test.ts` | Planned |
| UI-01 | UI | AC-01, AC-03 | Action list, create/edit form, validation and requester read-only view | `client/tests/lab-04/ActionsTaken.test.tsx` | Planned |
| UI-02 | UI | AC-05 | Status controls and resolution gate feedback | `client/tests/lab-04/TicketWorkflow.test.tsx` | Planned |
| UI-03 | UI | AC-06 | Requester cards, zero state and drill-down links | `client/tests/lab-04/RequesterDashboard.test.tsx` | Planned |
| UI-04 | UI | AC-07 | Staff cards, recent rows, safe failure and drill-down links | `client/tests/lab-04/StaffDashboard.test.tsx` | Planned |
| STYLE-01 | UI style | AC-09 | Zen Green focus, responsive/card layout and no overflow | `client/tests/lab-04/ZenGreenLab4.styles.test.tsx` | Planned |
| RESP-01 | Responsive | AC-09 | Dashboard, Ticket Detail and Actions Taken work at 1440x900, 820x1180 and 390x844 without page-level overflow | `e2e/lab-04/responsive.spec.ts` | Planned |
| PERF-01 | Performance smoke | AC-06, AC-07 | Seed a representative dashboard dataset and confirm each dashboard endpoint has p95 <= 500 ms across 20 warm local requests; record machine/database context as non-portable smoke evidence | `server/tests/lab-04/dashboard-performance.smoke.test.ts` | Planned |
| E2E-01 | E2E | AC-01-05 | Staff adds/edits multiple actions; requester sees read-only; resolve/close lifecycle | `e2e/lab-04/actions-taken-flow.spec.ts`, `ticket-resolution.spec.ts` | Planned |
| E2E-02 | E2E | AC-06-07 | Requester/Staff dashboards calculate, drill down and respect roles at three viewports | `e2e/lab-04/dashboards.spec.ts` | Planned |
| REG-01 | Regression | AC-09 | Run Labs 1-3 server/client/auth/attachment/comment/note/admin tests | existing suites | Planned |

## Execution commands

```bash
npm --prefix server test
npm --prefix client test
npm run e2e
```

Final evidence will record commit SHA, branch, discovered files/tests, command output and intentional skips. Migration tests use only a dedicated disposable schema; production/local user data is never reset for test execution.
