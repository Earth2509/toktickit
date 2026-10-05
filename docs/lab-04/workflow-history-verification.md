# Supplemental real-database workflow history verification

Status, 5 October 2026: implemented and TypeScript-checked; passing execution still pending. This is a submission-branch supplement, not a new main result.

The live TT-2026-000021 snapshot proves the recorded chain but has no successful before-query. The added opt-in test addresses that distinct evidence gap without modifying public data.

## Scope and safety

`npm --prefix server run test:lab4-history` reads the configured local PostgreSQL connection, forces a freshly generated `lab4_history_test_<12 hex characters>` schema and runs `server/tests/lab-04/workflow-history.integration.test.ts`. Both runner and test reject remote hosts and invalid schemas. The test checks the actual current schema. It creates rather than resets a schema, and drops only the validated schema it successfully created. It never changes the public demonstration Ticket or existing accounts.

## Planned assertions

| Check | Real database/API assertion |
| --- | --- |
| Pre/post preservation | Two real Staff status PATCHes each append exactly one event; every field of all earlier event rows is equal to its prior snapshot. |
| Version and actor chain | OPEN/1 -> IN_PROGRESS/2 -> WAITING_FOR_REQUESTER/3; actor is the authenticated Staff account and Ticket owner remains unchanged. |
| Ordering and repeatability | Chronological query orders by createdAt then ID; deliberately equal baseline timestamps exercise the ID tie-breaker; a repeated read returns identical rows. This demonstrates the database evidence query, not an unimplemented UI history endpoint. |
| Rejected writes | A stale Staff write returns 409 and a Requester write returns 403; neither changes event rows, final status or version. |

The fixture uses two explicitly labelled baseline events. They are setup data, not prior application writes. Only the following STATUS_CHANGED events are created by the real application API. Equality covers complete Prisma event rows, not the physical PostgreSQL/WAL bytes. It does not prove a database trigger prevents every direct privileged SQL update.

## Execution record

Assistant-side `node node_modules/typescript/bin/tsc --noEmit` passed in server on 5 October. Vitest execution stopped before collection with sandbox EPERM resolving `node_modules/vitest/dist/spy.js`; no schema was created and no passing test is claimed.

The developer subsequently supplied a routine server summary: 25 files passed / 6 skipped, 134 tests passed / 9 skipped, start 12:13:53, duration 8.89s. That result is from the local submission workspace without an embedded SHA. It includes this new opt-in case as skipped and therefore does not verify the history assertions. A dedicated passing run is still required before this evidence gap is closed.
