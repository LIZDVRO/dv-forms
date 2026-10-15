/**
 * Builds the stage-1 filing packet (map: "Packet assembly").
 * Each form's attached sheets are appended to the end of that form's PDF.
 */
import { PDFDocument } from "pdf-lib";

import { custodyRequested, financesRequested } from "../derive";
import type { Answers } from "../types";
import { fillForm, type FormSpec } from "./engine";
import { buildSheetsPdf } from "./attachments";
import { DV100 } from "./forms/dv100";
import { FL150 } from "./forms/fl150";
import { DV105, DV108, DV140, DV145, dv105a, residenceGroups } from "./forms/custody";
import { DV101, SER001, int300, int300Forms, needsDV101 } from "./forms/extras";
import { CLETS001, DV109, DV110, DV900 } from "./forms/filing";
import {
  DV130,
  DV150,
  DV160,
  DV165,
  DV170,
  DV175,
  DV200,
  DV210,
  DV250,
  DV901,
  confidentialityRequested,
} from "./forms/later";

export type TemplateLoader = (path: string) => Promise<ArrayBuffer | Uint8Array>;

export interface PacketFile {
  id: string;
  fileName: string;
  /** Where it goes. Only "court" forms are filed; the others are handed to someone and never filed. */
  goesTo: "court" | "law enforcement" | "sheriff" | "phone company" | "server";
  /** When it is used: filed now, brought to the hearing, or kept for later. */
  group: "file" | "hearing" | "later";
  bytes: Uint8Array;
  sheetTitles: string[];
}

export interface Packet {
  files: PacketFile[];
  problems: string[];
}

/** Which forms the wizard produces, from the answers (map: "Forms and when each is used"). */
export function filingForms(a: Answers): FormSpec[] {
  const forms: FormSpec[] = [DV100];
  if (needsDV101(a)) forms.push(DV101);
  if (custodyRequested(a)) {
    forms.push(DV105);
    const groups = residenceGroups(a).length;
    for (let k = 0; k * 2 < groups; k++) forms.push(dv105a(k));
    if (a.K5 === "Y") forms.push(DV108);
  }
  forms.push(DV109, DV110);
  if (custodyRequested(a)) {
    forms.push(DV140);
    if (a.K5 === "Y") forms.push(DV145);
  }
  if (a.orders.O28) forms.push(DV900);
  if (financesRequested(a)) forms.push(FL150);
  forms.push(...int300Forms(a));
  if (confidentialityRequested(a)) forms.push(DV160, DV165, DV170);
  forms.push(CLETS001);
  // Bring to the hearing: the judge completes these orders.
  forms.push(as(DV130, "hearing"));
  if (custodyRequested(a)) forms.push(as(DV150, "hearing"));
  // Keep for later.
  if (a.V1 === "sheriff") forms.push(as(SER001, "later"));
  forms.push(as(DV200, "later"));
  if (financesRequested(a)) forms.push(as(DV250, "later"));
  if (a.orders.O28) forms.push(as(DV901, "later"));
  if (confidentialityRequested(a)) forms.push(as(DV175, "later"));
  forms.push(as(DV210, "later"));
  return forms;
}

const as = (spec: FormSpec, group: FormSpec["group"]): FormSpec => ({ ...spec, group });

const GOES_TO: Record<string, PacketFile["goesTo"]> = {
  "CLETS-001": "law enforcement",
  "SER-001": "sheriff",
  "DV-901": "phone company",
  "DV-200": "server",
  "DV-250": "server",
};

/** Every form spec the wizard can produce (for checks). */
export const ALL_FORMS: FormSpec[] = [
  DV100,
  DV101,
  DV105,
  dv105a(0),
  DV108,
  DV109,
  DV110,
  DV140,
  DV145,
  DV900,
  FL150,
  int300(),
  CLETS001,
  SER001,
  DV160,
  DV165,
  DV170,
  DV175,
  DV130,
  DV150,
  DV200,
  DV250,
  DV901,
  DV210,
];

export const fileNameFor = (spec: FormSpec) => `${spec.id}${spec.copy && spec.copy > 1 ? `-${spec.copy}` : ""}.pdf`;

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
      fileName: fileNameFor(spec),
      goesTo: GOES_TO[spec.id] ?? "court",
      group: spec.group ?? "file",
      bytes,
      sheetTitles: filled.sheets.map((s) => s.title),
    });
  }
  return { files, problems };
}
