/**
 * One-off: dump all AcroForm field names from public/tier2.pdf (pdf-lib).
 */
import { readFileSync } from "node:fs";
import path from "node:path";

import { PDFDocument, type PDFField } from "pdf-lib";

/** Run from repo root: `npm run dump-fields` */
const ROOT = process.cwd();
const PDF_PATH = path.join(ROOT, "public", "tier2.pdf");
const MAPPING_PATH = path.join(ROOT, "pdf-rename", "tier2.mapping.json");

type MappingEntry = {
  page: number;
  status: string;
  current: string;
  proposed: string;
};

function resolvePage1Based(doc: PDFDocument, field: PDFField): number | undefined {
  const acro = field.acroField as unknown as {
    getWidgets?: () => Array<{ P?: () => { tag: string } | undefined }>;
  };
  if (typeof acro.getWidgets !== "function") return undefined;
  const widgets = acro.getWidgets();
  const pRef = widgets[0]?.P?.();
  if (!pRef) return undefined;
  const pages = doc.getPages();
  for (let i = 0; i < pages.length; i++) {
    if (pages[i]!.ref.tag === pRef.tag) return i + 1;
  }
  return undefined;
}

function mappingActualName(e: MappingEntry): string {
  return e.status === "skip" ? e.current : e.proposed;
}

async function main(): Promise<void> {
  const bytes = readFileSync(PDF_PATH);
  const pdfDoc = await PDFDocument.load(bytes);
  const form = pdfDoc.getForm();
  const fields = form.getFields();

  type Row = { name: string; type: string; page?: number };
  const rows: Row[] = [];

  for (const field of fields) {
    const page = resolvePage1Based(pdfDoc, field);
    rows.push({
      name: field.getName(),
      type: field.constructor.name,
      page,
    });
  }

  const byPage = new Map<number, Row[]>();
  const unknown: Row[] = [];
  for (const r of rows) {
    if (r.page === undefined) {
      unknown.push(r);
      continue;
    }
    const list = byPage.get(r.page) ?? [];
    list.push(r);
    byPage.set(r.page, list);
  }

  const sortedPages = [...byPage.keys()].sort((a, b) => a - b);

  console.log(`=== tier2.pdf AcroForm fields (grouped by page, 1-based) ===\n`);
  for (const p of sortedPages) {
    console.log(`--- Page ${p} ---`);
    for (const r of byPage.get(p)!.sort((a, b) => a.name.localeCompare(b.name))) {
      console.log(`${r.name}\t${r.type}\tpage=${p}`);
    }
    console.log("");
  }
  if (unknown.length) {
    console.log(`--- Page unknown (no widget /P) ---`);
    for (const r of unknown.sort((a, b) => a.name.localeCompare(b.name))) {
      console.log(`${r.name}\t${r.type}\tpage=?`);
    }
    console.log("");
  }

  console.log(`Total fields: ${fields.length}`);

  // Cross-check with pdf-rename mapping (actual name in PDF after renames).
  const raw = readFileSync(MAPPING_PATH, "utf8");
  const mapping = JSON.parse(raw) as MappingEntry[];
  const expected = new Set<string>();
  for (const e of mapping) {
    expected.add(mappingActualName(e));
  }
  const actual = new Set(rows.map((r) => r.name));

  const missingInPdf = [...expected].filter((n) => !actual.has(n)).sort();
  const extraInPdf = [...actual].filter((n) => !expected.has(n)).sort();

  console.log(`\n=== Cross-check vs pdf-rename/tier2.mapping.json ===`);
  console.log(`Mapping entries: ${mapping.length}`);
  console.log(`Unique names from mapping (status-aware): ${expected.size}`);
  console.log(`Names in PDF: ${actual.size}`);
  if (missingInPdf.length) {
    console.log(`\nIn mapping but not in PDF (${missingInPdf.length}):`);
    for (const n of missingInPdf) console.log(`  - ${n}`);
  } else {
    console.log(`\nIn mapping but not in PDF: none`);
  }
  if (extraInPdf.length) {
    console.log(`\nIn PDF but not in mapping (${extraInPdf.length}):`);
    for (const n of extraInPdf) console.log(`  + ${n}`);
  } else {
    console.log(`\nIn PDF but not in mapping: none`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
