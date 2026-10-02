import { namesOnReturn, primarySsn } from "../common.ts";
import { amount, amountOrZero, compact } from "../format.ts";
import type { FieldValue, FilledForm, FormContext, FormDefinition } from "../types.ts";

const fields = {
  "1": { name: "topmostSubform[0].Page1[0].f1_3[0]", tooltip: "1. Enter the amount from line 11b of your Form 1" },
  "3": { name: "topmostSubform[0].Page1[0].f1_8[0]", tooltip: "3. Add lines 1 and 2d." },
  "4": { name: "topmostSubform[0].Page1[0].f1_9[0]", tooltip: "4. Number of qualifying children under age 17 wi" },
  "5": { name: "topmostSubform[0].Page1[0].f1_10[0]", tooltip: "5. Multiply line 4 by $2,200." },
  "6": { name: "topmostSubform[0].Page1[0].Line6ReadOrder[0].f1_11[0]", tooltip: "6. Number of other dependents, including any qua" },
  "7": { name: "topmostSubform[0].Page1[0].f1_12[0]", tooltip: "7. Multiply line 6 by $500." },
  "8": { name: "topmostSubform[0].Page1[0].f1_13[0]", tooltip: "8. Add lines 5 and 7." },
  "9": { name: "topmostSubform[0].Page1[0].f1_14[0]", tooltip: "9. Enter the amount shown below for your filing" },
  "10": { name: "topmostSubform[0].Page1[0].f1_15[0]", tooltip: "10. Subtract line 9 from line 3. If zero or less" },
  "11": { name: "topmostSubform[0].Page1[0].f1_16[0]", tooltip: "11. Multiply line 10 by 5% (0.05)." },
  "12": { name: "topmostSubform[0].Page1[0].f1_17[0]", tooltip: "12. Is the amount on line 8 more than the amount" },
  "13": { name: "topmostSubform[0].Page1[0].f1_18[0]", tooltip: "13. Enter the amount from Credit Limit Worksheet" },
  "14": { name: "topmostSubform[0].Page1[0].f1_19[0]", tooltip: "14. Enter the smaller of line 12 or line 13. Thi" },
  "17": { name: "topmostSubform[0].Page2[0].f2_5[0]", tooltip: "17. Enter the smaller of line 16a or line 16b." },
  "19": { name: "topmostSubform[0].Page2[0].f2_8[0]", tooltip: "19. Amount." },
  "20": { name: "topmostSubform[0].Page2[0].f2_9[0]", tooltip: "20. Multiply the amount on line 19 by 15% (0.15)" },
  "21": { name: "topmostSubform[0].Page2[0].f2_10[0]", tooltip: "21. Withheld social security, Medicare, and Addi" },
  "22": { name: "topmostSubform[0].Page2[0].f2_11[0]", tooltip: "22. Enter the total of the amounts from Schedule" },
  "23": { name: "topmostSubform[0].Page2[0].f2_12[0]", tooltip: "23. Add lines 21 and 22." },
  "24": { name: "topmostSubform[0].Page2[0].f2_13[0]", tooltip: "24. 1040 and 1040-S R filers: Enter the total of" },
  "25": { name: "topmostSubform[0].Page2[0].f2_14[0]", tooltip: "25. Subtract line 24 from line 23. If zero or le" },
  "26": { name: "topmostSubform[0].Page2[0].f2_15[0]", tooltip: "26. Enter the larger of line 20 or line 25. Next" },
  "27": { name: "topmostSubform[0].Page2[0].f2_16[0]", tooltip: "27. This is your additional child tax credit. En" },
  "name": { name: "topmostSubform[0].Page1[0].f1_1[0]", tooltip: "Page 1. Name(s) shown on return." },
  "ssn": { name: "topmostSubform[0].Page1[0].f1_2[0]", tooltip: "Your social security number." },
  "12_no": { name: "topmostSubform[0].Page1[0].c1_1[0]", tooltip: "12. No. Stop here. You cannot take the child tax" },
  "12_yes": { name: "topmostSubform[0].Page1[0].c1_1[1]", tooltip: "12. Yes. Subtract line 11 from line 8. Enter the" },
  "16a": { name: "topmostSubform[0].Page2[0].f2_2[0]", tooltip: "16a. Subtract line 14 from line 12. If zero, sto" },
  "16b_count": { name: "topmostSubform[0].Page2[0].f2_3[0]", tooltip: "16b. Number of qualifying children under age 17" },
  "16b": { name: "topmostSubform[0].Page2[0].f2_4[0]", tooltip: "16b. Number of qualifying children under age 17" },
  "18a": { name: "topmostSubform[0].Page2[0].f2_6[0]", tooltip: "18a. Earned income (see instructions)." },
  "19_no": { name: "topmostSubform[0].Page2[0].c2_1[0]", tooltip: "19. Is the amount on line 18a more than $2,500?" },
  "19_yes": { name: "topmostSubform[0].Page2[0].c2_1[1]", tooltip: "19. Yes. Subtract $2,500 from the amount on line" },
  "20_no": { name: "topmostSubform[0].Page2[0].c2_2[0]", tooltip: "20. Next. On line 16b, is the amount $5,100 or m" },
  "20_yes": { name: "topmostSubform[0].Page2[0].c2_2[1]", tooltip: "20. Yes. If line 20 is equal to or more than lin" },
};

type Key = keyof typeof fields;

export const SCHEDULE_8812: FormDefinition<Key> = {
  id: "f1040s8",
  title: "Schedule 8812 (Form 1040)",
  year: 2026,
  file: "f1040s8.pdf",
  url: "https://www.irs.gov/pub/irs-dft/f1040s8--dft.pdf",
  revision: "Draft created 4/24/26",
  coverPages: 1,
  fields,
};

export function fillSchedule8812(ctx: FormContext): FilledForm<Key> | null {
  const { result } = ctx;
  const s = result.schedule8812;
  if (s.creditBeforePhaseout === 0) return null;
  const agi = result.form1040.adjustedGrossIncome;
  const v: Partial<Record<Key, FieldValue>> = {
    name: namesOnReturn(ctx),
    ssn: primarySsn(ctx),
    "1": amountOrZero(agi),
    "3": amountOrZero(agi),
    "4": String(s.qualifyingChildren),
    "5": amountOrZero(s.childCredit),
    "6": String(s.otherDependents),
    "7": amountOrZero(s.otherDependentCredit),
    "8": amountOrZero(s.creditBeforePhaseout),
    "9": amount(s.phaseoutThreshold),
    "10": amountOrZero(s.excessOverThreshold),
    "11": amountOrZero(s.phaseoutReduction),
  };
  if (s.creditAfterPhaseout === 0) {
    v["12_no"] = true;
    return { form: SCHEDULE_8812, values: compact(v) };
  }
  v["12_yes"] = true;
  v["12"] = amount(s.creditAfterPhaseout);
  v["13"] = amountOrZero(s.creditLimit);
  v["14"] = amountOrZero(s.nonrefundableCredit);

  // Part II-A: additional child tax credit
  const a = s.partTwoA;
  if (a) {
    Object.assign(v, {
      "16a": amount(a.line16a),
      "16b_count": String(s.qualifyingChildren),
      "16b": amount(a.line16b),
      "17": amount(a.line17),
      "18a": amountOrZero(a.line18a),
      [a.line19 > 0 ? "19_yes" : "19_no"]: true,
      "19": a.line19 > 0 ? amount(a.line19) : "",
      "20": amountOrZero(a.line20),
      [s.qualifyingChildren < 3 ? "20_no" : "20_yes"]: true,
    });
  }
  // Part II-B
  const b = s.partTwoB;
  if (b) {
    Object.assign(v, {
      "21": amountOrZero(b.line21),
      "22": amountOrZero(b.line22),
      "23": amountOrZero(b.line23),
      "24": amountOrZero(b.line24),
      "25": amountOrZero(b.line25),
      "26": amountOrZero(b.line26),
    });
  }
  v["27"] = amountOrZero(s.additionalChildTaxCredit);
  return { form: SCHEDULE_8812, values: compact(v) };
}
