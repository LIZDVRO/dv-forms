import { WEEKDAYS } from "./types";
import type { Address, Answers, IncidentCard, Residence, RosterPerson, Schedule, Supervisor, VisitDay, Weekday } from "./types";

export const emptyAddress = (): Address => ({ street: "", city: "", state: "CA", zip: "" });

export const emptyResidence = (): Residence => ({
  from: "",
  until: "",
  city: "",
  state: "CA",
  private: false,
  livedWith: [],
  otherRelationship: "",
});

export const emptySupervisor = (): Supervisor => ({
  type: "",
  name: "",
  feeMe: "",
  feeRespondent: "",
  feeOtherName: "",
  feeOther: "",
  agreed: false,
});

const emptyDay = (): VisitDay => ({ on: false, start: "", end: "", virtual: false, whoBrings: "", place: "" });

export const emptySchedule = (): Schedule => ({
  days: Object.fromEntries(WEEKDAYS.map((d) => [d, emptyDay()])) as Record<Weekday, VisitDay>,
  repeat: "",
  repeatOther: "",
  startDate: "",
});

export const emptyCard = (): IncidentCard => ({
  A1: "",
  A2: "",
  A2names: "",
  A3: "",
  A3text: "",
  A4: "",
  A4text: "",
  A5: "",
  A6: "",
  A7: "",
  A7other: "",
  A7dates: "",
});

let nextId = 0;
export const emptyPerson = (): RosterPerson => ({
  id: `p${Date.now()}-${nextId++}`,
  name: "",
  dob: "",
  age: "",
  gender: "",
  race: "",
  relationship: "",
  livesWithYou: "",
  sharedChild: "",
  protect: "",
});

export function todayISO(): string {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

export function emptyAnswers(): Answers {
  return {
    S1: "",
    S2: "",
    S3: "new",
    S4: "",
    S5: "",
    L1: "",
    L2: "",
    L3: "",
    L4: emptyAddress(),
    L5: { phone: "", fax: "", email: "" },

    P1: "",
    P2: "",
    P3: "",
    P4: "",
    P5: "",
    P6: emptyAddress(),
    P7: "",
    P8: { email: "", fax: "" },
    P9: "",
    P9language: "",

    R1: "",
    R2: "",
    R3: "",
    R4: "",
    R5: "",
    R6: "",
    R7: { height: "", weight: "", hair: "", eyes: "" },
    R8: "",
    R9: { number: "", state: "" },
    R10: "",
    R11: { type: "", model: "", year: "", color: "", plate: "" },
    R12: "",
    R13: { name: "", address: "" },
    R14: emptyAddress(),
    R17: "",
    R17language: "",
    R18: "",
    R19: [],
    R20: "",
    R20details: "",

    RL1: [],
    RL2: [],
    RL3: "",
    RL4: "",
    RL4other: "",

    roster: [],
    PR10: "",

    C1: "",
    C2: [],
    C3: "",
    C4: [],

    cards: [emptyCard()],

    orders: { O10: true },
    O12: {
      places: [],
      placesOther: "",
      distance: "100 yards",
      distanceYards: "",
      workCompany: "",
      school: "",
      sameOther: "",
    },
    O13: { address: "", reasons: [], years: "", months: "", otherText: "" },
    O14: "",
    O16: {
      animals: [],
      stayAway: false,
      distance: "100 yards",
      distanceYards: "",
      noHarm: false,
      soleCare: false,
      soleCareWhy: [],
      soleCareOther: "",
    },
    O17: { property: "", why: "" },
    O21: "",
    O22: { debts: [], why: "", finding: "", how: "" },
    O23: [],
    O28: [],

    PR11: "",
    PR11other: "",
    PR12: "",
    PR12other: "",
    PR13: { has: "", name: "", role: "" },
    C5: "",
    C5cases: [],
    C6: "",
    C7: "",
    C8: "",
    K1: "",
    K2: [emptyResidence()],
    K2A: [],
    K3: { on: "", places: [], countyName: "", otherPlaces: "" },
    K4: { on: "", children: "all", named: [], records: [], otherText: "" },
    K5: "",
    K6: { on: "", legal: "", legalOther: "", physical: "", physicalOther: "" },
    K7: "",
    K8: "",
    K9: emptySupervisor(),
    K10: { kind: "", otherText: "" },
    K11: { kind: "", hours: "", otherText: "" },
    K12on: "",
    K12: emptySupervisor(),
    K13: "",
    K14use: false,
    K14: emptySchedule(),

    B1: "",
    B2: "",
    B3: [],
    B3other: "",
    B4: [],
    B5: "",
    B6: [],
    B6county: "",
    B6state: "",
    B6country: "",
    B7: { citizen: "", countries: "", strongTies: "" },
    B8: "",
    B9: [],
    B10: { documents: "", date: "", giveTo: "" },
    B11: [],
    B11other: "",
    B12: "",
    B13: { embassy: "", proofDate: "" },
    B14: "",
    B15: "",

    W1: "",
    W2: "",
    W3: "",
    W4: "",

    G1: todayISO(),
  };
}
