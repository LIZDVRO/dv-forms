"use client";

/**
 * Agreement acceptance: three unchecked boxes on the first screen of the wizard and the
 * send-to-sheriff page. Held in memory only, like the wizard's answers, so a refresh or
 * Quick exit means agreeing again.
 */
import { useState } from "react";
import { create } from "zustand";

import { Check } from "@/wizard/ui/fields";

import { AGREEMENT_EFFECTIVE, AGREEMENT_VERSION, PRIVACY_MD, TERMS_MD } from "./agreement";
import { Markdown } from "./markdown";

interface Consent {
  age: boolean;
  lawyer: boolean;
  terms: boolean;
  /** When all three were checked (ISO), for the statistics record. */
  acceptedAt: string;
  set: (key: "age" | "lawyer" | "terms", v: boolean) => void;
}

export const useConsent = create<Consent>((set, get) => ({
  age: false,
  lawyer: false,
  terms: false,
  acceptedAt: "",
  set: (key, v) => {
    set({ [key]: v } as Pick<Consent, typeof key>);
    const s = get();
    set({ acceptedAt: s.age && s.lawyer && s.terms ? s.acceptedAt || new Date().toISOString() : "" });
  },
}));

export const consentGiven = () => {
  const s = useConsent.getState();
  return s.age && s.lawyer && s.terms;
};

export { AGREEMENT_VERSION };

export const TERMS_URL = "/terms";

/** The summary, the full Agreement in a panel, and the three boxes. */
export function ConsentBoxes({ error }: { error?: string }) {
  const { age, lawyer, terms, set } = useConsent();
  const [open, setOpen] = useState(false);
  return (
    <section className="space-y-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
      <h2 className="text-lg font-semibold text-slate-900">Before you start</h2>
      <div className="space-y-2 text-base text-slate-700">
        <p>LIZ is not a law firm and can&apos;t give you legal advice. This tool fills out court forms from your answers; you decide what to file.</p>
        <p>
          Your forms are made on your device. To study abuse and improve help for survivors, we collect a statistical record of how you use
          this tool and your answers, without names, addresses, contact details or your description of what happened. It is sent even if you
          don&apos;t finish.
        </p>
      </div>

      <div>
        <button
          type="button"
          onClick={() => setOpen(!open)}
          aria-expanded={open}
          className="text-base font-medium text-liz underline underline-offset-2"
        >
          {open ? "Hide" : "Read"} the User Agreement and Privacy Policy
        </button>
        {open && (
          <div className="mt-3 max-h-[60vh] overflow-y-auto rounded-lg border border-slate-200 bg-slate-50/60 p-4" tabIndex={0}>
            <p className="text-sm text-slate-500">
              Version {AGREEMENT_VERSION} · Effective {AGREEMENT_EFFECTIVE} ·{" "}
              <a href={TERMS_URL} target="_blank" rel="noopener noreferrer" className="text-liz underline">
                Open on its own page
              </a>
            </p>
            <div className="mt-2">
              <Markdown source={TERMS_MD} />
              <div className="mt-8">
                <Markdown source={PRIVACY_MD} />
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="space-y-2">
        <Check checked={age} onChange={(v) => set("age", v)}>
          I am 18 or older, or I am an adult accepting this Agreement for a person aged 12 to 17.
        </Check>
        <Check checked={lawyer} onChange={(v) => set("lawyer", v)}>
          I understand LIZ is not a law firm and does not give legal advice. LIZ recommends that I talk to a lawyer or my court&apos;s free
          self-help center about any legal question. I am choosing to use this tool without legal advice.
        </Check>
        <Check checked={terms} onChange={(v) => set("terms", v)}>
          I have read and agree to the{" "}
          <a href={TERMS_URL} target="_blank" rel="noopener noreferrer" className="font-medium text-liz underline" onClick={(e) => e.stopPropagation()}>
            User Agreement and Privacy Policy
          </a>
          . I understand that LIZ does not give legal advice, and I agree to release all claims against LIZ, to resolve any dispute by
          individual arbitration with the American Arbitration Association, waiving class actions and jury trials, to indemnify LIZ, and to
          LIZ&apos;s collection of data about my use and answers.
        </Check>
      </div>
      {error && <p className="text-sm font-medium text-red-700">{error}</p>}
      <p className="text-sm font-medium text-slate-700">If you are in danger, call 911.</p>
    </section>
  );
}
