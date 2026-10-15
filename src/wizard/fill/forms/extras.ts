/**
 * DV-101 (more incidents), INT-300 (interpreter request) and SER-001
 * (request for the sheriff to serve). Mirrors docs/field-map tabs of the same names.
 */
import type { Binding, FormSpec } from "../engine";
import { b, card, caseNo, contact, idx } from "../helpers";
import { courtCaption, custodyRequested, financesRequested, fmtDate, oneLine } from "../../derive";
import { INT300_LANGUAGES } from "../../languages";
import type { Answers, IncidentCard } from "../../types";

// ---------------------------------------------------------------- DV-101

export const DV101_SHEET = "DV-101—Description of Abuse";

const FREQ: Record<string, string> = { once: "Just this once", "2-5": "2 to 5 times", weekly: "Weekly" };
export function frequency(c: IncidentCard): string {
  const f = c.A7 === "other" ? c.A7other : FREQ[c.A7] ?? "";
  return [f, c.A7dates && `(${c.A7dates})`].filter(Boolean).join(" ");
}
const whoSaw = (c: IncidentCard) => (c.A2 === "Y" ? c.A2names : c.A2 === "N" ? "No one" : c.A2 === "DK" ? "I don't know" : "");
/** DV-101 has no "how often" field, so it is added to the description. */
const describe = (c: IncidentCard) => [c.A6.trim(), frequency(c) && `How often: ${frequency(c)}.`].filter(Boolean).join(" ");

/** Card 6 onward, one paragraph each, for DV-101 item 5. */
function laterCards(a: Answers): string {
  return a.cards
    .slice(5)
    .filter((c) => c.A6.trim() || c.A1.trim())
    .map((c) =>
      [
        `Date: ${fmtDate(c.A1) || "unknown"}.`,
        whoSaw(c) && `Who was there: ${whoSaw(c)}.`,
        describe(c),
        c.A3 === "Y" && `Weapons: ${c.A3text || "yes"}.`,
        c.A4 === "Y" && `Injuries or harm: ${c.A4text || "yes"}.`,
        c.A5 && `Police came: ${{ Y: "yes", N: "no", DK: "I don't know" }[c.A5]}.`,
        c.A8 === "Y" && `Police gave an emergency protective order protecting ${c.A8protects === "respondent" ? "the person in 2" : "me"}.`,
      ]
        .filter(Boolean)
        .join(" "),
    )
    .join("\n\n");
}

/** True when there are incidents beyond the three DV-100 holds. */
export const needsDV101 = (a: Answers) => !!card(a, 3);

function dv101Card(page: string, list: string, who: string, k: number, opts: string[]): Binding[] {
  const C = (a: Answers) => card(a, k);
  const P = `${page}.${list}`;
  // Option_cb widgets: police Yes, No; order Yes, No, Don't know; protects you, the person in 2.
  return [
    b(`${P}.Lia.RestrainedCity_ft`, (a) => fmtDate(C(a)?.A1)),
    b(`${P}.${who}`, (a) => (C(a) ? whoSaw(C(a)!) : "")),
    b(`${P}.${opts[0]}.TextField2`, (a) => (C(a) ? { long: describe(C(a)!), sheet: DV101_SHEET } : "")),
    b(`${P}.Lid.TextField2`, (a) => (C(a)?.A3 === "Y" ? { long: C(a)!.A3text, sheet: DV101_SHEET } : "")),
    b(`${P}.Lie.TextField2`, (a) => (C(a)?.A4 === "Y" ? { long: C(a)!.A4text, sheet: DV101_SHEET } : "")),
    b(`${P}.Lif.Option_cb`, (a) => C(a)?.A5 === "Y"),
    b(`${P}.Lif.Option_cb[1]`, (a) => C(a)?.A5 === "N"),
    b(`${P}.Lif.Option_cb[2]`, (a) => C(a)?.A5 === "Y" && C(a)?.A8 === "Y"),
    b(`${P}.Lif.Option_cb[3]`, (a) => C(a)?.A5 === "Y" && C(a)?.A8 === "N"),
    b(`${P}.Lif.Option_cb[4]`, (a) => C(a)?.A5 === "Y" && C(a)?.A8 === "DK"),
    b(`${P}.Lif.Option_cb[5]`, (a) => C(a)?.A8 === "Y" && C(a)?.A8protects === "you"),
    b(`${P}.Lif.Option_cb[6]`, (a) => C(a)?.A8 === "Y" && C(a)?.A8protects === "respondent"),
  ];
}

export const DV101: FormSpec = {
  id: "DV-101",
  file: "/forms/DV-101.pdf",
  root: "DV-101[0]",
  bindings: [
    b("Page1.P1Caption.Stamp_court_case.CaseNumber_ft", caseNo),
    b("Page2.PXCaption.CaseNumber_ft", caseNo),
    b("Page1.Item1.ProtectedFullName_ft", (a) => a.P1),
    b("Page1.Item2.ProtectedFullName_ft", (a) => a.R1),
    ...dv101Card("Page1", "List3", "Lib.who_ft", 3, ["Lib"]),
    ...dv101Card("Page2", "List4", "Lib.#area.who_ft", 4, ["Lic"]),
    b("Page2.Item5.TextField2", (a) => {
      const t = laterCards(a);
      return t ? { long: t, sheet: DV101_SHEET } : "";
    }),
  ],
  // "Describe any injuries:" is printed on the first line of its field.
  indents: { "Page1.List3.Lie.TextField2": 101, "Page2.List4.Lie.TextField2": 101 },
  after: ({ sheets }) => [b("Page2.Item5.FieldName_cb", () => sheets.some((s) => s.title === DV101_SHEET))],
};

// ---------------------------------------------------------------- INT-300

export { INT300_LANGUAGES };

/**
 * INT-300 for the petitioner (witness = undefined) or for witness w (0-based).
 * One form per person who needs an interpreter (map Step 1, Interpreter).
 */
export function int300(witness?: number): FormSpec {
  const forMe = witness === undefined;
  const W = (a: Answers) => (forMe ? undefined : a.I3[witness]);
  /** Language boxes show the petitioner's language: on their copy, and on a witness copy marked "same as above". */
  const showLang = (a: Answers) => a.I1 === "Y" && (forMe || W(a)?.language === "same");
  const out: Binding[] = [
    b("Page1.Stamp_court_case.CourtInfo_ft", (a) => courtCaption(a)),
    b("Page1.Stamp_court_case.CaseNumber_ft", caseNo),
    b("Page2.CaseNumber_ft", caseNo),
    b("Page2.ReqFullName_ft", (a) => a.P1),
    // 1 · the person asking (the lawyer, if any)
    b("Page1.ReqFullName_ft", (a) => (a.S5 === "Y" ? a.L1 : a.P1)),
    b("Page1.ProtectedLawyerBar_no", (a) => (a.S5 === "Y" ? a.L2 : "")),
    b("Page1.ProtectedLawyerFirm_ft", (a) => (a.S5 === "Y" ? a.L3 : "")),
    b("Page1.ProtectedStreet_ft", contact.street),
    b("Page1.ProtectedCity_ft", contact.city),
    b("Page1.ProtectedState_ft", contact.state),
    b("Page1.ProtectedZip_ft", contact.zip),
    b("Page1.ProtectedPhone_ft", contact.phone),
    b("Page1.ProtectedEmail_ft", contact.email),
    // 2 · always Plaintiff/Petitioner
    b("Page1.HearingPetitionerRequest_cb", () => true),
    b("Page1.HearingPetitionerRequest_cb[1]", () => false),
    b("Page1.HearingPetitionerRequest_cb[2]", () => false),
    b("Page1.OldHearingTime_dt", () => ""),
    // 3 · I need an interpreter
    b("Page1.T227", (a) => forMe && a.I1 === "Y"),
    ...INT300_LANGUAGES.map((lang, i) =>
      b(i === 9 ? "Page1.#area[5].CheckBox64[10]" : `Page1.CheckBox64[${i + 1}]`, (a) => showLang(a) && a.I1language === lang),
    ),
    b("Page1.HearingPetitionerRequest_cb[3]", (a) => showLang(a) && a.I1language === "other"),
    b("Page1.OldHearingTime_dt[1]", (a) => (showLang(a) && a.I1language === "other" ? a.I1other : "")),
    b("Page1.ProtectedEmail_ft[1]", (a) => (showLang(a) && a.I1language === "other" ? a.I2 : "")),
    // 4 · a witness needs an interpreter; no court date is set yet at filing
    b("Page1.#field[33]", (a) => !!W(a)),
    b("Page1.CheckBox64", (a) => !!W(a)),
    b("Page1.HearingDate_dt", () => ""),
    b("Page1.HearingTime_dt", () => ""),
    b("Page1.HearingRoom_ft", () => ""),
    b("Page1.CheckBox64[11]", (a) => W(a)?.language === "same"),
    b("Page1.HearingPetitionerRequest_cb[4]", (a) => W(a)?.language === "other"),
    b("Page1.OldHearingTime_dt[2]", (a) => (W(a)?.language === "other" ? W(a)!.otherLanguage : "")),
    b("Page1.CH116Signature_dt", (a) => fmtDate(a.G1)),
  ];
  return { id: "INT-300", copy: forMe ? 1 : witness + 2, file: "/forms/INT-300.pdf", root: "topmostSubform[0]", bindings: out };
}

/** INT-300 copies for these answers: the petitioner's (if needed), then one per witness. */
export function int300Forms(a: Answers): FormSpec[] {
  const forms: FormSpec[] = [];
  if (a.I1 === "Y") forms.push(int300());
  a.I3.forEach((_w, i) => forms.push(int300(i)));
  // Number copies 1, 2, 3 … in output order.
  return forms.map((f, i) => ({ ...f, copy: i + 1 }));
}

// ---------------------------------------------------------------- SER-001

/** The papers the respondent is served with (map: "Service set"). */
export function serviceList(a: Answers): string {
  const custody = custodyRequested(a);
  const filed = ["DV-100", ...(custody ? ["DV-105"] : []), ...(custody && a.K5 === "Y" ? ["DV-108"] : []), "DV-109", "DV-110"];
  if (custody) filed.push("DV-140");
  if (custody && a.K5 === "Y") filed.push("DV-145");
  if (a.orders.O28) filed.push("DV-900");
  if (financesRequested(a)) filed.push("FL-150");
  const blank = ["DV-120", "DV-120-INFO", "DV-250", ...(financesRequested(a) ? ["FL-150"] : []), ...(custody ? ["DV-125"] : []), ...(a.R18 === "Y" ? ["DV-800", "DV-800-INFO"] : [])];
  return `Filed: ${filed.join(", ")}. Blank: ${blank.join(", ")}.`;
}

const described = (a: Answers) =>
  !!(a.R3 || a.R4 || a.R5 || a.R6 || a.R8 || Object.values(a.R7).some(Boolean) || Object.values(a.R11).some(Boolean));
const hasGun = (a: Answers) => a.R18 === "Y" || a.cards.some((c) => c.A3 === "Y");
const safety = (a: Answers) => hasGun(a) || a.R21.length > 0 || a.R17 === "N";

/** The main service address: the one given for service, or else the home address. */
const mainAddr = (a: Answers) => (a.R15.address.street.trim() ? a.R15.address : a.R14);
/** Alternate address: the one given, or else the employer (as a business address). */
const altUsesEmployer = (a: Answers) => !a.R15.alt.street.trim() && !!a.R13.address.trim();

const S: Binding[] = [
  b("Page1.CaptionRight.CaseNo.CaseNumber", caseNo),
  ...[2, 3, 4, 5].map((p) => b(`Page${p}.PxCaption.CaseNumber`, caseNo)),
  b("Page1.List1.Li1.NameofCounty", (a) => a.V2 || a.S1),
  b("Page1.List2.Li2a.Yourname", (a) => a.P1),
  b("Page1.List2.Li2b.lawyersname\\.2b", (a) => (a.S5 === "Y" ? a.L1 : "")),
  b("Page1.List2.Li2b.firmname", (a) => (a.S5 === "Y" ? a.L3 : "")),
  b("Page1.List2.Li2c.TextField", (a) => (a.P1 && a.R1 ? `${a.P1} v. ${a.R1}` : "")),
  b("Page1.List2.Li2d.address\\.2d", contact.street),
  b("Page1.List2.Li2d.city\\.2d", contact.city),
  b("Page1.List2.Li2d.state\\.2d", contact.state),
  b("Page1.List2.Li2d.zip\\.2d", contact.zip),
  b("Page1.List2.Li2d.telephone\\.2d", contact.phone),
  b("Page1.List2.Li2d.email\\.2d", contact.email),

  // 3a · the person to serve
  b("Page2.List3.Li3a.servePerson", () => true),
  b("Page2.List3.Li3a.Li3aList.Li3a1.personName", (a) => a.R1),
  b("Page2.List3.Li3a.Li3aList.Li3a1.nicknames", (a) => a.R2),
  b("Page2.List3.Li3a.Li3aList.Li3a2.Telephone", (a) => a.R12),
  b("Page2.List3.Li3a.Li3aList.Li3a3.Description", (a) => !described(a)),
  b("Page2.List3.Li3a.Li3aList.Li3a3.Description[1]", (a) => described(a)),
  b("Page2.List3.Li3a.Li3aList.Li3a3.gender", (a) => a.R5 === "M"),
  b("Page2.List3.Li3a.Li3aList.Li3a3.gender[1]", (a) => a.R5 === "F"),
  b("Page2.List3.Li3a.Li3aList.Li3a3.gender[2]", (a) => a.R5 === "X"),
  b("Page2.List3.Li3a.Li3aList.Li3a3.Height", (a) => a.R7.height),
  b("Page2.List3.Li3a.Li3aList.Li3a3.Weight", (a) => a.R7.weight),
  b("Page2.List3.Li3a.Li3aList.Li3a3.Hair", (a) => a.R7.hair),
  b("Page2.List3.Li3a.Li3aList.Li3a3.Eye", (a) => a.R7.eyes),
  b("Page2.List3.Li3a.Li3aList.Li3a3.DOB\\.age", (a) => (a.R3 ? fmtDate(a.R3) : a.R4 ? `${a.R4} (estimate)` : "")),
  b("Page2.List3.Li3a.Li3aList.Li3a3.raceEth", (a) => a.R6),
  b("Page2.List3.Li3a.Li3aList.Li3a3.specialMarks", (a) => a.R8),
  b("Page2.List3.Li3a.Li3aList.Li3a3.Vehicle", (a) =>
    [a.R11.type, a.R11.model, a.R11.year, a.R11.color, a.R11.plate].filter(Boolean).join(", "),
  ),
  b("Page2.List3.Li3a.Li3aList.Li3a3.incPicture", (a) => a.R22 === "Y"),
  b("Page2.List3.Li3a.Li3aList.Li3a4.SafetyAccessibility", (a) => !safety(a)),
  b("Page2.List3.Li3a.Li3aList.Li3a4.SafetyAccessibility[1]", (a) => safety(a)),
  b("Page2.List3.Li3a.Li3aList.Li3a4.hasGun", hasGun),
  b("Page2.List3.Li3a.Li3aList.Li3a4.noEng", (a) => a.R17 === "N"),
  b("Page2.List3.Li3a.Li3aList.Li3a4.language", (a) => (a.R17 === "N" ? a.R17language : "")),
  b("Page2.List3.Li3a.Li3aList.Li3a4.Other", (a) => a.R21.includes("other")),
  b("Page2.List3.Li3a.Li3aList.Li3a4.other", (a) => (a.R21.includes("other") ? a.R21other : "")),
  // 3b · serving a business does not apply
  b("Page2.List3.Li3b.servePerson", () => false),
  ...["Li3b1.NameType", "Li3b1.telephone", "Li3b2.nameofperson", "Li3b3.nameofagent", "Li3b4.listsafetyAccessibility"].map((f) =>
    b(`Page2.List3.Li3b.Li3bList.${f}`, () => ""),
  ),

  // 4 · where to serve
  b("Page3.List4.Li4.Address", (a) => mainAddr(a).street),
  b("Page3.List4.Li4.City", (a) => mainAddr(a).city),
  b("Page3.List4.Li4.State", (a) => mainAddr(a).state),
  b("Page3.List4.Li4.Zip", (a) => mainAddr(a).zip),
  b("Page3.List4.Li4.addDef", (a) => !!mainAddr(a).street && (a.R15.address.street.trim() ? a.R15.kind === "home" : true)),
  b("Page3.List4.Li4.addDef[1]", (a) => !!a.R15.address.street.trim() && a.R15.kind === "business"),
  b("Page3.List4.Li4.gateCode", (a) => a.R15.instructions),
  b("Page3.List4.Li4.serveTime", (a) => a.R15.bestTime),
  b("Page3.List4.Li4.jail", (a) => a.R16 === "Y"),
  b("Page3.List4.Li4.jailName", (a) => (a.R16 === "Y" ? a.R16facility : "")),
  b("Page3.List4.Li4.altAdd", (a) => (altUsesEmployer(a) ? oneLine(`${a.R13.name ? `${a.R13.name}, ` : ""}${a.R13.address}`) : a.R15.alt.street)),
  b("Page3.List4.Li4.altCity", (a) => (altUsesEmployer(a) ? "" : a.R15.alt.city)),
  b("Page3.List4.Li4.altState", (a) => (altUsesEmployer(a) ? "" : a.R15.alt.street ? a.R15.alt.state : "")),
  b("Page3.List4.Li4.altZip", (a) => (altUsesEmployer(a) ? "" : a.R15.alt.zip)),
  b("Page3.List4.Li4.altAddDef", (a) => !altUsesEmployer(a) && !!a.R15.alt.street.trim() && a.R15.altKind === "home"),
  b("Page3.List4.Li4.altAddDef[1]", (a) => altUsesEmployer(a) || (!!a.R15.alt.street.trim() && a.R15.altKind === "business")),
  b("Page3.List4.Li4.altGateCode", (a) => (altUsesEmployer(a) ? "" : a.R15.altInstructions)),
  b("Page3.List4.Li4.altServeTime", (a) => (altUsesEmployer(a) ? "" : a.R15.altBestTime)),

  // 5 · the papers. The hearing date and service deadline are on the DV-109 the court
  // returns, so 5c and 5d are left for the person to complete then.
  b("Page3.List5.Li5a.typePapers", () => "Domestic violence restraining order"),
  b("Page3.List5.Li5b.listForms", (a) => ({ long: serviceList(a), sheet: "SER-001, Item 5b" })),
  ...[0, 1, 2].map((i) => b(idx("Page3.List5.Li5c.Hearing", i), () => false)),
  b("Page3.List5.Li5c.hearingDate", () => ""),
  ...[0, 1, 2].map((i) => b(idx("Page4.List5Continued.Li5d.deadline", i), () => false)),
  b("Page4.List5Continued.Li5d.deadlineDate", () => ""),
  b("Page4.List5Continued.Li5e.altService", () => false),
  b("Page4.List5Continued.Li5e.altService[1]", () => true),
  b("Page4.List5Continued.Li5e.altService[2]", () => false),
  b("Page4.List5Continued.Li5f.othInfo", (a) => !a.V3.trim()),
  b("Page4.List5Continued.Li5f.othInfo[1]", (a) => !!a.V3.trim()),
  b("Page4.List5Continued.Li5f.TextField", (a) => (a.V3.trim() ? { long: a.V3, sheet: "SER-001, Item 5f" } : "")),
  b("Page4.List6.Li6.levy", () => false),
  b("Page4.List6.Li6.levy[1]", () => false),
  b("Page4.sig.SigDate", (a) => fmtDate(a.G1)),
  b("Page4.sig.typeName", (a) => a.P1),
];
(
  [
    ["probationParole", "probation or parole"],
    ["violence", "violent history"],
    ["aggressiveAnimal", "aggressive animal"],
    ["specialtraining", "military or first-responder training"],
    ["mentalHealth", "mental health issues"],
    ["hardOfHearing", "deaf or hard of hearing"],
  ] as const
).forEach(([f, v]) => S.push(b(`Page2.List3.Li3a.Li3aList.Li3a4.${f}`, (a) => a.R21.includes(v))));

export const SER001: FormSpec = { id: "SER-001", file: "/forms/SER-001.pdf", root: "SER-001[0]", bindings: S };
