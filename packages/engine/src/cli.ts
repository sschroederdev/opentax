#!/usr/bin/env node
/**
 * Compute a return from a JSON input file and print a summary.
 *
 *   node src/cli.ts path/to/return.json [--json]
 */
import { readFileSync } from "node:fs";
import { computeReturn } from "./compute.ts";
import type { TaxReturnInput } from "./types.ts";

const args = process.argv.slice(2);
const file = args.find((a) => !a.startsWith("--"));
if (!file) {
  console.error("Usage: opentax <return.json> [--json]");
  process.exit(2);
}

const input = JSON.parse(readFileSync(file, "utf8")) as TaxReturnInput;
const result = computeReturn(input);

if (args.includes("--json")) {
  console.log(JSON.stringify(result, null, 2));
} else {
  const usd = (n: number) => n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
  const f = result.form1040;
  const rows: [string, number][] = [
    ["Wages", f.wages],
    ["Taxable interest", f.taxableInterest],
    ["Ordinary dividends", f.ordinaryDividends],
    ["Capital gain distributions", f.capitalGainDistributions],
    ["Adjusted gross income", f.adjustedGrossIncome],
    ["Standard deduction", f.standardDeduction],
    ["Schedule 1-A deductions", f.scheduleOneADeductions],
    ["Taxable income", f.taxableIncome],
    ["Tax", f.tax],
    ["Child tax credit / other dependents", f.childTaxCreditAndCreditForOtherDependents],
    ["Other taxes", f.otherTaxes],
    ["Total tax", f.totalTax],
    ["Federal withholding", f.federalWithholding],
    ["Earned income credit", f.earnedIncomeCredit],
    ["Additional child tax credit", f.additionalChildTaxCredit],
    ["Total payments", f.totalPayments],
  ];
  console.log(`Tax year ${result.taxYear} — ${result.filingStatus}\n`);
  for (const [label, amount] of rows) console.log(`${label.padEnd(38)}${usd(amount).padStart(12)}`);
  console.log("".padEnd(50, "-"));
  console.log(
    f.refund > 0 ? `${"Refund".padEnd(38)}${usd(f.refund).padStart(12)}` : `${"Amount owed".padEnd(38)}${usd(f.amountOwed).padStart(12)}`,
  );
  if (result.diagnostics.length) {
    console.log("\nNotes:");
    for (const d of result.diagnostics) console.log(`  [${d.severity}] ${d.message}`);
  }
  if (!result.complete) console.log("\nThis return is INCOMPLETE. Do not file it.");
}
