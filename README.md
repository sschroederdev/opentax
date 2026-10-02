# OpenTax

An open source, local-first alternative to TurboTax and H&R Block.

OpenTax prepares US federal income tax returns on your own device. Your tax data
never leaves your computer: there is no server, no account, and no upsell.

> **Status: early development.** OpenTax is not ready for filing real returns.
> The 2026 forms are still IRS drafts, and only two of the IRS's 2026 test
> scenarios fall within what OpenTax supports. Use it to explore and
> contribute, not to file.

## What works today

The tax engine (`packages/engine`) computes **2026** federal and Illinois
returns (and 2025 federal returns) for:

- **Filing statuses:** single, married filing jointly, married filing separately,
  head of household, qualifying surviving spouse
- **Income:** W-2 wages, 1099-INT interest, 1099-DIV dividends, stock and
  crypto sales (1099-B, 1099-DA, Form 8949, Schedule D, loss carryovers), and
  self-employment (1099-NEC, 1099-K, Schedule C with the simplified home office)
- **Deductions:** standard deduction, no tax on tips and overtime, the $6,000
  senior deduction (Schedule 1-A), the 2026 charitable deduction for
  non-itemizers, half of self-employment tax, and the QBI deduction (Form 8995)
- **Tax:** Tax Table, Tax Computation Worksheet, Qualified Dividends and Capital
  Gain Tax Worksheet
- **Credits:** child tax credit, credit for other dependents, additional child
  tax credit (Schedule 8812), earned income credit, excess social security
  withholding, and the 2026 federal public benefit rules for refundable
  credits (Schedule 3-A)
- **Other taxes:** self-employment tax (Schedule SE), Additional Medicare Tax
  (Form 8959), Net Investment Income Tax (Form 8960)
- **Illinois (IL-1040), full-year residents:** exemptions, 4.95% tax, property
  tax and K-12 education credits, Illinois EIC (including workers age 18–24),
  Illinois child tax credit, use tax

Anything else, such as retirement income or itemized deductions, is caught by
screening questions and flagged as unsupported. The engine does not guess.

The web app (`packages/web`) walks you through the return, keeps it in your
browser (IndexedDB, with JSON export and import), shows every form line and
worksheet on a review screen, and prints the filled forms.

The forms package (`packages/forms`) fills the official IRS PDFs: Form 1040,
Schedules 1, 1-A, 2, 3, 3-A, 8812, B, C, D, EIC, and SE, and Forms 8949,
8959, 8960, and 8995. Until the IRS releases the final 2026 forms (usually in
December), these are the IRS drafts, printed "DRAFT — DO NOT FILE".

See [docs/roadmap.md](docs/roadmap.md) for what's next.

## Try it

Requires Node.js 22.18 or later. The engine has no runtime dependencies.

```sh
npm install        # TypeScript tooling, and pdf-lib for the forms package
npm test           # run the test suites
npm run typecheck
```

Run the web app (a guided interview that saves returns in your browser):

```sh
npm run dev        # then open http://localhost:5173
npm run build      # static site in packages/web/dist, works offline
```

Compute a return from the command line:

```sh
node packages/engine/src/cli.ts examples/2026-illinois-server-freelancer.json
```

Fill the IRS forms for it (writes one PDF):

```sh
node packages/forms/src/cli.ts examples/2026-illinois-server-freelancer.json return.pdf
```

Use the engine as a library:

```ts
import { computeReturn, emptyReturn, typicalW2 } from "@opentax/engine";

const result = computeReturn(emptyReturn({ w2s: [typicalW2(50_000, 5_000)] }));
result.form1040.refund; // 1177 (2026)
```

## Principles

1. **Private by design.** Everything runs locally. No telemetry and no
   accounts.
2. **Correct or explicit.** Every situation the engine can't handle produces a
   diagnostic. It never quietly produces a wrong number.
3. **Show the work.** Worksheet lines are part of the output, so anyone can see
   how each number was computed.
4. **Cite the source.** Tax parameters and rules link to the IRS publication,
   revenue procedure, or statute they come from.
5. **Free forever.** MIT-licensed, with no paid tier.

## Project layout

```
packages/engine/   Tax calculation engine (TypeScript, zero dependencies)
packages/forms/    Fills the official IRS PDF forms (pdf-lib)
packages/web/      The web app (React + Vite), local-first
examples/          Sample returns for the CLI
docs/              Architecture and roadmap
```

See [docs/architecture.md](docs/architecture.md) for how the engine is built and
[CONTRIBUTING.md](CONTRIBUTING.md) to get involved.

## Related projects

- [IRS Direct File](https://github.com/IRS-Public/direct-file): the IRS's
  public-domain filing app. Its Fact Graph is a valuable reference for tax
  logic.
- [UsTaxes](https://github.com/ustaxes/UsTaxes): a browser-based federal return
  preparer.
- [OpenTaxSolver](https://opentaxsolver.sourceforge.net/): a long-running
  form-by-form calculator.

## Disclaimer

OpenTax is not tax advice and comes with no warranty. You are responsible for
the accuracy of any return you file.
