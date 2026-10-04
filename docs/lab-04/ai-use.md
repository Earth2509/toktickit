# Lab 4 AI Use and Reflection

## Tools and roles

OpenAI Codex (GPT-5, reasoning level: high) is used as a specification and coding assistant. The student retains responsibility for requirements, design choices, review, commands, test outcomes and all repository changes.

## Recorded user prompts

Selected requests below are standardized English paraphrases of the workflow, not verbatim transcript quotations. Items 1-5 were recorded in the original contract; items 6-8 reflect the subsequent evidence/completion requests. They are not proof that every final deliverable is complete.

1. `Read the Lab 4 handout and explain the required work and submission evidence before implementation.`
2. `Draft a concise Lab 4 engineering contract for Actions Taken, dashboards, workflow, migration and final regression.`
3. `Define a secure authorization matrix for Requester, IT Staff and Administrator Action Taken access.`
4. `Create a planned-test table mapping every Lab 4 acceptance criterion to API, UI, integration and E2E coverage.`
5. `Review the proposed Actions Taken model for data preservation, idempotent seed behavior and stale-update handling.`

6. `Collect the remaining Lab 4 UI evidence, preserve complete screenshots, and identify states that cannot yet be captured.`
7. `Complete the remaining work and recheck the submission against the Lab 4 handout instead of claiming incomplete evidence is finished.`
8. `Add current-user Actions Taken to the Staff Dashboard, with session-based filtering, documented behavior and test coverage.`

## Verification approach

AI suggestions are treated as proposals. Requirements are checked against the Lab 4 handout, implementation is tested locally, and changes are peer-reviewed in Pull Requests before staged integration.

## My Reflection

Using a specification assistant helped me translate the handout into explicit requirements, authorization rules and acceptance criteria. The coding assistant supported implementation and test preparation, but I remained responsible for checking the behavior, running commands and responding to peer-review findings. The process showed why passing automated tests alone is not enough: a later handout audit identified the missing current-user Action preview, and live screenshot collection exposed a local database migration that had not been applied. I would improve the process by maintaining a requirement-to-evidence checklist from the start and verifying both the released branch and the actual demonstration environment before preparing the submission.

Authorship disclosure: this paragraph was drafted with AI assistance and reviewed and explicitly adopted by the student on 4 October 2026. The student's confirmation concerns this reflection, not a claim that all remaining submission requirements are complete.
