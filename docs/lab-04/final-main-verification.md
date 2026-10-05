# Lab 4 post-merge main verification

## Latest complete output — 4 October 2026

Eight complete developer-run logs now include branch `main` and full commit `55f8200d373577977d2205499d1c29732fe6b9ec`. Server 134 passed / 8 skipped, client 41 passed, browser 19 passed, and all eight opt-in server cases passed separately. See [full output verification](main-full-output-verification.md) for originals, timings, hashes and scope. This newer record supersedes the excerpt-only limitation below for these test runs; new complete build logs and final visual/PDF sign-off remain outstanding.

## Latest verification — PR #69 merged main, 2026-10-03

Tested source: `7329652011d406ca0a9c5466f5b4c1c93f7cf8ad` (`main` and `origin/main`), merge of [PR #69](https://github.com/Earth2509/toktickit/pull/69). The assistant confirmed the local HEAD before recording these results. The developer supplied the output below after updating to this source and running each requested command. The output excerpts do not independently include SHA headers or complete logs; the assistant did not independently rerun these suites.

| Check | Developer-supplied result | Start / duration |
| --- | --- | --- |
| Default server suite | 25 files passed / 5 skipped; 134 tests passed / 8 skipped | 14:54:33 / 9.38s |
| Default client suite | 12 files / 41 tests passed | 14:55:27 / 16.90s |
| Server build | `tsc`, no reported error; later passing opt-in runners also build the server first | Not supplied |
| Client production build | Vite 6.4.3; 37 modules; built successfully | 633ms |
| Unfiltered browser E2E | 19 tests passed, one worker | 1.0m |
| Lab 4 migration | 1 file / 1 test passed | 15:06:51 / 6.38s |
| Lab 4 logical recovery | 1 file / 1 test passed | 15:14:11 / 2.55s |
| Dashboard performance | 1 file / 2 tests passed | 15:15:45 / 2.57s |
| Lab 3 migration | 1 file / 2 tests passed | 15:20:51 / 9.62s |
| Administrator integration | 1 file / 2 tests passed | 15:30:22 / 1.68s |

All eight default-skipped cases passed in separate opt-in runs (1 + 1 + 2 + 2 + 2). The default run remains **134 passed / 8 skipped**, not 142 passed. Client build assets were `index-BxP1s5g_.css` (24.41 kB) and `index-CgTo7x62.js` (229.87 kB).

Administrator integration explicitly passed concurrent deactivation protection (one active Administrator survives) and session revocation with atomic active-work unassignment and audit history. Recovery passed application-row and attachment-byte restoration into a separate disposable schema; this is not physical PostgreSQL backup/PITR verification. Both dashboard endpoints passed p95 <= 500ms across twenty warm requests. The displayed 486ms is a test duration, not a reported p95 value.

These database tests reset only the named local disposable schemas used by their guarded runners. The Prisma upgrade notice was informational; no dependency upgrade was performed. No terminal screenshot was fabricated or captured for this record.

Automated post-merge verification is complete for this source. Remaining visual evidence, student-confirmed reflection and final report checklist still require completion before Issue #60 can be marked Done. The evidence branch `feature/lab4-dashboard-main-evidence` changes documentation only; this record does not claim tests of a later documentation commit.

## Historical verification — PR #67 merged main

The following record is retained for provenance. Its 130 server / 39 client counts describe the earlier `ffe6e0e` source, not the latest PR #69 source above.

Status: Automated checks completed with developer-supplied results on the merged main source. Final visual/submission evidence remains in progress; Issue #60 is not complete.

## Verified source

- Repository: https://github.com/Earth2509/toktickit
- Release PR: https://github.com/Earth2509/toktickit/pull/67
- Tested source: merged `main`, commit `ffe6e0ee858d712eb9c36a25c4866ba3cf3ec72f`.
- Evidence updates are collected on `feature/lab4-final-main-evidence`, created from that commit. They do not imply that a later documentation commit has been tested.

## Default server suite

The developer supplied the terminal summary after being asked to run `npm --prefix server test` from the checkout updated to the merged main commit. This is developer-run evidence, not an independently executed full suite by the assistant. The excerpt does not contain a branch/SHA header or individual test names.

```text
Test Files  25 passed | 5 skipped (30)
     Tests  130 passed | 8 skipped (138)
  Start at  23:24:51
  Duration  36.29s (transform 7.40s, setup 0ms, collect 206.36s, tests 31.25s, environment 29ms, prepare 37.56s)
```

The eight opt-in tests are excluded by default: Lab 3 migration (2), Lab 3 Administrator integration (2), Lab 4 migration (1), Lab 4 logical recovery (1), and Lab 4 dashboard performance (2). Their prior feature/integration results are recorded in `tests.md`; post-merge reruns are recorded separately below as they become available.

## Default client suite

The developer supplied the following summary after being asked to run `npm --prefix client test`. The local checkout remained at the merged main SHA above, on the evidence branch, with only this uncommitted documentation file and the pre-existing review scratch directory untracked. This is developer-run evidence; the supplied excerpt does not independently show the branch/SHA or individual test names.

```text
Test Files  12 passed (12)
     Tests  39 passed (39)
  Start at  23:30:30
  Duration  66.66s (transform 4.12s, setup 95.05s, collect 79.11s, tests 21.23s, environment 458.12s, prepare 18.35s)
```

## Server production build

The developer supplied this output after being asked to run `npm --prefix server run build`:

```text
> toktickit-server@1.0.0 build
> tsc
```

No error was included. This excerpt alone does not show the exit code or return to the command prompt. Completion is corroborated by the later passing Lab 4 migration command, which runs the server build as a prerequisite before Vitest. The assistant's separate server `tsc --noEmit` check also passed as noted below.

## Client production build

The developer supplied this successful Vite output after being asked to run `npm --prefix client run build` (the package script runs TypeScript before Vite):

```text
vite v6.4.3 building for production...
37 modules transformed.
dist/index.html                   0.41 kB | gzip:  0.27 kB
dist/assets/index-DVcNDGKj.css   24.36 kB | gzip:  5.19 kB
dist/assets/index-bJ-Moc6u.js   228.73 kB | gzip: 64.97 kB
built in 2.74s
```

This is developer-run build evidence on the same merged main source. It does not imply that browser E2E or database integration checks have passed.

## Unfiltered browser E2E

The developer supplied the following result after being asked to run the unfiltered `npm run e2e` command against the disposable `lab3_e2e` schema:

```text
Running 19 tests using 1 worker
19 passed (3.6m)
```

This is developer-run evidence for all 19 discovered browser cases, not a focused grep run. The excerpt does not contain a SHA header or individual test names. The test setup also printed a Prisma update notice; it was informational and did not prevent the passing run. No dependency upgrade is part of this verification.

## Lab 4 migration integration

The developer supplied this result after being asked to run `npm --prefix server run test:lab4-migration`, whose guarded runner targets only the disposable local `lab4_migration_test` schema:

```text
PASS tests/lab-04/migration-actions.integration.test.ts (1) 25295ms
PASS Lab 4 Actions Taken migration (1) 25286ms
PASS preserves Lab 3 relationships and keeps a repeated Lab 4 seed idempotent 25283ms

Test Files  1 passed (1)
     Tests  1 passed (1)
  Start at  23:42:55
  Duration  27.02s (transform 266ms, setup 0ms, collect 399ms, tests 25.29s, environment 1ms, prepare 446ms)
```

This is developer-run evidence of the migration/seed integration case, not a recovery or performance result. The command also builds the server before invoking Vitest; reaching this passing test result demonstrates that its prerequisite server build completed successfully.

## Lab 4 logical recovery integration

The developer supplied this result after being asked to run `npm --prefix server run test:lab4-recovery`, whose guarded runner targets only the disposable local `lab4_recovery_source_test` and `lab4_recovery_target_test` schemas:

```text
Lab 4 logical recovery verified 28 Tickets, 3 Actions, 1 attachment metadata rows and the copied attachment SHA-256 in a separate local schema.

PASS tests/lab-04/migration-recovery.integration.test.ts (1) 1975ms
PASS Lab 4 logical database and attachment recovery (1) 1974ms
PASS restores all application rows and attachment bytes into a separate disposable schema 1974ms

Test Files  1 passed (1)
     Tests  1 passed (1)
  Start at  23:46:43
  Duration  2.40s (transform 65ms, setup 0ms, collect 100ms, tests 1.97s, environment 0ms, prepare 94ms)
```

This is developer-run logical recovery evidence: application rows and copied attachment bytes were restored into a separate test schema, with a matching attachment SHA-256. It is not verification of native PostgreSQL `pg_dump`/`pg_restore`, physical backups, point-in-time recovery, or production-data restoration.

## Lab 4 dashboard performance smoke

The developer supplied this result after being asked to run `npm --prefix server run test:lab4-performance`, whose guarded runner targets only the disposable local `lab4_dashboard_perf_test` schema:

```text
PASS tests/lab-04/dashboard-performance.smoke.test.ts (2) 1575ms
PASS Lab 4 dashboard performance smoke (2) 1567ms
PASS keeps the Requester dashboard p95 at or below 500 ms across 20 warm requests 361ms
PASS keeps the Staff dashboard p95 at or below 500 ms across 20 warm requests

Test Files  1 passed (1)
     Tests  2 passed (2)
  Start at  23:48:43
  Duration  2.27s (transform 127ms, setup 0ms, collect 359ms, tests 1.57s, environment 0ms, prepare 106ms)
```

Both authenticated dashboard endpoints passed the p95-at-most-500-ms assertion across twenty measured local requests after warm-up. The supplied excerpt does not include individual p95 measurements or machine/database context; the 361ms test duration is not an endpoint p95 value. No exact p95 is invented. These are local smoke-test results, not a production latency guarantee.

## Lab 3 migration regression

The developer supplied the following summary after being asked to invoke `tests/lab-03/migration.test.ts` with `MIGRATION_TEST_DATABASE_URL` derived from `server/.env`, restricted to a local host and forced to the disposable `lab3_migration_test` schema. The URL and credentials were not printed.

```text
Test Files  1 passed (1)
     Tests  2 passed (2)
  Start at  23:52:41
  Duration  10.27s (transform 126ms, setup 0ms, collect 338ms, tests 9.63s, environment 0ms, prepare 92ms)
```

This is developer-run regression evidence for the two previously skipped Lab 3 migration cases. The excerpt contains totals, not individual test names or a SHA header.

## Lab 3 Administrator integration regression

The developer supplied the following summary after being asked to invoke `tests/lab-03/users-admin.integration.test.ts` with `ADMIN_USERS_TEST_DATABASE_URL` derived from `server/.env`, restricted to a local host and forced to the disposable `lab3_admin_users_test` schema. The URL and credentials were not printed.

```text
Test Files  1 passed (1)
     Tests  2 passed (2)
  Start at  23:54:26
  Duration  1.87s (transform 121ms, setup 0ms, collect 126ms, tests 1.43s, environment 0ms, prepare 89ms)
```

This is developer-run evidence of the two previously skipped Administrator integration cases, covering concurrent deactivation safety and transactional session/work cleanup. The excerpt contains totals, not individual test names or a SHA header.

## Automated verification summary

| Check | Developer-reported result |
|---|---|
| Default server suite | 25 files / 130 passed; 5 files / 8 opt-in tests skipped in this run |
| Client suite | 12 files / 39 passed |
| Server production build | No error in the standalone excerpt; successful build also required by the passing Lab 4 migration/recovery/performance commands |
| Client production build | Passed; 37 modules transformed |
| Unfiltered browser E2E | 19 passed |
| Lab 4 migration | 1 passed |
| Lab 4 logical recovery | 1 passed; rows and attachment SHA-256 verified |
| Lab 4 dashboard performance | 2 passed; both p95 assertions <=500ms; exact measurements not supplied |
| Lab 3 migration | 2 passed |
| Lab 3 Administrator integration | 2 passed |

All eight tests skipped in the default server run subsequently passed in separate opt-in runs. The default run remains correctly reported as 130 passed / 8 skipped; it is not relabelled as a single 138-test run. Browser and client counts are separate suites and are not added to that server count.

## Remaining submission work

- Final UI-state screenshots, visual checklist, and submission report: pending.

Assistant-side TypeScript checks for server and client and `git diff --check` passed on the merged main source. Assistant-side attempts to run both default Vitest suites stopped during Vite configuration loading because the sandbox denied parent-directory access, before tests executed; those startup failures are not passing test results.
