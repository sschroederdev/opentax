import type { FilingStatus, Schedule8812Result } from "../types.ts";
import type { TaxYearParams } from "../years/ty2025.ts";

export interface ChildTaxCreditInput {
  status: FilingStatus;
  qualifyingChildren: number;
  otherDependents: number;
  modifiedAgi: number;
  /** Credit Limit Worksheet A: tax before credits, less other nonrefundable credits. */
  creditLimit: number;
  earnedIncome: number;
  /** Social security and Medicare tax withheld (W-2 boxes 4 and 6), for Part II-B. */
  socialSecurityAndMedicareWithheld: number;
  earnedIncomeCredit: number;
  excessSocialSecurityWithheld: number;
}

/**
 * Schedule 8812: child tax credit, credit for other dependents, and the
 * refundable additional child tax credit.
 */
export function schedule8812(input: ChildTaxCreditInput, params: TaxYearParams): Schedule8812Result {
  const p = params.childTaxCredit;
  const creditBeforePhaseout = input.qualifyingChildren * p.perChild + input.otherDependents * p.otherDependentCredit;

  const threshold = input.status === "marriedFilingJointly" ? p.phaseoutThresholdJoint : p.phaseoutThreshold;
  const excess = Math.max(0, input.modifiedAgi - threshold);
  // "$50 for each $1,000 (or fraction thereof)" over the threshold.
  const phaseoutReduction = Math.ceil(excess / 1_000) * p.phaseoutPer1000;
  const creditAfterPhaseout = Math.max(0, creditBeforePhaseout - phaseoutReduction);

  const creditLimit = Math.max(0, input.creditLimit);
  const nonrefundableCredit = Math.min(creditAfterPhaseout, creditLimit);

  let additionalChildTaxCredit = 0;
  const unused = creditAfterPhaseout - nonrefundableCredit; // line 16a
  if (unused > 0 && input.qualifyingChildren > 0) {
    const refundableCap = input.qualifyingChildren * p.refundablePerChild; // line 16b
    const line17 = Math.min(unused, refundableCap);
    const line19 = Math.max(0, input.earnedIncome - p.earnedIncomeFloor);
    const line20 = Math.round((line19 * p.refundableRatePercent) / 100);

    if (input.qualifyingChildren < 3 || line20 >= line17) {
      additionalChildTaxCredit = Math.min(line17, line20);
    } else {
      // Part II-B: filers with three or more qualifying children may use
      // social security and Medicare taxes paid instead.
      const line23 = input.socialSecurityAndMedicareWithheld;
      const line24 = input.earnedIncomeCredit + input.excessSocialSecurityWithheld;
      const line25 = Math.max(0, line23 - line24);
      const line26 = Math.max(line20, line25);
      additionalChildTaxCredit = Math.min(line17, line26);
    }
  }

  return {
    qualifyingChildren: input.qualifyingChildren,
    otherDependents: input.otherDependents,
    creditBeforePhaseout,
    phaseoutReduction,
    creditAfterPhaseout,
    creditLimit,
    nonrefundableCredit,
    additionalChildTaxCredit,
  };
}
