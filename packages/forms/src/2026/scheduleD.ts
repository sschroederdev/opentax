import { type Form8949Box } from "@opentax/engine";
import { namesOnReturn, primarySsn } from "../common.ts";
import { amount, amountOrZero, compact, loss, ssn } from "../format.ts";
import type { FieldValue, FilledForm, FormContext, FormDefinition, PacketNote } from "../types.ts";

const fields = {
  "6": { name: "topmostSubform[0].Page1[0].f1_21[0]", tooltip: "6. Open parenthesis. Short-term capital loss car" },
  "7": { name: "topmostSubform[0].Page1[0].f1_22[0]", tooltip: "7. Net short-term capital gain or (loss). Combin" },
  "13": { name: "topmostSubform[0].Page1[0].f1_41[0]", tooltip: "13. Capital gain distributions. See the instruct" },
  "14": { name: "topmostSubform[0].Page1[0].f1_42[0]", tooltip: "14. Open parenthesis. Long-term capital loss car" },
  "15": { name: "topmostSubform[0].Page1[0].f1_43[0]", tooltip: "15. Net long-term capital gain or (loss). Combin" },
  "16": { name: "topmostSubform[0].Page2[0].f2_1[0]", tooltip: "16. Combine lines 7 and 15 and enter the result." },
  "18": { name: "topmostSubform[0].Page2[0].f2_2[0]", tooltip: "18. If you are required to complete the 28% Rate" },
  "19": { name: "topmostSubform[0].Page2[0].f2_3[0]", tooltip: "19. If you are required to complete the Unrecapt" },
  "21": { name: "topmostSubform[0].Page2[0].f2_4[0]", tooltip: "21. Open parenthesis. If line 16 is a loss, ente" },
  "name": { name: "topmostSubform[0].Page1[0].f1_1[0]", tooltip: "Page 1. Name(s) shown on return." },
  "ssn": { name: "topmostSubform[0].Page1[0].f1_2[0]", tooltip: "Your social security number." },
  "qof_yes": { name: "topmostSubform[0].Page1[0].c1_1[0]", tooltip: "al requirements for reporting your gain or loss." },
  "qof_no": { name: "topmostSubform[0].Page1[0].c1_1[1]", tooltip: "No." },
  "1a.d": { name: "topmostSubform[0].Page1[0].Table_PartI[0].Row1a[0].f1_3[0]", tooltip: "Row: 1a. Totals for all short-term transactions" },
  "1a.e": { name: "topmostSubform[0].Page1[0].Table_PartI[0].Row1a[0].f1_4[0]", tooltip: "Row: 1a. Totals for all short-term transactions" },
  "1a.g": { name: "topmostSubform[0].Page1[0].Table_PartI[0].Row1a[0].f1_5[0]", tooltip: "Row: 1a. Totals for all short-term transactions" },
  "1a.h": { name: "topmostSubform[0].Page1[0].Table_PartI[0].Row1a[0].f1_6[0]", tooltip: "Row: 1a. Totals for all short-term transactions" },
  "1b.d": { name: "topmostSubform[0].Page1[0].Table_PartI[0].Row1b[0].f1_7[0]", tooltip: "Row: 1b. Totals for all transactions reported on" },
  "1b.e": { name: "topmostSubform[0].Page1[0].Table_PartI[0].Row1b[0].f1_8[0]", tooltip: "Row: 1b. Totals for all transactions reported on" },
  "1b.g": { name: "topmostSubform[0].Page1[0].Table_PartI[0].Row1b[0].f1_9[0]", tooltip: "Row: 1b. Totals for all transactions reported on" },
  "1b.h": { name: "topmostSubform[0].Page1[0].Table_PartI[0].Row1b[0].f1_10[0]", tooltip: "Row: 1b. Totals for all transactions reported on" },
  "2.d": { name: "topmostSubform[0].Page1[0].Table_PartI[0].Row2[0].f1_11[0]", tooltip: "Row: 2. Totals for all transactions reported on" },
  "2.e": { name: "topmostSubform[0].Page1[0].Table_PartI[0].Row2[0].f1_12[0]", tooltip: "Row: 2. Totals for all transactions reported on" },
  "2.g": { name: "topmostSubform[0].Page1[0].Table_PartI[0].Row2[0].f1_13[0]", tooltip: "Row: 2. Totals for all transactions reported on" },
  "2.h": { name: "topmostSubform[0].Page1[0].Table_PartI[0].Row2[0].f1_14[0]", tooltip: "Row: 2. Totals for all transactions reported on" },
  "3.d": { name: "topmostSubform[0].Page1[0].Table_PartI[0].Row3[0].f1_15[0]", tooltip: "Row: 3. Totals for all transactions reported on" },
  "3.e": { name: "topmostSubform[0].Page1[0].Table_PartI[0].Row3[0].f1_16[0]", tooltip: "Row: 3. Totals for all transactions reported on" },
  "3.g": { name: "topmostSubform[0].Page1[0].Table_PartI[0].Row3[0].f1_17[0]", tooltip: "Row: 3. Totals for all transactions reported on" },
  "3.h": { name: "topmostSubform[0].Page1[0].Table_PartI[0].Row3[0].f1_18[0]", tooltip: "Row: 3. Totals for all transactions reported on" },
  "8a.d": { name: "topmostSubform[0].Page1[0].Table_PartII[0].Row8a[0].f1_23[0]", tooltip: "Row: 8a. Totals for all long-term transactions r" },
  "8a.e": { name: "topmostSubform[0].Page1[0].Table_PartII[0].Row8a[0].f1_24[0]", tooltip: "Row: 8a. Totals for all long-term transactions r" },
  "8a.g": { name: "topmostSubform[0].Page1[0].Table_PartII[0].Row8a[0].f1_25[0]", tooltip: "Row: 8a. Totals for all long-term transactions r" },
  "8a.h": { name: "topmostSubform[0].Page1[0].Table_PartII[0].Row8a[0].f1_26[0]", tooltip: "Row: 8a. Totals for all long-term transactions r" },
  "8b.d": { name: "topmostSubform[0].Page1[0].Table_PartII[0].Row8b[0].f1_27[0]", tooltip: "Row: 8b. Totals for all transactions reported on" },
  "8b.e": { name: "topmostSubform[0].Page1[0].Table_PartII[0].Row8b[0].f1_28[0]", tooltip: "Row: 8b. Totals for all transactions reported on" },
  "8b.g": { name: "topmostSubform[0].Page1[0].Table_PartII[0].Row8b[0].f1_29[0]", tooltip: "Row: 8b. Totals for all transactions reported on" },
  "8b.h": { name: "topmostSubform[0].Page1[0].Table_PartII[0].Row8b[0].f1_30[0]", tooltip: "Row: 8b. Totals for all transactions reported on" },
  "9.d": { name: "topmostSubform[0].Page1[0].Table_PartII[0].Row9[0].f1_31[0]", tooltip: "Row: 9. Totals for all transactions reported on" },
  "9.e": { name: "topmostSubform[0].Page1[0].Table_PartII[0].Row9[0].f1_32[0]", tooltip: "Row: 9. Totals for all transactions reported on" },
  "9.g": { name: "topmostSubform[0].Page1[0].Table_PartII[0].Row9[0].f1_33[0]", tooltip: "Row: 9. Totals for all transactions reported on" },
  "9.h": { name: "topmostSubform[0].Page1[0].Table_PartII[0].Row9[0].f1_34[0]", tooltip: "Row: 9. Totals for all transactions reported on" },
  "10.d": { name: "topmostSubform[0].Page1[0].Table_PartII[0].Row10[0].f1_35[0]", tooltip: "Row: 10. Totals for all transactions reported on" },
  "10.e": { name: "topmostSubform[0].Page1[0].Table_PartII[0].Row10[0].f1_36[0]", tooltip: "Row: 10. Totals for all transactions reported on" },
  "10.g": { name: "topmostSubform[0].Page1[0].Table_PartII[0].Row10[0].f1_37[0]", tooltip: "Row: 10. Totals for all transactions reported on" },
  "10.h": { name: "topmostSubform[0].Page1[0].Table_PartII[0].Row10[0].f1_38[0]", tooltip: "Row: 10. Totals for all transactions reported on" },
  "17_yes": { name: "topmostSubform[0].Page2[0].c2_1[0]", tooltip: "17. Are lines 15 and 16 both gains? Yes. Go to l" },
  "17_no": { name: "topmostSubform[0].Page2[0].c2_1[1]", tooltip: "17. No. Skip lines 18 through 21, and go to line" },
  "20_yes": { name: "topmostSubform[0].Page2[0].c2_2[0]", tooltip: "20. Are lines 18 and 19 both zero or blank and y" },
  "20_no": { name: "topmostSubform[0].Page2[0].c2_2[1]", tooltip: "20. No. Complete the Schedule D Tax Worksheet in" },
  "22_yes": { name: "topmostSubform[0].Page2[0].c2_3[0]", tooltip: "22. Do you have qualified dividends on Form 1040" },
  "22_no": { name: "topmostSubform[0].Page2[0].c2_3[1]", tooltip: "22. No. Complete the rest of Form 1040, 1040-S R" },
};

type Key = keyof typeof fields;

export const SCHEDULE_D: FormDefinition<Key> = {
  id: "f1040sd",
  title: "Schedule D (Form 1040)",
  year: 2026,
  file: "f1040sd.pdf",
  url: "https://www.irs.gov/pub/irs-dft/f1040sd--dft.pdf",
  revision: "Draft created 4/1/26",
  coverPages: 1,
  sequence: 12,
  fields,
};

type Totals = { d: number; e: number; g: number; h: number };
const LINE_FOR_BOX: Record<Form8949Box, "1b" | "2" | "3" | "8b" | "9" | "10"> = {
  A: "1b", G: "1b", B: "2", H: "2", C: "3", I: "3",
  D: "8b", J: "8b", E: "9", K: "9", F: "10", L: "10",
};

export function fillScheduleD(ctx: FormContext, notes: PacketNote[]): FilledForm<Key> | null {
  const d = ctx.result.scheduleD;
  if (!d) return null;
  const v: Partial<Record<Key, FieldValue>> = { name: namesOnReturn(ctx), ssn: primarySsn(ctx) };
  const totals = new Map<string, Totals>();
  for (const group of d.form8949) {
    const line = LINE_FOR_BOX[group.box];
    const t = totals.get(line) ?? { d: 0, e: 0, g: 0, h: 0 };
    totals.set(line, { d: t.d + group.proceeds, e: t.e + group.costBasis, g: t.g + group.adjustment, h: t.h + group.gainOrLoss });
  }
  for (const [line, t] of totals) {
    v[`${line}.d` as Key] = amount(t.d);
    v[`${line}.e` as Key] = amount(t.e);
    v[`${line}.g` as Key] = amount(t.g);
    v[`${line}.h` as Key] = amountOrZero(t.h);
  }
  v["6"] = loss(d.shortTermCarryover);
  v["7"] = amountOrZero(d.netShortTerm);
  v["13"] = amount(d.capitalGainDistributions);
  v["14"] = loss(d.longTermCarryover);
  v["15"] = amountOrZero(d.netLongTerm);
  v["16"] = amountOrZero(d.total);
  if (d.netLongTerm > 0 && d.total > 0) {
    v["17_yes"] = true;
    v["18"] = amountOrZero(d.collectiblesGain);
    v["19"] = amountOrZero(d.unrecapturedSection1250Gain);
    v[d.collectiblesGain === 0 && d.unrecapturedSection1250Gain === 0 ? "20_yes" : "20_no"] = true;
  } else {
    v["17_no"] = true;
    if (d.total < 0) v["21"] = loss(d.allowedLoss);
    v[ctx.result.form1040.qualifiedDividends > 0 ? "22_yes" : "22_no"] = true;
  }
  notes.push({ form: "Schedule D", message: "Answer the qualified opportunity fund question at the top of page 1." });
  return { form: SCHEDULE_D, values: compact(v) };
}
