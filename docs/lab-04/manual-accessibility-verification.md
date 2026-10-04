# Lab 4 manual keyboard verification

Checked: 4 October 2026. Status: partial; Staff Dashboard/Queue navigation and selected Ticket Detail/Action validation checks verified. This is not a complete accessibility audit or a WCAG conformance claim.

## Environment and scope

- Source: `feature/lab4-submission-completion`, based on main documentation merge `55f8200`. Application source is the released `7329652` code; uncommitted changes at collection time concern documentation and a read-only database evidence helper.
- Local frontend/backend: `localhost:5173` and `localhost:3000`, started by the developer.
- Signed-in account: Kamon IT Support / IT Staff. Existing local development data, not disposable E2E data.
- Browser viewport: 614 × 507. No temporary viewport override was applied.
- Keyboard actions were sent through the browser's supported input API. Read-only DOM observations checked the active element, associated labels and computed focus outline; no JavaScript focus mutation or synthetic click dispatch was used.
- No Ticket/Action write, password change or logout was performed. Filter/sort/search changes affect only the displayed list.

## Observed checks

| Check | Observation | Result within this scope |
|---|---|---|
| Dashboard navigation | Enter on Dashboard opened the Dashboard; loading text was exposed in a status region before the populated state. | Passed; no loading screenshot claimed |
| Dashboard forward focus order | Starting from Dashboard, Tab reached Ticket Queue, Change Password, Logout, Unassigned, Owned by me, Urgent and Waiting for Requester in that order. Sensitive account actions were not activated. | Passed |
| Dashboard backward traversal | Shift+Tab moved from Waiting for Requester back to Urgent. | Passed |
| Metric accessible names | The four buttons exposed `View 17 unassigned Tickets`, `View 2 owned by me Tickets`, `View 8 urgent Tickets` and `View 0 waiting for requester Tickets`. | Passed |
| Keyboard drill-down | Enter on Urgent opened the Dashboard-filtered Queue and, after loading, the pager showed 1–8 of 8 Tickets. | Passed |
| Computed focus state | Traversed Dashboard controls matched `:focus-visible`. Metric cards had a solid 2.4px outline and 2.4px offset; shell controls also had a computed solid outline. | Observed; not a contrast certification |
| Queue Tab order | From Ticket Queue navigation, Tab reached Change Password, Logout, Clear Dashboard filter, Search tickets, Category, Related System, Requested Priority, Status and Sort in order. | Passed |
| Queue field association | Search and all five selects had native associated labels matching their accessible names. | Passed |
| Native select keyboard operation | ArrowDown on Sort changed Recently updated to Least recently updated (`updatedAt:asc`). | Passed |
| Keyboard filter reset | Tab reached Clear filters; Enter cleared the Dashboard filter and restored Recently updated and the unfiltered Queue. | Passed |
| Typed search | Keyboard typing of `TT-2026-000021` into Search tickets produced one matching fixture Ticket; the pager showed 1–1 of 1 after debounce. | Passed |
| Search reset | Six Tab steps from Search reached Category, Related System, Requested Priority, Status, Sort and Clear filters. Enter restored the 19-Ticket list (1–10 of 19). | Passed |
| Disabled-control traversal | With filters cleared, Shift+Tab from Refresh reached Sort and Tab returned to Refresh, skipping disabled Clear filters. | Passed |
| Visual focus | The captured Waiting for Requester card and Search tickets field show an outline. Both complete images were opened for visual inspection; focus and surrounding content were not cropped. | Passed for these two captures |
| Non-colour status content | Dashboard Action states OPEN, CANCELLED and COMPLETED, and Queue priority/status values, were exposed as text as well as styled badges. | Observed for these populated Staff states only |

## Full-page evidence

- [Dashboard keyboard focus](evidence/main/staff-dashboard-keyboard-card-focus-live.jpg).
- [Queue keyboard search focus and one matching Ticket](evidence/main/staff-queue-keyboard-search-focus-live.jpg).

The original full images are retained at their rendered page heights. These images supplement keyboard observations; they do not prove every key action by themselves. Rendered outline presence does not establish contrast ratios, screen-reader speech, or all disability access requirements.

## Still unverified

- Keyboard traversal and activation of every Action preview/detail control and all pagination paths.
- All remaining Ticket Detail/Action edit and workflow error paths, submitting/conflict feedback and preserved drafts with keyboard-only interaction. The three selected Action validation paths and their observed focus behavior are recorded below.
- Requester and Administrator navigation/forms in the running local environment.
- Screen-reader announcements, focus restoration after all route changes/dialogs, measured focus contrast and complete 1440/820/390 viewport keyboard checks.
- Full manual long-content, error, empty, forbidden and failure-state inspection.

The combined keyboard/labels/errors/badges/drill-down checklist remains incomplete. No existing automatic test total is increased by these manual observations; Issue #60 remains open.

## Follow-up: Ticket Detail and Action validation

The next read-only/unsaved-form inspection used the previously authorized local fixture TT-2026-000021. Enter on its Queue Open button loaded Detail. From Back to Ticket Queue, Tab traversed Assign owner, Save owner, IT Priority, Save IT Priority, Next status, Update status and Add action; no owner/priority/status mutation button was activated. Enter on Add action opened an unsaved form.

Native labels were associated with Action date/time, Assignee, Description, Follow-up required, Attachment notes, Public comment and Internal note. Starting at Assignee, Tab reached Description, Follow-up required, Attachment notes, Save action and Cancel. Each observed element matched `:focus-visible` with a computed solid 2.4px outline.

| Keyboard validation | Observed feedback | Field-to-error relationship |
|---|---|---|
| Enter on Save action with Description empty | `Enter an Action description.` | Description had `aria-invalid=true` and `aria-describedby=action-form-error`; the existing element contained that exact error and had `role=alert`. |
| Type an unsaved Description, Tab to Follow-up required, Space to check it, then Tab through Note/Attachment notes to Save and press Enter with Note empty | `Enter a follow-up note when follow-up is required.` | Follow-up note had `aria-invalid=true` and referenced the current `action-form-error` text. |
| Enter on the existing OPEN Action's Complete action to open the transition form; Tab from empty Result to its Complete action submit button and press Enter | `Enter a result before completing this Action.` | Result had `aria-invalid=true` and referenced the current `action-form-error` text. The creator-edit fields were disabled in this transition form. |

The Description typing call timed out after inserting a partial draft (`Unsaved keyboard validation draft; no Action should b`). The actual field was inspected before proceeding; the draft remained unsaved and no successful-create claim is made. Cancel was activated with the keyboard after each validation sequence. The final Detail still showed exactly three Actions (3 OPEN, 2 CANCELLED, 1 COMPLETED) and Ticket status OPEN. This post-check observation is UI evidence; no database write was requested and no independent before/after database snapshot was taken in this session.

### Focus-management observations — not a complete pass

Opening Add action unmounted its trigger and left `document.activeElement` as BODY rather than moving focus to the first form field. The subsequent traversal established focus at Assignee with a locator-based keyboard action, so it must not be described as uninterrupted keyboard traversal from the disappearing Add action trigger. After the empty-Description error, focus remained on Save action instead of moving to the invalid field. The error relationship and alert semantics were correct, but actual screen-reader speech was not tested. These observations are retained for follow-up and are not proof of complete focus restoration or accessibility conformance.

### Full-page supplementary images

- [Description validation](evidence/main/action-keyboard-description-validation-live.jpg).
- [Follow-up note validation](evidence/main/action-keyboard-follow-up-validation-live.jpg).
- [Completion Result validation](evidence/main/action-keyboard-result-validation-live.jpg).

All three complete images were opened for visual inspection. They are 599px wide with rendered heights of 4935/5130/5130px, captured at the unchanged 614 × 507 viewport. Originals were not cropped or stretched. A standard-page thumbnail would make them unreadable; final export must retain accessible full originals and a suitably sized full-image presentation. No new persisted Action, Action completion, Ticket transition or comment/note was produced. Public/internal discussion labels were inspected, but their submission was not tested.

## Requester follow-up — 4 October 2026

After the developer signed in as Aree Chaiyasit / Requester, Dashboard displayed four zero-valued cards and a genuinely empty Recent Tickets panel. A locator-based Tab from Total Open moved to Waiting for You; the active card matched `:focus-visible`. Enter opened My Tickets with the Dashboard-filter banner and a no-matches message. Enter on Clear Dashboard filter restored the unfiltered genuine-empty message. This verifies the selected drill-down/reset path, not all populated-card destinations or continuous keyboard traversal from login.

Create Ticket showed the signed-in Requester in a read-only input. Enter on Submit Ticket with all required fields empty produced errors for Requested Priority, Category, Related System, Summary and Description. All five controls had `aria-invalid=true` and `aria-describedby` references to the corresponding error IDs. Summary/Description also retained hint and count references. Focus remained on Submit Ticket; no automatic move to the first invalid field or screen-reader speech is claimed. No valid submit, upload, Ticket write or account change occurred. The browser was returned to Dashboard.

Five full originals are listed in [evidence provenance](evidence/main/README.md#requester-live-evidence--4-october-2026). Each was opened for visual inspection. Requester populated Detail/Action visibility, submitting/failure states, remaining keyboard paths and Administrator checks remain unverified in this live session. The overall manual checklist remains partial.

## Administrator follow-up — 4 October 2026

The developer subsequently signed into System Administrator. The role filter was selected through the native select; Enter on Search showed the single Administrator row. Enter on its Edit button opened self-edit. The Active account checkbox was disabled and its explanation visible. No edit, password field or reset submission was made; Enter on Cancel dismissed the form.

Enter on Create User opened a blank form. Enter on its exact-case Create user submit button with empty fields displayed `Enter a name from 1 to 100 characters.`, `Enter a valid email address.` and `Use 12 to 128 characters and not only whitespace.` The three input labels were natively associated, `aria-invalid=true` was present, and each input referenced its corresponding error ID. Focus remained on the submit button. No `role=alert` region was observed, so alert announcement or automatic focus to the first invalid field is not claimed. No credential was entered and no account was created.

After cancelling, the deliberately unmatched search plus Administrator role filter showed No matching users. Enter on Clear filters restored the unfiltered list. Five full screenshots were visually inspected, with provenance in the evidence README. This establishes selected keyboard activation and field/error semantics, not uninterrupted full-form traversal or a complete accessibility pass. Other account mutation, role denial and failure paths remain outside this session's checks.
