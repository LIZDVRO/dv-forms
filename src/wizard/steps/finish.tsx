"use client";

import JSZip from "jszip";
import { useState } from "react";

import { noteForms, notePrint, noteZip } from "@/stats/tracker";

import { custodyRequested, derive, fmtDate } from "../derive";
import { buildFilingPacket, type Packet, type PacketFile } from "../fill/packet";
import { useWizard } from "../store";
import type { Answers } from "../types";
import { Group, Note, Question, SignaturePad, Text } from "../ui/fields";

/** LIZ's e-filing portal. Opened in a new tab: nothing in the wizard is saved, so leaving would lose the forms. */
const EFILE_URL = "https://efile.lizbreakfree.org/";

const loadTemplate = async (path: string) => {
  const res = await fetch(path);
  if (!res.ok) throw new Error(`Could not load ${path}`);
  return res.arrayBuffer();
};

function download(name: string, bytes: Uint8Array | Blob) {
  const blob = bytes instanceof Blob ? bytes : new Blob([bytes as BlobPart], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

const ORDER_NAMES: Record<string, string> = {
  O10: "Stop the abuse",
  O11: "No contact",
  O12: "Stay away",
  O13: "Move out",
  O14: "Other orders",
  O15: "Child custody and visits",
  O16: "Animals",
  O17: "Property control",
  O18: "Insurance",
  O19: "Record calls",
  O20: "Property restraint",
  O21: "More time to serve",
  O22: "Pay debts",
  O23: "Pay expenses",
  O24: "Child support",
  O25: "Spousal support",
  O26: "Lawyer's fees",
  O27: "Batterer program",
  O28: "Phone transfer",
};

const FORM_NAMES: Record<string, string> = {
  "DV-100": "Request for Domestic Violence Restraining Order",
  "DV-101": "Description of Abuse",
  "DV-105": "Request for Child Custody and Visitation Orders",
  "DV-105(A)": "City and State Where Children Lived",
  "DV-108": "Request for Orders to Prevent Child Abduction",
  "DV-109": "Notice of Court Hearing",
  "DV-110": "Temporary Restraining Order",
  "DV-140": "Child Custody and Visitation Order",
  "DV-145": "Order to Prevent Child Abduction",
  "CLETS-001": "Confidential Information for Law Enforcement",
  "INT-300": "Request for Interpreter",
  "FL-150": "Income and Expense Declaration",
  "SER-001": "Request for Sheriff to Serve Court Papers",
  "DV-900": "Order Transferring Wireless Phone Account",
  "DV-160": "Request to Keep Minor's Information Confidential",
  "DV-165": "Order on Request to Keep Minor's Information Confidential",
  "DV-170": "Notice of Order Protecting Information of Minor",
  "DV-175": "Cover Sheet for Confidential Information",
  "DV-130": "Restraining Order After Hearing",
  "DV-150": "Supplemental Findings for Custody (DV Prevention)",
  "DV-200": "Proof of Personal Service",
  "DV-250": "Proof of Service by Mail",
  "DV-901": "Attachment to Order Transferring Wireless Phone Account",
  "DV-210": "Summons (for service by publication or posting)",
  "LIZ-INVOICE": "LIZ Break Free invoice (proof for item 23)",
};

/** One line on what to do with each form, by where it goes and when. */
function howToUse(f: PacketFile, a: Answers): string {
  switch (f.id) {
    case "CLETS-001":
      return "Give to the clerk when you file. It is not filed in the public record.";
    case "DV-160":
    case "DV-165":
    case "DV-170":
      return "File with your other papers. These go in the court's confidential file.";
    case "DV-130":
      return "Bring 3 copies to your court date. The judge fills in the orders.";
    case "LIZ-INVOICE":
      return "Proof of the $250 expense in DV-100 item 23 (a copy is also behind DV-100). Bring it to your court date and show the judge.";
    case "DV-150":
      return "Bring to your court date with DV-130. The judge fills in the findings.";
    case "SER-001":
      return "Keep this. Once you have your stamped papers back, send it and them to the sheriff from lizbreakfree.org (\"I need to serve my papers\"). Don't file it.";
    case "DV-200":
      return a.V1 === "sheriff"
        ? "For the person who serves. The sheriff may use its own proof of service instead."
        : "Give to the person who serves. They fill it in, sign it, and give it back to you to file before your court date.";
    case "DV-250":
      return "If FL-150 or other papers are mailed later, the person who mails them fills this in.";
    case "DV-901":
      return "Confidential. After the judge signs DV-900, send both to the phone company. Never file it or show it to the other person.";
    case "DV-175":
      return "Put on top of any later papers that include the child's private information, once the judge grants DV-165.";
    case "DV-210":
      return "Only if the judge lets you serve by newspaper or by posting because the other person can't be found.";
    default:
      return "File with the court.";
  }
}

const GROUPS: { key: PacketFile["group"]; title: string; intro: string }[] = [
  { key: "file", title: "File now", intro: "Take these to the court clerk." },
  { key: "hearing", title: "Bring to your court date", intro: "The judge completes these orders at the hearing." },
  { key: "later", title: "Keep for later", intro: "You'll need these after the court returns your papers." },
];

/** Step 11 · review, sign, and download. */
export function Finish({ goTo }: { goTo: (stepId: string) => void }) {
  const { a, set } = useWizard();
  const [busy, setBusy] = useState(false);
  const [packet, setPacket] = useState<Packet | null>(null);
  const [error, setError] = useState("");

  const make = async () => {
    setBusy(true);
    setError("");
    try {
      const p = await buildFilingPacket(a, loadTemplate);
      if (p.problems.length) console.warn("Fill problems", p.problems);
      setPacket(p);
      noteForms(p.files.map((f) => f.id));
    } catch (e) {
      console.error(e);
      setError("Something went wrong making your forms. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  const zipAll = async () => {
    if (!packet) return;
    const zip = new JSZip();
    // Same three groups as the screen, so the folders say what to do with each form.
    const folder: Record<PacketFile["group"], string> = { file: "1 File now", hearing: "2 Bring to court date", later: "3 Keep for later" };
    packet.files.forEach((f) => zip.file(`${folder[f.group]}/${f.fileName}`, f.bytes));
    download("DVRO-forms.zip", await zip.generateAsync({ type: "blob" }));
    noteZip();
  };

  const summary: [string, string, string][] = [
    ["You", a.P1 || "—", "you"],
    ["The other person", a.R1 || "—", "respondent"],
    ["Court", a.S1 ? `${a.S1} County` : "—", "court"],
    ["People protected", a.roster.filter((p) => p.protect === "Y").map((p) => p.name).join(", ") || "Just you", "people"],
    ["What happened", `${a.cards.filter((c) => c.A6.trim()).length} time(s) described`, "incidents"],
    [
      "Orders",
      Object.entries(a.orders)
        .filter(([, v]) => v)
        .map(([k]) => ORDER_NAMES[k] ?? k)
        .join(", ") || "—",
      "orders",
    ],
    ...(custodyRequested(a)
      ? ([
          [
            "Custody",
            `${derive(a).custodyKids.map((k) => k.name).join(", ") || "No children listed"}${a.K5 === "Y" ? " · abduction orders requested" : ""}`,
            "children",
          ],
        ] as [string, string, string][])
      : []),
  ];

  return (
    <div className="space-y-8">
      <div className="print:hidden">
      <Group title="Check your answers">
        <dl className="divide-y divide-slate-200 rounded-xl border border-slate-200">
          {summary.map(([k, v, step]) => (
            <div key={k} className="flex items-start justify-between gap-4 p-3">
              <div>
                <dt className="text-sm text-slate-500">{k}</dt>
                <dd className="text-base text-slate-900">{v}</dd>
              </div>
              <button type="button" onClick={() => goTo(step)} className="text-sm font-medium text-liz hover:underline">
                Edit
              </button>
            </div>
          ))}
        </dl>
      </Group>

      </div>

      <div className="print:hidden">
      <Group title="Signing">
        <Question label="Date you're signing" hint="You'll sign the printed forms by hand.">
          <Text type="date" value={a.G1} onChange={(v) => set((x) => void (x.G1 = v))} className="sm:w-56" />
        </Question>
        <Note>
          When you sign, you declare under penalty of perjury that what you wrote is true. Read your answers above before you sign.
        </Note>
        <SignaturePad
          label="Your signature"
          hint="Draw with your finger or mouse. It goes on DV-100 and every other form you sign. Or leave it blank and sign the printed forms by hand."
          value={a.sig}
          onChange={(v) => {
            set((x) => void (x.sig = v));
            setPacket(null);
          }}
        />
        {a.S5 === "Y" && (
          <SignaturePad
            label="Your lawyer's signature"
            hint="Optional. For DV-100 item 34 and the other forms a lawyer signs."
            value={a.lawyerSig}
            onChange={(v) => {
              set((x) => void (x.lawyerSig = v));
              setPacket(null);
            }}
          />
        )}
      </Group>

      </div>

      <Group title="Your forms">
        {!packet && (
          <button
            type="button"
            onClick={make}
            disabled={busy}
            className="w-full rounded-xl bg-liz px-6 py-4 text-lg font-semibold text-white shadow hover:bg-liz/90 disabled:opacity-60 sm:w-auto"
          >
            {busy ? "Making your forms…" : "Make my forms"}
          </button>
        )}
        {error && <p className="text-base font-medium text-red-700">{error}</p>}
        {packet && (
          <div className="space-y-4">
            {GROUPS.map((g) => {
              const files = packet.files.filter((f) => f.group === g.key);
              if (!files.length) return null;
              return (
                <section key={g.key} className="space-y-2">
                  <h4 className="text-base font-semibold text-slate-900">{g.title}</h4>
                  <p className="text-sm text-slate-600">{g.intro}</p>
                  <ul className="divide-y divide-slate-200 rounded-xl border border-slate-200">
                    {files.map((f) => (
                      <li key={f.fileName} className="flex flex-wrap items-center justify-between gap-3 p-3">
                        <div className="min-w-0 flex-1">
                          <div className="text-base font-medium text-slate-900">
                            {f.fileName.replace(/\.pdf$/, "")} · {FORM_NAMES[f.id]}
                          </div>
                          <div className="text-sm text-slate-600">
                            {howToUse(f, a)}
                            {f.sheetTitles.length > 0 && ` Includes ${f.sheetTitles.length} attached sheet(s).`}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => download(f.fileName, f.bytes)}
                          className="rounded-lg border border-liz px-4 py-2 text-sm font-medium text-liz hover:bg-liz/5 print:hidden"
                        >
                          Download
                        </button>
                      </li>
                    ))}
                  </ul>
                </section>
              );
            })}
            <button type="button" onClick={zipAll} className="rounded-xl bg-liz px-6 py-3 text-base font-semibold text-white hover:bg-liz/90 print:hidden">
              Download all (zip)
            </button>
            <button type="button" onClick={make} className="ml-3 text-sm font-medium text-liz hover:underline print:hidden">
              Make them again
            </button>
            <div className="rounded-xl border border-liz/30 bg-liz/5 p-4 print:hidden">
              <p className="text-base text-slate-800">This page has your instructions. Keep a copy.</p>
              <button
                type="button"
                onClick={() => {
                  notePrint();
                  window.print();
                }}
                className="mt-2 rounded-lg border border-liz bg-white px-4 py-2 text-sm font-semibold text-liz hover:bg-liz/5"
              >
                Print or save these instructions
              </button>
              <p className="mt-1 text-sm text-slate-600">To save, choose &quot;Save as PDF&quot; in the print window.</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm print:hidden">
              <h4 className="text-lg font-semibold text-slate-900">File online with LIZ</h4>
              <p className="mt-1 text-base text-slate-700">
                Skip the trip to the courthouse. E-file your forms with the {a.S1 ? `${a.S1} County` : "your"} court through the LIZ
                e-filing portal, from anywhere.
              </p>
              <p className="mt-1 text-sm text-slate-600">
                Download your forms first. The portal opens in a new tab so this page and your forms stay open.
              </p>
              <a
                href={EFILE_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 inline-flex items-center gap-2 rounded-xl bg-liz px-5 py-3 text-base font-semibold text-white hover:bg-liz/90"
              >
                Go to e-filing
                <span aria-hidden="true">→</span>
              </a>
            </div>
            <Group title="What to do next">
              <ol className="list-decimal space-y-2 pl-5 text-base text-slate-700">
                <li>
                  {a.sig
                    ? "Print the forms and read them. Your signature is already on them. "
                    : "Print the forms, read them, and sign DV-100 (page 13) and any other form with a signature line. "}
                  Don&apos;t sign the order forms (
                  {packet.files
                    .map((f) => f.id)
                    .filter((id) => ["DV-109", "DV-110", "DV-140", "DV-145", "DV-900", "DV-165", "DV-130", "DV-150"].includes(id))
                    .join(", ")}
                  ); the judge does.
                </li>
                <li>
                  E-file them through LIZ at efile.lizbreakfree.org, or take them to the {a.S1 ? `${a.S1} County` : "county"} Superior
                  Court clerk. Filing is free. Attach copies of any orders you listed
                  {a.orders.O15 && a.C6 === "Y" ? ", including your current custody order" : ""}.
                </li>
                <li>
                  Get your stamped papers back, usually the same or next business day. If you e-file through LIZ, the court emails them to
                  the address on your e-filing account. If you file at the courthouse, the clerk gives them to you. Your court date is on
                  DV-109.
                </li>
                <li>
                  {a.V1 === "sheriff" ? (
                    <>
                      Have the {a.V2 || a.S1} County sheriff serve them. Service is free. Go to lizbreakfree.org and choose{" "}
                      <strong>I need to serve my papers</strong>. You&apos;ll add SER-001 and your stamped papers (the court&apos;s PDFs,
                      or photos of the pages), and send them to the sheriff from your own email. Keep SER-001 until then.
                    </>
                  ) : (
                    <>
                      Have someone 18 or older (not you) give copies to {a.R1 || "the other person"} before the deadline on DV-109. The
                      sheriff does this for free.
                    </>
                  )}
                </li>
                {packet.files.some((f) => f.id === "FL-150") && (
                  <li>
                    {a.sig ? "" : "Sign FL-150 (page 1). "}
                    {a.R1 || "The other person"} must be served with it and a blank FL-150. Bring your last two pay
                    stubs and latest tax return to court, with Social Security numbers blacked out.
                  </li>
                )}
                <li>
                  On your court date, bring 3 copies of DV-130{custodyRequested(a) ? " and DV-150" : ""}, your proof of service (DV-200),
                  {" the LIZ invoice and receipts for any other expenses,"} and anything that supports what you wrote,
                  like photos or texts.
                </li>
                {packet.files.some((f) => f.id === "INT-300") && (
                  <li>File your INT-300 with your other papers so the court can schedule an interpreter for your court date.</li>
                )}
              </ol>
            </Group>
            <p className="text-sm text-slate-500">Signing date on the forms: {fmtDate(a.G1)}.</p>
          </div>
        )}
      </Group>
    </div>
  );
}
