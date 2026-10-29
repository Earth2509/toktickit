# Lab 4 compliance increment: peer verification, 29 October 2026

Source: [Nuggetkub's PR #75 review](https://github.com/Earth2509/toktickit/pull/75#pullrequestreview-5695684824).
The reviewer reports a fresh clone of `feature/lab4-submission-compliance` at
`cf3409a368e88f49ec17b6cf9a773d31fe42e97d`, based on main `083962c`.
These are reviewer-reported results, not a new assistant/developer execution or
post-merge main output. The review requests one documentation correction and is
not an approval of this PR or the final PDF.

## Independent static checks reported by the reviewer

- An independent extractor found all 11 original Dashboard API cases and both
  browser cases unchanged, with no lost or duplicate case.
- Both API mock preambles and `beforeEach` bodies match the baseline. The shared
  `signIn` function is byte-identical to the removed original, and both specs
  import `./support.js`.
- Git inspection confirms `be3c5ab` is the foundation's sole parent and ancestor;
  merge `6ce7862` is not an ancestor.
- Every source/destination/provenance SHA-256 matches for the 12 image copies.
  The original source images are tracked on main `083962c`.
- All 24 recorded file/hash pairs in the three compliance manifests match the
  committed log bytes. The interrupted sandbox attempt is not a successful E2E
  manifest entry.

## Browser execution reported by the reviewer

The reviewer used the checked-in configuration without overrides, `npx playwright
test`, Playwright 1.62.1, one worker and a local disposable `lab3_e2e` schema.

| Run | Started (UTC) | Reported result | Reported exit |
| --- | --- | --- | --- |
| 1 | 2026-10-29 09:38:37 | 28 passed / 1 failed, 1.3m | 1 |
| 2 | 2026-10-29 09:40:19 | 29 passed, 1.4m | 0 |

In both runs, the relocated `ticket-resolution.spec.ts` completed as case 29 of
29, after dashboard, evidence-completion and responsive specs. The first run's
failure was the untouched Lab 2 mobile case: `page.goto` returned
`net::ERR_NO_BUFFER_SPACE` before assertions. The reviewer reports no source
change between the two runs. A prior setup attempt did not start because the
fresh clone still needed `prisma generate`; that attempt is not a passing run.

The successful second run supplies peer verification of the relocated full
Browser suite. It does not alter the earlier sandbox attempt, create a missing
local success log, or certify a future main commit. This document summarizes the
linked review; it is not complete raw Playwright output or a fabricated hash
manifest. Retain complete post-merge main output separately for submission.

## Scope and requested correction

The reviewer did not rerun the server/client unit suites or inspect the PDF.
The browser startup did build the server successfully. The single required
change is stale paths/counts in `submission-outline.md`; this follow-up updates
them to the relocated paths, client 45, Browser 29 and nine separate opt-in
cases, with baseline/branch attribution preserved.

The optional attribution clarification also explains that the dirty
`local-correction` checkout at unpublished `995bbe4` is not directly reproducible
from the public repository. The published baseline, clean review-branch logs
and independent peer verification are the reproducible review references.
