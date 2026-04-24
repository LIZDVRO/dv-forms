"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";

import {
  emptyRestitutionExpenses,
  emptyWirelessAccounts,
  generateDV100PDF,
  triggerPdfDownload,
  type Dv100PdfFillRow,
  type Dv100PdfFormData,
  type Dv100GenderOption,
} from "@/lib/dv100-pdf";
import { generateCLETS001PDF, type Clets001PdfData } from "@/lib/clets001-pdf";
import { generateDV109PDF, type Dv109PdfData } from "@/lib/dv109-pdf";
import { generateDV110PDF, type Dv110PdfData } from "@/lib/dv110-pdf";
import { submitEfile } from "@/lib/efile";

import { useFormStore } from "@/store/useFormStore";

import SignatureStep from "@/components/SignatureStep";
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
import {
  CASE_TYPE_OPTIONS,
  defaultFirearmRow,
  defaultProtectedPerson,
  initialProtectedAnimals,
  personInfoToDisplayName,
  RELATED_TYPE_OPTIONS,
  RELATIONSHIP_OPTIONS,
  toggleInList,
} from "@/components/wizard-steps/wizardShared";

import { Page12InterventionWirelessStep } from "./Page12InterventionWirelessStep";

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

const DV110_RELATIONSHIP_LABEL_BY_CHECK: Record<string, string> = {
  married: "Spouse/Domestic Partner",
  usedToBeMarried: "Former Spouse/Domestic Partner",
  children: "Parent of shared children",
  dating: "Dating/Former Dating Partner",
  engaged: "Engaged/Former Fiance(e)",
  related: "Related",
  liveTogether: "Cohabitant",
};

function relationshipChecksToDv110Relationship(checks: readonly string[]): string {
  const labels: string[] = [];
  for (const { value } of RELATIONSHIP_OPTIONS) {
    const mapped = DV110_RELATIONSHIP_LABEL_BY_CHECK[value];
    if (mapped && checks.includes(value)) {
      labels.push(mapped);
    }
  }
  return labels.join(", ");
}

function labelsForValues(
  values: string[],
  options: { value: string; label: string }[],
): string {
  if (values.length === 0) return "—";
  return values
    .map((v) => options.find((o) => o.value === v)?.label ?? v)
    .join(", ");
}

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
  relationshipChecks: [],
  childrenNames: "",
  relatedTypes: [],
  livedTogether: "",
  hasRestrainingOrders: "",
  order1Date: "",
  order1Expires: "",
  order2Date: "",
  order2Expires: "",
  hasOtherCases: "",
  caseTypes: [],
  otherCaseType: "",
  custodyCaseDetails: "",
  divorceCaseDetails: "",
  juvenileCaseDetails: "",
  guardianshipCaseDetails: "",
  criminalCaseDetails: "",
  recentAbuseDate: "",
  recentAbuseWitnesses: "",
  recentAbuseWitnessDetail: "",
  recentAbuseWeapon: "",
  recentAbuseWeaponDetail: "",
  recentAbuseHarm: "",
  recentAbuseHarmDetail: "",
  recentAbusePolice: "",
  recentAbuseDetails: "",
  recentAbuseFrequency: "",
  recentAbuseFrequencyOther: "",
  recentAbuseDates: "",
  secondAbuseDate: "",
  secondAbuseWitnesses: "",
  secondAbuseWitnessDetail: "",
  secondAbuseWeapon: "",
  secondAbuseWeaponDetail: "",
  secondAbuseHarm: "",
  secondAbuseHarmDetail: "",
  secondAbusePolice: "",
  secondAbuseDetails: "",
  secondAbuseFrequency: "",
  secondAbuseFrequencyOther: "",
  secondAbuseDates: "",
  thirdAbuseDate: "",
  thirdAbuseWitnesses: "",
  thirdAbuseWitnessDetail: "",
  thirdAbuseWeapon: "",
  thirdAbuseWeaponDetail: "",
  thirdAbuseHarm: "",
  thirdAbuseHarmDetail: "",
  thirdAbusePolice: "",
  thirdAbuseDetails: "",
  thirdAbuseFrequency: "",
  thirdAbuseFrequencyOther: "",
  thirdAbuseDates: "",
  protectOtherPeople: "",
  protectedPeople: [defaultProtectedPerson()],
  protectedPeopleWhy: "",
  hasFirearms: "",
  firearms: [defaultFirearmRow()],
  orderToNotAbuse: false,
  noContactOrder: false,
  stayAwayOrder: false,
  stayAwayMe: false,
  stayAwayHome: false,
  stayAwayWork: false,
  stayAwayVehicle: false,
  stayAwaySchool: false,
  stayAwayProtectedPersons: false,
  stayAwayChildrenSchool: false,
  stayAwayOther: false,
  stayAwayOtherExplain: "",
  stayAwayDistance: "",
  stayAwayDistanceOther: "",
  liveTogether: "",
  liveTogetherType: "",
  liveTogetherOther: "",
  sameWorkplaceSchool: "",
  workTogether: false,
  workTogetherCompany: "",
  sameSchool: false,
  sameSchoolName: "",
  sameWorkplaceOther: false,
  sameWorkplaceOtherExplain: "",
  orderToMoveOut: false,
  moveOutOrderPersonAsk: "",
  moveOutOwnHome: false,
  moveOutNameOnLease: false,
  moveOutWithChildren: false,
  moveOutLivedFor: false,
  moveOutLivedYears: "",
  moveOutLivedMonths: "",
  moveOutPaysRent: false,
  moveOutOther: false,
  moveOutOtherExplain: "",
  otherOrders: false,
  otherOrdersDescribe: "",
  childCustodyVisitation: false,
  protectAnimals: false,
  protectedAnimals: initialProtectedAnimals(),
  protectAnimalsStayAway: false,
  protectAnimalsStayAwayDistance: "",
  protectAnimalsStayAwayOtherYards: "",
  protectAnimalsNotTake: false,
  protectAnimalsSolePossession: false,
  protectAnimalsSoleReasonAbuse: false,
  protectAnimalsSoleReasonCare: false,
  protectAnimalsSoleReasonPurchased: false,
  protectAnimalsSoleReasonOther: false,
  protectAnimalsSoleReasonOtherExplain: "",
  controlProperty: false,
  controlPropertyDescribe: "",
  controlPropertyWhy: "",
  healthOtherInsurance: false,
  recordCommunications: false,
  propertyRestraint: false,
  extendNoticeDeadline: false,
  extendNoticeExplain: "",
  payDebtsForProperty: false,
  payDebtsRows: [
    { payTo: "", payFor: "", amount: "", dueDate: "" },
    { payTo: "", payFor: "", amount: "", dueDate: "" },
    { payTo: "", payFor: "", amount: "", dueDate: "" },
  ],
  payDebtsExplain: "",
  payDebtsSpecialDecision: "",
  payDebtsAbuseDebt1: false,
  payDebtsAbuseDebt2: false,
  payDebtsAbuseDebt3: false,
  payDebtsKnowHow: "",
  payDebtsExplainHow: "",
  requestRestitution: false,
  requestAbuserPayLizFee: false,
  restitutionExpenses: emptyRestitutionExpenses(),
  requestChildSupport: false,
  childSupportNoOrderWantOne: false,
  childSupportHaveOrderWantChanged: false,
  childSupportTANF: false,
  requestSpousalSupport: false,
  requestLawyerFees: false,
  requestBattererIntervention: false,
  requestWirelessTransfer: false,
  wirelessAccounts: emptyWirelessAccounts(),
  signatureDataUrl: null,
  attorneySignatureDataUrl: null,
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
  const [form, setForm] = useState<FormData>(initialForm);
  const [pdfGenerating, setPdfGenerating] = useState(false);
  const [cletsPdfGenerating, setCletsPdfGenerating] = useState(false);
  const [dv109PdfGenerating, setDv109PdfGenerating] = useState(false);
  const [dv110PdfGenerating, setDv110PdfGenerating] = useState(false);
  const [pdfError, setPdfError] = useState<string | null>(null);
  const [pdfInfo, setPdfInfo] = useState<{
    filled: Dv100PdfFillRow[];
    missing: Dv100PdfFillRow[];
  } | null>(null);
  const [efileStatus, setEfileStatus] = useState<
    "idle" | "confirming" | "sending" | "success" | "error"
  >("idle");
  const [efileError, setEfileError] = useState("");

  const petitioner = useFormStore((s) => s.petitioner);
  const respondentPerson = useFormStore((s) => s.respondent.person);
  const respondentCLETS = useFormStore((s) => s.respondent.clets);
  const setPetitioner = useFormStore((s) => s.setPetitioner);
  const setRespondentPerson = useFormStore((s) => s.setRespondentPerson);
  const setRespondentCLETS = useFormStore((s) => s.setRespondentCLETS);

  const [petitionerFullName, setPetitionerFullName] = useState(() =>
    personInfoToDisplayName(petitioner),
  );
  const [respondentFullName, setRespondentFullName] = useState(() =>
    personInfoToDisplayName(respondentPerson),
  );

  const prevStepRef = useRef(step);
  useEffect(() => {
    if (step === 1 && prevStepRef.current !== 1) {
      setPetitionerFullName(personInfoToDisplayName(petitioner));
    }
    if (step === 2 && prevStepRef.current !== 2) {
      setRespondentFullName(personInfoToDisplayName(respondentPerson));
    }
    prevStepRef.current = step;
  }, [step, petitioner, respondentPerson]);

  const update = <K extends keyof FormData>(key: K, value: FormData[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const resetStayAwayOrders = () =>
    setForm((prev) => ({
      ...prev,
      stayAwayOrder: false,
      stayAwayMe: false,
      stayAwayHome: false,
      stayAwayWork: false,
      stayAwayVehicle: false,
      stayAwaySchool: false,
      stayAwayProtectedPersons: false,
      stayAwayChildrenSchool: false,
      stayAwayOther: false,
      stayAwayOtherExplain: "",
      stayAwayDistance: "",
      stayAwayDistanceOther: "",
      liveTogether: "",
      liveTogetherType: "",
      liveTogetherOther: "",
      sameWorkplaceSchool: "",
      workTogether: false,
      workTogetherCompany: "",
      sameSchool: false,
      sameSchoolName: "",
      sameWorkplaceOther: false,
      sameWorkplaceOtherExplain: "",
    }));

  const resetMoveOutOrders = () =>
    setForm((prev) => ({
      ...prev,
      orderToMoveOut: false,
      moveOutOrderPersonAsk: "",
      moveOutOwnHome: false,
      moveOutNameOnLease: false,
      moveOutWithChildren: false,
      moveOutLivedFor: false,
      moveOutLivedYears: "",
      moveOutLivedMonths: "",
      moveOutPaysRent: false,
      moveOutOther: false,
      moveOutOtherExplain: "",
    }));

  const resetProtectAnimals = () =>
    setForm((prev) => ({
      ...prev,
      protectAnimals: false,
      protectedAnimals: initialProtectedAnimals(),
      protectAnimalsStayAway: false,
      protectAnimalsStayAwayDistance: "",
      protectAnimalsStayAwayOtherYards: "",
      protectAnimalsNotTake: false,
      protectAnimalsSolePossession: false,
      protectAnimalsSoleReasonAbuse: false,
      protectAnimalsSoleReasonCare: false,
      protectAnimalsSoleReasonPurchased: false,
      protectAnimalsSoleReasonOther: false,
      protectAnimalsSoleReasonOtherExplain: "",
    }));

  const resetControlProperty = () =>
    setForm((prev) => ({
      ...prev,
      controlProperty: false,
      controlPropertyDescribe: "",
      controlPropertyWhy: "",
    }));

  const resetPayDebtsForProperty = () =>
    setForm((prev) => ({
      ...prev,
      payDebtsForProperty: false,
      payDebtsRows: [
        { payTo: "", payFor: "", amount: "", dueDate: "" },
        { payTo: "", payFor: "", amount: "", dueDate: "" },
        { payTo: "", payFor: "", amount: "", dueDate: "" },
      ],
      payDebtsExplain: "",
      payDebtsSpecialDecision: "",
      payDebtsAbuseDebt1: false,
      payDebtsAbuseDebt2: false,
      payDebtsAbuseDebt3: false,
      payDebtsKnowHow: "",
      payDebtsExplainHow: "",
    }));

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
      const pdfPayload: FormData = {
        ...form,
        petitionerName: personInfoToDisplayName(petitioner),
        petitionerAge: petitioner.age,
        petitionerAddress: petitioner.address.street,
        petitionerCity: petitioner.address.city,
        petitionerState: petitioner.address.state,
        petitionerZip: petitioner.address.zip,
        petitionerPhone: petitioner.telephone,
        petitionerEmail: petitioner.email,
        respondentName: personInfoToDisplayName(respondentPerson),
        respondentAge: respondentPerson.age,
        respondentDob: respondentPerson.dateOfBirth,
        respondentGender: respondentPerson.gender as Dv100GenderOption,
        respondentRace: respondentPerson.race,
      };
      const { bytes, filled, missing } = await generateDV100PDF(pdfPayload);
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
      const cletsPayload: Clets001PdfData = {
        petitioner,
        respondent: respondentPerson,
        respondentCLETS,
        protectOtherPeople: form.protectOtherPeople,
        protectedPeople: form.protectedPeople,
        hasFirearms: form.hasFirearms,
        firearms: form.firearms,
      };
      const bytes = await generateCLETS001PDF(cletsPayload);
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
      const payload: Dv110PdfData = {
        protectedPersonName: personInfoToDisplayName(petitioner),
        fullName: personInfoToDisplayName(respondentPerson),
        gender: respondentPerson.gender,
        race: respondentPerson.race,
        age: respondentPerson.age,
        dateOfBirth: respondentPerson.dateOfBirth,
        height: respondentPerson.height,
        weight: respondentPerson.weight,
        hairColor: respondentPerson.hairColor,
        eyeColor: respondentPerson.eyeColor,
        relationship: relationshipChecksToDv110Relationship(form.relationshipChecks),
        address: respondentPerson.address.street,
        city: respondentPerson.address.city,
        state: respondentPerson.address.state,
        zip: respondentPerson.address.zip,
        protectedPeople: form.protectedPeople.map((p) => ({
          name: p.name,
          relationship: p.relationship,
          age: p.age,
        })),
      };
      const bytes = await generateDV110PDF(payload);
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
      const pdfPayload: FormData = {
        ...form,
        petitionerName: personInfoToDisplayName(petitioner),
        petitionerAge: petitioner.age,
        petitionerAddress: petitioner.address.street,
        petitionerCity: petitioner.address.city,
        petitionerState: petitioner.address.state,
        petitionerZip: petitioner.address.zip,
        petitionerPhone: petitioner.telephone,
        petitionerEmail: petitioner.email,
        respondentName: personInfoToDisplayName(respondentPerson),
        respondentAge: respondentPerson.age,
        respondentDob: respondentPerson.dateOfBirth,
        respondentGender: respondentPerson.gender as Dv100GenderOption,
        respondentRace: respondentPerson.race,
      };
      const { bytes: dv100Bytes } = await generateDV100PDF(pdfPayload);

      const cletsPayload: Clets001PdfData = {
        petitioner,
        respondent: respondentPerson,
        respondentCLETS,
        protectOtherPeople: form.protectOtherPeople,
        protectedPeople: form.protectedPeople,
        hasFirearms: form.hasFirearms,
        firearms: form.firearms,
      };
      const clets001Bytes = await generateCLETS001PDF(cletsPayload);

      const dv109Payload: Dv109PdfData = {
        protectedPersonName: personInfoToDisplayName(petitioner),
        restrainedPersonName: personInfoToDisplayName(respondentPerson),
      };
      const dv109Bytes = await generateDV109PDF(dv109Payload);

      const dv110Payload: Dv110PdfData = {
        protectedPersonName: personInfoToDisplayName(petitioner),
        fullName: personInfoToDisplayName(respondentPerson),
        gender: respondentPerson.gender,
        race: respondentPerson.race,
        age: respondentPerson.age,
        dateOfBirth: respondentPerson.dateOfBirth,
        height: respondentPerson.height,
        weight: respondentPerson.weight,
        hairColor: respondentPerson.hairColor,
        eyeColor: respondentPerson.eyeColor,
        relationship: relationshipChecksToDv110Relationship(form.relationshipChecks),
        address: respondentPerson.address.street,
        city: respondentPerson.address.city,
        state: respondentPerson.address.state,
        zip: respondentPerson.address.zip,
        protectedPeople: form.protectedPeople.map((p) => ({
          name: p.name,
          relationship: p.relationship,
          age: p.age,
        })),
      };
      const dv110Bytes = await generateDV110PDF(dv110Payload);

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

  const display = (v: string) => (v.trim() ? v : "—");
  const displayYn = (v: string) =>
    v === "yes" ? "Yes" : v === "no" ? "No" : "—";
  const displayIdkNoYes = (v: string) =>
    v === "idk"
      ? "I don't know"
      : v === "no"
        ? "No"
        : v === "yes"
          ? "Yes"
          : "—";
  const frequencyReviewLabel = (v: string) =>
    v === "once"
      ? "Just this once"
      : v === "2-5"
        ? "2–5 times"
        : v === "weekly"
          ? "Weekly"
          : v === "other"
            ? "Other"
            : "—";

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
              {step === 0 && (
                <Step0_LegalRep
                  form={form}
                  update={update}
                  inputClass={inputClass}
                />
              )}

              {step === 1 && (
                <Step1_ProtectedPeople
                  form={form}
                  setForm={setForm}
                  update={update}
                  petitioner={petitioner}
                  setPetitioner={setPetitioner}
                  petitionerFullName={petitionerFullName}
                  setPetitionerFullName={setPetitionerFullName}
                  inputClass={inputClass}
                />
              )}

              {step === 2 && (
                <Step2_PersonCausingHarm
                  form={form}
                  setForm={setForm}
                  update={update}
                  respondentPerson={respondentPerson}
                  setRespondentPerson={setRespondentPerson}
                  respondentCLETS={respondentCLETS}
                  setRespondentCLETS={setRespondentCLETS}
                  respondentFullName={respondentFullName}
                  setRespondentFullName={setRespondentFullName}
                  inputClass={inputClass}
                />
              )}

              {step === 3 && (
                <Step3_DescribeAbuse
                  form={form}
                  update={update}
                  showAbuseIncident2={showAbuseIncident2}
                  setShowAbuseIncident2={setShowAbuseIncident2}
                  showAbuseIncident3={showAbuseIncident3}
                  setShowAbuseIncident3={setShowAbuseIncident3}
                  inputClass={inputClass}
                />
              )}

              {step === 4 && (
                <Step4_OtherCourtCases
                  form={form}
                  setForm={setForm}
                  update={update}
                  inputClass={inputClass}
                />
              )}


              {step === 5 && (
                <Step5_OrdersRequested
                  form={form}
                  setForm={setForm}
                  update={update}
                  inputClass={inputClass}
                  resetStayAwayOrders={resetStayAwayOrders}
                />
              )}

              {step === 6 && (
                <Step6_MoveOutCustody
                  form={form}
                  setForm={setForm}
                  update={update}
                  inputClass={inputClass}
                  textareaClass={textareaClass}
                  resetMoveOutOrders={resetMoveOutOrders}
                />
              )}

              {step === 7 && (
                <Step7_PropertyAnimals
                  form={form}
                  setForm={setForm}
                  update={update}
                  inputClass={inputClass}
                  textareaClass={textareaClass}
                  resetProtectAnimals={resetProtectAnimals}
                  resetControlProperty={resetControlProperty}
                />
              )}

              {step === 8 && (
                <Step8_PropertyNoticeDebts
                  form={form}
                  setForm={setForm}
                  update={update}
                  inputClass={inputClass}
                  textareaClass={textareaClass}
                  resetPayDebtsForProperty={resetPayDebtsForProperty}
                />
              )}

              {step === 9 && (
                <Step9_SupportFees form={form} setForm={setForm} />
              )}

              {step === 10 && (
                <Page12InterventionWirelessStep
                  form={form}
                  setForm={setForm}
                  inputClass={inputClass}
                />
              )}

              {step === 11 && (
                <SignatureStep
                  formData={form}
                  updateFormData={(patch: Partial<FormData>) =>
                    setForm((prev) => ({ ...prev, ...patch }))
                  }
                />
              )}

              {step === 12 && (
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
                      className="space-y-2 rounded-xl border border-purple-200 bg-purple-50 px-4 py-3 text-sm text-purple-900"
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
                        <p className="text-purple-950/80">
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
                        <ul className="list-inside list-disc text-purple-950/90">
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
                        <p className="border-t border-purple-200/80 pt-2 text-amber-950">
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
                    <div className="rounded-xl border border-purple-100/90 bg-purple-50/40 px-4 py-4">
                      <dt className="text-xs font-semibold uppercase tracking-wide text-purple-800/90">
                        Your information
                      </dt>
                      <dd className="mt-2 space-y-1 text-slate-800">
                        <p>
                          <span className="text-slate-500">Name:</span>{" "}
                          {display(personInfoToDisplayName(petitioner))}
                        </p>
                        <p>
                          <span className="text-slate-500">Age:</span>{" "}
                          {display(petitioner.age)}
                        </p>
                        <p>
                          <span className="text-slate-500">Date of birth:</span>{" "}
                          {display(petitioner.dateOfBirth)}
                        </p>
                        <p>
                          <span className="text-slate-500">Gender:</span>{" "}
                          {display(petitioner.gender)}
                        </p>
                        <p>
                          <span className="text-slate-500">Race:</span>{" "}
                          {display(petitioner.race)}
                        </p>
                        <p>
                          <span className="text-slate-500">Address:</span>{" "}
                          {display(petitioner.address.street)}
                        </p>
                        <p>
                          <span className="text-slate-500">City:</span>{" "}
                          {display(petitioner.address.city)}
                        </p>
                        <p>
                          <span className="text-slate-500">State:</span>{" "}
                          {display(petitioner.address.state)}
                        </p>
                        <p>
                          <span className="text-slate-500">Zip:</span>{" "}
                          {display(petitioner.address.zip)}
                        </p>
                        <p>
                          <span className="text-slate-500">Phone:</span>{" "}
                          {display(petitioner.telephone)}
                        </p>
                        <p>
                          <span className="text-slate-500">Email:</span>{" "}
                          {display(petitioner.email)}
                        </p>
                      </dd>
                    </div>
                    <div className="rounded-xl border border-purple-100/90 bg-purple-50/40 px-4 py-4">
                      <dt className="text-xs font-semibold uppercase tracking-wide text-purple-800/90">
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
                    <div className="rounded-xl border border-purple-100/90 bg-purple-50/40 px-4 py-4">
                      <dt className="text-xs font-semibold uppercase tracking-wide text-purple-800/90">
                        Person you want protection from
                      </dt>
                      <dd className="mt-2 space-y-1 text-slate-800">
                        <p>
                          <span className="text-slate-500">Name:</span>{" "}
                          {display(personInfoToDisplayName(respondentPerson))}
                        </p>
                        <p>
                          <span className="text-slate-500">Age:</span>{" "}
                          {display(respondentPerson.age)}
                        </p>
                        <p>
                          <span className="text-slate-500">Date of birth:</span>{" "}
                          {display(respondentPerson.dateOfBirth)}
                        </p>
                        <p>
                          <span className="text-slate-500">Gender:</span>{" "}
                          {display(respondentPerson.gender)}
                        </p>
                        <p>
                          <span className="text-slate-500">Race:</span>{" "}
                          {display(respondentPerson.race)}
                        </p>
                        <p>
                          <span className="text-slate-500">Height:</span>{" "}
                          {display(respondentPerson.height)}
                        </p>
                        <p>
                          <span className="text-slate-500">Weight:</span>{" "}
                          {display(respondentPerson.weight)}
                        </p>
                        <p>
                          <span className="text-slate-500">Hair color:</span>{" "}
                          {display(respondentPerson.hairColor)}
                        </p>
                        <p>
                          <span className="text-slate-500">Eye color:</span>{" "}
                          {display(respondentPerson.eyeColor)}
                        </p>
                        <p>
                          <span className="text-slate-500">Telephone:</span>{" "}
                          {display(respondentPerson.telephone)}
                        </p>
                      </dd>
                    </div>
                    <div className="rounded-xl border border-purple-100/90 bg-purple-50/40 px-4 py-4">
                      <dt className="text-xs font-semibold uppercase tracking-wide text-purple-800/90">
                        Relationship to other party
                      </dt>
                      <dd className="mt-2 space-y-1 text-slate-800">
                        <p>
                          <span className="text-slate-500">Applies:</span>{" "}
                          {labelsForValues(
                            form.relationshipChecks,
                            RELATIONSHIP_OPTIONS,
                          )}
                        </p>
                        {form.relationshipChecks.includes("children") && (
                          <p>
                            <span className="text-slate-500">
                              Children&apos;s names:
                            </span>{" "}
                            {display(form.childrenNames)}
                          </p>
                        )}
                        {form.relationshipChecks.includes("related") && (
                          <p>
                            <span className="text-slate-500">Related as:</span>{" "}
                            {labelsForValues(
                              form.relatedTypes,
                              RELATED_TYPE_OPTIONS,
                            )}
                          </p>
                        )}
                        {form.relationshipChecks.includes("liveTogether") && (
                          <p>
                            <span className="text-slate-500">
                              Lived together with person in 2:
                            </span>{" "}
                            {displayYn(form.livedTogether)}
                          </p>
                        )}
                      </dd>
                    </div>
                    <div className="rounded-xl border border-purple-100/90 bg-purple-50/40 px-4 py-4">
                      <dt className="text-xs font-semibold uppercase tracking-wide text-purple-800/90">
                        Describe abuse (most recent)
                      </dt>
                      <dd className="mt-2 space-y-1 text-slate-800">
                        <p>
                          <span className="text-slate-500">
                            Date of abuse:
                          </span>{" "}
                          {display(form.recentAbuseDate)}
                        </p>
                        <p>
                          <span className="text-slate-500">
                            Anyone else hear or see:
                          </span>{" "}
                          {displayIdkNoYes(form.recentAbuseWitnesses)}
                        </p>
                        {form.recentAbuseWitnesses === "yes" && (
                          <p>
                            <span className="text-slate-500">
                              Names / who saw or heard:
                            </span>{" "}
                            {display(form.recentAbuseWitnessDetail)}
                          </p>
                        )}
                        <p>
                          <span className="text-slate-500">
                            Weapon used or threatened:
                          </span>{" "}
                          {displayYn(form.recentAbuseWeapon)}
                        </p>
                        {form.recentAbuseWeapon === "yes" && (
                          <p>
                            <span className="text-slate-500">Weapon:</span>{" "}
                            {display(form.recentAbuseWeaponDetail)}
                          </p>
                        )}
                        <p>
                          <span className="text-slate-500">
                            Emotional or physical harm:
                          </span>{" "}
                          {displayYn(form.recentAbuseHarm)}
                        </p>
                        {form.recentAbuseHarm === "yes" && (
                          <p>
                            <span className="text-slate-500">Harm:</span>{" "}
                            {display(form.recentAbuseHarmDetail)}
                          </p>
                        )}
                        <p>
                          <span className="text-slate-500">
                            Police came:
                          </span>{" "}
                          {displayIdkNoYes(form.recentAbusePolice)}
                        </p>
                        <p>
                          <span className="text-slate-500">
                            Details of abuse:
                          </span>{" "}
                          {display(form.recentAbuseDetails)}
                        </p>
                        <p>
                          <span className="text-slate-500">Frequency:</span>{" "}
                          {frequencyReviewLabel(form.recentAbuseFrequency)}
                        </p>
                        {form.recentAbuseFrequency === "other" && (
                          <p>
                            <span className="text-slate-500">
                              Frequency (other):
                            </span>{" "}
                            {display(form.recentAbuseFrequencyOther)}
                          </p>
                        )}
                        {form.recentAbuseFrequency !== "" &&
                          form.recentAbuseFrequency !== "once" && (
                            <p>
                              <span className="text-slate-500">
                                Dates when it happened:
                              </span>{" "}
                              {display(form.recentAbuseDates)}
                            </p>
                          )}
                      </dd>
                    </div>
                    <div className="rounded-xl border border-purple-100/90 bg-purple-50/40 px-4 py-4">
                      <dt className="text-xs font-semibold uppercase tracking-wide text-purple-800/90">
                        Describe abuse (second incident)
                      </dt>
                      <dd className="mt-2 space-y-1 text-slate-800">
                        <p>
                          <span className="text-slate-500">
                            Date of abuse:
                          </span>{" "}
                          {display(form.secondAbuseDate)}
                        </p>
                        <p>
                          <span className="text-slate-500">
                            Anyone else hear or see:
                          </span>{" "}
                          {displayIdkNoYes(form.secondAbuseWitnesses)}
                        </p>
                        {form.secondAbuseWitnesses === "yes" && (
                          <p>
                            <span className="text-slate-500">
                              Names / who saw or heard:
                            </span>{" "}
                            {display(form.secondAbuseWitnessDetail)}
                          </p>
                        )}
                        <p>
                          <span className="text-slate-500">
                            Weapon used or threatened:
                          </span>{" "}
                          {displayYn(form.secondAbuseWeapon)}
                        </p>
                        {form.secondAbuseWeapon === "yes" && (
                          <p>
                            <span className="text-slate-500">Weapon:</span>{" "}
                            {display(form.secondAbuseWeaponDetail)}
                          </p>
                        )}
                        <p>
                          <span className="text-slate-500">
                            Emotional or physical harm:
                          </span>{" "}
                          {displayYn(form.secondAbuseHarm)}
                        </p>
                        {form.secondAbuseHarm === "yes" && (
                          <p>
                            <span className="text-slate-500">Harm:</span>{" "}
                            {display(form.secondAbuseHarmDetail)}
                          </p>
                        )}
                        <p>
                          <span className="text-slate-500">
                            Police came:
                          </span>{" "}
                          {displayIdkNoYes(form.secondAbusePolice)}
                        </p>
                        <p>
                          <span className="text-slate-500">
                            Details of abuse:
                          </span>{" "}
                          {display(form.secondAbuseDetails)}
                        </p>
                        <p>
                          <span className="text-slate-500">Frequency:</span>{" "}
                          {frequencyReviewLabel(form.secondAbuseFrequency)}
                        </p>
                        {form.secondAbuseFrequency === "other" && (
                          <p>
                            <span className="text-slate-500">
                              Frequency (other):
                            </span>{" "}
                            {display(form.secondAbuseFrequencyOther)}
                          </p>
                        )}
                        {form.secondAbuseFrequency !== "" &&
                          form.secondAbuseFrequency !== "once" && (
                            <p>
                              <span className="text-slate-500">
                                Dates or estimates:
                              </span>{" "}
                              {display(form.secondAbuseDates)}
                            </p>
                          )}
                      </dd>
                    </div>
                    <div className="rounded-xl border border-purple-100/90 bg-purple-50/40 px-4 py-4">
                      <dt className="text-xs font-semibold uppercase tracking-wide text-purple-800/90">
                        Describe abuse (third incident)
                      </dt>
                      <dd className="mt-2 space-y-1 text-slate-800">
                        <p>
                          <span className="text-slate-500">
                            Date of abuse:
                          </span>{" "}
                          {display(form.thirdAbuseDate)}
                        </p>
                        <p>
                          <span className="text-slate-500">
                            Anyone else hear or see:
                          </span>{" "}
                          {displayIdkNoYes(form.thirdAbuseWitnesses)}
                        </p>
                        {form.thirdAbuseWitnesses === "yes" && (
                          <p>
                            <span className="text-slate-500">
                              Names / who saw or heard:
                            </span>{" "}
                            {display(form.thirdAbuseWitnessDetail)}
                          </p>
                        )}
                        <p>
                          <span className="text-slate-500">
                            Weapon used or threatened:
                          </span>{" "}
                          {displayYn(form.thirdAbuseWeapon)}
                        </p>
                        {form.thirdAbuseWeapon === "yes" && (
                          <p>
                            <span className="text-slate-500">Weapon:</span>{" "}
                            {display(form.thirdAbuseWeaponDetail)}
                          </p>
                        )}
                        <p>
                          <span className="text-slate-500">
                            Emotional or physical harm:
                          </span>{" "}
                          {displayYn(form.thirdAbuseHarm)}
                        </p>
                        {form.thirdAbuseHarm === "yes" && (
                          <p>
                            <span className="text-slate-500">Harm:</span>{" "}
                            {display(form.thirdAbuseHarmDetail)}
                          </p>
                        )}
                        <p>
                          <span className="text-slate-500">
                            Police came:
                          </span>{" "}
                          {displayIdkNoYes(form.thirdAbusePolice)}
                        </p>
                        <p>
                          <span className="text-slate-500">
                            Details of abuse:
                          </span>{" "}
                          {display(form.thirdAbuseDetails)}
                        </p>
                        <p>
                          <span className="text-slate-500">Frequency:</span>{" "}
                          {frequencyReviewLabel(form.thirdAbuseFrequency)}
                        </p>
                        {form.thirdAbuseFrequency === "other" && (
                          <p>
                            <span className="text-slate-500">
                              Frequency (other):
                            </span>{" "}
                            {display(form.thirdAbuseFrequencyOther)}
                          </p>
                        )}
                        {form.thirdAbuseFrequency !== "" &&
                          form.thirdAbuseFrequency !== "once" && (
                            <p>
                              <span className="text-slate-500">
                                Dates or estimates:
                              </span>{" "}
                              {display(form.thirdAbuseDates)}
                            </p>
                          )}
                      </dd>
                    </div>
                    <div className="rounded-xl border border-purple-100/90 bg-purple-50/40 px-4 py-4">
                      <dt className="text-xs font-semibold uppercase tracking-wide text-purple-800/90">
                        Other protected people &amp; firearms
                      </dt>
                      <dd className="mt-2 space-y-1 text-slate-800">
                        <p>
                          <span className="text-slate-500">
                            Others need protection:
                          </span>{" "}
                          {form.protectOtherPeople === "yes"
                            ? "Yes"
                            : form.protectOtherPeople === "no"
                              ? "No"
                              : "—"}
                        </p>
                        {form.protectOtherPeople === "yes" && (
                          <>
                            {form.protectedPeople.map((p, i) => (
                              <p key={`pp-${i}`}>
                                <span className="text-slate-500">
                                  Person {i + 1}:
                                </span>{" "}
                                {display(p.name)}; age {display(p.age)}; DOB{" "}
                                {display(p.dateOfBirth)}; gender{" "}
                                {display(p.gender)}; race {display(p.race)};
                                relationship {display(p.relationship)}; lives
                                with you{" "}
                                {p.livesWithYou === "Yes" ||
                                p.livesWithYou === "No"
                                  ? p.livesWithYou
                                  : "—"}
                              </p>
                            ))}
                            <p>
                              <span className="text-slate-500">
                                Why they need protection:
                              </span>{" "}
                              {display(form.protectedPeopleWhy)}
                            </p>
                          </>
                        )}
                        <p>
                          <span className="text-slate-500">Firearms:</span>{" "}
                          {displayIdkNoYes(form.hasFirearms)}
                        </p>
                        {form.hasFirearms === "yes" &&
                          form.firearms.map((f, i) => (
                            <p key={`fa-${i}`}>
                              <span className="text-slate-500">
                                Firearm {i + 1}:
                              </span>{" "}
                              {display(f.description)} / amount{" "}
                              {display(f.amount)} / location{" "}
                              {display(f.location)}
                            </p>
                          ))}
                      </dd>
                    </div>
                    <div className="rounded-xl border border-purple-100/90 bg-purple-50/40 px-4 py-4">
                      <dt className="text-xs font-semibold uppercase tracking-wide text-purple-800/90">
                        Orders requested
                      </dt>
                      <dd className="mt-2 space-y-2 text-slate-800">
                        <p>
                          <span className="text-slate-500">
                            Order to Not Abuse:
                          </span>{" "}
                          {form.orderToNotAbuse ? "Yes" : "No"}
                        </p>
                        <p>
                          <span className="text-slate-500">
                            No-Contact Order:
                          </span>{" "}
                          {form.noContactOrder ? "Yes" : "No"}
                        </p>
                        <p>
                          <span className="text-slate-500">
                            Stay-Away Order:
                          </span>{" "}
                          {form.stayAwayOrder ? "Yes" : "No"}
                        </p>
                        {form.stayAwayOrder ? (
                          <div className="space-y-1 border-l-2 border-purple-200/80 pl-3 text-slate-800">
                            <p>
                              <span className="text-slate-500">
                                Stay away from:
                              </span>{" "}
                              {(() => {
                                const parts: string[] = [];
                                if (form.stayAwayMe) parts.push("Me");
                                if (form.stayAwayHome) parts.push("My home");
                                if (form.stayAwayWork) {
                                  parts.push("My job or workplace");
                                }
                                if (form.stayAwayVehicle) {
                                  parts.push("My vehicle");
                                }
                                if (form.stayAwaySchool) {
                                  parts.push("My school");
                                }
                                if (form.stayAwayProtectedPersons) {
                                  parts.push("Each person in Section 8");
                                }
                                if (form.stayAwayChildrenSchool) {
                                  parts.push(
                                    "My children's school or childcare",
                                  );
                                }
                                if (form.stayAwayOther) {
                                  parts.push(
                                    form.stayAwayOtherExplain.trim()
                                      ? `Other (${form.stayAwayOtherExplain.trim()})`
                                      : "Other (please explain)",
                                  );
                                }
                                return parts.length > 0
                                  ? parts.join(", ")
                                  : "—";
                              })()}
                            </p>
                            <p>
                              <span className="text-slate-500">Distance:</span>{" "}
                              {form.stayAwayDistance === "hundred"
                                ? "100 yards (300 feet)"
                                : form.stayAwayDistance === "other"
                                  ? form.stayAwayDistanceOther.trim()
                                    ? `${form.stayAwayDistanceOther.trim()} yards`
                                    : "Other (yards not specified)"
                                  : "—"}
                            </p>
                            <p>
                              <span className="text-slate-500">
                                Live together/close:
                              </span>{" "}
                              {form.liveTogether === "no"
                                ? "No"
                                : form.liveTogether === "yes"
                                  ? (() => {
                                      const sub =
                                        form.liveTogetherType ===
                                        "liveTogether"
                                          ? "Live together"
                                          : form.liveTogetherType ===
                                              "sameBuilding"
                                            ? "Same building, not same home"
                                            : form.liveTogetherType ===
                                                "sameNeighborhood"
                                              ? "Same neighborhood"
                                              : form.liveTogetherType ===
                                                  "other"
                                                ? form.liveTogetherOther.trim()
                                                  ? `Other (${form.liveTogetherOther.trim()})`
                                                  : "Other (please explain)"
                                                : "—";
                                      return `Yes — ${sub}`;
                                    })()
                                  : "—"}
                            </p>
                            <p>
                              <span className="text-slate-500">
                                Same workplace/school:
                              </span>{" "}
                              {form.sameWorkplaceSchool === "no"
                                ? "No"
                                : form.sameWorkplaceSchool === "yes"
                                  ? (() => {
                                      const bits: string[] = [];
                                      if (form.workTogether) {
                                        bits.push(
                                          form.workTogetherCompany.trim()
                                            ? `Work together at ${form.workTogetherCompany.trim()}`
                                            : "Work together (company not specified)",
                                        );
                                      }
                                      if (form.sameSchool) {
                                        bits.push(
                                          form.sameSchoolName.trim()
                                            ? `Same school: ${form.sameSchoolName.trim()}`
                                            : "Same school (name not specified)",
                                        );
                                      }
                                      if (form.sameWorkplaceOther) {
                                        bits.push(
                                          form.sameWorkplaceOtherExplain.trim()
                                            ? `Other: ${form.sameWorkplaceOtherExplain.trim()}`
                                            : "Other (please explain)",
                                        );
                                      }
                                      return bits.length > 0
                                        ? `Yes — ${bits.join(" / ")}`
                                        : "Yes — (none selected)";
                                    })()
                                  : "—"}
                            </p>
                          </div>
                        ) : null}
                      </dd>
                    </div>
                    <div className="rounded-xl border border-purple-100/90 bg-purple-50/40 px-4 py-4">
                      <dt className="text-xs font-semibold uppercase tracking-wide text-purple-800/90">
                        More orders (Page 8)
                      </dt>
                      <dd className="mt-2 space-y-2 text-slate-800">
                        <p>
                          <span className="text-slate-500">
                            Order to move out:
                          </span>{" "}
                          {form.orderToMoveOut ? "Yes" : "No"}
                        </p>
                        {form.orderToMoveOut ? (
                          <div className="space-y-1 border-l-2 border-purple-200/80 pl-3">
                            <p>
                              <span className="text-slate-500">13a:</span>{" "}
                              {display(form.moveOutOrderPersonAsk)}
                            </p>
                            <p>
                              <span className="text-slate-500">13b:</span>{" "}
                              {(() => {
                                const parts: string[] = [];
                                if (form.moveOutOwnHome) parts.push("I own the home");
                                if (form.moveOutNameOnLease) {
                                  parts.push("My name is on the lease");
                                }
                                if (form.moveOutWithChildren) {
                                  parts.push(
                                    "I live at this address with my children",
                                  );
                                }
                                if (form.moveOutLivedFor) {
                                  const y = form.moveOutLivedYears.trim();
                                  const m = form.moveOutLivedMonths.trim();
                                  const dur =
                                    y || m
                                      ? `I have lived at this address for (${y || "—"} yr, ${m || "—"} mo)`
                                      : "I have lived at this address for";
                                  parts.push(dur);
                                }
                                if (form.moveOutPaysRent) {
                                  parts.push(
                                    "I pay for some or all of the rent or mortgage",
                                  );
                                }
                                if (form.moveOutOther) {
                                  parts.push(
                                    form.moveOutOtherExplain.trim()
                                      ? `Other (${form.moveOutOtherExplain.trim()})`
                                      : "Other (please explain)",
                                  );
                                }
                                return parts.length > 0 ? parts.join("; ") : "—";
                              })()}
                            </p>
                          </div>
                        ) : null}
                        <p>
                          <span className="text-slate-500">Other orders:</span>{" "}
                          {form.otherOrders ? "Yes" : "No"}
                        </p>
                        {form.otherOrders && (
                          <p>
                            <span className="text-slate-500">14. Describe:</span>{" "}
                            {display(form.otherOrdersDescribe)}
                          </p>
                        )}
                        <p>
                          <span className="text-slate-500">
                            Child custody and visitation:
                          </span>{" "}
                          {form.childCustodyVisitation ? "Yes (complete DV-105)" : "No"}
                        </p>
                      </dd>
                    </div>
                    <div className="rounded-xl border border-purple-100/90 bg-purple-50/40 px-4 py-4">
                      <dt className="text-xs font-semibold uppercase tracking-wide text-purple-800/90">
                        Property, animals &amp; other orders (Page 9)
                      </dt>
                      <dd className="mt-2 space-y-2 text-slate-800">
                        <p>
                          <span className="text-slate-500">
                            Protect animals:
                          </span>{" "}
                          {form.protectAnimals ? "Yes" : "No"}
                        </p>
                        {form.protectAnimals ? (
                          <div className="space-y-1 border-l-2 border-purple-200/80 pl-3">
                            {form.protectedAnimals.map((a, i) => (
                              <p key={`ra-${i}`}>
                                <span className="text-slate-500">
                                  Animal {i + 1}:
                                </span>{" "}
                                {display(a.name)} / {display(a.type)} /{" "}
                                {display(a.breed)} / {display(a.color)}
                              </p>
                            ))}
                            <p>
                              <span className="text-slate-500">
                                Stay away from animals:
                              </span>{" "}
                              {form.protectAnimalsStayAway
                                ? form.protectAnimalsStayAwayDistance ===
                                    "hundred"
                                  ? "100 yards (300 feet)"
                                  : form.protectAnimalsStayAwayDistance ===
                                      "other"
                                    ? form.protectAnimalsStayAwayOtherYards.trim()
                                      ? `${form.protectAnimalsStayAwayOtherYards.trim()} yards`
                                      : "Other (yards not specified)"
                                    : "—"
                                : "No"}
                            </p>
                            <p>
                              <span className="text-slate-500">
                                Not take / harm animals:
                              </span>{" "}
                              {form.protectAnimalsNotTake ? "Yes" : "No"}
                            </p>
                            <p>
                              <span className="text-slate-500">
                                Sole possession of animals:
                              </span>{" "}
                              {form.protectAnimalsSolePossession ? "Yes" : "No"}
                            </p>
                            {form.protectAnimalsSolePossession ? (
                              <p>
                                <span className="text-slate-500">
                                  Reasons:
                                </span>{" "}
                                {(() => {
                                  const parts: string[] = [];
                                  if (form.protectAnimalsSoleReasonAbuse) {
                                    parts.push("Person in 2 abuses the animals");
                                  }
                                  if (form.protectAnimalsSoleReasonCare) {
                                    parts.push("I take care of these animals");
                                  }
                                  if (form.protectAnimalsSoleReasonPurchased) {
                                    parts.push("I purchased these animals");
                                  }
                                  if (form.protectAnimalsSoleReasonOther) {
                                    parts.push(
                                      form.protectAnimalsSoleReasonOtherExplain.trim()
                                        ? `Other (${form.protectAnimalsSoleReasonOtherExplain.trim()})`
                                        : "Other",
                                    );
                                  }
                                  return parts.length > 0 ? parts.join("; ") : "—";
                                })()}
                              </p>
                            ) : null}
                          </div>
                        ) : null}
                        <p>
                          <span className="text-slate-500">
                            Control of property:
                          </span>{" "}
                          {form.controlProperty ? "Yes" : "No"}
                        </p>
                        {form.controlProperty ? (
                          <>
                            <p>
                              <span className="text-slate-500">17a:</span>{" "}
                              {display(form.controlPropertyDescribe)}
                            </p>
                            <p>
                              <span className="text-slate-500">17b:</span>{" "}
                              {display(form.controlPropertyWhy)}
                            </p>
                          </>
                        ) : null}
                        <p>
                          <span className="text-slate-500">
                            Health and other insurance:
                          </span>{" "}
                          {form.healthOtherInsurance ? "Yes" : "No"}
                        </p>
                        <p>
                          <span className="text-slate-500">
                            Record communications:
                          </span>{" "}
                          {form.recordCommunications ? "Yes" : "No"}
                        </p>
                      </dd>
                    </div>
                    <div className="rounded-xl border border-purple-100/90 bg-purple-50/40 px-4 py-4">
                      <dt className="text-xs font-semibold uppercase tracking-wide text-purple-800/90">
                        Property, notice &amp; debts (Page 10)
                      </dt>
                      <dd className="mt-2 space-y-2 text-slate-800">
                        <p>
                          <span className="text-slate-500">
                            Property restraint:
                          </span>{" "}
                          {form.propertyRestraint ? "Yes" : "No"}
                        </p>
                        <p>
                          <span className="text-slate-500">
                            Extend deadline to give notice:
                          </span>{" "}
                          {form.extendNoticeDeadline ? "Yes" : "No"}
                        </p>
                        {form.extendNoticeDeadline ? (
                          <p>
                            <span className="text-slate-500">
                              Why more time:
                            </span>{" "}
                            {display(form.extendNoticeExplain)}
                          </p>
                        ) : null}
                        <p>
                          <span className="text-slate-500">
                            Pay debts for property:
                          </span>{" "}
                          {form.payDebtsForProperty ? "Yes" : "No"}
                        </p>
                        {form.payDebtsForProperty ? (
                          <div className="space-y-1 border-l-2 border-purple-200/80 pl-3">
                            {form.payDebtsRows.map((d, i) => (
                              <p key={`pd-${i}`}>
                                <span className="text-slate-500">
                                  Debt {i + 1}:
                                </span>{" "}
                                {display(d.payTo)} / {display(d.payFor)} /{" "}
                                {display(d.amount)} / {display(d.dueDate)}
                              </p>
                            ))}
                            <p>
                              <span className="text-slate-500">
                                Why they should pay:
                              </span>{" "}
                              {display(form.payDebtsExplain)}
                            </p>
                            <p>
                              <span className="text-slate-500">
                                Special judge finding:
                              </span>{" "}
                              {form.payDebtsSpecialDecision === "yes"
                                ? "Yes"
                                : form.payDebtsSpecialDecision === "no"
                                  ? "No"
                                  : "—"}
                            </p>
                            {form.payDebtsSpecialDecision === "yes" ? (
                              <>
                                <p>
                                  <span className="text-slate-500">
                                    Debts from abuse:
                                  </span>{" "}
                                  {[
                                    form.payDebtsAbuseDebt1 && "1",
                                    form.payDebtsAbuseDebt2 && "2",
                                    form.payDebtsAbuseDebt3 && "3",
                                  ]
                                    .filter(Boolean)
                                    .join(", ") || "—"}
                                </p>
                                <p>
                                  <span className="text-slate-500">
                                    Know how debts were made:
                                  </span>{" "}
                                  {form.payDebtsKnowHow === "yes"
                                    ? "Yes"
                                    : form.payDebtsKnowHow === "no"
                                      ? "No"
                                      : "—"}
                                </p>
                                {form.payDebtsKnowHow === "yes" ? (
                                  <p>
                                    <span className="text-slate-500">
                                      How:
                                    </span>{" "}
                                    {display(form.payDebtsExplainHow)}
                                  </p>
                                ) : null}
                              </>
                            ) : null}
                          </div>
                        ) : null}
                      </dd>
                    </div>
                    <div className="rounded-xl border border-purple-100/90 bg-purple-50/40 px-4 py-4">
                      <dt className="text-xs font-semibold uppercase tracking-wide text-purple-800/90">
                        Support, fees &amp; restitution (Page 11)
                      </dt>
                      <dd className="mt-2 space-y-1 text-slate-800">
                        <p>
                          <span className="text-slate-500">
                            Pay expenses caused by abuse (Section 23):
                          </span>{" "}
                          {form.requestRestitution ? "Yes" : "No"}
                        </p>
                        {form.requestRestitution ? (
                          <>
                            <p>
                              <span className="text-slate-500">
                                Abuser pays $250 LIZ fee (invoice appended):
                              </span>{" "}
                              {form.requestAbuserPayLizFee ? "Yes" : "No"}
                            </p>
                            <div className="mt-2 space-y-1">
                              <p className="text-slate-500">Expense grid:</p>
                              <ul className="list-inside list-disc text-slate-700">
                                {form.restitutionExpenses.map((row, i) => (
                                  <li key={i}>
                                    {i + 1}. Pay to: {display(row.payTo)} · For:{" "}
                                    {display(row.forReason)} · Amount:{" "}
                                    {display(row.amount)}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          </>
                        ) : null}
                        <p>
                          <span className="text-slate-500">Child support:</span>{" "}
                          {form.requestChildSupport ? "Yes" : "No"}
                        </p>
                        {form.requestChildSupport ? (
                          <ul className="ml-4 list-inside list-disc space-y-0.5 text-slate-700">
                            <li>
                              No order, want one:{" "}
                              {form.childSupportNoOrderWantOne ? "Yes" : "No"}
                            </li>
                            <li>
                              Have order, want changed:{" "}
                              {form.childSupportHaveOrderWantChanged ? "Yes" : "No"}
                            </li>
                            <li>
                              TANF / Welfare / CalWORKS:{" "}
                              {form.childSupportTANF ? "Yes" : "No"}
                            </li>
                          </ul>
                        ) : null}
                        <p>
                          <span className="text-slate-500">Spousal support:</span>{" "}
                          {form.requestSpousalSupport ? "Yes" : "No"}
                        </p>
                        <p>
                          <span className="text-slate-500">
                            Lawyer&apos;s fees and costs:
                          </span>{" "}
                          {form.requestLawyerFees ? "Yes" : "No"}
                        </p>
                      </dd>
                    </div>
                    <div className="rounded-xl border border-purple-100/90 bg-purple-50/40 px-4 py-4">
                      <dt className="text-xs font-semibold uppercase tracking-wide text-purple-800/90">
                        Intervention &amp; wireless (Page 12)
                      </dt>
                      <dd className="mt-2 space-y-1 text-slate-800">
                        <p>
                          <span className="text-slate-500">
                            Batterer intervention program (Section 27):
                          </span>{" "}
                          {form.requestBattererIntervention ? "Yes" : "No"}
                        </p>
                        <p>
                          <span className="text-slate-500">
                            Transfer of wireless phone account (Section 28):
                          </span>{" "}
                          {form.requestWirelessTransfer ? "Yes" : "No"}
                        </p>
                        {form.requestWirelessTransfer ? (
                          <div className="mt-2 space-y-1">
                            <p className="text-slate-500">Wireless number rows:</p>
                            <ul className="list-inside list-disc text-slate-700">
                              {form.wirelessAccounts.map((row, i) => (
                                <li key={i}>
                                  Row {String.fromCharCode(97 + i)}: My number{" "}
                                  {row.isMyNumber ? "Yes" : "No"} · Child in my care{" "}
                                  {row.isChildNumber ? "Yes" : "No"} · Phone:{" "}
                                  {display(row.phoneNumber)}
                                </li>
                              ))}
                            </ul>
                          </div>
                        ) : null}
                      </dd>
                    </div>
                    <div className="rounded-xl border border-purple-100/90 bg-purple-50/40 px-4 py-4">
                      <dt className="text-xs font-semibold uppercase tracking-wide text-purple-800/90">
                        Other court cases
                      </dt>
                      <dd className="mt-2 space-y-1 text-slate-800">
                        <p>
                          <span className="text-slate-500">
                            Other restraining/protective orders in effect:
                          </span>{" "}
                          {displayYn(form.hasRestrainingOrders)}
                        </p>
                        {form.hasRestrainingOrders === "yes" && (
                          <>
                            <p>
                              <span className="text-slate-500">
                                Order 1 — date / expires:
                              </span>{" "}
                              {display(form.order1Date)} /{" "}
                              {display(form.order1Expires)}
                            </p>
                            <p>
                              <span className="text-slate-500">
                                Order 2 — date / expires:
                              </span>{" "}
                              {display(form.order2Date)} /{" "}
                              {display(form.order2Expires)}
                            </p>
                          </>
                        )}
                        <p>
                          <span className="text-slate-500">
                            Other court case filed:
                          </span>{" "}
                          {displayYn(form.hasOtherCases)}
                        </p>
                        {form.hasOtherCases === "yes" && (
                          <>
                            <p>
                              <span className="text-slate-500">
                                Case types:
                              </span>{" "}
                              {labelsForValues(
                                form.caseTypes,
                                CASE_TYPE_OPTIONS,
                              )}
                            </p>
                            {form.caseTypes.includes("custody") && (
                              <p>
                                <span className="text-slate-500">
                                  Custody — case details:
                                </span>{" "}
                                {display(form.custodyCaseDetails)}
                              </p>
                            )}
                            {form.caseTypes.includes("divorce") && (
                              <p>
                                <span className="text-slate-500">
                                  Divorce — case details:
                                </span>{" "}
                                {display(form.divorceCaseDetails)}
                              </p>
                            )}
                            {form.caseTypes.includes("juvenile") && (
                              <p>
                                <span className="text-slate-500">
                                  Juvenile — case details:
                                </span>{" "}
                                {display(form.juvenileCaseDetails)}
                              </p>
                            )}
                            {form.caseTypes.includes("guardianship") && (
                              <p>
                                <span className="text-slate-500">
                                  Guardianship — case details:
                                </span>{" "}
                                {display(form.guardianshipCaseDetails)}
                              </p>
                            )}
                            {form.caseTypes.includes("criminal") && (
                              <p>
                                <span className="text-slate-500">
                                  Criminal — case details:
                                </span>{" "}
                                {display(form.criminalCaseDetails)}
                              </p>
                            )}
                            {form.caseTypes.includes("other") && (
                              <p>
                                <span className="text-slate-500">
                                  Other — what kind of case:
                                </span>{" "}
                                {display(form.otherCaseType)}
                              </p>
                            )}
                          </>
                        )}
                      </dd>
                    </div>
                  </dl>
                </div>
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
