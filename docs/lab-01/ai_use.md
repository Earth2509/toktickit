# Lab 1 - AI Use and Reflection

**Agent used:** Codex desktop, assisted by GPT-5.
**Scope of this record:** all four Lab 1 Issues and the final release review.

| Prompt purpose | Selected prompt | Reflection |
|---|---|---|
| Understand the contract | Read the Lab 1 requirements and summarize the four Issues, dependencies, required branches, and evidence. | A clear dependency order kept the work on the required feature branches. |
| Set up project foundation | Set up React, TypeScript, Vite, Bootstrap, Express, TypeScript, PostgreSQL, and Prisma without adding later feature behavior. | Narrow scope avoided implementing features before their Issues were ready. |
| Implement health check | Add GET /api/health, a Supertest test, and a React system-status call with a useful offline state. | The first implementation needed follow-up review to distinguish connection errors from server responses. |
| Seed categories | Create the Prisma Category model, migration, and idempotent seed for the four required request categories. | Upsert made the seed safe to run repeatedly. |
| Display category list | Add GET /api/categories through Prisma, then render the API result with loading and error states. | Routed fetch mocks were necessary because the screen calls both health and category endpoints. |
| Fix review feedback | Address PR #8 feedback about readable formatting, accessibility status roles, and friendly network errors. | A regression test with TypeError(Failed to fetch) prevents raw browser errors from reaching users. |
| Prepare release evidence | Update test results, peer-review records, and the release PR from lab1-staging to main. | Evidence must record actual test output and reviews rather than planned or template content. |

## Reflection

Using small, issue-scoped prompts made it easier to review every change against the acceptance criteria. Peer review was especially useful for finding gaps that a happy-path implementation missed: a blanket fetch mock hid an invalid category payload, and displaying caught error text leaked a browser network message. I improved subsequent prompts by specifying the failure mode, required test evidence, branch target, and documentation update. I reviewed generated code, commits, and PR feedback before accepting each change.
