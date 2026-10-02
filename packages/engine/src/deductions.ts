import { ageAtEndOfYearDayBeforeRule } from "./dates.ts";
import type { FilingStatus, Person } from "./types.ts";
import type { TaxYearParams } from "./years/ty2025.ts";

const isMarried = (status: FilingStatus) =>
  status === "marriedFilingJointly" || status === "marriedFilingSeparately" || status === "qualifyingSurvivingSpouse";

export function isAge65OrOlder(person: Person, year: number): boolean {
  return ageAtEndOfYearDayBeforeRule(person.dateOfBirth, year) >= 65;
}

/** People whose age and blindness count toward the additional standard deduction. */
function deductionPeople(status: FilingStatus, taxpayer: Person, spouse: Person | undefined): Person[] {
  // A spouse's age and blindness count on a joint return. (On a separate return
  // they count only when the spouse had no income and isn't a dependent, which
  // this engine does not model.)
  return status === "marriedFilingJointly" && spouse ? [taxpayer, spouse] : [taxpayer];
}

/**
 * Standard deduction, including the additional amounts for age 65+ and
 * blindness and the limit for filers who can be claimed as a dependent
 * (Standard Deduction Worksheet for Dependents).
 */
export function standardDeduction(
  status: FilingStatus,
  taxpayer: Person,
  spouse: Person | undefined,
  earnedIncome: number,
  params: TaxYearParams,
): number {
  const people = deductionPeople(status, taxpayer, spouse);
  const perCondition = isMarried(status)
    ? params.additionalStandardDeduction.married
    : params.additionalStandardDeduction.unmarried;
  let conditions = 0;
  for (const person of people) {
    if (isAge65OrOlder(person, params.year)) conditions++;
    if (person.blind) conditions++;
  }

  let basic = params.standardDeduction[status];
  const claimedAsDependent = people.some((p) => p.canBeClaimedAsDependent);
  if (claimedAsDependent) {
    const { minimum, earnedIncomeAddition } = params.dependentStandardDeduction;
    basic = Math.min(basic, Math.max(minimum, earnedIncome + earnedIncomeAddition));
  }
  return basic + conditions * perCondition;
}

/**
 * Enhanced deduction for seniors (Schedule 1-A, Part V; P.L. 119-21 §70103):
 * $6,000 per qualifying individual age 65 or older with a valid SSN, reduced
 * by 6% of modified AGI over $75,000 ($150,000 joint). Not available on a
 * married-filing-separately return.
 */
export function seniorDeduction(
  status: FilingStatus,
  taxpayer: Person,
  spouse: Person | undefined,
  modifiedAgi: number,
  params: TaxYearParams,
): number {
  if (status === "marriedFilingSeparately") return 0;
  const { amountPerPerson, phaseoutRatePercent, phaseoutThreshold, phaseoutThresholdJoint } = params.seniorDeduction;
  const people = status === "marriedFilingJointly" && spouse ? [taxpayer, spouse] : [taxpayer];
  const qualifying = people.filter((p) => p.hasValidSsn && isAge65OrOlder(p, params.year)).length;
  if (qualifying === 0) return 0;

  const threshold = status === "marriedFilingJointly" ? phaseoutThresholdJoint : phaseoutThreshold;
  const reduction = Math.round((Math.max(0, modifiedAgi - threshold) * phaseoutRatePercent) / 100);
  return qualifying * Math.max(0, amountPerPerson - reduction);
}
