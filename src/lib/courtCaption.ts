import type { PDFForm } from "pdf-lib";

import { COURT_ADDRESSES } from "@/lib/courtAddresses";

const CAPTION_COURT_FIELD = "Caption Court";

/**
 * Fills the PDF multiline `Caption Court` field from the selected Superior Court county
 * (`useFormStore.getState().petitionerExtras.county`, e.g. Fresno / Kings / Tulare).
 */
export function applyCourtCaptionFromCounty(form: PDFForm, county: string): void {
  const key = String(county ?? "").trim();
  if (!key) return;
  const block = COURT_ADDRESSES[key];
  if (!block) return;

  const lines = block.split(/\n/).map((l) => l.trim()).filter(Boolean);
  const streetLine = lines[0] ?? "";
  const cityStateZipLine = lines[1] ?? "";
  const countyLine = key.toUpperCase();
  const combined = [countyLine, streetLine, cityStateZipLine].filter(Boolean).join("\n");

  try {
    form.getTextField(CAPTION_COURT_FIELD).setText(combined);
  } catch {
    /* field absent or wrong type in this PDF revision */
  }
}
