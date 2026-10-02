import { percentOf } from "@opentax/engine";
import { namesOnReturn, primarySsn, personHeader } from "../common.ts";
import { amount, amountOrZero, compact, loss, ssn } from "../format.ts";
import type { FieldValue, FilledForm, FormContext, FormDefinition, PacketNote } from "../types.ts";

const fields = {
  "2": { name: "topmostSubform[0].Page1[0].f1_18[0]", tooltip: "2. Total qualified business income or (loss). Co" },
  "4": { name: "topmostSubform[0].Page1[0].f1_20[0]", tooltip: "4. Total qualified business income. Combine line" },
  "5": { name: "topmostSubform[0].Page1[0].f1_21[0]", tooltip: "5. Qualified business income component. Multiply" },
  "6": { name: "topmostSubform[0].Page1[0].f1_22[0]", tooltip: "6. Qualified R E I T dividends and publicly trad" },
  "8": { name: "topmostSubform[0].Page1[0].f1_24[0]", tooltip: "8. Total qualified R E I T dividends and P T P i" },
  "9": { name: "topmostSubform[0].Page1[0].f1_25[0]", tooltip: "9. R E I T and P T P component. Multiply line 8" },
  "10": { name: "topmostSubform[0].Page1[0].f1_26[0]", tooltip: "10. Qualified business income deduction before t" },
  "11": { name: "topmostSubform[0].Page1[0].f1_27[0]", tooltip: "11. Taxable income before qualified business inc" },
  "12": { name: "topmostSubform[0].Page1[0].f1_28[0]", tooltip: "12. Enter your net capital gain, if any, increas" },
  "13": { name: "topmostSubform[0].Page1[0].f1_29[0]", tooltip: "13. Subtract line 12 from line 11. If zero or le" },
  "14": { name: "topmostSubform[0].Page1[0].f1_30[0]", tooltip: "14. Income limitation. Multiply line 13 by 20% (" },
  "15": { name: "topmostSubform[0].Page1[0].f1_31[0]", tooltip: "15. Qualified business income deduction before t" },
  "16": { name: "topmostSubform[0].Page1[0].f1_32[0]", tooltip: "16. Minimum deduction for active qualified busin" },
  "17": { name: "topmostSubform[0].Page1[0].f1_33[0]", tooltip: "17. Qualified business income deduction. Enter t" },
  "18": { name: "topmostSubform[0].Page1[0].f1_34[0]", tooltip: "18. Open parenthesis. Total qualified business (" },
  "name": { name: "topmostSubform[0].Page1[0].f1_1[0]", tooltip: "Page 1. Name(s) shown on return." },
  "ssn": { name: "topmostSubform[0].Page1[0].f1_2[0]", tooltip: "Your taxpayer identification number." },
  "1i_name": { name: "topmostSubform[0].Page1[0].Table[0].Row1i[0].f1_3[0]", tooltip: "Row: 1i. Column: (a) Trade, business, or aggrega" },
  "1i_tin": { name: "topmostSubform[0].Page1[0].Table[0].Row1i[0].f1_4[0]", tooltip: "Row: 1i. Column: (b) Taxpayer identification num" },
  "1i_qbi": { name: "topmostSubform[0].Page1[0].Table[0].Row1i[0].f1_5[0]", tooltip: "Row: 1i. Column: (c) Qualified business income o" },
  "1ii_name": { name: "topmostSubform[0].Page1[0].Table[0].Row1ii[0].f1_6[0]", tooltip: "Row: 1i i. Column: (a) Trade, business, or aggre" },
  "1ii_tin": { name: "topmostSubform[0].Page1[0].Table[0].Row1ii[0].f1_7[0]", tooltip: "Row: 1i i. Column: (b) Taxpayer identification n" },
  "1ii_qbi": { name: "topmostSubform[0].Page1[0].Table[0].Row1ii[0].f1_8[0]", tooltip: "Row: 1i i. Column: (c) Qualified business income" },
  "1iii_name": { name: "topmostSubform[0].Page1[0].Table[0].Row1iii[0].f1_9[0]", tooltip: "Row: 1i i i. Column: (a) Trade, business, or agg" },
  "1iii_tin": { name: "topmostSubform[0].Page1[0].Table[0].Row1iii[0].f1_10[0]", tooltip: "Row: 1i i i. Column: (b) Taxpayer identification" },
  "1iii_qbi": { name: "topmostSubform[0].Page1[0].Table[0].Row1iii[0].f1_11[0]", tooltip: "Row: 1i i i. Column: (c) Qualified business inco" },
  "1iv_name": { name: "topmostSubform[0].Page1[0].Table[0].Row1iv[0].f1_12[0]", tooltip: "Row: 1i v. Column: (a) Trade, business, or aggre" },
  "1iv_tin": { name: "topmostSubform[0].Page1[0].Table[0].Row1iv[0].f1_13[0]", tooltip: "Row: 1i v. Column: (b) Taxpayer identification n" },
  "1iv_qbi": { name: "topmostSubform[0].Page1[0].Table[0].Row1iv[0].f1_14[0]", tooltip: "Row: 1i v. Column: (c) Qualified business income" },
  "1v_name": { name: "topmostSubform[0].Page1[0].Table[0].Row1v[0].f1_15[0]", tooltip: "Row: 1v. Column: (a) Trade, business, or aggrega" },
  "1v_tin": { name: "topmostSubform[0].Page1[0].Table[0].Row1v[0].f1_16[0]", tooltip: "Row: 1v. Column: (b) Taxpayer identification num" },
  "1v_qbi": { name: "topmostSubform[0].Page1[0].Table[0].Row1v[0].f1_17[0]", tooltip: "Row: 1v. Column: (c) Qualified business income o" },
};

type Key = keyof typeof fields;

export const FORM_8995: FormDefinition<Key> = {
  id: "f8995",
  title: "Form 8995",
  year: 2026,
  file: "f8995.pdf",
  url: "https://www.irs.gov/pub/irs-dft/f8995--dft.pdf",
  revision: "Draft created 5/1/26",
  coverPages: 1,
  sequence: 55,
  fields,
};

const ROWS = ["1i", "1ii", "1iii", "1iv", "1v"] as const;

export function fillForm8995(ctx: FormContext, notes: PacketNote[]): FilledForm<Key> | null {
  const q = ctx.result.form8995;
  if (!q) return null;
  const rate = ctx.params.qualifiedBusinessIncome.ratePercent;
  const line4 = Math.max(0, q.qualifiedBusinessIncome);
  const line5 = percentOf(line4, rate);
  const line9 = percentOf(q.qualifiedReitDividends, rate);
  const line13 = Math.max(0, q.taxableIncomeBeforeDeduction - q.netCapitalGain);
  const line14 = percentOf(line13, rate);
  const line15 = Math.min(line5 + line9, line14);
  const minimum = ctx.params.qualifiedBusinessIncome.minimumDeduction;
  const activeQbi = q.businesses.filter((b) => b.materiallyParticipated).reduce((sum, b) => sum + b.qualifiedBusinessIncome, 0);
  const line16 = minimum && activeQbi >= minimum.minimumQbi ? minimum.amount : 0;
  const v: Partial<Record<Key, FieldValue>> = {
    name: namesOnReturn(ctx),
    ssn: primarySsn(ctx),
    "2": amount(q.qualifiedBusinessIncome),
    "4": amountOrZero(line4),
    "5": amountOrZero(line5),
    "6": amount(q.qualifiedReitDividends),
    "8": amountOrZero(q.qualifiedReitDividends),
    "9": amountOrZero(line9),
    "10": amountOrZero(line5 + line9),
    "11": amountOrZero(q.taxableIncomeBeforeDeduction),
    "12": amount(q.netCapitalGain),
    "13": amountOrZero(line13),
    "14": amountOrZero(line14),
    "15": amountOrZero(line15),
    "16": amount(line16),
    "17": amountOrZero(q.deduction),
    "18": q.lossCarryforward < 0 ? loss(q.lossCarryforward) : "",
  };
  ctx.input.businesses.forEach((business, i) => {
    const row = ROWS[i];
    const qbi = q.businesses[i];
    if (!row || !qbi) return;
    v[`${row}_name`] = business.name;
    v[`${row}_tin`] = personHeader(ctx, business.owner).ssn;
    v[`${row}_qbi`] = amount(qbi.qualifiedBusinessIncome);
  });
  if (ctx.input.businesses.length > ROWS.length) {
    notes.push({ form: "Form 8995", message: "List businesses after the fifth on an attached statement (line 1)." });
  }
  return { form: FORM_8995, values: compact(v) };
}
