import { readFile } from "node:fs/promises";
import type { LoadPdf } from "./pdf.ts";

/** Reads blank forms from this package's pdfs/ directory. */
export const loadPdfFromDisk: LoadPdf = async (form) =>
  readFile(new URL(`../pdfs/${form.year}/${form.file}`, import.meta.url));
