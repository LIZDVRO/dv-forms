import type { Address, Answers, IncidentCard, RosterPerson } from "./types";

export const emptyAddress = (): Address => ({ street: "", city: "", state: "CA", zip: "" });

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

    W1: "",
    W2: "",
    W3: "",
    W4: "",

    G1: todayISO(),
  };
}
