/**
 * Fills sample cases and checks the bindings against
 * docs/field-map/dvro_field_map.json.
 *
 *   npx tsx scripts/check-wizard.ts [outDir]
 *
 * Fails (exit 1) if a binding names a field that does not exist, or if a
 * field the map marks as petitioner-filled has no binding (except the
 * items the wizard leaves out on purpose). Writes two sample packets:
 * outDir/a (supervised visits, abduction) and outDir/b (children lived
 * apart, unsupervised visits).
 */
import fs from "node:fs";
import path from "node:path";

import { ALL_FORMS, buildFilingPacket } from "../src/wizard/fill/packet";
import { qualify } from "../src/wizard/fill/engine";
import { sampleAnswers, sampleAnswersB } from "../src/wizard/sample";

const outDir = process.argv[2] ?? "tmp-packet";
const map = JSON.parse(fs.readFileSync("docs/field-map/dvro_field_map.json", "utf8"));

// Nothing is skipped now; kept for items deliberately left out later.
const SKIPPED = /^$/;

async function main() {
  let failed = false;

  for (const spec of ALL_FORMS) {
    const bound = new Set(spec.bindings.map((x) => qualify(spec.root, x.f)));
    spec.after?.({ sheets: [], pages: 0 }).forEach((x) => bound.add(qualify(spec.root, x.f)));
    const fields: { name: string; kind: string }[] = map.forms[spec.id].fields;
    const names = new Set(fields.map((f) => f.name));
    const unknown = [...bound].filter((n) => !names.has(n));
    const unbound = fields
      .filter((f) => (f.kind === "question" || f.kind === "derived") && !bound.has(f.name) && !SKIPPED.test(f.name))
      .map((f) => f.name);
    console.log(`${spec.id}: ${bound.size} bindings, ${unknown.length} unknown, ${unbound.length} petitioner fields unbound`);
    if (unknown.length) console.log("  unknown:", unknown);
    if (unbound.length) console.log("  unbound:", unbound);
    if (unknown.length || unbound.length) failed = true;
  }

  const cases = { a: sampleAnswers(), b: sampleAnswersB() };
  for (const [name, a] of Object.entries(cases)) {
    a.orders.O28 = true;
    const packet = await buildFilingPacket(a, async (p) => fs.readFileSync(path.join("public", p)));
    const dir = path.join(outDir, name);
    fs.mkdirSync(dir, { recursive: true });
    for (const f of packet.files) {
      fs.writeFileSync(path.join(dir, f.fileName), f.bytes);
      console.log(`${name}: wrote ${f.fileName} (${f.goesTo})${f.sheetTitles.length ? " + sheets: " + f.sheetTitles.join(", ") : ""}`);
    }
    if (packet.problems.length) {
      console.log(`${name}: problems:`, packet.problems);
      failed = true;
    }
  }
  process.exit(failed ? 1 : 0);
}

main();
