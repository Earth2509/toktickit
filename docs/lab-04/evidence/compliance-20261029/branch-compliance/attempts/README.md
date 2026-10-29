# Interrupted review-branch Browser attempt

Source: tracked-clean `feature/lab4-submission-compliance` at
`b54a04001c5719ea3530f4236312ab6f4c5a0ca9`, 29 October 2026. The command used
the checked-in Playwright configuration, installed Chromium cache, disposable
`lab3_e2e` schema and isolated ports 18701/18773. No assertion was overridden.

Playwright listed all 29 cases, including the relocated resolution spec, but
did not return its summary or a successful process exit in the sandbox. The
collector was interrupted. The files here are the original spooled STDOUT and
STDERR bytes, NOT a complete successful run or proof that 29 tests passed.
There is deliberately no successful `e2e` entry in the branch manifest.

No listeners remained on either isolated port after interruption. A completed
Browser run on the relocated source is still required from the developer or
peer reviewer, followed separately by post-merge main verification.

The branch-root manifest contains the seven completed checks on `b54a040`.
Subsequent collector invocations now use a commit-specific subdirectory so that
reruns after documentation/evidence commits cannot overwrite or mix this source.
