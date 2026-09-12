# Lab 3 Planned Tests and Traceability

Status: The engineering contract was merged to `lab3-staging` at `d819957`. On the authentication-foundation branch, the password/API suites and Lab 2 regressions passed, and the migration/provisioning/seed integration suite passed against the dedicated `lab3_migration_test` schema. Rows for later backlog items remain planned work, not claims that files already exist.

## Planned-test table

| ID | Type | AC | What it tests and expected result | Planned automated file | Final |
|---|---|---|---|---|---|
| UNIT-01 | Unit | AC-01,AC-02 | Password 11/12/128/129-code-point boundaries, whitespace, Unicode, confirmation, current-password reuse; correct accept/reject and salted hash verification | server/tests/lab-03/password.test.ts | Foundation password scenarios passed; confirmation/reuse also covered through API tests |
| API-01 | API | AC-01 | Active valid login returns safe user/cookie; unknown/null-hash/wrong password identical 401; verify dummy scrypt path uses equivalent work for unknown/null-hash; inactive wrong password generic 401, correct password 403 ACCOUNT_INACTIVE without session; no hash/token in JSON | server/tests/lab-03/auth.api.test.ts | Foundation login scenarios passed; additional timing/expiry cases remain planned |
| API-02 | API | AC-01 | Sixth email failure and address threshold return 429 with Retry-After; expiry restores attempts; unknown accounts counted | server/tests/lab-03/auth.api.test.ts | Email threshold and Retry-After passed; address/expiry cases remain planned |
| API-03 | API | AC-02 | Pending sessions can use me/change/logout only; business routes deny until valid change; wrong current password returns 422 fieldErrors.currentPassword and preserves session/gate; 5 failures per user/30 per address across sessions then 429, expiry restores access | server/tests/lab-03/auth.api.test.ts | Foundation password-change scenarios passed; Issue 3 completes the business-route gate |
| API-04 | API/integration | AC-03 | Expiry/logout/reset/role change/deactivation revoke sessions; password change rotates token; cookie clearing alone is not sufficient | server/tests/lab-03/auth.api.test.ts | Logout and password-rotation scenarios passed; later Admin operations complete coverage |
| API-05 | API | AC-03,AC-05 | Missing/foreign Origin, missing/bad CSRF, absent cookie, forged token rejected; no mutation; private responses no-store | server/tests/lab-03/authorization.api.test.ts | Planned |
| API-06 | API | AC-04,AC-05 | Cross-owner ticket and direct attachment download return identical missing 404; wrong roles 403 before lookup; legacy requesterId rejected for query/body/multipart | server/tests/lab-03/authorization.api.test.ts | Planned |
| API-07 | API | AC-04,AC-07 | Lab 2 creation/numbering/reference validation/idempotency remain correct under login; reused key by other owner returns 409 without data | server/tests/lab-03/requester-regression.api.test.ts | Planned |
| API-08 | API/integration | AC-07 | Valid upload/download/removal; MIME,size,count,association,removed download; upload/removal allowed on RESOLVED but denied CLOSED/CANCELLED per status table; file/metadata consistency | server/tests/lab-03/requester-regression.api.test.ts | Planned |
| DB-01 | Migration/integration | AC-06 | Migrate disposable populated Lab 2 DB: same IDs/numbers/ownership/removal references/file checksums, copied IT priority, no data loss | server/tests/lab-03/migration.test.ts | Passed for preserved IDs, ticket ownership and attachment-removal attribution in `lab3_migration_test`; later ticket fields/files extend this coverage |
| DB-02 | Migration/integration | AC-06 | Email collision preflight stops safely; provision/seed twice does not duplicate or overwrite passwords/edits; documented demo accounts/default and environment override work on new fixtures only; reject production defaults; never apply demo default to migrated users | server/tests/lab-03/migration.test.ts | Collision stop, one-time provisioning, repeated seed and non-overwrite scenarios passed |
| API-09 | API | AC-08 | Search match/no match; each/combined filter; severity/status/tie ordering; page1/last/beyond; totals and invalid parameters | server/tests/lab-03/staff-queue.api.test.ts | Planned |
| API-10 | API/integration | AC-09 | Parameterize owner/claim policy for all statuses: null only NEW/REOPENED, active-work manual null denied, terminal edits denied; repair BR-20 unassigned exception; inactive/wrong-role rejection; concurrent claims one winner/event | server/tests/lab-03/staff-ticket-detail.api.test.ts | Planned |
| API-11 | API | AC-10 | IT priority backfill/create equality, immutable requested priority; edit in each nonterminal status and deny RESOLVED/CLOSED/CANCELLED per status table; role denial | server/tests/lab-03/staff-ticket-detail.api.test.ts | Planned |
| API-12 | API/integration | AC-11 | Parameterize all 8x8 transitions with role/version/owner/reason/summary; NEW -> OPEN needs claim; historical inactive owner may close RESOLVED; reopen clears ineligible owner; BR-20 exception needs reassignment before any transition; failed update rolls back event | server/tests/lab-03/staff-ticket-detail.api.test.ts | Planned |
| API-13 | API | AC-05,AC-12 | Public/internal visibility matrix; author spoof rejection; empty/2000/2001 content; safe HTML rendering payload; no editing/deletion; creation allowed RESOLVED but denied CLOSED/CANCELLED per table; newest-first stable pagination | server/tests/lab-03/comments-notes.api.test.ts | Planned |
| API-14 | API | AC-13 | Own indication records server actor/time without changing status; repeat stable; other owner/role/terminal denied; reopen clears marker and retains event | server/tests/lab-03/staff-ticket-detail.api.test.ts | Planned |
| API-15 | API | AC-14 | Admin list/search/create/edit; each role alone and AND search, omitted role/all, no results, invalid/empty/repeated role query 400; normalized duplicate email; invalid mutation role/name/password 422; non-Admin denied; safe DTO | server/tests/lab-03/users-admin.api.test.ts | Planned |
| API-16 | API/integration | AC-15 | Reset forces change and revokes sessions; self-deactivation/last Admin demotion/deactivation rejected; concurrent changes cannot remove all Admins | server/tests/lab-03/users-admin.api.test.ts | Planned |
| API-17 | API/integration | AC-09,AC-15 | Deactivation/demotion atomically unassigns active tickets, retains historical attribution, revokes sessions and creates events | server/tests/lab-03/users-admin.api.test.ts | Planned |
| UI-01 | UI | AC-01,AC-16 | Login validation/busy/safe failure/inactive/throttle and keyboard labels | client/tests/lab-03/Login.test.tsx | Planned |
| UI-02 | UI | AC-02,AC-16 | Password gate, match/rules/busy/failure; wrong-current-password 422 stays on form with field message and no logout; 429 retry feedback; successful role landing | client/tests/lab-03/ChangePassword.test.tsx | Planned |
| UI-03 | UI | AC-03,AC-05,AC-07 | Role navigation/current user, startup gate, logout/back and stale-response clearing; no requester selector | client/tests/lab-03/AuthenticatedShell.test.tsx | Planned |
| UI-04 | UI | AC-08,AC-16 | Queue search/filter/sort/page/reset, old-query suppression, loading/empty/no-results/failure and detail/back | client/tests/lab-03/StaffTicketQueue.test.tsx | Planned |
| UI-05 | UI | AC-09,AC-10,AC-11,AC-12,AC-13 | Staff controls follow status table, confirmations, separate private/public drafts, newest post page1, busy/conflict/failure; visible resolution-indication author/time while formal status remains unchanged | client/tests/lab-03/StaffTicketDetail.test.tsx | Planned |
| UI-06 | UI | AC-07,AC-12,AC-13 | Requester regression, public comments, indication confirmation and no internal note DOM/content | client/tests/lab-03/RequesterRegression.test.tsx | Planned |
| UI-07 | UI | AC-14,AC-15,AC-16 | Users create/edit/search/role-filter/reset; All roles omits parameter, combine search/role, clear both, no matches; validation/safety/forbidden/success, retained fields after failure | client/tests/lab-03/UserManagement.test.tsx | Planned |
| STYLE-01 | UI style | AC-16 | Shared tokens, badges, readable read-only fields, focus/error placement | client/tests/lab-03/ZenGreen.test.tsx | Planned |
| E2E-01 | E2E | AC-01,AC-02,AC-03 | Real login initial change, role landing, mutation/logout and direct route/API denial through relative /api proxy; local localhost:5173->3000 and E2E 127.0.0.1:4173->3001 cookie/Origin forwarding verified; no direct VITE_API_URL fallback | e2e/lab-03/authentication-foundation.spec.ts, followed by the Issue 3 UI flow | Foundation proxy/cookie/Origin/CSRF/logout-revocation scenario passed; UI/gate flow remains planned |
| E2E-02 | E2E | AC-08,AC-09,AC-10,AC-11,AC-12,AC-13 | Real staff claim/priority/progress/public/internal exchange; Requester indication becomes visible with author/time in Staff Detail and queue marker before explicit staff resolution/close | e2e/lab-03/staff-ticket-flow.spec.ts | Planned |
| E2E-03 | E2E | AC-14,AC-15 | Admin create/edit/reset; target must change password; non-Admin forbidden and safety rejection | e2e/lab-03/user-administration.spec.ts | Planned |
| E2E-04 | E2E/regression | AC-04,AC-05,AC-07 | Authenticated Requester create/attachments/search/detail; second Requester direct ticket/file denial, no internal notes | e2e/lab-03/requester-regression.spec.ts | Planned |
| E2E-05 | Responsive/accessibility | AC-16 | All major screens at 1440x900,820x1180,390x844; keyboard, focus, labels, long data, no overflow/overlap; screenshots | e2e/lab-03/responsive.spec.ts | Planned |

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

## Authentication-foundation execution evidence

Executed on `feature/lab3-auth-foundation` immediately before the correction commit:

| Command | Actual result |
|---|---|
| `cd server && npm run build` | Passed |
| `cd server && npm test` | 12 test files passed; 51 tests passed; the separately invoked migration file was skipped in this command |
| `cd server && npm run test:migration` | 1 file and 2 integration tests passed against only `lab3_migration_test` |
| `cd client && npm test` | 6 files and 20 tests passed |
| `cd client && npm run build` | TypeScript and Vite production build passed |
| `npm run e2e` | 6 browser tests passed using the isolated `lab3_e2e` schema: 5 Lab 2 regressions and 1 Lab 3 same-origin authentication-foundation scenario |

The E2E result proves that the foundation did not break the existing requester flow and relative `/api` proxy. It does not replace the planned Lab 3 authentication E2E tests, which belong to the next dependent backlog work.

Capture real pending states with controlled test request delays, and label fault-injection evidence as such. Store output in artifacts/lab-03/test-output and screenshots in the UI contract folders. Include direct unauthorized attachment/internal-note API responses with secrets redacted. Final PDF must include all relevant output, not just a summary count.
