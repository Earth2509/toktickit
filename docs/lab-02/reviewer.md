# Lab 2 Peer Review Record

**Author:** Pattharapon Kijjanukij - Student ID: 67070501069 - GitHub: @Earth2509  
**Peer reviewer:** Sittijed Jantarataeme - Student ID: 67070501046 - GitHub: @Nuggetkub

## Required Review Workflow

Each Lab 2 Issue is implemented on one feature branch, reviewed through a Pull Request into `lab2-staging`, and merged only after the peer reviewer approves it. The final release Pull Request from `lab2-staging` to `main` also requires peer review and approval. Comments, requested changes, author responses, and final approval are recorded from actual GitHub activity only.

## Reviews Received for My Pull Requests

| Issue / Pull Request | Scope | Reviewer feedback | Author response | Outcome |
|---|---|---|---|---|
| [#11](https://github.com/Earth2509/toktickit/issues/11) / [PR #12](https://github.com/Earth2509/toktickit/pull/12) | Engineering Contract and Test Plan | @Nuggetkub reviewed the contract on 26 August 2026. The review requested an explicit Create Ticket Ticket Date, a reviewer record that includes reviews given as well as received, and stronger documentation of priority sorting, status-filter limits, E2E ownership, prompts, validation status codes, and idempotency. | The author corrected the documentation in commit `2b50480`, replied to the review, and requested review again. | Approved and merged into `lab2-staging` through PR #12. |
| [#13](https://github.com/Earth2509/toktickit/issues/13) / [PR #21](https://github.com/Earth2509/toktickit/pull/21) | Requester foundation | @Nuggetkub requested proof that the committed Prisma migration applies from an empty database and requested `migration_lock.toml`. The review also recommended removing Bootstrap, routing fetch mocks by URL, committing the client lockfile, and refreshing Requesters when the context changes. | The migration was reset and seeded twice in an isolated schema, with 4 Categories, 4 active Requesters, 1 inactive Requester, and 6 Related Systems confirmed. `migration_lock.toml`, `client/package-lock.json`, URL-routed fetch mocks, requester refresh behavior, and Bootstrap removal were added. | Merged into `lab2-staging` through PR #21 after the review comment, but GitHub records the review as a Comment rather than an Approval. It therefore does not satisfy the stated approval-before-merge rule. |
| [#14](https://github.com/Earth2509/toktickit/issues/14) / [PR #22](https://github.com/Earth2509/toktickit/pull/22) | Ticket creation API | @Nuggetkub confirmed the Ticket schema, migration, validation, and idempotency behavior, then requested P2002 race recovery tests, a terminal safe error handler, safe oversized-JSON behavior, a 500/503 distinction, and an assertion that a `PENDING-` placeholder never reaches a client response. | Added the requested race and response tests; added a final four-argument error handler that returns safe JSON; added 500/503 handling for Ticket persistence; and asserted that the public Ticket number matches `TT-YYYY-000001`. | Approved by @Nuggetkub after the follow-up review and merged into `lab2-staging` through PR #22. |
| [#15](https://github.com/Earth2509/toktickit/issues/15) / [PR #23](https://github.com/Earth2509/toktickit/pull/23) | Create Ticket screen and submission states | @Nuggetkub ran the branch and confirmed the claimed test count, validation bounds, busy protection, API-failure preservation, and backend-assigned Ticket values. The first review requested mixed valid/invalid attachment handling, clearer success copy, visible upper-bound feedback, and documented idempotency-key lifecycle. | The form now retains permitted files, names rejected files with a type or size reason, and covers the mixed-selection result. Success copy and lifecycle documentation were clarified. | Approved by @Nuggetkub after follow-up changes and merged into `lab2-staging` through PR #23. |
| [#16](https://github.com/Earth2509/toktickit/issues/16) / [PR #24](https://github.com/Earth2509/toktickit/pull/24) | My Tickets API | The final GitHub review timeline records @Nuggetkub's approval. No unresolved request-for-changes review remains. | The author incorporated the review follow-up before the final approval. | Approved and merged into `lab2-staging` through PR #24. |
| [#17](https://github.com/Earth2509/toktickit/issues/17) / [PR #25](https://github.com/Earth2509/toktickit/pull/25) | My Tickets screen | The final GitHub review timeline records @Nuggetkub's approval. No unresolved request-for-changes review remains. | The author incorporated the review follow-up before the final approval. | Approved and merged into `lab2-staging` through PR #25. |
| [#18](https://github.com/Earth2509/toktickit/issues/18) / [PR #26](https://github.com/Earth2509/toktickit/pull/26) | Ticket Detail and Attachment lifecycle | The final GitHub review timeline records @Nuggetkub's approval. No unresolved request-for-changes review remains. | The author incorporated the review follow-up before the final approval. | Approved and merged into `lab2-staging` through PR #26. |
| [#19](https://github.com/Earth2509/toktickit/issues/19) / [PR #27](https://github.com/Earth2509/toktickit/pull/27) | E2E infrastructure and responsive evidence | The final GitHub review timeline records @Nuggetkub's approval. No unresolved request-for-changes review remains. | The author incorporated the review follow-up before the final approval. | Approved and merged into `lab2-staging` through PR #27. |

## Reviews Given by the Author

| Pull Request reviewed | Feedback given by @Earth2509 | Peer response / outcome |
|---|---|---|
| [Nuggetkub/toktickit PR #29](https://github.com/Nuggetkub/toktickit/pull/29) | The specification, API, test, UI, and AI-use documents were reviewed as internally consistent. Before approval, the author requested the required `docs/lab-02/reviewer.md` file, including both peers, the PR link, the review feedback, author response, and pending approval outcome. | The peer added the required record in commit `86b796c`. The PR was approved by @Earth2509 and merged into `lab2-staging` on 28 August 2026. |
| [Nuggetkub/toktickit PR #30](https://github.com/Nuggetkub/toktickit/pull/30) | Reviewed the Zen Green UI foundation and application shell against the stated Lab 2 scope. | Approved by @Earth2509 and merged into `lab2-staging`. |
| [Nuggetkub/toktickit PR #31](https://github.com/Nuggetkub/toktickit/pull/31) | Reviewed the Lab 2 data model, idempotent seed, and reference APIs. | Approved by @Earth2509 and merged into `lab2-staging`. |
| [Nuggetkub/toktickit PR #32](https://github.com/Nuggetkub/toktickit/pull/32) | Reviewed the Create Ticket API, including per-year numbering and idempotency. | Approved by @Earth2509 and merged into `lab2-staging`. |
| [Nuggetkub/toktickit PR #33](https://github.com/Nuggetkub/toktickit/pull/33) | Reviewed the Development Requester selection, context, and route guard implementation. | Approved by @Earth2509 and merged into `lab2-staging`. |
| [Nuggetkub/toktickit PR #34](https://github.com/Nuggetkub/toktickit/pull/34) | Reviewed the Create Ticket screen and its review follow-up. | Approved by @Earth2509 and merged into `lab2-staging`. |
| [Nuggetkub/toktickit PR #35](https://github.com/Nuggetkub/toktickit/pull/35) | Reviewed the My Tickets list and Ticket detail APIs, including requester scoping, validation, pagination, and response shape. | Approved by @Earth2509 and merged into `lab2-staging`. |

## Review Checklist for Issue #11

- The specification clearly separates development requester selection from real authentication.
- Functional requirements, business rules, acceptance criteria, data design, UI rules, and API contract agree with one another.
- Every acceptance criterion has at least one planned test with a realistic future test-file path.
- Attachment, ownership, pagination, failure, and responsive decisions are complete enough for focused implementation Issues.
- The scope excludes Lab 3 authentication and IT Staff workflow.

This record is updated only from actual GitHub activity. No approval is claimed before it occurs.
