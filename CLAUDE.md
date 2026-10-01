# OpenTax

Local-first, open source US tax preparation. See README.md and docs/architecture.md.

- The engine lives in `packages/engine`. TypeScript runs directly on Node 22.18+
  (type stripping), so use only erasable syntax: no enums, namespaces, or
  parameter properties. Import with `.ts` extensions.
- `npm test` runs `node --test`, and `npm run typecheck` runs tsc.
- Tax parameters belong in `src/years/tyYYYY.ts` with a source citation.
- Expected values in tests are computed by hand from the IRS instructions, with
  the arithmetic in a comment. Never copy the engine's output into a test as
  the expected value.
- When something isn't supported, emit a diagnostic instead of guessing.
