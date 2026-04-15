import { PDFDocument, PDFForm } from "pdf-lib";

import type { PersonInfo, RespondentCLETSInfo } from "@/store/useFormStore";
import type { Dv100FirearmRow, Dv100ProtectedPerson } from "@/lib/dv100-pdf";

export const CLETS001_PDF_URL = "/clets001.pdf";

/** Payload built on the review step from Zustand + DV-100 wizard state. */
export type Clets001PdfData = {
  petitioner: PersonInfo;
  respondent: PersonInfo;
  respondentCLETS: RespondentCLETSInfo;
  protectOtherPeople: "" | "no" | "yes";
  protectedPeople: Dv100ProtectedPerson[];
  hasFirearms: "" | "idk" | "no" | "yes";
  firearms: Dv100FirearmRow[];
};

function personFullName(p: PersonInfo): string {
  return [p.firstName, p.middleName, p.lastName]
    .map((s) => String(s ?? "").trim())
    .filter(Boolean)
    .join(" ");
}

function cletsPetitionerGender(value: string): "M" | "F" | "X nonbinary" | null {
  const v = value.trim();
  if (v === "Male") return "M";
  if (v === "Female") return "F";
  if (v === "Nonbinary") return "X nonbinary";
  return null;
}

function cletsProtectedGenderText(value: string): string {
  const v = value.trim();
  if (v === "Male") return "M";
  if (v === "Female") return "F";
  if (v === "Nonbinary") return "X";
  return v;
}

function safeSetText(form: PDFForm, name: string, text: string): void {
  const field = form.getTextField(name);
  field.setText(text);
}

function uncheck(form: PDFForm, name: string): void {
  try {
    form.getCheckBox(name).uncheck();
  } catch {
    /* ignore */
  }
}

function checkExclusiveEnglishRespondent(
  form: PDFForm,
  speaks: PersonInfo["speaksEnglish"],
): void {
  uncheck(form, "English Yes");
  uncheck(form, "English No");
  uncheck(form, "English I dont know");
  if (speaks === "yes") {
    form.getCheckBox("English Yes").check();
  } else if (speaks === "no") {
    form.getCheckBox("English No").check();
  } else if (speaks === "unknown") {
    form.getCheckBox("English I dont know").check();
  }
}

function checkExclusiveFirearms(
  form: PDFForm,
  hasFirearms: Clets001PdfData["hasFirearms"],
): void {
  uncheck(form, "Firearms No");
  uncheck(form, "Firearms I dont know");
  uncheck(form, "Firearms Yes");
  if (hasFirearms === "no") {
    form.getCheckBox("Firearms No").check();
  } else if (hasFirearms === "idk") {
    form.getCheckBox("Firearms I dont know").check();
  } else if (hasFirearms === "yes") {
    form.getCheckBox("Firearms Yes").check();
  }
}

function checkExclusivePetitionerLanguage(
  form: PDFForm,
  speaks: PersonInfo["speaksEnglish"],
): void {
  uncheck(form, "Yes_2");
  uncheck(form, "No_2");
  if (speaks === "yes") {
    form.getCheckBox("Yes_2").check();
  } else if (speaks === "no") {
    form.getCheckBox("No_2").check();
  }
}

function firearmsDescriptionText(rows: Dv100FirearmRow[]): string {
  return rows
    .map((r) => String(r.description ?? "").trim())
    .filter(Boolean)
    .join("; ");
}

/**
 * Loads `/clets001.pdf`, fills AcroForm fields from wizard/store data, and returns PDF bytes.
 * @param data Combined petitioner, respondent, CLETS extras, and Section 8–9 answers (see {@link Clets001PdfData}).
 */
export async function generateCLETS001PDF(data: any): Promise<Uint8Array> {
  const d = data as Clets001PdfData;
  const res = await fetch(CLETS001_PDF_URL);
  if (!res.ok) {
    throw new Error(`Failed to fetch ${CLETS001_PDF_URL}: ${res.status} ${res.statusText}`);
  }
  const doc = await PDFDocument.load(await res.arrayBuffer(), { ignoreEncryption: true });
  const form = doc.getForm();

  const petitioner = d.petitioner;
  const respondent = d.respondent;
  const clets = d.respondentCLETS;
  const people = Array.isArray(d.protectedPeople) ? d.protectedPeople : [];
  const protect = d.protectOtherPeople;

  const rName = personFullName(respondent).trim();
  safeSetText(form, "Name", rName);

  safeSetText(form, "Other names used", String(clets?.otherNamesUsed ?? "").trim());
  safeSetText(form, "Marks scars or tattoos", String(clets?.marksScarsTattoos ?? "").trim());

  const dl = String(clets?.driversLicense ?? "").trim();
  const dlState = String(clets?.driversLicenseState ?? "").trim();
  safeSetText(
    form,
    "Drivers license number and state",
    [dl, dlState].filter(Boolean).join(" ").trim(),
  );

  safeSetText(form, "SSN", String(clets?.ssn ?? "").trim());
  safeSetText(form, "Vehicle type", String(clets?.vehicleType ?? "").trim());
  safeSetText(form, "Model", String(clets?.vehicleModel ?? "").trim());
  safeSetText(form, "Year", String(clets?.vehicleYear ?? "").trim());
  safeSetText(form, "Plate number", String(clets?.vehiclePlate ?? "").trim());
  safeSetText(form, "Telephone_1", String(respondent?.telephone ?? "").trim());
  safeSetText(form, "Name of employer and address", String(clets?.employerNameAddress ?? "").trim());

  const speaksLangText =
    respondent?.speaksEnglish === "no"
      ? String(respondent?.language ?? "").trim()
      : "";
  safeSetText(form, "Does the person speak English", speaksLangText);

  checkExclusiveEnglishRespondent(form, respondent?.speaksEnglish ?? "");
  checkExclusiveFirearms(form, d.hasFirearms ?? "");
  safeSetText(form, "Firearms description", firearmsDescriptionText(d.firearms ?? []));

  const pName = personFullName(petitioner).trim();
  safeSetText(form, "Your Name", pName);
  safeSetText(form, "Race", String(petitioner?.race ?? "").trim());
  safeSetText(form, "Age", String(petitioner?.age ?? "").trim());
  safeSetText(form, "Date of Birth month day year", String(petitioner?.dateOfBirth ?? "").trim());
  safeSetText(form, "Telephone_2", String(petitioner?.telephone ?? "").trim());

  try {
    const g = form.getRadioGroup("Gender");
    const opt = cletsPetitionerGender(String(petitioner?.gender ?? ""));
    if (opt) {
      g.select(opt);
    }
  } catch (err) {
    console.warn("CLETS-001: failed to set petitioner Gender radio", err);
  }

  checkExclusivePetitionerLanguage(form, petitioner?.speaksEnglish ?? "");
  safeSetText(
    form,
    "No list language_2",
    petitioner?.speaksEnglish === "no" ? String(petitioner?.language ?? "").trim() : "",
  );

  for (let i = 1; i <= 4; i++) {
    const person = people[i - 1];
    const active = protect === "yes" && person;
    safeSetText(form, `Other_Name_${i}`, active ? String(person.name ?? "").trim() : "");
    safeSetText(form, `Gender_${i}`, active ? cletsProtectedGenderText(String(person.gender ?? "")) : "");
    safeSetText(form, `Race_${i}`, active ? String(person.race ?? "").trim() : "");
    safeSetText(form, `Date of Birth_${i}`, active ? String(person.dateOfBirth ?? "").trim() : "");
  }

  try {
    const more = protect === "yes" && people.length > 4;
    const cb = form.getCheckBox("More Persons Protected");
    if (more) {
      cb.check();
    } else {
      cb.uncheck();
    }
  } catch (err) {
    console.warn("CLETS-001: More Persons Protected checkbox", err);
  }

  form.updateFieldAppearances();
  return doc.save();
}
