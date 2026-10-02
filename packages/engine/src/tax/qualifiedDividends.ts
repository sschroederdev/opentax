import type { FilingStatus, QualifiedDividendsWorksheet } from "../types.ts";
import type { TaxYearParams } from "../years/index.ts";
import { roundDollars, sumExact } from "../money.ts";
import { regularTax } from "./regularTax.ts";

/**
 * Qualified Dividends and Capital Gain Tax Worksheet (Form 1040 instructions,
 * line 16), for filers who are not required to file Schedule D. Line numbers
 * in `lines` match the worksheet.
 */
export function qualifiedDividendsWorksheet(
  taxableIncome: number,
  qualifiedDividends: number,
  capitalGainDistributions: number,
  status: FilingStatus,
  params: TaxYearParams,
): QualifiedDividendsWorksheet {
  const l: Record<number, number> = {};
  l[1] = taxableIncome;
  l[2] = qualifiedDividends;
  l[3] = capitalGainDistributions;
  l[4] = l[2] + l[3];
  l[5] = Math.max(0, l[1] - l[4]);
  l[6] = params.capitalGains.zeroRateMax[status];
  l[7] = Math.min(l[1], l[6]);
  l[8] = Math.min(l[5], l[7]);
  l[9] = l[7] - l[8];
  l[10] = Math.min(l[1], l[4]);
  l[11] = l[9];
  l[12] = l[10] - l[11];
  l[13] = params.capitalGains.fifteenRateMax[status];
  l[14] = Math.min(l[1], l[13]);
  l[15] = l[5] + l[9];
  l[16] = Math.max(0, l[14] - l[15]);
  l[17] = Math.min(l[12], l[16]);
  l[18] = Math.round(l[17] * 15) / 100;
  l[19] = l[9] + l[17];
  l[20] = l[10] - l[19];
  l[21] = Math.round(l[20] * 20) / 100;
  l[22] = regularTax(l[5], status, params);
  l[23] = sumExact([l[18], l[21], l[22]]);
  l[24] = regularTax(l[1], status, params);
  l[25] = Math.min(l[23], l[24]);
  // Lines 18 and 21 can carry cents; the tax entered on Form 1040 is rounded.
  return { lines: l, tax: roundDollars(l[25]) };
}
