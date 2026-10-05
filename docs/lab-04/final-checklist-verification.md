# Final visual and accessibility checklist verification

## PR #71 review correction - 5 October 2026

The [review of `e6037e6`](https://github.com/Earth2509/toktickit/pull/71#pullrequestreview-5410695311) identified a gap in the earlier sign-off: the successful-save callback reloaded the parent Staff Detail with a full-screen loading state. This unmounted Actions Taken and lost keyboard focus. The historical run below verified Cancel dismissal, not focus after successful Create/Complete. Its passing result and original images remain valid only within that narrower scope.

Same-Ticket refreshes now leave the detail/Action section mounted. Initial navigation to a Ticket still uses the loading state. A request-sequence guard prevents superseded or previous-Ticket responses from updating the current detail. The Action section retains its existing invoking-control/fallback focus logic.

The assistant reproduced the unmount failure with four new integration cases on the unchanged `e6037e6` application source: successful create, edit, complete and cancel all failed while the parent re-read was held pending. After the correction, all four passed. These tests render the real `StaffTicketDetail`, `ActionsTakenSection` and discussions, with mocked HTTP responses; they assert stable section identity and correct focus both during the delayed parent read and after the refreshed Ticket is applied. They are not a browser or live database run.

Current working-tree verification: complete client suite **13 files / 45 tests passed** (20:30:34, 6.54s); TypeScript and Vite production build **37 modules, 638ms**, asset `index-B5PnQ1t8.js`. `VITE_PRESERVE_SYMLINKS=true` was used to avoid the local sandbox's realpath restriction; no dependency or configuration file was changed. Historical main counts below remain unchanged.

The three-viewport `final Action keyboard` browser cases now wait for the real parent GET after successful Create and Complete and assert Add action is focused; Complete also verifies its invoking button has disappeared. The controlled edit-conflict route is removed before the real completion PATCH. After assistant attempts stopped before test execution during Prisma generation, then schema-engine preparation, the developer ran the requested focused command and supplied **3 tests passed, one worker, 24.0 seconds**. The supplied summary is preserved in [browser excerpt](evidence/build-output/pr71-successful-save-focus-browser-excerpt.txt), without inventing a command/timestamp/SHA header. Attribution: corrected submission working tree based at `e6037e6`, not final main and not assistant-run browser evidence. A browser negative control on the old source was not run by the assistant; the four independently observed red/green parent-component controls above remain separate evidence.

The successful-save focus checklist is now signed off for the three tested viewports. The real create leaves focus on Add action; completing that fixture removes its invoking Complete button and restores the Add action fallback after the parent GET. Successful Edit/Cancel focus is independently covered by the real-parent component cases, not additional browser outcomes inferred from this summary. Publication and peer re-review remain outstanding.

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

This historical run covers opening, validation/error focus and Cancel dismissal, together with the separately recorded rendering/role evidence. It did not check focus after a successful Action save on the parent screen; that gap is covered by the later correction and separately attributed 24.0-second browser run above. It is not a WCAG conformance claim, screen-reader speech test or exhaustive permutation audit.

## Full original images

| Viewport | Follow-up validation | Edit submitting (controlled pending PATCH) | Preserved edit draft (controlled 409) |
| --- | --- | --- | --- |
| Desktop | [Full image](evidence/completion/action-keyboard-follow-up-validation-desktop.png) | [Full image](evidence/completion/action-edit-submitting-controlled-desktop.png) | [Full image](evidence/completion/action-edit-conflict-preserved-draft-desktop.png) |
| Tablet | [Full image](evidence/completion/action-keyboard-follow-up-validation-tablet.png) | [Full image](evidence/completion/action-edit-submitting-controlled-tablet.png) | [Full image](evidence/completion/action-edit-conflict-preserved-draft-tablet.png) |
| Mobile | [Full image](evidence/completion/action-keyboard-follow-up-validation-mobile.png) | [Full image](evidence/completion/action-edit-submitting-controlled-mobile.png) | [Full image](evidence/completion/action-edit-conflict-preserved-draft-mobile.png) |

The full originals are preserved, not cropped or stretched. Five representative full images are embedded in Part 9; all nine are linked here. The correction's client regression and production build now pass on the submission working tree. Peer-reviewed publication, final all-Done board and post-publication verification remain outstanding.
