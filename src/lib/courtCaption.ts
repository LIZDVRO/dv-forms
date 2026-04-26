import type { PDFForm } from "pdf-lib";

import { COURT_ADDRESSES } from "@/lib/courtAddresses";

/**
 * Map selected county + court address block onto common CA judicial council caption fields.
 * Field names vary by PDF revision; each name is tried with try/catch (no throw).
 */
export function applyCourtCaptionFromCounty(form: PDFForm, county: string): void {
  const key = String(county ?? "").trim();
  if (!key) return;
  const block = COURT_ADDRESSES[key];
  if (!block) return;

  const lines = block.split(/\n/).map((l) => l.trim()).filter(Boolean);
  const streetLine = lines[0] ?? "";
  const cityZipLine = lines[1] ?? "";
  const mailingBlock = block.trim();

  const trySetText = (fieldName: string, text: string) => {
    try {
      form.getTextField(fieldName).setText(text);
    } catch {
      /* field absent or wrong type in this PDF revision */
    }
  };

  trySetText("COUNTY OF", key);
  trySetText("Superior Court of California County of", key);

  trySetText("STREET ADDRESS", streetLine);
  trySetText("MAILING ADDRESS", mailingBlock);
  trySetText("CITY AND ZIP CODE", cityZipLine);
  trySetText("BRANCH NAME", "Family Law");
}
