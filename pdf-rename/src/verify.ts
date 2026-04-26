/**
 * verify.ts — sanity-check that an applied PDF actually has the expected names.
 *
 * Usage:
 *   npm run verify -- <renamed.pdf> <mapping.json>
 *
 * Prints a diff: which proposed names made it into the PDF, and which didn't.
 */

import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { extractWidgets, type MappingEntry } from './lib.ts';

async function main() {
  const [, , pdfArg, mappingArg] = process.argv;
  if (!pdfArg || !mappingArg) {
    console.error('usage: npm run verify -- <renamed.pdf> <mapping.json>');
    process.exit(1);
  }
  const pdfBytes = new Uint8Array(await readFile(resolve(pdfArg)));
  const mapping = JSON.parse(await readFile(resolve(mappingArg), 'utf8')) as MappingEntry[];

  const widgets = await extractWidgets(pdfBytes);
  const actualNames = new Set(widgets.map(w => w.current.split('.').pop() ?? w.current));

  let ok = 0;
  const missing: MappingEntry[] = [];
  for (const e of mapping) {
    if (e.status === 'skip') continue;
    const leaf = e.proposed.split('.').pop() ?? e.proposed;
    if (actualNames.has(leaf)) ok++;
    else missing.push(e);
  }

  console.log(`renamed-OK : ${ok} / ${mapping.filter(e => e.status !== 'skip').length}`);
  if (missing.length) {
    console.log(`MISSING (first 10):`);
    for (const m of missing.slice(0, 10)) {
      console.log(`  p${m.page} ${m.current!} -> ${m.proposed} (NOT FOUND)`);
    }
  }
}

main().catch(err => { console.error(err); process.exit(1); });
