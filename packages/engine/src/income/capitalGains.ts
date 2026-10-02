import { roundDollars, sumExact } from "../money.ts";
import type {
  CapitalAssetSale,
  CapitalLossCarryover,
  FilingStatus,
  Form8949Box,
  Form8949Group,
  ScheduleDResult,
} from "../types.ts";
import type { TaxYearParams } from "../years/index.ts";

/**
 * The Form 8949 checkbox for a sale. Boxes G-L are for digital assets
 * reported (or not) on Form 1099-DA.
 */
export function form8949Box(sale: CapitalAssetSale): Form8949Box {
  const index = !sale.reportedOnForm ? 2 : sale.basisReportedToIrs ? 0 : 1;
  const boxes: Record<string, Form8949Box[]> = {
    "security/short": ["A", "B", "C"],
    "security/long": ["D", "E", "F"],
    "digitalAsset/short": ["G", "H", "I"],
    "digitalAsset/long": ["J", "K", "L"],
  };
  return boxes[`${sale.assetType}/${sale.term}`]![index]!;
}

const BOX_ORDER: Form8949Box[] = ["A", "B", "C", "G", "H", "I", "D", "E", "F", "J", "K", "L"];

function form8949Groups(sales: CapitalAssetSale[]): Form8949Group[] {
  const groups = new Map<Form8949Box, CapitalAssetSale[]>();
  for (const sale of sales) {
    const box = form8949Box(sale);
    groups.set(box, [...(groups.get(box) ?? []), sale]);
  }
  return BOX_ORDER.filter((box) => groups.has(box)).map((box) => {
    const group = groups.get(box)!;
    const rows = group.map((sale) => {
      const adjustment = sale.washSaleLossDisallowed;
      return {
        description: sale.description,
        dateAcquired: sale.dateAcquired,
        dateSold: sale.dateSold,
        proceeds: sale.proceeds,
        costBasis: sale.costBasis,
        adjustmentCode: adjustment > 0 ? "W" : "",
        adjustment,
        gainOrLoss: sumExact([sale.proceeds, -sale.costBasis, adjustment]),
      };
    });
    // Each row is entered in whole dollars, and line 2 adds the rows, so
    // the totals add rounded amounts. Column (h) follows from the others.
    const total = (amounts: number[]) => amounts.reduce((sum, amount) => sum + roundDollars(amount), 0);
    const proceeds = total(rows.map((r) => r.proceeds));
    const costBasis = total(rows.map((r) => r.costBasis));
    const adjustment = total(rows.map((r) => r.adjustment));
    return { box, term: group[0]!.term, rows, proceeds, costBasis, adjustment, gainOrLoss: proceeds - costBasis + adjustment };
  });
}

export interface ScheduleDInput {
  status: FilingStatus;
  sales: CapitalAssetSale[];
  carryover: CapitalLossCarryover;
  capitalGainDistributions: number;
  /** 1099-DIV box 2b total. */
  unrecapturedSection1250Gain: number;
  /** 1099-DIV box 2d total plus gains on collectibles sold. */
  collectiblesGain: number;
  /**
   * Taxable income as it would be figured if it could go below zero
   * (AGI minus deductions). Used for the carryover worksheet.
   */
  taxableIncomeBeforeFloor: number;
}

/** Schedule D, with Form 8949 and the Capital Loss Carryover Worksheet. */
export function scheduleD(input: ScheduleDInput, params: TaxYearParams): ScheduleDResult {
  const form8949 = form8949Groups(input.sales);
  const termTotal = (term: "short" | "long") =>
    form8949.filter((g) => g.term === term).reduce((sum, g) => sum + g.gainOrLoss, 0);

  const shortTermCarryover = roundDollars(input.carryover.shortTerm);
  const longTermCarryover = roundDollars(input.carryover.longTerm);
  const netShortTerm = termTotal("short") - shortTermCarryover; // line 7
  const netLongTerm = termTotal("long") + input.capitalGainDistributions - longTermCarryover; // line 15
  const total = netShortTerm + netLongTerm; // line 16

  const limit =
    input.status === "marriedFilingSeparately"
      ? params.capitalLossLimit.marriedFilingSeparately
      : params.capitalLossLimit.normal;
  const allowedLoss = total < 0 ? -Math.min(-total, limit) : 0; // line 21
  const capitalGainOrLoss = total < 0 ? allowedLoss : total;

  // Lines 18 and 19 apply only when lines 15 and 16 are both gains.
  const bothGains = netLongTerm > 0 && total > 0;

  return {
    form8949,
    shortTermCarryover,
    netShortTerm,
    capitalGainDistributions: input.capitalGainDistributions,
    longTermCarryover,
    netLongTerm,
    total,
    collectiblesGain: bothGains ? input.collectiblesGain : 0,
    unrecapturedSection1250Gain: bothGains ? input.unrecapturedSection1250Gain : 0,
    allowedLoss,
    capitalGainOrLoss,
    carryoverToNextYear: capitalLossCarryover(input.taxableIncomeBeforeFloor, allowedLoss, netShortTerm, netLongTerm),
  };
}

/**
 * Capital Loss Carryover Worksheet (Schedule D instructions), computed now
 * for use on next year's return. Line numbers match the worksheet.
 */
function capitalLossCarryover(
  taxableIncomeBeforeFloor: number,
  allowedLoss: number,
  netShortTerm: number,
  netLongTerm: number,
): CapitalLossCarryover {
  if (allowedLoss === 0) return { shortTerm: 0, longTerm: 0 };
  const l1 = taxableIncomeBeforeFloor;
  const l2 = -allowedLoss;
  const l3 = Math.max(0, l1 + l2);
  const l4 = Math.min(l2, l3);

  // Short-term carryover
  const l5 = Math.max(0, -netShortTerm);
  const l6 = Math.max(0, netLongTerm);
  const l7 = l4 + l6;
  const shortTerm = Math.max(0, l5 - l7);

  // Long-term carryover
  const l9 = Math.max(0, -netLongTerm);
  const l10 = Math.max(0, netShortTerm);
  const l11 = Math.max(0, l4 - l5);
  const l12 = l10 + l11;
  const longTerm = Math.max(0, l9 - l12);

  return { shortTerm, longTerm };
}
