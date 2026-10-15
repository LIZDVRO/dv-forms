/**
 * The remaining forms. Each is filled from answers the wizard already has; the
 * court, clerk or server completes the rest. Mirrors docs/field-map tabs of the same names.
 *
 *   Confidentiality (when PR14):  DV-160, DV-165 (proposed order), DV-170 (caption), DV-175
 *   Bring to the hearing:         DV-130, DV-150 (with custody)
 *   Keep for later:               DV-200, DV-250 (with FL-150), DV-901 (with DV-900), DV-210
 */
import type { Binding, FormSpec } from "../engine";
import { b, caseNo, contact, idx, twoLines } from "../helpers";
import { courtCaption, custodyRequested, financesRequested, fmtDate, oneLine, personAge, relationshipPhrase, respondentAge, type Derived } from "../../derive";
import type { Answers, RosterPerson } from "../../types";

// ---------------------------------------------------------------- confidentiality

/** The minors the confidentiality request is for (M2), in roster order. */
export const confidentialMinors = (a: Answers): RosterPerson[] => a.roster.filter((p) => a.M2.includes(p.id));
/** DV-160 is used when the person asks and named at least one minor (or is the minor). */
export const confidentialityRequested = (a: Answers) => a.PR14 === "Y" && (a.M1 === "the minor" || a.M2.length > 0);
/** Who signs: the petitioner, or the minor when the minor asks. */
const requester = (a: Answers) => a.P1;

const DV160_6A = "DV-160, Attachment 6a";
const DV160_6B = "DV-160, Attachment 6b";
const DV160_8 = "DV-160, Attachment 8";

const C: Binding[] = [
  b("Page1.Caption_sf.CourtInfo_ft", (a) => courtCaption(a)),
  b("Page1.Caption_sf.CaseNumber_ft", caseNo),
  ...[2, 3, 4, 5, 6].map((p) => b(`Page${p}.PxCaption.CaseNumber_ft`, caseNo)),
  // 1 · parties (field names do not follow item order)
  b("Page1.ProtectedFullName_ft[5]", (a) => a.P1),
  b("Page1.ProtectedFullName_ft[6]", (a) => a.R1),
  // 2 · who is asking
  b("Page1.ProtectedFullName_ft", (a) => requester(a)),
  b("Page1.ProtectedDescription", (a) => a.M1 === "the minor"),
  b("Page1.ProtectedDescription[1]", (a) => !!a.M1 && a.M1 !== "the minor"),
  b("Page1.parent", (a) => a.M1 === "parent"),
  b("Page1.parent[1]", (a) => a.M1 === "legal guardian"),
  ...[0, 1, 2, 3].map((i) => b(`Page1.ProtectedFullName_ft[${i + 1}]`, (a) => (a.M1 !== "the minor" ? confidentialMinors(a)[i]?.name : ""))),
  b("Page1.OtherProtectedTable_OF_cb", (a) => a.M1 !== "the minor" && confidentialMinors(a).length > 4),
  // 3 · your contact (or your lawyer's)
  b("Page2.TextField3", contact.street),
  b("Page2.TextField3[1]", contact.city),
  b("Page2.TextField3[2]", contact.state),
  b("Page2.TextField3[3]", contact.zip),
  b("Page2.TextField3[4]", contact.phone),
  b("Page2.TextField3[5]", contact.email),
  b("Page2.TextField3[6]", contact.fax),
  b("Page2.TextField3[7]", (a) => (a.S5 === "Y" ? a.L1 : "")),
  b("Page2.TextField3[8]", (a) => (a.S5 === "Y" ? a.L2 : "")),
  // 4 · more than one minor
  b("Page2.ProtectedDescription", (a) => confidentialMinors(a).length >= 2),
  b("Page2.confi", (a) => confidentialMinors(a).length >= 2 && a.M3 === "Y"),
  b("Page2.confi[1]", (a) => confidentialMinors(a).length >= 2 && a.M3 === "N"),
  // 5 · what to keep from the public
  b("Page2.OtherProtectedText_OF_cb1", (a) => a.M4.includes("name")),
  b("Page2.OtherProtectedText_OF_cb1[1]", (a) => a.M4.includes("address")),
  b("Page2.TextField", (a) => (a.M4.includes("address") ? oneLine(a.M5) : "")),
  b("Page3.OtherProtectedText_OF_cb", (a) => a.M4.includes("other")),
  b("Page3.OtherProtectedText_OF_cb5", () => false),
  b("Page3.OtherProtectedText_OF_cb5[1]", (a) => a.M4.includes("other")),
  b("Page3.OtherProtectedText_OF_cb[1]", (a) => a.M4.includes("other") && a.M6.length > 4),
  // 6 · why
  b("Page4.OtherProtectedReasons_ft", (a) => ({ long: a.M7, sheet: DV160_6A })),
  b("Page4.OtherProtectedReasons_ft[1]", (a) => ({ long: a.M8, sheet: DV160_6B })),
  // 7 · if the court says no
  b("Page5.OtherProtectedText_OF_cb4", (a) => a.M9 === "cancel"),
  b("Page5.OtherProtectedText_OF_cb4[1]", (a) => a.M9 === "go forward"),
  // 8 · keep from the respondent too
  b("Page5.OtherOrders_cb", (a) => a.M10.what.length > 0),
  b("Page5.ConfMinorsName_cb", (a) => a.M10.what.includes("name")),
  b("Page5.ConfMinorsAdd_cb", (a) => a.M10.what.includes("address")),
  b("Page5.ConfMinorOth_cb", (a) => a.M10.what.includes("other")),
  b("Page5.TextField[2]", (a) => (a.M10.what.includes("other") ? a.M10.otherText : "")),
  b("Page5.TextField", (a) => (a.M10.what.length ? { long: a.M10.why, sheet: DV160_8 } : "")),
  b("Page5.TextField[1]", (a) => (a.M10.what.length ? { long: a.M10.whatWouldHappen, sheet: DV160_8 } : "")),
  b("Page6.OtherOrders_cb", (a) => a.M10.what.length > 0),
  b("Page6.OtherProtectedText_OF_cb2", (a) => a.M10.what.length > 0 && a.M10.ifDenied === "cancel"),
  b("Page6.OtherProtectedText_OF_cb2[1]", (a) => a.M10.what.length > 0 && a.M10.ifDenied === "go forward"),
  // 9 · who else may see unredacted copies (box order is shuffled)
  b("Page6.CheckBox4", (a) => a.M11.who.includes("childcare")),
  b("Page6.CheckBox4[1]", (a) => a.M11.who.includes("supervised visitation provider")),
  b("Page6.CheckBox4[2]", (a) => a.M11.who.includes("school")),
  b("Page6.CheckBox4[6]", (a) => a.M11.who.includes("other")),
  b("Page6.TextField", (a) => (a.M11.who.includes("other") ? a.M11.otherName : "")),
  b("Page6.CheckBox4[5]", (a) => a.M11.who.length > 0 && a.M11.what.includes("name")),
  b("Page6.CheckBox4[3]", (a) => a.M11.who.length > 0 && a.M11.what.includes("address")),
  b("Page6.CheckBox4[4]", (a) => a.M11.who.length > 0 && a.M11.what.includes("5c information")),
  // 11–12 · signatures
  b("Page6.SigDate", (a) => fmtDate(a.G1)),
  b("Page6.T14", (a) => requester(a)),
  b("Page6.LawyerSignature_dt", (a) => (a.S5 === "Y" ? fmtDate(a.G1) : "")),
];
// 5c(2) rows a–d are numbered 0, 3, 2, 1 in the PDF.
[0, 3, 2, 1].forEach((n, row) =>
  C.push(
    b(idx("Page3.DocTitle_ft", n), (a) => (a.M4.includes("other") ? a.M6[row]?.text : "")),
    b(idx("Page3.DocFilingDate_ft", n), (a) => (a.M4.includes("other") ? a.M6[row]?.location : "")),
  ),
);

export const DV160: FormSpec = {
  id: "DV-160",
  file: "/forms/DV-160.pdf",
  root: "DV-160[0]",
  bindings: C,
  sheets: (a) => [
    {
      title: "DV-160, Attachment 2b(2)—Additional Minors",
      text: a.M1 !== "the minor" ? confidentialMinors(a).slice(4).map((p, i) => `${i + 5}. ${p.name}`).join("\n") : "",
    },
    {
      title: "DV-160, Attachment 5c(2)",
      text: a.M4.includes("other") ? a.M6.slice(4).map((r, i) => `${String.fromCharCode(101 + i)}. ${r.text} — where: ${r.location}`).join("\n") : "",
    },
  ],
  // "The address I want kept confidential is:" is printed inside the first line of the field.
  indents: { "Page2.TextField": 180 },
  after: ({ sheets, pages }) => [
    b("Page4.CheckBox2", () => sheets.some((s) => s.title === DV160_6A)),
    b("Page4.CheckBox2[1]", () => sheets.some((s) => s.title === DV160_6B)),
    b("Page5.CheckBox2", () => sheets.some((s) => s.title === DV160_8)),
    b("Page6.PagesAttached_no", () => (pages ? String(pages) : "")),
  ],
};

export const DV165: FormSpec = {
  id: "DV-165",
  file: "/forms/DV-165.pdf",
  root: "DV-165[0]",
  bindings: [
    b("Page1.Caption_sf.CourtInfo.CourtInfo_ft", (a) => courtCaption(a)),
    b("Page1.Caption_sf.CaseNumber.CaseNumber_ft", caseNo),
    ...[2, 3, 4, 5, 6].map((p) => b(`Page${p}.PxCaption.CaseNumber_ft`, caseNo)),
    b("Page1.Check.Ch1", () => true),
    b("Page1.Check.Ch1[1]", () => false),
    b("Page1.List1.Lia.TextField1", (a) => a.P1),
    b("Page1.List1.Lib.TextField2", (a) => a.R1),
    b("Page1.List2.item2.TextField3", (a) => requester(a)),
    b("Page4.List8.TextField1", (a) => a.R1),
  ],
};

export const DV170: FormSpec = {
  id: "DV-170",
  file: "/forms/DV-170.pdf",
  root: "DV-170[0]",
  bindings: [b("Page1.Caption_sf.CourtInfo_ft", (a) => courtCaption(a)), b("Page1.Caption_sf.TCCaseNumber_ft", caseNo)],
};

/** DV-175: cover sheet for later filings that carry the minor's information. Item 3 and the date are filled when used. */
export const DV175: FormSpec = {
  id: "DV-175",
  file: "/forms/DV-175.pdf",
  root: "DV-175[0]",
  bindings: [
    b("Page1.RightCaption.CourtInfo_ft", (a) => courtCaption(a)),
    b("Page1.RightCaption.CaseNumber_ft", caseNo),
    b("Page1.Item1.List1.LI1.T186", (a) => a.P1),
    b("Page1.Item1.List1.LI2.T186", (a) => a.R1),
    b("Page1.Item2.List2.LI1.LI1List1.LI1.income_cb", () => true),
    b("Page1.Item2.List2.LI1.LI1List1.LI2.income_cb", () => false),
    b("Page1.Item2.List2.LI1.LI1List1.LI2.LI2List1.LI1.T13", () => ""),
    b("Page1.Item2.List2.LI1.LI1List1.LI2.LI2List1.LI2.T13", () => ""),
    b("Page1.Item2.List2.LI2.LI2List1.LI1.T186", (a) => confidentialMinors(a)[0]?.name),
    b("Page1.Item2.List2.LI2.LI2List1.LI2.T186", (a) => confidentialMinors(a)[1]?.name),
    b("Page1.Item2.income_cb2", (a) => confidentialMinors(a).length > 2),
    b("Page1.Item3.income_cb1", () => false),
    b("Page1.Item3.TextField1", () => ""),
    b("Page1.Item3.income_cb3", () => false),
    b("Page1.Item3.TextField2", () => ""),
    b("Page1.Item4.SigDate", () => ""),
    b("Page1.Item4.T14", (a) => (a.S5 === "Y" ? a.L1 : a.P1)),
    b("Page1.Item4.income_cb4", (a) => a.S5 === "Y"),
  ],
  sheets: (a) => [
    { title: "DV-175, Attachment 2", text: confidentialMinors(a).slice(2).map((p, i) => `${i + 3}. ${p.name}`).join("\n") },
  ],
};

// ---------------------------------------------------------------- bring to the hearing

const D130: Binding[] = [
  b("Page1.CourtInfo_ft", (a) => courtCaption(a)),
  b("Page1.CaseNumber_ft", caseNo),
  ...[2, 5, 6, 7, 9, 10].map((p) => b(`Page${p}.Caption.CaseNumber_ft`, caseNo)),
  ...[3, 4, 8].map((p) => b(`Page${p}.CaseNumber_ft`, caseNo)),
  b("page11.CaseNumber_ft", caseNo),
  b("Page1.List1.Li1.TextFielditem1", (a) => twoLines(a.P1, 60)[0]),
  b("Page1.List1.Li1.TextFielditem1Cont", (a) => twoLines(a.P1, 60)[1]),
  b("Page1.List2.Li1.ParentRel", (a) => a.R1),
  b("Page1.List2.Li1.gender_cb", (a) => a.R5 === "M"),
  b("Page1.List2.Li1.gender_cb[1]", (a) => a.R5 === "F"),
  b("Page1.List2.Li1.gender_cb[2]", (a) => a.R5 === "X"),
  b("Page1.List2.Li1.race", (a) => a.R6),
  // Age as of the signing date; the hearing date isn't known yet.
  b("Page1.List2.Li1.age", (a) => respondentAge(a)),
  b("Page1.List2.Li1.dob", (a) => fmtDate(a.R3)),
  b("Page1.List2.Li1.TF2", (a) => a.R7.height),
  b("Page1.List2.Li1.TF3", (a) => a.R7.weight),
  b("Page1.List2.Li1.TF4", (a) => a.R7.hair),
  b("Page1.List2.Li1.TF5", (a) => a.R7.eyes),
  b("Page1.List2.Li1.TF8", (a) => relationshipPhrase(a)),
  b("Page1.List2.Li1.TF9", (a) => a.R14.street),
  b("Page1.List2.Li1.TF10", (a) => a.R14.city),
  b("Page1.List2.Li1.TF11", (a) => a.R14.state),
  b("Page1.List2.Li1.TF12", (a) => a.R14.zip),
  b("Page1.List3.Li1.FieldName_cb", (_a, d) => d.protectedPeople.length > 0),
  b("Page1.List3.Li1.AGHagueCert_cb", (_a, d) => d.protectedPeople.length > 4),
];
for (let i = 0; i < 4; i++) {
  const P = (d: Derived) => d.protectedPeople[i];
  D130.push(
    b(`Page1.List3.Li1.AdditionalProtectedPerson${i + 1}_ft`, (_a, d) => P(d)?.name),
    b(`Page1.List3.Li1.RelationshipToProtectedPerson_ft${i + 1}`, (_a, d) => P(d)?.relationship),
    b(`Page1.List3.Li1.Age_no${i + 1}`, (_a, d) => (P(d) ? personAge(P(d)!, d.asOf) : "")),
  );
}
export const DV130: FormSpec = {
  id: "DV-130",
  file: "/forms/DV-130.pdf",
  root: "DV-130[0]",
  bindings: D130,
  sheets: (_a, d) => [
    {
      title: "DV-130, Other Protected People",
      text: d.protectedPeople
        .slice(4)
        .map((p, i) => `${i + 5}. ${p.name} — ${p.relationship} — age ${personAge(p, d.asOf)}`)
        .join("\n"),
    },
  ],
};

export const DV150: FormSpec = {
  id: "DV-150",
  file: "/forms/DV-150.pdf",
  root: "DV-150[0]",
  bindings: [
    b("Page1.rightCaption.CourtInfo", (a) => courtCaption(a)),
    b("Page1.rightCaption.CaseNumber", caseNo),
    b("Page2.CaptionSub.CaseNumber", caseNo),
    ...[3, 4, 5].map((p) => b(`Page${p}.CaseNumber`, caseNo)),
    b("Page1.List1.Li1.ProtectedLawyerName", (a) => a.P1),
    b("Page1.List2.Li1.ProtectedLawyerName", (a) => a.R1),
  ],
};

// ---------------------------------------------------------------- keep for later

/** What the respondent is served with, beyond the box labels on DV-200 item 4. */
function otherServed(a: Answers): string {
  const custody = custodyRequested(a);
  return [
    "DV-120-INFO (blank)",
    "DV-250 (blank)",
    ...(custody ? ["DV-125 (blank)"] : []),
    ...(custody && a.K5 === "Y" ? ["DV-108", "DV-145"] : []),
    ...(a.orders.O28 ? ["DV-900"] : []),
    ...(a.R18 === "Y" ? ["DV-800 and DV-800-INFO (blank)"] : []),
    ...(confidentialityRequested(a) ? ["DV-165 and DV-170 (if granted)"] : []),
  ].join(", ");
}

export const DV200: FormSpec = {
  id: "DV-200",
  file: "/forms/DV-200.pdf",
  root: "DV-200[0]",
  bindings: [
    b("Page1.Stamp_court_case.CourtInfo_ft", (a) => courtCaption(a)),
    b("Page1.Stamp_court_case.CaseNumber_ft", caseNo),
    b("Page1.List1.Li1.TextField2", (a) => a.P1),
    b("Page1.List2.Li1.TextField2", (a) => a.R1),
    b("Page1.List4.Li1.item4a_cb", () => true),
    // The temporary order is served whether granted in full or in part.
    b("Page1.List4.Li2.item4b_cb", () => true),
    b("Page1.List4.Li3.item4c_cb", (a) => custodyRequested(a)),
    b("Page1.List4.Li4.item4d_cb", (a) => financesRequested(a)),
    b("Page1.List4.Li5.item4e_cb", () => false),
    b("Page1.List4.Li8.item4h_cb", () => false),
    b("Page1.List4.Li9.item4h_cb", () => true),
    b("Page1.List4.Li9.OtherSpecify_tf", (a) => ({ long: otherServed(a), sheet: "DV-200, Item 4i" })),
  ],
};

export const DV250: FormSpec = {
  id: "DV-250",
  file: "/forms/DV-250.pdf",
  root: "DV-250[0]",
  bindings: [
    b("Page1.Stamp_court_case.CourtInfo_ft", (a) => courtCaption(a)),
    b("Page1.Stamp_court_case.CaseNumber_ft", caseNo),
    b("Page1.T40", (a) => a.P1),
    b("Page1.T145", (a) => a.R1),
    b("Page1.TRO_cb", () => false),
    b("Page1.TRO_cb[1]", () => false),
    b("Page1.TRO_cb[2]", (a) => financesRequested(a)),
    b("Page1.TRO_cb[3]", () => false),
    b("Page1.TRO_cb[4]", () => false),
    b("Page1.TRO_cb[5]", () => false),
    b("Page1.#field[17]", () => ""),
    b("Page1.ParentRel[1]", (a) => a.R1),
    b("Page1.T72[1]", (a) => a.R14.street),
    b("Page1.T79[1]", (a) => a.R14.city),
    b("Page1.T78[2]", (a) => a.R14.state),
    b("Page1.T77[1]", (a) => a.R14.zip),
  ],
};

/** DV-901 is confidential: it goes only to the phone company, with the signed DV-900. */
export const DV901: FormSpec = {
  id: "DV-901",
  file: "/forms/DV-901.pdf",
  root: "topmostSubform[0]",
  bindings: [
    b("Page1.CaseNumber_ft", caseNo),
    b("Page1.YourName", (a) => a.P1),
    b("Page1.T242[4]", (a) => a.W1),
    b("Page1.ChildStreet[3]", (a) => a.W2 || a.R1),
    b("Page1.T242", (a) => a.W4 || a.P1),
    b("Page1.ChildStreet", (a) => a.W5 || a.P7),
    b("Page1.ChildStreet[1]", (a) => a.W6),
    b("Page1.ChildStreet[2]", (a) => a.W7 || a.P8.email),
    b("Page1.OtherSpecify_tf", (a) => oneLine(a.W8.street ? a.W8 : a.S5 === "Y" ? a.L4 : a.P6)),
  ],
  // "Mailing address:" is printed inside the first line of the field.
  indents: { "Page1.OtherSpecify_tf": 78 },
};

/** DV-210: only if the judge allows service by newspaper or posting. */
export const DV210: FormSpec = {
  id: "DV-210",
  file: "/forms/DV-210.pdf",
  root: "DV-210[0]",
  bindings: [b("Page1.Item1.T233", (a) => a.P1), b("Page1.Item2.T238", (a) => a.R1)],
};
