import { PDFDocument, PDFForm } from "pdf-lib";

export const DV109_PDF_URL = "/dv109.pdf";

export type Dv109PdfData = {
  protectedPersonName: string;
  restrainedPersonName: string;
};

function safeSetText(form: PDFForm, name: string, text: string): void {
  const field = form.getTextField(name);
  field.setText(text);
}

/**
 * Loads `/dv109.pdf`, fills items 1–2 (petitioner / respondent names). Court fills the rest.
 */
export async function generateDV109PDF(data: Dv109PdfData): Promise<Uint8Array> {
  const res = await fetch(DV109_PDF_URL);
  if (!res.ok) {
    throw new Error(`Failed to fetch ${DV109_PDF_URL}: ${res.status} ${res.statusText}`);
  }
  const doc = await PDFDocument.load(await res.arrayBuffer(), { ignoreEncryption: true });
  const form = doc.getForm();

  try {
    safeSetText(form, "Name", String(data.protectedPersonName ?? "").trim());
  } catch (err) {
    console.warn("DV-109: failed to set Name", err);
  }

  try {
    safeSetText(form, "Name_2", String(data.restrainedPersonName ?? "").trim());
  } catch (err) {
    console.warn("DV-109: failed to set Name_2", err);
  }

  form.updateFieldAppearances();
  return doc.save();
}
