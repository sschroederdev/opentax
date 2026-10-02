import { ageAtEndOfYearDayBeforeRule } from "../dates.ts";
import type { EarnedIncomeCreditResult, FilingStatus, Person } from "../types.ts";
import type { EitcParams, TaxYearParams } from "../years/index.ts";

export interface EarnedIncomeCreditInput {
  status: FilingStatus;
  /** The taxpayer, plus the spouse on a joint return. */
  filers: Person[];
  qualifyingChildren: number;
  earnedIncome: number;
  adjustedGrossIncome: number;
  investmentIncome: number;
  mainHomeInUsMoreThanHalfYear: boolean;
  livedApartFromSpouseLastSixMonths: boolean;
}

/** Eligibility rules that a state credit based on the federal EITC may relax. */
export interface EitcRules {
  workerAge: { min: number; max: number };
  requireSsn: boolean;
}

const basisPoints = (percent: number) => Math.round(percent * 100);

/**
 * Income at which the credit reaches zero. Matches the "completed phaseout
 * amount" published in the revenue procedure.
 */
export function eitcCompletedPhaseout(schedule: EitcParams, joint: boolean): number {
  const threshold = joint ? schedule.phaseoutThresholdJoint : schedule.phaseoutThreshold;
  return threshold + Math.round((schedule.maxCredit * 100) / schedule.phaseoutRatePercent);
}

/**
 * The amount the EIC Table shows for `income`: the credit computed at the
 * midpoint of the $50-wide row containing it, rounded to whole dollars. The
 * table ends at the completed phaseout amount.
 */
export function eitcTableAmount(income: number, schedule: EitcParams, joint: boolean): number {
  if (income < 1 || income >= eitcCompletedPhaseout(schedule, joint)) return 0;
  const rowStart = Math.floor(income / 50) * 50;
  const midpointCents = (rowStart + 25) * 100;

  // Work in (cents x basis points) so that rates like 7.65% stay exact.
  const scale = 100 * 10_000;
  const phaseIn = Math.min(midpointCents * basisPoints(schedule.creditRatePercent), schedule.maxCredit * scale);
  const threshold = joint ? schedule.phaseoutThresholdJoint : schedule.phaseoutThreshold;
  const excessCents = Math.max(0, midpointCents - threshold * 100);
  const credit = phaseIn - excessCents * basisPoints(schedule.phaseoutRatePercent);
  return credit <= 0 ? 0 : Math.floor((credit + scale / 2) / scale);
}

export function earnedIncomeCredit(
  input: EarnedIncomeCreditInput,
  params: TaxYearParams,
  rules: EitcRules = { workerAge: params.eitcWorkerAge, requireSsn: true },
): EarnedIncomeCreditResult {
  const children = Math.min(3, input.qualifyingChildren);
  const reasons: string[] = [];

  if (input.filers.some((f) => f.canBeClaimedAsDependent)) {
    reasons.push("You can be claimed as a dependent by someone else.");
  }
  if (rules.requireSsn && input.filers.some((f) => !f.hasValidSsn)) {
    reasons.push("Everyone on the return must have an SSN valid for employment.");
  }
  if (input.status === "marriedFilingSeparately" && !(children > 0 && input.livedApartFromSpouseLastSixMonths)) {
    reasons.push(
      "Married filing separately qualifies only with a qualifying child and living apart from your spouse for the last 6 months of the year.",
    );
  }
  if (input.investmentIncome > params.eitcInvestmentIncomeLimit) {
    reasons.push(`Investment income is over $${params.eitcInvestmentIncomeLimit.toLocaleString("en-US")}.`);
  }
  if (input.earnedIncome <= 0) {
    reasons.push("You need earned income to claim the credit.");
  }
  if (children === 0) {
    const { min, max } = rules.workerAge;
    const ageOk = input.filers.some((f) => {
      const age = ageAtEndOfYearDayBeforeRule(f.dateOfBirth, params.year);
      return age >= min && age <= max;
    });
    if (!ageOk) {
      const range = Number.isFinite(max) ? `age ${min} to ${max}` : `at least age ${min}`;
      reasons.push(`Without a qualifying child, you (or your spouse) must be ${range}.`);
    }
    if (!input.mainHomeInUsMoreThanHalfYear) {
      reasons.push("Without a qualifying child, your main home must be in the US for more than half the year.");
    }
  }

  let credit = 0;
  if (reasons.length === 0) {
    const schedule = params.eitc[children]!;
    const joint = input.status === "marriedFilingJointly";
    const threshold = joint ? schedule.phaseoutThresholdJoint : schedule.phaseoutThreshold;
    credit = eitcTableAmount(input.earnedIncome, schedule, joint);
    // When AGI reaches the phaseout range and differs from earned income,
    // the credit is the smaller of the amounts for earned income and AGI.
    if (input.adjustedGrossIncome >= threshold && input.adjustedGrossIncome !== input.earnedIncome) {
      credit = Math.min(credit, eitcTableAmount(input.adjustedGrossIncome, schedule, joint));
    }
  }

  return {
    eligible: reasons.length === 0,
    qualifyingChildren: children,
    earnedIncome: input.earnedIncome,
    investmentIncome: input.investmentIncome,
    credit,
    ineligibleReasons: reasons,
  };
}
