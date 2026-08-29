# Lab 2 REST API Contract

**Status:** Draft for peer review  
**Base path:** `/api`  
**Development requester context:** `requesterId` identifies a Lab 2 testing context. It is not authentication; server-side ownership validation remains mandatory.

## 1. Shared Conventions

- JSON endpoints use `application/json`; file upload uses `multipart/form-data`.
- Validation errors return `{ "message": string, "fieldErrors": Record<string, string> }`.
- `400` means the request cannot be parsed or a list-query parameter is malformed. `422` means a syntactically well-formed JSON body reached field validation but violates a documented Ticket or removal rule.
- Unexpected errors return a safe `{ "message": "Unable to complete the request" }` response without internal details.
- A missing, inactive, or non-owned resource returns a safe `404` response where disclosure would reveal another Requester's data.
- Ticket list responses include `{ items, page, pageSize, totalItems, totalPages }`.

## 2. Reference and Development Requester Endpoints

| Method and path | Purpose | Success | Key failures |
|---|---|---|---|
| `GET /api/categories` | List active Categories ordered by name. | `200` array of `{ id, name }` | `503` reference data unavailable |
| `GET /api/related-systems` | List active Related Systems ordered by name. | `200` array of `{ id, name }` | `503` reference data unavailable |
| `GET /api/requesters` | List active Development Requesters for the selector. | `200` array of `{ id, displayName, email }` | `503` requester data unavailable |

## 3. Ticket Endpoints

### `POST /api/tickets`

Creates one validated Ticket for the selected Requester. `idempotencyKey` is required and must be a client-generated UUID. The browser keeps the same key when an unchanged create request is retried and generates a new key whenever the user changes a create-request field. The server compares a normalized create payload for a reused key: an identical retry returns the original Ticket; a changed requester, reference, summary, description, or priority with that same key is a conflict.

```json
{
  "requesterId": 1,
  "categoryId": 2,
  "relatedSystemId": 3,
  "summary": "Laptop battery drains quickly",
  "description": "The laptop battery falls from 100% to 20% within one hour.",
  "requestedPriority": "MEDIUM",
  "idempotencyKey": "client-generated-uuid"
}
```

Success: `201` with the saved Ticket, including `id`, `ticketNumber`, `requesterId`, reference data, `currentStatus: "NEW"`, and timestamps. Repeating the same valid idempotency key with the same normalized payload returns the previously created representation with `200` and does not create another Ticket.

Failures: `400` malformed body, `404` inactive/missing requester or inactive/missing reference data, `422` field validation errors, `409` conflicting idempotency key payload, and `503`/`500` safe persistence error.

### `GET /api/tickets`

Returns only the selected Requester's Tickets.

Required query parameter: `requesterId`.

Optional query parameters: `search`, `categoryId`, `relatedSystemId`, `requestedPriority`, `currentStatus`, `sortBy` (`createdAt`, `updatedAt`, `ticketNumber`, `requestedPriority`), `sortOrder` (`asc`, `desc`), `page` (minimum 1), and `pageSize` (10, 20, or 50). For `requestedPriority`, ascending order is `LOW`, `MEDIUM`, `HIGH`, `URGENT`; descending reverses that severity order. Current Status is accepted for forward compatibility but all Lab 2 Tickets are `NEW`, so meaningful Lab 2 filter evidence uses Category, Related System, and Requested Priority.

Success: `200` with `{ items, page, pageSize, totalItems, totalPages }`. List rows include the fields required by My Tickets and exclude the detail-only `description`; Ticket Detail returns the full description. `totalPages` is always at least `1`, including empty and no-results lists, so pagination has a consistent page-1 contract. The default order is `createdAt desc, id desc`. Invalid query values return `400` with field errors. Empty and no-results searches both return `200` with an empty `items` array; the UI determines the correct presentation from active query state.

### `GET /api/tickets/:ticketId`

Required query parameter: `requesterId`.

Success: `200` with one owned Ticket, its reference data, and Attachment metadata. A missing or non-owned Ticket returns safe `404`.

## 4. Attachment Endpoints

### `POST /api/tickets/:ticketId/attachments`

Multipart fields: `requesterId` and `file`.

Success: `201` with active Attachment metadata `{ id, originalFilename, mimeType, sizeBytes, createdAt, removedAt: null }`.

Failures: `400` malformed multipart request, `404` non-owned/missing Ticket, `413` over 5 MB, `415` unsupported type, `409` five active attachments already exist, and `503` safe storage failure. Server validation checks MIME type, size, ownership, and active-attachment count before committing usable metadata.

### `GET /api/tickets/:ticketId/attachments`

Required query parameter: `requesterId`. Returns `200` Attachment metadata for an owned Ticket, including removed metadata but not storage paths. Missing/non-owned Ticket returns `404`.

### `GET /api/tickets/:ticketId/attachments/:attachmentId/download`

Required query parameter: `requesterId`. Returns `200` file content with a safe download filename only for an active Attachment belonging to an owned Ticket. Removed, missing, or non-owned Attachments return `404`.

### `PATCH /api/tickets/:ticketId/attachments/:attachmentId/remove`

```json
{
  "requesterId": 1,
  "reason": "The screenshot contains confidential information."
}
```

Success: `200` with removed metadata including `removedAt`, `removedByRequesterId`, and `removalReason`. The operation is idempotent only when the Attachment is already removed by the same request; otherwise a second removal returns safe `409`/`404` according to the implementation decision recorded in tests. The service removes download/preview availability and retains metadata.

Failures: `400` malformed body, `422` invalid removal reason, `404` missing/non-owned Attachment or Ticket, and `503` safe storage/database failure.

## 5. HTTP Status Summary

| Status | Meaning in Lab 2 |
|---|---|
| `200` | Successful retrieval, repeat idempotent create result, or successful soft removal |
| `201` | Ticket or Attachment created |
| `400` | Malformed request or invalid list query |
| `404` | Missing, inactive where applicable, or non-owned resource without data disclosure |
| `409` | Idempotency payload conflict or active attachment limit/conflicting state |
| `413` | Attachment exceeds 5 MB |
| `415` | Unsupported attachment type |
| `422` | Well-formed request fails field validation |
| `500`/`503` | Safe unexpected or unavailable dependency error |
