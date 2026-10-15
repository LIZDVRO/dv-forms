/**
 * Builds the stage-1 filing packet (map: "Packet assembly").
 * Each form's attached sheets are appended to the end of that form's PDF.
 */
import { PDFDocument } from "pdf-lib";

import type { Answers } from "../types";
import { fillForm, type FormSpec } from "./engine";
import { buildSheetsPdf } from "./attachments";
import { DV100 } from "./forms/dv100";
import { CLETS001, DV109, DV110, DV900 } from "./forms/filing";

export type TemplateLoader = (path: string) => Promise<ArrayBuffer | Uint8Array>;

export interface PacketFile {
  id: string;
  fileName: string;
  /** Where it goes: "court" (filed) or "law enforcement" (given to the clerk, not filed). */
  goesTo: "court" | "law enforcement";
  bytes: Uint8Array;
  sheetTitles: string[];
}

export interface Packet {
  files: PacketFile[];
  problems: string[];
}

/** Which forms the wizard v1 produces, from the answers (map: "Forms and when each is used"). */
export function filingForms(a: Answers): FormSpec[] {
  const forms: FormSpec[] = [DV100, DV109, DV110, CLETS001];
  if (a.orders.O28) forms.push(DV900);
  return forms;
}

async function appendSheets(form: Uint8Array, sheetsPdf: Uint8Array): Promise<Uint8Array> {
  const doc = await PDFDocument.load(form);
  const extra = await PDFDocument.load(sheetsPdf);
  const pages = await doc.copyPages(extra, extra.getPageIndices());
  pages.forEach((p) => doc.addPage(p));
  return doc.save();
}

export async function buildFilingPacket(a: Answers, load: TemplateLoader): Promise<Packet> {
  const files: PacketFile[] = [];
  const problems: string[] = [];
  const caseNumber = a.S3 === "update" ? a.S4 : "";
  for (const spec of filingForms(a)) {
    const filled = await fillForm(spec, await load(spec.file), a);
    problems.push(...filled.problems.map((p) => `${spec.id} ${p}`));
    let bytes = filled.bytes;
    if (filled.sheets.length) {
      const sheetsPdf = await buildSheetsPdf(filled.sheets, {
        petitioner: a.P1,
        respondent: a.R1,
        caseNumber,
      });
      bytes = await appendSheets(bytes, sheetsPdf);
    }
    files.push({
      id: spec.id,
      fileName: `${spec.id}.pdf`,
      goesTo: spec.id === "CLETS-001" ? "law enforcement" : "court",
      bytes,
      sheetTitles: filled.sheets.map((s) => s.title),
    });
  }
  return { files, problems };
}
