import { personHeader } from "../common.ts";
import { amount, amountOrZero, compact } from "../format.ts";
import type { FilledForm, FormContext, FormDefinition } from "../types.ts";

const fields = {
  "2": { name: "topmostSubform[0].Page1[0].f1_5[0]", tooltip: "2 if you use the nonfarm optional method in Part" },
  "3": { name: "topmostSubform[0].Page1[0].f1_6[0]", tooltip: "3. Combine lines 1a, 1b, and 2." },
  "6": { name: "topmostSubform[0].Page1[0].f1_12[0]", tooltip: "6. Add lines 4c and 5b." },
  "7": { name: "topmostSubform[0].Page1[0].f1_13[0]", tooltip: "7. Maximum amount of combined wages and self-emp" },
  "9": { name: "topmostSubform[0].Page1[0].f1_18[0]", tooltip: "9. Subtract line 8d from line 7. If zero or less" },
  "10": { name: "topmostSubform[0].Page1[0].f1_19[0]", tooltip: "10. Multiply the smaller of line 6 or line 9 by" },
  "11": { name: "topmostSubform[0].Page1[0].f1_20[0]", tooltip: "11. Multiply line 6 by 2.9% (0.029)." },
  "12": { name: "topmostSubform[0].Page1[0].f1_21[0]", tooltip: "12. Self-employment tax. Add lines 10 and 11. En" },
  "13": { name: "topmostSubform[0].Page1[0].f1_22[0]", tooltip: "13. Deduction for one-half of self-employment ta" },
  "name": { name: "topmostSubform[0].Page1[0].f1_1[0]", tooltip: "on Form 1040, 1040-S R, 1040-S S, or 1040-N R)." },
  "ssn": { name: "topmostSubform[0].Page1[0].f1_2[0]", tooltip: "ty number of person with self-employment income." },
  "4a": { name: "topmostSubform[0].Page1[0].f1_7[0]", tooltip: "4a. If line 3 is more than zero, multiply line 3" },
  "4c": { name: "topmostSubform[0].Page1[0].f1_9[0]", tooltip: "4c. Combine lines 4a and 4b. If less than $400," },
  "8a": { name: "topmostSubform[0].Page1[0].f1_14[0]", tooltip: "8a. Total social security wages and tips (total" },
  "8d": { name: "topmostSubform[0].Page1[0].f1_17[0]", tooltip: "8d. Add lines 8a, 8b, and 8c." },
};

type Key = keyof typeof fields;

export const SCHEDULE_SE: FormDefinition<Key> = {
  id: "f1040sse",
  title: "Schedule SE (Form 1040)",
  year: 2026,
  file: "f1040sse.pdf",
  url: "https://www.irs.gov/pub/irs-dft/f1040sse--dft.pdf",
  revision: "Draft created 4/27/26",
  coverPages: 1,
  fields,
};

/** One Schedule SE for each person with self-employment tax. */
export function fillScheduleSE(ctx: FormContext): FilledForm<Key>[] {
  return ctx.result.scheduleSE
    .filter((se) => se.selfEmploymentTax > 0)
    .map((se) => {
      const header = personHeader(ctx, se.owner);
      const wageBase = ctx.params.socialSecurity.wageBase;
      return {
        form: SCHEDULE_SE,
        label: header.name,
        values: compact<Key>({
          name: header.name,
          ssn: header.ssn,
          "2": amount(se.netProfit),
          "3": amount(se.netProfit),
          "4a": amount(se.line4a),
          "4c": amount(se.netEarnings),
          "6": amount(se.netEarnings),
          "8a": amount(se.socialSecurityWages),
          "8d": amount(se.socialSecurityWages),
          "9": amountOrZero(Math.max(0, wageBase - se.socialSecurityWages)),
          "10": amountOrZero(se.socialSecurityTax),
          "11": amount(se.medicareTax),
          "12": amount(se.selfEmploymentTax),
          "13": amount(se.deduction),
        }),
      };
    });
}
