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
  rgb,
  StandardFonts,
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

export type Dv100ProtectedPerson = {
  name: string;
  age: string;
  relationship: string;
  livesWithYou: null | "Yes" | "No";
};

export type Dv100FirearmRow = {
  description: string;
  amount: string;
  location: string;
};

/** Section 16 — up to four animals (DV-100 Page 9). */
export type Dv100ProtectedAnimal = {
  name: string;
  type: string;
  breed: string;
  color: string;
};

/** Section 22a — up to three debts (DV-100 Page 10). */
export type Dv100PayDebtRow = {
  payTo: string;
  payFor: string;
  amount: string;
  dueDate: string;
};

/**
 * Wizard answers written into the PDF by {@link generateDV100PDF}.
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
  /** Section 7 — third incident of abuse (DV-100 Page 5) */
  thirdAbuseDate: string;
  thirdAbuseWitnesses: string;
  thirdAbuseWitnessDetail: string;
  thirdAbuseWeapon: string;
  thirdAbuseWeaponDetail: string;
  thirdAbuseHarm: string;
  thirdAbuseHarmDetail: string;
  thirdAbusePolice: string;
  thirdAbuseDetails: string;
  thirdAbuseFrequency: string;
  thirdAbuseFrequencyOther: string;
  thirdAbuseDates: string;
  /** Section 8 — other people needing protection (DV-100 Page 6): no | yes | "" */
  protectOtherPeople: "" | "no" | "yes";
  protectedPeople: Dv100ProtectedPerson[];
  protectedPeopleWhy: string;
  /** Section 9 — firearms: idk | no | yes | "" */
  hasFirearms: "" | "idk" | "no" | "yes";
  firearms: Dv100FirearmRow[];
  /** Section 10 */
  orderToNotAbuse: boolean;
  /** Section 11 */
  noContactOrder: boolean;
  /** Section 12 master */
  stayAwayOrder: boolean;
  stayAwayMe: boolean;
  stayAwayHome: boolean;
  stayAwayWork: boolean;
  stayAwayVehicle: boolean;
  stayAwaySchool: boolean;
  stayAwayProtectedPersons: boolean;
  stayAwayChildrenSchool: boolean;
  stayAwayOther: boolean;
  stayAwayOtherExplain: string;
  /** 12b — distance: '' | 'hundred' | 'other' */
  stayAwayDistance: "" | "hundred" | "other";
  stayAwayDistanceOther: string;
  /** 12c */
  liveTogether: "" | "no" | "yes";
  liveTogetherType: "" | "liveTogether" | "sameBuilding" | "sameNeighborhood" | "other";
  liveTogetherOther: string;
  /** 12d */
  sameWorkplaceSchool: "" | "no" | "yes";
  workTogether: boolean;
  workTogetherCompany: string;
  sameSchool: boolean;
  sameSchoolName: string;
  sameWorkplaceOther: boolean;
  sameWorkplaceOtherExplain: string;
  /** Section 13 — DV-100 Page 8 */
  orderToMoveOut: boolean;
  /** 13a — maps to `a I ask the judge to order the person in  2` */
  moveOutOrderPersonAsk: string;
  moveOutOwnHome: boolean;
  moveOutNameOnLease: boolean;
  moveOutWithChildren: boolean;
  moveOutLivedFor: boolean;
  moveOutLivedYears: string;
  moveOutLivedMonths: string;
  moveOutPaysRent: boolean;
  moveOutOther: boolean;
  moveOutOtherExplain: string;
  /** Section 14 */
  otherOrders: boolean;
  otherOrdersDescribe: string;
  /** Section 15 — checkbox only; DV-105 is separate */
  childCustodyVisitation: boolean;
  /** Section 16 — Protect Animals (DV-100 Page 9) */
  protectAnimals: boolean;
  protectedAnimals: Dv100ProtectedAnimal[];
  protectAnimalsStayAway: boolean;
  /** 16b1 — '' | 'hundred' | 'other' */
  protectAnimalsStayAwayDistance: "" | "hundred" | "other";
  protectAnimalsStayAwayOtherYards: string;
  protectAnimalsNotTake: boolean;
  protectAnimalsSolePossession: boolean;
  protectAnimalsSoleReasonAbuse: boolean;
  protectAnimalsSoleReasonCare: boolean;
  protectAnimalsSoleReasonPurchased: boolean;
  protectAnimalsSoleReasonOther: boolean;
  protectAnimalsSoleReasonOtherExplain: string;
  /** Section 17 */
  controlProperty: boolean;
  controlPropertyDescribe: string;
  controlPropertyWhy: string;
  /** Section 18 */
  healthOtherInsurance: boolean;
  /** Section 19 */
  recordCommunications: boolean;
  /** Section 20 — property restraint (DV-100 Page 10) */
  propertyRestraint: boolean;
  /** Section 21 */
  extendNoticeDeadline: boolean;
  extendNoticeExplain: string;
  /** Section 22 master & grid */
  payDebtsForProperty: boolean;
  payDebtsRows: Dv100PayDebtRow[];
  payDebtsExplain: string;
  /** Section 22b — '' | 'yes' | 'no' */
  payDebtsSpecialDecision: "" | "yes" | "no";
  payDebtsAbuseDebt1: boolean;
  payDebtsAbuseDebt2: boolean;
  payDebtsAbuseDebt3: boolean;
  /** '' | 'yes' | 'no' */
  payDebtsKnowHow: "" | "yes" | "no";
  payDebtsExplainHow: string;
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

/** Section 7 — DV-100 Page 5 (exact AcroForm names) */
const PDF_PAGE5_ABUSE_DATE =
  "a Date of abuse give an estimate if you dont know the exact date_3";
const PDF_PAGE5_WITNESSES_RADIO =
  "b Did anyone else hear or see what happened on this day_2";
const PDF_PAGE5_WITNESS_IDK_OPT = "I dont know_5";
const PDF_PAGE5_WITNESS_NO_OPT = "No_12";
const PDF_PAGE5_WITNESS_YES_OPT = "Yes_5";
const PDF_PAGE5_WITNESS_DETAIL = "If yes give names";
const PDF_PAGE5_WEAPON_NO = "No_13";
const PDF_PAGE5_WEAPON_YES = "Yes If yes describe gun or weapon_2";
const PDF_PAGE5_WEAPON_DETAIL = "2 use or threaten to use a gun or other weapon";
const PDF_PAGE5_HARM_NO = "No_14";
const PDF_PAGE5_HARM_YES = "Yes If yes describe harm_2";
const PDF_PAGE5_HARM_DETAIL = "7d emotional or physical harm";
const PDF_PAGE5_POLICE_IDK = "I dont know_6";
const PDF_PAGE5_POLICE_NO = "No_15";
const PDF_PAGE5_POLICE_YES =
  "Yes If the police gave you a restraining order list it in  4_3";
const PDF_PAGE5_ABUSE_DETAILS = "7f details of abuse";
const PDF_PAGE5_NEED_MORE_SPACE =
  "Check this box if you need more space to describe the abuse You can use form DV101 Description of";
const PDF_PAGE5_FREQ_ONCE = "Just this once_3";
const PDF_PAGE5_FREQ_25 = "25 times_3";
const PDF_PAGE5_FREQ_WEEKLY = "Weekly_3";
const PDF_PAGE5_FREQ_OTHER = "Other_3";
const PDF_PAGE5_FREQ_OTHER_TEXT = "undefined_9";
const PDF_PAGE5_FREQ_DATES = "7g dates or estimates of when it happened";

/** Section 8–9 — DV-100 Page 6 */
const PDF_PAGE6_8A_NO = "No_16";
const PDF_PAGE6_8B_YES = "Yes If yes complete the section below";
const PDF_PAGE6_PROTECTED_NAMES = [
  "1 Full name 1",
  "1 Full name 2",
  "1 Full name 3",
  "1 Full name 4",
] as const;
const PDF_PAGE6_PROTECTED_AGES = ["Age 1", "Age 2", "Age 3", "Age 4"] as const;
const PDF_PAGE6_PROTECTED_REL = [
  "Relationship to you 1",
  "Relationship to you 2",
  "Relationship to you 3",
  "Relationship to you 4",
] as const;
const PDF_PAGE6_LIVES_YES = [
  "lives_yes_1",
  "lives_yes_2",
  "lives_yes_3",
  "lives_yes_4",
] as const;
const PDF_PAGE6_LIVES_NO = [
  "lives_no_1",
  "lives_no_2",
  "lives_no_3",
  "lives_no_4",
] as const;
const PDF_PAGE6_8B2_WHY = "8b2 why do these people need protection";
const PDF_PAGE6_MORE_PEOPLE_BOX =
  "Check this box if you need to list more people";
const PDF_PAGE6_9A_IDK = "I dont know_7";
const PDF_PAGE6_9B_NO = "No_21";
const PDF_PAGE6_9C_YES = "Yes If you have information complete the section below";
const PDF_PAGE6_FIREARM_DESC = ["1_5_1", "2_5", "3_2", "4", "5", "6"] as const;
const PDF_PAGE6_FIREARM_AMT = ["1_5", "2_6", "3_3", "4_2", "5_2", "6_2"] as const;
const PDF_PAGE6_FIREARM_LOC = [
  "Location if known 1",
  "Location if known 2",
  "Location if known 3",
  "Location if known 4",
  "Location if known 5",
  "Location if known 6",
] as const;

/** Section 10–12 — DV-100 Page 7 (exact AcroForm names) */
const PDF_PAGE7_ORDER_NOT_ABUSE = "Order to Not Abuse";
const PDF_PAGE7_NO_CONTACT = "NoContact Order";
const PDF_PAGE7_STAY_AWAY_MASTER = "StayAway Order";
const PDF_PAGE7_12A_CHECKBOXES: { dataKey: keyof Dv100PdfFormData; pdfName: string }[] = [
  { dataKey: "stayAwayMe", pdfName: "Me" },
  { dataKey: "stayAwayHome", pdfName: "My home" },
  { dataKey: "stayAwayWork", pdfName: "My job or workplace" },
  { dataKey: "stayAwayVehicle", pdfName: "My vehicle" },
  { dataKey: "stayAwaySchool", pdfName: "My school" },
  { dataKey: "stayAwayProtectedPersons", pdfName: "Each person in" },
  { dataKey: "stayAwayChildrenSchool", pdfName: "My childrens school or childcare" },
  { dataKey: "stayAwayOther", pdfName: "Other please explain" },
];
const PDF_PAGE7_12A_OTHER_TEXT = "12a Other please explain";
const PDF_PAGE7_12B_100 = "100 yards 300 feet";
const PDF_PAGE7_12B_OTHER_CB = "Other give distance in yards";
const PDF_PAGE7_12B_OTHER_TEXT = "undefined_12";
const PDF_PAGE7_12C_NO = "No_22";
const PDF_PAGE7_12C_YES = "Yes If yes check one";
/** PDF uses two spaces before `2` */
const PDF_PAGE7_12C_LIVE_TOGETHER =
  "Live together If you live together you can ask that the person in  2";
const PDF_PAGE7_12C_SAME_BUILDING = "Live in the same building but not in the same home";
const PDF_PAGE7_12C_SAME_NEIGHBORHOOD = "Live in the same neighborhood";
const PDF_PAGE7_12C_OTHER_CB = "Other please explain_2";
const PDF_PAGE7_12C_OTHER_TEXT = "undefined_13";
const PDF_PAGE7_12D_NO = "No_23";
const PDF_PAGE7_12D_YES = "Yes If yes check all that apply";
const PDF_PAGE7_12D_WORK_CB = "Work together at name of company";
const PDF_PAGE7_12D_WORK_TEXT = "undefined_14";
const PDF_PAGE7_12D_SCHOOL_CB = "Go to the same school name of school";
const PDF_PAGE7_12D_SCHOOL_TEXT = "undefined_15";
const PDF_PAGE7_12D_OTHER_CB = "Other please explain_3";
const PDF_PAGE7_12D_OTHER_TEXT = "12d Other please explain";

/** Sections 13–15 — DV-100 Page 8 */
const PDF_PAGE8_ORDER_MOVE_OUT = "Order to Move Out";
const PDF_PAGE8_13A_PERSON_ASK = "a I ask the judge to order the person in  2";
type Dv100Page8MoveOut13bKey =
  | "moveOutOwnHome"
  | "moveOutNameOnLease"
  | "moveOutWithChildren"
  | "moveOutLivedFor"
  | "moveOutPaysRent"
  | "moveOutOther";
const PDF_PAGE8_13B_CHECKBOXES: { dataKey: Dv100Page8MoveOut13bKey; pdfName: string }[] = [
  { dataKey: "moveOutOwnHome", pdfName: "I own the home" },
  { dataKey: "moveOutNameOnLease", pdfName: "My name is on the lease" },
  { dataKey: "moveOutWithChildren", pdfName: "I live at this address with my children" },
  { dataKey: "moveOutLivedFor", pdfName: "I have lived at this address for" },
  { dataKey: "moveOutPaysRent", pdfName: "I pay for some or all the rent or mortgage" },
  { dataKey: "moveOutOther", pdfName: "Other please explain_4" },
];
const PDF_PAGE8_YEARS = "years";
const PDF_PAGE8_MONTHS = "months";
const PDF_PAGE8_13B_OTHER_TEXT = "13b other explain";
const PDF_PAGE8_OTHER_ORDERS = "Other Orders";
const PDF_PAGE8_14_DESCRIBE = "14 describe additional orders";
const PDF_PAGE8_CHILD_CUSTODY = "Child Custody and Visitation";

// --- DV-100 Page 9 — Sections 16–19 ---

const PDF_16_MASTER = "Protect Animals";
const PDF_16A_NAME_1 = "16a name 1";
const PDF_16A_NAME_2 = "16a name 2";
const PDF_16A_NAME_3 = "16a name 3";
const PDF_16A_NAME_4 = "16a name 4";
const PDF_16A_TYPE_1 = "Type of animal 1";
const PDF_16A_TYPE_2 = "Type of animal 2";
const PDF_16A_TYPE_3 = "Type of animal 3";
const PDF_16A_TYPE_4 = "Type of animal 4";
const PDF_16A_BREED_1 = "Breed if known 1";
const PDF_16A_BREED_2 = "Breed if known 2";
const PDF_16A_BREED_3 = "Breed if known 3";
const PDF_16A_BREED_4 = "Breed if known 4";
const PDF_16A_COLOR_1 = "Color 1";
const PDF_16A_COLOR_2 = "Color 2";
const PDF_16A_COLOR_3 = "Color 3";
const PDF_16A_COLOR_4 = "Color 4";
const PDF_16B1_STAY_AWAY_CHECK = "Stay away from the animals by at least";
const PDF_16B1_100_YARDS = "100 yards 300 feet_2";
const PDF_16B1_OTHER_YARDS_CHECK = "Other number of yards";
const PDF_16B1_OTHER_YARDS_TEXT = "undefined_18";
const PDF_16B2_NOT_TAKE = "Not take";
const PDF_16B3_SOLE_POSSESSION = "Give me sole possession";
const PDF_16B3_REASON_ABUSE = "Person in";
const PDF_16B3_REASON_CARE = "I take care of these animals";
const PDF_16B3_REASON_PURCHASED = "I purchased these animals";
const PDF_16B3_REASON_OTHER_CHECK = "16b3 Other please explain_5";
const PDF_16B3_REASON_OTHER_TEXT = "16b3 Other explain";
const PDF_17_MASTER = "Control of Property";
const PDF_17A_TEXT = "17a property list";
const PDF_17B_TEXT = "17b property control explain";
const PDF_18_MASTER = "Health and Other Insurance";
const PDF_19_MASTER = "Record Communications";

// Sections 20 & 21
const PDF_20_MASTER = "Property Restraint";
const PDF_21_MASTER = "Extend my deadline to give notice to person in 2";
const PDF_21_TEXT = "21 explain more time";

// Section 22 Master & Grid
const PDF_22_MASTER = "Pay Debts Bills Owed for Property";
const PDF_22A_PAY_TO_1 = "1 Pay to";
const PDF_22A_PAY_TO_2 = "2 Pay to";
const PDF_22A_PAY_TO_3 = "3 Pay to";
const PDF_22A_FOR_1 = "For";
const PDF_22A_FOR_2 = "For_2";
const PDF_22A_FOR_3 = "For_3";
const PDF_22A_AMOUNT_1 = "Amount";
const PDF_22A_AMOUNT_2 = "Amount_2";
const PDF_22A_AMOUNT_3 = "Amount_3";
const PDF_22A_DUE_1 = "Due date";
const PDF_22A_DUE_2 = "Due date_2";
const PDF_22A_DUE_3 = "Due date_3";
const PDF_22A_EXPLAIN = "22a explain pay debts";

// Section 22b Special Decision
const PDF_22B_SPECIAL_DECISION_RADIO_GROUP =
  "Do you want the judge to make this special decision finding";
const PDF_22B_SPECIAL_DECISION_YES = "Yes_10";
const PDF_22B_SPECIAL_DECISION_NO = "No_24";
const PDF_22B_DEBT_CHECK_1 = "a1";
const PDF_22B_DEBT_CHECK_2 = "a2";
const PDF_22B_DEBT_CHECK_3 = "a3";
const PDF_22B_KNOW_HOW_RADIO_GROUP = "2 Do you know how the person in";
const PDF_22B_KNOW_HOW_YES = "Yes_11";
const PDF_22B_KNOW_HOW_NO = "No_25";
const PDF_22B_EXPLAIN_HOW = "22b2 Explain how 2 made debts";

const PDF_PAGE9_ANIMAL_NAMES = [
  PDF_16A_NAME_1,
  PDF_16A_NAME_2,
  PDF_16A_NAME_3,
  PDF_16A_NAME_4,
] as const;
const PDF_PAGE9_ANIMAL_TYPES = [
  PDF_16A_TYPE_1,
  PDF_16A_TYPE_2,
  PDF_16A_TYPE_3,
  PDF_16A_TYPE_4,
] as const;
const PDF_PAGE9_ANIMAL_BREEDS = [
  PDF_16A_BREED_1,
  PDF_16A_BREED_2,
  PDF_16A_BREED_3,
  PDF_16A_BREED_4,
] as const;
const PDF_PAGE9_ANIMAL_COLORS = [
  PDF_16A_COLOR_1,
  PDF_16A_COLOR_2,
  PDF_16A_COLOR_3,
  PDF_16A_COLOR_4,
] as const;

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

  // --- DV-100 Page 5 — Section 7 (third incident of abuse) ---
  try {
    const field = pdfForm.getTextField(PDF_PAGE5_ABUSE_DATE);
    const v = (data.thirdAbuseDate ?? "").trim();
    if (field && v) {
      field.setText(v);
      filled.push({
        label: "7a. Date of abuse (incident 3)",
        pdfFieldName: PDF_PAGE5_ABUSE_DATE,
      });
    }
  } catch (err) {
    console.warn("Failed to map thirdAbuseDate", err);
    if ((data.thirdAbuseDate ?? "").trim()) {
      missing.push({
        label: "7a. Date of abuse (incident 3)",
        pdfFieldName: PDF_PAGE5_ABUSE_DATE,
      });
    }
  }

  const sec7Witness =
    typeof data.thirdAbuseWitnesses === "string"
      ? data.thirdAbuseWitnesses
      : "";
  try {
    if (sec7Witness === "idk") {
      const rg = pdfForm.getRadioGroup(PDF_PAGE5_WITNESSES_RADIO);
      rg.select(PDF_PAGE5_WITNESS_IDK_OPT);
      filled.push({
        label: "7b. Witnesses (idk)",
        pdfFieldName: PDF_PAGE5_WITNESSES_RADIO,
      });
    } else if (sec7Witness === "no") {
      const rg = pdfForm.getRadioGroup(PDF_PAGE5_WITNESSES_RADIO);
      rg.select(PDF_PAGE5_WITNESS_NO_OPT);
      filled.push({
        label: "7b. Witnesses (no)",
        pdfFieldName: PDF_PAGE5_WITNESSES_RADIO,
      });
    } else if (sec7Witness === "yes") {
      const rg = pdfForm.getRadioGroup(PDF_PAGE5_WITNESSES_RADIO);
      rg.select(PDF_PAGE5_WITNESS_YES_OPT);
      filled.push({
        label: "7b. Witnesses (yes)",
        pdfFieldName: PDF_PAGE5_WITNESSES_RADIO,
      });
    }
  } catch (err) {
    console.warn("Failed to map 7b witnesses radio", err);
    if (sec7Witness === "idk" || sec7Witness === "no" || sec7Witness === "yes") {
      missing.push({
        label: "7b. Witnesses",
        pdfFieldName: PDF_PAGE5_WITNESSES_RADIO,
      });
    }
  }

  try {
    if (sec7Witness !== "yes") {
      const field = pdfForm.getTextField(PDF_PAGE5_WITNESS_DETAIL);
      field.setText("");
    }
  } catch (err) {
    console.warn("Failed to clear 7b witness detail", err);
  }

  try {
    const field = pdfForm.getTextField(PDF_PAGE5_WITNESS_DETAIL);
    const v = (data.thirdAbuseWitnessDetail ?? "").trim();
    if (sec7Witness === "yes" && field && v) {
      field.setText(v);
      filled.push({
        label: "7b. Witness names / details",
        pdfFieldName: PDF_PAGE5_WITNESS_DETAIL,
      });
    }
  } catch (err) {
    console.warn("Failed to map thirdAbuseWitnessDetail", err);
    if (sec7Witness === "yes" && (data.thirdAbuseWitnessDetail ?? "").trim()) {
      missing.push({
        label: "7b. Witness names / details",
        pdfFieldName: PDF_PAGE5_WITNESS_DETAIL,
      });
    }
  }

  const sec7Weapon =
    typeof data.thirdAbuseWeapon === "string" ? data.thirdAbuseWeapon : "";
  if (sec7Weapon === "no" || sec7Weapon === "yes") {
    try {
      pdfForm.getCheckBox(PDF_PAGE5_WEAPON_NO).uncheck();
    } catch {
      /* ignore */
    }
    try {
      pdfForm.getCheckBox(PDF_PAGE5_WEAPON_YES).uncheck();
    } catch {
      /* ignore */
    }
  }

  try {
    if (sec7Weapon === "no") {
      pdfForm.getCheckBox(PDF_PAGE5_WEAPON_NO).check();
      filled.push({
        label: "7c. Weapon (no)",
        pdfFieldName: PDF_PAGE5_WEAPON_NO,
      });
    }
  } catch (err) {
    console.warn("Failed to map 7c No_13", err);
    if (sec7Weapon === "no") {
      missing.push({
        label: "7c. Weapon (no)",
        pdfFieldName: PDF_PAGE5_WEAPON_NO,
      });
    }
  }

  try {
    if (sec7Weapon === "yes") {
      pdfForm.getCheckBox(PDF_PAGE5_WEAPON_YES).check();
      filled.push({
        label: "7c. Weapon (yes)",
        pdfFieldName: PDF_PAGE5_WEAPON_YES,
      });
    }
  } catch (err) {
    console.warn("Failed to map 7c weapon yes", err);
    if (sec7Weapon === "yes") {
      missing.push({
        label: "7c. Weapon (yes)",
        pdfFieldName: PDF_PAGE5_WEAPON_YES,
      });
    }
  }

  try {
    if (sec7Weapon !== "yes") {
      const field = pdfForm.getTextField(PDF_PAGE5_WEAPON_DETAIL);
      field.setText("");
    }
  } catch (err) {
    console.warn("Failed to clear 7c weapon detail", err);
  }

  try {
    const field = pdfForm.getTextField(PDF_PAGE5_WEAPON_DETAIL);
    const v = (data.thirdAbuseWeaponDetail ?? "").trim();
    if (sec7Weapon === "yes" && field && v) {
      field.setText(v);
      filled.push({
        label: "7c. Weapon description",
        pdfFieldName: PDF_PAGE5_WEAPON_DETAIL,
      });
    }
  } catch (err) {
    console.warn("Failed to map thirdAbuseWeaponDetail", err);
    if (sec7Weapon === "yes" && (data.thirdAbuseWeaponDetail ?? "").trim()) {
      missing.push({
        label: "7c. Weapon description",
        pdfFieldName: PDF_PAGE5_WEAPON_DETAIL,
      });
    }
  }

  const sec7Harm =
    typeof data.thirdAbuseHarm === "string" ? data.thirdAbuseHarm : "";
  if (sec7Harm === "no" || sec7Harm === "yes") {
    try {
      pdfForm.getCheckBox(PDF_PAGE5_HARM_NO).uncheck();
    } catch {
      /* ignore */
    }
    try {
      pdfForm.getCheckBox(PDF_PAGE5_HARM_YES).uncheck();
    } catch {
      /* ignore */
    }
  }

  try {
    if (sec7Harm === "no") {
      pdfForm.getCheckBox(PDF_PAGE5_HARM_NO).check();
      filled.push({
        label: "7d. Harm (no)",
        pdfFieldName: PDF_PAGE5_HARM_NO,
      });
    }
  } catch (err) {
    console.warn("Failed to map 7d No_14", err);
    if (sec7Harm === "no") {
      missing.push({
        label: "7d. Harm (no)",
        pdfFieldName: PDF_PAGE5_HARM_NO,
      });
    }
  }

  try {
    if (sec7Harm === "yes") {
      pdfForm.getCheckBox(PDF_PAGE5_HARM_YES).check();
      filled.push({
        label: "7d. Harm (yes)",
        pdfFieldName: PDF_PAGE5_HARM_YES,
      });
    }
  } catch (err) {
    console.warn("Failed to map 7d harm yes", err);
    if (sec7Harm === "yes") {
      missing.push({
        label: "7d. Harm (yes)",
        pdfFieldName: PDF_PAGE5_HARM_YES,
      });
    }
  }

  try {
    if (sec7Harm !== "yes") {
      const field = pdfForm.getTextField(PDF_PAGE5_HARM_DETAIL);
      field.setText("");
    }
  } catch (err) {
    console.warn("Failed to clear 7d harm detail", err);
  }

  try {
    const field = pdfForm.getTextField(PDF_PAGE5_HARM_DETAIL);
    const v = (data.thirdAbuseHarmDetail ?? "").trim();
    if (sec7Harm === "yes" && field && v) {
      field.setText(v);
      filled.push({
        label: "7d. Harm description",
        pdfFieldName: PDF_PAGE5_HARM_DETAIL,
      });
    }
  } catch (err) {
    console.warn("Failed to map thirdAbuseHarmDetail", err);
    if (sec7Harm === "yes" && (data.thirdAbuseHarmDetail ?? "").trim()) {
      missing.push({
        label: "7d. Harm description",
        pdfFieldName: PDF_PAGE5_HARM_DETAIL,
      });
    }
  }

  const sec7Police =
    typeof data.thirdAbusePolice === "string" ? data.thirdAbusePolice : "";
  if (sec7Police === "idk" || sec7Police === "no" || sec7Police === "yes") {
    try {
      pdfForm.getCheckBox(PDF_PAGE5_POLICE_IDK).uncheck();
    } catch {
      /* ignore */
    }
    try {
      pdfForm.getCheckBox(PDF_PAGE5_POLICE_NO).uncheck();
    } catch {
      /* ignore */
    }
    try {
      pdfForm.getCheckBox(PDF_PAGE5_POLICE_YES).uncheck();
    } catch {
      /* ignore */
    }
  }

  try {
    if (sec7Police === "idk") {
      pdfForm.getCheckBox(PDF_PAGE5_POLICE_IDK).check();
      filled.push({
        label: "7e. Police (idk)",
        pdfFieldName: PDF_PAGE5_POLICE_IDK,
      });
    }
  } catch (err) {
    console.warn("Failed to map 7e I dont know_6", err);
    if (sec7Police === "idk") {
      missing.push({
        label: "7e. Police (idk)",
        pdfFieldName: PDF_PAGE5_POLICE_IDK,
      });
    }
  }

  try {
    if (sec7Police === "no") {
      pdfForm.getCheckBox(PDF_PAGE5_POLICE_NO).check();
      filled.push({
        label: "7e. Police (no)",
        pdfFieldName: PDF_PAGE5_POLICE_NO,
      });
    }
  } catch (err) {
    console.warn("Failed to map 7e No_15", err);
    if (sec7Police === "no") {
      missing.push({
        label: "7e. Police (no)",
        pdfFieldName: PDF_PAGE5_POLICE_NO,
      });
    }
  }

  try {
    if (sec7Police === "yes") {
      pdfForm.getCheckBox(PDF_PAGE5_POLICE_YES).check();
      filled.push({
        label: "7e. Police (yes)",
        pdfFieldName: PDF_PAGE5_POLICE_YES,
      });
    }
  } catch (err) {
    console.warn("Failed to map 7e police yes", err);
    if (sec7Police === "yes") {
      missing.push({
        label: "7e. Police (yes)",
        pdfFieldName: PDF_PAGE5_POLICE_YES,
      });
    }
  }

  try {
    const field = pdfForm.getTextField(PDF_PAGE5_ABUSE_DETAILS);
    const v = (data.thirdAbuseDetails ?? "").trim();
    if (field && v) {
      field.setText(v);
      filled.push({
        label: "7f. Details of abuse",
        pdfFieldName: PDF_PAGE5_ABUSE_DETAILS,
      });
    }
  } catch (err) {
    console.warn("Failed to map thirdAbuseDetails", err);
    if ((data.thirdAbuseDetails ?? "").trim()) {
      missing.push({
        label: "7f. Details of abuse",
        pdfFieldName: PDF_PAGE5_ABUSE_DETAILS,
      });
    }
  }

  const sec7DetailsTrimmed = (data.thirdAbuseDetails ?? "").trim();
  try {
    if (sec7DetailsTrimmed.length > 0) {
      pdfForm.getCheckBox(PDF_PAGE5_NEED_MORE_SPACE).check();
      filled.push({
        label: "7f. Need more space (addendum)",
        pdfFieldName: PDF_PAGE5_NEED_MORE_SPACE,
      });
    } else {
      pdfForm.getCheckBox(PDF_PAGE5_NEED_MORE_SPACE).uncheck();
    }
  } catch (err) {
    console.warn("Failed to map 7f need-more-space checkbox", err);
    if (sec7DetailsTrimmed.length > 0) {
      missing.push({
        label: "7f. Need more space (addendum)",
        pdfFieldName: PDF_PAGE5_NEED_MORE_SPACE,
      });
    }
  }

  const sec7Freq =
    typeof data.thirdAbuseFrequency === "string"
      ? data.thirdAbuseFrequency
      : "";
  const page5FreqBoxes = [
    PDF_PAGE5_FREQ_ONCE,
    PDF_PAGE5_FREQ_25,
    PDF_PAGE5_FREQ_WEEKLY,
    PDF_PAGE5_FREQ_OTHER,
  ] as const;
  for (const name of page5FreqBoxes) {
    try {
      pdfForm.getCheckBox(name).uncheck();
    } catch {
      /* ignore */
    }
  }

  try {
    if (sec7Freq === "once") {
      pdfForm.getCheckBox(PDF_PAGE5_FREQ_ONCE).check();
      filled.push({
        label: "7g. Frequency: once",
        pdfFieldName: PDF_PAGE5_FREQ_ONCE,
      });
    }
  } catch (err) {
    console.warn("Failed to map 7g Just this once_3", err);
    if (sec7Freq === "once") {
      missing.push({
        label: "7g. Frequency: once",
        pdfFieldName: PDF_PAGE5_FREQ_ONCE,
      });
    }
  }

  try {
    if (sec7Freq === "2-5") {
      pdfForm.getCheckBox(PDF_PAGE5_FREQ_25).check();
      filled.push({
        label: "7g. Frequency: 2–5",
        pdfFieldName: PDF_PAGE5_FREQ_25,
      });
    }
  } catch (err) {
    console.warn("Failed to map 7g 25 times_3", err);
    if (sec7Freq === "2-5") {
      missing.push({
        label: "7g. Frequency: 2–5",
        pdfFieldName: PDF_PAGE5_FREQ_25,
      });
    }
  }

  try {
    if (sec7Freq === "weekly") {
      pdfForm.getCheckBox(PDF_PAGE5_FREQ_WEEKLY).check();
      filled.push({
        label: "7g. Frequency: weekly",
        pdfFieldName: PDF_PAGE5_FREQ_WEEKLY,
      });
    }
  } catch (err) {
    console.warn("Failed to map 7g Weekly_3", err);
    if (sec7Freq === "weekly") {
      missing.push({
        label: "7g. Frequency: weekly",
        pdfFieldName: PDF_PAGE5_FREQ_WEEKLY,
      });
    }
  }

  try {
    if (sec7Freq === "other") {
      pdfForm.getCheckBox(PDF_PAGE5_FREQ_OTHER).check();
      filled.push({
        label: "7g. Frequency: other",
        pdfFieldName: PDF_PAGE5_FREQ_OTHER,
      });
    }
  } catch (err) {
    console.warn("Failed to map 7g Other_3", err);
    if (sec7Freq === "other") {
      missing.push({
        label: "7g. Frequency: other",
        pdfFieldName: PDF_PAGE5_FREQ_OTHER,
      });
    }
  }

  try {
    if (sec7Freq !== "other") {
      const field = pdfForm.getTextField(PDF_PAGE5_FREQ_OTHER_TEXT);
      field.setText("");
    }
  } catch (err) {
    console.warn("Failed to clear 7g frequency other text", err);
  }

  try {
    const field = pdfForm.getTextField(PDF_PAGE5_FREQ_OTHER_TEXT);
    const v = (data.thirdAbuseFrequencyOther ?? "").trim();
    if (sec7Freq === "other" && field && v) {
      field.setText(v);
      filled.push({
        label: "7g. Frequency (other)",
        pdfFieldName: PDF_PAGE5_FREQ_OTHER_TEXT,
      });
    }
  } catch (err) {
    console.warn("Failed to map thirdAbuseFrequencyOther", err);
    if (sec7Freq === "other" && (data.thirdAbuseFrequencyOther ?? "").trim()) {
      missing.push({
        label: "7g. Frequency (other)",
        pdfFieldName: PDF_PAGE5_FREQ_OTHER_TEXT,
      });
    }
  }

  const sec7DatesApply =
    typeof sec7Freq === "string" &&
    (sec7Freq === "2-5" || sec7Freq === "weekly" || sec7Freq === "other");

  try {
    if (!sec7DatesApply) {
      const field = pdfForm.getTextField(PDF_PAGE5_FREQ_DATES);
      field.setText("");
    }
  } catch (err) {
    console.warn("Failed to clear 7g dates field", err);
  }

  try {
    const field = pdfForm.getTextField(PDF_PAGE5_FREQ_DATES);
    const v = (data.thirdAbuseDates ?? "").trim();
    if (sec7DatesApply && field && v) {
      field.setText(v);
      filled.push({
        label: "7g. Dates or estimates",
        pdfFieldName: PDF_PAGE5_FREQ_DATES,
      });
    }
  } catch (err) {
    console.warn("Failed to map thirdAbuseDates", err);
    if (sec7DatesApply && (data.thirdAbuseDates ?? "").trim()) {
      missing.push({
        label: "7g. Dates or estimates",
        pdfFieldName: PDF_PAGE5_FREQ_DATES,
      });
    }
  }

  const protect =
    data.protectOtherPeople === "no" || data.protectOtherPeople === "yes"
      ? data.protectOtherPeople
      : "";
  const people = Array.isArray(data.protectedPeople) ? data.protectedPeople : [];
  const sec8Why = (data.protectedPeopleWhy ?? "").trim();

  try {
    pdfForm.getCheckBox(PDF_PAGE6_8A_NO).uncheck();
  } catch (err) {
    console.warn("Failed to uncheck Section 8 No_16", err);
  }
  try {
    pdfForm.getCheckBox(PDF_PAGE6_8B_YES).uncheck();
  } catch (err) {
    console.warn("Failed to uncheck Section 8 Yes", err);
  }

  if (protect === "no") {
    try {
      pdfForm.getCheckBox(PDF_PAGE6_8A_NO).check();
      filled.push({ label: "8a. Protect other people (No)", pdfFieldName: PDF_PAGE6_8A_NO });
    } catch (err) {
      console.warn("Failed to map Section 8 No_16", err);
      missing.push({ label: "8a. Protect other people (No)", pdfFieldName: PDF_PAGE6_8A_NO });
    }
  }

  if (protect === "yes") {
    try {
      pdfForm.getCheckBox(PDF_PAGE6_8B_YES).check();
      filled.push({
        label: "8b. Protect other people (Yes)",
        pdfFieldName: PDF_PAGE6_8B_YES,
      });
    } catch (err) {
      console.warn("Failed to map Section 8 Yes", err);
      missing.push({
        label: "8b. Protect other people (Yes)",
        pdfFieldName: PDF_PAGE6_8B_YES,
      });
    }
  }

  for (let i = 0; i < 4; i++) {
    const nameField = PDF_PAGE6_PROTECTED_NAMES[i];
    const ageField = PDF_PAGE6_PROTECTED_AGES[i];
    const relField = PDF_PAGE6_PROTECTED_REL[i];
    const yesCb = PDF_PAGE6_LIVES_YES[i];
    const noCb = PDF_PAGE6_LIVES_NO[i];
    const person = people[i];
    const rowActive = protect === "yes";

    try {
      pdfForm.getCheckBox(yesCb).uncheck();
    } catch {
      /* ignore */
    }
    try {
      pdfForm.getCheckBox(noCb).uncheck();
    } catch {
      /* ignore */
    }

    if (!rowActive || !person) {
      try {
        const nf = pdfForm.getTextField(nameField);
        nf.setText("");
      } catch (err) {
        console.warn(`Failed to clear protected name ${nameField}`, err);
      }
      try {
        const af = pdfForm.getTextField(ageField);
        af.setText("");
      } catch (err) {
        console.warn(`Failed to clear protected age ${ageField}`, err);
      }
      try {
        const rf = pdfForm.getTextField(relField);
        rf.setText("");
      } catch (err) {
        console.warn(`Failed to clear protected relationship ${relField}`, err);
      }
      continue;
    }

    try {
      const field = pdfForm.getTextField(nameField);
      const v = (person.name ?? "").trim();
      if (field && v) {
        field.setText(v);
        filled.push({ label: `8b. Protected person ${i + 1} name`, pdfFieldName: nameField });
      }
    } catch (err) {
      console.warn(`Failed to map protected name ${nameField}`, err);
      if ((person.name ?? "").trim()) {
        missing.push({ label: `8b. Protected person ${i + 1} name`, pdfFieldName: nameField });
      }
    }

    try {
      const field = pdfForm.getTextField(ageField);
      const v = (person.age ?? "").trim();
      if (field && v) {
        field.setText(v);
        filled.push({ label: `8b. Protected person ${i + 1} age`, pdfFieldName: ageField });
      }
    } catch (err) {
      console.warn(`Failed to map protected age ${ageField}`, err);
      if ((person.age ?? "").trim()) {
        missing.push({ label: `8b. Protected person ${i + 1} age`, pdfFieldName: ageField });
      }
    }

    try {
      const field = pdfForm.getTextField(relField);
      const v = (person.relationship ?? "").trim();
      if (field && v) {
        field.setText(v);
        filled.push({
          label: `8b. Protected person ${i + 1} relationship`,
          pdfFieldName: relField,
        });
      }
    } catch (err) {
      console.warn(`Failed to map protected relationship ${relField}`, err);
      if ((person.relationship ?? "").trim()) {
        missing.push({
          label: `8b. Protected person ${i + 1} relationship`,
          pdfFieldName: relField,
        });
      }
    }

    const lw = person.livesWithYou;
    if (lw === "Yes") {
      try {
        pdfForm.getCheckBox(yesCb).check();
        filled.push({
          label: `8b. Person ${i + 1} lives with you (Yes)`,
          pdfFieldName: yesCb,
        });
      } catch (err) {
        console.warn(`Failed to map ${yesCb}`, err);
        missing.push({
          label: `8b. Person ${i + 1} lives with you (Yes)`,
          pdfFieldName: yesCb,
        });
      }
    } else if (lw === "No") {
      try {
        pdfForm.getCheckBox(noCb).check();
        filled.push({
          label: `8b. Person ${i + 1} lives with you (No)`,
          pdfFieldName: noCb,
        });
      } catch (err) {
        console.warn(`Failed to map ${noCb}`, err);
        missing.push({
          label: `8b. Person ${i + 1} lives with you (No)`,
          pdfFieldName: noCb,
        });
      }
    }
  }

  if (protect !== "yes") {
    try {
      const field = pdfForm.getTextField(PDF_PAGE6_8B2_WHY);
      field.setText("");
    } catch (err) {
      console.warn("Failed to clear 8b(2) why", err);
    }
  }

  try {
    if (protect === "yes") {
      const field = pdfForm.getTextField(PDF_PAGE6_8B2_WHY);
      if (field && sec8Why) {
        field.setText(sec8Why);
        filled.push({
          label: "8b(2). Why protection needed",
          pdfFieldName: PDF_PAGE6_8B2_WHY,
        });
      }
    }
  } catch (err) {
    console.warn("Failed to map 8b(2) why", err);
    if (protect === "yes" && sec8Why) {
      missing.push({
        label: "8b(2). Why protection needed",
        pdfFieldName: PDF_PAGE6_8B2_WHY,
      });
    }
  }

  const overflowPeople = protect === "yes" && people.length > 4;
  try {
    if (overflowPeople) {
      pdfForm.getCheckBox(PDF_PAGE6_MORE_PEOPLE_BOX).check();
      filled.push({
        label: "8. More protected people (overflow)",
        pdfFieldName: PDF_PAGE6_MORE_PEOPLE_BOX,
      });
    } else {
      pdfForm.getCheckBox(PDF_PAGE6_MORE_PEOPLE_BOX).uncheck();
    }
  } catch (err) {
    console.warn("Failed to map more-people checkbox", err);
    if (overflowPeople) {
      missing.push({
        label: "8. More protected people (overflow)",
        pdfFieldName: PDF_PAGE6_MORE_PEOPLE_BOX,
      });
    }
  }

  if (overflowPeople) {
    try {
      let page = doc.addPage([612, 792]);
      const titleFont = await doc.embedFont(StandardFonts.HelveticaBold);
      const bodyFont = await doc.embedFont(StandardFonts.Helvetica);
      const black = rgb(0, 0, 0);
      page.drawText("DV-100, Other Protected People", {
        x: 50,
        y: 740,
        size: 14,
        font: titleFont,
        color: black,
      });
      let y = 710;
      const slice = people.slice(4);
      for (let j = 0; j < slice.length; j++) {
        const p = slice[j];
        const n = (p?.name ?? "").trim() || "—";
        const a = (p?.age ?? "").trim() || "—";
        const r = (p?.relationship ?? "").trim() || "—";
        const l =
          p?.livesWithYou === "Yes" || p?.livesWithYou === "No"
            ? p.livesWithYou
            : "—";
        const lines = [
          `Person ${j + 5}`,
          `Name: ${n}`,
          `Age: ${a}`,
          `Relationship: ${r}`,
          `Lives with you: ${l}`,
        ];
        const blockHeight = lines.length * 16 + 8;
        if (y - blockHeight < 50) {
          page = doc.addPage([612, 792]);
          page.drawText("(continued)", {
            x: 50,
            y: 740,
            size: 10,
            font: bodyFont,
            color: black,
          });
          y = 718;
        }
        for (const line of lines) {
          page.drawText(line, {
            x: 50,
            y,
            size: 11,
            font: bodyFont,
            color: black,
          });
          y -= 16;
        }
        y -= 8;
      }
    } catch (err) {
      console.warn("Failed to append Other Protected People page", err);
    }
  }

  const firearmsAns = data.hasFirearms;
  try {
    pdfForm.getCheckBox(PDF_PAGE6_9A_IDK).uncheck();
  } catch {
    /* ignore */
  }
  try {
    pdfForm.getCheckBox(PDF_PAGE6_9B_NO).uncheck();
  } catch {
    /* ignore */
  }
  try {
    pdfForm.getCheckBox(PDF_PAGE6_9C_YES).uncheck();
  } catch {
    /* ignore */
  }

  if (firearmsAns === "idk") {
    try {
      pdfForm.getCheckBox(PDF_PAGE6_9A_IDK).check();
      filled.push({ label: "9a. Firearms (I don't know)", pdfFieldName: PDF_PAGE6_9A_IDK });
    } catch (err) {
      console.warn("Failed to map 9a I dont know", err);
      missing.push({ label: "9a. Firearms (I don't know)", pdfFieldName: PDF_PAGE6_9A_IDK });
    }
  }
  if (firearmsAns === "no") {
    try {
      pdfForm.getCheckBox(PDF_PAGE6_9B_NO).check();
      filled.push({ label: "9b. Firearms (No)", pdfFieldName: PDF_PAGE6_9B_NO });
    } catch (err) {
      console.warn("Failed to map 9b No", err);
      missing.push({ label: "9b. Firearms (No)", pdfFieldName: PDF_PAGE6_9B_NO });
    }
  }
  if (firearmsAns === "yes") {
    try {
      pdfForm.getCheckBox(PDF_PAGE6_9C_YES).check();
      filled.push({ label: "9c. Firearms (Yes)", pdfFieldName: PDF_PAGE6_9C_YES });
    } catch (err) {
      console.warn("Failed to map 9c Yes", err);
      missing.push({ label: "9c. Firearms (Yes)", pdfFieldName: PDF_PAGE6_9C_YES });
    }
  }

  const guns = Array.isArray(data.firearms) ? data.firearms : [];
  const fillGuns = firearmsAns === "yes";
  for (let i = 0; i < 6; i++) {
    const dName = PDF_PAGE6_FIREARM_DESC[i];
    const aName = PDF_PAGE6_FIREARM_AMT[i];
    const lName = PDF_PAGE6_FIREARM_LOC[i];
    const row = guns[i];

    if (!fillGuns || !row) {
      try {
        pdfForm.getTextField(dName).setText("");
      } catch (err) {
        console.warn(`Failed to clear firearm desc ${dName}`, err);
      }
      try {
        pdfForm.getTextField(aName).setText("");
      } catch (err) {
        console.warn(`Failed to clear firearm amt ${aName}`, err);
      }
      try {
        pdfForm.getTextField(lName).setText("");
      } catch (err) {
        console.warn(`Failed to clear firearm loc ${lName}`, err);
      }
      continue;
    }

    try {
      const field = pdfForm.getTextField(dName);
      const v = (row.description ?? "").trim();
      if (field && v) {
        field.setText(v);
        filled.push({ label: `9. Firearm ${i + 1} description`, pdfFieldName: dName });
      }
    } catch (err) {
      console.warn(`Failed to map firearm desc ${dName}`, err);
      if ((row.description ?? "").trim()) {
        missing.push({ label: `9. Firearm ${i + 1} description`, pdfFieldName: dName });
      }
    }

    try {
      const field = pdfForm.getTextField(aName);
      const v = (row.amount ?? "").trim();
      if (field && v) {
        field.setText(v);
        filled.push({ label: `9. Firearm ${i + 1} amount`, pdfFieldName: aName });
      }
    } catch (err) {
      console.warn(`Failed to map firearm amt ${aName}`, err);
      if ((row.amount ?? "").trim()) {
        missing.push({ label: `9. Firearm ${i + 1} amount`, pdfFieldName: aName });
      }
    }

    try {
      const field = pdfForm.getTextField(lName);
      const v = (row.location ?? "").trim();
      if (field && v) {
        field.setText(v);
        filled.push({ label: `9. Firearm ${i + 1} location`, pdfFieldName: lName });
      }
    } catch (err) {
      console.warn(`Failed to map firearm loc ${lName}`, err);
      if ((row.location ?? "").trim()) {
        missing.push({ label: `9. Firearm ${i + 1} location`, pdfFieldName: lName });
      }
    }
  }

  // --- DV-100 Page 7 — Sections 10–12 (orders) ---
  try {
    if (data.orderToNotAbuse) {
      pdfForm.getCheckBox(PDF_PAGE7_ORDER_NOT_ABUSE).check();
      filled.push({ label: "Order to Not Abuse", pdfFieldName: PDF_PAGE7_ORDER_NOT_ABUSE });
    } else {
      pdfForm.getCheckBox(PDF_PAGE7_ORDER_NOT_ABUSE).uncheck();
    }
  } catch (err) {
    console.warn("Failed to map Order to Not Abuse", err);
    if (data.orderToNotAbuse) {
      missing.push({ label: "Order to Not Abuse", pdfFieldName: PDF_PAGE7_ORDER_NOT_ABUSE });
    }
  }

  try {
    if (data.noContactOrder) {
      pdfForm.getCheckBox(PDF_PAGE7_NO_CONTACT).check();
      filled.push({ label: "No-Contact Order", pdfFieldName: PDF_PAGE7_NO_CONTACT });
    } else {
      pdfForm.getCheckBox(PDF_PAGE7_NO_CONTACT).uncheck();
    }
  } catch (err) {
    console.warn("Failed to map NoContact Order", err);
    if (data.noContactOrder) {
      missing.push({ label: "No-Contact Order", pdfFieldName: PDF_PAGE7_NO_CONTACT });
    }
  }

  try {
    if (data.stayAwayOrder) {
      pdfForm.getCheckBox(PDF_PAGE7_STAY_AWAY_MASTER).check();
      filled.push({ label: "Stay-Away Order", pdfFieldName: PDF_PAGE7_STAY_AWAY_MASTER });
    } else {
      pdfForm.getCheckBox(PDF_PAGE7_STAY_AWAY_MASTER).uncheck();
    }
  } catch (err) {
    console.warn("Failed to map StayAway Order", err);
    if (data.stayAwayOrder) {
      missing.push({ label: "Stay-Away Order", pdfFieldName: PDF_PAGE7_STAY_AWAY_MASTER });
    }
  }

  const stayAway = data.stayAwayOrder === true;

  for (const { dataKey, pdfName } of PDF_PAGE7_12A_CHECKBOXES) {
    const checked = stayAway && Boolean(data[dataKey]);
    try {
      const cb = pdfForm.getCheckBox(pdfName);
      if (checked) {
        cb.check();
        filled.push({ label: `12a: ${pdfName}`, pdfFieldName: pdfName });
      } else {
        cb.uncheck();
      }
    } catch (err) {
      console.warn(`Failed to map 12a checkbox ${pdfName}`, err);
      if (checked) {
        missing.push({ label: `12a: ${pdfName}`, pdfFieldName: pdfName });
      }
    }
  }

  try {
    const field = pdfForm.getTextField(PDF_PAGE7_12A_OTHER_TEXT);
    const explain = (data.stayAwayOtherExplain ?? "").trim();
    if (stayAway && data.stayAwayOther && explain) {
      field.setText(explain);
      filled.push({ label: "12a Other (explain)", pdfFieldName: PDF_PAGE7_12A_OTHER_TEXT });
    } else {
      field.setText("");
    }
  } catch (err) {
    console.warn("Failed to map 12a Other please explain text", err);
    if (stayAway && data.stayAwayOther && (data.stayAwayOtherExplain ?? "").trim()) {
      missing.push({ label: "12a Other (explain)", pdfFieldName: PDF_PAGE7_12A_OTHER_TEXT });
    }
  }

  const dist = data.stayAwayDistance;
  try {
    pdfForm.getCheckBox(PDF_PAGE7_12B_100).uncheck();
  } catch {
    /* ignore */
  }
  try {
    pdfForm.getCheckBox(PDF_PAGE7_12B_OTHER_CB).uncheck();
  } catch {
    /* ignore */
  }
  try {
    pdfForm.getTextField(PDF_PAGE7_12B_OTHER_TEXT).setText("");
  } catch {
    /* ignore */
  }

  if (stayAway) {
    if (dist === "hundred") {
      try {
        pdfForm.getCheckBox(PDF_PAGE7_12B_100).check();
        filled.push({ label: "12b. 100 yards", pdfFieldName: PDF_PAGE7_12B_100 });
      } catch (err) {
        console.warn("Failed to map 12b 100 yards", err);
        missing.push({ label: "12b. 100 yards", pdfFieldName: PDF_PAGE7_12B_100 });
      }
    } else if (dist === "other") {
      try {
        pdfForm.getCheckBox(PDF_PAGE7_12B_OTHER_CB).check();
        filled.push({ label: "12b. Other distance (checkbox)", pdfFieldName: PDF_PAGE7_12B_OTHER_CB });
      } catch (err) {
        console.warn("Failed to map 12b other distance checkbox", err);
        missing.push({
          label: "12b. Other distance (checkbox)",
          pdfFieldName: PDF_PAGE7_12B_OTHER_CB,
        });
      }
      try {
        const field = pdfForm.getTextField(PDF_PAGE7_12B_OTHER_TEXT);
        const yards = (data.stayAwayDistanceOther ?? "").trim();
        if (yards) {
          field.setText(yards);
          filled.push({ label: "12b. Distance (yards)", pdfFieldName: PDF_PAGE7_12B_OTHER_TEXT });
        }
      } catch (err) {
        console.warn("Failed to map 12b undefined_12", err);
        if ((data.stayAwayDistanceOther ?? "").trim()) {
          missing.push({ label: "12b. Distance (yards)", pdfFieldName: PDF_PAGE7_12B_OTHER_TEXT });
        }
      }
    }
  }

  const twelveCSubs = [
    PDF_PAGE7_12C_LIVE_TOGETHER,
    PDF_PAGE7_12C_SAME_BUILDING,
    PDF_PAGE7_12C_SAME_NEIGHBORHOOD,
    PDF_PAGE7_12C_OTHER_CB,
  ] as const;
  try {
    pdfForm.getCheckBox(PDF_PAGE7_12C_NO).uncheck();
  } catch {
    /* ignore */
  }
  try {
    pdfForm.getCheckBox(PDF_PAGE7_12C_YES).uncheck();
  } catch {
    /* ignore */
  }
  for (const name of twelveCSubs) {
    try {
      pdfForm.getCheckBox(name).uncheck();
    } catch {
      /* ignore */
    }
  }
  try {
    pdfForm.getTextField(PDF_PAGE7_12C_OTHER_TEXT).setText("");
  } catch {
    /* ignore */
  }

  if (stayAway) {
    const lt = data.liveTogether;
    if (lt === "no") {
      try {
        pdfForm.getCheckBox(PDF_PAGE7_12C_NO).check();
        filled.push({ label: "12c. Live together/close (No)", pdfFieldName: PDF_PAGE7_12C_NO });
      } catch (err) {
        console.warn("Failed to map 12c No_22", err);
        missing.push({ label: "12c. Live together/close (No)", pdfFieldName: PDF_PAGE7_12C_NO });
      }
    } else if (lt === "yes") {
      try {
        pdfForm.getCheckBox(PDF_PAGE7_12C_YES).check();
        filled.push({ label: "12c. Live together/close (Yes)", pdfFieldName: PDF_PAGE7_12C_YES });
      } catch (err) {
        console.warn("Failed to map 12c Yes If yes check one", err);
        missing.push({
          label: "12c. Live together/close (Yes)",
          pdfFieldName: PDF_PAGE7_12C_YES,
        });
      }
      const t = data.liveTogetherType;
      const subMap: {
        k: typeof t;
        pdf: string;
        label: string;
      }[] = [
        { k: "liveTogether", pdf: PDF_PAGE7_12C_LIVE_TOGETHER, label: "12c. Live together" },
        { k: "sameBuilding", pdf: PDF_PAGE7_12C_SAME_BUILDING, label: "12c. Same building" },
        {
          k: "sameNeighborhood",
          pdf: PDF_PAGE7_12C_SAME_NEIGHBORHOOD,
          label: "12c. Same neighborhood",
        },
        { k: "other", pdf: PDF_PAGE7_12C_OTHER_CB, label: "12c. Other (checkbox)" },
      ];
      for (const { k, pdf, label } of subMap) {
        if (t === k) {
          try {
            pdfForm.getCheckBox(pdf).check();
            filled.push({ label, pdfFieldName: pdf });
          } catch (err) {
            console.warn(`Failed to map 12c sub ${pdf}`, err);
            missing.push({ label, pdfFieldName: pdf });
          }
          break;
        }
      }
      if (t === "other") {
        try {
          const field = pdfForm.getTextField(PDF_PAGE7_12C_OTHER_TEXT);
          const ex = (data.liveTogetherOther ?? "").trim();
          if (ex) {
            field.setText(ex);
            filled.push({ label: "12c. Other (explain)", pdfFieldName: PDF_PAGE7_12C_OTHER_TEXT });
          }
        } catch (err) {
          console.warn("Failed to map 12c undefined_13", err);
          if ((data.liveTogetherOther ?? "").trim()) {
            missing.push({ label: "12c. Other (explain)", pdfFieldName: PDF_PAGE7_12C_OTHER_TEXT });
          }
        }
      }
    }
  }

  const twelveDSubs = [
    PDF_PAGE7_12D_WORK_CB,
    PDF_PAGE7_12D_SCHOOL_CB,
    PDF_PAGE7_12D_OTHER_CB,
  ] as const;
  try {
    pdfForm.getCheckBox(PDF_PAGE7_12D_NO).uncheck();
  } catch {
    /* ignore */
  }
  try {
    pdfForm.getCheckBox(PDF_PAGE7_12D_YES).uncheck();
  } catch {
    /* ignore */
  }
  for (const name of twelveDSubs) {
    try {
      pdfForm.getCheckBox(name).uncheck();
    } catch {
      /* ignore */
    }
  }
  try {
    pdfForm.getTextField(PDF_PAGE7_12D_WORK_TEXT).setText("");
  } catch {
    /* ignore */
  }
  try {
    pdfForm.getTextField(PDF_PAGE7_12D_SCHOOL_TEXT).setText("");
  } catch {
    /* ignore */
  }
  try {
    pdfForm.getTextField(PDF_PAGE7_12D_OTHER_TEXT).setText("");
  } catch {
    /* ignore */
  }

  if (stayAway) {
    const ws = data.sameWorkplaceSchool;
    if (ws === "no") {
      try {
        pdfForm.getCheckBox(PDF_PAGE7_12D_NO).check();
        filled.push({ label: "12d. Same workplace/school (No)", pdfFieldName: PDF_PAGE7_12D_NO });
      } catch (err) {
        console.warn("Failed to map 12d No_23", err);
        missing.push({ label: "12d. Same workplace/school (No)", pdfFieldName: PDF_PAGE7_12D_NO });
      }
    } else if (ws === "yes") {
      try {
        pdfForm.getCheckBox(PDF_PAGE7_12D_YES).check();
        filled.push({
          label: "12d. Same workplace/school (Yes)",
          pdfFieldName: PDF_PAGE7_12D_YES,
        });
      } catch (err) {
        console.warn("Failed to map 12d Yes If yes check all", err);
        missing.push({
          label: "12d. Same workplace/school (Yes)",
          pdfFieldName: PDF_PAGE7_12D_YES,
        });
      }
      if (data.workTogether) {
        try {
          pdfForm.getCheckBox(PDF_PAGE7_12D_WORK_CB).check();
          filled.push({ label: "12d. Work together", pdfFieldName: PDF_PAGE7_12D_WORK_CB });
        } catch (err) {
          console.warn("Failed to map 12d work checkbox", err);
          missing.push({ label: "12d. Work together", pdfFieldName: PDF_PAGE7_12D_WORK_CB });
        }
        try {
          const field = pdfForm.getTextField(PDF_PAGE7_12D_WORK_TEXT);
          const co = (data.workTogetherCompany ?? "").trim();
          if (co) {
            field.setText(co);
            filled.push({ label: "12d. Company name", pdfFieldName: PDF_PAGE7_12D_WORK_TEXT });
          }
        } catch (err) {
          console.warn("Failed to map 12d undefined_14", err);
          if ((data.workTogetherCompany ?? "").trim()) {
            missing.push({ label: "12d. Company name", pdfFieldName: PDF_PAGE7_12D_WORK_TEXT });
          }
        }
      }
      if (data.sameSchool) {
        try {
          pdfForm.getCheckBox(PDF_PAGE7_12D_SCHOOL_CB).check();
          filled.push({ label: "12d. Same school", pdfFieldName: PDF_PAGE7_12D_SCHOOL_CB });
        } catch (err) {
          console.warn("Failed to map 12d school checkbox", err);
          missing.push({ label: "12d. Same school", pdfFieldName: PDF_PAGE7_12D_SCHOOL_CB });
        }
        try {
          const field = pdfForm.getTextField(PDF_PAGE7_12D_SCHOOL_TEXT);
          const sn = (data.sameSchoolName ?? "").trim();
          if (sn) {
            field.setText(sn);
            filled.push({ label: "12d. School name", pdfFieldName: PDF_PAGE7_12D_SCHOOL_TEXT });
          }
        } catch (err) {
          console.warn("Failed to map 12d undefined_15", err);
          if ((data.sameSchoolName ?? "").trim()) {
            missing.push({ label: "12d. School name", pdfFieldName: PDF_PAGE7_12D_SCHOOL_TEXT });
          }
        }
      }
      if (data.sameWorkplaceOther) {
        try {
          pdfForm.getCheckBox(PDF_PAGE7_12D_OTHER_CB).check();
          filled.push({ label: "12d. Other (checkbox)", pdfFieldName: PDF_PAGE7_12D_OTHER_CB });
        } catch (err) {
          console.warn("Failed to map 12d other checkbox", err);
          missing.push({ label: "12d. Other (checkbox)", pdfFieldName: PDF_PAGE7_12D_OTHER_CB });
        }
        try {
          const field = pdfForm.getTextField(PDF_PAGE7_12D_OTHER_TEXT);
          const ox = (data.sameWorkplaceOtherExplain ?? "").trim();
          if (ox) {
            field.setText(ox);
            filled.push({ label: "12d. Other (explain)", pdfFieldName: PDF_PAGE7_12D_OTHER_TEXT });
          }
        } catch (err) {
          console.warn("Failed to map 12d Other please explain text", err);
          if ((data.sameWorkplaceOtherExplain ?? "").trim()) {
            missing.push({ label: "12d. Other (explain)", pdfFieldName: PDF_PAGE7_12D_OTHER_TEXT });
          }
        }
      }
    }
  }

  // --- DV-100 Page 8 — Sections 13–15 ---
  const moveOut = data.orderToMoveOut === true;

  try {
    if (moveOut) {
      pdfForm.getCheckBox(PDF_PAGE8_ORDER_MOVE_OUT).check();
      filled.push({ label: "Order to Move Out", pdfFieldName: PDF_PAGE8_ORDER_MOVE_OUT });
    } else {
      pdfForm.getCheckBox(PDF_PAGE8_ORDER_MOVE_OUT).uncheck();
    }
  } catch (err) {
    console.warn("Failed to map Order to Move Out", err);
    if (moveOut) {
      missing.push({ label: "Order to Move Out", pdfFieldName: PDF_PAGE8_ORDER_MOVE_OUT });
    }
  }

  try {
    const field = pdfForm.getTextField(PDF_PAGE8_13A_PERSON_ASK);
    const ask = (data.moveOutOrderPersonAsk ?? "").trim();
    if (moveOut && ask) {
      field.setText(ask);
      filled.push({ label: "13a. Order person to move (address ask)", pdfFieldName: PDF_PAGE8_13A_PERSON_ASK });
    } else {
      field.setText("");
    }
  } catch (err) {
    console.warn("Failed to map 13a person ask", err);
    if (moveOut && (data.moveOutOrderPersonAsk ?? "").trim()) {
      missing.push({
        label: "13a. Order person to move (address ask)",
        pdfFieldName: PDF_PAGE8_13A_PERSON_ASK,
      });
    }
  }

  for (const { dataKey, pdfName } of PDF_PAGE8_13B_CHECKBOXES) {
    const checked = moveOut && Boolean(data[dataKey]);
    try {
      const cb = pdfForm.getCheckBox(pdfName);
      if (checked) {
        cb.check();
        filled.push({ label: `13b: ${pdfName}`, pdfFieldName: pdfName });
      } else {
        cb.uncheck();
      }
    } catch (err) {
      console.warn(`Failed to map 13b checkbox ${pdfName}`, err);
      if (checked) {
        missing.push({ label: `13b: ${pdfName}`, pdfFieldName: pdfName });
      }
    }
  }

  try {
    const yField = pdfForm.getTextField(PDF_PAGE8_YEARS);
    const mField = pdfForm.getTextField(PDF_PAGE8_MONTHS);
    const lived = moveOut && data.moveOutLivedFor;
    const y = (data.moveOutLivedYears ?? "").trim();
    const m = (data.moveOutLivedMonths ?? "").trim();
    if (lived && y) {
      yField.setText(y);
      filled.push({ label: "13b. Years at address", pdfFieldName: PDF_PAGE8_YEARS });
    } else {
      yField.setText("");
    }
    if (lived && m) {
      mField.setText(m);
      filled.push({ label: "13b. Months at address", pdfFieldName: PDF_PAGE8_MONTHS });
    } else {
      mField.setText("");
    }
  } catch (err) {
    console.warn("Failed to map 13b years/months", err);
    const lived = moveOut && data.moveOutLivedFor;
    if (lived && (data.moveOutLivedYears ?? "").trim()) {
      missing.push({ label: "13b. Years at address", pdfFieldName: PDF_PAGE8_YEARS });
    }
    if (lived && (data.moveOutLivedMonths ?? "").trim()) {
      missing.push({ label: "13b. Months at address", pdfFieldName: PDF_PAGE8_MONTHS });
    }
  }

  try {
    const field = pdfForm.getTextField(PDF_PAGE8_13B_OTHER_TEXT);
    const ex = (data.moveOutOtherExplain ?? "").trim();
    if (moveOut && data.moveOutOther && ex) {
      field.setText(ex);
      filled.push({ label: "13b. Other (explain)", pdfFieldName: PDF_PAGE8_13B_OTHER_TEXT });
    } else {
      field.setText("");
    }
  } catch (err) {
    console.warn("Failed to map 13b other explain", err);
    if (moveOut && data.moveOutOther && (data.moveOutOtherExplain ?? "").trim()) {
      missing.push({ label: "13b. Other (explain)", pdfFieldName: PDF_PAGE8_13B_OTHER_TEXT });
    }
  }

  const otherOrd = data.otherOrders === true;
  try {
    if (otherOrd) {
      pdfForm.getCheckBox(PDF_PAGE8_OTHER_ORDERS).check();
      filled.push({ label: "Other Orders", pdfFieldName: PDF_PAGE8_OTHER_ORDERS });
    } else {
      pdfForm.getCheckBox(PDF_PAGE8_OTHER_ORDERS).uncheck();
    }
  } catch (err) {
    console.warn("Failed to map Other Orders", err);
    if (otherOrd) {
      missing.push({ label: "Other Orders", pdfFieldName: PDF_PAGE8_OTHER_ORDERS });
    }
  }

  try {
    const field = pdfForm.getTextField(PDF_PAGE8_14_DESCRIBE);
    const d = (data.otherOrdersDescribe ?? "").trim();
    if (otherOrd && d) {
      field.setText(d);
      filled.push({ label: "14. Additional orders (description)", pdfFieldName: PDF_PAGE8_14_DESCRIBE });
    } else {
      field.setText("");
    }
  } catch (err) {
    console.warn("Failed to map 14 describe additional orders", err);
    if (otherOrd && (data.otherOrdersDescribe ?? "").trim()) {
      missing.push({
        label: "14. Additional orders (description)",
        pdfFieldName: PDF_PAGE8_14_DESCRIBE,
      });
    }
  }

  try {
    if (data.childCustodyVisitation) {
      pdfForm.getCheckBox(PDF_PAGE8_CHILD_CUSTODY).check();
      filled.push({ label: "Child Custody and Visitation", pdfFieldName: PDF_PAGE8_CHILD_CUSTODY });
    } else {
      pdfForm.getCheckBox(PDF_PAGE8_CHILD_CUSTODY).uncheck();
    }
  } catch (err) {
    console.warn("Failed to map Child Custody and Visitation", err);
    if (data.childCustodyVisitation) {
      missing.push({
        label: "Child Custody and Visitation",
        pdfFieldName: PDF_PAGE8_CHILD_CUSTODY,
      });
    }
  }

  // --- DV-100 Page 9 — Sections 16–19 ---
  const s16 = data.protectAnimals === true;
  const animals = data.protectedAnimals ?? [];

  try {
    if (s16) {
      pdfForm.getCheckBox(PDF_16_MASTER).check();
      filled.push({ label: "16. Protect Animals", pdfFieldName: PDF_16_MASTER });
    } else {
      pdfForm.getCheckBox(PDF_16_MASTER).uncheck();
    }
  } catch (err) {
    console.warn("Failed to map Protect Animals", err);
    if (s16) {
      missing.push({ label: "16. Protect Animals", pdfFieldName: PDF_16_MASTER });
    }
  }

  for (let i = 0; i < 4; i++) {
    const row = animals[i] ?? { name: "", type: "", breed: "", color: "" };
    const namePdf = PDF_PAGE9_ANIMAL_NAMES[i];
    const typePdf = PDF_PAGE9_ANIMAL_TYPES[i];
    const breedPdf = PDF_PAGE9_ANIMAL_BREEDS[i];
    const colorPdf = PDF_PAGE9_ANIMAL_COLORS[i];
    const n = (row.name ?? "").trim();
    const t = (row.type ?? "").trim();
    const b = (row.breed ?? "").trim();
    const c = (row.color ?? "").trim();

    const mapText = (pdfName: string, val: string, label: string) => {
      try {
        const field = pdfForm.getTextField(pdfName);
        if (s16) {
          field.setText(val);
          if (val) {
            filled.push({ label, pdfFieldName: pdfName });
          }
        } else {
          field.setText("");
        }
      } catch (err) {
        console.warn(`Failed to map animal field ${pdfName}`, err);
        if (s16 && val) {
          missing.push({ label, pdfFieldName: pdfName });
        }
      }
    };

    mapText(namePdf, n, `16a. Animal ${i + 1} name`);
    mapText(typePdf, t, `16a. Animal ${i + 1} type`);
    mapText(breedPdf, b, `16a. Animal ${i + 1} breed`);
    mapText(colorPdf, c, `16a. Animal ${i + 1} color`);
  }

  try {
    pdfForm.getCheckBox(PDF_16B1_100_YARDS).uncheck();
  } catch {
    /* ignore */
  }
  try {
    pdfForm.getCheckBox(PDF_16B1_OTHER_YARDS_CHECK).uncheck();
  } catch {
    /* ignore */
  }
  try {
    pdfForm.getTextField(PDF_16B1_OTHER_YARDS_TEXT).setText("");
  } catch {
    /* ignore */
  }

  if (s16 && data.protectAnimalsStayAway) {
    try {
      pdfForm.getCheckBox(PDF_16B1_STAY_AWAY_CHECK).check();
      filled.push({
        label: "16b1. Stay away from animals (checkbox)",
        pdfFieldName: PDF_16B1_STAY_AWAY_CHECK,
      });
    } catch (err) {
      console.warn("Failed to map 16b1 stay away", err);
      missing.push({
        label: "16b1. Stay away from animals (checkbox)",
        pdfFieldName: PDF_16B1_STAY_AWAY_CHECK,
      });
    }
    const dist = data.protectAnimalsStayAwayDistance;
    if (dist === "hundred") {
      try {
        pdfForm.getCheckBox(PDF_16B1_100_YARDS).check();
        filled.push({ label: "16b1. 100 yards", pdfFieldName: PDF_16B1_100_YARDS });
      } catch (err) {
        console.warn("Failed to map 16b1 100 yards", err);
        missing.push({ label: "16b1. 100 yards", pdfFieldName: PDF_16B1_100_YARDS });
      }
    } else if (dist === "other") {
      try {
        pdfForm.getCheckBox(PDF_16B1_OTHER_YARDS_CHECK).check();
        filled.push({
          label: "16b1. Other yards (checkbox)",
          pdfFieldName: PDF_16B1_OTHER_YARDS_CHECK,
        });
      } catch (err) {
        console.warn("Failed to map 16b1 other yards checkbox", err);
        missing.push({
          label: "16b1. Other yards (checkbox)",
          pdfFieldName: PDF_16B1_OTHER_YARDS_CHECK,
        });
      }
      try {
        const field = pdfForm.getTextField(PDF_16B1_OTHER_YARDS_TEXT);
        const yards = (data.protectAnimalsStayAwayOtherYards ?? "").trim();
        if (yards) {
          field.setText(yards);
          filled.push({ label: "16b1. Other yards (text)", pdfFieldName: PDF_16B1_OTHER_YARDS_TEXT });
        }
      } catch (err) {
        console.warn("Failed to map 16b1 other yards text", err);
        if ((data.protectAnimalsStayAwayOtherYards ?? "").trim()) {
          missing.push({
            label: "16b1. Other yards (text)",
            pdfFieldName: PDF_16B1_OTHER_YARDS_TEXT,
          });
        }
      }
    }
  } else {
    try {
      pdfForm.getCheckBox(PDF_16B1_STAY_AWAY_CHECK).uncheck();
    } catch {
      /* ignore */
    }
  }

  const notTake = s16 && data.protectAnimalsNotTake === true;
  try {
    if (notTake) {
      pdfForm.getCheckBox(PDF_16B2_NOT_TAKE).check();
      filled.push({ label: "16b2. Not take / harm animals", pdfFieldName: PDF_16B2_NOT_TAKE });
    } else {
      pdfForm.getCheckBox(PDF_16B2_NOT_TAKE).uncheck();
    }
  } catch (err) {
    console.warn("Failed to map 16b2 Not take", err);
    if (notTake) {
      missing.push({ label: "16b2. Not take / harm animals", pdfFieldName: PDF_16B2_NOT_TAKE });
    }
  }

  const sole = s16 && data.protectAnimalsSolePossession === true;
  try {
    if (sole) {
      pdfForm.getCheckBox(PDF_16B3_SOLE_POSSESSION).check();
      filled.push({ label: "16b3. Sole possession", pdfFieldName: PDF_16B3_SOLE_POSSESSION });
    } else {
      pdfForm.getCheckBox(PDF_16B3_SOLE_POSSESSION).uncheck();
    }
  } catch (err) {
    console.warn("Failed to map 16b3 sole possession", err);
    if (sole) {
      missing.push({ label: "16b3. Sole possession", pdfFieldName: PDF_16B3_SOLE_POSSESSION });
    }
  }

  const map16b3Reason = (
    checked: boolean,
    pdfName: string,
    label: string,
  ) => {
    try {
      if (checked) {
        pdfForm.getCheckBox(pdfName).check();
        filled.push({ label, pdfFieldName: pdfName });
      } else {
        pdfForm.getCheckBox(pdfName).uncheck();
      }
    } catch (err) {
      console.warn(`Failed to map 16b3 ${pdfName}`, err);
      if (checked) {
        missing.push({ label, pdfFieldName: pdfName });
      }
    }
  };

  map16b3Reason(
    sole && data.protectAnimalsSoleReasonAbuse,
    PDF_16B3_REASON_ABUSE,
    "16b3. Reason: person in 2 abuses animals",
  );
  map16b3Reason(
    sole && data.protectAnimalsSoleReasonCare,
    PDF_16B3_REASON_CARE,
    "16b3. Reason: I take care of these animals",
  );
  map16b3Reason(
    sole && data.protectAnimalsSoleReasonPurchased,
    PDF_16B3_REASON_PURCHASED,
    "16b3. Reason: I purchased these animals",
  );
  map16b3Reason(
    sole && data.protectAnimalsSoleReasonOther,
    PDF_16B3_REASON_OTHER_CHECK,
    "16b3. Reason: Other (checkbox)",
  );

  try {
    const field = pdfForm.getTextField(PDF_16B3_REASON_OTHER_TEXT);
    const ex = (data.protectAnimalsSoleReasonOtherExplain ?? "").trim();
    if (sole && data.protectAnimalsSoleReasonOther && ex) {
      field.setText(ex);
      filled.push({ label: "16b3. Reason: Other (explain)", pdfFieldName: PDF_16B3_REASON_OTHER_TEXT });
    } else {
      field.setText("");
    }
  } catch (err) {
    console.warn("Failed to map 16b3 other explain", err);
    if (sole && data.protectAnimalsSoleReasonOther && (data.protectAnimalsSoleReasonOtherExplain ?? "").trim()) {
      missing.push({
        label: "16b3. Reason: Other (explain)",
        pdfFieldName: PDF_16B3_REASON_OTHER_TEXT,
      });
    }
  }

  const s17 = data.controlProperty === true;
  try {
    if (s17) {
      pdfForm.getCheckBox(PDF_17_MASTER).check();
      filled.push({ label: "17. Control of Property", pdfFieldName: PDF_17_MASTER });
    } else {
      pdfForm.getCheckBox(PDF_17_MASTER).uncheck();
    }
  } catch (err) {
    console.warn("Failed to map Control of Property", err);
    if (s17) {
      missing.push({ label: "17. Control of Property", pdfFieldName: PDF_17_MASTER });
    }
  }

  try {
    const field = pdfForm.getTextField(PDF_17A_TEXT);
    const a = (data.controlPropertyDescribe ?? "").trim();
    if (s17 && a) {
      field.setText(a);
      filled.push({ label: "17a. Property list", pdfFieldName: PDF_17A_TEXT });
    } else {
      field.setText("");
    }
  } catch (err) {
    console.warn("Failed to map 17a property", err);
    if (s17 && (data.controlPropertyDescribe ?? "").trim()) {
      missing.push({ label: "17a. Property list", pdfFieldName: PDF_17A_TEXT });
    }
  }

  try {
    const field = pdfForm.getTextField(PDF_17B_TEXT);
    const b = (data.controlPropertyWhy ?? "").trim();
    if (s17 && b) {
      field.setText(b);
      filled.push({ label: "17b. Why control", pdfFieldName: PDF_17B_TEXT });
    } else {
      field.setText("");
    }
  } catch (err) {
    console.warn("Failed to map 17b explain", err);
    if (s17 && (data.controlPropertyWhy ?? "").trim()) {
      missing.push({ label: "17b. Why control", pdfFieldName: PDF_17B_TEXT });
    }
  }

  const s18 = data.healthOtherInsurance === true;
  try {
    if (s18) {
      pdfForm.getCheckBox(PDF_18_MASTER).check();
      filled.push({ label: "18. Health and Other Insurance", pdfFieldName: PDF_18_MASTER });
    } else {
      pdfForm.getCheckBox(PDF_18_MASTER).uncheck();
    }
  } catch (err) {
    console.warn("Failed to map Health and Other Insurance", err);
    if (s18) {
      missing.push({ label: "18. Health and Other Insurance", pdfFieldName: PDF_18_MASTER });
    }
  }

  const s19 = data.recordCommunications === true;
  try {
    if (s19) {
      pdfForm.getCheckBox(PDF_19_MASTER).check();
      filled.push({ label: "19. Record Communications", pdfFieldName: PDF_19_MASTER });
    } else {
      pdfForm.getCheckBox(PDF_19_MASTER).uncheck();
    }
  } catch (err) {
    console.warn("Failed to map Record Communications", err);
    if (s19) {
      missing.push({ label: "19. Record Communications", pdfFieldName: PDF_19_MASTER });
    }
  }

  const s20 = data.propertyRestraint === true;
  try {
    if (s20) {
      pdfForm.getCheckBox(PDF_20_MASTER).check();
      filled.push({ label: "20. Property Restraint", pdfFieldName: PDF_20_MASTER });
    } else {
      pdfForm.getCheckBox(PDF_20_MASTER).uncheck();
    }
  } catch (err) {
    console.warn("Failed to map Property Restraint", err);
    if (s20) {
      missing.push({ label: "20. Property Restraint", pdfFieldName: PDF_20_MASTER });
    }
  }

  const s21 = data.extendNoticeDeadline === true;
  try {
    if (s21) {
      pdfForm.getCheckBox(PDF_21_MASTER).check();
      filled.push({
        label: "21. Extend deadline to give notice",
        pdfFieldName: PDF_21_MASTER,
      });
    } else {
      pdfForm.getCheckBox(PDF_21_MASTER).uncheck();
    }
  } catch (err) {
    console.warn("Failed to map extend notice master", err);
    if (s21) {
      missing.push({
        label: "21. Extend deadline to give notice",
        pdfFieldName: PDF_21_MASTER,
      });
    }
  }

  try {
    const field = pdfForm.getTextField(PDF_21_TEXT);
    const t21 = (data.extendNoticeExplain ?? "").trim();
    if (s21 && t21) {
      field.setText(t21);
      filled.push({ label: "21. Explain more time", pdfFieldName: PDF_21_TEXT });
    } else {
      field.setText("");
    }
  } catch (err) {
    console.warn("Failed to map 21 explain", err);
    if (s21 && (data.extendNoticeExplain ?? "").trim()) {
      missing.push({ label: "21. Explain more time", pdfFieldName: PDF_21_TEXT });
    }
  }

  const s22 = data.payDebtsForProperty === true;
  const rows = data.payDebtsRows ?? [];
  const debtPdfCells: {
    payTo: string;
    payFor: string;
    amount: string;
    due: string;
    label: string;
  }[] = [
    {
      payTo: PDF_22A_PAY_TO_1,
      payFor: PDF_22A_FOR_1,
      amount: PDF_22A_AMOUNT_1,
      due: PDF_22A_DUE_1,
      label: "22a. Debt 1",
    },
    {
      payTo: PDF_22A_PAY_TO_2,
      payFor: PDF_22A_FOR_2,
      amount: PDF_22A_AMOUNT_2,
      due: PDF_22A_DUE_2,
      label: "22a. Debt 2",
    },
    {
      payTo: PDF_22A_PAY_TO_3,
      payFor: PDF_22A_FOR_3,
      amount: PDF_22A_AMOUNT_3,
      due: PDF_22A_DUE_3,
      label: "22a. Debt 3",
    },
  ];

  try {
    if (s22) {
      pdfForm.getCheckBox(PDF_22_MASTER).check();
      filled.push({
        label: "22. Pay debts owed for property",
        pdfFieldName: PDF_22_MASTER,
      });
    } else {
      pdfForm.getCheckBox(PDF_22_MASTER).uncheck();
    }
  } catch (err) {
    console.warn("Failed to map Pay Debts master", err);
    if (s22) {
      missing.push({
        label: "22. Pay debts owed for property",
        pdfFieldName: PDF_22_MASTER,
      });
    }
  }

  for (let i = 0; i < debtPdfCells.length; i++) {
    const spec = debtPdfCells[i];
    const row = rows[i];
    const payToV = (row?.payTo ?? "").trim();
    const payForV = (row?.payFor ?? "").trim();
    const amountV = (row?.amount ?? "").trim();
    const dueV = (row?.dueDate ?? "").trim();

    const mapDebtText = (
      pdfName: string,
      value: string,
      shortLabel: string,
    ) => {
      try {
        const field = pdfForm.getTextField(pdfName);
        if (s22 && value) {
          field.setText(value);
          filled.push({ label: `${spec.label} ${shortLabel}`, pdfFieldName: pdfName });
        } else {
          field.setText("");
        }
      } catch (err) {
        console.warn(`Failed to map ${pdfName}`, err);
        if (s22 && value) {
          missing.push({ label: `${spec.label} ${shortLabel}`, pdfFieldName: pdfName });
        }
      }
    };

    mapDebtText(spec.payTo, payToV, "Pay to");
    mapDebtText(spec.payFor, payForV, "For");
    mapDebtText(spec.amount, amountV, "Amount");
    mapDebtText(spec.due, dueV, "Due date");
  }

  try {
    const field = pdfForm.getTextField(PDF_22A_EXPLAIN);
    const ex = (data.payDebtsExplain ?? "").trim();
    if (s22 && ex) {
      field.setText(ex);
      filled.push({ label: "22a. Explain pay debts", pdfFieldName: PDF_22A_EXPLAIN });
    } else {
      field.setText("");
    }
  } catch (err) {
    console.warn("Failed to map 22a explain", err);
    if (s22 && (data.payDebtsExplain ?? "").trim()) {
      missing.push({ label: "22a. Explain pay debts", pdfFieldName: PDF_22A_EXPLAIN });
    }
  }

  const specialYes = s22 && data.payDebtsSpecialDecision === "yes";
  const specialNo = s22 && data.payDebtsSpecialDecision === "no";

  try {
    const rg = pdfForm.getRadioGroup(PDF_22B_SPECIAL_DECISION_RADIO_GROUP);
    if (specialYes) {
      rg.select(PDF_22B_SPECIAL_DECISION_YES);
      filled.push({
        label: "22b. Special decision: Yes",
        pdfFieldName: PDF_22B_SPECIAL_DECISION_YES,
      });
    } else if (specialNo) {
      rg.select(PDF_22B_SPECIAL_DECISION_NO);
      filled.push({
        label: "22b. Special decision: No",
        pdfFieldName: PDF_22B_SPECIAL_DECISION_NO,
      });
    }
  } catch (err) {
    console.warn("Failed to map 22b special decision radio", err);
    if (specialYes) {
      missing.push({
        label: "22b. Special decision: Yes",
        pdfFieldName: PDF_22B_SPECIAL_DECISION_YES,
      });
    } else if (specialNo) {
      missing.push({
        label: "22b. Special decision: No",
        pdfFieldName: PDF_22B_SPECIAL_DECISION_NO,
      });
    }
  }

  const map22bDebtCheck = (
    checked: boolean,
    pdfName: string,
    label: string,
  ) => {
    try {
      if (checked) {
        pdfForm.getCheckBox(pdfName).check();
        filled.push({ label, pdfFieldName: pdfName });
      } else {
        pdfForm.getCheckBox(pdfName).uncheck();
      }
    } catch (err) {
      console.warn(`Failed to map ${pdfName}`, err);
      if (checked) {
        missing.push({ label, pdfFieldName: pdfName });
      }
    }
  };

  map22bDebtCheck(
    specialYes && data.payDebtsAbuseDebt1,
    PDF_22B_DEBT_CHECK_1,
    "22b. Debt 1 from abuse",
  );
  map22bDebtCheck(
    specialYes && data.payDebtsAbuseDebt2,
    PDF_22B_DEBT_CHECK_2,
    "22b. Debt 2 from abuse",
  );
  map22bDebtCheck(
    specialYes && data.payDebtsAbuseDebt3,
    PDF_22B_DEBT_CHECK_3,
    "22b. Debt 3 from abuse",
  );

  const knowYes = specialYes && data.payDebtsKnowHow === "yes";
  const knowNo = specialYes && data.payDebtsKnowHow === "no";

  try {
    const rg = pdfForm.getRadioGroup(PDF_22B_KNOW_HOW_RADIO_GROUP);
    if (knowYes) {
      rg.select(PDF_22B_KNOW_HOW_YES);
      filled.push({
        label: "22b. Know how debts made: Yes",
        pdfFieldName: PDF_22B_KNOW_HOW_YES,
      });
    } else if (knowNo) {
      rg.select(PDF_22B_KNOW_HOW_NO);
      filled.push({
        label: "22b. Know how debts made: No",
        pdfFieldName: PDF_22B_KNOW_HOW_NO,
      });
    }
  } catch (err) {
    console.warn("Failed to map 22b know-how radio", err);
    if (knowYes) {
      missing.push({
        label: "22b. Know how debts made: Yes",
        pdfFieldName: PDF_22B_KNOW_HOW_YES,
      });
    } else if (knowNo) {
      missing.push({
        label: "22b. Know how debts made: No",
        pdfFieldName: PDF_22B_KNOW_HOW_NO,
      });
    }
  }

  try {
    const field = pdfForm.getTextField(PDF_22B_EXPLAIN_HOW);
    const how = (data.payDebtsExplainHow ?? "").trim();
    if (knowYes && how) {
      field.setText(how);
      filled.push({
        label: "22b2. Explain how debts made",
        pdfFieldName: PDF_22B_EXPLAIN_HOW,
      });
    } else {
      field.setText("");
    }
  } catch (err) {
    console.warn("Failed to map 22b2 explain how", err);
    if (knowYes && (data.payDebtsExplainHow ?? "").trim()) {
      missing.push({
        label: "22b2. Explain how debts made",
        pdfFieldName: PDF_22B_EXPLAIN_HOW,
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
