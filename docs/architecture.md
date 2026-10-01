# Architecture

## Overview

OpenTax is a local-first web app built on a standalone tax engine.

```
┌──────────────────────────────┐
│  Web app (planned)           │  Interview UI, local storage, PDF output
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
| `years/ty2025.ts` | Every dollar amount and rate for 2025, with sources |
| `tax/regularTax.ts` | Tax Table (midpoint of rows under $100k) and rate schedule |
| `tax/qualifiedDividends.ts` | Qualified Dividends and Capital Gain Tax Worksheet |
| `tax/otherTaxes.ts` | Forms 8959 and 8960 |
| `deductions.ts` | Standard deduction and the Schedule 1-A senior deduction |
| `dependents.ts` | Qualifying-child tests for CTC and EITC |
| `credits/` | Schedule 8812 and the earned income credit |
| `validation.ts` | Input errors and unsupported-situation screening |
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

## Web app (planned)

- React + Vite, built as a static site that works offline (PWA).
- Returns are stored in IndexedDB in the browser, with JSON export and import.
  Encryption at rest with a passphrase is planned.
- A guided interview collects `TaxReturnInput`. The review screen shows
  `TaxReturnResult` with worksheet drill-downs.
- Output is a filled IRS Form 1040 PDF (pdf-lib) for printing and mailing.

## E-file (future)

Electronic filing requires IRS authorization as an e-file provider (an EFIN,
and passing Modernized e-File acceptance testing each year) plus the
required security controls. Until then, OpenTax produces paper returns.
