import Link from "next/link";

export default function Home() {
  return (
    <div className="relative flex min-h-full flex-1 flex-col overflow-hidden bg-gradient-to-b from-sky-50 via-white to-blue-50/80">
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(125,211,252,0.35),transparent)]"
        aria-hidden
      />
      <main className="relative z-10 flex flex-1 flex-col items-center justify-center px-6 py-20 sm:px-10">
        <div className="w-full max-w-xl rounded-2xl border border-sky-100/90 bg-white/90 px-8 py-12 shadow-[0_24px_80px_-32px_rgba(14,165,233,0.35)] backdrop-blur-sm sm:px-12 sm:py-14">
          <p className="mb-3 text-center text-xs font-medium uppercase tracking-[0.2em] text-sky-700/90">
            California
          </p>
          <h1 className="text-center text-3xl font-semibold leading-tight tracking-tight text-slate-900 sm:text-4xl">
            Domestic Violence Restraining Order
            <span className="mt-1 block text-2xl font-normal text-sky-800/90 sm:text-3xl">
              Form assistance
            </span>
          </h1>
          <p className="mx-auto mt-6 max-w-md text-center text-base leading-relaxed text-slate-600">
            This tool walks you through filling out domestic violence restraining
            order forms step by step, so you can prepare clear, complete
            paperwork for court. Take your time—work at your own pace in a
            calm, private space.
          </p>
          <div className="mt-10 flex justify-center">
            <Link
              href="/form"
              className="inline-flex min-h-12 items-center justify-center rounded-xl bg-sky-600 px-10 py-3 text-base font-medium text-white shadow-md shadow-sky-600/25 transition hover:bg-sky-700 hover:shadow-lg hover:shadow-sky-600/30 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-600"
            >
              Get Started
            </Link>
          </div>
        </div>
        <p className="mt-10 max-w-md text-center text-sm leading-relaxed text-slate-500">
          This site provides general help with forms only. It does not give
          legal advice. If you are in immediate danger, call 911 or your local
          emergency number.
        </p>
      </main>
    </div>
  );
}
