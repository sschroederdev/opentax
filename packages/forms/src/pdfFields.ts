import { PDFCheckBox, PDFHexString, PDFName, PDFString, PDFTextField } from "pdf-lib";
import { loadFormPdf } from "./loadPdf.ts";

export interface PdfFieldInfo {
  name: string;
  tooltip: string;
  kind: "text" | "checkbox" | "other";
  maxLength?: number;
}

/** Lists a PDF's form fields with their tooltips (the /TU entry). */
export async function listPdfFields(bytes: Uint8Array): Promise<PdfFieldInfo[]> {
  const doc = await loadFormPdf(bytes);
  return doc.getForm().getFields().map((field) => {
    const tu = field.acroField.dict.get(PDFName.of("TU"));
    const tooltip = tu instanceof PDFString || tu instanceof PDFHexString ? tu.decodeText() : "";
    const kind = field instanceof PDFTextField ? "text" : field instanceof PDFCheckBox ? "checkbox" : "other";
    const maxLength = field instanceof PDFTextField ? field.getMaxLength() : undefined;
    return { name: field.getName(), tooltip: tooltip.replace(/\s+/g, " ").trim(), kind, ...(maxLength ? { maxLength } : {}) };
  });
}
