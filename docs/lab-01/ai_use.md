# Lab 1 — AI Use and Reflection

**LLM/agent used:** Antigravity Coding Agent (Gemini 3.6 Flash / High Thinking Level)

## Selected key prompts (6–10)

| # | Prompt (summarised) | What I did with the result |
|---|---------------------|----------------------------|
| 1 | Read and explain TokTickIT requirements and create an implementation plan | Reviewed the generated implementation plan covering architecture, database, API, UI, and tests. Approved the plan to proceed. |
| 2 | Initialize project Git repository and branch structure (`main`, `lab1-staging`, feature branches) | Executed Git commands to set up the repository workflow as specified by the project branch model. |
| 3 | Define Prisma `Category` and `Ticket` schema with relations and constraints | Updated `server/prisma/schema.prisma` and generated Prisma Client. |
| 4 | Create idempotent Prisma seed script for IT request categories and sample tickets | Implemented `server/prisma/seed.ts` using `upsert` and verified that running the seed multiple times produces no duplicate rows. |
| 5 | Implement REST API endpoints for categories and tickets (`GET`, `POST`, `PATCH`) | Updated `server/src/app.ts` to return HTTP status codes and JSON data with proper validation and error handling. |
| 6 | Write Supertest test cases for health check, category list, and ticket REST API endpoints | Created test suites under `server/tests/lab-01/` and ran Vitest to verify green status. |
| 7 | Create `api.ts` wrappers and React components (`TicketList`, `TicketDetailView`, `CreateTicketModal`) | Built component hierarchy and state management in `client/src/` for managing IT service desk requests. |
| 8 | Write Vitest & Testing Library tests for React UI components | Created test suites under `client/tests/lab-01/` mocking API calls and verified component rendering and modal interactions. |

## Reflection

Using the AI agent accelerated full-stack setup, database ORM migration, component design, and test suite generation significantly. Providing explicit constraints—such as specifying exact JSON schema keys, component interaction logic, and idempotent database seeding rules—ensured the agent produced precise, production-ready code on the first attempt without unnecessary bloat.
