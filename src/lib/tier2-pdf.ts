import { PDFDocument, type PDFForm } from "pdf-lib";

import { useFormStore, type PersonInfo } from "@/store/useFormStore";

function personDisplayName(p: PersonInfo): string {
  return [p.firstName, p.middleName, p.lastName]
    .map((s) => s.trim())
    .filter(Boolean)
    .join(" ");
}

export const TIER2_PDF_URL = "/tier2.pdf";

/** DV-105 page-1 child grid in `public/tier2.pdf` (see `pdf-rename/tier2.mapping.json`). */
const CHILD_GRID_ROWS: { nameField: string; dobField: string }[] = [
  { nameField: "child_a_name", dobField: "child_a_date_of_birth" },
  { nameField: "child_b_name", dobField: "child_b_date_of_birth" },
  { nameField: "child_c_name", dobField: "child_c_date_of_birth" },
  { nameField: "child_d_name", dobField: "child_d_date_of_birth" },
];

function safeSetText(form: PDFForm, fieldName: string, value: string): void {
  try {
    form.getTextField(fieldName).setText(value);
  } catch {
    /* missing or non-text field */
  }
}

/**
 * Fills Tier 2 custody packet (`public/tier2.pdf` — DV-105, DV-108, DV-140, DV-145).
 * Starts with DV-105 page 1; more mappings can be added incrementally.
 */
export async function generateTier2PDF(): Promise<Uint8Array | null> {
  const { petitioner, respondent, children, custodyOrders, childSafety } =
    useFormStore.getState();

  // Reserved for upcoming field maps (DV-108 / DV-140 / DV-145 / remainder of DV-105).
  void custodyOrders;
  void childSafety;

  let res: Response;
  try {
    res = await fetch(TIER2_PDF_URL);
  } catch {
    return null;
  }
  if (!res.ok) return null;

  const doc = await PDFDocument.load(await res.arrayBuffer(), {
    ignoreEncryption: true,
  });
  const form = doc.getForm();

  const yourName = personDisplayName(petitioner);
  const restrainedName = personDisplayName(respondent.person);

  safeSetText(form, "q1_your_name", yourName);
  safeSetText(form, "q2_person_you_want_protection_from", restrainedName);
  safeSetText(form, "q1_person_you_want_protection", restrainedName);

  const childList = children.children.slice(0, 4);
  for (let i = 0; i < CHILD_GRID_ROWS.length; i++) {
    const row = CHILD_GRID_ROWS[i]!;
    const child = childList[i];
    const name = child?.fullName?.trim() ?? "";
    const dob = child?.dateOfBirth?.trim() ?? "";
    safeSetText(form, row.nameField, name);
    safeSetText(form, row.dobField, dob);
  }

  form.updateFieldAppearances();
  return doc.save();
}
