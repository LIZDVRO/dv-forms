import type { PDFForm, PDFTextField } from "pdf-lib";

import { COURT_ADDRESSES } from "@/lib/courtAddresses";

const CAPTION_COURT_FIELD = "Caption Court";

const SPLIT_CAPTION_FIELDS = [
  ["COUNTY OF", "county"] as const,
  ["STREET ADDRESS", "street"] as const,
  ["MAILING ADDRESS", "mailing"] as const,
  ["CITY AND ZIP CODE", "cityZip"] as const,
  ["BRANCH NAME", "branch"] as const,
] as const;

type SplitKey = (typeof SPLIT_CAPTION_FIELDS)[number][1];

function setCaptionTextField(form: PDFForm, name: string, value: string): void {
  try {
    const field: PDFTextField = form.getTextField(name);
    try {
      field.setFontSize(10);
    } catch {
      /* field may lack /DA or Tf — still set value */
    }
    field.setText(value);
  } catch {
    /* field absent or wrong type in this PDF revision */
  }
}

function hasTextField(form: PDFForm, name: string): boolean {
  try {
    form.getTextField(name);
    return true;
  } catch {
    return false;
  }
}

/**
 * Fills the PDF court caption from the selected Superior Court county
 * (`useFormStore.getState().petitionerExtras.county`, e.g. Fresno / Kings / Tulare).
 *
 * Prefer split line fields (`COUNTY OF`, `STREET ADDRESS`, …) when `COUNTY OF`
 * exists; otherwise fills the multiline `Caption Court` field. Font size 10 is
 * applied before text so appearances are not Acrobat’s oversized default.
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

  const splitValues: Record<SplitKey, string> = {
    county: countyLine,
    street: streetLine,
    mailing: "",
    cityZip: cityStateZipLine,
    branch: "",
  };

  if (hasTextField(form, "COUNTY OF")) {
    for (const [fieldName, splitKey] of SPLIT_CAPTION_FIELDS) {
      setCaptionTextField(form, fieldName, splitValues[splitKey]);
    }
    return;
  }

  setCaptionTextField(form, CAPTION_COURT_FIELD, combined);
}
