/**
 * FL-150 Income and Expense Declaration (Rev. Sept 2024). Mirrors docs/field-map, tab "FL-150".
 * Used for child support (O24), spousal support (O25) and lawyer's fees (O26).
 * FL-155 (simplified) is not offered: FL-150 is accepted in every case.
 */
import type { Binding, FormSpec } from "../engine";
import { b, caseNo, contact } from "../helpers";
import { courthouseFor } from "../../courthouses";
import { ageFrom, fmtDate, money, oneLine, personAge, petitionerAge, under18, type Derived } from "../../derive";
import { EXPENSE_LINES } from "../../types";
import type { Answers, IncomeType, RosterPerson } from "../../types";

/** "1,234.50" → 1234.5 (blank or junk → 0). */
export const num = (v: string | undefined) => {
  const n = Number(String(v ?? "").replace(/[$,\s]/g, ""));
  return Number.isFinite(n) ? n : 0;
};
const sum = (xs: (string | undefined)[]) => xs.reduce((t, x) => t + num(x), 0);
const amt = (v: string | undefined) => (v && v.trim() ? money(v) : "");

const inc = (a: Answers, t: IncomeType) => (a.F2.includes(t) ? a.F3[t] : undefined);
const childSupport = (a: Answers) => !!a.orders.O24;
const fees = (a: Answers) => !!a.orders.O26 && a.S5 === "Y";

/** Item 12: everyone who lives with you. */
export const household = (a: Answers): RosterPerson[] => a.roster.filter((p) => p.livesWithYou === "Y" && p.name.trim());
/** Item 19c(2): your children under 18 living with you who are not the respondent's. */
const otherKids = (a: Answers) => household(a).filter((p) => p.sharedChild !== "Y" && under18(p, a.G1) && /child|son|daughter/i.test(p.relationship));

const installments = (a: Answers) => sum(a.F12.map((d) => d.amount));
const expenseTotal = (a: Answers) =>
  num(a.F11.rentOrMortgage) + sum(EXPENSE_LINES.map(([k]) => a.F11.lines[k])) + installments(a) + num(a.F11.other);

const F: Binding[] = [];
const add = (...xs: Binding[]) => F.push(...xs);
const H = "Page1.StdP1Header_sf";

// Caption
add(
  b(`${H}.AttyInfo.AttyName_ft`, (a) => (a.S5 === "Y" ? a.L1 : a.P1)),
  b(`${H}.AttyInfo.BarNo_ft`, (a) => (a.S5 === "Y" ? a.L2 : "")),
  b(`${H}.AttyInfo.AttyFirm_ft`, (a) => (a.S5 === "Y" ? a.L3 : "")),
  b(`${H}.AttyInfo.AttyStreet_ft`, contact.street),
  b(`${H}.AttyInfo.AttyCity_ft`, contact.city),
  b(`${H}.AttyInfo.AttyState_ft`, contact.state),
  b(`${H}.AttyInfo.AttyZip_ft`, contact.zip),
  b(`${H}.AttyInfo.Phone_ft`, contact.phone),
  b(`${H}.AttyInfo.Fax_ft`, contact.fax),
  b(`${H}.AttyInfo.Email_ft`, contact.email),
  b(`${H}.AttyInfo.AttyFor_ft`, (a) => (a.S5 === "Y" ? a.P1 : "Self-represented")),
  b(`${H}.CourtInfo.CrtCounty_ft`, (a) => a.S1),
  b(`${H}.CourtInfo.Street_ft`, (a) => courthouseFor(a.S1, a.S2)?.street),
  b(`${H}.CourtInfo.MailingAdd_ft`, (a) => courthouseFor(a.S1, a.S2)?.street),
  b(`${H}.CourtInfo.CityZip_ft`, (a) => {
    const c = courthouseFor(a.S1, a.S2);
    return c ? `${c.city} ${c.zip}` : "";
  }),
  b(`${H}.CourtInfo.Branch_ft`, (a) => courthouseFor(a.S1, a.S2)?.name),
  b(`${H}.CaseNumber.CaseNumber_ft`, caseNo),
);
const parties = (prefix: string) => [
  b(`${prefix}.TitlePartyName.Party1_ft`, (a: Answers) => a.P1),
  b(`${prefix}.TitlePartyName.Party2_ft`, (a: Answers) => a.R1),
  b(`${prefix}.TitlePartyName.Party3_ft`, (a: Answers) => (a.PR13.has === "Y" ? a.PR13.name : "")),
];
add(...parties(H));
for (const p of [2, 3, 4]) add(...parties(`Page${p}.PxCaption_sf`), b(`Page${p}.PxCaption_sf.CaseNumber.CaseNumber_ft`, caseNo));

// 1 · employment
const job = (a: Answers) => a.F4;
add(
  b("Page1.List1.Li1.Employer_tf", (a) => job(a).employer),
  b("Page1.List1.Li2.Employer_address_tf", (a) => job(a).employerAddress),
  b("Page1.List1.Li3.Employer_phone\\.ft", (a) => job(a).employerPhone),
  b("Page1.List1.Li4.Party_occupation_tf", (a) => job(a).occupation),
  b("Page1.List1.Li5.Date_started_job_tf", (a) => fmtDate(job(a).startDate)),
  b("Page1.List1.Li6.FillText1", (a) => (a.F4.employed === "N" ? fmtDate(job(a).endDate) : "")),
  b("Page1.List1.Li7.hours_tf", (a) => job(a).hoursPerWeek),
  b("Page1.List1.Li8.gross_tf", (a) => amt(job(a).pay)),
  b("Page1.List1.Li8.Gross_cb", (a) => !!job(a).pay && job(a).payPeriod === "month"),
  b("Page1.List1.Li8.Gross_cb[1]", (a) => !!job(a).pay && job(a).payPeriod === "week"),
  b("Page1.List1.Li8.Gross_cb[2]", (a) => !!job(a).pay && job(a).payPeriod === "hour"),
);

// 2 · age and education
add(
  b("Page1.List2.Li1.FillText1", (a) => petitionerAge(a)),
  b("Page1.List2.Li2.HSchl_cb", (a) => a.F5.highSchool === "Y"),
  b("Page1.List2.Li2.HSchl_cb[1]", (a) => a.F5.highSchool === "N"),
  b("Page1.List2.Li2.FillText1", (a) => (a.F5.highSchool === "N" ? a.F5.highestGrade : "")),
  b("Page1.List2.Li3.FillText1", (a) => a.F5.collegeYears),
  b("Page1.List2.Li3.RB2Choices", (a) => !!a.F5.collegeDegrees.trim()),
  b("Page1.List2.Li3.FillText109", (a) => a.F5.collegeDegrees),
  b("Page1.List2.Li4.FillText1", (a) => a.F5.gradYears),
  b("Page1.List2.Li4.RB2Choices", (a) => !!a.F5.gradDegrees.trim()),
  b("Page1.List2.Li4.FillText109", (a) => a.F5.gradDegrees),
  b("Page1.List2.Li5.RB2Choices", (a) => !!a.F5.licenses.trim()),
  b("Page1.List2.Li5.FillText10", (a) => a.F5.licenses),
  b("Page1.List2.Li5.RB2Choices[1]", (a) => !!a.F5.vocational.trim()),
  b("Page1.List2.Li5.FillText109", (a) => a.F5.vocational),
);

// 3 · taxes
const ca = (a: Answers) => /^(ca|california)$/i.test(a.F6.state.trim());
add(
  b("Page1.List3.Li1.RB2Choices", (a) => !!a.F6.lastYearFiled.trim()),
  b("Page1.List3.Li1.FillText109", (a) => a.F6.lastYearFiled),
  b("Page1.List3.Li2.Tax_cb1", (a) => a.F6.status === "single"),
  b("Page1.List3.Li2.Tax_cb2", (a) => a.F6.status === "head of household"),
  b("Page1.List3.Li2.Tax_cb3", (a) => a.F6.status === "married filing separately"),
  b("Page1.List3.Li2.RB2Choices", (a) => a.F6.status === "married filing jointly"),
  b("Page1.List3.Li2.FillText109", (a) => (a.F6.status === "married filing jointly" ? a.F6.jointFilerName : "")),
  b("Page1.List3.Li3.TaxSt_cb", (a) => !!a.F6.lastYearFiled.trim() && ca(a)),
  b("Page1.List3.Li3.TaxSt_CB", (a) => !!a.F6.state.trim() && !ca(a)),
  b("Page1.List3.Li3.FillText109", (a) => (a.F6.state.trim() && !ca(a) ? a.F6.state : "")),
  b("Page1.List3.Li4.FillText1", (a) => a.F6.exemptions),
);

// 4 · the other party's income; signature
add(
  b("Page1.List4.Li1.FillTextincm", (a) => amt(a.F14.amount)),
  b("Page1.List4.Li1.FillText1", (a) => (a.F14.basis ? { long: a.F14.basis, sheet: "FL-150, Item 4" } : "")),
  b("Page1.Signdate", (a) => fmtDate(a.G1)),
  b("Page1.FillText56", (a) => a.P1),
);

// 5–6 · income
type Row = [IncomeType, string, string, string?];
const INCOME_ROWS: Row[] = [
  ["wages", "Page2.List5.Li1", "TextField7"],
  ["overtime", "Page2.List5.Li2", "TextField8"],
  ["commissions or bonuses", "Page2.List5.Li3", "TextField9"],
  ["public assistance", "Page2.List5.Li4", "TextField10"],
  ["spousal support", "Page2.List5.Li5", "TextField11"],
  ["partner support", "Page2.List5.Li6", "TextField12"],
  ["pension", "Page2.List5.Li7", "TextField13"],
  ["Social Security", "Page2.List5.Li8", "TextField14"],
  ["disability", "Page2.List5.Li9", "TextField15"],
  ["unemployment", "Page2.List5.Li10", "TextField16"],
  ["workers' comp", "Page2.List5.Li11", "TextField17"],
  ["other", "Page2.List5.Li12", "TextField18", "FillText2"],
  ["interest or dividends", "Page2.List6.Li1", "TextField23"],
  ["rental", "Page2.List6.L2", "TextField22"],
  ["trust", "Page2.List6.L3", "TextField21"],
  ["other investment", "Page2.List6.L4", "TextField20", "FillText2"],
];
for (const [t, row, avg, last = "FillText1"] of INCOME_ROWS) {
  add(b(`${row}.${last}`, (a) => amt(inc(a, t)?.lastMonth)), b(`${row}.${avg}`, (a) => amt(inc(a, t)?.average)));
  if (last === "FillText2") add(b(`${row}.FillText1`, (a) => inc(a, t)?.describe ?? ""));
}
add(
  b("Page2.List5.Li4.CBChoice1_cb", (a) => a.F2.includes("public assistance") || (childSupport(a) && a.O24status.includes("TANF/CalWORKs"))),
  b("Page2.List5.Li5.CBChoice1_cb", (a) => inc(a, "spousal support")?.from === "this"),
  b("Page2.List5.Li5.CBChoice1_cb2", (a) => inc(a, "spousal support")?.from === "different"),
  b("Page2.List5.Li5.CBChoice1_cb3", (a) => !!inc(a, "spousal support")?.taxable),
  b("Page2.List5.Li6.CBChoice1_cb", (a) => inc(a, "partner support")?.from === "this"),
  b("Page2.List5.Li6.CBChoice1_cb2", (a) => inc(a, "partner support")?.from === "different"),
  b("Page2.List5.Li9.CBChoice1_cb", (a) => !!inc(a, "disability")?.kinds?.includes("Social Security")),
  b("Page2.List5.Li9.CBChoice1_cb1", (a) => !!inc(a, "disability")?.kinds?.includes("SDI")),
  b("Page2.List5.Li9.CBChoice1_cb2", (a) => !!inc(a, "disability")?.kinds?.includes("private insurance")),
);

// 7 · self-employment; 8–9 · extra income and changes
const self = (a: Answers) => a.F1 === "Y";
add(
  b("Page2.List7.L1.FillTxt1", (a) => (self(a) ? amt(a.F7.lastMonth) : "")),
  b("Page2.List7.L1.TextField", (a) => (self(a) ? amt(a.F7.average) : "")),
  b("Page2.List7.L1.CBChoice1_cb", (a) => self(a) && a.F7.role === "owner"),
  b("Page2.List7.L1.CBChoice1_cb1", (a) => self(a) && a.F7.role === "partner"),
  b("Page2.List7.L1.RB2Choices", (a) => self(a) && a.F7.role === "other"),
  b("Page2.List7.L1.FillText109", (a) => (self(a) && a.F7.role === "other" ? a.F7.roleOther : "")),
  b("Page2.List7.L1.FillText1", (a) => (self(a) ? a.F7.years : "")),
  b("Page2.List7.L1.FillText2", (a) => (self(a) ? a.F7.name : "")),
  b("Page2.List7.L1.FillText3", (a) => (self(a) ? a.F7.type : "")),
  b("Page2.List8.Li1.CheckBox19", (a) => !!a.F8.oneTime.trim()),
  b("Page2.List8.Li1.TextField6", (a) => (a.F8.oneTime.trim() ? { long: a.F8.oneTime, sheet: "FL-150, Item 8" } : "")),
  b("Page2.List9.L1.CheckBox1", (a) => !!a.F8.change.trim()),
  b("Page2.List9.L1.TextField6", (a) => (a.F8.change.trim() ? { long: a.F8.change, sheet: "FL-150, Item 9" } : "")),
);

// 10 · deductions; 11 · assets
add(
  b("Page2.List10.L1.FillText1", (a) => amt(a.F9.unionDues)),
  b("Page2.List10.L2.FillText1", (a) => amt(a.F9.retirement)),
  b("Page2.List10.L3.FillText1", (a) => amt(a.F9.healthInsurance)),
  b("Page2.List10.L4.FillText1", (a) => amt(a.F9.otherChildSupport)),
  b("Page2.List10.L5.CBChoice1_cb", (a) => !!a.F9.spousalSupport && a.F9.spousalTaxDeductible),
  b("Page2.List10.L5.FillText1", (a) => amt(a.F9.spousalSupport)),
  b("Page2.List10.L6.FillText1", (a) => amt(a.F9.partnerSupport)),
  b("Page2.List10.L7.FillText1", (a) => amt(a.F9.jobExpenses)),
  b("Page2.List11.L1.FillText1", (a) => amt(a.F10.cash)),
  b("Page2.List11.L2.FillText1", (a) => amt(a.F10.stocks)),
  b("Page2.List11.L3.realcb", (a) => a.F10.real),
  b("Page2.List11.L3.persncb", (a) => a.F10.personal),
  b("Page2.List11.L3.FillText1", (a) => amt(a.F10.property)),
);

// 12 · people living with me (5 rows)
(
  [
    ["L1", "TextField1", "TextField2", "TextField3", "item12a_cb"],
    ["L2", "TextField", "TextField1", "TextField2", "People2_cb"],
    ["L3", "TextField", "TextField1", "TextField6", "People3_cb"],
    ["L4", "TextField", "TextField1", "TextField6", "People4_cb"],
    ["L5", "TextField", "TextField1", "TextField6", "People5_cb"],
  ] as const
).forEach(([row, age, rel, income, pays], i) => {
  const P = (a: Answers) => household(a)[i];
  add(
    b(`Page3.List12.${row}.FillText1`, (a) => P(a)?.name),
    b(`Page3.List12.${row}.${age}`, (a) => (P(a) ? personAge(P(a)!, a.G1) : "")),
    b(`Page3.List12.${row}.${rel}`, (a) => P(a)?.relationship),
    b(`Page3.List12.${row}.${income}`, (a) => amt(P(a)?.income)),
    b(`Page3.List12.${row}.${pays}`, (a) => P(a)?.paysExpenses === "Y"),
    // Children default to "No" unless the person said otherwise.
    b(`Page3.List12.${row}.${pays}[1]`, (a) => {
      const p = P(a);
      return !!p && (p.paysExpenses === "N" || (!p.paysExpenses && under18(p, a.G1)));
    }),
  );
});

// 13 · monthly expenses
add(
  b("Page3.List13.MonthEx_cb", (a) => a.F11.basis === "estimated"),
  b("Page3.List13.MonthEx_cb[1]", (a) => a.F11.basis === "actual"),
  b("Page3.List13.MonthEx_cb[2]", (a) => a.F11.basis === "proposed"),
  b("Page3.List13.Li1.List.L1.CBChoice1_cb", (a) => a.F11.housing === "rent"),
  b("Page3.List13.Li1.List.L1.CBChoice1_cb1", (a) => a.F11.housing === "mortgage"),
  b("Page3.List13.Li1.List.L1.EXPN", (a) => amt(a.F11.rentOrMortgage)),
  b("Page3.List13.Li1.List.L1.List.L1.MortPrin", (a) => (a.F11.housing === "mortgage" ? amt(a.F11.mortgagePrincipal) : "")),
  b("Page3.List13.Li1.List.L1.List.L2.MortInt", (a) => (a.F11.housing === "mortgage" ? amt(a.F11.mortgageInterest) : "")),
  ...EXPENSE_LINES.map(([k], i) => b(i < 3 ? `Page3.List13.Li1.List.L${i + 2}.EXPN` : `Page3.List13.Li${i - 1}.EXPN`, (a) => amt(a.F11.lines[k]))),
  b("Page3.List13.Li16.EXPN", (a) => (a.F12.length ? money(String(installments(a))) : "")),
  b("Page3.List13.Li17.FillText1", (a) => a.F11.otherDescribe),
  b("Page3.List13.Li17.EXPN", (a) => amt(a.F11.other)),
  b("Page3.List13.Li18.TOTAL", (a) => (expenseTotal(a) ? money(String(expenseTotal(a))) : "")),
  b("Page3.List13.Li19.EXPNother", (a) => amt(a.F11.paidByOthers)),
);

// 14 · installment debts (6 rows)
for (let i = 0; i < 6; i++) {
  const D = (a: Answers) => a.F12[i];
  add(
    b(`Page3.List14.L1.TextField${2 * i + 1}`, (a) => D(a)?.paidTo),
    b(`Page3.List14.L1.TextField${2 * i + 2}`, (a) => D(a)?.for),
    b(`Page3.List14.L1.FillText${2 * i + 1}`, (a) => amt(D(a)?.amount)),
    b(`Page3.List14.L1.FillText${2 * i + 2}`, (a) => amt(D(a)?.balance)),
    b(`Page3.List14.L1.DateField${i + 1}`, (a) => fmtDate(D(a)?.lastPayment)),
  );
}

// 15 · lawyer's fees (only with a lawyer)
add(
  b("Page3.List15.L1.FillText1", (a) => (fees(a) ? amt(a.F13.paid) : "")),
  b("Page3.List15.L2.FillText1", (a) => (fees(a) ? a.F13.source : "")),
  b("Page3.List15.L3.FillText1", (a) => (fees(a) ? amt(a.F13.owed) : "")),
  b("Page3.List15.L4.FillText1", (a) => (fees(a) ? amt(a.L6) : "")),
  b("Page3.Signsub.FillText1140", (a) => (fees(a) ? fmtDate(a.G1) : "")),
  b("Page3.Signsub.FillText56", (a) => (fees(a) ? a.L1 : "")),
);

// 16–20 · child support information (only when child support is requested)
const cs = (v: (a: Answers, d: Derived) => string | boolean) => (a: Answers, d: Derived) => (childSupport(a) ? v(a, d) : "");
add(
  b("Page4.List16.L1.TextField6", cs((_a, d) => (d.custodyKids.length ? String(d.custodyKids.length) : ""))),
  b("Page4.List16.L2.TextField", cs((a) => a.F16.percentMe)),
  b("Page4.List16.L2.TextField1", cs((a) => a.F16.percentRespondent)),
  b("Page4.List16.L2.TextField6", cs((a) => a.F16.schedule)),
  b("Page4.List17.L1.ChildHC_cb", (a) => childSupport(a) && a.F17.available === "Y"),
  b("Page4.List17.L1.ChildHC_cb[1]", (a) => childSupport(a) && a.F17.available === "N"),
  b("Page4.List17.L2.FillText1", cs((a) => (a.F17.available === "Y" ? a.F17.company : ""))),
  b("Page4.List17.L3.TextField6", cs((a) => (a.F17.available === "Y" ? oneLine(a.F17.address) : ""))),
  b("Page4.List17.L4.FillText1", cs((a) => (a.F17.available === "Y" ? amt(a.F17.cost) : ""))),
  b("Page4.List18.L1.FillText1", cs((a) => amt(a.F18.childcare))),
  b("Page4.List18.L2.FillText1", cs((a) => amt(a.F18.health))),
  b("Page4.List18.L3.FillText1", cs((a) => amt(a.F18.travel))),
  b("Page4.List18.L4.FillText1", cs((a) => a.F18.specialNeedsDescribe)),
  b("Page4.List18.L4.FillText2", cs((a) => amt(a.F18.specialNeeds))),
  b("Page4.List19.L1.FillText1", cs((a) => amt(a.F19.healthAmount))),
  b("Page4.List19.L1.TextField24", cs((a) => a.F19.healthMonths)),
  b("Page4.List19.L2.FillText1", cs((a) => amt(a.F19.lossesAmount))),
  b("Page4.List19.L2.TextField25", cs((a) => a.F19.lossesMonths)),
  b("Page4.List19.L3.List.L1.FillText1", cs((a) => amt(a.F19.otherChildrenAmount))),
  b("Page4.List19.L3.List.L1.TextField26", cs((a) => a.F19.otherChildrenMonths)),
  b("Page4.List19.L3.List.L2.TextField6", (a) =>
    childSupport(a) && num(a.F19.otherChildrenAmount)
      ? otherKids(a)
          .map((p) => `${p.name} (${p.dob ? ageFrom(p.dob, a.G1) : p.age})`)
          .join(", ")
      : "",
  ),
  b("Page4.List19.L3.List.L3.FillText1", cs((a) => amt(a.F19.supportReceived))),
  b("Page4.List19.L3.TextField6", (a) => (childSupport(a) && a.F19.why.trim() ? { long: a.F19.why, sheet: "FL-150, Item 19" } : "")),
  b("Page4.List20.L1.TextField6", (a) => (childSupport(a) && a.F20.trim() ? { long: a.F20, sheet: "FL-150, Item 20" } : "")),
);

export const FL150: FormSpec = {
  id: "FL-150",
  file: "/forms/FL-150.pdf",
  root: "FL-150[0]",
  signatures: [
    { page: 1, x: 365, top: 711, who: "petitioner" },
    { page: 3, x: 365, top: 710, who: "lawyer", when: (a) => fees(a) },
  ],
  bindings: F,
  sheets: (a) => [
    {
      title: "FL-150, Item 12 — Other People Living in My Home",
      text: household(a)
        .slice(5)
        .map(
          (p, i) =>
            `${String.fromCharCode(102 + i)}. ${p.name} — age ${personAge(p, a.G1)} — ${p.relationship} — gross monthly income: ${amt(p.income) || "0.00"} — pays some household expenses: ${p.paysExpenses === "Y" ? "yes" : "no"}`,
        )
        .join("\n"),
    },
    {
      title: "FL-150, Item 14 — Installment Payments and Debts",
      text: a.F12.slice(6)
        .map((d, i) => `${i + 7}. Paid to: ${d.paidTo} — for: ${d.for} — amount: ${amt(d.amount)} — balance: ${amt(d.balance)} — last payment: ${fmtDate(d.lastPayment)}`)
        .join("\n"),
    },
    { title: "FL-150, Question 10g", text: num(a.F9.jobExpenses) && a.F9.jobExpensesWhy.trim() ? a.F9.jobExpensesWhy : "" },
  ],
  after: ({ pages }) => [b("Page1.FillTextpage", () => (pages ? String(pages) : ""))],
};
