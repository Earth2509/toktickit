# Lab 3 AI Use and Reflection

Status: Living record started before implementation. Tool: OpenAI Codex. This session identifies the model as GPT-6; the exact UI-selected model variant and thinking-level setting have not been independently verified and are not invented here.

## Recorded user prompts

| ID | Actual user prompt | Purpose and observed result |
|---|---|---|
| P-01 | "นี่คืองานส่วนต่อไป" ("This is the next assignment"), with Lab_3_sheet.pdf | Read the assignment and explain scope, workflow, required evidence and the exact Answer Part 1-9 format. |
| P-02 | "เริ่มทำส่วนแรกได้" ("You can start the first part") | Inspect released Lab 2 main and draft the Sprint 3 engineering contract, UI/API decisions and planned-test traceability before implementation. |
| P-03 | "มีแก้ไข" ("There are requested changes") | Read @Nuggetkub's actual PR #35 review and revise role filtering, status policy, staff indication visibility, authentication feedback/limits, proxy transport and reproducible demo provisioning across the contract. |
| P-04 | "Approve และ Mergeแล้ว" ("Approved and merged") | Confirm that the reviewed engineering contract is accepted into `lab3-staging` before starting its dependent authentication foundation. |
| P-05 | "เริ่มทำส่วนถัดไปได้" ("You can start the next part") | Implement the scoped User migration, session/auth API, local-only fixtures, same-origin proxy transport and initial automated tests on a separate feature branch. |
| P-06 | "มีแก้ไข" ("There are requested changes") | Inspect the substantive review on PR #37, prevent the legacy requester directory from exposing privileged accounts, add real-database regression coverage, and reconcile runtime safeguards and documentation. |

English translations above describe the actual Thai prompts; they are not presented as original English quotations. Six genuine prompts are recorded so far, which meets the required 6-10 example range. Add only genuine later prompts when they materially improve the final evidence; do not fabricate historical prompts.

## Specification-agent contribution

Read the Lab 3 handout and existing Lab 2 models/contracts. Proposed explicit Admin permissions, a status transition matrix, session revocation and CSRF behavior, safe migration with preserved IDs/files, and planned tests. Mockup email-reset/Service Actions controls were excluded because written scope excludes them.

## Coding-agent contribution

Implemented the initial authentication foundation from the reviewed contract: a preserving Requester-to-User migration, normalized-email collision preflight, one-time migrated-user provisioning, role/session model, versioned Node scrypt password helper, opaque session cookie and HMAC CSRF token, safe login failures/rate limits, logout/current-user/password-change endpoints, local-only demo fixtures, Vite `/api` proxy configuration and migration/API/unit test scaffolding. The agent kept the existing Lab 2 resource routes unchanged in this increment because their identity migration is intentionally paired with login UI and regression tests in the next issue. It then used a project-scoped virtual drive to work around the isolated Windows parent-directory restriction and captured real successful server, client, migration/seed and Lab 2 E2E regression results. An initially over-strict API body assertion, SERIAL sequence setup in the disposable migration fixture, a broad E2E detail locator, and async Express error propagation were corrected from actual failures before the final passing runs.

## My Reflection

Pending the student's own reflection after implementation and review. Useful prompts for that reflection: which AI assumption required correction; which test found a genuine defect; how specification work changed implementation; and which result was independently verified. These are reflection questions, not a fabricated student statement.
