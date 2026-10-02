/**
 * Downloads every form PDF from the URL in its definition into pdfs/<year>/.
 * Run after updating the URLs (for example, from drafts to final forms),
 * then run the tests.
 */
import { writeFile } from "node:fs/promises";
import { FORMS_BY_YEAR } from "../src/index.ts";

for (const [year, forms] of Object.entries(FORMS_BY_YEAR)) {
  for (const form of forms) {
    const response = await fetch(form.url);
    if (!response.ok) throw new Error(`${form.url}: HTTP ${response.status}`);
    const bytes = new Uint8Array(await response.arrayBuffer());
    await writeFile(new URL(`../pdfs/${year}/${form.file}`, import.meta.url), bytes);
    console.log(`${form.title}: ${bytes.length.toLocaleString()} bytes`);
  }
}
