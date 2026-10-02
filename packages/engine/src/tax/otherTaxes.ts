import type { FilingStatus, Form8959Result, Form8960Result } from "../types.ts";
import type { TaxYearParams } from "../years/ty2025.ts";

/**
 * Form 8959, Additional Medicare Tax, for W-2 wages only (Parts I, IV, V).
 * `medicareWages` and `medicareTaxWithheld` are W-2 box 5 and box 6 totals.
 */
export function form8959(
  status: FilingStatus,
  medicareWages: number,
  medicareTaxWithheld: number,
  params: TaxYearParams,
): Form8959Result {
  const { ratePercent, regularRatePercent, threshold: thresholds } = params.additionalMedicare;
  const threshold = thresholds[status];
  const additionalMedicareTax = Math.round((Math.max(0, medicareWages - threshold) * ratePercent) / 100);
  const regularMedicareTax = Math.round((medicareWages * regularRatePercent) / 100);
  return {
    medicareWages,
    threshold,
    additionalMedicareTax,
    additionalMedicareTaxWithheld: Math.max(0, medicareTaxWithheld - regularMedicareTax),
  };
}

/**
 * Form 8960, Net Investment Income Tax, for interest, dividends, and capital
 * gain distributions with no investment expenses.
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
    netInvestmentIncomeTax: Math.round((base * ratePercent) / 100),
  };
}
