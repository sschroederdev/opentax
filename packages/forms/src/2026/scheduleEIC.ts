import { isEitcQualifyingChild } from "@opentax/engine";
import { namesOnReturn, primarySsn, RELATIONSHIP_LABELS } from "../common.ts";
import { compact, ssn } from "../format.ts";
import type { FieldValue, FilledForm, FormContext, FormDefinition, PacketNote } from "../types.ts";

const fields = {
  "name": { name: "topmostSubform[0].Page1[0].f1_01[0]", tooltip: "Page 1. Name(s) shown on return." },
  "ssn": { name: "topmostSubform[0].Page1[0].f1_02[0]", tooltip: "Your social security number." },
  "c1.name": { name: "topmostSubform[0].Page1[0].f1_03[0]", tooltip: "maximum credit. Child 1. First name. Last name." },
  "c1.ssn": { name: "topmostSubform[0].Page1[0].f1_06[0]", tooltip: "l medical records showing a live birth. Child 1." },
  "c1.relationship": { name: "topmostSubform[0].Page1[0].f1_21[0]", tooltip: ", nephew, eligible foster child, etc.). Child 1." },
  "c1.months": { name: "topmostSubform[0].Page1[0].Line6_Child1_ReadOrder[0].f1_24[0]", tooltip: "ild 1. months. Do not enter more than 12 months." },
  "c2.name": { name: "topmostSubform[0].Page1[0].f1_04[0]", tooltip: "1. Child 2. First name. Last name." },
  "c2.ssn": { name: "topmostSubform[0].Page1[0].f1_07[0]", tooltip: "2. Child 2." },
  "c2.relationship": { name: "topmostSubform[0].Page1[0].f1_22[0]", tooltip: "5. Child 2." },
  "c2.months": { name: "topmostSubform[0].Page1[0].Line6_Child2_ReadOrder[0].f1_25[0]", tooltip: "ild 2. months. Do not enter more than 12 months." },
  "c3.name": { name: "topmostSubform[0].Page1[0].f1_05[0]", tooltip: "1. Child 3. First name. Last name." },
  "c3.ssn": { name: "topmostSubform[0].Page1[0].f1_08[0]", tooltip: "2. Child 3." },
  "c3.relationship": { name: "topmostSubform[0].Page1[0].f1_23[0]", tooltip: "5. Child 3." },
  "c3.months": { name: "topmostSubform[0].Page1[0].f1_26[0]", tooltip: "ild 3. months. Do not enter more than 12 months." },
  "c1.year1": { name: "topmostSubform[0].Page1[0].Year1_ReadOrder[0].f1_09[0]", tooltip: "ld's year of birth. Child 1. Year. Digit 1 of 4." },
  "c1.year2": { name: "topmostSubform[0].Page1[0].Year1_ReadOrder[0].f1_10[0]", tooltip: "3. Digit 2 of 4." },
  "c1.year3": { name: "topmostSubform[0].Page1[0].Year1_ReadOrder[0].f1_11[0]", tooltip: "3. Digit 3 of 4." },
  "c1.year4": { name: "topmostSubform[0].Page1[0].Year1_ReadOrder[0].f1_12[0]", tooltip: "ng jointly), skip lines 4a and 4b; go to line 5." },
  "c2.year1": { name: "topmostSubform[0].Page1[0].Year2_ReadOrder[0].f1_13[0]", tooltip: "3. Child 2. Year. Digit 1 of 4." },
  "c2.year2": { name: "topmostSubform[0].Page1[0].Year2_ReadOrder[0].f1_14[0]", tooltip: "3. Digit 2 of 4." },
  "c2.year3": { name: "topmostSubform[0].Page1[0].Year2_ReadOrder[0].f1_15[0]", tooltip: "3. Digit 3 of 4." },
  "c2.year4": { name: "topmostSubform[0].Page1[0].Year2_ReadOrder[0].f1_16[0]", tooltip: "ng jointly), skip lines 4a and 4b; go to line 5." },
  "c3.year1": { name: "topmostSubform[0].Page1[0].f1_17[0]", tooltip: "3. Child 3. Year. Digit 1 of 4." },
  "c3.year2": { name: "topmostSubform[0].Page1[0].f1_18[0]", tooltip: "3. Digit 2 of 4." },
  "c3.year3": { name: "topmostSubform[0].Page1[0].f1_19[0]", tooltip: "3. Digit 3 of 4." },
  "c3.year4": { name: "topmostSubform[0].Page1[0].f1_20[0]", tooltip: "ng jointly), skip lines 4a and 4b; go to line 5." },
  "c1.4a_yes": { name: "topmostSubform[0].Page1[0].Line4a_Child1_ReadOrder[0].Yes_ReadOrder[0].c1_1[0]", tooltip: "if filing jointly)? Child 1. Yes. Go to line 5." },
  "c1.4a_no": { name: "topmostSubform[0].Page1[0].Line4a_Child1_ReadOrder[0].c1_1[0]", tooltip: "4a. No. Go to line 4b." },
  "c2.4a_yes": { name: "topmostSubform[0].Page1[0].Line4a_Child2_ReadOrder[0].Yes_ReadOrder[0].c1_2[0]", tooltip: "4a. Child 2. Yes. Go to line 5." },
  "c2.4a_no": { name: "topmostSubform[0].Page1[0].Line4a_Child2_ReadOrder[0].c1_2[0]", tooltip: "4a. No. Go to line 4b." },
  "c3.4a_yes": { name: "topmostSubform[0].Page1[0].Line4a_Child3_Yes_ReadOrder[0].c1_3[0]", tooltip: "4a. Child 3. Yes. Go to line 5." },
  "c3.4a_no": { name: "topmostSubform[0].Page1[0].c1_3[0]", tooltip: "4a. No. Go to line 4b." },
  "c1.4b_yes": { name: "topmostSubform[0].Page1[0].Line4b_Child1_ReadOrder[0].Yes_ReadOrder[0].c1_4[0]", tooltip: "ng any part of 2026? Child 1. Yes. Go to line 5." },
  "c1.4b_no": { name: "topmostSubform[0].Page1[0].Line4b_Child1_ReadOrder[0].c1_4[0]", tooltip: "4b. No. The child is not a qualifying child." },
  "c2.4b_yes": { name: "topmostSubform[0].Page1[0].Line4b_Child2_ReadOrder[0].Yes_ReadOrder[0].c1_5[0]", tooltip: "4b. Child 2. Yes. Go to line 5." },
  "c2.4b_no": { name: "topmostSubform[0].Page1[0].Line4b_Child2_ReadOrder[0].c1_5[0]", tooltip: "4b. No. The child is not a qualifying child." },
  "c3.4b_yes": { name: "topmostSubform[0].Page1[0].Line4b_Child3_Yes_ReadOrder[0].c1_6[0]", tooltip: "4b. Child 3. Yes. Go to line 5." },
  "c3.4b_no": { name: "topmostSubform[0].Page1[0].c1_6[0]", tooltip: "4b. No. The child is not a qualifying child." },
};

type Key = keyof typeof fields;

export const SCHEDULE_EIC: FormDefinition<Key> = {
  id: "f1040sei",
  title: "Schedule EIC (Form 1040)",
  year: 2026,
  file: "f1040sei.pdf",
  url: "https://www.irs.gov/pub/irs-dft/f1040sei--dft.pdf",
  revision: "Draft created 5/28/26",
  coverPages: 1,
  fields,
};

const CHILD_SLOTS = ["c1", "c2", "c3"] as const;

export function fillScheduleEIC(ctx: FormContext, notes: PacketNote[]): FilledForm<Key> | null {
  const { input, result, details } = ctx;
  if (result.earnedIncomeCredit.credit === 0 || result.earnedIncomeCredit.qualifyingChildren === 0) return null;
  const spouse = input.filingStatus === "marriedFilingJointly" ? input.spouse : undefined;
  const filers = spouse ? [input.taxpayer, spouse] : [input.taxpayer];
  const children = input.dependents
    .map((d, index) => ({ d, index }))
    .filter(({ d }) => isEitcQualifyingChild(d, filers, input.taxYear));
  const v: Partial<Record<Key, FieldValue>> = { name: namesOnReturn(ctx), ssn: primarySsn(ctx) };
  children.slice(0, 3).forEach(({ d, index }, i) => {
    const slot = CHILD_SLOTS[i]!;
    const year = d.dateOfBirth.slice(0, 4);
    v[`${slot}.name`] = `${d.firstName} ${d.lastName}`.trim();
    v[`${slot}.ssn`] = ssn(details.dependentSsns[index] ?? "");
    [...year].forEach((digit, k) => (v[`${slot}.year${k + 1}` as Key] = digit));
    // Line 4 only applies to children born before 2008 (age 19 or older).
    const youngerThanFiler = filers.some((f) => f.dateOfBirth < d.dateOfBirth);
    if (Number(year) < input.taxYear - 18 || !youngerThanFiler) {
      const studentUnder24 = d.fullTimeStudent && Number(year) > input.taxYear - 24 && youngerThanFiler;
      v[`${slot}.4a_${studentUnder24 ? "yes" : "no"}` as Key] = true;
      if (!studentUnder24) v[`${slot}.4b_${d.permanentlyDisabled ? "yes" : "no"}` as Key] = true;
    }
    v[`${slot}.relationship`] = RELATIONSHIP_LABELS[d.relationship];
    v[`${slot}.months`] = String(Math.min(12, d.monthsLivedWithFiler));
  });
  if (children.length > 3) {
    notes.push({ form: "Schedule EIC", message: "Only three children are listed; the EIC doesn't increase for more." });
  }
  return { form: SCHEDULE_EIC, values: compact(v) };
}
