/**
 * apply.ts — take the reviewed mapping JSON and rename fields in the PDF.
 *
 * Usage:
 *   npm run apply -- <input.pdf> <mapping.json> <output.pdf>
 *
 * Implementation notes:
 *   - We rename the field's /T entry directly on the field dict (not the
 *     widget). Sibling widgets that share a parent inherit the new name.
 *   - We do NOT touch /T entries on widget-only "kid" annotations
 *     (kids that exist purely to position a button), since those are
 *     option values like "/Yes" — renaming them changes the widget's
 *     behavior, not its name.
 *   - If two entries point at the same root field (e.g. an Acrobat-grouped
 *     parent with multiple kids), we only rename the parent once and skip
 *     the duplicates with a warning.
 */

import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { PDFDocument, PDFName, PDFRef, PDFArray, PDFDict, PDFString, PDFHexString } from 'pdf-lib';
import type { MappingEntry } from './lib';
import { isCleanSnake } from './lib';

async function main() {
  const [, , inputArg, mappingArg, outputArg] = process.argv;
  if (!inputArg || !mappingArg || !outputArg) {
    console.error('usage: npm run apply -- <input.pdf> <mapping.json> <output.pdf>');
    process.exit(1);
  }
  const pdfBytes = new Uint8Array(await readFile(resolve(inputArg)));
  const mapping = JSON.parse(await readFile(resolve(mappingArg), 'utf8')) as MappingEntry[];

  // Validate the mapping before touching anything.
  const errors: string[] = [];
  const seen = new Set<string>();
  for (const e of mapping) {
    if (e.status === 'skip') continue;
    if (!isCleanSnake(e.proposed.split('.').pop() ?? e.proposed)) {
      errors.push(`${e.id}: proposed name "${e.proposed}" is not snake_case`);
    }
    if (seen.has(e.proposed)) {
      errors.push(`${e.id}: proposed name "${e.proposed}" collides with a previous entry`);
    }
    seen.add(e.proposed);
  }
  if (errors.length) {
    console.error(`Mapping has ${errors.length} validation error(s):`);
    for (const m of errors.slice(0, 10)) console.error('  ' + m);
    process.exit(2);
  }

  const doc = await PDFDocument.load(pdfBytes, { ignoreEncryption: true });

  // Build a map: current widget rect+page -> mapping entry. We re-walk widgets
  // so we can resolve the actual PDFRef of the field whose /T we'll rewrite.
  const renamed = new Set<string>(); // PDFRef.tag of fields we've already renamed
  let renameCount = 0;
  let skipCollisionCount = 0;
  let notFoundCount = 0;

  const pages = doc.getPages();
  // Build an index of mapping entries by (page, rect-key) for lookup
  const byKey = new Map<string, MappingEntry>();
  for (const e of mapping) {
    if (e.status === 'skip') continue;
    byKey.set(rectKey(e.page, e.rect), e);
  }

  pages.forEach((page, pageIdx) => {
    const annotsRef = page.node.get(PDFName.of('Annots'));
    const annots = annotsRef instanceof PDFArray
      ? annotsRef
      : (annotsRef ? page.node.context.lookup(annotsRef as PDFRef, PDFArray) : null);
    if (!annots) return;

    for (let i = 0; i < annots.size(); i++) {
      const annotEntry = annots.get(i);
      const annot = annotEntry instanceof PDFDict
        ? annotEntry
        : page.node.context.lookup(annotEntry as PDFRef, PDFDict);
      if (!annot) continue;
      if (annot.get(PDFName.of('Subtype'))?.toString() !== '/Widget') continue;

      const rectRaw = annot.get(PDFName.of('Rect'));
      if (!(rectRaw instanceof PDFArray) || rectRaw.size() < 4) continue;
      const rect: [number, number, number, number] = [
        (rectRaw.get(0) as any).asNumber(),
        (rectRaw.get(1) as any).asNumber(),
        (rectRaw.get(2) as any).asNumber(),
        (rectRaw.get(3) as any).asNumber(),
      ];

      const entry = byKey.get(rectKey(pageIdx + 1, rect));
      if (!entry) continue;

      // Find the field-bearing dict: the closest ancestor that has /T.
      // For Acrobat-style flat fields that's the widget itself.
      let target: PDFDict = annot;
      let targetRef: PDFRef | null = annotEntry instanceof PDFRef ? annotEntry : null;
      while (target && !target.get(PDFName.of('T'))) {
        const parentRef = target.get(PDFName.of('Parent'));
        if (!parentRef) break;
        if (parentRef instanceof PDFDict) {
          target = parentRef;
          targetRef = null;
        } else {
          targetRef = parentRef as PDFRef;
          target = annot.context.lookup(parentRef as PDFRef, PDFDict)!;
        }
      }
      if (!target || !target.get(PDFName.of('T'))) {
        notFoundCount++;
        continue;
      }

      const tag = targetRef ? targetRef.tag : `inline-${pageIdx}-${i}`;
      if (renamed.has(tag)) {
        skipCollisionCount++;
        continue;
      }
      renamed.add(tag);

      // Take only the leaf segment of the proposed name.
      const leaf = entry.proposed.split('.').pop() ?? entry.proposed;
      target.set(PDFName.of('T'), PDFString.of(leaf));
      renameCount++;
    }
  });

  const out = await doc.save();
  await writeFile(resolve(outputArg), out);

  console.log(`Wrote ${outputArg}`);
  console.log(`  renamed       : ${renameCount}`);
  console.log(`  skipped (parent already renamed): ${skipCollisionCount}`);
  console.log(`  not found     : ${notFoundCount}`);
}

function rectKey(page: number, rect: [number, number, number, number]): string {
  // Round to 0.01pt to absorb float jitter between read and apply runs.
  const r = rect.map(v => Math.round(v * 100) / 100);
  return `${page}|${r.join(',')}`;
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
