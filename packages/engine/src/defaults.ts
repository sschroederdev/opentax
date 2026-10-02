import type {
  BusinessIncomeForm,
  CapitalAssetSale,
  Dependent,
  Form1099Div,
  Form1099Int,
  FormW2,
  IllinoisInput,
  Person,
  ScheduleCBusiness,
  ScheduleCExpenses,
  Screening,
  TaxReturnInput,
} from "./types.ts";
import { SUPPORTED_YEARS } from "./years/index.ts";

/** The tax year new returns default to. */
export const DEFAULT_TAX_YEAR = 2026;

/** Factories for blank records, useful for forms and for tests. */

export const emptyScreening = (): Screening => ({
  rentalRoyaltyOrK1Income: false,
  soldHomeOrBusinessProperty: false,
  retirementDistributions: false,
  socialSecurityBenefits: false,
  unemploymentCompensation: false,
  marketplaceHealthInsurance: false,
  wantsToItemize: false,
  carLoanInterest: false,
  educationExpensesOrStudentLoanInterest: false,
  hsaOrIraContributions: false,
  childOrDependentCareExpenses: false,
  foreignAccountsOrIncome: false,
  otherIncome: false,
  farmIncome: false,
  householdEmployees: false,
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
  employerEin: "",
  wages: 0,
  federalWithholding: 0,
  socialSecurityWages: 0,
  socialSecurityTaxWithheld: 0,
  medicareWages: 0,
  medicareTaxWithheld: 0,
  socialSecurityTips: 0,
  qualifiedTips: 0,
  qualifiedOvertimeCompensation: 0,
  stateCode: "",
  stateWages: 0,
  stateIncomeTaxWithheld: 0,
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
  stateTaxWithheld: 0,
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
  stateTaxWithheld: 0,
  ...overrides,
});

export const emptySale = (overrides: Partial<CapitalAssetSale> = {}): CapitalAssetSale => ({
  owner: "taxpayer",
  description: "",
  brokerName: "",
  assetType: "security",
  reportedOnForm: true,
  basisReportedToIrs: true,
  term: "short",
  dateAcquired: "",
  dateSold: `${DEFAULT_TAX_YEAR}-06-01`,
  proceeds: 0,
  costBasis: 0,
  washSaleLossDisallowed: 0,
  federalWithholding: 0,
  stateTaxWithheld: 0,
  collectible: false,
  ...overrides,
});

export const emptyExpenses = (overrides: Partial<ScheduleCExpenses> = {}): ScheduleCExpenses => ({
  advertising: 0,
  carAndTruck: 0,
  commissionsAndFees: 0,
  contractLabor: 0,
  depreciation: 0,
  employeeBenefitPrograms: 0,
  insurance: 0,
  mortgageInterest: 0,
  otherInterest: 0,
  legalAndProfessional: 0,
  officeExpense: 0,
  pensionAndProfitSharing: 0,
  rentVehiclesAndEquipment: 0,
  rentOtherProperty: 0,
  repairsAndMaintenance: 0,
  supplies: 0,
  taxesAndLicenses: 0,
  travel: 0,
  meals: 0,
  utilities: 0,
  wages: 0,
  other: 0,
  ...overrides,
});

export const emptyBusinessIncomeForm = (overrides: Partial<BusinessIncomeForm> = {}): BusinessIncomeForm => ({
  form: "1099-NEC",
  payerName: "",
  amount: 0,
  federalWithholding: 0,
  stateTaxWithheld: 0,
  ...overrides,
});

export const emptyBusiness = (overrides: Partial<ScheduleCBusiness> = {}): ScheduleCBusiness => ({
  owner: "taxpayer",
  name: "",
  principalBusinessCode: "",
  incomeForms: [],
  otherGrossReceipts: 0,
  returnsAndAllowances: 0,
  costOfGoodsSold: 0,
  otherIncome: 0,
  expenses: emptyExpenses(),
  homeOfficeSquareFeet: 0,
  materiallyParticipated: true,
  ...overrides,
});

export const emptyIllinois = (overrides: Partial<IllinoisInput> = {}): IllinoisInput => ({
  residency: "fullYear",
  propertyTaxPaid: 0,
  k12EducationExpenses: 0,
  useTax: 0,
  estimatedPayments: 0,
  collegeSavingsContributions: 0,
  ...overrides,
});

export const emptyReturn = (overrides: Partial<TaxReturnInput> = {}): TaxReturnInput => ({
  taxYear: DEFAULT_TAX_YEAR,
  filingStatus: "single",
  taxpayer: emptyPerson(),
  dependents: [],
  w2s: [],
  form1099Ints: [],
  form1099Divs: [],
  capitalAssetSales: [],
  capitalLossCarryover: { shortTerm: 0, longTerm: 0 },
  businesses: [],
  charitableCashContributions: 0,
  estimatedTaxPayments: 0,
  mainHomeInUsMoreThanHalfYear: true,
  citizenNationalOrQualifiedAlien: null,
  screening: emptyScreening(),
  illinois: null,
  ...overrides,
});

/**
 * A W-2 with boxes 3-6 filled in the way a typical employer would for
 * `wages`, using the social security wage base for `taxYear`. Handy for
 * examples and tests.
 */
export function typicalW2(
  wages: number,
  federalWithholding: number,
  overrides: Partial<FormW2> = {},
  taxYear: number = DEFAULT_TAX_YEAR,
): FormW2 {
  const wageBase = SUPPORTED_YEARS[taxYear]?.socialSecurity.wageBase ?? 0;
  const ssWages = Math.min(wages, wageBase);
  const additionalMedicare = Math.max(0, wages - 200_000) * 0.9;
  return emptyW2({
    employerName: "Employer",
    wages,
    federalWithholding,
    socialSecurityWages: ssWages,
    socialSecurityTaxWithheld: Math.round(ssWages * 6.2) / 100,
    medicareWages: wages,
    medicareTaxWithheld: Math.round(wages * 1.45 + additionalMedicare) / 100,
    ...overrides,
  });
}

export type DeepPartial<T> = T extends (infer U)[]
  ? DeepPartial<U>[]
  : T extends object
    ? { [K in keyof T]?: DeepPartial<T[K]> }
    : T;

/**
 * Fills in missing fields with their blank defaults, so returns saved by an
 * older version (or written by hand) can be computed.
 */
export function normalizeReturn(raw: DeepPartial<TaxReturnInput>): TaxReturnInput {
  const base = emptyReturn();
  const list = <T>(items: unknown[] | undefined, make: (o: Partial<T>) => T) =>
    (items ?? []).map((item) => make(item as Partial<T>));
  const { spouse: _spouse, ...rest } = raw as Partial<TaxReturnInput>;
  return {
    ...base,
    ...rest,
    taxpayer: emptyPerson(raw.taxpayer as Partial<Person>),
    ...(raw.spouse ? { spouse: emptyPerson(raw.spouse as Partial<Person>) } : {}),
    dependents: list(raw.dependents, emptyDependent),
    w2s: list(raw.w2s, emptyW2),
    form1099Ints: list(raw.form1099Ints, empty1099Int),
    form1099Divs: list(raw.form1099Divs, empty1099Div),
    capitalAssetSales: list(raw.capitalAssetSales, emptySale),
    capitalLossCarryover: { ...base.capitalLossCarryover, ...raw.capitalLossCarryover },
    businesses: (raw.businesses ?? []).map((b) =>
      emptyBusiness({
        ...(b as Partial<ScheduleCBusiness>),
        incomeForms: list(b.incomeForms, emptyBusinessIncomeForm),
        expenses: emptyExpenses(b.expenses as Partial<ScheduleCExpenses>),
      }),
    ),
    screening: { ...emptyScreening(), ...(raw.screening as Partial<Screening>) },
    illinois: raw.illinois ? emptyIllinois(raw.illinois as Partial<IllinoisInput>) : null,
  };
}
