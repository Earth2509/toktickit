# Lab 3 Planned Tests and Traceability

Status: The engineering contract and authentication foundation are merged into `lab3-staging`. Issue #38 adds authenticated resource authorization, Login/change-password UI, removal of the development Requester selector and authenticated Lab 2 regression coverage. Verified subsets are recorded below; rows that include later Staff/Admin behavior remain Planned.

## Planned-test table

| ID | Type | AC | What it tests and expected result | Planned automated file | Final |
|---|---|---|---|---|---|
| UNIT-01 | Unit | AC-01,AC-02 | Password 11/12/128/129-code-point boundaries, whitespace, Unicode, confirmation, current-password reuse; correct accept/reject and salted hash verification | server/tests/lab-03/password.test.ts | Passed |
| API-01 | API | AC-01 | Active valid login returns safe user/cookie; unknown/null-hash/wrong password identical 401; verify dummy scrypt path uses equivalent work for unknown/null-hash; inactive wrong password generic 401, correct password 403 ACCOUNT_INACTIVE without session; no hash/token in JSON | server/tests/lab-03/auth.api.test.ts | Passed |
| API-02 | API | AC-01 | Sixth email failure and address threshold return 429 with Retry-After; expiry restores attempts; unknown accounts counted | server/tests/lab-03/auth.api.test.ts | Planned |
| API-03 | API | AC-02 | Pending sessions can use me/change/logout only; business routes deny until valid change; wrong current password returns 422 fieldErrors.currentPassword and preserves session/gate; 5 failures per user/30 per address across sessions then 429, expiry restores access | server/tests/lab-03/auth.api.test.ts | Planned |
| API-04 | API/integration | AC-03 | Expiry/logout/reset/role change/deactivation revoke sessions; password change rotates token; cookie clearing alone is not sufficient | server/tests/lab-03/auth.api.test.ts | Planned |
| API-05 | API | AC-03,AC-05 | Missing/foreign Origin, missing/bad CSRF, absent cookie, forged token rejected; no mutation; private responses no-store | server/tests/lab-03/authorization.api.test.ts | Planned |
| API-06 | API | AC-04,AC-05 | Cross-owner ticket and direct attachment download return identical missing 404; wrong roles 403 before lookup; legacy requesterId rejected for query/body/multipart | server/tests/lab-03/authorization.api.test.ts | Planned |
| API-07 | API | AC-04,AC-07 | Lab 2 creation/numbering/reference validation/idempotency remain correct under login; reused key by other owner returns 409 without data | server/tests/lab-03/requester-regression.api.test.ts | Planned |
| API-08 | API/integration | AC-07 | Valid upload/download/removal; MIME,size,count,association,removed download; upload/removal allowed on RESOLVED but denied CLOSED/CANCELLED per status table; file/metadata consistency | server/tests/lab-03/requester-regression.api.test.ts | Planned |
| DB-01 | Migration/integration | AC-06 | Migrate disposable populated Lab 2 DB: same IDs/numbers/ownership/removal references/file checksums, copied IT priority, no data loss | server/tests/lab-03/migration.test.ts | Planned |
| DB-02 | Migration/integration | AC-06 | Email collision preflight stops safely; provision/seed twice does not duplicate or overwrite passwords/edits; documented demo accounts/default and environment override work on new fixtures only; reject production defaults; never apply demo default to migrated users | server/tests/lab-03/migration.test.ts | Passed |
| API-09 | API | AC-08 | Search match/no match; each/combined filter; severity/status/tie ordering; page1/last/beyond; totals and invalid parameters | server/tests/lab-03/staff-queue.api.test.ts | Planned |
| API-10 | API/integration | AC-09 | Claim uses a conditional version write and records one audit event; stale writes are rejected without an event; assignment policy remains covered by the workflow route suite. | server/tests/lab-03/ticket-workflow.api.test.ts | Passed |
| API-11 | API | AC-10 | IT priority backfill/create equality, immutable requested priority; edit in each nonterminal status and deny RESOLVED/CLOSED/CANCELLED per status table; role denial | server/tests/lab-03/staff-ticket-detail.api.test.ts | Planned |
| API-12 | API/unit + API | AC-11 | Covers every pair in the documented 8x8 transition matrix, required owner/evidence, malformed evidence (422), stale-write conflict (409), and clearing an inactive historical owner during reopen. | server/tests/lab-03/ticket-workflow.unit.test.ts; server/tests/lab-03/ticket-workflow.api.test.ts | Passed |
| API-13 | API | AC-05,AC-12 | Ticket Detail's requester query explicitly excludes `internalNotes`; public/internal route visibility; author spoof rejection; empty/2000/2001 content; append-only endpoints; creation allowed RESOLVED but denied CLOSED/CANCELLED per table; newest-first stable pagination and unknown query rejection | server/tests/lab-03/comments-notes.api.test.ts; server/tests/lab-02/attachments.api.test.ts | Passed |
| API-14 | API | AC-13 | Own indication records server actor/time without changing status; repeat stable; terminal denied; workflow coverage verifies reopen clears marker and retains event | server/tests/lab-03/comments-notes.api.test.ts; server/tests/lab-03/ticket-workflow.api.test.ts | Passed |
| API-15 | API | AC-14 | Admin list/search/create/edit; each role alone and AND search, omitted role/all, no results, invalid/empty/repeated role query 400; normalized duplicate email; invalid mutation role/name/password 422; non-Admin denied; safe DTO | server/tests/lab-03/users-admin.api.test.ts | Planned |
| API-16 | API/integration | AC-15 | Reset forces change and revokes sessions; self-deactivation/last Admin demotion/deactivation rejected; concurrent changes cannot remove all Admins | server/tests/lab-03/users-admin.api.test.ts; server/tests/lab-03/users-admin.integration.test.ts | Planned |
| API-17 | API/integration | AC-09,AC-15 | Deactivation/demotion atomically unassigns active tickets, retains historical attribution, revokes sessions and creates events | server/tests/lab-03/users-admin.api.test.ts; server/tests/lab-03/users-admin.integration.test.ts | Planned |
| UI-01 | UI | AC-01,AC-16 | Login validation/busy/safe failure/inactive/throttle and keyboard labels | client/tests/lab-03/Login.test.tsx | Planned |
| UI-02 | UI | AC-02,AC-16 | Password gate, match/rules/busy/failure; wrong-current-password 422 stays on form with field message and no logout; 429 retry feedback; successful role landing | client/tests/lab-03/ChangePassword.test.tsx | Planned |
| UI-03 | UI | AC-03,AC-05,AC-07 | Role navigation/current user, startup gate, logout/back and stale-response clearing; no requester selector | client/tests/lab-03/AuthenticatedShell.test.tsx | Planned |
| UI-04 | UI | AC-08,AC-16 | Queue search/filter/sort/page/reset, old-query suppression, loading/empty/no-results/failure and detail/back | client/tests/lab-03/StaffTicketQueue.test.tsx | Planned |
| UI-05 | UI | AC-09,AC-10,AC-11,AC-12,AC-13 | Staff controls follow status table, confirmations, separate private/public drafts, newest post page1, busy/conflict/failure; visible resolution-indication author/time while formal status remains unchanged | client/tests/lab-03/StaffTicketDetail.test.tsx | Planned |
| UI-06 | UI | AC-07,AC-12,AC-13 | Requester regression, escaped discussion-text rendering, no edit/delete controls, public comments, indication confirmation and no internal note DOM/content | client/tests/lab-03/RequesterRegression.test.tsx | Planned |
| UI-07 | UI | AC-14,AC-15,AC-16 | Users create/edit/search/role-filter/reset; All roles omits parameter, combine search/role, clear both, no matches; validation/safety/forbidden/success, retained fields after failure | client/tests/lab-03/UserManagement.test.tsx | Planned |
| STYLE-01 | UI style | AC-16 | Shared tokens, badges, readable read-only fields, focus/error placement | client/tests/lab-03/ZenGreen.test.tsx | Planned |
| E2E-01 | E2E | AC-01,AC-02,AC-03 | Real login initial change, role landing, mutation/logout and direct route/API denial through relative /api proxy; local localhost:5173->3000 and E2E 127.0.0.1:4173->3001 cookie/Origin forwarding verified; no direct VITE_API_URL fallback | e2e/lab-03/authentication-foundation.spec.ts, followed by the Issue 3 UI flow | Planned |
| E2E-02 | E2E | AC-08,AC-09,AC-10,AC-11,AC-12,AC-13 | Real staff claim/priority/progress/public/internal exchange; Requester indication becomes visible with author/time in Staff Detail and queue marker before explicit staff resolution/close | e2e/lab-03/role-workflows.spec.ts | Planned |
| E2E-03 | E2E | AC-14,AC-15 | Admin create/edit/reset; target must change password; non-Admin forbidden and safety rejection | e2e/lab-03/role-workflows.spec.ts | Planned |
| E2E-04 | E2E/regression | AC-04,AC-05,AC-07 | Authenticated Requester create/attachments/search/detail; second Requester direct ticket/file denial, no internal notes | e2e/lab-02/requester-flow.spec.ts; e2e/lab-03/role-workflows.spec.ts | Planned |
| E2E-05 | Responsive/accessibility | AC-16 | All major screens at 1440x900,820x1180,390x844; keyboard, focus, labels, long data, no overflow/overlap; screenshots | e2e/lab-02/requester-flow.spec.ts; e2e/lab-03/role-workflows.spec.ts | Planned |

The Final column deliberately contains only `Planned` or `Passed`. The foundation run on commit `f99687e` completed UNIT-01, API-01 and DB-02. It also passed the already-implemented subsets of API-02 through API-04, DB-01 and E2E-01, but those rows remain `Planned` until every scenario named in the row is implemented and executed. The correction for PR #37 adds a real-database requester-directory assertion to the separately invoked migration suite; its result is recorded in the PR rather than retroactively changing the earlier commit evidence.

## AC-to-test matrix

| AC | Test IDs |
|---|---|
| AC-01 | UNIT-01,API-01,API-02,UI-01,E2E-01 |
| AC-02 | UNIT-01,API-03,UI-02,E2E-01 |
| AC-03 | API-04,API-05,UI-03,E2E-01 |
| AC-04 | API-06,API-07,E2E-04 |
| AC-05 | API-05,API-06,API-13,UI-03,E2E-04 |
| AC-06 | DB-01,DB-02 |
| AC-07 | API-07,API-08,UI-03,UI-06,E2E-04 |
| AC-08 | API-09,UI-04,E2E-02 |
| AC-09 | API-10,API-17,UI-05,E2E-02 |
| AC-10 | API-11,UI-05,E2E-02 |
| AC-11 | API-12,UI-05,E2E-02 |
| AC-12 | API-13,UI-05,UI-06,E2E-02 |
| AC-13 | API-14,UI-05,UI-06,E2E-02 |
| AC-14 | API-15,UI-07,E2E-03 |
| AC-15 | API-16,API-17,UI-07,E2E-03 |
| AC-16 | UI-01,UI-02,UI-04,UI-07,STYLE-01,E2E-05 |

## Test execution and evidence policy

Use TDD for meaningful security/workflow changes: establish failing test, implement, refactor, record the actual commands/outcomes in its PR. Run database/transaction/migration tests against an explicitly disposable test database, never development data. Mocked service tests alone cannot prove migration/concurrency guarantees. Keep existing Lab 1/2 regression suites; replace only tests specific to deliberately retired development identity with authenticated equivalents and explain changes.

Existing commands: `npm test` in server and client; `npm run e2e` at repository root. The foundation adds `npm run test:migration` in `server`; it requires `MIGRATION_TEST_DATABASE_URL` whose PostgreSQL URL explicitly names only the disposable `lab3_migration_test` schema. Final main evidence includes every command, commit SHA, branch, exit code, full raw output and actual discovered file/test totals. Do not infer counts from planned rows, transcribe fake terminal output, or mark Planned as Passed before execution. No test totals are asserted here.

## Issue #38 feature-branch execution evidence

Executed on `feature/lab3-auth-requester-regression` before the review commit. Database runs used only the named disposable schemas.

| Command | Actual result |
|---|---|
| `cd server && npm run build` | Passed; TypeScript also compiles the E2E preparation script |
| `cd server && npm test` | Superseded by the authenticated regression correction: the Lab 2 categories, ticket creation, My Tickets, and attachment suites are no longer excluded. Re-run this command and record the actual discovered file/test totals before merging. The deliberately retired Development Requester directory suite was removed because the route no longer exists. |
| `cd server && npm run test:migration` | 1 file and 2 integration tests passed against only `lab3_migration_test` |
| `cd client && npm test` | 6 files and 22 tests passed |
| `cd client && npm run build` | TypeScript and Vite production build passed |
| `npx playwright test` with the isolated server/client already running | 6 browser tests passed in 10.6 seconds against `lab3_e2e`: five authenticated Requester regressions and one same-origin authentication scenario |

The E2E result proves the real Login and mandatory initial-password flow, session-derived Requester ownership, ticket/attachment regression, responsive screens, same-origin cookie/CSRF transport and logout revocation. The Windows runner required prestarted servers because its supervised child-process cleanup did not terminate reliably; the application assertions themselves completed with exit code 0. Later Staff/Admin E2E rows remain Planned.

## Issue #40 staff queue execution evidence

Executed on `feature/lab3-it-staff-queue` after correcting queue-filter validation. The server suite confirms that invalid filters are rejected rather than silently discarded; the migration integration suite remains skipped because it requires the explicitly configured disposable migration database.

| Command | Actual result |
|---|---|
| `cd server && npm test` | **13 test files and 65 tests passed; 1 file and 2 migration tests skipped**. The run includes `tests/lab-03/authorization.api.test.ts` with 16 passing tests, including individual invalid-filter cases for category, related system, requested priority, IT priority, and status. Duration: 8.63 seconds. |
| `cd server && npm run build` | Passed; TypeScript compilation completed successfully. |
| `git diff --check` | Passed; no whitespace errors were reported. |

## Issue #41 ticket workflow execution evidence

Executed on `feature/lab3-ticket-workflow` after correcting URL Ticket-ID parsing in commit `1032411`. Follow-up review corrections add coverage for malformed transition evidence, clearing an ineligible owner during reopen, and all 64 status-pair decisions.

| Command | Actual result |
|---|---|
| `cd server && npm test` | **15 test files and 71 tests passed; 1 file and 2 migration tests skipped**. Includes 3 passing `ticket-workflow.api.test.ts` cases and 3 passing workflow-policy unit cases. Duration: 4.32 seconds. |
| `cd client && npm test` | **6 test files and 22 tests passed**. Duration: 14.98 seconds. |
| `cd server && npm run build` | Passed; TypeScript compilation completed successfully. |
| `cd client && npx tsc --noEmit` | Passed; client TypeScript compilation completed successfully. |

## Issue #44 E2E and responsive evidence plan

The final browser suite uses a resettable PostgreSQL schema named `lab3_e2e` only. It must never be pointed at a personal, shared, or production schema. Playwright starts the API on `127.0.0.1:3001` and the same-origin Vite client on `127.0.0.1:4173`; generated reports, traces, and screenshots are ignored under `artifacts/lab-03/`.

Run from the repository root in PowerShell:

```powershell
$env:E2E_DATABASE_URL = 'postgresql://USER:PASSWORD@localhost:5432/toktickit?schema=lab3_e2e'
npx playwright test
```

`role-workflows.spec.ts` captures the Staff queue, Staff Ticket Detail, Requester My Tickets, and Administrator User Management screens at desktop (1440x900), tablet (820x1180), and mobile (390x844). Its functional flows additionally prove: Requester resolution indication, public-comment visibility, Internal Note privacy, Staff claiming, Admin create/reset, and direct Users API denial for an IT Staff account. The existing authenticated Requester suite covers ticket creation, attachment upload/download/soft removal, owner scoping, and Requester Create/Detail responsive screens. Keep every E2E row as `Planned` until this command exits zero on the candidate commit and its actual terminal output is retained with the report.

## Issue #44 E2E and responsive execution evidence

Executed from `feature/lab3-e2e-evidence` using only the disposable `lab3_e2e` PostgreSQL schema. The suite reset and seeded that schema through the E2E server setup; it did not use the development schema.

| Command | Actual result |
|---|---|
| `npx playwright test` with `E2E_DATABASE_URL` explicitly set to the `lab3_e2e` schema | **11 browser tests passed in 32.0 seconds**: 5 authenticated Requester regression/responsive tests, 1 same-origin authentication/cookie/CSRF/logout test, 2 Staff/Requester/Admin authorization and discussion flows, and 3 role-aware desktop/tablet/mobile overflow checks. HTML report was written to `artifacts/lab-03/playwright-report`; traces and screenshot attachments were written to `artifacts/lab-03/test-results/<test-name>/`. These generated files are ignored, while this exact command/result is retained in the versioned evidence record. |

This run is authentic execution evidence for the implemented browser coverage. The detailed E2E rows above remain `Planned` where their planned prose intentionally names additional scenarios that are not yet individually automated (for example, every priority/progress path, every Admin safety rejection, and keyboard/long-data accessibility checks). The 11 passing tests are not presented as evidence for those unimplemented cases.

### PR #50 review correction

After strengthening the Administrator reset flow so it asserts the mandatory password gate before completing it, `npx playwright test --config=playwright.config.ts e2e/lab-03/role-workflows.spec.ts` passed **5 tests in 27.9 seconds**. This focused rerun covers the corrected mandatory-password assertion plus the Requester/Staff discussion and responsive role-workflow coverage.

Capture real pending states with controlled test request delays, and label fault-injection evidence as such. Store run output, traces, and screenshots in `artifacts/lab-03/test-results/`, with the HTML report in `artifacts/lab-03/playwright-report/`; both locations are generated and ignored. Include direct unauthorized attachment/internal-note API responses with secrets redacted. Final PDF must include the relevant captured output, not just a summary count.

## Final main verification evidence

Executed from `main` at commit `0381a8d` (the merge commit for PR #52) before this documentation-only evidence branch was created. The complete, unedited terminal capture is retained in [`final-main-verification-20260919.txt`](./final-main-verification-20260919.txt). It contains the source SHA and branch, every invoked command, discovered test totals, and the full runner output. Each command completed successfully with exit code 0.

| Command | Exit code | Actual result |
|---|---:|---|
| `cd server && npm test` | 0 | **18 files / 92 tests passed; 2 files / 4 tests skipped**. The skipped suites are the separately configured migration and Administrator integration suites. |
| `cd server && npm run test:migration` with `MIGRATION_TEST_DATABASE_URL` set to the disposable `lab3_migration_test` schema | 0 | **1 file / 2 tests passed** in 9.48 seconds. The expected collision-preflight error appears in the output because that negative case is asserted by the test. |
| `cd client && npm test` | 0 | **7 files / 24 tests passed** in 3.08 seconds. |
| `npm run e2e` from the repository root | 0 | **11 browser tests passed** in 31.9 seconds using the dedicated `lab3_e2e` schema. |

The server run intentionally does not use a normal-development schema for migration testing. The dedicated migration command proves the populated Lab 2-to-Lab 3 preservation and collision-preflight scenarios separately; the raw capture preserves both contexts rather than conflating skipped integration suites with failures.
