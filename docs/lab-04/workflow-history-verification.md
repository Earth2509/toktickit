# Supplemental real-database workflow history verification

Status, 5 October 2026: passed in the developer's dedicated local run, one file / one test, start 12:24:00, duration 3.98s. This is a submission-branch supplement, not a new main result.

The live TT-2026-000021 snapshot proves the recorded chain but has no successful before-query. The added opt-in test addresses that distinct evidence gap without modifying public data.

## Scope and safety

`npm --prefix server run test:lab4-history` reads the configured local PostgreSQL connection, forces a freshly generated `lab4_history_test_<12 hex characters>` schema and runs `server/tests/lab-04/workflow-history.integration.test.ts`. Both runner and test reject remote hosts and invalid schemas. The test checks the actual current schema. It creates rather than resets a schema, and drops only the validated schema it successfully created. It never changes the public demonstration Ticket or existing accounts.

## Assertions verified by the passing case

| Check | Real database/API assertion |
| --- | --- |
| Pre/post preservation | Two real Staff status PATCHes each append exactly one event; every field of all earlier event rows is equal to its prior snapshot. |
| Version and actor chain | OPEN/1 -> IN_PROGRESS/2 -> WAITING_FOR_REQUESTER/3; actor is the authenticated Staff account and Ticket owner remains unchanged. |
| Ordering and repeatability | Chronological query orders by createdAt then ID; deliberately equal baseline timestamps exercise the ID tie-breaker; a repeated read returns identical rows. This demonstrates the database evidence query, not an unimplemented UI history endpoint. |
| Rejected writes | A stale Staff write returns 409 and a Requester write returns 403; neither changes event rows, final status or version. |

The fixture uses two explicitly labelled baseline events. They are setup data, not prior application writes. Only the following STATUS_CHANGED events are created by the real application API. Equality covers complete Prisma event rows, not the physical PostgreSQL/WAL bytes. It does not prove a database trigger prevents every direct privileged SQL update.

## Execution record

Assistant-side `node node_modules/typescript/bin/tsc --noEmit` passed in server on 5 October. The assistant's earlier Vitest execution stopped before collection with sandbox EPERM resolving `node_modules/vitest/dist/spy.js`; that attempt created no schema and is not a passing run.

The developer subsequently supplied a routine server summary: 25 files passed / 6 skipped, 134 tests passed / 9 skipped, start 12:13:53, duration 8.89s. That result includes this new opt-in case as skipped and does not itself verify the history assertions.

The requested dedicated run then passed: `tests/lab-04/workflow-history.integration.test.ts`, one file / one test, case duration 3472ms, file duration 3527ms, start 12:24:00, total duration 3.98s. The developer-supplied [result excerpt](evidence/build-output/submission-history-test-excerpt.txt) is preserved verbatim. It lists the complete passing case name and timing but does not include the command header, clean source SHA, randomly generated schema name or printed before/after JSON. No full transcript or terminal screenshot is fabricated from this excerpt.

This closes the supplemental pre/post preservation and repeated-read verification gap using the assertions in the unchanged test source from commits `6560f52` / `ac34d6d` on `feature/lab4-submission-completion`. The supplied output does not independently attest a clean checkout SHA. The passing assertions establish behavior for the isolated fixture, not database-wide immutability enforcement. The historical main totals remain unchanged. Peer review, publication and final main verification are still required.
