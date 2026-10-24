/**
 * Builds what the survivor sends to the sheriff: one PDF (SER-001 first, then the
 * court-endorsed papers) for sheriffs that take email, or separate PDFs for portals with
 * one upload box per document. Runs entirely in the browser; nothing is uploaded.
 */
import { PDFCheckBox, PDFDict, PDFDocument, PDFName, PDFTextField } from "pdf-lib";

import { fmtDate } from "@/wizard/derive";

import { readSer001Details, type Ser001Details } from "./ser001";

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

/**
 * Whether a SER-001 PDF already has a drawn signature. pdf-lib names the images it draws
 * "Image-…", and the blank SER-001 only has its own printed images (Im0, Im1), so a drawn
 * signature on page 4 shows up as an extra "Image-" entry there.
 */
export async function ser001Signed(bytes: ArrayBuffer | Uint8Array): Promise<boolean> {
  try {
    const page = (await PDFDocument.load(bytes, { ignoreEncryption: true })).getPages()[3];
    const xobjects = page?.node.Resources()?.lookup(PDFName.of("XObject"), PDFDict);
    return !!xobjects?.keys().some((k) => k.toString().startsWith("/Image-"));
  } catch {
    return false;
  }
}

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

/** How photos of pages are shrunk. The smaller setting is used when a file is over a size limit. */
interface PhotoQuality {
  maxSide: number;
  quality: number;
}
const NORMAL: PhotoQuality = { maxSide: 2000, quality: 0.82 };
const SMALLER: PhotoQuality = { maxSide: 1400, quality: 0.6 };

const isPdf = (f: File) => f.type === "application/pdf" || /\.pdf$/i.test(f.name);

/** A photo of a page, shrunk and re-encoded as JPEG (this also turns iPhone HEIC into JPEG). */
async function photoToJpeg(file: File, q: PhotoQuality): Promise<{ bytes: Uint8Array; width: number; height: number }> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, q.maxSide / Math.max(bitmap.width, bitmap.height));
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
  const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, "image/jpeg", q.quality));
  if (!blob) throw new Error("Could not read the photo.");
  return { bytes: new Uint8Array(await blob.arrayBuffer()), width, height };
}

const LETTER = { w: 612, h: 792 };

/** Add a file's pages to `out`: a PDF page by page (or `pdfBytes` in its place), a photo on one letter-size page. */
async function appendFile(out: PDFDocument, file: File, q: PhotoQuality, pdfBytes?: ArrayBuffer | Uint8Array) {
  if (pdfBytes || isPdf(file)) {
    const src = await PDFDocument.load(pdfBytes ?? (await file.arrayBuffer()), { ignoreEncryption: true });
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
  const jpg = await photoToJpeg(file, q);
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

/** One PDF from SER-001 (when given, completed first) and the files after it, in order. */
async function buildPart(title: string, ser: File | null, files: File[], c: CaseDetails, q: PhotoQuality) {
  const out = await PDFDocument.create();
  out.setTitle(title);
  let serStatus: SerStatus = "as-is";
  let details: Ser001Details | null = null;
  if (ser) {
    if (isPdf(ser)) {
      const done = await completeSer001(await ser.arrayBuffer(), c);
      serStatus = done.status;
      // Read the contact details before the form is flattened into the upload file.
      details = await readSer001Details(done.bytes);
      await appendFile(out, ser, q, done.bytes);
    } else {
      await appendFile(out, ser, q);
    }
  }
  for (const f of files) await appendFile(out, f, q);
  return { bytes: await out.save(), pages: out.getPageCount(), serStatus, details };
}

/** Build a part; if it is over `maxBytes` and has photos, build it again with smaller photos. */
async function buildWithin(title: string, ser: File | null, files: File[], c: CaseDetails, maxBytes: number) {
  const first = await buildPart(title, ser, files, c, NORMAL);
  const hasPhotos = [ser, ...files].some((f) => f && !isPdf(f));
  if (first.bytes.length <= maxBytes || !hasPhotos) return first;
  return buildPart(title, ser, files, c, SMALLER);
}

const caseTitle = (c: CaseDetails) => (c.caseNumber.trim() ? ` - case ${c.caseNumber.trim()}` : "");

/**
 * Everything in one PDF, for sheriffs that take email: SER-001 (completed), then the
 * signed order, then the other papers.
 */
export async function buildSheriffPdf(
  ser: File,
  papers: Added[],
  c: CaseDetails,
  maxBytes = Infinity,
): Promise<{ bytes: Uint8Array; pages: number; serStatus: SerStatus; details: Ser001Details | null }> {
  return buildWithin(`Request for sheriff service${caseTitle(c)}`, ser, papers.map((p) => p.file), c, maxBytes);
}

export interface SheriffFile {
  /** Which upload box it goes in. */
  slot: "ser" | "order" | "other";
  fileName: string;
  bytes: Uint8Array;
  pages: number;
}

/**
 * Separate PDFs for portals with one upload box per document (Fresno's Civil Connect):
 * SER-001, the signed restraining order, and the other papers (left out when there are none).
 * Each is kept under `maxBytes` where photos can be shrunk.
 */
export async function buildSheriffFiles(
  ser: File,
  order: Added[],
  others: Added[],
  c: CaseDetails,
  maxBytes: number,
): Promise<{ files: SheriffFile[]; serStatus: SerStatus; details: Ser001Details | null }> {
  const tag = c.caseNumber.trim().replace(/[^\w-]+/g, "");
  const name = (n: number, what: string) => `${n}-${what}${tag ? `-${tag}` : ""}.pdf`;
  const serPart = await buildWithin(`SER-001${caseTitle(c)}`, ser, [], c, maxBytes);
  const orderPart = await buildWithin(`Signed restraining order${caseTitle(c)}`, null, order.map((p) => p.file), c, maxBytes);
  const files: SheriffFile[] = [
    { slot: "ser", fileName: name(1, "SER-001"), bytes: serPart.bytes, pages: serPart.pages },
    { slot: "order", fileName: name(2, "Signed-order"), bytes: orderPart.bytes, pages: orderPart.pages },
  ];
  if (others.length) {
    const otherPart = await buildWithin(`Other papers to serve${caseTitle(c)}`, null, others.map((p) => p.file), c, maxBytes);
    files.push({ slot: "other", fileName: name(3, "Other-papers"), bytes: otherPart.bytes, pages: otherPart.pages });
  }
  return { files, serStatus: serPart.serStatus, details: serPart.details };
}

/** Subject and message for the email to the sheriff. Kept short: SER-001 carries the details. */
export function emailText(c: CaseDetails, county: string, subjectPrefix?: string): { subject: string; body: string } {
  const caseNo = c.caseNumber.trim();
  const subject = `${subjectPrefix ? `${subjectPrefix} - ` : ""}Request for service - Domestic violence restraining order${caseNo ? ` - Case ${caseNo}` : ""}`;
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
