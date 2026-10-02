/**
 * Prints a field table for one form, for pasting into src/2026/<form>.ts.
 *
 *   node scripts/fieldTable.ts pdfs/2026/f1040.pdf '{"1a": "f1_47[0]", ...}'
 *
 * Keys are OpenTax's names for form lines; values are the field's short name,
 * qualified with a parent ("Page2[0].f2_01[0]") when it isn't unique. Each
 * entry records a snippet of the field's tooltip (a table cell's row and
 * column, else from the line label on, else its end), which test/fields.test.ts checks against the PDF.
 *
 * With no spec, lists every field and its tooltip.
 */
import { readFileSync } from "node:fs";
import { listPdfFields } from "../src/pdfFields.ts";

const [pdfPath, specJson] = process.argv.slice(2);
if (!pdfPath) throw new Error("usage: fieldTable.ts <pdf> [spec-json]");
const fields = await listPdfFields(readFileSync(pdfPath));

if (!specJson) {
  for (const f of fields) console.log(`${f.name}\t${f.kind}\t${f.tooltip.slice(0, 140)}`);
} else {
  const spec = JSON.parse(specJson) as Record<string, string>;
  for (const [key, short] of Object.entries(spec)) {
    const matches = fields.filter((f) => f.name === short || f.name.endsWith(`.${short}`));
    if (matches.length !== 1) throw new Error(`${key}: ${short} matched ${matches.length} fields`);
    const field = matches[0]!;
    console.log(`  ${JSON.stringify(key)}: { name: ${JSON.stringify(field.name)}, tooltip: ${JSON.stringify(snippet(field.tooltip, key))} },`);
  }
}

function snippet(tooltip: string, key: string): string {
  // Table cells: "Row: 4a. Column: (i i) Employer's identification number".
  const row = tooltip.indexOf("Row: ");
  if (row >= 0) return tooltip.slice(row, row + 48).trimEnd();
  const label = key.split("_")[0]!.replace(/^L/, "");
  const re = new RegExp(`(?:^|[\\s.(])${label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\.? `);
  const m = re.exec(tooltip);
  // Without a line label, the end of the tooltip is the distinctive part
  // ("... Column: Dependent 1. Child tax credit.").
  return m ? tooltip.slice(m.index).trim().slice(0, 48).trimEnd() : tooltip.slice(-48).trimStart();
}
