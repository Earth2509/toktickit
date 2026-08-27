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
| UI-02 | UI | AC-03, AC-04 | Create Ticket renders reference data, field errors, busy state, success number, and disabled submit behavior. | `client/tests/lab-02/CreateTicket.test.tsx` | Planned |
| UI-03 | UI | AC-10 | Invalid attachment feedback names the rejected file and successful files remain selected. | `client/tests/lab-02/CreateTicket.test.tsx` | Planned |
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

Implementation has not started. This section will be updated with actual file paths, test counts, terminal output, and `Passed` status only after the related tests run on `main`.

## 7. Known Limitations or Deferred Tests

Real authentication and IT Staff workflows are intentionally deferred to later labs. They are not substitutes for Lab 2 ownership tests; requester ownership is still enforced by the backend using the selected development requester ID.
