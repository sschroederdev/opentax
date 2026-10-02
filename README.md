# OpenTax

An open source, local-first alternative to TurboTax and H&R Block.

OpenTax prepares US federal income tax returns on your own device. Your tax data
never leaves your computer: there is no server, no account, and no upsell.

> **Status: early development.** OpenTax is not ready for filing real returns.
> The numbers it produces have not been checked against IRS test scenarios
> yet. Use it to explore and contribute, not to file.

## What works today

The tax engine (`packages/engine`) computes 2025 federal returns for:

- **Filing statuses:** single, married filing jointly, married filing separately,
  head of household, qualifying surviving spouse
- **Income:** W-2 wages, 1099-INT interest, 1099-DIV dividends and capital gain
  distributions
- **Deductions:** standard deduction (including age 65+, blindness, and the
  dependent limit) and the new $6,000 senior deduction (Schedule 1-A)
- **Tax:** Tax Table, Tax Computation Worksheet, Qualified Dividends and Capital
  Gain Tax Worksheet
- **Credits:** child tax credit, credit for other dependents, additional child
  tax credit (Schedule 8812), earned income credit, excess social security
  withholding
- **Other taxes:** Additional Medicare Tax (Form 8959), Net Investment Income
  Tax (Form 8960)

Anything else, such as self-employment, stock sales, or itemized deductions, is
caught by screening questions and flagged as unsupported. The engine does not
guess.

See [docs/roadmap.md](docs/roadmap.md) for what's next.

## Try it

Requires Node.js 22.18 or later. The engine has no runtime dependencies.

```sh
node packages/engine/src/cli.ts examples/single-parent.json
```

```sh
npm install        # dev tooling only (TypeScript, Node types)
npm test           # run the engine test suite
npm run typecheck
```

Use the engine as a library:

```ts
import { computeReturn, emptyReturn, typicalW2 } from "@opentax/engine";

const result = computeReturn(emptyReturn({ w2s: [typicalW2(50_000, 5_000)] }));
result.form1040.refund; // 1125
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
