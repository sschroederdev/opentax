# Contributing

Thanks for helping build a free, private way to file taxes.

## Setup

```sh
npm install
npm test
npm run typecheck
```

Node.js 22.18 or later runs the TypeScript sources directly, so there is no
build step.

## Ground rules for tax logic

- **Cite your source.** Every parameter and rule should reference the form
  instructions, publication, revenue procedure, or statute it comes from.
- **Test with worked examples.** Each test should show the arithmetic in a
  comment, so a reviewer can check it against the IRS instructions without
  running code.
- **Never guess.** If a situation isn't fully handled, add a diagnostic. Use
  `unsupported` if the result could understate tax and `warning` if it can only
  overstate it.
- **Follow the IRS method, not just the formula.** If the IRS uses a table or
  worksheet with specific rounding, reproduce it exactly.
- **No runtime dependencies in the engine.** It needs to stay small and
  auditable.

## Privacy

Never commit real tax data, including in tests or bug reports. Use made-up
names, and SSNs in the 900-xx-xxxx or 000 ranges, which are never issued.
