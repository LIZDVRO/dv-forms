"use client";

/**
 * In-app e-filing through Rhetoric, on the finish screen (verified counties only;
 * see courts.ts). Files with real courts when RHETORIC_API_KEY is a live key.
 *
 * 1. "Start e-filing" asks our server to open a filing session, already on the
 *    right court, and (for a new account) with the eFileCA sign-up form filled in.
 * 2. She logs in or creates her account on Rhetoric's screen. LIZ never sees the password.
 * 3. As soon as she is logged in, filling starts on its own: case type, parties,
 *    then each "File now" form as its own entry, one form per request, with
 *    progress shown, then the fee waiver. She reviews and submits.
 * The bot never gives up on its own: when it meets a choice it can't make (or a
 * screen it doesn't know), it fills everything else, shows her that one choice
 * on Rhetoric's screen, and carries on by itself as soon as she picks. Her pick
 * is reused for the rest of the filing.
 * Nothing is saved: the forms pass through to Rhetoric and are not kept.
 */
import { useEffect, useRef, useState } from "react";

import { derive } from "@/wizard/derive";
import type { Packet } from "@/wizard/fill/packet";
import type { Answers } from "@/wizard/types";

import { efileCountyFor } from "./courts";
import { RhetoricElement } from "./RhetoricElement";


/** How often to check whether she has logged in yet. */
const POLL_MS = 3000;

interface Person { first: string; middle?: string; last: string }

/** "Jane Q. Doe" -> first Jane, middle Q., last Doe. The wizard keeps one name field. */
export function splitName(full: string): Person {
  const parts = full.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return { first: "", last: "" };
  if (parts.length === 1) return { first: parts[0], last: parts[0] };
  return { first: parts[0], middle: parts.slice(1, -1).join(" ") || undefined, last: parts[parts.length - 1] };
}

function toBase64(bytes: Uint8Array): string {
  let s = "";
  for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(s);
}

async function post<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  const out = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(out.error || `Something went wrong (${res.status}).`);
  return out as T;
}

interface Needs { screen: string; field: string | null; what: string }
type Step = { ok: true; step: string } | { ok: false; step: string; problem: string } | { ok: false; step: string; needs: Needs };
type Phase = "login" | "filling" | "choose" | "done";
/** Where filling picks up: the case setup, form number `i`, or the fee screens. */
interface ResumeAt { stage: "prepare" | "forms" | "finish"; i: number }

/** Plain words for a stop (technical details go to the browser console only). */
function plainStop(screen: string | undefined, detail: string): string {
  console.error("[e-filing]", detail);
  if (/network|fetch|failed to fetch|timed? ?out|502|503|504/i.test(detail)) {
    return "The connection to the court's filing system dropped for a moment.";
  }
  if (/\$\d/.test(detail)) return detail; // the fee total check is already in plain words
  return screen ? `The filing paused on the "${screen}" step.` : "The filing paused.";
}
interface Progress { done: number; total: number; current: string }

export function EfilePanel({ a, packet }: { a: Answers; packet: Packet }) {
  const fileNow = packet.files.filter((f) => f.group === "file");
  const courts = efileCountyFor(a.S1)?.courts ?? [];
  const supported = courts.length > 0;

  const [account, setAccount] = useState<"existing" | "new">("existing");
  const [courtCode, setCourtCode] = useState(courts.length === 1 ? courts[0].code : "");
  const [signup, setSignup] = useState({
    email: a.P8?.email ?? "",
    address1: a.P6?.street ?? "",
    address2: "",
    city: a.P6?.city ?? "",
    zip: a.P6?.zip ?? "",
    phone: a.P7 ?? "",
  });
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState("");
  /** Rhetoric is waiting for her to click the activation link in her email. */
  const [activation, setActivation] = useState(false);
  /** Rhetoric's screen when the fill stopped; if she moves past it herself, filling resumes. */
  const stoppedAt = useRef<string | null>(null);
  const autoRetries = useRef(0);
  const [session, setSession] = useState<{ sessionToken: string; court: string } | null>(null);
  const [phase, setPhase] = useState<Phase>("login");
  const [progress, setProgress] = useState<Progress | null>(null);
  const [elementKey, setElementKey] = useState(0);
  const running = useRef(false);
  const resumeAt = useRef<ResumeAt>({ stage: "prepare", i: 0 });
  /** Her own picks, by field label, reused whenever the same question comes up again. */
  const picks = useRef<Record<string, string>>({});
  const [waiting, setWaiting] = useState<Needs | null>(null);

  const start = async () => {
    setError("");
    if (!courtCode) {
      setError("Choose the courthouse you're filing in.");
      return;
    }
    if (account === "new" && !signup.email.trim()) {
      setError("Add a safe email for your eFileCA account. The court sends your stamped papers there.");
      return;
    }
    setStarting(true);
    try {
      const out = await post<{ sessionToken: string; court: string }>("/api/rhetoric/session", {
        county: a.S1,
        courtCode,
        account,
        petitioner: splitName(a.P1),
        signup: account === "new" ? signup : undefined,
      });
      setPhase("login");
      setSession(out);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setStarting(false);
    }
  };

  /**
   * Case type and parties, then each form, then on to payment. Picks up where it
   * left off (after her choice, a pause, or "Try again"); forms already added are
   * never added twice.
   */
  const fill = async (token: string) => {
    if (running.current) return;
    running.current = true;
    setError("");
    setWaiting(null);
    setPhase("filling");
    let lastScreen: string | undefined;
    /** A choice or screen for her: show it and wait. True if handed off. */
    const handOff = (r: Step): boolean => {
      if ("needs" in r) {
        setWaiting(r.needs);
        setPhase("choose");
        return true;
      }
      return false;
    };
    try {
      if (resumeAt.current.stage === "prepare") {
        setProgress({ done: 0, total: fileNow.length, current: "your case details" });
        const prep = await post<Step>("/api/rhetoric/prepare", {
          sessionToken: token,
          minorChildren: derive(a).custodyKids.length > 0,
          petitioner: splitName(a.P1),
          respondent: splitName(a.R1),
          answers: picks.current,
        });
        lastScreen = prep.step;
        if (!prep.ok && "problem" in prep && /activation link/i.test(prep.problem)) {
          // Not an error: she still has to activate her new account. Keep waiting.
          setActivation(true);
          setPhase("login");
          return;
        }
        if (handOff(prep)) return;
        if (!prep.ok) throw new Error("problem" in prep ? prep.problem : "");
        resumeAt.current = { stage: "forms", i: 0 };
      }
      if (resumeAt.current.stage === "forms") {
        const copyOf: number[] = [];
        const seen: Record<string, number> = {};
        for (const f of fileNow) copyOf.push((seen[f.id] = (seen[f.id] ?? 0) + 1));
        for (let i = resumeAt.current.i; i < fileNow.length; i++) {
          const f = fileNow[i];
          resumeAt.current = { stage: "forms", i };
          setProgress({ done: i, total: fileNow.length, current: f.id });
          const r = await post<Step>("/api/rhetoric/add-form", {
            sessionToken: token,
            form: f.id,
            fileName: f.fileName,
            contentBase64: toBase64(f.bytes),
            copy: copyOf[i],
            answers: picks.current,
          });
          lastScreen = r.step;
          if (handOff(r)) return;
          if (!r.ok) throw new Error("problem" in r ? r.problem : "");
        }
        resumeAt.current = { stage: "finish", i: 0 };
      }
      setProgress({ done: fileNow.length, total: fileNow.length, current: "" });
      const end = await post<Step>("/api/rhetoric/finish", { sessionToken: token, answers: picks.current });
      lastScreen = end.step;
      if (handOff(end)) return;
      if (!end.ok) throw new Error("problem" in end ? end.problem : "");
      setPhase("done");
    } catch (e) {
      setError(plainStop(lastScreen, e instanceof Error ? e.message : String(e)));
      setPhase("login"); // keeps watching; resumes on its own once she gets past this screen
      stoppedAt.current = null;
      post<{ step: string }>("/api/rhetoric/status", { sessionToken: token })
        .then((st) => { stoppedAt.current = st.step; })
        .catch(() => {});
    } finally {
      running.current = false;
      setElementKey((k) => k + 1); // reload the filing screen so it shows what was filled in
    }
  };

  // Waiting on her choice: check every few seconds; carry on as soon as she has picked.
  useEffect(() => {
    if (!session || phase !== "choose" || !waiting) return;
    let stop = false;
    const timer = setInterval(async () => {
      try {
        const r = await post<{ answered: boolean; choice?: { field: string; label: string } }>("/api/rhetoric/check", {
          sessionToken: session.sessionToken,
          screen: waiting.screen,
          field: waiting.field,
        });
        if (stop || !r.answered) return;
        if (r.choice) picks.current[r.choice.field] = r.choice.label;
        clearInterval(timer);
        void fill(session.sessionToken);
      } catch {
        // A missed check is fine; the next one will try again.
      }
    }, POLL_MS);
    return () => {
      stop = true;
      clearInterval(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session, phase, waiting]);

  // While she is on the login or sign-up screen, check every few seconds whether she's in.
  // After a stop, keep checking: if she gets past the screen it stopped on (for example by
  // activating her new account), filling resumes without her pressing "Try again".
  useEffect(() => {
    if (!session || phase !== "login") return;
    let stop = false;
    const timer = setInterval(async () => {
      try {
        const st = await post<{ step: string; loggedIn: boolean; activation?: boolean }>("/api/rhetoric/status", { sessionToken: session.sessionToken });
        if (!stop) setActivation(!!st.activation);
        if (error) {
          const moved = stoppedAt.current !== null && st.step !== stoppedAt.current;
          if (stop || !st.loggedIn || !moved || autoRetries.current >= 3) return;
          autoRetries.current += 1;
        }
        if (!stop && st.loggedIn) {
          clearInterval(timer);
          void fill(session.sessionToken);
        }
      } catch {
        // A missed check is fine; the next one will try again.
      }
    }, POLL_MS);
    return () => {
      stop = true;
      clearInterval(timer);
    };
    // fill reads the latest answers when it runs; restarting the timer on every render isn't wanted.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session, phase, error]);

  const field = (k: keyof typeof signup, label: string, type = "text") => (
    <label className="block text-sm text-slate-700">
      {label}
      <input
        type={type}
        value={signup[k]}
        onChange={(e) => setSignup({ ...signup, [k]: e.target.value })}
        className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-base"
      />
    </label>
  );

  const pct = progress ? Math.round((progress.done / Math.max(progress.total, 1)) * 100) : 0;

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm print:hidden">
      <h4 className="text-lg font-semibold text-slate-900">File online now</h4>

      {!supported ? (
        <p className="mt-1 text-base text-slate-700">
          {`E-filing from this page isn't available for ${a.S1 || "your"} County yet. Take your "File now" forms to the court clerk.`}
        </p>
      ) : !session ? (
        <div className="mt-2 space-y-3">
          <p className="text-base text-slate-700">
            {`File your ${fileNow.length} "File now" forms with the ${a.S1} County court from here. Filing is free. Every form is filed as confidential.`}
          </p>
          {courts.length > 1 && (
            <label className="block text-sm font-medium text-slate-900">
              {`Which ${a.S1} County courthouse are you filing in?`}
              <select
                value={courtCode}
                onChange={(e) => setCourtCode(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-base font-normal"
              >
                <option value="">Choose a courthouse…</option>
                {courts.map((c) => (
                  <option key={c.code} value={c.code}>{c.label}</option>
                ))}
              </select>
              <span className="mt-1 block text-sm font-normal text-slate-600">Usually the one closest to where you live. The clerk can tell you if you&apos;re not sure.</span>
            </label>
          )}
          <fieldset className="space-y-2">
            <legend className="text-sm font-medium text-slate-900">Do you have an eFileCA account?</legend>
            <label className="flex items-center gap-2 text-base">
              <input type="radio" checked={account === "existing"} onChange={() => setAccount("existing")} />
              Yes, I&apos;ll log in
            </label>
            <label className="flex items-center gap-2 text-base">
              <input type="radio" checked={account === "new"} onChange={() => setAccount("new")} />
              No, make one for me
            </label>
          </fieldset>
          {account === "new" && (
            <div className="space-y-3 rounded-lg bg-slate-50 p-3">
              <p className="text-sm text-slate-700">
                The court emails your stamped papers to this address. Use an email the other person can&apos;t get into.
                You&apos;ll choose a password on the next screen.
              </p>
              {field("email", "Safe email", "email")}
              {field("address1", "Safe mailing address")}
              {field("address2", "Address line 2")}
              <div className="grid gap-3 sm:grid-cols-2">
                {field("city", "City")}
                {field("zip", "ZIP")}
              </div>
              {field("phone", "Safe phone", "tel")}
            </div>
          )}
          <button
            type="button"
            onClick={start}
            disabled={starting}
            className="rounded-xl bg-liz px-5 py-3 text-base font-semibold text-white hover:bg-liz/90 disabled:opacity-60"
          >
            {starting ? "Getting your filing ready…" : "Start e-filing"}
          </button>
        </div>
      ) : (
        <div className="mt-2 space-y-3">
          {phase === "login" && !error && (
            <p className="text-base text-slate-700">
              {activation
                ? "Check your email and click the activation link, then come back here and press \"I've activated my account.\""
                : account === "new"
                  ? "Choose a password and create your eFileCA account below. eFileCA will then email you a link to activate it. Your forms are added as soon as you're in."
                  : "Log in to eFileCA below. Your forms are added as soon as you're in."}
            </p>
          )}
          {phase === "filling" && progress && (
            <div className="rounded-lg border border-liz/30 bg-liz/5 p-3" role="status" aria-live="polite">
              <p className="text-base font-medium text-slate-900">
                {progress.done < progress.total && progress.current !== "your case details"
                  ? `Adding form ${progress.done + 1} of ${progress.total}: ${progress.current}`
                  : progress.done >= progress.total
                    ? "Almost done…"
                    : "Setting up your case…"}
              </p>
              <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-200">
                <div className="h-full bg-liz transition-all" style={{ width: `${pct}%` }} />
              </div>
              <p className="mt-2 text-sm text-slate-600">This can take a few minutes. Keep this page open. You can read the steps below while you wait.</p>
            </div>
          )}
          {phase === "choose" && waiting && (
            <div className="rounded-lg border border-amber-300 bg-amber-50 p-3" role="status" aria-live="polite">
              <p className="text-base font-medium text-slate-900">
                {waiting.field
                  ? `Please choose ${waiting.what} ("${waiting.field}") in the box below. Filing continues as soon as you pick.`
                  : `Please finish the "${waiting.screen}" step in the box below. Filing continues as soon as you're done.`}
              </p>
              {progress && progress.total > 0 && (
                <p className="mt-1 text-sm text-slate-600">{`${progress.done} of ${progress.total} forms added so far. Everything else is already filled in.`}</p>
              )}
            </div>
          )}
          {phase === "done" && (
            <p className="rounded-lg border border-emerald-300 bg-emerald-50 p-3 text-base text-slate-800">
              {`Your case and ${fileNow.length} forms are filled in, with a fee waiver: your total is $0.00. Finish below: press Next, check the three agreement boxes, review everything, and submit.`}
            </p>
          )}
          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3">
              <p className="text-base text-red-800">{error}</p>
              <p className="mt-1 text-base text-slate-800">
                You can finish that step yourself in the box below, and filling picks up again on its own. Or press Try again.
              </p>
              <button
                type="button"
                onClick={() => void fill(session.sessionToken)}
                className="mt-2 rounded-lg bg-liz px-4 py-2 text-sm font-semibold text-white hover:bg-liz/90"
              >
                Try again
              </button>
              <p className="mt-1 text-sm text-slate-600">Forms already added aren&apos;t added twice.</p>
              <p className="mt-2 text-xs text-slate-500">
                If the court&apos;s filing system is down, you can also file through the{" "}
                <a href="https://efile.lizbreakfree.org/" target="_blank" rel="noopener noreferrer" className="underline">
                  LIZ e-filing portal
                </a>
                .
              </p>
            </div>
          )}
          {/* Hidden while we fill, so nothing on it is clicked mid-way; reloaded afterwards. */}
          <div className={`rounded-lg border border-slate-200 p-2 ${phase === "filling" ? "hidden" : ""}`}>
            <RhetoricElement key={elementKey} sessionToken={session.sessionToken} />
          </div>
        </div>
      )}
      {error && !session && (
        <p className="mt-2 text-base font-medium text-red-700">
          {error}{" "}
          <a href="https://efile.lizbreakfree.org/" target="_blank" rel="noopener noreferrer" className="underline">
            You can also file through the LIZ e-filing portal.
          </a>
        </p>
      )}
    </div>
  );
}
