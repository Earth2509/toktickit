# Lab 4 required screenshot paths

These are byte-identical copies of the full original captures in
`docs/lab-04/evidence/main/`, arranged into the three directories required by
labsheet section 12. They are not newly captured screens or new test results.

- `staff-dashboard/`: desktop, tablet and mobile Staff Dashboard.
- `requester-dashboard/`: desktop, tablet and mobile Requester Dashboard.
- `actions-taken/`: Staff and read-only Requester Ticket Actions at all three sizes.

`provenance.json` records each original path, destination and SHA-256. The dated
capture descriptions and test attribution remain in
[`docs/lab-04/evidence/main/README.md`](../../../docs/lab-04/evidence/main/README.md).

Reproduce or verify these copies with `node scripts/sync_lab4_screenshot_evidence.mjs`.
The script refuses to replace a destination containing different evidence.
