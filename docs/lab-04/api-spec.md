# Lab 4 REST API Contract

Status: Proposed for peer review. Base path: `/api`. Existing Lab 3 session cookie, Origin, CSRF and safe-error conventions remain unchanged.

## DTOs

- `ActionTaken`: `{ id, ticketId, actionAt, description, result, performedBy: {id,displayName,role}, assignedTo: {id,displayName,role}, status: "OPEN"|"COMPLETED"|"CANCELLED", followUpRequired, followUpNote, attachmentNotes, version, createdAt, updatedAt }`
- `RequesterDashboard`: `{ metrics: { openTickets, waitingForRequester, recentlyUpdated, recentlyResolved }, recentTickets: TicketRow[] }`
- `StaffDashboard`: `{ metrics: { unassignedTickets, ownedByMe, urgentTickets, waitingForRequester }, recentTickets: TicketRow[] }`

Dates are UTC ISO-8601 strings. DTOs never expose session secrets, hashes, private notes or cross-owner data.

## Actions Taken

| Method/path | Role | Request | Success | Failures |
|---|---|---|---|---|
| GET `/tickets/:ticketId/actions-taken` | Owner Requester, Staff, Admin | `page`, `pageSize` optional | 200 paginated items, newest action time first then id | 401, 403, cross-owner 404, 400 query |
| POST `/staff/tickets/:ticketId/actions-taken` | Staff, Admin | `{ actionAt, description, result, assignedToId, status?, followUpRequired, followUpNote?, attachmentNotes? }` | 201 ActionTaken; `status` defaults to `OPEN` | 401/403, 404, 409 status conflict, 422 fields/inactive assignee |
| PATCH `/staff/tickets/:ticketId/actions-taken/:id` | original performer, Admin | mutable create fields plus `{ version }` | 200 ActionTaken | 401/403, 404, 409 stale/conflict, 422 fields/inactive assignee |

The server obtains performer from the session. Unknown fields and performer/owner identifiers in a body are rejected with 400. `assignedToId` must name an active IT Staff/Administrator. An Action is never deleted; Ticket, original performer and creation audit fields are immutable. Create/update runs in a transaction with an append-only TicketEvent audit row. A `version` mismatch returns `409 CONFLICT` with no write.

## Dashboards

| Method/path | Role | Success | Calculation / drill-down |
|---|---|---|---|
| GET `/requester/dashboard` | Requester | 200 RequesterDashboard | `openTickets`: own `NEW,OPEN,IN_PROGRESS,REOPENED`; drill-down `?currentStatus=NEW,OPEN,IN_PROGRESS,REOPENED`. `waitingForRequester`: own `WAITING_FOR_REQUESTER`; drill-down `?currentStatus=WAITING_FOR_REQUESTER`. `recentlyUpdated`: count of own Tickets updated in 30 days; drill-down `?updatedWithinDays=30&sort=recent`. `recentlyResolved`: own current `RESOLVED,CLOSED` Tickets whose latest `TicketEvent` transition to `RESOLVED` occurred in 30 days; drill-down `?currentStatus=RESOLVED,CLOSED&resolvedWithinDays=30`. `recentTickets` is a separate five-row list ordered `updatedAt desc,id desc`. |
| GET `/staff/dashboard` | Staff, Admin | 200 StaffDashboard | `unassignedTickets`: every nonterminal Ticket with null owner; drill-down `?currentStatus=NEW,OPEN,IN_PROGRESS,WAITING_FOR_REQUESTER,REOPENED&owner=unassigned`. `ownedByMe`: active-work Tickets owned by session user; drill-down `?currentStatus=OPEN,IN_PROGRESS,WAITING_FOR_REQUESTER&owner=me`. `urgentTickets`: nonterminal `HIGH,URGENT`; drill-down `?currentStatus=NEW,OPEN,IN_PROGRESS,WAITING_FOR_REQUESTER,REOPENED&itPriority=HIGH,URGENT`. `waitingForRequester`: `WAITING_FOR_REQUESTER`; drill-down `?currentStatus=WAITING_FOR_REQUESTER`. `recentTickets` is a separate five-row list ordered `updatedAt desc,id desc`. |

Every `metrics` property is an integer count, returns zero rather than null, and lists are separate DTO properties that return `[]` when empty. `currentStatus` and `itPriority` accept comma-separated enum values; `owner=me|unassigned`, `updatedWithinDays=30` and `resolvedWithinDays=30` are dashboard drill-down filters. Dashboard endpoints return concise summaries rather than full collections. Current local database timestamps are interpreted in UTC; the 30-day boundary is `now - 30*24 hours` at query time.

## Workflow increment

`PATCH /staff/tickets/:id/status` retains the Lab 3 body and adds the BR-11 server checks. `RESOLVED` is rejected with `409` unless an active owner, at least one completed Action, no open Action and no unresolved follow-up exist; it returns `422` when `resolutionSummary` is absent/invalid. The same gate is re-evaluated after reopening. Every action requires the Ticket `version`; stale updates return 409.

## Error contract

Use `{ code, message, fieldErrors? }`. `401 UNAUTHENTICATED` is for no/expired session, `403 FORBIDDEN` is for role denial, `404 NOT_FOUND` conceals other Requester-owned resources, `409 CONFLICT` is for stale/status/state conflicts, `422 VALIDATION_ERROR` contains safe field errors, and `503 UNAVAILABLE` is a safe dependency failure. Do not leak Ticket existence or internal fields.
