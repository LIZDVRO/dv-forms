/**
 * Builds a sample SER-001, runs it through the send-to-sheriff packet, and checks that
 * the case number and items 5c-5d were filled and the pages combined.
 *
 *   npx tsx scripts/check-sheriff.ts [outDir]
 */
import fs from "node:fs";
import path from "node:path";

import { PDFCheckBox, PDFDocument, PDFTextField } from "pdf-lib";

import { buildFilingPacket } from "../src/wizard/fill/packet";
import { sampleAnswers } from "../src/wizard/sample";
import { buildSheriffFiles, buildSheriffPdf, completeSer001, deadlineFrom, emailText } from "../src/sheriff/packet";
import { newSer001Draft, papersText, readSer001Details } from "../src/sheriff/ser001";
import { SER001 } from "../src/wizard/fill/forms/extras";
import { fillOneForm } from "../src/wizard/fill/packet";

const outDir = process.argv[2] ?? "tmp-sheriff";
const load = async (p: string) => {
  const b = fs.readFileSync(path.join("public", p));
  return b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength) as ArrayBuffer;
};
const asFile = (name: string, bytes: Uint8Array) => new File([bytes as BlobPart], name, { type: "application/pdf" });

async function main() {
  const a = { ...sampleAnswers(), V1: "sheriff" as const };
  const packet = await buildFilingPacket(a, load);
  const ser = packet.files.find((f) => f.id === "SER-001");
  const dv109 = packet.files.find((f) => f.id === "DV-109");
  const dv110 = packet.files.find((f) => f.id === "DV-110");
  if (!ser || !dv109 || !dv110) throw new Error("Sample packet is missing SER-001, DV-109 or DV-110");

  const c = { caseNumber: "26FL01234", hearingDate: "2026-11-06", deadline: deadlineFrom("2026-11-06", 5) };
  if (c.deadline !== "2026-11-01") throw new Error(`deadlineFrom gave ${c.deadline}`);

  const filled = await completeSer001(ser.bytes.buffer.slice(0) as ArrayBuffer, c);
  if (filled.status !== "filled") throw new Error("SER-001 was not recognized");
  const form = (await PDFDocument.load(filled.bytes)).getForm();
  const txt = (n: string) => (form.getField(n) as PDFTextField).getText();
  const chk = (n: string) => (form.getField(n) as PDFCheckBox).isChecked();
  const checks: [string, boolean][] = [
    ["case no p1", txt("SER-001[0].Page1[0].CaptionRight[0].CaseNo[0].CaseNumber[0]") === c.caseNumber],
    ["case no p4", txt("SER-001[0].Page4[0].PxCaption[0].CaseNumber[0]") === c.caseNumber],
    ["5c yes", chk("SER-001[0].Page3[0].List5[0].Li5c[0].Hearing[2]") && !chk("SER-001[0].Page3[0].List5[0].Li5c[0].Hearing[0]")],
    ["5c date", txt("SER-001[0].Page3[0].List5[0].Li5c[0].hearingDate[0]") === "11/06/2026"],
    ["5d yes", chk("SER-001[0].Page4[0].List5Continued[0].Li5d[0].deadline[2]")],
    ["5d date", txt("SER-001[0].Page4[0].List5Continued[0].Li5d[0].deadlineDate[0]") === "11/01/2026"],
    ["name kept", txt("SER-001[0].Page1[0].List2[0].Li2a[0].Yourname[0]") === a.P1],
  ];

  fs.mkdirSync(outDir, { recursive: true });
  const out = await buildSheriffPdf(asFile("SER-001.pdf", ser.bytes), [
    { id: "1", file: asFile("DV-109.pdf", dv109.bytes) },
    { id: "2", file: asFile("DV-110.pdf", dv110.bytes) },
  ], c);
  const pageCount = async (b: Uint8Array) => (await PDFDocument.load(b)).getPageCount();
  const expected = (await pageCount(ser.bytes)) + (await pageCount(dv109.bytes)) + (await pageCount(dv110.bytes));
  checks.push(["combined pages", out.pages === expected], ["status", out.serStatus === "filled"]);

  // Fresno's Civil Connect: SER-001, the signed order and the other papers as separate files, each under 10 MB.
  const sep = await buildSheriffFiles(
    asFile("SER-001.pdf", ser.bytes),
    [{ id: "o", file: asFile("DV-110.pdf", dv110.bytes) }],
    [{ id: "p", file: asFile("DV-109.pdf", dv109.bytes) }],
    c,
    10 * 1024 * 1024,
  );
  const slots = sep.files.map((f) => f.slot).join(",");
  checks.push(
    ["separate: three files in order", slots === "ser,order,other"],
    ["separate: names carry case number", sep.files.every((f) => f.fileName.includes("26FL01234"))],
    ["separate: SER-001 filled", sep.serStatus === "filled"],
    ["separate: page counts", sep.files[0].pages === (await pageCount(ser.bytes)) && sep.files[1].pages === (await pageCount(dv110.bytes)) && sep.files[2].pages === (await pageCount(dv109.bytes))],
    ["separate: each under 10 MB", sep.files.every((f) => f.bytes.length <= 10 * 1024 * 1024)],
  );
  const sepNoOthers = await buildSheriffFiles(asFile("SER-001.pdf", ser.bytes), [{ id: "o", file: asFile("DV-110.pdf", dv110.bytes) }], [], c, 10 * 1024 * 1024);
  checks.push(["separate: no empty third file", sepNoOthers.files.length === 2]);
  sep.files.forEach((f) => fs.writeFileSync(path.join(outDir, f.fileName), f.bytes));

  // Contact details for Civil Connect come off the completed SER-001.
  checks.push(
    ["details: name", sep.details?.name === a.P1],
    ["details: case number", sep.details?.caseNumber === c.caseNumber],
    ["details: person to serve", sep.details?.personToServe === a.R1],
  );

  // The short SER-001 form on the sheriff page: same fill rules, item 5b from the checked papers.
  const draft = newSer001Draft("Fresno");
  draft.P1 = "Ana Test";
  draft.P6 = { street: "PO Box 1", city: "Fresno", state: "CA", zip: "93701" };
  draft.P7 = "559-555-0100";
  draft.R1 = "Sam Test";
  draft.R15.address = { street: "1 Main St", city: "Fresno", state: "CA", zip: "93721" };
  draft.R18 = "Y";
  const list = papersText(["DV-100", "DV-109", "DV-110", "DV-105"]);
  const shortForm = await fillOneForm(SER001, { ...draft, V4: list, S5: "N" }, load);
  const sf = (await PDFDocument.load(shortForm)).getForm();
  const sfText = (n: string) => (sf.getField(n) as PDFTextField).getText() ?? "";
  checks.push(
    ["short form: 5b list", list === "Filed: DV-100, DV-105, DV-109, DV-110. Blank: DV-120, DV-120-INFO, DV-250, DV-125."],
    ["short form: 5b on the form", sfText("SER-001[0].Page3[0].List5[0].Li5b[0].listForms[0]").startsWith("Filed: DV-100")],
    ["short form: county", sfText("SER-001[0].Page1[0].List1[0].Li1[0].NameofCounty[0]") === "Fresno"],
    ["short form: has gun", (sf.getField("SER-001[0].Page2[0].List3[0].Li3a[0].Li3aList[0].Li3a4[0].hasGun[0]") as PDFCheckBox).isChecked()],
  );
  const shortDone = await completeSer001(shortForm.buffer.slice(0) as ArrayBuffer, c);
  const shortDetails = await readSer001Details(shortDone.bytes);
  checks.push(
    ["short form: completes", shortDone.status === "filled"],
    ["short form: details", shortDetails?.name === "Ana Test" && shortDetails?.phone === "559-555-0100" && shortDetails?.caseNumber === c.caseNumber],
  );
  fs.writeFileSync(path.join(outDir, "short-form-SER-001.pdf"), shortDone.bytes);

  const mail = emailText(c, "Tulare");
  checks.push(["subject", mail.subject.includes("26FL01234")], ["body has no address", !mail.body.includes(a.R14.street || "@@")]);

  fs.writeFileSync(path.join(outDir, "Sheriff-request.pdf"), out.bytes);
  let failed = false;
  for (const [name, ok] of checks) {
    console.log(`${ok ? "ok  " : "FAIL"} ${name}`);
    if (!ok) failed = true;
  }
  console.log(`${out.pages} pages, ${(out.bytes.length / 1024).toFixed(0)} KB -> ${outDir}/Sheriff-request.pdf`);
  console.log("\nSubject:", mail.subject, "\n" + mail.body);
  process.exit(failed ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
