# Review ledger

These files are maintained by people, not by an implementation. They are the authority that
`scripts/check-no-fabrication.ts` checks content against.

| File | Meaning |
|---|---|
| `sources-checked.tsv` | One row per reference that a person has actually opened and read. A citation may not appear in content until its ID is listed here. |
| `approvals.tsv` | One row per recorded scientific approval: the claim or review record ID, the reviewer, and the exact scientific bundle hash the approval covers. |

Both files are empty apart from their headers. That is the honest current state: no physiology in
this repository has been reviewed, and no source has been verified. The production build is
blocked because of it (gate G4 in document 11), and that block is intentional.

To add a source: read it, then add a row with its reference ID, a locator, the reviewer who
checked it and the date. To record an approval: run `npm run content:build -- --mode=production`,
take the printed scientific hash, and record it with the reviewer's identity and qualification.
