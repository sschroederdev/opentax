import { ageAtEndOfYearDayBeforeRule } from "./dates.ts";
import { percentOf, roundDollars } from "./money.ts";
import type { FilingStatus, FormW2, Person, ScheduleOneAPart, ScheduleOneAResult, ScheduleOneASenior } from "./types.ts";
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
function seniorPart(
  status: FilingStatus,
  taxpayer: Person,
  spouse: Person | undefined,
  modifiedAgi: number,
  params: TaxYearParams,
): ScheduleOneASenior {
  const { amountPerPerson, phaseoutRatePercent, phaseoutThreshold, phaseoutThresholdJoint } = params.seniorDeduction;
  const joint = status === "marriedFilingJointly";
  const threshold = joint ? phaseoutThresholdJoint : phaseoutThreshold;
  const excess = Math.max(0, modifiedAgi - threshold);
  const reduction = percentOf(excess, phaseoutRatePercent);
  const perPerson = Math.max(0, amountPerPerson - reduction);
  const qualifies = (p: Person | undefined) =>
    status !== "marriedFilingSeparately" && !!p && p.hasValidSsn && isAge65OrOlder(p, params.year);
  return {
    threshold,
    excess,
    reduction,
    perPerson,
    taxpayer: qualifies(taxpayer) ? perPerson : 0,
    spouse: joint && qualifies(spouse) ? perPerson : 0,
  };
}

/**
 * Schedule 1-A Part II or III: one row per W-2, a cap, and a reduction for
 * each full $1,000 of modified AGI over the threshold (a fraction of $1,000
 * is dropped).
 */
function phaseoutPart(
  w2s: FormW2[],
  amountOf: (w: FormW2) => number,
  max: number,
  threshold: number,
  per1000: number,
  modifiedAgi: number,
): ScheduleOneAPart {
  // Each W-2 is a row (line 4 or 16); the total adds the rounded rows.
  const rows = w2s
    .map((w) => ({ employerName: w.employerName, employerEin: w.employerEin, amount: roundDollars(amountOf(w)) }))
    .filter((row) => row.amount !== 0);
  const total = rows.reduce((sum, row) => sum + row.amount, 0);
  const limited = Math.min(total, max);
  const excess = Math.max(0, modifiedAgi - threshold);
  const excessThousands = Math.floor(excess / 1_000);
  const reduction = excessThousands * per1000;
  return { rows, total, limited, threshold, excess, excessThousands, reduction, deduction: Math.max(0, limited - reduction) };
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
  const tipsPart = phaseoutPart(
    eligibleW2s,
    (w) => w.qualifiedTips,
    t.max,
    joint ? t.phaseoutThresholdJoint : t.phaseoutThreshold,
    t.reductionPer1000,
    input.modifiedAgi,
  );
  const o = params.overtimeDeduction;
  const overtimePart = phaseoutPart(
    eligibleW2s,
    (w) => w.qualifiedOvertimeCompensation,
    joint ? o.maxJoint : o.max,
    joint ? o.phaseoutThresholdJoint : o.phaseoutThreshold,
    o.reductionPer1000,
    input.modifiedAgi,
  );
  const seniorLines = seniorPart(input.status, input.taxpayer, input.spouse, input.modifiedAgi, params);

  const tips = tipsPart.deduction;
  const overtime = overtimePart.deduction;
  const senior = seniorLines.taxpayer + seniorLines.spouse;
  return { tips, overtime, senior, total: tips + overtime + senior, tipsPart, overtimePart, seniorPart: seniorLines };
}

/** Cash charitable contributions deductible by filers who take the standard deduction (2026 and later). */
export function charitableDeduction(status: FilingStatus, cashContributions: number, params: TaxYearParams): number {
  const limits = params.charitableNonItemizer;
  if (!limits) return 0;
  const max = status === "marriedFilingJointly" ? limits.maxJoint : limits.max;
  return Math.min(Math.max(0, roundDollars(cashContributions)), max);
}
