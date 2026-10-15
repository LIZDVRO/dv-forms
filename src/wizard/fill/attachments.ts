/**
 * Attached sheets for text or list rows that do not fit on a form
 * ("DV-100, Other Protected People", "Item 4", "DV-100, Describe Abuse" …).
 */
import { PDFDocument, PDFFont, StandardFonts, rgb } from "pdf-lib";

export interface Sheet {
  /** Title the form tells the user to write at the top, e.g. "DV-100, Other Protected People". */
  title: string;
  /** Form the sheet is attached to. */
  form: string;
  text: string;
}

const PAGE_W = 612;
const PAGE_H = 792;
const MARGIN = 54;
const SIZE = 10;
const LINE = SIZE * 1.35;
const HEADER = 72;

function wrapLines(text: string, font: PDFFont, width: number): string[] {
  const out: string[] = [];
  for (const para of text.replace(/\r/g, "").split("\n")) {
    let line = "";
    const words = para.split(/\s+/).filter(Boolean);
    if (!words.length) {
      out.push("");
      continue;
    }
    for (const w of words) {
      const next = line ? `${line} ${w}` : w;
      if (font.widthOfTextAtSize(next, SIZE) <= width) line = next;
      else {
        if (line) out.push(line);
        line = w;
      }
    }
    out.push(line);
  }
  return out;
}

const LINES_PER_PAGE = Math.floor((PAGE_H - MARGIN * 2 - HEADER) / LINE);

/** Number of pages a sheet will take (used for DV-100 item 32 and similar). */
export async function sheetPageCount(text: string): Promise<number> {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const lines = wrapLines(text, font, PAGE_W - MARGIN * 2);
  return Math.max(1, Math.ceil(lines.length / LINES_PER_PAGE));
}

/** One PDF with every sheet, each starting on a new page. */
export async function buildSheetsPdf(
  sheets: Sheet[],
  caption: { petitioner: string; respondent: string; caseNumber: string },
): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  for (const s of sheets) {
    const lines = wrapLines(s.text, font, PAGE_W - MARGIN * 2);
    const pages = Math.max(1, Math.ceil(lines.length / LINES_PER_PAGE));
    for (let p = 0; p < pages; p++) {
      const page = doc.addPage([PAGE_W, PAGE_H]);
      let y = PAGE_H - MARGIN;
      page.drawText(s.title + (pages > 1 ? ` (page ${p + 1} of ${pages})` : ""), {
        x: MARGIN,
        y,
        size: 13,
        font: bold,
      });
      y -= 20;
      const cap = `${caption.petitioner} v. ${caption.respondent}    Case number: ${caption.caseNumber || "____________"}`;
      page.drawText(cap, { x: MARGIN, y, size: 9, font, color: rgb(0.25, 0.25, 0.25) });
      y -= 14;
      page.drawLine({ start: { x: MARGIN, y }, end: { x: PAGE_W - MARGIN, y }, thickness: 0.5 });
      y = PAGE_H - MARGIN - HEADER;
      for (const line of lines.slice(p * LINES_PER_PAGE, (p + 1) * LINES_PER_PAGE)) {
        page.drawText(line, { x: MARGIN, y, size: SIZE, font });
        y -= LINE;
      }
    }
  }
  return doc.save();
}
