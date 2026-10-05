# Lab 4 final sign-off progress

## 5 October 2026: remaining checklist corrections

The contract-before-implementation item is now checked against repository history, not inferred from the PDF: contract merge `6ce7862` is an ancestor of implementation head `343e00f`. Commit times are 25 September 17:49:57 and 22:43:03 +07:00 respectively; formal contract peer approval is linked in `reviewer.md`.

The earlier manual inspection identified Action form focus gaps. The local application correction moves focus into the first enabled form field on opening, moves focus to the invalid field for validation or the focusable error for a save failure/conflict, and restores the invoking Action control on dismissal (falling back to Add action if a successful transition removed that control). The form now exposes `aria-busy` while saving. Existing unit cases now assert opening, validation, cancellation and completion-field focus.

Three new browser cases, one per 1440x900 / 820x1180 / 390x844 viewport, exercise associated labels, keyboard field order, description and follow-up errors, visible focus, textual OPEN status, disabled edit-saving controls, a preserved edit draft on controlled HTTP 409, and keyboard return to the invoking Edit action button. Each creates its own valid disposable test Action. The controlled PATCH never persists the attempted edit. This is not a live/public database mutation or evidence of a real concurrent database conflict; the separately recorded real conflict evidence remains distinct.

TypeScript `tsc --noEmit -p client/tsconfig.json` and `git diff --check` passed locally. Vitest could not resolve its spy module due to sandbox EPERM. The sandbox Playwright attempt stopped before test execution at the Prisma schema engine. The developer subsequently reported 3 passing final Action browser cases in 17.0 seconds; nine full screenshots were preserved and inspected, as recorded in [final-checklist-verification.md](final-checklist-verification.md). The 5 October client regression rerun passed 12 files / 41 tests in 17.52s, and the client build passed with 37 modules in 636ms. These checks cover the local correction; historical main totals retain their original source attribution.

## Verification commands (Windows Command Prompt)

Run one line at a time:

```bat
cd /d "C:\Users\ASUS\Documents\Codex\2026-08-12\github\lab4-engineering-contract"
npm --prefix client test
npm --prefix client run build
set E2E_CLIENT_PORT=18173
set E2E_SKIP_PRISMA_GENERATE=true
set PLAYWRIGHT_BROWSERS_PATH=C:\Users\ASUS\AppData\Local\ms-playwright
npm run e2e -- --grep "final Action keyboard"
```

The runner forces the disposable `lab3_e2e` schema. Do not enable server reuse against the public development app. Preserve full screenshots for validation, edit-submitting and conflict from the passing run before generating the next report.

## Dedicated history check passed - 5 October 2026

The developer's separately executed opt-in history case passed: 1 file / 1 test, start 12:24:00, duration 3.98s. It verifies prior event-row preservation across real workflow writes, chronological ID tie-breaking, repeated-read equality and no history change after stale/Requester-denied writes in a fresh local schema. See [history verification](workflow-history-verification.md) for the preserved excerpt and scope limitations. The ordinary server result remains 134 passed / 9 intentional skips; no combined main run is claimed. This closes the local history-verification gap, not the publication or final-board gates.

## Publication and final report gate

The GitHub CLI is not authenticated in this sandbox. Publication is not yet verified. Publish selected source/doc/evidence files (not all artifacts, traces, temporary output or `server/.review-pr96`), obtain peer review, merge through the required staging/main workflow, and verify final main results and document URLs. Only then mark genuinely completed Issues Done, capture the final board and remove active draft/pending notices. Preserve historical review wording as historical context rather than deleting evidence of earlier review rounds. No final-submission PDF or completed Project Board is claimed by this progress record.
