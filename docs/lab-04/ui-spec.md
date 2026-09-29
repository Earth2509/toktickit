# Lab 4 Zen Green UI Specification

Status: Reviewed Lab 4 contract; feature-branch responsive evidence is merged into `lab4-staging`. Final visual checklist and `main` verification remain pending.

## Application shell and navigation

Add a visible Dashboard item for all completed authenticated sessions. Requesters see Dashboard, My Tickets and Create Ticket. IT Staff see Dashboard and Ticket Queue. Administrators see Dashboard, Ticket Queue and Users. The active destination is visibly indicated; role-denied routes show safe feedback and do not render protected data.

## IT Staff Dashboard

Use a responsive card grid for Unassigned, Owned by me, Urgent, and Waiting for Requester counts. Cards are buttons/links with accessible labels such as `View 3 unassigned Tickets` and navigate to the exact documented Staff Queue drill-down. Unassigned includes every nonterminal ownerless Ticket, including a Ticket orphaned by staff deactivation. Below the cards, show recent nonterminal Tickets with Ticket number, summary, status, IT priority, owner and open-detail action. Show labelled loading skeletons, a no-operational-work empty state, forbidden feedback and Retry for safe API failure.

## Requester Dashboard

Show Total Open, Waiting for You, Recently Updated and Recently Resolved cards for the signed-in Requester only. Recent Ticket rows link to requester Ticket Detail; metric cards link to My Tickets filters. The zero state states that no matching Tickets exist and includes Create Ticket where appropriate. Never show a Staff Queue query or another Requester's metrics.

## Actions Taken on Ticket Detail

Add a labelled Actions Taken section after the Ticket summary and before discussions. Rows show action date/time, completion time, description, result, performer, active assignee, action status, follow-up state/note and attachment notes. Requesters receive read-only rows. Staff/Admin see `Add action`; the original performer/Admin sees `Edit action`, while an active assignee can complete or cancel their assigned OPEN Action. The form has labelled assignment and status controls, rejects inactive assignees, supports completion/cancellation, and has inline errors, Save/Cancel, busy state and preserved draft on recoverable failures. Result becomes required on completion, and Follow-up Note becomes required when Follow-up Required is checked. Distinguish attachment notes from uploaded files.

## Workflow feedback

Status controls show only valid next states. Resolve explains and validates the required owner, no open Action, an eligible latest completed Action with no follow-up, and resolution summary. After a reopen, the completed Action must have been completed after the latest reopen; a new later completion without follow-up visibly satisfies an earlier follow-up. Cancel/Reopen request a reason and confirmation. A conflict retains current form input and provides Reload instead of retrying automatically. Success refreshes Ticket summary, Action Taken rows and dashboard-compatible state.

## Responsive and accessibility rules

Desktop is >=992px, tablet 768-991px and mobile <768px. Metric cards flow 4/2/1 columns. Tables convert to labelled cards on mobile; long action content wraps. All touch targets are at least 44px, focus is visible, labels bind to fields, validation uses text plus `aria-describedby`, loading uses `aria-busy`, success uses `role=status`, and failures use `role=alert`. No major screen may clip, overlap or introduce page-level horizontal scrolling.

## Visual and accessibility checklist

- [x] Dashboard, Ticket Detail and Actions Taken inspected at desktop/tablet/mobile using the twelve refreshed full-page images below; the 2026-09-29 browser run asserted no page-level horizontal overflow.
- [x] Updated browser checks passed at all three viewports and measured rendered interactive targets at least 44px high (including the enclosing label for checkboxes) on Dashboard, Detail, Queue/My Tickets and Administrator Create User screens.
- [ ] Dashboard loading, empty, forbidden and safe-failure states inspected.
- [ ] Action create/edit submitting, validation, follow-up, conflict and read-only states inspected.
- [ ] Keyboard focus order, labels, errors, non-colour badges and drill-down actions checked.
- [ ] Long action text/notes and narrow screens have no clipping, overlap or horizontal overflow.

### Captured responsive evidence (2026-09-29)

The following images were copied from the 2026-09-29 passing post-correction Playwright run into this repository so a reviewer can inspect them without the local test artifacts. The screenshots show the populated dashboard and Ticket/Action detail states, including the corrected full-width discussion fields on mobile, not every loading, validation or conflict state in the unchecked checklist items above.

The responsive run uses the shared Lab 4 E2E seed. When the full suite runs in sequence, `actions-taken-flow.spec.ts` may add an OPEN Action to `TT-2026-000004` before the responsive screenshots are captured. An isolated responsive run starts from the seed and may omit that additional Action; both states remain valid, but screenshots from different runs should not be treated as identical fixtures.

| Viewport | IT Staff Dashboard | IT Staff Ticket / Actions | Requester Dashboard | Requester Ticket / Actions |
|---|---|---|---|---|
| Desktop, 1440 × 900 | [View image](evidence/desktop/staff-dashboard.png) | [View image](evidence/desktop/staff-ticket-actions.png) | [View image](evidence/desktop/requester-dashboard.png) | [View image](evidence/desktop/requester-ticket-actions.png) |
| Tablet, 820 × 1180 | [View image](evidence/tablet/staff-dashboard.png) | [View image](evidence/tablet/staff-ticket-actions.png) | [View image](evidence/tablet/requester-dashboard.png) | [View image](evidence/tablet/requester-ticket-actions.png) |
| Mobile, 390 × 844 | [View image](evidence/mobile/staff-dashboard.png) | [View image](evidence/mobile/staff-ticket-actions.png) | [View image](evidence/mobile/requester-dashboard.png) | [View image](evidence/mobile/requester-ticket-actions.png) |
