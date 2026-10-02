/**
 * Every field OpenTax fills exists in the PDF, with the tooltip we expect.
 * When the IRS renumbers a line or reorders fields (as it may between a
 * draft and the final form), these fail instead of filling the wrong box.
 */
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { describe, it } from "node:test";
import { FORMS_BY_YEAR } from "../src/index.ts";
import { listPdfFields } from "../src/pdfFields.ts";

for (const [year, forms] of Object.entries(FORMS_BY_YEAR)) {
  describe(`${year} field maps`, () => {
    for (const form of forms) {
      it(`${form.title} fields match the PDF`, async () => {
        const pdf = await readFile(new URL(`../pdfs/${year}/${form.file}`, import.meta.url));
        const byName = new Map((await listPdfFields(pdf)).map((f) => [f.name, f]));
        const seen = new Set<string>();
        for (const [key, spec] of Object.entries(form.fields)) {
          const field = byName.get(spec.name);
          assert.ok(field, `${form.title} "${key}": no field ${spec.name}`);
          assert.ok(field.tooltip.includes(spec.tooltip), `${form.title} "${key}": tooltip "${field.tooltip}" lacks "${spec.tooltip}"`);
          assert.ok(!seen.has(spec.name), `${form.title} "${key}": ${spec.name} is mapped twice`);
          seen.add(spec.name);
        }
      });
    }
  });
}
