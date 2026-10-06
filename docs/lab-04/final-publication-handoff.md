# Lab 4 final-publication handoff

## Verified and remaining work

Runtime/test source: reviewed main `73faa8b0cee5adce1718cd97c5e32fc4bba9ec84`, release PR #72. Developer-supplied summaries confirm server 134 passed / 9 intentional skips, client 45, E2E 29, both builds and all nine optional cases passed separately. Client and both builds additionally have new complete assistant-run logs. Six required document links returned HTTP 200.

The handout's Part 3 requires **complete passing output from main**, not only totals. Historical complete logs at `55f8200` remain intact; they are not relabelled with the newer source. Obtain the current-source complete server, browser and optional logs using the collector. It compares application/tests with reviewed main even when invoked from this documentation-only branch.

Run from Command Prompt, one command at a time:

```cmd
cd /d "C:\Users\ASUS\Documents\Codex\2026-08-12\github\lab4-engineering-contract"
node scripts/collect_lab4_final_output.mjs server
```

After that succeeds, stop the normal development API to avoid Prisma's Windows DLL lock, then run the remaining checks separately:

```cmd
node scripts/collect_lab4_final_output.mjs e2e
node scripts/collect_lab4_final_output.mjs history
node scripts/collect_lab4_final_output.mjs migration
node scripts/collect_lab4_final_output.mjs recovery
node scripts/collect_lab4_final_output.mjs performance
node scripts/collect_lab4_final_output.mjs lab3-migration
node scripts/collect_lab4_final_output.mjs admin-integration
```

The collector uses `server/.env` without printing credentials, accepts only local PostgreSQL, and invokes existing guarded disposable-schema runners. It never resets `public`. It stops on a failed selected check, preserves actual failure output, and cannot mark failure as passed. The unfiltered E2E uses separate ports 18301/18173 with server reuse disabled. No dependency upgrade or Git reset is required. An invocation without an argument prints the plan without running tests.

## Publication and final acceptance sequence

1. Inspect complete output, counts, source headers and exit status; add only curated logs, documentation and report scripts. Exclude `.env`, traces, uploads, `server/.review-pr96/`, uncurated artifacts and unrelated files.
2. Publish `feature/lab4-final-publication`, request peer review, and promote documentation through the repository's reviewed staging/main workflow. Do not self-approve or claim that local updates already match public main.
3. Recheck public links and document content after publication. Runtime is unchanged; retain the actual tested source and record the final documentation merge separately.
4. Validate a submission-ready PDF assembly, complete the remaining Issue #60 deliverables, then close #60 as completed and verify its Project status is Done. Capture the real board: six Lab 4 Issues (#55-#60) in Done, no fabricated board or premature closure. The project also contains nine older Lab 3 items; explain counts rather than calling all 15 Lab 4 issues.
5. Embed that full board image in Part 1, check the final workflow DoD item using the actual evidence, export `TokTickIT_Lab4_Submission.pdf`, remove active draft notices and inspect every rendered page, figure sequence, working links and absence of blank pages. Keep dated historical records explicitly historical.

Until these gates are verified, `TokTickIT_Lab4_PostMerge_Review.pdf` remains a review copy, not an unconditional final-submission claim.

## Proposed publication PR text

Title: `docs(lab4): publish final-main verification and complete submission records`

Purpose: publish the post-merge verification for reviewed main `73faa8b`, update the six engineering documents' current status, preserve complete current-source output separately from historical logs, and make the final report reproducible. No application, database model, dependency or business-rule change is included.

Evidence: developer summaries report 134 default server passes with nine explained skips, 45 client passes, 29 unfiltered browser cases and nine separately passing database cases. The actual collected logs and exit status must be checked before adding complete-output claims. The six document URLs returned HTTP 200. Local report QA previously verified all nine Parts, 70 sequential figures, readable table headers, proportional full images and zero blank pages.

Review request: verify source attribution, complete output versus excerpts, final status/traceability consistency, published document links, and the final Issue/Project acceptance sequence. Please do not approve based only on test totals or close #60 before the remaining submission-evidence gates are satisfied.
