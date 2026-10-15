/**
 * CLETS-001, DV-109, DV-110 and DV-900 bindings (stage 1 filing).
 * Mirrors docs/field-map tabs of the same names.
 */
import type { Binding, FormSpec } from "../engine";
import { b, caseNo } from "../helpers";
import {
  courtCaption,
  firearmSummary,
  fmtDate,
  personAge,
  petitionerAge,
  relationshipPhrase,
  respondentAge,
} from "../../derive";
import type { Answers } from "../../types";

// ---------------------------------------------------------------- CLETS-001
const C: Binding[] = [
  b("Page1.RightCaption.CaseNumber_ft", caseNo),
  b("Page2.CaseNumber_ft", caseNo),
  b("Page1.List1.Li1.nametf", (a) => a.R1),
  b("Page1.List1.Li1.othernametf", (a) => a.R2),
  b("Page1.List1.Li1.marktf", (a) => a.R8),
  b("Page1.List1.Li1.ssntf", (a) => a.R10),
  b("Page1.List1.Li1.drivelicensetf", (a) => [a.R9.number, a.R9.state].filter(Boolean).join(" ")),
  b("Page1.List1.Li1.cartypetf", (a) => a.R11.type),
  b("Page1.List1.Li1.modeltf", (a) => a.R11.model),
  b("Page1.List1.Li1.yeartf", (a) => a.R11.year),
  b("Page1.List1.Li1.plateno", (a) => a.R11.plate),
  b("Page1.List1.Li1.phonetf", (a) => a.R12),
  b("Page1.List1.Li1.employertf", (a) => [a.R13.name, a.R13.address].filter(Boolean).join(", ")),
  b("Page1.List1.Li1.item1ME", (a) => a.R17 === "Y"),
  b("Page1.List1.Li1.item1ME[1]", (a) => a.R17 === "DK"),
  b("Page1.List1.Li1.item1ME[2]", (a) => a.R17 === "N"),
  b("Page1.List1.Li1.notf", (a) => (a.R17 === "N" ? a.R17language : "")),
  // Jan 2026 revision: one combined firearms-or-body-armor question.
  b("Page1.List1.Li1.item1firearmME", (a) => a.R18 === "N" && a.R20 === "N"),
  b("Page1.List1.Li1.item1firearmME[1]", (a) => a.R18 !== "Y" && a.R20 !== "Y" && (a.R18 === "DK" || a.R20 === "DK")),
  b("Page1.List1.Li1.item1firearmME[2]", (a) => a.R18 === "Y" || a.R20 === "Y"),
  b("Page1.List1.Li1.Yestf", (a) => (a.R18 === "Y" || a.R20 === "Y" ? firearmSummary(a, true) : "")),
  b("Page2.List2.Li1.yournametf", (a) => a.P1),
  // Widget order is X (nonbinary), Male, Female.
  b("Page2.Item3genderME", (a) => a.P4 === "X"),
  b("Page2.Item3genderME[1]", (a) => a.P4 === "M"),
  b("Page2.Item3genderME[2]", (a) => a.P4 === "F"),
  b("Page2.racetf", (a) => a.P5),
  b("Page2.List3.Li1.agetf", (a) => petitionerAge(a)),
  b("Page2.List3.Li1.dob", (a) => fmtDate(a.P2)),
  b("Page2.item3phonetf", (a) => a.P7),
  b("Page2.item3EnglishME[1]", (a) => a.P9 === "Y"),
  b("Page2.item3EnglishME", (a) => a.P9 === "N"),
  b("Page2.item3englishtf", (a) => (a.P9 === "N" ? a.P9language : "")),
  b("Page2.List4.Li1.item4cb", (_a, d) => d.protectedPeople.length > 4),
];
const GENDER_LABEL: Record<string, string> = { M: "M", F: "F", X: "X (nonbinary)" };
for (let i = 0; i < 4; i++) {
  C.push(
    b(`Page2.List4.Li1.item4nametf${i + 1}`, (_a, d) => d.protectedPeople[i]?.name),
    b(`Page2.List4.Li1.item4gendertf${i + 1}`, (_a, d) => GENDER_LABEL[d.protectedPeople[i]?.gender ?? ""] ?? ""),
    b(`Page2.List4.Li1.item4racetf${i + 1}`, (_a, d) => d.protectedPeople[i]?.race),
    b(`Page2.List4.Li1.item4dob${i + 1}`, (_a, d) => fmtDate(d.protectedPeople[i]?.dob)),
  );
}

export const CLETS001: FormSpec = {
  id: "CLETS-001",
  file: "/forms/CLETS-001.pdf",
  root: "CLETS-001[0]",
  bindings: C,
  sheets: (_a, d) => [
    {
      title: "CLETS-001, Item 4",
      text: d.protectedPeople
        .slice(4)
        .map((p, i) => `${i + 5}. ${p.name} — gender: ${GENDER_LABEL[p.gender] ?? ""} — race: ${p.race} — date of birth: ${fmtDate(p.dob)}`)
        .join("\n"),
    },
  ],
};

// ---------------------------------------------------------------- DV-109
export const DV109: FormSpec = {
  id: "DV-109",
  file: "/forms/DV-109.pdf",
  root: "DV-109[0]",
  bindings: [
    b("Page1.P1RightCaption.CrtInfo.CourtInfo_ft", (a) => courtCaption(a)),
    b("Page1.P1RightCaption.CaseNo.CaseNumber_ft", caseNo),
    b("Page2.P2Header.CaseNumber_ft", caseNo),
    b("Page3.P3Header.CaseNumber_ft", caseNo),
    b("Page1.List1.Li1.YourName_tf", (a) => a.P1),
    b("Page1.List2.Li1.YourName_tf", (a) => a.R1),
  ],
};

// ---------------------------------------------------------------- DV-110
const T: Binding[] = [
  b("Page1.StampbxSub.CourtInfo_ft", (a) => courtCaption(a)),
  b("Page1.StampbxSub.CaseNumber", caseNo),
  b("Page1.OrigAmen_cb", (a) => a.S3 === "new"),
  b("Page1.OrigAmen_cb[1]", (a) => a.S3 === "update"),
  b("Page1.List1.Li1.TextField", (a) => a.P1),
  b("Page1.List2.Li1.ParentRel", (a) => a.R1),
  b("Page1.List2.Li1.gender_cb", (a) => a.R5 === "M"),
  b("Page1.List2.Li1.gender_cb[1]", (a) => a.R5 === "F"),
  b("Page1.List2.Li1.gender_cb[2]", (a) => a.R5 === "X"),
  b("Page1.List2.Li1.TF6", (a) => a.R6),
  b("Page1.List2.Li1.T191", (a) => respondentAge(a)),
  b("Page1.List2.Li1.TF1", (a) => fmtDate(a.R3)),
  b("Page1.List2.Li1.TF2", (a) => a.R7.height),
  b("Page1.List2.Li1.TF3", (a) => a.R7.weight),
  b("Page1.List2.Li1.TF4", (a) => a.R7.hair),
  b("Page1.List2.Li1.TF5", (a) => a.R7.eyes),
  b("Page1.List2.Li1.TextField", (a) => relationshipPhrase(a)),
  b("Page1.List2.Li1.TF7", (a) => a.R14.street),
  b("Page1.List2.Li1.TF8", (a) => a.R14.city),
  b("Page1.List2.Li1.TF9", (a) => a.R14.state),
  b("Page1.List2.Li1.TF10", (a) => a.R14.zip),
  b("Page1.List2.Li1.OtherSpecify_tf", (a) => (a.R18 === "Y" ? firearmSummary(a, false) : "")),
  b("Page1.List3.Li1.item3_cb", (_a, d) => d.protectedPeople.length > 0),
  b("Page1.List3.Li1.AGHagueCert_cb", (_a, d) => d.protectedPeople.length > 4),
];
for (let p = 2; p <= 9; p++) T.push(b(`Page${p}.PxCaption.CaseNumber`, caseNo));
// Row field names are irregular; listed in row order.
[
  ["item3FullName1_tf1", "item3relation1_tf1", "item3age1_tf1"],
  ["item3FullName1_tf", "item3relation1_tf", "item3age1_tf"],
  ["item3FullName2_tf", "item3relation2_tf", "item3age2_tf"],
  ["item3FullName3_tf", "item3relation3_tf", "item3age3_tf"],
].forEach(([n, r, ag], i) => {
  T.push(
    b(`Page1.List3.Li1.${n}`, (_a, d) => d.protectedPeople[i]?.name),
    b(`Page1.List3.Li1.${r}`, (_a, d) => d.protectedPeople[i]?.relationship),
    b(`Page1.List3.Li1.${ag}`, (_a, d) => (d.protectedPeople[i] ? personAge(d.protectedPeople[i], d.asOf) : "")),
  );
});

export const DV110: FormSpec = {
  id: "DV-110",
  file: "/forms/DV-110.pdf",
  root: "DV-110[0]",
  bindings: T,
  sheets: (_a, d) => [
    {
      title: "DV-110, Other Protected People",
      text: d.protectedPeople
        .slice(4)
        .map((p, i) => `${i + 5}. ${p.name} — ${p.relationship} — age ${personAge(p, d.asOf)}`)
        .join("\n"),
    },
  ],
};

// ---------------------------------------------------------------- DV-900
const on28 = (a: Answers) => !!a.orders.O28;
// The five number lines are named out of order: top to bottom T78, T78[4], [3], [2], [1].
const LINES = ["T78", "T78[4]", "T78[3]", "T78[2]", "T78[1]"];
export const DV900: FormSpec = {
  id: "DV-900",
  file: "/forms/DV-900.pdf",
  root: "topmostSubform[0]",
  bindings: [
    b("Page1.Stamp_court_case.CourtInfo_ft", (a) => courtCaption(a)),
    b("Page1.Stamp_court_case.CaseNumber_ft", caseNo),
    b("#subform[1].CaseNumber_ft", caseNo),
    b("Page1.OtherSpecify_tf", (a) => (on28(a) ? a.W1 : "")),
    b("Page1.T78[5]", (a) => (on28(a) ? a.W2 || a.R1 : "")),
    b("Page1.T78[7]", (a) => (on28(a) ? a.W3 : "")),
    b("Page1.T78[6]", (a) => (on28(a) ? a.W4 || a.P1 : "")),
    ...LINES.map((f, i) => b(`Page1.${f}`, (a) => (on28(a) ? a.O28[i]?.phone : ""))),
    b("Page1.item4attach_cb", (a) => on28(a) && a.O28.length > 5),
  ],
  sheets: (a) => [
    {
      title: "DV-900, Item 4 — Additional Telephone Numbers",
      text: on28(a) ? a.O28.slice(5).map((x, i) => `${i + 6}. ${x.phone}`).join("\n") : "",
    },
  ],
};

