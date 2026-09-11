# Lab 3 Engineering Contract

Status: Proposed for peer review; implementation has not started.
Issue: [#34 - Engineering contract and planned tests](https://github.com/Earth2509/toktickit/issues/34).
Baseline: `main` at `30da3f2` (Lab 2 release and navigation evidence correction).
Source: Lab_3_sheet.pdf, sections 1-14. Companion contracts: [API](api-spec.md), [UI](ui-spec.md), [tests](tests.md), [workflow](backlog.md).

## 1. Sprint Goal

Replace development requester selection with authenticated accounts while preserving existing tickets and attachments. Deliver an operational IT Staff queue and ticket workflow, private internal notes, shared comments, and minimal Administrator user management in the existing Zen Green application.

## 2. Stakeholder Interpretation

Requesters need to report and track their own problems under a real identity. Staff need to find, take responsibility for, prioritize, and resolve work. Administrators need to provision and maintain accounts. Authorization must apply to direct API requests, not merely navigation visibility.

## 3. Scope

Include login/logout/current user, mandatory initial-password change, roles, data migration, Lab 2 regression, staff queue/detail, assignment, IT priority, status workflow, comments/notes, user administration, automated tests, and final evidence.

Exclude registration, email invitations/resets, MFA/SSO/social login, Actions Taken/Service Actions, SLA/escalation/notifications, analytics beyond queue counts, departments, multiple roles, deleting users, bulk import/export, account history, advanced recovery, and deployment changes. Mockup controls for excluded features are not requirements. Admin pagination is not required. Implement name/email search and a role filter that the user may optionally apply, separately or together with search.

## 4. Functional Requirements

| ID | Requirement |
|---|---|
| FR-01 | Authenticate active users by email/password; provide safe failures, logout, and current-user retrieval. |
| FR-02 | Restrict initial-password sessions to password change and logout until a valid new password is saved. |
| FR-03 | Enforce role and resource ownership on every protected API and route; render role-specific navigation. |
| FR-04 | Migrate existing Requesters to Users without losing ownership, tickets, attachments, or removal audit references. |
| FR-05 | Preserve Lab 2 create/list/detail/upload/download/soft-removal behavior using authenticated identity. |
| FR-06 | Provide staff queue search, filters, sort, pagination, and detail navigation. |
| FR-07 | Allow permitted operators to claim/reassign ownership and update IT Priority. |
| FR-08 | Enforce the transition matrix and record workflow changes atomically. |
| FR-09 | Provide append-only Public Comments and role-restricted Internal Notes with server authors/timestamps. |
| FR-10 | Allow the owning Requester to indicate that the problem appears resolved without changing formal status. |
| FR-11 | Provide Admin user list/name-email search/role filter/create/edit/activation/initial-password reset and account safety checks. |
| FR-12 | Provide responsive, accessible processing, validation, success, empty, forbidden, conflict, and safe failure feedback. |

## 5. Business Rules

| ID | Rule |
|---|---|
| BR-01 | Only active users with valid credentials authenticate. Unknown email, null password hash and incorrect password return the same 401 INVALID_CREDENTIALS. Verify a fixed dummy hash with the same scrypt parameters when no usable hash exists, rather than returning before key derivation. Only after the actual password matches, an inactive account returns 403 ACCOUNT_INACTIVE with a clear contact-Admin message and no session. |
| BR-02 | Initial-password sessions cannot access business data, including through direct URLs/API. |
| BR-03 | Authenticated identity determines requester ownership. Client requesterId/author/role fields cannot impersonate another user. |
| BR-04 | Public Comments are visible to the owning Requester and permitted Staff/Admin; Internal Notes never appear in requester responses. |
| BR-05 | Requesters cannot formally resolve or close tickets. Their resolution indication does not change currentStatus. |
| BR-06 | Store salted password hashes, never plaintext. Proposed implementation uses Node scrypt (N=32768,r=8,p=3,16-byte random salt,64-byte key,128 MiB maxmem), timing-safe comparison and a versioned hash format. Load-test before implementation approval is finalized. |
| BR-07 | Passwords contain 12-128 Unicode code points, are not trimmed or silently truncated, cannot be all whitespace, and new passwords must differ from the current password. Confirmation must match. No arbitrary composition rule. |
| BR-08 | Normalize emails with trim/lowercase, validate format and maximum 254 characters; enforce database uniqueness. Names are trimmed, 1-100 characters. |
| BR-09 | Limit login attempts to 5 failures per normalized email and 30 per source address in 15 minutes; the next attempt returns 429 with Retry-After. Count unknown/null-hash/inactive failures equivalently. Limit wrong current-password attempts to 5 per user and 30 per source address in 15 minutes across sessions; the next attempt returns 429. Check limits before hashing. A wrong current password returns 422 with fieldErrors.currentPassword without revoking the session. No permanent account lock. Document single-process local-lab rate-limit scope. |
| BR-10 | Sessions expire after 8 hours absolute. Logout revokes the server session. Password changes/resets, role changes and deactivation revoke all sessions of the affected user. Validate active state and credential version on every request. |
| BR-11 | One user has exactly one of REQUESTER, IT_STAFF, ADMINISTRATOR. No user deletion. Prevent self-deactivation and any change leaving zero active Admins, including role demotion. Serialize safety checks with updates. |
| BR-12 | Each ticket has zero or one primary owner. New assignment targets must be active IT_STAFF/ADMINISTRATOR users; historical terminal attribution may remain inactive. Claim, reassignment and null-owner legality follow the status policy table below. Claim applies only to unassigned eligible tickets. Stale concurrent changes return 409. |
| BR-13 | requestedPriority remains immutable after creation. itPriority initially copies it, including migrated tickets; only Staff/Admin may change it. Severity order is LOW, MEDIUM, HIGH, URGENT. |
| BR-14 | Operational mutations use a ticket version and transaction. Every actual workflow/owner/priority change updates version/updatedAt and creates a minimal event with actor, timestamp and before/after values. |
| BR-15 | Comments/notes contain 1-2000 trimmed characters, render as plain text, and are append-only. Reject client-supplied author fields; the backend records author and timestamp. No edit/delete API. Creation eligibility follows the status policy table. |
| BR-16 | Cross-requester ticket/attachment access returns indistinguishable 404. Unauthorized role endpoints return 403 before resource lookup. No password hashes, session secrets, storage paths, or internal notes in requester DTOs. |
| BR-17 | Lab 2 validation, official numbering, idempotency, MIME/size limits, five active attachments and removal reasons remain in force. Staff/Admin may download active attachments, but upload/removal remain owner-Requester operations. |
| BR-18 | Resolution indication eligibility follows the status policy table. Within eligible states, a repeat returns the same indication; ineligible states return 409 even for a repeat. Record authenticated actor/time and display both on Staff Detail plus a queue marker. Reopening clears the current indication but preserves its event. |
| BR-19 | Setting RESOLVED requires a trimmed resolution summary of 5-2000 characters. Closing requires an already resolved ticket and explicit confirmation. Other transition confirmations are defined below. |
| BR-20 | Deactivating/demoting an assigned operator atomically unassigns their nonterminal tickets with workflow events, as defined by the status policy table; terminal tickets retain historical owner attribution. The resulting unassigned active-work exception and repair rules are defined below. A changed role never changes ticket requester attribution or grants access to old requester functions. |
| BR-21 | Repeat seeds insert missing fixtures only: never reset existing passwords, roles, activation, ticket edits or comments. Synthetic example.test accounts use explicitly documented development-only defaults with environment overrides (section 7). Real credentials and session/CSRF secrets remain outside Git. Default fixture credentials must not provision arbitrary migrated users. |

### Authorization matrix (proposed explicit Admin decision)

All cells assume active, authenticated, password-change-complete users. Admin operational access is explicitly permitted to reconcile sections 4.3-4.5; its landing page remains User Management.

| Operation | Requester | IT Staff | Administrator |
|---|---|---|---|
| Create / My Tickets / requester attachment upload-removal | Own only | Deny | Deny |
| Read ticket / active attachment | Own only | All | All |
| Staff queue / claim / assign / priority / transition | Deny | Allow | Allow |
| Public comment read/create | Own only | All | All |
| Internal note read/create | Deny | All | All |
| Problem appears resolved | Own only | Deny | Deny |
| User list/create/edit/initial-password reset | Deny | Deny | Allow |
| Password change / logout / own identity | Allow | Allow | Allow |

### Status transition matrix

Only Staff/Admin perform these transitions. Any unlisted transition, including a self-transition, is rejected with 409. Claim does not implicitly change status. The following table is authoritative for status-dependent operation eligibility; role/ownership checks still apply.

### Status policy table

Terminal means RESOLVED, CLOSED or CANCELLED. Active-work means OPEN, IN_PROGRESS or WAITING_FOR_REQUESTER. NEW and REOPENED are nonterminal but may await assignment. Terminal does not by itself prohibit discussion: RESOLVED permits follow-up communication while awaiting closure.

| Status | Terminal? | Owner requirement | Create comments/notes? | Edit priority/owner? | Requester indication? | Requester upload/remove? |
|---|---|---|---|---|---|---|
| NEW | No | Optional | Yes | Yes | Yes | Yes |
| OPEN | No | Active operator | Yes | Yes; cannot manually unassign | Yes | Yes |
| IN_PROGRESS | No | Active operator | Yes | Yes; cannot manually unassign | Yes | Yes |
| WAITING_FOR_REQUESTER | No | Active operator | Yes | Yes; cannot manually unassign | Yes | Yes |
| RESOLVED | Yes | Active operator on entry; historical owner retained | Yes | No | No | Yes |
| CLOSED | Yes | Historical owner retained from RESOLVED | No | No | No | No |
| REOPENED | No | Optional; clear ineligible historical owner on entry | Yes | Yes | Yes | Yes |
| CANCELLED | Yes | Optional historical owner | No | No | No | No |

NEW -> OPEN requires Claim or assignment first. Entering OPEN, IN_PROGRESS, WAITING_FOR_REQUESTER or RESOLVED requires an active operator. Closing a RESOLVED ticket may retain its now-inactive historical owner. BR-20 can leave an active-work ticket unassigned as an explicit exception: show an Unassigned warning, permit claim/reassignment, and require an active owner before any subsequent transition (including cancellation). Manual unassignment in active-work states returns 409. Reopening a terminal ticket clears an inactive/wrong-role historical owner to null with an event; an eligible owner is retained.

### Permitted transitions

| From | Allowed next states |
|---|---|
| NEW | OPEN, CANCELLED |
| OPEN | IN_PROGRESS, WAITING_FOR_REQUESTER, RESOLVED, CANCELLED |
| IN_PROGRESS | WAITING_FOR_REQUESTER, RESOLVED, CANCELLED |
| WAITING_FOR_REQUESTER | IN_PROGRESS, RESOLVED, CANCELLED |
| RESOLVED | CLOSED, REOPENED |
| CLOSED | REOPENED |
| REOPENED | OPEN, IN_PROGRESS, CANCELLED |
| CANCELLED | REOPENED |

Resolved, Closed, Cancelled and Reopened actions require a confirmation dialog. Cancel/reopen require a 5-250 character reason. Apply the status policy table independently for each operation; existing readable data/downloads remain available in every status subject to role/ownership and active-file checks.

## 6. UI Summary

Use [ui-spec.md](ui-spec.md). Retain current React/Vite components and Zen Green tokens, replace selector with login, and clear all user-specific state on identity change/logout. Startup checks current user before rendering private content.

## 7. Data and Migration Decisions

Evolve Prisma Requester into User by SQL table rename rather than drop/recreate. Keep numeric IDs, email, displayName, isActive and timestamps; retain Ticket.requesterId and attachment removedByRequesterId foreign keys pointing to User. Existing roles become REQUESTER. Add role enum, nullable passwordHash for migration provisioning, mustChangePassword=true and credentialVersion. Null hashes cannot authenticate. Normalize emails only after a collision preflight; stop migration with an actionable report if collisions exist.

Add Session (hashed random token, userId, credentialVersion, createdAt, expiresAt; CSRF value derived as specified in the API contract), User.version (default 1 for concurrent administration), Ticket.ownerId (nullable User FK), itPriority, version (default 1), resolutionSummary, requesterResolvedAt/by, and eight status enum values. Add PublicComment and InternalNote tables (ticketId, authorId, content, timestamps); separate storage reduces accidental disclosure. Add TicketEvent for minimal workflow evidence, not an account-history UI. Index user email uniquely, sessions by user/expiry, ticket owner/status/priority/updatedAt, and comments/notes by ticket/createdAt/id. Keep existing numbering, attachment storage keys and unique slot constraints.

Before migration back up DB and attachment storage; run preflight and migrate a disposable copy first. Verify counts, primary keys, checksums of attachment files, owner links, removal attribution, category/system links and ticket numbers before/after. Backfill itPriority from requestedPriority. Provision initial passwords through an explicit local provisioning command using environment/input secrets and hashed writes, never a password literal inside migration SQL. Re-running provisioning does not overwrite an already provisioned account. Do not run Prisma reset against user data. Rollback means restoring the matched DB/files backup, not dropping new tables blindly.

Seed minimum: four active and one inactive Requester, three active and one inactive Staff, one active Admin; realistic assigned/unassigned tickets across priorities/statuses, public comments and internal notes. Seed fixtures must not collide with migrated IDs; use stable unique fixture keys. Provide at least 25 tickets for pagination and two Requesters with distinct ownership for authorization tests.

Development-only fresh-clone fixture accounts: requester1@example.test through requester4@example.test, requester-inactive@example.test; staff1@example.test through staff3@example.test, staff-inactive@example.test; admin@example.test. Default initial password for these synthetic fixtures only: `Lab3-Demo-Only!2026`, overridden by LAB3_SEED_PASSWORD. All require first-login change; inactive examples remain inactive. The foundation implementation must document these defaults in README and .env.example, require an explicit local seed mode and refuse default-password seeding in production. This documentation does not create accounts. Existing migrated accounts require explicit provisioning with environment/input credentials; never assign the public demo default to personal accounts. Actual session/CSRF secrets have no committed default.

## 8. API Summary

[api-spec.md](api-spec.md) defines session cookies, CSRF, DTOs, routes, validation and errors. Disable the development requester-list endpoint and remove browser selector storage. Reject legacy requesterId inputs with 400 after authenticating; they never override identity.

## 9. Acceptance Criteria

| ID | Observable criterion |
|---|---|
| AC-01 | Valid active credentials establish a session; invalid/unknown/null-hash credentials have the same safe failure and equivalent hash work; correct-password inactive login receives a clear refusal without a session; throttling is enforced. |
| AC-02 | Initial-password login allows only change/me/logout; valid change rotates the session and opens the correct role landing page. |
| AC-03 | Logout, expiry, deactivation, reset and role change invalidate affected sessions, including direct API access. |
| AC-04 | Forged requesterId cannot change identity; requester data and attachment access remain owner-only. |
| AC-05 | Direct role-denied requests expose no protected data; requester responses never contain internal notes or credentials. |
| AC-06 | Migration preserves existing records, files and attribution; seeds/provisioning safely repeat. |
| AC-07 | All Lab 2 requester workflows work after login; selector and Change Requester are absent. |
| AC-08 | Queue queries produce the matching, stably ordered subset and correct pagination; invalid queries fail safely. |
| AC-09 | Valid ownership changes persist; invalid/inactive targets and stale concurrent writes cannot overwrite work. |
| AC-10 | IT priority initially matches requested priority and only permitted roles can change it. |
| AC-11 | Every allowed/forbidden transition follows the matrix, version checks and required reasons/summary. |
| AC-12 | Public Comments and Internal Notes enforce visibility, authorship, validation, append-only and terminal-state rules. |
| AC-13 | Requester resolution indication records identity/time, is visible to Staff in detail and queue, and cannot resolve or close a ticket. |
| AC-14 | Admin can list/search/filter by role/create/edit users with one role; duplicate email/invalid input are rejected. |
| AC-15 | Admin reset forces next-login password change; self-deactivation and last-active-Admin removal are blocked under concurrent requests. |
| AC-16 | Role navigation, focus, loading/saving, validation, empty/no-results and safe failures work on desktop/tablet/mobile. |

## 10. Product Definition of Done

- [ ] Contract reviewed before main implementation PRs; decisions and changes versioned.
- [ ] Every FR/BR and AC implemented and linked to executable tests; no skipped required tests.
- [ ] Migration preservation and repeatable provisioning/seed verified on a disposable DB copy.
- [ ] Unit, API/integration, UI/style, authorization, regression and E2E suites pass on final main; full raw outputs retained with commit identity.
- [ ] All major screens checked at three viewports; actual processing/error/security evidence retained.
- [ ] README setup/migration/seed/test instructions and all six required Lab 3 documents current.
- [ ] Feature PRs reviewed into lab3-staging; release PR reviewed into main; Issues Done only after accepted merge.
- [ ] One readable PDF in Answer Part 1-9 order includes rendered required documents, links and authentic evidence.

## 11. Assumptions and Review Decisions

Node/Express, Prisma/PostgreSQL, React/Vite, Vitest/Supertest and Playwright remain the stack. Choose same-origin browser transport through a Vite /api proxy as a required foundation change, not a claim about the existing Lab 2 code. The API contract specifies local/E2E hosts, fetch and proxy behavior. Server sessions are selected for revocation simplicity. Distinct inactive-account feedback is shown only after correct password verification; unknown/null-hash users receive dummy-hash work to avoid a trivial early-return timing signal. Hash-work equivalence does not claim perfectly constant network timing. Admin staff-operation permission, transition rules, terminal behavior and password/session limits are proposed design decisions requiring peer review, not claims that the sheet fixed these details. No new behavior is implemented by this documentation PR.
