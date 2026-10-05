# Remaining visual evidence: focused browser run

Current status: the original four focused cases passed across separate developer runs. The added three long-content/keyboard cases and same-Ticket privacy case passed in a four-case run; the final three Action keyboard cases passed separately in 17.0s. See [focused verification](evidence-completion-verification.md), [follow-up record](final-evidence-follow-up.md) and [final checklist](final-checklist-verification.md). The assistant's earlier blocked attempts below are retained as history. Existing preserved main verification (134 server tests, 41 client tests, 19 E2E tests, and eight separately passing opt-in cases) remains a separate record.

Source: `e2e/lab-04/evidence-completion.spec.ts`, submission-completion branch. The file now discovers ten supplemental cases (four original, three long-content and three final Action keyboard); the privacy check is in `e2e/lab-03/role-workflows.spec.ts`. No combined eleven-case run is claimed, and these additions are not relabelled as part of the historical 19-test main run.

## Historical first developer run and correction

The developer reported three passing cases and one failing case (25.6 seconds). The local error context shows the fourth case stopped at sign-in: it expected the Administrator's landing heading to be `Ticket Queue`, while the actual screen was `User Management`. `client/src/App.tsx` confirms that Administrator sessions initialize to the Users view. The test now expects `User Management`; application behavior was not changed. Inactive-assignee and unrelated-Staff assertions have not yet been reached or verified by this run. Seven screenshots from the three successful cases have been preserved under `evidence/completion/`, pending visual inspection and report inclusion. Re-run the corrected fourth case before claiming four passes.

## Run from the user's Command Prompt

The next developer run passed Administrator sign-in and reached Staff Ticket Detail, but timed out awaiting a nonexistent `GET /api/staff/tickets/:id` response. The actual client calls the shared `GET /api/tickets/:id` route. The test now matches that exact pathname and GET method, imposes a ten-second response timeout, and verifies HTTP 200 and the expected Ticket number before checking Action controls. This is another test correction, not an application change or a passing inactive-assignee result.

Run each line separately:

```bat
cd /d "C:\Users\ASUS\Documents\Codex\2026-08-12\github\lab4-engineering-contract"
set E2E_SKIP_PRISMA_GENERATE=true
set PLAYWRIGHT_BROWSERS_PATH=C:\Users\ASUS\AppData\Local\ms-playwright
npm run e2e -- e2e/lab-04/evidence-completion.spec.ts
```

The standard runner starts its own API/client on ports 3001/4173 and resets only the disposable `lab3_e2e` schema. It reads the connection from `server/.env` unless an environment override is present. Do not set server reuse, point the test runner at the public app, or replace the schema guard. Keep the development server on 3000 and browser on 5173 separate. Skipping Prisma generation avoids replacing a DLL held by that development server; the current generated client must already match the schema.

## Evidence and limits

| Test | Evidence | Attribution |
| --- | --- | --- |
| Staff Dashboard states | Loading; completely empty; forbidden | Loading delays a real request. Empty and forbidden screenshots use controlled response fixtures, not live database/API proof. |
| Action pending save | Disabled controls; safe failure; preserved draft | Controlled pending POST followed by a synthetic 500; no Action is stored. |
| Requester attention | Nonzero waiting card; matching list; role and ownership denial | Real seeded disposable-database responses, including Staff Dashboard 403 and another Requester's Ticket 404. |
| Inactive assignee / role controls | Existing Action read-only for unrelated Staff; inactive-assignee rejection | Real disposable-database invalid POST expected to return 422; no invalid Action should be written. |

Full-page screenshots and JSON attachments are produced under `artifacts/lab-03/test-results/`; the legacy report path is `artifacts/lab-03/playwright-report`. Inspect the outputs before copying selected evidence into the report. Do not commit traces, session data or the whole artifact directory.

After a passing run, review all new screenshots, preserve their provenance, update the report and checklist only for verified cases, and re-render/inspect the PDF. Final publication and Issue #60 completion remain pending until those steps and the remaining sign-off checks are complete.
