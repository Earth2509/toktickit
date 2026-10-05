# Focused evidence verification - 4 October 2026

## Developer-run results and source attribution

The first focused run reported three passes and one failure in 25.6 seconds. The failed case expected the wrong Administrator landing page; after that correction it waited for the wrong Ticket-detail API route. Both errors were in the new test, not application changes. The corrected fourth case subsequently passed alone: one test, one worker, 12.7 seconds. Thus all four cases have passed across separate runs; no combined four-test rerun is claimed.

These results belong to the local `feature/lab4-submission-completion` workspace and the corrected `e2e/lab-04/evidence-completion.spec.ts`, not the historical main run. The supplied summaries do not embed a commit SHA. Main verification remains separately recorded as server 134 passed / 8 skipped, client 41 passed, E2E 19 passed, and eight opt-in cases passed separately.

## Verified coverage and provenance

| Case | Passing assertions | Evidence qualification |
| --- | --- | --- |
| Staff Dashboard states | Loading announcement and busy state; both empty lists; safe forbidden message without Retry or metrics | Loading is a delayed real request. Empty and forbidden images use controlled browser response fixtures; they do not prove live database emptiness or backend authorization. |
| Pending Action save | Save and description controls disabled; safe failure; original unsaved description retained; Save re-enabled | A held POST is answered with a controlled 500. The draft is not stored. |
| Requester attention and ownership | Seeded waiting count is positive; drill-down total matches; Staff Dashboard returns 403; another Requester's Ticket returns 404 | Actual HTTP responses in the disposable `lab3_e2e` schema, not mocked responses. |
| Inactive assignee and unrelated Staff | Actual inactive account; correct Ticket Detail; no Edit/Complete controls; invalid Action POST returns 422 | Actual HTTP validation in the disposable schema. The non-performer/non-assignee image shows an existing completed Action; it does not alone prove restrictions on every Action status. |

Eight full-page PNGs are retained in `docs/lab-04/evidence/completion/`. Browser captures use 820 x 1180 and assert that document width does not exceed the viewport. Test screenshots are not live public-schema captures and are not relabelled as main-run images. No trace or credential-bearing session artifact is included in this evidence directory.

The real rejection assertions support API behavior; these summaries are not a verbatim API transcript. Existing main API tests separately cover Action permission rules and invalid assignees. Publication, final Project-board state and complete manual sign-off remain separate submission tasks.
