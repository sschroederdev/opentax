import { namesOnReturn, primarySsn } from "../common.ts";
import { amount, compact, ssn } from "../format.ts";
import type { FilledForm, FormContext, FormDefinition } from "../types.ts";

const fields = {
  "4": { name: "form1[0].Page1[0].f1_15[0]", tooltip: "4. Amount." },
  "6": { name: "form1[0].Page1[0].f1_17[0]", tooltip: "6. Net investment income tax. Attach Form 8960." },
  "11": { name: "form1[0].Page1[0].f1_22[0]", tooltip: "11. Additional Medicare Tax on self-employment i" },
  "15": { name: "form1[0].Page2[0].f2_07[0]", tooltip: "15. Add lines 4 through 11 and line 14." },
  "20": { name: "form1[0].Page2[0].f2_19[0]", tooltip: "20. Total additional employment and other taxes." },
  "21": { name: "form1[0].Page2[0].f2_20[0]", tooltip: "21. Add lines 15 and 20. These are your total ad" },
  "name": { name: "form1[0].Page1[0].f1_01[0]", tooltip: "me(s) shown on Form 1040, 1040-S R, or 1040-N R." },
  "ssn": { name: "form1[0].Page1[0].f1_02[0]", tooltip: "Your social security number." },
  "17b": { name: "form1[0].Page2[0].f2_12[0]", tooltip: "17b. Additional Medicare tax on Medicare wages a" },
  "17d": { name: "form1[0].Page2[0].f2_14[0]", tooltip: "17d. Total other employment taxes. Add lines 17a" },
};

type Key = keyof typeof fields;

export const SCHEDULE_2: FormDefinition<Key> = {
  id: "f1040s2",
  title: "Schedule 2 (Form 1040)",
  year: 2026,
  file: "f1040s2.pdf",
  url: "https://www.irs.gov/pub/irs-dft/f1040s2--dft.pdf",
  revision: "Draft created 4/27/26",
  coverPages: 1,
  sequence: 2,
  fields,
};

export function fillSchedule2(ctx: FormContext): FilledForm<Key> | null {
  const { result } = ctx;
  if (result.form1040.otherTaxes === 0) return null;
  const selfEmploymentTax = result.scheduleSE.reduce((sum, se) => sum + se.selfEmploymentTax, 0);
  const niit = result.form8960.netInvestmentIncomeTax;
  const medicare = result.form8959;
  const line15 = selfEmploymentTax + niit + medicare.onSelfEmployment;
  const line20 = medicare.onWages;
  return {
    form: SCHEDULE_2,
    values: compact<Key>({
      name: namesOnReturn(ctx),
      ssn: primarySsn(ctx),
      "4": amount(selfEmploymentTax),
      "6": amount(niit),
      "11": amount(medicare.onSelfEmployment),
      "15": amount(line15),
      "17b": amount(medicare.onWages),
      "17d": amount(medicare.onWages),
      "20": amount(line20),
      "21": amount(line15 + line20),
    }),
  };
}
