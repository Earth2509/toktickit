# Requester metric comparison — 4 October 2026

The student signed into Aree Chaiyasit's existing Requester account. The assistant verified the visible role/name, opened Dashboard and observed four zero cards with `You have no Tickets yet.` Existing genuine empty-state images already cover this screen; no duplicate screenshot or new Ticket was created.

An attempt to open the documented Staff Dashboard GET endpoint in a temporary browser tab was blocked by the browser (`ERR_BLOCKED_BY_CLIENT`) before any API response could be observed. It is not a backend 403, authorization-bypass demonstration or screenshot of forbidden UI. Do not use it as such. Actual role-denial cases are present in the passing main Dashboard API log, separately attributed as automated test evidence.

## Independent database comparison verified

The new helper `server/scripts/verify-lab4-live-requester-dashboard.mjs` selects the exact observed active Aree Requester account, uses a READ ONLY RepeatableRead transaction and calculates the documented four owner-scoped metrics plus owned total and five ordered recent rows. It prints measurement/cutoff timestamps, not credentials or browser tokens. It does not authenticate as the user or reset/modify the database. Syntax checking is separate from successful query execution.

The developer ran the helper locally and supplied the actual output. Its unchanged original is retained as [live-requester-dashboard-20261004.json](evidence/main/live-requester-dashboard-20261004.json). Measurement time: `2026-10-04T09:09:39.513Z` (16:09:39.513 Bangkok); rolling-window cutoff: `2026-09-04T09:09:39.513Z`. The returned identity is active Requester Aree Chaiyasit, user ID 27.

| Measure | Observed Dashboard | Independent database result | Comparison |
| --- | --- | --- | --- |
| Open Tickets | 0 | 0 | Matches |
| Waiting for Requester | 0 | 0 | Matches |
| Recently Updated | 0 | 0 | Matches |
| Recently Resolved | 0 | 0 | Matches |
| Recent Tickets | Empty, with no-Tickets message | `[]` | Matches |
| Total owned Tickets | Not a separate Dashboard card | 0 | Supports the genuine empty state |

SHA-256 of the preserved JSON: `6D9AE495EEFD2D16B40AFC15EC58ADABDDC8CB21B8DB18DD34889FD8A8E83E0D`.

This verifies the observed zero-data Dashboard for this account. It does not independently prove populated metrics, cross-requester authorization, or every time-window boundary. The browser observation and database read were separate measurements, not an atomic UI/database snapshot. Requester populated recent/attention-required Tickets, remaining role/feedback screenshots and final PDF/checklist remain separate requirements. Issue #60 remains open.
