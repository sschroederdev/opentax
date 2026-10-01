import type { FilingStatus } from "../types.ts";
import type { TaxYearParams } from "../years/ty2025.ts";

/**
 * Exact bracket tax in hundredths of a cent, so that every rate in the
 * schedule (whole percents) multiplies to an integer.
 */
function bracketTaxHundredthsOfCent(taxableCents: number, status: FilingStatus, params: TaxYearParams): number {
  const brackets = params.brackets[status];
  let total = 0;
  for (let i = 0; i < brackets.length; i++) {
    const bracket = brackets[i]!;
    const next = brackets[i + 1];
    const lowCents = bracket.from * 100;
    const highCents = next ? next.from * 100 : Infinity;
    if (taxableCents <= lowCents) break;
    total += (Math.min(taxableCents, highCents) - lowCents) * bracket.ratePercent;
  }
  return total;
}

function hundredthsOfCentToDollars(amount: number): number {
  return Math.floor((amount + 5_000) / 10_000);
}

/** Tax from the rate schedule, rounded to whole dollars. */
export function taxFromRateSchedule(taxableIncome: number, status: FilingStatus, params: TaxYearParams): number {
  if (taxableIncome <= 0) return 0;
  return hundredthsOfCentToDollars(bracketTaxHundredthsOfCent(Math.round(taxableIncome * 100), status, params));
}

/**
 * The Tax Table row containing `taxableIncome`, as [atLeast, lessThan).
 * Rows are $5, $10, $10, then $25 wide up to $3,000, and $50 wide up to $100,000.
 */
export function taxTableRow(taxableIncome: number): [number, number] {
  if (taxableIncome < 5) return [0, 5];
  if (taxableIncome < 15) return [5, 15];
  if (taxableIncome < 25) return [15, 25];
  const width = taxableIncome < 3_000 ? 25 : 50;
  const atLeast = Math.floor(taxableIncome / width) * width;
  return [atLeast, atLeast + width];
}

/**
 * Regular income tax as the IRS instructions compute it: the Tax Table
 * (tax at the midpoint of the row) for taxable income under $100,000, and
 * the Tax Computation Worksheet (exact rate schedule) at or above $100,000.
 */
export function regularTax(taxableIncome: number, status: FilingStatus, params: TaxYearParams): number {
  if (taxableIncome <= 0) return 0;
  if (taxableIncome >= 100_000) return taxFromRateSchedule(taxableIncome, status, params);
  const [atLeast, lessThan] = taxTableRow(taxableIncome);
  const midpointCents = (atLeast + lessThan) * 50;
  return hundredthsOfCentToDollars(bracketTaxHundredthsOfCent(midpointCents, status, params));
}
