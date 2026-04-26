/**
 * extract.ts — read a fielded PDF and write a JSON mapping for review.
 *
 * Usage:
 *   npm run extract -- <input.pdf> <mapping.json>
 *
 * The mapping JSON is the user-facing review surface. For every widget:
 *   - `current`   = what Acrobat called it
 *   - `proposed`  = our snake_case suggestion (edit this)
 *   - `rationale` = why we picked it
 *   - `confidence`= 0..1; sort or filter by this when reviewing
 *   - `status`    = "skip" if the name is already clean (we leave it alone)
 *
 * Once you've reviewed/edited the JSON, pass it to `apply.ts`.
 */

import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import {
  extractWidgets,
  extractTextByPage,
  proposeName,
  isCleanSnake,
  dedupeProposedNames,
  type MappingEntry,
} from './lib.ts';

async function main() {
  const [, , inputArg, outputArg] = process.argv;
  if (!inputArg || !outputArg) {
    console.error('usage: npm run extract -- <input.pdf> <mapping.json>');
    process.exit(1);
  }
  const inputPath = resolve(inputArg);
  const outputPath = resolve(outputArg);

  const pdfBytes = new Uint8Array(await readFile(inputPath));
  const widgets = await extractWidgets(pdfBytes);
  const textPages = await extractTextByPage(pdfBytes);

  const entries: MappingEntry[] = widgets.map(w => {
    if (isCleanSnake(w.current.split('.').pop() ?? w.current)) {
      return {
        id: w.id,
        page: w.page,
        rect: w.rect,
        type: w.type,
        current: w.current,
        proposed: w.current,
        rationale: 'already clean — left alone',
        confidence: 1,
        status: 'skip',
      };
    }
    const items = textPages[w.page - 1] ?? [];
    const { proposed, rationale, confidence } = proposeName(w, items);
    return {
      id: w.id,
      page: w.page,
      rect: w.rect,
      type: w.type,
      current: w.current,
      proposed,
      rationale,
      confidence,
      status: 'propose',
    };
  });

  dedupeProposedNames(entries);

  // Sort by page, then top-to-bottom (PDF y is bottom-up so sort y desc), then left-to-right.
  entries.sort((a, b) =>
    a.page - b.page ||
    b.rect[3] - a.rect[3] ||
    a.rect[0] - b.rect[0]
  );

  await writeFile(outputPath, JSON.stringify(entries, null, 2));

  // --- summary so the user knows what to focus on ---
  const total = entries.length;
  const skipped = entries.filter(e => e.status === 'skip').length;
  const proposed = entries.filter(e => e.status === 'propose').length;
  const lowConf = entries.filter(e => e.status === 'propose' && e.confidence < 0.5).length;
  console.log(`Wrote ${outputPath}`);
  console.log(`  total widgets : ${total}`);
  console.log(`  already clean : ${skipped}`);
  console.log(`  proposing     : ${proposed}`);
  console.log(`  low-confidence: ${lowConf}  ← review these first`);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
