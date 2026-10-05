# Populated Requester evidence — 4 October 2026

The developer signed into the existing Anan Chaiyasit account. The assistant verified the Requester identity in the visible app and performed only navigation. No Ticket, Action, comment or attachment was created or changed. Credential entry and any prior password setup were performed by the developer, not captured or independently audited here.

Environment: local API port 3000 and Vite port 5173; released runtime lineage `7329652`, documentation baseline `55f8200`, submission branch. These live captures are not a new main test run. Original full-page screenshots were visually inspected without cropping or stretching.

| Evidence | Observed result | Original |
| --- | --- | --- |
| Populated Dashboard | Total Open 13, Waiting for You 0, Recently Updated 2, Recently Resolved 0; five recent Tickets ordered 21, 1, 18, 17, 16 | [Dashboard](evidence/main/requester-anan-populated-dashboard-live.jpg) |
| Recently Updated drill-down | Dashboard filter banner; exactly Tickets TT-2026-000021 and TT-2026-000001; footer 1–2 of 2, page 1 of 1 | [Filtered My Tickets](evidence/main/requester-anan-updated-two-drilldown-live.jpg) |
| Owned Ticket detail | TT-2026-000021 identifies Anan as Requester; OPEN; three Actions (two COMPLETED, one CANCELLED); read-only explanation and no Action mutation controls; public-comment and attachment sections remain available | [Ticket Detail](evidence/main/requester-anan-owned-detail-readonly-actions-live.jpg) |

## Independent database comparison verified

The developer ran the read-only metric helper for Anan and supplied its actual JSON output in chat. The [retained JSON transcription](evidence/main/live-requester-anan-dashboard-20261004.json) preserves the supplied values, with whitespace reformatted; it is not claimed to be a byte-identical original terminal file. Measurement: `2026-10-04T09:38:51.781Z` (16:38:51.781 Bangkok). Cutoff: `2026-09-04T09:38:51.781Z`. Active Requester ID 1 owns 13 Tickets.

| Measure | Live UI | Independent database | Result |
| --- | --- | --- | --- |
| Total Open | 13 | 13 | Matches |
| Waiting for You | 0 | 0 | Matches |
| Recently Updated | 2 | 2 | Matches |
| Recently Resolved | 0 | 0 | Matches |
| Recently Updated drill-down | TT-2026-000021, TT-2026-000001 | Only these two returned recent rows fall within the measured cutoff | Matches observed two-row result |

| Order | Visible Ticket number | Database ID | Requester ID | Status |
| --- | --- | --- | --- | --- |
| 1 | TT-2026-000021 | 21 | 1 | OPEN |
| 2 | TT-2026-000001 | 19 | 1 | NEW |
| 3 | TT-2026-000018 | 18 | 1 | NEW |
| 4 | TT-2026-000017 | 17 | 1 | NEW |
| 5 | TT-2026-000016 | 16 | 1 | NEW |

All five visible recent rows match the independently queried order. The three oldest rows share an updatedAt timestamp and are ordered by descending database ID. Ticket numbers are business identifiers, not database IDs: TT-2026-000001 has ID 19. The metric helper allows only the two observed identities and retains Aree as its default.

These UI and database observations were separate measurements, not an atomic snapshot. Agreement verifies this populated account at the recorded time, not every metric boundary or cross-requester authorization scenario.

No waiting-for-requester Ticket is present in this observed account; a populated attention-needed state is not claimed. Visible absence of Staff controls does not itself establish direct API authorization or prove Internal Notes exist and are hidden. Passing main role tests remain separate evidence. Issue #60 and final PDF/checklist remain incomplete.
