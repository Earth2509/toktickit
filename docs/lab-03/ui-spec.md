# Lab 3 Zen Green UI Specification

Status: Proposed for peer review. Extend existing [Lab 2 UI contract](../lab-02/ui-spec.md); English interface copy.

## Shared shell and components

Reuse primary #006B3C, secondary #0B7A46, pale #EAF6EF, background #F5F7F6, white surfaces, existing spacing and readable dark text. Keep icon/text alignment, labelled form controls, green primary buttons, secondary cancel actions and clear read-only styling. Share Shell, FormField, Alert, StatusBadge, PriorityBadge, Pagination, ConfirmationDialog and async-state presentation across screens rather than duplicate styles.

Header shows authenticated display name and role, permitted navigation, Change Password and Logout. Requester landing is My Tickets; Staff landing is Ticket Queue; Admin landing is Users with Ticket Queue available under the explicit authorization matrix. Remove selector, Change Requester and associated storage. Before /auth/me completes show a neutral loading state without old private content. On logout/revocation clear user data, pending responses and cache; prevent browser Back from revealing stale private views. Public login shows no private navigation.

## Screens, modes and feedback

| Screen | Main layout/actions | Required feedback |
|---|---|---|
| Login | Centered email/password form, labelled password visibility control, Sign in | Inline required/format errors; Signing in... disabled; generic invalid-credentials failure; distinct inactive feedback only after correct password; retry after rate limit; network failure |
| Mandatory Change Password | Current/new/confirm password, visible policy, Save Password, Logout | Gate other navigation; mismatch/policy/current-password errors; Saving...; safe failure; success navigates by role |
| My Tickets/Create/Requester Detail | Preserve Lab 2 layout and functions; authenticated Requester read-only; add public discussion and Problem Appears Resolved | Original loading/validation/file states, own-only data, resolution indicator with time, no formal staff controls |
| Staff Queue | Search and collapsible filters; table/cards; pagination; ticket detail link | Loading, no tickets, no results with Clear filters, failure with Retry, forbidden, assigned/unassigned labels |
| Staff Detail | Read-only ticket identity/classification/description; editable owner, IT priority, permitted status; requester resolution indication with author/time; public comments/internal notes/attachments panels | Saving, success, invalid fields, 409 reload prompt, forbidden/not found, unavailable API, per-status restrictions |
| User Management | Name/email search and optional Role select; Name,Email,Role,Status,Edit list; Create User; create/edit panel | Loading, empty/no results, invalid/duplicate email, success, busy, forbidden, safe failure, Admin safety message |

Invalid login copy: "Unable to sign in. Check your credentials or contact your administrator." Only ACCOUNT_INACTIVE after correct password displays "This account is deactivated. Contact your administrator." Capture invalid and inactive scenarios separately. Normal Change Password follows the same form; mandatory mode allows only Logout until complete. Wrong current password shows its 422 field error without logging out; 429 shows the retry delay and retains the mandatory gate. Never retain passwords after success or navigation.

## Queue details

Desktop columns: Ticket Number, Summary, Category, Requested Priority, IT Priority, Status, Owner, Updated. Creation date and Related System remain in detail; avoid an unreadable grid. Search finds Ticket Number/Summary. Filters follow api-spec.md; text labels distinguish requested vs IT priority. Sort control has all contracted fields and direction. Search/filter/sort changes reset page to 1. Ignore stale responses from older queries; preserve query on detail/back navigation. Show result count and current page; Previous/Next correctly disabled. Mobile cards retain both priorities, owner/status and open action. Table headers have accessible sort state when interactive.

## Detail interactions

Apply the specification status policy table to every control. Claim is visible on unassigned nonterminal tickets for permitted roles. Owner selector lists active Staff/Admin; Unassigned is selectable only in NEW/REOPENED. Active-work tickets left unassigned by account changes display a warning and allow Claim/reassignment. Explain "Assign an active owner before opening this ticket" for NEW -> OPEN. Priority/owner controls are read-only in RESOLVED/CLOSED/CANCELLED; RESOLVED still permits discussion and owner-Requester attachment mutations. Save owner and Save priority show independent busy feedback. Status dropdown contains only allowed next states; Resolve requires summary, Cancel/Reopen require reason; consequential transitions display confirmation. A 409 retains intended input and offers Reload, with no automatic resubmission.

Requester resolution indication requires confirmation. Staff Detail displays a persistent callout, "Requester reports the problem appears resolved", with requesterResolvedBy.displayName and requesterResolvedAt, while preserving the formal status badge. Staff Queue rows/cards show a text marker when requesterResolvedAt is non-null. Staff can review the signal and explicitly resolve using normal workflow rules; the marker does not resolve automatically. Reopening clears the current marker. Capture the Requester action followed by Staff Detail author/time and queue marker as Part 7 evidence.

Public Comments and Internal Notes use clearly distinct labels and panels, with "Internal - visible only to IT Staff and Administrators" next to the internal composer. Switching panels preserves separate drafts without moving content between them. Require explicit Post Public Comment or Add Internal Note actions. Escape content as text. Display author/role/time newest first with pagination; after successful posting reload page 1 so the new entry is visible. No editing/deletion controls. Requester DOM/network responses contain no internal-note data. Attachments retain existing upload/removal ownership and read/download restrictions.

## User management details

List controls: name/email search and Role select (All roles, Requester, IT Staff, Administrator). All roles omits the query parameter; combine selected role with search, Clear filters resets both, and distinguish no users from no matches. Create: display name, email, one role, active checkbox, initial password. Edit: basic fields plus a separate Set new initial password action. No reset email checkbox, delete, bulk or import/export controls. Never prefill/display stored passwords. Saving a reset explains mandatory change at next login. Disable self-deactivation with an explanation, and handle backend rejection for all safety cases including last Admin. Display validation beside fields; do not close form on failure. Account changes can revoke the current session; navigate to login if that occurs.

## Responsive and accessibility

Breakpoints remain desktop >=992px, tablet 768-991px, mobile <768px. Required captures: 1440x900, 820x1180, 390x844. Capture all major screens: Login, mandatory Change Password, My Tickets, Create, Requester Detail, Staff Queue, Staff Detail, Users list/create/edit. Use separate viewport crops for long screens so report images stay readable.

Forms stack on mobile; touch controls aim for 44px; dialogs fit viewport and scroll internally. Keyboard order follows reading order, focus is visible, dialogs trap/restore focus and Escape cancels when safe. Associate labels/errors with inputs; status messages use role=status, failures role=alert, busy forms aria-busy. Badges include text. Long emails, filenames and comments wrap. No page-level horizontal overflow, clipped required actions, overlap, or color-only meaning. Check text contrast and keyboard navigation during implementation.

## Visual/evidence checklist (not yet executed)

- [ ] All listed screens at three viewports; consistent tokens, shell and badges.
- [ ] Focus, keyboard, dialog restore, label/error associations and busy announcements.
- [ ] Loading, submitting, validation, failure, forbidden and conflict states captured while real requests are pending/failed.
- [ ] Empty and successful search/no-results evidence captured separately.
- [ ] Requester has no internal-note controls/content; Staff has no Users navigation.
- [ ] Editable/read-only distinctions and account safety feedback visible.
- [ ] No clipping/overlap/overflow with long data.
- [ ] Playwright evidence under `artifacts/lab-03/test-results/<test-name>/lab-03/<viewport>/<screen>.png`; HTML report under `artifacts/lab-03/playwright-report/`. Record the viewport and tested commit in the versioned E2E execution evidence.
