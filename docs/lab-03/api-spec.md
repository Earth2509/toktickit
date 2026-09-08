# Lab 3 REST API Contract

Status: Proposed. Base: /api. Companion: [business rules](specification.md).

## Session and request conventions

Use a cryptographically random 32-byte opaque session token in an HttpOnly, SameSite=Lax cookie, Path=/, 8-hour maximum lifetime. Secure=true on HTTPS; explicitly permit Secure=false only for localhost HTTP development. Store only SHA-256 token hashes in Session. Never put tokens in localStorage, query strings, or logs. Express checks session expiry, current active state and credentialVersion on every protected request. Login/change rotates the token. Logout deletes the server session and expires the cookie; do not rely only on browser deletion.

All browser mutations require an exact trusted Origin from configured local frontend origins (no wildcard CORS). Authenticated mutations also require X-CSRF-Token, a session-bound value returned by login/me and stored only in browser memory. Derive it as HMAC-SHA256 of the session token hash using a dedicated server secret supplied outside source control, and compare in constant time. This lets me return the same CSRF value without storing a raw token. Missing/untrusted origin or CSRF mismatch returns 403 before a mutation. Login uses Origin validation without a pre-login CSRF token. Credentials/cookies must be redacted in diagnostics; Cache-Control: no-store on auth/private responses.

Parse JSON strictly; reject unknown mutation fields. IDs are positive safe integers. Timestamps are UTC ISO-8601 strings. JSON validation uses 422; malformed JSON/query uses 400. Auth checks precede business validation. Pending-password sessions receive 403 PASSWORD_CHANGE_REQUIRED on all business endpoints. Public health stays public; reference data becomes authenticated. Development GET /requesters is removed (404).

Error DTO: `{ code, message, fieldErrors? }`, fieldErrors maps field names to safe strings. Codes distinguish UNAUTHENTICATED (401), FORBIDDEN (403), PASSWORD_CHANGE_REQUIRED (403), NOT_FOUND (404), CONFLICT (409), VALIDATION_ERROR (422), RATE_LIMITED (429), UNAVAILABLE (503), INTERNAL_ERROR (500). Cross-owner 404 is identical to missing. Never reveal protected resource existence in error detail.

## DTOs

- User: `{ id, displayName, email, role, isActive, mustChangePassword }`; Admin list adds createdAt/updatedAt/version, never passwordHash.
- Auth: `{ user, csrfToken, expiresAt }`; the cookie carries the session, not JSON.
- Ticket row: existing Lab 2 row plus `{ itPriority, currentStatus, owner: {id,displayName,role}|null, version }`.
- Ticket detail: row plus description, requester display, references, resolutionSummary, requesterResolvedAt, attachment metadata; no internal note collection in this shared DTO.
- Entry: `{ id, ticketId, author: {id,displayName,role}, content, createdAt }`.
- Lists: `{ items, page, pageSize, totalItems, totalPages }`; totalPages >= 1. Admin list uses `{ items }`.

## Authentication

| Method/path | Request | Success | Specific failures |
|---|---|---|---|
| POST /auth/login | {email,password} | 200 Auth, new cookie | 401 INVALID_CREDENTIALS for unknown/wrong/inactive; 422 fields; 429 throttle |
| GET /auth/me | Cookie | 200 Auth including pending-change user | 401 absent/expired/revoked |
| POST /auth/change-password | {currentPassword,newPassword,confirmPassword}, CSRF | 200 Auth, rotate session; invalidate all old sessions | 422 policy/mismatch; 401 incorrect current password |
| POST /auth/logout | Cookie and CSRF when session valid | 204, revoke and expire cookie | 403 CSRF; absent session returns 204 with cookie cleared |

Password policy and rate limits: BR-06 through BR-10. A password change creates a normal replacement session only after successful hash persistence. Failure keeps the change-required gate. A reset by Admin creates no session for the target.

## Requester continuity and shared ticket resources

Retain Lab 2 payload validation and response fields except remove requesterId from all body/query/multipart inputs. Presence returns 400 LEGACY_IDENTITY_UNSUPPORTED. All ticket creation ownership comes from session.userId. Same idempotency key with different authenticated owner returns generic 409, never another user's ticket. Existing global key uniqueness is retained.

| Method/path | Role and behavior |
|---|---|
| GET /categories; GET /related-systems | All complete authenticated roles; 200 active references |
| POST /tickets | Requester; categoryId,relatedSystemId,summary,description,requestedPriority,idempotencyKey; 201 new / 200 identical retry |
| GET /tickets | Requester own list, Lab 2 queries; now all eight statuses valid |
| GET /tickets/:id | Requester own or Staff/Admin all; 200 detail |
| GET /tickets/:id/attachments | Same readable scope; 200 metadata |
| POST /tickets/:id/attachments | Owner Requester only; multipart file; 201 |
| GET /tickets/:id/attachments/:attachmentId/download | Readable ticket scope, active file only; 200 bytes, safe Content-Disposition; 404 otherwise |
| PATCH /tickets/:id/attachments/:attachmentId/remove | Owner Requester; {reason}; 200 metadata, preserve Lab 2 removal rules |
| POST /tickets/:id/resolution-indication | Owner Requester; {version}; 200 {requesterResolvedAt,version}; unchanged repeated indication is 200 |

Attachment limits remain 5 MiB, JPEG/PNG/WEBP/PDF and five active files; 413 size,415 type,409 count/terminal conflict. Check ticketId + attachmentId association, not either alone. Existing removed audit fields remain compatible. Resolution indication obeys BR-18. Terminal attachment mutation denial is 409. Ticket description/classification cannot be edited through these routes.

## Staff queue and operations

GET /staff/tickets: Staff/Admin, returns paginated ticket rows. Search trims 0-120 characters, case-insensitive substring on ticketNumber/summary. Filters: categoryId,relatedSystemId,requestedPriority,itPriority,currentStatus,ownerId. ownerId is a positive ID or `unassigned`; omitted means all. sortBy: createdAt,updatedAt,ticketNumber,itPriority,currentStatus; sortOrder asc/desc. Default updatedAt desc,id desc. Priority uses severity enum order; status uses declared order NEW,OPEN,IN_PROGRESS,WAITING_FOR_REQUESTER,RESOLVED,CLOSED,REOPENED,CANCELLED. Ties use id in the same direction. page >=1, pageSize 10/20/50 default10. Invalid/unknown queries return 400. Page beyond results returns empty items and correct totals, no silent clamp.

GET /staff/tickets/:id returns shared detail for Staff/Admin. GET /staff/assignees returns active Staff/Admin `{id,displayName,role}` only.

| Method/path | Body | Success |
|---|---|---|
| POST /staff/tickets/:id/claim | {version} | 200 updated detail; self becomes owner only if unassigned |
| PATCH /staff/tickets/:id/owner | {ownerId: number|null,version} | 200 updated detail |
| PATCH /staff/tickets/:id/priority | {itPriority,version} | 200 updated detail |
| PATCH /staff/tickets/:id/status | {currentStatus,version,reason?,resolutionSummary?} | 200 updated detail |

Use conditional version update inside transaction with event insert. 409 stale state, claim collision, terminal restriction or prohibited transition; 422 invalid/inactive assignee, malformed enum or missing required reason/summary. Clients reload before reapplying changes, never automatically overwrite a conflict. Identical no-op priority/owner updates return current detail without a new event only if version matches.

## Comments and notes

GET/POST /tickets/:id/comments: Requester own, Staff/Admin all. GET/POST /tickets/:id/internal-notes: Staff/Admin only; check role before lookup. POST body `{content}`; 201 Entry. GET accepts page/pageSize (10/20/50), returns list in createdAt asc,id asc. Whitespace/oversize input ->422; terminal ticket creation ->409. No PUT/PATCH/DELETE routes. Authors/times come from backend. Do not serialize internal notes in ticket detail, errors, requester activity, or event DTOs. Events exposed to Requesters omit private note activity entirely.

## Administrator

| Method/path | Body/query | Success |
|---|---|---|
| GET /admin/users | search: optional trimmed name/email substring <=120 chars | 200 {items}, displayName asc,id asc |
| POST /admin/users | {displayName,email,role,isActive,initialPassword} | 201 safe User, mustChangePassword=true |
| PATCH /admin/users/:id | {displayName,email,role,isActive,version} | 200 safe updated User |
| POST /admin/users/:id/initial-password | {initialPassword,version} | 200 safe User, mustChangePassword=true |

Every route checks ADMINISTRATOR before lookup. New user version=1; successful changes increment it. Duplicate normalized email ->409; stale version/safety conflict ->409; invalid role/password/name ->422; missing target ->404. Serialize Admin demotion/deactivation using a transaction-level shared advisory lock before counting active Admins. Re-check actor authorization within the transaction. Revoke affected sessions and unassign active tickets as defined in BR-20 in the same transaction. Reset never returns plaintext password. No user DELETE endpoint.

## Verification boundary

This is a proposed contract, not passing API evidence. Implement exact DTO/error tests and migration integration tests before marking [tests](tests.md) passed. Any contract change requires a documented PR change and corresponding planned-test update.
