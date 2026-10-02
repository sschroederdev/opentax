import { namesOnReturn, primarySsn } from "../common.ts";
import { amount, amountOrZero, compact } from "../format.ts";
import type { FieldValue, FilledForm, FormContext, FormDefinition, PacketNote } from "../types.ts";

const fields = {
  "1": { name: "form1[0].Page1[0].f1_03[0]", tooltip: "1. Enter the amount from Form 1040, 1040-S R, or" },
  "3": { name: "form1[0].Page1[0].f1_09[0]", tooltip: "3. Add lines 1 and 2e." },
  "5": { name: "form1[0].Page1[0].f1_35[0]", tooltip: "5. Add lines 4a through 4e, column (v)." },
  "8": { name: "form1[0].Page1[0].f1_102[0]", tooltip: "8. Add lines 5 and 7." },
  "9": { name: "form1[0].Page1[0].f1_103[0]", tooltip: "9. Enter the smaller of the amount on line 8 or" },
  "10": { name: "form1[0].Page1[0].f1_104[0]", tooltip: "10. Enter the amount from line 3." },
  "11": { name: "form1[0].Page1[0].f1_105[0]", tooltip: "11. Enter $150,000 ($300,000 if married filing j" },
  "12": { name: "form1[0].Page1[0].f1_106[0]", tooltip: "12. Subtract line 11 from line 10. If zero or le" },
  "13": { name: "form1[0].Page1[0].f1_107[0]", tooltip: "13. Divide line 12 by $1,000. If the resulting n" },
  "14": { name: "form1[0].Page1[0].f1_108[0]", tooltip: "14. Multiply line 13 by $100." },
  "15": { name: "form1[0].Page1[0].f1_109[0]", tooltip: "15. Qualified tips deduction. Subtract line 14 f" },
  "17": { name: "form1[0].Page2[0].f2_16[0]", tooltip: "17. Add lines 16a through 16e, column (i i i)." },
  "20": { name: "form1[0].Page2[0].f2_38[0]", tooltip: "20. Add lines 17 and 19." },
  "21": { name: "form1[0].Page2[0].f2_39[0]", tooltip: "21. Enter the smaller of the amount on line 20 o" },
  "22": { name: "form1[0].Page2[0].f2_40[0]", tooltip: "22. Enter the amount from line 3." },
  "23": { name: "form1[0].Page2[0].f2_41[0]", tooltip: "23. Enter $150,000 ($300,000 if married filing j" },
  "24": { name: "form1[0].Page2[0].f2_42[0]", tooltip: "24. Subtract line 23 from line 22. If zero or le" },
  "25": { name: "form1[0].Page2[0].f2_43[0]", tooltip: "25. Divide line 24 by $1,000. If the resulting n" },
  "26": { name: "form1[0].Page2[0].f2_44[0]", tooltip: "26. Multiply line 25 by $100." },
  "27": { name: "form1[0].Page2[0].f2_45[0]", tooltip: "27. Qualified overtime compensation deduction. S" },
  "37": { name: "form1[0].Page3[0].f3_15[0]", tooltip: "37. Enter the amount from line 3." },
  "38": { name: "form1[0].Page3[0].f3_16[0]", tooltip: "38. Enter $75,000 ($150,000 if married filing jo" },
  "39": { name: "form1[0].Page3[0].f3_17[0]", tooltip: "39. Subtract line 38 from line 37. If zero or le" },
  "40": { name: "form1[0].Page3[0].f3_18[0]", tooltip: "40. Multiply line 39 by 6% (0.06)." },
  "41": { name: "form1[0].Page3[0].f3_19[0]", tooltip: "41. Subtract line 40 from $6,000. If zero or les" },
  "43": { name: "form1[0].Page3[0].f3_22[0]", tooltip: "43. Enhanced deduction for seniors. Add lines 42" },
  "44": { name: "form1[0].Page3[0].f3_23[0]", tooltip: "44. Add lines 15, 27, 36, and 43. Enter here and" },
  "name": { name: "form1[0].Page1[0].f1_01[0]", tooltip: "me(s) shown on Form 1040, 1040-S R, or 1040-N R." },
  "ssn": { name: "form1[0].Page1[0].f1_02[0]", tooltip: "Your social security number." },
  "4a.i": { name: "form1[0].Page1[0].Table_Line4[0].Row4a[0].f1_10[0]", tooltip: "Row: 4a. Column: (i) Name of employer." },
  "4a.ii": { name: "form1[0].Page1[0].Table_Line4[0].Row4a[0].f1_11[0]", tooltip: "Row: 4a. Column: (i i) Employer’s identification" },
  "4a.iii": { name: "form1[0].Page1[0].Table_Line4[0].Row4a[0].f1_12[0]", tooltip: "Row: 4a. Column: (i i i) Qualified tips included" },
  "4a.iv": { name: "form1[0].Page1[0].Table_Line4[0].Row4a[0].f1_13[0]", tooltip: "Row: 4a. Column: (i v) Qualified tips included i" },
  "4a.v": { name: "form1[0].Page1[0].Table_Line4[0].Row4a[0].f1_14[0]", tooltip: "Row: 4a. Column: (v) Enter the larger of column" },
  "4b.i": { name: "form1[0].Page1[0].Table_Line4[0].Row4b[0].f1_15[0]", tooltip: "Row: 4b. Column: (i) Name of employer." },
  "4b.ii": { name: "form1[0].Page1[0].Table_Line4[0].Row4b[0].f1_16[0]", tooltip: "Row: 4b. Column: (i i) Employer’s identification" },
  "4b.iii": { name: "form1[0].Page1[0].Table_Line4[0].Row4b[0].f1_17[0]", tooltip: "Row: 4b. Column: (i i i) Qualified tips included" },
  "4b.iv": { name: "form1[0].Page1[0].Table_Line4[0].Row4b[0].f1_18[0]", tooltip: "Row: 4b. Column: (i v) Qualified tips included i" },
  "4b.v": { name: "form1[0].Page1[0].Table_Line4[0].Row4b[0].f1_19[0]", tooltip: "Row: 4b. Column: (v) Enter the larger of column" },
  "4c.i": { name: "form1[0].Page1[0].Table_Line4[0].Row4c[0].f1_20[0]", tooltip: "Row: 4c. Column: (i) Name of employer." },
  "4c.ii": { name: "form1[0].Page1[0].Table_Line4[0].Row4c[0].f1_21[0]", tooltip: "Row: 4c. Column: (i i) Employer’s identification" },
  "4c.iii": { name: "form1[0].Page1[0].Table_Line4[0].Row4c[0].f1_22[0]", tooltip: "Row: 4c. Column: (i i i) Qualified tips included" },
  "4c.iv": { name: "form1[0].Page1[0].Table_Line4[0].Row4c[0].f1_23[0]", tooltip: "Row: 4c. Column: (i v) Qualified tips included i" },
  "4c.v": { name: "form1[0].Page1[0].Table_Line4[0].Row4c[0].f1_24[0]", tooltip: "Row: 4c. Column: (v) Enter the larger of column" },
  "4d.i": { name: "form1[0].Page1[0].Table_Line4[0].Row4d[0].f1_25[0]", tooltip: "Row: 4d. Column: (i) Name of employer." },
  "4d.ii": { name: "form1[0].Page1[0].Table_Line4[0].Row4d[0].f1_26[0]", tooltip: "Row: 4d. Column: (i i) Employer’s identification" },
  "4d.iii": { name: "form1[0].Page1[0].Table_Line4[0].Row4d[0].f1_27[0]", tooltip: "Row: 4d. Column: (i i i) Qualified tips included" },
  "4d.iv": { name: "form1[0].Page1[0].Table_Line4[0].Row4d[0].f1_28[0]", tooltip: "Row: 4d. Column: (i v) Qualified tips included i" },
  "4d.v": { name: "form1[0].Page1[0].Table_Line4[0].Row4d[0].f1_29[0]", tooltip: "Row: 4d. Column: (v) Enter the larger of column" },
  "4e.i": { name: "form1[0].Page1[0].Table_Line4[0].Row4e[0].f1_30[0]", tooltip: "Row: 4e. Column: (i) Name of employer." },
  "4e.ii": { name: "form1[0].Page1[0].Table_Line4[0].Row4e[0].f1_31[0]", tooltip: "Row: 4e. Column: (i i) Employer’s identification" },
  "4e.iii": { name: "form1[0].Page1[0].Table_Line4[0].Row4e[0].f1_32[0]", tooltip: "Row: 4e. Column: (i i i) Qualified tips included" },
  "4e.iv": { name: "form1[0].Page1[0].Table_Line4[0].Row4e[0].f1_33[0]", tooltip: "Row: 4e. Column: (i v) Qualified tips included i" },
  "4e.v": { name: "form1[0].Page1[0].Table_Line4[0].Row4e[0].f1_34[0]", tooltip: "Row: 4e. Column: (v) Enter the larger of column" },
  "16a.i": { name: "form1[0].Page2[0].Table_Line16[0].Row16a[0].f2_01[0]", tooltip: "Row: 16a. Column: (i) Name of employer." },
  "16a.ii": { name: "form1[0].Page2[0].Table_Line16[0].Row16a[0].f2_02[0]", tooltip: "Row: 16a. Column: (i i) Employer’s identificatio" },
  "16a.iii": { name: "form1[0].Page2[0].Table_Line16[0].Row16a[0].f2_03[0]", tooltip: "Row: 16a. Column: (i i i) Qualified overtime com" },
  "16b.i": { name: "form1[0].Page2[0].Table_Line16[0].Row16b[0].f2_04[0]", tooltip: "Row: 16b. Column: (i) Name of employer." },
  "16b.ii": { name: "form1[0].Page2[0].Table_Line16[0].Row16b[0].f2_05[0]", tooltip: "Row: 16b. Column: (i i) Employer’s identificatio" },
  "16b.iii": { name: "form1[0].Page2[0].Table_Line16[0].Row16b[0].f2_06[0]", tooltip: "Row: 16b. Column: (i i i) Qualified overtime com" },
  "16c.i": { name: "form1[0].Page2[0].Table_Line16[0].Row16c[0].f2_07[0]", tooltip: "Row: 16c. Column: (i) Name of employer." },
  "16c.ii": { name: "form1[0].Page2[0].Table_Line16[0].Row16c[0].f2_08[0]", tooltip: "Row: 16c. Column: (i i) Employer’s identificatio" },
  "16c.iii": { name: "form1[0].Page2[0].Table_Line16[0].Row16c[0].f2_09[0]", tooltip: "Row: 16c. Column: (i i i) Qualified overtime com" },
  "16d.i": { name: "form1[0].Page2[0].Table_Line16[0].Row16d[0].f2_10[0]", tooltip: "Row: 16d. Column: (i) Name of employer." },
  "16d.ii": { name: "form1[0].Page2[0].Table_Line16[0].Row16d[0].f2_11[0]", tooltip: "Row: 16d. Column: (i i) Employer’s identificatio" },
  "16d.iii": { name: "form1[0].Page2[0].Table_Line16[0].Row16d[0].f2_12[0]", tooltip: "Row: 16d. Column: (i i i) Qualified overtime com" },
  "16e.i": { name: "form1[0].Page2[0].Table_Line16[0].Row16e[0].f2_13[0]", tooltip: "Row: 16e. Column: (i) Name of employer." },
  "16e.ii": { name: "form1[0].Page2[0].Table_Line16[0].Row16e[0].f2_14[0]", tooltip: "Row: 16e. Column: (i i) Employer’s identificatio" },
  "16e.iii": { name: "form1[0].Page2[0].Table_Line16[0].Row16e[0].f2_15[0]", tooltip: "Row: 16e. Column: (i i i) Qualified overtime com" },
  "42a": { name: "form1[0].Page3[0].f3_20[0]", tooltip: "42a. If you have a valid social security number" },
  "42b": { name: "form1[0].Page3[0].f3_21[0]", tooltip: "42b. If you are married filing jointly, your spo" },
};

type Key = keyof typeof fields;

export const SCHEDULE_1A: FormDefinition<Key> = {
  id: "f1040s1a",
  title: "Schedule 1-A (Form 1040)",
  year: 2026,
  file: "f1040s1a.pdf",
  url: "https://www.irs.gov/pub/irs-dft/f1040s1a--dft.pdf",
  revision: "Draft created 6/16/26",
  coverPages: 1,
  fields,
};

const ROWS = ["a", "b", "c", "d", "e"] as const;

export function fillSchedule1A(ctx: FormContext, notes: PacketNote[]): FilledForm<Key> | null {
  const { result } = ctx;
  const oneA = result.scheduleOneA;
  if (oneA.total === 0) return null;
  const magi = result.form1040.adjustedGrossIncome;
  const v: Partial<Record<Key, FieldValue>> = {
    name: namesOnReturn(ctx),
    ssn: primarySsn(ctx),
    "1": amountOrZero(magi),
    "3": amountOrZero(magi),
  };

  const tips = oneA.tipsPart;
  if (oneA.tips > 0) {
    tips.rows.slice(0, 5).forEach((row, i) => {
      const r = `4${ROWS[i]}`;
      const amt = amount(row.amount);
      Object.assign(v, { [`${r}.i`]: row.employerName, [`${r}.ii`]: row.employerEin, [`${r}.iii`]: amt, [`${r}.v`]: amt });
    });
    if (tips.rows.length > 5) notes.push({ form: "Schedule 1-A", message: "List employers after the fifth (line 4) on an attached statement." });
    Object.assign(v, {
      "5": amount(tips.total),
      "8": amount(tips.total),
      "9": amount(tips.limited),
      "10": amountOrZero(magi),
      "11": amount(tips.threshold),
      "12": amountOrZero(tips.excess),
      ...(tips.excess > 0 && { "13": String(tips.excessThousands), "14": amountOrZero(tips.reduction) }),
      "15": amountOrZero(oneA.tips),
    });
  }

  const overtime = oneA.overtimePart;
  if (oneA.overtime > 0) {
    overtime.rows.slice(0, 5).forEach((row, i) => {
      const r = `16${ROWS[i]}`;
      Object.assign(v, { [`${r}.i`]: row.employerName, [`${r}.ii`]: row.employerEin, [`${r}.iii`]: amount(row.amount) });
    });
    if (overtime.rows.length > 5) notes.push({ form: "Schedule 1-A", message: "List employers after the fifth (line 16) on an attached statement." });
    Object.assign(v, {
      "17": amount(overtime.total),
      "20": amount(overtime.total),
      "21": amount(overtime.limited),
      "22": amountOrZero(magi),
      "23": amount(overtime.threshold),
      "24": amountOrZero(overtime.excess),
      ...(overtime.excess > 0 && { "25": String(overtime.excessThousands), "26": amountOrZero(overtime.reduction) }),
      "27": amountOrZero(oneA.overtime),
    });
  }

  const senior = oneA.seniorPart;
  if (oneA.senior > 0) {
    Object.assign(v, {
      "37": amountOrZero(magi),
      "38": amount(senior.threshold),
      "39": amountOrZero(senior.excess),
      ...(senior.excess > 0 && { "40": amountOrZero(senior.reduction) }),
      "41": amountOrZero(senior.perPerson),
      "42a": senior.taxpayer > 0 ? amountOrZero(senior.taxpayer) : "",
      "42b": senior.spouse > 0 ? amountOrZero(senior.spouse) : "",
      "43": amountOrZero(oneA.senior),
    });
  }
  v["44"] = amountOrZero(oneA.total);
  return { form: SCHEDULE_1A, values: compact(v) };
}
