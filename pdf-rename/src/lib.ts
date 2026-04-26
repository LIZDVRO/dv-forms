/**
 * Shared utilities for the extract → apply pipeline.
 *
 * Three core jobs:
 *   1. Walk widgets out of a PDF (page, rect, type, current name, suffix).
 *   2. Pull positioned text items off each page via pdfjs-dist.
 *   3. Turn (widget + nearby text) into a clean snake_case proposal.
 *
 * The proposal is just a starting point — the user reviews/edits the JSON
 * mapping before it's applied. Keep heuristics conservative; surface
 * confidence so easy wins are obvious and tricky cases are flagged.
 */

import { PDFDocument, PDFName, PDFRef, PDFArray, PDFDict, PDFString } from 'pdf-lib';

// pdfjs-dist legacy build is the safest one for plain Node.
// (The default ESM build assumes a browser worker.)
import * as pdfjs from 'pdfjs-dist/legacy/build/pdf.mjs';

// ---------- types ----------

export type FieldType = 'text' | 'checkbox' | 'radio' | 'choice' | 'signature' | 'unknown';

export interface Widget {
  /** 1-based page number */
  page: number;
  /** [x1, y1, x2, y2] in PDF user space (origin bottom-left) */
  rect: [number, number, number, number];
  /** Original Acrobat-given name (full dotted path if nested) */
  current: string;
  /** Field type, normalized */
  type: FieldType;
  /** "_2", "_4" suffix Acrobat appends when the same label appears multiple times. */
  suffix: string | null;
  /** Stable id we use for review JSON ordering. */
  id: string;
}

export interface TextItem {
  text: string;
  /** [x1, y1, x2, y2] bounding box in PDF user space */
  bbox: [number, number, number, number];
}

export interface MappingEntry {
  id: string;
  page: number;
  rect: [number, number, number, number];
  type: FieldType;
  /** What it's named today */
  current: string;
  /** What we propose to rename it to. User edits this. */
  proposed: string;
  /** Why we picked that name — human-readable. */
  rationale: string;
  /** 0..1; lower = the user should look harder. */
  confidence: number;
  /** "skip" if already clean and we're leaving it alone. */
  status: 'propose' | 'skip' | 'manual';
}

// ---------- name normalization ----------

const CLEAN_NAME = /^[a-z][a-z0-9_]*$/;

export function isCleanSnake(name: string): boolean {
  return CLEAN_NAME.test(name);
}

/** Strip Acrobat's "_2", "_3" disambiguation suffix. Returns [base, suffixOrNull]. */
export function splitAcrobatSuffix(name: string): [string, string | null] {
  const m = name.match(/^(.*?)(_\d+)$/);
  if (!m) return [name, null];
  return [m[1], m[2]];
}

const STOPWORDS = new Set([
  'a', 'an', 'the', 'of', 'to', 'in', 'on', 'for', 'and', 'or', 'is', 'are',
  'was', 'were', 'be', 'been', 'this', 'that', 'these', 'those', 'with',
  'by', 'at', 'as', 'from', 'it', 'its', 'if', 'when', 'where', 'how',
  'do', 'does', 'did', 'will', 'would', 'should', 'may', 'might', 'can',
  'check', 'all', 'apply', 'list', 'describe', 'explain', 'give', 'enter',
  'write', 'fill', 'complete', 'section', 'below', 'above', 'page', 'item',
  'form', 'attach', 'attached', 'optional', 'required',
]);

/** Turn arbitrary label text into a snake_case slug, dropping stopwords. */
export function slug(text: string, opts: { keepStopwords?: boolean } = {}): string {
  const cleaned = text
    .replace(/[^A-Za-z0-9]+/g, ' ')
    .trim()
    .toLowerCase();
  if (!cleaned) return '';
  let words = cleaned.split(/\s+/);
  if (!opts.keepStopwords) {
    const trimmed = words.filter(w => !STOPWORDS.has(w));
    if (trimmed.length > 0) words = trimmed;
  }
  // cap length so names stay legible
  return words.slice(0, 6).join('_');
}

// ---------- widget extraction (pdf-lib) ----------

/**
 * Walk every Widget annotation across every page, capturing rect, type,
 * and the field's full dotted name. We go through annotations (not just
 * getFields()) because Acrobat sometimes leaves option-buttons as siblings
 * with shared suffixes rather than a proper radio-group parent.
 */
export async function extractWidgets(pdfBytes: Uint8Array): Promise<Widget[]> {
  const doc = await PDFDocument.load(pdfBytes, { ignoreEncryption: true });
  const widgets: Widget[] = [];
  const pages = doc.getPages();

  pages.forEach((page, pageIdx) => {
    const annotsRef = page.node.get(PDFName.of('Annots'));
    const annots = annotsRef instanceof PDFArray
      ? annotsRef
      : (annotsRef ? page.node.context.lookup(annotsRef as PDFRef, PDFArray) : null);
    if (!annots) return;

    for (let i = 0; i < annots.size(); i++) {
      const annotRef = annots.get(i);
      const annot = annotRef instanceof PDFDict
        ? annotRef
        : page.node.context.lookup(annotRef as PDFRef, PDFDict);
      if (!annot) continue;
      if (annot.get(PDFName.of('Subtype'))?.toString() !== '/Widget') continue;

      // Walk parent chain to assemble the full field name and pick up FT/Ff.
      const nameParts: string[] = [];
      let ftStr: string | null = null;
      let flags = 0;
      let node: PDFDict | undefined = annot;
      const seen = new Set<PDFDict>();
      while (node && !seen.has(node)) {
        seen.add(node);
        const t = node.get(PDFName.of('T'));
        if (t instanceof PDFString) nameParts.unshift(t.decodeText());
        else if (t) nameParts.unshift(t.toString().replace(/^\(|\)$/g, ''));
        const ft = node.get(PDFName.of('FT'));
        if (ft && !ftStr) ftStr = ft.toString();
        const ff = node.get(PDFName.of('Ff'));
        if (ff && typeof (ff as any).asNumber === 'function') {
          flags = (ff as any).asNumber();
        }
        const parentRef = node.get(PDFName.of('Parent')) as
          | PDFRef
          | PDFDict
          | undefined;
        if (!parentRef) break;
        const parent = parentRef instanceof PDFDict
          ? parentRef
          : annot.context.lookup(parentRef as PDFRef, PDFDict);
        node = parent ?? undefined;
      }
      const current = nameParts.join('.');
      if (!current) continue;

      const rectRaw = annot.get(PDFName.of('Rect'));
      if (!(rectRaw instanceof PDFArray) || rectRaw.size() < 4) continue;
      const rect: [number, number, number, number] = [
        (rectRaw.get(0) as any).asNumber(),
        (rectRaw.get(1) as any).asNumber(),
        (rectRaw.get(2) as any).asNumber(),
        (rectRaw.get(3) as any).asNumber(),
      ];

      const type = classifyFieldType(ftStr, flags);
      const suffix = splitAcrobatSuffix(current)[1];

      widgets.push({
        page: pageIdx + 1,
        rect,
        current,
        type,
        suffix,
        id: `p${pageIdx + 1}_${widgets.length.toString().padStart(4, '0')}`,
      });
    }
  });

  return widgets;
}

function classifyFieldType(ft: string | null, flags: number): FieldType {
  if (!ft) return 'unknown';
  if (ft === '/Tx') return 'text';
  if (ft === '/Ch') return 'choice';
  if (ft === '/Sig') return 'signature';
  if (ft === '/Btn') {
    // Field flags: bit 16 (1<<15) = Radio, bit 17 (1<<16) = Pushbutton
    if (flags & (1 << 16)) return 'unknown'; // pushbutton — skip
    if (flags & (1 << 15)) return 'radio';
    return 'checkbox';
  }
  return 'unknown';
}

// ---------- text extraction (pdfjs-dist) ----------

/**
 * Pull positioned text items per page using pdfjs-dist. Each item gets a
 * bbox in PDF user space (origin bottom-left) so we can compare against
 * widget rects directly.
 */
export async function extractTextByPage(pdfBytes: Uint8Array): Promise<TextItem[][]> {
  // pdfjs needs its own copy
  const data = new Uint8Array(pdfBytes);
  // disable worker for Node usage
  (pdfjs as any).GlobalWorkerOptions.workerSrc = '';
  const loadingTask = (pdfjs as any).getDocument({ data, useWorkerFetch: false, isEvalSupported: false, disableFontFace: true });
  const doc = await loadingTask.promise;

  const out: TextItem[][] = [];
  for (let p = 1; p <= doc.numPages; p++) {
    const page = await doc.getPage(p);
    const viewport = page.getViewport({ scale: 1 });
    const content = await page.getTextContent();
    const items: TextItem[] = [];
    for (const it of content.items as any[]) {
      const text = (it.str ?? '').trim();
      if (!text) continue;
      // pdfjs gives us a transform [a,b,c,d,e,f]; e,f is the origin (top-left baseline).
      // Convert to PDF user space (origin bottom-left): y_pdf = pageHeight - y_pdfjs.
      const x = it.transform[4];
      const yTop = viewport.height - it.transform[5];
      const w = it.width ?? 0;
      const h = it.height ?? Math.abs(it.transform[3]) ?? 8;
      items.push({
        text,
        bbox: [x, yTop - h, x + w, yTop],
      });
    }
    out.push(items);
  }
  await doc.cleanup();
  return out;
}

// ---------- proposal logic ----------

/**
 * For each widget, look at the page's text items and pick a label.
 *  - Text fields: usually the label is to the LEFT or directly ABOVE.
 *  - Checkboxes/radios: usually the label is to the RIGHT, very close.
 *  - Numbered sections (Judicial Council forms): we also find the most
 *    recent section number heading above the widget for prefixing.
 */
export function proposeName(
  widget: Widget,
  textItems: TextItem[],
): { proposed: string; rationale: string; confidence: number; section: string | null; label: string | null } {
  const [x1, y1, x2, y2] = widget.rect;
  const cx = (x1 + x2) / 2;
  const cy = (y1 + y2) / 2;

  // --- find label ---
  let label: string | null = null;
  let labelSource = '';
  let confidence = 0.4;

  if (widget.type === 'checkbox' || widget.type === 'radio') {
    // Look for text whose vertical center is within ±6pt of the widget's
    // center, and whose left edge starts within 80pt to the right of the box.
    const candidates = textItems
      .map(t => ({ t, dx: t.bbox[0] - x2, dy: ((t.bbox[1] + t.bbox[3]) / 2) - cy }))
      .filter(c => c.dx > -2 && c.dx < 80 && Math.abs(c.dy) < 6)
      .sort((a, b) => a.dx - b.dx);
    if (candidates.length) {
      // Stitch consecutive items on the same line until we hit a big gap.
      const line: string[] = [];
      let lastRight = candidates[0].t.bbox[0] - 1;
      for (const c of candidates) {
        if (c.t.bbox[0] - lastRight > 18) break;
        line.push(c.t.text);
        lastRight = c.t.bbox[2];
      }
      label = line.join(' ');
      labelSource = 'right of box';
      confidence = 0.7;
    }
  } else {
    // Text/choice/signature: look LEFT first, then directly ABOVE.
    const left = textItems
      .map(t => ({ t, dx: x1 - t.bbox[2], dy: ((t.bbox[1] + t.bbox[3]) / 2) - cy }))
      .filter(c => c.dx > -2 && c.dx < 200 && Math.abs(c.dy) < 8)
      .sort((a, b) => a.dx - b.dx);
    if (left.length) {
      const line: string[] = [];
      let lastLeft = left[0].t.bbox[2] + 1;
      for (const c of left) {
        if (lastLeft - c.t.bbox[2] > 20 && line.length) break;
        line.unshift(c.t.text);
        lastLeft = c.t.bbox[0];
      }
      label = line.join(' ');
      labelSource = 'left of box';
      confidence = 0.65;
    }
    if (!label) {
      const above = textItems
        .map(t => ({ t, dy: t.bbox[1] - y2, overlap: rectsOverlapX(t.bbox, widget.rect) }))
        .filter(c => c.dy > 0 && c.dy < 25 && c.overlap)
        .sort((a, b) => a.dy - b.dy);
      if (above.length) {
        label = above[0].t.text;
        labelSource = 'above box';
        confidence = 0.55;
      }
    }
  }

  // --- find section number heading ---
  const section = findSection(widget.rect, textItems);

  // --- assemble name ---
  // Acrobat's existing name is often a perfectly good label hint. Use it
  // as a fallback if positional matching failed.
  if (!label) {
    const [base] = splitAcrobatSuffix(widget.current);
    label = base;
    labelSource = 'acrobat name';
    confidence = 0.35;
  }

  const labelSlug = slug(label);
  const proposed = [section ? `q${section}` : null, labelSlug || 'field']
    .filter(Boolean)
    .join('_');

  return {
    proposed: proposed || 'field',
    rationale: `${labelSource}: "${label}"${section ? ` | section ${section}` : ''}`,
    confidence,
    section,
    label,
  };
}

function rectsOverlapX(a: number[], b: number[]): boolean {
  return !(a[2] < b[0] || a[0] > b[2]);
}

/**
 * Judicial Council forms number their major questions 1, 2, 3, ... and
 * print the number large in the left margin. We look for a short numeric
 * text item to the LEFT of the widget that's at most ~150pt above the widget.
 */
function findSection(rect: number[], textItems: TextItem[]): string | null {
  const [x1, y1, x2, y2] = rect;
  const cy = (y1 + y2) / 2;
  // Numeric "headings" in the left column
  const candidates = textItems
    .filter(t => /^\d{1,2}\.?$/.test(t.text))
    .filter(t => t.bbox[0] < x1 - 8) // to the left of the widget
    .filter(t => t.bbox[1] >= y2 - 4 && t.bbox[1] - cy < 200) // not too far up
    .sort((a, b) => Math.abs(a.bbox[1] - y2) - Math.abs(b.bbox[1] - y2));
  if (!candidates.length) return null;
  return candidates[0].text.replace('.', '');
}

// ---------- name uniqueness ----------

/**
 * Walk MappingEntry[] and de-dup the `proposed` column so the apply step
 * doesn't create collisions. Matches Acrobat's `_2`/`_3` style on purpose
 * so the reviewer instantly recognizes them as suffixes-to-disambiguate.
 */
export function dedupeProposedNames(entries: MappingEntry[]): void {
  const counts = new Map<string, number>();
  for (const e of entries) {
    if (e.status === 'skip') continue;
    const base = e.proposed;
    const seen = counts.get(base) ?? 0;
    if (seen > 0) {
      e.proposed = `${base}_${seen + 1}`;
      e.rationale += ` [+_${seen + 1} for uniqueness]`;
    }
    counts.set(base, seen + 1);
  }
}
