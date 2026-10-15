/**
 * Fills the stage-1 packet for a sample case and checks the bindings
 * against docs/field-map/dvro_field_map.json.
 *
 *   npx tsx scripts/check-wizard.ts [outDir]
 *
 * Fails (exit 1) if a binding names a field that does not exist, or if a
 * field the map marks as petitioner-filled has no binding (except the
 * items wizard v1 leaves out on purpose).
 */
import fs from "node:fs";
import path from "node:path";

import { buildFilingPacket, filingForms } from "../src/wizard/fill/packet";
import { qualify } from "../src/wizard/fill/engine";
import { sampleAnswers } from "../src/wizard/sample";

const outDir = process.argv[2] ?? "tmp-packet";
const map = JSON.parse(fs.readFileSync("docs/field-map/dvro_field_map.json", "utf8"));

// DV-100 items wizard v1 does not offer yet (custody and support orders).
const V1_SKIPPED = /^DV-100\[0\]\.Page(8\[0\]\.LIST15|11\[0\]\.List2[456])/;

async function main() {
  const a = sampleAnswers();
  a.orders.O28 = true;
  let failed = false;

  for (const spec of filingForms(a)) {
    const bound = new Set(spec.bindings.map((x) => qualify(spec.root, x.f)));
    spec.after?.({ sheets: [], pages: 0 }).forEach((x) => bound.add(qualify(spec.root, x.f)));
    const fields: { name: string; kind: string }[] = map.forms[spec.id].fields;
    const names = new Set(fields.map((f) => f.name));
    const unknown = [...bound].filter((n) => !names.has(n));
    const unbound = fields
      .filter((f) => (f.kind === "question" || f.kind === "derived") && !bound.has(f.name) && !V1_SKIPPED.test(f.name))
      .map((f) => f.name);
    console.log(`${spec.id}: ${bound.size} bindings, ${unknown.length} unknown, ${unbound.length} petitioner fields unbound`);
    if (unknown.length) console.log("  unknown:", unknown);
    if (unbound.length) console.log("  unbound:", unbound);
    if (unknown.length || unbound.length) failed = true;
  }

  const packet = await buildFilingPacket(a, async (p) => fs.readFileSync(path.join("public", p)));
  fs.mkdirSync(outDir, { recursive: true });
  for (const f of packet.files) {
    fs.writeFileSync(path.join(outDir, f.fileName), f.bytes);
    console.log(`wrote ${f.fileName} (${f.goesTo})${f.sheetTitles.length ? " + sheets: " + f.sheetTitles.join(", ") : ""}`);
  }
  if (packet.problems.length) {
    console.log("problems:", packet.problems);
    failed = true;
  }
  process.exit(failed ? 1 : 0);
}

main();
