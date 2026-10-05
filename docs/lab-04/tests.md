# Lab 4 Test Plan and Traceability

Status: Initial plan created before implementation; Final columns updated from complete developer-run main output at `55f8200` on 4 October 2026, with separately attributed submission-branch corrections below. The application release is PR #69 / `7329652`, with documentation merged through PR #70 / `55f8200`. Historical main results: server 134 passed / 8 intentional skips, client 41 passed, browser 19 passed, with all eight opt-in cases passing separately. Subsequent submission-branch build logs retain their own provenance in [full output verification](main-full-output-verification.md). The student adopted My Reflection on 4 October. Representative visual checks and the supplemental history check are now verified; publication, final main verification, final board and PDF sign-off remain separate gates.

## Submission-completion attempts, 4 October 2026

### PR #71 approval and release preparation - 5 October 2026

[Round-two approval](https://github.com/Earth2509/toktickit/pull/71#pullrequestreview-5415787303) independently reports default server 134 passed / 9 skipped (25 files / 6 skipped), client 45 passed (13 files), both builds, dedicated history 1/1 and unfiltered browser 29/29 on a fresh clone of `56a95c1` with a separate local database. The reviewer reproduced both negative controls by reverting only the parent: component 4/4 and focused browser 3/3 failed with the old parent and passed with the corrected parent. These reviewer-run checks supplement the separately attributed assistant/developer results below. Staging merge `381e123` is complete; [release verification](submission-release-verification.md) records new preparation runs without reusing these as fresh main results. Main remains `55f8200` until the reviewed release is merged.

New release-preparation checks on `feature/lab4-submission-release` retain the identical staging runtime/tests: assistant client 13 files / 45 tests passed (21:47:59, 92.92s), server TypeScript build exited 0, and client TypeScript/Vite build passed (37 modules, 4.99s). The attempted server Vitest run collected no tests and exited 1 with 31 sandbox `realpath` EPERM errors; a developer rerun is pending. These are not new main results or new browser/database checks. Commands and process-only workaround are recorded in the linked release verification.

### PR #71 parent-screen focus regression - 5 October 2026

The review of `e6037e6` found lost focus after successful Action writes because the parent's reload unmounted the Action section. Four new `client/tests/lab-04/StaffActionFocus.test.tsx` cases render the real parent and child, hold the post-save Ticket GET, and check mounted section identity and invoking/fallback focus before and after the refreshed summary is applied. Create, Edit, Complete and Cancel all failed on the pre-fix application source and passed after same-Ticket reloads were made in-place. Mocked HTTP responses are used; this is component integration, not database/browser evidence.

Assistant working-tree results on `feature/lab4-submission-completion`: **13 files / 45 client tests passed**, start 20:30:34, duration 6.54s; TypeScript/Vite build passed, **37 modules / 638ms**, asset `index-B5PnQ1t8.js`. The sandbox workaround was the process-only `VITE_PRESERVE_SYMLINKS=true`; no package/config changes were made. These do not alter the historical main 41-test baseline or the server's 134-test count.

Updated `e2e/lab-04/evidence-completion.spec.ts` asserts focus on Add action after real Create and Complete, including the parent's refresh, at all three viewports. Assistant attempts stopped in Prisma before test execution. The developer then supplied **3 tests passed, one worker, 24.0 seconds** for the requested focused command. That is a passing corrected-working-tree browser result, not a main run or independent assistant reproduction. A browser red/green comparison on the old source is not claimed; the four parent-component controls supply separately recorded red/green evidence. The earlier 17.0-second run checked Cancel dismissal, not the successful-save focus contract. See [correction provenance](final-checklist-verification.md).

### Action focus correction verified - 5 October 2026

The developer ran the complete client suite in the submission workspace after the Action form focus correction and supplied all file results and the summary: **12 files / 41 tests passed**, start 11:53:25, duration 17.52s. The subsequent client production build passed: **37 modules transformed; 636ms**, with `index-Cf6ifF05.js` emitted. Supplied excerpts are retained under `evidence/build-output/`; they have no embedded source/command header. They cover the local submission working tree based at `674561c`, including the uncommitted focus correction, and do not replace the preserved main baseline. The separate final Action keyboard browser run passed **3/3** viewport cases in 17.0s; see [final checklist verification](final-checklist-verification.md). These results complete regression/build verification for the local correction. Peer review, main promotion and final board evidence remain to be completed.

The assistant attempted the default server/client commands on `feature/lab4-submission-completion`. Both Vitest processes failed before test collection with sandbox `EPERM` errors on `node_modules/vitest/dist/spy.js`. A retry after requesting read access still failed before collection and reported cache-write permission errors as well. Both runs reported no tests, not failing test assertions or new passing totals. These attempts do not supersede developer/peer results. Complete original main-run output was subsequently collected from the developer and checked, closing that collection gap; no terminal screenshot or full log was fabricated from prior summaries.

Manual Staff Dashboard/Queue/Detail keyboard observations and unsaved Action validation are recorded in [manual-accessibility-verification.md](manual-accessibility-verification.md), separately from automated tests. The read-only local database helper matched Dashboard metrics 17/2/8/0, two owned Ticket numbers and three original-recorder Actions; see [evidence provenance](evidence/main/README.md). This is live data evidence, not a new regression test suite.

### Supplemental pre/post audit-history check - 5 October 2026

The opt-in `workflow-history.integration.test.ts` and guarded `npm --prefix server run test:lab4-history` command compare complete prior event rows across two real workflow API transitions, equal-time ID ordering, repeated reads, and denied stale/Requester writes. The runner creates a fresh local schema and drops only the schema it created; no public data is reset. Server TypeScript passed. After the sandbox stopped before collection, the developer ran the dedicated check successfully: **1 file / 1 test passed**, start **12:24:00**, duration **3.98s**. The case/results excerpt is preserved without inventing a command header, clean SHA or complete before/after JSON transcript. See [history verification](workflow-history-verification.md).

The preceding developer-supplied routine-suite summary reports 25 files passed / 6 skipped and 134 tests passed / 9 skipped (12:13:53, 8.89s). The extra intentional skip is this new opt-in case, not a test failure. It passed separately in the dedicated run above; the routine count remains 134 passed / 9 skipped. Neither result is a new main run.

## Latest correction verification, 2026-10-02

The developer supplied the following successful local runs on `feature/lab4-staff-actions-dashboard`. They cover the current-user Actions Taken Dashboard correction and are not post-merge `main` results. Earlier pending statements in the chronological notes below describe intermediate stages and are superseded by this table.

| Check | Supplied result |
|---|---|
| Focused Dashboard API | 1 file / 11 tests passed; start 00:35:22; duration 811ms |
| Focused Staff Dashboard UI | 1 file / 4 tests passed; start 00:42:33; duration 1.43s |
| Default server suite | 25 files passed / 5 skipped; 134 tests passed / 8 skipped; start 00:44:31; duration 4.88s |
| Full client suite | 12 files / 41 tests passed; start 00:45:18; duration 4.01s |
| Server build | TypeScript build reported no error; subsequent passing E2E preparation also builds the server |
| Client production build | TypeScript and Vite passed; 37 modules transformed; duration 610ms |
| Focused Dashboard browser suite | 3 tests passed; duration 24.3s |
| Unfiltered browser suite | 19 tests passed; duration 55.5s |
| Dashboard performance smoke | 1 file / 2 tests passed; start 00:52:44; duration 3.16s |

Both performance cases passed their p95-at-most-500ms assertions across twenty measured warm local requests. The excerpt does not provide exact p95 values; the displayed 372ms is the Requester test-case duration, not its p95. This is local smoke evidence, not a production latency guarantee. The six other opt-in migration/recovery/Administrator cases were not rerun against this correction; their historical main results remain separately attributed. Supplied excerpts do not contain a commit SHA, so these runs are attributed to the working feature branch without inventing a run SHA. Assistant-side TypeScript checks and `git diff --check` passed; assistant-side Vitest startup was blocked before execution by sandbox directory access.

## Post-merge main verification

[PR #67](https://github.com/Earth2509/toktickit/pull/67) merged the release into `main` at `ffe6e0ee858d712eb9c36a25c4866ba3cf3ec72f`. The developer subsequently supplied passing terminal results for the default server suite (130 passed / 8 intentional opt-in skips), client suite (39 passed), unfiltered browser suite (19 passed), both production builds, and all eight opt-in server tests in separate runs: Lab 3 migration (2), Administrator integration (2), Lab 4 migration (1), logical recovery (1), and performance (2).

The [post-merge verification record](final-main-verification.md) retains the supplied summaries, source SHA, attribution, skip explanation and evidence limitations. Exact performance p95 measurements were not supplied; only the passing <=500ms assertions are recorded. Historical pending statements below describe the state at those earlier runs, not the current automated-verification status. Visual checklist completion and the submission report remain outstanding, so Issue #60 remains open.

| Test ID | Type | AC | Planned assertion | Intended test path | Final |
|---|---|---|---|---|---|
| API-01 | API | AC-01, AC-02 | Create valid Action Taken; validate required follow-up, performer/date rules and replay-safe Idempotency-Key behaviour | `server/tests/lab-04/actions-taken.api.test.ts` | Passed on main 55f8200, 4 Oct 2026; 10 shared API tests. |
| API-02 | API/Auth | AC-03 | Enforce requester ownership and Staff/Admin write restrictions | `server/tests/lab-04/actions-taken.api.test.ts` | Passed on main 55f8200, 4 Oct 2026; same 10-test API file. |
| API-03 | API | AC-04 | Different Staff record separate actions on one Ticket while its owner stays unchanged | `server/tests/lab-04/actions-taken.api.test.ts`, `e2e/lab-04/actions-taken-flow.spec.ts` | Passed on main 55f8200, 4 Oct 2026; distinct-performer API and second-Staff browser cases. |
| API-04 | API/Workflow | AC-05 | Enforce active-owner, open-action, latest-completion, follow-up, post-reopen and summary gates; retain transition, authorization, version-conflict and audit-event behavior | `server/tests/lab-04/ticket-workflow.api.test.ts`, `server/tests/lab-04/ticket-workflow.unit.test.ts` | Passed on main 55f8200, 4 Oct 2026; 8 API / 4 unit. |
| API-05 | API | AC-06 | Requester metrics/rows match owned Ticket query and empty state | `server/tests/lab-04/dashboards.api.test.ts`, `server/tests/lab-02/ticket-query.unit.test.ts` | Passed on main 55f8200, 4 Oct 2026; 11 shared Dashboard API / 6 query unit. |
| API-06 | API | AC-07 | Staff metric calculations, recent ordering and role restrictions | `server/tests/lab-04/dashboards.api.test.ts`, `server/tests/lab-04/dashboard-filters.unit.test.ts` | Passed on main 55f8200, 4 Oct 2026; 11 shared Dashboard API / 2 filter unit. |
| UNIT-01 | Unit | AC-01, AC-02, AC-05 | Validate Action status/assignee/follow-up transitions, terminal immutability, completion-after-reopen and pure resolution-gate decisions | `server/tests/lab-04/actions-taken.unit.test.ts`, `server/tests/lab-04/ticket-workflow.unit.test.ts` | Passed on main 55f8200, 4 Oct 2026; 5 Action unit / 4 workflow unit. |
| INT-01 | Integration | AC-08 | Migration preserves Lab 3 records; repeat seed is idempotent | `server/tests/lab-04/migration-actions.integration.test.ts` | Passed on main 55f8200, 4 Oct 2026; 1 separately run opt-in migration test. |
| INT-02 | Integration/Recovery | AC-08 | Restore a captured logical backup of all application tables and attachment bytes to a separate disposable schema; compare every restored row, manifest counts, attachment hashes and Ticket relationships | `server/tests/lab-04/migration-recovery.integration.test.ts` | Passed on main 55f8200, 4 Oct 2026; 1 separately run logical recovery test, not native PostgreSQL backup. |
| INT-03 | Integration/Workflow | AC-05 | Preserve every prior event field across two real API transitions, order tied timestamps by ID, repeat reads stably and append nothing after stale/Requester-denied writes | `server/tests/lab-04/workflow-history.integration.test.ts` | Passed separately on submission branch, 5 Oct 2026; 1 test, 3.98s. Not a new main result; see history verification. |
| SEED-01 | Unit/Regression | AC-08 | Keep the Action fixture key out of the Action row and avoid duplicate rows on a repeated seed | `server/tests/lab-04/seed-data.unit.test.ts` | Passed on main 55f8200, 4 Oct 2026; 1 unit. |
| UI-01 | UI | AC-01, AC-03 | Action list, create/edit form, required-field validation, assignee-only completion, paginated retrieval, accurate totals after creation, and requester read-only view | `client/tests/lab-04/ActionsTaken.test.tsx` | Passed on main 55f8200, 4 Oct 2026; 6 component. |
| UI-02 | UI | AC-05 | Show actionable resolution-gate feedback while preserving the stale-version reload instruction | `client/tests/lab-04/TicketWorkflow.test.tsx` | Passed on main 55f8200, 4 Oct 2026; 2 component. |
| UI-03 | UI | AC-06 | Requester cards, zero state and drill-down links | `client/tests/lab-04/RequesterDashboard.test.tsx` | Passed on main 55f8200, 4 Oct 2026; 2 component. |
| UI-04 | UI | AC-07 | Staff cards, recent rows, safe failure and drill-down links | `client/tests/lab-04/StaffDashboard.test.tsx` | Passed on main 55f8200, 4 Oct 2026; 4 component including own-Action preview/empty state. |
| STYLE-01 | UI style | AC-09 | Zen Green focus, rendered interactive targets at least 44px high, responsive 4/2/1 card layout, wrapped Action text and textual validation; page-level overflow is covered by RESP-01 | `client/tests/lab-04/ZenGreenLab4.styles.test.tsx`, `e2e/lab-04/responsive.spec.ts` | Passed on main 55f8200, 4 Oct 2026; 3 style/component tests; computed targets covered by responsive browser tests. |
| RESP-01 | Responsive | AC-09 | Dashboard, Ticket Detail and Actions Taken work at 1440x900, 820x1180 and 390x844 without page-level overflow | `e2e/lab-04/responsive.spec.ts` | Passed on main 55f8200, 4 Oct 2026; 3 viewport cases within browser total 19; preserved images retain their original run provenance. |
| PERF-01 | Performance smoke | AC-06, AC-07 | Seed a representative dashboard dataset and confirm each dashboard endpoint has p95 <= 500 ms across 20 warm local requests; record machine/database context as non-portable smoke evidence | `server/tests/lab-04/dashboard-performance.smoke.test.ts` | Passed on main 55f8200, 4 Oct 2026; 2 separately run opt-in tests; local p95 Requester 7.5 ms / Staff 7.4 ms. |
| E2E-01 | E2E | AC-01-05 | Staff adds/edits multiple actions; requester sees read-only; resolve/close lifecycle | `e2e/lab-04/actions-taken-flow.spec.ts` | Passed on main 55f8200, 4 Oct 2026; included in browser 19. |
| E2E-02 | E2E | AC-06-07 | Requester/Staff dashboards calculate, drill down and respect roles at three viewports | `e2e/lab-04/dashboards.spec.ts` | Passed on main 55f8200, 4 Oct 2026; included in browser 19. |
| REG-01 | Regression | AC-09 | Run Labs 1-3 server/client/auth/attachment/comment/note/admin tests | existing suites | Passed on main 55f8200, 4 Oct 2026; server 134 passed / 8 skipped, all 8 opt-in cases passed separately; client 41 / browser 19. |

Unless explicitly attributed to the submission branch (INT-03), Final cells above refer to the complete developer-run main logs in [full output verification](main-full-output-verification.md). Shared test-file totals are not added together. Historical notes below retain their dated results, not current pending-test status. Manual visual checks and final PDF remain separate.

| Added correction tests | Type | AC | Coverage / actual files | Final |
| --- | --- | --- | --- | --- |
| API-07 / UI-05 | API / UI / E2E | AC-10 | Session-performed Action preview/count, stable bounded rows, role denial, Administrator own empty state, safe query failure and Ticket links; `server/tests/lab-04/dashboards.api.test.ts`, `client/tests/lab-04/StaffDashboard.test.tsx`, `e2e/lab-04/dashboards.spec.ts` | Passed on main 55f8200; included in Dashboard API 11 / Staff UI 4 / browser 19 totals, not additional tests. |
| UI-06 | UI integration / E2E | AC-01, AC-09 | Keep the real Staff Detail Action section mounted and restore invoking/fallback focus after successful create/edit/complete/cancel during and after parent refresh; `client/tests/lab-04/StaffActionFocus.test.tsx`. Browser Create/Complete checks: `e2e/lab-04/evidence-completion.spec.ts`, three viewports. | Four component regressions failed before the fix and passed after it; included in the 45-test submission working-tree result. Developer browser rerun passed 3/3 in 24.0s; not a main result. |

## Execution commands

### Current-user Actions correction: historical execution notes

Developer-supplied unfiltered browser regression result on 2 October 2026, after `npm run e2e`: **19 tests passed using 1 worker in 55.5s**. This is the full discovered browser suite on the correction feature branch, not just the three Dashboard cases and not a post-merge main result. The added Action-preview assertions are within existing tests, so the discovered total remains 19. The performance smoke rerun is still pending because this correction adds two Action queries to the Staff Dashboard.

Developer-supplied focused Dashboard browser result on 2 October 2026: **3 tests passed using 1 worker, 24.3s**, after running `npm run e2e -- e2e/lab-04/dashboards.spec.ts`. The three viewport cases now include the current-user Action preview/count and Ticket link check. The preceding attempt stopped during Prisma generation with a Windows DLL rename/EPERM error before any tests ran; the passing retry followed stopping the local dev Backend. The E2E server preparation builds the server as a prerequisite, corroborating successful server build. Unfiltered browser regression and opt-in checks for this correction remain pending; the result is not relabelled as final main.

Developer-supplied client production build passed on 2 October 2026: Vite 6.4.3 transformed 37 modules and completed in 610ms, producing `index-BxP1s5g_.css` (24.41kB) and `index-CgTo7x62.js` (229.87kB). This is the correction feature-branch build, not a new merged-main artifact. Browser verification remains pending.

Developer supplied the correction's `npm --prefix server run build` output showing the package build script and `tsc`, with no error included. The excerpt does not include an exit code or return-to-prompt confirmation; the assistant-side server `tsc --noEmit` check separately passed. Client production build and browser verification remain pending.

Developer-supplied full client result on 2 October 2026, after running `npm --prefix client test`: **12 files / 41 tests passed**, start 00:45:18, duration 4.01s. This is feature-branch regression evidence, including the two added own-Action component cases. Browser and production-build verification for this correction remain pending.

Developer-supplied full default server result on 2 October 2026, after running `npm --prefix server test`: **25 files passed / 5 skipped; 134 tests passed / 8 skipped**, start 00:44:31, duration 4.88s. This is the correction feature branch, not merged main. The eight skipped opt-in cases were not executed in this command; their earlier main results do not establish a new run against this correction. Full client, browser and production-build results remain pending.

Developer-supplied focused server result on 2 October 2026, after running `npm --prefix server test -- tests/lab-04/dashboards.api.test.ts`: **1 file / 11 tests passed**, start 00:35:22, duration 811ms. This includes the seven existing Dashboard API cases and four correction cases. It is feature-branch evidence, not a new full server suite or main result. Client, E2E, full regression and production build verification for the correction remain pending.

Developer-supplied focused client result on 2 October 2026, after running `npm --prefix client test -- tests/lab-04/StaffDashboard.test.tsx`: **1 file / 4 tests passed**, start 00:42:33, duration 1.43s. The four reported cases cover operational drill-down/Ticket links, safe failure with Retry, performed-Action history independent of Ticket ownership with Ticket navigation, and empty own-Action history without hiding operational Tickets. This is focused feature-branch component evidence; full regression, E2E and production builds remain pending.

On `feature/lab4-staff-actions-dashboard`, AC-10 adds four Dashboard API cases for session-performer scope/forged input, Administrator own empty state, Requester denial before Action reads, and safe Action-query failure. Two component cases cover populated independent Action history/Ticket navigation and empty Action history alongside populated operational Tickets. The three existing viewport Dashboard browser cases now check the Action preview/count and its Ticket link. These additions are not included in the historical main totals of server 130 / client 39 / E2E 19. Assistant-side Vitest attempts stopped at sandbox config loading before execution; passing counts are pending actual runs.

```bash
npm --prefix server test
npm --prefix client test
npm run e2e
npm --prefix server run test:lab4-migration
npm --prefix server run test:lab4-performance
npm --prefix server run test:lab4-recovery
```

Final evidence will record commit SHA, branch, discovered files/tests, command output and intentional skips. The opt-in Lab 4 migration, dashboard performance and logical recovery commands read `server/.env` and accept only a local PostgreSQL host. They reset only their respectively named disposable schemas: `lab4_migration_test`, `lab4_dashboard_perf_test`, and both `lab4_recovery_source_test`/`lab4_recovery_target_test`. Do not run a command if its named schema contains data to keep. The normal application schema is not reset by these tests. The performance check runs five warm-up and twenty measured authenticated requests per endpoint; its machine-specific p95 is smoke evidence rather than a portable service-level guarantee. The recovery check captures fixture rows and attachment bytes into temporary logical backup files, restores them to a separate freshly-created schema and attachment directory, compares a manifest, and checks primary-key sequence usability. It does not validate `pg_dump`, point-in-time recovery or physical database backup procedures.

## Feature-branch verification, 2026-09-27

The developer ran `npm test` from `server/` and `client/` on branch `feature/lab4-resolution-workflow` after commit `7fa005a` and supplied the terminal output. Server Vitest reported **22 files passed, 2 skipped; 118 tests passed, 4 skipped**. The skipped files were the opt-in Lab 3 migration and Administrator integration suites, which require an isolated database. Client Vitest reported **9 files passed; 32 tests passed**. The new Lab 4 workflow files contributed 8 API, 4 unit and 2 UI passing tests. Server `npm run build`, client `npx tsc --noEmit`, and `git diff --check` also passed. These are feature-branch results, not a claim that the final merged `main` has already been tested.

The developer then ran the full suites on `feature/lab4-dashboards` after commits `ff2adf9` and `6f2cf1a` and supplied the terminal output. Server Vitest reported **24 files passed, 2 skipped; 128 tests passed, 4 skipped**. Client Vitest reported **11 files passed; 36 tests passed**. The new dashboard coverage contributed 7 API, 2 queue-filter unit and 4 UI passing tests; the requester query unit file now has 6 passing tests. Server TypeScript build and client TypeScript checks passed in the feature workspace. The developer's client production build transformed **37 modules** and completed successfully. Isolated dashboard E2E, performance smoke and final `main` verification are still pending; this paragraph does not imply that they have passed.

## Lab 4 browser workflow preparation, 2026-09-28

Two browser scenarios were added on `feature/lab4-regression-e2e-release`: one creates a Requester Ticket, verifies that an open Action blocks resolution, completes the Action, resolves/closes the Ticket and verifies Requester read-only/API denial; the other checks that a second Staff member can record and edit work without changing the primary Ticket Owner. TypeScript checking of the new E2E spec and `git diff --check` passed. At implementation time, browser execution was deferred because this checkout lacked `server/.env`/`E2E_DATABASE_URL`; E2E preparation resets only the dedicated `lab3_e2e` schema. The sandbox also denied directory access while Vitest loaded its Vite configuration, so the developer subsequently ran the suites locally. Retain the Playwright report and terminal output for final evidence.

```bash
npm run e2e -- --grep "an open Action|another Staff member"
```

The first browser attempt stopped during test-server preparation, before any browser case executed. Prisma rejected the seed's private `key` field on `ActionTaken.create`. The seed now removes `key` from the Action data and stores it only in `ActionTakenIdempotency`; a focused repeat-seed regression test was added. Server TypeScript build passed after the fix. The developer ran `npm --prefix server test -- tests/lab-04/seed-data.unit.test.ts` and supplied output showing **1 test passed in 1 file**.

The developer reran `npm run e2e -- --grep "an open Action|another Staff member"` against the isolated E2E schema and supplied output showing **2 browser tests passed in 26.1 seconds**. This verifies the Action/resolve lifecycle and the second-Staff ownership case; it does not claim the full browser suite passed. A separate three-viewport responsive suite captures Staff and Requester dashboards plus Ticket/Action details at desktop (1440x900), tablet (820x1180) and mobile (390x844). Its three cases were type-checked and discoverable by Playwright before execution.

The developer then ran `npm run e2e -- --grep "Lab 4 dashboards and Action details fit"` and supplied output showing **3 browser tests passed in 17.9 seconds**. The run saved four full-page screenshots per viewport (12 total) under `artifacts/lab-03/test-results/`, attached them to the Playwright report, and asserted no page-level horizontal overflow at all three sizes. The mobile Staff Action and Requester Dashboard screenshots were also spot-checked visually. This focused run alone did not cover the other browser cases.

Finally, the developer ran the unfiltered `npm run e2e` command on `feature/lab4-regression-e2e-release` and supplied output showing **19 of 19 browser tests passed in 53.1 seconds**. This run covers the existing Lab 2 and Lab 3 browser regressions together with the Lab 4 Action, dashboard and responsive scenarios. The HTML report is under `artifacts/lab-03/playwright-report/`. This is integrated feature-branch evidence; the server/client suites, opt-in migration/recovery checks and final `main` run are tracked separately.

The developer ran `npm --prefix server test` on the same feature branch after the seed fix. Vitest reported **25 files passed, 2 skipped; 129 tests passed, 4 skipped**. The skipped cases are the opt-in Lab 3 migration (2) and Administrator integration (2) tests that require their isolated database settings. The developer then ran `npm --prefix client test`: **11 files passed; 36 tests passed**. The opt-in migration/recovery checks and final `main` verification remain separate steps.

The Lab 4 migration integration case was then added to verify that a populated Lab 3 Ticket retains its requester, owner, priority, attachment-removal attribution, public comment and private note after the Actions Taken migration. It also checks that the existing Ticket gains no invented Action and that repeating the local seed creates exactly three fixture Actions. The developer ran the opt-in local-only `npm --prefix server run test:lab4-migration` command and supplied output showing **1 test passed in 1 file**; the test itself took 8.3 seconds. This run reset only the dedicated `lab4_migration_test` schema.

The developer ran `npm --prefix client test -- tests/lab-04/ZenGreenLab4.styles.test.tsx` after commit `5e2289f` and supplied output showing **3 tests passed in 1 file**. Those historical cases inspected CSS rule strings, which could not prove a computed 44px touch target. The review correction moved that assertion into `e2e/lab-04/responsive.spec.ts`, where Chromium measures every rendered button, link, input, select and textarea on the captured Dashboard/Detail screens, the traversed Staff Queue/My Tickets screens and the Administrator Create User form; checkbox controls use the enclosing label as their target. A focused browser comparison of the original `2193d09` CSS against the corrected working tree measured the Ticket filter input and workflow select at **43.1875px before** and **44px after** at 390px viewport width. The updated three-viewport browser suite passed **3/3**, and the full browser suite passed **19/19** on 2026-09-29.

The developer ran the opt-in `npm --prefix server run test:lab4-performance` command and supplied output showing **2 tests passed in 1 file**. Both authenticated dashboard endpoints met the test's p95-at-most-500-ms assertion across twenty measured local requests after five warm-up requests. The supplied excerpt did not include the individual p95 values or the printed machine/database context, so neither is invented here; this is non-portable local smoke evidence, not a production latency guarantee. The command reset only the dedicated `lab4_dashboard_perf_test` schema.

The developer ran `npm --prefix server test -- tests/lab-04/actions-taken.api.test.ts` after commit `7f0355e` and supplied output showing **10 tests passed in 1 file**. The new case records distinct Actions by two authenticated Staff on one Ticket, checks both session-derived performers and audit actors, and confirms the coordinating owner is unchanged in the API fixture. The earlier browser case separately showed a second Staff member creating and editing work while the Ticket owner remained unchanged.

The developer ran `npm --prefix server run test:lab4-recovery` after commit `7b96498` and supplied output showing **1 test passed in 1 file**. Following review, the test was strengthened to compare the complete JSON-normalized snapshot of every restored application table, not only row counts and sampled Ticket relationships. The developer reran it on 2026-09-29 and reported **1 test passed in 1 file**. The attachment SHA-256 and primary-key sequence checks remain. Only `lab4_recovery_source_test` and `lab4_recovery_target_test` were reset by the guarded runner. This is not evidence of native PostgreSQL `pg_dump`/`pg_restore`, physical backups, point-in-time recovery, or production-data restoration.

The developer reran `npm --prefix server test` on `feature/lab4-regression-e2e-release` after the review correction on 2026-09-29. Vitest reported **25 files passed, 5 skipped; 130 tests passed, 8 skipped**. The intentionally skipped suites are the opt-in Lab 3 migration (2), Lab 3 Administrator integration (2), Lab 4 migration (1), Lab 4 recovery (1), and Lab 4 dashboard performance (2). The three Lab 4 opt-in suites were executed separately with passing results above.

The developer reran `npm --prefix client test` after the review correction on 2026-09-29 and supplied output showing **12 files passed; 39 tests passed**. This includes the Zen Green/accessibility cases alongside the existing Lab 2, Lab 3, Actions Taken, dashboard and workflow UI tests.

The developer reran the unfiltered `npm run e2e` command after the review correction on 2026-09-29 and supplied output showing **19 of 19 browser tests passed in 54.7 seconds**. A separate focused responsive run passed **3 of 3** desktop/tablet/mobile cases in 20.9 seconds, after a mobile-only check passed **1 of 1** in 20.1 seconds. The full run covers Lab 2/3 regression flows together with Lab 4 Action, dashboard and responsive cases; its twelve current responsive screenshots were copied to `docs/lab-04/evidence/`. The Playwright HTML report remains under `artifacts/lab-03/playwright-report/`. Final merged-`main` verification remains a separate step.

The developer reran `npm run build --prefix client` after the 2026-09-29 review correction. TypeScript and Vite completed successfully: **37 modules transformed**, with `dist/index.html`, `dist/assets/index-DVcNDGKj.css` and `dist/assets/index-bJ-Moc6u.js` emitted; Vite reported completion in **655 ms**. The client TypeScript typecheck and server TypeScript build also passed locally after the correction.

All twelve full-page responsive screenshots from the passing Lab 4 browser run were visually inspected and copied under [`docs/lab-04/evidence/`](evidence/) for repository review. The three viewport-by-role-and-screen mappings are linked from [`ui-spec.md`](ui-spec.md). They show the populated dashboard and Ticket/Action states; unchecked loading, validation and conflict checklist items are not claimed as screenshot evidence.

After the Action form was updated to associate validation messages with invalid fields using `aria-invalid` and `aria-describedby`, the developer reran `tests/lab-04/ZenGreenLab4.styles.test.tsx`: **1 file passed; 3 tests passed**. This focused rerun verifies the new field-to-error relationship. TypeScript also passed with `tsc -p client/tsconfig.json --noEmit`.

## Peer verification of the integrated release, 2026-10-01

### Additional submission-workspace evidence, 4 October

All four focused cases in `e2e/lab-04/evidence-completion.spec.ts` passed across separate developer runs: the first three in the initial run, and the corrected fourth alone (12.7 seconds). See [focused verification](evidence-completion-verification.md) for actual versus controlled response attribution. This is supplementary branch evidence, not an updated main total or a combined four-case rerun.

Latest developer-run main verification (4 October) is recorded in [full output verification](main-full-output-verification.md): server 134 passed / 8 skipped, client 41 passed, E2E 19 passed; all eight opt-in cases passed separately. Complete logs include main commit `55f8200d373577977d2205499d1c29732fe6b9ec`. These later results supersede chronological pending-test statements above, not historical results or unobserved visual evidence.

In [the PR #67 review](https://github.com/Earth2509/toktickit/pull/67#pullrequestreview-5370663170), @Nuggetkub reported an independent run from a fresh clone at **`e3543e6` on `feature/lab4-release-integration`**, following the README commands with a new local database and configured `DATABASE_URL`/`AUTH_CSRF_SECRET`. This is peer-run integrated-branch evidence, not a developer rerun and not post-merge `main` evidence.

| Check | Result reported by the reviewer |
|---|---|
| Locked dependency installation, Prisma validation, migrations and local seed | Passed; all 10 migrations applied; 10 users, 28 Tickets and 3 Actions |
| Repeat local seed | Still 28 Tickets and 3 Actions |
| Default server suite | 25 files / 130 tests passed; 8 intentional opt-in skips |
| Client suite | 12 files / 39 tests passed |
| Server and client production builds | Passed; client transformed 37 modules |
| Lab 4 migration integration | 1/1 passed |
| Logical recovery integration | 1/1 passed; reported restored counts and matching attachment SHA-256 |
| Dashboard performance smoke | 2/2 passed; reported local p95 values 7.7 ms and 7.2 ms |
| Unfiltered Playwright suite | 19/19 passed |

The review states that the clone had no changes after execution and that the release's parent is the reviewed staging merge `510b3eb`. The performance values describe that reviewer's local run only, not a portable production latency guarantee. The subsequent response to the review changes documentation only; final verification must still be run on the merged `main` commit and recorded with its SHA. The requested correction concerns review-history completeness, not a failing runtime check.
