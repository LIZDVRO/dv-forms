import { PDFDocument, type PDFForm } from "pdf-lib";

import { applyCourtCaptionFromCounty } from "@/lib/courtCaption";
import { getDv110RelationshipLabelFromFormStore } from "@/lib/dv100-pdf";
import { useFormStore, type PersonInfo, type ProtectedPerson } from "@/store/useFormStore";

export const DV110_PDF_URL = "/dv110.pdf";

const RELATIONSHIP_TO_PERSON_IN_1 =
  "Relationship to person in  1" as const;

function safeSetText(form: PDFForm, name: string, text: string): void {
  const field = form.getTextField(name);
  field.setText(text);
}

function trySetText(form: PDFForm, name: string, text: string, warn: string): void {
  try {
    safeSetText(form, name, String(text ?? "").trim());
  } catch (err) {
    console.warn(warn, err);
  }
}

function trySetTextSilent(form: PDFForm, name: string, text: string): void {
  try {
    safeSetText(form, name, String(text ?? "").trim());
  } catch {
    /* field may be absent in this template revision */
  }
}

function dv110GenderRadioOption(gender: string): "M" | "F" | "Nonbinary" | null {
  const v = String(gender ?? "").trim();
  if (v === "Male") return "M";
  if (v === "Female") return "F";
  if (v === "Nonbinary") return "Nonbinary";
  return null;
}

function personFullName(p: PersonInfo): string {
  return [p.firstName, p.middleName, p.lastName]
    .map((s) => String(s ?? "").trim())
    .filter(Boolean)
    .join(" ");
}

function protectedRowToDv110Fields(
  p: ProtectedPerson,
): { name: string; relationship: string; age: string } {
  return {
    name: p.fullName ?? "",
    relationship: p.relationship ?? "",
    age: p.age ?? "",
  };
}

function rowHasData(row: { name: string; relationship: string; age: string } | undefined): boolean {
  if (!row) return false;
  return (
    String(row.name ?? "").trim() !== "" ||
    String(row.relationship ?? "").trim() !== "" ||
    String(row.age ?? "").trim() !== ""
  );
}

function formatFirearmLine(row: { description: string; numberOrAmount: string; location: string }): string {
  const a = [row.description, row.numberOrAmount].map((s) => String(s ?? "").trim()).filter(Boolean);
  const line = a.join(" ");
  const loc = String(row.location ?? "").trim();
  if (line && loc) return `${line} (location: ${loc})`;
  if (line) return line;
  if (loc) return loc;
  return "";
}

/**
 * Loads `/dv110.pdf` and reads all mapped fields from `useFormStore.getState()`.
 * Items 4–24 and many caption lines are court-filled; we fill 1–3, respondent block,
 * protected people, and firearms.
 */
export async function generateDV110PDF(): Promise<Uint8Array> {
  const state = useFormStore.getState();
  const petitioner = state.petitioner;
  const respondent = state.respondent.person;
  const otherP = state.otherProtectedPeople;
  const firearms = state.firearms;
  const relLabel = getDv110RelationshipLabelFromFormStore().trim();

  const protectedRows = (otherP.people ?? []).map(protectedRowToDv110Fields);

  const res = await fetch(DV110_PDF_URL);
  if (!res.ok) {
    throw new Error(`Failed to fetch ${DV110_PDF_URL}: ${res.status} ${res.statusText}`);
  }
  const doc = await PDFDocument.load(await res.arrayBuffer(), { ignoreEncryption: true });
  const form = doc.getForm();
  try {
    applyCourtCaptionFromCounty(form, petitioner.county ?? "");
  } catch (err) {
    console.warn("DV-110: court caption", err);
  }

  const firearmRows = (firearms.firearms ?? [])
    .map((r) => ({
      description: r.description,
      numberOrAmount: r.numberOrAmount,
      location: r.location,
    }))
    .filter(
      (r) =>
        String(r.description ?? "").trim() !== "" ||
        String(r.location ?? "").trim() !== "" ||
        String(r.numberOrAmount ?? "").trim() !== "",
    );

  const firearmsSummary = firearmRows.map(formatFirearmLine).filter(Boolean).join("; ");

  trySetText(form, "Protected Person name", personFullName(petitioner), 'DV-110: "Protected Person name"');

  trySetText(form, "Full Name", personFullName(respondent), 'DV-110: "Full Name"');

  try {
    const opt = dv110GenderRadioOption(String(respondent.gender ?? ""));
    if (opt) {
      form.getRadioGroup("Gender").select(opt);
    }
  } catch (err) {
    console.warn("DV-110: failed to set Gender radio", err);
  }

  trySetText(form, "Race", String(respondent.race ?? ""), 'DV-110: "Race"');

  trySetText(form, "Age", String(respondent.age ?? ""), 'DV-110: "Age"');

  trySetText(
    form,
    "estimate if age unknown Date of Birth",
    String(respondent.dateOfBirth ?? ""),
    'DV-110: "estimate if age unknown Date of Birth"',
  );

  trySetText(form, "Height", String(respondent.height ?? ""), 'DV-110: "Height"');

  trySetText(form, "Weight", String(respondent.weight ?? ""), 'DV-110: "Weight"');

  trySetText(form, "Hair Color", String(respondent.hairColor ?? ""), 'DV-110: "Hair Color"');

  trySetText(form, "Eye Color", String(respondent.eyeColor ?? ""), 'DV-110: "Eye Color"');

  trySetText(form, RELATIONSHIP_TO_PERSON_IN_1, relLabel, "DV-110: relationship to person 1 (double space)");

  trySetText(
    form,
    "Address of restrained person",
    String(respondent.address.street ?? ""),
    'DV-110: "Address of restrained person"',
  );

  trySetText(form, "City", String(respondent.address.city ?? ""), 'DV-110: "City"');

  trySetText(form, "State", String(respondent.address.state ?? ""), 'DV-110: "State"');

  trySetText(form, "Zip", String(respondent.address.zip ?? ""), 'DV-110: "Zip"');

  trySetText(form, "Firearms", firearmsSummary, 'DV-110: "Firearms"');

  const people = protectedRows;
  for (let i = 0; i < 4; i++) {
    const person = people[i];
    if (!rowHasData(person)) continue;
    const n = i + 1;
    trySetText(
      form,
      `Full name ${n}`,
      String(person?.name ?? "").trim(),
      `DV-110: Full name ${n}`,
    );
    trySetText(
      form,
      `Relationship to person in 1 ${n}`,
      String(person?.relationship ?? "").trim(),
      `DV-110: relationship row ${n}`,
    );
    trySetText(form, `Age ${n}`, String(person?.age ?? "").trim(), `DV-110: Age ${n}`);
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

  for (let i = 0; i < 4; i++) {
    const r = firearmRows[i];
    const n = i + 1;
    if (!r) {
      trySetTextSilent(form, `firearms_${n}`, "");
      trySetTextSilent(form, `Location if known ${n}`, "");
      continue;
    }
    const desc = [r.description, r.numberOrAmount]
      .map((s) => String(s ?? "").trim())
      .filter(Boolean)
      .join(" ");
    trySetText(form, `firearms_${n}`, desc, `DV-110: firearms_${n}`);
    trySetText(
      form,
      `Location if known ${n}`,
      String(r.location ?? "").trim(),
      `DV-110: Location if known ${n}`,
    );
  }

  form.updateFieldAppearances();
  return doc.save();
}
