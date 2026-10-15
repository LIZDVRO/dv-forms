/**
 * Custody and abduction forms: DV-105, DV-105(A), DV-140, DV-108, DV-145.
 * Mirrors docs/field-map tabs of the same names.
 *
 * DV-140 and DV-145 are orders: the petitioner fills only the parties and
 * children (items 1–3 and 1–2); the judge completes the rest.
 */
import type { Binding, FormSpec } from "../engine";
import { b, caseNo, idx, twoLines } from "../helpers";
import { fmtDate, fmtMonthYear, fmtTime, money, type Derived } from "../../derive";
import { WEEKDAYS } from "../../types";
import type { Answers, CaseRecord, Guardian, LivedWith, Residence, RosterPerson, Supervisor, Weekday } from "../../types";

// ---------------------------------------------------------------- shared

const kid = (d: Derived, i: number): RosterPerson | undefined => d.custodyKids[i];

/** Parent / Legal guardian / Other boxes plus the "describe" line, in widget order. */
function guardianBoxes(fields: [string, string, string], text: string, get: (a: Answers) => [Guardian, string]): Binding[] {
  const order: Guardian[] = ["parent", "legal guardian", "other"];
  return [
    ...fields.map((f, i) => b(f, (a) => get(a)[0] === order[i])),
    b(text, (a) => (get(a)[0] === "other" ? get(a)[1] : "")),
  ];
}
const pr11 = (a: Answers): [Guardian, string] => [a.PR11, a.PR11other];
const pr12 = (a: Answers): [Guardian, string] => [a.PR12, a.PR12other];

const childrenSheet = (title: string) => (_a: Answers, d: Derived) => [
  {
    title,
    text: d.custodyKids
      .slice(4)
      .map((c, i) => `${i + 5}. ${c.name} — date of birth: ${fmtDate(c.dob) || "unknown"}`)
      .join("\n"),
  },
];

/** "Fresno, CA", or just the state when the address is private. */
const placeText = (r: Residence) => (r.private ? r.state : [r.city.trim(), r.state.trim()].filter(Boolean).join(", "));

interface RowFields {
  from: string;
  until?: string;
  city: string;
  /** "Lived with" check boxes, in widget order. */
  with: [string, string, string];
  other: string;
  priv?: string;
}

/** One row of a residence table (DV-105 4b, DV-105(A) 2b/3b). */
function residenceRow(prefix: string, f: RowFields, order: LivedWith[], get: (a: Answers) => Residence | undefined): Binding[] {
  const p = (s: string) => `${prefix}.${s}`;
  const out: Binding[] = [
    b(p(f.from), (a) => fmtMonthYear(get(a)?.from)),
    b(p(f.city), (a) => {
      const r = get(a);
      return r ? placeText(r) : "";
    }),
    ...f.with.map((w, i) => b(p(w), (a) => !!get(a)?.livedWith.includes(order[i]))),
    b(p(f.other), (a) => {
      const r = get(a);
      return r?.livedWith.includes("other") ? r.otherRelationship : "";
    }),
  ];
  if (f.until) out.push(b(p(f.until), (a) => fmtMonthYear(get(a)?.until)));
  if (f.priv) out.push(b(p(f.priv), (a) => !!get(a)?.private));
  return out;
}

const residenceLines = (rows: Residence[], startAt: number) =>
  rows
    .slice(startAt)
    .map(
      (r, i) =>
        `${startAt + i + 1}. From ${fmtMonthYear(r.from) || "?"} until ${fmtMonthYear(r.until) || "?"} — ${placeText(r)} — lived with: ${r.livedWith
          .map((w) => (w === "me" ? "me" : w === "respondent" ? "the person in 2" : `other (${r.otherRelationship})`))
          .join(", ")}`,
    )
    .join("\n");

// ---------------------------------------------------------------- DV-105

const D: Binding[] = [
  b("Page1.RightCaption.CaseNumber", caseNo),
  b("Page2.Caption.PxCaption.CaseNumber", caseNo),
  b("Page3.Caption.PxCaption.CaseNumber", caseNo),
  b("Page4.Captio.PxCaption.CaseNumber", caseNo),
  b("Page5.Caption.PxCaption.CaseNumber", caseNo),
  b("Page6.Caption.PxCaption.CaseNumber", caseNo),

  // 1–2 · parties
  b("Page1.List1.TextField2", (a) => a.P1),
  ...guardianBoxes(
    ["Page1.List1.CheckBoxitem1Relation", "Page1.List1.CheckBoxitem1Relation[1]", "Page1.List1.CheckBoxitem1Relation[2]"],
    "Page1.List1.TextField",
    pr11,
  ),
  b("Page1.List2.TextField2", (a) => a.R1),
  ...guardianBoxes(
    ["Page1.List2.CheckBoxitem2relation", "Page1.List2.CheckBoxitem2relation[1]", "Page1.List2.CheckBoxitem2relation[2]"],
    "Page1.List2.TextField",
    pr12,
  ),
  b("Page1.List3.CheckBoxRightCaption", (_a, d) => d.custodyKids.length > 4),

  // 4a · lived together for 5 years? (No is the first widget)
  b("Page1.List4.List.Li1.Choice1", (a) => a.K1 === "N"),
  b("Page1.List4.List.Li1.Choice1[1]", (a) => a.K1 === "Y"),
];

// 3 · children (row field names are irregular)
[
  ["Li1.TextField1", "Li1.TextField35"],
  ["Li2.TextField2", "Li2.TextField36"],
  ["Li3.TextField3", "Li3.TextField37"],
  ["Li4.TextField34", "Li4.TextField38"],
].forEach(([n, dob], i) =>
  D.push(
    b(`Page1.List3.List.${n}`, (_a, d) => kid(d, i)?.name),
    b(`Page1.List3.List.${dob}`, (_a, d) => fmtDate(kid(d, i)?.dob)),
  ),
);

// 4b · where they lived (6 rows; row 1 is now, with no "until")
const k2 = (i: number) => (a: Answers) => (a.K1 === "Y" ? a.K2[i] : undefined);
const ME_RESP_OTHER: LivedWith[] = ["me", "respondent", "other"];
D.push(
  ...residenceRow(
    "Page1.List4.List.Li2",
    { from: "tf1", city: "tf2", with: ["ChoiceChildLiveW8", "ChoiceChildLiveW8[1]", "ChoiceChildLiveW8[2]"], other: "TextField1", priv: "chb1" },
    ME_RESP_OTHER,
    k2(0),
  ),
);
(
  [
    ["tf3", "tf4", "tf6", "ChoiceChildLiveW9", "TextField2"],
    ["tf7", "tf8", "tf9", "ChoiceChildLiveW10", "TextField3"],
    ["tf10", "tf11", "tf12", "ChoiceChildLiveW11", "TextField4"],
    ["tf13", "tf14", "tf15", "ChoiceChildLiveW12", "TextField5"],
    ["tf16", "tf17", "tf18", "ChoiceChildLiveW13", "TextField6"],
  ] as const
).forEach(([from, until, city, w, other], i) =>
  D.push(
    ...residenceRow("Page1.List4.List.Li2", { from, until, city, with: [w, `${w}[1]`, `${w}[2]`], other }, ME_RESP_OTHER, k2(i + 1)),
  ),
);

// 5a · other cases about the children
const childCases = (a: Answers): CaseRecord[] => [
  ...(a.C3 === "Y" ? a.C4.filter((c) => c.kids === "Y") : []),
  ...(a.C5 === "Y" ? a.C5cases : []),
];
const caseText = (cs: CaseRecord[], withKind = false) =>
  cs
    .map((c) => [withKind ? c.kind || c.type : "", c.where, c.year, c.caseNumber && `Case no. ${c.caseNumber}`].filter(Boolean).join("; "))
    .join(" | ");
D.push(
  b("Page2.List5.List.Li1.ChoiceInvolv1", (a) => childCases(a).length === 0),
  b("Page2.List5.List.Li1.ChoiceInvolv1[1]", (a) => childCases(a).length > 0),
);
(
  [
    [1, ["custody"]],
    [2, ["divorce"]],
    [3, ["juvenile"]],
    [4, ["guardianship"]],
    [5, ["criminal"]],
    [6, ["child support", "other"]],
  ] as const
).forEach(([n, types]) => {
  const pick = (a: Answers) => childCases(a).filter((c) => (types as readonly string[]).includes(c.type));
  D.push(
    b(`Page2.List5.List.Li1.CheckBox${n}`, (a) => pick(a).length > 0),
    b(`Page2.List5.List.Li1.TextField${n}`, (a) => {
      const t = caseText(pick(a), n === 6);
      return t ? { long: t, sheet: "DV-105, Item 5a" } : "";
    }),
  );
});

// 5b · custody order now in effect; 5c · other parent or guardian
D.push(
  b("Page2.List5.List.Li2.ChoiceCustody", (a) => a.C6 === "N"),
  b("Page2.List5.List.Li2.ChoiceCustody[1]", (a) => a.C6 === "Y"),
  b("Page2.List5.List.Li2.#area.TextField1", (a) => (a.C6 === "Y" ? { long: a.C7, sheet: "DV-105, Item 5b" } : "")),
  b("Page2.List5.List.Li2.TextField2", (a) => (a.C6 === "Y" ? { long: a.C8, sheet: "DV-105, Item 5b" } : "")),
  b("Page2.List5.List.Li3.TextField2", (a) => (a.PR13.has === "Y" ? a.PR13.name : "")),
  b("Page2.List5.List.Li3.PartentLG", (a) => a.PR13.has === "Y" && a.PR13.role === "parent"),
  b("Page2.List5.List.Li3.PartentLG[1]", (a) => a.PR13.has === "Y" && a.PR13.role === "legal guardian"),
);

// 6 · travel limits
const k3 = (a: Answers, p: string) => a.K3.on === "Y" && a.K3.places.includes(p);
D.push(
  b("Page3.List6.item6NY", (a) => a.K3.on === "N"),
  b("Page3.List6.item6NY[1]", (a) => a.K3.on === "Y"),
  b("Page3.List6.item6cb1", (a) => k3(a, "this county")),
  b("Page3.List6.item6tf1", (a) => (k3(a, "this county") ? a.K3.countyName || a.S1 : "")),
  b("Page3.List6.item6cb2", (a) => k3(a, "California")),
  b("Page3.List6.item6cb3", (a) => k3(a, "other")),
  b("Page3.List6.item6tf2", (a) => (k3(a, "other") ? a.K3.otherPlaces : "")),
);

// 7 · records. The form asks "may they see records?", so Yes = not blocked.
const k4 = (a: Answers, r: string) => a.K4.on === "Y" && a.K4.records.includes(r);
D.push(
  b("Page3.List7.ChoiceItem7", (a) => a.K4.on === "N"),
  b("Page3.List7.ChoiceItem7[1]", (a) => a.K4.on === "Y"),
  b("Page3.List7.List.LI1.CheckBoxRightCaptionitem7a", (a) => a.K4.on === "Y" && a.K4.children === "all"),
  b("Page3.List7.List.LI1.CheckBoxRightCaptionitem7a[1]", (a) => a.K4.on === "Y" && a.K4.children === "named"),
  b("Page3.List7.List.LI1.TextField", (a) =>
    a.K4.on === "Y" && a.K4.children === "named"
      ? a.roster
          .filter((p) => a.K4.named.includes(p.id))
          .map((p) => p.name)
          .join(", ")
      : "",
  ),
  b("Page3.List7.List.Li2.CheckBoxRightCaption", (a) => k4(a, "medical")),
  b("Page3.List7.List.Li2.CheckBoxRightCaptionitem7b", (a) => k4(a, "school")),
  b("Page3.List7.List.Li2.CheckBoxRightCaption2", (a) => k4(a, "activities")),
  b("Page3.List7.List.Li2.CheckBoxRightCaption3[1]", (a) => k4(a, "child's job")),
  b("Page3.List7.List.Li2.CheckBoxRightCaption3", (a) => k4(a, "other")),
  b("Page3.List7.List.Li2.TextField", (a) => (k4(a, "other") ? a.K4.otherText : "")),
);

// 8 · abduction
D.push(b("Page3.List8.kidnap", (a) => a.K5 === "N"), b("Page3.List8.kidnap[1]", (a) => a.K5 === "Y"));

// 9 · custody
const CUSTODY = ["sole to me", "sole to respondent", "joint", "other"];
CUSTODY.forEach((v, i) =>
  D.push(
    b(idx("Page4.List9.YesSub.CheckBoxRightCaptionItem9", i), (a) => a.K6.on === "Y" && a.K6.legal === v),
    b(idx("Page4.List9.YesSub.CheckBoxRightCaptionItem9PhyCust", i), (a) => a.K6.on === "Y" && a.K6.physical === v),
  ),
);
D.push(
  b("Page4.List9.ChoiceItem9YesNo", (a) => a.K6.on === "N"),
  b("Page4.List9.ChoiceItem9YesNo[1]", (a) => a.K6.on === "Y"),
  b("Page4.List9.YesSub.TextField1", (a) => (a.K6.on === "Y" && a.K6.legal === "other" ? a.K6.legalOther : "")),
  b("Page4.List9.YesSub.TextField2", (a) => (a.K6.on === "Y" && a.K6.physical === "other" ? a.K6.physicalOther : "")),
);

// 10–11 · visits and supervision
const visits = (a: Answers) => a.K7 === "yes" || a.K7 === "virtual only";
const supervised = (a: Answers) => visits(a) && a.K8 === "Y";
const unsupervised = (a: Answers) => visits(a) && a.K8 === "N";
/** Virtual-only visits need no place question; the answer is "virtual". */
const place = (a: Answers) => (a.K7 === "virtual only" ? "virtual" : a.K10.kind);
D.push(
  b("Page4.List10.ChoiceItem10", (a) => a.K7 === "no visits"),
  b("Page4.List10.ChoiceItem10[1]", (a) => a.K7 === "yes"),
  b("Page4.List10.ChoiceItem10[2]", (a) => a.K7 === "virtual only"),
  b("Page4.List11.ChoiceItem11", (a) => supervised(a)),
  b("Page4.List11.ChoiceItem11[1]", (a) => unsupervised(a)),
);

/** 12a / 13a: professional or trusted-person supervisor. */
function supervisorFields(base: string, choice: string, agreed: string, when: (a: Answers) => boolean, get: (a: Answers) => Supervisor): Binding[] {
  const pro = (a: Answers) => when(a) && get(a).type === "professional";
  const lay = (a: Answers) => when(a) && get(a).type === "trusted person";
  return [
    b(`${base}.Li1.${choice}`, pro),
    b(`${base}.Li1.TextField2`, (a) => (pro(a) ? get(a).name : "")),
    b(`${base}.Li1.NumericField1`, (a) => (pro(a) ? get(a).feeMe : "")),
    b(`${base}.Li1.NumericField2`, (a) => (pro(a) ? get(a).feeRespondent : "")),
    b(`${base}.Li1.TextField3`, (a) => (pro(a) ? get(a).feeOtherName : "")),
    b(`${base}.Li1.NumericField3`, (a) => (pro(a) ? get(a).feeOther : "")),
    b(`${base}.Li2.${choice}`, lay),
    b(`${base}.Li2.t2`, (a) => (lay(a) ? get(a).name : "")),
    b(`${base}.Li2.${agreed}`, (a) => lay(a) && get(a).agreed),
  ];
}

// 12 · supervised visits
const k11 = (a: Answers, k: string) => supervised(a) && a.K11.kind === k;
D.push(
  ...supervisorFields("Page5.List12.List.Li1.List", "choiceItem12a", "CheckBoxRightCaption", supervised, (a) => a.K9),
  b("Page5.List12.List.Li2.CheckBoxRightCaptionItem12b", (a) => supervised(a) && place(a) === "safe place"),
  b("Page5.List12.List.Li2.CheckBoxRightCaptionItem12b[1]", (a) => supervised(a) && place(a) === "virtual"),
  b("Page5.List12.List.Li2.CheckBoxRightCaptionItem12b[2]", (a) => supervised(a) && place(a) === "other"),
  b("Page5.List12.List.Li2.TextField2", (a) => (supervised(a) && place(a) === "other" ? a.K10.otherText : "")),
  b("Page5.List12.List.Li3.CheckBoxRightCaptionItem12c", (a) => k11(a, "once a week")),
  b("Page5.List12.List.Li3.TextField1", (a) => (k11(a, "once a week") ? a.K11.hours : "")),
  b("Page5.List12.List.Li3.CheckBoxRightCaptionItem12c[1]", (a) => k11(a, "twice a week")),
  b("Page5.List12.List.Li3.t3", (a) => (k11(a, "twice a week") ? a.K11.hours : "")),
  b("Page5.List12.List.Li3.CheckBoxRightCaptionItem12c[2]", (a) => k11(a, "other")),
  b("Page5.List12.List.Li3.TextField3", (a) => (k11(a, "other") ? a.K11.otherText : "")),
  b("Page5.List12.List.Li3.CheckBoxRightCaptionItem12c[3]", (a) => k11(a, "schedule")),
);

/** Weekly chart: [start, virtual, who line 1, place line 1, end, who line 2, place line 2] per day, Monday first. */
type DayFields = [string, string, string, string, string, string, string];
function chart(base: string, days: DayFields[], repeat: string, other: string, start: string, when: (a: Answers) => boolean): Binding[] {
  const out: Binding[] = [];
  WEEKDAYS.forEach((day: Weekday, i) => {
    const [st, virt, who1, pl1, end, who2, pl2] = days[i];
    const get = (a: Answers) => (when(a) && a.K14.days[day].on ? a.K14.days[day] : undefined);
    out.push(
      b(`${base}.${st}`, (a) => fmtTime(get(a)?.start)),
      b(`${base}.${end}`, (a) => fmtTime(get(a)?.end)),
      b(`${base}.${virt}`, (a) => !!get(a)?.virtual),
      b(`${base}.${who1}`, (a) => twoLines(get(a)?.whoBrings ?? "", 24)[0]),
      b(`${base}.${who2}`, (a) => twoLines(get(a)?.whoBrings ?? "", 24)[1]),
      b(`${base}.${pl1}`, (a) => twoLines(get(a)?.place ?? "", 24)[0]),
      b(`${base}.${pl2}`, (a) => twoLines(get(a)?.place ?? "", 24)[1]),
    );
  });
  ["every week", "every other week", "other"].forEach((r, i) => out.push(b(idx(`${base}.${repeat}`, i), (a) => when(a) && a.K14.repeat === r)));
  out.push(
    b(`${base}.${other}`, (a) => (when(a) && a.K14.repeat === "other" ? a.K14.repeatOther : "")),
    b(`${base}.${start}`, (a) => (when(a) ? fmtDate(a.K14.startDate) : "")),
  );
  return out;
}
// Chart field names are irregular; listed per day as in docs/field-map.
D.push(
  ...chart(
    "Page5.List12.List.Li3",
    [
      ["tf1", "itemc_VirtVist_cb1", "tf3", "dropoff1", "tf2", "tf4", "tf6"],
      ["tf7", "itemc_VirtVist_cb2", "tf9", "dropoff2", "tf8", "tf10", "tf12"],
      ["tf13", "itemc_VirtVist_cb3", "tf14", "dropoff3", "tf15", "tf16", "tf18"],
      ["tf19", "itemc_VirtVist_cb4", "tf20", "dropoff4", "tf21", "tf22", "tf24"],
      ["tf25", "itemc_VirtVist_cb5", "tf26", "dropoff5", "tf27", "tf28", "tf30"],
      ["tf31", "itemc_VirtVist_cb6", "tf32", "dropoff6", "tf33", "tf34", "tf36"],
      ["tf37", "itemc_VirtVist_cb7", "tf38", "dropoff7", "tf39", "tf41", "tf42"],
    ],
    "CheckBoxRightCaption12b",
    "othertf",
    "TextField2",
    (a) => k11(a, "schedule"),
  ),
);

// 13 · unsupervised visits
D.push(
  b("Page6.List13.List.Li1.ChoiceItem13aNoYes", (a) => unsupervised(a) && a.K12on === "N"),
  b("Page6.List13.List.Li1.ChoiceItem13aNoYes[1]", (a) => unsupervised(a) && a.K12on === "Y"),
  ...supervisorFields(
    "Page6.List13.List.Li1.List",
    "ChoiceItem13aSupervExch",
    "CheckBoxRightCaption",
    (a) => unsupervised(a) && a.K12on === "Y",
    (a) => a.K12,
  ),
  // Widget order here is in person, virtual, other.
  b("Page6.List13.List.Li2.List.Li1.Item13b1", (a) => unsupervised(a) && place(a) === "safe place"),
  b("Page6.List13.List.Li2.List.Li1.Item13b1[1]", (a) => unsupervised(a) && place(a) === "virtual"),
  b("Page6.List13.List.Li2.List.Li1.Item13b1[2]", (a) => unsupervised(a) && place(a) === "other"),
  b("Page6.List13.List.Li2.List.Li1.TextField2", (a) => (unsupervised(a) && place(a) === "other" ? a.K10.otherText : "")),
  b("Page6.List13.List.Li2.List.Li2.TextField1", (a) => (unsupervised(a) ? { long: a.K13, sheet: "DV-105, Item 13b(2)" } : "")),
  ...chart(
    "Page6.List13.List.Li2.List.Li2",
    [
      ["tf1", "item13b2_VirtVist_cb1", "tf2", "dropoff1", "tf3", "tf4", "tf6"],
      ["tf7", "item13b2_VirtVist_cb2", "tf8", "dropoff2", "tf9", "tf10", "tf12"],
      ["tf13", "item13b2_VirtVist_cb3", "tf14", "dropoff3", "tf15", "tf16", "tf18"],
      ["tf19", "item13b2_VirtVist_cb4", "tf20", "dropoff4", "tf21", "tf22", "tf24"],
      ["tf25", "item13b2_VirtVist_cb5", "tf26", "dropoff5", "tf27", "tf28", "tf30"],
      ["tf31", "item13b2_VirtVist_cb6", "tf32", "dropoff6", "tf33", "tf34", "tf36"],
      ["tf38", "item13b2_VirtVist_cb7", "tf39", "dropoff7", "tf40", "tf41", "tf42"],
    ],
    "item13bSchedule",
    "othertf",
    "TextField2",
    (a) => unsupervised(a) && a.K14use,
  ),
);

export const DV105: FormSpec = {
  id: "DV-105",
  file: "/forms/DV-105.pdf",
  root: "DV-105[0]",
  bindings: D,
  sheets: (a, d) => [
    ...childrenSheet("DV-105, Children")(a, d),
    { title: "DV-105, Item 4b", text: a.K1 === "Y" ? residenceLines(a.K2, 6) : "" },
  ],
};

// ---------------------------------------------------------------- DV-105(A)

/** K2A groups that have at least one child. */
export const residenceGroups = (a: Answers) => (a.K1 === "N" ? a.K2A.filter((g) => g.children.length > 0) : []);
const groupNames = (a: Answers, g: { children: string[] } | undefined) =>
  g ? a.roster.filter((p) => g.children.includes(p.id)).map((p) => p.name).join(", ") : "";

/** DV-105(A) copy k (0-based) holds groups 2k and 2k+1. */
export function dv105a(k: number): FormSpec {
  const g = (a: Answers, j: 0 | 1) => residenceGroups(a)[2 * k + j];
  const row = (j: 0 | 1, i: number) => (a: Answers) => g(a, j)?.rows[i];
  const out: Binding[] = [
    b("Page1.caseNumber.CaseNumber", caseNo),
    b("Page1.List1.li1.item1", () => true),
    b("Page1.List1.li1.item1[1]", () => false),
    b("Page1.List1.li1.item1[2]", () => false),
    b("Page1.List1.li1.item1[3]", () => false),
    b("Page1.List2.lia.namechild", (a) => groupNames(a, g(a, 0))),
    b("Page1.List3.lia.TextField", (a) => groupNames(a, g(a, 1))),
    b("Page1.List3.MultilineCheckBox", (a) => residenceGroups(a).length > 2 * k + 2),
  ];
  const T1 = "Page1.List2.lib.tblChildLocation";
  const T2 = "Page1.List3.lib.tblLocationChild2";
  out.push(
    ...residenceRow(
      `${T1}.bodyRow1`,
      { from: "tf1", city: "tf2", with: ["ChoiceChildLiveW8", "ChoiceChildLiveW8[1]", "ChoiceChildLiveW8[2]"], other: "TextField1", priv: "chb1" },
      ME_RESP_OTHER,
      row(0, 0),
    ),
    // Group 2, row 1: widget order is me, other, person in 2.
    ...residenceRow(
      `${T2}.bodyRow1`,
      { from: "tf1", city: "tf2", with: ["ChoiceChildLiveW15", "ChoiceChildLiveW15[1]", "ChoiceChildLiveW15[2]"], other: "TextField1", priv: "chb1" },
      ["me", "other", "respondent"],
      row(1, 0),
    ),
  );
  const rest: [string, string, string, number, number][] = [
    // from, until, city, W number in group 1, W number in group 2 (group 1 row 4 reuses TextField3)
    ["tf3", "tf4", "tf6", 9, 16],
    ["tf7", "tf8", "tf9", 10, 17],
    ["tf10", "tf11", "tf12", 11, 18],
    ["tf13", "tf14", "tf15", 12, 19],
    ["tf16", "tf17", "tf18", 13, 20],
    ["tf19", "tf20", "tf21", 14, 21],
  ];
  const other1 = ["TextField2", "TextField3", "TextField3", "TextField4", "TextField5", "TextField6"];
  rest.forEach(([from, until, city, w1, w2], i) => {
    const w = (x: number): [string, string, string] => [`ChoiceChildLiveW${x}`, `ChoiceChildLiveW${x}[1]`, `ChoiceChildLiveW${x}[2]`];
    out.push(
      ...residenceRow(`${T1}.bodyRow${i + 2}`, { from, until, city, with: w(w1), other: other1[i] }, ME_RESP_OTHER, row(0, i + 1)),
      ...residenceRow(`${T2}.bodyRow${i + 2}`, { from, until, city, with: w(w2), other: `TextField${i + 2}` }, ME_RESP_OTHER, row(1, i + 1)),
    );
  });
  return {
    id: "DV-105(A)",
    copy: k + 1,
    file: "/forms/DV-105A.pdf",
    root: "DV-105A[0]",
    bindings: out,
    sheets: (a) =>
      ([0, 1] as const).map((j) => ({
        title: `DV-105(A), Item ${j === 0 ? "2b" : "3b"}${k ? ` (copy ${k + 1})` : ""}`,
        text: residenceLines(g(a, j)?.rows ?? [], 7),
      })),
  };
}

// ---------------------------------------------------------------- DV-140

const P: Binding[] = [
  b("Page1.RightCaption.CaseNumber_ft", caseNo),
  ...[2, 3, 4, 5, 6].map((p) => b(`Page${p}.Caption.PxCaption.CaseNumber_ft`, caseNo)),
  // Filed with the request as the proposed order that goes with DV-110.
  b("Page1.DV140_cb", () => true),
  b("Page1.DV140_cb[1]", () => false),
  b("Page1.DV140_cb[2]", () => false),
  b("Page1.List1.Li1.FullName_ft", (a) => a.P1),
  ...guardianBoxes(
    ["Page1.List1.Li1.CheckBoxRightCaptionitem1", "Page1.List1.Li1.CheckBoxRightCaptionitem1[1]", "Page1.List1.Li1.CheckBoxRightCaptionitem1[2]"],
    "Page1.List1.Li1.TextField",
    pr11,
  ),
  b("Page1.List2.LI1.FullName_ft1", (a) => a.R1),
  ...guardianBoxes(
    ["Page1.List2.LI1.CheckBoxRightCaptionitemitem2", "Page1.List2.LI1.CheckBoxRightCaptionitem2", "Page1.List2.LI1.CheckBoxRightCaptionitem2[1]"],
    "Page1.List2.LI1.TextField",
    pr12,
  ),
  b("Page1.List3.CheckBoxRightCaption", (_a, d) => d.custodyKids.length > 0),
  b("Page1.List3.MultilineCheckBox", (_a, d) => d.custodyKids.length > 4),
];
["34", "35", "36", "37"].forEach((dob, i) =>
  P.push(
    b(`Page1.List3.Li${i + 1}.TextField2`, (_a, d) => kid(d, i)?.name),
    b(`Page1.List3.Li${i + 1}.TextField${dob}`, (_a, d) => fmtDate(kid(d, i)?.dob)),
  ),
);

export const DV140: FormSpec = {
  id: "DV-140",
  file: "/forms/DV-140.pdf",
  root: "DV-140[0]",
  bindings: P,
  sheets: childrenSheet("DV-140, Children"),
};

// ---------------------------------------------------------------- DV-108

const has = (list: string[], v: string) => list.includes(v);
const A: Binding[] = [
  b("Page1.RightCaption.CaseNumber", caseNo),
  b("Page2.CaptionSub.PxCaption.CaseNumber", caseNo),
  b("Page1.List1.LI1.Yourname", (a) => a.P1),
  b("Page1.List2.LI1.OtherParentsName", (a) => a.R1),
  b("Page1.List3.Li1.CheckBoxRightCaption", (a) => a.B1 === "Y"),
  b("Page1.List3.Li2.CheckBoxRightCaption", (a) => a.B2 === "Y"),
  b("Page1.List3.Li3.CheckBoxRightCaption1", (a) => a.B3.length > 0),
  b("Page1.List3.Li3.TextField", (a) => (has(a.B3, "other") ? a.B3other : "")),
  b("Page1.List3.Li4.CheckBoxRightCaption", (a) => a.B4.length > 0),
  b("Page1.List3.Li5.CheckBoxRightCaption", (a) => a.B5 === "Y"),
  b("Page1.List3.Li6.CheckBoxRightCaption", (a) => a.B6.length > 0),
  b("Page1.List3.Li6.CheckBoxRightCaption1", (a) => has(a.B6, "another county")),
  b("Page1.List3.Li6.TextField", (a) => (has(a.B6, "another county") ? a.B6county : "")),
  b("Page1.List3.Li6.CheckBoxRightCaption2", (a) => has(a.B6, "another state")),
  b("Page1.List3.Li6.TextField1", (a) => (has(a.B6, "another state") ? a.B6state : "")),
  b("Page1.List3.Li6.CheckBoxRightCaption3", (a) => has(a.B6, "another country")),
  b("Page1.List3.Li6.TextField2", (a) => (has(a.B6, "another country") ? a.B6country : "")),
  b("Page1.List3.Li7.CheckBoxRightCaption", (a) => a.B7.citizen === "Y"),
  b("Page1.List3.Li7.TextField", (a) => (a.B7.citizen === "Y" ? a.B7.countries : "")),
  b("Page1.List3.Li7.ChoiceItem3g", (a) => a.B7.citizen === "Y" && a.B7.strongTies === "Y"),
  b("Page1.List3.Li7.ChoiceItem3g[1]", (a) => a.B7.citizen === "Y" && a.B7.strongTies === "N"),
  b("Page1.List3.Li7.item26d_tf", (a) => ({ long: a.B8, sheet: "DV-108, Item 3" })),
];
(
  [
    [2, "quit a job"],
    [3, "applied for documents"],
    [4, "closed a bank account"],
    [5, "hid or destroyed documents"],
    [6, "sold or got rid of property"],
    [7, "other"],
    [8, "sold a home or ended a lease"],
  ] as const
).forEach(([k, v]) => A.push(b(`Page1.List3.Li3.CheckBoxRightCaption${k}`, (a) => has(a.B3, v))));
(
  [
    [1, "abusing you"],
    [2, "taking or hiding the children"],
    [3, "child abuse"],
    [4, "threatening to take the children"],
    [5, "abusing other partners"],
    [6, "not cooperating in parenting"],
  ] as const
).forEach(([k, v]) => A.push(b(`Page1.List3.Li4.CheckBoxRightCaption${k}`, (a) => has(a.B4, v))));

// 4–10 · protections requested
const want = (a: Answers, v: string) => has(a.B9, v);
A.push(
  b("Page2.List4.Li1.CheckBoxRightCaption", (a) => want(a, "no move without permission")),
  b("Page2.List5.Li1.CheckBoxRightCaption", (a) => want(a, "surrender documents")),
  b("Page2.List5.Li1.TextField", (a) => (want(a, "surrender documents") ? a.B10.documents : "")),
  b("Page2.List5.Li1.tf1", (a) => (want(a, "surrender documents") ? fmtDate(a.B10.date) : "")),
  b("Page2.List5.Li1.TextField1", (a) => (want(a, "surrender documents") ? a.B10.giveTo : "")),
  b("Page2.List6.Li1.CheckBoxRightCaption", (a) => want(a, "travel plan")),
  b("Page2.List6.Li1.TextField2", (a) => (want(a, "travel plan") && has(a.B11, "other") ? a.B11other : "")),
  b("Page2.List7.Li1.CheckBoxRightCaption", (a) => want(a, "register in another state")),
  b("Page2.List7.Li1.TextField", (a) => (want(a, "register in another state") ? a.B12 : "")),
  b("Page2.List8.Li1.CheckBoxRightCaption", (a) => want(a, "notify embassy")),
  // These two field names are swapped on the form: DateField1 holds the embassy name.
  b("Page2.List8.Li1.DateField1", (a) => (want(a, "notify embassy") ? a.B13.embassy : "")),
  b("Page2.List8.Li1.TextField2", (a) => (want(a, "notify embassy") ? fmtDate(a.B13.proofDate) : "")),
  b("Page2.List9.L1.CheckBoxRightCaption", (a) => want(a, "foreign custody order")),
  b("Page2.List9.L1.TextField", (a) => (want(a, "foreign custody order") ? a.B14 : "")),
  b("Page2.List10.Li1.CheckBoxRightCaption", (a) => want(a, "bond")),
  b("Page2.List10.Li1.TextField", (a) => (want(a, "bond") ? money(a.B15) : "")),
);
(
  [
    [1, "schedule"],
    [2, "round-trip tickets"],
    [3, "addresses and phones"],
    [4, "open ticket for you"],
    [5, "other"],
  ] as const
).forEach(([k, v]) => A.push(b(`Page2.List6.Li1.CheckBoxRightCaption${k}`, (a) => want(a, "travel plan") && has(a.B11, v))));

export const DV108: FormSpec = {
  id: "DV-108",
  file: "/forms/DV-108.pdf",
  root: "DV-108[0]",
  bindings: A,
};

// ---------------------------------------------------------------- DV-145

export const DV145: FormSpec = {
  id: "DV-145",
  file: "/forms/DV-145.pdf",
  root: "DV-145[0]",
  bindings: [
    b("Page1.RightCaption.CaseNumber", caseNo),
    b("Page2.CaptionSub.PxCaption.RightCaption.CaseNumber", caseNo),
    b("Page1.List1.Li1.FullName_ft", (a) => a.P1),
    ...guardianBoxes(
      ["Page1.List1.Li1.CheckBoxRightCaptionItem1", "Page1.List1.Li1.CheckBoxRightCaptionItem1[1]", "Page1.List1.Li1.CheckBoxRightCaptionItem1[2]"],
      "Page1.List1.Li1.TextField",
      pr11,
    ),
    b("Page1.List2.LI1.FullName_ft1", (a) => a.R1),
    // Item 2 widget order: Other, Parent, Legal guardian.
    ...guardianBoxes(
      ["Page1.List2.LI1.CheckBoxRightCaptionItem2[1]", "Page1.List2.LI1.CheckBoxRightCaptionItem2[2]", "Page1.List2.LI1.CheckBoxRightCaptionItem2"],
      "Page1.List2.LI1.TextField",
      pr12,
    ),
  ],
};
