"use client";

/**
 * Send the papers to the sheriff for service (SER-001 + court-endorsed papers).
 *
 * Everything happens in this browser tab: the files are put together here and never
 * uploaded to LIZ. The survivor sends them from their own email, or uploads them to the
 * county's portal (Fresno's Civil Connect takes SER-001, the signed order and the other
 * papers as separate files). Gov. Code § 26666.5 requires every sheriff to accept requests
 * electronically.
 */
import { useEffect, useMemo, useRef, useState } from "react";

import { ConsentBoxes, TERMS_URL, useConsent } from "@/legal/consent";
import { fmtDate } from "@/wizard/derive";
import { Group, Note, Question, SignaturePad, Text } from "@/wizard/ui/fields";
import { SHERIFF_COUNTIES, SHERIFF_OFFICES, type Portal, type SheriffOffice } from "@/sheriff/offices";
import { buildSheriffFiles, buildSheriffPdf, deadlineFrom, emailText, ser001Signed, type Added, type SerStatus, type SheriffFile } from "@/sheriff/packet";
import { Ser001Form } from "@/sheriff/Ser001Form";
import type { Ser001Details } from "@/sheriff/ser001";
import { LizLogo } from "@/components/LizLogo";

const QUICK_EXIT_URL = "https://us.shein.com/";
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

/** One combined PDF (sheriffs that take email), or separate files (one per portal upload box). */
type Made =
  | { kind: "one"; bytes: Uint8Array; pages: number; serStatus: SerStatus; fileName: string }
  | { kind: "separate"; files: SheriffFile[]; serStatus: SerStatus; details: Ser001Details | null };

export default function SheriffPage() {
  const [county, setCounty] = useState("");
  const [ser, setSer] = useState<File | null>(null);
  /** SER-001 came from the short form on this page (so it still needs a signature). */
  const [serHere, setSerHere] = useState(false);
  const [showSerForm, setShowSerForm] = useState(false);
  /** Whether the added SER-001 already carries a drawn signature: null while unknown, or for a photo. */
  const [serSigned, setSerSigned] = useState<boolean | null>(null);
  const serIsPdf = !!ser && (ser.type === "application/pdf" || /\.pdf$/i.test(ser.name));
  /** SER-001 must be signed. A PDF without a drawn signature is signed on this page. */
  const needsSignature = serIsPdf && serSigned === false;
  const [order, setOrder] = useState<Added[]>([]);
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
  const agreed = useConsent((c) => c.age && c.lawyer && c.terms);
  const [started, setStarted] = useState(false);

  const office: SheriffOffice | undefined = SHERIFF_OFFICES[county];
  const separate = !!office?.portal?.separateFiles;
  const deadline = useMemo(() => deadlineFrom(hearingDate, Number(days)), [hearingDate, days]);
  // A signature drawn here only goes on a SER-001 that needs one.
  const details = { caseNumber, hearingDate, deadline, signature: needsSignature ? signature : "" };
  const dirty = !!(ser || order.length || papers.length);

  // ?county=Fresno from the wizard's finish screen.
  useEffect(() => {
    const c = new URLSearchParams(window.location.search).get("county");
    if (c && SHERIFF_OFFICES[c]) setCounty(c);
  }, []);

  // Esc leaves at once and clears what was added.
  const stateReset = useRef(() => {});
  stateReset.current = () => {
    setSer(null);
    setSerHere(false);
    setShowSerForm(false);
    setOrder([]);
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

  // Check whether the SER-001 added is already signed.
  useEffect(() => {
    let live = true;
    setSerSigned(null);
    if (ser && serIsPdf) ser.arrayBuffer().then(ser001Signed).then((v) => live && setSerSigned(v));
    return () => {
      live = false;
    };
  }, [ser, serIsPdf]);
  // Any change means the PDF has to be made again.
  useEffect(() => setMade(null), [county, ser, order, papers, caseNumber, hearingDate, days, signature]);

  const fileName = `Sheriff-request${caseNumber.trim() ? `-${caseNumber.trim().replace(/[^\w-]+/g, "")}` : ""}.pdf`;

  const make = async () => {
    setError("");
    if (!ser) return setError("Add your SER-001 first, or fill one out in step 2. The sheriff can't accept the request without it.");
    if (serIsPdf && serSigned === null) return setError("Still checking your SER-001. Try again in a moment.");
    if (needsSignature && !signature) return setError("Sign your SER-001 in step 2. The sheriff can't serve your papers without your signature.");
    if (separate && !order.length) return setError("Add your signed temporary restraining order (DV-110).");
    if (!order.length && !papers.length) return setError("Add the papers the court gave back to you.");
    if (!caseNumber.trim()) return setError("Enter the case number from your papers.");
    setBusy(true);
    try {
      const maxBytes = (office?.portal?.maxFileMb ?? Infinity) * 1024 * 1024;
      if (separate) {
        const out = await buildSheriffFiles(ser, order, papers, details, maxBytes);
        setMade({ kind: "separate", ...out });
      } else {
        const out = await buildSheriffPdf(ser, [...order, ...papers], details, Math.min(maxBytes, EMAIL_LIMIT));
        setMade({ kind: "one", ...out, fileName });
        if (typeof navigator !== "undefined" && "canShare" in navigator) {
          const f = new File([out.bytes as BlobPart], fileName, { type: "application/pdf" });
          setCanShareFiles(navigator.canShare({ files: [f] }));
        }
      }
    } catch (e) {
      console.error(e);
      setError("Something went wrong putting your papers together. If a file is password-protected or damaged, try a photo of those pages instead.");
    } finally {
      setBusy(false);
    }
  };

  const mail = office && made?.kind === "one" ? emailText(details, office.county) : null;
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
    if (made?.kind !== "one" || !office?.email || !mail) return;
    // The share sheet can attach the file but can't fill in the "To" line, so copy the address first.
    await copy(office.email, "address");
    const file = new File([made.bytes as BlobPart], made.fileName, { type: "application/pdf" });
    try {
      await navigator.share({ files: [file], title: mail.subject, text: mail.body });
    } catch {
      // Closed the share sheet: nothing to do.
    }
  };

  return (
    <div className="min-h-full flex-1 bg-gradient-to-b from-violet-50/60 via-white to-white">
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-4 py-3">
          <div className="flex items-center gap-3">
            <LizLogo className="h-9 w-auto" />
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
        {!started ? (
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">Send your papers to the sheriff</h1>
              <p className="mt-2 text-base text-slate-600">
                Have the sheriff serve your restraining order papers, for free. First, please read and agree to how this service works.
              </p>
            </div>
            <ConsentBoxes />
            <button
              type="button"
              onClick={() => setStarted(true)}
              disabled={!agreed}
              className="w-full rounded-xl bg-liz px-6 py-4 text-lg font-semibold text-white shadow hover:bg-liz/90 disabled:cursor-not-allowed disabled:opacity-40 sm:w-auto"
            >
              Start
            </button>
          </div>
        ) : (
          <>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">Send your papers to the sheriff</h1>
          <p className="mt-2 text-base text-slate-600">
            Once the court gives back your stamped papers, use this page to send them to the sheriff electronically. The sheriff will
            serve them on the other person for free. Do it as soon as you get them, because the papers must be served before your
            court date.
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
              the file below.
            </Note>
          )}
        </Group>

        <Group title="2. Your SER-001">
          <p className="text-base text-slate-700">
            SER-001 asks the sheriff to serve your papers. It was in the &quot;Keep for later&quot; folder of your LIZ forms. We add the case
            number, court date and deadline for you.
          </p>
          {serHere && ser ? (
            <p className="text-base text-slate-800">
              ✓ SER-001 filled out here.{" "}
              <button type="button" onClick={() => setShowSerForm(true)} className="font-medium text-liz underline">
                Change it
              </button>
            </p>
          ) : (
            <Question label="Add the SER-001 from your LIZ forms">
              <FilePick
                accept={ACCEPT}
                label={ser ? "Change file" : "Choose SER-001"}
                onFiles={(fs) => {
                  if (!fs[0]) return;
                  setSer(fs[0]);
                  setSerHere(false);
                  setShowSerForm(false);
                }}
              />
              {ser && <p className="text-sm text-slate-700">✓ {ser.name}</p>}
            </Question>
          )}
          {!showSerForm && !serHere && (
            <p className="text-base text-slate-700">
              Don&apos;t have it?{" "}
              <button type="button" onClick={() => setShowSerForm(true)} className="font-medium text-liz underline">
                Fill out SER-001 here
              </button>{" "}
              with what&apos;s on the papers the court gave back. It takes a few minutes.
            </p>
          )}
          {/* Kept mounted once opened, so "Change it" brings back the answers already given. */}
          {(showSerForm || serHere) && county && county !== "other" && (
            <div className={showSerForm ? undefined : "hidden"}>
              <Ser001Form
                county={county}
                onDone={(file) => {
                  setSer(file);
                  setSerHere(true);
                  setShowSerForm(false);
                }}
              />
            </div>
          )}
          {showSerForm && (!county || county === "other") && <Note tone="warn">Choose the county in step 1 first.</Note>}
          {needsSignature && (
            <SignaturePad
              label="Sign your SER-001"
              hint="Draw your signature with your finger or mouse. The sheriff must accept an electronic signature."
              value={signature}
              onChange={setSignature}
              optional={false}
            />
          )}
          {serIsPdf && serSigned === true && <p className="text-sm text-slate-700">✓ Your SER-001 is already signed.</p>}
          {ser && !serIsPdf && (
            <Note tone="warn">Make sure your SER-001 is signed on page 4. The sheriff can&apos;t serve your papers without your signature.</Note>
          )}
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
          <ul className="list-disc space-y-1 pl-5 text-base text-slate-700">
            <li>
              <strong>E-filed through LIZ?</strong> The court emailed the stamped copies to the address on your e-filing account. Save the
              PDFs from that email, then add them here.
            </li>
            <li>
              <strong>Filed at the courthouse?</strong> Take a clear photo of every page the clerk gave you.
            </li>
          </ul>
          <Question
            label="Your signed temporary restraining order (DV-110)"
            hint={
              separate
                ? `${office?.county} County needs this as its own file. It shows the sheriff the judge granted your order, so service is free.`
                : "The order with the judge's signature. Add every page."
            }
            optional={!separate}
          >
            <PaperList items={order} onChange={setOrder} pickLabel="Add DV-110" />
          </Question>
          <Question
            label="Everything else the court gave back"
            hint="DV-109, DV-100 and any others the court returned (like DV-105 and DV-140), plus the blank DV-120 and DV-120-INFO."
          >
            <PaperList items={papers} onChange={setPapers} pickLabel="Add PDFs or photos" />
          </Question>
          <Note tone="warn">
            The sheriff only serves papers with the court&apos;s seal and the judge&apos;s signature. Send the copies the court returned, not
            the ones you printed before filing.
          </Note>
        </Group>

        <Group title={separate ? "5. Make your files" : "5. Make one file"}>
          <button
            type="button"
            onClick={make}
            disabled={busy}
            className="w-full rounded-xl bg-liz px-6 py-4 text-lg font-semibold text-white shadow hover:bg-liz/90 disabled:opacity-60 sm:w-auto"
          >
            {busy ? "Putting it together…" : "Make my sheriff request"}
          </button>
          {error && <p className="text-base font-medium text-red-700">{error}</p>}
          {made?.kind === "one" && (
            <div className="space-y-2">
              <p className="text-base text-slate-800">
                ✓ {made.fileName}: {made.pages} pages, {mb(made.bytes.length)}. SER-001 is first.
              </p>
              <button
                type="button"
                onClick={() => save(made.fileName, made.bytes)}
                className="rounded-lg border border-liz px-4 py-2 text-sm font-medium text-liz hover:bg-liz/5"
              >
                Download to check it
              </button>
            </div>
          )}
          {made?.kind === "separate" && (
            <p className="text-base text-slate-800">
              ✓ {made.files.length} files are ready. Download them in step 6.
            </p>
          )}
          {made?.serStatus === "as-is" && (
            <Note tone="warn">
              We couldn&apos;t fill in this SER-001, so make sure it has the case number on each page, and the court date (item 5c) and
              deadline (item 5d) written in.
            </Note>
          )}
        </Group>

        {made?.kind === "one" && (
          <Send office={office} made={made} mailto={mailto} canShareFiles={canShareFiles} onShare={share} copy={copy} copied={copied} subject={mail?.subject ?? ""} />
        )}
        {made?.kind === "separate" && office?.portal && (
          <PortalUpload office={office} portal={office.portal} files={made.files} details={made.details} caseNumber={caseNumber.trim()} />
        )}

          </>
        )}

        <p className="text-center text-xs text-slate-500">
          Not legal advice. In danger? Call 911. National Domestic Violence Hotline 1-800-799-7233 (TTY 1-800-787-3224).{" "}
          <a href={TERMS_URL} target="_blank" rel="noopener noreferrer" className="underline">
            User Agreement
          </a>
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
  made: Extract<Made, { kind: "one" }>;
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

/** A list of added papers (PDFs or photos of pages) that can be reordered and removed. */
function PaperList({ items, onChange, pickLabel }: { items: Added[]; onChange: (v: Added[]) => void; pickLabel: string }) {
  const add = (fs: File[]) => onChange([...items, ...fs.map((file) => ({ id: newId(), file }))]);
  const move = (i: number, by: number) => {
    const j = i + by;
    if (j < 0 || j >= items.length) return;
    const next = [...items];
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
  };
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        <FilePick accept={ACCEPT} multiple label={pickLabel} onFiles={add} />
        <FilePick accept="image/*" capture label="Take a photo of a page" onFiles={add} subtle />
      </div>
      {items.length > 0 && (
        <ol className="divide-y divide-slate-200 rounded-xl border border-slate-200">
          {items.map((p, i) => (
            <li key={p.id} className="flex items-center justify-between gap-2 p-3">
              <span className="min-w-0 flex-1 truncate text-sm text-slate-800">
                {i + 1}. {p.file.name}
              </span>
              <span className="flex shrink-0 gap-1">
                <IconBtn label="Move up" onClick={() => move(i, -1)} disabled={i === 0}>
                  ↑
                </IconBtn>
                <IconBtn label="Move down" onClick={() => move(i, 1)} disabled={i === items.length - 1}>
                  ↓
                </IconBtn>
                <IconBtn label="Remove" onClick={() => onChange(items.filter((x) => x.id !== p.id))}>
                  ✕
                </IconBtn>
              </span>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

/** Which upload box each file goes in on Fresno's Civil Connect. */
const SLOT_BOX: Record<SheriffFile["slot"], string> = {
  ser: "the SER-001 box",
  order: "the box for your granted restraining order",
  other: "the box for other (supporting) documents",
};

/**
 * Step-by-step for a portal with one upload box per document (Fresno's Civil Connect).
 * Its screens are Personal, File Type, Upload and Receipt.
 */
function PortalUpload({
  office,
  portal,
  files,
  details,
  caseNumber,
}: {
  office: SheriffOffice;
  portal: Portal;
  files: SheriffFile[];
  details: Ser001Details | null;
  caseNumber: string;
}) {
  const limit = (portal.maxFileMb ?? Infinity) * 1024 * 1024;
  const tooBig = files.filter((f) => f.bytes.length > limit);
  const primary = "inline-flex items-center justify-center gap-2 rounded-xl bg-liz px-5 py-3 text-base font-semibold text-white hover:bg-liz/90";
  const secondary = "inline-flex items-center justify-center rounded-lg border border-liz bg-white px-4 py-2 text-sm font-semibold text-liz hover:bg-liz/5";

  return (
    <Group title={`6. Upload them to ${portal.label}`}>
      <p className="text-base text-slate-700">
        {office.name} takes requests online through {portal.label}. It has a separate box for each file, so we made {files.length} files.
      </p>
      {tooBig.length > 0 && (
        <Note tone="warn">
          {tooBig.map((f) => f.fileName).join(" and ")} {tooBig.length > 1 ? "are" : "is"} over {portal.maxFileMb} MB, which{" "}
          {portal.label} won&apos;t take. Retake those photos a little farther away, then make your files again.
        </Note>
      )}
      <ol className="list-decimal space-y-4 pl-5 text-base text-slate-700">
        <li>
          <p>Download your files.</p>
          <ul className="mt-2 space-y-2">
            {files.map((f) => (
              <li key={f.fileName} className="flex flex-wrap items-center gap-2">
                <button type="button" onClick={() => save(f.fileName, f.bytes)} className={secondary}>
                  Download {f.fileName}
                </button>
                <span className="text-sm text-slate-500">
                  {f.pages} pages, {mb(f.bytes.length)}
                </span>
              </li>
            ))}
          </ul>
        </li>
        <li>
          <a href={portal.url} target="_blank" rel="noopener noreferrer" className={primary}>
            Open {portal.label} <span aria-hidden="true">→</span>
          </a>
          <p className="mt-1 text-sm text-slate-600">It opens in a new tab, so this page stays open.</p>
        </li>
        <li>Read their notice, type your initials, check the box, and choose <strong>Get started</strong>.</li>
        <li>
          <strong>Personal:</strong> enter your details. Use the same ones as on your SER-001, with a phone number and email the other
          person can&apos;t see.
          <CopyDetails details={details} caseNumber={caseNumber} />
        </li>
        <li>
          <strong>File Type:</strong> choose a restraining order. When it asks how you&apos;re paying, choose the option for a{" "}
          <strong>granted restraining order</strong>. Serving a granted restraining order is free.
        </li>
        <li>
          <strong>Upload:</strong> put each file in its own box:
          <ul className="mt-1 list-disc space-y-1 pl-5">
            {files.map((f) => (
              <li key={f.fileName}>
                {f.fileName} goes in {SLOT_BOX[f.slot]}.
              </li>
            ))}
          </ul>
          Then submit.
        </li>
        <li>
          <strong>Receipt:</strong> write down the ticket number, or take a screenshot. You&apos;ll need it if you call about your request.
        </li>
      </ol>
      <Note>
        {portal.label} shows a notice about a printing charge of $1.25 a page. By law, serving a granted restraining order is free. If
        they ask you to pay, call the Civil Unit at{" "}
        <a href={`tel:${office.phone}`} className="font-medium text-liz underline">
          {office.phone}
        </a>
        .
      </Note>
      {office.notes.length > 0 && (
        <ul className="list-disc space-y-1 pl-5 text-sm text-slate-700">
          {office.notes.map((n) => (
            <li key={n}>{n}</li>
          ))}
        </ul>
      )}
      <Group title="After you submit">
        <ul className="list-disc space-y-1 pl-5 text-base text-slate-700">
          <li>
            If you don&apos;t hear back in 2 business days, call {office.phone} and give your ticket number.
          </li>
          <li>The sheriff sends you a proof of service. File it with the court before your court date.</li>
          <li>Keep your own copy of the temporary order with you. Any officer can serve it if you call 911 and the other person is there.</li>
          <li>On a shared device, delete the downloaded files when you&apos;re done.</li>
        </ul>
      </Group>
    </Group>
  );
}

/**
 * The details a sheriff's website asks for, read off SER-001, each with a Copy button.
 * LIZ can't type into the sheriff's website, so this is the next best thing.
 */
function CopyDetails({ details, caseNumber }: { details: Ser001Details | null; caseNumber: string }) {
  const [copied, setCopied] = useState("");
  if (!details) {
    return <p className="mt-1 text-sm text-slate-600">Your name, address, phone and email are on your SER-001, item 2.</p>;
  }
  const rows: [string, string][] = (
    [
      ["Your name", details.name],
      ["Street address", details.street],
      ["City", details.city],
      ["State", details.state],
      ["ZIP", details.zip],
      ["Phone", details.phone],
      ["Email", details.email],
      ["Case number", details.caseNumber || caseNumber],
      ["Person to be served", details.personToServe],
    ] as [string, string][]
  ).filter(([, v]) => v);
  const copy = async (label: string, value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(label);
      setTimeout(() => setCopied(""), 2000);
    } catch {
      setCopied("");
    }
  };
  return (
    <div className="mt-2 rounded-lg border border-slate-200 bg-slate-50 p-3">
      <p className="text-sm text-slate-600">From your SER-001. Tap Copy, then paste into the matching box on the sheriff&apos;s site.</p>
      <dl className="mt-2 divide-y divide-slate-200">
        {rows.map(([label, value]) => (
          <div key={label} className="flex items-center justify-between gap-3 py-1.5">
            <div className="min-w-0">
              <dt className="text-xs text-slate-500">{label}</dt>
              <dd className="truncate text-sm text-slate-900">{value}</dd>
            </div>
            <button
              type="button"
              onClick={() => copy(label, value)}
              className="shrink-0 rounded-lg border border-liz bg-white px-3 py-1 text-sm font-medium text-liz hover:bg-liz/5"
            >
              {copied === label ? "Copied" : "Copy"}
            </button>
          </div>
        ))}
      </dl>
    </div>
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
