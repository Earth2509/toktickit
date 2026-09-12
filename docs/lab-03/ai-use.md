# Lab 3 AI Use and Reflection

Status: Living record started before implementation. Tool: OpenAI Codex. This session identifies the model as GPT-6; the exact UI-selected model variant and thinking-level setting have not been independently verified and are not invented here.

## Recorded user prompts

| ID | Actual user prompt | Purpose and observed result |
|---|---|---|
| P-01 | "นี่คืองานส่วนต่อไป" ("This is the next assignment"), with Lab_3_sheet.pdf | Read the assignment and explain scope, workflow, required evidence and the exact Answer Part 1-9 format. |
| P-02 | "เริ่มทำส่วนแรกได้" ("You can start the first part") | Inspect released Lab 2 main and draft the Sprint 3 engineering contract, UI/API decisions and planned-test traceability before implementation. |
| P-03 | "มีแก้ไข" ("There are requested changes") | Read @Nuggetkub's actual PR #35 review and revise role filtering, status policy, staff indication visibility, authentication feedback/limits, proxy transport and reproducible demo provisioning across the contract. |

English translations above describe the actual Thai prompts; they are not presented as original English quotations. The final submission requires 6-10 selected real prompts. Only three are recorded so far. Add genuine later implementation/review/verification prompts as the sprint progresses; do not fabricate historical prompts to meet the count.

## Specification-agent contribution

Read the Lab 3 handout and existing Lab 2 models/contracts. Proposed explicit Admin permissions, a status transition matrix, session revocation and CSRF behavior, safe migration with preserved IDs/files, and planned tests. Mockup email-reset/Service Actions controls were excluded because written scope excludes them.

## Coding-agent contribution

Not started. This first change is documentation only. Track meaningful implementation decisions, test results, corrections and limitations in later PRs. Do not report product completion from this contract alone.

## My Reflection

Pending the student's own reflection after implementation and review. Useful prompts for that reflection: which AI assumption required correction; which test found a genuine defect; how specification work changed implementation; and which result was independently verified. These are reflection questions, not a fabricated student statement.
