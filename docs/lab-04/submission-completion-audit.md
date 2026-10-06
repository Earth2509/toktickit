# Lab 4 submission completion audit

## Current release status - 5 October 2026

[PR #71](https://github.com/Earth2509/toktickit/pull/71) is [approved on `56a95c1`](https://github.com/Earth2509/toktickit/pull/71#pullrequestreview-5415787303) and merged into `lab4-staging` as [`381e123`](https://github.com/Earth2509/toktickit/commit/381e12359dc6ba110eec98c3f2fb6973752b0033). The reviewer independently passed server 134 / 9 skipped, client 45, both builds, history 1 and browser 29, and supplied both component and three-viewport browser negative controls. These results belong to the reviewer on `56a95c1`, not a new developer main run. The release preparation branch `feature/lab4-submission-release` starts from that exact staging merge, with documentation-only changes. Main remains `55f8200`; [submission release verification](submission-release-verification.md) tracks promotion and new checks. Historical publication/re-review pending statements below are superseded for PR #71's staging merge only. Final main output, final all-Done board and final PDF remain outstanding; Issue #60 is not closed by the staging merge.

## PR #71 correction status - 5 October 2026

The peer review found a successful-save keyboard focus regression on the real Staff Detail, despite passing historical form/Cancel checks. Same-Ticket refreshes now keep the Action section mounted. Four new real-parent component regressions failed on the reviewed application source and pass after the correction; the complete client suite passes 45 tests and the production build passes. Successful Create/Complete focus assertions were added to the three-viewport browser cases. After assistant-side Prisma preparation stopped before tests executed, the developer reran those cases successfully: 3 passed, one worker, 24.0 seconds. The scoped successful-save sign-off is restored using that result, with the historical Cancel-only evidence kept separate in [current checklist provenance](final-checklist-verification.md). No assistant browser negative control, peer approval, public publication, main result or Issue #60 Done transition is claimed.

## Current submission increment - 5 October 2026

The local representative visual/accessibility checklist is signed off using the attributed live/manual evidence, real disposable-database API assertions and explicitly labelled controlled states. Three final Action keyboard/edit-submitting cases passed in 17.0s, with nine full images inspected. The subsequent full client suite passed 12 files / 41 tests in 17.52s and the production build passed with 37 modules in 636ms. The corrected form manages opening, validation/error and return focus and exposes its saving state. The supplied results and their working-tree limits are recorded in [final checklist verification](final-checklist-verification.md).

README verification instructions and the six local engineering documents now include the supplementary evidence and the correction's verification. Earlier pending statements below are chronological records, superseded for the states explicitly covered by the later records. The remaining release steps are to publish the selected source/docs/evidence, obtain peer review through staging and main, confirm the public source links/final main results, then complete Issue #60 and capture the final all-Done Project board. The report remains a review copy until those steps are verified; local visual sign-off alone does not complete the GitHub workflow.

The Part 7 pre/post preservation gap is now closed by the separately passing [history integration check](workflow-history-verification.md): 1 file / 1 test, start 12:24:00, duration 3.98s on 5 October. It supplements, rather than relabels, the earlier live after-snapshot. The preceding default-suite summary remains 134 passed / 9 intentional skips; the new case passed separately. The rendered review copy has 70 sequential figures, all nine Parts and no blank pages; representative table and full-image pages are visually checked after export. No final-submit claim or Done transition is made: peer-reviewed publication, final main/source links and the actual final board remain outstanding.

## Additional evidence runner — 4 October 2026

Update: the developer ran the suite outside the sandbox. Three cases passed initially; the fourth passed alone after correcting two test assumptions (Administrator landing screen and shared Detail read route). All four cases have now passed across separate runs. Eight full-page images are preserved; see [focused verification](evidence-completion-verification.md). Earlier runner-blocked wording below is historical. Remaining publication, final board and complete manual sign-off are not automatically closed by this result.

Four focused browser cases are prepared in `e2e/lab-04/evidence-completion.spec.ts`; see [run instructions and provenance limits](evidence-completion-run.md). Assistant execution is blocked by Vite `EPERM` while resolving `client/src/main.tsx`, even after narrowly scoped permissions were granted. No passing result or new completed visual check is claimed. Preserve the existing main results separately. The PDF remains a review draft and Issue #60 stays open pending actual verification and final sign-off.

## Full output update — 4 October 2026

The populated Anan Dashboard is now independently compared against the developer-run read-only query: 13/0/2/0 and the same five recent rows in order. Genuine populated Dashboard, two-row drill-down and owned Detail/read-only Action images are recorded in [Requester populated verification](live-requester-populated-verification-20261004.md). Aree's genuine empty Dashboard is independently compared separately in [Requester empty verification](live-requester-metric-verification-20261004.md). These observations do not establish a populated waiting state or replace direct authorization tests.

The genuine Administrator-session operational Dashboard failure and same-tab Retry recovery are now captured after the developer stopped/restarted the local API. See [outage/recovery verification](live-dashboard-recovery-20261004.md). This closes that safe-failure visual path, not loading, wholly empty or forbidden states.

The subsequent authorized live lifecycle and developer-run read-only history snapshot are now recorded in [workflow verification](live-workflow-verification-20261004.md). Six genuine images close successful Resolve/Close/Reopen, Reopen-reason and post-reopen rejection visual gaps. Actual event IDs 9–12 confirm version 1→5 and final OPEN with unchanged owner/priority. This is a single after-snapshot; initial database access failed, so full pre/post immutability is not claimed. Other state evidence and final PDF remain outstanding.

Subsequent client build: the complete local log shows TypeScript followed by Vite passing, 37 modules, 639 ms. It is retained under `evidence/build-output/` and attributed to the submission branch, not a new main run. Client source is unchanged from main `55f8200`. The complete server-build log is also retained: `tsc`, no reported diagnostics, with developer-reported completion. Both build-output collection steps are now finished; remaining visual/PDF work is not.

All eight complete main logs are now preserved and checked at `55f8200`: server 134 passed / 8 skipped, client 41 passed, E2E 19 passed, and all eight default-skipped cases passed separately. See [full output verification](main-full-output-verification.md). Complete build logs are also retained with their separate provenance. This closes output collection, but logs are not terminal screenshots. Remaining visual evidence and final PDF sign-off remain incomplete. Issue #60 is not marked Done by this update.

## Current status — 4 October 2026

[PR #70](https://github.com/Earth2509/toktickit/pull/70) is approved and merged into `main` as [`55f8200`](https://github.com/Earth2509/toktickit/commit/55f8200d373577977d2205499d1c29732fe6b9ec). It records the post-release checks and completes the PR #69 review history. The tested application source remains `7329652`; the subsequent merge is documentation-only and is not described as a new runtime test run.

The staging/promotion/main-verification pending statements below are chronological records from 2 October, superseded by PRs #69 and #70. They must not be copied into the final report as current blockers. Reflection adoption is now complete. The remaining blockers are the evidence gaps, manual visual/accessibility sign-off and final rendered submission document. [Issue #60](https://github.com/Earth2509/toktickit/issues/60) is still open and must not be marked Done merely because the automated suites passed.

### Next increment: submission completion

1. Reuse the existing genuine evidence under `evidence/`; inventory it before taking replacement images.
2. Collect only missing visual states identified below. Record source SHA, viewport, role and whether a state uses a controlled test interception or a real API response. Never present intercepted responses as live backend verification.
3. Preserve the student's explicitly confirmed reflection in `ai-use.md`, including its AI-assistance disclosure (confirmed 4 October).
4. Complete the manual keyboard/visual checklist only for observed behavior, then assemble Parts 1–9 with full rendered engineering documents and readable, uncropped, aspect-ratio-preserving screenshots.
5. Review the exported document for unreadable table headers, blank pages, figure order and working source links before submission sign-off.

The 4 October increment adds eight genuine full-page Staff screenshots and a partial manual keyboard record. A read-only database query independently matched the Staff Dashboard counts (17 unassigned, 2 owned, 8 urgent, 0 waiting) and three original-recorder Actions. These checks do not constitute a new passing automated suite or complete manual sign-off. See [manual verification](manual-accessibility-verification.md) and [evidence provenance](evidence/main/README.md).

The latest assembly plan is [submission-outline.md](submission-outline.md). It maps the full documents and available evidence to Answer Parts 1–9 and explicitly preserves the unresolved requirements. It is not a completed submission PDF.

Checked: 2 October 2026 against `SE+Lab+4.pdf`, especially the Part 1-9 submission table on pages 10-11. Status: not yet ready for an unconditional complete/Done claim.

## Work completed

- Release source merged to main (`ffe6e0e`); server 130 passing / 8 default opt-in skips, client 39 passing, E2E 19 passing, and all eight opt-in server cases passing separately. Both builds passed. See [verification provenance](final-main-verification.md).
- Twelve full-page post-merge responsive images preserved without cropping or distortion.
- Live Staff Dashboard and owned-card drill-down; actual Action API failure and successful recovery after the developer applied the missing local migration.
- Genuine Action empty state, create form, required description/follow-up/result validation, persisted create/edit/complete/cancel, and real two-tab stale-version rejection with draft preservation and no overwrite.
- Resolution rejected for missing summary and an OPEN Action; the demonstration Ticket remains OPEN.
- All live evidence changes confined to the approved local fixture TT-2026-000021, except read-only views and rejected validation attempts on TT-2026-000001. The fixture contains three Actions. No old Ticket was updated or deleted.

## Product gap requiring an implementation decision

Update: the developer authorized the correction. `feature/lab4-staff-actions-dashboard` implements the original-recorder/session-user preview/count, typed API response, links, empty state and added tests. Both assistant-side TypeScript checks passed; the local UI and three responsive screenshots were inspected and the displayed three Actions matched a read-only database query. Developer-supplied feature-branch results passed: server 134 (8 intentional skips), client 41, focused Dashboard browser 3, full browser 19, performance 2, and both builds. The peer approved `1350a4a` in [review 5391559592](https://github.com/Earth2509/toktickit/pull/68#pullrequestreview-5391559592); PR #68 merged into `lab4-staging` as `e533135`. Promotion to main and refreshed main verification remain pending. These feature-branch results must not be presented as a new main run.

Part 5 explicitly requires `current-user Actions Taken` on the Staff Dashboard. Main at `ffe6e0e` renders four Ticket-count cards and recent operational Tickets, but no current-user Action list/count. `Owned by me` counts owned Tickets and is not equivalent to Actions recorded by or assigned to the current user. The approved correction uses session-derived original-recorder identity; it is merged in staging, but its promotion and fresh main evidence are still required.

## Dashboard correction release preparation, 2 October 2026

`feature/lab4-dashboard-release` was created from the confirmed staging merge `e533135`. Remote main is still `ffe6e0e`; the correction is not yet reachable from main. Assistant attempts to run both default suites on the integrated staging source stopped while esbuild loaded the Vitest/Vite configuration because access to an ancestor directory was denied. No tests executed and no new passing result is claimed. Local developer verification is the next step, followed by a release PR into main, peer review, and post-merge verification. Existing review scratch files were left untouched.

The developer subsequently supplied the default server summary for this release preparation: **25 files passed / 5 skipped; 134 tests passed / 8 skipped**, start 23:37:21, duration 9.01s. This is developer-run release-branch evidence, not assistant-run evidence or a post-merge main result. The supplied excerpt does not include a branch/SHA header. The eight opt-in tests did not run in this command. Client regression, browser checks and the remaining release verification are still pending.

The developer then supplied the default client summary: **12 files / 41 tests passed**, start 23:39:00, duration 16.48s. This completes the default server/client regression evidence for this release preparation, with the same developer-run and source-provenance limitations above. It supersedes the preceding client-pending status, but does not establish a new main run. Client production build, browser verification and release promotion remain pending.

The developer supplied a successful client production build (TypeScript followed by Vite 6.4.3): **37 modules transformed; built in 654ms**. Output assets were `index-BxP1s5g_.css` (24.41 kB) and `index-CgTo7x62.js` (229.87 kB). This supersedes the client-build-pending status above. The assistant separately ran the server TypeScript build and client no-emit TypeScript check successfully during release preparation. Browser verification, the opt-in database checks and promotion to main remain separate steps; no post-merge main run is claimed.

The developer subsequently supplied the unfiltered browser result: **19 tests passed using one worker in 1.1 minutes**. The configured HTML report location is `artifacts/lab-03/playwright-report`; this legacy Lab 3 path also contains the Lab 4 scenarios. This completes browser verification for the release preparation, not post-merge main verification. Opt-in database checks and promotion to main remain pending. The Prisma update notice in the supplied output was informational, not a failing test or a dependency upgrade performed during verification.

The developer supplied the opt-in Lab 4 migration result: **1 file / 1 test passed**, start 23:43:28, duration 6.08s (test 5.66s). The reported case verifies preservation of Lab 3 relationships and repeat-seed idempotency. This is release-preparation evidence from the named `lab4_migration_test` schema, not production data or a new main run. Logical recovery and dashboard performance verification remain pending for this release preparation.

The developer supplied the logical recovery result: **1 file / 1 test passed**, start 23:44:39, duration 2.40s (test 1.97s). The reported case restores application rows and attachment bytes into a separate disposable schema. This verifies the logical recovery test, not native PostgreSQL backup, physical recovery or production recovery. It supersedes the recovery-pending status above. Dashboard performance verification remains pending for this release preparation.

The developer supplied the dashboard performance smoke result: **1 file / 2 tests passed**, start 23:45:51, duration 2.54s (tests 1.87s). Both the Requester and Staff endpoints met the p95-at-most-500-ms assertion across twenty warm requests. Individual p95 values were not included in the excerpt and are not inferred from the overall test durations. This is machine-specific local smoke evidence, not a production latency guarantee. All four Lab 4 opt-in cases (migration 1, recovery 1, performance 2) have now passed separately; the four Lab 3 opt-in cases remain unverified on this release-preparation source.

The developer supplied the Lab 3 migration result: **1 file / 2 tests passed**, start 23:47:18, duration 9.99s (tests 9.28s). The reported cases preserve existing IDs, Ticket ownership and attachment removal attribution, and reject normalized-email collisions before renaming tables. The command derives its connection from `server/.env` without printing credentials and targets only `lab3_migration_test`. Six of the eight default-skipped cases have now passed separately; the two Administrator integration cases remain pending on this release-preparation source.

The developer supplied the Administrator integration summary: **1 file / 2 tests passed**, start 23:48:27, duration 1.64s. The requested command targets only `lab3_admin_users_test`; the supplied excerpt does not contain individual case names. All eight default-skipped cases have now passed separately. The completed release-preparation results supersede the chronological pending statements above and are consolidated in [dashboard-release-verification.md](dashboard-release-verification.md). Promotion to main, peer review of that promotion, final visual/submission sign-off and Issue #60 remain incomplete.

## Authorship/input gap

`ai-use.md` records eight actual selected requests as standardized English paraphrases, not verbatim quotations. The handout requires six to ten selected prompts and a brief personal reflection. On 4 October the student explicitly confirmed that the proposed reflection matches their experience and authorized adopting it as My Reflection. The pending/draft wording has been removed, while the AI-assistance disclosure is retained. The recorded model name/reasoning metadata should still be verified rather than guessed.

## Evidence gaps before final PDF

- Dashboard loading, completely empty, forbidden and safe-failure screenshots. Selected Staff metric/database-query correspondence is now verified; Requester correspondence and the remaining visual states are still pending.
- Action submitting, inactive-assignee rejection, assignee-versus-performer restrictions and remaining role visibility evidence.
- Successful Ticket transitions and stable/append-only history ordering; remaining resolution guards, including post-reopen eligibility and required follow-up evidence.
- Representative earlier-lab regression UI evidence and completed manual keyboard/accessibility checklist. Staff Dashboard/Queue and three unsaved Action validation paths are partially verified; Requester/Admin checks and remaining focus/error paths are not yet signed off.
- Final Project board state and full main test output screenshots. Genuine recent GitHub network and original contract/foundation commit images are now recorded in `git-workflow-verification.md`, including exact limitations of their displayed dates and history window. Supplied terminal excerpts are retained as excerpts, not fabricated terminal screenshots or complete logs.

The existing E2E and API runs provide automated coverage, but that does not automatically supply every requested visual proof. Do not mark unobserved states inspected. Do not close Issue #60 or move it to Done until the unresolved requirements and final report are actually completed.

## Final document requirements

### Requester increment — 4 October

Five genuine Requester images now cover an all-zero/fully empty Dashboard, keyboard Waiting-for-You drill-down with no results, unfiltered empty My Tickets, initial Create Ticket and empty-required-field keyboard validation. The developer signed into Aree's existing account; no Ticket or account was changed. Images and scoped accessibility observations are linked in the evidence README/manual verification record. This closes the Requester empty-state visual gap only; populated ownership/Detail, remaining states, independent Requester aggregates and Administrator checks remain outstanding.

### Administrator increment — 4 October

Five genuine Administrator images now cover role-filtered Users, disabled self-deactivation with explanation, the unsaved Create User form, empty-required-field validation and no-results search. Forms were cancelled and the unfiltered list restored; no account or password was changed. This supersedes the preceding statement that all Administrator live checks are outstanding, but successful mutations, remaining role/failure paths and full manual sign-off are still unverified. The evidence README and manual record preserve these limits.

Use Answer Part 1 through Answer Part 9 in the exact handout order. Include full rendered copies of the required engineering documents, working source links, readable full screenshots, and an explicit mapping for combined test files/legacy artifact paths. Preserve aspect ratio and do not crop mobile images. Tall full-page screenshots need suitable page sizes or supplementary readable full-page presentation, not stretched standard-page thumbnails.

This audit is not the final submission PDF and does not claim a grade or complete compliance.
