# Lab 4 submission post-merge verification — 6 October 2026

## Source and attribution

**Current collection status:** All twelve collector entries now have complete output and exit 0 for reviewed runtime/test source `73faa8b`: server 134 passed / 9 skipped, client 45, unfiltered E2E 29, both builds (including client TypeScript), and all nine optional cases passed separately. Collection was on documentation-only checkout `488e760`, not falsely relabelled as a clean main-branch invocation. Administrator integration used an explicitly recorded temporary path-resolution config after normal sandbox attempts failed. The dated entries below retain the collection sequence; earlier "remaining" statements are historical. Reviewed publication, final Issue/Board acceptance and final PDF export remain open.

[PR #72](https://github.com/Earth2509/toktickit/pull/72) was peer-approved and merged into `main` as [`73faa8b0cee5adce1718cd97c5e32fc4bba9ec84`](https://github.com/Earth2509/toktickit/commit/73faa8b0cee5adce1718cd97c5e32fc4bba9ec84). The developer supplied the successful fast-forward output and `git log` showing HEAD, main and origin/main at that commit. The assistant also read-verified the local HEAD. Subsequent results below were supplied by the developer in response to one-at-a-time commands on that checkout; they are not assistant-run tests.

These are supplied output excerpts, not complete raw logs, terminal screenshots, or proof of an independently captured clean working tree/exit code for each invocation. The summaries do not embed per-command SHA headers. Association with this main source follows the confirmed checkout and subsequent conversation sequence. Earlier feature/release/historical-main results retain their separate provenance.

## Default suites and builds

| Check | Developer-supplied result | Reported timing |
| --- | --- | --- |
| `npm --prefix server test` | 25 files passed / 6 skipped; 134 tests passed / 9 skipped (143 discovered) | Start 15:34:07; duration 9.34s |
| `npm --prefix client test` | 13 files / 45 tests passed | Start 15:35:24; duration 13.75s |
| `npm --prefix server run build` | `tsc`; supplied output contains no diagnostics | Completion accepted in the stepwise exchange; no exit-code capture supplied |
| `npm --prefix client run build` | Vite 6.4.3; 37 modules; CSS `index-BxP1s5g_.css`, JS `index-B5PnQ1t8.js`; built successfully | 673ms |
| `npm run e2e` | 29 tests passed; one worker | 1.4m |

The E2E instructions disabled server reuse, selected ports 18301/18173 and used the runner's dedicated `lab3_e2e` schema. They skipped Prisma regeneration to avoid the previously encountered Windows DLL lock. The legacy report path `artifacts/lab-03/playwright-report` contains the combined browser suite, including Lab 4.

## Separately enabled database suites

| Check | Developer-supplied result | Reported timing and scope |
| --- | --- | --- |
| `npm --prefix server run test:lab4-history` | 1 file / 1 test passed | Start 15:41:47; duration 1.72s; prior events immutable, equal timestamps ordered by ID, denied writes leave history unchanged |
| `npm --prefix server run test:lab4-migration` | 1 file / 1 test passed | Start 15:42:16; duration 6.56s |
| `npm --prefix server run test:lab4-recovery` | 1 file / 1 test passed | 28 Tickets, 3 Actions, 1 attachment metadata row and copied attachment SHA-256 verified in a separate schema; test file 2281ms |
| `npm --prefix server run test:lab4-performance` | 1 file / 2 tests passed | Start 15:44:30; duration 2.62s; both dashboards meet p95 <=500ms across 20 warm requests |
| Lab 3 `migration.test.ts` with `MIGRATION_TEST_DATABASE_URL` | 1 file / 2 tests passed | Start 15:45:48; duration 10.37s |
| Lab 3 `users-admin.integration.test.ts` with `ADMIN_USERS_TEST_DATABASE_URL` | 1 file / 2 tests passed | Start 15:47:49; duration 2.03s |

The final two commands derived their connection from server `.env`, rejected non-local hosts and forced respectively `lab3_migration_test` and `lab3_admin_users_test`. No credential was printed or preserved in this record. These suites reset their named disposable test schemas, not `public`.

The opt-in counts total **1 + 1 + 1 + 2 + 2 + 2 = 9 passed**, covering the nine cases intentionally skipped by the default server invocation. This is **134 default-server passes plus 9 separate opt-in passes**, not one 143-passed run. The performance output's 304ms is a test-case duration, not a measured p95 value; no exact p95 is asserted here. The history suite uses the current-model setup and does not replace migration preservation tests.

## Remaining publication and submission gates

- [x] Peer-approved release merged into main and actual merge SHA identified.
- [x] Developer supplied passing default suites, both build outputs, unfiltered E2E and all nine separately enabled database cases after confirming main checkout.
- [ ] Publish this post-merge record through the required review workflow; it is currently a local documentation update.
- [x] Verify public main links to all six engineering documents: each returned HTTP 200 on 6 October after the temporary DNS failure resolved. Publication of the later local updates remains separate.
- [x] Update current engineering-document status using this dated record, preserving historical provenance and limitations. Final PDF export remains separate.
- [ ] Complete and verify final PDF layout, hyperlinks, full proportional images, sequential figures and absence of blank pages.
- [ ] Complete Issue #60 only when its remaining deliverables are satisfied, update its actual Project status and include final all-Done board evidence.

Automated verification is complete at the supplied-summary level. No final PDF, all-Done board, external Issue mutation, new PR or publication of this file is claimed by this local record.

## Report assembly and online check attempt - 6 October 2026

The assistant inspected the local merge tree and confirmed that all six engineering-document paths are present at `73faa8b`. Live checks of the Issue #60 page and GitHub repository/issue API failed with DNS resolution errors (`ERR_NAME_NOT_RESOLVED` / `No such host is known`), including after network permission was granted. File existence in the fetched merge tree is not proof that a public HTTP URL currently works. No Issue/Project write was attempted. No final all-Done board image was found in the available submission evidence.

The local post-merge review copy includes this new result table, updates current status in the engineering documents and preserves historical outputs/images without changing their provenance. It is not labelled final while the online/board and publication gates remain unresolved. Full-image pages preserve aspect ratio and original extent; table headers use dark text on mint. Generated output remains excluded from Git until separately selected for publication.

## Recovered online checks and complete-output collection - 6 October 2026

The later retry succeeded. All six `blob/main/docs/lab-04/` document URLs (`specification.md`, `tests.md`, `ui-spec.md`, `api-spec.md`, `reviewer.md`, `ai-use.md`) returned HTTP 200. `git ls-remote` independently confirmed main `73faa8b`. The Issue #60 page was read successfully: it requires passing suites, a peer-reviewed release and submission-ready evidence. The Project contains five completed Lab 4 items (#55-#59) and the unfinished final-evidence item #60. The assistant changed #60 from Backlog to In progress, not Done; no closure is claimed.

The new complete-output collector checks tracked application/test source against the reviewed main commit before running. It preserves command, checkout, branch, timestamps and exit status; optional database runners accept only local PostgreSQL and guard disposable schemas. Documentation changes on `feature/lab4-final-publication` are not described as an unchanged clean main working tree. Any credentials in output are redacted, not published.

Assistant-run complete output now confirms client **13 files / 45 tests**, server TypeScript, client TypeScript and Vite production build, each exit 0. Runtime/test source matches `73faa8b`; `VITE_PRESERVE_SYMLINKS=true` was a process-only sandbox workaround. The client run started at 16:09:33 (+07:00), duration 19.25s; Vite built 37 modules in 727ms. These complete logs are preserved under `evidence/post-merge-73faa8b/` and are distinct from the earlier developer summaries and historical logs. The attempted server/history collectors exited 1 before tests ran with Vitest `realpath` EPERM, not assertion regressions. Those attempts do not supersede the developer's earlier passes and are not passing complete-output evidence. The developer has been asked to collect the server output outside the sandbox.

Remaining blockers are complete current-source server/browser/opt-in output, reviewed publication of the local update, then verified Issue #60/Done board and final PDF sign-off. The earlier DNS-only blocker is resolved.

### Developer complete-server collection - 6 October, 16:23 (+07:00)

The developer reran `node scripts/collect_lab4_final_output.mjs server` outside the sandbox. The assistant read the complete [server output](evidence/post-merge-73faa8b/server-full.txt), including its source/checkout/command header, all discovered file results, empty stderr and exit 0. Result: **25 files passed / 6 skipped; 134 tests passed / 9 skipped**, start 16:23:24, duration 8.74s. The manifest now marks this collection passed. The earlier server EPERM attempt is superseded for output collection, not represented as a test assertion failure.

The command ran on documentation-only branch `feature/lab4-final-publication`, HEAD `488e760a01a07d9b8bca5f06a80bd9b01ed7b77f`; the collector verified tracked runtime/test files match reviewed main `73faa8b`. This is not falsely described as a clean main-branch invocation. `VITE_PRESERVE_SYMLINKS` was unset for the developer run. The nine skips still require separately attributed optional output; unfiltered E2E output is the next collection step. The earlier main summaries already confirm those cases passed, but they are not complete logs.

### Developer complete-browser collection - 6 October, 16:29 (+07:00)

The developer ran `node scripts/collect_lab4_final_output.mjs e2e`. The assistant read the entire [browser output](evidence/post-merge-73faa8b/e2e-full.txt), including all 29 enumerated cases, source/checkout/command headers and exit 0. The command is unfiltered: **29 tests passed, one worker, 1.4m**. Collection began at 16:29:20 and completed at 16:30:44 (+07:00). It includes Labs 2-3 regression, Lab 4 Action/resolution, dashboard drill-downs, role/ownership restrictions, and keyboard/long-content/responsive cases at desktop/tablet/mobile.

The reviewed runtime/test source remains `73faa8b`, with documentation-only checkout HEAD `488e760` on `feature/lab4-final-publication`; this is not claimed as a clean main-branch invocation. Stderr contains only the Node warning that `NO_COLOR` is ignored when `FORCE_COLOR` is set; the warning is preserved and is not a failing test. Complete server, client and browser output plus both builds are now collected. Full current-source logs for the six optional database invocations (nine cases total), reviewed publication, final Board and PDF acceptance remain separate gates.

### Developer complete-history collection - 6 October, 16:32 (+07:00)

The developer ran `node scripts/collect_lab4_final_output.mjs history`. The assistant read the entire [history output](evidence/post-merge-73faa8b/history-full.txt): **1 file / 1 test passed**, start 16:32:35, duration 1.66s, empty stderr and exit 0. The source/checkout header retains reviewed runtime/test source `73faa8b` and documentation-only HEAD `488e760`; the developer did not use the sandbox symlink workaround.

This complete log includes actual fixture `before`, `afterFirst` and `afterSecond` event arrays. Two real API transitions append one event each (IDs 3 and 4); prior fixture rows (IDs 1 and 2) remain unchanged, equal-time rows are ordered by ID, repeated reads agree, and denied stale 409 / Requester 403 writes append nothing. A new disposable local `lab4_history_test_7eb27a0dba85` schema was used; public data was not modified. This supersedes the earlier sandbox-only collection failure, without relabelling that failure as a passing run. One of the nine default-skipped cases now has complete current-source optional output. The remaining five optional invocations cover eight cases; publication, final Board and PDF acceptance remain outstanding.

### Developer complete-Lab-4-migration collection - 6 October, 16:33 (+07:00)

The developer ran `node scripts/collect_lab4_final_output.mjs migration`. The assistant read the complete [migration output](evidence/post-merge-73faa8b/migration-full.txt), including the source/checkout/command header, passing case, summary and empty stderr: **1 file / 1 test passed**, start 16:33:51, duration 5.98s, exit 0. The case verifies preservation of Lab 3 relationships and repeated Lab 4 seed idempotency. The guarded disposable local `lab4_migration_test` schema was reset, not `public`.

The collector records reviewed runtime/test source `73faa8b` and documentation-only HEAD `488e760`, with no developer symlink workaround. History and Lab 4 migration now supply two of the nine separately enabled cases as complete current-source output. The remaining four invocations (recovery, performance, Lab 3 migration and Administrator integration) cover seven cases. Publication, the actual final Done board and final PDF acceptance are not inferred from this pass.

### Developer complete-recovery collection - 6 October, 16:37 (+07:00)

The developer ran `node scripts/collect_lab4_final_output.mjs recovery`. The assistant read the entire [recovery output](evidence/post-merge-73faa8b/recovery-full.txt): **1 file / 1 test passed**, start 16:37:29, duration 2.54s, empty stderr and exit 0. The actual output reports restoration verification of **28 Tickets, 3 Actions, 1 attachment metadata row and the copied attachment SHA-256** in a separate local schema. No exact hash value is printed or invented in this record.

Only the guarded disposable `lab4_recovery_source_test` and `lab4_recovery_target_test` schemas were reset. This is logical database-and-attachment fixture recovery, not a claim that production/public data was backed up or restored. The source/checkout header retains reviewed runtime/test source `73faa8b` and documentation-only HEAD `488e760`. Three of nine optional cases now have complete current-source output; the remaining three invocations (performance, Lab 3 migration and Administrator integration) cover six cases. Publication, final Board and PDF acceptance remain separate gates.

### Developer complete-performance collection - 6 October, 16:38 (+07:00)

The developer ran `node scripts/collect_lab4_final_output.mjs performance`. The assistant read the complete [performance output](evidence/post-merge-73faa8b/performance-full.txt): **1 file / 2 tests passed**, start 16:38:49, duration 2.68s, empty stderr and exit 0. Measured Requester Dashboard **p95 7.8ms / maximum 9.4ms** and Staff Dashboard **p95 7.9ms / maximum 8.0ms**, each across 20 measured requests after five warm-up requests. Both p95 measurements satisfy the <=500ms test threshold. These are actual logged p95 values, not the 385ms test-case duration or the overall run duration.

Context: 28 seeded Tickets, PostgreSQL 18.4, Node v24.14.0, Windows x64, Intel Core i7-11600H. The guarded disposable local `lab4_dashboard_perf_test` schema was reset, not `public`. This is a local warm-request smoke benchmark, not a production-load, cold-start or user-visible browser-latency guarantee. Reviewed runtime/test source `73faa8b` and documentation-only HEAD `488e760` remain explicitly attributed. Five of nine optional cases now have complete current-source output; the remaining two invocations (Lab 3 migration and Administrator integration) cover four cases. Publication, final Board and PDF acceptance remain separate gates.

### Developer complete-Lab-3-migration collection - 6 October, 16:40 (+07:00)

The developer ran `node scripts/collect_lab4_final_output.mjs lab3-migration`. The assistant read the complete [Lab 3 migration output](evidence/post-merge-73faa8b/lab3-migration-full.txt): **1 file / 2 tests passed**, start 16:40:34, duration 10.10s, exit 0. The cases verify existing ID, Ticket ownership and attachment-removal attribution preservation, and rejection before table renaming when requester emails collide after trim/lower normalization.

The preserved stderr message `Requester emails collide after trim/lower normalization` is expected negative-case evidence, not a failed suite. The assistant inspected the test: it deliberately inserts colliding fixture emails, expects the migration to throw, and checks that the Requester table still exists. The guarded dedicated local `lab3_migration_test` schema is used, not `public`. Reviewed runtime/test source `73faa8b` and documentation-only HEAD `488e760` remain attributed. Seven of nine optional cases now have complete current-source output; only Administrator integration (two cases) remains to collect. Publication, final Board and PDF acceptance are still separate gates.

Rerun note: the developer invoked Lab 3 migration again at 16:43:08 (+07:00): **2 tests passed / 10.01s / exit 0**, completed at 16:43:18. The collector's per-check filename now holds this latest complete output, replacing the earlier 16:40 log. The preceding 16:40 timings remain a recorded earlier observation, not metadata asserted for the currently linked file. The repeated migration run is not Administrator integration and is not counted as additional distinct test coverage. No Administrator output file or manifest entry exists at this check.

### Assistant complete-Administrator collection - 6 October, 16:51 (+07:00)

At the developer's request, the assistant ran the remaining check in its terminal. The standard invocation stopped before assertions at Vite's Windows native realpath EPERM. A read-only diagnostic confirmed ordinary file read/realpath succeeded while native realpath failed. An explicitly selected temporary config matches the reviewed Node test environment and include pattern, changing only `resolve.preserveSymlinks=true`; reviewed `server/vitest.config.ts`, application source and all assertions are untouched. The next attempt reached Prisma setup but failed to connect before network access was granted. Both actual failed attempt logs are retained under `evidence/post-merge-73faa8b/attempts/`, not described as passes.

After network permission, `node scripts/collect_lab4_final_output.mjs admin-integration --sandbox-resolver` passed. The assistant read the entire [Administrator output](evidence/post-merge-73faa8b/admin-integration-full.txt): **1 file / 2 tests passed**, start 16:51:12, duration 2.05s, empty stderr and exit 0. It verifies the final-active-Administrator invariant under concurrent deactivation and atomic session revocation/active-work unassignment with history. Only the guarded local `lab3_admin_users_test` schema was reset; `public` was not reset. Database credentials are redacted in output. The header records the actual temporary config and runtime/test source `73faa8b` on documentation-only HEAD `488e760`; this is neither a standard-config main-branch invocation nor developer-run evidence.

Complete logs now cover **134 default-server passes with nine intentional skips; 45 client passes; 29 unfiltered browser passes; both builds; and 1+1+1+2+2+2 = nine separate optional passes**. The default run is not rewritten as a single 143-passed run. The collector archives prior per-check output before future reruns, rather than silently discarding it. All required complete-output collection is finished at the explicitly attributed reviewed-source scope. Remaining work is reviewed publication, actual final Issue/Project status and all-Done board evidence, and final PDF rendering/acceptance.
