import { namesOnReturn, primarySsn } from "../common.ts";
import { amount, compact, ssn } from "../format.ts";
import type { FilledForm, FormContext, FormDefinition } from "../types.ts";

const fields = {
  "3": { name: "topmostSubform[0].Page1[0].f1_07[0]", tooltip: "3. Business income or (loss). Attach Schedule C." },
  "10": { name: "topmostSubform[0].Page1[0].f1_38[0]", tooltip: "10. Combine lines 1 through 7 and 9. This is you" },
  "15": { name: "topmostSubform[0].Page2[0].f2_05[0]", tooltip: "15. Deductible part of self-employment tax. Atta" },
  "26": { name: "topmostSubform[0].Page2[0].f2_30[0]", tooltip: "26. Add lines 11 through 23 and 25. These are yo" },
  "name": { name: "topmostSubform[0].Page1[0].f1_01[0]", tooltip: "me(s) shown on Form 1040, 1040-S R, or 1040-N R." },
  "ssn": { name: "topmostSubform[0].Page1[0].f1_02[0]", tooltip: "Your social security number." },
};

type Key = keyof typeof fields;

export const SCHEDULE_1: FormDefinition<Key> = {
  id: "f1040s1",
  title: "Schedule 1 (Form 1040)",
  year: 2026,
  file: "f1040s1.pdf",
  url: "https://www.irs.gov/pub/irs-dft/f1040s1--dft.pdf",
  revision: "Draft created 4/24/26",
  coverPages: 1,
  sequence: 1,
  fields,
};

export function fillSchedule1(ctx: FormContext): FilledForm<Key> | null {
  const f = ctx.result.form1040;
  if (f.additionalIncome === 0 && f.adjustmentsToIncome === 0) return null;
  const businessIncome = ctx.result.scheduleC.reduce((sum, c) => sum + c.netProfit, 0);
  return {
    form: SCHEDULE_1,
    values: compact<Key>({
      name: namesOnReturn(ctx),
      ssn: primarySsn(ctx),
      "3": amount(businessIncome),
      "10": amount(f.additionalIncome),
      "15": amount(f.adjustmentsToIncome),
      "26": amount(f.adjustmentsToIncome),
    }),
  };
}
