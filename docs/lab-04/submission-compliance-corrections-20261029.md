# Lab 4 submission compliance correction - 29 October 2026

## Scope and publication boundary

This increment corrects the report's Git chronology and minimum repository paths.
It does not change application behaviour. Its review branch is
`feature/lab4-submission-compliance`, based directly on `main` at `083962c`.
The corrected files are not represented as already merged or independently peer-approved.
Earlier main, feature-branch and controlled-render results retain their original
attribution. No old log header or screenshot has been relabelled.

The separate review checkout excludes the earlier documentation-only branch's
unpublished commits, PDF generation/layout work, scratch directories, dependency
trees and private environment files. The PDF is not renamed Final by this PR.
After peer review and merge, verification and report links must use the new main
SHA; a pre-merge feature run cannot establish that post-merge state.

## Correct specification chronology

The report's earlier claim that merge `6ce7862` is an ancestor of foundation
`343e00f` was wrong. Direct Git object inspection establishes:

| Check | Result |
| --- | --- |
| `merge-base --is-ancestor 6ce7862 343e00f` | 1: not an ancestor |
| `merge-base --is-ancestor be3c5ab 343e00f` | 0: ancestor |
| `show -s --format=%P 343e00f` | sole parent `be3c5ab7c2bce0261384e4e9c1628c1e212201ae` |

`reviewer.md` records PR #61 approval on `be3c5ab`. The recorded merge time precedes
the foundation's time, but that is not merge ancestry. `specification.md` and the
progress note now state the precise reviewed-tip relationship.

## Minimum repository increment

| Labsheet section 12 path | Correction and retained coverage |
| --- | --- |
| `server/tests/lab-04/requester-dashboard.api.test.ts` | Five real cases moved from the former shared suite: authentication/role matrix, owned metrics and ordering, empty state, drill-down and safe failure. |
| `server/tests/lab-04/staff-dashboard.api.test.ts` | Six real cases moved from the same suite: operational metrics, secure owner filter, performer-scoped Actions, Administrator empty state, Requester denial and safe Action-query failure. |
| `e2e/lab-04/ticket-resolution.spec.ts` | Existing open-Action gate, completion, Resolve/Close and Requester read-only/API denial journey moved here without changing assertions. |
| `artifacts/lab-04/screenshots/{staff-dashboard,requester-dashboard,actions-taken}/` | Twelve full original captures copied without modification; `provenance.json` records original paths and identical SHA-256 values. |

The former combined Dashboard test file is replaced, not retained as a duplicate
runner. The two browser journeys share `e2e/lab-04/support.ts`. Consequently the
default server test-file count increases by one, and the browser spec-file count
increases by one, while executable test counts remain unchanged.

## Verification and original output

- Focused relocated Dashboard API cases: 2 files / 11 tests passed, using the
  normal checked-in Vitest configuration after localhost network access was
  granted. The first sandbox attempt failed with `connect EACCES` before receiving
  API responses; that attempt is not described as a product assertion failure.
- Local complete server suite: 26 files passed / 6 skipped; 134 tests passed /
  9 intentional opt-in skips. Local complete client suite: 13 files / 45 tests
  passed. These results are on the modified correction checkout, not main.
- Local Playwright discovery: 29 tests across 8 files. Discovery is not browser
  execution and is not counted as a passing E2E run.
- Fresh clean-main verification is collected separately under
  `evidence/compliance-20261029/main-083962c/`. The collector requires branch
  `main`, exact SHA `083962c2ec75202acae4f5e2cfebef62ee17c007` and a clean tracked
  working tree before and after each invocation. Installed dependencies are
  copied from the existing workspace; no test configuration override is used.
- Local correction output is under `evidence/compliance-20261029/local-correction/`.
  Each manifest records actual checkout, command, exit code and log hash. A new
  result is accepted only after the corresponding command exits successfully.
  These are historical dirty-workspace results at unpublished `995bbe4`, which
  cannot be checked out from the public repository and would not reproduce the
  modified tree from that commit alone. They are not independently reproducible
  review evidence; see the [attribution warning](evidence/compliance-20261029/local-correction/README.md).

The older 6 October collector output is valid preserved source-equivalent
evidence, but not a clean-main invocation. It remains available unchanged.
After publication of these relocated files, a new main run must establish their
post-merge status; a run of the pre-correction main cannot certify new paths.

### Clean-main result available in this correction session

All twelve clean-main commands completed successfully on `083962c`: default server
134 passed / 9 opt-in skips; client 45 passed; server TypeScript, client TypeScript
and client Vite build; history 1, Lab 4 migration 1, recovery 1, performance 2,
Lab 3 migration 2 and Administrator integration 2. All nine optional cases ran
separately and passed; the complete browser suite passed 29 tests in 1.3 minutes.
No public schema was reset. The assistant executed eleven successful commands
with bundled Node v24.22.1. The developer executed the accepted browser repeat
with Node v24.14.0, starting 07:43:40.880 UTC and ending 07:45:01.097 UTC
(14:43:40-14:45:01 Asia/Bangkok). This is a collection of separately attributed
commands against one clean source commit, not one uninterrupted same-runtime run.

The accepted Browser output is `main-083962c/e2e-full.txt`, exit 0,
SHA-256 `6c7b0e7fce2288000556886d0dae005ee069911002580509c0a23401a70386e4`.
Its header identifies branch `main`, checkout `083962c`, clean tracked files,
the installed user browser cache and isolated ports 18601/18673. The first attempt used the wrong
sandbox browser-cache directory; its observed diagnostic, not a fabricated full
stdout capture, is recorded in `main-083962c/attempts/browser-cache-diagnostic.md`.
The repeat used the installed Chromium cache and reached all 29 test entries but
did not finish shutdown in the sandbox. It was interrupted and is not counted as
passed. Its raw command streams remain in `tmp/lab4-verification-spool/` and are
not substituted for a successful command exit. The developer repeat described
above supplies the completed result that closes the baseline Browser evidence
gate. It does not certify the unmerged file relocation as a post-merge main run.

The first local-correction headers reuse the collector's generic dependency-copy
sentence. That sentence applies to the separate main checkout, not the original
correction workspace, which reuses its already installed dependencies. Test
counts, commands, checkout labels and exit codes are unaffected by this metadata
clarification.

## Review-branch verification before publication

The isolated review checkout was committed as
`b54a04001c5719ea3530f4236312ab6f4c5a0ca9`. All seven completed checks ran on
that branch with tracked files clean before and after the command. The original
outputs and manifest are under
[`branch-compliance/`](evidence/compliance-20261029/branch-compliance/):

| Check | Actual result |
| --- | --- |
| Relocated Dashboard API | 2 files / 11 tests passed |
| Full server | 26 files passed / 6 skipped; 134 tests passed / 9 intentional skips |
| Full client | 13 files / 45 tests passed |
| Server TypeScript | exit 0 |
| Client TypeScript | exit 0 |
| Client Vite production build | exit 0; 37 modules |
| Browser discovery only | 29 tests across 8 files; not execution |

Browser execution listed all 29 cases but stalled before returning a summary or
successful exit. It was interrupted, not counted as passed; original streams and
the diagnostic boundary are in
[`branch-compliance/attempts/`](evidence/compliance-20261029/branch-compliance/attempts/).
The completed relocated-source Browser run required for review was subsequently
reported by Nuggetkub on `cf3409a`: a full 29-test run exited 0 after a disclosed
earlier environment failure. See the [peer verification record](compliance-peer-verification-20261029.md)
for both runs and the review's limits. This is peer-reported branch evidence,
not a new successful sandbox log, approval or post-merge main run. The baseline
main result remains separate. This documentation correction changes no runtime
or test-case bodies.

## Report layout

The corrected report preserves all complete original images without cropping,
stretching or stitching. It separates the local correction from the published
baseline and retains original result attribution. Long-image navigation should
open at page width, allowing vertical reading rather than shrinking an entire
long page into one screen. The labsheet specifies readability and concision, not
a numerical maximum page count.
