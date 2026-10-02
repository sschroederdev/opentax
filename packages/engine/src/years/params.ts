import type { FilingStatus } from "../types.ts";

/** A bracket starts at `from` dollars of taxable income and applies `ratePercent`. */
export interface Bracket {
  from: number;
  ratePercent: number;
}

export type ByStatus<T> = Record<FilingStatus, T>;

export interface EitcParams {
  creditRatePercent: number;
  earnedIncomeAmount: number;
  /** Maximum credit, as published (rounded to whole dollars). */
  maxCredit: number;
  phaseoutRatePercent: number;
  phaseoutThreshold: number;
  phaseoutThresholdJoint: number;
}

export interface TaxYearParams {
  year: number;
  brackets: ByStatus<Bracket[]>;
  standardDeduction: ByStatus<number>;
  /** Additional standard deduction per condition (65+ or blind). */
  additionalStandardDeduction: { unmarried: number; married: number };
  dependentStandardDeduction: { minimum: number; earnedIncomeAddition: number };
  capitalGains: {
    zeroRateMax: ByStatus<number>;
    fifteenRateMax: ByStatus<number>;
  };
  seniorDeduction: {
    amountPerPerson: number;
    phaseoutRatePercent: number;
    phaseoutThreshold: number;
    phaseoutThresholdJoint: number;
  };
  childTaxCredit: {
    perChild: number;
    refundablePerChild: number;
    otherDependentCredit: number;
    phaseoutThreshold: number;
    phaseoutThresholdJoint: number;
    /** Reduction per $1,000 (or fraction) of MAGI over the threshold. */
    phaseoutPer1000: number;
    earnedIncomeFloor: number;
    refundableRatePercent: number;
  };
  /** Indexed by number of qualifying children: 0, 1, 2, 3+. */
  eitc: [EitcParams, EitcParams, EitcParams, EitcParams];
  eitcInvestmentIncomeLimit: number;
  eitcWorkerAge: { min: number; max: number };
  socialSecurity: { wageBase: number; employeeRatePercent: number };
  additionalMedicare: { ratePercent: number; regularRatePercent: number; threshold: ByStatus<number> };
  netInvestmentIncomeTax: { ratePercent: number; threshold: ByStatus<number> };
  /** Schedule B is required when interest or ordinary dividends exceed this. */
  scheduleBThreshold: number;
  /** Schedule 1-A deductions for qualified tips and overtime (2025-2028). */
  tipsDeduction: { max: number; phaseoutThreshold: number; phaseoutThresholdJoint: number; reductionPer1000: number };
  overtimeDeduction: {
    max: number;
    maxJoint: number;
    phaseoutThreshold: number;
    phaseoutThresholdJoint: number;
    reductionPer1000: number;
  };
  /** Cash charitable contributions deductible without itemizing (2026 and later). */
  charitableNonItemizer: { max: number; maxJoint: number } | null;
  qualifiedBusinessIncome: {
    ratePercent: number;
    /** Above this taxable income, Form 8995-A is required. */
    threshold: ByStatus<number>;
    /** Minimum deduction for at least `minimumQbi` of active QBI (2026 and later). */
    minimumDeduction: { amount: number; minimumQbi: number } | null;
  };
  selfEmployment: {
    netEarningsPercent: number;
    socialSecurityRatePercent: number;
    medicareRatePercent: number;
    minimumNetEarnings: number;
  };
  capitalLossLimit: { normal: number; marriedFilingSeparately: number };
}

export const byStatus = <T>(single: T, joint: T, separate: T, headOfHousehold: T): ByStatus<T> => ({
  single,
  marriedFilingJointly: joint,
  marriedFilingSeparately: separate,
  headOfHousehold,
  qualifyingSurvivingSpouse: joint,
});

export const brackets = (thresholds: number[]): Bracket[] => {
  const rates = [10, 12, 22, 24, 32, 35, 37];
  return rates.map((ratePercent, i) => ({ from: i === 0 ? 0 : thresholds[i - 1]!, ratePercent }));
};
