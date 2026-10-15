"use client";

/**
 * Wizard state. Answers live in memory only (no save and resume, by decision):
 * nothing is written to a server, cookies, or browser storage.
 */
import { create } from "zustand";

import { emptyAnswers } from "./defaults";
import type { Answers } from "./types";

interface WizardState {
  a: Answers;
  step: number;
  dirty: boolean;
  /** Update answers with a mutating callback on a copy. */
  set: (fn: (a: Answers) => void) => void;
  load: (a: Answers) => void;
  go: (step: number) => void;
  reset: () => void;
}

export const useWizard = create<WizardState>((setState) => ({
  a: emptyAnswers(),
  step: 0,
  dirty: false,
  set: (fn) =>
    setState((s) => {
      const a = structuredClone(s.a);
      fn(a);
      return { a, dirty: true };
    }),
  load: (a) => setState({ a, dirty: true }),
  go: (step) => setState({ step }),
  reset: () => setState({ a: emptyAnswers(), step: 0, dirty: false }),
}));
