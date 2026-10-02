# Post-merge responsive screenshot evidence

Status: Twelve populated-state images preserved and visually inspected. Additional interaction/state evidence is still pending; this is not a completed submission checklist.

## Source and provenance

- Tested source: merged main commit `ffe6e0ee858d712eb9c36a25c4866ba3cf3ec72f`.
- Source run: developer-run unfiltered Playwright suite, 19 tests passed (3.6 minutes); see [verification record](../../final-main-verification.md).
- Original artifacts: `artifacts/lab-03/test-results/lab-04-responsive-*/lab-04/` in this checkout. The legacy lab-03 artifact directory name is retained by the runner; these are Lab 4 responsive cases.
- Source image timestamps: 1 October 2026, approximately 23:40–23:41, Asia/Bangkok. Local timestamps are supporting metadata, not an independently signed execution record.
- Images were copied without cropping, stretching, annotation or other pixel edits. Earlier feature-branch images remain separately available.
- Viewport sizes describe the browser viewport. Full-page PNG heights are longer than the viewport, particularly on mobile.

## Full-image index

| Viewport | Staff Dashboard | Staff Ticket / Actions | Requester Dashboard | Requester Ticket / Actions |
|---|---|---|---|---|
| Desktop: 1440 × 900 | [Full image](desktop/staff-dashboard.png) | [Full image](desktop/staff-ticket-actions.png) | [Full image](desktop/requester-dashboard.png) | [Full image](desktop/requester-ticket-actions.png) |
| Tablet: 820 × 1180 | [Full image](tablet/staff-dashboard.png) | [Full image](tablet/staff-ticket-actions.png) | [Full image](tablet/requester-dashboard.png) | [Full image](tablet/requester-ticket-actions.png) |
| Mobile: 390 × 844 | [Full image](mobile/staff-dashboard.png) | [Full image](mobile/staff-ticket-actions.png) | [Full image](mobile/requester-dashboard.png) | [Full image](mobile/requester-ticket-actions.png) |

## Observed coverage

All twelve images were opened for visual inspection. The populated layouts show four/two/one dashboard card columns and wrapped, stacked mobile Ticket and Action content. No obvious clipping or overlap was observed in these captured states. The Staff detail shows two distinct Actions on one Ticket, OPEN/COMPLETED badges, performer and assignee information, and Staff mutation controls. Requester detail shows the corresponding read-only Action records without Staff edit/complete/cancel controls or internal-note UI.

The Requester dashboard contains zero-count metric cards alongside a populated recent list. This is not proof of the completely empty dashboard state. These screenshots alone also do not prove keyboard navigation, a successful mutation, count-query equality, authorization enforcement, or conflict handling.

## Evidence still to collect

### Feature correction: current-user Staff Action preview

On `feature/lab4-staff-actions-dashboard`, the local signed-in Kamon account now displays `Actions Taken by me`, showing latest 3 of 3 with IDs 3/2/1 in OPEN/CANCELLED/COMPLETED states. A separate read-only Prisma query using the account's performer ID returned the same total and ordered IDs. The View Ticket button for Action 3 opened TT-2026-000021 successfully.

- [Desktop, 1440 x 900](staff-own-actions-desktop.jpg).
- [Tablet, 820 x 1180](staff-own-actions-tablet.jpg).
- [Mobile, 390 x 844](staff-own-actions-mobile.jpg).

All three full images were visually inspected. Read-only browser measurements found no positive page-level horizontal overflow and no visible button shorter than 44px at these widths. This is local feature-branch/manual evidence, not a new main test run or complete keyboard audit. Viewport overrides were reset afterward. Subsequent developer-supplied automated results passed: server 134, client 41, focused Dashboard browser 3, full browser 19, performance 2, and both builds. See [the latest correction verification](../../tests.md). Peer review and merge remain pending.

### Ticket resolution safeguard evidence

On TT-2026-000021, selecting RESOLVED and submitting without a summary displayed `Provide a resolution summary of 5 to 2000 characters.` After entering a valid-length demonstration summary, submitting displayed `Complete or cancel every open Action Taken before resolving this Ticket.` The Ticket remained OPEN, and the third Action remained OPEN. Reload cleared the rejected form input. No Ticket transition was committed.

- [Missing resolution summary](resolution-summary-validation-live.jpg).
- [Resolution blocked by OPEN Action](resolution-open-action-blocked-live.jpg).

This proves the missing-summary and open-Action safeguards only. It does not prove successful resolution, no-owner rejection, follow-up rejection, post-reopen evidence eligibility or transition-history ordering.

### Real two-tab optimistic-concurrency conflict

A third demonstration Action was created on TT-2026-000021. Two browser tabs opened the same OPEN Action version for editing. The first tab saved `Visual evidence: committed update from the first browser tab.` The second tab attempted to save a different draft using its stale version and received `This Action changed or is no longer editable. Reload the Ticket and try again.` Its unsaved draft remained visible in the form. No response mocking or database version manipulation was used.

- [First tab's saved update](action-conflict-first-save.jpg).
- [Second tab's conflict message and preserved draft](action-stale-version-conflict.jpg).
- [Fresh re-read after discarding the rejected draft](action-conflict-reloaded.jpg): the first tab's description remained persisted, demonstrating no stale overwrite.

The second tab was closed after verification. The third Action remains OPEN for later workflow-safeguard evidence; the sample Ticket now has three Actions (OPEN, CANCELLED and COMPLETED). The conflict UI instructs the user to reload the Ticket; these images do not claim a dedicated Reload button exists.

### Authorized isolated Action workflow fixture

The developer approved creation of a separate local demonstration Ticket. The guarded, repeat-safe `server/scripts/create-lab4-visual-fixture.mjs` created **TT-2026-000021** (database ID 21) in local `toktickit/public`, initially OPEN and owned by Kamon. This was direct fixture setup, not evidence of the Requester Create Ticket UI. Existing Tickets were not modified. The fixture remains in the database so the evidence can be reproduced; it was not deleted.

The assistant then used the signed-in Staff UI to create and edit one Action, verify required Result validation, complete that Action, create a second Action, and cancel the second Action. Only this fixture's Actions were changed. The Ticket remains OPEN; Action completion is not Ticket resolution.

| Evidence | Full image |
|---|---|
| First Action created, OPEN with session-derived performer | [Created](action-created-live.jpg) |
| Description edited and persisted | [Edited](action-edited-live.jpg) |
| Completion blocked without Result | [Result validation](action-result-validation-live.jpg) |
| First Action completed with Result and completion timestamp | [Completed](action-completed-live.jpg) |
| Second Action cancellation form | [Cancel form](action-cancel-form-live.jpg) |
| Two Actions on one Ticket, COMPLETED and CANCELLED | [Final statuses](actions-completed-cancelled-live.jpg) |

These real local UI images supplement the main E2E fixture screenshots. They do not cover submitting latency, concurrent conflict, inactive assignee rejection or distinct-performer authorization. Those evidence items remain outstanding.

### Live local capture: 2 October 2026

These supplementary images use the running local development database (`toktickit`, `public`), not the disposable E2E fixture. They must not be presented as identical data to the main responsive run above.

- [Staff Dashboard](staff-dashboard-live.jpg): signed in as Kamon IT Support; Owned by me = 1.
- [Owned-by-me drill-down](staff-owned-drilldown-live.jpg): one matching Ticket, TT-2026-000001, owned by Kamon. This demonstrates UI count/list correspondence for this card, not an independent database aggregate audit.
- [Actual Actions Taken safe failure](actions-safe-failure-live.jpg): load failed and Retry returned the same safe error. The accompanying no-Actions message is not valid evidence that the list is empty, because the query failed.

A read-only `prisma migrate status` check confirmed that the local `public` schema had not applied `20260925090000_lab4_actions_taken`. The developer subsequently supplied successful `prisma:deploy` output applying that migration. Retrying the Action query removed the error and returned an empty list, confirming recovery in the running UI. The developer applied the schema change; the assistant did not create Actions, update Tickets or change passwords during this capture.

### Successful retry and unsaved form validation

- [Genuine empty Action list after migration](actions-empty-after-migration.jpg): no request-error banner; no Actions recorded for TT-2026-000001.
- [Add Action form](action-create-form-live.jpg): required date/time, eligible assignee and description, with attachment-notes explanation and Save/Cancel controls.
- [Required description validation](action-description-validation-live.jpg): submitting the empty description displayed `Enter an Action description.` without creating an Action.
- [Required follow-up note validation](action-follow-up-validation-live.jpg): an unsaved description was entered and Follow-up required checked; submitting without a note displayed `Enter a follow-up note when follow-up is required.` The draft was then cancelled and the empty list remained.

These are full-page screenshots of real local UI states, not mocked responses. They cover create-form validation only, not persisted creation, edit, completion-result validation, submitting latency or version-conflict handling. The full combined checklist therefore remains incomplete.

- Dashboard loading, fully empty, forbidden and safe API failure/Retry states; drill-down destinations and count/query correspondence.
- Action submitting latency, inactive-assignee rejection, distinct-performer/assignee authorization and further recoverable failure states. Create/edit, required-description/result/follow-up validation, completion/cancellation, and real stale-version conflict are covered in the live sections above.
- Remaining Ticket resolution safeguards, successful transitions and transition-history ordering/visibility evidence. Missing-summary and open-Action rejection are covered above.
- Keyboard focus and interaction checks; deliberately long Action/notes content.

At collection time, `localhost:5173` was unavailable. Assistant-side dev-server startup was blocked by sandbox runtime/configuration access errors. No replacement UI states were fabricated and no checklist item was marked complete on that basis.

For the final PDF, preserve each full image's aspect ratio. Tall mobile images need an appropriately sized full-image page or accessible original-image link; do not stretch or crop them to fit a standard page.
