import { earnedIncomeCredit } from "./credits/earnedIncomeCredit.ts";
import { schedule8812 } from "./credits/childTaxCredit.ts";
import { seniorDeduction, standardDeduction } from "./deductions.ts";
import { isCtcQualifyingChild, isEitcQualifyingChild } from "./dependents.ts";
import { roundDollars, sumExact, sumToDollars } from "./money.ts";
import { form8959, form8960 } from "./tax/otherTaxes.ts";
import { qualifiedDividendsWorksheet } from "./tax/qualifiedDividends.ts";
import { regularTax } from "./tax/regularTax.ts";
import type { Diagnostic, FormW2, Owner, TaxReturnInput, TaxReturnResult } from "./types.ts";
import { validateInput } from "./validation.ts";
import { SUPPORTED_YEARS, type TaxYearParams } from "./years/ty2025.ts";

export class UnsupportedTaxYearError extends Error {
  constructor(year: number) {
    super(`Tax year ${year} is not supported. Supported years: ${Object.keys(SUPPORTED_YEARS).join(", ")}.`);
    this.name = "UnsupportedTaxYearError";
  }
}

/**
 * Credit for excess social security tax withheld when one person had more
 * than one employer and their combined withholding exceeds the annual maximum.
 * Over-withholding by a single employer must be refunded by that employer.
 */
function excessSocialSecurity(w2s: FormW2[], params: TaxYearParams): number {
  const max = (params.socialSecurity.wageBase * params.socialSecurity.employeeRatePercent) / 100;
  let excess = 0;
  for (const owner of ["taxpayer", "spouse"] satisfies Owner[]) {
    const forms = w2s.filter((w) => w.owner === owner);
    if (forms.length < 2) continue;
    excess += Math.max(0, sumExact(forms.map((w) => w.socialSecurityTaxWithheld)) - max);
  }
  return roundDollars(excess);
}

/**
 * Computes a federal individual income tax return (Form 1040 and the
 * supporting schedules and worksheets this engine supports).
 */
export function computeReturn(input: TaxReturnInput): TaxReturnResult {
  const params = SUPPORTED_YEARS[input.taxYear];
  if (!params) throw new UnsupportedTaxYearError(input.taxYear);

  const diagnostics: Diagnostic[] = validateInput(input);
  const status = input.filingStatus;
  const joint = status === "marriedFilingJointly";
  const spouse = joint ? input.spouse : undefined;
  const filers = spouse ? [input.taxpayer, spouse] : [input.taxpayer];

  // Income
  const wages = sumToDollars(input.w2s.map((w) => w.wages));
  const taxableInterest = sumToDollars(
    input.form1099Ints.flatMap((f) => [f.interest, f.usSavingsBondAndTreasuryInterest]),
  );
  const taxExemptInterest = sumToDollars([
    ...input.form1099Ints.map((f) => f.taxExemptInterest),
    ...input.form1099Divs.map((f) => f.exemptInterestDividends),
  ]);
  const ordinaryDividends = sumToDollars(input.form1099Divs.map((f) => f.ordinaryDividends));
  const qualifiedDividends = sumToDollars(input.form1099Divs.map((f) => f.qualifiedDividends));
  const capitalGainDistributions = sumToDollars(input.form1099Divs.map((f) => f.capitalGainDistributions));
  const totalIncome = wages + taxableInterest + ordinaryDividends + capitalGainDistributions;
  const adjustmentsToIncome = 0;
  const adjustedGrossIncome = totalIncome - adjustmentsToIncome;
  const earnedIncome = wages;

  // Deductions
  const stdDeduction = standardDeduction(status, input.taxpayer, spouse, earnedIncome, params);
  const scheduleOneADeductions = seniorDeduction(status, input.taxpayer, spouse, adjustedGrossIncome, params);
  const qualifiedBusinessIncomeDeduction = 0;
  const taxableIncome = Math.max(
    0,
    adjustedGrossIncome - stdDeduction - scheduleOneADeductions - qualifiedBusinessIncomeDeduction,
  );

  // Tax
  const worksheet =
    qualifiedDividends > 0 || capitalGainDistributions > 0
      ? qualifiedDividendsWorksheet(taxableIncome, qualifiedDividends, capitalGainDistributions, status, params)
      : null;
  const tax = worksheet ? worksheet.tax : regularTax(taxableIncome, status, params);

  // Other taxes
  const medicare = form8959(
    status,
    sumToDollars(input.w2s.map((w) => w.medicareWages)),
    sumToDollars(input.w2s.map((w) => w.medicareTaxWithheld)),
    params,
  );
  const niit = form8960(status, taxableInterest + ordinaryDividends + capitalGainDistributions, adjustedGrossIncome, params);
  const otherTaxes = medicare.additionalMedicareTax + niit.netInvestmentIncomeTax;

  // Credits
  const excessSocialSecurityWithheld = excessSocialSecurity(input.w2s, params);
  const eic = earnedIncomeCredit(
    {
      status,
      filers,
      qualifyingChildren: input.dependents.filter((d) => isEitcQualifyingChild(d, filers, params.year)).length,
      earnedIncome,
      adjustedGrossIncome,
      investmentIncome: taxableInterest + taxExemptInterest + ordinaryDividends + capitalGainDistributions,
      mainHomeInUsMoreThanHalfYear: input.mainHomeInUsMoreThanHalfYear,
      livedApartFromSpouseLastSixMonths: input.screening.livedApartFromSpouseLastSixMonths,
    },
    params,
  );

  const ctcChildren = input.dependents.filter((d) => isCtcQualifyingChild(d, params.year)).length;
  if (ctcChildren > 0 && !filers.some((f) => f.hasValidSsn)) {
    diagnostics.push({
      severity: "unsupported",
      code: "ctc.filerSsn",
      message: "The child tax credit requires you (or your spouse) to have an SSN. Returns filed with an ITIN are not supported yet.",
    });
  }
  const ctc = schedule8812(
    {
      status,
      qualifyingChildren: ctcChildren,
      otherDependents: input.dependents.length - ctcChildren,
      modifiedAgi: adjustedGrossIncome,
      creditLimit: tax,
      earnedIncome,
      socialSecurityAndMedicareWithheld: sumToDollars(
        input.w2s.flatMap((w) => [w.socialSecurityTaxWithheld, w.medicareTaxWithheld]),
      ),
      earnedIncomeCredit: eic.credit,
      excessSocialSecurityWithheld,
    },
    params,
  );

  // Payments
  const federalWithholding =
    sumToDollars([
      ...input.w2s.map((w) => w.federalWithholding),
      ...input.form1099Ints.map((f) => f.federalWithholding),
      ...input.form1099Divs.map((f) => f.federalWithholding),
    ]) + medicare.additionalMedicareTaxWithheld;
  const estimatedTaxPayments = roundDollars(input.estimatedTaxPayments);

  const totalTax = Math.max(0, tax - ctc.nonrefundableCredit) + otherTaxes;
  const totalPayments =
    federalWithholding + estimatedTaxPayments + eic.credit + ctc.additionalChildTaxCredit + excessSocialSecurityWithheld;

  const scheduleB = {
    required: taxableInterest > params.scheduleBThreshold || ordinaryDividends > params.scheduleBThreshold,
    interest: input.form1099Ints.map((f) => ({
      payerName: f.payerName,
      amount: sumToDollars([f.interest, f.usSavingsBondAndTreasuryInterest]),
    })),
    dividends: input.form1099Divs.map((f) => ({ payerName: f.payerName, amount: roundDollars(f.ordinaryDividends) })),
  };
  if (scheduleB.required) {
    diagnostics.push({
      severity: "info",
      code: "scheduleB.foreignAccounts",
      message: "Schedule B is required. Part III asks whether you had foreign accounts or a foreign trust.",
    });
  }

  return {
    taxYear: params.year,
    filingStatus: status,
    form1040: {
      wages,
      taxExemptInterest,
      taxableInterest,
      qualifiedDividends,
      ordinaryDividends,
      capitalGainDistributions,
      totalIncome,
      adjustmentsToIncome,
      adjustedGrossIncome,
      standardDeduction: stdDeduction,
      scheduleOneADeductions,
      qualifiedBusinessIncomeDeduction,
      taxableIncome,
      tax,
      childTaxCreditAndCreditForOtherDependents: ctc.nonrefundableCredit,
      otherTaxes,
      totalTax,
      federalWithholding,
      estimatedTaxPayments,
      earnedIncomeCredit: eic.credit,
      additionalChildTaxCredit: ctc.additionalChildTaxCredit,
      excessSocialSecurityWithheld,
      totalPayments,
      refund: Math.max(0, totalPayments - totalTax),
      amountOwed: Math.max(0, totalTax - totalPayments),
    },
    qualifiedDividendsWorksheet: worksheet,
    schedule8812: ctc,
    earnedIncomeCredit: eic,
    form8959: medicare,
    form8960: niit,
    scheduleB,
    diagnostics,
    complete: !diagnostics.some((d) => d.severity === "error" || d.severity === "unsupported"),
  };
}
