export { computeReturn, UnsupportedTaxYearError } from "./compute.ts";
export { validateInput } from "./validation.ts";
export { regularTax, taxFromRateSchedule } from "./tax/regularTax.ts";
export { SUPPORTED_YEARS, TY2025, TY2026, type TaxYearParams } from "./years/index.ts";
export { ILLINOIS_YEARS, type IllinoisParams } from "./states/illinois/params.ts";
export * from "./defaults.ts";
export type * from "./types.ts";
