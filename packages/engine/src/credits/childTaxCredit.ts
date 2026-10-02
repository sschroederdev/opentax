import { percentOf } from "../money.ts";
import type { FilingStatus, Schedule8812Result } from "../types.ts";
import type { TaxYearParams } from "../years/index.ts";

export interface ChildTaxCreditInput {
  status: FilingStatus;
  qualifyingChildren: number;
  otherDependents: number;
  modifiedAgi: number;
  /** Credit Limit Worksheet A: tax before credits, less other nonrefundable credits. */
  creditLimit: number;
  earnedIncome: number;
  /** Part II-B line 21: social security and Medicare tax withheld (W-2 boxes 4 and 6). */
  socialSecurityAndMedicareWithheld: number;
  /** Part II-B line 22: Schedule 1 line 15, the deductible part of self-employment tax. */
  selfEmploymentTaxDeduction: number;
  earnedIncomeCredit: number;
  excessSocialSecurityWithheld: number;
}

/**
 * Schedule 8812: child tax credit, credit for other dependents, and the
 * refundable additional child tax credit.
 */
export function schedule8812(input: ChildTaxCreditInput, params: TaxYearParams): Schedule8812Result {
  const p = params.childTaxCredit;
  const childCredit = input.qualifyingChildren * p.perChild; // line 5
  const otherDependentCredit = input.otherDependents * p.otherDependentCredit; // line 7
  const creditBeforePhaseout = childCredit + otherDependentCredit; // line 8

  const phaseoutThreshold = input.status === "marriedFilingJointly" ? p.phaseoutThresholdJoint : p.phaseoutThreshold;
  // Line 10: the excess rounded up to a multiple of $1,000, so the
  // reduction is "$50 for each $1,000 (or fraction thereof)".
  const excessOverThreshold = Math.ceil(Math.max(0, input.modifiedAgi - phaseoutThreshold) / 1_000) * 1_000;
  const phaseoutReduction = (excessOverThreshold / 1_000) * p.phaseoutPer1000; // line 11
  const creditAfterPhaseout = Math.max(0, creditBeforePhaseout - phaseoutReduction);

  const creditLimit = Math.max(0, input.creditLimit);
  const nonrefundableCredit = Math.min(creditAfterPhaseout, creditLimit);

  let additionalChildTaxCredit = 0;
  let partTwoA: Schedule8812Result["partTwoA"] = null;
  let partTwoB: Schedule8812Result["partTwoB"] = null;
  const line16a = creditAfterPhaseout - nonrefundableCredit;
  if (line16a > 0 && input.qualifyingChildren > 0) {
    const line16b = input.qualifyingChildren * p.refundablePerChild;
    const line17 = Math.min(line16a, line16b);
    const line19 = Math.max(0, input.earnedIncome - p.earnedIncomeFloor);
    const line20 = percentOf(line19, p.refundableRatePercent);
    partTwoA = { line16a, line16b, line17, line18a: input.earnedIncome, line19, line20 };

    if (input.qualifyingChildren < 3 || line20 >= line17) {
      additionalChildTaxCredit = Math.min(line17, line20);
    } else {
      // Part II-B: filers with three or more qualifying children may use
      // social security and Medicare taxes paid instead.
      const line21 = input.socialSecurityAndMedicareWithheld;
      const line22 = input.selfEmploymentTaxDeduction;
      const line23 = line21 + line22;
      const line24 = input.earnedIncomeCredit + input.excessSocialSecurityWithheld;
      const line25 = Math.max(0, line23 - line24);
      const line26 = Math.max(line20, line25);
      partTwoB = { line21, line22, line23, line24, line25, line26 };
      additionalChildTaxCredit = Math.min(line17, line26);
    }
  }

  return {
    qualifyingChildren: input.qualifyingChildren,
    otherDependents: input.otherDependents,
    childCredit,
    otherDependentCredit,
    creditBeforePhaseout,
    phaseoutThreshold,
    excessOverThreshold,
    phaseoutReduction,
    creditAfterPhaseout,
    creditLimit,
    nonrefundableCredit,
    partTwoA,
    partTwoB,
    additionalChildTaxCredit,
  };
}
