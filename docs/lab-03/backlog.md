# Sprint 3 Work Breakdown and Review Gates

Status: First issue created as [#34](https://github.com/Earth2509/toktickit/issues/34), under review in [PR #35](https://github.com/Earth2509/toktickit/pull/35). Remaining rows are proposed backlog, not claims of GitHub Issue creation or completion.

| Order | Issue title | Deliverable | Depends on |
|---|---|---|---|
| 1 | Lab 3: Engineering contract and planned tests | Six required docs, explicit auth/status/migration decisions, AC matrix and peer review | Released Lab 2 main |
| 2 | Lab 3: User migration and authentication foundation | Safe migration/provisioning/seed with documented local-only defaults/environment override, sessions/password/login/logout/me, dummy-hash and change-password limits, DB tests; replace direct VITE_API_URL calls with relative /api; configure Vite dev/preview proxy and Playwright ports, remove wildcard CORS, verify cookie/Origin transport before downstream work | 1 approved |
| 3 | Lab 3: Authorization and authenticated Requester regression | Backend guards, remove development selector/identity, login/password UI and preserve tickets/files | 2 |
| 4 | Lab 3: IT Staff Ticket Queue | Query API, responsive queue, search/filter/sort/page and tests | 3 |
| 5 | Lab 3: Ticket ownership, priority and status workflow | Staff detail operations, version checks/events and transition tests | 4 |
| 6 | Lab 3: Public Comments, Internal Notes and resolution indication | Visibility-safe discussion and requester indication, API/UI tests | 5 |
| 7 | Lab 3: Minimal Administrator User Management | User search plus optional role filter/create/edit/reset, role/activation safety and tests | 3,5 |
| 8 | Lab 3: E2E, responsive and security evidence | Full flows, migration/regression, screenshots and visual checklist | 6,7 |
| 9 | Lab 3: Release integration and final main evidence | Reviewed staging release, final main tests and submission evidence | 8 |

Use one feature branch and focused PR per issue into lab3-staging. Preserve the established Project statuses and map planned work to backlog, active work to in progress, PR to review, accepted merged work to Done. Request review from @Nuggetkub; record actual comments, responses and approvals. Wait for peer review/merge before proceeding to the dependent issue. The user prefers the peer to approve and merge; do not self-approve or auto-merge.

Create lab3-staging from current main (baseline 30da3f2 at contract drafting). Contract feature: feature/lab3-engineering-contract. Release flow: feature -> lab3-staging -> main. Document corrections remain reviewed PRs. Final main evidence is a follow-up documentation PR when release tests cannot be captured before the release merge; record the tested source commit exactly.

First PR review focus: Admin matrix, terminal-state rules, status transitions, migration preservation, session revocation/CSRF, account safety concurrency, and AC/test coverage. Do not mark this contract approved until the real review is recorded.
