# Architecture

## Overview

OpenTax is a local-first web app built on a standalone tax engine.

```
┌──────────────────────────────┐
│  Web app (packages/web)      │  Interview UI, local storage, PDF output
│  React + Vite, runs offline  │
└──────────────┬───────────────┘
               │ TaxReturnInput → TaxReturnResult
┌──────────────▼───────────────┐
│  @opentax/engine             │  Pure functions, no I/O, no dependencies
└──────────────────────────────┘
```

The engine has no dependencies and does no I/O, so it can run in the browser, a
CLI, a test harness, or a future desktop shell.

## Engine

`computeReturn(input: TaxReturnInput): TaxReturnResult` is the only entry point
callers need.

- **Input** (`src/types.ts`) mirrors the source documents: people, dependents,
  W-2s, 1099s, and a set of yes/no screening questions. Amounts are entered
  exactly as printed, with cents.
- **Output** contains the Form 1040 amounts, each supporting schedule or
  worksheet (with its intermediate lines), and a list of diagnostics.
  `complete` is false whenever an `error` or `unsupported` diagnostic is
  present.

### Modules

| Module | Responsibility |
| --- | --- |
| `years/tyYYYY.ts` | Every federal dollar amount and rate for a year, with sources |
| `tax/regularTax.ts` | Tax Table (midpoint of rows under $100k) and rate schedule |
| `tax/qualifiedDividends.ts` | Qualified Dividends and Capital Gain Tax Worksheet |
| `tax/otherTaxes.ts` | Forms 8959 and 8960 |
| `income/capitalGains.ts` | Form 8949, Schedule D, Capital Loss Carryover Worksheet |
| `income/selfEmployment.ts` | Schedule C and Schedule SE |
| `deductions.ts` | Standard deduction, Schedule 1-A, charitable deduction |
| `qualifiedBusinessIncome.ts` | Form 8995 |
| `dependents.ts` | Qualifying-child tests for CTC and EITC |
| `credits/` | Schedule 8812, the earned income credit, and Schedule 3-A |
| `states/illinois/` | IL-1040 and Illinois parameters by year |
| `validation.ts` | Input errors and unsupported-situation screening |
| `defaults.ts` | Blank records and `normalizeReturn` for partial or older JSON |
| `compute.ts` | Assembles everything into a return |

### Conventions

- **Rounding.** Amounts with cents are summed in integer cents and only the
  total is rounded to whole dollars (half up), as the IRS instructions direct.
  Tax calculations use integer arithmetic so a rate like 7.65% never introduces
  floating point error.
- **IRS tables are reproduced exactly.** The Tax Table and EIC Table compute
  the tax or credit at the midpoint of each row, so the engine does too. A
  formula gives slightly different answers than the printed table.
- **Ages** follow two IRS conventions. The age 65 tests and the EITC
  age 25–64 test treat a person as a year older on the day before their
  birthday. Child age tests use the birthday itself (Rev. Rul. 2003-72).
- **New tax years** are added as a new `TaxYearParams` object. Rule changes that
  aren't just new numbers are handled with explicit year checks in the module
  that owns the rule.

### Unsupported situations

The screening questions in `TaxReturnInput.screening` cover common situations
outside the current scope, such as self-employment, stock sales, and
retirement income. Answering yes produces an `unsupported` diagnostic. Some
missing features only cause the filer to overpay, such as the foreign tax
credit or the QBI deduction for section 199A dividends. Those produce a
`warning` instead, because the result is still safe to rely on.

## Forms

`@opentax/forms` turns a `TaxReturnInput` and its `TaxReturnResult` into the
official IRS PDF forms, using pdf-lib. It is separate from the engine so the
engine stays dependency-free.

- **Field maps** (`src/2026/*.ts`) map OpenTax's names for form lines to PDF
  field names. Each entry also records a phrase from the field's tooltip, and
  `test/fields.test.ts` checks every one against the PDF, so a field that
  moves between the draft and final forms fails a test instead of printing
  in the wrong box. `scripts/fieldTable.ts` generates the entries.
- **Fill functions** read the engine's result, and the input where a form
  lists source documents (Schedule B payers, Form 8949 rows). Intermediate
  lines that the engine doesn't return are computed with the same
  parameters and rounding. `test/packet.test.ts` checks that every schedule
  total matches the Form 1040 line it feeds.
- **Filer details** (`FilerDetails`: SSNs, address, bank account, and a few
  yes/no questions) appear on the forms but don't affect the tax, so the
  engine never sees them.
- **Notes** list what the filer must still do by hand (sign, attach W-2s,
  answer questions OpenTax doesn't ask).
- `buildPdf` fills each form, drops the IRS cover page from drafts, flattens
  the fields, and combines everything into one PDF in attachment sequence
  order.

## Web app

`@opentax/web` is a static React + Vite site with no server.

- **State.** A return is a `SavedReturn`: the engine's `TaxReturnInput` plus
  the forms package's `FilerDetails`. Edits go through `produce` (copy,
  change, replace) and the engine recomputes the whole return on every
  change, which takes well under a millisecond.
- **Storage.** Returns are autosaved to IndexedDB in the browser. Export
  writes a JSON file (`format: "opentax-return"`); import also accepts a
  bare `TaxReturnInput` such as the files in `examples/`.
- **Steps** (`src/steps/`) each edit one part of the return. The summary
  panel shows the refund or amount owed and whether the return is complete.
  The review step lists diagnostics, Form 1040 lines, and each schedule and
  worksheet.
- **PDFs.** The print step fills the forms in the browser with
  `@opentax/forms`; Vite bundles the blank PDFs, and pdf-lib loads only on
  that step.
- **Offline.** A small service worker caches the app's own files. The app
  makes no other requests.
- Encryption at rest with a passphrase is planned.

## E-file (future)

Electronic filing requires IRS authorization as an e-file provider (an EFIN,
and passing Modernized e-File acceptance testing each year) plus the
required security controls. Until then, OpenTax produces paper returns.
