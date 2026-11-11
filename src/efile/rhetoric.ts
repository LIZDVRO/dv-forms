/**
 * Drives a Rhetoric filing session with what the wizard knows.
 * Imported only by the /api/rhetoric routes, so it runs on the server.
 *
 * Two stages, so LIZ never handles the survivor's eFileCA password:
 *   1. prefillToLogin: court system and court (and the sign-up form, if new).
 *   2. fillAfterLogin: after she logs in on Rhetoric's screen, fill case type,
 *      parties and one filing entry per "file now" form, then stop at payment.
 * Fields and buttons are matched by label, as seen on Rhetoric's test system
 * on Oct 27, 2026 (see the Rhetoric e-filing test notes in the project).
 */

const API = process.env.RHETORIC_API_URL || "https://api.rhetoric.law";

/** Every document is filed Confidential (Chris, Oct 27). */
const SECURITY = /^confidential$/i;

/**
 * Filing code choices, best first. Courts name codes very differently (a test
 * sweep of 40 courthouses, Nov 11: "Petition", "PETITION", "Request for
 * Domestic Violence Restraining Order", "DV-110 Temporary Restraining Order
 * (CLETS-TRO)", "Proposed Form 110 Temporary Restraining Order", "CLETS Info
 * Sheet"...). Chris (Nov 11): the code only needs to describe the document
 * generally. Order of preference for each form:
 *   1. a code naming the form itself (DV-110, DV110, Form 110)
 *   2. a code describing that document (Temporary Restraining Order)
 *   3. a plain, general code (Order, Proposed Order, Request, Declaration)
 * Codes for other kinds of case (dissolution, juvenile, elder abuse, support,
 * name change...) are never used.
 */
const OTHER_CASE = /juvenile|elder|dependent adult|civil harass|workplace|gun\b|firearm|school|denied|dissol|parent(al)?.(child )?relationship|parental|terminat|change of name|name change|gender|emanci|adopt|support|guardian|bifurcat|vexatious|summary|nullity|separation|warrant|ivf|marry|hague|registration|register|foreign|publication|transfer (and|in)|uifsa|dcss|surrogacy|batterer|canadian|elder abuse|ea-110|telephon|remote|zoom|fee|address|e-?service|proof of service|summons|withholding|attorney|spouse|osc\b|amended|modif/i;

/** A general code: its label is just the word(s), maybe with "Filed"/"Received" etc. */
const generic = (...words: string[]) => {
  const alt = words.map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(/ /g, "\\s+")).join("|");
  return new RegExp(`^(?:${alt})(?:\\s*[-–(:]?\\s*(?:filed|received|confidential|lodged|initial|petitioner'?s?|\\(petitioner\\)|ex parte))*\\)?$`, "i");
};
const formNo = (n: string) => new RegExp(`\\bdv[-\\s]?${n}\\b|\\bform\\s+${n}\\b`, "i");

const GEN = {
  petition: [generic("petition", "verified petition"), /^domestic violence.*filing$/i],
  request: [generic("request"), generic("request for order"), /request for order:?\s*(domestic violence|ex parte)/i, /(^|\s)request for order$/i, generic("ex parte filed"), generic("ex parte application"), generic("application"), generic("declaration"), generic("domestic violence filing")],
  order: [generic("order"), generic("proposed order"), generic("proposed order/judgment"), /^proposed order\b/i, /^domestic violence.*filing$/i],
  notice: [generic("notice"), generic("notice of hearing"), generic("notice of court hearing"), /^dv notice\b/i],
};
const CATCH_ALL = [/^domestic violence.*filing$/i, /^document\s*[-–]?\s*other$/i, generic("other document", "other", "rfo - other", "declaration/pleading"), generic("declaration")];

export const FORM_FILING: Record<string, { codes: RegExp[]; description: string }> = {
  "DV-100": { codes: [formNo("100"), /request for domestic violence restraining order/i, /request:?\s*domestic violence restraining order/i, /\bdv request\b/i, /\bdv\b.*new case petition/i, /domestic violence.*(petition|request)/i, ...GEN.petition, ...GEN.request], description: "DV-100 Request for Domestic Violence Restraining Order" },
  "DV-101": { codes: [formNo("101"), /description of abuse/i, ...GEN.request], description: "DV-101 Description of Abuse" },
  "DV-105": { codes: [formNo("105"), /request for child custody/i, ...GEN.request], description: "DV-105 Request for Child Custody and Visitation Orders" },
  "DV-105(A)": { codes: [formNo("105\\(?a\\)?"), ...GEN.request], description: "DV-105(A) City and State Where Children Lived" },
  "DV-108": { codes: [formNo("108"), /prevent child abduction/i, ...GEN.request], description: "DV-108 Request for Orders to Prevent Child Abduction" },
  "DV-109": { codes: [formNo("109"), /notice.*court hearing.*(domestic|dv)|dv notice.*court hearing/i, ...GEN.notice, ...GEN.order], description: "DV-109 Notice of Court Hearing" },
  "DV-110": { codes: [formNo("110"), /temporary restraining order/i, ...GEN.order], description: "DV-110 Temporary Restraining Order" },
  "DV-140": { codes: [formNo("140"), /custody and visitation order/i, ...GEN.order], description: "DV-140 Child Custody and Visitation Order" },
  "DV-145": { codes: [formNo("145"), /order to prevent child abduction/i, ...GEN.order], description: "DV-145 Order to Prevent Child Abduction" },
  "DV-900": { codes: [formNo("900"), /wireless|phone account/i, ...GEN.order], description: "DV-900 Order Transferring Wireless Phone Account" },
  "FL-150": { codes: [/\bfl-?150\b/i, /income\s*(and|&)?\s*expense/i, generic("financial statement", "financial declaration"), generic("declaration")], description: "FL-150 Income and Expense Declaration" },
  "INT-300": { codes: [/\bint-?300\b/i, /interpreter/i, ...GEN.request], description: "INT-300 Request for Interpreter" },
  "DV-160": { codes: [formNo("160"), /keep minor'?s? info.*confidential/i, ...GEN.request], description: "DV-160 Request to Keep Minor's Information Confidential" },
  "DV-165": { codes: [formNo("165"), /order on request to keep minor/i, ...GEN.order], description: "DV-165 Order on Request to Keep Minor's Information Confidential" },
  "DV-170": { codes: [formNo("170"), /notice of order protecting/i, ...GEN.notice], description: "DV-170 Notice of Order Protecting Information of Minor" },
  "CLETS-001": { codes: [/clets-?001/i, /clets info|confidential clets|clets form|clets confidential|confidential - clets/i, /confidential information for law enforcement/i, generic("confidential information sheet")], description: "CLETS-001 Confidential CLETS Information" },
};

/** The court's best filing code for a form, by the ranked list above. */
export function pickFilingCode<T extends { label: string }>(opts: T[], codes: RegExp[]): T | undefined {
  const usable = opts.filter((o) => !OTHER_CASE.test(o.label));
  for (const re of [...codes, ...CATCH_ALL]) {
    const hit = usable.find((o) => re.test(o.label.trim()));
    if (hit) return hit;
  }
  return undefined;
}

/** Extra copies (INT-300-2, DV-105(A)-2) file under the base form. */
export const specFor = (form: string) => FORM_FILING[form] ?? FORM_FILING[form.replace(/-\d+$/, "")];

export interface Person { first: string; middle?: string; last: string }

export interface PrefillInput {
  county: string;
  /** Rhetoric court code, one of the county's in src/efile/courts.ts. */
  courtCode: string;
  account: "new" | "existing";
  petitioner: Person;
  signup?: { email: string; address1: string; address2?: string; city: string; zip: string; phone: string };
}

export interface FillInput {
  minorChildren: boolean;
  petitioner: Person;
  respondent: Person;
  documents: { form: string; fileName: string; contentBase64: string }[];
}

export type FillResult = { ok: true; step: string; filed: string[] } | { ok: false; step: string; problem: string };

const NEVER_PRESS = /submit|\bpay\b|pay now|file now/i; // never submit or pay; "Add payment method" is allowed
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/* eslint-disable @typescript-eslint/no-explicit-any -- Rhetoric's form JSON is open-ended by design */
type Form = any;
type Block = any;
type Field = any;
type Action = { action_id: string; label: string; primary?: boolean };

export class Session {
  form: Form = null;
  version = 0;
  constructor(private token: string) {}

  private async call(op: string, body: unknown, tries = 5): Promise<any> {
    let res: Response;
    try {
      res = await fetch(`${API}/${op}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${this.token}`, "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
    } catch (err) {
      if (tries > 1) { await sleep(1500); return this.call(op, body, tries - 1); }
      throw err;
    }
    if (!res.ok) throw new Error(`${op}: HTTP ${res.status}`);
    return res.json();
  }
  async resume() {
    const out = await this.call("resume-filing-session", {});
    if (out.result === "err") throw new Error(`session ${out.code}`);
    this.form = out.form; this.version = out.state_version;
  }
  async apply(event: unknown) {
    for (let i = 0; i < 6; i++) {
      const out = await this.call("apply-filing-session-event", { state_version: this.version, event });
      if (out.result === "err") {
        if (out.code === "session_busy") { await sleep(800); continue; }
        if (out.code === "stale_state" && out.form) { this.form = out.form; this.version = out.state_version; continue; }
        throw new Error(`session ${out.code}`);
      }
      this.form = out.form; this.version = out.state_version;
      return;
    }
    throw new Error("session stayed busy");
  }

  get title(): string { return this.form?.title ?? ""; }
  get blocks(): Block[] { return this.form?.blocks ?? []; }
  fields(): Field[] { return this.blocks.flatMap((b: Block) => (b.items || []).filter((i: any) => i.kind === "field")); }
  field(re: RegExp): Field | undefined { return this.fields().find((f) => re.test(f.key) || re.test(f.label)); }
  errors(): string[] { return [...(this.form?.errors || []), ...this.fields().flatMap((f) => f.errors || [])]; }
  action(re: RegExp): Action | undefined { return (this.form?.actions || []).find((a: Action) => re.test(a.label) || re.test(a.action_id)); }
  primary(): Action | undefined { return (this.form?.actions || []).find((a: Action) => a.primary); }
  data(block: Block, re: RegExp): string | undefined { return (block.items || []).find((i: any) => i.kind === "data" && re.test(i.label))?.value; }
  blockAction(block: Block, re: RegExp): Action | undefined { return (block?.actions || []).find((a: Action) => re.test(a.label)); }

  async set(re: RegExp, value: unknown) {
    const f = this.field(re);
    if (!f) throw new Error(`"${this.title}": no field ${re}`);
    await this.apply({ kind: "set_field", field: f.key, value });
  }
  async choose(fieldRe: RegExp, optionRe: RegExp) {
    const f = this.field(fieldRe);
    if (!f) throw new Error(`"${this.title}": no field ${fieldRe}`);
    let opts: { value: unknown; label: string }[] = f.options ?? f.search?.results ?? [];
    if (!opts.length && f.search) {
      await this.apply({ kind: "search", field: f.key, query: "" });
      opts = this.field(fieldRe)?.search?.results ?? [];
    }
    const o = opts.find((o) => optionRe.test(o.label));
    if (!o) throw new Error(`"${this.title}": no "${optionRe.source}" choice for ${f.label}`);
    await this.apply({ kind: "set_field", field: f.key, value: o.value });
  }
  /** Like choose(), but `pick` decides among the field's options (they differ by court). */
  async chooseWith(fieldRe: RegExp, pick: (opts: { value: unknown; label: string }[]) => { value: unknown; label: string } | undefined, what: string) {
    const f = this.field(fieldRe);
    if (!f) throw new Error(`"${this.title}": no field ${fieldRe}`);
    let opts: { value: unknown; label: string }[] = f.options ?? f.search?.results ?? [];
    if (!opts.length && f.search) {
      await this.apply({ kind: "search", field: f.key, query: "" });
      opts = this.field(fieldRe)?.search?.results ?? [];
    }
    const o = pick(opts);
    if (!o) throw new Error(`"${this.title}": no ${what} choice (offered: ${opts.map((x) => x.label).join("; ")})`);
    await this.apply({ kind: "set_field", field: f.key, value: o.value });
  }
  /**
   * Rhetoric briefly shows an in-between screen while it processes an upload.
   * Re-read the session until `get` finds what we need (up to ~45 s).
   */
  async waitFor<T>(get: () => T | undefined, what: string): Promise<T> {
    for (let i = 0; i < 30; i++) {
      const found = get();
      if (found !== undefined && found !== null) return found;
      await sleep(1500);
      await this.resume();
    }
    throw new Error(`"${this.title}": ${what} not found`);
  }
  /** Press a form-level button by label, waiting for it to appear. */
  async pressAction(re: RegExp) {
    await this.press(await this.waitFor(() => this.action(re), `button ${re.source}`));
  }
  async press(action: Action | undefined) {
    if (!action) throw new Error(`"${this.title}": button not found`);
    if (NEVER_PRESS.test(action.label)) throw new Error(`refused to press "${action.label}"`);
    await this.apply({ kind: "action", action_id: action.action_id });
  }
  async next() {
    const from = this.title;
    await this.press(this.primary());
    if (this.title === from) throw new Error(`"${from}": ${this.errors().join("; ") || "did not advance"}`);
  }
}

/** Stage 1: court system and court, and the sign-up form for a new account. */
export async function prefillToLogin(token: string, p: PrefillInput): Promise<{ step: string }> {
  const s = new Session(token);
  await s.resume();
  await s.choose(/court.?system/i, /^california$/i);
  await s.next();
  await s.set(/^court$/i, p.courtCode);
  await s.next();
  if (p.account === "new" && p.signup) {
    const opt = async (re: RegExp, v?: string) => { if (v?.trim()) await s.set(re, v.trim()); };
    await s.press(s.action(/create.*account/i));
    await s.choose(/account.?(kind|type)/i, /individual/i);
    await opt(/^email$/i, p.signup.email);
    await opt(/first.?name/i, p.petitioner.first);
    await opt(/middle.?name/i, p.petitioner.middle);
    await opt(/last.?name/i, p.petitioner.last);
    await opt(/street_address_line1|^address$/i, p.signup.address1);
    await opt(/street_address_line2|address line 2/i, p.signup.address2);
    await opt(/^city$/i, p.signup.city);
    await s.choose(/state/i, /^california$/i);
    await opt(/zip/i, p.signup.zip);
    await opt(/phone/i, p.signup.phone.replace(/\D/g, ""));
  }
  return { step: s.title };
}

/** The new-account activation screen (Live, Nov 11: "Check your email"). */
const ACTIVATION = /check your email|activat|verify your email|confirm your email/i;

/** Where the session is now, without changing anything. */
export async function sessionStep(token: string): Promise<{ step: string; loggedIn: boolean; activation: boolean }> {
  const s = new Session(token);
  await s.resume();
  // A new eFileCA account must be activated from an email first ("Check your email").
  const activation = ACTIVATION.test(s.title);
  // Still on the login or sign-up screen (and not yet "You're logged in")?
  const waiting = activation || (/log ?in|create.*account/i.test(s.title) && !s.action(/continue/i));
  return { step: s.title, loggedIn: !waiting, activation };
}

export type CaseInput = Omit<FillInput, "documents">;

type Opt = { value: unknown; label: string };

/** "Family" where offered; otherwise a family or domestic-violence category. */
export function pickFamilyCategory(opts: Opt[]): Opt | undefined {
  return opts.find((o) => /^family$/i.test(o.label.trim()))
    ?? opts.find((o) => /family/i.test(o.label) && !/dcss|child support|probate|juvenile/i.test(o.label))
    ?? opts.find((o) => /domestic violence/i.test(o.label));
}

/**
 * The DV prevention case type, with or without minor children. Courts word it
 * differently (Rhetoric's list, Nov 11, 2026):
 *   "Domestic Violence Prevention with/without Minor Children" (Merced, most)
 *   "DV Prevention w/ / w/o Minor Children" (Los Angeles, Glenn, San Mateo…)
 *   "DV Prevention With / Without Minor Children" (Colusa, Contra Costa…)
 *   "Domestic Violence With Child / Without Child" (Orange)
 *   "Domestic Violence With Children" / plain "Domestic Violence" (San Luis Obispo)
 * San Diego's "Domestic Violence Prevention - Limited" and registrations of
 * out-of-state orders are never chosen.
 */
export function pickDvCaseType(opts: Opt[], minorChildren: boolean): Opt | undefined {
  const dv = opts.filter(
    (o) => /domestic violence|\bdv\b/i.test(o.label) && !/limited|registration|foreign|request for domestic/i.test(o.label),
  );
  const without = (o: Opt) => /\bwithout\b|w\/o\b/i.test(o.label);
  const withKids = (o: Opt) => !without(o) && /\bwith\b|\bw\/(?!o)/i.test(o.label) && /child/i.test(o.label);
  if (minorChildren) return dv.find(withKids);
  return dv.find(without) ?? dv.find((o) => !withKids(o) && !without(o) && !/child/i.test(o.label));
}

/** Stage 2a: after login, set the filing type, case type and parties; end on the filing entries list. */
export async function prepareCase(token: string, p: CaseInput): Promise<{ ok: true; step: string } | { ok: false; step: string; problem: string }> {
  const s = new Session(token);
  await s.resume();
  if (ACTIVATION.test(s.title)) {
    return { ok: false, step: s.title, problem: "Activate your eFileCA account first: open the email from eFileCA, click the link, then press \"I've activated my account\" below." };
  }
  if (/log ?in|create.*account/i.test(s.title)) {
    if (!s.action(/continue/i)) return { ok: false, step: s.title, problem: "Log in to eFileCA first." };
    await s.next();
  }
  if (/filing type/i.test(s.title)) { await s.choose(/filing.?type/i, /new case/i); await s.next(); }
  if (/case category/i.test(s.title)) { await s.chooseWith(/case.?category/i, pickFamilyCategory, "Family case category"); await s.next(); }
  if (/case type/i.test(s.title)) {
    await s.chooseWith(/case.?type/i, (o) => pickDvCaseType(o, p.minorChildren), "domestic violence case type");
    await s.next();
  }
  if (/parties/i.test(s.title)) { await fillParties(s, p); await s.next(); }
  if (!/filing entries/i.test(s.title)) return { ok: false, step: s.title, problem: "Unexpected screen before the forms." };
  return { ok: true, step: s.title };
}

/**
 * Stage 2b: add one form as a confidential filing entry. `copy` is 1 for the
 * first form with this description, 2 for the second (e.g. INT-300 twice), so a
 * retry never adds a form that is already there. Returns timings for tuning.
 */
export async function addForm(
  token: string,
  doc: FillInput["documents"][number],
  copy = 1,
): Promise<{ added: boolean; ms: { total: number; upload: number; processing: number }; bytes: number }> {
  const t0 = Date.now();
  const spec = specFor(doc.form);
  if (!spec) throw new Error(`no filing code set for ${doc.form}`);
  const description = spec.description.slice(0, 100);
  const bytes = Buffer.from(doc.contentBase64, "base64").length;
  const s = new Session(token);
  await s.resume();
  await s.waitFor(() => (/filing entries/i.test(s.title) && s.action(/add filing entry/i)) || undefined, "the filing entries list");
  const have = s.blocks.filter((b: Block) => s.data(b, /^filing code$/i) !== undefined && s.data(b, /^document 1$/i) && s.data(b, /^description$/i) === description).length;
  if (have >= copy) return { added: false, ms: { total: Date.now() - t0, upload: 0, processing: 0 }, bytes };

  const before = s.blocks.length;
  await s.pressAction(/add filing entry/i);
  await s.waitFor(() => s.field(/filing.?code/i), "the filing code field");
  await s.chooseWith(/filing.?code/i, (o) => pickFilingCode(o, spec.codes), `filing code for ${doc.form}`);
  await s.set(/^description$/i, description);
  await s.pressAction(/save/i);
  const card = await s.waitFor(() => (s.blocks.length > before ? s.blocks[s.blocks.length - 1] : undefined), `${doc.form} entry`);
  await s.press(s.blockAction(card, /^edit$/i));
  const docCard = await s.waitFor(() => s.blocks.find((b: Block) => s.data(b, /^document$/i) !== undefined), "the document card");
  await s.press(s.blockAction(docCard, /edit/i));
  await s.waitFor(() => s.field(/security/i), "the document form");
  await s.choose(/security/i, SECURITY);
  await s.set(/^description$/i, doc.form);
  const tUp = Date.now();
  await s.set(/^document$/i, { file_name: doc.fileName, content_type: "application/pdf", content: doc.contentBase64, size_bytes: bytes });
  const upload = Date.now() - tUp;
  const tProc = Date.now();
  await s.pressAction(/save/i); // document
  await s.waitFor(() => (/filing entry/i.test(s.title) && s.action(/save/i)) || undefined, "the entry form");
  await s.pressAction(/save/i); // entry
  const processing = Date.now() - tProc;
  const errs = s.errors();
  if (errs.length) throw new Error(`${doc.form}: ${errs.join("; ")}`);
  return { added: true, ms: { total: Date.now() - t0, upload, processing }, bytes };
}

/**
 * Stage 2c: leave the filing entries list, skip e-service, pay with a fee waiver
 * (DV filings are free), and stop on "Review fees" once it shows $0.00. The
 * disclaimers, final review and Submit are hers to do.
 */
export async function finishCase(token: string): Promise<{ ok: true; step: string; total: string } | { ok: false; step: string; problem: string }> {
  const s = new Session(token);
  await s.resume();
  if (/filing entries/i.test(s.title)) {
    await s.waitFor(() => (/filing entries/i.test(s.title) && s.primary()) || undefined, "the filing entries list");
    await s.next();
  }
  if (/service/i.test(s.title)) await s.next(); // no e-service: the sheriff or a server serves
  if (/payment account/i.test(s.title)) await payWithFeeWaiver(s);
  if (!/review fees/i.test(s.title)) return { ok: false, step: s.title, problem: "Unexpected screen; finish it on the filing screen below." };
  const total = feeTotal(s);
  if (total !== "$0.00") return { ok: false, step: s.title, problem: `The fees show ${total ?? "an unknown total"} instead of $0.00.` };
  return { ok: true, step: s.title, total };
}

/** Rhetoric's fee waiver payment method zeroes all eFileCA fees. Reuse hers if she has one. */
const WAIVER = /fee waiver/i;
async function payWithFeeWaiver(s: Session) {
  const waiverIn = () => (s.field(/payment.?account/i)?.options ?? []).find((o: { label: string }) => WAIVER.test(o.label));
  if (!waiverIn()) {
    await s.pressAction(/add payment method/i);
    await s.waitFor(() => s.field(/payment.?type|payment method/i), "the payment method form");
    await s.choose(/payment.?type|payment method/i, WAIVER);
    await s.set(/account.?name|nickname/i, "Fee waiver");
    await s.pressAction(/^add$/i);
    await s.waitFor(() => waiverIn(), "the fee waiver account");
  }
  const acct = s.field(/payment.?account/i);
  const waiver = waiverIn();
  if (acct.value !== waiver.value) await s.apply({ kind: "set_field", field: acct.key, value: waiver.value });
  await s.next();
}

/** "Total: $0.00" from the fees screen. */
function feeTotal(s: Session): string | undefined {
  for (const b of s.blocks) for (const i of b.items || []) {
    const t = i.kind === "text" ? i.text : i.kind === "data" ? `${i.label}: ${i.value}` : "";
    const m = /total:?\s*(\$[\d,]+\.\d{2})/i.exec(t ?? "");
    if (m) return m[1];
  }
  return undefined;
}

/** All of stage 2 in one call (used by the test script). */
export async function fillAfterLogin(token: string, p: FillInput): Promise<FillResult> {
  const prep = await prepareCase(token, p);
  if (!prep.ok) return prep;
  const filed: string[] = [];
  const seen: Record<string, number> = {};
  for (const doc of p.documents) {
    const key = specFor(doc.form)?.description ?? doc.form;
    seen[key] = (seen[key] ?? 0) + 1;
    await addForm(token, doc, seen[key]);
    filed.push(doc.form);
  }
  const end = await finishCase(token);
  return end.ok ? { ok: true, step: end.step, filed } : end;
}

export async function fillParties(s: Session, p: Pick<CaseInput, "petitioner" | "respondent">) {
  const done = new Set<string>();
  for (let guard = 0; guard < 8; guard++) {
    const card = s.blocks.find((b: Block) => s.data(b, /party type/i) && !done.has(b.id));
    if (!card) break;
    const who = /protected/i.test(s.data(card, /party type/i) ?? "") ? p.petitioner : p.respondent;
    done.add(card.id);
    await s.press(s.blockAction(card, /^edit$/i));
    await s.choose(/party.?kind/i, /individual/i);
    await s.set(/first.?name/i, who.first);
    if (who.middle) await s.set(/middle.?name/i, who.middle);
    await s.set(/last.?name/i, who.last);
    await s.press(s.action(/save/i));
    if (/edit party/i.test(s.title)) throw new Error(`party not saved: ${s.errors().join("; ")}`);
  }
  const prot = s.blocks.find((b: Block) => /protected/i.test(s.data(b, /party type/i) ?? ""));
  if (prot && !/yes/i.test(s.data(prot, /filer/i) ?? "")) await s.press(s.blockAction(prot, /set as filer/i));
}

/**
 * A readable message for a failed Rhetoric call. The SDK's errors say only
 * "transport error"; the reason (e.g. "unexpected status code: 401") is in
 * `cause`. Logged to Vercel's runtime logs without any filing data.
 */
export function describeError(err: unknown, where: string): string {
  const e = err as { message?: string; cause?: { message?: string } } | undefined;
  const msg = [e?.message, e?.cause?.message].filter(Boolean).join(": ") || "unknown error";
  console.error(`[rhetoric ${where}] ${msg}`);
  return msg;
}
