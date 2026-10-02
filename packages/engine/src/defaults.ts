import type { Dependent, Form1099Div, Form1099Int, FormW2, Person, Screening, TaxReturnInput } from "./types.ts";

/** Factories for blank records, useful for forms and for tests. */

export const emptyScreening = (): Screening => ({
  selfEmploymentOrGigIncome: false,
  soldStockCryptoOrProperty: false,
  retirementDistributions: false,
  socialSecurityBenefits: false,
  unemploymentCompensation: false,
  marketplaceHealthInsurance: false,
  wantsToItemize: false,
  tipsOvertimeOrCarLoanInterest: false,
  educationExpensesOrStudentLoanInterest: false,
  hsaOrIraContributions: false,
  childOrDependentCareExpenses: false,
  foreignAccountsOrIncome: false,
  livedApartFromSpouseLastSixMonths: false,
});

export const emptyPerson = (overrides: Partial<Person> = {}): Person => ({
  firstName: "",
  lastName: "",
  dateOfBirth: "1990-01-15",
  hasValidSsn: true,
  blind: false,
  canBeClaimedAsDependent: false,
  ...overrides,
});

export const emptyDependent = (overrides: Partial<Dependent> = {}): Dependent => ({
  firstName: "",
  lastName: "",
  dateOfBirth: "2015-06-01",
  relationship: "child",
  monthsLivedWithFiler: 12,
  hasValidSsn: true,
  fullTimeStudent: false,
  permanentlyDisabled: false,
  ...overrides,
});

export const emptyW2 = (overrides: Partial<FormW2> = {}): FormW2 => ({
  owner: "taxpayer",
  employerName: "",
  wages: 0,
  federalWithholding: 0,
  socialSecurityWages: 0,
  socialSecurityTaxWithheld: 0,
  medicareWages: 0,
  medicareTaxWithheld: 0,
  ...overrides,
});

export const empty1099Int = (overrides: Partial<Form1099Int> = {}): Form1099Int => ({
  owner: "taxpayer",
  payerName: "",
  interest: 0,
  earlyWithdrawalPenalty: 0,
  usSavingsBondAndTreasuryInterest: 0,
  federalWithholding: 0,
  foreignTaxPaid: 0,
  taxExemptInterest: 0,
  ...overrides,
});

export const empty1099Div = (overrides: Partial<Form1099Div> = {}): Form1099Div => ({
  owner: "taxpayer",
  payerName: "",
  ordinaryDividends: 0,
  qualifiedDividends: 0,
  capitalGainDistributions: 0,
  unrecapturedSection1250Gain: 0,
  section1202Gain: 0,
  collectiblesGain: 0,
  federalWithholding: 0,
  section199ADividends: 0,
  foreignTaxPaid: 0,
  exemptInterestDividends: 0,
  ...overrides,
});

export const emptyReturn = (overrides: Partial<TaxReturnInput> = {}): TaxReturnInput => ({
  taxYear: 2025,
  filingStatus: "single",
  taxpayer: emptyPerson(),
  dependents: [],
  w2s: [],
  form1099Ints: [],
  form1099Divs: [],
  estimatedTaxPayments: 0,
  mainHomeInUsMoreThanHalfYear: true,
  screening: emptyScreening(),
  ...overrides,
});

/**
 * A W-2 with boxes 3-6 filled in the way a typical employer would for
 * `wages`, at the 2025 social security wage base. Handy for examples and tests.
 */
export function typicalW2(wages: number, federalWithholding: number, overrides: Partial<FormW2> = {}): FormW2 {
  const ssWages = Math.min(wages, 176_100);
  const additionalMedicare = Math.max(0, wages - 200_000) * 0.009;
  return emptyW2({
    employerName: "Employer",
    wages,
    federalWithholding,
    socialSecurityWages: ssWages,
    socialSecurityTaxWithheld: Math.round(ssWages * 6.2) / 100,
    medicareWages: wages,
    medicareTaxWithheld: Math.round((wages * 1.45 + additionalMedicare * 100)) / 100,
    ...overrides,
  });
}
