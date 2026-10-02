import { buildPdf, federalPacket, type LoadPdf } from "@opentax/forms";
import type { TaxReturnInput, TaxReturnResult } from "@opentax/engine";
import type { FilerDetails } from "@opentax/forms";

// Vite copies the blank forms into the build and gives us their URLs.
const pdfUrls = import.meta.glob("../../../forms/pdfs/*/*.pdf", { query: "?url", import: "default", eager: true }) as Record<
  string,
  string
>;

const loadPdf: LoadPdf = async (form) => {
  const entry = Object.entries(pdfUrls).find(([path]) => path.endsWith(`/pdfs/${form.year}/${form.file}`));
  if (!entry) throw new Error(`The blank ${form.title} isn't included in this build.`);
  const response = await fetch(entry[1]);
  if (!response.ok) throw new Error(`Couldn't load the blank ${form.title} (HTTP ${response.status}).`);
  return new Uint8Array(await response.arrayBuffer());
};

export async function federalPdf(input: TaxReturnInput, result: TaxReturnResult, details: FilerDetails) {
  const packet = federalPacket(input, result, details);
  const bytes = await buildPdf(packet.forms, loadPdf);
  return { packet, blob: new Blob([bytes as BlobPart], { type: "application/pdf" }) };
}
