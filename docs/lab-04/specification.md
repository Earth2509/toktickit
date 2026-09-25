# Lab 4 Engineering Contract

Status: Proposed for peer review. Implementation has not started.

## 1. Sprint Goal

Complete TokTickIT's operational service-desk workflow by recording the work performed on a Ticket, enforcing the final lifecycle rules, and presenting role-appropriate operational dashboards. The increment preserves every approved Lab 1-3 capability and the existing Zen Green application language.

## 2. Stakeholder Interpretation

The primary Ticket Owner remains accountable for coordinating the whole Ticket, but several IT Staff members may perform and record individual Actions Taken. Requesters can see approved work on their own Tickets and identify Tickets needing attention. Staff need a concise queue-oriented starting point without losing access to the detailed Ticket workflow.

## 3. Scope

Included: Action Taken records; final status transitions and resolution checks; Requester and IT Staff dashboards; migration/backfill and repeat-safe seed data; backend authorization and stale-write handling; regression, accessibility, responsive evidence, and release verification.

Excluded: SLA/escalation clocks, notification services, inventory/cost accounting, time-sheet billing, approval/signature workflows, advanced BI/reporting, tenants, cloud operations, and unapproved features.

## 4. Functional Requirements

| ID | Requirement |
|---|---|
| FR-01 | Staff and Administrators can list, create and update Actions Taken on Tickets they may access. |
| FR-02 | An Action Taken captures action date/time, description, result, authenticated performer, an active assignee, an explicit action status, follow-up requirement, follow-up note, and attachment notes. |
| FR-03 | Requesters can view Actions Taken only on their own Tickets and cannot create or modify them. |
| FR-04 | The Ticket Owner remains one coordinating owner; an Action Taken performer may be another active Staff or Administrator. |
| FR-05 | Staff/Admin workflow controls expose only permitted transitions and enforce resolution/closure rules at the API. |
| FR-06 | The Requester dashboard shows only the authenticated Requester's calculated metrics and drill-down links. |
| FR-07 | The Staff dashboard shows calculated operational counts, current-user work and recent/urgent Tickets with drill-down links. |
| FR-08 | Existing authentication, authorization, Tickets, attachments, comments, notes and Administrator user management continue to work. |
| FR-09 | All Lab 4 screens provide accessible loading, success, validation, empty, forbidden, conflict and safe-failure feedback. |

## 5. Business Rules

| ID | Rule |
|---|---|
| BR-01 | Each Action Taken belongs to exactly one Ticket; a Ticket may have zero or more actions. |
| BR-02 | `performedBy` is derived from the authenticated Staff/Admin session and cannot be supplied by a client. `assignedTo` is an explicit active IT Staff/Administrator assignment and is validated by the server. |
| BR-03 | Action date/time is a valid UTC ISO-8601 timestamp and cannot be in the future by more than five minutes. |
| BR-04 | Action description is trimmed plain text of 1-2000 characters. `result` is null while an Action is `OPEN` and is required as trimmed plain text of 1-2000 characters when it becomes `COMPLETED`; it is optional for `CANCELLED`. |
| BR-05 | Follow-up Required is boolean. When true, Follow-up Note is required and 1-1000 trimmed characters; when false, the stored note is null. |
| BR-06 | Attachment Notes are optional trimmed plain text up to 1000 characters; they describe files to look for and do not create an Attachment. |
| BR-07 | Only active IT Staff or Administrators may create/update Actions Taken. Requesters receive 403 before any protected action lookup. An inactive or forged Action Taken assignee is rejected with 422 before a write. |
| BR-08 | The ticket owner coordinates the Ticket, but does not restrict an eligible Staff/Admin from recording an Action Taken. |
| BR-09 | Actions Taken are append-only: no Action is deleted and its Ticket, original performer, `actionAt`, creation audit fields and terminal values never change. While `OPEN`, the original performer or an Administrator may edit description, attachment notes, assignment and follow-up fields using the record version; the original performer, active assignee or an Administrator may transition the Action to `COMPLETED` or `CANCELLED`. A completion writes the required result and server-derived `completedAt`. A terminal Action is not reopened or edited, so any later correction or follow-up work is recorded as a new Action. Every update/status change creates an audit event. |
| BR-10 | Requesters never change formal Ticket status. A requester resolution indication remains advisory. |
| BR-11 | `RESOLVED` requires an active owner, no `OPEN` Action Taken, a resolution summary, and a latest completed Action (ordered by `completedAt`, then id) whose follow-up is not required. If the Ticket has been reopened, that latest completed Action must have `completedAt` later than the most recent Ticket `STATUS_CHANGED` event into `REOPENED`; work completed before that event cannot satisfy the new resolution. A later completed Action with no follow-up is the explicit evidence that an earlier follow-up requirement has been satisfied. `CLOSED` requires `RESOLVED`. |
| BR-12 | `OPEN`, `IN_PROGRESS` and `WAITING_FOR_REQUESTER` require an active owner. `NEW` and `REOPENED` may be unassigned. |
| BR-13 | Stale Ticket or Action Taken versions return 409 and do not write a partial change. |
| BR-14 | Dashboard values are calculated by the backend from authoritative rows at request time; a card has an explicit zero state and documented drill-down query. |
| BR-15 | Existing records remain valid after migration: pre-Lab 4 Tickets have zero Actions Taken and remain in dashboard calculations according to their current status. |
| BR-16 | Seeds are idempotent and never overwrite edited users, passwords, Tickets, Actions Taken or workflow history. |

### Final Ticket transition matrix

Only IT Staff and Administrators perform transitions. Unlisted self/forward/backward transitions return 409. Cancelling/reopening requires a 5-250 character reason; resolving requires a 5-2000 character summary.

| From | Permitted next status |
|---|---|
| NEW | OPEN, CANCELLED |
| OPEN | IN_PROGRESS, WAITING_FOR_REQUESTER, RESOLVED, CANCELLED |
| IN_PROGRESS | WAITING_FOR_REQUESTER, RESOLVED, CANCELLED |
| WAITING_FOR_REQUESTER | IN_PROGRESS, RESOLVED, CANCELLED |
| RESOLVED | CLOSED, REOPENED |
| CLOSED | REOPENED |
| REOPENED | OPEN, IN_PROGRESS, CANCELLED |
| CANCELLED | REOPENED |

## 6. UI Summary

See [ui-spec.md](ui-spec.md). The application shell adds a Dashboard destination for each authenticated role. Staff Detail gains an Actions Taken panel that lists chronological work, opens a labelled create form, and permits edit only when authorized. Requester Ticket Detail renders the same approved Action items read-only.

## 7. Data, Migration and Seed Decisions

Add `ActionTaken` with `id`, `ticketId`, `performedById`, `assignedToId`, `status` (`OPEN`, `COMPLETED`, `CANCELLED`), `actionAt`, `completedAt`, `description`, `result`, `followUpRequired`, `followUpNote`, `attachmentNotes`, `version`, `createdAt`, and `updatedAt`. Add indexes on `(ticketId, status, completedAt, id)`, `(assignedToId, status, actionAt)` and `(performedById, actionAt)`. Keeping Action Taken as a separate child model prevents accidental replacement of a Ticket's coordinating owner and allows multiple contributors.

The Prisma migration creates the child table without modifying/deleting existing User, Ticket, Attachment, Comment or Internal Note rows. Existing Tickets are deliberately backfilled with no action rows: manufacturing historic actions would invent performers, timestamps and completion evidence, whereas an empty relation honestly preserves the pre-Lab 4 record and makes the resolution gate explicit. Migration verification records pre/post row counts and checks existing Ticket IDs, owner/requester relationships, attachment-removal attribution, and status/priority values. Recovery is a verified database-and-attachment backup restore into a disposable recovery target, not a destructive reset; the restored counts and sampled historical relationships are compared with the backup manifest.

Seed data uses stable fixture keys and contains assigned/unassigned Tickets across all statuses/priorities, Tickets with zero/one/multiple Actions Taken, a follow-up-required action, and enough different requester ownership to show non-zero and zero dashboard metrics.

## 8. API Summary

See [api-spec.md](api-spec.md). All protected endpoints use the existing session, trusted Origin and CSRF rules. Backend authorization is authoritative; hiding controls is never sufficient.

## 9. Acceptance Criteria

| ID | Observable criterion |
|---|---|
| AC-01 | A permitted Staff/Admin creates an Action Taken under the selected Ticket with authenticated performer, active assignee, action status and valid values. |
| AC-02 | Invalid action fields, absent required follow-up note, future action date and inactive/forged assignee are rejected without writing data. |
| AC-03 | Requesters read Actions Taken only for owned Tickets and cannot create/update them through the API or UI. |
| AC-04 | Two authorized Staff can record distinct Actions Taken on one Ticket while one primary owner remains. |
| AC-05 | The status API enforces owner/action/summary gates and rejects stale or forbidden transitions. |
| AC-06 | Requester dashboard numbers and lists match only that requester's authoritative Ticket query and provide usable empty/drill-down states. |
| AC-07 | Staff dashboard numbers and lists match backend queries, support drill-down, and never expose Administrator-only controls to Staff. |
| AC-08 | Migration preserves prior data; seed safely repeats and provides the required demonstration states. |
| AC-09 | Lab 1-3 regressions and final Lab 4 API/UI/E2E tests pass on final main. |

## 10. Product Definition of Done

- [ ] Contract and planned tests reviewed before implementation PRs.
- [ ] Migration preserves prior data and repeat-safe seed data covers actions and dashboards.
- [ ] Every acceptance criterion maps to executable tests and final outcomes are recorded.
- [ ] API authorization, validation, stale-write and safe failure checks pass.
- [ ] Desktop, tablet and mobile screens have no clipping, overlap or page-level horizontal overflow.
- [ ] Existing Labs 1-3 flows pass regression verification.
- [ ] README/setup/test instructions and all six Lab 4 documents are current.
- [ ] Feature PRs are peer-reviewed into `lab4-staging`, then release-reviewed into `main`; completed Issues are in Done.

## 11. Assumptions and Decisions

The existing Node/Express, Prisma/PostgreSQL, React/Vite, Vitest/Supertest and Playwright stack remains. Action date/time is user-entered to represent work performed in the past, while create/update timestamps are audit timestamps. Requesters see Actions Taken because the stakeholder explicitly asks for visibility, but private Internal Notes remain excluded. Dashboards summarize rather than replace Queue/My Tickets detail pages.
