# Post-merge responsive screenshot evidence

## Partial manual keyboard evidence — 4 October 2026

The local IT Staff Dashboard and Queue were traversed with Tab/Shift+Tab and activated using Enter; the Sort select was operated using ArrowDown. Keyboard search found TT-2026-000021 and keyboard Clear filters restored all 19 local Tickets. Native labels and computed focus-visible outlines were inspected. The [manual keyboard verification record](../../manual-accessibility-verification.md) contains the exact observations and remaining gaps; it is not a full accessibility sign-off.

- [Dashboard card focus, full page](staff-dashboard-keyboard-card-focus-live.jpg).
- [Queue search focus and matching Ticket, full page](staff-queue-keyboard-search-focus-live.jpg).

Both images were visually inspected and preserve the full rendered page without cropping or stretching, at a 614 × 507 viewport. No Ticket, Action, password or session state was changed; only list navigation/filter state was exercised. All-role form/error checks remain outstanding.

A subsequent fixture-only keyboard inspection added unsaved [Description](action-keyboard-description-validation-live.jpg), [Follow-up note](action-keyboard-follow-up-validation-live.jpg) and [Result](action-keyboard-result-validation-live.jpg) validation images. Each field referenced its alert text through `aria-describedby` and exposed `aria-invalid=true`. All drafts were cancelled; the final UI retained Ticket OPEN and the same three Action states. The complete [manual verification record](../../manual-accessibility-verification.md) records focus-management limitations and the partially typed unsaved draft rather than claiming an uninterrupted or complete accessibility pass. These full-page images were visually inspected without cropping or stretching; their tall page heights require a readable final-document layout.

## Supplementary live card drill-down evidence — 4 October 2026

Local server/client development processes were started by the developer from this checkout. Collection used `feature/lab4-submission-completion`, based on main documentation merge `55f8200`; the application code is the released `7329652` source. These captures use the existing local development database, not the isolated E2E fixtures. No Ticket or Action was created, edited or deleted during this read-only collection.

Signed in as Kamon IT Support, the Staff Dashboard displayed Unassigned 17, Owned by me 2, Urgent 8 and Waiting for Requester 0. The original-recorder Action preview showed three Actions on TT-2026-000021 in OPEN, CANCELLED and COMPLETED states.

| Observation | Full image |
|---|---|
| Dashboard card counts and current-account Action preview | [Dashboard](staff-dashboard-card-counts-live.jpg) |
| Waiting for Requester zero-count card opens a filtered Queue with the no-matching-Tickets message and clear-filter controls | [Zero-count drill-down](staff-waiting-zero-drilldown-live.jpg) |
| Owned by me two-count card opens TT-2026-000021 and TT-2026-000001, with the pager reporting 1–2 of 2 | [Two matching Tickets](staff-owned-two-drilldown-live.jpg) |

The browser viewport was 614 × 507; the images preserve the complete page at its rendered height, without cropping or stretching. This is supplementary interaction evidence, not a named desktop/tablet/mobile breakpoint run. The zero-count drill-down image was visually inspected for complete text and controls. The browser reported a document width of 599px at a 614px viewport on the owned list, with no page-level horizontal overflow in that observed state.

These observations prove UI card/list correspondence for the two selected cards, not an independently executed database aggregate comparison. The zero-count destination is a filtered Queue empty state, not a completely empty Dashboard. Loading was observed in the accessibility snapshot but not captured as a screenshot; API failure, forbidden, submitting and full keyboard-audit claims remain uncompleted. Previous dated records below retain their historical provenance.

### Subsequent independent database read

The assistant then ran `node server/scripts/verify-lab4-live-dashboard.mjs` from the repository root. The helper permits local database hosts only, selects the unique active Kamon IT Support account, prints no credentials, and uses a Repeatable Read transaction containing SELECT/count queries only. The initial sandbox attempt could not initialize Prisma; after network access was granted, the command completed with exit code 0. This subsequent successful read supersedes the database-comparison limitation in the preceding paragraph, but not the remaining visual-state limitations.

| Item | Live UI | Independent database read |
|---|---|---|
| Unassigned operational Tickets | 17 | 17 |
| Operational Tickets owned by Kamon | 2 | 2 |
| HIGH/URGENT operational Tickets | 8 | 8 |
| Waiting for Requester Tickets | 0 | 0 |
| Original-recorder Actions | 3 | 3 |
| Owned Ticket list | TT-2026-000021 OPEN; TT-2026-000001 NEW | Same two Ticket numbers and statuses |
| Latest Action order/status | 3 OPEN; 2 CANCELLED; 1 COMPLETED | Same three IDs/statuses; all on TT-2026-000021 |

This is assistant-executed live database read evidence, not a screenshot of terminal output, a complete regression run, or evidence about production data. The account resolved to local user ID 32. The helper compares the observed identity rather than reading browser authentication tokens; no session token or password was extracted.

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

## Requester live evidence — 4 October 2026

The developer signed into Aree Chaiyasit's existing Requester account. The assistant did not enter credentials, reset a password or create a Ticket. The local app/source provenance is unchanged from the 4 October Staff checks: released runtime `7329652`, documentation baseline `55f8200`, viewport 614 × 507. These are genuine local development states, not intercepted responses or a new automated test run.

| Observed state | Full original image |
|---|---|
| Dashboard: all four cards show zero and Recent Tickets says `You have no Tickets yet.` | [Genuine empty Dashboard](requester-dashboard-genuine-empty-live.jpg) |
| Enter on Waiting for You opens My Tickets with a Dashboard filter banner and `No Tickets match your search or filters.` | [Zero-result drill-down](requester-waiting-zero-drilldown-live.jpg) |
| Clearing the Dashboard filter restores `No Tickets have been created for this Requester yet.` | [Unfiltered empty My Tickets](requester-my-tickets-genuine-empty-live.jpg) |
| Create Ticket displays the session-selected read-only Requester and loaded reference options | [Initial Create Ticket](requester-create-ticket-initial-regression-live.jpg) |
| Enter on Submit Ticket with required fields empty displays all five validation messages; no Ticket created | [Keyboard validation](requester-create-ticket-keyboard-validation-live.jpg) |

All five full-page images were opened for visual inspection and retained uncropped and unstretched. The Dashboard's page-level horizontal overflow check was false at the stated viewport. This is not a complete responsive or long-content audit. The all-zero metrics are observed UI values, not an independent Requester database aggregate check. Loading appeared in the navigation snapshot, but no loading screenshot is claimed. The browser was returned to Requester Dashboard after verification.

## Administrator live evidence — 4 October 2026

GitHub engineering chronology images are separately documented in [git-workflow-verification.md](../../git-workflow-verification.md#genuine-github-screenshots-collected-on-4-october): original contract and first Actions Taken foundation commit overviews. They use GitHub's actual UI and the temporary tab's default 1280 × 720 viewport, not the 614 × 507 local application viewport below.

The developer signed into System Administrator's existing account. The same released runtime and local development environment described above were used, at 614 × 507. No credentials were entered by the assistant, no user was created or changed, and no password-reset control was activated. These screenshots supplement earlier-lab regression evidence; they do not establish new Lab 4 automated results.

| Observed state | Full original image |
|---|---|
| Selecting Administrator and activating Search displays the active System Administrator row | [Role filter](admin-users-role-filter-live.jpg) |
| Enter on Edit opens the self-edit form; Active account is disabled with `You cannot deactivate your own account.` | [Self-deactivation protection](admin-self-deactivation-disabled-live.jpg) |
| Enter on Create User opens an unsaved form with default Requester role | [Initial form](admin-create-user-initial-live.jpg) |
| Enter on Create user with blank fields shows name, email and initial-password validation | [Empty-field validation](admin-create-user-empty-validation-live.jpg) |
| Search `lab4-no-such-user-evidence` with Administrator filter shows `No matching users` | [No-results search](admin-users-search-no-results-live.jpg) |

All five originals were opened for visual inspection and retained full, uncropped and unstretched. In the validation state, the name/email/password controls exposed `aria-invalid=true` and references to their respective error IDs. Focus remained on the submit button, and no `role=alert` region was observed; screen-reader announcement is not claimed. Page-level horizontal overflow was false in that state at the recorded viewport. Both forms were cancelled, filters cleared, and the unfiltered Users list restored. Successful account creation/edit/reset, duplicate-email rejection, last-Administrator concurrency and all keyboard paths are not newly verified by this read-only/invalid-input collection.
