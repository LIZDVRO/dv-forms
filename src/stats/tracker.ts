/**
 * Collects session data while the wizard is open (step times, edits,
 * validation errors, forms made) and sends one statistics record when the
 * person leaves: at the finish screen, when the page is closed, or on Quick
 * Exit. Each page load sends at most once. Nothing is stored in the browser.
 */
import { AGREEMENT_VERSION, consentGiven } from "@/legal/consent";
import type { Answers } from "@/wizard/types";

import { buildStatsRecord, type DeviceInfo, type StepStat, type Trigger } from "./record";

const ENDPOINT = "/api/stats";

interface StepTrack extends StepStat {
  enteredAt: number | null;
}

const t = {
  started: false,
  startedAt: 0,
  device: {} as DeviceInfo,
  steps: new Map<string, StepTrack>(),
  current: "",
  finished: false,
  forms: [] as string[],
  zip: false,
  printed: false,
  sent: false,
  sheriffSent: false,
};

function deviceInfo(): DeviceInfo {
  const ua = navigator.userAgent;
  const touchMac = /Macintosh/.test(ua) && navigator.maxTouchPoints > 1;
  const device_type = /iPad|Tablet/.test(ua) || touchMac || (/Android/.test(ua) && !/Mobile/.test(ua)) ? "tablet" : /Mobi|iPhone|Android/.test(ua) ? "phone" : "desktop";
  const os = /iPhone|iPad|iPod/.test(ua) || touchMac
    ? "iOS"
    : /Android/.test(ua)
      ? "Android"
      : /CrOS/.test(ua)
        ? "ChromeOS"
        : /Windows/.test(ua)
          ? "Windows"
          : /Mac OS X|Macintosh/.test(ua)
            ? "macOS"
            : /Linux/.test(ua)
              ? "Linux"
              : "Other";
  const browser = /Edg\//.test(ua)
    ? "Edge"
    : /SamsungBrowser/.test(ua)
      ? "Samsung Internet"
      : /Firefox|FxiOS/.test(ua)
        ? "Firefox"
        : /Chrome|CriOS/.test(ua)
          ? "Chrome"
          : /Safari/.test(ua)
            ? "Safari"
            : "Other";
  const conn = (navigator as Navigator & { connection?: { type?: string } }).connection?.type;
  const connection_type = conn === "wifi" ? "wifi" : conn === "cellular" ? "cellular" : "unknown";
  let referrer_domain: string | undefined;
  try {
    const host = document.referrer ? new URL(document.referrer).hostname : "";
    if (host && host !== location.hostname) referrer_domain = host;
  } catch {
    // Unreadable referrer: leave it out.
  }
  const q = new URLSearchParams(location.search);
  // The homepage sends no referrer, so its links pass the source as ?ref= (a domain only).
  const ref = q.get("ref")?.trim().toLowerCase();
  if (!referrer_domain && ref && /^[a-z0-9.-]{1,100}$/.test(ref)) referrer_domain = ref;
  return {
    device_type,
    os,
    browser,
    screen_w: screen.width,
    screen_h: screen.height,
    browser_language: navigator.language,
    connection_type,
    referrer_domain,
    utm_source: q.get("utm_source") ?? undefined,
    utm_medium: q.get("utm_medium") ?? undefined,
    utm_campaign: q.get("utm_campaign") ?? undefined,
  };
}

/** Call once when the wizard opens. */
export function startTracking() {
  if (t.started) return;
  t.started = true;
  t.startedAt = Date.now();
  t.device = deviceInfo();
}

function closeCurrent(now: number) {
  const cur = t.steps.get(t.current);
  if (cur?.enteredAt) {
    cur.seconds += Math.round((now - cur.enteredAt) / 1000);
    cur.enteredAt = null;
  }
}

/** The wizard is now showing this step (step id, or "finish"). */
export function enterStep(id: string) {
  if (!t.started || id === t.current) return;
  const now = Date.now();
  closeCurrent(now);
  let st = t.steps.get(id);
  if (!st) {
    st = { step: id, seq: t.steps.size + 1, seconds: 0, visits: 0, edits: 0, errors: 0, enteredAt: null };
    t.steps.set(id, st);
  }
  st.visits += 1;
  st.enteredAt = now;
  t.current = id;
  if (id === "finish") t.finished = true;
}

/** An answer changed. Counts as an edit when the step is being revisited. */
export function noteEdit() {
  const st = t.steps.get(t.current);
  if (st && st.visits > 1) st.edits += 1;
}

export function noteErrors(count: number) {
  const st = t.steps.get(t.current);
  if (st) st.errors += count;
}

export function noteForms(ids: string[]) {
  t.forms = ids;
}

export const noteZip = () => void (t.zip = true);
export const notePrint = () => void (t.printed = true);

/** Send the record once, and only after the person accepted the User Agreement. Returns false when nothing was sent. */
export function sendStats(trigger: Trigger, a: Answers, worthSending: boolean): boolean {
  if (!t.started || t.sent || !worthSending || !consentGiven()) return false;
  t.sent = true;
  const now = Date.now();
  closeCurrent(now);
  try {
    const record = buildStatsRecord(a, {
      version: process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA?.slice(0, 7) || "dev",
      agreementVersion: AGREEMENT_VERSION,
      startedAt: t.startedAt,
      now,
      trigger: trigger === "left_page" && t.finished ? "finish" : trigger,
      completed: t.finished,
      lastStep: t.current,
      quickExitStep: trigger === "quick_exit" ? t.current : undefined,
      steps: [...t.steps.values()].map((x) => ({ step: x.step, seq: x.seq, seconds: x.seconds, visits: x.visits, edits: x.edits, errors: x.errors })),
      forms: t.forms,
      zipDownloaded: t.zip,
      instructionsPrinted: t.printed,
      device: t.device,
    });
    return post({ kind: "session", ...record });
  } catch (e) {
    console.warn("Stats not sent", e);
    return false;
  }
}

/** One row per sheriff-page visit, on the first send action (not linked to any wizard session). */
export function sendSheriffStats(row: { county: string; channel: "share_sheet" | "mailto" | "civil_connect" | "fax_shown"; photo_count: number; pdf_count: number }) {
  if (t.sheriffSent || !consentGiven()) return false;
  t.sheriffSent = true;
  return post({ kind: "sheriff", sheriff: row, website: "" });
}

/** sendBeacon survives the page closing; fetch with keepalive is the fallback. */
function post(body: unknown): boolean {
  const json = JSON.stringify(body);
  try {
    if (navigator.sendBeacon?.(ENDPOINT, new Blob([json], { type: "application/json" }))) return true;
  } catch {
    // Fall through to fetch.
  }
  try {
    void fetch(ENDPOINT, { method: "POST", body: json, headers: { "Content-Type": "application/json" }, keepalive: true }).catch(() => {});
    return true;
  } catch {
    return false;
  }
}
