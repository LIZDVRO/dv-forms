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
 * Covers DV-100 pages 1–2 (wizard); extend as additional pages are implemented.
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
  /** Section 3 — multi-select keys: children, married, usedToBeMarried, dating, engaged, related, liveTogether */
  relationshipChecks: string[];
  childrenNames: string;
  /** When `related` is selected: parent, child, childsSpouse, sibling, grandparent, grandchild */
  relatedTypes: string[];
  /** If `liveTogether` is selected: yes | no | "" */
  livedTogether: string;
  /** Section 4a: yes | no | "" */
  hasRestrainingOrders: string;
  order1Date: string;
  order1Expires: string;
  order2Date: string;
  order2Expires: string;
  /** Section 4b: yes | no | "" */
  hasOtherCases: string;
  caseTypes: string[];
  otherCaseType: string;
  custodyCaseDetails: string;
  divorceCaseDetails: string;
  juvenileCaseDetails: string;
  guardianshipCaseDetails: string;
  criminalCaseDetails: string;
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

/** Flattened PDF may use two spaces after "2"; try {@link PDF_PAGE2_RELATED_USER_SPEC} first. */
const PDF_PAGE2_RELATED_USER_SPEC =
  "We are related The person in 2 is my check all that apply";
const PDF_PAGE2_RELATED =
  "We are related The person in 2  is my check all that apply";
const PDF_PAGE2_LIVED_TOGETHER_RADIO = "Have you lived together with the person in";

const PDF_PAGE2_CHECK_RELATIONSHIP: { key: string; pdfName: string }[] = [
  {
    key: "children",
    pdfName: "We have a child or children together names of children",
  },
  {
    key: "married",
    pdfName: "We are married or registered domestic partners",
  },
  {
    key: "usedToBeMarried",
    pdfName: "We used to be married or registered domestic partners",
  },
  { key: "dating", pdfName: "We are dating or used to date" },
  {
    key: "engaged",
    pdfName: "We are or used to be engaged to be married",
  },
  {
    key: "liveTogether",
    pdfName:
      "We live together or used to live together If checked answer question below",
  },
];

const PDF_PAGE2_CHECK_RELATED_SUB: { key: string; pdfName: string }[] = [
  { key: "parent", pdfName: "Parent stepparent or parentinlaw" },
  {
    key: "child",
    pdfName: "Child stepchild or legally adopted child",
  },
  { key: "childsSpouse", pdfName: "Childs spouse" },
  {
    key: "sibling",
    pdfName: "Brother sister sibling stepsibling or sibling inlaw",
  },
  {
    key: "grandparent",
    pdfName: "Grandparent stepgrandparent or grandparentinlaw",
  },
  {
    key: "grandchild",
    pdfName: "Grandchild stepgrandchild or grandchildinlaw",
  },
];

const PDF_PAGE2_CHECK_CASE_TYPE: { key: string; pdfName: string }[] = [
  { key: "custody", pdfName: "Custody" },
  { key: "divorce", pdfName: "Divorce" },
  {
    key: "juvenile",
    pdfName: "Juvenile child welfare or juvenile justice",
  },
  { key: "guardianship", pdfName: "Guardianship" },
  { key: "criminal", pdfName: "Criminal" },
  { key: "other", pdfName: "Other what kind of case" },
];

const PDF_PAGE2_CASE_DETAIL_TEXT: {
  checkboxKey: string;
  dataKey: keyof Pick<
    Dv100PdfFormData,
    | "custodyCaseDetails"
    | "divorceCaseDetails"
    | "juvenileCaseDetails"
    | "guardianshipCaseDetails"
    | "criminalCaseDetails"
  >;
  pdfFieldName: string;
  label: string;
}[] = [
  {
    checkboxKey: "custody",
    dataKey: "custodyCaseDetails",
    pdfFieldName: "1",
    label: "Custody case details",
  },
  {
    checkboxKey: "divorce",
    dataKey: "divorceCaseDetails",
    pdfFieldName: "2",
    label: "Divorce case details",
  },
  {
    checkboxKey: "juvenile",
    dataKey: "juvenileCaseDetails",
    pdfFieldName: "undefined_3",
    label: "Juvenile case details",
  },
  {
    checkboxKey: "guardianship",
    dataKey: "guardianshipCaseDetails",
    pdfFieldName: "undefined_4",
    label: "Guardianship case details",
  },
  {
    checkboxKey: "criminal",
    dataKey: "criminalCaseDetails",
    pdfFieldName: "undefined_5",
    label: "Criminal case details",
  },
];

/**
 * Loads DV-100, fills known AcroForm fields from the wizard (pages 1–2), calls
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

  for (const { key, pdfName } of PDF_PAGE2_CHECK_RELATIONSHIP) {
    try {
      if (data.relationshipChecks.includes(key)) {
        pdfForm.getCheckBox(pdfName).check();
        filled.push({ label: `Relationship: ${key}`, pdfFieldName: pdfName });
      }
    } catch (err) {
      console.warn(`Failed to map relationship checkbox ${pdfName}`, err);
      if (data.relationshipChecks.includes(key)) {
        missing.push({ label: `Relationship: ${key}`, pdfFieldName: pdfName });
      }
    }
  }

  try {
    if (data.relationshipChecks.includes("related")) {
      let usedName = PDF_PAGE2_RELATED_USER_SPEC;
      try {
        pdfForm.getCheckBox(PDF_PAGE2_RELATED_USER_SPEC).check();
      } catch {
        usedName = PDF_PAGE2_RELATED;
        pdfForm.getCheckBox(PDF_PAGE2_RELATED).check();
      }
      filled.push({ label: "Relationship: related", pdfFieldName: usedName });
    }
  } catch (err) {
    console.warn("Failed to map relationship checkbox (related)", err);
    if (data.relationshipChecks.includes("related")) {
      missing.push({
        label: "Relationship: related",
        pdfFieldName: PDF_PAGE2_RELATED_USER_SPEC,
      });
    }
  }

  for (const { key, pdfName } of PDF_PAGE2_CHECK_RELATED_SUB) {
    try {
      if (
        data.relationshipChecks.includes("related") &&
        data.relatedTypes.includes(key)
      ) {
        pdfForm.getCheckBox(pdfName).check();
        filled.push({ label: `Related type: ${key}`, pdfFieldName: pdfName });
      }
    } catch (err) {
      console.warn(`Failed to map related sub-checkbox ${pdfName}`, err);
      if (
        data.relationshipChecks.includes("related") &&
        data.relatedTypes.includes(key)
      ) {
        missing.push({ label: `Related type: ${key}`, pdfFieldName: pdfName });
      }
    }
  }

  try {
    if (
      data.relationshipChecks.includes("liveTogether") &&
      (data.livedTogether === "yes" || data.livedTogether === "no")
    ) {
      const rg = pdfForm.getRadioGroup(PDF_PAGE2_LIVED_TOGETHER_RADIO);
      rg.select(data.livedTogether === "yes" ? "Yes" : "No");
      filled.push({
        label: "Lived together with person in 2",
        pdfFieldName: PDF_PAGE2_LIVED_TOGETHER_RADIO,
      });
    }
  } catch (err) {
    console.warn("Failed to map lived together radio", err);
    if (
      data.relationshipChecks.includes("liveTogether") &&
      (data.livedTogether === "yes" || data.livedTogether === "no")
    ) {
      missing.push({
        label: "Lived together with person in 2",
        pdfFieldName: PDF_PAGE2_LIVED_TOGETHER_RADIO,
      });
    }
  }

  try {
    const field = pdfForm.getTextField("undefined");
    const v = data.childrenNames.trim();
    if (field && v) {
      field.setText(v);
      filled.push({ label: "Children names (line 1)", pdfFieldName: "undefined" });
    }
  } catch (err) {
    console.warn("Failed to map children names undefined", err);
    if (data.childrenNames.trim()) {
      missing.push({ label: "Children names (line 1)", pdfFieldName: "undefined" });
    }
  }

  try {
    const field = pdfForm.getTextField("undefined_2");
    if (field) {
      field.setText("");
    }
  } catch (err) {
    console.warn("Failed to map children names undefined_2", err);
  }

  try {
    if (data.hasRestrainingOrders === "yes") {
      pdfForm
        .getCheckBox(
          "Yes If yes give information below and attach a copy if you have one",
        )
        .check();
      filled.push({
        label: "Other restraining orders (yes)",
        pdfFieldName:
          "Yes If yes give information below and attach a copy if you have one",
      });
    }
  } catch (err) {
    console.warn("Failed to map Section 4a Yes", err);
    if (data.hasRestrainingOrders === "yes") {
      missing.push({
        label: "Other restraining orders (yes)",
        pdfFieldName:
          "Yes If yes give information below and attach a copy if you have one",
      });
    }
  }

  try {
    if (data.hasRestrainingOrders === "no") {
      pdfForm.getCheckBox("No_2").check();
      filled.push({ label: "Other restraining orders (no)", pdfFieldName: "No_2" });
    }
  } catch (err) {
    console.warn("Failed to map Section 4a No", err);
    if (data.hasRestrainingOrders === "no") {
      missing.push({ label: "Other restraining orders (no)", pdfFieldName: "No_2" });
    }
  }

  try {
    if (data.hasRestrainingOrders === "yes") {
      pdfForm.getCheckBox("No_2").uncheck();
    }
  } catch (err) {
    console.warn("Failed to uncheck Section 4a No_2", err);
  }

  try {
    if (data.hasRestrainingOrders === "no") {
      pdfForm
        .getCheckBox(
          "Yes If yes give information below and attach a copy if you have one",
        )
        .uncheck();
    }
  } catch (err) {
    console.warn("Failed to uncheck Section 4a Yes", err);
  }

  try {
    const field = pdfForm.getTextField("1 date of order");
    const v = data.order1Date.trim();
    if (field && v) {
      field.setText(v);
      filled.push({ label: "Order 1 date", pdfFieldName: "1 date of order" });
    }
  } catch (err) {
    console.warn("Failed to map order1Date", err);
    if (data.order1Date.trim()) {
      missing.push({ label: "Order 1 date", pdfFieldName: "1 date of order" });
    }
  }

  try {
    const field = pdfForm.getTextField("date it expires");
    const v = data.order1Expires.trim();
    if (field && v) {
      field.setText(v);
      filled.push({ label: "Order 1 expires", pdfFieldName: "date it expires" });
    }
  } catch (err) {
    console.warn("Failed to map order1Expires", err);
    if (data.order1Expires.trim()) {
      missing.push({ label: "Order 1 expires", pdfFieldName: "date it expires" });
    }
  }

  try {
    const field = pdfForm.getTextField("2 date of order");
    const v = data.order2Date.trim();
    if (field && v) {
      field.setText(v);
      filled.push({ label: "Order 2 date", pdfFieldName: "2 date of order" });
    }
  } catch (err) {
    console.warn("Failed to map order2Date", err);
    if (data.order2Date.trim()) {
      missing.push({ label: "Order 2 date", pdfFieldName: "2 date of order" });
    }
  }

  try {
    const field = pdfForm.getTextField("date it expires_2");
    const v = data.order2Expires.trim();
    if (field && v) {
      field.setText(v);
      filled.push({
        label: "Order 2 expires",
        pdfFieldName: "date it expires_2",
      });
    }
  } catch (err) {
    console.warn("Failed to map order2Expires", err);
    if (data.order2Expires.trim()) {
      missing.push({
        label: "Order 2 expires",
        pdfFieldName: "date it expires_2",
      });
    }
  }

  try {
    if (data.hasOtherCases === "yes") {
      pdfForm
        .getCheckBox(
          "Yes If you know list where the case was filed city state or tribe the year it was filed and case number",
        )
        .check();
      filled.push({
        label: "Other court cases (yes)",
        pdfFieldName:
          "Yes If you know list where the case was filed city state or tribe the year it was filed and case number",
      });
    }
  } catch (err) {
    console.warn("Failed to map Section 4b Yes", err);
    if (data.hasOtherCases === "yes") {
      missing.push({
        label: "Other court cases (yes)",
        pdfFieldName:
          "Yes If you know list where the case was filed city state or tribe the year it was filed and case number",
      });
    }
  }

  try {
    if (data.hasOtherCases === "no") {
      pdfForm.getCheckBox("No_3").check();
      filled.push({ label: "Other court cases (no)", pdfFieldName: "No_3" });
    }
  } catch (err) {
    console.warn("Failed to map Section 4b No", err);
    if (data.hasOtherCases === "no") {
      missing.push({ label: "Other court cases (no)", pdfFieldName: "No_3" });
    }
  }

  try {
    if (data.hasOtherCases === "yes") {
      pdfForm.getCheckBox("No_3").uncheck();
    }
  } catch (err) {
    console.warn("Failed to uncheck Section 4b No_3", err);
  }

  try {
    if (data.hasOtherCases === "no") {
      pdfForm
        .getCheckBox(
          "Yes If you know list where the case was filed city state or tribe the year it was filed and case number",
        )
        .uncheck();
    }
  } catch (err) {
    console.warn("Failed to uncheck Section 4b Yes", err);
  }

  for (const { key, pdfName } of PDF_PAGE2_CHECK_CASE_TYPE) {
    try {
      if (data.hasOtherCases === "yes" && data.caseTypes.includes(key)) {
        pdfForm.getCheckBox(pdfName).check();
        filled.push({ label: `Case type: ${key}`, pdfFieldName: pdfName });
      }
    } catch (err) {
      console.warn(`Failed to map case type checkbox ${pdfName}`, err);
      if (data.hasOtherCases === "yes" && data.caseTypes.includes(key)) {
        missing.push({ label: `Case type: ${key}`, pdfFieldName: pdfName });
      }
    }
  }

  try {
    if (
      data.hasOtherCases === "yes" &&
      data.caseTypes?.includes("other") &&
      data.otherCaseType
    ) {
      const otherCaseTypeField = pdfForm.getTextField("other_case_type");
      otherCaseTypeField.setText(data.otherCaseType);
    }
  } catch (error) {
    console.error("Could not fill other_case_type field:", error);
  }

  for (const { checkboxKey, dataKey, pdfFieldName, label } of PDF_PAGE2_CASE_DETAIL_TEXT) {
    const v = data[dataKey].trim();
    const shouldApply =
      data.hasOtherCases === "yes" &&
      data.caseTypes.includes(checkboxKey) &&
      v.length > 0;
    if (!shouldApply) continue;
    try {
      const field = pdfForm.getTextField(pdfFieldName);
      if (field && v) {
        field.setText(v);
        filled.push({ label, pdfFieldName });
      }
    } catch (err) {
      console.warn(`Failed to map ${dataKey}`, err);
      missing.push({ label, pdfFieldName });
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
