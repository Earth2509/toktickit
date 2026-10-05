# Lab 4 Git workflow and specification chronology

Verified from the local Git object database on 4 October 2026. Remote-tracking `origin/main` resolves to `55f8200`; this check did not fetch GitHub and does not claim a newer live remote state. This is transcribed command evidence, not a terminal/IDE screenshot. Preserve that distinction in the final report.

## Specification before the Actions Taken implementation

All timestamps below are recorded Git metadata with timezone +07:00 (Asia/Bangkok), not independently certified wall-clock records.

| Recorded event | Commit | Commit timestamp | Observation |
|---|---|---|---|
| Initial engineering contract | [17a6b2c](https://github.com/Earth2509/toktickit/commit/17a6b2c4853f00ed16a073e34c84399a42f78d22) | 22 September 2026, 22:54:30 | Adds all six `docs/lab-04` engineering files, including `specification.md` (112 added lines), planned tests and API/UI contracts. |
| Contract PR #61 merged | [PR #61](https://github.com/Earth2509/toktickit/pull/61), merge `6ce7862` | 25 September 2026, 17:49:57 | Merge message identifies `feature/lab4-engineering-contract`. |
| Actions Taken foundation | [343e00f](https://github.com/Earth2509/toktickit/commit/343e00f1ae03ea8dbb39fe221c46f58b363c9ee1) | 25 September 2026, 22:43:03 | Adds `server/src/actions-taken.ts`, API routes, Prisma changes, seed work and unit/API tests. |
| Foundation PR #62 merged | [PR #62](https://github.com/Earth2509/toktickit/pull/62), merge `ee3f8bb` | 27 September 2026, 10:46:54 | Merge message identifies `feature/lab4-actions-foundation`. |

`git merge-base --is-ancestor 17a6b2c 343e00f` returned exit code 0, confirming the initial contract is an ancestor of the foundation implementation, not merely an earlier unrelated timestamp. The file-addition log on `origin/main` also identifies `17a6b2c` as the addition of the Lab 4 specification and `343e00f` as the addition of the named backend implementation file. This verifies chronology within the recorded repository history. It does not establish when uncommitted code was first drafted, the PR creation timestamp or the chronology of every other Lab 4 implementation file.

A separate ancestry check for contract merge `6ce7862` against implementation `343e00f` returned exit code 1. Therefore, do not claim that the foundation commit was based on that merge commit or included every reviewed contract change. The initial contract ancestry is proven; the contract merge precedes the implementation only in the recorded timestamps.

## Feature, staging and main integration

The local graph contains the real feature merge commits and promotion merges. Selected ancestry, condensed from `git log --graph`:

```text
55f8200  main: merge PR #70 (dashboard-main-evidence)
  58cd34b / 7247b34  documentation verification branch
7329652  main: merge PR #69 (dashboard-release)
  1e51f7d  release verification documentation
  e533135  lab4-staging: merge PR #68 (staff-actions-dashboard)
    1350a4a / 2e31ec8 / 6b0783d  correction feature branch
ffe6e0e  main: merge PR #67 (release-integration)
  c43bbdb / 7cfd5c2 / e3543e6  release integration branch
  510b3eb  staging integration: merge PR #66 (regression-e2e-release)
  5801823  staging integration: merge PR #65 (dashboards)
  b7f9348  staging integration: merge PR #64 (resolution-workflow)
  33d9df3  staging integration: merge PR #63 (actions-ui)
  ee3f8bb  staging integration: merge PR #62 (actions-foundation)
  6ce7862  staging integration: merge PR #61 (engineering-contract)
```

This condensed presentation is a labelled transcription, not the complete branch graph or proof of a currently visible GitHub board. A genuine GitHub graph screenshot was subsequently collected below; final board evidence remains pending. Main runtime checks and the documentation-only distinction are in [final-main-verification.md](final-main-verification.md); formal review history is in [reviewer.md](reviewer.md).

### Genuine recent network graph

[Full GitHub network screenshot](evidence/main/github-network-feature-staging-main-live.jpg), collected on 4 October from [the repository network page](https://github.com/Earth2509/toktickit/network). The loaded graph shows separate lines and labels for `main`, `lab4-staging`, `feature/lab4-staff-actions-dashboard`, `feature/lab4-dashboard-release`, `feature/lab4-dashboard-main-evidence` and `feature/lab4-regression-e2e-release`. The displayed window covers recent late-September/early-October integration, not every Sprint 4 branch or the full repository history. GitHub states the graph is updated daily.

The page's supported Chart options/data-table view independently exposed main head `55f8200`, staging head `e533135`, and the correction feature head `1350a4a`, consistent with the recorded local history. No graph/data rows were changed. The full screenshot was captured at the temporary tab's default 1280 × 720 viewport and visually inspected; no viewport override, cropping, stretching or graphical reconstruction was used. It supplements the chronological commit evidence and does not prove an all-Done Project board.

## Genuine GitHub screenshots collected on 4 October

- [Original contract commit overview](evidence/main/github-original-specification-commit-live.jpg): actual GitHub commit `17a6b2c`, PR #61 association and all six newly added engineering files, including `specification.md`.
- [Actions foundation commit overview](evidence/main/github-actions-foundation-commit-live.jpg): actual GitHub commit `343e00f`, PR #62 association and backend/schema/test changes.

The original full-page screenshots were captured at the temporary tab's default 1280 × 720 viewport, without a viewport override, crop, image edit or DOM modification. Diffs were collapsed using normal GitHub controls to keep the file-change overview readable. Both images were visually inspected. The screenshots display relative dates (`2 weeks ago`, `last week`); do not describe them as displaying exact timestamps. The real page's date elements exposed `2026-09-22T15:54:30.000Z` and `2026-09-25T15:43:03.000Z` respectively, consistent with the Git metadata in the table above. Exact timestamps are documented as observed metadata, not added to or fabricated in the images. These commit overviews are not a feature-branch graph or final Kanban screenshot.

## Reproduce from Command Prompt

Run each command separately from the repository root:

```bat
cd /d "C:\Users\ASUS\Documents\Codex\2026-08-12\github\lab4-engineering-contract"
git -c safe.directory="C:/Users/ASUS/Documents/Codex/2026-08-12/github/lab4-engineering-contract" log --graph --oneline --decorate -90 origin/main
git -c safe.directory="C:/Users/ASUS/Documents/Codex/2026-08-12/github/lab4-engineering-contract" show --format=fuller --stat 17a6b2c
git -c safe.directory="C:/Users/ASUS/Documents/Codex/2026-08-12/github/lab4-engineering-contract" show --format=fuller --stat 343e00f
git -c safe.directory="C:/Users/ASUS/Documents/Codex/2026-08-12/github/lab4-engineering-contract" merge-base --is-ancestor 17a6b2c 343e00f
```

The ancestry command prints no text on success; exit code 0 is the result. The three log/show commands provide actual readable graph/file-change evidence. These are read-only commands and do not fetch, switch branches, stage files or alter application data. No complete test run or screenshot is claimed by this document.
