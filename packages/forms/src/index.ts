import { SUPPORTED_YEARS, type TaxReturnInput, type TaxReturnResult } from "@opentax/engine";
import { fill2026, FORMS_2026 } from "./2026/index.ts";
import type { FilerDetails } from "./details.ts";
import type { FilledForm, FormDefinition, PacketNote } from "./types.ts";

export { buildPdf, fillPdf, formPages, type LoadPdf } from "./pdf.ts";
export { emptyDetails, emptyIdentity, type FilerDetails, type FilerIdentity } from "./details.ts";
export type { FieldSpec, FieldValue, FilledForm, FormDefinition, PacketNote } from "./types.ts";

/** Tax years with PDF forms, and the forms for each. */
export const FORMS_BY_YEAR: Record<number, FormDefinition[]> = { 2026: FORMS_2026 };

export interface FederalPacket {
  forms: FilledForm[];
  /** Things to do by hand before mailing. */
  notes: PacketNote[];
}

/**
 * The filled federal forms for a computed return, ready for `buildPdf`.
 * Throws for a tax year without PDF forms.
 */
export function federalPacket(input: TaxReturnInput, result: TaxReturnResult, details: FilerDetails): FederalPacket {
  const params = SUPPORTED_YEARS[result.taxYear];
  if (result.taxYear !== 2026 || !params) {
    throw new Error(`PDF forms are available for ${Object.keys(FORMS_BY_YEAR).join(", ")} only, not ${result.taxYear}.`);
  }
  const notes: PacketNote[] = [];
  if (!result.complete) {
    notes.push({ form: "Return", message: "This return is incomplete (see the diagnostics). Don't file it." });
  }
  const forms = fill2026({ input, result, details, params }, notes);
  if (forms.some((f) => f.form.revision.startsWith("Draft"))) {
    notes.push({
      form: "Return",
      message: "These are the IRS draft 2026 forms, marked DRAFT — DO NOT FILE. Print again once the final forms are released.",
    });
  }
  notes.push({ form: "Form 1040", message: "Sign and date page 2, and attach Forms W-2 (and any 1099 with withholding) to page 1." });
  return { forms, notes };
}
