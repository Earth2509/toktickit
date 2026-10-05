# Final evidence follow-up - 5 October 2026

Direct main links precede all six documents; unpublished local revisions remain labelled. Verified DoD items and Dashboard states are signed off with evidence, not blanket completion.

## Verified additional checks

The developer reported four passes, one worker, 22.6 seconds on 5 October. One existing privacy case captures Staff-visible notes and Requester-hidden notes on Ticket TT-2026-000003: the Requester sees the public reply, but not the private note or Internal Notes heading. The real private-notes endpoint returns 403 without disclosing the note. The same case verifies another Requester's Ticket and attachment return 404. These are real disposable-database responses, not route fixtures.

Three viewport cases passed keyboard Tab/Shift+Tab and Enter drill-down, then displayed long Action descriptions, results, follow-up and attachment notes. Page-level and field-internal overflow assertions passed. All five full images were visually inspected: no observed text clipping or overlap in the captured states. Desktop is 1440 x 900, tablet 820 x 1180, mobile 390 x 844; privacy captures use the default 1280 x 720 viewport. Long text is a controlled read-response fixture, never persisted. It proves rendering, not real stored work.

This focused submission-workspace run used port 18173 and has no embedded SHA. The subsequent three-case final Action checklist passed in 17.0 seconds; its evidence is recorded separately. The client regression rerun subsequently passed 41/41 and the production build passed on 5 October. Publication and final board sign-off remain pending.
