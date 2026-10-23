import type { Metadata } from "next";

import { AGREEMENT_EFFECTIVE, AGREEMENT_VERSION, PRIVACY_MD, TERMS_MD } from "@/legal/agreement";
import { Markdown } from "@/legal/markdown";
import { QuickExitButton } from "@/legal/quick-exit";
import { LizLogo } from "@/components/LizLogo";

export const metadata: Metadata = {
  title: "LIZ — User Agreement and Privacy Policy",
  description: "The terms for using LIZ's restraining order forms, send-to-sheriff page and e-filing portal.",
};

export default function TermsPage() {
  return (
    <div className="min-h-full flex-1 bg-gradient-to-b from-violet-50/60 via-white to-white">
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur print:hidden">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-4 py-3">
          <div className="flex items-center gap-3">
            <LizLogo className="h-9 w-auto" />
            <span className="hidden text-sm font-medium text-slate-600 sm:inline">User Agreement</span>
          </div>
          <QuickExitButton />
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-4 pb-24 pt-8">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">User Agreement and Privacy Policy</h1>
        <p className="mt-2 text-sm text-slate-500">
          LIZ BREAK FREE · Version {AGREEMENT_VERSION} · Effective {AGREEMENT_EFFECTIVE}
        </p>
        <div className="mt-6">
          <Markdown source={TERMS_MD} />
          <div className="mt-10">
            <Markdown source={PRIVACY_MD} />
          </div>
        </div>
      </main>
    </div>
  );
}
