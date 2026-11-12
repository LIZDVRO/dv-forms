/**
 * Offline check of the e-filing bot against a simulated Rhetoric session
 * (screens modelled on the test and live systems). No network.
 *   npx tsx scripts/sim-rhetoric.test.ts
 */
import { addForm, checkAnswered, finishCase, pickFilingCode, FORM_FILING, prepareCase } from "../src/efile/rhetoric";

type Opt = { value: string; label: string };
interface Fld { key: string; label: string; kind: "field"; options?: Opt[]; value?: unknown }
const fld = (key: string, label: string, options?: string[], value?: unknown): Fld => ({ key, label, kind: "field", options: options?.map((l, i) => ({ value: `v${i}`, label: l })), value });

interface Entry { code?: string; desc?: string; doc?: string; security?: string }
function makeCourt(opts: { codes: string[]; security: string[]; securityDefault?: number }) {
  const st = { screen: "type", entries: [] as Entry[], editing: -1, parties: { p: "", r: "" }, editingParty: "", filer: "r", waiver: false, fields: {} as Record<string, unknown>, v: 0 };
  const parties = () => [
    { id: "p", items: [{ kind: "data", label: "Party type", value: "Protected Party" }, { kind: "data", label: "Name", value: st.parties.p }, { kind: "data", label: "Filer", value: st.filer === "p" ? "Yes" : "No" }], actions: [{ action_id: "edit-p", label: "Edit" }, { action_id: "filer-p", label: "Set as filer" }] },
    { id: "r", items: [{ kind: "data", label: "Party type", value: "Restrained Party" }, { kind: "data", label: "Name", value: st.parties.r }], actions: [{ action_id: "edit-r", label: "Edit" }] },
  ];
  const form = (): unknown => {
    const F = st.fields;
    const val = (k: string) => F[k];
    switch (st.screen) {
      case "type": return { title: "Choose a filing type", blocks: [{ items: [fld("filing_type", "Filing type", ["New case", "Existing case"], val("filing_type"))] }], actions: [{ action_id: "next", label: "Next", primary: true }] };
      case "cat": return { title: "Select a case category", blocks: [{ items: [fld("cat", "Case category", ["Family - DCSS", "Family", "Civil Restraining Order"], val("cat"))] }], actions: [{ action_id: "next", label: "Next", primary: true }] };
      case "ctype": return { title: "Select a case type", blocks: [{ items: [fld("ctype", "Case type", ["DV Prevention w/ Minor Children", "DV Prevention w/o Minor Children"], val("ctype"))] }], actions: [{ action_id: "next", label: "Next", primary: true }] };
      case "parties": return { title: "Parties", blocks: parties(), actions: [{ action_id: "next", label: "Next", primary: true }] };
      case "party": return { title: "Edit party", blocks: [{ items: [{ kind: "data", label: "Party type", value: st.editingParty === "p" ? "Protected Party" : "Restrained Party" }, fld("kind", "Party kind", ["Individual", "Business"], val("kind")), fld("first", "First name", undefined, val("first")), fld("middle", "Middle name", undefined, val("middle")), fld("last", "Last name", undefined, val("last"))] }], actions: [{ action_id: "save", label: "Save" }] };
      case "list": return { title: "Filing entries", blocks: st.entries.map((e, i) => ({ id: `e${i}`, items: [{ kind: "data", label: "Filing code", value: e.code }, { kind: "data", label: "Description", value: e.desc }, ...(e.doc ? [{ kind: "data", label: "Document 1", value: e.doc }] : [])], actions: [{ action_id: `edit-e${i}`, label: "Edit" }] })), actions: [{ action_id: "add", label: "Add filing entry" }, { action_id: "next", label: "Next", primary: true }] };
      case "add": return { title: "Add filing entry", blocks: [{ items: [fld("code", "Filing code", opts.codes, val("code")), fld("desc", "Description", undefined, val("desc"))] }], actions: [{ action_id: "save", label: "Save" }, { action_id: "cancel", label: "Cancel" }] };
      case "entry": return { title: "Edit filing entry", blocks: [{ id: "d", items: [{ kind: "data", label: "Document", value: st.entries[st.editing].doc ?? "" }], actions: [{ action_id: "edit-doc", label: "Edit" }] }], actions: [{ action_id: "save", label: "Save" }] };
      case "doc": return { title: "Edit document", blocks: [{ items: [fld("comp", "Filing component", ["Lead Document"], val("comp") ?? "v0"), fld("sec", "Security", opts.security, val("sec") ?? (opts.securityDefault !== undefined ? `v${opts.securityDefault}` : undefined)), fld("ddesc", "Description", undefined, val("ddesc")), fld("file", "Document", undefined, val("file"))] }], actions: [{ action_id: "save", label: "Save" }] };
      case "service": return { title: "Service contacts", blocks: [], actions: [{ action_id: "next", label: "Next", primary: true }] };
      case "pay": return { title: "Payment account", blocks: [{ items: [fld("acct", "Payment account", st.waiver ? ["Fee waiver"] : [], val("acct"))] }], actions: [{ action_id: "addpm", label: "Add payment method" }, { action_id: "next", label: "Next", primary: true }] };
      case "addpm": return { title: "Add payment method", blocks: [{ items: [fld("ptype", "Payment type", ["Credit card", "Bank account", "Fee waiver"], val("ptype")), fld("nick", "Nickname", undefined, val("nick"))] }], actions: [{ action_id: "addbtn", label: "Add" }] };
      case "fees": return { title: "Review fees", blocks: [{ items: [{ kind: "text", text: "Total: $0.00" }] }], actions: [{ action_id: "next", label: "Next", primary: true }] };
    }
  };
  const lbl = (k: string) => { const f = (form() as { blocks: { items: Fld[] }[] }).blocks.flatMap((b) => b.items).find((i) => i.key === k); return f?.options?.find((o) => o.value === st.fields[k])?.label; };
  const act = (id: string) => {
    const F = st.fields; const go = (s: string) => { st.screen = s; st.fields = {}; };
    switch (st.screen) {
      case "type": if (lbl("filing_type") === "New case") go("cat"); return;
      case "cat": if (F.cat) go("ctype"); return;
      case "ctype": if (F.ctype) go("parties"); return;
      case "parties":
        if (id === "edit-p" || id === "edit-r") { st.editingParty = id.slice(5); go("party"); }
        else if (id === "filer-p") st.filer = "p";
        else if (id === "next" && st.parties.p && st.parties.r) go("list");
        return;
      case "party": if (id === "save" && F.first && F.last && F.kind) { st.parties[st.editingParty as "p" | "r"] = `${F.first} ${F.last}`; go("parties"); } return;
      case "list":
        if (id === "add") go("add");
        else if (id.startsWith("edit-e")) { st.editing = Number(id.slice(6)); go("entry"); }
        else if (id === "next") go("service");
        return;
      case "add": if (id === "save" && F.code && F.desc) { st.entries.push({ code: lbl("code"), desc: String(F.desc) }); go("list"); } return;
      case "entry":
        if (id === "edit-doc") go("doc");
        else if (id === "save") { st.editing = -1; go("list"); }
        return;
      case "doc": {
        const sec = F.sec ?? (opts.securityDefault !== undefined ? `v${opts.securityDefault}` : undefined);
        if (id === "save" && F.file && sec) {
          const e = st.entries[st.editing]; e.doc = (F.file as { file_name: string }).file_name; e.security = opts.security[Number(String(sec).slice(1))];
          go("entry");
        }
        return;
      }
      case "service": go("pay"); return;
      case "pay": if (id === "addpm") go("addpm"); else if (id === "next" && lbl("acct") === "Fee waiver") go("fees"); return;
      case "addpm": if (id === "addbtn" && lbl("ptype") === "Fee waiver") { st.waiver = true; go("pay"); } return;
    }
  };
  const fetchMock = async (url: string, init: { body: string }) => {
    const body = JSON.parse(init.body);
    if (url.endsWith("/apply-filing-session-event")) {
      const ev = body.event;
      if (ev.kind === "set_field") st.fields[ev.field] = ev.value;
      if (ev.kind === "action") act(ev.action_id);
    }
    st.v++;
    return { ok: true, json: async () => ({ result: "ok", state_version: st.v, form: form() }) } as unknown as Response;
  };
  return { st, fetchMock, pick: (key: string, label: string) => { const f = (form() as { blocks: { items: Fld[] }[] }).blocks.flatMap((b) => b.items).find((i) => i.key === key)!; st.fields[key] = f.options!.find((o) => o.label === label)!.value; } };
}

const pdf = Buffer.from("%PDF-1.4 test").toString("base64");
const docs = ["DV-100", "DV-109", "DV-110", "CLETS-001"].map((form) => ({ form, fileName: `${form}.pdf`, contentBase64: pdf }));
const names = { petitioner: { first: "Pat", last: "Doe" }, respondent: { first: "Rob", last: "Roe" } };
let failed = 0;
const check = (ok: boolean, what: string) => { console.log(`${ok ? "PASS" : "FAIL"}  ${what}`); if (!ok) failed++; };

async function run() {
  // 1. Los Angeles: security None / FL_General Family Law (preselected). Should file everything.
  {
    const c = makeCourt({ codes: ["DV w/o Minor Child - New Case Petition", "Proposed Form 109 - Notice - Court Hearing", "Proposed Form 110 Temporary Restraining Order", "CLETS001 - Confidential CLETS Information", "Declaration"], security: ["None", "FL_General Family Law"], securityDefault: 1 });
    globalThis.fetch = c.fetchMock as unknown as typeof fetch;
    const prep = await prepareCase("t", { minorChildren: false, ...names });
    check(prep.ok && c.st.screen === "list", "LA: case set up, on the filing entries list");
    check(c.st.filer === "p" && c.st.parties.p === "Pat Doe" && c.st.parties.r === "Rob Roe", "LA: both parties named, protected party is filer");
    for (const d of docs) { const r = await addForm("t", d, 1); check(r.ok && "added" in r && r.added, `LA: ${d.form} added`); }
    check(c.st.entries.length === 4 && c.st.entries.every((e) => e.security === "FL_General Family Law" && e.doc), "LA: 4 entries, each with its PDF, security FL_General Family Law");
    const again = await addForm("t", docs[0], 1);
    check(again.ok && "added" in again && !again.added && c.st.entries.length === 4, "LA: a retry never adds a form twice");
    const end = await finishCase("t");
    check(end.ok && c.st.screen === "fees", "LA: fee waiver added, stops on Review fees at $0.00");
  }
  // 2. A court offering Confidential: it is chosen over everything else.
  {
    const c = makeCourt({ codes: ["Petition", "Request", "Order", "Notice", "CLETS-001"], security: ["None", "Public", "Confidential"] });
    globalThis.fetch = c.fetchMock as unknown as typeof fetch;
    await prepareCase("t", { minorChildren: true, ...names });
    await addForm("t", docs[0], 1);
    check(c.st.entries[0]?.security === "Confidential", "Confidential is chosen when offered");
  }
  // 3. A court whose filing codes match nothing: hand off to her, keep going after she picks, reuse her pick.
  {
    const c = makeCourt({ codes: ["Zebra Filing", "Unicorn Paper"], security: ["None", "Sealed"] });
    globalThis.fetch = c.fetchMock as unknown as typeof fetch;
    await prepareCase("t", { minorChildren: false, ...names });
    const r = await addForm("t", docs[0], 1);
    check(!r.ok && "needs" in r && r.needs.field === "Filing code" && c.st.screen === "add", "No matching code: waits for her on the filing code (nothing broken)");
    check(!!(c.st.fields.desc), "  ...with the description already filled in");
    const before = await checkAnswered("t", "Add filing entry", "Filing code");
    check(!before.answered, "  check: not answered yet");
    c.pick("code", "Unicorn Paper"); // she picks on Rhetoric's screen
    const after = await checkAnswered("t", "Add filing entry", "Filing code");
    check(after.answered && after.choice?.label === "Unicorn Paper", "  check: sees her pick");
    const answers = { [after.choice!.field]: after.choice!.label };
    const r2 = await addForm("t", docs[0], 1, answers);
    check(r2.ok && c.st.entries[0]?.doc === "DV-100.pdf" && c.st.entries[0]?.security === "Sealed", "  after her pick: entry finished with its PDF; security 'Sealed' (anything but None)");
    const r3 = await addForm("t", docs[1], 1, answers);
    check(r3.ok && c.st.entries[1]?.code === "Unicorn Paper", "  her pick is reused for the next form, no second question");
  }
  // 4. A screen the bot has never seen: hand the screen to her, then carry on.
  {
    const c = makeCourt({ codes: ["Petition"], security: ["Confidential"] });
    globalThis.fetch = c.fetchMock as unknown as typeof fetch;
    c.st.screen = "type";
    const realFetch = c.fetchMock;
    let surprise = true;
    globalThis.fetch = (async (url: string, init: { body: string }) => {
      const res = await realFetch(url, init);
      const j = await res.json();
      if (surprise && j.form.title === "Select a case category") j.form = { title: "Tell us about yourself", blocks: [{ items: [fld("x", "Mystery question", undefined)] }], actions: [{ action_id: "next", label: "Next", primary: true }] };
      return { ok: true, json: async () => j } as unknown as Response;
    }) as unknown as typeof fetch;
    const r = await prepareCase("t", { minorChildren: false, ...names });
    check(!r.ok && "needs" in r && r.needs.screen === "Tell us about yourself" && r.needs.field === null, "Unknown screen: hands that screen to her");
    surprise = false; // she finished it
    const r2 = await prepareCase("t", { minorChildren: false, ...names });
    check(r2.ok, "  after she finishes it: case setup carries on to the forms");
  }
  // 5. Codes split by children (LA): the petition code matches the case type.
  {
    const la = ["DV w/ Minor Child - New Case Petition", "DV w/o Minor Child - New Case Petition", "Declaration"].map((label) => ({ label }));
    check(pickFilingCode(la, FORM_FILING["DV-100"].codes, false)?.label === "DV w/o Minor Child - New Case Petition", "LA DV-100, no children: the w/o petition code");
    check(pickFilingCode(la, FORM_FILING["DV-100"].codes, true)?.label === "DV w/ Minor Child - New Case Petition", "LA DV-100, with children: the w/ petition code");
    const onlyWith = ["DV w/ Minor Child - New Case Petition", "PETITION"].map((label) => ({ label }));
    check(pickFilingCode(onlyWith, FORM_FILING["DV-100"].codes, false)?.label === "PETITION", "Only a w/ code exists, no children: falls back to the plain Petition code");
  }
  console.log(failed ? `\n${failed} FAILED` : "\nALL PASSED");
  process.exit(failed ? 1 : 0);
}
run().catch((e) => { console.error(e); process.exit(1); });
