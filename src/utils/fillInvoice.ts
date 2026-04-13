import { PDFDocument } from "pdf-lib";

/** Public path to the fillable LIZ invoice template (`public/`). */
export const LIZ_INVOICE_TEMPLATE_URL = "/LIZ Break Free Invoice FORM.pdf";

export function formatInvoiceDateMmDdYyyy(date = new Date()): string {
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  const yyyy = String(date.getFullYear());
  return `${mm}/${dd}/${yyyy}`;
}

/**
 * Loads the branded LIZ invoice PDF, fills petitioner name and today’s date,
 * flattens the AcroForm, and returns a standalone document (one page) ready to append.
 */
export async function fillLizInvoiceFromTemplate(input: {
  petitionerName: string;
}): Promise<PDFDocument> {
  const path = encodeURI(LIZ_INVOICE_TEMPLATE_URL);
  const res = await fetch(path);
  if (!res.ok) {
    throw new Error(`Failed to fetch invoice template: ${res.status} ${res.statusText}`);
  }
  const bytes = new Uint8Array(await res.arrayBuffer());
  const doc = await PDFDocument.load(bytes, { ignoreEncryption: true });
  const form = doc.getForm();

  const name = (input.petitionerName ?? "").trim();
  form.getTextField("petitioner name").setText(name);
  form.getTextField("Date25_af_date").setText(formatInvoiceDateMmDdYyyy());

  try {
    form.updateFieldAppearances();
  } catch {
    // Some templates omit appearance streams; flatten still embeds values.
  }
  form.flatten();
  return doc;
}
