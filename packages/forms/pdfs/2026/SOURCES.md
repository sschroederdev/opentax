# 2026 form PDFs

Early-release IRS drafts of the 2026 forms, downloaded October 2026 from
https://www.irs.gov/draft-tax-forms. IRS forms are works of the U.S.
government and are in the public domain.

Each draft prints "DRAFT — DO NOT FILE" and starts with a cover page, which
OpenTax drops. When the IRS releases the final forms (usually in December),
replace these files with the final versions from https://www.irs.gov/forms,
set `coverPages: 0` and the new revision in `src/2026/*.ts`, and run the
tests: `test/fields.test.ts` fails for any field that moved or was renamed.
`npm run fetch-forms -w @opentax/forms` downloads every form again from
the URL in its definition.

| File | Draft created | Source |
| --- | --- | --- |
| `f1040.pdf` | 8/19/26 | https://www.irs.gov/pub/irs-dft/f1040--dft.pdf |
| `f1040s1.pdf` | 4/24/26 | https://www.irs.gov/pub/irs-dft/f1040s1--dft.pdf |
| `f1040s1a.pdf` | 6/16/26 | https://www.irs.gov/pub/irs-dft/f1040s1a--dft.pdf |
| `f1040s2.pdf` | 4/27/26 | https://www.irs.gov/pub/irs-dft/f1040s2--dft.pdf |
| `f1040s3.pdf` | 4/27/26 | https://www.irs.gov/pub/irs-dft/f1040s3--dft.pdf |
| `f1040s3a.pdf` | 6/24/26 | https://www.irs.gov/pub/irs-dft/f1040s3a--dft.pdf |
| `f1040s8.pdf` | 4/24/26 | https://www.irs.gov/pub/irs-dft/f1040s8--dft.pdf |
| `f1040sb.pdf` | 4/7/26 | https://www.irs.gov/pub/irs-dft/f1040sb--dft.pdf |
| `f1040sc.pdf` | 5/15/26 | https://www.irs.gov/pub/irs-dft/f1040sc--dft.pdf |
| `f1040sd.pdf` | 4/1/26 | https://www.irs.gov/pub/irs-dft/f1040sd--dft.pdf |
| `f1040sei.pdf` | 5/28/26 | https://www.irs.gov/pub/irs-dft/f1040sei--dft.pdf |
| `f1040sse.pdf` | 4/27/26 | https://www.irs.gov/pub/irs-dft/f1040sse--dft.pdf |
| `f8949.pdf` | 4/1/26 | https://www.irs.gov/pub/irs-dft/f8949--dft.pdf |
| `f8959.pdf` | 5/27/26 | https://www.irs.gov/pub/irs-dft/f8959--dft.pdf |
| `f8960.pdf` | 6/1/26 | https://www.irs.gov/pub/irs-dft/f8960--dft.pdf |
| `f8995.pdf` | 5/1/26 | https://www.irs.gov/pub/irs-dft/f8995--dft.pdf |
