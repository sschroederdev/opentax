import { namesOnReturn, primarySsn } from "../common.ts";
import { amount, amountOrZero, compact } from "../format.ts";
import type { FilledForm, FormContext, FormDefinition } from "../types.ts";

const fields = {
  "1": { name: "topmostSubform[0].Page1[0].f1_3[0]", tooltip: "1. Taxable interest (see instructions)." },
  "2": { name: "topmostSubform[0].Page1[0].f1_4[0]", tooltip: "2. Ordinary dividends (see instructions)." },
  "8": { name: "topmostSubform[0].Page1[0].f1_15[0]", tooltip: "8. Total investment income. Combine lines 1, 2," },
  "11": { name: "topmostSubform[0].Page1[0].f1_21[0]", tooltip: "11. Total deductions and modifications. Add line" },
  "12": { name: "topmostSubform[0].Page1[0].f1_22[0]", tooltip: "12. Net investment income. Subtract Part I I, li" },
  "13": { name: "topmostSubform[0].Page1[0].f1_23[0]", tooltip: "13. Modified adjusted gross income (see instruct" },
  "14": { name: "topmostSubform[0].Page1[0].f1_24[0]", tooltip: "14. Threshold based on filing status (see instru" },
  "15": { name: "topmostSubform[0].Page1[0].f1_25[0]", tooltip: "15. Subtract line 14 from line 13. If zero or le" },
  "16": { name: "topmostSubform[0].Page1[0].f1_26[0]", tooltip: "16. Enter the smaller of line 12 or line 15." },
  "17": { name: "topmostSubform[0].Page1[0].f1_27[0]", tooltip: "17. Net investment income tax for individuals. M" },
  "name": { name: "topmostSubform[0].Page1[0].f1_1[0]", tooltip: "Page 1. Name(s) shown on your tax return." },
  "ssn": { name: "topmostSubform[0].Page1[0].f1_2[0]", tooltip: "Your social security number or E I N." },
  "5a": { name: "topmostSubform[0].Page1[0].f1_9[0]", tooltip: "5a. Net gain or loss from disposition of propert" },
  "5d": { name: "topmostSubform[0].Page1[0].f1_12[0]", tooltip: "5d. Combine lines 5a through 5c." },
};

type Key = keyof typeof fields;

export const FORM_8960: FormDefinition<Key> = {
  id: "f8960",
  title: "Form 8960",
  year: 2026,
  file: "f8960.pdf",
  url: "https://www.irs.gov/pub/irs-dft/f8960--dft.pdf",
  revision: "Draft created 6/1/26",
  coverPages: 1,
  fields,
};

export function fillForm8960(ctx: FormContext): FilledForm<Key> | null {
  const n = ctx.result.form8960;
  if (n.netInvestmentIncomeTax === 0) return null;
  const f = ctx.result.form1040;
  const line15 = Math.max(0, n.modifiedAgi - n.threshold);
  return {
    form: FORM_8960,
    values: compact<Key>({
      name: namesOnReturn(ctx),
      ssn: primarySsn(ctx),
      "1": amount(f.taxableInterest),
      "2": amount(f.ordinaryDividends),
      "5a": amount(f.capitalGainOrLoss),
      "5d": amount(f.capitalGainOrLoss),
      "8": amount(n.netInvestmentIncome),
      "12": amount(n.netInvestmentIncome),
      "13": amount(n.modifiedAgi),
      "14": amount(n.threshold),
      "15": amountOrZero(line15),
      "16": amountOrZero(Math.min(Math.max(0, n.netInvestmentIncome), line15)),
      "17": amountOrZero(n.netInvestmentIncomeTax),
    }),
  };
}
