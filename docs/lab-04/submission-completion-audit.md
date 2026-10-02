# Lab 4 submission completion audit

Checked: 2 October 2026 against `SE+Lab+4.pdf`, especially the Part 1-9 submission table on pages 10-11. Status: not yet ready for an unconditional complete/Done claim.

## Work completed

- Release source merged to main (`ffe6e0e`); server 130 passing / 8 default opt-in skips, client 39 passing, E2E 19 passing, and all eight opt-in server cases passing separately. Both builds passed. See [verification provenance](final-main-verification.md).
- Twelve full-page post-merge responsive images preserved without cropping or distortion.
- Live Staff Dashboard and owned-card drill-down; actual Action API failure and successful recovery after the developer applied the missing local migration.
- Genuine Action empty state, create form, required description/follow-up/result validation, persisted create/edit/complete/cancel, and real two-tab stale-version rejection with draft preservation and no overwrite.
- Resolution rejected for missing summary and an OPEN Action; the demonstration Ticket remains OPEN.
- All live evidence changes confined to the approved local fixture TT-2026-000021, except read-only views and rejected validation attempts on TT-2026-000001. The fixture contains three Actions. No old Ticket was updated or deleted.

## Product gap requiring an implementation decision

Update: the developer authorized the correction. `feature/lab4-staff-actions-dashboard` now implements the performed-by-session-user preview/count, typed API response, links, empty state and added tests. Both assistant-side TypeScript checks passed; the local UI and three responsive screenshots were inspected and the displayed three Actions matched a read-only database query. Developer-supplied automated results passed: server 134 (8 intentional skips), client 41, focused Dashboard browser 3, full browser 19, performance 2, and both builds. Peer review, merge and refreshed main verification remain pending. This feature-branch correction must not be presented as already merged main behavior.

Part 5 explicitly requires `current-user Actions Taken` on the Staff Dashboard. The previous merged main version renders four Ticket-count cards and recent operational Tickets, but no current-user Action list/count. `Owned by me` counts owned Tickets and is not equivalent to Actions performed by or assigned to the current user. The correction uses session-derived performer identity; its reviewed merge and fresh main evidence are still required.

## Authorship/input gap

`ai-use.md` now records eight actual selected requests as standardized English paraphrases, not verbatim quotations. The handout requires six to ten selected prompts and a brief personal reflection. The student's reflection remains Pending; a suggested draft is explicitly awaiting student confirmation and must not be presented as an adopted personal reflection without their approval. The recorded model name/reasoning metadata should also be verified rather than guessed.

## Evidence gaps before final PDF

- Dashboard loading, completely empty, forbidden and safe-failure screenshots; independent selected metric/database-query correspondence.
- Action submitting, inactive-assignee rejection, assignee-versus-performer restrictions and remaining role visibility evidence.
- Successful Ticket transitions and stable/append-only history ordering; remaining resolution guards, including post-reopen eligibility and required follow-up evidence.
- Representative earlier-lab regression UI evidence and completed manual keyboard/accessibility checklist.
- Git history/spec-before-code proof, final Project board state, and full main test output screenshots. Supplied terminal excerpts are retained as excerpts, not fabricated terminal screenshots or complete logs.

The existing E2E and API runs provide automated coverage, but that does not automatically supply every requested visual proof. Do not mark unobserved states inspected. Do not close Issue #60 or move it to Done until the unresolved requirements and final report are actually completed.

## Final document requirements

Use Answer Part 1 through Answer Part 9 in the exact handout order. Include full rendered copies of the required engineering documents, working source links, readable full screenshots, and an explicit mapping for combined test files/legacy artifact paths. Preserve aspect ratio and do not crop mobile images. Tall full-page screenshots need suitable page sizes or supplementary readable full-page presentation, not stretched standard-page thumbnails.

This audit is not the final submission PDF and does not claim a grade or complete compliance.
