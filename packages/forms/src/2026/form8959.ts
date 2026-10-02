import { namesOnReturn, primarySsn } from "../common.ts";
import { amount, amountOrZero, compact } from "../format.ts";
import type { FilledForm, FormContext, FormDefinition } from "../types.ts";

const fields = {
  "1": { name: "topmostSubform[0].Page1[0].f1_3[0]", tooltip: "1. Medicare wages and tips from Form W-2, box 5." },
  "4": { name: "topmostSubform[0].Page1[0].f1_6[0]", tooltip: "4. Add lines 1 through 3." },
  "5": { name: "topmostSubform[0].Page1[0].f1_7[0]", tooltip: "5. Enter the following amount for your filing st" },
  "6": { name: "topmostSubform[0].Page1[0].f1_8[0]", tooltip: "6. Subtract line 5 from line 4. If zero or less," },
  "7": { name: "topmostSubform[0].Page1[0].f1_9[0]", tooltip: "7. Additional Medicare Tax on Medicare wages. Mu" },
  "12": { name: "topmostSubform[0].Page1[0].f1_14[0]", tooltip: "12. Add lines 7 and 11. Also enter this amount o" },
  "13": { name: "topmostSubform[0].Page1[0].f1_15[0]", tooltip: "13. Self-employment income from Schedule S E (Fo" },
  "14": { name: "topmostSubform[0].Page1[0].f1_16[0]", tooltip: "14. Enter the following amount for your filing s" },
  "15": { name: "topmostSubform[0].Page1[0].f1_17[0]", tooltip: "15. Enter the amount from line 4." },
  "16": { name: "topmostSubform[0].Page1[0].f1_18[0]", tooltip: "16. Subtract line 15 from line 14. If zero or le" },
  "17": { name: "topmostSubform[0].Page1[0].f1_19[0]", tooltip: "17. Subtract line 16 from line 13. If zero or le" },
  "18": { name: "topmostSubform[0].Page1[0].f1_20[0]", tooltip: "18. Additional Medicare Tax on self-employment i" },
  "19": { name: "topmostSubform[0].Page1[0].f1_21[0]", tooltip: "19. Medicare tax withheld from Form W-2, box 6." },
  "20": { name: "topmostSubform[0].Page1[0].f1_22[0]", tooltip: "20. Enter the amount from line 1." },
  "21": { name: "topmostSubform[0].Page1[0].f1_23[0]", tooltip: "21. Multiply line 20 by 1.45% (0.0145). This is" },
  "22": { name: "topmostSubform[0].Page1[0].f1_24[0]", tooltip: "22. Subtract line 21 from line 19. If zero or le" },
  "24": { name: "topmostSubform[0].Page1[0].f1_26[0]", tooltip: "24. Total Additional Medicare Tax withholding. A" },
  "name": { name: "topmostSubform[0].Page1[0].f1_1[0]", tooltip: "Page 1. Name(s) shown on return." },
  "ssn": { name: "topmostSubform[0].Page1[0].f1_2[0]", tooltip: "Your social security number." },
};

type Key = keyof typeof fields;

export const FORM_8959: FormDefinition<Key> = {
  id: "f8959",
  title: "Form 8959",
  year: 2026,
  file: "f8959.pdf",
  url: "https://www.irs.gov/pub/irs-dft/f8959--dft.pdf",
  revision: "Draft created 5/27/26",
  coverPages: 1,
  fields,
};

export function fillForm8959(ctx: FormContext): FilledForm<Key> | null {
  const m = ctx.result.form8959;
  if (m.additionalMedicareTax === 0 && m.additionalMedicareTaxWithheld === 0) return null;
  return {
    form: FORM_8959,
    values: compact<Key>({
      name: namesOnReturn(ctx),
      ssn: primarySsn(ctx),
      "1": amount(m.medicareWages),
      "4": amount(m.medicareWages),
      "5": amount(m.threshold),
      "6": amountOrZero(Math.max(0, m.medicareWages - m.threshold)),
      "7": amountOrZero(m.onWages),
      "12": amountOrZero(m.onWages),
      ...(m.selfEmploymentIncome > 0 && {
        "13": amount(m.selfEmploymentIncome),
        "14": amount(m.threshold),
        "15": amountOrZero(m.medicareWages),
        "16": amountOrZero(m.remainingThreshold),
        "17": amountOrZero(Math.max(0, m.selfEmploymentIncome - m.remainingThreshold)),
        "18": amountOrZero(m.onSelfEmployment),
      }),
      "19": amount(m.medicareTaxWithheld),
      "20": amount(m.medicareWages),
      "21": amount(m.regularMedicareTax),
      "22": amountOrZero(m.additionalMedicareTaxWithheld),
      "24": amountOrZero(m.additionalMedicareTaxWithheld),
    }),
  };
}
