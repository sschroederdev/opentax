/**
 * Input and output types for the tax engine.
 *
 * All money inputs are in dollars and may include cents, exactly as printed
 * on the source document. Computed form lines are whole dollars, following
 * the IRS rule of adding amounts with cents and rounding only the total.
 */

export type FilingStatus =
  | "single"
  | "marriedFilingJointly"
  | "marriedFilingSeparately"
  | "headOfHousehold"
  | "qualifyingSurvivingSpouse";

/** ISO date string, YYYY-MM-DD. */
export type IsoDate = string;

export interface Person {
  firstName: string;
  lastName: string;
  dateOfBirth: IsoDate;
  /** Has an SSN that is valid for employment, issued before the return's due date. */
  hasValidSsn: boolean;
  blind: boolean;
  /** Someone else can claim this person as a dependent. */
  canBeClaimedAsDependent: boolean;
}

export type DependentRelationship =
  | "child"
  | "stepchild"
  | "fosterChild"
  | "sibling"
  | "stepsibling"
  | "halfSibling"
  /** Grandchild, niece, nephew, or other descendant of one of the above. */
  | "descendantOfQualifyingRelative"
  | "parent"
  | "other";

export interface Dependent {
  firstName: string;
  lastName: string;
  dateOfBirth: IsoDate;
  relationship: DependentRelationship;
  /**
   * Months the dependent lived with the filer in the US during the year.
   * A child born or who died during the year and lived with the filer the
   * whole time they were alive counts as 12.
   */
  monthsLivedWithFiler: number;
  hasValidSsn: boolean;
  fullTimeStudent: boolean;
  permanentlyDisabled: boolean;
}

export type Owner = "taxpayer" | "spouse";

export interface FormW2 {
  owner: Owner;
  employerName: string;
  /** Box b, employer identification number. Only printed on Schedule 1-A. */
  employerEin: string;
  /** Box 1 */
  wages: number;
  /** Box 2 */
  federalWithholding: number;
  /** Box 3 */
  socialSecurityWages: number;
  /** Box 4 */
  socialSecurityTaxWithheld: number;
  /** Box 5 */
  medicareWages: number;
  /** Box 6 */
  medicareTaxWithheld: number;
  /** Box 7 */
  socialSecurityTips: number;
  /**
   * Qualified tips for the Schedule 1-A tips deduction (box 12 code TP from
   * 2026; for 2025, the amount the employer reported separately).
   */
  qualifiedTips: number;
  /**
   * Qualified overtime compensation, the premium portion of overtime pay
   * (box 12 code TT from 2026; for 2025, the amount reported separately).
   */
  qualifiedOvertimeCompensation: number;
  /** Box 15, two-letter state code. */
  stateCode: string;
  /** Box 16 */
  stateWages: number;
  /** Box 17 */
  stateIncomeTaxWithheld: number;
}

export interface Form1099Int {
  owner: Owner;
  payerName: string;
  /** Box 1 */
  interest: number;
  /** Box 2 */
  earlyWithdrawalPenalty: number;
  /** Box 3 */
  usSavingsBondAndTreasuryInterest: number;
  /** Box 4 */
  federalWithholding: number;
  /** Box 6 */
  foreignTaxPaid: number;
  /** Box 8 */
  taxExemptInterest: number;
  /** Box 17 */
  stateTaxWithheld: number;
}

export interface Form1099Div {
  owner: Owner;
  payerName: string;
  /** Box 1a */
  ordinaryDividends: number;
  /** Box 1b */
  qualifiedDividends: number;
  /** Box 2a */
  capitalGainDistributions: number;
  /** Box 2b */
  unrecapturedSection1250Gain: number;
  /** Box 2c */
  section1202Gain: number;
  /** Box 2d */
  collectiblesGain: number;
  /** Box 4 */
  federalWithholding: number;
  /** Box 5 */
  section199ADividends: number;
  /** Box 7 */
  foreignTaxPaid: number;
  /** Box 12 */
  exemptInterestDividends: number;
  /** Box 16 */
  stateTaxWithheld: number;
}

/**
 * One sale of a capital asset: a row of Form 8949. Brokers report these on
 * Form 1099-B (securities) or Form 1099-DA (digital assets).
 */
export interface CapitalAssetSale {
  owner: Owner;
  description: string;
  brokerName: string;
  assetType: "security" | "digitalAsset";
  /** The sale was reported on a 1099-B or 1099-DA. */
  reportedOnForm: boolean;
  /** The form shows that cost basis was reported to the IRS (a covered security). */
  basisReportedToIrs: boolean;
  /** Held one year or less ("short") or more than one year ("long"). Box 2 of the 1099-B. */
  term: "short" | "long";
  /** YYYY-MM-DD, or "" for various/inherited. */
  dateAcquired: IsoDate;
  dateSold: IsoDate;
  /** Box 1d */
  proceeds: number;
  /** Box 1e */
  costBasis: number;
  /** Box 1g */
  washSaleLossDisallowed: number;
  /** Box 4 */
  federalWithholding: number;
  /** Box 16 */
  stateTaxWithheld: number;
  /** Collectibles (art, coins, precious metals, some ETFs) are taxed at up to 28%. */
  collectible: boolean;
}

export interface CapitalLossCarryover {
  /** From line 8 of last year's Capital Loss Carryover Worksheet. */
  shortTerm: number;
  /** From line 13 of last year's Capital Loss Carryover Worksheet. */
  longTerm: number;
}

/** A 1099-NEC, 1099-K, or 1099-MISC reporting income for a business. */
export interface BusinessIncomeForm {
  form: "1099-NEC" | "1099-K" | "1099-MISC";
  payerName: string;
  amount: number;
  federalWithholding: number;
  stateTaxWithheld: number;
}

/** Schedule C, Part II expense lines. */
export interface ScheduleCExpenses {
  advertising: number;
  carAndTruck: number;
  commissionsAndFees: number;
  contractLabor: number;
  depreciation: number;
  employeeBenefitPrograms: number;
  insurance: number;
  mortgageInterest: number;
  otherInterest: number;
  legalAndProfessional: number;
  officeExpense: number;
  pensionAndProfitSharing: number;
  rentVehiclesAndEquipment: number;
  rentOtherProperty: number;
  repairsAndMaintenance: number;
  supplies: number;
  taxesAndLicenses: number;
  travel: number;
  /** Total business meals paid; 50% is deductible. */
  meals: number;
  utilities: number;
  wages: number;
  other: number;
}

/** A sole proprietorship, single-member LLC, or freelance/gig activity (Schedule C). */
export interface ScheduleCBusiness {
  owner: Owner;
  name: string;
  /** Six-digit principal business code from the Schedule C instructions. */
  principalBusinessCode: string;
  incomeForms: BusinessIncomeForm[];
  /** Receipts not reported on any form (cash, direct payments). */
  otherGrossReceipts: number;
  returnsAndAllowances: number;
  costOfGoodsSold: number;
  otherIncome: number;
  expenses: ScheduleCExpenses;
  /** Square feet used regularly and exclusively for business (simplified home office method). */
  homeOfficeSquareFeet: number;
  /** Schedule C line G: you materially participated in the business this year. */
  materiallyParticipated: boolean;
}

export interface IllinoisInput {
  residency: "fullYear" | "partYear" | "nonresident";
  /** Property tax paid on your Illinois principal residence. */
  propertyTaxPaid: number;
  /** K-12 tuition, book, and lab fees paid for full-time students under 21. */
  k12EducationExpenses: number;
  /** Use tax owed on out-of-state purchases with no Illinois sales tax. */
  useTax: number;
  estimatedPayments: number;
  /** Contributions to Bright Start, Bright Directions, or ABLE accounts. */
  collegeSavingsContributions: number;
}

/**
 * Yes/no screening questions for situations the engine does not handle yet.
 * Answering yes to any of these produces an "unsupported" diagnostic rather
 * than a silently wrong return.
 */
export interface Screening {
  /** Rental real estate, royalties, partnerships, S corporations, trusts (Schedule E, K-1s). */
  rentalRoyaltyOrK1Income: boolean;
  /** Sold a home, land, or business property (not stocks or crypto). */
  soldHomeOrBusinessProperty: boolean;
  retirementDistributions: boolean;
  socialSecurityBenefits: boolean;
  unemploymentCompensation: boolean;
  marketplaceHealthInsurance: boolean;
  wantsToItemize: boolean;
  /** Interest on a loan for a new US-assembled vehicle (Schedule 1-A Part IV). */
  carLoanInterest: boolean;
  educationExpensesOrStudentLoanInterest: boolean;
  hsaOrIraContributions: boolean;
  childOrDependentCareExpenses: boolean;
  foreignAccountsOrIncome: boolean;
  /** Gambling winnings (W-2G), prizes, alimony received, jury duty pay, and other Schedule 1 income. */
  otherIncome: boolean;
  /** Farm income or loss (Schedule F). */
  farmIncome: boolean;
  /** Paid a household employee, such as a nanny or housekeeper (Schedule H). */
  householdEmployees: boolean;
  /** Lived apart from spouse; relevant for MFS and head-of-household rules. */
  livedApartFromSpouseLastSixMonths: boolean;
}

export interface TaxReturnInput {
  taxYear: number;
  filingStatus: FilingStatus;
  taxpayer: Person;
  /** Required for married filing jointly. */
  spouse?: Person;
  dependents: Dependent[];
  w2s: FormW2[];
  form1099Ints: Form1099Int[];
  form1099Divs: Form1099Div[];
  capitalAssetSales: CapitalAssetSale[];
  capitalLossCarryover: CapitalLossCarryover;
  businesses: ScheduleCBusiness[];
  /** Cash gifts to charities, deductible without itemizing from 2026. */
  charitableCashContributions: number;
  estimatedTaxPayments: number;
  /** Main home was in the US for more than half the year (EITC requirement). */
  mainHomeInUsMoreThanHalfYear: boolean;
  /**
   * You (or your spouse) is a U.S. citizen, U.S. national, or qualified alien
   * (Schedule 3-A, line 8). From 2026 this decides whether refundable credits
   * above your income tax are paid. null means not answered.
   */
  citizenNationalOrQualifiedAlien: boolean | null;
  screening: Screening;
  /** Illinois return inputs, or null to skip the Illinois return. */
  illinois: IllinoisInput | null;
}

export type DiagnosticSeverity =
  /** The input is invalid; the result cannot be trusted. */
  | "error"
  /** A situation the engine cannot compute; the result is likely wrong. */
  | "unsupported"
  /** The result is usable but may overstate tax or needs the filer's attention. */
  | "warning"
  | "info";

export interface Diagnostic {
  severity: DiagnosticSeverity;
  code: string;
  message: string;
}

export interface Form1040Result {
  wages: number;
  taxExemptInterest: number;
  taxableInterest: number;
  qualifiedDividends: number;
  ordinaryDividends: number;
  /** Capital gain or loss: Schedule D, or capital gain distributions when Schedule D isn't required. */
  capitalGainOrLoss: number;
  /** Schedule 1 additional income (business income from Schedule C). */
  additionalIncome: number;
  totalIncome: number;
  /** Schedule 1 adjustments (deductible part of self-employment tax). */
  adjustmentsToIncome: number;
  adjustedGrossIncome: number;
  standardDeduction: number;
  /** Cash charitable contributions deducted without itemizing (2026 and later). */
  charitableDeduction: number;
  /** Schedule 1-A total: tips, overtime, and senior deductions. */
  scheduleOneADeductions: number;
  qualifiedBusinessIncomeDeduction: number;
  taxableIncome: number;
  tax: number;
  childTaxCreditAndCreditForOtherDependents: number;
  /** Schedule 2 other taxes: self-employment tax, Additional Medicare Tax, NIIT. */
  otherTaxes: number;
  totalTax: number;
  /** Line 25a: federal income tax withheld on Forms W-2. */
  withholdingW2: number;
  /** Line 25b: federal income tax withheld on Forms 1099. */
  withholding1099: number;
  /** Line 25d: lines 25a and 25b plus Additional Medicare Tax withheld (Form 8959, line 25c). */
  federalWithholding: number;
  estimatedTaxPayments: number;
  earnedIncomeCredit: number;
  additionalChildTaxCredit: number;
  excessSocialSecurityWithheld: number;
  /** Line 32b: refundable credits withheld as a federal public benefit (Schedule 3-A). */
  federalPublicBenefitReduction: number;
  totalPayments: number;
  refund: number;
  amountOwed: number;
}

export interface QualifiedDividendsWorksheet {
  /** Worksheet line number -> amount, in the IRS worksheet's own numbering. */
  lines: Record<number, number>;
  tax: number;
}

export type Form8949Box = "A" | "B" | "C" | "D" | "E" | "F" | "G" | "H" | "I" | "J" | "K" | "L";

export interface Form8949Row {
  description: string;
  dateAcquired: IsoDate;
  dateSold: IsoDate;
  proceeds: number;
  costBasis: number;
  /** Column (f) */
  adjustmentCode: string;
  /** Column (g): wash sale loss disallowed added back. */
  adjustment: number;
  gainOrLoss: number;
}

export interface Form8949Group {
  box: Form8949Box;
  term: "short" | "long";
  rows: Form8949Row[];
  proceeds: number;
  costBasis: number;
  adjustment: number;
  gainOrLoss: number;
}

export interface ScheduleDResult {
  form8949: Form8949Group[];
  shortTermCarryover: number;
  /** Line 7 */
  netShortTerm: number;
  capitalGainDistributions: number;
  longTermCarryover: number;
  /** Line 15 */
  netLongTerm: number;
  /** Line 16 */
  total: number;
  /** Line 18: 28% rate gain. */
  collectiblesGain: number;
  /** Line 19 */
  unrecapturedSection1250Gain: number;
  /** Line 21: the loss allowed this year, as a negative number (0 for a gain). */
  allowedLoss: number;
  /** Amount for Form 1040 line 7. */
  capitalGainOrLoss: number;
  /** Losses to carry to next year (Capital Loss Carryover Worksheet). */
  carryoverToNextYear: CapitalLossCarryover;
}

export interface ScheduleCResult {
  name: string;
  owner: Owner;
  grossReceipts: number;
  grossIncome: number;
  totalExpenses: number;
  homeOfficeDeduction: number;
  netProfit: number;
}

export interface ScheduleSEResult {
  owner: Owner;
  netProfit: number;
  /** Line 4c / 6: net earnings from self-employment. */
  netEarnings: number;
  /** Line 8d: social security wages and tips from W-2 boxes 3 and 7. */
  socialSecurityWages: number;
  socialSecurityTax: number;
  medicareTax: number;
  selfEmploymentTax: number;
  /** Line 13: deductible part of self-employment tax. */
  deduction: number;
}

export interface ScheduleOneAResult {
  tips: number;
  overtime: number;
  senior: number;
  total: number;
}

export interface Form8995Result {
  /** Line 1, column (c): QBI for each business, in input order. */
  businesses: { name: string; qualifiedBusinessIncome: number; materiallyParticipated: boolean }[];
  /** Line 2 */
  qualifiedBusinessIncome: number;
  qualifiedReitDividends: number;
  taxableIncomeBeforeDeduction: number;
  netCapitalGain: number;
  deduction: number;
  /** Negative QBI to carry forward. */
  lossCarryforward: number;
}

export interface Schedule8812Result {
  qualifyingChildren: number;
  otherDependents: number;
  creditBeforePhaseout: number;
  phaseoutReduction: number;
  creditAfterPhaseout: number;
  creditLimit: number;
  nonrefundableCredit: number;
  additionalChildTaxCredit: number;
}

export interface EarnedIncomeCreditResult {
  eligible: boolean;
  qualifyingChildren: number;
  earnedIncome: number;
  investmentIncome: number;
  credit: number;
  /** Why the filer is not eligible, when eligible is false. */
  ineligibleReasons: string[];
}

export interface Form8959Result {
  medicareWages: number;
  selfEmploymentIncome: number;
  threshold: number;
  /** Line 7: tax on Medicare wages (Schedule 2, line 17b from 2026). */
  onWages: number;
  /** Line 13: tax on self-employment income (Schedule 2, line 11 from 2026). */
  onSelfEmployment: number;
  additionalMedicareTax: number;
  additionalMedicareTaxWithheld: number;
}

export interface ScheduleThreeAResult {
  /** Line 6: refundable credits in excess of income tax. */
  federalPublicBenefit: number;
  citizenNationalOrQualifiedAlien: boolean | null;
  /** Line 8, carried to Form 1040 line 32b. */
  reduction: number;
}

export interface Form8960Result {
  netInvestmentIncome: number;
  modifiedAgi: number;
  threshold: number;
  netInvestmentIncomeTax: number;
}

export interface ScheduleBResult {
  required: boolean;
  interest: { payerName: string; amount: number }[];
  dividends: { payerName: string; amount: number }[];
}

export interface Il1040Result {
  federalAgi: number;
  /** Line 2: federally tax-exempt interest and dividends. */
  taxExemptInterestAddition: number;
  otherAdditions: number;
  totalIncome: number;
  /** Schedule M subtractions (US Treasury interest). */
  subtractions: number;
  baseIncome: number;
  exemptionAllowance: number;
  netIncome: number;
  tax: number;
  propertyTaxCredit: number;
  k12EducationCredit: number;
  taxAfterCredits: number;
  useTax: number;
  totalTax: number;
  withholding: number;
  estimatedPayments: number;
  earnedIncomeCredit: number;
  childTaxCredit: number;
  totalPayments: number;
  refund: number;
  amountOwed: number;
}

export interface TaxReturnResult {
  taxYear: number;
  filingStatus: FilingStatus;
  form1040: Form1040Result;
  qualifiedDividendsWorksheet: QualifiedDividendsWorksheet | null;
  scheduleD: ScheduleDResult | null;
  scheduleC: ScheduleCResult[];
  scheduleSE: ScheduleSEResult[];
  scheduleOneA: ScheduleOneAResult;
  form8995: Form8995Result | null;
  schedule8812: Schedule8812Result;
  earnedIncomeCredit: EarnedIncomeCreditResult;
  /** Schedule 3-A, for 2026 and later returns that claim refundable credits. */
  scheduleThreeA: ScheduleThreeAResult | null;
  form8959: Form8959Result;
  form8960: Form8960Result;
  scheduleB: ScheduleBResult;
  illinois: Il1040Result | null;
  diagnostics: Diagnostic[];
  /** True when there are no error or unsupported diagnostics. */
  complete: boolean;
}
