# Lab 4 REST API Contract

Status: Proposed for peer review. Base path: `/api`. Existing Lab 3 session cookie, Origin, CSRF and safe-error conventions remain unchanged.

## DTOs

- `ActionTaken`: `{ id, ticketId, actionAt, description, result, performedBy: {id,displayName,role}, followUpRequired, followUpNote, attachmentNotes, version, createdAt, updatedAt }`
- `RequesterDashboard`: `{ metrics: { openTickets, waitingForRequester, recentlyUpdated, recentlyResolved }, recentTickets: TicketRow[] }`
- `StaffDashboard`: `{ metrics: { unassignedTickets, ownedByMe, urgentTickets, waitingForRequester }, recentTickets: TicketRow[] }`

Dates are UTC ISO-8601 strings. DTOs never expose session secrets, hashes, private notes or cross-owner data.

## Actions Taken

| Method/path | Role | Request | Success | Failures |
|---|---|---|---|---|
| GET `/tickets/:ticketId/actions-taken` | Owner Requester, Staff, Admin | `page`, `pageSize` optional | 200 paginated items, newest action time first then id | 401, 403, cross-owner 404, 400 query |
| POST `/staff/tickets/:ticketId/actions-taken` | Staff, Admin | `{ actionAt, description, result, followUpRequired, followUpNote?, attachmentNotes? }` | 201 ActionTaken | 401/403, 404, 409 status conflict, 422 fields |
| PATCH `/staff/tickets/:ticketId/actions-taken/:id` | original performer, Admin | create fields plus `{ version }` | 200 ActionTaken | 401/403, 404, 409 stale/conflict, 422 fields |

The server obtains performer from the session. Unknown fields and performer/owner identifiers in a body are rejected with 400. Create/update runs in a transaction with an append-only TicketEvent audit row. A `version` mismatch returns `409 CONFLICT` with no write.

## Dashboards

| Method/path | Role | Success | Calculation / drill-down |
|---|---|---|---|
| GET `/requester/dashboard` | Requester | 200 RequesterDashboard | `openTickets`: own nonterminal statuses except WAITING_FOR_REQUESTER; `waitingForRequester`: own WAITING_FOR_REQUESTER; `recentlyUpdated`: five own Tickets ordered `updatedAt desc,id desc`; `recentlyResolved`: own RESOLVED/CLOSED updated in last 30 days. Drill-down uses My Tickets status filters. |
| GET `/staff/dashboard` | Staff, Admin | 200 StaffDashboard | `unassignedTickets`: NEW/REOPENED with null owner; `ownedByMe`: active-work Tickets owned by session user; `urgentTickets`: nonterminal HIGH/URGENT IT priority; `waitingForRequester`: WAITING_FOR_REQUESTER. `recentTickets` is five nonterminal rows ordered `updatedAt desc,id desc`. Drill-down uses Staff Queue filters. |

Counts are integer values, return zero rather than null, and lists return `[]` when empty. Dashboard endpoints return concise summaries rather than full collections. Current local database timestamps are interpreted in UTC; the 30-day boundary is `now - 30*24 hours` at query time.

## Workflow increment

`PATCH /staff/tickets/:id/status` retains the Lab 3 body and adds the BR-11 server checks. `RESOLVED` is rejected with `409` unless an active owner and at least one Action Taken exist, and `422` when `resolutionSummary` is absent/invalid. Every action requires the Ticket `version`; stale updates return 409.

## Error contract

Use `{ code, message, fieldErrors? }`. `401 UNAUTHENTICATED` is for no/expired session, `403 FORBIDDEN` is for role denial, `404 NOT_FOUND` conceals other Requester-owned resources, `409 CONFLICT` is for stale/status/state conflicts, `422 VALIDATION_ERROR` contains safe field errors, and `503 UNAVAILABLE` is a safe dependency failure. Do not leak Ticket existence or internal fields.
