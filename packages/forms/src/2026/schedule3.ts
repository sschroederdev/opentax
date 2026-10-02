import { namesOnReturn, primarySsn } from "../common.ts";
import { amount, compact, ssn } from "../format.ts";
import type { FilledForm, FormContext, FormDefinition } from "../types.ts";

const fields = {
  "11": { name: "topmostSubform[0].Page1[0].f1_28[0]", tooltip: "11. Excess social security and tier 1 R R T A ta" },
  "15": { name: "topmostSubform[0].Page1[0].f1_38[0]", tooltip: "15. Add lines 9 through 12 and 14. Enter here an" },
  "name": { name: "topmostSubform[0].Page1[0].f1_01[0]", tooltip: "me(s) shown on Form 1040, 1040-S R, or 1040-N R." },
  "ssn": { name: "topmostSubform[0].Page1[0].f1_02[0]", tooltip: "Your social security number." },
};

type Key = keyof typeof fields;

export const SCHEDULE_3: FormDefinition<Key> = {
  id: "f1040s3",
  title: "Schedule 3 (Form 1040)",
  year: 2026,
  file: "f1040s3.pdf",
  url: "https://www.irs.gov/pub/irs-dft/f1040s3--dft.pdf",
  revision: "Draft created 4/27/26",
  coverPages: 1,
  sequence: 3,
  fields,
};

export function fillSchedule3(ctx: FormContext): FilledForm<Key> | null {
  const excess = ctx.result.form1040.excessSocialSecurityWithheld;
  if (excess === 0) return null;
  return {
    form: SCHEDULE_3,
    values: compact<Key>({ name: namesOnReturn(ctx), ssn: primarySsn(ctx), "11": amount(excess), "15": amount(excess) }),
  };
}
