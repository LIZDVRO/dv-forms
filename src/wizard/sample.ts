/**
 * A made-up sample case used by scripts/check-wizard.ts and the
 * "fill with sample answers" link on /wizard?sample (staff testing only).
 * It deliberately overflows several tables so the attached sheets get exercised.
 */
import { emptyAnswers, emptyCard, emptyPerson } from "./defaults";
import type { Answers } from "./types";

export function sampleAnswers(): Answers {
  const a = emptyAnswers();
  a.S1 = "Fresno";
  a.S5 = "N";
  a.P1 = "Maria Elena Sample";
  a.P2 = "1990-04-12";
  a.P4 = "F";
  a.P5 = "Hispanic";
  a.P6 = { street: "PO Box 1234", city: "Fresno", state: "CA", zip: "93721" };
  a.P7 = "(559) 555-0101";
  a.P8 = { email: "maria.sample@example.com", fax: "" };
  a.P9 = "Y";

  a.R1 = "John Robert Example";
  a.R2 = "Johnny";
  a.R3 = "1987-09-30";
  a.R5 = "M";
  a.R6 = "White";
  a.R7 = { height: "5'11\"", weight: "190 lb", hair: "Brown", eyes: "Blue" };
  a.R8 = "Tattoo of an eagle on left forearm";
  a.R9 = { number: "D1234567", state: "CA" };
  a.R11 = { type: "Pickup", model: "Ford F-150", year: "2018", color: "Black", plate: "8ABC123" };
  a.R12 = "(559) 555-0199";
  a.R13 = { name: "Valley Auto Repair", address: "500 Main St, Fresno, CA 93721" };
  a.R14 = { street: "742 Elm Street", city: "Fresno", state: "CA", zip: "93722" };
  a.R17 = "Y";
  a.R18 = "Y";
  a.R19 = [
    { what: "Handgun (9mm)", count: "1", where: "Nightstand" },
    { what: "Rifle", count: "1", where: "Garage" },
  ];
  a.R20 = "N";

  a.RL1 = ["children", "formerly married", "live together"];
  a.RL3 = "Y";
  a.RL4 = "together";

  const kid = (name: string, dob: string) => ({
    ...emptyPerson(),
    name,
    dob,
    relationship: "Child",
    livesWithYou: "Y" as const,
    sharedChild: "Y" as const,
    protect: "Y" as const,
    gender: "F" as const,
    race: "Hispanic",
  });
  a.roster = [
    kid("Sofia Sample", "2015-06-01"),
    kid("Lucas Sample", "2017-02-14"),
    kid("Ana Sample", "2019-11-20"),
    kid("Mateo Sample", "2021-08-08"),
    { ...emptyPerson(), name: "Rosa Sample", dob: "1960-01-15", relationship: "Mother", livesWithYou: "N", protect: "Y", gender: "F", race: "Hispanic" },
  ];
  a.PR10 = "He has threatened my mother when she visits, and the children were present during the last two incidents.";

  a.C1 = "Y";
  a.C2 = [{ type: "Police emergency protective order", dateMade: "2026-10-01", expires: "2026-10-08", caseNumber: "EPO-55512", county: "Fresno" }];
  a.C3 = "Y";
  a.C4 = [{ type: "divorce", kind: "", where: "Fresno, CA", year: "2024", caseNumber: "24FL0001", }];

  const c1 = emptyCard();
  c1.A1 = "2026-10-01";
  c1.A2 = "Y";
  c1.A2names = "Sofia (child), neighbor Ms. Lee";
  c1.A3 = "Y";
  c1.A3text = "He took the handgun from the nightstand and held it while yelling.";
  c1.A4 = "Y";
  c1.A4text = "Bruises on my arms; I could not sleep for days.";
  c1.A5 = "Y";
  c1.A6 = Array(8)
    .fill(
      "He came home angry, accused me of hiding money, grabbed my arms and pushed me against the wall. He said that if I called anyone he would make sure I never saw the children again.",
    )
    .join(" ");
  c1.A7 = "2-5";
  c1.A7dates = "August and September 2026";
  const c2 = emptyCard();
  c2.A1 = "2026-08-15";
  c2.A2 = "N";
  c2.A3 = "N";
  c2.A4 = "Y";
  c2.A4text = "Fear and anxiety.";
  c2.A5 = "N";
  c2.A6 = "He took my phone and read my messages, then followed me to work and waited in the parking lot.";
  c2.A7 = "weekly";
  // Cards 4–7 exercise DV-101 (items 3, 4 and the item 5 overflow).
  const more = (date: string, text: string, extra: Partial<typeof c1> = {}) => ({ ...emptyCard(), A1: date, A6: text, A2: "N" as const, A5: "N" as const, A7: "once" as const, ...extra });
  a.cards = [
    c1,
    c2,
    more("2026-07-04", "He threw a glass at the wall next to my head during a family party."),
    more("2026-05-20", "He pushed me out of the car and drove off, leaving me on the side of the highway at night.", {
      A4: "Y",
      A4text: "Scraped knees and hands.",
      A5: "Y",
      A8: "Y",
      A8protects: "you",
    }),
    more("2026-03-02", "He broke my phone so I could not call my sister.", { A2: "Y", A2names: "Sofia (child)" }),
    more("2026-01-15", "He screamed at me and blocked the door for an hour."),
    more("2025-11-28", "He took the car keys and my wallet and left me at home with no money for two days.", { A7: "2-5" }),
  ];

  // Interpreter for me and one witness; the sheriff serves.
  a.I1 = "Y";
  a.I1language = "Spanish";
  a.I3 = [{ name: "Rosa Sample", language: "same", otherLanguage: "" }];
  a.V1 = "sheriff";
  a.R15.instructions = "Gate code 4512. Blue house at the end of the street.";
  a.R15.bestTime = "After 6 p.m.";
  a.R21 = ["violent history", "military or first-responder training"];
  a.V3 = "He has a large dog in the backyard.";

  a.orders = { O10: true, O11: true, O12: true, O13: true, O16: true, O18: true, O27: true };
  a.O12.places = ["me", "my home", "my job", "protected people", "children's school or childcare"];
  a.O13 = { address: "742 Elm Street, Fresno, CA 93722", reasons: ["lease", "live there with my children", "lived there"], years: "4", months: "2", otherText: "" };
  a.O16 = {
    animals: [{ name: "Luna", type: "Dog", breed: "Labrador", color: "Yellow" }],
    stayAway: true,
    distance: "100 yards",
    distanceYards: "",
    noHarm: true,
    soleCare: true,
    soleCareWhy: ["I care for them"],
    soleCareOther: "",
  };
  a.O28 = [{ whose: "mine", phone: "(559) 555-0101" }];
  a.W1 = "Example Wireless";

  // Custody (supervised visits on the chart) and abduction.
  a.orders.O15 = true;
  a.C4[0].kids = "Y";
  a.PR11 = "parent";
  a.PR12 = "parent";
  a.PR13 = { has: "N", name: "", role: "" };
  a.C5 = "N";
  a.C6 = "N";
  a.K1 = "Y";
  a.K2 = [
    { from: "2022-06", until: "", city: "Fresno", state: "CA", private: true, livedWith: ["me"], otherRelationship: "" },
    { from: "2019-01", until: "2022-06", city: "Clovis", state: "CA", private: false, livedWith: ["me", "respondent"], otherRelationship: "" },
    { from: "2018-03", until: "2019-01", city: "Visalia", state: "CA", private: false, livedWith: ["me", "other"], otherRelationship: "Grandmother" },
  ];
  a.K3 = { on: "Y", places: ["this county", "California"], countyName: "", otherPlaces: "" };
  a.K4 = { on: "Y", children: "all", named: [], records: ["medical", "school"], otherText: "" };
  a.K5 = "Y";
  a.K6 = { on: "Y", legal: "sole to me", legalOther: "", physical: "sole to me", physicalOther: "" };
  a.K7 = "yes";
  a.K8 = "Y";
  a.K9 = { type: "professional", name: "Safe Visits Fresno", feeMe: "0", feeRespondent: "100", feeOtherName: "", feeOther: "", agreed: false };
  a.K10 = { kind: "safe place", otherText: "" };
  a.K11 = { kind: "schedule", hours: "", otherText: "" };
  a.K14.days.Sat = { on: true, start: "10:00", end: "12:00", virtual: false, whoBrings: "Maria Elena Sample (petitioner)", place: "Safe Visits Fresno, 100 Center St" };
  a.K14.days.Wed = { on: true, start: "18:30", end: "19:00", virtual: true, whoBrings: "Maria (makes children available)", place: "Video call" };
  a.K14.repeat = "every week";
  a.K14.startDate = "2026-11-07";

  a.B1 = "N";
  a.B2 = "Y";
  a.B3 = ["quit a job", "applied for documents", "other"];
  a.B3other = "Asked the school for the children's records.";
  a.B4 = ["abusing you", "threatening to take the children"];
  a.B5 = "Y";
  a.B6 = ["another country"];
  a.B6country = "Canada";
  a.B7 = { citizen: "Y", countries: "Canada", strongTies: "Y" };
  a.B8 = "He said he would take the kids to his brother in Toronto and I would never find them. He quit his job last month and asked for copies of their birth certificates.";
  a.B9 = ["no move without permission", "surrender documents", "travel plan", "bond"];
  a.B10 = { documents: "Children's passports and his passport", date: "2026-11-01", giveTo: "Fresno County Sheriff" };
  a.B11 = ["schedule", "round-trip tickets"];
  a.B15 = "5000";
  return a;
}

/**
 * A second case for checks: the children lived apart (DV-105(A), three groups so
 * a second copy is made), unsupervised visits with supervised exchanges, and no abduction.
 */
export function sampleAnswersB(): Answers {
  const a = sampleAnswers();
  const [sofia, lucas, ana, mateo] = a.roster;
  a.K1 = "N";
  a.K2A = [
    {
      children: [sofia.id, lucas.id],
      rows: [
        { from: "2023-01", until: "", city: "Fresno", state: "CA", private: false, livedWith: ["me"], otherRelationship: "" },
        { from: "2020-05", until: "2023-01", city: "Reno", state: "NV", private: false, livedWith: ["respondent"], otherRelationship: "" },
      ],
    },
    {
      children: [ana.id],
      rows: [{ from: "2021-02", until: "", city: "Hanford", state: "CA", private: true, livedWith: ["other"], otherRelationship: "Aunt" }],
    },
    {
      children: [mateo.id],
      rows: [{ from: "2021-08", until: "", city: "Fresno", state: "CA", private: false, livedWith: ["me", "respondent"], otherRelationship: "" }],
    },
  ];
  a.PR11 = "other";
  a.PR11other = "Parent by adoption";
  a.PR12 = "legal guardian";
  a.PR13 = { has: "Y", name: "Carla Example", role: "legal guardian" };
  a.C5 = "Y";
  a.C5cases = [{ type: "juvenile", kind: "", where: "Kings County, CA", year: "2023", caseNumber: "23JV0042" }];
  a.C6 = "Y";
  a.C7 = "Joint legal custody; children live with me during the week and with him every other weekend.";
  a.C8 = "He has been violent in front of the children, so the visits are no longer safe without changes.";
  a.K4 = { on: "Y", children: "named", named: [sofia.id], records: ["activities", "other", "child's job"], otherText: "Church youth group" };
  a.K5 = "N";
  a.K6 = { on: "Y", legal: "joint", legalOther: "", physical: "other", physicalOther: "Primary to me" };
  a.K7 = "yes";
  a.K8 = "N";
  a.K12on = "Y";
  a.K12 = { type: "trusted person", name: "Rosa Sample", feeMe: "", feeRespondent: "", feeOtherName: "", feeOther: "", agreed: true };
  a.K10 = { kind: "other", otherText: "Grandmother's home" };
  a.K13 = "Every other weekend from Saturday 10 AM to Sunday 5 PM. Rosa drives the children both ways.";
  a.K14use = true;
  a.K14.repeat = "every other week";
  a.K14.days.Wed.on = false;
  a.K14.days.Sun = { on: true, start: "", end: "17:00", virtual: false, whoBrings: "Rosa Sample", place: "Rosa's home" };
  return a;
}
