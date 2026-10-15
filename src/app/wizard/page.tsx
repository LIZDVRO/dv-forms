"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";

import { sampleAnswers } from "@/wizard/sample";
import { FINISH, visibleSteps } from "@/wizard/steps";
import { Finish } from "@/wizard/steps/finish";
import { useWizard } from "@/wizard/store";

const QUICK_EXIT_URL = "https://us.shein.com/";

/** Clear everything and leave. replace() keeps the wizard out of the Back button's history. */
function quickExit() {
  useWizard.getState().reset();
  window.location.replace(QUICK_EXIT_URL);
}

export default function WizardPage() {
  const { a, step, dirty, go, load } = useWizard();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const top = useRef<HTMLDivElement>(null);
  // Branch steps (custody, abduction) come after the answers that open them,
  // so the index of the current step does not shift when they appear.
  const STEPS = visibleSteps(a);
  const count = STEPS.length;
  const total = count + 1;
  const onFinish = step >= count;
  const current = onFinish ? FINISH : STEPS[step];

  // Quick exit on Esc.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") quickExit();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Nothing is saved, so warn before the page is closed or refreshed.
  useEffect(() => {
    if (!dirty) return;
    const onLeave = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };
    window.addEventListener("beforeunload", onLeave);
    return () => window.removeEventListener("beforeunload", onLeave);
  }, [dirty]);

  // Staff testing: /wizard?sample fills in a made-up case.
  useEffect(() => {
    if (new URLSearchParams(window.location.search).has("sample")) load(sampleAnswers());
  }, [load]);

  const moveTo = useCallback(
    (n: number) => {
      setErrors({});
      go(Math.max(0, Math.min(count, n)));
      top.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    },
    [go, count],
  );

  const next = () => {
    const errs = onFinish ? {} : (STEPS[step].validate?.(a) ?? {});
    if (Object.keys(errs).length) {
      setErrors(errs);
      return;
    }
    moveTo(step + 1);
  };

  const goToId = (id: string) => {
    const i = STEPS.findIndex((s) => s.id === id);
    if (i >= 0) moveTo(i);
  };

  const Current = onFinish ? null : STEPS[step].Component;
  const blurb = onFinish ? undefined : STEPS[step].blurb;

  return (
    <div ref={top} className="min-h-full flex-1 bg-gradient-to-b from-violet-50/60 via-white to-white">
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur print:hidden">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-4 py-3">
          <div className="flex items-center gap-3">
            <Image src="/liz-logo.png" alt="LIZ" width={36} height={36} className="h-9 w-auto" />
            <span className="hidden text-sm font-medium text-slate-600 sm:inline">Restraining order forms</span>
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
        <div className="mx-auto max-w-3xl px-4 pb-3">
          <div className="mb-1.5 flex justify-between text-xs font-medium text-slate-500">
            <span>
              Step {step + 1} of {total}
            </span>
            <span>{current.title}</span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-liz/10" role="progressbar" aria-valuenow={step + 1} aria-valuemin={1} aria-valuemax={total}>
            <div className="h-full rounded-full bg-liz transition-[width] duration-300" style={{ width: `${((step + 1) / total) * 100}%` }} />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 pb-32 pt-8">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">{current.title}</h1>
        {blurb && <p className="mt-2 text-base text-slate-600">{blurb}</p>}
        <div className="mt-8">{Current ? <Current errors={errors} /> : <Finish goTo={goToId} />}</div>
        {Object.keys(errors).length > 0 && (
          <p className="mt-6 rounded-lg bg-red-50 p-3 text-sm font-medium text-red-800">Please fix the highlighted answers to continue.</p>
        )}
      </main>

      <footer className="fixed inset-x-0 bottom-0 z-20 border-t border-slate-200 bg-white/95 backdrop-blur print:hidden">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-4 py-3">
          <button
            type="button"
            onClick={() => moveTo(step - 1)}
            disabled={step === 0}
            className="rounded-lg px-4 py-2.5 text-base font-medium text-slate-700 hover:bg-slate-100 disabled:invisible"
          >
            ← Back
          </button>
          <p className="hidden text-center text-xs text-slate-500 sm:block">
            Not legal advice. In danger? Call 911. Hotline 1-800-799-7233 (TTY 1-800-787-3224).
          </p>
          {!onFinish && (
            <button
              type="button"
              onClick={next}
              className="rounded-lg bg-liz px-6 py-2.5 text-base font-semibold text-white shadow hover:bg-liz/90"
            >
              {step === 0 ? "Start" : "Continue →"}
            </button>
          )}
          {onFinish && <span className="w-24" />}
        </div>
      </footer>
    </div>
  );
}
