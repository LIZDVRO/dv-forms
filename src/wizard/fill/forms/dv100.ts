/**
 * DV-100 (Rev. Jan 1, 2025) bindings. Mirrors docs/field-map, tab "DV-100".
 * Items 24–26 (support and fees) are not offered yet.
 */
import type { FormSpec, Binding } from "../engine";
import { b, caseNo, card, contact, idx, twoLines } from "../helpers";
import { courtCaption, fmtDate, money, personAge, petitionerAge, respondentAge, type Derived } from "../../derive";
import type { Answers } from "../../types";

const B: Binding[] = [];
const add = (...xs: Binding[]) => B.push(...xs);
const on = (a: Answers, id: keyof Answers["orders"]) => !!a.orders[id];

// Caption (every page)
add(b("Page1.rightCaption.CourtInfo", (a) => courtCaption(a)));
add(b("Page1.rightCaption.CaseNumber", caseNo));
for (let p = 2; p <= 13; p++) add(b(`Page${p}.PxCaption.CaseNumber`, caseNo));

// 1 · person asking for protection
add(
  b("Page1.List1.Li1.YourName_tf", (a) => a.P1),
  b("Page1.List1.Li2.tf", (a) => petitionerAge(a)),
  b("Page1.List1.Li3.address_ft", contact.street),
  b("Page1.List1.Li3.T70", contact.city),
  b("Page1.List1.Li3.T76", contact.state),
  b("Page1.List1.Li3.T77", contact.zip),
  b("Page1.List1.Li4.T42", contact.phone),
  b("Page1.List1.Li4.T67", contact.fax),
  b("Page1.List1.Li4.T73", contact.email),
  b("Page1.List1.Li5.ParentRel1", (a) => (a.S5 === "Y" ? a.L1 : "")),
  b("Page1.List1.Li5.ParentRel2", (a) => (a.S5 === "Y" ? a.L2 : "")),
  b("Page1.List1.Li5.ParentRel", (a) => (a.S5 === "Y" ? a.L3 : "")),
);

// 2 · person to be restrained
add(
  b("Page1.List2.Li1.TextField", (a) => a.R1),
  b("Page1.List2.Li2.T78", (a) => respondentAge(a)),
  b("Page1.List2.Li3.T78", (a) => fmtDate(a.R3)),
  b("Page1.List2.Li4.gender2d_cb", (a) => a.R5 === "M"),
  b("Page1.List2.Li4.gender2d_cb[1]", (a) => a.R5 === "F"),
  b("Page1.List2.Li4.gender2d_cb[2]", (a) => a.R5 === "X"),
  b("Page1.List2.li5.TextField", (a) => a.R6),
);

// 3 · relationship
const has = (a: Answers, k: string) => a.RL1.includes(k as never);
/** 3a names: one line, wrapping at a comma onto the second line when long. */
function childNameLines(d: Derived): [string, string] {
  const names = d.sharedChildren.map((c) => c.name);
  let first = "";
  let i = 0;
  while (i < names.length && (first + ", " + names[i]).length <= 60) first = first ? `${first}, ${names[i++]}` : names[i++];
  if (!first && names.length) first = names[i++];
  return [first, names.slice(i).join(", ")];
}
add(
  b("Page2.List3.Li1.CheckBox2", (a) => has(a, "children")),
  b("Page2.List3.Li1.TextField", (a, d) => (has(a, "children") ? childNameLines(d)[0] : "")),
  b("Page2.List3.Li1.TextField1", (a, d) => (has(a, "children") ? childNameLines(d)[1] : "")),
  b("Page2.List3.Li2.CheckBox2", (a) => has(a, "married")),
  b("Page2.List3.Li3.CheckBox2", (a) => has(a, "formerly married")),
  b("Page2.List3.Li4.CheckBox2", (a) => has(a, "dating")),
  b("Page2.List3.Li5.CheckBox2", (a) => has(a, "engaged")),
  b("Page2.List3.Li6.CheckBox1", (a) => has(a, "related")),
  b("Page2.List3.Li7.CheckBox2", (a) => has(a, "live together")),
  b("Page2.List3.Li7.YesNo3g_cb", (a) => has(a, "live together") && a.RL3 === "Y"),
  b("Page2.List3.Li7.YesNo3g_cb[1]", (a) => has(a, "live together") && a.RL3 === "N"),
);
const rl2: [number, string][] = [
  [2, "parent/step/in-law"],
  [3, "sibling/step/in-law"],
  [4, "child/step/adopted"],
  [5, "grandparent"],
  [6, "child's spouse"],
  [7, "grandchild"],
];
for (const [n, v] of rl2) add(b(`Page2.List3.Li6.CheckBox${n}`, (a) => has(a, "related") && a.RL2.includes(v)));

// 4 · other orders and cases
add(
  b("Page2.List4.Li1.YesNo4a_cb", (a) => a.C1 === "N"),
  b("Page2.List4.Li1.YesNo4a_cb[1]", (a) => a.C1 === "Y"),
  b("Page2.List4.Li1.List1.Li1.DateField8", (a) => (a.C1 === "Y" ? fmtDate(a.C2[0]?.dateMade) : "")),
  b("Page2.List4.Li1.List1.Li1.DateField5", (a) => (a.C1 === "Y" ? fmtDate(a.C2[0]?.expires) : "")),
  b("Page2.List4.Li1.List1.Li2.DateField9", (a) => (a.C1 === "Y" ? fmtDate(a.C2[1]?.dateMade) : "")),
  b("Page2.List4.Li1.List1.Li2.DateField7", (a) => (a.C1 === "Y" ? fmtDate(a.C2[1]?.expires) : "")),
  b("Page2.List4.Li2.YesNo4b_cb", (a) => a.C3 === "N"),
  b("Page2.List4.Li2.YesNo4b_cb[1]", (a) => a.C3 === "Y"),
);
const caseLine = (a: Answers, types: string[], withKind = false) =>
  a.C3 !== "Y"
    ? ""
    : a.C4.filter((c) => types.includes(c.type))
        .map((c) =>
          [withKind ? c.kind || c.type : "", c.where, c.year, c.caseNumber && `Case no. ${c.caseNumber}`]
            .filter(Boolean)
            .join("; "),
        )
        .join(" | ");
const caseTypes: [number, string][] = [
  [1, "custody"],
  [2, "divorce"],
  [3, "juvenile"],
  [4, "guardianship"],
  [5, "criminal"],
];
for (const [n, t] of caseTypes) {
  add(
    b(`Page2.List4.Li2.CheckBox${n}`, (a) => a.C3 === "Y" && a.C4.some((c) => c.type === t)),
    b(`Page2.List4.Li2.TextField${n}`, (a) => caseLine(a, [t])),
  );
}
add(
  b("Page2.List4.Li2.CheckBox6", (a) => a.C3 === "Y" && a.C4.some((c) => c.type === "child support" || c.type === "other")),
  b("Page2.List4.Li2.TextField6", (a) => caseLine(a, ["child support", "other"], true)),
);

// 5–7 · incident cards 1–3
interface CardFields {
  page: number;
  item: number;
  date: string;
  b: [string, number];
  bn: string;
  c: string;
  ct: string;
  d: string;
  dt: string;
  e: string;
  f: string;
  g: string;
  go: string;
  gd: string;
}
const cards: CardFields[] = [
  { page: 3, item: 5, date: "Li1.dtAbs", b: ["Li2.YesNo5b_cb", 3], bn: "Li2.item5a2", c: "Li3.YesNo5c_cb", ct: "Li3.item5a3", d: "Li4.YesNo5d_cb", dt: "Li4.item26d_tf", e: "Li5.YesNo5e_cb", f: "Li6.TextField", g: "Li7.YesNo5g_cb", go: "Li7.TextField", gd: "Li7.TextField7" },
  { page: 4, item: 6, date: "Li1.dtabs", b: ["li2.YesNo6b_cb", 3], bn: "li2.item5b2", c: "Li3.YesNo6c_cb", ct: "Li3.item5b3", d: "Li4.YesNo6d_cb", dt: "Li4.item26d_tf", e: "Li5.YesNo6e_cb", f: "Li6.TextField", g: "Li7.abuseFreq", go: "Li7.TextField", gd: "Li7.item26d_tf" },
  { page: 5, item: 7, date: "Li1.dtabs", b: ["Li2.YesNo7b_cb", 3], bn: "Li2.item5b2", c: "Li3.YesNo7c_cb", ct: "Li3.item5b3", d: "Li4.YesNo7d_cb", dt: "Li4.item26d_tf", e: "Li5.YesNo7e_cb", f: "Li6.TextField", g: "Li7.YesNo7g_cb", go: "Li7.TextField", gd: "Li7.item26d_tf" },
];
cards.forEach((c, k) => {
  const P = `Page${c.page}.List${c.item}.`;
  const C = (a: Answers) => card(a, k);
  add(b(P + c.date, (a) => fmtDate(C(a)?.A1 ?? "")));
  ["DK", "N", "Y"].forEach((v, i) => add(b(P + idx(c.b[0], i), (a) => C(a)?.A2 === v)));
  add(b(P + c.bn, (a) => (C(a)?.A2 === "Y" ? C(a)?.A2names : "")));
  ["N", "Y"].forEach((v, i) => add(b(P + idx(c.c, i), (a) => C(a)?.A3 === v)));
  add(b(P + c.ct, (a) => (C(a)?.A3 === "Y" ? { long: C(a)!.A3text, sheet: "DV-100, Describe Abuse" } : "")));
  ["N", "Y"].forEach((v, i) => add(b(P + idx(c.d, i), (a) => C(a)?.A4 === v)));
  add(b(P + c.dt, (a) => (C(a)?.A4 === "Y" ? { long: C(a)!.A4text, sheet: "DV-100, Describe Abuse" } : "")));
  ["DK", "N", "Y"].forEach((v, i) => add(b(P + idx(c.e, i), (a) => C(a)?.A5 === v)));
  add(b(P + c.f, (a) => (C(a) ? { long: C(a)!.A6, sheet: "DV-100, Describe Abuse" } : "")));
  ["once", "2-5", "weekly", "other"].forEach((v, i) => add(b(P + idx(c.g, i), (a) => C(a)?.A7 === v)));
  add(b(P + c.go, (a) => (C(a)?.A7 === "other" ? C(a)?.A7other : "")));
  add(b(P + c.gd, (a) => C(a)?.A7dates ?? ""));
});

// 8 · other protected people
add(
  b("Page6.List8.Li1.YesNo8a1_cb", (_a, d) => d.protectedPeople.length === 0),
  b("Page6.List8.Li2.YesNo8a2_cb", (_a, d) => d.protectedPeople.length > 0),
);
const rows8 = [
  ["item3fullname1_tf", "item3age1_tf", "item3Relation1_tf", "YesNo8b11_cb"],
  ["item3fullname2_tf", "item3age2_tf", "item3Relation2_tf", "YesNo8b12_cb"],
  ["item3fullname3_tf", "item3age_tf", "item3Relation3_tf", "YesNo8b13_cb"],
  ["item3fullname4_tf", "item3age4_tf", "item3Relation4_tf", "YesNo8b14_cb"],
];
rows8.forEach(([n, ag, r, y], i) => {
  const P = "Page6.List8.Li2.List.li1.";
  add(
    b(P + n, (_a, d) => d.protectedPeople[i]?.name),
    b(P + ag, (_a, d) => (d.protectedPeople[i] ? personAge(d.protectedPeople[i], d.asOf) : "")),
    b(P + r, (_a, d) => d.protectedPeople[i]?.relationship),
    b(P + y, (_a, d) => d.protectedPeople[i]?.livesWithYou === "Y"),
    b(P + y + "[1]", (_a, d) => d.protectedPeople[i]?.livesWithYou === "N"),
  );
});
add(
  b("Page6.List8.Li2.List.li1.MultilineCheckBox", (_a, d) => d.protectedPeople.length > 4),
  b("Page6.List8.Li2.List.li2.TextField", (a, d) =>
    d.protectedPeople.length ? { long: a.PR10, sheet: "DV-100, Other Protected People" } : "",
  ),
);

// 9 · firearms
add(
  b("Page6.List9.Li1.YesNo9abc_cb", (a) => a.R18 === "DK"),
  b("Page6.List9.LI2.YesNo9abc_cb", (a) => a.R18 === "N"),
  b("Page6.List9.li3.YesNo9abc_cb", (a) => a.R18 === "Y"),
);
for (let i = 0; i < 6; i++) {
  const P = `Page6.List9.li3.LIst.li${i + 1}.`;
  const g = (a: Answers) => (a.R18 === "Y" ? a.R19[i] : undefined);
  add(
    b(P + "TextField1", (a) => g(a)?.what),
    b(P + "TextField2", (a) => g(a)?.count),
    b(P + "TextField3", (a) => g(a)?.where),
  );
}

// 10–14 · orders
add(
  b("Page7.List10.Li1.CheckBoxRightCaption", (a) => on(a, "O10")),
  b("Page7.List11.Li1.CheckBoxRightCaption", (a) => on(a, "O11")),
  b("Page7.List12.CheckBoxRightCaption", (a) => on(a, "O12")),
);
const places: [number, string][] = [
  [1, "me"],
  [2, "my school"],
  [3, "my home"],
  [4, "protected people"],
  [5, "my job"],
  [6, "children's school or childcare"],
  [7, "my vehicle"],
  [8, "other"],
];
for (const [n, v] of places) add(b(`Page7.List12.li1.CheckBox${n}`, (a) => on(a, "O12") && a.O12.places.includes(v)));
add(
  b("Page7.List12.li1.TextField", (a) => (on(a, "O12") && a.O12.places.includes("other") ? a.O12.placesOther : "")),
  b("Page7.List12.Li2.CheckBox12b1", (a) => on(a, "O12") && a.O12.distance === "100 yards"),
  b("Page7.List12.Li2.CheckBox12b2", (a) => on(a, "O12") && a.O12.distance === "other"),
  b("Page7.List12.Li2.FillText8Yards", (a) => (on(a, "O12") && a.O12.distance === "other" ? a.O12.distanceYards : "")),
  b("Page7.List12.Li3.YesNo12c_cb", (a) => on(a, "O12") && a.RL4 === "no"),
  b("Page7.List12.Li3.YesSub.YesNo12c_cb", (a) => on(a, "O12") && !!a.RL4 && a.RL4 !== "no"),
);
(["together", "same building", "same neighborhood", "other"] as const).forEach((v, i) =>
  add(b(`Page7.List12.Li3.YesSub.YesCheckBoxSub.${idx("CheckBox12c", i)}`, (a) => on(a, "O12") && a.RL4 === v)),
);
add(
  b("Page7.List12.Li3.YesSub.YesCheckBoxSub.TextField", (a) => (on(a, "O12") && a.RL4 === "other" ? a.RL4other : "")),
  b("Page7.List12.Li4.YesNo12d_cb", (a) => on(a, "O12") && !(a.O12.workCompany || a.O12.school || a.O12.sameOther)),
  b("Page7.List12.Li4.YesNo12d_cb[1]", (a) => on(a, "O12") && !!(a.O12.workCompany || a.O12.school || a.O12.sameOther)),
  b("Page7.List12.Li4.CheckBox1", (a) => on(a, "O12") && !!a.O12.workCompany),
  b("Page7.List12.Li4.TextField1", (a) => (on(a, "O12") ? a.O12.workCompany : "")),
  b("Page7.List12.Li4.CheckBox2", (a) => on(a, "O12") && !!a.O12.school),
  b("Page7.List12.Li4.TextField2", (a) => (on(a, "O12") ? a.O12.school : "")),
  b("Page7.List12.Li4.CheckBox3", (a) => on(a, "O12") && !!a.O12.sameOther),
  b("Page7.List12.Li4.TextField4", (a) => (on(a, "O12") ? a.O12.sameOther : "")),
);
add(
  b("Page8.List13.CheckBoxRightCaption", (a) => on(a, "O13")),
  b("Page8.List13.Li1.TextField", (a) => (on(a, "O13") ? a.O13.address : "")),
);
const reasons13: [number, string][] = [
  [1, "own"],
  [2, "lived there"],
  [3, "lease"],
  [4, "pay rent or mortgage"],
  [5, "live there with my children"],
  [6, "other"],
];
for (const [n, v] of reasons13) add(b(`Page8.List13.Li2.CheckBox${n}`, (a) => on(a, "O13") && a.O13.reasons.includes(v)));
add(
  b("Page8.List13.Li2.FillText9years", (a) => (on(a, "O13") && a.O13.reasons.includes("lived there") ? a.O13.years : "")),
  b("Page8.List13.Li2.FillText9months", (a) => (on(a, "O13") && a.O13.reasons.includes("lived there") ? a.O13.months : "")),
  b("Page8.List13.Li2.TextField1", (a) => (on(a, "O13") && a.O13.reasons.includes("other") ? twoLines(a.O13.otherText, 25)[0] : "")),
  b("Page8.List13.Li2.TextField2", (a) => (on(a, "O13") && a.O13.reasons.includes("other") ? twoLines(a.O13.otherText, 25)[1] : "")),
  b("Page8.List14.Li1.CheckBoxRightCaption", (a) => on(a, "O14")),
  b("Page8.List14.Li1.item26d_tf", (a) => (on(a, "O14") ? { long: a.O14, sheet: "DV-100, Other Orders" } : "")),
);

// 16 · animals
// 15 · custody (details go on DV-105)
add(b("Page8.LIST15.CtyChildFreed_cb", (a) => on(a, "O15")));

add(b("Page9.List16.CheckBoxRightCaption", (a) => on(a, "O16")));
const animalCols = [
  ["TextField1", "TextField2", "TextField3", "TextField4"],
  ["TextField", "TextField1", "TextField2", "TextField3"],
  ["TextField", "TextField1", "TextField2", "TextField3"],
  ["TextField", "TextField1", "TextField2", "TextField3"],
];
animalCols.forEach((cols, i) => {
  const keys = ["name", "type", "breed", "color"] as const;
  cols.forEach((f, j) =>
    add(b(`Page9.List16.Li1.List.Li${i + 1}.${f}`, (a) => (on(a, "O16") ? a.O16.animals[i]?.[keys[j]] : ""))),
  );
});
add(
  b("Page9.List16.Li2.List.Li1.CheckBoxRightCaption", (a) => on(a, "O16") && a.O16.stayAway),
  b("Page9.List16.Li2.List.Li1.YesNo16b1_cb", (a) => on(a, "O16") && a.O16.stayAway && a.O16.distance === "100 yards"),
  b("Page9.List16.Li2.List.Li1.YesNo16b1_cb[1]", (a) => on(a, "O16") && a.O16.stayAway && a.O16.distance === "other"),
  b("Page9.List16.Li2.List.Li1.TextField", (a) => (on(a, "O16") && a.O16.stayAway && a.O16.distance === "other" ? a.O16.distanceYards : "")),
  b("Page9.List16.Li2.List.Li2.MultilineCheckBox", (a) => on(a, "O16") && a.O16.noHarm),
  b("Page9.List16.Li2.List.Li3.CheckBoxRightCaption1", (a) => on(a, "O16") && a.O16.soleCare),
);
const why16: [number, string][] = [
  [2, "they abuse the animals"],
  [3, "I care for them"],
  [4, "I bought them"],
  [5, "other"],
];
for (const [n, v] of why16)
  add(b(`Page9.List16.Li2.List.Li3.CheckBoxRightCaption${n}`, (a) => on(a, "O16") && a.O16.soleCare && a.O16.soleCareWhy.includes(v)));
add(
  b("Page9.List16.Li2.List.Li3.TextField1", (a) => (on(a, "O16") && a.O16.soleCareWhy.includes("other") ? twoLines(a.O16.soleCareOther, 25)[0] : "")),
  b("Page9.List16.Li2.List.Li3.TextField2", (a) => (on(a, "O16") && a.O16.soleCareWhy.includes("other") ? twoLines(a.O16.soleCareOther, 25)[1] : "")),
);

// 17–21
add(
  b("Page9.List17.CtyChildFreed_cb", (a) => on(a, "O17")),
  b("Page9.List17.Li1.item26d_tf", (a) => (on(a, "O17") ? { long: a.O17.property, sheet: "DV-100, Item 17" } : "")),
  b("Page9.List17.Li2.item26d_tf", (a) => (on(a, "O17") ? { long: a.O17.why, sheet: "DV-100, Item 17" } : "")),
  b("Page9.List18.Li1.CtyChildFreed_cb", (a) => on(a, "O18")),
  b("Page9.List19.Li1.CtyChildFreed_cb", (a) => on(a, "O19")),
  b("Page10.List20.Li1.CheckBoxRightCaption", (a, d) => on(a, "O20") && d.married),
  b("Page10.List21.Li1.CtyChildFreed_cb", (a) => on(a, "O21")),
  b("Page10.List21.Li1.item26d_tf", (a) => (on(a, "O21") ? { long: a.O21, sheet: "DV-100, Item 21" } : "")),
);

// 22 · debts
add(b("Page10.List22.CheckBoxRightCaption", (a) => on(a, "O22")));
const debtCols = [
  ["TextField", "TextField2", "TextField3", "DateField1"],
  ["TextField", "TextField1", "TextField3", "DateField2"],
  ["TextField", "TextField1", "TextField3", "DateField3"],
];
debtCols.forEach(([p, f, am, due], i) => {
  const P = `Page10.List22.Li1.List.Li${i + 1}.`;
  const g = (a: Answers) => (on(a, "O22") ? a.O22.debts[i] : undefined);
  add(
    b(P + p, (a) => g(a)?.payTo),
    b(P + f, (a) => g(a)?.for),
    b(P + am, (a) => (g(a) ? money(g(a)!.amount) : "")),
    b(P + due, (a) => (g(a) ? fmtDate(g(a)!.due) : "")),
  );
});
add(
  b("Page10.List22.Li1.item26d_tf", (a) => (on(a, "O22") ? { long: a.O22.why, sheet: "DV-100, Item 22" } : "")),
  b("Page10.List22.Li2.List.checkbox22b", (a) => on(a, "O22") && a.O22.finding === "N"),
  b("Page10.List22.Li2.List.checkbox22b[1]", (a) => on(a, "O22") && a.O22.finding === "Y"),
);
for (let n = 1; n <= 3; n++)
  add(b(`Page10.List22.Li2.List.Li1.CheckBoxRightCaption${n}`, (a) => on(a, "O22") && a.O22.finding === "Y" && !!a.O22.debts[n - 1]?.fromAbuse));
add(
  b("Page10.List22.Li2.List.Li2.YesNo22b2_cb", (a) => on(a, "O22") && a.O22.finding === "Y" && !a.O22.how.trim()),
  b("Page10.List22.Li2.List.Li2.YesNo22b2_cb[1]", (a) => on(a, "O22") && a.O22.finding === "Y" && !!a.O22.how.trim()),
  b("Page10.List22.Li2.List.Li2.item26d_tf", (a) => (on(a, "O22") && a.O22.finding === "Y" ? { long: a.O22.how, sheet: "DV-100, Item 22" } : "")),
);

// 23 · expenses caused by abuse
add(b("Page11.List23.Li1.CtyChildFreed_cb", (a) => on(a, "O23")));
[
  ["T47", "T50", "T53"],
  ["T56", "T59", "T62"],
  ["T63", "T66", "T67"],
  ["T68", "T69", "T70"],
].forEach(([p, f, am], i) => {
  const g = (a: Answers) => (on(a, "O23") ? a.O23[i] : undefined);
  add(
    b(`Page11.List23.Li1.${p}`, (a) => g(a)?.payTo),
    b(`Page11.List23.Li1.${f}`, (a) => g(a)?.for),
    b(`Page11.List23.Li1.${am}`, (a) => (g(a) ? money(g(a)!.amount) : "")),
  );
});

// 27–28
add(
  b("Page12.List27.Li1.CtyChildFreed_cb", (a) => on(a, "O27")),
  b("Page12.List28.AGHagueCert_cb", (a) => on(a, "O28")),
);
[
  ["Li1.item28aMyNoa_cb", "Li1.Telephone2_ft"],
  ["Li2.item28bMyNob_cb", "Li2.Telephone3_ft"],
  ["Li3.item28aMyNoc_cb", "Li3.Telephone2_ft"],
  ["Li4.item28bMyNod_cb", "Li4.Telephone3_ft"],
].forEach(([cb, tel], i) => {
  const g = (a: Answers) => (on(a, "O28") ? a.O28[i] : undefined);
  add(
    b(`Page12.List28.${cb}`, (a) => g(a)?.whose === "mine"),
    b(`Page12.List28.${cb}[1]`, (a) => g(a)?.whose === "child"),
    b(`Page12.List28.${tel}`, (a) => g(a)?.phone),
  );
});

// 32–34 · pages attached (set by the packet builder) and signatures
add(
  b("Page13.List33.Li1.SigDate", (a) => fmtDate(a.G1)),
  b("Page13.List33.Li1.YourName_tf", (a) => a.P1),
  b("Page13.List34.Li1.SigDate", (a) => (a.S5 === "Y" ? fmtDate(a.G1) : "")),
  b("Page13.List34.Li1.T14", (a) => (a.S5 === "Y" ? a.L1 : "")),
);

/** Rows that do not fit on DV-100 go on attached sheets (no boxes exist for most of these). */
function sheets(a: Answers, d: Derived) {
  const rows = <T,>(list: T[], from: number, fmt: (x: T, i: number) => string) =>
    list.slice(from).map((x, i) => fmt(x, i + from + 1)).join("\n");
  const out: { title: string; text: string }[] = [];
  out.push({
    title: "DV-100, Other Protected People",
    text: rows(d.protectedPeople, 4, (p, n) =>
      `${n}. ${p.name} — age ${personAge(p, d.asOf) || "unknown"} — ${p.relationship || "relationship not given"} — lives with me: ${p.livesWithYou === "Y" ? "yes" : p.livesWithYou === "N" ? "no" : "not given"}`,
    ),
  });
  if (a.C1 === "Y")
    out.push({
      title: "DV-100, Item 4a — Other Restraining Orders",
      text: rows(a.C2, 2, (o, n) =>
        `(${n}) ${o.type || "Order"}: made ${fmtDate(o.dateMade) || "date unknown"}, expires ${fmtDate(o.expires) || "date unknown"}${o.caseNumber ? `, case no. ${o.caseNumber}` : ""}${o.county ? `, ${o.county}` : ""}`,
      ),
    });
  if (a.R18 === "Y")
    out.push({
      title: "DV-100, Item 9 — Firearms",
      text: rows(a.R19, 6, (g, n) => `(${n}) ${g.what} — amount: ${g.count || "unknown"} — location: ${g.where || "unknown"}`),
    });
  if (on(a, "O16"))
    out.push({
      title: "DV-100, Item 16 — Animals",
      text: rows(a.O16.animals, 4, (x, n) => `(${n}) ${x.name} — ${x.type} — ${x.breed} — ${x.color}`),
    });
  if (on(a, "O22"))
    out.push({
      title: "DV-100, Item 22 — Debts",
      text: rows(a.O22.debts, 3, (x, n) => `(${n}) Pay to: ${x.payTo} — For: ${x.for} — Amount: $${money(x.amount)} — Due: ${fmtDate(x.due)}`),
    });
  if (on(a, "O23"))
    out.push({
      title: "DV-100, Item 23 — Expenses",
      text: rows(a.O23, 4, (x, n) => `(${n}) Pay to: ${x.payTo} — For: ${x.for} — Amount: $${money(x.amount)}`),
    });
  if (on(a, "O28"))
    out.push({
      title: "DV-100, Item 28 — Phone Numbers",
      text: rows(a.O28, 4, (x, n) => `(${n}) ${x.whose === "mine" ? "My number" : "Number of child in my care"}: ${x.phone}`),
    });
  return out;
}

export const DV100: FormSpec = {
  id: "DV-100",
  file: "/forms/DV-100.pdf",
  root: "DV-100[0]",
  bindings: B,
  sheets,
  after: ({ sheets: s, pages }) => [
    b("Page5.List7.MultilineCheckBox", () => s.some((x) => x.title === "DV-100, Describe Abuse")),
    b("Page13.List32.Li1.T97", () => (pages ? String(pages) : "")),
  ],
};
