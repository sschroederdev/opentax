# Roadmap

The goal is a usable 2026 return, federal and Illinois, for the filing season
that opens in January 2027.

## Milestone 1: engine for 2026 (done)

- [x] Tax engine for 2025 and 2026: W-2, 1099-INT, 1099-DIV, standard
      deduction, CTC, EITC, senior deduction, Additional Medicare Tax, NIIT
- [x] Stock and crypto sales: 1099-B, 1099-DA, Form 8949, Schedule D,
      capital loss carryover
- [x] Self-employment: Schedule C, Schedule SE, QBI deduction (Form 8995)
- [x] Schedule 1-A: no tax on tips and overtime
- [x] 2026 charitable deduction for non-itemizers
- [x] Illinois IL-1040 for full-year residents
- [x] CLI for computing a return from JSON

## Milestone 2: usable app (next)

- [x] Web app: guided interview, local storage, review screen, PDF download
- [ ] Web app: passphrase encryption for saved returns
- [x] Fill the official 2026 PDFs (IRS drafts for now): Form 1040,
      Schedules 1, 1-A, 2, 3, 3-A, 8812, B, C, D, EIC, SE, Forms 8949, 8959,
      8960, 8995
- [ ] Swap in the final 2026 IRS forms when released (December 2026)
- [ ] Fill IL-1040, Schedule M, Schedule ICR, Schedule IL-E/EITC once IDOR
      publishes the 2026 forms
- [x] Run the 2026 IRS ATS scenarios that are in scope (5 and 14) as tests,
      with hand-worked answers. The others need unsupported forms; reviewing
      them added screening for gambling and other Schedule 1 income, farm
      income, and household employees.
- [ ] Check against the published 2026 Tax Table and EIC Table (December)
- [x] Re-check 2026 federal parameters against Rev. Proc. 2025-32 and the
      2026 draft forms (October 2026); add Schedule 3-A
- [ ] Re-check against the final 2026 form instructions, and the Illinois
      parameters against the 2026 IL-1040 instructions

## Milestone 3: more situations

- [ ] Form 2210 underpayment penalty and estimated tax vouchers (1040-ES)
- [ ] Depreciation (Form 4562) and the regular home office method (Form 8829)
- [ ] Self-employed health insurance and SEP-IRA deductions
- [ ] Student loan interest, education credits (Form 8863)
- [ ] HSA (Form 8889) and IRA deductions
- [ ] Illinois: Bright Start subtraction, part-year residents (Schedule NR),
      credit for tax paid to other states (Schedule CR)
- [ ] Premium tax credit (Form 8962), itemized deductions (Schedule A)

## Milestone 4: filing

- [ ] Research the path to IRS and Illinois e-file authorization
