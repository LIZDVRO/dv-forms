/**
 * SER-001 for people who don't have the one from their LIZ forms: a short form on the
 * sheriff page fills it from what's on the papers the court gave back. It uses the same
 * fill rules as the wizard (SER001 in wizard/fill/forms/extras.ts), so the result is the
 * same form. The case number, court date, deadline and signature are added afterwards by
 * completeSer001, like a SER-001 from the wizard.
 */
import { PDFDocument, PDFTextField } from "pdf-lib";

import { emptyAnswers, todayISO } from "@/wizard/defaults";
import { qualify } from "@/wizard/fill/engine";
import { SER001 } from "@/wizard/fill/forms/extras";
import { fillOneForm } from "@/wizard/fill/packet";
import type { Answers } from "@/wizard/types";

/** Papers the court may have returned, for SER-001 item 5b. */
export const RETURNED_PAPERS: { id: string; label: string; custody?: boolean; finances?: boolean }[] = [
  { id: "DV-100", label: "DV-100 Request for Domestic Violence Restraining Order" },
  { id: "DV-101", label: "DV-101 Description of Abuse" },
  { id: "DV-105", label: "DV-105 Request for Child Custody and Visitation Orders", custody: true },
  { id: "DV-108", label: "DV-108 Request for Orders to Prevent Child Abduction", custody: true },
  { id: "DV-109", label: "DV-109 Notice of Court Hearing" },
  { id: "DV-110", label: "DV-110 Temporary Restraining Order" },
  { id: "DV-140", label: "DV-140 Child Custody and Visitation Order", custody: true },
  { id: "DV-145", label: "DV-145 Order to Prevent Child Abduction", custody: true },
  { id: "DV-900", label: "DV-900 Order Transferring Wireless Phone Account" },
  { id: "FL-150", label: "FL-150 Income and Expense Declaration", finances: true },
];

/** Checked to start: every DV case has these. */
export const USUAL_PAPERS = ["DV-100", "DV-109", "DV-110"];

/** SER-001 item 5b, in the same form the wizard writes it: the filed papers, then the blank ones served with them. */
export function papersText(ids: string[]): string {
  const picked = RETURNED_PAPERS.filter((p) => ids.includes(p.id));
  const custody = picked.some((p) => p.custody);
  const finances = picked.some((p) => p.finances);
  const blank = ["DV-120", "DV-120-INFO", "DV-250", ...(finances ? ["FL-150"] : []), ...(custody ? ["DV-125"] : [])];
  return `Filed: ${picked.map((p) => p.id).join(", ")}. Blank: ${blank.join(", ")}.`;
}

/** A fresh set of answers for the short form, with the county already chosen. */
export function newSer001Draft(county: string): Answers {
  const a = emptyAnswers();
  a.V1 = "sheriff";
  a.V2 = county;
  a.S1 = county;
  return a;
}

const loadTemplate = async (path: string) => {
  const res = await fetch(path);
  if (!res.ok) throw new Error(`Could not load ${path}`);
  return res.arrayBuffer();
};

/** Fill SER-001 from the short form. The signature is drawn on later by completeSer001. */
export async function makeSer001(draft: Answers, paperIds: string[]): Promise<File> {
  const a: Answers = { ...draft, V1: "sheriff", V4: papersText(paperIds), G1: todayISO(), sig: "", lawyerSig: "", S5: "N" };
  const bytes = await fillOneForm(SER001, a, loadTemplate);
  return new File([bytes as BlobPart], "SER-001.pdf", { type: "application/pdf" });
}

/** Contact details on a filled SER-001, for typing into a sheriff's website. */
export interface Ser001Details {
  name: string;
  street: string;
  city: string;
  state: string;
  zip: string;
  phone: string;
  email: string;
  caseNumber: string;
  personToServe: string;
}

const F = (short: string) => qualify(SER001.root, short);
const FIELDS: Record<keyof Ser001Details, string> = {
  name: F("Page1.List2.Li2a.Yourname"),
  street: F("Page1.List2.Li2d.address\\.2d"),
  city: F("Page1.List2.Li2d.city\\.2d"),
  state: F("Page1.List2.Li2d.state\\.2d"),
  zip: F("Page1.List2.Li2d.zip\\.2d"),
  phone: F("Page1.List2.Li2d.telephone\\.2d"),
  email: F("Page1.List2.Li2d.email\\.2d"),
  caseNumber: F("Page1.CaptionRight.CaseNo.CaseNumber"),
  personToServe: F("Page2.List3.Li3a.Li3aList.Li3a1.personName"),
};

/**
 * Read the contact details off a SER-001 that LIZ made (from the wizard or the short form).
 * Returns null for a photo or a SER-001 without fillable fields.
 */
export async function readSer001Details(bytes: ArrayBuffer | Uint8Array): Promise<Ser001Details | null> {
  try {
    const form = (await PDFDocument.load(bytes, { ignoreEncryption: true })).getForm();
    const byName = new Map(form.getFields().map((f) => [f.getName(), f]));
    if (!byName.has(FIELDS.name)) return null;
    const out = {} as Ser001Details;
    for (const [k, name] of Object.entries(FIELDS) as [keyof Ser001Details, string][]) {
      const f = byName.get(name);
      out[k] = f instanceof PDFTextField ? (f.getText() ?? "").trim() : "";
    }
    return out;
  } catch {
    return null;
  }
}
