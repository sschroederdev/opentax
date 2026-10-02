import { percentOf } from "../money.ts";
import type { FilingStatus, Form8959Result, Form8960Result } from "../types.ts";
import type { TaxYearParams } from "../years/index.ts";

/**
 * Form 8959, Additional Medicare Tax, on wages (Part I) and self-employment
 * income (Part II), with the withholding credit (Part V).
 * `medicareWages` and `medicareTaxWithheld` are W-2 box 5 and box 6 totals.
 */
export function form8959(
  status: FilingStatus,
  medicareWages: number,
  medicareTaxWithheld: number,
  selfEmploymentIncome: number,
  params: TaxYearParams,
): Form8959Result {
  const { ratePercent, regularRatePercent, threshold: thresholds } = params.additionalMedicare;
  const threshold = thresholds[status];
  const onWages = percentOf(Math.max(0, medicareWages - threshold), ratePercent); // line 7

  // Part II: the threshold is reduced by wages (but not below zero).
  const seIncome = Math.max(0, selfEmploymentIncome); // line 8
  const remainingThreshold = Math.max(0, threshold - medicareWages); // line 11
  const onSelfEmployment = percentOf(Math.max(0, seIncome - remainingThreshold), ratePercent); // line 13

  const regularMedicareTax = percentOf(medicareWages, regularRatePercent); // line 21
  return {
    medicareWages,
    selfEmploymentIncome: seIncome,
    threshold,
    onWages,
    onSelfEmployment,
    additionalMedicareTax: onWages + onSelfEmployment,
    additionalMedicareTaxWithheld: Math.max(0, medicareTaxWithheld - regularMedicareTax),
  };
}

/**
 * Form 8960, Net Investment Income Tax, for interest, dividends, and capital
 * gains with no investment expenses.
 */
export function form8960(
  status: FilingStatus,
  netInvestmentIncome: number,
  modifiedAgi: number,
  params: TaxYearParams,
): Form8960Result {
  const { ratePercent, threshold: thresholds } = params.netInvestmentIncomeTax;
  const threshold = thresholds[status];
  const base = Math.min(Math.max(0, netInvestmentIncome), Math.max(0, modifiedAgi - threshold));
  return {
    netInvestmentIncome,
    modifiedAgi,
    threshold,
    netInvestmentIncomeTax: percentOf(base, ratePercent),
  };
}
