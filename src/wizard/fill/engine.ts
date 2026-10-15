/**
 * Generic fill engine. One loop fills any official form from a declarative
 * list of bindings (field → answer), so there is no per-form fill code.
 *
 * Templates in /public/forms are the official Judicial Council PDFs, decrypted
 * with the XFA layer and Reader usage rights removed (scripts/prepare-templates.py).
 * Field names are the official ones; see docs/field-map for the full map.
 */
import {
  PDFBool,
  PDFCheckBox,
  PDFDocument,
  PDFFont,
  PDFName,
  PDFTextField,
  StandardFonts,
  beginText,
  endText,
  moveText,
  popGraphicsState,
  pushGraphicsState,
  setFillingGrayscaleColor,
  setFontAndSize,
  showText,
  type PDFOperator,
} from "pdf-lib";

import type { Answers } from "../types";
import { derive, type Derived } from "../derive";
import { sheetPageCount, type Sheet } from "./attachments";
import RULINGS from "./rulings.json";

/** Text that may not fit: what fits is printed, the rest goes on a sheet. */
export interface LongText {
  long: string;
  /** Title of the attached sheet the overflow continues on. */
  sheet: string;
}

export type FieldValue = string | boolean | LongText | null | undefined;

export interface Binding {
  /** Field name without the root and without "[0]" indexes, e.g. "Page1.List1.Li1.YourName_tf". */
  f: string;
  v: (a: Answers, d: Derived) => FieldValue;
}

export interface FormSpec {
  id: string;
  /** For forms filed more than once (DV-105(A)): 1, 2 … */
  copy?: number;
  /** Template path under /public, e.g. "/forms/DV-100.pdf". */
  file: string;
  /** XFA root, e.g. "DV-100[0]". */
  root: string;
  bindings: Binding[];
  /** List rows that do not fit on the form (e.g. more than 4 protected people). */
  sheets?: (a: Answers, d: Derived) => { title: string; text: string }[];
  /** First-line indent in points, by short field name, where a printed label shares the field's first line. */
  indents?: Record<string, number>;
  /** Fields set once the attached sheets are known (more-space boxes, page counts). */
  after?: (ctx: { sheets: Sheet[]; pages: number }) => Binding[];
}

export interface FilledForm {
  id: string;
  bytes: Uint8Array;
  /** Attached sheets for this form (list overflow and text that did not fit). */
  sheets: Sheet[];
  /** Bindings whose field was not found or did not match its type (should be empty). */
  problems: string[];
}

/** "Page1.List1.Li1.YourName_tf" → "DV-100[0].Page1[0].List1[0].Li1[0].YourName_tf[0]" */
export function qualify(root: string, short: string): string {
  // Some official names contain a literal "\." (SER-001 "address\.2d"); that is not a separator.
  const segs = short.split(/(?<!\\)\./).map((s) => (/\[\d+\]$/.test(s) ? s : `${s}[0]`));
  return [root, ...segs].join(".");
}

const rulings = RULINGS as Record<string, Record<string, number[]>>;

const TEXT_SIZE = 10;
const LONG_SIZE = 9;
const MIN_SIZE = 6;
const CONTINUED = " (continued on attached sheet)";

/** Word-wrap text to a width; returns lines (hard line breaks kept). */
function wrap(text: string, font: PDFFont, size: number, width: number, firstWidth = width): string[] {
  const out: string[] = [];
  for (const para of text.replace(/\r/g, "").split("\n")) {
    let line = "";
    for (const word of para.split(/\s+/).filter(Boolean)) {
      const next = line ? `${line} ${word}` : word;
      if (font.widthOfTextAtSize(next, size) <= (out.length === 0 ? firstWidth : width)) line = next;
      else {
        if (line) out.push(line);
        line = word;
      }
    }
    out.push(line);
  }
  return out;
}

interface Box {
  width: number;
  /** First-line indent (points). */
  indent: number;
  height: number;
  /** Baselines measured from the top of the field, one per line. */
  baselines: number[];
}

/** Where each line of a multi-line field goes: on the printed rules if any, else evenly spaced. */
function boxFor(field: PDFTextField, formId: string, size: number, indent = 0): Box {
  const { width, height } = field.acroField.getWidgets()[0].getRectangle();
  const rules = rulings[formId]?.[field.getName()];
  if (rules?.length) return { width, height, indent, baselines: rules.map((r) => r - 2) };
  const lineH = size * 1.25;
  const n = Math.max(1, Math.floor((height - 2) / lineH));
  return { width, height, indent, baselines: Array.from({ length: n }, (_, i) => 2 + size + i * lineH) };
}

/** Split text into the lines that fit the box and the words left over. */
function layout(text: string, font: PDFFont, size: number, box: Box): { lines: string[]; rest: string } {
  // 5% slack: viewers without Helvetica substitute a slightly wider font.
  const w = (box.width - 6) * 0.95;
  const lines = wrap(text, font, size, w, w - box.indent);
  const cap = box.baselines.length;
  if (lines.length <= cap) return { lines, rest: "" };
  const keep = lines.slice(0, cap);
  let last = keep.pop() ?? "";
  const lastW = cap === 1 ? w - box.indent : w;
  while (last && font.widthOfTextAtSize(last + CONTINUED, size) > lastW) last = last.split(" ").slice(0, -1).join(" ");
  const used = [...keep, last].join(" ").split(/\s+/).filter(Boolean).length;
  const rest = text.split(/\s+/).filter(Boolean).slice(used).join(" ");
  return { lines: [...keep, last + CONTINUED], rest };
}

/** Draw lines into the field's appearance at the given baselines. */
function drawLines(field: PDFTextField, font: PDFFont, size: number, box: Box, lines: string[]) {
  field.updateAppearances(font, () => {
    const ops: PDFOperator[] = [pushGraphicsState(), beginText(), setFontAndSize(font.name, size), setFillingGrayscaleColor(0)];
    let x = 3 + box.indent;
    let y = 0;
    lines.forEach((line, i) => {
      const targetY = box.height - box.baselines[i];
      ops.push(moveText(x, targetY - y));
      x = i === 0 ? -box.indent : 0;
      y = targetY;
      ops.push(showText(font.encodeText(line)));
    });
    ops.push(endText(), popGraphicsState());
    return ops;
  });
}

function setSize(field: PDFTextField, size: number) {
  try {
    field.setFontSize(size);
  } catch {
    // Some official fields have no font size in their /DA.
    field.acroField.setDefaultAppearance(`/Helv ${size} Tf 0 g`);
  }
}

export async function fillForm(spec: FormSpec, template: ArrayBuffer | Uint8Array, answers: Answers): Promise<FilledForm> {
  const doc = await PDFDocument.load(template);
  const form = doc.getForm();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const d = derive(answers);
  const problems: string[] = [];
  const textOverflow = new Map<string, string[]>();

  const apply = (bd: Binding) => {
    const name = qualify(spec.root, bd.f);
    let value: FieldValue;
    try {
      value = bd.v(answers, d);
    } catch (e) {
      problems.push(`${bd.f}: rule failed (${(e as Error).message})`);
      return;
    }
    if (value === undefined || value === null || value === "") return;

    let field;
    try {
      field = form.getField(name);
    } catch {
      problems.push(`${bd.f}: field not found`);
      return;
    }

    if (typeof value === "boolean") {
      if (!(field instanceof PDFCheckBox)) return void problems.push(`${bd.f}: not a checkbox`);
      // Each choice is its own checkbox with its own export value;
      // check() uses the widget's on-state, so no export values are needed here.
      if (value) field.check();
      else field.uncheck();
      return;
    }

    if (!(field instanceof PDFTextField)) return void problems.push(`${bd.f}: not a text field`);

    const longValue = typeof value === "object" ? value : null;
    const long = !!longValue;
    const text = (longValue ? longValue.long : (value as string)).trim();
    if (!text) return;
    const max = field.getMaxLength();

    // A long answer in a one-line field: shrink to fit (down to 7pt) before using a sheet.
    if (long && !field.isMultiline()) {
      const { width } = field.acroField.getWidgets()[0].getRectangle();
      const need = font.widthOfTextAtSize(text, TEXT_SIZE);
      const size = need > width - 4 ? Math.floor(((TEXT_SIZE * (width - 4)) / need) * 10) / 10 : TEXT_SIZE;
      if (size >= 7) {
        setSize(field, size);
        field.setText(text);
        return;
      }
    }

    if (field.isMultiline() || long) {
      const size = long ? LONG_SIZE : TEXT_SIZE;
      const box = boxFor(field, spec.id, size, spec.indents?.[bd.f] ?? 0);
      const { lines, rest } = layout(text, font, size, box);
      if (rest) {
        const sheet = longValue ? longValue.sheet : `${spec.id}, ${bd.f}`;
        textOverflow.set(sheet, [...(textOverflow.get(sheet) ?? []), rest]);
      }
      setSize(field, size);
      field.setText(lines.join("\n"));
      drawLines(field, font, size, box, lines);
      return;
    }

    // Single line: 10pt, shrunk only as much as needed to fit the box.
    const shown = max ? text.slice(0, max) : text;
    const { width } = field.acroField.getWidgets()[0].getRectangle();
    const need = font.widthOfTextAtSize(shown, TEXT_SIZE);
    const size = need > width - 4 ? Math.max(MIN_SIZE, Math.floor(((TEXT_SIZE * (width - 4)) / need) * 10) / 10) : TEXT_SIZE;
    setSize(field, size);
    field.setText(shown);
  };

  spec.bindings.forEach(apply);

  // Attached sheets: list overflow first, then text that did not fit.
  const byTitle = new Map<string, string[]>();
  for (const s of spec.sheets?.(answers, d) ?? []) {
    if (!s.text.trim()) continue;
    byTitle.set(s.title, [...(byTitle.get(s.title) ?? []), s.text]);
  }
  for (const [title, parts] of textOverflow) {
    byTitle.set(title, [...(byTitle.get(title) ?? []), ...parts.map((p) => `(continued) ${p}`)]);
  }
  const sheets: Sheet[] = [...byTitle].map(([title, parts]) => ({ title, form: spec.id, text: parts.join("\n\n") }));
  let pages = 0;
  for (const s of sheets) pages += await sheetPageCount(s.text);
  spec.after?.({ sheets, pages }).forEach(apply);

  form.updateFieldAppearances(font);
  // Appearances are generated above, so viewers should not regenerate them.
  form.acroForm.dict.set(PDFName.of("NeedAppearances"), PDFBool.False);
  const bytes = await doc.save();
  return { id: spec.id, bytes, sheets, problems };
}
