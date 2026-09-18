# Lab 3 REST API Contract

Status: Proposed. Base: /api. Companion: [business rules](specification.md).

## Session and request conventions

Use a cryptographically random 32-byte opaque session token in an HttpOnly, SameSite=Lax cookie, Path=/, no Domain attribute, 8-hour maximum lifetime. Secure=true on HTTPS; explicitly permit Secure=false only for loopback HTTP development (localhost/127.0.0.1). Store only SHA-256 token hashes in Session. Never put tokens in localStorage, query strings, or logs. Express checks session expiry, current active state and credentialVersion on every protected request. Login/change rotates the token. Logout deletes the server session and expires the cookie; do not rely only on browser deletion.

### Browser transport: same-origin proxy

Foundation backlog item 2 must replace the existing direct VITE_API_URL browser calls with relative /api URLs and credentials: "same-origin" on fetch, add Vite server.proxy and preview.proxy for /api without path rewriting, and remove Express wildcard cors() middleware. Default development frontend http://localhost:5173 proxies to http://localhost:3000. Playwright frontend http://127.0.0.1:4173 proxies to http://127.0.0.1:3001 via a server-side proxy-target environment setting; update playwright.config.ts and client preview configuration together. Cookies belong to the frontend host; forward Set-Cookie unchanged and retain the original browser Origin through the proxy. Explicitly allow those two frontend origins for mutation Origin validation in their respective environments. This is CSRF Origin validation, not a credentialed CORS transport. Cross-origin browser API calls are unsupported; do not add Access-Control-Allow-Origin/credentials as a fallback. Playwright browser flows use the frontend /api path; direct security-test clients must supply the documented Origin/cookie/CSRF deliberately. Verify login/me/mutation/logout end-to-end through both local and E2E proxies before downstream feature implementation.

All browser mutations require an exact trusted Origin from configured local frontend origins (no wildcard CORS). Authenticated mutations also require X-CSRF-Token, a session-bound value returned by login/me and stored only in browser memory. Derive it as HMAC-SHA256 of the session token hash using a dedicated server secret supplied outside source control, and compare in constant time. This lets me return the same CSRF value without storing a raw token. Missing/untrusted origin or CSRF mismatch returns 403 before a mutation. Login uses Origin validation without a pre-login CSRF token. Credentials/cookies must be redacted in diagnostics; Cache-Control: no-store on auth/private responses.

Parse JSON strictly; reject unknown mutation fields. IDs are positive safe integers. Timestamps are UTC ISO-8601 strings. JSON validation uses 422; malformed JSON/query uses 400. Auth checks precede business validation. Pending-password sessions receive 403 PASSWORD_CHANGE_REQUIRED on all business endpoints. Public health stays public; reference data becomes authenticated in the route-authorization increment. During the foundation increment, development GET /requesters is retained only for Lab 2 regression compatibility and returns active REQUESTER-role users; the login/UI increment removes it (404).

Error DTO: `{ code, message, fieldErrors? }`, fieldErrors maps field names to safe strings. Codes distinguish UNAUTHENTICATED (401 for absent/expired/revoked session), INVALID_CREDENTIALS (401 at login), ACCOUNT_INACTIVE (403 at login only after correct password), FORBIDDEN (403), PASSWORD_CHANGE_REQUIRED (403), LEGACY_IDENTITY_UNSUPPORTED (400), BAD_REQUEST (400 malformed JSON/query), NOT_FOUND (404), CONFLICT (409), VALIDATION_ERROR (422), RATE_LIMITED (429), UNAVAILABLE (503), INTERNAL_ERROR (500). Attachment-specific codes are PAYLOAD_TOO_LARGE (413) and UNSUPPORTED_MEDIA_TYPE (415). The login screen handles its own credential errors; only UNAUTHENTICATED drives global session-expired navigation. Cross-owner 404 is identical to missing. Never reveal protected resource existence in error detail.

## DTOs

- User: `{ id, displayName, email, role, isActive, mustChangePassword }`; Admin list adds createdAt/updatedAt/version, never passwordHash.
- Auth: `{ user, csrfToken, expiresAt }`; the cookie carries the session, not JSON.
- Ticket row: existing Lab 2 row plus `{ itPriority, currentStatus, owner: {id,displayName,role}|null, requesterResolvedAt: string|null, version }`; queue uses requesterResolvedAt for the indication marker.
- Ticket detail: row plus description, requester display, references, resolutionSummary, requesterResolvedBy: `{id,displayName}|null`, attachment metadata; requesterResolvedAt and requesterResolvedBy are both null before indication/after reopening. No internal note collection in this shared DTO.
- Entry: `{ id, ticketId, author: {id,displayName,role}, content, createdAt }`.
- Lists: `{ items, page, pageSize, totalItems, totalPages }`; totalPages >= 1. Admin list uses `{ items }`.

## Authentication

| Method/path | Request | Success | Specific failures |
|---|---|---|---|
| POST /auth/login | {email,password} | 200 Auth, new cookie | 401 INVALID_CREDENTIALS for unknown/null-hash/wrong password; 403 ACCOUNT_INACTIVE only after correct password; 422 fields; 429 throttle |
| GET /auth/me | Cookie | 200 Auth including pending-change user | 401 absent/expired/revoked |
| POST /auth/change-password | {currentPassword,newPassword,confirmPassword}, CSRF | 200 Auth, rotate session; invalidate all old sessions | 422 VALIDATION_ERROR for policy/mismatch/wrong current password (fieldErrors.currentPassword); 429 attempt limit; 401 only if session absent/expired/revoked |
| POST /auth/logout | Cookie and CSRF when session valid | 204, revoke and expire cookie | 403 CSRF; absent session returns 204 with cookie cleared |

Password policy and rate limits: BR-06 through BR-10. For well-formed, non-throttled login attempts, unknown/null-hash records verify against a fixed dummy hash at the same scrypt parameters, then fail; never accept a dummy verification as authentication. Wrong passwords on inactive accounts still return INVALID_CREDENTIALS. ACCOUNT_INACTIVE says "This account is deactivated. Contact your administrator." and creates no session. A password change creates a normal replacement session only after successful hash persistence. Incorrect current password returns 422 without revocation/navigation and counts toward 5 failures per user/30 per source address per 15 minutes across sessions; next attempt is 429 with Retry-After. Failure keeps the change-required gate. A reset by Admin creates no session for the target.

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

Attachment limits remain 5 MiB, JPEG/PNG/WEBP/PDF and five active files; 413 size,415 type,409 count/status conflict. Check ticketId + attachmentId association, not either alone. Existing removed audit fields remain compatible. Apply the specification status policy table: attachment upload/removal return 409 on CLOSED/CANCELLED, but remain allowed on RESOLVED for the owning Requester. Resolution indication returns 409 on RESOLVED/CLOSED/CANCELLED, including repeats; elsewhere repeated indication is stable. Ticket description/classification cannot be edited through these routes.

## Staff queue and operations

GET /staff/tickets: Staff/Admin, returns paginated ticket rows. Search trims 0-120 characters, case-insensitive substring on ticketNumber/summary. Filters: categoryId,relatedSystemId,requestedPriority,itPriority,currentStatus,ownerId. ownerId is a positive ID or `unassigned`; omitted means all. sortBy: createdAt,updatedAt,ticketNumber,itPriority,currentStatus; sortOrder asc/desc. Default updatedAt desc,id desc. Priority uses severity enum order; status uses declared order NEW,OPEN,IN_PROGRESS,WAITING_FOR_REQUESTER,RESOLVED,CLOSED,REOPENED,CANCELLED. Ties use id in the same direction. page >=1, pageSize 10/20/50 default10. Invalid/unknown queries return 400. Page beyond results returns empty items and correct totals, no silent clamp.

GET /staff/tickets/:id returns shared detail for Staff/Admin. GET /staff/assignees returns active Staff/Admin `{id,displayName,role}` only.

| Method/path | Body | Success |
|---|---|---|
| POST /staff/tickets/:id/claim | {version} | 200 updated detail; self becomes owner only if unassigned |
| PATCH /staff/tickets/:id/owner | {ownerId: number|null,version} | 200 updated detail |
| PATCH /staff/tickets/:id/priority | {itPriority,version} | 200 updated detail |
| PATCH /staff/tickets/:id/status | {currentStatus,version,reason?,resolutionSummary?} | 200 updated detail |

Use conditional version update inside transaction with event insert. Apply the specification status policy table to every operation. 409 covers stale state, claim collision, priority/owner edits in RESOLVED/CLOSED/CANCELLED, manual unassignment in active-work states, missing required owner and prohibited transition; 422 covers invalid/inactive assignee, malformed enum or missing required reason/summary. NEW -> OPEN requires prior claim/assignment. After BR-20 unassignment, active-work tickets must be reassigned before any transition. Reopening clears an ineligible historical owner atomically. Clients reload before reapplying changes, never automatically overwrite a conflict. Identical no-op priority/owner updates return current detail without a new event only if the status permits editing and version matches.

## Comments and notes

GET/POST /tickets/:id/comments: Requester own, Staff/Admin all. GET/POST /tickets/:id/internal-notes: Staff/Admin only; check role before lookup. POST body `{content}`; 201 Entry. GET accepts page/pageSize (10/20/50; default page 1/pageSize 10), returns newest first in createdAt desc,id desc. Whitespace/oversize input ->422; creation on CLOSED/CANCELLED ->409; RESOLVED permits creation as specified in the status policy table. No PUT/PATCH/DELETE routes. Authors/times come from backend. Do not serialize internal notes in ticket detail, errors, requester activity, or event DTOs. Events exposed to Requesters omit private note activity entirely.

## Administrator

| Method/path | Body/query | Success |
|---|---|---|
| GET /admin/users | search: optional trimmed name/email substring <=120 chars; role: optional REQUESTER, IT_STAFF or ADMINISTRATOR | 200 {items}, displayName asc,id asc; search and role combine with AND |
| POST /admin/users | {displayName,email,role,isActive,initialPassword} | 201 safe User, mustChangePassword=true |
| PATCH /admin/users/:id | {displayName,email,role,isActive,version} | 200 safe updated User |
| POST /admin/users/:id/initial-password | {initialPassword,version} | 200 safe User, mustChangePassword=true |

Every route checks ADMINISTRATOR before lookup. Omitted role means all roles; invalid/empty/repeated role query or unknown query parameter returns 400 BAD_REQUEST. New user version=1; successful changes increment it. Duplicate normalized email ->409; stale version/safety conflict ->409; invalid mutation role/password/name ->422; missing target ->404. Serialize Admin demotion/deactivation using a transaction-level exclusive advisory lock before counting active Admins (every such transaction uses the same lock key). Re-check actor authorization within the transaction. Revoke affected sessions and unassign nonterminal tickets as defined in BR-20 in the same transaction. Reset never returns plaintext password. No user DELETE endpoint.

## Verification boundary

This is a proposed contract, not passing API evidence. Implement exact DTO/error tests and migration integration tests before marking [tests](tests.md) passed. Any contract change requires a documented PR change and corresponding planned-test update.
