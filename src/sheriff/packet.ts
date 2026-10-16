/**
 * Builds the one PDF the survivor sends to the sheriff: SER-001 first, then the
 * court-endorsed papers. Runs entirely in the browser; nothing is uploaded.
 */
import { PDFDocument, PDFTextField, PDFCheckBox } from "pdf-lib";

import { fmtDate } from "@/wizard/derive";

export interface CaseDetails {
  caseNumber: string;
  /** A signature drawn on this page (PNG data URL), for a SER-001 not signed in the wizard. */
  signature?: string;
  /** ISO date of the court hearing (DV-109 item 3). */
  hearingDate: string;
  /** ISO date service must be done by (from DV-109 item 6). */
  deadline: string;
}

/** Names of the SER-001 fields the wizard leaves blank until the court returns the papers. */
const SER = "SER-001[0]";
const CASE_FIELDS = [
  `${SER}.Page1[0].CaptionRight[0].CaseNo[0].CaseNumber[0]`,
  ...[2, 3, 4, 5].map((p) => `${SER}.Page${p}[0].PxCaption[0].CaseNumber[0]`),
];
// 5c and 5d: [0] "I don't know", [1] "No", [2] "Yes".
const HEARING = (i: number) => `${SER}.Page3[0].List5[0].Li5c[0].Hearing[${i}]`;
const HEARING_DATE = `${SER}.Page3[0].List5[0].Li5c[0].hearingDate[0]`;
const DEADLINE = (i: number) => `${SER}.Page4[0].List5Continued[0].Li5d[0].deadline[${i}]`;
const DEADLINE_DATE = `${SER}.Page4[0].List5Continued[0].Li5d[0].deadlineDate[0]`;

/** Hearing date minus the days on DV-109 item 6, as an ISO date. */
export function deadlineFrom(hearingIso: string, daysBefore: number): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(hearingIso);
  if (!m || !Number.isFinite(daysBefore)) return "";
  const d = new Date(Date.UTC(+m[1], +m[2] - 1, +m[3]));
  d.setUTCDate(d.getUTCDate() - daysBefore);
  return d.toISOString().slice(0, 10);
}

export type SerStatus =
  /** The SER-001 the wizard made: case number and items 5c–5d were filled in. */
  | "filled"
  /** A SER-001 without fillable fields (scanned or printed): sent as it is. */
  | "as-is";

/**
 * Fill the case number and items 5c–5d on a SER-001 made by the wizard.
 * Returns the PDF unchanged when it has no fillable SER-001 fields.
 */
export async function completeSer001(bytes: ArrayBuffer, c: CaseDetails): Promise<{ bytes: Uint8Array; status: SerStatus }> {
  const doc = await PDFDocument.load(bytes, { ignoreEncryption: true });
  const form = doc.getForm();
  const field = (name: string) => form.getFields().find((f) => f.getName() === name);
  if (!field(CASE_FIELDS[0])) return { bytes: new Uint8Array(bytes), status: "as-is" };

  const text = (name: string, value: string) => {
    const f = field(name);
    if (f instanceof PDFTextField && value) f.setText(value);
  };
  const check = (name: string, on: boolean) => {
    const f = field(name);
    if (!(f instanceof PDFCheckBox)) return;
    if (on) f.check();
    else f.uncheck();
  };

  CASE_FIELDS.forEach((n) => text(n, c.caseNumber.trim()));
  if (c.hearingDate) {
    [0, 1, 2].forEach((i) => check(HEARING(i), i === 2));
    text(HEARING_DATE, fmtDate(c.hearingDate));
  }
  if (c.deadline) {
    [0, 1, 2].forEach((i) => check(DEADLINE(i), i === 2));
    text(DEADLINE_DATE, fmtDate(c.deadline));
  }
  // Signature line on page 4, where the wizard puts it (SER001.signatures in fill/forms/extras.ts).
  if (c.signature) {
    const page = doc.getPages()[3];
    if (page) {
      const img = await doc.embedPng(c.signature);
      const scale = Math.min(150 / img.width, 26 / img.height);
      page.drawImage(img, { x: 330, y: page.getHeight() - 649 + 1, width: img.width * scale, height: img.height * scale });
    }
  }
  // Only the fields changed here get new appearances; the rest keep the wizard's.
  return { bytes: await doc.save(), status: "filled" };
}

const MAX_SIDE = 2000;

/** A photo of a page, shrunk and re-encoded as JPEG (this also turns iPhone HEIC into JPEG). */
async function photoToJpeg(file: File): Promise<{ bytes: Uint8Array; width: number; height: number }> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not read the photo.");
  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, width, height);
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();
  const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, "image/jpeg", 0.82));
  if (!blob) throw new Error("Could not read the photo.");
  return { bytes: new Uint8Array(await blob.arrayBuffer()), width, height };
}

const LETTER = { w: 612, h: 792 };

/** Add each file's pages to `out`: PDFs page by page, photos one per letter-size page. */
async function appendFile(out: PDFDocument, file: { name: string; bytes: ArrayBuffer | Uint8Array; type: string }, photo?: File) {
  if (file.type === "application/pdf" || /\.pdf$/i.test(file.name)) {
    const src = await PDFDocument.load(file.bytes, { ignoreEncryption: true });
    // Keep what was typed into any fields; flatten so every reader shows it the same way.
    try {
      src.getForm().flatten();
    } catch {
      // Forms that can't be flattened are copied as they are.
    }
    const pages = await out.copyPages(src, src.getPageIndices());
    pages.forEach((p) => out.addPage(p));
    return;
  }
  if (!photo) throw new Error(`${file.name} is not a PDF or a photo.`);
  const jpg = await photoToJpeg(photo);
  const img = await out.embedJpg(jpg.bytes);
  const page = out.addPage([LETTER.w, LETTER.h]);
  const margin = 18;
  const s = Math.min((LETTER.w - margin * 2) / jpg.width, (LETTER.h - margin * 2) / jpg.height);
  const w = jpg.width * s;
  const h = jpg.height * s;
  page.drawImage(img, { x: (LETTER.w - w) / 2, y: (LETTER.h - h) / 2, width: w, height: h });
}

export interface Added {
  id: string;
  file: File;
}

/** SER-001 (completed) followed by the papers, in the order given. */
export async function buildSheriffPdf(ser: File, papers: Added[], c: CaseDetails): Promise<{ bytes: Uint8Array; pages: number; serStatus: SerStatus }> {
  const out = await PDFDocument.create();
  out.setTitle(`Request for sheriff service${c.caseNumber ? ` - case ${c.caseNumber.trim()}` : ""}`);

  let serStatus: SerStatus = "as-is";
  if (ser.type === "application/pdf" || /\.pdf$/i.test(ser.name)) {
    const done = await completeSer001(await ser.arrayBuffer(), c);
    serStatus = done.status;
    await appendFile(out, { name: ser.name, bytes: done.bytes, type: "application/pdf" });
  } else {
    await appendFile(out, { name: ser.name, bytes: new ArrayBuffer(0), type: ser.type }, ser);
  }

  for (const p of papers) {
    const isPdf = p.file.type === "application/pdf" || /\.pdf$/i.test(p.file.name);
    await appendFile(out, { name: p.file.name, bytes: isPdf ? await p.file.arrayBuffer() : new ArrayBuffer(0), type: p.file.type }, isPdf ? undefined : p.file);
  }
  const bytes = await out.save();
  return { bytes, pages: out.getPageCount(), serStatus };
}

/** Subject and message for the email to the sheriff. Kept short: SER-001 carries the details. */
export function emailText(c: CaseDetails, county: string): { subject: string; body: string } {
  const caseNo = c.caseNumber.trim();
  const subject = `Request for service - Domestic violence restraining order${caseNo ? ` - Case ${caseNo}` : ""}`;
  const lines = [
    `To the ${county} County Sheriff's Civil Unit:`,
    "",
    "Please serve the attached domestic violence restraining order papers. My Request for Sheriff to Serve Court Papers (SER-001) is the first document in the attached PDF, followed by the court-endorsed papers to serve.",
    "",
    caseNo ? `Case number: ${caseNo}` : "",
    c.hearingDate ? `Court date: ${fmtDate(c.hearingDate)}` : "",
    c.deadline ? `Must be served by: ${fmtDate(c.deadline)}` : "",
    "",
    "I am sending this electronically under Government Code section 26666.5. Please reply to confirm you received it.",
    "",
    "Thank you.",
  ];
  return { subject, body: lines.filter((l, i, all) => !(l === "" && all[i - 1] === "")).join("\n") };
}
