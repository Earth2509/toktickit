# Lab 2 Test Plan and Results

**Status:** Planned before implementation  
**Related specification:** `docs/lab-02/specification.md`  
**Test status convention:** `Planned` becomes `Passed` only after the test runs successfully on the final `main` branch.

## 1. Test Strategy

Lab 2 uses Test-DD and TDD. The planned tests are derived from the approved acceptance criteria before implementation. API tests exercise Express routes with a mocked Prisma/storage boundary where appropriate. UI tests exercise user-visible states with React Testing Library and mocked API boundaries. Playwright E2E tests cover the integrated requester flow and responsive screenshots. Visual checks supplement, not replace, automated assertions.

E2E execution has an explicit infrastructure dependency: a dedicated Lab 2 Issue will add the root Playwright configuration, E2E command ownership, and the `e2e/lab-02/` directory before the E2E cases below are implemented. The cases are planned here but are not claimed runnable until that Issue is merged through the normal peer-reviewed workflow.

## 2. Planned Tests

| Test ID | Level | AC | Scenario and expected result | Planned test file | Final |
|---|---|---|---|---|---|
| UNIT-01 | Unit | AC-03 | Format the official Ticket Number from a saved ID; it follows `TT-YYYY-000001`. | `server/tests/lab-02/ticket-number.unit.test.ts` | Planned |
| UNIT-02 | Unit | AC-04 | Trim Summary/Description and reject values outside approved bounds. | `server/tests/lab-02/ticket-validation.unit.test.ts` | Planned |
| UNIT-03 | Unit | AC-10 | Accept only permitted MIME types and reject files over 5 MB. | `server/tests/lab-02/attachment-validation.unit.test.ts` | Planned |
| UNIT-04 | Unit | AC-11 | Active-attachment count ignores soft-removed metadata. | `server/tests/lab-02/attachment-rules.unit.test.ts` | Planned |
| API-01 | API | AC-01 | Active requester endpoint excludes inactive records. | `server/tests/lab-02/development-requesters.api.test.ts` | Planned |
| API-02 | API | AC-03 | Valid create returns 201, official number, `NEW`, and the selected requester ID. | `server/tests/lab-02/create-ticket.api.test.ts` | Planned |
| API-03 | API | AC-04 | Invalid summary, description, priority, Category, or Related System returns field-safe validation errors. | `server/tests/lab-02/create-ticket.api.test.ts` | Planned |
| API-04 | API | AC-05 | Same idempotency key returns the original Ticket without a duplicate record. | `server/tests/lab-02/create-ticket.api.test.ts` | Planned |
| API-05 | API | AC-06 | List query scopes all results to requester A; switching to requester B changes the result set. | `server/tests/lab-02/my-tickets.api.test.ts` | Planned |
| API-06 | API | AC-07 | Search, filter, sort, page, invalid query, and metadata behavior follow the contract. | `server/tests/lab-02/my-tickets.api.test.ts` | Planned |
| API-07 | API | AC-08 | Owned detail succeeds; cross-requester Ticket retrieval returns safe 404. | `server/tests/lab-02/ticket-detail.api.test.ts` | Planned |
| API-08 | API | AC-09 | Valid upload stores active metadata for an owned Ticket. | `server/tests/lab-02/attachments.api.test.ts` | Planned |
| API-09 | API | AC-10 | Invalid type, oversize file, sixth active attachment, and cross-owner upload fail safely. | `server/tests/lab-02/attachments.api.test.ts` | Planned |
| API-10 | API | AC-11 | Soft removal records the reason, retains metadata, and blocks removed download. | `server/tests/lab-02/attachments.api.test.ts` | Planned |
| UI-01 | UI | AC-01, AC-02 | Selector has loading, empty, failure, keyboard, and continue behavior. | `client/tests/lab-02/RequesterSelector.test.tsx` | Planned |
| UI-02 | UI | AC-03, AC-04 | Create Ticket renders reference data, field errors, busy state, success number, and disabled submit behavior. | `client/tests/lab-02/CreateTicketForm.test.tsx` | Planned |
| UI-03 | UI | AC-10 | Invalid attachment feedback names every rejected file with its type or size reason, while permitted files remain selected. | `client/tests/lab-02/CreateTicketForm.test.tsx` | Planned |
| UI-04 | UI | AC-06, AC-07 | My Tickets reloads after Requester change and renders loading, empty, no-results, filters, sort, and pagination. | `client/tests/lab-02/MyTickets.test.tsx` | Planned |
| UI-05 | UI | AC-08, AC-11 | Detail shows owned data, removed metadata, blocked download, and safe cross-owner failure. | `client/tests/lab-02/RequesterTicketDetail.test.tsx` | Planned |
| UI-06 | UI style | AC-12 | Required labels, asterisks, status/busy states, focusable controls, and Zen Green classes/tokens are asserted. | `client/tests/lab-02/ZenGreenStyles.test.tsx` | Planned |
| E2E-01 | E2E | AC-01, AC-03 | Select Requester A, create a Ticket, and see its official number and saved values. | `e2e/lab-02/requester-ticket-flow.spec.ts` | Planned |
| E2E-02 | E2E | AC-06, AC-07 | Change to Requester B, verify A's tickets disappear, then search/filter/page B's list. | `e2e/lab-02/my-tickets.spec.ts` | Planned |
| E2E-03 | E2E | AC-09, AC-11 | Upload a permitted Attachment, download it, soft-remove it, and verify download is blocked. | `e2e/lab-02/attachments.spec.ts` | Planned |
| E2E-04 | Responsive | AC-12 | Capture Create, List, and Detail at desktop, tablet, and mobile; verify no horizontal page overflow. | `e2e/lab-02/responsive-visual.spec.ts` | Planned |

## 3. Acceptance-Criterion Traceability

| Acceptance Criterion | Planned tests |
|---|---|
| AC-01 | API-01, UI-01, E2E-01 |
| AC-02 | UI-01 |
| AC-03 | UNIT-01, API-02, UI-02, E2E-01 |
| AC-04 | UNIT-02, API-03, UI-02 |
| AC-05 | API-04 |
| AC-06 | API-05, UI-04, E2E-02 |
| AC-07 | API-06, UI-04, E2E-02 |
| AC-08 | API-07, API-09, UI-05 |
| AC-09 | API-08, E2E-03 |
| AC-10 | UNIT-03, UNIT-04, API-09, UI-03 |
| AC-11 | UNIT-04, API-10, UI-05, E2E-03 |
| AC-12 | UI-06, E2E-04 |

## 4. Responsive and Visual Checklist

- Desktop at 992 px or wider uses the documented multi-column layout and sensible maximum content width.
- Tablet from 768-991 px preserves readable Summary and Description space without clipped controls.
- Mobile below 768 px stacks fields, keeps touch targets usable, and has no horizontal page scrolling.
- Labels, required markers, field-level errors, button hierarchy, busy states, disabled controls, badges, and attachment names remain visible.
- Screenshots are stored under `artifacts/lab-02/screenshots/create-ticket/`, `my-tickets/`, and `ticket-detail/`.

## 5. Test Commands

```bash
cd server && npm test
cd ../client && npm test
cd .. && npx playwright test e2e/lab-02
```

The final report will include complete passing unit, API, and UI terminal output from `main`, plus the E2E command result and responsive screenshots.

## 6. Final Results

Implementation evidence is recorded here as each Issue is verified. A test remains `Planned` in the table above until its peer-approved work is integrated and rerun on the final `main` branch.

### Issue #13 Feature-Branch Verification

On 27 August 2026, the Requester foundation was verified on `feature/lab2-requester-foundation` before peer review:

- `cd server && npm test`: 3 test files and 5 tests passed, including `server/tests/lab-02/development-requesters.api.test.ts`.
- `cd server && npm run build`: passed.
- `cd client && npm test`: 2 test files and 4 tests passed, including `client/tests/lab-02/RequesterSelector.test.tsx`.
- `cd client && npm run build`: passed.

These results are feature-branch evidence only. The related final table entries remain `Planned` until the peer-approved work is integrated and rerun on `main`.

### Issue #13 Review-Follow-Up Verification

On 28 August 2026, the Prisma migration was verified against the isolated
`lab2_migration_check` schema, separate from the local application schema:

- `npx prisma migrate reset --force --skip-generate` applied both migrations from an empty schema, including `20260827090000_lab2_requester_foundation`.
- `npm run prisma:seed` completed twice against that schema without duplicate records.
- The resulting counts were 4 Categories, 4 active Requesters, 1 inactive Requester, and 6 Related Systems.
- `cd server && npm test`: 3 test files and 5 tests passed; `npm run build` and `npx prisma validate` passed.
- `cd client && npm test`: 2 test files and 4 tests passed; `npm run build` passed.

The migration verification and all test results above were feature-branch evidence at the time of review. Issue #13 was subsequently approved and merged into `lab2-staging` through PR #21; final `main` verification remains part of the release Issue.

### Issue #14 Feature-Branch Verification

On 28 August 2026, Ticket creation was verified on `feature/lab2-ticket-create-api` before peer review:

- `cd server && npm test`: 6 test files and 20 tests passed. This includes `ticket-number.unit.test.ts`, `ticket-validation.unit.test.ts`, and `create-ticket.api.test.ts`, including the idempotency-race, oversized JSON, and safe-error-response cases added during peer review.
- `cd server && npm run build`: passed.
- `cd server && npm run prisma:validate`: passed.
- In isolated PostgreSQL schema `lab2_ticket_create_check`, `npx prisma migrate reset --force --skip-generate` applied all three committed migrations, including `20260828150000_lab2_ticket_creation`.
- `npm run prisma:seed` completed twice against the isolated schema without duplicate reference data.

This is feature-branch evidence only. The Issue #14 entries remain `Planned` until the peer-approved work is integrated and rerun on the final `main` branch.

### Issue #15 Feature-Branch Verification

On 29 August 2026, the Create Ticket screen was verified on
`feature/lab2-create-ticket-ui` before peer review:

- `cd client && npm test`: 3 test files and 9 tests passed. The five new
  `client/tests/lab-02/CreateTicketForm.test.tsx` cases cover local required
  field validation, a successful create request, recoverable API failure with
  preserved inputs and selected valid files during retry, mixed attachment
  selection with named type/size rejection reasons, and an overlong Summary.
- `cd client && npm run build`: passed.
- The screen loads active Categories and Related Systems, holds a Requester as
  a read-only value, generates an idempotency key for a create attempt,
  disables the submit action while it is busy, and shows only the
  backend-generated Ticket Number and Ticket Date after a successful response.

This is feature-branch evidence only. The Issue #15 entries remain `Planned`
until the peer-approved work is integrated and rerun on the final `main`
branch.

### Issue #16 Feature-Branch Verification

On 29 August 2026, the My Tickets API was verified on
`feature/lab2-my-tickets-api` before peer review:

- `cd server && npm test`: 8 test files and 32 tests passed. The new
  `ticket-query.unit.test.ts` and `my-tickets.api.test.ts` cases cover
  requester ownership, validation, search, Category, Related System, priority
  and status filters, deterministic sorting, pagination, empty results, and
  safe unavailable-requester or database responses.
- `cd server && npm run build`: passed.
- The endpoint defaults to `createdAt desc`, then `id desc`; pagination accepts
  only page sizes 10, 20, or 50; and Requested Priority sorting uses the native
  PostgreSQL enum sequence `LOW`, `MEDIUM`, `HIGH`, `URGENT`.

This is feature-branch evidence only. The Issue #16 entries remain `Planned`
until the peer-approved work is integrated and rerun on the final `main`
branch.

### Issue #17 Feature-Branch Verification

On 29 August 2026, the My Tickets screen was verified on
`feature/lab2-my-tickets-ui` before peer review:

- `cd client && npm test`: 4 test files and 15 tests passed. The new
  `MyTickets.test.tsx` coverage checks requester-scoped rendering, search and
  filter requests, sorting, pagination reset, empty and no-results states,
  safe API failure feedback, and Requester switching without stale Tickets.
- `cd client && npm run build`: passed.
- The responsive list provides an accessible table on desktop and labelled
  ticket cards on narrow screens, while My Tickets excludes detail-only ticket
  descriptions from the rendered list response.

This is feature-branch evidence only. The Issue #17 entries remain `Planned`
until the peer-approved work is integrated and rerun on the final `main`
branch.

## 7. Known Limitations or Deferred Tests

Real authentication and IT Staff workflows are intentionally deferred to later labs. They are not substitutes for Lab 2 ownership tests; requester ownership is still enforced by the backend using the selected development requester ID.
