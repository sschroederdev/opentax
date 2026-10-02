import { brackets, byStatus, type TaxYearParams } from "./params.ts";

/**
 * Tax year 2026 (returns filed in 2027).
 *
 * Sources:
 * - Rev. Proc. 2025-32 (inflation adjustments for 2026, including the
 *   amendments made by P.L. 119-21)
 * - Social Security Administration, 2026 contribution and benefit base ($184,500)
 * - Public Law 119-21: senior deduction (§70103), child tax credit (§70104),
 *   QBI minimum deduction and wider phase-in (§70105), tips (§70201),
 *   overtime (§70202), and the non-itemizer charitable deduction (§70424)
 */
export const TY2026: TaxYearParams = {
  year: 2026,
  brackets: {
    single: brackets([12_400, 50_400, 105_700, 201_775, 256_225, 640_600]),
    marriedFilingJointly: brackets([24_800, 100_800, 211_400, 403_550, 512_450, 768_700]),
    marriedFilingSeparately: brackets([12_400, 50_400, 105_700, 201_775, 256_225, 384_350]),
    headOfHousehold: brackets([17_700, 67_450, 105_700, 201_750, 256_200, 640_600]),
    qualifyingSurvivingSpouse: brackets([24_800, 100_800, 211_400, 403_550, 512_450, 768_700]),
  },
  standardDeduction: byStatus(16_100, 32_200, 16_100, 24_150),
  additionalStandardDeduction: { unmarried: 2_050, married: 1_650 },
  dependentStandardDeduction: { minimum: 1_350, earnedIncomeAddition: 450 },
  capitalGains: {
    zeroRateMax: byStatus(49_450, 98_900, 49_450, 66_200),
    fifteenRateMax: byStatus(545_500, 613_700, 306_850, 579_600),
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
      earnedIncomeAmount: 8_680,
      maxCredit: 664,
      phaseoutRatePercent: 7.65,
      phaseoutThreshold: 10_860,
      phaseoutThresholdJoint: 18_140,
    },
    {
      creditRatePercent: 34,
      earnedIncomeAmount: 13_020,
      maxCredit: 4_427,
      phaseoutRatePercent: 15.98,
      phaseoutThreshold: 23_890,
      phaseoutThresholdJoint: 31_160,
    },
    {
      creditRatePercent: 40,
      earnedIncomeAmount: 18_290,
      maxCredit: 7_316,
      phaseoutRatePercent: 21.06,
      phaseoutThreshold: 23_890,
      phaseoutThresholdJoint: 31_160,
    },
    {
      creditRatePercent: 45,
      earnedIncomeAmount: 18_290,
      maxCredit: 8_231,
      phaseoutRatePercent: 21.06,
      phaseoutThreshold: 23_890,
      phaseoutThresholdJoint: 31_160,
    },
  ],
  eitcInvestmentIncomeLimit: 12_200,
  eitcWorkerAge: { min: 25, max: 64 },
  socialSecurity: { wageBase: 184_500, employeeRatePercent: 6.2 },
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
    threshold: byStatus(200_000, 250_000, 125_000, 200_000),
  },
  scheduleBThreshold: 1_500,
  tipsDeduction: { max: 25_000, phaseoutThreshold: 150_000, phaseoutThresholdJoint: 300_000, reductionPer1000: 100 },
  overtimeDeduction: {
    max: 12_500,
    maxJoint: 25_000,
    phaseoutThreshold: 150_000,
    phaseoutThresholdJoint: 300_000,
    reductionPer1000: 100,
  },
  charitableNonItemizer: { max: 1_000, maxJoint: 2_000 },
  qualifiedBusinessIncome: {
    ratePercent: 20,
    threshold: byStatus(201_750, 403_500, 201_775, 201_750),
    minimumDeduction: { amount: 400, minimumQbi: 1_000 },
  },
  selfEmployment: { netEarningsPercent: 92.35, socialSecurityRatePercent: 12.4, medicareRatePercent: 2.9, minimumNetEarnings: 400 },
  capitalLossLimit: { normal: 3_000, marriedFilingSeparately: 1_500 },
};
