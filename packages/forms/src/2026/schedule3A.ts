import { namesOnReturn, primarySsn } from "../common.ts";
import { amount, amountOrZero, compact, ssn } from "../format.ts";
import type { FieldValue, FilledForm, FormContext, FormDefinition, PacketNote } from "../types.ts";

const fields = {
  "2": { name: "form1[0].Page1[0].f1_05[0]", tooltip: "2. Subtract line 1b from line 1a. If you are fil" },
  "3": { name: "form1[0].Page1[0].Line3_ReadOrder[0].f1_06[0]", tooltip: "3. Enter the amount from Form 1040, 1040-S R, or" },
  "4": { name: "form1[0].Page1[0].f1_07[0]", tooltip: "4. Enter the amount from Schedule 2 (Form 1040)," },
  "5": { name: "form1[0].Page1[0].f1_08[0]", tooltip: "5. Subtract line 4 from line 3." },
  "6": { name: "form1[0].Page1[0].f1_09[0]", tooltip: "6. Amount." },
  "8": { name: "form1[0].Page1[0].f1_10[0]", tooltip: "8. Amount." },
  "name": { name: "form1[0].Page1[0].f1_01[0]", tooltip: "n on Form 1040, 1040-S R, 1040-N R, or 1040-S S." },
  "ssn": { name: "form1[0].Page1[0].f1_02[0]", tooltip: "Your social security number." },
  "1a": { name: "form1[0].Page1[0].Line1a_ReadOrder[0].f1_03[0]", tooltip: "1a. Enter the amount from Form 1040 or 1040-S R," },
  "1b": { name: "form1[0].Page1[0].f1_04[0]", tooltip: "1b. Enter the amount from Form 1040 or 1040-S R," },
  "6_yes": { name: "form1[0].Page1[0].c1_1[0]", tooltip: "6. Is line 2 more than line 5? Yes. Subtract lin" },
  "6_no": { name: "form1[0].Page1[0].c1_1[1]", tooltip: "6. No. Stop. Enter 0 here. Enter 0 on Form 1040," },
  "7_yes": { name: "form1[0].Page1[0].c1_2[0]", tooltip: "7. Do you want to receive your federal public be" },
  "7_no": { name: "form1[0].Page1[0].c1_2[1]", tooltip: "7. No. Stop. Enter the amount from line 6 on For" },
  "8_yes": { name: "form1[0].Page1[0].c1_3[0]", tooltip: "8. Are you or your spouse a U.S. citizen, U.S. n" },
  "8_no": { name: "form1[0].Page1[0].c1_3[1]", tooltip: "8. No. Enter the amount from line 6 here and on" },
};

type Key = keyof typeof fields;

export const SCHEDULE_3A: FormDefinition<Key> = {
  id: "f1040s3a",
  title: "Schedule 3-A (Form 1040)",
  year: 2026,
  file: "f1040s3a.pdf",
  url: "https://www.irs.gov/pub/irs-dft/f1040s3a--dft.pdf",
  revision: "Draft created 6/24/26",
  coverPages: 1,
  sequence: 3.5,
  fields,
};

export function fillSchedule3A(ctx: FormContext, notes: PacketNote[]): FilledForm<Key> | null {
  const { result } = ctx;
  const threeA = result.scheduleThreeA;
  if (!threeA) return null;
  const f = result.form1040;
  const line1a = f.earnedIncomeCredit + f.additionalChildTaxCredit + f.excessSocialSecurityWithheld;
  const line1b = f.excessSocialSecurityWithheld;
  const line4 = result.form8959.onWages;
  const line5 = f.totalTax - line4;
  const benefit = threeA.federalPublicBenefit;
  const v: Partial<Record<Key, FieldValue>> = {
    name: namesOnReturn(ctx),
    ssn: primarySsn(ctx),
    "1a": amount(line1a),
    "1b": amount(line1b),
    "2": amountOrZero(line1a - line1b),
    "3": amountOrZero(f.totalTax),
    "4": amount(line4),
    "5": amountOrZero(line5),
  };
  if (benefit === 0) {
    v["6_no"] = true;
    v["6"] = "0";
  } else {
    v["6_yes"] = true;
    v["6"] = amount(benefit);
    v["7_yes"] = true;
    if (threeA.citizenNationalOrQualifiedAlien === null) {
      notes.push({ form: "Schedule 3-A", message: "Answer line 8 (citizen, U.S. national, or qualified alien)." });
    } else if (threeA.citizenNationalOrQualifiedAlien) {
      v["8_yes"] = true;
      v["8"] = "0";
    } else {
      v["8_no"] = true;
      v["8"] = amount(benefit);
    }
  }
  return { form: SCHEDULE_3A, values: compact(v) };
}
