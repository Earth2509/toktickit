# Lab 4 submission post-merge verification — 6 October 2026

## Source and attribution

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
- [ ] Update current report wording/checklists using this dated record, preserving historical provenance and limitations.
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
