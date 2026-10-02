import { PDFArray, PDFDict, PDFDocument, PDFName, PDFRef } from "pdf-lib";

/**
 * Loads a form PDF. Some IRS drafts (Schedule 3-A) have widgets on the page
 * but an empty /AcroForm /Fields array and empty /Kids arrays, which hides
 * them from form tools; this rebuilds the field tree from the widgets.
 */
export async function loadFormPdf(bytes: Uint8Array): Promise<PDFDocument> {
  const doc = await PDFDocument.load(bytes);
  const acroForm = doc.catalog.getOrCreateAcroForm();
  const registered = new Set(acroForm.getAllFields().map(([, ref]) => ref.toString()));
  for (const page of doc.getPages()) {
    const annots = page.node.lookupMaybe(PDFName.of("Annots"), PDFArray);
    if (!annots) continue;
    for (let i = 0; i < annots.size(); i++) {
      const widget = annots.get(i);
      if (!(widget instanceof PDFRef)) continue;
      let ref: PDFRef = widget;
      let dict = doc.context.lookup(ref, PDFDict);
      if (dict.get(PDFName.of("Subtype")) !== PDFName.of("Widget")) continue;
      // Walk up to the root of the field tree, relinking any child its
      // parent's /Kids array is missing.
      for (let parent = dict.get(PDFName.of("Parent")); parent instanceof PDFRef; parent = dict.get(PDFName.of("Parent"))) {
        const parentDict = doc.context.lookup(parent, PDFDict);
        let kids = parentDict.lookupMaybe(PDFName.of("Kids"), PDFArray);
        if (!kids) {
          kids = doc.context.obj([]);
          parentDict.set(PDFName.of("Kids"), kids);
        }
        const child = ref;
        if (!kids.asArray().some((kid) => kid instanceof PDFRef && kid.toString() === child.toString())) kids.push(child);
        ref = parent;
        dict = parentDict;
      }
      if (!registered.has(ref.toString())) {
        acroForm.addField(ref);
        registered.add(ref.toString());
      }
    }
  }
  return doc;
}
