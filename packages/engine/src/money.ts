/**
 * Money helpers. Amounts are summed in integer cents to avoid floating point
 * drift, then rounded to whole dollars using the IRS rule: drop amounts under
 * 50 cents and round 50 to 99 cents up to the next dollar.
 */

export function toCents(dollars: number): number {
  return Math.round(dollars * 100);
}

/** Round a non-negative or negative amount to whole dollars, half away from zero. */
export function roundDollars(dollars: number): number {
  const cents = toCents(dollars);
  const sign = cents < 0 ? -1 : 1;
  return (sign * Math.floor((Math.abs(cents) + 50) / 100)) || 0;
}

/** Sum amounts with cents, then round the total to whole dollars. */
export function sumToDollars(amounts: Iterable<number>): number {
  let cents = 0;
  for (const amount of amounts) cents += toCents(amount);
  return roundDollars(cents / 100);
}

/** Sum amounts with cents and return the exact total in dollars (no rounding to dollars). */
export function sumExact(amounts: Iterable<number>): number {
  let cents = 0;
  for (const amount of amounts) cents += toCents(amount);
  return cents / 100;
}

export function nonNegative(amount: number): number {
  return Math.max(0, amount);
}
