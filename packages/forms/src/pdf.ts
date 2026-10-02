import { PDFCheckBox, PDFDocument, PDFTextField } from "pdf-lib";
import { loadFormPdf } from "./loadPdf.ts";
import type { FilledForm, FormDefinition } from "./types.ts";

/** Loads the blank PDF for a form: from disk in Node, or over HTTP in the browser. */
export type LoadPdf = (form: FormDefinition) => Promise<Uint8Array>;

/**
 * Text for a field with a maximum length. Comb fields for SSNs and account
 * numbers take digits only, so dashes and spaces are dropped when needed.
 */
function fitText(text: string, maxLength: number | undefined, fieldName: string): string {
  if (maxLength === undefined || text.length <= maxLength) return text;
  const compacted = text.replace(/[\s-]/g, "");
  if (compacted.length <= maxLength) return compacted;
  throw new Error(`"${text}" is too long for ${fieldName} (at most ${maxLength} characters).`);
}

/** Fills one form. Fields stay editable; the cover pages are still there (see `formPages`). */
export async function fillPdf(blank: Uint8Array, filled: FilledForm): Promise<PDFDocument> {
  const doc = await loadFormPdf(blank);
  const form = doc.getForm();
  // IRS forms carry an XFA copy of the form; viewers that prefer it would
  // ignore the AcroForm values written here.
  form.deleteXFA();
  for (const [key, value] of Object.entries(filled.values)) {
    const spec = filled.form.fields[key as keyof typeof filled.form.fields];
    if (!spec) throw new Error(`${filled.form.title} has no field "${key}".`);
    const field = form.getField(spec.name);
    if (field instanceof PDFCheckBox) {
      if (value === true) field.check();
    } else if (field instanceof PDFTextField) {
      field.setText(fitText(String(value), field.getMaxLength(), `${filled.form.title} ${key}`));
    } else {
      throw new Error(`${filled.form.title} field "${key}" is not a text field or checkbox.`);
    }
  }
  return doc;
}

/** Indices of the form's own pages, after any cover pages. */
export const formPages = (doc: PDFDocument, form: FormDefinition) => doc.getPageIndices().slice(form.coverPages);

/**
 * Fills each form and combines them into one PDF, in the order given.
 * Flattening (the default) turns the fields into plain text, which prints
 * reliably and lets forms with the same field names share one file.
 */
export async function buildPdf(forms: FilledForm[], load: LoadPdf, options: { flatten?: boolean } = {}) {
  const packet = await PDFDocument.create();
  // Copies of one form (Schedule C per business, Form 8949 pages) share a blank.
  const blanks = new Map<FormDefinition, Promise<Uint8Array>>();
  for (const filled of forms) {
    if (!blanks.has(filled.form)) blanks.set(filled.form, load(filled.form));
    const doc = await fillPdf(await blanks.get(filled.form)!, filled);
    if (options.flatten ?? true) doc.getForm().flatten();
    const pages = await packet.copyPages(doc, formPages(doc, filled.form));
    for (const page of pages) packet.addPage(page);
  }
  return packet.save();
}
