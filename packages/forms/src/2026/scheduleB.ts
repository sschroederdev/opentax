import { namesOnReturn, primarySsn } from "../common.ts";
import { amount, compact } from "../format.ts";
import type { FieldValue, FilledForm, FormContext, FormDefinition, PacketNote } from "../types.ts";

const fields = {
  "2": { name: "topmostSubform[0].Page1[0].f1_31[0]", tooltip: "2. Add the amounts on line 1." },
  "4": { name: "topmostSubform[0].Page1[0].f1_33[0]", tooltip: "4. Subtract line 3 from line 2. Enter the result" },
  "6": { name: "topmostSubform[0].Page1[0].f1_64[0]", tooltip: "6. Add the amounts on line 5. Enter the total he" },
  "name": { name: "topmostSubform[0].Page1[0].f1_01[0]", tooltip: "Page 1. Name(s) shown on return." },
  "ssn": { name: "topmostSubform[0].Page1[0].f1_02[0]", tooltip: "Your social security number." },
  "1.1.payer": { name: "topmostSubform[0].Page1[0].Line1_ReadOrder[0].f1_03[0]", tooltip: "ocial security number and address: Line 1 of 14." },
  "1.1.amount": { name: "topmostSubform[0].Page1[0].f1_04[0]", tooltip: "1. Amount. Line 1 of 14." },
  "1.2.payer": { name: "topmostSubform[0].Page1[0].f1_05[0]", tooltip: "1. Line 2 of 14." },
  "1.2.amount": { name: "topmostSubform[0].Page1[0].f1_06[0]", tooltip: "1. Amount. Line 2 of 14." },
  "1.3.payer": { name: "topmostSubform[0].Page1[0].f1_07[0]", tooltip: "1. Line 3 of 14." },
  "1.3.amount": { name: "topmostSubform[0].Page1[0].f1_08[0]", tooltip: "1. Amount. Line 3 of 14." },
  "1.4.payer": { name: "topmostSubform[0].Page1[0].f1_09[0]", tooltip: "1. Line 4 of 14." },
  "1.4.amount": { name: "topmostSubform[0].Page1[0].f1_10[0]", tooltip: "1. Amount. Line 4 of 14." },
  "1.5.payer": { name: "topmostSubform[0].Page1[0].f1_11[0]", tooltip: "1. Line 5 of 14." },
  "1.5.amount": { name: "topmostSubform[0].Page1[0].f1_12[0]", tooltip: "1. Amount. Line 5 of 14." },
  "1.6.payer": { name: "topmostSubform[0].Page1[0].f1_13[0]", tooltip: "1. Line 6 of 14." },
  "1.6.amount": { name: "topmostSubform[0].Page1[0].f1_14[0]", tooltip: "1. Amount. Line 6 of 14." },
  "1.7.payer": { name: "topmostSubform[0].Page1[0].f1_15[0]", tooltip: "1. Line 7 of 14." },
  "1.7.amount": { name: "topmostSubform[0].Page1[0].f1_16[0]", tooltip: "1. Amount. Line 7 of 14." },
  "1.8.payer": { name: "topmostSubform[0].Page1[0].f1_17[0]", tooltip: "1. Line 8 of 14." },
  "1.8.amount": { name: "topmostSubform[0].Page1[0].f1_18[0]", tooltip: "1. Amount. Line 8 of 14." },
  "1.9.payer": { name: "topmostSubform[0].Page1[0].f1_19[0]", tooltip: "1. Line 9 of 14." },
  "1.9.amount": { name: "topmostSubform[0].Page1[0].f1_20[0]", tooltip: "1. Amount. Line 9 of 14." },
  "1.10.payer": { name: "topmostSubform[0].Page1[0].f1_21[0]", tooltip: "1. Line 10 of 14." },
  "1.10.amount": { name: "topmostSubform[0].Page1[0].f1_22[0]", tooltip: "1. Amount. Line 10 of 14." },
  "1.11.payer": { name: "topmostSubform[0].Page1[0].f1_23[0]", tooltip: "1. Line 11 of 14." },
  "1.11.amount": { name: "topmostSubform[0].Page1[0].f1_24[0]", tooltip: "1. Amount. Line 11 of 14." },
  "1.12.payer": { name: "topmostSubform[0].Page1[0].f1_25[0]", tooltip: "1. Line 12 of 14." },
  "1.12.amount": { name: "topmostSubform[0].Page1[0].f1_26[0]", tooltip: "1. Amount. Line 12 of 14." },
  "1.13.payer": { name: "topmostSubform[0].Page1[0].f1_27[0]", tooltip: "1. Line 13 of 14." },
  "1.13.amount": { name: "topmostSubform[0].Page1[0].f1_28[0]", tooltip: "1. Amount. Line 13 of 14." },
  "1.14.payer": { name: "topmostSubform[0].Page1[0].f1_29[0]", tooltip: "1. Line 14 of 14." },
  "1.14.amount": { name: "topmostSubform[0].Page1[0].f1_30[0]", tooltip: "1. Amount. Line 14 of 14." },
  "5.1.payer": { name: "topmostSubform[0].Page1[0].ReadOrderControl[0].f1_34[0]", tooltip: "that form. 5. List name of payer: Line 1 of 15." },
  "5.1.amount": { name: "topmostSubform[0].Page1[0].f1_35[0]", tooltip: "5. Amount. Line 1 of 15." },
  "5.2.payer": { name: "topmostSubform[0].Page1[0].f1_36[0]", tooltip: "5. Line 2 of 15." },
  "5.2.amount": { name: "topmostSubform[0].Page1[0].f1_37[0]", tooltip: "5. Amount. Line 2 of 15." },
  "5.3.payer": { name: "topmostSubform[0].Page1[0].f1_38[0]", tooltip: "5. Line 3 of 15." },
  "5.3.amount": { name: "topmostSubform[0].Page1[0].f1_39[0]", tooltip: "5. Amount. Line 3 of 15." },
  "5.4.payer": { name: "topmostSubform[0].Page1[0].f1_40[0]", tooltip: "5. Line 4 of 15." },
  "5.4.amount": { name: "topmostSubform[0].Page1[0].f1_41[0]", tooltip: "5. Amount. Line 4 of 15." },
  "5.5.payer": { name: "topmostSubform[0].Page1[0].f1_42[0]", tooltip: "5. Line 5 of 15." },
  "5.5.amount": { name: "topmostSubform[0].Page1[0].f1_43[0]", tooltip: "5. Amount. Line 5 of 15." },
  "5.6.payer": { name: "topmostSubform[0].Page1[0].f1_44[0]", tooltip: "5. Line 6 of 15." },
  "5.6.amount": { name: "topmostSubform[0].Page1[0].f1_45[0]", tooltip: "5. Amount. Line 6 of 15." },
  "5.7.payer": { name: "topmostSubform[0].Page1[0].f1_46[0]", tooltip: "5. Line 7 of 15." },
  "5.7.amount": { name: "topmostSubform[0].Page1[0].f1_47[0]", tooltip: "5. Amount. Line 7 of 15." },
  "5.8.payer": { name: "topmostSubform[0].Page1[0].f1_48[0]", tooltip: "5. Line 8 of 15." },
  "5.8.amount": { name: "topmostSubform[0].Page1[0].f1_49[0]", tooltip: "5. Amount. Line 8 of 15." },
  "5.9.payer": { name: "topmostSubform[0].Page1[0].f1_50[0]", tooltip: "5. Line 9 of 15." },
  "5.9.amount": { name: "topmostSubform[0].Page1[0].f1_51[0]", tooltip: "5. Amount. Line 9 of 15." },
  "5.10.payer": { name: "topmostSubform[0].Page1[0].f1_52[0]", tooltip: "5. Line 10 of 15." },
  "5.10.amount": { name: "topmostSubform[0].Page1[0].f1_53[0]", tooltip: "5. Amount. Line 10 of 15." },
  "5.11.payer": { name: "topmostSubform[0].Page1[0].f1_54[0]", tooltip: "5. Line 11 of 15." },
  "5.11.amount": { name: "topmostSubform[0].Page1[0].f1_55[0]", tooltip: "5. Amount. Line 11 of 15." },
  "5.12.payer": { name: "topmostSubform[0].Page1[0].f1_56[0]", tooltip: "5. Line 12 of 15." },
  "5.12.amount": { name: "topmostSubform[0].Page1[0].f1_57[0]", tooltip: "5. Amount. Line 12 of 15." },
  "5.13.payer": { name: "topmostSubform[0].Page1[0].f1_58[0]", tooltip: "5. Line 13 of 15." },
  "5.13.amount": { name: "topmostSubform[0].Page1[0].f1_59[0]", tooltip: "5. Amount. Line 13 of 15." },
  "5.14.payer": { name: "topmostSubform[0].Page1[0].f1_60[0]", tooltip: "5. Line 14 of 15." },
  "5.14.amount": { name: "topmostSubform[0].Page1[0].f1_61[0]", tooltip: "5. Amount. Line 14 of 15." },
  "5.15.payer": { name: "topmostSubform[0].Page1[0].f1_62[0]", tooltip: "5. Line 15 of 15." },
  "5.15.amount": { name: "topmostSubform[0].Page1[0].f1_63[0]", tooltip: "5. Amount. Line 15 of 15." },
  "7a_yes": { name: "topmostSubform[0].Page1[0].TagcorrectingSubform[0].c1_1[0]", tooltip: "7a. At any time during 2026, did you have a fina" },
  "7a_no": { name: "topmostSubform[0].Page1[0].TagcorrectingSubform[0].c1_1[1]", tooltip: "7a. No." },
  "8_yes": { name: "topmostSubform[0].Page1[0].c1_3[0]", tooltip: "8. During 2026, did you receive a distribution f" },
  "8_no": { name: "topmostSubform[0].Page1[0].c1_3[1]", tooltip: "8. No." },
};

type Key = keyof typeof fields;

export const SCHEDULE_B: FormDefinition<Key> = {
  id: "f1040sb",
  title: "Schedule B (Form 1040)",
  year: 2026,
  file: "f1040sb.pdf",
  url: "https://www.irs.gov/pub/irs-dft/f1040sb--dft.pdf",
  revision: "Draft created 4/7/26",
  coverPages: 1,
  fields,
};

const INTEREST_ROWS = 14;
const DIVIDEND_ROWS = 15;

export function fillScheduleB(ctx: FormContext, notes: PacketNote[]): FilledForm<Key> | null {
  const { result, input } = ctx;
  const b = result.scheduleB;
  if (!b.required) return null;
  const v: Partial<Record<Key, FieldValue>> = { name: namesOnReturn(ctx), ssn: primarySsn(ctx) };
  const interest = b.interest.filter((row) => row.amount !== 0);
  const dividends = b.dividends.filter((row) => row.amount !== 0);
  interest.slice(0, INTEREST_ROWS).forEach((row, i) => {
    v[`1.${i + 1}.payer` as Key] = row.payerName;
    v[`1.${i + 1}.amount` as Key] = amount(row.amount);
  });
  dividends.slice(0, DIVIDEND_ROWS).forEach((row, i) => {
    v[`5.${i + 1}.payer` as Key] = row.payerName;
    v[`5.${i + 1}.amount` as Key] = amount(row.amount);
  });
  if (interest.length > INTEREST_ROWS || dividends.length > DIVIDEND_ROWS) {
    notes.push({ form: "Schedule B", message: "List the payers that don't fit on Schedule B on an attached statement." });
  }
  v["2"] = amount(result.form1040.taxableInterest);
  v["4"] = amount(result.form1040.taxableInterest);
  v["6"] = amount(result.form1040.ordinaryDividends);
  // Foreign accounts and trusts are screened out as unsupported, so a
  // supported return answers no.
  if (!input.screening.foreignAccountsOrIncome) {
    v["7a_no"] = true;
    v["8_no"] = true;
  }
  return { form: SCHEDULE_B, values: compact(v) };
}
