# Lab 3 Peer Review Record

Author: Pattharapon Kijjanukij, 67070501069, @Earth2509.
Intended peer reviewer: SITTIJED JANTARATAEME, 67070501046, @Nuggetkub.

## Current record

Engineering contract: [Issue #34](https://github.com/Earth2509/toktickit/issues/34), [PR #35](https://github.com/Earth2509/toktickit/pull/35), feature/lab3-engineering-contract -> lab3-staging. Reviewer @Nuggetkub requested changes on commit 6392536 in [review 5181355623](https://github.com/Earth2509/toktickit/pull/35), reviewed the correction commit `cf87b96`, approved it, and merged it into `lab3-staging` as `d819957` on 2026-09-12. The linked GitHub timeline is authoritative for the exact review and merge timestamps. The next dependent feature requires its own Issue, PR, approval and merge; this acceptance does not pre-approve later implementation work.

## Response to the first review (2026-09-12)

1. Added Admin role query validation, optional UI select, search/role AND behavior and API-15/UI-07 cases.
2. Added one eight-row status policy table and explicit active-work/terminal definitions. RESOLVED allows discussion and requester attachments but not owner/priority edits or new resolution indications. NEW -> OPEN requires prior claim; manual active-work unassignment is blocked; deactivation exception and historical-owner reopening are explicit.
3. Added Staff Detail indication author/time and queue marker, DTO fields, UI-05 -> AC-13 and end-to-end evidence.
4. Added dummy-hash verification for unknown/null-hash identities and distinct inactive feedback only after correct password verification; updated API/UI expectations.
5. Chose relative /api through Vite dev/preview proxies, explicit local/E2E host mapping and removal of wildcard CORS as foundation deliverables.
6. Changed wrong current password to 422 fieldErrors.currentPassword without logout; added per-user/address limits across sessions and corresponding tests.
7. Specified synthetic development-only default accounts/password, environment override, fresh-clone documentation, production refusal and separation from migrated personal-account provisioning.

Also completed error-code enumeration, switched discussion to newest-first/page1 after posting, repaired BR-15 wording and added the real PR links. Clarified that the last-active-Admin transaction uses an exclusive common advisory lock, so concurrent safety checks cannot both pass independently.

Validation: documentation-only consistency and traceability checks; runtime tests remained Planned when this contract PR was reviewed. No runtime test result is attributed to the reviewer.

## Required fields per completed review

PR URL and target branch; reviewed commit; reviewer identity; review timestamp and decision; substantive comment links; response and corrective commit; subsequent approval; merge commit and associated Issue outcome. Preserve requested changes in the timeline rather than rewriting them as initial approval.

Review technical content, test coverage, migration preservation and role/security behavior. Do not claim tests were executed by the reviewer when only submitted evidence was inspected.
