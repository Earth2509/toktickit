# Full main test-output verification — 4 October 2026

Tested commit: `55f8200d373577977d2205499d1c29732fe6b9ec`, branch `main` (PR #70 documentation merge). The developer executed the commands locally. The assistant read all eight complete output files and verified their commit/branch headers and passing summaries. These are preserved command logs, not independently assistant-run tests or terminal screenshots. They supersede earlier excerpt-only records for these checks without changing historical results.

| Check | Result | Start / duration | Complete output |
| --- | --- | --- | --- |
| Default server | 25 files passed, 5 skipped; 134 tests passed, 8 skipped | 14:47:54 / 7.69s | [Server](evidence/main/test-output/main-server-full.txt) |
| Client | 12 files / 41 tests passed | 14:52:59 / 16.05s | [Client](evidence/main/test-output/main-client-full.txt) |
| Unfiltered Playwright | 19 tests passed, one worker | 1.0m | [Browser](evidence/main/test-output/main-e2e-full.txt) |
| Lab 4 migration | 1 file / 1 test passed | 15:03:56 / 5.93s | [Migration](evidence/main/test-output/main-migration-full.txt) |
| Lab 4 logical recovery | 1 file / 1 test passed | 15:11:29 / 2.55s | [Recovery](evidence/main/test-output/main-recovery-full.txt) |
| Dashboard performance | 1 file / 2 tests passed | 15:12:24 / 2.53s | [Performance](evidence/main/test-output/main-performance-full.txt) |
| Lab 3 migration | 1 file / 2 tests passed | 15:16:26 / 9.82s | [Lab 3 migration](evidence/main/test-output/main-lab3-migration-full.txt) |
| Administrator integration | 1 file / 2 tests passed | 15:22:51 / 1.88s | [Administrator](evidence/main/test-output/main-admin-integration-full.txt) |

All eight default-skipped cases passed separately: 1 + 1 + 2 + 2 + 2. The default run remains **134 passed / 8 skipped**, not a single 142-passing run. Focused browser runs are subsets of the full 19 cases and are not added to its count.

Administrator integration verifies that concurrent deactivations leave one active Administrator, and that changing an account revokes its sessions while atomically unassigning only active work with audit history. Its log confirms the disposable `lab3_admin_users_test` schema, not `public`.

The Lab 3 migration log includes the expected email-collision rejection from its passing negative case; this is not a suite failure. Recovery verifies 28 Tickets, 3 Actions, one attachment metadata row and copied attachment SHA-256 in a separate schema. This is logical fixture recovery, not native PostgreSQL backup, physical recovery, PITR or production restoration.

Performance output reports five warm-ups and twenty measured requests per endpoint: Requester p95 **7.5 ms**, maximum 8.7 ms; Staff p95 **7.4 ms**, maximum 8.3 ms. These are local smoke measurements, not production guarantees or values inferred from test durations.

Original log bytes, including terminal formatting, were copied unchanged from `artifacts/lab-04/` to `evidence/main/test-output/`. SHA-256:

| File | SHA-256 |
| --- | --- |
| main-server-full.txt | `25ADEDB243F41A8C679B9413379342DCC20BD83DB3E2613745F5A5EE1E895818` |
| main-client-full.txt | `1C268A86A02AA78B4CD119FB05703134FC6CD2E6EE4B168358229C6E3E001B8D` |
| main-e2e-full.txt | `6C4F0018E257D632FCCF704355B993052D83F07E77FC06F2B927C66DA3A21E4A` |
| main-migration-full.txt | `601A951B8CDAEB23D72E5C2985CADF002FAE3B6789CD0A88770EC15635B0D35E` |
| main-recovery-full.txt | `924A1B444B6FB65ED6478B71D8C0108A75FF55177BE5226784C5EA5487DD5579` |
| main-performance-full.txt | `8EC4443AD7E79B4293B97D74E346AB2D4B4D7292E485029CCA4B203BBC2F0390` |
| main-lab3-migration-full.txt | `5AA2C640D16EE1DAA5F99F2964F1AE5F5965D9329FE19AD62A2CC157F49D060A` |
| main-admin-integration-full.txt | `5D459E0664BD1A521100CF427DDC54F9BC1B0689AB7F1791F3388AC15576B983` |

## Subsequent client production build

The developer ran `npm --prefix client run build` after checkout moved to `feature/lab4-submission-completion`. The complete [client build output](evidence/build-output/submission-client-build-full.txt) shows `tsc && vite build`, 37 modules transformed and successful completion in **639 ms**. Assets: `index-BxP1s5g_.css` (24.41 kB), `index-CgTo7x62.js` (229.87 kB), and `index.html` (0.41 kB). The assistant read the original log and preserved its bytes without alteration.

At inspection, HEAD was `674561c39b7a917f38abbd90c355875845cc85cd`; `git diff --name-only 55f8200 HEAD -- client` returned no files. The client source is unchanged from the tested main baseline, but this build log has no embedded SHA/branch header and is not labelled a new main execution. The garbled checkmark/separator in the pasted excerpt is a display-encoding issue: the local log shows the symbols correctly.

## Subsequent server production build

The developer supplied the [complete server build log](evidence/build-output/submission-server-build-full.txt), which shows `toktickit-server@1.0.0 build` followed by `tsc` and no reported diagnostics. The assistant read and preserved the local log. The developer's returned result indicates completion without a reported error; the log itself does not embed an exit code or commit/branch header. As with the client build above, this is submission-branch evidence, not a newly labelled main execution.

Both build logs are now collected. Earlier passing builds retain their own provenance. Visual requirements and final PDF assembly remain outstanding; this does not close Issue #60 or assert complete submission compliance.
