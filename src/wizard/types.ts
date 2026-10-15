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

/** C4: another court case with the respondent */
export interface CaseRecord {
  type: CaseType;
  kind: string;
  where: string;
  year: string;
  caseNumber: string;
}

/** Step 6 incident card (A1–A7) */
export interface IncidentCard {
  A1: string;
  A2: YND;
  A2names: string;
  A3: YN;
  A3text: string;
  A4: YN;
  A4text: string;
  A5: YND;
  A6: string;
  A7: "" | "once" | "2-5" | "weekly" | "other";
  A7other: string;
  A7dates: string;
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
  | "O10" | "O11" | "O12" | "O13" | "O14" | "O16" | "O17" | "O18" | "O19"
  | "O20" | "O21" | "O22" | "O23" | "O27" | "O28";

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

  // Step 7a · wireless transfer (DV-900)
  W1: string;
  W2: string;
  W3: string;
  W4: string;

  // Step 11 · signing
  G1: string;
}
