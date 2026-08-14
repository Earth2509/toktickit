# Lab 1 - Peer Review Record

**Author:** Pattharapon Kijjanukij - Student ID: 67070501069 - GitHub: @Earth2509
**Peer reviewer:** Sittijed Jantarataeme - Student ID: 67070501046 - GitHub: @Nuggetkub

## Pull Requests I authored

| PR | Branch | Target | Review outcome |
|---|---|---|---|
| [#1](https://github.com/Earth2509/toktickit/pull/1) | feature/1-project-foundation | lab1-staging | Commented, revised, approved, and merged |
| [#6](https://github.com/Earth2509/toktickit/pull/6) | feature/2-health-check | lab1-staging | Approved and merged |
| [#7](https://github.com/Earth2509/toktickit/pull/7) | feature/3-category-seed | lab1-staging | Approved and merged |
| [#8](https://github.com/Earth2509/toktickit/pull/8) | feature/4-category-list | lab1-staging | Changes requested, revised, approved, and merged |
| [#9](https://github.com/Earth2509/toktickit/pull/9) | lab1-staging | main | Approved and merged |

## Review feedback and response

- **PR #1:** The reviewer found missing Prisma initialization, a misleading template README, and inaccurate evidence. I added the Prisma base configuration, corrected the README, and replaced placeholder evidence with the actual review state.
- **PR #6:** The review focused on useful failure messages. The health check UI keeps a friendly connection message for an unavailable backend.
- **PR #7:** The reviewer confirmed the Category model, migration, and idempotent seed.
- **PR #8:** The reviewer found an invalid blanket fetch mock, minified source, a missing online status role, and raw browser errors shown to users. I routed the fetch mock by endpoint, restored readable formatting and the status role, added loading/category-list coverage, translated network failures at the API boundary, and added a TypeError(Failed to fetch) regression test.

All feature PRs had a real peer review before merging into lab1-staging. PR #9 was approved and merged as the final release from lab1-staging to main.
