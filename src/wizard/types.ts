/**
 * Answers collected by the wizard, keyed by the question IDs in the
 * DVRO Questionnaire Map (S1, P1, R5, RL1, O12 …). Each fact is asked once
 * and fanned out to every form that needs it by the bindings in ./fill/forms.
 *
 * Dates are stored as ISO strings (YYYY-MM-DD) and formatted per form.
 * Nothing here is persisted: answers live in memory for the session only.
 */

export type YN = "Y" | "N" | "";
export type YND = "Y" | "N" | "DK" | "";
export type Gender = "M" | "F" | "X" | "";

export interface Address {
  street: string;
  city: string;
  state: string;
  zip: string;
}

export interface RosterPerson {
  id: string;
  /** PR1 full name */
  name: string;
  /** PR2 date of birth (ISO) */
  dob: string;
  /** Age if the date of birth is unknown */
  age: string;
  /** PR3 */
  gender: Gender;
  /** PR4 */
  race: string;
  /** PR5 relationship to the petitioner */
  relationship: string;
  /** PR6 lives with the petitioner */
  livesWithYou: YN;
  /** PR7 child the petitioner has with the respondent */
  sharedChild: YN;
  /** PR8 should the order protect this person */
  protect: YN;
  /** PR9 gross monthly income, and whether they pay part of household expenses (FL-150 item 12) */
  income?: string;
  paysExpenses?: YN;
}

/** C2: a restraining order in place or expired in the last 6 months */
export interface OrderRecord {
  type: string;
  dateMade: string;
  expires: string;
  caseNumber: string;
  county: string;
}

export type CaseType =
  | "custody"
  | "divorce"
  | "juvenile"
  | "guardianship"
  | "criminal"
  | "child support"
  | "other";

/** C4: another court case with the respondent (C5: a case about the children without them) */
export interface CaseRecord {
  type: CaseType;
  kind: string;
  where: string;
  year: string;
  caseNumber: string;
  /** Does the case involve your children? (prints on DV-105 item 5a when Y) */
  kids?: YN;
}

// ---------------------------------------------------------------- custody (Step 8)

export type Guardian = "" | "parent" | "legal guardian" | "other";
export type LivedWith = "me" | "respondent" | "other";

/** K2 / K2B: one place the children lived. Row 0 is where they live now. */
export interface Residence {
  /** YYYY-MM */
  from: string;
  /** YYYY-MM (not asked for row 0) */
  until: string;
  city: string;
  state: string;
  /** Row 0 only: keep the address private (prints the state only). */
  private: boolean;
  livedWith: LivedWith[];
  otherRelationship: string;
}

/** K2A: children who lived in the same places, with their history (K2B). */
export interface ResidenceGroup {
  /** Roster ids */
  children: string[];
  rows: Residence[];
}

/** K9 / K12: who supervises visits or exchanges. */
export interface Supervisor {
  type: "" | "professional" | "trusted person";
  name: string;
  feeMe: string;
  feeRespondent: string;
  feeOtherName: string;
  feeOther: string;
  agreed: boolean;
}

export const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;
export type Weekday = (typeof WEEKDAYS)[number];

export interface VisitDay {
  on: boolean;
  /** HH:MM (24-hour, from <input type="time">) */
  start: string;
  end: string;
  virtual: boolean;
  whoBrings: string;
  place: string;
}

/** K14: the weekly visit chart on DV-105 item 12 or 13. */
export interface Schedule {
  days: Record<Weekday, VisitDay>;
  repeat: "" | "every week" | "every other week" | "other";
  repeatOther: string;
  /** ISO date */
  startDate: string;
}

/** Step 6 incident card (A1–A7) */
export interface IncidentCard {
  A1: string;
  A2: YND;
  A2names: string;
  A3: YN;
  /** Which weapon (sets A3 and A3text): none, a gun, or another weapon described in A3text */
  A3kind?: "" | "none" | "gun" | "other";
  A3text: string;
  A4: YN;
  A4text: string;
  A5: YND;
  A6: string;
  A7: "" | "once" | "2-5" | "weekly" | "other";
  A7other: string;
  A7dates: string;
  /** A8: did police give an emergency protective order (asked when A5 = Y; printed on DV-101) */
  A8: YND;
  A8protects: "" | "you" | "respondent";
}

/** I3: a witness who needs an interpreter (one INT-300 each). */
export interface Witness {
  name: string;
  language: "same" | "other";
  otherLanguage: string;
}

export interface Firearm {
  what: string;
  count: string;
  where: string;
}

export interface Animal {
  name: string;
  type: string;
  breed: string;
  color: string;
}

export interface Debt {
  payTo: string;
  for: string;
  amount: string;
  due: string;
  fromAbuse: boolean;
}

export interface Expense {
  payTo: string;
  for: string;
  amount: string;
}

export interface PhoneNumber {
  whose: "mine" | "child";
  phone: string;
}

export type RelationshipKind =
  | "children"
  | "married"
  | "formerly married"
  | "dating"
  | "engaged"
  | "related"
  | "live together";

export type OrderId =
  | "O10" | "O11" | "O12" | "O13" | "O14" | "O15" | "O16" | "O17" | "O18" | "O19"
  | "O20" | "O21" | "O22" | "O23" | "O24" | "O25" | "O26" | "O27" | "O28";

/** FL-150 income types (F2), in item 5–6 order. */
export const INCOME_TYPES = [
  "wages",
  "overtime",
  "commissions or bonuses",
  "public assistance",
  "spousal support",
  "partner support",
  "pension",
  "Social Security",
  "disability",
  "unemployment",
  "workers' comp",
  "other",
  "interest or dividends",
  "rental",
  "trust",
  "other investment",
] as const;
export type IncomeType = (typeof INCOME_TYPES)[number];

export interface IncomeAmount {
  lastMonth: string;
  average: string;
  /** spousal/partner support: from this or a different marriage/partnership */
  from?: "this" | "different" | "";
  /** spousal support: federally taxable */
  taxable?: boolean;
  /** disability: Social Security, SDI, private insurance */
  kinds?: string[];
  /** other / other investment: what it is */
  describe?: string;
}

export interface InstallmentDebt {
  paidTo: string;
  for: string;
  amount: string;
  balance: string;
  lastPayment: string;
}

/** FL-150 item 13 expense lines (F11), keyed as on the form. */
export const EXPENSE_LINES = [
  ["property tax", "Property taxes"],
  ["home insurance", "Homeowner's or renter's insurance"],
  ["maintenance", "Home maintenance and repair"],
  ["health care", "Health care not paid by insurance"],
  ["child care", "Child care"],
  ["groceries", "Groceries and household supplies"],
  ["eating out", "Eating out"],
  ["utilities", "Utilities (gas, electric, water, trash)"],
  ["telephone", "Phone, cell phone, and internet"],
  ["laundry", "Laundry and cleaning"],
  ["clothes", "Clothes"],
  ["education", "Education"],
  ["entertainment", "Entertainment, gifts, and vacation"],
  ["auto", "Car payments, gas, repairs, insurance, and transit"],
  ["other insurance", "Life, accident, and other insurance"],
  ["savings", "Savings and investments"],
  ["charity", "Charitable contributions"],
] as const;

export interface Answers {
  // Step 0 · setup
  S1: string;
  /** Courthouse id when the county has more than one (see courthouses.ts). */
  S2: string;
  S3: "new" | "update";
  S4: string;
  S5: YN;
  L1: string;
  L2: string;
  L3: string;
  L4: Address;
  L5: { phone: string; fax: string; email: string };

  // Step 1 · you
  P1: string;
  P2: string;
  P3: string;
  P4: Gender;
  P5: string;
  P6: Address;
  P7: string;
  P8: { email: string; fax: string };
  P9: YN;
  P9language: string;

  // Step 2 · respondent
  R1: string;
  R2: string;
  R3: string;
  R4: string;
  R5: Gender;
  R6: string;
  R7: { height: string; weight: string; hair: string; eyes: string };
  R8: string;
  R9: { number: string; state: string };
  R10: string;
  R11: { type: string; model: string; year: string; color: string; plate: string };
  R12: string;
  R13: { name: string; address: string };
  R14: Address;
  R17: YND;
  R17language: string;
  R18: YND;
  R19: Firearm[];
  R20: YND;
  R20details: string;

  // Step 3 · relationship
  RL1: RelationshipKind[];
  RL2: string[];
  RL3: YN;
  RL4: "" | "no" | "together" | "same building" | "same neighborhood" | "other";
  RL4other: string;

  // Step 4 · roster
  roster: RosterPerson[];
  PR10: string;

  /** PR14 keep a protected child's information confidential (adds DV-160, DV-165, DV-170, DV-175) */
  PR14: YN;
  /** M1 who is asking */
  M1: "" | "parent" | "legal guardian" | "the minor";
  /** M2 roster ids of the minors */
  M2: string[];
  /** M3 same information for every minor */
  M3: YN;
  /** M4 what to keep from the public: name, address, other */
  M4: string[];
  M5: Address;
  M6: { location: string; text: string }[];
  M7: string;
  M8: string;
  M9: "" | "cancel" | "go forward";
  M10: { what: string[]; otherText: string; why: string; whatWouldHappen: string; ifDenied: "" | "cancel" | "go forward" };
  M11: { who: string[]; otherName: string; what: string[] };

  // Step 5 · other cases and orders
  C1: YN;
  C2: OrderRecord[];
  C3: YN;
  C4: CaseRecord[];

  // Step 6 · incidents
  cards: IncidentCard[];

  // Step 7 · orders
  orders: Partial<Record<OrderId, boolean>>;
  O12: {
    places: string[];
    placesOther: string;
    distance: "100 yards" | "other";
    distanceYards: string;
    workCompany: string;
    school: string;
    sameOther: string;
  };
  O13: { address: string; reasons: string[]; years: string; months: string; otherText: string };
  O14: string;
  O16: {
    animals: Animal[];
    stayAway: boolean;
    distance: "100 yards" | "other";
    distanceYards: string;
    noHarm: boolean;
    soleCare: boolean;
    soleCareWhy: string[];
    soleCareOther: string;
  };
  O17: { property: string; why: string };
  O21: string;
  O22: { debts: Debt[]; why: string; finding: YN; how: string };
  O23: Expense[];
  O28: PhoneNumber[];

  // Step 8 · custody (DV-105, DV-105(A), DV-140) — shown when O15
  /** PR11 your relationship to the shared children */
  PR11: Guardian;
  PR11other: string;
  /** PR12 the respondent's relationship to them */
  PR12: Guardian;
  PR12other: string;
  /** PR13 another parent or legal guardian */
  PR13: { has: YN; name: string; role: "" | "parent" | "legal guardian" };
  /** C5 other cases about the children that don't involve the respondent */
  C5: YN;
  C5cases: CaseRecord[];
  /** C6 custody or visitation order in effect now; C7 what it says; C8 why change it */
  C6: YN;
  C7: string;
  C8: string;
  /** K1 all the children lived in the same places for the last 5 years */
  K1: YN;
  K2: Residence[];
  K2A: ResidenceGroup[];
  /** K3 limit where the respondent can take the children */
  K3: { on: YN; places: string[]; countyName: string; otherPlaces: string };
  /** K4 block the respondent from the children's records (the form asks the reverse) */
  K4: { on: YN; children: "" | "all" | "named"; named: string[]; records: string[]; otherText: string };
  /** K5 worried they might take the children */
  K5: YN;
  /** K6 custody orders */
  K6: { on: YN; legal: string; legalOther: string; physical: string; physicalOther: string };
  K7: "" | "no visits" | "yes" | "virtual only";
  /** K8 supervised visits */
  K8: YN;
  K9: Supervisor;
  K10: { kind: "" | "safe place" | "virtual" | "other"; otherText: string };
  K11: { kind: "" | "once a week" | "twice a week" | "other" | "schedule"; hours: string; otherText: string };
  /** K12 supervised exchanges (unsupervised visits) */
  K12on: YN;
  K12: Supervisor;
  K13: string;
  /** Use the weekly chart for unsupervised visits */
  K14use: boolean;
  K14: Schedule;

  // Step 9 · abduction (DV-108, DV-145) — shown when K5 = Y
  B1: YN;
  B2: YN;
  B3: string[];
  B3other: string;
  B4: string[];
  B5: YN;
  B6: string[];
  B6county: string;
  B6state: string;
  B6country: string;
  B7: { citizen: YN; countries: string; strongTies: YN };
  B8: string;
  B9: string[];
  B10: { documents: string; date: string; giveTo: string };
  B11: string[];
  B11other: string;
  B12: string;
  B13: { embassy: string; proofDate: string };
  B14: string;
  B15: string;

  // Step 7a · wireless transfer (DV-900)
  W1: string;
  W2: string;
  W3: string;
  W4: string;
  /** DV-901: how the phone company can reach you (never shown to the respondent) */
  W5: string;
  W6: string;
  W7: string;
  W8: Address;

  // Step 10 · finances (FL-150) — shown when O24, O25 or O26
  /** O24 child support: what applies */
  O24status: string[];
  /** L6 lawyer's hourly rate (O26 with a lawyer) */
  L6: string;
  /** F1 self-employed */
  F1: YN;
  F2: IncomeType[];
  F3: Partial<Record<IncomeType, IncomeAmount>>;
  F4: {
    employed: YN;
    employer: string;
    employerAddress: string;
    employerPhone: string;
    occupation: string;
    startDate: string;
    endDate: string;
    hoursPerWeek: string;
    pay: string;
    payPeriod: "" | "month" | "week" | "hour";
  };
  F5: {
    highSchool: YN;
    highestGrade: string;
    collegeYears: string;
    collegeDegrees: string;
    gradYears: string;
    gradDegrees: string;
    licenses: string;
    vocational: string;
  };
  F6: {
    lastYearFiled: string;
    status: "" | "single" | "head of household" | "married filing separately" | "married filing jointly";
    jointFilerName: string;
    state: string;
    exemptions: string;
  };
  F7: { lastMonth: string; average: string; role: "" | "owner" | "partner" | "other"; roleOther: string; years: string; name: string; type: string };
  F8: { oneTime: string; change: string };
  /** F9 monthly deductions */
  F9: {
    unionDues: string;
    retirement: string;
    healthInsurance: string;
    otherChildSupport: string;
    spousalSupport: string;
    spousalTaxDeductible: boolean;
    partnerSupport: string;
    jobExpenses: string;
    jobExpensesWhy: string;
  };
  F10: { cash: string; stocks: string; property: string; real: boolean; personal: boolean };
  F11: {
    basis: "" | "estimated" | "actual" | "proposed";
    housing: "" | "rent" | "mortgage";
    rentOrMortgage: string;
    mortgagePrincipal: string;
    mortgageInterest: string;
    lines: Partial<Record<(typeof EXPENSE_LINES)[number][0], string>>;
    otherDescribe: string;
    other: string;
    paidByOthers: string;
  };
  F12: InstallmentDebt[];
  F13: { paid: string; source: string; owed: string };
  F14: { amount: string; basis: string };
  F16: { percentMe: string; percentRespondent: string; schedule: string };
  F17: { available: YN; company: string; address: string; cost: string };
  F18: { childcare: string; health: string; travel: string; specialNeeds: string; specialNeedsDescribe: string };
  F19: {
    healthAmount: string;
    healthMonths: string;
    lossesAmount: string;
    lossesMonths: string;
    otherChildrenAmount: string;
    otherChildrenMonths: string;
    supportReceived: string;
    why: string;
  };
  F20: string;

  // Interpreter (INT-300)
  I1: YN;
  /** One of INT300_LANGUAGES, or "other" */
  I1language: string;
  I1other: string;
  /** Town of origin, for an indigenous language */
  I2: string;
  I3: Witness[];

  // Step 11 · service (SER-001)
  V1: "" | "sheriff" | "adult" | "unsure";
  /** County where they will be served */
  V2: string;
  V3: string;
  /** Papers to serve as typed on the sheriff page's own SER-001 form (item 5b); blank = work it out from the answers. */
  V4: string;
  R15: {
    kind: "home" | "business";
    /** Blank street = use the home address (R14). */
    address: Address;
    instructions: string;
    bestTime: string;
    altKind: "" | "home" | "business";
    alt: Address;
    altInstructions: string;
    altBestTime: string;
  };
  R16: YN;
  R16facility: string;
  R21: string[];
  R21other: string;
  R22: YN;

  // Step 11 · signing
  G1: string;
  /** Drawn signatures (PNG data URLs); blank means sign the printed forms by hand. */
  sig: string;
  lawyerSig: string;
}
