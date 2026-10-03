# Lab 4 Dashboard correction release verification

## Source and scope

- Repository: https://github.com/Earth2509/toktickit
- Preparation branch: `feature/lab4-dashboard-release`.
- Runtime source: `e533135`, the merge of PR #68 into `lab4-staging`, including correction `1350a4a`.
- Previous main: `ffe6e0e`. These results are not a post-merge main run.
- Peer approval of the correction: [review 5391559592](https://github.com/Earth2509/toktickit/pull/68#pullrequestreview-5391559592).

The assistant fetched the source and created the preparation branch from the staging merge. The subsequent edits are documentation-only. The developer supplied the summaries below in response to the commands requested for that checkout. Their excerpts do not independently show branch/SHA headers or complete output logs; no screenshots or full logs are fabricated from them.

## Completed checks

| Check | Result | Supplied timing | Provenance |
| --- | --- | --- | --- |
| Default server tests | 25 files passed / 5 skipped; 134 tests passed / 8 skipped | Start 23:37:21; duration 9.01s | Developer-run summary |
| Default client tests | 12 files / 41 tests passed | Start 23:39:00; duration 16.48s | Developer-run summary |
| Server build | TypeScript build passed | Timing not retained | Assistant-run exit code 0 |
| Client TypeScript | No-emit check passed | Timing not retained | Assistant-run exit code 0 |
| Client production build | Vite 6.4.3; 37 modules; successful build | 654ms | Developer-run output |
| Unfiltered browser E2E | 19 tests passed, one worker | 1.1 minutes | Developer-run summary |
| Lab 4 migration | 1 file / 1 test passed | Start 23:43:28; duration 6.08s | Developer-run output |
| Lab 4 logical recovery | 1 file / 1 test passed | Start 23:44:39; duration 2.40s | Developer-run output |
| Dashboard performance smoke | 1 file / 2 tests passed | Start 23:45:51; duration 2.54s | Developer-run output |
| Lab 3 migration | 1 file / 2 tests passed | Start 23:47:18; duration 9.99s | Developer-run output |
| Administrator integration | 1 file / 2 tests passed | Start 23:48:27; duration 1.64s | Developer-run summary |

The eight default-skipped server cases passed in separate opt-in invocations: Lab 3 migration (2), Administrator integration (2), Lab 4 migration (1), logical recovery (1), and performance (2). The default command itself still skipped them; this record does not relabel that command as 142 passing tests.

The client build emitted `index-BxP1s5g_.css` (24.41 kB) and `index-CgTo7x62.js` (229.87 kB). The browser configuration uses `artifacts/lab-03/playwright-report`, a legacy path that also contains Lab 4 cases. The assistant did not independently inspect a new complete report or rerun these developer-executed suites.

## Limits and isolation

- Assistant attempts to run server and client Vitest stopped at configuration loading because sandbox ancestor-directory access was denied; no test case executed in those attempts.
- Opt-in commands reset only their named disposable local PostgreSQL schemas: `lab3_migration_test`, `lab3_admin_users_test`, `lab4_migration_test`, `lab4_recovery_source_test`, `lab4_recovery_target_test`, and `lab4_dashboard_perf_test`. E2E preparation targets `lab3_e2e`. None is evidence of a reset or restore of production data.
- Recovery verifies application row snapshots and attachment bytes in separate test schemas, not native PostgreSQL physical backup or point-in-time recovery.
- Both dashboard endpoints passed the local p95 <= 500ms assertion across twenty warm requests. Individual p95 values were not supplied; overall test durations are not endpoint latency measurements. This is not a production service-level guarantee.
- The Prisma update notice is informational. No major dependency upgrade was made for this verification.

## Remaining release and submission steps

1. Push the preparation branch and open a release PR into `main`, retaining these results with their provenance.
2. Obtain peer review before merging the release.
3. Verify the resulting main source and record its actual commit separately.
4. Complete the remaining visual evidence, student-confirmed reflection and final report checklist in [submission-completion-audit.md](submission-completion-audit.md).

Do not close Issue #60 or claim the final Lab 4 submission complete on the basis of automated release-preparation results alone.
