import type { ScheduleThreeAResult } from "../types.ts";

export interface ScheduleThreeAInput {
  year: number;
  /** Form 1040 line 32a less line 31: the EIC and additional child tax credit. */
  refundableCredits: number;
  /** Form 1040 line 24a. */
  totalTax: number;
  /** Schedule 2 line 20: additional employment and other taxes. */
  scheduleTwoLine20: number;
  /** Schedule 3-A line 8: you or your spouse is a U.S. citizen, U.S. national, or qualified alien. */
  citizenNationalOrQualifiedAlien: boolean | null;
}

/**
 * Schedule 3-A (Form 1040), Federal Public Benefit, new for 2026. The part
 * of the refundable credits that exceeds income tax is a federal public
 * benefit, and it is subtracted on Form 1040 line 32b unless you or your
 * spouse is a U.S. citizen, U.S. national, or qualified alien.
 *
 * Source: 2026 draft Schedule 3-A (created 6/24/26) and draft Form 1040
 * lines 32a-32c. Line 7 (declining the benefit) is not offered; the engine
 * always claims it when eligible.
 */
export function scheduleThreeA(input: ScheduleThreeAInput): ScheduleThreeAResult | null {
  if (input.year < 2026 || input.refundableCredits <= 0) return null;
  const line2 = input.refundableCredits;
  const line5 = input.totalTax - input.scheduleTwoLine20;
  const federalPublicBenefit = Math.max(0, line2 - line5); // line 6
  return {
    refundableCredits: line2,
    incomeTax: line5,
    federalPublicBenefit,
    // Line 8. An unanswered question is reported by computeReturn; until then
    // the benefit is withheld rather than assumed.
    reduction: input.citizenNationalOrQualifiedAlien === true ? 0 : federalPublicBenefit,
  };
}
