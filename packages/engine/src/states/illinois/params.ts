export interface IllinoisParams {
  year: number;
  ratePercent: number;
  /** Per person: taxpayer, spouse, and each dependent. */
  exemptionAllowance: number;
  /** Additional exemption for age 65+ and for blindness, each. */
  additionalExemption: number;
  /** No exemptions or ICR credits above this federal AGI. */
  highIncomeLimit: number;
  highIncomeLimitJoint: number;
  propertyTaxCreditPercent: number;
  k12Credit: { ratePercent: number; floor: number; max: number };
  earnedIncomeCreditPercent: number;
  /** Illinois EIC for workers without children: minimum age (no maximum). */
  eicMinimumAgeWithoutChildren: number;
  childTaxCreditPercentOfEic: number;
  /** Child tax credit requires a dependent child under this age at year end. */
  childTaxCreditChildAgeLimit: number;
}

/**
 * Illinois tax year 2025.
 * Sources: 35 ILCS 5/201(b), 5/204, 5/208, 5/212, 5/212.1; IDOR Bulletin
 * FY 2026-15; 2025 IL-1040 instructions and Schedule ICR instructions.
 */
export const IL2025: IllinoisParams = {
  year: 2025,
  ratePercent: 4.95,
  exemptionAllowance: 2_850,
  additionalExemption: 1_000,
  highIncomeLimit: 250_000,
  highIncomeLimitJoint: 500_000,
  propertyTaxCreditPercent: 5,
  k12Credit: { ratePercent: 25, floor: 250, max: 750 },
  earnedIncomeCreditPercent: 20,
  eicMinimumAgeWithoutChildren: 18,
  childTaxCreditPercentOfEic: 40,
  childTaxCreditChildAgeLimit: 12,
};

/**
 * Illinois tax year 2026.
 * The $2,925 exemption is from IDOR Bulletin FY 2026-15. Other amounts are
 * carried from 2025 until the 2026 IL-1040 instructions are published.
 */
export const IL2026: IllinoisParams = {
  ...IL2025,
  year: 2026,
  exemptionAllowance: 2_925,
};

export const ILLINOIS_YEARS: Record<number, IllinoisParams> = {
  2025: IL2025,
  2026: IL2026,
};
