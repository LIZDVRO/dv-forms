/**
 * Column rules for the statistics tables in Supabase (project liz-dvro-stats).
 * See DVRO_Data_Collection_Spec.md and liz_dvro_stats_schema.sql.
 *
 * The receiving function (/api/stats) passes every record through clean():
 * unknown keys are dropped, and a value that breaks a column's rule becomes
 * null, so one bad answer never loses the whole record.
 */

type Rule =
  | { t: "bool" }
  | { t: "text"; max?: number; one?: readonly string[]; re?: RegExp }
  | { t: "int"; min?: number; max?: number }
  | { t: "dollars" }
  | { t: "date" };

const B: Rule = { t: "bool" };
const T: Rule = { t: "text" };
const RAW: Rule = { t: "text", max: 1000 };
const D: Rule = { t: "date" };
const $: Rule = { t: "dollars" };
const N: Rule = { t: "int", min: 0, max: 32767 };
const I: Rule = { t: "int", min: 0, max: 2_000_000_000 };
const YN: Rule = { t: "text", one: ["Y", "N", "DK"] };
const G: Rule = { t: "text", one: ["M", "F", "X"] };
const ZIP: Rule = { t: "text", re: /^[0-9]{5}$/ };
const one = (...v: string[]): Rule => ({ t: "text", one: v });
const range = (min: number, max: number): Rule => ({ t: "int", min, max });
const all = (rule: Rule, ...keys: string[]) => Object.fromEntries(keys.map((k) => [k, rule]));

export const SESSION: Record<string, Rule> = {
  wizard_version: T,
  agreement_version: T,
  session_date: D,
  start_hour: range(0, 23),
  day_of_week: range(1, 7),
  minutes_total: I,
  completed: B,
  send_trigger: one("finish", "left_page", "quick_exit"),
  last_step: T,
  quick_exit_used: B,
  quick_exit_step: T,
  days_since_last_incident: { t: "int", min: -100_000, max: 100_000 },
  device_type: one("phone", "tablet", "desktop"),
  os: T,
  browser: T,
  screen_w: I,
  screen_h: I,
  browser_language: T,
  connection_type: one("wifi", "cellular", "unknown"),
  referrer_domain: T,
  utm_source: T,
  utm_medium: T,
  utm_campaign: T,
  geo_country: T,
  geo_region: T,
  geo_city: T,
  ...all(B, "zip_downloaded", "instructions_printed", "signature_drawn", "lawyer_signature_drawn"),
  ...all(
    B,
    "form_dv100", "form_clets001", "form_dv109", "form_dv110", "form_dv101", "form_dv105", "form_dv105a", "form_dv108",
    "form_dv140", "form_dv145", "form_dv160", "form_dv165", "form_dv170", "form_dv175", "form_dv130", "form_dv150",
    "form_dv900", "form_dv901", "form_dv200", "form_dv210", "form_dv250", "form_fl150", "form_int300", "form_ser001",
  ),

  // Petitioner
  county: T,
  courthouse: T,
  represented: B,
  lawyer_rate: I,
  p_age: range(0, 120),
  p_under_18: B,
  p_gender: G,
  p_race_raw: RAW,
  p_english: B,
  p_language: T,
  p_interpreter: B,
  witness_interpreters: N,
  witness_languages: T,
  p_mail_zip: ZIP,
  p_mail_type: one("po_box", "safe_at_home", "street", "lawyer"),

  // Petitioner finances
  p_employed: B,
  p_self_employed: B,
  p_employer_raw: RAW,
  p_occupation_raw: RAW,
  p_hours_week: range(0, 168),
  p_job_ended: B,
  p_hs_completed: B,
  p_college_years: N,
  p_grad_years: N,
  p_degrees: T,
  p_licenses: T,
  ...all(
    $,
    "inc_wages", "inc_overtime", "inc_commissions", "inc_public_assist", "inc_spousal_support", "inc_partner_support",
    "inc_pension", "inc_social_security", "inc_disability", "inc_unemployment", "inc_workers_comp", "inc_interest",
    "inc_rental", "inc_trust", "inc_other_invest", "inc_other", "inc_total", "inc_last_month", "deductions_total",
    "assets_cash", "assets_stocks", "assets_real", "assets_personal", "installment_monthly", "exp_housing", "exp_total",
    "r_income_est", "household_other_income", "debts_total", "expenses_total",
  ),
  tanf: B,
  one_time_income: B,
  income_changed: B,
  tax_year_filed: range(1900, 2100),
  tax_status: T,
  installment_debts: N,
  exp_basis: one("estimated", "actual", "proposed"),
  child_ins_available: B,

  // Household and housing
  household_size: range(1, 100),
  household_adults: N,
  household_children: N,
  ...all(B, "home_own", "home_lease", "home_with_children", "home_pays_rent"),
  home_years: N,
  home_months: range(0, 11),

  // Respondent
  r_age: range(0, 120),
  r_age_estimated: B,
  r_gender: G,
  r_race_raw: RAW,
  r_height_in: range(20, 108),
  r_weight_lb: range(20, 1000),
  r_hair: T,
  r_eyes: T,
  r_marks: B,
  r_english: YN,
  r_language: T,
  r_employed: B,
  r_employer_raw: RAW,
  r_zip: ZIP,
  r_county: T,
  r_vehicle_type: T,
  r_vehicle_year: range(1900, 2100),
  r_dl_state: T,
  r_incarcerated: B,
  r_guns: YN,
  r_gun_items: N,
  r_gun_items_raw: RAW,
  r_body_armor: YN,
  ...all(B, "r_flag_violent", "r_flag_military", "r_flag_probation", "r_flag_animal", "r_flag_mental", "r_flag_deaf", "r_flag_other"),
  r_criminal_record: B,
  r_foreign_citizen: B,
  r_foreign_country: T,
  ...all(B, "r_ties_county", "r_ties_state", "r_ties_country"),
  ...all(B, "r_quit_job", "r_closed_account", "r_sold_property", "r_ended_lease", "r_applied_docs", "r_hid_docs"),

  // Relationship and history
  ...all(B, "rel_children", "rel_married", "rel_formerly_married", "rel_dating", "rel_engaged", "rel_related", "rel_cohabit"),
  rel_family_tie: T,
  rel_household: B,
  proximity: one("no", "together", "building", "neighborhood", "other"),
  prior_orders: N,
  ...all(B, "prior_police_epo", "prior_criminal", "prior_civil", "prior_other"),
  ...all(B, "case_custody", "case_divorce", "case_juvenile", "case_guardianship", "case_criminal", "case_child_support", "case_other"),
  custody_order_exists: B,

  // Abuse summary (abuse_* stay null until the wizard asks the A0 checklist)
  ...all(
    B,
    "abuse_contact", "abuse_tracking", "abuse_needs", "abuse_isolating", "abuse_immigration", "abuse_force", "abuse_money",
    "abuse_reproductive", "abuse_harassing", "abuse_hitting", "abuse_injuring", "abuse_threats_kill", "abuse_sexual",
    "abuse_animals", "abuse_property", "abuse_choking", "abuse_children",
  ),
  incident_count: N,
  first_incident_date: D,
  last_incident_date: D,

  // Children, custody and confidentiality
  shared_children: N,
  protected_people: N,
  custody_requested: B,
  legal_custody_req: T,
  physical_custody_req: T,
  visits_req: one("none", "yes", "virtual"),
  visits_supervised: B,
  supervisor_type: one("professional", "trusted"),
  supervisor_fee_pct_petitioner: range(0, 100),
  visit_pattern: T,
  exchange_supervised: B,
  residence_moves_5yr: N,
  ...all(B, "travel_limit_county", "travel_limit_state", "travel_limit_other"),
  records_block: B,
  ...all(B, "records_medical", "records_school", "records_activities", "records_job", "records_other"),
  abduction_concern: B,
  ...all(B, "abd_broke_order", "abd_no_ca_ties"),
  ...all(B, "abd_hist_abuse", "abd_hist_child_abuse", "abd_hist_other_partners", "abd_hist_taking", "abd_hist_threats", "abd_hist_noncoop"),
  ...all(B, "prot_no_move", "prot_passports", "prot_travel_plan", "prot_register", "prot_embassy", "prot_foreign_order", "prot_bond"),
  bond_amount: I,
  minor_confidential: B,

  // Orders requested
  ...all(B, ...Array.from({ length: 19 }, (_, i) => `order_${i + 10}`)),
  ...all(B, "stay_me", "stay_home", "stay_job", "stay_vehicle", "stay_school", "stay_protected", "stay_childcare", "stay_other"),
  stay_yards: N,
  animals_count: N,
  animal_types: RAW,
  ...all(B, "property_car", "property_phone", "property_keys", "property_other"),
  debts_count: N,
  debts_abuse_caused: B,
  expenses_count: N,
  phone_numbers: N,
  server: one("sheriff", "other", "unsure"),
};

export const INCIDENT: Record<string, Rule> = {
  card: range(1, 1000),
  incident_date: D,
  date_estimated: B,
  days_before_session: { t: "int", min: -100_000, max: 100_000 },
  witnesses: YN,
  witness_count: N,
  weapon: one("none", "gun", "other"),
  harm: B,
  police: YN,
  epo: YN,
  epo_protects: one("petitioner", "respondent"),
  frequency: one("once", "2-5", "weekly", "other"),
  frequency_other_raw: RAW,
  narrative_chars: I,
};

export const PERSON: Record<string, Rule> = {
  person: range(1, 1000),
  age: range(0, 120),
  gender: G,
  race_raw: RAW,
  relationship: T,
  lives_with_petitioner: B,
  shared_child: B,
  protected: B,
  income: $,
  pays_expenses: B,
  confidential: B,
};

export const STEP: Record<string, Rule> = {
  step: { t: "text", max: 60 },
  seq: range(1, 1000),
  seconds: I,
  visits: N,
  edits: N,
  help_opened: T,
  errors: N,
};

export const SHERIFF: Record<string, Rule> = {
  county: T,
  channel: one("share_sheet", "mailto", "civil_connect", "fax_shown"),
  photo_count: N,
  pdf_count: N,
};

/** Value that obeys the rule, or null. */
function fit(rule: Rule, v: unknown): unknown {
  if (v === null || v === undefined || v === "") return null;
  switch (rule.t) {
    case "bool":
      return typeof v === "boolean" ? v : null;
    case "text": {
      if (typeof v !== "string") return null;
      const s = v.trim().slice(0, rule.max ?? 200);
      if (!s) return null;
      if (rule.one && !rule.one.includes(s)) return null;
      if (rule.re && !rule.re.test(s)) return null;
      return s;
    }
    case "int": {
      const n = typeof v === "number" ? v : Number.NaN;
      if (!Number.isFinite(n)) return null;
      const r = Math.round(n);
      if (rule.min !== undefined && r < rule.min) return null;
      if (rule.max !== undefined && r > rule.max) return null;
      return r;
    }
    case "dollars": {
      if (typeof v !== "number" || !Number.isFinite(v) || v < 0 || v > 1_000_000_000) return null;
      return Math.round(v / 100) * 100;
    }
    case "date": {
      if (typeof v !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(v)) return null;
      const d = new Date(`${v}T00:00:00Z`);
      return Number.isNaN(d.getTime()) || d.toISOString().slice(0, 10) !== v ? null : v;
    }
  }
}

/** Keep only known columns, each obeying its rule. Nulls are left out (the column default is null). */
export function clean(rules: Record<string, Rule>, row: unknown): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  if (!row || typeof row !== "object" || Array.isArray(row)) return out;
  for (const [k, rule] of Object.entries(rules)) {
    const v = fit(rule, (row as Record<string, unknown>)[k]);
    if (v !== null) out[k] = v;
  }
  return out;
}

/** Up to `max` cleaned rows, each with every key in `required` present. */
export function cleanRows(rules: Record<string, Rule>, rows: unknown, required: string[], max: number) {
  if (!Array.isArray(rows)) return [];
  const seen = new Set<string>();
  return rows
    .slice(0, max)
    .map((r) => clean(rules, r))
    .filter((r) => {
      if (!required.every((k) => r[k] !== undefined)) return false;
      // Primary keys must be unique within the record.
      const key = required.map((k) => String(r[k])).join("|");
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
}
