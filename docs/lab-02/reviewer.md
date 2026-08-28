# Lab 2 Peer Review Record

**Author:** Pattharapon Kijjanukij - Student ID: 67070501069 - GitHub: @Earth2509  
**Peer reviewer:** Sittijed Jantarataeme - Student ID: 67070501046 - GitHub: @Nuggetkub

## Required Review Workflow

Each Lab 2 Issue is implemented on one feature branch, reviewed through a Pull Request into `lab2-staging`, and merged only after the peer reviewer approves it. The final release Pull Request from `lab2-staging` to `main` also requires peer review and approval. Comments, requested changes, author responses, and final approval are recorded from actual GitHub activity only.

## Reviews Received for My Pull Requests

| Issue / Pull Request | Scope | Reviewer feedback | Author response | Outcome |
|---|---|---|---|---|
| [#11](https://github.com/Earth2509/toktickit/issues/11) / [PR #12](https://github.com/Earth2509/toktickit/pull/12) | Engineering Contract and Test Plan | @Nuggetkub reviewed the contract on 26 August 2026. The review requested an explicit Create Ticket Ticket Date, a reviewer record that includes reviews given as well as received, and stronger documentation of priority sorting, status-filter limits, E2E ownership, prompts, validation status codes, and idempotency. | The author corrected the documentation in commit `2b50480`, replied to the review, and requested review again. | Approved and merged into `lab2-staging` through PR #12. |
| [#13](https://github.com/Earth2509/toktickit/issues/13) / [PR #21](https://github.com/Earth2509/toktickit/pull/21) | Requester foundation | @Nuggetkub requested proof that the committed Prisma migration applies from an empty database and requested `migration_lock.toml`. The review also recommended removing Bootstrap, routing fetch mocks by URL, committing the client lockfile, and refreshing Requesters when the context changes. | The migration was reset and seeded twice in an isolated schema, with 4 Categories, 4 active Requesters, 1 inactive Requester, and 6 Related Systems confirmed. `migration_lock.toml`, `client/package-lock.json`, URL-routed fetch mocks, requester refresh behavior, and Bootstrap removal were added. | Approved and merged into `lab2-staging` through PR #21. |

## Reviews Given by the Author

| Pull Request reviewed | Feedback given by @Earth2509 | Peer response / outcome |
|---|---|---|
| [Nuggetkub/toktickit PR #29](https://github.com/Nuggetkub/toktickit/pull/29) | The specification, API, test, UI, and AI-use documents were reviewed as internally consistent. Before approval, the author requested the required `docs/lab-02/reviewer.md` file, including both peers, the PR link, the review feedback, author response, and pending approval outcome. | The peer added the required record in commit `86b796c`. The PR was approved by @Earth2509 and merged into `lab2-staging` on 28 August 2026. |

## Review Checklist for Issue #11

- The specification clearly separates development requester selection from real authentication.
- Functional requirements, business rules, acceptance criteria, data design, UI rules, and API contract agree with one another.
- Every acceptance criterion has at least one planned test with a realistic future test-file path.
- Attachment, ownership, pagination, failure, and responsive decisions are complete enough for focused implementation Issues.
- The scope excludes Lab 3 authentication and IT Staff workflow.

This record is updated only from actual GitHub activity. No approval is claimed before it occurs.
