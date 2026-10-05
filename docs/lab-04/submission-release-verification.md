# Lab 4 submission completion release verification

## Source and change boundaries

- Preparation branch: `feature/lab4-submission-release`.
- Staging source: [`381e12359dc6ba110eec98c3f2fb6973752b0033`](https://github.com/Earth2509/toktickit/commit/381e12359dc6ba110eec98c3f2fb6973752b0033), merge of [PR #71](https://github.com/Earth2509/toktickit/pull/71) into `lab4-staging` on 5 October 2026.
- Approved feature head: [`56a95c17a8fd564ea0ae81e0d233f6baa480a2b0`](https://github.com/Earth2509/toktickit/commit/56a95c17a8fd564ea0ae81e0d233f6baa480a2b0).
- Fetched main: [`55f8200d373577977d2205499d1c29732fe6b9ec`](https://github.com/Earth2509/toktickit/commit/55f8200d373577977d2205499d1c29732fe6b9ec).
- This preparation increment changes documentation only; runtime code and tests remain those of the staging merge.

The assistant fetched both named remote branches and created this branch directly from the confirmed staging merge. Existing untracked runtime artifacts, PDF output and review scratch files are preserved and excluded from the release documentation commit.

## Peer-approved source verification (not a new release/main run)

[Round-two review](https://github.com/Earth2509/toktickit/pull/71#pullrequestreview-5415787303) reports the following independent checks on a fresh clone of `56a95c1`, with a separate local database removed after verification:

| Check | Reviewer-reported result |
| --- | --- |
| Default server | 25 files passed / 6 skipped; 134 tests passed / 9 skipped |
| Default client | 13 files / 45 tests passed |
| Server and client builds | Exit 0 / exit 0 |
| Dedicated workflow history | 1 file / 1 test passed |
| Unfiltered browser suite | 29 tests passed, one worker |
| Parent component negative control | Corrected parent 4/4 passed; old parent from `e6037e6` 4/4 failed |
| Three-viewport browser negative control | Corrected parent 3/3 passed; old parent 3/3 failed at the post-create focus assertion |

The browser control was run by the reviewer, not the assistant. It closes the independently reproduced browser regression gap without inventing developer/assistant output. The historical main baseline and developer's 24.0-second focused browser summary keep their original attribution.

## New release-preparation checks

The checks below were executed on the release checkout, whose runtime/test source is exactly staging merge `381e123`, with attribution retained per row. `git diff --quiet origin/lab4-staging -- client server e2e playwright.config.ts package.json package-lock.json` exited 0. The assistant checks preceded the documentation commit `70da546`; the developer's server excerpt has no embedded command/branch/SHA header. No clean run SHA is invented for either set of results. Main `55f8200` is an ancestor of this source.

| Check | New preparation result | Attribution and scope |
| --- | --- | --- |
| Default client | 13 files / 45 tests passed; start 21:47:59, duration 92.92s | Assistant-run Vitest 2.1.9 from the client package |
| Server production build | TypeScript exited 0 | Assistant-run package-local compiler; no new runtime test result |
| Client production build | TypeScript and Vite 6.4.3 exited 0; 37 modules, 4.99s | Assistant-run, CSS `index-BxP1s5g_.css`, JS `index-B5PnQ1t8.js` |
| Default server attempt | No tests collected; 31 unhandled sandbox errors, exit 1 | `EPERM` resolving `server/node_modules/vitest/dist/spy.js`; not test assertion failures or a passing run |
| Default server rerun | 25 files passed / 6 skipped; 134 tests passed / 9 skipped; start 21:51:40, duration 31.84s | Developer-supplied summary after the requested `npm --prefix server test` on this release checkout |

The process-only `VITE_PRESERVE_SYMLINKS=true` workaround was used for the assistant's client run/build and attempted server run; no package, configuration or dependency files were edited. The server's Vite 5 resolver still reported `realpath` EPERM. The developer subsequently supplied a passing server summary, closing the default-server verification gap. The [supplied excerpt](evidence/build-output/submission-release-server-test-excerpt.txt) retains the reported timing and totals, not a fabricated complete log or terminal screenshot. The developer workaround/environment is not inferred. No fresh release browser/database run or post-merge main run is claimed; the independent reviewer runs above retain their own attribution.

## Release and final-submission gates

- [x] PR #71 approved on the corrected head and merged into staging.
- [x] Preparation branch starts from the confirmed staging merge.
- [x] Record new default client and both successful build outcomes on this preparation source.
- [x] Obtain the developer's passing default server result after the sandbox stopped before collection.
- [ ] Push this branch and open the release PR into `main` for peer review.
- [ ] Obtain approval and merge the release; record its actual main merge SHA.
- [ ] Run and preserve the final main default suites, both builds, unfiltered browser suite and separately enabled database checks, including the new workflow-history case.
- [ ] Verify working public main links to all required source documents and evidence.
- [ ] Finish Issue #60 and its Project Done status only after its remaining deliverables are verified; preserve the actual all-Done board.
- [ ] Regenerate and visually inspect the final PDF before removing active draft notices.

The default server command intentionally skips nine cases; it is not a single 143-passed run. The prior eight opt-in cases and the new history case require separately attributed executions. The history test uses `prisma db push` for the current model; migration preservation remains a separate check. The legacy browser output path `artifacts/lab-03/playwright-report` also contains Lab 4 scenarios. Do not include `.env`, credentials, cookies, traces or uncurated artifacts in the release commit.
