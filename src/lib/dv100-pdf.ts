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
 * Covers DV-100 pages 1–4 (wizard); extend as additional pages are implemented.
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
  /** Section 5 — most recent abuse (DV-100 Page 3) */
  recentAbuseDate: string;
  recentAbuseWitnesses: string;
  /** 5b — names / who saw (PDF when witnesses === yes) */
  recentAbuseWitnessDetail: string;
  recentAbuseWeapon: string;
  recentAbuseWeaponDetail: string;
  recentAbuseHarm: string;
  recentAbuseHarmDetail: string;
  recentAbusePolice: string;
  recentAbuseDetails: string;
  recentAbuseFrequency: string;
  recentAbuseFrequencyOther: string;
  recentAbuseDates: string;
  /** Section 6 — second incident of abuse (DV-100 Page 4) */
  secondAbuseDate: string;
  secondAbuseWitnesses: string;
  secondAbuseWitnessDetail: string;
  secondAbuseWeapon: string;
  secondAbuseWeaponDetail: string;
  secondAbuseHarm: string;
  secondAbuseHarmDetail: string;
  secondAbusePolice: string;
  secondAbuseDetails: string;
  secondAbuseFrequency: string;
  secondAbuseFrequencyOther: string;
  secondAbuseDates: string;
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

/** Section 5 — DV-100 Page 3 (exact AcroForm names) */
const PDF_PAGE3_ABUSE_DATE =
  "a Date of abuse give an estimate if you dont know the exact date";
const PDF_PAGE3_WITNESSES_RADIO =
  "b Did anyone else hear or see what happened on this day";
const PDF_PAGE3_WITNESS_DETAIL = "b anyone else see what happened";
const PDF_PAGE3_WEAPON_RADIO = "c Did the person in";
const PDF_PAGE3_WEAPON_DETAIL = "c use or threaten to use a gun or other weapon";
const PDF_PAGE3_HARM_NO = "No_6";
const PDF_PAGE3_HARM_YES = "Yes If yes describe harm";
const PDF_PAGE3_HARM_DETAIL = "d cause you any emotional or physical harm";
const PDF_PAGE3_ABUSE_DETAILS = "5f details of abuse";
const PDF_PAGE3_FREQ_OTHER_TEXT = "undefined_6";
const PDF_PAGE3_FREQ_DATES = "5g dates when it happened";
const PDF_PAGE3_POLICE_IDK = "I dont know_2";
const PDF_PAGE3_POLICE_NO = "No_7";
const PDF_PAGE3_POLICE_YES_NAMES = [
  "Yes If the police gave you a restraining order list it in 4",
  "Yes If the police gave you a restraining order list it in  4",
] as const;

/** Section 6 — DV-100 Page 4 (exact AcroForm names) */
const PDF_PAGE4_ABUSE_DATE =
  "a Date of abuse give an estimate if you dont know the exact date_2";
const PDF_PAGE4_WITNESS_IDK = "I dont know_3";
const PDF_PAGE4_WITNESS_NO = "No_8";
const PDF_PAGE4_WITNESS_YES = "Yes If yes give names";
const PDF_PAGE4_WITNESS_DETAIL = "undefined_7";
const PDF_PAGE4_WEAPON_NO = "No_9";
const PDF_PAGE4_WEAPON_YES = "Yes If yes describe gun or weapon";
const PDF_PAGE4_WEAPON_DETAIL = "2 use or threaten to use a gun or other weapon_2";
const PDF_PAGE4_HARM_RADIO = "d Did the person in";
const PDF_PAGE4_HARM_NO_OPT = "No_10";
const PDF_PAGE4_HARM_YES_OPT = "Yes_4";
const PDF_PAGE4_HARM_DETAIL = "6d emotional or physical harm";
const PDF_PAGE4_POLICE_IDK = "I dont know_4";
const PDF_PAGE4_POLICE_NO = "No_11";
const PDF_PAGE4_POLICE_YES =
  "Yes If the police gave you a restraining order list it in  4_2";
const PDF_PAGE4_ABUSE_DETAILS = "6f details of abuse";
const PDF_PAGE4_FREQ_ONCE = "Just this once_2";
const PDF_PAGE4_FREQ_25 = "25 times_2";
const PDF_PAGE4_FREQ_WEEKLY = "Weekly_2";
const PDF_PAGE4_FREQ_OTHER = "Other_2";
const PDF_PAGE4_FREQ_OTHER_TEXT = "undefined_8";
const PDF_PAGE4_FREQ_DATES = "6g dates or estimates of when it happened";

/**
 * Loads DV-100, fills known AcroForm fields from the wizard (pages 1–3), calls
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

  // --- DV-100 Page 3 — Section 5 (most recent abuse) ---
  try {
    const field = pdfForm.getTextField(PDF_PAGE3_ABUSE_DATE);
    const v = data.recentAbuseDate.trim();
    if (field && v) {
      field.setText(v);
      filled.push({ label: "Date of abuse", pdfFieldName: PDF_PAGE3_ABUSE_DATE });
    }
  } catch (err) {
    console.warn("Failed to map recentAbuseDate", err);
    if (data.recentAbuseDate.trim()) {
      missing.push({ label: "Date of abuse", pdfFieldName: PDF_PAGE3_ABUSE_DATE });
    }
  }

  try {
    if (data.recentAbuseWitnesses === "idk") {
      const rg = pdfForm.getRadioGroup(PDF_PAGE3_WITNESSES_RADIO);
      rg.select("I dont know");
      filled.push({
        label: "Witnesses (idk)",
        pdfFieldName: PDF_PAGE3_WITNESSES_RADIO,
      });
    } else if (data.recentAbuseWitnesses === "no") {
      const rg = pdfForm.getRadioGroup(PDF_PAGE3_WITNESSES_RADIO);
      rg.select("No_4");
      filled.push({
        label: "Witnesses (no)",
        pdfFieldName: PDF_PAGE3_WITNESSES_RADIO,
      });
    } else if (data.recentAbuseWitnesses === "yes") {
      const rg = pdfForm.getRadioGroup(PDF_PAGE3_WITNESSES_RADIO);
      rg.select("Yes_2");
      filled.push({
        label: "Witnesses (yes)",
        pdfFieldName: PDF_PAGE3_WITNESSES_RADIO,
      });
    }
  } catch (err) {
    console.warn("Failed to map witnesses radio", err);
    if (
      data.recentAbuseWitnesses === "idk" ||
      data.recentAbuseWitnesses === "no" ||
      data.recentAbuseWitnesses === "yes"
    ) {
      missing.push({
        label: "Witnesses",
        pdfFieldName: PDF_PAGE3_WITNESSES_RADIO,
      });
    }
  }

  try {
    if (data.recentAbuseWitnesses !== "yes") {
      const field = pdfForm.getTextField(PDF_PAGE3_WITNESS_DETAIL);
      field.setText("");
    }
  } catch (err) {
    console.warn("Failed to clear witness detail field", err);
  }

  try {
    const field = pdfForm.getTextField(PDF_PAGE3_WITNESS_DETAIL);
    const v = data.recentAbuseWitnessDetail.trim();
    if (data.recentAbuseWitnesses === "yes" && field && v) {
      field.setText(v);
      filled.push({
        label: "Anyone else see (names / details)",
        pdfFieldName: PDF_PAGE3_WITNESS_DETAIL,
      });
    }
  } catch (err) {
    console.warn("Failed to map recentAbuseWitnessDetail", err);
    if (
      data.recentAbuseWitnesses === "yes" &&
      data.recentAbuseWitnessDetail.trim()
    ) {
      missing.push({
        label: "Anyone else see (names / details)",
        pdfFieldName: PDF_PAGE3_WITNESS_DETAIL,
      });
    }
  }

  try {
    if (data.recentAbuseWeapon === "no") {
      const rg = pdfForm.getRadioGroup(PDF_PAGE3_WEAPON_RADIO);
      rg.select("No_5");
      filled.push({
        label: "Weapon (no)",
        pdfFieldName: PDF_PAGE3_WEAPON_RADIO,
      });
    } else if (data.recentAbuseWeapon === "yes") {
      const rg = pdfForm.getRadioGroup(PDF_PAGE3_WEAPON_RADIO);
      rg.select("Yes_3");
      filled.push({
        label: "Weapon (yes)",
        pdfFieldName: PDF_PAGE3_WEAPON_RADIO,
      });
    }
  } catch (err) {
    console.warn("Failed to map weapon radio", err);
    if (data.recentAbuseWeapon === "no" || data.recentAbuseWeapon === "yes") {
      missing.push({
        label: "Weapon",
        pdfFieldName: PDF_PAGE3_WEAPON_RADIO,
      });
    }
  }

  try {
    if (data.recentAbuseWeapon !== "yes") {
      const field = pdfForm.getTextField(PDF_PAGE3_WEAPON_DETAIL);
      field.setText("");
    }
  } catch (err) {
    console.warn("Failed to clear weapon detail field", err);
  }

  try {
    const field = pdfForm.getTextField(PDF_PAGE3_WEAPON_DETAIL);
    const v = data.recentAbuseWeaponDetail.trim();
    if (data.recentAbuseWeapon === "yes" && field && v) {
      field.setText(v);
      filled.push({
        label: "Weapon description",
        pdfFieldName: PDF_PAGE3_WEAPON_DETAIL,
      });
    }
  } catch (err) {
    console.warn("Failed to map recentAbuseWeaponDetail", err);
    if (data.recentAbuseWeapon === "yes" && data.recentAbuseWeaponDetail.trim()) {
      missing.push({
        label: "Weapon description",
        pdfFieldName: PDF_PAGE3_WEAPON_DETAIL,
      });
    }
  }

  try {
    pdfForm.getCheckBox(PDF_PAGE3_HARM_NO).uncheck();
  } catch {
    /* ignore */
  }
  try {
    pdfForm.getCheckBox(PDF_PAGE3_HARM_YES).uncheck();
  } catch {
    /* ignore */
  }

  try {
    if (data.recentAbuseHarm === "no") {
      pdfForm.getCheckBox(PDF_PAGE3_HARM_NO).check();
      filled.push({ label: "Harm (no)", pdfFieldName: PDF_PAGE3_HARM_NO });
    }
  } catch (err) {
    console.warn("Failed to map harm checkbox No_6", err);
    if (data.recentAbuseHarm === "no") {
      missing.push({ label: "Harm (no)", pdfFieldName: PDF_PAGE3_HARM_NO });
    }
  }

  try {
    if (data.recentAbuseHarm === "yes") {
      pdfForm.getCheckBox(PDF_PAGE3_HARM_YES).check();
      filled.push({
        label: "Harm (yes)",
        pdfFieldName: PDF_PAGE3_HARM_YES,
      });
    }
  } catch (err) {
    console.warn("Failed to map harm checkbox Yes", err);
    if (data.recentAbuseHarm === "yes") {
      missing.push({
        label: "Harm (yes)",
        pdfFieldName: PDF_PAGE3_HARM_YES,
      });
    }
  }

  try {
    if (data.recentAbuseHarm !== "yes") {
      const field = pdfForm.getTextField(PDF_PAGE3_HARM_DETAIL);
      field.setText("");
    }
  } catch (err) {
    console.warn("Failed to clear harm detail field", err);
  }

  try {
    const field = pdfForm.getTextField(PDF_PAGE3_HARM_DETAIL);
    const v = data.recentAbuseHarmDetail.trim();
    if (data.recentAbuseHarm === "yes" && field && v) {
      field.setText(v);
      filled.push({
        label: "Harm description",
        pdfFieldName: PDF_PAGE3_HARM_DETAIL,
      });
    }
  } catch (err) {
    console.warn("Failed to map recentAbuseHarmDetail", err);
    if (data.recentAbuseHarm === "yes" && data.recentAbuseHarmDetail.trim()) {
      missing.push({
        label: "Harm description",
        pdfFieldName: PDF_PAGE3_HARM_DETAIL,
      });
    }
  }

  try {
    pdfForm.getCheckBox(PDF_PAGE3_POLICE_IDK).uncheck();
  } catch {
    /* ignore */
  }
  try {
    pdfForm.getCheckBox(PDF_PAGE3_POLICE_NO).uncheck();
  } catch {
    /* ignore */
  }
  for (const name of PDF_PAGE3_POLICE_YES_NAMES) {
    try {
      pdfForm.getCheckBox(name).uncheck();
    } catch {
      /* ignore */
    }
  }

  try {
    if (data.recentAbusePolice === "idk") {
      pdfForm.getCheckBox(PDF_PAGE3_POLICE_IDK).check();
      filled.push({ label: "Police (idk)", pdfFieldName: PDF_PAGE3_POLICE_IDK });
    }
  } catch (err) {
    console.warn("Failed to map police I dont know_2", err);
    if (data.recentAbusePolice === "idk") {
      missing.push({ label: "Police (idk)", pdfFieldName: PDF_PAGE3_POLICE_IDK });
    }
  }

  try {
    if (data.recentAbusePolice === "no") {
      pdfForm.getCheckBox(PDF_PAGE3_POLICE_NO).check();
      filled.push({ label: "Police (no)", pdfFieldName: PDF_PAGE3_POLICE_NO });
    }
  } catch (err) {
    console.warn("Failed to map police No_7", err);
    if (data.recentAbusePolice === "no") {
      missing.push({ label: "Police (no)", pdfFieldName: PDF_PAGE3_POLICE_NO });
    }
  }

  try {
    if (data.recentAbusePolice === "yes") {
      pdfForm.getCheckBox(PDF_PAGE3_POLICE_YES_NAMES[0]).check();
      filled.push({
        label: "Police (yes)",
        pdfFieldName: PDF_PAGE3_POLICE_YES_NAMES[0],
      });
    }
  } catch (err) {
    console.warn("Failed to map police Yes (primary name)", err);
    try {
      if (data.recentAbusePolice === "yes") {
        pdfForm.getCheckBox(PDF_PAGE3_POLICE_YES_NAMES[1]).check();
        filled.push({
          label: "Police (yes)",
          pdfFieldName: PDF_PAGE3_POLICE_YES_NAMES[1],
        });
      }
    } catch (err2) {
      console.warn("Failed to map police Yes (alternate spacing)", err2);
      if (data.recentAbusePolice === "yes") {
        missing.push({
          label: "Police (yes)",
          pdfFieldName: PDF_PAGE3_POLICE_YES_NAMES[0],
        });
      }
    }
  }

  try {
    const field = pdfForm.getTextField(PDF_PAGE3_ABUSE_DETAILS);
    const v = data.recentAbuseDetails.trim();
    if (field && v) {
      field.setText(v);
      filled.push({
        label: "Details of abuse",
        pdfFieldName: PDF_PAGE3_ABUSE_DETAILS,
      });
    }
  } catch (err) {
    console.warn("Failed to map recentAbuseDetails", err);
    if (data.recentAbuseDetails.trim()) {
      missing.push({
        label: "Details of abuse",
        pdfFieldName: PDF_PAGE3_ABUSE_DETAILS,
      });
    }
  }

  const freqPdfName = {
    once: "Just this once",
    "2-5": "25 times",
    weekly: "Weekly",
    other: "Other",
  } as const;
  for (const name of Object.values(freqPdfName)) {
    try {
      pdfForm.getCheckBox(name).uncheck();
    } catch {
      /* ignore */
    }
  }

  try {
    if (data.recentAbuseFrequency === "once") {
      pdfForm.getCheckBox(freqPdfName.once).check();
      filled.push({ label: "Frequency: once", pdfFieldName: freqPdfName.once });
    }
  } catch (err) {
    console.warn("Failed to map frequency Just this once", err);
    if (data.recentAbuseFrequency === "once") {
      missing.push({ label: "Frequency: once", pdfFieldName: freqPdfName.once });
    }
  }

  try {
    if (data.recentAbuseFrequency === "2-5") {
      pdfForm.getCheckBox(freqPdfName["2-5"]).check();
      filled.push({ label: "Frequency: 2-5", pdfFieldName: freqPdfName["2-5"] });
    }
  } catch (err) {
    console.warn("Failed to map frequency 25 times", err);
    if (data.recentAbuseFrequency === "2-5") {
      missing.push({ label: "Frequency: 2-5", pdfFieldName: freqPdfName["2-5"] });
    }
  }

  try {
    if (data.recentAbuseFrequency === "weekly") {
      pdfForm.getCheckBox(freqPdfName.weekly).check();
      filled.push({ label: "Frequency: weekly", pdfFieldName: freqPdfName.weekly });
    }
  } catch (err) {
    console.warn("Failed to map frequency Weekly", err);
    if (data.recentAbuseFrequency === "weekly") {
      missing.push({ label: "Frequency: weekly", pdfFieldName: freqPdfName.weekly });
    }
  }

  try {
    if (data.recentAbuseFrequency === "other") {
      pdfForm.getCheckBox(freqPdfName.other).check();
      filled.push({ label: "Frequency: other", pdfFieldName: freqPdfName.other });
    }
  } catch (err) {
    console.warn("Failed to map frequency Other", err);
    if (data.recentAbuseFrequency === "other") {
      missing.push({ label: "Frequency: other", pdfFieldName: freqPdfName.other });
    }
  }

  try {
    if (data.recentAbuseFrequency !== "other") {
      const field = pdfForm.getTextField(PDF_PAGE3_FREQ_OTHER_TEXT);
      field.setText("");
    }
  } catch (err) {
    console.warn("Failed to clear frequency other field", err);
  }

  try {
    const field = pdfForm.getTextField(PDF_PAGE3_FREQ_OTHER_TEXT);
    const v = data.recentAbuseFrequencyOther.trim();
    if (data.recentAbuseFrequency === "other" && field && v) {
      field.setText(v);
      filled.push({
        label: "Frequency (other)",
        pdfFieldName: PDF_PAGE3_FREQ_OTHER_TEXT,
      });
    }
  } catch (err) {
    console.warn("Failed to map recentAbuseFrequencyOther", err);
    if (
      data.recentAbuseFrequency === "other" &&
      data.recentAbuseFrequencyOther.trim()
    ) {
      missing.push({
        label: "Frequency (other)",
        pdfFieldName: PDF_PAGE3_FREQ_OTHER_TEXT,
      });
    }
  }

  const datesApply =
    data.recentAbuseFrequency === "2-5" ||
    data.recentAbuseFrequency === "weekly" ||
    data.recentAbuseFrequency === "other";

  try {
    if (!datesApply) {
      const field = pdfForm.getTextField(PDF_PAGE3_FREQ_DATES);
      field.setText("");
    }
  } catch (err) {
    console.warn("Failed to clear dates when it happened", err);
  }

  try {
    const field = pdfForm.getTextField(PDF_PAGE3_FREQ_DATES);
    const v = data.recentAbuseDates.trim();
    if (datesApply && field && v) {
      field.setText(v);
      filled.push({
        label: "Dates when it happened",
        pdfFieldName: PDF_PAGE3_FREQ_DATES,
      });
    }
  } catch (err) {
    console.warn("Failed to map recentAbuseDates", err);
    if (datesApply && data.recentAbuseDates.trim()) {
      missing.push({
        label: "Dates when it happened",
        pdfFieldName: PDF_PAGE3_FREQ_DATES,
      });
    }
  }

  // --- DV-100 Page 4 — Section 6 (second incident of abuse) ---
  try {
    const field = pdfForm.getTextField(PDF_PAGE4_ABUSE_DATE);
    const v = (data.secondAbuseDate ?? "").trim();
    if (field && v) {
      field.setText(v);
      filled.push({
        label: "6a. Date of abuse (incident 2)",
        pdfFieldName: PDF_PAGE4_ABUSE_DATE,
      });
    }
  } catch (err) {
    console.warn("Failed to map secondAbuseDate", err);
    if ((data.secondAbuseDate ?? "").trim()) {
      missing.push({
        label: "6a. Date of abuse (incident 2)",
        pdfFieldName: PDF_PAGE4_ABUSE_DATE,
      });
    }
  }

  const sec6Witness = data.secondAbuseWitnesses;
  if (sec6Witness === "idk" || sec6Witness === "no" || sec6Witness === "yes") {
    try {
      pdfForm.getCheckBox(PDF_PAGE4_WITNESS_IDK).uncheck();
    } catch {
      /* ignore */
    }
    try {
      pdfForm.getCheckBox(PDF_PAGE4_WITNESS_NO).uncheck();
    } catch {
      /* ignore */
    }
    try {
      pdfForm.getCheckBox(PDF_PAGE4_WITNESS_YES).uncheck();
    } catch {
      /* ignore */
    }
  }

  try {
    if (sec6Witness === "idk") {
      pdfForm.getCheckBox(PDF_PAGE4_WITNESS_IDK).check();
      filled.push({
        label: "6b. Witnesses (idk)",
        pdfFieldName: PDF_PAGE4_WITNESS_IDK,
      });
    }
  } catch (err) {
    console.warn("Failed to map 6b I dont know_3", err);
    if (sec6Witness === "idk") {
      missing.push({
        label: "6b. Witnesses (idk)",
        pdfFieldName: PDF_PAGE4_WITNESS_IDK,
      });
    }
  }

  try {
    if (sec6Witness === "no") {
      pdfForm.getCheckBox(PDF_PAGE4_WITNESS_NO).check();
      filled.push({
        label: "6b. Witnesses (no)",
        pdfFieldName: PDF_PAGE4_WITNESS_NO,
      });
    }
  } catch (err) {
    console.warn("Failed to map 6b No_8", err);
    if (sec6Witness === "no") {
      missing.push({
        label: "6b. Witnesses (no)",
        pdfFieldName: PDF_PAGE4_WITNESS_NO,
      });
    }
  }

  try {
    if (sec6Witness === "yes") {
      pdfForm.getCheckBox(PDF_PAGE4_WITNESS_YES).check();
      filled.push({
        label: "6b. Witnesses (yes)",
        pdfFieldName: PDF_PAGE4_WITNESS_YES,
      });
    }
  } catch (err) {
    console.warn("Failed to map 6b Yes If yes give names", err);
    if (sec6Witness === "yes") {
      missing.push({
        label: "6b. Witnesses (yes)",
        pdfFieldName: PDF_PAGE4_WITNESS_YES,
      });
    }
  }

  try {
    if (sec6Witness !== "yes") {
      const field = pdfForm.getTextField(PDF_PAGE4_WITNESS_DETAIL);
      field.setText("");
    }
  } catch (err) {
    console.warn("Failed to clear 6b witness detail", err);
  }

  try {
    const field = pdfForm.getTextField(PDF_PAGE4_WITNESS_DETAIL);
    const v = (data.secondAbuseWitnessDetail ?? "").trim();
    if (sec6Witness === "yes" && field && v) {
      field.setText(v);
      filled.push({
        label: "6b. Witness names / details",
        pdfFieldName: PDF_PAGE4_WITNESS_DETAIL,
      });
    }
  } catch (err) {
    console.warn("Failed to map secondAbuseWitnessDetail", err);
    if (sec6Witness === "yes" && (data.secondAbuseWitnessDetail ?? "").trim()) {
      missing.push({
        label: "6b. Witness names / details",
        pdfFieldName: PDF_PAGE4_WITNESS_DETAIL,
      });
    }
  }

  const sec6Weapon = data.secondAbuseWeapon;
  if (sec6Weapon === "no" || sec6Weapon === "yes") {
    try {
      pdfForm.getCheckBox(PDF_PAGE4_WEAPON_NO).uncheck();
    } catch {
      /* ignore */
    }
    try {
      pdfForm.getCheckBox(PDF_PAGE4_WEAPON_YES).uncheck();
    } catch {
      /* ignore */
    }
  }

  try {
    if (sec6Weapon === "no") {
      pdfForm.getCheckBox(PDF_PAGE4_WEAPON_NO).check();
      filled.push({
        label: "6c. Weapon (no)",
        pdfFieldName: PDF_PAGE4_WEAPON_NO,
      });
    }
  } catch (err) {
    console.warn("Failed to map 6c No_9", err);
    if (sec6Weapon === "no") {
      missing.push({
        label: "6c. Weapon (no)",
        pdfFieldName: PDF_PAGE4_WEAPON_NO,
      });
    }
  }

  try {
    if (sec6Weapon === "yes") {
      pdfForm.getCheckBox(PDF_PAGE4_WEAPON_YES).check();
      filled.push({
        label: "6c. Weapon (yes)",
        pdfFieldName: PDF_PAGE4_WEAPON_YES,
      });
    }
  } catch (err) {
    console.warn("Failed to map 6c Yes weapon", err);
    if (sec6Weapon === "yes") {
      missing.push({
        label: "6c. Weapon (yes)",
        pdfFieldName: PDF_PAGE4_WEAPON_YES,
      });
    }
  }

  try {
    if (sec6Weapon !== "yes") {
      const field = pdfForm.getTextField(PDF_PAGE4_WEAPON_DETAIL);
      field.setText("");
    }
  } catch (err) {
    console.warn("Failed to clear 6c weapon detail", err);
  }

  try {
    const field = pdfForm.getTextField(PDF_PAGE4_WEAPON_DETAIL);
    const v = (data.secondAbuseWeaponDetail ?? "").trim();
    if (sec6Weapon === "yes" && field && v) {
      field.setText(v);
      filled.push({
        label: "6c. Weapon description",
        pdfFieldName: PDF_PAGE4_WEAPON_DETAIL,
      });
    }
  } catch (err) {
    console.warn("Failed to map secondAbuseWeaponDetail", err);
    if (sec6Weapon === "yes" && (data.secondAbuseWeaponDetail ?? "").trim()) {
      missing.push({
        label: "6c. Weapon description",
        pdfFieldName: PDF_PAGE4_WEAPON_DETAIL,
      });
    }
  }

  const sec6Harm = data.secondAbuseHarm;
  try {
    if (sec6Harm === "no") {
      const rg = pdfForm.getRadioGroup(PDF_PAGE4_HARM_RADIO);
      rg.select(PDF_PAGE4_HARM_NO_OPT);
      filled.push({
        label: "6d. Harm (no)",
        pdfFieldName: PDF_PAGE4_HARM_RADIO,
      });
    } else if (sec6Harm === "yes") {
      const rg = pdfForm.getRadioGroup(PDF_PAGE4_HARM_RADIO);
      rg.select(PDF_PAGE4_HARM_YES_OPT);
      filled.push({
        label: "6d. Harm (yes)",
        pdfFieldName: PDF_PAGE4_HARM_RADIO,
      });
    }
  } catch (err) {
    console.warn("Failed to map 6d harm radio", err);
    if (sec6Harm === "no" || sec6Harm === "yes") {
      missing.push({
        label: "6d. Emotional or physical harm",
        pdfFieldName: PDF_PAGE4_HARM_RADIO,
      });
    }
  }

  try {
    if (sec6Harm !== "yes") {
      const field = pdfForm.getTextField(PDF_PAGE4_HARM_DETAIL);
      field.setText("");
    }
  } catch (err) {
    console.warn("Failed to clear 6d harm detail", err);
  }

  try {
    const field = pdfForm.getTextField(PDF_PAGE4_HARM_DETAIL);
    const v = (data.secondAbuseHarmDetail ?? "").trim();
    if (sec6Harm === "yes" && field && v) {
      field.setText(v);
      filled.push({
        label: "6d. Harm description",
        pdfFieldName: PDF_PAGE4_HARM_DETAIL,
      });
    }
  } catch (err) {
    console.warn("Failed to map secondAbuseHarmDetail", err);
    if (sec6Harm === "yes" && (data.secondAbuseHarmDetail ?? "").trim()) {
      missing.push({
        label: "6d. Harm description",
        pdfFieldName: PDF_PAGE4_HARM_DETAIL,
      });
    }
  }

  const sec6Police = data.secondAbusePolice;
  if (sec6Police === "idk" || sec6Police === "no" || sec6Police === "yes") {
    try {
      pdfForm.getCheckBox(PDF_PAGE4_POLICE_IDK).uncheck();
    } catch {
      /* ignore */
    }
    try {
      pdfForm.getCheckBox(PDF_PAGE4_POLICE_NO).uncheck();
    } catch {
      /* ignore */
    }
    try {
      pdfForm.getCheckBox(PDF_PAGE4_POLICE_YES).uncheck();
    } catch {
      /* ignore */
    }
  }

  try {
    if (sec6Police === "idk") {
      pdfForm.getCheckBox(PDF_PAGE4_POLICE_IDK).check();
      filled.push({
        label: "6e. Police (idk)",
        pdfFieldName: PDF_PAGE4_POLICE_IDK,
      });
    }
  } catch (err) {
    console.warn("Failed to map 6e I dont know_4", err);
    if (sec6Police === "idk") {
      missing.push({
        label: "6e. Police (idk)",
        pdfFieldName: PDF_PAGE4_POLICE_IDK,
      });
    }
  }

  try {
    if (sec6Police === "no") {
      pdfForm.getCheckBox(PDF_PAGE4_POLICE_NO).check();
      filled.push({
        label: "6e. Police (no)",
        pdfFieldName: PDF_PAGE4_POLICE_NO,
      });
    }
  } catch (err) {
    console.warn("Failed to map 6e No_11", err);
    if (sec6Police === "no") {
      missing.push({
        label: "6e. Police (no)",
        pdfFieldName: PDF_PAGE4_POLICE_NO,
      });
    }
  }

  try {
    if (sec6Police === "yes") {
      pdfForm.getCheckBox(PDF_PAGE4_POLICE_YES).check();
      filled.push({
        label: "6e. Police (yes)",
        pdfFieldName: PDF_PAGE4_POLICE_YES,
      });
    }
  } catch (err) {
    console.warn("Failed to map 6e police Yes", err);
    if (sec6Police === "yes") {
      missing.push({
        label: "6e. Police (yes)",
        pdfFieldName: PDF_PAGE4_POLICE_YES,
      });
    }
  }

  try {
    const field = pdfForm.getTextField(PDF_PAGE4_ABUSE_DETAILS);
    const v = (data.secondAbuseDetails ?? "").trim();
    if (field && v) {
      field.setText(v);
      filled.push({
        label: "6f. Details of abuse",
        pdfFieldName: PDF_PAGE4_ABUSE_DETAILS,
      });
    }
  } catch (err) {
    console.warn("Failed to map secondAbuseDetails", err);
    if ((data.secondAbuseDetails ?? "").trim()) {
      missing.push({
        label: "6f. Details of abuse",
        pdfFieldName: PDF_PAGE4_ABUSE_DETAILS,
      });
    }
  }

  const sec6Freq = data.secondAbuseFrequency;
  const page4FreqBoxes = [
    PDF_PAGE4_FREQ_ONCE,
    PDF_PAGE4_FREQ_25,
    PDF_PAGE4_FREQ_WEEKLY,
    PDF_PAGE4_FREQ_OTHER,
  ] as const;
  for (const name of page4FreqBoxes) {
    try {
      pdfForm.getCheckBox(name).uncheck();
    } catch {
      /* ignore */
    }
  }

  try {
    if (sec6Freq === "once") {
      pdfForm.getCheckBox(PDF_PAGE4_FREQ_ONCE).check();
      filled.push({
        label: "6g. Frequency: once",
        pdfFieldName: PDF_PAGE4_FREQ_ONCE,
      });
    }
  } catch (err) {
    console.warn("Failed to map 6g Just this once_2", err);
    if (sec6Freq === "once") {
      missing.push({
        label: "6g. Frequency: once",
        pdfFieldName: PDF_PAGE4_FREQ_ONCE,
      });
    }
  }

  try {
    if (sec6Freq === "2-5") {
      pdfForm.getCheckBox(PDF_PAGE4_FREQ_25).check();
      filled.push({
        label: "6g. Frequency: 2–5",
        pdfFieldName: PDF_PAGE4_FREQ_25,
      });
    }
  } catch (err) {
    console.warn("Failed to map 6g 25 times_2", err);
    if (sec6Freq === "2-5") {
      missing.push({
        label: "6g. Frequency: 2–5",
        pdfFieldName: PDF_PAGE4_FREQ_25,
      });
    }
  }

  try {
    if (sec6Freq === "weekly") {
      pdfForm.getCheckBox(PDF_PAGE4_FREQ_WEEKLY).check();
      filled.push({
        label: "6g. Frequency: weekly",
        pdfFieldName: PDF_PAGE4_FREQ_WEEKLY,
      });
    }
  } catch (err) {
    console.warn("Failed to map 6g Weekly_2", err);
    if (sec6Freq === "weekly") {
      missing.push({
        label: "6g. Frequency: weekly",
        pdfFieldName: PDF_PAGE4_FREQ_WEEKLY,
      });
    }
  }

  try {
    if (sec6Freq === "other") {
      pdfForm.getCheckBox(PDF_PAGE4_FREQ_OTHER).check();
      filled.push({
        label: "6g. Frequency: other",
        pdfFieldName: PDF_PAGE4_FREQ_OTHER,
      });
    }
  } catch (err) {
    console.warn("Failed to map 6g Other_2", err);
    if (sec6Freq === "other") {
      missing.push({
        label: "6g. Frequency: other",
        pdfFieldName: PDF_PAGE4_FREQ_OTHER,
      });
    }
  }

  try {
    if (sec6Freq !== "other") {
      const field = pdfForm.getTextField(PDF_PAGE4_FREQ_OTHER_TEXT);
      field.setText("");
    }
  } catch (err) {
    console.warn("Failed to clear 6g frequency other text", err);
  }

  try {
    const field = pdfForm.getTextField(PDF_PAGE4_FREQ_OTHER_TEXT);
    const v = (data.secondAbuseFrequencyOther ?? "").trim();
    if (sec6Freq === "other" && field && v) {
      field.setText(v);
      filled.push({
        label: "6g. Frequency (other)",
        pdfFieldName: PDF_PAGE4_FREQ_OTHER_TEXT,
      });
    }
  } catch (err) {
    console.warn("Failed to map secondAbuseFrequencyOther", err);
    if (sec6Freq === "other" && (data.secondAbuseFrequencyOther ?? "").trim()) {
      missing.push({
        label: "6g. Frequency (other)",
        pdfFieldName: PDF_PAGE4_FREQ_OTHER_TEXT,
      });
    }
  }

  const sec6DatesApply =
    typeof sec6Freq === "string" &&
    (sec6Freq === "2-5" || sec6Freq === "weekly" || sec6Freq === "other");

  try {
    if (!sec6DatesApply) {
      const field = pdfForm.getTextField(PDF_PAGE4_FREQ_DATES);
      field.setText("");
    }
  } catch (err) {
    console.warn("Failed to clear 6g dates field", err);
  }

  try {
    const field = pdfForm.getTextField(PDF_PAGE4_FREQ_DATES);
    const v = (data.secondAbuseDates ?? "").trim();
    if (sec6DatesApply && field && v) {
      field.setText(v);
      filled.push({
        label: "6g. Dates or estimates",
        pdfFieldName: PDF_PAGE4_FREQ_DATES,
      });
    }
  } catch (err) {
    console.warn("Failed to map secondAbuseDates", err);
    if (sec6DatesApply && (data.secondAbuseDates ?? "").trim()) {
      missing.push({
        label: "6g. Dates or estimates",
        pdfFieldName: PDF_PAGE4_FREQ_DATES,
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
