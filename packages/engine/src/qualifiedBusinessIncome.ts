import { percentOf } from "./money.ts";
import type { FilingStatus, Form8995Result } from "./types.ts";
import type { TaxYearParams } from "./years/index.ts";

export interface Form8995Input {
  status: FilingStatus;
  /** Schedule C net profit less the deductible part of self-employment tax, per business. */
  businessQbi: { name: string; qualifiedBusinessIncome: number; materiallyParticipated: boolean }[];
  /** 1099-DIV box 5 total. */
  qualifiedReitDividends: number;
  taxableIncomeBeforeDeduction: number;
  /** Qualified dividends plus net capital gain (as defined for the income limitation). */
  netCapitalGain: number;
}

/** Whether the simplified Form 8995 applies, rather than Form 8995-A. */
export function form8995Applies(status: FilingStatus, taxableIncomeBeforeDeduction: number, params: TaxYearParams) {
  return taxableIncomeBeforeDeduction <= params.qualifiedBusinessIncome.threshold[status];
}

/**
 * Form 8995, Qualified Business Income Deduction Simplified Computation,
 * for filers at or below the threshold. Line numbers match the form.
 */
export function form8995(input: Form8995Input, params: TaxYearParams): Form8995Result {
  const q = params.qualifiedBusinessIncome;
  const totalQbi = input.businessQbi.reduce((sum, x) => sum + x.qualifiedBusinessIncome, 0); // line 2
  const line4 = Math.max(0, totalQbi); // no prior-year loss carryforward modeled
  const lossCarryforward = Math.min(0, totalQbi); // line 16
  const line5 = percentOf(line4, q.ratePercent);
  const line6 = Math.max(0, input.qualifiedReitDividends);
  const line9 = percentOf(line6, q.ratePercent);
  const line10 = line5 + line9;

  const line13 = Math.max(0, input.taxableIncomeBeforeDeduction - input.netCapitalGain);
  const line14 = percentOf(line13, q.ratePercent);
  const line15 = Math.min(line10, line14);

  // P.L. 119-21 §70105: a $400 minimum deduction (line 16) when QBI from
  // businesses you materially participated in totals at least $1,000
  // (2026 and later). Line 17 is the greater of lines 15 and 16.
  const activeQbi = input.businessQbi
    .filter((b) => b.materiallyParticipated)
    .reduce((sum, b) => sum + b.qualifiedBusinessIncome, 0);
  const line16 = q.minimumDeduction && activeQbi >= q.minimumDeduction.minimumQbi ? q.minimumDeduction.amount : 0;

  return {
    businesses: input.businessQbi,
    qualifiedBusinessIncome: totalQbi,
    line4,
    line5,
    qualifiedReitDividends: line6,
    line9,
    line10,
    taxableIncomeBeforeDeduction: input.taxableIncomeBeforeDeduction,
    netCapitalGain: input.netCapitalGain,
    line13,
    line14,
    line15,
    minimumDeduction: line16,
    deduction: Math.max(line15, line16),
    lossCarryforward,
  };
}
