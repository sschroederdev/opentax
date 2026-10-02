import { buildPdf, type FilledForm, type LoadPdf } from "@opentax/forms";

// Vite copies the blank forms into the build and gives us their URLs.
const pdfUrls = import.meta.glob("../../../forms/pdfs/*/*.pdf", { query: "?url", import: "default", eager: true }) as Record<
  string,
  string
>;

const loadPdf: LoadPdf = async (form) => {
  const url = pdfUrls[`../../../forms/pdfs/${form.year}/${form.file}`];
  if (!url) throw new Error(`The blank ${form.title} isn't included in this build.`);
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Couldn't load the blank ${form.title} (HTTP ${response.status}).`);
  return new Uint8Array(await response.arrayBuffer());
};

/** The filled forms as one PDF file. */
export async function federalPdf(forms: FilledForm[]): Promise<Blob> {
  return new Blob([(await buildPdf(forms, loadPdf)) as BlobPart], { type: "application/pdf" });
}
