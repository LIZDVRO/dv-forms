"use client";

/**
 * Send the papers to the sheriff for service (SER-001 + court-endorsed papers).
 *
 * Everything happens in this browser tab: the files are combined into one PDF here and
 * never uploaded to LIZ. The survivor sends it from their own email (or the county's
 * portal). Gov. Code § 26666.5 requires every sheriff to accept requests by email.
 */
import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";

import { fmtDate } from "@/wizard/derive";
import { Group, Note, Question, SignaturePad, Text } from "@/wizard/ui/fields";
import { SHERIFF_COUNTIES, SHERIFF_OFFICES, type SheriffOffice } from "@/sheriff/offices";
import { buildSheriffPdf, deadlineFrom, emailText, type Added, type SerStatus } from "@/sheriff/packet";

const QUICK_EXIT_URL = "https://us.shein.com/";
const WIZARD_URL = "/wizard";
/** Most email services refuse attachments over about 20–25 MB. */
const EMAIL_LIMIT = 20 * 1024 * 1024;

const ACCEPT = "application/pdf,image/*";

let nextId = 0;
const newId = () => `f${++nextId}`;

const mb = (n: number) => `${(n / (1024 * 1024)).toFixed(1)} MB`;

function save(name: string, bytes: Uint8Array) {
  const url = URL.createObjectURL(new Blob([bytes as BlobPart], { type: "application/pdf" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

interface Made {
  bytes: Uint8Array;
  pages: number;
  serStatus: SerStatus;
  fileName: string;
}

export default function SheriffPage() {
  const [county, setCounty] = useState("");
  const [ser, setSer] = useState<File | null>(null);
  const [papers, setPapers] = useState<Added[]>([]);
  const [caseNumber, setCaseNumber] = useState("");
  const [hearingDate, setHearingDate] = useState("");
  const [days, setDays] = useState("5");
  const [signature, setSignature] = useState("");
  const [made, setMade] = useState<Made | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState("");
  const [canShareFiles, setCanShareFiles] = useState(false);

  const office: SheriffOffice | undefined = SHERIFF_OFFICES[county];
  const deadline = useMemo(() => deadlineFrom(hearingDate, Number(days)), [hearingDate, days]);
  const details = { caseNumber, hearingDate, deadline, signature };
  const dirty = !!(ser || papers.length);

  // ?county=Fresno from the wizard's finish screen.
  useEffect(() => {
    const c = new URLSearchParams(window.location.search).get("county");
    if (c && SHERIFF_OFFICES[c]) setCounty(c);
  }, []);

  // Esc leaves at once and clears what was added.
  const stateReset = useRef(() => {});
  stateReset.current = () => {
    setSer(null);
    setPapers([]);
    setSignature("");
    setMade(null);
  };
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") quickExit();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
  function quickExit() {
    stateReset.current();
    window.location.replace(QUICK_EXIT_URL);
  }

  // Nothing is saved: warn before closing with files added.
  useEffect(() => {
    if (!dirty) return;
    const onLeave = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", onLeave);
    return () => window.removeEventListener("beforeunload", onLeave);
  }, [dirty]);

  // Any change means the PDF has to be made again.
  useEffect(() => setMade(null), [county, ser, papers, caseNumber, hearingDate, days, signature]);

  const fileName = `Sheriff-request${caseNumber.trim() ? `-${caseNumber.trim().replace(/[^\w-]+/g, "")}` : ""}.pdf`;

  const make = async () => {
    setError("");
    if (!ser) return setError("Add your SER-001 first. The sheriff can't accept the request without it.");
    if (!papers.length) return setError("Add the papers the court gave back to you.");
    if (!caseNumber.trim()) return setError("Enter the case number from your papers.");
    setBusy(true);
    try {
      const out = await buildSheriffPdf(ser, papers, details);
      const name = fileName;
      setMade({ ...out, fileName: name });
      if (typeof navigator !== "undefined" && "canShare" in navigator) {
        const f = new File([out.bytes as BlobPart], name, { type: "application/pdf" });
        setCanShareFiles(navigator.canShare({ files: [f] }));
      }
    } catch (e) {
      console.error(e);
      setError("Something went wrong putting your papers together. If a file is password-protected or damaged, try a photo of those pages instead.");
    } finally {
      setBusy(false);
    }
  };

  const mail = office && made ? emailText(details, office.county) : null;
  const mailto =
    office?.email && mail ? `mailto:${office.email}?subject=${encodeURIComponent(mail.subject)}&body=${encodeURIComponent(mail.body)}` : "";

  const copy = async (what: string, label: string) => {
    try {
      await navigator.clipboard.writeText(what);
      setCopied(label);
      setTimeout(() => setCopied(""), 2500);
    } catch {
      setCopied("");
    }
  };

  const share = async () => {
    if (!made || !office?.email || !mail) return;
    // The share sheet can attach the file but can't fill in the "To" line, so copy the address first.
    await copy(office.email, "address");
    const file = new File([made.bytes as BlobPart], made.fileName, { type: "application/pdf" });
    try {
      await navigator.share({ files: [file], title: mail.subject, text: mail.body });
    } catch {
      // Closed the share sheet: nothing to do.
    }
  };

  const move = (i: number, by: number) =>
    setPapers((list) => {
      const next = [...list];
      const j = i + by;
      if (j < 0 || j >= next.length) return list;
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });

  return (
    <div className="min-h-full flex-1 bg-gradient-to-b from-violet-50/60 via-white to-white">
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-4 py-3">
          <div className="flex items-center gap-3">
            <Image src="/liz-logo.png" alt="LIZ" width={36} height={36} className="h-9 w-auto" />
            <span className="hidden text-sm font-medium text-slate-600 sm:inline">Send papers to the sheriff</span>
          </div>
          <button
            type="button"
            onClick={quickExit}
            className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-red-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-400"
            title="Leave this site now (Esc)"
          >
            Quick exit
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-3xl space-y-10 px-4 pb-24 pt-8">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">Send your papers to the sheriff</h1>
          <p className="mt-2 text-base text-slate-600">
            The sheriff serves restraining orders for free, and must accept your request by email. Do this as soon as the court gives
            you back your signed papers. We put everything into one file, and you send it from your own email.
          </p>
          <p className="mt-2 text-sm text-slate-500">
            Your files stay on this device. Nothing is sent to LIZ. Press <kbd className="rounded border bg-white px-1">Esc</kbd> or
            Quick exit to leave fast.
          </p>
        </div>

        <Group title="1. Which county?">
          <Question label="County where the other person will be served" hint="This is the county on your SER-001, item 1.">
            <select
              value={county}
              onChange={(e) => setCounty(e.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-base focus:border-liz focus:outline-none focus:ring-2 focus:ring-liz/25 sm:w-80"
            >
              <option value="">Choose a county</option>
              {SHERIFF_COUNTIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
              <option value="other">Another county</option>
            </select>
          </Question>
          {county === "other" && (
            <Note>
              We don&apos;t have that sheriff&apos;s details yet. Every California sheriff must accept SER-001 and your papers by email. Call that
              county sheriff&apos;s civil unit and ask for the email address for restraining order service requests. You can still make
              the combined file below.
            </Note>
          )}
        </Group>

        <Group title="2. Your SER-001">
          <Question
            label="Add the SER-001 from your LIZ forms"
            hint='It was in the "Keep for later" folder of your download. We add the case number, court date and deadline for you.'
          >
            <FilePick
              accept={ACCEPT}
              label={ser ? "Change file" : "Choose SER-001"}
              onFiles={(fs) => fs[0] && setSer(fs[0])}
            />
            {ser && <p className="text-sm text-slate-700">✓ {ser.name}</p>}
          </Question>
          <SignaturePad
            label="Sign SER-001"
            hint="Only if you didn't sign it when you made your forms. The sheriff must accept an electronic signature."
            value={signature}
            onChange={setSignature}
          />
          <Note>
            Don&apos;t have it? <a href={WIZARD_URL} className="font-medium text-liz underline">Make your forms again</a> and choose the sheriff
            when asked who will serve. A SER-001 you filled out by hand works too: take a photo of each page.
          </Note>
        </Group>

        <Group title="3. From your Notice of Court Hearing (DV-109)">
          <Question label="Case number" hint="Stamped at the top of the papers the court gave back.">
            <Text value={caseNumber} onChange={setCaseNumber} className="sm:w-80" />
          </Question>
          <div className="grid gap-4 sm:grid-cols-2">
            <Question label="Court date" hint="DV-109, item 3.">
              <Text type="date" value={hearingDate} onChange={setHearingDate} />
            </Question>
            <Question label="Days before the court date to serve" hint="DV-109, item 6. Usually 5.">
              <Text inputMode="numeric" value={days} onChange={(v) => setDays(v.replace(/\D/g, ""))} className="sm:w-28" />
            </Question>
          </div>
          {deadline && (
            <p className="text-base text-slate-800">
              Service deadline: <strong>{fmtDate(deadline)}</strong>
            </p>
          )}
        </Group>

        <Group title="4. The papers the court gave back">
          <p className="text-base text-slate-700">
            Add the copies with the court&apos;s stamp and the judge&apos;s signature: DV-109, DV-110 (if the judge signed it), DV-100,
            and any others the court returned (like DV-105 and DV-140). Also add the blank DV-120 and DV-120-INFO. Add a PDF if the court
            emailed them, or take a clear photo of every page.
          </p>
          <FilePick accept={ACCEPT} multiple label="Add PDFs or photos" onFiles={(fs) => setPapers((p) => [...p, ...fs.map((file) => ({ id: newId(), file }))])} />
          <FilePick accept="image/*" capture label="Take a photo of a page" onFiles={(fs) => setPapers((p) => [...p, ...fs.map((file) => ({ id: newId(), file }))])} subtle />
          {papers.length > 0 && (
            <ol className="divide-y divide-slate-200 rounded-xl border border-slate-200">
              {papers.map((p, i) => (
                <li key={p.id} className="flex items-center justify-between gap-2 p-3">
                  <span className="min-w-0 flex-1 truncate text-sm text-slate-800">
                    {i + 1}. {p.file.name}
                  </span>
                  <span className="flex shrink-0 gap-1">
                    <IconBtn label="Move up" onClick={() => move(i, -1)} disabled={i === 0}>
                      ↑
                    </IconBtn>
                    <IconBtn label="Move down" onClick={() => move(i, 1)} disabled={i === papers.length - 1}>
                      ↓
                    </IconBtn>
                    <IconBtn label="Remove" onClick={() => setPapers((list) => list.filter((x) => x.id !== p.id))}>
                      ✕
                    </IconBtn>
                  </span>
                </li>
              ))}
            </ol>
          )}
          <Note tone="warn">
            The sheriff only serves papers with the court&apos;s seal and the judge&apos;s signature. Send the copies the court returned, not
            the ones you printed before filing.
          </Note>
        </Group>

        <Group title="5. Make one file">
          <button
            type="button"
            onClick={make}
            disabled={busy}
            className="w-full rounded-xl bg-liz px-6 py-4 text-lg font-semibold text-white shadow hover:bg-liz/90 disabled:opacity-60 sm:w-auto"
          >
            {busy ? "Putting it together…" : "Make my sheriff request"}
          </button>
          {error && <p className="text-base font-medium text-red-700">{error}</p>}
          {made && (
            <div className="space-y-2">
              <p className="text-base text-slate-800">
                ✓ {made.fileName}: {made.pages} pages, {mb(made.bytes.length)}. SER-001 is first.
              </p>
              {made.serStatus === "as-is" && (
                <Note tone="warn">
                  We couldn&apos;t fill in this SER-001, so make sure it has the case number on each page, and the court date (item 5c) and
                  deadline (item 5d) written in.
                </Note>
              )}
              <button
                type="button"
                onClick={() => save(made.fileName, made.bytes)}
                className="rounded-lg border border-liz px-4 py-2 text-sm font-medium text-liz hover:bg-liz/5"
              >
                Download to check it
              </button>
            </div>
          )}
        </Group>

        {made && <Send office={office} made={made} mailto={mailto} canShareFiles={canShareFiles} onShare={share} copy={copy} copied={copied} subject={mail?.subject ?? ""} />}

        <p className="text-center text-xs text-slate-500">
          Not legal advice. In danger? Call 911. National Domestic Violence Hotline 1-800-799-7233 (TTY 1-800-787-3224).
        </p>
      </main>
    </div>
  );
}

function Send({
  office,
  made,
  mailto,
  canShareFiles,
  onShare,
  copy,
  copied,
  subject,
}: {
  office?: SheriffOffice;
  made: Made;
  mailto: string;
  canShareFiles: boolean;
  onShare: () => void;
  copy: (what: string, label: string) => void;
  copied: string;
  subject: string;
}) {
  const download = () => save(made.fileName, made.bytes);
  const tooBig = made.bytes.length > EMAIL_LIMIT;
  const primary = "inline-flex items-center justify-center gap-2 rounded-xl bg-liz px-5 py-3 text-base font-semibold text-white hover:bg-liz/90";
  const secondary = "inline-flex items-center justify-center rounded-lg border border-liz bg-white px-4 py-2 text-sm font-semibold text-liz hover:bg-liz/5";

  return (
    <Group title="6. Send it to the sheriff">
      <Note>
        Send from an email account the other person can&apos;t get into. The sheriff will write back to it. On a shared device, delete the
        downloaded file and the sent email when you&apos;re done.
      </Note>

      {office?.email && (
        <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-base text-slate-800">
            {office.name}: <strong className="break-all">{office.email}</strong>
          </p>
          {tooBig && (
            <Note tone="warn">
              This file is {mb(made.bytes.length)}, which may be too big to email. Retake the photos a little farther away, or use fewer
              photos per page, and make the file again.
            </Note>
          )}
          {canShareFiles ? (
            <div className="space-y-2">
              <button type="button" onClick={onShare} className={primary}>
                Attach and send from my email app
              </button>
              <p className="text-sm text-slate-600">
                Choose your email app. The file is already attached and the message is written. We copied the sheriff&apos;s address:
                paste it in the &quot;To&quot; line.
                {copied === "address" && <span className="ml-1 font-medium text-green-700">Address copied.</span>}
              </p>
            </div>
          ) : (
            <ol className="list-decimal space-y-3 pl-5 text-base text-slate-700">
              <li>
                <button type="button" onClick={download} className={secondary}>
                  Download the file
                </button>
              </li>
              <li>
                <a href={mailto} className={primary}>
                  Open an email to the sheriff
                </a>
                <p className="mt-1 text-sm text-slate-600">The address, subject and message are filled in.</p>
              </li>
              <li>Attach {made.fileName} from your downloads, and send.</li>
            </ol>
          )}
          {canShareFiles && (
            <p className="text-sm text-slate-600">
              Or{" "}
              <a href={mailto} className="font-medium text-liz underline">
                open an email to the sheriff
              </a>{" "}
              and attach the downloaded file yourself.
            </p>
          )}
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => copy(office.email!, "address")} className={secondary}>
              {copied === "address" ? "Copied" : "Copy address"}
            </button>
            <button type="button" onClick={() => copy(subject, "subject")} className={secondary}>
              {copied === "subject" ? "Copied" : "Copy subject"}
            </button>
          </div>
        </div>
      )}

      {office?.portal && (
        <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-base text-slate-800">{office.name} takes requests online through {office.portal.label}.</p>
          <ol className="list-decimal space-y-3 pl-5 text-base text-slate-700">
            <li>
              <button type="button" onClick={download} className={secondary}>
                Download the file
              </button>
            </li>
            <li>
              <a href={office.portal.url} target="_blank" rel="noopener noreferrer" className={primary}>
                Open {office.portal.label} <span aria-hidden="true">→</span>
              </a>
            </li>
            <li>Upload {made.fileName} as one file. Write down the ticket number they give you.</li>
          </ol>
        </div>
      )}

      {office && !office.email && !office.portal && (
        <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-base text-slate-800">
            {office.name} hasn&apos;t posted an email address for service requests yet. By law they must accept one. Call{" "}
            <a href={`tel:${office.phone}`} className="font-medium text-liz underline">
              {office.phone}
            </a>{" "}
            and ask for the email address for restraining order service requests.
          </p>
          <button type="button" onClick={download} className={secondary}>
            Download the file
          </button>
          <p className="text-sm text-slate-600">
            You can also {office.fax ? `fax it to ${office.fax}, or ` : ""}bring a printed copy to {office.address}.
          </p>
        </div>
      )}

      {office && office.notes.length > 0 && (
        <ul className="list-disc space-y-1 pl-5 text-sm text-slate-700">
          {office.notes.map((n) => (
            <li key={n}>{n}</li>
          ))}
        </ul>
      )}

      {!office && (
        <button type="button" onClick={download} className={secondary}>
          Download the file
        </button>
      )}

      <Group title="After you send it">
        <ul className="list-disc space-y-1 pl-5 text-base text-slate-700">
          <li>Watch for a reply. If you don&apos;t hear back in 2 business days, call {office ? office.phone : "the sheriff's civil unit"}.</li>
          <li>The sheriff sends you a proof of service. File it with the court before your court date.</li>
          <li>Keep your own copy of the temporary order with you. Any officer can serve it if you call 911 and the other person is there.</li>
        </ul>
      </Group>
    </Group>
  );
}

function FilePick({
  accept,
  label,
  onFiles,
  multiple,
  capture,
  subtle,
}: {
  accept: string;
  label: string;
  onFiles: (files: File[]) => void;
  multiple?: boolean;
  capture?: boolean;
  subtle?: boolean;
}) {
  const ref = useRef<HTMLInputElement>(null);
  return (
    <div className={subtle ? "sm:hidden" : undefined}>
      <input
        ref={ref}
        type="file"
        accept={accept}
        multiple={multiple}
        {...(capture ? { capture: "environment" as const } : {})}
        className="hidden"
        onChange={(e) => {
          onFiles(Array.from(e.target.files ?? []));
          e.target.value = "";
        }}
      />
      <button
        type="button"
        onClick={() => ref.current?.click()}
        className={
          subtle
            ? "rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            : "rounded-lg border border-liz bg-white px-4 py-2.5 text-base font-semibold text-liz hover:bg-liz/5"
        }
      >
        {label}
      </button>
    </div>
  );
}

function IconBtn({ label, onClick, disabled, children }: { label: string; onClick: () => void; disabled?: boolean; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      disabled={disabled}
      className="h-9 w-9 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-30"
    >
      {children}
    </button>
  );
}
