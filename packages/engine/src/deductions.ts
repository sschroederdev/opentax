import { ageAtEndOfYearDayBeforeRule } from "./dates.ts";
import { percentOf, roundDollars, sumToDollars } from "./money.ts";
import type { FilingStatus, FormW2, Person, ScheduleOneAResult } from "./types.ts";
import type { TaxYearParams } from "./years/index.ts";

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
  const reduction = percentOf(Math.max(0, modifiedAgi - threshold), phaseoutRatePercent);
  return qualifying * Math.max(0, amountPerPerson - reduction);
}

/**
 * Schedule 1-A reduction: `per1000` for each full $1,000 of modified AGI over
 * the threshold (a fraction of $1,000 is dropped).
 */
function phaseoutReduction(modifiedAgi: number, threshold: number, per1000: number): number {
  return Math.floor(Math.max(0, modifiedAgi - threshold) / 1_000) * per1000;
}

export interface ScheduleOneAInput {
  status: FilingStatus;
  taxpayer: Person;
  spouse: Person | undefined;
  w2s: FormW2[];
  modifiedAgi: number;
}

/**
 * Schedule 1-A, Parts II, III, and V: qualified tips, qualified overtime
 * compensation, and the enhanced deduction for seniors. Married filers must
 * file jointly, and the filer needs a valid SSN, to claim tips or overtime.
 */
export function scheduleOneA(input: ScheduleOneAInput, params: TaxYearParams): ScheduleOneAResult {
  const joint = input.status === "marriedFilingJointly";
  const eligibleOwners = new Set<string>();
  if (input.status !== "marriedFilingSeparately") {
    if (input.taxpayer.hasValidSsn) eligibleOwners.add("taxpayer");
    if (joint && input.spouse?.hasValidSsn) eligibleOwners.add("spouse");
  }
  const eligibleW2s = input.w2s.filter((w) => eligibleOwners.has(w.owner));

  const t = params.tipsDeduction;
  const tipsLimited = Math.min(sumToDollars(eligibleW2s.map((w) => w.qualifiedTips)), t.max);
  const tips = Math.max(
    0,
    tipsLimited -
      phaseoutReduction(input.modifiedAgi, joint ? t.phaseoutThresholdJoint : t.phaseoutThreshold, t.reductionPer1000),
  );

  const o = params.overtimeDeduction;
  const overtimeLimited = Math.min(
    sumToDollars(eligibleW2s.map((w) => w.qualifiedOvertimeCompensation)),
    joint ? o.maxJoint : o.max,
  );
  const overtime = Math.max(
    0,
    overtimeLimited -
      phaseoutReduction(input.modifiedAgi, joint ? o.phaseoutThresholdJoint : o.phaseoutThreshold, o.reductionPer1000),
  );

  const senior = seniorDeduction(input.status, input.taxpayer, input.spouse, input.modifiedAgi, params);
  return { tips, overtime, senior, total: tips + overtime + senior };
}

/** Cash charitable contributions deductible by filers who take the standard deduction (2026 and later). */
export function charitableDeduction(status: FilingStatus, cashContributions: number, params: TaxYearParams): number {
  const limits = params.charitableNonItemizer;
  if (!limits) return 0;
  const max = status === "marriedFilingJointly" ? limits.maxJoint : limits.max;
  return Math.min(Math.max(0, roundDollars(cashContributions)), max);
}
