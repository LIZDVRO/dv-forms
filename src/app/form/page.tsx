"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";

import { generateDV100PDF, triggerPdfDownload } from "@/lib/dv100-pdf";
import { generateCLETS001PDF } from "@/lib/clets001-pdf";
import { generateDV109PDF, type Dv109PdfData } from "@/lib/dv109-pdf";
import { generateDV110PDF } from "@/lib/dv110-pdf";
import { submitEfile } from "@/lib/efile";

import { useFormStore } from "@/store/useFormStore";

import { formFieldInputClassName } from "@/components/ui/input";
import { formFieldTextareaClassName } from "@/components/ui/textarea";
import Step0_LegalRep from "@/components/wizard-steps/Step0_LegalRep";
import Step1_ProtectedPeople from "@/components/wizard-steps/Step1_ProtectedPeople";
import Step2_PersonCausingHarm from "@/components/wizard-steps/Step2_PersonCausingHarm";
import Step3_DescribeAbuse from "@/components/wizard-steps/Step3_DescribeAbuse";
import Step4_OtherCourtCases from "@/components/wizard-steps/Step4_OtherCourtCases";
import Step5_OrdersRequested from "@/components/wizard-steps/Step5_OrdersRequested";
import Step6_MoveOutCustody from "@/components/wizard-steps/Step6_MoveOutCustody";
import Step7_PropertyAnimals from "@/components/wizard-steps/Step7_PropertyAnimals";
import Step8_PropertyNoticeDebts from "@/components/wizard-steps/Step8_PropertyNoticeDebts";
import Step9_SupportFees from "@/components/wizard-steps/Step9_SupportFees";
import Step10_InterventionWireless from "@/components/wizard-steps/Step10_InterventionWireless";
import Step11_Signature from "@/components/wizard-steps/Step11_Signature";
import Step12_ReviewGenerate, {
  type Step12PdfInfo,
} from "@/components/wizard-steps/Step12_ReviewGenerate";
import { personInfoToDisplayName } from "@/components/wizard-steps/wizardShared";

const STEP_TITLES = [
  "Legal Representation",
  "Who Needs Protection?",
  "Person Causing Harm",
  "Describe Abuse",
  "Other Court Cases",
  "Orders You Want the Judge to Make",
  "Move Out, Other Orders, Custody",
  "Property, Animals & Other Orders",
  "Property, Notice & Debts",
  "Support, Fees & Restitution",
  "Intervention & Wireless Accounts",
  "Sign your document",
  "Review & Generate",
] as const;

const STEP_BLURBS = [
  "Are you an attorney preparing this on behalf of the petitioner, or are you a petitioner who is represented by an attorney?",
  "First, let's get your information. Then, you can add any children, family members, or household members who also need protection.",
  "Now, tell us about the person causing harm. We need their basic information, how you know them, and whether they have access to firearms.",
  "Describe incidents of abuse (DV-100 Sections 5–7, Pages 3–5). You will start with the most recent incident; you can choose to add up to two more separate incidents when you feel ready.",
  "Answer questions about other restraining orders and other court cases involving you and this person (DV-100 Section 4).",
  "Choose the orders you want a judge to make (DV-100 Sections 10-12, Page 7). Every situation is different. Choose the orders that fit your situation.",
  "Ask the court to order the other person to move out, describe any other orders, and indicate if you need custody orders (DV-100 Sections 13-15, Page 8).",
  "Property, animals, insurance, and communications orders (DV-100 Sections 16-19, Page 9).",
  "Property restraint, extended notice deadline, and pay-debts orders (DV-100 Sections 20-22, Page 10).",
  "Request restitution for document preparation, and indicate child support, spousal support, and lawyer-fee orders (DV-100 Sections 23-26, Page 11).",
  "Batterer intervention and wireless phone account transfer requests (DV-100 Sections 27-28, Page 12). Sections 29-31 are automatic if the order is granted.",
  "Declare that your answers are true, then sign. Your signature is stored with your answers for PDF generation.",
  "Confirm everything below, then generate your filled PDF.",
] as const;

const TOTAL_STEPS = STEP_TITLES.length;

function ProgressBar({ currentStep }: { currentStep: number }) {
  const pct = useMemo(
    () => ((currentStep + 1) / TOTAL_STEPS) * 100,
    [currentStep],
  );

  return (
    <div className="w-full space-y-3">
      <div className="flex items-center justify-between gap-4 text-sm text-slate-600">
        <span className="font-medium text-liz">
          Step {currentStep + 1} of {TOTAL_STEPS}
        </span>
        <span className="hidden font-medium text-liz sm:inline">
          {STEP_TITLES[currentStep]}
        </span>
      </div>
      <div
        className="h-2.5 overflow-hidden rounded-full bg-liz/12"
        role="progressbar"
        aria-valuenow={currentStep + 1}
        aria-valuemin={1}
        aria-valuemax={TOTAL_STEPS}
        aria-label={`Step ${currentStep + 1} of ${TOTAL_STEPS}`}
      >
        <div
          className="h-full rounded-full bg-liz transition-[width] duration-300 ease-out"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export default function FormWizardPage() {
  const [step, setStep] = useState(0);
  const [showAbuseIncident2, setShowAbuseIncident2] = useState(false);
  const [showAbuseIncident3, setShowAbuseIncident3] = useState(false);
  const [pdfGenerating, setPdfGenerating] = useState(false);
  const [cletsPdfGenerating, setCletsPdfGenerating] = useState(false);
  const [dv109PdfGenerating, setDv109PdfGenerating] = useState(false);
  const [dv110PdfGenerating, setDv110PdfGenerating] = useState(false);
  const [pdfError, setPdfError] = useState<string | null>(null);
  const [pdfInfo, setPdfInfo] = useState<Step12PdfInfo | null>(null);
  const [efileStatus, setEfileStatus] = useState<
    "idle" | "confirming" | "sending" | "success" | "error"
  >("idle");
  const [efileError, setEfileError] = useState("");

  const petitioner = useFormStore((s) => s.petitioner);
  const petitionerExtras = useFormStore((s) => s.petitionerExtras);
  const respondentPerson = useFormStore((s) => s.respondent.person);

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
      const { bytes, filled, missing } = await generateDV100PDF();
      triggerPdfDownload(bytes, "filled_dv100.pdf");
      setPdfInfo({ filled, missing });
    } catch (e) {
      setPdfError(e instanceof Error ? e.message : String(e));
    } finally {
      setPdfGenerating(false);
    }
  };

  const handleDownloadClets001 = async () => {
    setCletsPdfGenerating(true);
    setPdfError(null);
    try {
      const bytes = await generateCLETS001PDF();
      triggerPdfDownload(bytes, "filled_clets001.pdf");
    } catch (e) {
      setPdfError(e instanceof Error ? e.message : String(e));
    } finally {
      setCletsPdfGenerating(false);
    }
  };

  const handleDownloadDv109 = async () => {
    setDv109PdfGenerating(true);
    setPdfError(null);
    try {
      const payload: Dv109PdfData = {
        protectedPersonName: personInfoToDisplayName(petitioner),
        restrainedPersonName: personInfoToDisplayName(respondentPerson),
        county: petitionerExtras.county ?? "",
      };
      const bytes = await generateDV109PDF(payload);
      triggerPdfDownload(bytes, "filled_dv109.pdf");
    } catch (e) {
      setPdfError(e instanceof Error ? e.message : String(e));
    } finally {
      setDv109PdfGenerating(false);
    }
  };

  const handleDownloadDv110 = async () => {
    setDv110PdfGenerating(true);
    setPdfError(null);
    try {
      const bytes = await generateDV110PDF();
      triggerPdfDownload(bytes, "filled_dv110.pdf");
    } catch (e) {
      setPdfError(e instanceof Error ? e.message : String(e));
    } finally {
      setDv110PdfGenerating(false);
    }
  };

  const handleEfile = async () => {
    setEfileStatus("sending");
    setEfileError("");
    try {
      const { bytes: dv100Bytes } = await generateDV100PDF();

      const clets001Bytes = await generateCLETS001PDF();

      const dv109Payload: Dv109PdfData = {
        protectedPersonName: personInfoToDisplayName(petitioner),
        restrainedPersonName: personInfoToDisplayName(respondentPerson),
        county: petitionerExtras.county ?? "",
      };
      const dv109Bytes = await generateDV109PDF(dv109Payload);

      const dv110Bytes = await generateDV110PDF();

      const petName = [petitioner.firstName, petitioner.middleName, petitioner.lastName]
        .filter(Boolean)
        .join(" ");

      const result = await submitEfile({
        petitionerName: petName,
        dv100Bytes,
        clets001Bytes,
        dv109Bytes,
        dv110Bytes,
      });

      if (result.success) {
        setEfileStatus("success");
      } else {
        setEfileError(result.error ?? result.message ?? "Something went wrong");
        setEfileStatus("error");
      }
    } catch {
      setEfileError(
        "Network error. Please check your connection and try again.",
      );
      setEfileStatus("error");
    }
  };

  const inputClass = formFieldInputClassName;

  const textareaClass = formFieldTextareaClassName;

  return (
    <div className="flex min-h-screen flex-1 flex-col overflow-hidden bg-white">
      <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col px-4 py-8 sm:px-6 sm:py-12">
        <header className="mb-8 flex flex-col gap-6 sm:mb-10">
          <div className="border-b border-gray-200 pb-8 text-center">
            <Image
              src="/liz-logo.png"
              alt="LIZ"
              width={200}
              height={64}
              className="mx-auto h-14 w-auto object-contain sm:h-16"
              priority
            />
          </div>
          <div className="flex items-center justify-between gap-4">
            <Link
              href="/"
              className="text-sm font-medium text-liz underline-offset-4 hover:text-purple-900 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-liz"
            >
              ← Back to home
            </Link>
          </div>
          <ProgressBar currentStep={step} />
        </header>

        <main className="flex flex-1 flex-col">
          <div className="flex flex-1 flex-col border-y border-gray-200 px-6 py-8 sm:px-10 sm:py-10">
            <h1 className="text-xl font-semibold tracking-tight text-slate-900 sm:text-2xl">
              {STEP_TITLES[step]}
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-slate-600 sm:text-base">
              {STEP_BLURBS[step]}
            </p>

            <div className="mt-8 flex flex-1 flex-col">
              {step === 0 && <Step0_LegalRep inputClass={inputClass} />}

              {step === 1 && <Step1_ProtectedPeople inputClass={inputClass} />}

              {step === 2 && (
                <Step2_PersonCausingHarm
                  inputClass={inputClass}
                />
              )}

              {step === 3 && (
                <Step3_DescribeAbuse
                  showAbuseIncident2={showAbuseIncident2}
                  setShowAbuseIncident2={setShowAbuseIncident2}
                  showAbuseIncident3={showAbuseIncident3}
                  setShowAbuseIncident3={setShowAbuseIncident3}
                  inputClass={inputClass}
                />
              )}

              {step === 4 && (
                <Step4_OtherCourtCases inputClass={inputClass} />
              )}

              {step === 5 && (
                <Step5_OrdersRequested inputClass={inputClass} />
              )}

              {step === 6 && (
                <Step6_MoveOutCustody
                  inputClass={inputClass}
                  textareaClass={textareaClass}
                />
              )}

              {step === 7 && (
                <Step7_PropertyAnimals
                  inputClass={inputClass}
                  textareaClass={textareaClass}
                />
              )}

              {step === 8 && (
                <Step8_PropertyNoticeDebts
                  inputClass={inputClass}
                  textareaClass={textareaClass}
                />
              )}

              {step === 9 && <Step9_SupportFees />}

              {step === 10 && (
                <Step10_InterventionWireless inputClass={inputClass} />
              )}

              {step === 11 && <Step11_Signature />}

              {step === 12 && (
                <Step12_ReviewGenerate
                  petitioner={petitioner}
                  respondentPerson={respondentPerson}
                  pdfError={pdfError}
                  pdfInfo={pdfInfo}
                />
              )}
            </div>

            {isLastStep ? (
              <div className="mt-10 flex w-full flex-col gap-8">
                <div className="flex w-full flex-col gap-3">
                  <button
                    type="button"
                    onClick={handleDownloadClets001}
                    disabled={
                      cletsPdfGenerating ||
                      dv109PdfGenerating ||
                      dv110PdfGenerating ||
                      efileStatus === "sending"
                    }
                    className="inline-flex min-h-12 w-full items-center justify-center rounded-xl border border-purple-200 bg-white px-6 py-3 text-sm font-medium text-purple-900 shadow-sm transition hover:border-purple-300 hover:bg-purple-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-liz disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto sm:self-start"
                  >
                    {cletsPdfGenerating ? "Preparing…" : "Download CLETS-001"}
                  </button>
                  <button
                    type="button"
                    onClick={handleDownloadDv109}
                    disabled={
                      cletsPdfGenerating ||
                      dv109PdfGenerating ||
                      dv110PdfGenerating ||
                      efileStatus === "sending"
                    }
                    className="inline-flex min-h-12 w-full items-center justify-center rounded-xl border border-purple-200 bg-white px-6 py-3 text-sm font-medium text-purple-900 shadow-sm transition hover:border-purple-300 hover:bg-purple-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-liz disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto sm:self-start"
                  >
                    {dv109PdfGenerating ? "Preparing…" : "Download DV-109"}
                  </button>
                  <button
                    type="button"
                    onClick={handleDownloadDv110}
                    disabled={
                      cletsPdfGenerating ||
                      dv109PdfGenerating ||
                      dv110PdfGenerating ||
                      efileStatus === "sending"
                    }
                    className="inline-flex min-h-12 w-full items-center justify-center rounded-xl border border-purple-200 bg-white px-6 py-3 text-sm font-medium text-purple-900 shadow-sm transition hover:border-purple-300 hover:bg-purple-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-liz disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto sm:self-start"
                  >
                    {dv110PdfGenerating ? "Preparing…" : "Download DV-110"}
                  </button>
                  <button
                    type="button"
                    onClick={handleGenerateForms}
                    disabled={
                      pdfGenerating ||
                      cletsPdfGenerating ||
                      dv109PdfGenerating ||
                      dv110PdfGenerating ||
                      efileStatus === "sending"
                    }
                    className="inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-liz px-8 py-3 text-sm font-medium text-white shadow-md shadow-liz/25 transition hover:bg-purple-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-liz disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto sm:self-start"
                  >
                    {pdfGenerating ? "Generating…" : "Generate Forms"}
                  </button>
                </div>

                <div className="w-full border-t border-gray-200 pt-8 sm:max-w-2xl">
                    <h3 className="text-lg font-semibold text-[#662D91]">
                      e-File with Court
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-slate-600">
                      This sends your completed packet to{" "}
                      <span className="font-medium text-slate-800">
                        efile.lizbreakfree.org
                      </span>{" "}
                      for review and submission.{" "}
                      <a
                        href="https://efile.lizbreakfree.org/ca/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-medium text-liz underline-offset-4 hover:text-purple-900 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-liz"
                      >
                        Open the e-filing portal
                      </a>
                      . No court filing fee for domestic violence restraining orders.
                    </p>

                    {efileStatus === "idle" && (
                      <button
                        type="button"
                        onClick={() => setEfileStatus("confirming")}
                        disabled={
                          pdfGenerating ||
                          cletsPdfGenerating ||
                          dv109PdfGenerating ||
                          dv110PdfGenerating
                        }
                        className="mt-4 inline-flex min-h-12 items-center justify-center rounded-xl bg-liz px-8 py-3 text-sm font-medium text-white shadow-md shadow-liz/25 transition hover:bg-purple-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-liz disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        e-File with Court
                      </button>
                    )}

                    {efileStatus === "confirming" && (
                      <div className="mt-4 rounded-md border border-[#662D91]/20 bg-purple-50 p-4">
                        <p className="text-sm leading-relaxed text-purple-950">
                          We will send all four completed forms (DV-100, CLETS-001,
                          DV-109, and DV-110) to the court e-filing service. You will
                          receive an email with a link to review your filing before it
                          is submitted.
                        </p>
                        <div className="mt-4 flex flex-wrap gap-3">
                          <button
                            type="button"
                            onClick={handleEfile}
                            className="inline-flex min-h-12 items-center justify-center rounded-xl bg-liz px-8 py-3 text-sm font-medium text-white shadow-md shadow-liz/25 transition hover:bg-purple-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-liz"
                          >
                            Confirm &amp; Send
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setEfileStatus("idle");
                              setEfileError("");
                            }}
                            className="inline-flex min-h-12 items-center justify-center rounded-xl border border-gray-300 bg-white px-6 py-3 text-sm font-medium text-slate-800 shadow-sm transition hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-liz"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}

                    {efileStatus === "sending" && (
                      <div className="mt-4 flex items-center gap-3 text-sm font-medium text-[#662D91]">
                        <svg
                          className="size-8 shrink-0 animate-spin text-liz"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                          aria-hidden="true"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          />
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          />
                        </svg>
                        <span>Sending filing packet to the court...</span>
                      </div>
                    )}

                    {efileStatus === "success" && (
                      <div className="mt-4 rounded-xl border border-green-200 bg-green-50 p-4">
                        <p className="text-sm font-medium text-green-900">
                          Filing packet sent successfully!
                        </p>
                        <p className="mt-2 text-sm leading-relaxed text-green-900/90">
                          Check your email for the review link. You can also visit{" "}
                          <a
                            href="https://efile.lizbreakfree.org/ca/"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-medium text-liz underline-offset-4 hover:text-purple-900 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-liz"
                          >
                            efile.lizbreakfree.org/ca/
                          </a>{" "}
                          anytime.
                        </p>
                        <button
                          type="button"
                          onClick={() => {
                            setEfileStatus("idle");
                            setEfileError("");
                          }}
                          className="mt-3 text-sm font-medium text-liz underline-offset-4 hover:text-purple-900 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-liz"
                        >
                          Send again
                        </button>
                      </div>
                    )}

                    {efileStatus === "error" && (
                      <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4">
                        <p className="text-sm font-medium text-red-900">
                          {efileError ||
                            "Something went wrong. Please try again."}
                        </p>
                        <button
                          type="button"
                          onClick={() => {
                            setEfileStatus("idle");
                            setEfileError("");
                          }}
                          className="mt-3 text-sm font-medium text-liz underline-offset-4 hover:text-purple-900 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-liz"
                        >
                          Try again
                        </button>
                      </div>
                    )}
                </div>

                <div className="border-t border-slate-200 pt-6">
                  <button
                    type="button"
                    onClick={goBack}
                    disabled={!canGoBack}
                    className="inline-flex min-h-12 items-center justify-center rounded-xl border border-purple-200 bg-white px-6 py-3 text-sm font-medium text-slate-800 shadow-sm transition hover:border-purple-300 hover:bg-purple-50 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Back
                  </button>
                </div>
              </div>
            ) : (
              <div className="mt-10 flex flex-col-reverse gap-3 sm:flex-row sm:justify-between sm:gap-4">
                <button
                  type="button"
                  onClick={goBack}
                  disabled={!canGoBack}
                  className="inline-flex min-h-12 items-center justify-center rounded-xl border border-purple-200 bg-white px-6 py-3 text-sm font-medium text-slate-800 shadow-sm transition hover:border-purple-300 hover:bg-purple-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={goNext}
                  className="inline-flex min-h-12 items-center justify-center rounded-xl bg-liz px-8 py-3 text-sm font-medium text-white shadow-md shadow-liz/25 transition hover:bg-purple-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-liz sm:ml-auto"
                >
                  Next
                </button>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
