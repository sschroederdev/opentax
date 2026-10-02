import { isValidIsoDate } from "./dates.ts";
import type { Diagnostic, Screening, TaxReturnInput } from "./types.ts";

const SCREENING_MESSAGES: Record<Exclude<keyof Screening, "livedApartFromSpouseLastSixMonths">, string> = {
  selfEmploymentOrGigIncome: "Self-employment and gig income (Schedule C, Schedule SE) is not supported yet.",
  soldStockCryptoOrProperty: "Sales of stock, crypto, or property (Form 8949, Schedule D) are not supported yet.",
  retirementDistributions: "Retirement distributions (Form 1099-R) are not supported yet.",
  socialSecurityBenefits: "Social Security benefits (Form SSA-1099) are not supported yet.",
  unemploymentCompensation: "Unemployment compensation (Form 1099-G) is not supported yet.",
  marketplaceHealthInsurance: "Marketplace health insurance (Form 1095-A, premium tax credit) is not supported yet.",
  wantsToItemize: "Itemized deductions (Schedule A) are not supported yet.",
  tipsOvertimeOrCarLoanInterest:
    "The deductions for tips, overtime, and car loan interest (Schedule 1-A) are not supported yet.",
  educationExpensesOrStudentLoanInterest: "Education credits and the student loan interest deduction are not supported yet.",
  hsaOrIraContributions: "HSA and IRA contributions are not supported yet.",
  childOrDependentCareExpenses: "The child and dependent care credit (Form 2441) is not supported yet.",
  foreignAccountsOrIncome: "Foreign accounts and foreign income are not supported yet.",
};

/**
 * Checks the input for errors and for situations the engine cannot handle.
 * The engine still computes a result, but it is flagged as incomplete.
 */
export function validateInput(input: TaxReturnInput): Diagnostic[] {
  const out: Diagnostic[] = [];
  const error = (code: string, message: string) => out.push({ severity: "error", code, message });
  const unsupported = (code: string, message: string) => out.push({ severity: "unsupported", code, message });
  const warning = (code: string, message: string) => out.push({ severity: "warning", code, message });

  const joint = input.filingStatus === "marriedFilingJointly";
  if (joint && !input.spouse) error("spouse.missing", "Married filing jointly requires spouse information.");
  if (!joint && input.spouse) {
    warning("spouse.ignored", "Spouse information is only used on a joint return and was ignored.");
  }

  const people = [input.taxpayer, ...(joint && input.spouse ? [input.spouse] : []), ...input.dependents];
  for (const person of people) {
    if (!isValidIsoDate(person.dateOfBirth)) {
      error("person.dateOfBirth", `${person.firstName || "A person"} has an invalid date of birth.`);
    }
  }

  for (const d of input.dependents) {
    if (d.monthsLivedWithFiler < 0 || d.monthsLivedWithFiler > 12) {
      error("dependent.months", `${d.firstName || "A dependent"}: months lived with you must be between 0 and 12.`);
    }
  }

  if (input.taxpayer.canBeClaimedAsDependent && input.dependents.length > 0) {
    error("dependents.claimedAsDependent", "You can't claim dependents if someone else can claim you as a dependent.");
  }

  if (!joint && [...input.w2s, ...input.form1099Ints, ...input.form1099Divs].some((f) => f.owner === "spouse")) {
    error("owner.spouse", "Forms belonging to a spouse can only be included on a joint return.");
  }

  const isValidAmount = (amount: unknown) => typeof amount === "number" && Number.isFinite(amount) && amount >= 0;
  if (!isValidAmount(input.estimatedTaxPayments)) {
    error("amount.invalid", "Estimated tax payments must be a non-negative amount.");
  }
  const forms: [string, object][] = [
    ...input.w2s.map((f): [string, object] => [`W-2 from ${f.employerName}`, f]),
    ...input.form1099Ints.map((f): [string, object] => [`1099-INT from ${f.payerName}`, f]),
    ...input.form1099Divs.map((f): [string, object] => [`1099-DIV from ${f.payerName}`, f]),
  ];
  for (const [label, form] of forms) {
    for (const [field, value] of Object.entries(form)) {
      if (typeof value !== "string" && !isValidAmount(value)) {
        error("amount.invalid", `${label}: "${field}" must be a non-negative amount.`);
      }
    }
  }
  for (const div of input.form1099Divs) {
    if (div.qualifiedDividends > div.ordinaryDividends) {
      error("1099div.qualified", `1099-DIV from ${div.payerName}: qualified dividends (1b) can't exceed ordinary dividends (1a).`);
    }
  }

  for (const [key, message] of Object.entries(SCREENING_MESSAGES)) {
    if (input.screening[key as keyof typeof SCREENING_MESSAGES]) unsupported(`screening.${key}`, message);
  }

  if (input.filingStatus === "headOfHousehold" && input.dependents.length === 0) {
    warning("filingStatus.hohNoDependents", "Head of household generally requires a qualifying person. Check your filing status.");
  }
  if (input.filingStatus === "qualifyingSurvivingSpouse" && input.dependents.length === 0) {
    warning(
      "filingStatus.qssNoDependents",
      "Qualifying surviving spouse requires a dependent child. Check your filing status.",
    );
  }
  if (input.filingStatus === "marriedFilingSeparately") {
    warning(
      "filingStatus.mfsItemizing",
      "If your spouse itemizes deductions on their separate return, you must itemize too, which is not supported yet.",
    );
  }

  for (const div of input.form1099Divs) {
    if (div.unrecapturedSection1250Gain > 0 || div.section1202Gain > 0 || div.collectiblesGain > 0) {
      unsupported(
        "1099div.scheduleD",
        `1099-DIV from ${div.payerName} reports amounts in boxes 2b-2d, which require Schedule D (not supported yet).`,
      );
    }
    if (div.section199ADividends > 0) {
      warning(
        "1099div.section199A",
        `1099-DIV from ${div.payerName} reports section 199A dividends. The qualified business income deduction isn't supported yet, so your tax may be slightly overstated.`,
      );
    }
    if (div.foreignTaxPaid > 0) {
      warning(
        "1099div.foreignTax",
        `1099-DIV from ${div.payerName} reports foreign tax paid. The foreign tax credit isn't supported yet, so your tax may be slightly overstated.`,
      );
    }
  }
  for (const int of input.form1099Ints) {
    if (int.earlyWithdrawalPenalty > 0) {
      warning(
        "1099int.earlyWithdrawalPenalty",
        `1099-INT from ${int.payerName} reports an early withdrawal penalty. Deducting it isn't supported yet, so your tax may be slightly overstated.`,
      );
    }
    if (int.foreignTaxPaid > 0) {
      warning(
        "1099int.foreignTax",
        `1099-INT from ${int.payerName} reports foreign tax paid. The foreign tax credit isn't supported yet, so your tax may be slightly overstated.`,
      );
    }
  }

  return out;
}
