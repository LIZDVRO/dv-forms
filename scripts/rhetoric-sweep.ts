/**
 * READ-ONLY check of every courthouse in src/efile/courts.ts on Rhetoric's TEST
 * system: new case, Family, DV case type (with and without children), parties,
 * then the filing-code list. It opens the "Add filing entry" form only to read the
 * codes, cancels it, and never uploads or submits. One test-key session per court.
 *
 *   RHETORIC_API_KEY=<test key> npx tsx scripts/rhetoric-sweep.ts
 *
 * Asks once for the eFileCA TEST account email and password (hidden). Writes rhetoric-sweep.json
 * and prints a summary per court.
 */
import { writeFileSync } from "node:fs";
import { createInterface } from "node:readline";

import { RhetoricClient } from "@rhetoriclabs/rhetoric";

import { EFILE_COURTS } from "../src/efile/courts";
import { FORM_FILING, Session, fillParties, pickDvCaseType, pickFamilyCategory } from "../src/efile/rhetoric";

const API = process.env.RHETORIC_API_URL || "https://api.rhetoric.law";

function ask(prompt: string): Promise<string> {
  return new Promise((resolve) => {
    const rl = createInterface({ input: process.stdin, output: process.stdout });
    rl.question(prompt, (a) => { rl.close(); resolve(a.trim()); });
  });
}

/** Reads a line without echoing it. */
function askHidden(prompt: string): Promise<string> {
  return new Promise((resolve) => {
    process.stdout.write(prompt);
    const stdin = process.stdin;
    stdin.setRawMode?.(true);
    stdin.resume();
    stdin.setEncoding("utf8");
    let value = "";
    const onData = (chunk: string) => {
      for (const ch of chunk) {
        if (ch === "\r" || ch === "\n") {
          stdin.setRawMode?.(false); stdin.pause(); stdin.off("data", onData);
          process.stdout.write("\n"); resolve(value); return;
        }
        if (ch === "\u0003") { process.stdout.write("\n"); process.exit(130); }
        if (ch === "\u007f" || ch === "\b") value = value.slice(0, -1);
        else value += ch;
      }
    };
    stdin.on("data", onData);
  });
}

/** The code labels our forms need, by the regex FORM_FILING uses. */
const NEEDED = [...new Map(Object.values(FORM_FILING).map((f) => [f.code.source, f.code])).values()];

interface Result {
  county: string; court: string; code: string;
  newCase?: boolean; category?: string;
  caseWith?: string; caseWithout?: string; caseTypes?: string[];
  filingCodes?: string[]; missingCodes?: string[];
  ok: boolean; problem?: string;
}

async function checkCourt(client: RhetoricClient, email: string, password: string, county: string, court: { code: string; label: string }): Promise<Result> {
  const r: Result = { county, court: court.label, code: court.code, ok: false };
  const { filer } = await client.createFiler({});
  const { sessionToken } = await client.createFilingSession({ filerId: filer.id });
  const s = new Session(sessionToken);
  try {
    await s.resume();
    await s.choose(/court.?system/i, /^california$/i); await s.next();
    const courtField = s.field(/^court$/i);
    const listed = (courtField?.options ?? courtField?.search?.results ?? []).some((o: { value: unknown }) => o.value === court.code);
    if (!listed && courtField?.options) { r.problem = "court not in the TEST list (codes differ from live)"; return r; }
    await s.set(/^court$/i, court.code); await s.next();
    if (s.field(/password/i)) {
      await s.set(/^email$/i, email);
      await s.set(/password/i, password);
      await s.press(s.action(/log ?in/i));
      if (s.field(/password/i)) { r.problem = `login failed: ${s.errors().join("; ")}`; return r; }
    }
    if (/log ?in|create.*account/i.test(s.title) && s.action(/continue/i)) await s.next(); // "You're logged in"
    // Filing type
    const ft = s.field(/filing.?type/i);
    const types = (ft?.options ?? []).map((o: { label: string }) => o.label);
    r.newCase = types.some((t: string) => /new case/i.test(t));
    if (!r.newCase) { r.problem = `no "New case" (offered: ${types.join(", ")})`; return r; }
    await s.choose(/filing.?type/i, /new case/i); await s.next();
    // Category
    if (/case category/i.test(s.title)) {
      const opts = s.field(/case.?category/i)?.options ?? [];
      const c = pickFamilyCategory(opts);
      r.category = c?.label;
      if (!c) { r.problem = `no family category (offered: ${opts.map((o: { label: string }) => o.label).join(", ")})`; return r; }
      await s.chooseWith(/case.?category/i, pickFamilyCategory, "Family case category"); await s.next();
    }
    // Case types (record both, choose "without" to continue)
    const ctField = s.field(/case.?type/i);
    let ctOpts = ctField?.options ?? ctField?.search?.results ?? [];
    if (!ctOpts.length && ctField?.search) { await s.apply({ kind: "search", field: ctField.key, query: "" }); ctOpts = s.field(/case.?type/i)?.search?.results ?? []; }
    r.caseTypes = ctOpts.map((o: { label: string }) => o.label).filter((l: string) => /domestic|\bdv\b/i.test(l));
    r.caseWith = pickDvCaseType(ctOpts, true)?.label;
    r.caseWithout = pickDvCaseType(ctOpts, false)?.label;
    if (!r.caseWith || !r.caseWithout) { r.problem = "DV case type not matched"; return r; }
    await s.chooseWith(/case.?type/i, (o) => pickDvCaseType(o, false), "DV case type"); await s.next();
    // Parties: test names only
    if (/parties/i.test(s.title)) await fillParties(s, { petitioner: { first: "Test", last: "Protected" }, respondent: { first: "Test", last: "Restrained" } });
    await s.next();
    if (!/filing entries/i.test(s.title)) { r.problem = `reached "${s.title}" instead of filing entries`; return r; }
    // Filing codes: open the add form, read, cancel
    await s.pressAction(/add filing entry/i);
    const fc = await s.waitFor(() => s.field(/filing.?code/i), "filing code field");
    r.filingCodes = (fc.options ?? fc.search?.results ?? []).map((o: { label: string }) => o.label);
    r.missingCodes = NEEDED.filter((re) => !r.filingCodes!.some((l) => re.test(l))).map((re) => re.source.replace(/[\^$]/g, ""));
    await s.press(s.action(/cancel/i));
    r.ok = r.missingCodes.length === 0;
    if (!r.ok) r.problem = `missing filing codes: ${r.missingCodes.join(", ")}`;
    return r;
  } catch (e) {
    r.problem = e instanceof Error ? e.message : String(e);
    return r;
  }
}

async function main() {
  const key = process.env.RHETORIC_API_KEY?.trim();
  if (!key?.startsWith("ak_test_")) throw new Error("Set RHETORIC_API_KEY to the TEST key (ak_test_…). This check never uses the live key.");
  console.log("Log in with the eFileCA TEST account you used on the staging site.");
  const email = await ask("eFileCA test email: ");
  const password = await askHidden("eFileCA test password (typing stays hidden): ");
  const client = new RhetoricClient({ url: API, token: key });
  const results: Result[] = [];
  for (const [county, c] of Object.entries(EFILE_COURTS)) {
    for (const court of c.courts) {
      process.stdout.write(`${county} — ${court.label} … `);
      const r = await checkCourt(client, email, password, county, court);
      results.push(r);
      console.log(r.ok ? "OK" : `PROBLEM: ${r.problem}`);
      writeFileSync("rhetoric-sweep.json", JSON.stringify(results, null, 2));
    }
  }
  const ok = results.filter((r) => r.ok).length;
  console.log(`\n${ok} of ${results.length} courthouses passed. Details in rhetoric-sweep.json`);
}

main().catch((e) => { console.error(e instanceof Error ? e.message : e); process.exit(1); });
