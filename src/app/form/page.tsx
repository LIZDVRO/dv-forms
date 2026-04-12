"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import {
  DV100_GENDER_OPTIONS,
  generateDV100PDF,
  triggerPdfDownload,
  type Dv100PdfFillRow,
  type Dv100PdfFormData,
} from "@/lib/dv100-pdf";

const STEP_TITLES = [
  "Your Information",
  "Legal Representation",
  "Person You Want Protection From",
  "Review & Generate",
] as const;

const GENDER_OPTIONS = DV100_GENDER_OPTIONS;
type FormData = Dv100PdfFormData;

const initialForm: FormData = {
  petitionerName: "",
  petitionerAge: "",
  petitionerAddress: "",
  petitionerCity: "",
  petitionerState: "",
  petitionerZip: "",
  petitionerPhone: "",
  petitionerEmail: "",
  hasLawyer: false,
  lawyerName: "",
  lawyerBarNo: "",
  lawyerFirm: "",
  respondentName: "",
  respondentAge: "",
  respondentDob: "",
  respondentGender: "",
  respondentRace: "",
};

const TOTAL_STEPS = STEP_TITLES.length;

function ProgressBar({ currentStep }: { currentStep: number }) {
  const pct = useMemo(
    () => ((currentStep + 1) / TOTAL_STEPS) * 100,
    [currentStep],
  );

  return (
    <div className="w-full space-y-3">
      <div className="flex items-center justify-between gap-4 text-sm text-slate-600">
        <span className="font-medium text-slate-800">
          Step {currentStep + 1} of {TOTAL_STEPS}
        </span>
        <span className="hidden text-slate-500 sm:inline">
          {STEP_TITLES[currentStep]}
        </span>
      </div>
      <div
        className="h-2.5 overflow-hidden rounded-full bg-sky-100/90"
        role="progressbar"
        aria-valuenow={currentStep + 1}
        aria-valuemin={1}
        aria-valuemax={TOTAL_STEPS}
        aria-label={`Step ${currentStep + 1} of ${TOTAL_STEPS}`}
      >
        <div
          className="h-full rounded-full bg-sky-500 transition-[width] duration-300 ease-out"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export default function FormWizardPage() {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormData>(initialForm);
  const [pdfGenerating, setPdfGenerating] = useState(false);
  const [pdfError, setPdfError] = useState<string | null>(null);
  const [pdfInfo, setPdfInfo] = useState<{
    filled: Dv100PdfFillRow[];
    missing: Dv100PdfFillRow[];
  } | null>(null);

  const update = <K extends keyof FormData>(key: K, value: FormData[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const canGoBack = step > 0;
  const isLastStep = step === TOTAL_STEPS - 1;

  const goBack = () => {
    if (canGoBack) setStep((s) => s - 1);
  };

  const goNext = () => {
    if (!isLastStep) setStep((s) => s + 1);
  };

  const handleGenerateForms = async () => {
    setPdfGenerating(true);
    setPdfError(null);
    setPdfInfo(null);
    try {
      const { bytes, filled, missing } = await generateDV100PDF(form);
      triggerPdfDownload(bytes, "filled_dv100.pdf");
      setPdfInfo({ filled, missing });
    } catch (e) {
      setPdfError(e instanceof Error ? e.message : String(e));
    } finally {
      setPdfGenerating(false);
    }
  };

  const inputClass =
    "mt-2 w-full rounded-xl border border-sky-100 bg-white px-4 py-3 text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-sky-300 focus:ring-2 focus:ring-sky-200/80";

  const display = (v: string) => (v.trim() ? v : "—");

  return (
    <div className="relative flex min-h-full flex-1 flex-col overflow-hidden bg-gradient-to-b from-sky-50 via-white to-blue-50/80">
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(125,211,252,0.35),transparent)]"
        aria-hidden
      />
      <div className="relative z-10 mx-auto flex w-full max-w-2xl flex-1 flex-col px-4 py-8 sm:px-6 sm:py-12">
        <header className="mb-8 flex flex-col gap-4 sm:mb-10">
          <div className="flex items-center justify-between gap-4">
            <Link
              href="/"
              className="text-sm font-medium text-sky-700 underline-offset-4 hover:text-sky-800 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-600"
            >
              ← Back to home
            </Link>
          </div>
          <ProgressBar currentStep={step} />
        </header>

        <main className="flex flex-1 flex-col">
          <div className="flex flex-1 flex-col rounded-2xl border border-sky-100/90 bg-white/90 p-6 shadow-[0_24px_80px_-32px_rgba(14,165,233,0.35)] backdrop-blur-sm sm:p-10">
            <h1 className="text-xl font-semibold tracking-tight text-slate-900 sm:text-2xl">
              {STEP_TITLES[step]}
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-slate-600 sm:text-base">
              {step === 0 &&
                "Enter your details as they should appear on DV-100 (Page 1). Fields match the official form."}
              {step === 1 &&
                "If an attorney represents you in this case, provide their information for the form."}
              {step === 2 &&
                "Provide identifying information for the person you are asking the court for protection from."}
              {step === 3 &&
                "Confirm everything below, then generate your filled PDF."}
            </p>

            <div className="mt-8 flex flex-1 flex-col">
              {step === 0 && (
                <div className="space-y-6">
                  <div>
                    <label
                      htmlFor="petitionerName"
                      className="text-sm font-medium text-slate-800"
                    >
                      Your full name
                    </label>
                    <input
                      id="petitionerName"
                      name="petitionerName"
                      type="text"
                      autoComplete="name"
                      value={form.petitionerName}
                      onChange={(e) =>
                        update("petitionerName", e.target.value)
                      }
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="petitionerAge"
                      className="text-sm font-medium text-slate-800"
                    >
                      Your age
                    </label>
                    <input
                      id="petitionerAge"
                      name="petitionerAge"
                      type="text"
                      inputMode="numeric"
                      autoComplete="off"
                      value={form.petitionerAge}
                      onChange={(e) =>
                        update("petitionerAge", e.target.value)
                      }
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="petitionerAddress"
                      className="text-sm font-medium text-slate-800"
                    >
                      Street address
                    </label>
                    <input
                      id="petitionerAddress"
                      name="petitionerAddress"
                      type="text"
                      autoComplete="street-address"
                      value={form.petitionerAddress}
                      onChange={(e) =>
                        update("petitionerAddress", e.target.value)
                      }
                      className={inputClass}
                    />
                  </div>
                  <div className="grid gap-6 sm:grid-cols-2">
                    <div>
                      <label
                        htmlFor="petitionerCity"
                        className="text-sm font-medium text-slate-800"
                      >
                        City
                      </label>
                      <input
                        id="petitionerCity"
                        name="petitionerCity"
                        type="text"
                        autoComplete="address-level2"
                        value={form.petitionerCity}
                        onChange={(e) =>
                          update("petitionerCity", e.target.value)
                        }
                        className={inputClass}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label
                          htmlFor="petitionerState"
                          className="text-sm font-medium text-slate-800"
                        >
                          State
                        </label>
                        <input
                          id="petitionerState"
                          name="petitionerState"
                          type="text"
                          autoComplete="address-level1"
                          value={form.petitionerState}
                          onChange={(e) =>
                            update("petitionerState", e.target.value)
                          }
                          className={inputClass}
                        />
                      </div>
                      <div>
                        <label
                          htmlFor="petitionerZip"
                          className="text-sm font-medium text-slate-800"
                        >
                          Zip
                        </label>
                        <input
                          id="petitionerZip"
                          name="petitionerZip"
                          type="text"
                          autoComplete="postal-code"
                          value={form.petitionerZip}
                          onChange={(e) =>
                            update("petitionerZip", e.target.value)
                          }
                          className={inputClass}
                        />
                      </div>
                    </div>
                  </div>
                  <div>
                    <label
                      htmlFor="petitionerPhone"
                      className="text-sm font-medium text-slate-800"
                    >
                      Telephone
                    </label>
                    <input
                      id="petitionerPhone"
                      name="petitionerPhone"
                      type="tel"
                      autoComplete="tel"
                      value={form.petitionerPhone}
                      onChange={(e) =>
                        update("petitionerPhone", e.target.value)
                      }
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="petitionerEmail"
                      className="text-sm font-medium text-slate-800"
                    >
                      Email
                    </label>
                    <input
                      id="petitionerEmail"
                      name="petitionerEmail"
                      type="email"
                      autoComplete="email"
                      value={form.petitionerEmail}
                      onChange={(e) =>
                        update("petitionerEmail", e.target.value)
                      }
                      className={inputClass}
                    />
                  </div>
                  <div
                    className="rounded-xl border border-amber-200/90 bg-amber-50/80 px-4 py-3 text-sm leading-relaxed text-amber-950"
                    role="note"
                  >
                    <strong className="font-semibold">Privacy:</strong> If you
                    need to keep your home address confidential, do{" "}
                    <span className="font-medium">not</span> enter it here.
                    You may use a safe mailing address or leave address fields
                    blank, following court self-help guidance for your county.
                  </div>
                </div>
              )}

              {step === 1 && (
                <div className="space-y-6">
                  <fieldset className="space-y-4">
                    <legend className="text-sm font-medium text-slate-800">
                      Do you have a lawyer for this case?
                    </legend>
                    <div className="space-y-3">
                      <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-sky-100 bg-white px-4 py-3 shadow-sm transition hover:border-sky-200 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-sky-200/80">
                        <input
                          type="radio"
                          name="hasLawyer"
                          checked={form.hasLawyer === true}
                          onChange={() => update("hasLawyer", true)}
                          className="mt-1 size-4 shrink-0 border-sky-200 text-sky-600 focus:ring-sky-500"
                        />
                        <span className="text-sm leading-relaxed text-slate-800">
                          Yes
                        </span>
                      </label>
                      <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-sky-100 bg-white px-4 py-3 shadow-sm transition hover:border-sky-200 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-sky-200/80">
                        <input
                          type="radio"
                          name="hasLawyer"
                          checked={form.hasLawyer === false}
                          onChange={() => update("hasLawyer", false)}
                          className="mt-1 size-4 shrink-0 border-sky-200 text-sky-600 focus:ring-sky-500"
                        />
                        <span className="text-sm leading-relaxed text-slate-800">
                          No
                        </span>
                      </label>
                    </div>
                  </fieldset>

                  {form.hasLawyer && (
                    <div className="space-y-6 border-t border-sky-100/90 pt-6">
                      <div>
                        <label
                          htmlFor="lawyerName"
                          className="text-sm font-medium text-slate-800"
                        >
                          Lawyer&apos;s name
                        </label>
                        <input
                          id="lawyerName"
                          name="lawyerName"
                          type="text"
                          autoComplete="name"
                          value={form.lawyerName}
                          onChange={(e) =>
                            update("lawyerName", e.target.value)
                          }
                          className={inputClass}
                        />
                      </div>
                      <div>
                        <label
                          htmlFor="lawyerBarNo"
                          className="text-sm font-medium text-slate-800"
                        >
                          State Bar No.
                        </label>
                        <input
                          id="lawyerBarNo"
                          name="lawyerBarNo"
                          type="text"
                          autoComplete="off"
                          value={form.lawyerBarNo}
                          onChange={(e) =>
                            update("lawyerBarNo", e.target.value)
                          }
                          className={inputClass}
                        />
                      </div>
                      <div>
                        <label
                          htmlFor="lawyerFirm"
                          className="text-sm font-medium text-slate-800"
                        >
                          Firm name
                        </label>
                        <input
                          id="lawyerFirm"
                          name="lawyerFirm"
                          type="text"
                          autoComplete="organization"
                          value={form.lawyerFirm}
                          onChange={(e) =>
                            update("lawyerFirm", e.target.value)
                          }
                          className={inputClass}
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {step === 2 && (
                <div className="space-y-6">
                  <div>
                    <label
                      htmlFor="respondentName"
                      className="text-sm font-medium text-slate-800"
                    >
                      Full name
                    </label>
                    <input
                      id="respondentName"
                      name="respondentName"
                      type="text"
                      autoComplete="name"
                      value={form.respondentName}
                      onChange={(e) =>
                        update("respondentName", e.target.value)
                      }
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="respondentAge"
                      className="text-sm font-medium text-slate-800"
                    >
                      Age (or best estimate)
                    </label>
                    <input
                      id="respondentAge"
                      name="respondentAge"
                      type="text"
                      inputMode="numeric"
                      value={form.respondentAge}
                      onChange={(e) =>
                        update("respondentAge", e.target.value)
                      }
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="respondentDob"
                      className="text-sm font-medium text-slate-800"
                    >
                      Date of birth (if known)
                    </label>
                    <input
                      id="respondentDob"
                      name="respondentDob"
                      type="text"
                      placeholder="MM / DD / YYYY"
                      autoComplete="off"
                      value={form.respondentDob}
                      onChange={(e) =>
                        update("respondentDob", e.target.value)
                      }
                      className={inputClass}
                    />
                  </div>
                  <fieldset className="space-y-4">
                    <legend className="text-sm font-medium text-slate-800">
                      Gender
                    </legend>
                    <div className="space-y-3">
                      {GENDER_OPTIONS.map((option) => (
                        <label
                          key={option}
                          className="flex cursor-pointer items-start gap-3 rounded-xl border border-sky-100 bg-white px-4 py-3 shadow-sm transition hover:border-sky-200 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-sky-200/80"
                        >
                          <input
                            type="radio"
                            name="respondentGender"
                            value={option}
                            checked={form.respondentGender === option}
                            onChange={() =>
                              update("respondentGender", option)
                            }
                            className="mt-1 size-4 shrink-0 border-sky-200 text-sky-600 focus:ring-sky-500"
                          />
                          <span className="text-sm leading-relaxed text-slate-800">
                            {option}
                          </span>
                        </label>
                      ))}
                    </div>
                  </fieldset>
                  <div>
                    <label
                      htmlFor="respondentRace"
                      className="text-sm font-medium text-slate-800"
                    >
                      Race
                    </label>
                    <input
                      id="respondentRace"
                      name="respondentRace"
                      type="text"
                      autoComplete="off"
                      value={form.respondentRace}
                      onChange={(e) =>
                        update("respondentRace", e.target.value)
                      }
                      className={inputClass}
                    />
                  </div>
                </div>
              )}

              {step === 3 && (
                <div className="space-y-8">
                  {pdfError && (
                    <p
                      className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900"
                      role="alert"
                    >
                      {pdfError}
                    </p>
                  )}
                  {pdfInfo && (
                    <div
                      className="space-y-2 rounded-xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-900"
                      role="status"
                    >
                      <p>
                        Download started as{" "}
                        <code className="rounded bg-white/80 px-1">
                          filled_dv100.pdf
                        </code>
                        . Filled AcroForm fields:
                      </p>
                      {pdfInfo.filled.length === 0 ? (
                        <p className="text-sky-950/80">
                          None. Check the browser console for details. You can
                          verify field names with{" "}
                          <Link
                            href="/inspect"
                            className="font-medium underline underline-offset-2"
                          >
                            /inspect
                          </Link>
                          .
                        </p>
                      ) : (
                        <ul className="list-inside list-disc text-sky-950/90">
                          {pdfInfo.filled.map((row) => (
                            <li key={`${row.pdfFieldName}-${row.label}`}>
                              {row.label} →{" "}
                              <code className="rounded bg-white/80 px-1">
                                {row.pdfFieldName}
                              </code>
                            </li>
                          ))}
                        </ul>
                      )}
                      {pdfInfo.missing.length > 0 && (
                        <p className="border-t border-sky-200/80 pt-2 text-amber-950">
                          Could not fill:{" "}
                          {pdfInfo.missing
                            .map((m) => `${m.label} (${m.pdfFieldName})`)
                            .join(", ")}
                          . See console for errors. Field names can be checked on{" "}
                          <Link
                            href="/inspect"
                            className="font-medium underline underline-offset-2"
                          >
                            /inspect
                          </Link>
                          .
                        </p>
                      )}
                    </div>
                  )}
                  <dl className="space-y-6 text-sm sm:text-base">
                    <div className="rounded-xl border border-sky-100/90 bg-sky-50/40 px-4 py-4">
                      <dt className="text-xs font-semibold uppercase tracking-wide text-sky-800/90">
                        Your information
                      </dt>
                      <dd className="mt-2 space-y-1 text-slate-800">
                        <p>
                          <span className="text-slate-500">Name:</span>{" "}
                          {display(form.petitionerName)}
                        </p>
                        <p>
                          <span className="text-slate-500">Age:</span>{" "}
                          {display(form.petitionerAge)}
                        </p>
                        <p>
                          <span className="text-slate-500">Address:</span>{" "}
                          {display(form.petitionerAddress)}
                        </p>
                        <p>
                          <span className="text-slate-500">City:</span>{" "}
                          {display(form.petitionerCity)}
                        </p>
                        <p>
                          <span className="text-slate-500">State:</span>{" "}
                          {display(form.petitionerState)}
                        </p>
                        <p>
                          <span className="text-slate-500">Zip:</span>{" "}
                          {display(form.petitionerZip)}
                        </p>
                        <p>
                          <span className="text-slate-500">Phone:</span>{" "}
                          {display(form.petitionerPhone)}
                        </p>
                        <p>
                          <span className="text-slate-500">Email:</span>{" "}
                          {display(form.petitionerEmail)}
                        </p>
                      </dd>
                    </div>
                    <div className="rounded-xl border border-sky-100/90 bg-sky-50/40 px-4 py-4">
                      <dt className="text-xs font-semibold uppercase tracking-wide text-sky-800/90">
                        Legal representation
                      </dt>
                      <dd className="mt-2 space-y-1 text-slate-800">
                        <p>
                          <span className="text-slate-500">Has a lawyer:</span>{" "}
                          {form.hasLawyer ? "Yes" : "No"}
                        </p>
                        {form.hasLawyer && (
                          <>
                            <p>
                              <span className="text-slate-500">Lawyer:</span>{" "}
                              {display(form.lawyerName)}
                            </p>
                            <p>
                              <span className="text-slate-500">Bar No.:</span>{" "}
                              {display(form.lawyerBarNo)}
                            </p>
                            <p>
                              <span className="text-slate-500">Firm:</span>{" "}
                              {display(form.lawyerFirm)}
                            </p>
                          </>
                        )}
                      </dd>
                    </div>
                    <div className="rounded-xl border border-sky-100/90 bg-sky-50/40 px-4 py-4">
                      <dt className="text-xs font-semibold uppercase tracking-wide text-sky-800/90">
                        Person you want protection from
                      </dt>
                      <dd className="mt-2 space-y-1 text-slate-800">
                        <p>
                          <span className="text-slate-500">Name:</span>{" "}
                          {display(form.respondentName)}
                        </p>
                        <p>
                          <span className="text-slate-500">Age:</span>{" "}
                          {display(form.respondentAge)}
                        </p>
                        <p>
                          <span className="text-slate-500">Date of birth:</span>{" "}
                          {display(form.respondentDob)}
                        </p>
                        <p>
                          <span className="text-slate-500">Gender:</span>{" "}
                          {display(form.respondentGender)}
                        </p>
                        <p>
                          <span className="text-slate-500">Race:</span>{" "}
                          {display(form.respondentRace)}
                        </p>
                      </dd>
                    </div>
                  </dl>
                </div>
              )}
            </div>

            <div className="mt-10 flex flex-col-reverse gap-3 sm:flex-row sm:justify-between sm:gap-4">
              <button
                type="button"
                onClick={goBack}
                disabled={!canGoBack}
                className="inline-flex min-h-12 items-center justify-center rounded-xl border border-sky-200 bg-white px-6 py-3 text-sm font-medium text-slate-800 shadow-sm transition hover:border-sky-300 hover:bg-sky-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Back
              </button>
              {isLastStep ? (
                <button
                  type="button"
                  onClick={handleGenerateForms}
                  disabled={pdfGenerating}
                  className="inline-flex min-h-12 items-center justify-center rounded-xl bg-sky-600 px-8 py-3 text-sm font-medium text-white shadow-md shadow-sky-600/25 transition hover:bg-sky-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-600 disabled:cursor-not-allowed disabled:opacity-60 sm:ml-auto"
                >
                  {pdfGenerating ? "Generating…" : "Generate Forms"}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={goNext}
                  className="inline-flex min-h-12 items-center justify-center rounded-xl bg-sky-600 px-8 py-3 text-sm font-medium text-white shadow-md shadow-sky-600/25 transition hover:bg-sky-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-600 sm:ml-auto"
                >
                  Next
                </button>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
