# Lab 2 AI Use and Reflection

**AI tool:** OpenAI Codex (GPT-5)  
**Thinking level:** Medium  
**Student responsibility:** The student reviews, corrects, approves, and remains responsible for every specification, decision, code change, test, migration, command, and submission artifact.

## Selected Prompts and Use

| # | Prompt purpose | How the result is reviewed or used |
|---|---|---|
| 1 | Interpret the Lab 2 stakeholder request and list the included and excluded product scope. | Reviewed against the labsheet; real authentication and IT Staff features remain excluded. |
| 2 | Convert the stakeholder request into numbered functional requirements, business rules, acceptance criteria, and a Definition of Done. | The resulting contract is checked for testability, ownership behavior, attachment lifecycle, and internal consistency. |
| 3 | Propose a Prisma data model for Requesters, Tickets, Attachments, Related Systems, and repeatable seed data. | Field names, relationships, constraints, indexes, migration impact, and Lab 3 evolution are reviewed before implementation. |
| 4 | Design a safe REST API contract for requester-scoped ticket creation, list/detail retrieval, upload, download, and soft removal. | Request/response shapes, status codes, validation, pagination, and ownership errors are documented in `api-spec.md`. |
| 5 | Produce a Test-DD plan that maps every acceptance criterion to unit, API, UI, style, responsive, or E2E tests. | Planned scenarios, file paths, commands, and final-results rules are reviewed before tests are written. |
| 6 | Define a reusable Zen Green UI specification for Requester selection, Create Ticket, My Tickets, Ticket Detail, and Attachments. | Tokens, component states, accessibility, and viewport rules are reviewed against the Lab 2 requirements. |
| 7 | Audit the Engineering Contract for ambiguity, missing business rules, conflicts, dependencies, and an implementation order. | Findings are resolved in the documents before implementation Issues begin. |

## My Reflection

Using an AI agent is most valuable when each prompt names the active Issue, constraints, expected evidence, and acceptance criteria. The agent helps expose missing decisions, but it cannot replace reviewing the specification, running tests, inspecting the UI, or obtaining a real peer approval. For Lab 2, I will treat the documents as a contract and will not claim a feature is complete until its required evidence is present on the final main branch.
