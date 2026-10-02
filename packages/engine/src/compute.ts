import { earnedIncomeCredit, type EarnedIncomeCreditInput } from "./credits/earnedIncomeCredit.ts";
import { schedule8812 } from "./credits/childTaxCredit.ts";
import { scheduleThreeA } from "./credits/federalPublicBenefit.ts";
import { charitableDeduction, scheduleOneA, standardDeduction } from "./deductions.ts";
import { isCtcQualifyingChild, isEitcQualifyingChild } from "./dependents.ts";
import { scheduleD } from "./income/capitalGains.ts";
import { scheduleC, scheduleSE } from "./income/selfEmployment.ts";
import { roundDollars, sumExact, sumRounded, sumToDollars } from "./money.ts";
import { form8995, form8995Applies } from "./qualifiedBusinessIncome.ts";
import { il1040 } from "./states/illinois/il1040.ts";
import { form8959, form8960 } from "./tax/otherTaxes.ts";
import { qualifiedDividendsWorksheet } from "./tax/qualifiedDividends.ts";
import { regularTax } from "./tax/regularTax.ts";
import type {
  Diagnostic,
  Form8995Result,
  FormW2,
  Owner,
  ScheduleSEResult,
  TaxReturnInput,
  TaxReturnResult,
} from "./types.ts";
import { validateInput } from "./validation.ts";
import { SUPPORTED_YEARS, type TaxYearParams } from "./years/index.ts";

export class UnsupportedTaxYearError extends Error {
  constructor(year: number) {
    super(`Tax year ${year} is not supported. Supported years: ${Object.keys(SUPPORTED_YEARS).join(", ")}.`);
    this.name = "UnsupportedTaxYearError";
  }
}

const OWNERS: Owner[] = ["taxpayer", "spouse"];

/**
 * Credit for excess social security tax withheld when one person had more
 * than one employer and their combined withholding exceeds the annual maximum.
 * Over-withholding by a single employer must be refunded by that employer.
 */
function excessSocialSecurity(w2s: FormW2[], params: TaxYearParams): number {
  const max = (params.socialSecurity.wageBase * params.socialSecurity.employeeRatePercent) / 100;
  let excess = 0;
  for (const owner of OWNERS) {
    const forms = w2s.filter((w) => w.owner === owner);
    if (forms.length < 2) continue;
    excess += Math.max(0, sumExact(forms.map((w) => w.socialSecurityTaxWithheld)) - max);
  }
  return roundDollars(excess);
}

/**
 * Computes a federal individual income tax return (Form 1040 and the
 * supporting schedules and worksheets this engine supports), and the
 * Illinois return when requested.
 */
export function computeReturn(input: TaxReturnInput): TaxReturnResult {
  const params = SUPPORTED_YEARS[input.taxYear];
  if (!params) throw new UnsupportedTaxYearError(input.taxYear);

  const diagnostics: Diagnostic[] = validateInput(input);
  const status = input.filingStatus;
  const joint = status === "marriedFilingJointly";
  const spouse = joint ? input.spouse : undefined;
  const filers = spouse ? [input.taxpayer, spouse] : [input.taxpayer];

  // Wages, interest, and dividends. When Schedule B is required, each payer
  // is a rounded line on it and lines 2 and 6 add those lines.
  const wages = sumToDollars(input.w2s.map((w) => w.wages));
  const usTreasuryInterest = sumToDollars(input.form1099Ints.map((f) => f.usSavingsBondAndTreasuryInterest));
  const interestByPayer = input.form1099Ints.map((f) => ({
    payerName: f.payerName,
    amount: sumToDollars([f.interest, f.usSavingsBondAndTreasuryInterest]),
  }));
  const dividendsByPayer = input.form1099Divs.map((f) => ({ payerName: f.payerName, amount: roundDollars(f.ordinaryDividends) }));
  const interestTotal = sumToDollars(input.form1099Ints.flatMap((f) => [f.interest, f.usSavingsBondAndTreasuryInterest]));
  const dividendsTotal = sumToDollars(input.form1099Divs.map((f) => f.ordinaryDividends));
  const scheduleBRequired = interestTotal > params.scheduleBThreshold || dividendsTotal > params.scheduleBThreshold;
  const taxableInterest = scheduleBRequired ? sumRounded(interestByPayer.map((r) => r.amount)) : interestTotal;
  const taxExemptInterest = sumToDollars([
    ...input.form1099Ints.map((f) => f.taxExemptInterest),
    ...input.form1099Divs.map((f) => f.exemptInterestDividends),
  ]);
  const ordinaryDividends = scheduleBRequired ? sumRounded(dividendsByPayer.map((r) => r.amount)) : dividendsTotal;
  const qualifiedDividends = sumToDollars(input.form1099Divs.map((f) => f.qualifiedDividends));
  const capitalGainDistributions = sumToDollars(input.form1099Divs.map((f) => f.capitalGainDistributions));
  const unrecapturedSection1250Gain = sumToDollars(input.form1099Divs.map((f) => f.unrecapturedSection1250Gain));
  const collectiblesGain = sumToDollars([
    ...input.form1099Divs.map((f) => f.collectiblesGain),
    ...input.capitalAssetSales
      .filter((s) => s.collectible && s.term === "long")
      .map((s) => Math.max(0, s.proceeds - s.costBasis)),
  ]);

  // Self-employment (Schedule C and SE)
  const businesses = input.businesses.map(scheduleC);
  const seResults: ScheduleSEResult[] = OWNERS.filter((owner) => businesses.some((b) => b.owner === owner)).map(
    (owner) => scheduleSE(owner, businesses, input.w2s, params),
  );
  const businessIncome = businesses.reduce((sum, b) => sum + b.netProfit, 0);
  const selfEmploymentTax = seResults.reduce((sum, r) => sum + r.selfEmploymentTax, 0);
  const selfEmploymentTaxDeduction = seResults.reduce((sum, r) => sum + r.deduction, 0);
  const earnedIncome = wages + businessIncome - selfEmploymentTaxDeduction;

  // Capital gains. Schedule D is needed for any sale or carryover, or for
  // 1099-DIV amounts in boxes 2b-2d.
  const carryover = input.capitalLossCarryover;
  const needsScheduleD =
    input.capitalAssetSales.length > 0 ||
    carryover.shortTerm > 0 ||
    carryover.longTerm > 0 ||
    input.form1099Divs.some((f) => f.unrecapturedSection1250Gain > 0 || f.section1202Gain > 0 || f.collectiblesGain > 0);

  // Schedule D's carryover worksheet needs taxable income, which depends on
  // the capital loss, so compute the gain or loss first and finish below.
  // Nothing else on Schedule D depends on taxable income.
  const scheduleDFor = (taxableIncomeBeforeFloor: number) =>
    scheduleD(
      {
        status,
        sales: input.capitalAssetSales,
        carryover,
        capitalGainDistributions,
        unrecapturedSection1250Gain,
        collectiblesGain,
        taxableIncomeBeforeFloor,
      },
      params,
    );
  const previewD = needsScheduleD ? scheduleDFor(0) : null;
  const capitalGainOrLoss = previewD ? previewD.capitalGainOrLoss : capitalGainDistributions;
  // QDCG worksheet line 3: the smaller of Schedule D lines 15 and 16 when both are gains.
  const worksheetCapitalGain = previewD
    ? previewD.netLongTerm > 0 && previewD.total > 0
      ? Math.min(previewD.netLongTerm, previewD.total)
      : 0
    : capitalGainDistributions;

  // Income and AGI
  const additionalIncome = businessIncome;
  const totalIncome = wages + taxableInterest + ordinaryDividends + capitalGainOrLoss + additionalIncome;
  const adjustmentsToIncome = selfEmploymentTaxDeduction;
  const adjustedGrossIncome = totalIncome - adjustmentsToIncome;

  // Deductions
  const stdDeduction = standardDeduction(status, input.taxpayer, spouse, earnedIncome, params);
  const oneA = scheduleOneA(
    { status, taxpayer: input.taxpayer, spouse, w2s: input.w2s, modifiedAgi: adjustedGrossIncome },
    params,
  );
  const charitable = charitableDeduction(status, input.charitableCashContributions, params);
  const taxableIncomeBeforeQbi = adjustedGrossIncome - stdDeduction - oneA.total - charitable;

  // Qualified business income deduction
  const reitDividends = sumToDollars(input.form1099Divs.map((f) => f.section199ADividends));
  let qbi: Form8995Result | null = null;
  if (businesses.length > 0 || reitDividends > 0) {
    if (!form8995Applies(status, Math.max(0, taxableIncomeBeforeQbi), params)) {
      diagnostics.push({
        severity: "unsupported",
        code: "qbi.form8995A",
        message:
          "Your taxable income is above the limit for the simplified QBI deduction. Form 8995-A is not supported yet.",
      });
    } else {
      const businessQbi = businesses.map((b, i) => {
        const se = seResults.find((r) => r.owner === b.owner);
        const ownerProfit = businesses
          .filter((x) => x.owner === b.owner)
          .reduce((sum, x) => sum + Math.max(0, x.netProfit), 0);
        const share = se && ownerProfit > 0 ? (Math.max(0, b.netProfit) / ownerProfit) * se.deduction : 0;
        return {
          name: b.name,
          qualifiedBusinessIncome: b.netProfit - Math.round(share),
          materiallyParticipated: input.businesses[i]!.materiallyParticipated,
        };
      });
      qbi = form8995(
        {
          status,
          businessQbi,
          qualifiedReitDividends: reitDividends,
          taxableIncomeBeforeDeduction: Math.max(0, taxableIncomeBeforeQbi),
          netCapitalGain: qualifiedDividends + worksheetCapitalGain,
        },
        params,
      );
      if (qbi.lossCarryforward < 0) {
        diagnostics.push({
          severity: "info",
          code: "qbi.lossCarryforward",
          message: `Your businesses had a net qualified business loss of $${(-qbi.lossCarryforward).toLocaleString("en-US")}. Keep this for next year's QBI deduction.`,
        });
      }
    }
  }
  const qualifiedBusinessIncomeDeduction = qbi?.deduction ?? 0;
  const taxableIncomeBeforeFloor = taxableIncomeBeforeQbi - qualifiedBusinessIncomeDeduction;
  const taxableIncome = Math.max(0, taxableIncomeBeforeFloor);
  const scheduleDResult = needsScheduleD ? scheduleDFor(taxableIncomeBeforeFloor) : null;

  // Tax
  if (scheduleDResult && (scheduleDResult.collectiblesGain > 0 || scheduleDResult.unrecapturedSection1250Gain > 0)) {
    diagnostics.push({
      severity: "unsupported",
      code: "scheduleD.taxWorksheet",
      message:
        "You have collectibles gain or unrecaptured section 1250 gain, which requires the Schedule D Tax Worksheet (not supported yet).",
    });
  }
  const worksheet =
    qualifiedDividends > 0 || worksheetCapitalGain > 0
      ? qualifiedDividendsWorksheet(taxableIncome, qualifiedDividends, worksheetCapitalGain, status, params)
      : null;
  const tax = worksheet ? worksheet.tax : regularTax(taxableIncome, status, params);

  // Other taxes
  const medicare = form8959(
    status,
    sumToDollars(input.w2s.map((w) => w.medicareWages)),
    sumToDollars(input.w2s.map((w) => w.medicareTaxWithheld)),
    seResults.reduce((sum, r) => sum + r.netEarnings, 0),
    params,
  );
  const niit = form8960(status, taxableInterest + ordinaryDividends + capitalGainOrLoss, adjustedGrossIncome, params);
  const otherTaxes = selfEmploymentTax + medicare.additionalMedicareTax + niit.netInvestmentIncomeTax;

  // Credits
  const excessSocialSecurityWithheld = excessSocialSecurity(input.w2s, params);
  const eitcInput: EarnedIncomeCreditInput = {
    status,
    filers,
    qualifyingChildren: input.dependents.filter((d) => isEitcQualifyingChild(d, filers, params.year)).length,
    earnedIncome,
    adjustedGrossIncome,
    investmentIncome: taxableInterest + taxExemptInterest + ordinaryDividends + Math.max(0, capitalGainOrLoss),
    mainHomeInUsMoreThanHalfYear: input.mainHomeInUsMoreThanHalfYear,
    livedApartFromSpouseLastSixMonths: input.screening.livedApartFromSpouseLastSixMonths,
  };
  const eic = earnedIncomeCredit(eitcInput, params);

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
      selfEmploymentTaxDeduction,
      earnedIncomeCredit: eic.credit,
      excessSocialSecurityWithheld,
    },
    params,
  );

  // Payments
  // Form 1040 lines 25a-25c are each rounded, then added on line 25d.
  const withholdingW2 = sumToDollars(input.w2s.map((w) => w.federalWithholding));
  const withholding1099 = sumToDollars([
    ...input.form1099Ints.map((f) => f.federalWithholding),
    ...input.form1099Divs.map((f) => f.federalWithholding),
    ...input.capitalAssetSales.map((s) => s.federalWithholding),
    ...input.businesses.flatMap((b) => b.incomeForms.map((f) => f.federalWithholding)),
  ]);
  const federalWithholding = withholdingW2 + withholding1099 + medicare.additionalMedicareTaxWithheld;
  const estimatedTaxPayments = roundDollars(input.estimatedTaxPayments);

  const totalTax = Math.max(0, tax - ctc.nonrefundableCredit) + otherTaxes;
  const threeA = scheduleThreeA({
    year: params.year,
    refundableCredits: eic.credit + ctc.additionalChildTaxCredit,
    totalTax,
    scheduleTwoLine20: medicare.onWages,
    citizenNationalOrQualifiedAlien: input.citizenNationalOrQualifiedAlien,
  });
  const federalPublicBenefitReduction = threeA?.reduction ?? 0;
  if (threeA && threeA.federalPublicBenefit > 0 && input.citizenNationalOrQualifiedAlien === null) {
    diagnostics.push({
      severity: "error",
      code: "scheduleThreeA.status",
      message:
        "Part of your refundable credits is a federal public benefit (Schedule 3-A). Answer whether you or your spouse is a U.S. citizen, U.S. national, or qualified alien. Until then it is left out of your refund.",
    });
  } else if (federalPublicBenefitReduction > 0) {
    diagnostics.push({
      severity: "info",
      code: "scheduleThreeA.reduction",
      message: `$${federalPublicBenefitReduction.toLocaleString("en-US")} of your refundable credits is a federal public benefit that isn't paid because neither you nor your spouse is a U.S. citizen, U.S. national, or qualified alien (Schedule 3-A).`,
    });
  }
  const totalPayments =
    federalWithholding +
    estimatedTaxPayments +
    eic.credit +
    ctc.additionalChildTaxCredit +
    excessSocialSecurityWithheld -
    federalPublicBenefitReduction;
  const amountOwed = Math.max(0, totalTax - totalPayments);

  if (amountOwed >= 1_000 && businesses.length > 0) {
    diagnostics.push({
      severity: "warning",
      code: "form2210.penalty",
      message:
        "You owe $1,000 or more. You may owe an underpayment penalty (Form 2210), which isn't calculated yet. Consider quarterly estimated payments next year.",
    });
  }

  const scheduleB = { required: scheduleBRequired, interest: interestByPayer, dividends: dividendsByPayer };
  if (scheduleB.required) {
    diagnostics.push({
      severity: "info",
      code: "scheduleB.foreignAccounts",
      message: "Schedule B is required. Part III asks whether you had foreign accounts or a foreign trust.",
    });
  }

  const illinois = il1040(
    {
      input,
      federalParams: params,
      federalAgi: adjustedGrossIncome,
      taxExemptInterest,
      usTreasuryInterest,
      eitcInput,
    },
    diagnostics,
  );

  return {
    taxYear: params.year,
    filingStatus: status,
    form1040: {
      wages,
      taxExemptInterest,
      taxableInterest,
      qualifiedDividends,
      ordinaryDividends,
      capitalGainOrLoss,
      additionalIncome,
      totalIncome,
      adjustmentsToIncome,
      adjustedGrossIncome,
      standardDeduction: stdDeduction,
      charitableDeduction: charitable,
      scheduleOneADeductions: oneA.total,
      qualifiedBusinessIncomeDeduction,
      taxableIncome,
      tax,
      childTaxCreditAndCreditForOtherDependents: ctc.nonrefundableCredit,
      otherTaxes,
      totalTax,
      withholdingW2,
      withholding1099,
      federalWithholding,
      estimatedTaxPayments,
      earnedIncomeCredit: eic.credit,
      additionalChildTaxCredit: ctc.additionalChildTaxCredit,
      excessSocialSecurityWithheld,
      federalPublicBenefitReduction,
      totalPayments,
      refund: Math.max(0, totalPayments - totalTax),
      amountOwed,
    },
    qualifiedDividendsWorksheet: worksheet,
    scheduleD: scheduleDResult,
    scheduleC: businesses,
    scheduleSE: seResults,
    scheduleOneA: oneA,
    form8995: qbi,
    schedule8812: ctc,
    earnedIncomeCredit: eic,
    scheduleThreeA: threeA,
    form8959: medicare,
    form8960: niit,
    scheduleB,
    illinois,
    diagnostics,
    complete: !diagnostics.some((d) => d.severity === "error" || d.severity === "unsupported"),
  };
}
