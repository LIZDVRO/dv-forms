"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";

import {
  emptyRestitutionExpenses,
  emptyWirelessAccounts,
  generateDV100PDF,
  getProtectedPeoplePdfFieldsFromFormStore,
  triggerPdfDownload,
  type Dv100PdfFormData,
  type Dv100GenderOption,
} from "@/lib/dv100-pdf";
import { generateCLETS001PDF, type Clets001PdfData } from "@/lib/clets001-pdf";
import { generateDV109PDF, type Dv109PdfData } from "@/lib/dv109-pdf";
import { generateDV110PDF, type Dv110PdfData } from "@/lib/dv110-pdf";
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
  const [pdfInfo, setPdfInfo] = useState<Step12PdfInfo | null>(null);
  const [efileStatus, setEfileStatus] = useState<
    "idle" | "confirming" | "sending" | "success" | "error"
  >("idle");
  const [efileError, setEfileError] = useState("");

  const petitioner = useFormStore((s) => s.petitioner);
  const respondentPerson = useFormStore((s) => s.respondent.person);
  const respondentCLETS = useFormStore((s) => s.respondent.clets);
  const setRespondentPerson = useFormStore((s) => s.setRespondentPerson);
  const setRespondentCLETS = useFormStore((s) => s.setRespondentCLETS);

  const [respondentFullName, setRespondentFullName] = useState(() =>
    personInfoToDisplayName(respondentPerson),
  );

  const prevStepRef = useRef(step);
  useEffect(() => {
    if (step === 2 && prevStepRef.current !== 2) {
      setRespondentFullName(personInfoToDisplayName(respondentPerson));
    }
    prevStepRef.current = step;
  }, [step, respondentPerson]);

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
      const ppClets = getProtectedPeoplePdfFieldsFromFormStore();
      const cletsPayload: Clets001PdfData = {
        petitioner,
        respondent: respondentPerson,
        respondentCLETS,
        protectOtherPeople: ppClets.protectOtherPeople,
        protectedPeople: ppClets.protectedPeople,
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
      const ppDv110 = getProtectedPeoplePdfFieldsFromFormStore();
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
        protectedPeople: ppDv110.protectedPeople.map((p) => ({
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

      const ppEfile = getProtectedPeoplePdfFieldsFromFormStore();
      const cletsPayload: Clets001PdfData = {
        petitioner,
        respondent: respondentPerson,
        respondentCLETS,
        protectOtherPeople: ppEfile.protectOtherPeople,
        protectedPeople: ppEfile.protectedPeople,
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
        protectedPeople: ppEfile.protectedPeople.map((p) => ({
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
                <Step10_InterventionWireless
                  form={form}
                  setForm={setForm}
                  inputClass={inputClass}
                />
              )}

              {step === 11 && (
                <Step11_Signature form={form} setForm={setForm} />
              )}

              {step === 12 && (
                <Step12_ReviewGenerate
                  form={form}
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
