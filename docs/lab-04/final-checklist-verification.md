# Final visual and accessibility checklist verification

## Developer-run result - 5 October 2026

`npm run e2e -- --grep "final Action keyboard"`: 3 passed, one worker, 17.0 seconds. Viewports: desktop 1440x900, tablet 820x1180, mobile 390x844. The developer subsequently ran the complete client suite (12 files / 41 tests passed, 5 October, 17.52 seconds) and the client production build (37 modules, 636ms). The supplied client output is retained as `evidence/build-output/submission-client-test-full.txt`; despite its filename, it is the supplied file/results excerpt without a command or source header. The latest supplied build excerpt is retained as `evidence/build-output/submission-client-build-correction-excerpt.txt`; the earlier complete build log remains unchanged. These checks are from the submission working tree on branch `feature/lab4-submission-completion`, based at local HEAD `674561c` with the recorded application/doc changes in the working tree. No clean source SHA is asserted for these runs.

Each case uses the guarded disposable `lab3_e2e` database and creates one valid OPEN Action on TT-2026-000002. The existing Ticket owner is not changed. Subsequent PATCH is held pending and fulfilled with controlled HTTP 409: no attempted description edit is persisted. Tablet/mobile captures include the valid fixture Actions left by preceding cases in this single-worker run.

| Checklist item | Passing observation |
| --- | --- |
| Opening focus and labels | Enter on Add action focuses Action date/time. All form inputs/selects/textareas have native associated labels. |
| Validation placement and focus | Empty description focuses the invalid description field. Keyboard typing, Tab and Space expose Follow-up note; missing note focuses that field with aria-invalid and aria-describedby. |
| Keyboard field order | Description -> Follow-up checkbox -> Follow-up note -> Attachment notes -> Save. Edit skips disabled date/time, starts at Assignee and Tabs to Description. |
| Visible focus / non-colour state | Edited Description matches focus-visible with a nonzero outline; the stored Action badge contains the text OPEN. |
| Edit submitting | aria-busy=true, description/Save/Cancel disabled, Saving action text visible while controlled PATCH is pending. |
| Conflict and preserved draft | Controlled 409 yields a focusable alert; draft description remains, aria-busy=false and controls re-enable. This supplements, not replaces, the separately captured real two-tab conflict. |
| Keyboard dismissal | Tab from focused error reaches Save then Cancel; Enter restores the invoking Edit button. Stored description remains unchanged. |
| Responsive layout | Full images visually inspected at all three sizes, with no observed clipping or overlap; each capture asserts no page-level horizontal overflow. |

This closes the representative Lab visual checklist together with previously recorded create, complete/cancel, read-only, Dashboard drill-down, role-specific field/error and long-content evidence. It is not a WCAG conformance claim, screen-reader speech test or exhaustive permutation audit.

## Full original images

| Viewport | Follow-up validation | Edit submitting (controlled pending PATCH) | Preserved edit draft (controlled 409) |
| --- | --- | --- | --- |
| Desktop | [Full image](evidence/completion/action-keyboard-follow-up-validation-desktop.png) | [Full image](evidence/completion/action-edit-submitting-controlled-desktop.png) | [Full image](evidence/completion/action-edit-conflict-preserved-draft-desktop.png) |
| Tablet | [Full image](evidence/completion/action-keyboard-follow-up-validation-tablet.png) | [Full image](evidence/completion/action-edit-submitting-controlled-tablet.png) | [Full image](evidence/completion/action-edit-conflict-preserved-draft-tablet.png) |
| Mobile | [Full image](evidence/completion/action-keyboard-follow-up-validation-mobile.png) | [Full image](evidence/completion/action-edit-submitting-controlled-mobile.png) | [Full image](evidence/completion/action-edit-conflict-preserved-draft-mobile.png) |

The full originals are preserved, not cropped or stretched. Five representative full images are embedded in Part 9; all nine are linked here. The correction's client regression and production build now pass on the submission working tree. Peer-reviewed publication, final all-Done board and post-publication verification remain outstanding.
