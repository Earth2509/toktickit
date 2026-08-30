# Lab 2 Sprint Engineering Specification

**Status:** Draft for peer review  
**Issue:** #11 - Engineering Contract and Test Plan  
**Branch:** `feature/11-engineering-contract`  
**Product:** TokTickIT Requester Ticketing MVP

## 1. Sprint Goal

Deliver a professional, responsive Requester-facing ticketing MVP. A selected Development Requester can create and locate only their own IT support tickets, inspect a read-only ticket detail page, and manage permitted attachments. The selector is a Lab 2 testing context only; it is not authentication.

## 2. Stakeholder Request Interpretation

The Requester needs a clear way to report an IT problem, choose its classification, attach supporting material, receive an official backend-generated Ticket Number, and later find the saved ticket. The solution must protect requester ownership in the backend despite using a temporary selected requester instead of real login. The interface must establish reusable Zen Green components and responsive behavior for later TokTickIT increments.

## 3. Scope

### Included

- Development Requester selection, switching, display, and safe loading states.
- Create Ticket, My Tickets, Requester Ticket Detail, and Attachment workflows.
- Ticket search, filters, sorting, pagination, ownership checks, validation, and error handling.
- PostgreSQL/Prisma models, migrations, repeatable seed data, REST APIs, automated tests, E2E coverage, visual checks, and documentation.

### Excluded

- Real authentication, passwords, sessions, tokens, or role-based authorization.
- IT Staff queues, assignment, IT Priority changes, and ticket-owner workflow.
- Comments, Internal Notes, Actions Taken, and ticket lifecycle changes after the initial `NEW` status.
- Administration interfaces for users or reference data.

## 4. Functional Requirements

- **FR-01:** The application shall load and display only active Development Requesters for Lab 2 testing.
- **FR-02:** The application shall require a selected Development Requester before Requester ticket screens can be used.
- **FR-03:** The application shell shall display the selected Requester and provide a Change Requester action.
- **FR-04:** The Create Ticket screen shall load active Categories and Related Systems from the backend.
- **FR-05:** The backend shall validate and create one Ticket for the selected Requester, generate its official Ticket Number, and return the saved representation.
- **FR-06:** The My Tickets screen shall retrieve only tickets owned by the selected Requester and support search, filters, sorting, and pagination.
- **FR-07:** The Ticket Detail screen shall return a ticket only when it belongs to the selected Requester.
- **FR-08:** A selected Requester shall add permitted attachments to an owned ticket after the ticket exists.
- **FR-09:** A selected Requester shall download an active attachment belonging to an owned ticket.
- **FR-10:** A selected Requester shall soft-remove an active attachment from an owned ticket with a recorded reason.
- **FR-11:** The UI shall provide clear loading, validation, submitting, success, empty, no-results, and safe failure states at all required viewports.

## 5. Business Rules

- **BR-01:** The official Ticket Number is generated only by the backend and is unique.
- **BR-02:** A newly created Ticket has `currentStatus = NEW`; Lab 2 does not expose later status transitions.
- **BR-03:** Development Requester selection is a test mechanism, not authentication or security.
- **BR-04:** Only active Requesters appear in the selector. An inactive Requester cannot be selected for a new Lab 2 context.
- **BR-05:** The client stores only the selected requester ID in local browser storage for the development session; it stores no credential or authorization token.
- **BR-06:** Changing Requester clears requester-specific screen state and reloads requester-scoped data.
- **BR-07:** Every requester-scoped API operation requires a requester ID. The backend validates ownership; the client-side selector alone is not trusted.
- **BR-08:** A request for another Requester's Ticket or Attachment returns a safe not-found response and does not disclose its existence.
- **BR-09:** Ticket Category and Related System must exist and be active when a Ticket is created.
- **BR-10:** Ticket Summary is trimmed, required, and must contain 5-120 characters after trimming.
- **BR-11:** Description is trimmed, required, and must contain 10-2,000 characters after trimming.
- **BR-12:** Requested Priority must be one of `LOW`, `MEDIUM`, `HIGH`, or `URGENT`.
- **BR-13:** The client prevents a repeated click while submission is busy. The backend also accepts one idempotency key per create attempt so a retried request cannot create a second Ticket.
- **BR-14:** The backend creates a Ticket and its official number in one database transaction. A temporary internal value, if required by the persistence strategy, is never returned to the client.
- **BR-15:** Permitted attachment MIME types are JPEG, PNG, WEBP, and PDF. The server validates the type independently of the filename extension.
- **BR-16:** Each attachment must not exceed 5 MB.
- **BR-17:** A Ticket may have at most five active attachments. Soft-removed attachments do not count toward this limit.
- **BR-18:** Files are stored with server-generated safe storage keys. Original filenames are treated as display/download metadata and are never used as server paths.
- **BR-19:** Attachment upload occurs after Ticket creation. If an upload fails, the saved Ticket remains, failed files have no usable metadata record, and the UI reports the file-specific failure with a retry path.
- **BR-20:** Only the owner of a Ticket may add, download, or remove its attachments.
- **BR-21:** Soft removal requires a trimmed reason of 5-250 characters and records the removal timestamp and selected Requester.
- **BR-22:** A soft-removed Attachment remains visible as metadata in Ticket Detail but cannot be downloaded or previewed.
- **BR-23:** My Tickets defaults to `createdAt desc`, then `id desc`, page 1, and page size 10. Permitted page sizes are 10, 20, and 50.
- **BR-24:** Search matches Ticket Number and Summary case-insensitively. Filters are exact Category, Related System, Requested Priority, and Current Status values.
- **BR-25:** The UI distinguishes an empty ticket list (no owned tickets) from no results after an active search or filter.
- **BR-26:** API failures preserve unsaved Create Ticket values and show a safe user-facing message without raw stack traces or browser network error text.
- **BR-27:** In Lab 3, real authenticated identity will replace the development requester context while the Ticket-to-Requester ownership relationship remains unchanged.
- **BR-28:** `requestedPriority` is a native enum declared in severity order: `LOW`, `MEDIUM`, `HIGH`, `URGENT`. When the user sorts by Requested Priority ascending, results use that severity order; descending reverses it.
- **BR-29:** `idempotencyKey` is a required client-generated UUID for `POST /api/tickets`. Reusing a key with the same normalized requester and Ticket payload returns the original Ticket; reusing it with a different normalized payload returns `409` and creates no Ticket.
- **BR-30:** Current Status remains a documented list filter for forward compatibility, but every Lab 2 Ticket is `NEW` and Lab 2 has no status transitions. Part 7 filter evidence must therefore demonstrate Category, Related System, and Requested Priority; status filtering is scaffolding for a later lab.

## 6. UI Specification Summary

The UI follows `docs/lab-02/ui-spec.md`. It uses the Zen Green palette, a shared application shell, labels above controls, field-level validation, visible focus, text-labelled buttons, and responsive layouts. Ticket Detail is read-only. Create Ticket, My Tickets, and Attachment components must expose their loading, failure, and disabled/busy states accessibly.

## 7. Data Changes

| Model | Key fields and relationships | Decision |
|---|---|---|
| `Requester` | `id`, `displayName`, unique `email`, `isActive`, timestamps; one-to-many Tickets | The persisted model represents the person who owns Tickets. Development selection is a client testing context, not a separate security model. |
| `Category` | existing `id`, unique `name`; add `isActive` | Existing Lab 1 reference data remains reusable while enabling active-only retrieval. |
| `RelatedSystem` | `id`, unique `name`, `isActive`, timestamps; one-to-many Tickets | Separates the affected product/device from the broad Category. |
| `Ticket` | `id`, unique `ticketNumber`, `requesterId`, `categoryId`, `relatedSystemId`, Summary, Description, `requestedPriority: RequestedPriority`, `currentStatus: NEW`, idempotency key, timestamps | `ticketNumber` is based on the saved numeric ID in a transaction, using `TT-YYYY-000001` format. `RequestedPriority` is a native enum declared `LOW`, `MEDIUM`, `HIGH`, `URGENT`, so severity sorting is deterministic. The unique ID supports a deterministic, backend-only official number. |
| `Attachment` | `id`, `ticketId`, safe storage key, original filename, MIME type, byte size, uploaded timestamp, removal fields | Soft removal is represented by nullable removal metadata; active queries use `removedAt IS NULL`. |

Required relationships are Requester 1-to-many Ticket, Ticket 1-to-many Attachment, Category 1-to-many Ticket, and RelatedSystem 1-to-many Ticket. The design uses unique constraints for Ticket Number, idempotency key, Requester email, and reference-data names. Indexes will support requester-scoped list queries ordered by creation time and filtered reference IDs.

### Seed Data

The repeatable seed contains the four existing Categories, at least six Related Systems (Email, Campus Wi-Fi, VPN, LEB2 App, Grade Submission App, and Corporate Laptop), four active Requesters, and one inactive Requester. It uses unique keys and upserts so rerunning it creates no duplicates.

## 8. API Contract Summary

The complete API contract is in `docs/lab-02/api-spec.md`. It covers active reference data, selected Requesters, Ticket creation and list/detail retrieval, attachment upload/metadata/download/soft removal, request validation, pagination, ownership, and safe errors.

## 9. Acceptance Criteria

- **AC-01:** Given active Requesters exist, when the selector loads, then it displays only active Requesters and explains that it is not a login screen.
- **AC-02:** Given no Requester is selected, when a user opens a requester ticket route, then the selector is shown instead of requester data.
- **AC-03:** Given valid Ticket data and an active selected Requester, when the form is submitted, then exactly one Ticket is saved with the matching `requesterId`, `NEW` status, and an official Ticket Number returned by the backend.
- **AC-04:** Given invalid Ticket data, when submission is attempted, then field-level messages appear and no create API request is made until the form is valid.
- **AC-05:** Given a repeated request with the same idempotency key, when Ticket creation is retried, then the existing Ticket result is returned and no duplicate Ticket is saved.
- **AC-06:** Given Requester A is selected, when My Tickets loads, then only Requester A's Tickets are visible; when Requester B is selected, A's Tickets are not visible.
- **AC-07:** Given owned tickets exist, when a valid search, filter, sort, or page parameter is used, then the API and UI show the matching requester-owned subset with correct metadata.
- **AC-08:** Given Requester B requests a Ticket or Attachment owned by Requester A, then the backend returns a safe not-found result and the UI reveals no Ticket data.
- **AC-09:** Given a valid permitted file and fewer than five active attachments, when it is uploaded to an owned Ticket, then active metadata is saved and displayed.
- **AC-10:** Given an invalid type, oversize file, sixth active file, or upload failure, when upload is attempted, then no invalid active Attachment is created and the UI shows a specific safe error.
- **AC-11:** Given an owned active Attachment, when the Requester provides a valid removal reason, then the Attachment is soft-removed, remains as removed metadata, and can no longer be downloaded or previewed.
- **AC-12:** Given desktop, tablet, and mobile viewports, when required screens render, then labels, controls, messages, and attachment names remain visible without overlap or horizontal page scrolling.

## 10. Definition of Done

- All approved Lab 2 scope and acceptance criteria are implemented without excluded Lab 3/IT Staff features.
- Prisma schema, migration, and idempotent seed implement the approved data design.
- API and UI conform to the approved contracts, including validation, ownership, error, loading, empty, and responsive behavior.
- Every acceptance criterion maps to at least one planned test; required unit, API, UI, style, responsive, and E2E tests pass from documented commands.
- No required test is skipped, disabled, or replaced by a false-green option.
- Visual screenshots and the visual checklist show desktop, tablet, and mobile quality.
- README, Lab 2 documents, reviewer record, and AI-use record are current.
- Each implementation Issue is merged through a peer-reviewed PR into `lab2-staging`; the integration is tested and a peer-reviewed release PR is merged into `main`.

## 11. Assumptions and Decisions

- The existing Lab 1 application is the starting point and `lab2-staging` branches from the current `main`.
- `Requester` is the persistent ownership model; the word Development describes the temporary selector workflow rather than a second user table.
- Ticket creation precedes attachment upload so a partial attachment failure can be reported and retried without losing a valid Ticket.
- Cross-requester access returns not found rather than forbidden to avoid confirming that another Requester's resource exists.
- Requested Priority is a native enum in severity order so the My Tickets sort has a defined user-facing order rather than alphabetical database ordering.
- Current Status is exposed as forward-compatible list-filter scaffolding, but only `NEW` exists in Lab 2. Required filter demonstrations use Category, Related System, and Requested Priority instead.
- A required idempotency key represents one normalized create payload. The browser keeps the same key for an unchanged retry and generates a new key when the user edits a create-request field. The server returns the saved result for an identical retry and rejects a different payload reusing that key.
- Exact visual spacing and component implementation may evolve, but must satisfy `ui-spec.md` and the Lab 2 visual checklist.
