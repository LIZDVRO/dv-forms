import { PDFDocument, PDFForm } from "pdf-lib";

import { getDv110RelationshipLabelFromFormStore } from "@/lib/dv100-pdf";

export const DV110_PDF_URL = "/dv110.pdf";

export type Dv110PdfData = {
  protectedPersonName: string;
  fullName: string;
  gender: string;
  race: string;
  age: string;
  dateOfBirth: string;
  height: string;
  weight: string;
  hairColor: string;
  eyeColor: string;
  relationship: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  protectedPeople: Array<{ name: string; relationship: string; age: string }>;
};

function safeSetText(form: PDFForm, name: string, text: string): void {
  const field = form.getTextField(name);
  field.setText(text);
}

function dv110GenderRadioOption(gender: string): "M" | "F" | "Nonbinary" | null {
  const v = String(gender ?? "").trim();
  if (v === "Male") return "M";
  if (v === "Female") return "F";
  if (v === "Nonbinary") return "Nonbinary";
  return null;
}

function rowHasData(row: { name: string; relationship: string; age: string } | undefined): boolean {
  if (!row) return false;
  return (
    String(row.name ?? "").trim() !== "" ||
    String(row.relationship ?? "").trim() !== "" ||
    String(row.age ?? "").trim() !== ""
  );
}

/**
 * Loads `/dv110.pdf`, fills items 1–3 on page 1 only. Items 4–24 are court-filled.
 */
export async function generateDV110PDF(data: Dv110PdfData): Promise<Uint8Array> {
  const res = await fetch(DV110_PDF_URL);
  if (!res.ok) {
    throw new Error(`Failed to fetch ${DV110_PDF_URL}: ${res.status} ${res.statusText}`);
  }
  const doc = await PDFDocument.load(await res.arrayBuffer(), { ignoreEncryption: true });
  const form = doc.getForm();

  try {
    safeSetText(form, "Protected Person name", String(data.protectedPersonName ?? "").trim());
  } catch (err) {
    console.warn('DV-110: failed to set "Protected Person name"', err);
  }

  try {
    safeSetText(form, "Full Name", String(data.fullName ?? "").trim());
  } catch (err) {
    console.warn('DV-110: failed to set "Full Name"', err);
  }

  try {
    const opt = dv110GenderRadioOption(String(data.gender ?? ""));
    if (opt) {
      form.getRadioGroup("Gender").select(opt);
    }
  } catch (err) {
    console.warn("DV-110: failed to set Gender radio", err);
  }

  try {
    safeSetText(form, "Race", String(data.race ?? "").trim());
  } catch (err) {
    console.warn('DV-110: failed to set "Race"', err);
  }

  try {
    safeSetText(form, "Age", String(data.age ?? "").trim());
  } catch (err) {
    console.warn('DV-110: failed to set "Age"', err);
  }

  try {
    safeSetText(
      form,
      "estimate if age unknown Date of Birth",
      String(data.dateOfBirth ?? "").trim(),
    );
  } catch (err) {
    console.warn('DV-110: failed to set "estimate if age unknown Date of Birth"', err);
  }

  try {
    safeSetText(form, "Height", String(data.height ?? "").trim());
  } catch (err) {
    console.warn('DV-110: failed to set "Height"', err);
  }

  try {
    safeSetText(form, "Weight", String(data.weight ?? "").trim());
  } catch (err) {
    console.warn('DV-110: failed to set "Weight"', err);
  }

  try {
    safeSetText(form, "Hair Color", String(data.hairColor ?? "").trim());
  } catch (err) {
    console.warn('DV-110: failed to set "Hair Color"', err);
  }

  try {
    safeSetText(form, "Eye Color", String(data.eyeColor ?? "").trim());
  } catch (err) {
    console.warn('DV-110: failed to set "Eye Color"', err);
  }

  try {
    const rel =
      getDv110RelationshipLabelFromFormStore() || String(data.relationship ?? "");
    safeSetText(form, "Relationship to person in 1", rel.trim());
  } catch (err) {
    console.warn('DV-110: failed to set "Relationship to person in 1"', err);
  }

  try {
    safeSetText(form, "Address of restrained person", String(data.address ?? "").trim());
  } catch (err) {
    console.warn('DV-110: failed to set "Address of restrained person"', err);
  }

  try {
    safeSetText(form, "City", String(data.city ?? "").trim());
  } catch (err) {
    console.warn('DV-110: failed to set "City"', err);
  }

  try {
    safeSetText(form, "State", String(data.state ?? "").trim());
  } catch (err) {
    console.warn('DV-110: failed to set "State"', err);
  }

  try {
    safeSetText(form, "Zip", String(data.zip ?? "").trim());
  } catch (err) {
    console.warn('DV-110: failed to set "Zip"', err);
  }

  const people = Array.isArray(data.protectedPeople) ? data.protectedPeople : [];
  for (let i = 0; i < 4; i++) {
    const person = people[i];
    if (!rowHasData(person)) continue;
    const n = i + 1;
    try {
      safeSetText(form, `Full name ${n}`, String(person!.name ?? "").trim());
    } catch (err) {
      console.warn(`DV-110: failed to set Full name ${n}`, err);
    }
    try {
      safeSetText(
        form,
        `Relationship to person in 1 ${n}`,
        String(person!.relationship ?? "").trim(),
      );
    } catch (err) {
      console.warn(`DV-110: failed to set Relationship to person in 1 ${n}`, err);
    }
    try {
      safeSetText(form, `Age ${n}`, String(person!.age ?? "").trim());
    } catch (err) {
      console.warn(`DV-110: failed to set Age ${n}`, err);
    }
  }

  try {
    const cb = form.getCheckBox("Check more people");
    if (people.length > 4) {
      cb.check();
    } else {
      cb.uncheck();
    }
  } catch (err) {
    console.warn('DV-110: "Check more people" checkbox', err);
  }

  form.updateFieldAppearances();
  return doc.save();
}
