# Lab 4 REST API Contract

Status: Proposed for peer review. Base path: `/api`. Existing Lab 3 session cookie, Origin, CSRF and safe-error conventions remain unchanged.

## DTOs

- `ActionTaken`: `{ id, ticketId, actionAt, completedAt, description, result, performedBy: {id,displayName,role}, assignedTo: {id,displayName,role}, status: "OPEN"|"COMPLETED"|"CANCELLED", followUpRequired, followUpNote, attachmentNotes, version, createdAt, updatedAt }`
- `RequesterDashboard`: `{ metrics: { openTickets, waitingForRequester, recentlyUpdated, recentlyResolved }, recentTickets: TicketRow[] }`
- `StaffDashboard`: `{ metrics: { unassignedTickets, ownedByMe, urgentTickets, waitingForRequester }, recentTickets: TicketRow[] }`

Dates are UTC ISO-8601 strings. DTOs never expose session secrets, hashes, private notes or cross-owner data.

## Actions Taken

| Method/path | Role | Request | Success | Failures |
|---|---|---|---|---|
| GET `/tickets/:ticketId/actions-taken` | Owner Requester, Staff, Admin | `page`, `pageSize` optional | 200 paginated items, newest action time first then id | 401, 403, cross-owner 404, 400 query |
| POST `/staff/tickets/:ticketId/actions-taken` | Staff, Admin | `Idempotency-Key` header plus `{ actionAt, description, result?, assignedToId, status?, followUpRequired, followUpNote?, attachmentNotes? }` | 201 ActionTaken; `status` defaults to `OPEN`; `completedAt` is server-derived; a repeated key returns the original result | 400 malformed/unknown fields, 401/403, 404, 409 status conflict, 422 known-field validation/inactive assignee |
| PATCH `/staff/tickets/:ticketId/actions-taken/:id` | original performer, active assignee, Admin | permitted OPEN fields plus `{ version }`; assignee may transition status only | 200 ActionTaken | 401/403, 404, 409 stale/conflict, 422 fields/inactive assignee |

The server obtains performer from the session. Unknown fields and performer/owner identifiers in a body are rejected with 400; known fields with invalid values receive 422. `assignedToId` must name an active IT Staff/Administrator. `OPEN` Actions have no result or `completedAt`; a transition to `COMPLETED` requires a result and writes `completedAt`. A create key is scoped to the authenticated actor and Ticket, stores a request fingerprint and expires only after the documented retention period; reusing it with a different payload returns 409. An Action is never deleted; Ticket, original performer, `actionAt`, creation audit fields and every terminal Action value are immutable. Create/update runs in a transaction with an append-only TicketEvent audit row. A `version` mismatch returns `409 CONFLICT` with no write.

## Dashboards

| Method/path | Role | Success | Calculation / drill-down |
|---|---|---|---|
| GET `/requester/dashboard` | Requester | 200 RequesterDashboard | `openTickets`: own `NEW,OPEN,IN_PROGRESS,REOPENED`; drill-down `?currentStatus=NEW,OPEN,IN_PROGRESS,REOPENED`. `waitingForRequester`: own `WAITING_FOR_REQUESTER`; drill-down `?currentStatus=WAITING_FOR_REQUESTER`. `recentlyUpdated`: count of own Tickets updated in 30 days; drill-down `?updatedWithinDays=30&sort=recent`. `recentlyResolved`: own current `RESOLVED,CLOSED` Tickets whose latest `TicketEvent` transition to `RESOLVED` occurred in 30 days; drill-down `?currentStatus=RESOLVED,CLOSED&resolvedWithinDays=30`. `recentTickets` is a separate five-row list ordered `updatedAt desc,id desc`. |
| GET `/staff/dashboard` | Staff, Admin | 200 StaffDashboard | `unassignedTickets`: every nonterminal Ticket with null owner; drill-down `?currentStatus=NEW,OPEN,IN_PROGRESS,WAITING_FOR_REQUESTER,REOPENED&owner=unassigned`. `ownedByMe`: every nonterminal Ticket owned by the session user; drill-down `?currentStatus=NEW,OPEN,IN_PROGRESS,WAITING_FOR_REQUESTER,REOPENED&owner=me`. `urgentTickets`: nonterminal `HIGH,URGENT`; drill-down `?currentStatus=NEW,OPEN,IN_PROGRESS,WAITING_FOR_REQUESTER,REOPENED&itPriority=HIGH,URGENT`. `waitingForRequester`: `WAITING_FOR_REQUESTER`; drill-down `?currentStatus=WAITING_FOR_REQUESTER`. `recentTickets` is a separate five-row list ordered `updatedAt desc,id desc`. |

Every `metrics` property is an integer count, returns zero rather than null, and lists are separate DTO properties that return `[]` when empty. `currentStatus` and `itPriority` accept comma-separated enum values. For the Staff Queue, `owner=me|unassigned` is a new Lab 4 dashboard alias; the existing `ownerId=<number>|unassigned` remains supported, and a request may not supply both. `updatedWithinDays=30` and `resolvedWithinDays=30` are accepted only by the Requester My Tickets route (`GET /tickets`); the Staff Queue route (`GET /staff/tickets`) does not accept either date filter. Dashboard endpoints return concise summaries rather than full collections. Current local database timestamps are interpreted in UTC; the 30-day boundary is `now - 30*24 hours` at query time.

## Workflow increment

`PATCH /staff/tickets/:id/status` retains the Lab 3 body and adds the BR-11 server checks. `RESOLVED` is rejected with `409` unless an active owner, no open Action and an eligible latest completed Action exist. After a reopen, eligibility requires completion after the latest Ticket event into `REOPENED`; its no-follow-up value is the evidence that a prior follow-up was completed. It returns `422` when `resolutionSummary` is absent/invalid. Every action requires the Ticket `version`; stale updates return 409.

## Error contract

Use `{ code, message, fieldErrors? }`. `401 UNAUTHENTICATED` is for no/expired session, `403 FORBIDDEN` is for role denial, `404 NOT_FOUND` conceals other Requester-owned resources, `409 CONFLICT` is for stale/status/state conflicts, `422 VALIDATION_ERROR` contains safe field errors, and `503 UNAVAILABLE` is a safe dependency failure. Do not leak Ticket existence or internal fields.
