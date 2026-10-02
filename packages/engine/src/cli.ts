#!/usr/bin/env node
/**
 * Compute a return from a JSON input file and print a summary.
 *
 *   node src/cli.ts path/to/return.json [--json]
 */
import { readFileSync } from "node:fs";
import { computeReturn } from "./compute.ts";
import { normalizeReturn } from "./defaults.ts";

const args = process.argv.slice(2);
const file = args.find((a) => !a.startsWith("--"));
if (!file) {
  console.error("Usage: opentax <return.json> [--json]");
  process.exit(2);
}

const input = normalizeReturn(JSON.parse(readFileSync(file, "utf8")));
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
    ["Capital gain or loss", f.capitalGainOrLoss],
    ["Business income", f.additionalIncome],
    ["Adjustments (half of SE tax)", f.adjustmentsToIncome],
    ["Adjusted gross income", f.adjustedGrossIncome],
    ["Standard deduction", f.standardDeduction],
    ["Charitable deduction", f.charitableDeduction],
    ["Schedule 1-A deductions", f.scheduleOneADeductions],
    ["QBI deduction", f.qualifiedBusinessIncomeDeduction],
    ["Taxable income", f.taxableIncome],
    ["Tax", f.tax],
    ["Child tax credit / other dependents", f.childTaxCreditAndCreditForOtherDependents],
    ["Other taxes", f.otherTaxes],
    ["Total tax", f.totalTax],
    ["Federal withholding", f.federalWithholding],
    ["Earned income credit", f.earnedIncomeCredit],
    ["Additional child tax credit", f.additionalChildTaxCredit],
    ...(f.federalPublicBenefitReduction > 0
      ? [["Public benefit not paid (Sch. 3-A)", -f.federalPublicBenefitReduction] as [string, number]]
      : []),
    ["Total payments", f.totalPayments],
  ];
  console.log(`Tax year ${result.taxYear} — ${result.filingStatus}\n`);
  for (const [label, amount] of rows) console.log(`${label.padEnd(38)}${usd(amount).padStart(12)}`);
  console.log("".padEnd(50, "-"));
  console.log(
    f.refund > 0 ? `${"Refund".padEnd(38)}${usd(f.refund).padStart(12)}` : `${"Amount owed".padEnd(38)}${usd(f.amountOwed).padStart(12)}`,
  );
  const il = result.illinois;
  if (il) {
    console.log(`\nIllinois IL-1040\n`);
    const ilRows: [string, number][] = [
      ["Illinois base income", il.baseIncome],
      ["Exemption allowance", il.exemptionAllowance],
      ["Net income", il.netIncome],
      ["Tax (4.95%)", il.tax],
      ["Total tax", il.totalTax],
      ["Illinois withholding", il.withholding],
      ["Illinois EIC", il.earnedIncomeCredit],
      ["Illinois child tax credit", il.childTaxCredit],
    ];
    for (const [label, amount] of ilRows) console.log(`${label.padEnd(38)}${usd(amount).padStart(12)}`);
    console.log("".padEnd(50, "-"));
    console.log(
      il.refund > 0 ? `${"Refund".padEnd(38)}${usd(il.refund).padStart(12)}` : `${"Amount owed".padEnd(38)}${usd(il.amountOwed).padStart(12)}`,
    );
  }
  if (result.diagnostics.length) {
    console.log("\nNotes:");
    for (const d of result.diagnostics) console.log(`  [${d.severity}] ${d.message}`);
  }
  if (!result.complete) console.log("\nThis return is INCOMPLETE. Do not file it.");
}
