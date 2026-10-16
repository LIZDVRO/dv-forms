/**
 * Turns the wizard's in-memory answers into one statistics record:
 * a session row plus incident, people and step rows (DVRO_Data_Collection_Spec.md).
 *
 * Never included: names, contact details, street addresses, ID and case
 * numbers, plates, uploads, signatures, or free-text answers other than the
 * raw fields the spec keeps for coding later (race, gun items, occupation,
 * employers, A7 "other").
 */
import { ageFrom, custodyRequested, financesRequested } from "@/wizard/derive";
import type { Answers, IncomeType, YN, YND } from "@/wizard/types";

export type Trigger = "finish" | "left_page" | "quick_exit";

export interface StepStat {
  step: string;
  seq: number;
  seconds: number;
  visits: number;
  edits: number;
  errors: number;
}

export interface DeviceInfo {
  device_type?: "phone" | "tablet" | "desktop";
  os?: string;
  browser?: string;
  screen_w?: number;
  screen_h?: number;
  browser_language?: string;
  connection_type?: "wifi" | "cellular" | "unknown";
  referrer_domain?: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
}

export interface StatsMeta {
  version: string;
  /** User Agreement version the person accepted */
  agreementVersion: string;
  /** ms since epoch */
  startedAt: number;
  now: number;
  trigger: Trigger;
  completed: boolean;
  lastStep: string;
  quickExitStep?: string;
  steps: StepStat[];
  /** Packet form ids, e.g. "DV-100", "DV-105(A)" */
  forms: string[];
  zipDownloaded: boolean;
  instructionsPrinted: boolean;
  device: DeviceInfo;
}

export interface StatsRecord {
  session: Record<string, unknown>;
  incidents: Record<string, unknown>[];
  people: Record<string, unknown>[];
  steps: Record<string, unknown>[];
  /** Honeypot: always empty from the real page. */
  website: string;
}

// ------------------------------------------------------------------ helpers

const s = (v: string | undefined | null) => (v ?? "").trim();
const txt = (v: string | undefined | null) => s(v) || null;

/** "$1,234.50" → 1234.5; blank or junk → null. */
export function num(v: string | undefined | null): number | null {
  const t = s(v).replace(/[$,\s]/g, "");
  if (!t) return null;
  const n = Number(t);
  return Number.isFinite(n) ? n : null;
}

const int = (v: string | undefined | null) => {
  const n = num(v);
  return n === null ? null : Math.round(n);
};

/** Nearest $100. */
const dollars = (n: number | null) => (n === null || n < 0 ? null : Math.round(n / 100) * 100);

const sum = (xs: (number | null)[]) => {
  const vals = xs.filter((x): x is number => x !== null);
  return vals.length ? vals.reduce((a, b) => a + b, 0) : null;
};

const yesNo = (v: YN | YND | undefined) => (v === "Y" ? true : v === "N" ? false : null);
const ynd = (v: YND | undefined) => (v ? v : null);

const isIso = (v: string) => /^\d{4}-\d{2}-\d{2}$/.test(v);

/** Local calendar date (YYYY-MM-DD) of a timestamp. */
export function localDate(ms: number): string {
  const d = new Date(ms);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

/** Whole days from ISO date a to ISO date b. */
function daysBetween(a: string, b: string): number | null {
  if (!isIso(a) || !isIso(b)) return null;
  return Math.round((Date.parse(`${b}T00:00:00Z`) - Date.parse(`${a}T00:00:00Z`)) / 86_400_000);
}

const MONTHS = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];

/**
 * An incident date as typed. The wizard's date picker gives an exact ISO date
 * (estimated = null: the picker can't say whether it was a guess). Text such
 * as "around March 2025" or "2024" is parsed to its best date, estimated = true.
 */
export function parseIncidentDate(raw: string, sessionDate: string): { date: string | null; estimated: boolean | null } {
  const v = s(raw);
  if (!v) return { date: null, estimated: null };
  if (isIso(v)) return { date: v, estimated: null };
  const p = (n: number) => String(n).padStart(2, "0");
  let m = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(v);
  if (m) return { date: `${m[3]}-${p(+m[1])}-${p(+m[2])}`, estimated: false };
  m = /^(\d{4})-(\d{2})$/.exec(v);
  if (m) return { date: `${m[1]}-${m[2]}-15`, estimated: true };
  const lower = v.toLowerCase();
  const mi = MONTHS.findIndex((mo) => new RegExp(`\\b${mo}`).test(lower));
  const year = /\b(19|20)\d{2}\b/.exec(lower)?.[0];
  if (mi >= 0) {
    let y = year ? +year : +sessionDate.slice(0, 4);
    // "March" with no year, typed in February: last March.
    if (!year && isIso(sessionDate) && mi + 1 > +sessionDate.slice(5, 7)) y -= 1;
    return { date: `${y}-${p(mi + 1)}-15`, estimated: true };
  }
  if (year) return { date: `${year}-07-01`, estimated: true };
  return { date: null, estimated: true };
}

/** 5'10", 5 ft 10 in, 5-10, 70 → inches. */
export function heightInches(raw: string): number | null {
  const v = s(raw).toLowerCase();
  if (!v) return null;
  const m = /^(\d)\s*(?:'|’|ft|feet|foot|-|\s)\s*(\d{1,2})?/.exec(v);
  if (m) return +m[1] * 12 + (m[2] ? +m[2] : 0);
  const n = num(v.replace(/(in|inches|")$/, ""));
  return n !== null && n >= 20 && n <= 108 ? Math.round(n) : null;
}

const zip5 = (v: string) => /\b(\d{5})(?:-\d{4})?\b/.exec(s(v))?.[1] ?? null;

/** The packet's form id as a column name: "DV-105(A)" → form_dv105a. */
export const formColumn = (id: string) => `form_${id.toLowerCase().replace(/[^a-z0-9]/g, "")}`;

const INCOME_COLUMN: Record<IncomeType, string> = {
  wages: "inc_wages",
  overtime: "inc_overtime",
  "commissions or bonuses": "inc_commissions",
  "public assistance": "inc_public_assist",
  "spousal support": "inc_spousal_support",
  "partner support": "inc_partner_support",
  pension: "inc_pension",
  "Social Security": "inc_social_security",
  disability: "inc_disability",
  unemployment: "inc_unemployment",
  "workers' comp": "inc_workers_comp",
  other: "inc_other",
  "interest or dividends": "inc_interest",
  rental: "inc_rental",
  trust: "inc_trust",
  "other investment": "inc_other_invest",
};

/** Booleans for each option, only when the question was asked. */
function flags(asked: boolean, chosen: string[], map: Record<string, string>): Record<string, boolean | null> {
  return Object.fromEntries(Object.entries(map).map(([value, col]) => [col, asked ? chosen.includes(value) : null]));
}

// ------------------------------------------------------------------ record

export function buildStatsRecord(a: Answers, m: StatsMeta): StatsRecord {
  const started = new Date(m.startedAt);
  const sessionDate = localDate(m.startedAt);
  const fin = financesRequested(a);
  const custody = custodyRequested(a);
  const abduction = custody && a.K5 === "Y";
  const sheriff = a.V1 === "sheriff";
  const lawyer = a.S5 === "Y";

  // Incidents
  const cards = a.cards.filter((c) => s(c.A6) || s(c.A1) || c.A3kind || c.A4 || c.A5);
  const incidents = cards.map((c, i) => {
    const d = parseIncidentDate(c.A1, sessionDate);
    const witnessNames = s(c.A2names)
      .split(/[,;\n]|\band\b/)
      .map((x) => x.trim())
      .filter(Boolean);
    return {
      card: i + 1,
      incident_date: d.date,
      date_estimated: d.estimated,
      days_before_session: d.date ? daysBetween(d.date, sessionDate) : null,
      witnesses: ynd(c.A2),
      witness_count: c.A2 === "Y" ? witnessNames.length || null : c.A2 === "N" ? 0 : null,
      weapon: c.A3kind || (c.A3 === "N" ? "none" : null),
      harm: yesNo(c.A4),
      police: ynd(c.A5),
      epo: c.A5 === "Y" ? ynd(c.A8) : null,
      epo_protects: c.A8 === "Y" ? ({ you: "petitioner", respondent: "respondent" } as const)[c.A8protects as "you"] ?? null : null,
      frequency: c.A7 || null,
      frequency_other_raw: c.A7 === "other" ? txt(c.A7other) : null,
      narrative_chars: s(c.A6).length,
    };
  });
  const dates = incidents.map((x) => x.incident_date).filter((x): x is string => !!x).sort();
  const lastIncident = dates.at(-1) ?? null;

  // People
  const named = a.roster.filter((p) => s(p.name));
  const ageOf = (dob: string, age: string) => (dob ? int(ageFrom(dob, sessionDate)) : int(age));
  const confidentialIds = a.PR14 === "Y" ? a.M2 : [];
  const people = named.map((p, i) => ({
    person: i + 1,
    age: ageOf(p.dob, p.age),
    gender: p.gender || null,
    race_raw: txt(p.race),
    relationship: txt(p.relationship),
    lives_with_petitioner: yesNo(p.livesWithYou),
    shared_child: yesNo(p.sharedChild),
    protected: yesNo(p.protect),
    income: p.livesWithYou === "Y" ? dollars(num(p.income)) : null,
    pays_expenses: p.livesWithYou === "Y" ? yesNo(p.paysExpenses) : null,
    confidential: a.PR14 === "Y" ? confidentialIds.includes(p.id) : null,
  }));
  const household = people.filter((p) => p.lives_with_petitioner);

  // Petitioner
  const pAge = a.P2 ? int(ageFrom(a.P2, sessionDate)) : int(a.P3);
  const mailStreet = s(a.P6.street);
  const mailType = /\bp\.?\s*o\.?\s*box\b/i.test(mailStreet)
    ? "po_box"
    : /safe\s*at\s*home/i.test(mailStreet)
      ? "safe_at_home"
      : mailStreet
        ? "street"
        : lawyer
          ? "lawyer"
          : null;
  const interpreterLanguage = a.I1 === "Y" ? (a.I1language === "other" ? s(a.I1other) : s(a.I1language)) : "";
  const pLanguage = s(a.P9language) || interpreterLanguage || (a.P9 === "Y" ? "English" : "");
  const witnessLanguages = a.I3.filter((w) => s(w.name) || s(w.otherLanguage)).map((w) =>
    w.language === "same" ? pLanguage : s(w.otherLanguage),
  );

  // Finances (FL-150 only)
  const income: Record<string, number | null> = {};
  let incTotal: number | null = null;
  let incLast: number | null = null;
  if (fin) {
    for (const t of a.F2) {
      const amt = a.F3[t];
      income[INCOME_COLUMN[t]] = dollars(num(amt?.average));
      incTotal = sum([incTotal, num(amt?.average)]);
      incLast = sum([incLast, num(amt?.lastMonth)]);
    }
  }
  const F9 = a.F9;
  const deductions = sum([F9.unionDues, F9.retirement, F9.healthInsurance, F9.otherChildSupport, F9.spousalSupport, F9.partnerSupport, F9.jobExpenses].map(num));
  const housing = num(a.F11.rentOrMortgage) ?? sum([num(a.F11.mortgagePrincipal), num(a.F11.mortgageInterest)]);
  const expTotal = sum([housing, ...Object.values(a.F11.lines).map((v) => num(v)), num(a.F11.other)]);
  const installments = a.F12.filter((d) => s(d.paidTo) || s(d.amount));
  const property = num(a.F10.property);

  // Respondent
  const rAge = a.R3 ? int(ageFrom(a.R3, sessionDate)) : int(a.R4);
  const guns = a.R19.filter((g) => s(g.what));

  // History
  const priorOrders = a.C1 === "Y" ? a.C2.filter((o) => s(o.type) || s(o.dateMade) || s(o.expires)) : [];
  const orderType = (re: RegExp) => (a.C1 === "Y" ? priorOrders.some((o) => re.test(o.type.toLowerCase())) : a.C1 === "N" ? false : null);
  const policeRe = /police|emergency|\bepo\b/;
  const criminalRe = /criminal|\bcpo\b/;
  const civilRe = /civil|harass|elder|workplace|gun violence|\bgvro\b/;
  const caseTypes = a.C3 === "Y" ? a.C4.map((c) => c.type) : [];
  const caseFlag = (t: string) => (a.C3 === "Y" ? caseTypes.includes(t as never) : a.C3 === "N" ? false : null);

  // Custody
  const moves = !custody
    ? null
    : a.K1 === "Y"
      ? Math.max(0, a.K2.length - 1)
      : a.K1 === "N"
        ? Math.max(0, ...a.K2A.map((g) => g.rows.length - 1))
        : null;
  const supervisor = a.K9.type === "professional" ? "professional" : a.K9.type === "trusted person" ? "trusted" : null;
  const visitPattern = !custody
    ? null
    : a.K8 === "Y"
      ? s(a.K11.kind) || null
      : a.K14use
        ? s(a.K14.repeat) || null
        : null;

  // Orders
  const o = a.orders;
  const stayAsked = !!o.O12;
  const moveOut = !!o.O13;
  const prop = s(a.O17.property).toLowerCase();
  const propAsked = !!o.O17 && !!prop;
  const animals = a.O16.animals.filter((x) => s(x.type) || s(x.name) || s(x.breed));
  const debts = a.O22.debts.filter((d) => s(d.payTo) || s(d.amount));
  const expenses = a.O23.filter((x) => s(x.payTo) || s(x.for) || s(x.amount));

  const forms = new Set(m.forms.map(formColumn));

  const session: Record<string, unknown> = {
    // Session
    wizard_version: m.version,
    agreement_version: m.agreementVersion,
    session_date: sessionDate,
    start_hour: started.getHours(),
    day_of_week: ((started.getDay() + 6) % 7) + 1,
    minutes_total: Math.max(0, Math.round((m.now - m.startedAt) / 60_000)),
    completed: m.completed,
    send_trigger: m.trigger,
    last_step: m.lastStep,
    quick_exit_used: m.trigger === "quick_exit",
    quick_exit_step: m.trigger === "quick_exit" ? (m.quickExitStep ?? m.lastStep) : null,
    days_since_last_incident: lastIncident ? daysBetween(lastIncident, sessionDate) : null,
    ...m.device,
    zip_downloaded: m.zipDownloaded,
    instructions_printed: m.instructionsPrinted,
    signature_drawn: !!a.sig,
    lawyer_signature_drawn: lawyer ? !!a.lawyerSig : null,
    ...(m.forms.length
      ? Object.fromEntries(
          [
            "dv100", "clets001", "dv109", "dv110", "dv101", "dv105", "dv105a", "dv108", "dv140", "dv145", "dv160", "dv165",
            "dv170", "dv175", "dv130", "dv150", "dv900", "dv901", "dv200", "dv210", "dv250", "fl150", "int300", "ser001",
          ].map((f) => [`form_${f}`, forms.has(`form_${f}`)]),
        )
      : {}),

    // Petitioner
    county: txt(a.S1),
    courthouse: txt(a.S2),
    represented: yesNo(a.S5),
    lawyer_rate: lawyer && o.O26 ? int(a.L6) : null,
    p_age: pAge,
    p_under_18: pAge === null ? null : pAge < 18,
    p_gender: a.P4 || null,
    p_race_raw: txt(a.P5),
    p_english: yesNo(a.P9),
    p_language: pLanguage || null,
    p_interpreter: yesNo(a.I1),
    witness_interpreters: witnessLanguages.length,
    witness_languages: witnessLanguages.filter(Boolean).join(", ") || null,
    p_mail_zip: zip5(a.P6.zip) ?? (lawyer && !mailStreet ? zip5(a.L4.zip) : null),
    p_mail_type: mailType,

    // Petitioner finances
    ...(fin
      ? {
          p_employed: yesNo(a.F4.employed),
          p_self_employed: yesNo(a.F1),
          p_employer_raw: a.F4.employed === "Y" ? txt(a.F4.employer) : null,
          p_occupation_raw: txt(a.F4.occupation),
          p_hours_week: int(a.F4.hoursPerWeek),
          p_job_ended: a.F4.employed === "Y" ? !!s(a.F4.endDate) : null,
          p_hs_completed: yesNo(a.F5.highSchool),
          p_college_years: int(a.F5.collegeYears),
          p_grad_years: int(a.F5.gradYears),
          p_degrees: [a.F5.collegeDegrees, a.F5.gradDegrees].map(s).filter(Boolean).join("; ") || null,
          p_licenses: [a.F5.licenses, a.F5.vocational].map(s).filter(Boolean).join("; ") || null,
          ...income,
          inc_total: dollars(incTotal),
          inc_last_month: dollars(incLast),
          one_time_income: !!s(a.F8.oneTime),
          income_changed: !!s(a.F8.change),
          deductions_total: dollars(deductions),
          tax_year_filed: int(a.F6.lastYearFiled),
          tax_status: a.F6.status || null,
          assets_cash: dollars(num(a.F10.cash)),
          assets_stocks: dollars(num(a.F10.stocks)),
          assets_real: a.F10.real ? dollars(property) : null,
          assets_personal: a.F10.personal && !a.F10.real ? dollars(property) : null,
          installment_debts: installments.length,
          installment_monthly: dollars(sum(installments.map((d) => num(d.amount)))),
          exp_basis: a.F11.basis || null,
          exp_housing: dollars(housing),
          exp_total: dollars(expTotal),
          child_ins_available: yesNo(a.F17.available),
          r_income_est: dollars(num(a.F14.amount)),
        }
      : {}),
    tanf: o.O24 ? a.O24status.includes("TANF/CalWORKs") : null,

    // Household and housing
    household_size: 1 + household.length,
    household_adults: 1 + household.filter((p) => p.age !== null && p.age >= 18).length,
    household_children: household.filter((p) => p.age !== null && p.age < 18).length,
    household_other_income: dollars(sum(household.map((p) => p.income))),
    ...flags(moveOut, a.O13.reasons, {
      own: "home_own",
      lease: "home_lease",
      "live there with my children": "home_with_children",
      "pay rent or mortgage": "home_pays_rent",
    }),
    home_years: moveOut ? int(a.O13.years) : null,
    home_months: moveOut ? int(a.O13.months) : null,

    // Respondent
    r_age: rAge,
    r_age_estimated: rAge === null ? null : !a.R3,
    r_gender: a.R5 || null,
    r_race_raw: txt(a.R6),
    r_height_in: heightInches(a.R7.height),
    r_weight_lb: int(a.R7.weight.replace(/lbs?|pounds?/i, "")),
    r_hair: txt(a.R7.hair),
    r_eyes: txt(a.R7.eyes),
    r_marks: !!s(a.R8),
    r_english: ynd(a.R17),
    r_language: a.R17 === "N" ? txt(a.R17language) : a.R17 === "Y" ? "English" : null,
    r_employed: !!s(a.R13.name),
    r_employer_raw: txt(a.R13.name),
    r_zip: zip5(a.R14.zip),
    r_county: sheriff ? txt(a.V2 || a.S1) : null,
    r_vehicle_type: txt(a.R11.type),
    r_vehicle_year: int(a.R11.year),
    r_dl_state: txt(a.R9.state),
    r_incarcerated: sheriff ? yesNo(a.R16) : null,
    r_guns: ynd(a.R18),
    r_gun_items: a.R18 === "Y" ? guns.length : null,
    r_gun_items_raw: a.R18 === "Y" ? guns.map((g) => [s(g.count), s(g.what)].filter(Boolean).join(" ")).join("; ") || null : null,
    r_body_armor: ynd(a.R20),
    ...flags(sheriff, a.R21, {
      "violent history": "r_flag_violent",
      "military or first-responder training": "r_flag_military",
      "probation or parole": "r_flag_probation",
      "aggressive animal": "r_flag_animal",
      "mental health issues": "r_flag_mental",
      "deaf or hard of hearing": "r_flag_deaf",
      other: "r_flag_other",
    }),
    r_criminal_record: abduction ? yesNo(a.B5) : null,
    r_foreign_citizen: abduction ? yesNo(a.B7.citizen) : null,
    r_foreign_country: abduction && a.B7.citizen === "Y" ? txt(a.B7.countries) : null,
    ...flags(abduction, a.B6, { "another county": "r_ties_county", "another state": "r_ties_state", "another country": "r_ties_country" }),
    ...flags(abduction, a.B3, {
      "quit a job": "r_quit_job",
      "closed a bank account": "r_closed_account",
      "sold or got rid of property": "r_sold_property",
      "sold a home or ended a lease": "r_ended_lease",
      "applied for documents": "r_applied_docs",
      "hid or destroyed documents": "r_hid_docs",
    }),

    // Relationship and history
    ...flags(a.RL1.length > 0, a.RL1, {
      children: "rel_children",
      married: "rel_married",
      "formerly married": "rel_formerly_married",
      dating: "rel_dating",
      engaged: "rel_engaged",
      related: "rel_related",
      "live together": "rel_cohabit",
    }),
    rel_family_tie: a.RL1.includes("related") ? a.RL2.join(", ") || null : null,
    rel_household: yesNo(a.RL3),
    proximity: ({ no: "no", together: "together", "same building": "building", "same neighborhood": "neighborhood", other: "other" } as const)[a.RL4 as "no"] ?? null,
    prior_orders: a.C1 === "Y" ? priorOrders.length : a.C1 === "N" ? 0 : null,
    prior_police_epo: orderType(policeRe),
    prior_criminal: orderType(criminalRe),
    prior_civil: orderType(civilRe),
    prior_other: a.C1 === "Y" ? priorOrders.some((x) => ![policeRe, criminalRe, civilRe].some((re) => re.test(x.type.toLowerCase()))) : a.C1 === "N" ? false : null,
    case_custody: caseFlag("custody"),
    case_divorce: caseFlag("divorce"),
    case_juvenile: caseFlag("juvenile"),
    case_guardianship: caseFlag("guardianship"),
    case_criminal: caseFlag("criminal"),
    case_child_support: caseFlag("child support"),
    case_other: caseFlag("other"),
    custody_order_exists: custody ? yesNo(a.C6) : null,

    // Abuse summary
    incident_count: incidents.length,
    first_incident_date: dates[0] ?? null,
    last_incident_date: lastIncident,

    // Children, custody and confidentiality
    shared_children: named.filter((p) => p.sharedChild === "Y").length,
    protected_people: named.filter((p) => p.protect === "Y").length,
    custody_requested: custody,
    legal_custody_req: custody && a.K6.on === "Y" ? txt(a.K6.legal) : null,
    physical_custody_req: custody && a.K6.on === "Y" ? txt(a.K6.physical) : null,
    visits_req: custody ? (({ "no visits": "none", yes: "yes", "virtual only": "virtual" } as const)[a.K7 as "yes"] ?? null) : null,
    visits_supervised: custody && a.K7 !== "no visits" ? yesNo(a.K8) : null,
    supervisor_type: custody && a.K8 === "Y" ? supervisor : null,
    supervisor_fee_pct_petitioner: custody && a.K8 === "Y" ? int(a.K9.feeMe) : null,
    visit_pattern: visitPattern,
    exchange_supervised: custody && a.K8 !== "Y" ? yesNo(a.K12on) : null,
    residence_moves_5yr: moves,
    ...flags(custody && a.K3.on === "Y", a.K3.places, { "this county": "travel_limit_county", California: "travel_limit_state", other: "travel_limit_other" }),
    records_block: custody ? yesNo(a.K4.on) : null,
    ...flags(custody && a.K4.on === "Y", a.K4.records, {
      medical: "records_medical",
      school: "records_school",
      activities: "records_activities",
      "child's job": "records_job",
      other: "records_other",
    }),
    abduction_concern: custody ? yesNo(a.K5) : null,
    abd_broke_order: abduction ? yesNo(a.B1) : null,
    abd_no_ca_ties: abduction ? yesNo(a.B2) : null,
    ...flags(abduction, a.B4, {
      "abusing you": "abd_hist_abuse",
      "child abuse": "abd_hist_child_abuse",
      "abusing other partners": "abd_hist_other_partners",
      "taking or hiding the children": "abd_hist_taking",
      "threatening to take the children": "abd_hist_threats",
      "not cooperating in parenting": "abd_hist_noncoop",
    }),
    ...flags(abduction, a.B9, {
      "no move without permission": "prot_no_move",
      "surrender documents": "prot_passports",
      "travel plan": "prot_travel_plan",
      "register in another state": "prot_register",
      "notify embassy": "prot_embassy",
      "foreign custody order": "prot_foreign_order",
      bond: "prot_bond",
    }),
    bond_amount: abduction && a.B9.includes("bond") ? int(a.B15) : null,
    minor_confidential: yesNo(a.PR14),

    // Orders requested
    ...Object.fromEntries(Array.from({ length: 19 }, (_, i) => [`order_${i + 10}`, !!o[`O${i + 10}` as keyof typeof o]])),
    ...flags(stayAsked, a.O12.places, {
      me: "stay_me",
      "my home": "stay_home",
      "my job": "stay_job",
      "my vehicle": "stay_vehicle",
      "my school": "stay_school",
      "protected people": "stay_protected",
      "children's school or childcare": "stay_childcare",
      other: "stay_other",
    }),
    stay_yards: stayAsked ? (a.O12.distance === "other" ? int(a.O12.distanceYards) : 100) : null,
    animals_count: o.O16 ? animals.length : null,
    animal_types: o.O16 ? animals.map((x) => [s(x.type), s(x.breed)].filter(Boolean).join(" ")).filter(Boolean).join(", ") || null : null,
    property_car: propAsked ? /\b(car|truck|vehicle|van|suv|motorcycle|auto)\b/.test(prop) : null,
    property_phone: propAsked ? /\b(phone|cell|iphone)\b/.test(prop) : null,
    property_keys: propAsked ? /\bkeys?\b/.test(prop) : null,
    property_other: propAsked ? !/\b(car|truck|vehicle|van|suv|motorcycle|auto|phone|cell|iphone|keys?)\b/.test(prop) || /,|\band\b/.test(prop) : null,
    debts_count: o.O22 ? debts.length : null,
    debts_total: o.O22 ? dollars(sum(debts.map((d) => num(d.amount)))) : null,
    debts_abuse_caused: o.O22 ? yesNo(a.O22.finding) : null,
    expenses_count: expenses.length,
    expenses_total: dollars(sum(expenses.map((x) => num(x.amount)))),
    phone_numbers: o.O28 ? a.O28.filter((p) => s(p.phone)).length : null,
    server: ({ sheriff: "sheriff", adult: "other", unsure: "unsure" } as const)[a.V1 as "sheriff"] ?? null,
  };

  return {
    session,
    incidents,
    people,
    steps: m.steps.map((x) => ({ ...x, help_opened: null })),
    website: "",
  };
}
