"use client";

import JSZip from "jszip";
import { useState } from "react";

import { custodyRequested, derive, fmtDate } from "../derive";
import { buildFilingPacket, type Packet } from "../fill/packet";
import { useWizard } from "../store";
import { Group, Note, Question, Text } from "../ui/fields";

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
};

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
    packet.files.forEach((f) => zip.file(f.fileName, f.bytes));
    download("DVRO-forms.zip", await zip.generateAsync({ type: "blob" }));
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

      <Group title="Signing">
        <Question label="Date you're signing" hint="You'll sign the printed forms by hand.">
          <Text type="date" value={a.G1} onChange={(v) => set((x) => void (x.G1 = v))} className="sm:w-56" />
        </Question>
        <Note>
          When you sign DV-100, you declare under penalty of perjury that what you wrote is true. Read your forms before you
          sign.
        </Note>
      </Group>

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
            <ul className="divide-y divide-slate-200 rounded-xl border border-slate-200">
              {packet.files.map((f) => (
                <li key={f.fileName} className="flex flex-wrap items-center justify-between gap-3 p-3">
                  <div>
                    <div className="text-base font-medium text-slate-900">
                      {f.fileName.replace(/\.pdf$/, "")} · {FORM_NAMES[f.id]}
                    </div>
                    <div className="text-sm text-slate-600">
                      {f.goesTo === "law enforcement"
                        ? "Give to the clerk. Not filed in the public record."
                        : f.goesTo === "sheriff"
                          ? "Give to the sheriff with copies of your papers after the court returns them. Don't file it."
                          : "File with the court."}
                      {f.sheetTitles.length > 0 && ` Includes ${f.sheetTitles.length} attached sheet(s).`}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => download(f.fileName, f.bytes)}
                    className="rounded-lg border border-liz px-4 py-2 text-sm font-medium text-liz hover:bg-liz/5"
                  >
                    Download
                  </button>
                </li>
              ))}
            </ul>
            <button type="button" onClick={zipAll} className="rounded-xl bg-liz px-6 py-3 text-base font-semibold text-white hover:bg-liz/90">
              Download all (zip)
            </button>
            <button type="button" onClick={make} className="ml-3 text-sm font-medium text-liz hover:underline">
              Make them again
            </button>
            <Group title="What to do next">
              <ol className="list-decimal space-y-2 pl-5 text-base text-slate-700">
                <li>
                  Print the forms, read them, and sign DV-100 (page 13). Don&apos;t sign the order forms (
                  {packet.files
                    .map((f) => f.id)
                    .filter((id) => ["DV-109", "DV-110", "DV-140", "DV-145", "DV-900"].includes(id))
                    .join(", ")}
                  ); the judge does.
                </li>
                <li>
                  Take them to the {a.S1 ? `${a.S1} County` : "county"} Superior Court clerk, or e-file if your court allows it. Filing is
                  free. Attach copies of any orders you listed
                  {a.orders.O15 && a.C6 === "Y" ? ", including your current custody order" : ""}.
                </li>
                <li>Get your papers back the same or next business day. Your court date is on DV-109.</li>
                <li>
                  {a.V1 === "sheriff" ? (
                    <>
                      Take SER-001 and copies of your papers to the {a.V2 || a.S1} County sheriff. First write the case number on each
                      page and, in item 5, the court date and service deadline from your DV-109. Service is free.
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
                    Sign FL-150 (page 1). {a.R1 || "The other person"} must be served with it and a blank FL-150. Bring your last two pay
                    stubs and latest tax return to court, with Social Security numbers blacked out.
                  </li>
                )}
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
