import {
  PDFButton,
  PDFCheckBox,
  PDFDocument,
  PDFDropdown,
  type PDFField,
  PDFForm,
  PDFOptionList,
  PDFRadioGroup,
  PDFSignature,
  PDFTextField,
} from "pdf-lib";

export const DV100_PDF_URL = "/dv100.pdf";

export type PdfFieldInspectRow = {
  name: string;
  type: "text" | "checkbox" | "radio" | "dropdown" | "list" | "button" | "signature" | "unknown";
  defaultValue: string;
};

type Dv100RespondentGender = "Male" | "Female" | "Nonbinary";

/** Gender values shown in the DV-100 wizard (`/form`). */
export const DV100_GENDER_OPTIONS = ["Male", "Female", "Nonbinary"] as const;
export type Dv100GenderOption = (typeof DV100_GENDER_OPTIONS)[number] | "";

/**
 * Wizard answers written into the PDF by {@link generateDV100PDF}.
 * Covers DV-100 page 1 today; extend this type as additional pages are implemented.
 */
export type Dv100PdfFormData = {
  petitionerName: string;
  petitionerAge: string;
  petitionerAddress: string;
  petitionerCity: string;
  petitionerState: string;
  petitionerZip: string;
  petitionerPhone: string;
  petitionerEmail: string;
  hasLawyer: boolean;
  lawyerName: string;
  lawyerBarNo: string;
  lawyerFirm: string;
  respondentName: string;
  respondentAge: string;
  respondentDob: string;
  respondentGender: Dv100GenderOption;
  respondentRace: string;
};

/** One row in the fill / missing summary returned with the generated PDF. */
export type Dv100PdfFillRow = { label: string; pdfFieldName: string };

export type GenerateDv100PdfResult = {
  bytes: Uint8Array;
  filled: Dv100PdfFillRow[];
  missing: Dv100PdfFillRow[];
};

export async function fetchDv100Bytes(): Promise<Uint8Array> {
  const res = await fetch(DV100_PDF_URL);
  if (!res.ok) {
    throw new Error(`Failed to fetch ${DV100_PDF_URL}: ${res.status} ${res.statusText}`);
  }
  return new Uint8Array(await res.arrayBuffer());
}

export async function loadDv100Document(): Promise<PDFDocument> {
  const bytes = await fetchDv100Bytes();
  return PDFDocument.load(bytes, { ignoreEncryption: true });
}

function classifyFieldType(field: PDFField): PdfFieldInspectRow["type"] {
  if (field instanceof PDFTextField) return "text";
  if (field instanceof PDFCheckBox) return "checkbox";
  if (field instanceof PDFRadioGroup) return "radio";
  if (field instanceof PDFDropdown) return "dropdown";
  if (field instanceof PDFOptionList) return "list";
  if (field instanceof PDFButton) return "button";
  if (field instanceof PDFSignature) return "signature";
  return "unknown";
}

function readDefaultValue(field: PDFField): string {
  try {
    if (field instanceof PDFTextField) {
      return field.getText() ?? "";
    }
    if (field instanceof PDFCheckBox) {
      return field.isChecked() ? "true" : "false";
    }
    if (field instanceof PDFRadioGroup) {
      return field.getSelected() ?? "";
    }
    if (field instanceof PDFDropdown) {
      const sel = field.getSelected();
      if (!sel?.length) return "";
      return sel.join(", ");
    }
    if (field instanceof PDFOptionList) {
      const sel = field.getSelected();
      return sel.length ? sel.join(", ") : "";
    }
  } catch {
    return "(unreadable)";
  }
  return "";
}

export function inspectPdfFormFields(form: PDFForm): PdfFieldInspectRow[] {
  return form.getFields().map((field) => ({
    name: field.getName(),
    type: classifyFieldType(field),
    defaultValue: readDefaultValue(field),
  }));
}

/** DV-100 respondent gender AcroForm name (XFA may split into multiple widgets with this name). */
const PDF_RESPONDENT_GENDER_FIELD = "d Gender";

/**
 * Fills respondent age by field name substring (avoids exact-name mismatches on the official PDF).
 * @returns the PDF field name used, or null if unset/failed
 */
function setRespondentAgeByDynamicField(
  form: PDFForm,
  respondentAge: string | undefined,
): string | null {
  const ageValue = String(respondentAge ?? "").trim();
  if (!ageValue) return null;
  const allFields = form.getFields();
  const ageField = allFields.find((f) =>
    f.getName().toLowerCase().includes("age give estimate"),
  );
  if (!ageField) return null;
  // Dynamic match may not be `instanceof PDFTextField` (XFA-derived widgets).
  (ageField as PDFTextField).setText(ageValue);
  return ageField.getName();
}

/**
 * Selects Male / Female / Nonbinary on "d Gender" widgets (checkbox or radio) when XFA flattening
 * produced non-standard field types.
 */
function applyRespondentGenderFields(
  form: PDFForm,
  gender: Dv100RespondentGender,
): void {
  const formFields = form.getFields();
  const genderFields = formFields.filter((f) => f.getName() === PDF_RESPONDENT_GENDER_FIELD);

  genderFields.forEach((field) => {
    if (
      field.constructor.name === "PDFCheckBox" ||
      field.constructor.name === "PDFRadioGroup"
    ) {
      if (gender === "Male") {
        // @ts-expect-error XFA-derived fields: PDFField is not narrowed to checkbox/radio
        field.select("M");
      }
      if (gender === "Female") {
        // @ts-expect-error XFA-derived fields: PDFField is not narrowed to checkbox/radio
        field.select("F");
      }
      if (gender === "Nonbinary") {
        // @ts-expect-error XFA-derived fields: PDFField is not narrowed to checkbox/radio
        field.select("Nonbinary");
      }
    }
  });
}

/** DV-100 page 1 AcroForm field names (CA Judicial Council layout). */
const PDF_PAGE1_PETITIONER_NAME = "a Your name";
const PDF_PAGE1_PETITIONER_AGE = "b Your age";
const PDF_PAGE1_ADDRESS = "Address";
const PDF_PAGE1_CITY = "City";
const PDF_PAGE1_STATE = "State";
const PDF_PAGE1_ZIP = "Zip";
const PDF_PAGE1_TELEPHONE = "Telephone";
const PDF_PAGE1_EMAIL = "Email Address";
const PDF_PAGE1_LAWYER_NAME = "Name";
const PDF_PAGE1_LAWYER_BAR = "State Bar No";
const PDF_PAGE1_LAWYER_FIRM = "Firm Name";
const PDF_PAGE1_RESPONDENT_NAME = "a Full name";
/** Fallback label in summaries when dynamic age field is missing */
const PDF_PAGE1_RESPONDENT_AGE_FALLBACK =
  "b Age give estimate if you do not k now exact age";
const PDF_PAGE1_RESPONDENT_DOB = "c Date of birth if known";
const PDF_PAGE1_RESPONDENT_RACE = "e Race";

/**
 * Loads DV-100, fills known AcroForm fields from the wizard (page 1 today), calls
 * `form.updateFieldAppearances()` so Acrobat renders filled values, and saves without flattening.
 */
export async function generateDV100PDF(data: Dv100PdfFormData): Promise<GenerateDv100PdfResult> {
  const doc = await loadDv100Document();
  const pdfForm = doc.getForm();
  const filled: Dv100PdfFillRow[] = [];
  const missing: Dv100PdfFillRow[] = [];

  try {
    const field = pdfForm.getTextField(PDF_PAGE1_PETITIONER_NAME);
    const v = data.petitionerName.trim();
    if (field && v) {
      field.setText(v);
      filled.push({ label: "Your name", pdfFieldName: PDF_PAGE1_PETITIONER_NAME });
    }
  } catch (err) {
    console.warn("Failed to map Petitioner Name", err);
    if (data.petitionerName.trim()) {
      missing.push({ label: "Your name", pdfFieldName: PDF_PAGE1_PETITIONER_NAME });
    }
  }

  try {
    const field = pdfForm.getTextField(PDF_PAGE1_PETITIONER_AGE);
    const v = data.petitionerAge.trim();
    if (field && v) {
      field.setText(v);
      filled.push({ label: "Your age", pdfFieldName: PDF_PAGE1_PETITIONER_AGE });
    }
  } catch (err) {
    console.warn("Failed to map Petitioner Age", err);
    if (data.petitionerAge.trim()) {
      missing.push({ label: "Your age", pdfFieldName: PDF_PAGE1_PETITIONER_AGE });
    }
  }

  try {
    const field = pdfForm.getTextField(PDF_PAGE1_ADDRESS);
    const v = data.petitionerAddress.trim();
    if (field && v) {
      field.setText(v);
      filled.push({ label: "Address", pdfFieldName: PDF_PAGE1_ADDRESS });
    }
  } catch (err) {
    console.warn("Failed to map Address", err);
    if (data.petitionerAddress.trim()) {
      missing.push({ label: "Address", pdfFieldName: PDF_PAGE1_ADDRESS });
    }
  }

  try {
    const field = pdfForm.getTextField(PDF_PAGE1_CITY);
    const v = data.petitionerCity.trim();
    if (field && v) {
      field.setText(v);
      filled.push({ label: "City", pdfFieldName: PDF_PAGE1_CITY });
    }
  } catch (err) {
    console.warn("Failed to map City", err);
    if (data.petitionerCity.trim()) {
      missing.push({ label: "City", pdfFieldName: PDF_PAGE1_CITY });
    }
  }

  try {
    const field = pdfForm.getTextField(PDF_PAGE1_STATE);
    const v = data.petitionerState.trim();
    if (field && v) {
      field.setText(v);
      filled.push({ label: "State", pdfFieldName: PDF_PAGE1_STATE });
    }
  } catch (err) {
    console.warn("Failed to map State", err);
    if (data.petitionerState.trim()) {
      missing.push({ label: "State", pdfFieldName: PDF_PAGE1_STATE });
    }
  }

  try {
    const field = pdfForm.getTextField(PDF_PAGE1_ZIP);
    const v = data.petitionerZip.trim();
    if (field && v) {
      field.setText(v);
      filled.push({ label: "Zip", pdfFieldName: PDF_PAGE1_ZIP });
    }
  } catch (err) {
    console.warn("Failed to map Zip", err);
    if (data.petitionerZip.trim()) {
      missing.push({ label: "Zip", pdfFieldName: PDF_PAGE1_ZIP });
    }
  }

  try {
    const field = pdfForm.getTextField(PDF_PAGE1_TELEPHONE);
    const v = data.petitionerPhone.trim();
    if (field && v) {
      field.setText(v);
      filled.push({ label: "Telephone", pdfFieldName: PDF_PAGE1_TELEPHONE });
    }
  } catch (err) {
    console.warn("Failed to map Telephone", err);
    if (data.petitionerPhone.trim()) {
      missing.push({ label: "Telephone", pdfFieldName: PDF_PAGE1_TELEPHONE });
    }
  }

  try {
    const field = pdfForm.getTextField(PDF_PAGE1_EMAIL);
    const v = data.petitionerEmail.trim();
    if (field && v) {
      field.setText(v);
      filled.push({ label: "Email Address", pdfFieldName: PDF_PAGE1_EMAIL });
    }
  } catch (err) {
    console.warn("Failed to map Email Address", err);
    if (data.petitionerEmail.trim()) {
      missing.push({ label: "Email Address", pdfFieldName: PDF_PAGE1_EMAIL });
    }
  }

  if (data.hasLawyer) {
    try {
      const field = pdfForm.getTextField(PDF_PAGE1_LAWYER_NAME);
      const v = data.lawyerName.trim();
      if (field && v) {
        field.setText(v);
        filled.push({ label: "Lawyer name", pdfFieldName: PDF_PAGE1_LAWYER_NAME });
      }
    } catch (err) {
      console.warn("Failed to map Lawyer Name", err);
      if (data.lawyerName.trim()) {
        missing.push({ label: "Lawyer name", pdfFieldName: PDF_PAGE1_LAWYER_NAME });
      }
    }

    try {
      const field = pdfForm.getTextField(PDF_PAGE1_LAWYER_BAR);
      const v = data.lawyerBarNo.trim();
      if (field && v) {
        field.setText(v);
        filled.push({ label: "State Bar No.", pdfFieldName: PDF_PAGE1_LAWYER_BAR });
      }
    } catch (err) {
      console.warn("Failed to map State Bar No.", err);
      if (data.lawyerBarNo.trim()) {
        missing.push({ label: "State Bar No.", pdfFieldName: PDF_PAGE1_LAWYER_BAR });
      }
    }

    try {
      const field = pdfForm.getTextField(PDF_PAGE1_LAWYER_FIRM);
      const v = data.lawyerFirm.trim();
      if (field && v) {
        field.setText(v);
        filled.push({ label: "Firm Name", pdfFieldName: PDF_PAGE1_LAWYER_FIRM });
      }
    } catch (err) {
      console.warn("Failed to map Firm Name", err);
      if (data.lawyerFirm.trim()) {
        missing.push({ label: "Firm Name", pdfFieldName: PDF_PAGE1_LAWYER_FIRM });
      }
    }
  }

  try {
    const field = pdfForm.getTextField(PDF_PAGE1_RESPONDENT_NAME);
    const v = data.respondentName.trim();
    if (field && v) {
      field.setText(v);
      filled.push({
        label: "Respondent full name",
        pdfFieldName: PDF_PAGE1_RESPONDENT_NAME,
      });
    }
  } catch (err) {
    console.warn("Failed to map Respondent Name", err);
    if (data.respondentName.trim()) {
      missing.push({
        label: "Respondent full name",
        pdfFieldName: PDF_PAGE1_RESPONDENT_NAME,
      });
    }
  }

  try {
    const ageValue = String(data.respondentAge).trim();
    const usedName = setRespondentAgeByDynamicField(pdfForm, data.respondentAge);
    if (usedName) {
      filled.push({ label: "Respondent age", pdfFieldName: usedName });
    } else if (ageValue) {
      missing.push({
        label: "Respondent age",
        pdfFieldName: PDF_PAGE1_RESPONDENT_AGE_FALLBACK,
      });
    }
  } catch (err) {
    console.warn("Failed to map Respondent Age", err);
    if (String(data.respondentAge).trim()) {
      missing.push({
        label: "Respondent age",
        pdfFieldName: PDF_PAGE1_RESPONDENT_AGE_FALLBACK,
      });
    }
  }

  try {
    const field = pdfForm.getTextField(PDF_PAGE1_RESPONDENT_DOB);
    const v = data.respondentDob.trim();
    if (field && v) {
      field.setText(v);
      filled.push({
        label: "Respondent date of birth",
        pdfFieldName: PDF_PAGE1_RESPONDENT_DOB,
      });
    }
  } catch (err) {
    console.warn("Failed to map Respondent DOB", err);
    if (data.respondentDob.trim()) {
      missing.push({
        label: "Respondent date of birth",
        pdfFieldName: PDF_PAGE1_RESPONDENT_DOB,
      });
    }
  }

  const g = data.respondentGender;
  if (g === "Male" || g === "Female" || g === "Nonbinary") {
    try {
      applyRespondentGenderFields(pdfForm, g);
      filled.push({
        label: "Respondent gender",
        pdfFieldName: PDF_RESPONDENT_GENDER_FIELD,
      });
    } catch (err) {
      console.warn("Failed to map Gender brute-force:", err);
      missing.push({
        label: "Respondent gender",
        pdfFieldName: PDF_RESPONDENT_GENDER_FIELD,
      });
    }
  }

  try {
    const field = pdfForm.getTextField(PDF_PAGE1_RESPONDENT_RACE);
    const v = data.respondentRace.trim();
    if (field && v) {
      field.setText(v);
      filled.push({
        label: "Respondent race",
        pdfFieldName: PDF_PAGE1_RESPONDENT_RACE,
      });
    }
  } catch (err) {
    console.warn("Failed to map Respondent Race", err);
    if (data.respondentRace.trim()) {
      missing.push({
        label: "Respondent race",
        pdfFieldName: PDF_PAGE1_RESPONDENT_RACE,
      });
    }
  }

  pdfForm.updateFieldAppearances();
  const bytes = await doc.save();
  return { bytes, filled, missing };
}

export function triggerPdfDownload(bytes: Uint8Array, filename: string) {
  const copy = new Uint8Array(bytes.length);
  copy.set(bytes);
  const blob = new Blob([copy], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.rel = "noopener";
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
