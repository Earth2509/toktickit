# Authorized live Ticket lifecycle — 4 October 2026

The student explicitly authorized completion of the remaining OPEN Action and Resolve → Close → Reopen on **TT-2026-000021**, the existing isolated local demonstration fixture. The assistant used the existing System Administrator browser session at localhost:5173, viewport 614 × 507. No credentials, accounts, other Tickets, owner or priority were changed. These are actual persisted local UI operations, not intercepted API responses or an automated test rerun.

## Recorded sequence

| Step | Actual observation | Full original screenshot |
| --- | --- | --- |
| Complete remaining OPEN Action | COMPLETED, result recorded, completion displayed 4 Oct 2026 15:34; original performer/assignee stayed Kamon | [Action completed](evidence/main/workflow-action-completed-live.jpg) |
| OPEN → RESOLVED | RESOLVED badge; owner/priority disabled; Add action absent | [Resolved](evidence/main/workflow-resolved-live.jpg) |
| RESOLVED → CLOSED | CLOSED badge; operational edits remain disabled; REOPENED offered with Reason | [Closed](evidence/main/workflow-closed-live.jpg) |
| Try Reopen without Reason | `Provide a reason of 5 to 250 characters.`; status remains CLOSED | [Reason validation](evidence/main/workflow-reopen-reason-validation-live.jpg) |
| CLOSED → REOPENED with Reason | REOPENED badge; owner/priority and Add action enabled again | [Reopened](evidence/main/workflow-reopened-live.jpg) |
| REOPENED → OPEN; try RESOLVED using earlier completion | `Complete a new Action Taken after the latest reopening before resolving this Ticket.`; status stays OPEN | [Post-reopen safeguard](evidence/main/workflow-post-reopen-resolution-denied-live.jpg) |

The last rejection used the persisted non-empty resolution summary; it was not a missing-summary error. Reload after rejection confirmed OPEN and no page-level horizontal overflow. The final fixture has three Actions: two COMPLETED, one CANCELLED, no new Action created. It remains owned by Kamon, with LOW priority. No comments or internal notes were posted.

Result entered: “Local Lab 4 demonstration: the remaining diagnostic Action is complete. No follow-up is required for this isolated fixture.”

Resolution summary entered: “Local Lab 4 workflow evidence: both diagnostic Actions are completed with no follow-up required; the optional Action was cancelled. The isolated demonstration Ticket is resolved.” This summary remains stored from the earlier successful resolution and does not imply the final OPEN Ticket is currently resolved.

Reopen reason entered: “Reopened only to verify the Lab 4 post-reopen resolution safeguard on this authorized local demonstration fixture.”

All six full-page JPEG originals were opened for visual inspection and retained uncropped and unstretched. They are tall pages; final PDF layout must preserve aspect ratio and provide readable full-image presentation, not thin stretched thumbnails.

## Audit-history verification

The new read-only helper `server/scripts/verify-lab4-live-workflow.mjs` selects only the named fixture and its ordered Action/event records within a READ ONLY RepeatableRead transaction. Syntax checking passed. The assistant's initial database query failed with PrismaClientInitializationError and its empty output was removed. The developer subsequently ran the helper locally and supplied the actual output. The assistant parsed both the attachment and local output, confirmed they contain the same JSON data, and preserved the original local bytes in [the history snapshot](evidence/main/live-workflow-history-20261004.json). SHA-256: `E82342D8AD37158AD1B05AA932409EBE4E7DE9ECB8A86EA01AF4AEC59BB5436C`.

| Event ID | UTC timestamp, 4 October 2026 | Transition | Ticket version | Actor |
| --- | --- | --- | --- | --- |
| 9 | 08:34:31.486Z | OPEN → RESOLVED | 1 → 2 | 36, System Administrator |
| 10 | 08:34:41.104Z | RESOLVED → CLOSED | 2 → 3 | 36, System Administrator |
| 11 | 08:35:00.410Z | CLOSED → REOPENED | 3 → 4 | 36, System Administrator |
| 12 | 08:35:09.677Z | REOPENED → OPEN | 4 → 5 | 36, System Administrator |

The final stored status is OPEN, version 5, owner ID 32. Every status event increments the version exactly once and its before-state matches the previous after-state. All four retain owner 32 and LOW priority. The stored resolution summary matches the successful Resolve entry. Event 11 contains the supplied Reopen reason; event 12 also carries that same reason because the current form retained it. Do not present event 12 as a separately entered reason.

Action 3 completion is event 8, actor 36, OPEN/version 2 → COMPLETED/version 3, completedAt `2026-10-04T08:34:10.848Z`. Original performer and assignee remain 32. Action 1 remains COMPLETED/version 3; Action 2 remains CANCELLED/version 2. There are still exactly three Actions.

The completedAt of Action 3 precedes Reopen event 11, supporting the observed post-reopen rejection. No fifth Ticket-status mutation is present after the rejected re-resolution: final version stays 5 and event 12 is the last status event. The snapshot retains earlier Action events 1–7 and is ordered by createdAt then ID. This confirms the recorded chain and ordering in this snapshot, not a byte-for-byte pre/post comparison: the initial before-query failed. Database-wide append-only enforcement, repeated-read stability and absence of every possible unauthorized mutation are not independently established by this single snapshot.

Other outstanding visual states and final PDF assembly remain separate. This increment does not mark Issue #60 Done.
