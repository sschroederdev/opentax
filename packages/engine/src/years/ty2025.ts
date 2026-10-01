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
}

const marriedJoint = <T>(single: T, joint: T, separate: T, headOfHousehold: T): ByStatus<T> => ({
  single,
  marriedFilingJointly: joint,
  marriedFilingSeparately: separate,
  headOfHousehold,
  qualifyingSurvivingSpouse: joint,
});

const brackets = (thresholds: number[]): Bracket[] => {
  const rates = [10, 12, 22, 24, 32, 35, 37];
  return rates.map((ratePercent, i) => ({ from: i === 0 ? 0 : thresholds[i - 1]!, ratePercent }));
};

/**
 * Tax year 2025.
 *
 * Sources:
 * - Rev. Proc. 2024-40 (inflation adjustments for 2025)
 * - Public Law 119-21 ("One Big Beautiful Bill Act"), which raised the 2025
 *   standard deduction (§70102), raised the child tax credit to $2,200
 *   (§70104), and added the $6,000 senior deduction (§70103).
 */
export const TY2025: TaxYearParams = {
  year: 2025,
  brackets: {
    single: brackets([11_925, 48_475, 103_350, 197_300, 250_525, 626_350]),
    marriedFilingJointly: brackets([23_850, 96_950, 206_700, 394_600, 501_050, 751_600]),
    marriedFilingSeparately: brackets([11_925, 48_475, 103_350, 197_300, 250_525, 375_800]),
    headOfHousehold: brackets([17_000, 64_850, 103_350, 197_300, 250_500, 626_350]),
    qualifyingSurvivingSpouse: brackets([23_850, 96_950, 206_700, 394_600, 501_050, 751_600]),
  },
  standardDeduction: marriedJoint(15_750, 31_500, 15_750, 23_625),
  additionalStandardDeduction: { unmarried: 2_000, married: 1_600 },
  dependentStandardDeduction: { minimum: 1_350, earnedIncomeAddition: 450 },
  capitalGains: {
    zeroRateMax: marriedJoint(48_350, 96_700, 48_350, 64_750),
    fifteenRateMax: marriedJoint(533_400, 600_050, 300_000, 566_700),
  },
  seniorDeduction: {
    amountPerPerson: 6_000,
    phaseoutRatePercent: 6,
    phaseoutThreshold: 75_000,
    phaseoutThresholdJoint: 150_000,
  },
  childTaxCredit: {
    perChild: 2_200,
    refundablePerChild: 1_700,
    otherDependentCredit: 500,
    phaseoutThreshold: 200_000,
    phaseoutThresholdJoint: 400_000,
    phaseoutPer1000: 50,
    earnedIncomeFloor: 2_500,
    refundableRatePercent: 15,
  },
  eitc: [
    {
      creditRatePercent: 7.65,
      earnedIncomeAmount: 8_490,
      maxCredit: 649,
      phaseoutRatePercent: 7.65,
      phaseoutThreshold: 10_620,
      phaseoutThresholdJoint: 17_730,
    },
    {
      creditRatePercent: 34,
      earnedIncomeAmount: 12_730,
      maxCredit: 4_328,
      phaseoutRatePercent: 15.98,
      phaseoutThreshold: 23_350,
      phaseoutThresholdJoint: 30_470,
    },
    {
      creditRatePercent: 40,
      earnedIncomeAmount: 17_880,
      maxCredit: 7_152,
      phaseoutRatePercent: 21.06,
      phaseoutThreshold: 23_350,
      phaseoutThresholdJoint: 30_470,
    },
    {
      creditRatePercent: 45,
      earnedIncomeAmount: 17_880,
      maxCredit: 8_046,
      phaseoutRatePercent: 21.06,
      phaseoutThreshold: 23_350,
      phaseoutThresholdJoint: 30_470,
    },
  ],
  eitcInvestmentIncomeLimit: 11_950,
  eitcWorkerAge: { min: 25, max: 64 },
  socialSecurity: { wageBase: 176_100, employeeRatePercent: 6.2 },
  additionalMedicare: {
    ratePercent: 0.9,
    regularRatePercent: 1.45,
    threshold: {
      single: 200_000,
      marriedFilingJointly: 250_000,
      marriedFilingSeparately: 125_000,
      headOfHousehold: 200_000,
      qualifyingSurvivingSpouse: 200_000,
    },
  },
  netInvestmentIncomeTax: {
    ratePercent: 3.8,
    threshold: marriedJoint(200_000, 250_000, 125_000, 200_000),
  },
  scheduleBThreshold: 1_500,
};

export const SUPPORTED_YEARS: Record<number, TaxYearParams> = {
  2025: TY2025,
};
