# Lab 4 PDF acceptance verification - 6 October 2026

## Reviewed publication and document scope

PR #74 was peer-approved and merged into main at `083962c2ec75202acae4f5e2cfebef62ee17c007`. The six full rendered engineering documents match that published tree. Their GitHub main URLs returned HTTP 200 after the merge. The newly dated publication follow-up is a local acceptance addendum, not content falsely attributed to the approved release tree.

The application/test source is `73faa8b`; the main documentation merge contains no runtime/test changes. The report distinguishes 134 default server passes with nine intentional skips from the nine separately passing optional cases, 45 client passes, 29 unfiltered browser passes and passing builds. It retains original run dates, checkout identities, invocation limitations and live versus controlled screenshot attribution.

## Acceptance copy inspection

The assistant rendered and inspected all 176 pages of the post-merge acceptance copy in eleven numbered contact sheets, with additional full-size inspections of the publication/provenance table and test matrix. Automated checks found all nine Answer Parts, 70 continuously numbered Figures, 259 link annotations and zero blank pages. This count refers to the acceptance copy before the final Board/addendum is inserted, not the eventual Final PDF.

- [x] Dark table-header text on pale mint remains readable; table headers repeat on continuation pages.
- [x] Figure numbering follows reading order without duplicate numbers.
- [x] Screenshots preserve the original complete extent and aspect ratio. Tall screenshots use proportionally tall pages instead of clipped panels or stretched images.
- [x] No observed overlapping captions, clipped headings, blank pages or footer collisions in the inspected copy.
- [x] All six required documents are fully rendered, not replaced with summaries.
- [x] Public source links, actual publication SHA and tested-source attribution are distinguished.

The later acceptance copy, with this dated inspection record included, has 177 pages, the same 70 Figures and 259 links, and no blank pages. Its changed pages were rendered and inspected again.

The student subsequently confirmed the external actions: Issue #60 was closed as completed with a detailed English summary, moved to Done, and the refreshed Board showed all six Lab 4 Issues in Done. Two genuine complete browser captures cover the upper and lower scroll positions of that column. See [current final acceptance](final-acceptance-signoff.md) and the machine-readable [sign-off](evidence/final-signoff.json). The Board is currently Private; authenticated visibility is not falsely claimed as anonymous/public access.

The builder refuses `--final` without the recorded acceptance sign-off and existing genuine Board images. The Final PDF must still be rendered and visually inspected after those additions; this acceptance record does not pre-approve an uninspected final export.
