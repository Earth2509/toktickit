# Lab 4 final submission assembly

Status: assembly plan, not the completed submission. Rechecked against SE+Lab+4.pdf pages 10–11 on 5 October 2026. Produce exactly one PDF using Answer Part 1–9 in the handout's order. Do not remove the Answer headings for this lab or rename Part 5 to Engineering Design. Repository main remains the application source of truth. Later dated evidence records supersede earlier collection-pending observations only within their stated scope.

## Answer Part 1: Git Use with Engineering Workflow

Include actual feature -> lab4-staging -> main commit history; final Kanban; full rendered [reviewer.md](reviewer.md); README, .gitignore and directory evidence. The reviewer record now includes PR #70's two rounds and main merge. Issue #60 must stay open until its evidence-ready Definition of Done is met. A final all-Done Kanban image is therefore still pending. Git graph evidence may be derived from real Git output and labelled accordingly; do not fabricate a terminal screenshot.

The [genuine GitHub network graph](evidence/main/github-network-feature-staging-main-live.jpg) now shows the recent feature/staging/main integration. Pair it with the original contract/foundation commit screenshots and the scoped [chronology record](git-workflow-verification.md); its recent window is not the entire repository history.

## Answer Part 2: Spec DD

Include source link and full rendered [specification.md](specification.md), including requirements, BR-01–17, transitions, Dashboard calculations, ACs, migration and Product DoD. Preserve spec-before-code history from the original contract PR #61. The current status distinguishes application release `7329652`, documentation merge `55f8200`, and historical `ffe6e0e`.

Use [Git chronology verification](git-workflow-verification.md) for actual recorded timestamps, original file additions and the independently checked ancestor relationship. It supports Part 1–2, but is explicitly command transcription, not the required Git-history screenshot or a PR-creation-time proof.

## Answer Part 3: Test DD and Traceability

Include source link and full rendered [tests.md](tests.md), all planned-test/AC mapping rows, actual file paths and status. Add [final-main-verification.md](final-main-verification.md) with latest 134 server / 41 client / 19 E2E counts and eight separately passed opt-in cases. Explain that both Dashboard APIs share dashboards.api.test.ts and resolution browser coverage shares actions-taken-flow.spec.ts; the lab-03 artifact directory is a retained runner path containing Lab 4 cases.

Complete main-run test logs are now preserved in [main-full-output-verification.md](main-full-output-verification.md): eight developer-run logs with full main SHA/branch headers, including every opt-in suite. Both subsequent submission-branch build logs are preserved separately with their stated provenance. These are genuine output transcripts, not terminal screenshots. Sandbox attempts on 4 October did not collect tests and must not be shown as passing runs.

## Answer Part 4: AI Use with Reflection

Include full rendered [ai-use.md](ai-use.md), eight selected standardized prompt paraphrases and the tool/role declaration. The student explicitly adopted the AI-assisted My Reflection on 4 October 2026; retain its authorship disclosure. Reflection is no longer an outstanding input. Verify model metadata rather than inferring it from historic boilerplate.

## Answer Part 5: Working IT Staff Dashboard UI

A [genuine API-outage and recovery pair](live-dashboard-recovery-20261004.md) now shows safe failure and Retry while the developer-stopped API is unavailable, followed by successful populated Dashboard recovery after restart and activation of Retry in the same tab/session. The session is Administrator; do not label it Requester failure or forbidden access.

The [4 October read-only increment](live-evidence-increment-20261004.md) adds a genuine Administrator-session own-Action empty-state image. Recent operational Tickets remain populated; do not call it a wholly empty Dashboard or relabel the account as IT Staff.

Reuse the responsive Dashboard images and original-recorder Action-preview captures. Add the live card/list correspondence and independent database read evidence: 17 unassigned, 2 owned, 8 HIGH/URGENT operational Tickets, zero Waiting for Requester and 3 recorded Actions. The two owned rows and ordered Action IDs match the query. The zero-card destination is Queue no-results, not a fully empty Dashboard. Supplementary loading, fully empty and forbidden images are now included: loading delays a real request, while empty/forbidden are explicitly controlled rendering fixtures. Actual API authorization is verified separately. The genuine operational safe-failure/Retry pair is complete.

## Answer Part 6: Working Actions Taken UI

Reuse create/edit/complete/cancel, distinct Action statuses, safe-failure/recovery, responsive and real two-tab conflict evidence. The unsaved keyboard Description/Follow-up/Result validation, edit-submitting and preserved-draft conflict images are now included, with regression verification (client 41/41 and build passed on the submission working tree). Focused evidence also records a real inactive-assignee 422 and a non-performer/non-assignee read-only screen. The latter demonstrates the observed completed-Action state; it does not establish every possible status combination. Link the complete rendered [api-spec.md](api-spec.md) here; it must not be merely referenced. These branch results are not a new main verification run.

## Answer Part 7: Working Ticket Workflow

The [authorized live lifecycle increment](live-workflow-verification-20261004.md) supplies six full original images for completion, RESOLVED, CLOSED, missing-reason rejection, REOPENED and post-reopen resolution rejection. The subsequent genuine database snapshot confirms event IDs 9–12, actor 36, version chain 1→5, unchanged owner/priority and final OPEN state, with two completed and one cancelled Actions. Include its readable event table and link to full JSON. The single after-snapshot does not independently prove byte-for-byte pre/post immutability or database-wide append-only enforcement.

Reuse missing-summary and open-Action resolution rejection together with the successful transitions and post-reopen rejection above. The separately passing [history integration check](workflow-history-verification.md) now supplements the single live after-snapshot: `npm --prefix server run test:lab4-history` creates a fresh local schema, applies two real workflow API transitions and compares all prior event fields before/after, repeated ordered reads and rejected stale/Requester writes. The dedicated developer run passed 1 test in 3.98s on 5 October; it is not a main-run result or a fabricated full JSON transcript. Existing resolution API/unit cases cover follow-up guards; neither controlled screenshots nor this history test are a new screenshot of every guard.

## Answer Part 8: Working Requester Dashboard and Final Regression UI

The [populated Anan increment](live-requester-populated-verification-20261004.md) adds full genuine Dashboard, two-result Recently Updated drill-down and owned Ticket Detail/read-only Actions evidence. The developer's independent database query confirms cards 13/0/2/0 and the same five recent rows in order. Include its comparison tables and attributed JSON transcription. Do not label the account as having a populated waiting state.

The [4 October independent Requester metric comparison](live-requester-metric-verification-20261004.md) now confirms that active Aree user 27 owns zero Tickets: all four Dashboard metrics are zero and recent rows are empty. Include the comparison table and link to the preserved real JSON. This closes the empty-account metric comparison, not the populated-account or cross-requester authorization cases.

Reuse existing three-viewport Requester Dashboard/read-only Action images with their original run provenance. Recorded live Requester and Administrator keyboard inspections, plus supplementary seeded ownership and private-note checks, now provide representative role/regression evidence. Do not reset credentials or infer uninspected role/status combinations from these scoped observations.

The 4 October authenticated sessions now add the following genuine full-page originals. They close selected empty/validation/regression gaps, not every role requirement:

- [Requester genuinely empty Dashboard](evidence/main/requester-dashboard-genuine-empty-live.jpg), [Waiting-for-You zero-result drill-down](evidence/main/requester-waiting-zero-drilldown-live.jpg), and [unfiltered empty My Tickets](evidence/main/requester-my-tickets-genuine-empty-live.jpg).
- [Create Ticket initial state](evidence/main/requester-create-ticket-initial-regression-live.jpg) and [required-field keyboard validation](evidence/main/requester-create-ticket-keyboard-validation-live.jpg), with session-selected read-only Requester.
- [Administrator role-filtered Users](evidence/main/admin-users-role-filter-live.jpg), [self-deactivation disabled with explanation](evidence/main/admin-self-deactivation-disabled-live.jpg), and [no-results search](evidence/main/admin-users-search-no-results-live.jpg).
- [Create User initial form](evidence/main/admin-create-user-initial-live.jpg) and [empty-field validation](evidence/main/admin-create-user-empty-validation-live.jpg). No account or credential was changed.

Read the corresponding dated sections of [evidence provenance](evidence/main/README.md) and [manual checks](manual-accessibility-verification.md) before assigning captions or checklist results. Requester populated ownership/Detail is verified by the separate Anan increment. These read-only Administrator sessions do not claim new successful account mutations; preserved main regression cases cover those operations.

## Answer Part 9: Zen Green UI, Responsive, Accessibility and Final Polish

Include full rendered [ui-spec.md](ui-spec.md), desktop/tablet/mobile major-screen evidence and the scoped checklist. Add [manual-accessibility-verification.md](manual-accessibility-verification.md) for actual role navigation, fields and validation checks and [final-checklist-verification.md](final-checklist-verification.md) for the correction's attribution. PR #71 review found lost focus after successful saves on the real Staff Detail; the new parent/child component regressions pass, and the developer's corrected browser rerun passes three viewports in 24.0 seconds. Do not present the historical Cancel-dismissal images as proof of the new successful-save assertions or replace old main totals with branch results. Computed outline presence is not a contrast or WCAG certification.

Preserve full images without cropping/stretching. Full-width tall-image pages should have height proportional to the original, rather than shrinking a 5000px form to a narrow thumbnail on A4. Use dark table-header text on a light background, repeat headers across pages, number figures in reading order, remove genuinely blank pages, and verify working source links after export. Do not add a submission date or invented student details.

## Release gate

### Remaining collection order

1. Reflection adoption is complete as of 4 October; retain the student's confirmed text and AI-assistance disclosure in the rendered document.
2. Reuse existing automated evidence where it proves the requested behavior. Collect missing loading/failure/submitting and populated-role states with recorded provenance; do not duplicate the new empty/validation images.
3. Verify successful workflow/history and remaining safeguards only in the approved isolated Ticket fixture, recording any persisted changes. Do not change unrelated Tickets or user accounts for evidence.
4. Complete main output collection is finished. Include those full logs and complete the scoped manual checklist honestly, retaining observed limitations.
5. Assemble and visually verify the PDF; only after all required work is complete move Issue #60 to Done and obtain the final board evidence.

The 5 October review copy at `output/pdf/TokTickIT_Lab4_Review_Draft.pdf` contains 70 sequential figures, full rendered copies of all six engineering documents, attributed main output, the separately passing supplemental history result and full proportional screenshot pages. The export is checked for blank pages, nine ordered Parts, links, tables and image layout; current page counts are generated by `scripts/check_lab4_review_pdf.py`. It is not a final submission. Remaining gates: peer-reviewed publication, final main/source-link verification and the all-Done Project board. Remote main was read-verified as `55f8200` on 5 October; it does not yet contain this local increment. Issue #60 remains open.
