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
  a.cards = [c1, c2];

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
  return a;
}
