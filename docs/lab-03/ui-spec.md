# Lab 3 Zen Green UI Specification

Status: Proposed for peer review. Extend existing [Lab 2 UI contract](../lab-02/ui-spec.md); English interface copy.

## Shared shell and components

Reuse primary #006B3C, secondary #0B7A46, pale #EAF6EF, background #F5F7F6, white surfaces, existing spacing and readable dark text. Keep icon/text alignment, labelled form controls, green primary buttons, secondary cancel actions and clear read-only styling. Share Shell, FormField, Alert, StatusBadge, PriorityBadge, Pagination, ConfirmationDialog and async-state presentation across screens rather than duplicate styles.

Header shows authenticated display name and role, permitted navigation, Change Password and Logout. Requester landing is My Tickets; Staff landing is Ticket Queue; Admin landing is Users with Ticket Queue available under the explicit authorization matrix. Remove selector, Change Requester and associated storage. Before /auth/me completes show a neutral loading state without old private content. On logout/revocation clear user data, pending responses and cache; prevent browser Back from revealing stale private views. Public login shows no private navigation.

## Screens, modes and feedback

| Screen | Main layout/actions | Required feedback |
|---|---|---|
| Login | Centered email/password form, labelled password visibility control, Sign in | Inline required/format errors; Signing in... disabled; identical safe invalid/inactive failure; retry after rate limit; network failure |
| Mandatory Change Password | Current/new/confirm password, visible policy, Save Password, Logout | Gate other navigation; mismatch/policy/current-password errors; Saving...; safe failure; success navigates by role |
| My Tickets/Create/Requester Detail | Preserve Lab 2 layout and functions; authenticated Requester read-only; add public discussion and Problem Appears Resolved | Original loading/validation/file states, own-only data, resolution indicator with time, no formal staff controls |
| Staff Queue | Search and collapsible filters; table/cards; pagination; ticket detail link | Loading, no tickets, no results with Clear filters, failure with Retry, forbidden, assigned/unassigned labels |
| Staff Detail | Read-only ticket identity/classification/description; editable owner, IT priority, permitted status; public comments/internal notes/attachments panels | Saving, success, invalid fields, 409 reload prompt, forbidden/not found, unavailable API, terminal restrictions |
| User Management | Name/email search; Name,Email,Role,Status,Edit list; Create User; create/edit panel | Loading, empty/no results, invalid/duplicate email, success, busy, forbidden, safe failure, Admin safety message |

Login error copy: "Unable to sign in. Check your credentials or contact your administrator." No account-existence disclosure. Normal Change Password follows the same form; mandatory mode allows only Logout until complete. Never retain passwords after success or navigation.

## Queue details

Desktop columns: Ticket Number, Summary, Category, Requested Priority, IT Priority, Status, Owner, Updated. Creation date and Related System remain in detail; avoid an unreadable grid. Search finds Ticket Number/Summary. Filters follow api-spec.md; text labels distinguish requested vs IT priority. Sort control has all contracted fields and direction. Search/filter/sort changes reset page to 1. Ignore stale responses from older queries; preserve query on detail/back navigation. Show result count and current page; Previous/Next correctly disabled. Mobile cards retain both priorities, owner/status and open action. Table headers have accessible sort state when interactive.

## Detail interactions

Claim is visible on unassigned active tickets for permitted roles. Owner selector lists active Staff/Admin plus Unassigned. Save owner and Save priority show independent busy feedback. Status dropdown contains only allowed next states; Resolve requires summary, Cancel/Reopen require reason; consequential transitions display confirmation. A 409 retains intended input and offers Reload, with no automatic resubmission. Requester resolution indication has explicit confirmation and does not display a misleading Resolved status.

Public Comments and Internal Notes use clearly distinct labels and panels, with "Internal - visible only to IT Staff and Administrators" next to the internal composer. Switching panels preserves separate drafts without moving content between them. Require explicit Post Public Comment or Add Internal Note actions. Escape content as text. Display author/role/time and pagination; no editing/deletion controls. Requester DOM/network responses contain no internal-note data. Attachments retain existing upload/removal ownership and read/download restrictions.

## User management details

Create: display name, email, one role, active checkbox, initial password. Edit: basic fields plus a separate Set new initial password action. No reset email checkbox, delete, bulk or import/export controls. Never prefill/display stored passwords. Saving a reset explains mandatory change at next login. Disable self-deactivation with an explanation, and handle backend rejection for all safety cases including last Admin. Display validation beside fields; do not close form on failure. Account changes can revoke the current session; navigate to login if that occurs.

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
- [ ] Evidence under artifacts/lab-03/screenshots/{authentication,staff-queue,staff-ticket-detail,user-management,requester-regression}; record viewport and commit.
