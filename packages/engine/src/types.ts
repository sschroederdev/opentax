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
}

/**
 * Yes/no screening questions for situations the engine does not handle yet.
 * Answering yes to any of these produces an "unsupported" diagnostic rather
 * than a silently wrong return.
 */
export interface Screening {
  selfEmploymentOrGigIncome: boolean;
  soldStockCryptoOrProperty: boolean;
  retirementDistributions: boolean;
  socialSecurityBenefits: boolean;
  unemploymentCompensation: boolean;
  marketplaceHealthInsurance: boolean;
  wantsToItemize: boolean;
  /** Tips, overtime, car-loan interest (Schedule 1-A Parts II-IV). */
  tipsOvertimeOrCarLoanInterest: boolean;
  educationExpensesOrStudentLoanInterest: boolean;
  hsaOrIraContributions: boolean;
  childOrDependentCareExpenses: boolean;
  foreignAccountsOrIncome: boolean;
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
  estimatedTaxPayments: number;
  /** Main home was in the US for more than half the year (EITC requirement). */
  mainHomeInUsMoreThanHalfYear: boolean;
  screening: Screening;
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
  capitalGainDistributions: number;
  totalIncome: number;
  adjustmentsToIncome: number;
  adjustedGrossIncome: number;
  standardDeduction: number;
  /** Schedule 1-A additional deductions (2025: enhanced senior deduction). */
  scheduleOneADeductions: number;
  qualifiedBusinessIncomeDeduction: number;
  taxableIncome: number;
  tax: number;
  childTaxCreditAndCreditForOtherDependents: number;
  otherTaxes: number;
  totalTax: number;
  /** W-2 and 1099 withholding plus Additional Medicare Tax withheld (Form 8959). */
  federalWithholding: number;
  estimatedTaxPayments: number;
  earnedIncomeCredit: number;
  additionalChildTaxCredit: number;
  excessSocialSecurityWithheld: number;
  totalPayments: number;
  refund: number;
  amountOwed: number;
}

export interface QualifiedDividendsWorksheet {
  /** Worksheet line number -> amount, in the IRS worksheet's own numbering. */
  lines: Record<number, number>;
  tax: number;
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
  threshold: number;
  additionalMedicareTax: number;
  additionalMedicareTaxWithheld: number;
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

export interface TaxReturnResult {
  taxYear: number;
  filingStatus: FilingStatus;
  form1040: Form1040Result;
  qualifiedDividendsWorksheet: QualifiedDividendsWorksheet | null;
  schedule8812: Schedule8812Result;
  earnedIncomeCredit: EarnedIncomeCreditResult;
  form8959: Form8959Result;
  form8960: Form8960Result;
  scheduleB: ScheduleBResult;
  diagnostics: Diagnostic[];
  /** True when there are no error or unsupported diagnostics. */
  complete: boolean;
}
