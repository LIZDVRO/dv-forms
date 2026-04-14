"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";

import {
  DV100_GENDER_OPTIONS,
  emptyRestitutionExpenses,
  emptyWirelessAccounts,
  generateDV100PDF,
  triggerPdfDownload,
  type Dv100FirearmRow,
  type Dv100PdfFillRow,
  type Dv100PdfFormData,
  type Dv100GenderOption,
  type Dv100ProtectedAnimal,
  type Dv100ProtectedPerson,
} from "@/lib/dv100-pdf";

import { useFormStore, type PersonInfo } from "@/store/useFormStore";

import SignatureStep from "@/components/SignatureStep";

import { Page11SupportFeesRestitutionStep } from "./Page11SupportFeesRestitutionStep";
import { Page12InterventionWirelessStep } from "./Page12InterventionWirelessStep";

const STEP_TITLES = [
  "Legal Representation",
  "Who Needs Protection?",
  "Person You Want Protection From",
  "Relationship to Other Party",
  "Other Court Cases",
  "Describe Abuse",
  "Firearms",
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
  "Provide identifying information for the person you are asking the court for protection from.",
  "Describe how you are connected to the other person (DV-100 Section 3).",
  "Answer questions about other restraining orders and other court cases involving you and this person (DV-100 Section 4).",
  "Describe incidents of abuse (DV-100 Sections 5–7, Pages 3–5). You will start with the most recent incident; you can choose to add up to two more separate incidents when you feel ready.",
  "Firearm information if known (DV-100 Section 9, Page 6).",
  "Choose the orders you want a judge to make (DV-100 Sections 10-12, Page 7). Every situation is different. Choose the orders that fit your situation.",
  "Ask the court to order the other person to move out, describe any other orders, and indicate if you need custody orders (DV-100 Sections 13-15, Page 8).",
  "Property, animals, insurance, and communications orders (DV-100 Sections 16-19, Page 9).",
  "Property restraint, extended notice deadline, and pay-debts orders (DV-100 Sections 20-22, Page 10).",
  "Request restitution for document preparation, and indicate child support, spousal support, and lawyer-fee orders (DV-100 Sections 23-26, Page 11).",
  "Batterer intervention and wireless phone account transfer requests (DV-100 Sections 27-28, Page 12). Sections 29-31 are automatic if the order is granted.",
  "Declare that your answers are true, then sign. Your signature is stored with your answers for PDF generation.",
  "Confirm everything below, then generate your filled PDF.",
] as const;

const RELATIONSHIP_OPTIONS: { value: string; label: string }[] = [
  {
    value: "children",
    label: "We have a child or children together",
  },
  {
    value: "married",
    label: "We are married or registered domestic partners",
  },
  {
    value: "usedToBeMarried",
    label: "We used to be married or registered domestic partners",
  },
  {
    value: "dating",
    label: "We are dating or used to date",
  },
  {
    value: "engaged",
    label: "We are or used to be engaged to be married",
  },
  { value: "related", label: "We are related" },
  {
    value: "liveTogether",
    label: "We live together or used to live together",
  },
];

const RELATED_TYPE_OPTIONS: { value: string; label: string }[] = [
  {
    value: "parent",
    label: "Parent/stepparent/parent-in-law",
  },
  {
    value: "child",
    label: "Child/stepchild/adopted child",
  },
  { value: "childsSpouse", label: "Child's spouse" },
  {
    value: "sibling",
    label: "Sibling/stepsibling/sibling-in-law",
  },
  {
    value: "grandparent",
    label: "Grandparent/stepgrandparent/grandparent-in-law",
  },
  {
    value: "grandchild",
    label: "Grandchild/stepgrandchild/grandchild-in-law",
  },
];

const CASE_TYPE_OPTIONS: { value: string; label: string }[] = [
  { value: "custody", label: "Custody" },
  { value: "divorce", label: "Divorce" },
  {
    value: "juvenile",
    label: "Juvenile child welfare or juvenile justice",
  },
  { value: "guardianship", label: "Guardianship" },
  { value: "criminal", label: "Criminal" },
  { value: "other", label: "Other" },
];

/** DV-100 Section 5 — statutory examples shown above the “details of abuse” field. */
const SECTION5_ABUSE_EXAMPLES = [
  "made repeated unwanted contact with you",
  "tracked, controlled, or blocked your movements",
  "kept you from getting food or basic needs",
  "isolated you from friends, family, or other support",
  "made threats based on actual or suspected immigration status",
  "made you do something by force, threat, or intimidation",
  "stopped you from accessing or earning money",
  "tried to control/interfere with your contraception, birth control, pregnancy, or access to health information",
  "harassed you",
  "hit, kicked, pushed, or bit you",
  "injured you or tried to",
  "threatened to hurt or kill you",
  "sexually abused you",
  "abused a pet or animal",
  "destroyed your property",
  "choked or strangled you",
  "abused your children",
] as const;

/** PDF 5(d) harm description — single-line field on the official form. */
const HARM_DETAIL_MAX_LENGTH = 85;

const PROTECTED_PEOPLE_WHY_MAX_LENGTH = 400;
const MOVE_OUT_13A_MAX_LENGTH = 65;
const MOVE_OUT_DURATION_MAX_LENGTH = 3;
const MOVE_OUT_13B_OTHER_MAX_LENGTH = 400;
const OTHER_ORDERS_14_MAX_LENGTH = 1000;
const PAGE10_EXTEND_NOTICE_EXPLAIN_MAX = 300;
const PAGE10_PAY_DEBTS_EXPLAIN_MAX = 300;
const PAGE10_PAY_DEBTS_SPECIAL_EXPLAIN_MAX = 300;
const PAGE10_DEBT_PAY_TO_MAX = 20;
const PAGE10_DEBT_FOR_MAX = 20;
const PAGE10_DEBT_AMOUNT_MAX = 10;
const PAGE10_DEBT_DUE_MAX = 15;

function defaultProtectedPerson(): Dv100ProtectedPerson {
  return { name: "", age: "", relationship: "", livesWithYou: null };
}

function defaultFirearmRow(): Dv100FirearmRow {
  return { description: "", amount: "", location: "" };
}

function defaultProtectedAnimal(): Dv100ProtectedAnimal {
  return { name: "", type: "", breed: "", color: "" };
}

function initialProtectedAnimals(): Dv100ProtectedAnimal[] {
  return [
    defaultProtectedAnimal(),
    defaultProtectedAnimal(),
    defaultProtectedAnimal(),
    defaultProtectedAnimal(),
  ];
}

/** Maps case-type checkbox value to its Section 4b detail field (not including `other`). */
const CASE_TYPE_DETAIL_KEY: Partial<
  Record<
    string,
    | "custodyCaseDetails"
    | "divorceCaseDetails"
    | "juvenileCaseDetails"
    | "guardianshipCaseDetails"
    | "criminalCaseDetails"
  >
> = {
  custody: "custodyCaseDetails",
  divorce: "divorceCaseDetails",
  juvenile: "juvenileCaseDetails",
  guardianship: "guardianshipCaseDetails",
  criminal: "criminalCaseDetails",
};

function toggleInList(list: string[], value: string): string[] {
  return list.includes(value) ? list.filter((x) => x !== value) : [...list, value];
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

const GENDER_OPTIONS = DV100_GENDER_OPTIONS;
type FormData = Dv100PdfFormData;

/** Single “full name” field ↔ Zustand `PersonInfo` (first / middle / last). */
function personInfoToDisplayName(p: PersonInfo): string {
  return [p.firstName, p.middleName, p.lastName]
    .map((s) => s.trim())
    .filter(Boolean)
    .join(" ");
}

function parseDisplayNameToPersonInfo(
  value: string,
): Pick<PersonInfo, "firstName" | "middleName" | "lastName"> {
  const parts = value.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) {
    return { firstName: "", middleName: "", lastName: "" };
  }
  if (parts.length === 1) {
    return { firstName: parts[0], middleName: "", lastName: "" };
  }
  if (parts.length === 2) {
    return { firstName: parts[0], middleName: "", lastName: parts[1] };
  }
  return {
    firstName: parts[0],
    middleName: parts.slice(1, -1).join(" "),
    lastName: parts[parts.length - 1],
  };
}

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
  const [pdfError, setPdfError] = useState<string | null>(null);
  const [pdfInfo, setPdfInfo] = useState<{
    filled: Dv100PdfFillRow[];
    missing: Dv100PdfFillRow[];
  } | null>(null);

  const { petitioner, respondent, setPetitioner, setRespondent } =
    useFormStore();

  const [petitionerFullName, setPetitionerFullName] = useState(() =>
    personInfoToDisplayName(petitioner),
  );
  const [respondentFullName, setRespondentFullName] = useState(() =>
    personInfoToDisplayName(respondent),
  );

  const prevStepRef = useRef(step);
  useEffect(() => {
    if (step === 1 && prevStepRef.current !== 1) {
      setPetitionerFullName(personInfoToDisplayName(petitioner));
    }
    if (step === 2 && prevStepRef.current !== 2) {
      setRespondentFullName(personInfoToDisplayName(respondent));
    }
    prevStepRef.current = step;
  }, [step, petitioner, respondent]);

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
        respondentName: personInfoToDisplayName(respondent),
        respondentAge: respondent.age,
        respondentDob: respondent.dateOfBirth,
        respondentGender: respondent.gender as Dv100GenderOption,
        respondentRace: respondent.race,
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

  const inputClass =
    "mt-2 w-full rounded-xl border border-purple-100 bg-white px-4 py-3 text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-liz focus:ring-2 focus:ring-liz/30";

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

  const abuseExampleColumns = useMemo(() => {
    const mid = Math.ceil(SECTION5_ABUSE_EXAMPLES.length / 2);
    return [
      SECTION5_ABUSE_EXAMPLES.slice(0, mid),
      SECTION5_ABUSE_EXAMPLES.slice(mid),
    ] as const;
  }, []);

  const textareaClass = `${inputClass} min-h-[6.5rem] resize-y`;

  return (
    <div className="relative flex min-h-full flex-1 flex-col overflow-hidden bg-gradient-to-b from-purple-50/80 via-white to-purple-100/40">
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(102,45,145,0.14),transparent)]"
        aria-hidden
      />
      <div className="relative z-10 mx-auto flex w-full max-w-2xl flex-1 flex-col px-4 py-8 sm:px-6 sm:py-12">
        <header className="mb-8 flex flex-col gap-6 sm:mb-10">
          <div className="border-b border-purple-200/60 pb-8 text-center">
            <p className="font-sans text-5xl font-light tracking-widest text-liz">
              LIZ
            </p>
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
          <div className="flex flex-1 flex-col rounded-2xl border border-purple-100/90 bg-white/90 p-6 shadow-[0_24px_80px_-32px_rgba(102,45,145,0.22)] backdrop-blur-sm sm:p-10">
            <h1 className="text-xl font-semibold tracking-tight text-slate-900 sm:text-2xl">
              {STEP_TITLES[step]}
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-slate-600 sm:text-base">
              {STEP_BLURBS[step]}
            </p>

            <div className="mt-8 flex flex-1 flex-col">
              {step === 0 && (
                <div className="space-y-6">
                  <fieldset className="space-y-4">
                    <legend className="text-sm font-medium text-slate-800">
                      Is an attorney preparing or assisting with this form?
                    </legend>
                    <div className="space-y-3">
                      <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-purple-100 bg-white px-4 py-3 shadow-sm transition hover:border-purple-200 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-liz/30">
                        <input
                          type="radio"
                          name="hasLawyer"
                          checked={form.hasLawyer === true}
                          onChange={() => update("hasLawyer", true)}
                          className="mt-1 size-4 shrink-0 border-purple-200 accent-liz focus:ring-liz"
                        />
                        <span className="text-sm leading-relaxed text-slate-800">
                          Yes
                        </span>
                      </label>
                      <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-purple-100 bg-white px-4 py-3 shadow-sm transition hover:border-purple-200 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-liz/30">
                        <input
                          type="radio"
                          name="hasLawyer"
                          checked={form.hasLawyer === false}
                          onChange={() => update("hasLawyer", false)}
                          className="mt-1 size-4 shrink-0 border-purple-200 accent-liz focus:ring-liz"
                        />
                        <span className="text-sm leading-relaxed text-slate-800">
                          No
                        </span>
                      </label>
                    </div>
                  </fieldset>

                  {form.hasLawyer && (
                    <div className="space-y-6 border-t border-purple-100/90 pt-6">
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

              {step === 1 && (
                <>
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
                      value={petitionerFullName}
                      onChange={(e) => {
                        const v = e.target.value;
                        setPetitionerFullName(v);
                        setPetitioner(parseDisplayNameToPersonInfo(v));
                      }}
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
                      value={petitioner.age}
                      onChange={(e) =>
                        setPetitioner({ age: e.target.value })
                      }
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="petitionerDob"
                      className="text-sm font-medium text-slate-800"
                    >
                      Date of birth
                    </label>
                    <input
                      id="petitionerDob"
                      name="petitionerDob"
                      type="text"
                      placeholder="MM / DD / YYYY"
                      autoComplete="bday"
                      value={petitioner.dateOfBirth}
                      onChange={(e) =>
                        setPetitioner({ dateOfBirth: e.target.value })
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
                          className="flex cursor-pointer items-start gap-3 rounded-xl border border-purple-100 bg-white px-4 py-3 shadow-sm transition hover:border-purple-200 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-liz/30"
                        >
                          <input
                            type="radio"
                            name="petitionerGender"
                            value={option}
                            checked={petitioner.gender === option}
                            onChange={() =>
                              setPetitioner({ gender: option })
                            }
                            className="mt-1 size-4 shrink-0 border-purple-200 accent-liz focus:ring-liz"
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
                      htmlFor="petitionerRace"
                      className="text-sm font-medium text-slate-800"
                    >
                      Race
                    </label>
                    <input
                      id="petitionerRace"
                      name="petitionerRace"
                      type="text"
                      autoComplete="off"
                      value={petitioner.race}
                      onChange={(e) =>
                        setPetitioner({ race: e.target.value })
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
                      value={petitioner.address.street}
                      onChange={(e) =>
                        setPetitioner({
                          address: {
                            ...petitioner.address,
                            street: e.target.value,
                          },
                        })
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
                        value={petitioner.address.city}
                        onChange={(e) =>
                          setPetitioner({
                            address: {
                              ...petitioner.address,
                              city: e.target.value,
                            },
                          })
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
                          value={petitioner.address.state}
                          onChange={(e) =>
                            setPetitioner({
                              address: {
                                ...petitioner.address,
                                state: e.target.value,
                              },
                            })
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
                          value={petitioner.address.zip}
                          onChange={(e) =>
                            setPetitioner({
                              address: {
                                ...petitioner.address,
                                zip: e.target.value,
                              },
                            })
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
                      value={petitioner.telephone}
                      onChange={(e) =>
                        setPetitioner({ telephone: e.target.value })
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
                      value={petitioner.email}
                      onChange={(e) =>
                        setPetitioner({ email: e.target.value })
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

                <hr className="my-8 border-0 border-t border-purple-200/70" />

                <div className="space-y-8">
                  <div>
                    <h2 className="text-sm font-semibold text-slate-900">
                      Other Protected People
                    </h2>
                    <p className="mt-1 text-sm text-slate-600">
                      Besides yourself, does anyone else need protection from the
                      person causing harm?
                    </p>
                  </div>

                  <fieldset className="space-y-4">
                    <legend className="text-sm font-medium text-slate-800">
                      Other people who need protection
                    </legend>
                    <div className="space-y-3">
                      {(
                        [
                          { value: "no" as const, label: "No" },
                          { value: "yes" as const, label: "Yes" },
                        ] as const
                      ).map(({ value, label }) => (
                        <label
                          key={value}
                          className="flex cursor-pointer items-start gap-3 rounded-xl border border-purple-100 bg-white px-4 py-3 shadow-sm transition hover:border-purple-200 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-liz/30"
                        >
                          <input
                            type="radio"
                            name="protectOtherPeople"
                            checked={form.protectOtherPeople === value}
                            onChange={() => {
                              update("protectOtherPeople", value);
                            }}
                            className="mt-1 size-4 shrink-0 border-purple-200 accent-liz focus:ring-liz"
                          />
                          <span className="text-sm leading-relaxed text-slate-800">
                            {label}
                          </span>
                        </label>
                      ))}
                    </div>
                  </fieldset>

                  {form.protectOtherPeople === "yes" && (
                    <>
                      {form.protectedPeople.length > 4 && (
                        <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-bold text-amber-950">
                          Note: You have listed more than 4 people. An extra
                          page titled &apos;DV-100, Other Protected People&apos;
                          will automatically be created and attached to your
                          final document.
                        </p>
                      )}

                      <div className="space-y-6">
                        {form.protectedPeople.map((person, index) => (
                          <div
                            key={index}
                            className="space-y-4 rounded-xl border border-purple-100 bg-purple-50/30 px-4 py-4"
                          >
                            <p className="text-sm font-medium text-slate-800">
                              Protected person {index + 1}
                            </p>
                            <div>
                              <label
                                htmlFor={`protected-name-${index}`}
                                className="text-sm font-medium text-slate-800"
                              >
                                Full name
                              </label>
                              <input
                                id={`protected-name-${index}`}
                                type="text"
                                autoComplete="off"
                                value={person.name}
                                onChange={(e) =>
                                  setForm((prev) => ({
                                    ...prev,
                                    protectedPeople: prev.protectedPeople.map(
                                      (p, i) =>
                                        i === index
                                          ? { ...p, name: e.target.value }
                                          : p,
                                    ),
                                  }))
                                }
                                className={inputClass}
                              />
                            </div>
                            <div>
                              <label
                                htmlFor={`protected-age-${index}`}
                                className="text-sm font-medium text-slate-800"
                              >
                                Age
                              </label>
                              <input
                                id={`protected-age-${index}`}
                                type="text"
                                autoComplete="off"
                                value={person.age}
                                onChange={(e) =>
                                  setForm((prev) => ({
                                    ...prev,
                                    protectedPeople: prev.protectedPeople.map(
                                      (p, i) =>
                                        i === index
                                          ? { ...p, age: e.target.value }
                                          : p,
                                    ),
                                  }))
                                }
                                className={inputClass}
                              />
                            </div>
                            <div>
                              <label
                                htmlFor={`protected-rel-${index}`}
                                className="text-sm font-medium text-slate-800"
                              >
                                Relationship to you
                              </label>
                              <input
                                id={`protected-rel-${index}`}
                                type="text"
                                autoComplete="off"
                                value={person.relationship}
                                onChange={(e) =>
                                  setForm((prev) => ({
                                    ...prev,
                                    protectedPeople: prev.protectedPeople.map(
                                      (p, i) =>
                                        i === index
                                          ? {
                                              ...p,
                                              relationship: e.target.value,
                                            }
                                          : p,
                                    ),
                                  }))
                                }
                                className={inputClass}
                              />
                            </div>
                            <fieldset className="space-y-3">
                              <legend className="text-sm font-medium text-slate-800">
                                Lives with you
                              </legend>
                              <div className="space-y-2">
                                {(
                                  [
                                    { v: "Yes" as const, lab: "Yes" },
                                    { v: "No" as const, lab: "No" },
                                  ] as const
                                ).map(({ v, lab }) => (
                                  <label
                                    key={v}
                                    className="flex cursor-pointer items-start gap-3 rounded-lg border border-purple-100/80 bg-white px-3 py-2.5"
                                  >
                                    <input
                                      type="radio"
                                      name={`protected-lives-${index}`}
                                      checked={person.livesWithYou === v}
                                      onChange={() =>
                                        setForm((prev) => ({
                                          ...prev,
                                          protectedPeople:
                                            prev.protectedPeople.map((p, i) =>
                                              i === index
                                                ? { ...p, livesWithYou: v }
                                                : p,
                                            ),
                                        }))
                                      }
                                      className="mt-0.5 size-4 shrink-0 border-purple-200 accent-liz focus:ring-liz"
                                    />
                                    <span className="text-sm text-slate-800">
                                      {lab}
                                    </span>
                                  </label>
                                ))}
                              </div>
                            </fieldset>
                          </div>
                        ))}
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          setForm((prev) => ({
                            ...prev,
                            protectedPeople: [
                              ...prev.protectedPeople,
                              defaultProtectedPerson(),
                            ],
                          }))
                        }
                        className="inline-flex min-h-11 items-center justify-center rounded-xl border border-purple-200 bg-white px-5 py-2.5 text-sm font-medium text-purple-800 shadow-sm transition hover:bg-purple-50"
                      >
                        Add Another Person
                      </button>

                      <div>
                        <label
                          htmlFor="protectedPeopleWhy"
                          className="text-sm font-medium text-slate-800"
                        >
                          Why do these people need protection?
                        </label>
                        <p className="mt-1 text-xs text-slate-500">
                          Keep it brief. Space is limited to the box on the form.
                        </p>
                        <textarea
                          id="protectedPeopleWhy"
                          name="protectedPeopleWhy"
                          rows={5}
                          maxLength={PROTECTED_PEOPLE_WHY_MAX_LENGTH}
                          autoComplete="off"
                          value={form.protectedPeopleWhy}
                          onChange={(e) =>
                            update("protectedPeopleWhy", e.target.value)
                          }
                          className={textareaClass}
                          aria-describedby="protectedPeopleWhy-counter"
                        />
                        <p
                          id="protectedPeopleWhy-counter"
                          className="mt-1.5 text-xs tabular-nums text-slate-500"
                        >
                          {form.protectedPeopleWhy.length}/
                          {PROTECTED_PEOPLE_WHY_MAX_LENGTH} characters
                        </p>
                      </div>
                    </>
                  )}

                </div>
                </>
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
                      value={respondentFullName}
                      onChange={(e) => {
                        const v = e.target.value;
                        setRespondentFullName(v);
                        setRespondent(parseDisplayNameToPersonInfo(v));
                      }}
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
                      value={respondent.age}
                      onChange={(e) =>
                        setRespondent({ age: e.target.value })
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
                      value={respondent.dateOfBirth}
                      onChange={(e) =>
                        setRespondent({ dateOfBirth: e.target.value })
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
                          className="flex cursor-pointer items-start gap-3 rounded-xl border border-purple-100 bg-white px-4 py-3 shadow-sm transition hover:border-purple-200 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-liz/30"
                        >
                          <input
                            type="radio"
                            name="respondentGender"
                            value={option}
                            checked={respondent.gender === option}
                            onChange={() =>
                              setRespondent({ gender: option })
                            }
                            className="mt-1 size-4 shrink-0 border-purple-200 accent-liz focus:ring-liz"
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
                      value={respondent.race}
                      onChange={(e) =>
                        setRespondent({ race: e.target.value })
                      }
                      className={inputClass}
                    />
                  </div>
                </div>
              )}

              {step === 3 && (
                <div className="space-y-6">
                  <fieldset className="space-y-4">
                    <legend className="text-sm font-medium text-slate-800">
                      Check all that apply
                    </legend>
                    <div className="space-y-3">
                      {RELATIONSHIP_OPTIONS.map(({ value, label }) => (
                        <label
                          key={value}
                          className="flex cursor-pointer items-start gap-3 rounded-xl border border-purple-100 bg-white px-4 py-3 shadow-sm transition hover:border-purple-200 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-liz/30"
                        >
                          <input
                            type="checkbox"
                            checked={form.relationshipChecks.includes(value)}
                            onChange={() => {
                              const next = toggleInList(
                                form.relationshipChecks,
                                value,
                              );
                              update("relationshipChecks", next);
                              if (!next.includes("children")) {
                                update("childrenNames", "");
                              }
                              if (!next.includes("related")) {
                                update("relatedTypes", []);
                              }
                              if (!next.includes("liveTogether")) {
                                update("livedTogether", "");
                              }
                            }}
                            className="mt-1 size-4 shrink-0 rounded border-purple-200 accent-liz focus:ring-liz"
                          />
                          <span className="text-sm leading-relaxed text-slate-800">
                            {label}
                          </span>
                        </label>
                      ))}
                    </div>
                  </fieldset>

                  {form.relationshipChecks.includes("children") && (
                    <div>
                      <label
                        htmlFor="childrenNames"
                        className="text-sm font-medium text-slate-800"
                      >
                        Names of children
                      </label>
                      <input
                        id="childrenNames"
                        name="childrenNames"
                        type="text"
                        autoComplete="off"
                        value={form.childrenNames}
                        onChange={(e) =>
                          update("childrenNames", e.target.value)
                        }
                        className={inputClass}
                      />
                    </div>
                  )}

                  {form.relationshipChecks.includes("related") && (
                    <fieldset className="space-y-4 border-t border-purple-100/90 pt-6">
                      <legend className="text-sm font-medium text-slate-800">
                        The person in 2 is my (check all that apply)
                      </legend>
                      <div className="space-y-3">
                        {RELATED_TYPE_OPTIONS.map(({ value, label }) => (
                          <label
                            key={value}
                            className="flex cursor-pointer items-start gap-3 rounded-xl border border-purple-100 bg-white px-4 py-3 shadow-sm transition hover:border-purple-200 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-liz/30"
                          >
                            <input
                              type="checkbox"
                              checked={form.relatedTypes.includes(value)}
                              onChange={() =>
                                update(
                                  "relatedTypes",
                                  toggleInList(form.relatedTypes, value),
                                )
                              }
                              className="mt-1 size-4 shrink-0 rounded border-purple-200 accent-liz focus:ring-liz"
                            />
                            <span className="text-sm leading-relaxed text-slate-800">
                              {label}
                            </span>
                          </label>
                        ))}
                      </div>
                    </fieldset>
                  )}

                  {form.relationshipChecks.includes("liveTogether") && (
                    <fieldset className="space-y-4 border-t border-purple-100/90 pt-6">
                      <legend className="text-sm font-medium text-slate-800">
                        Have you lived together with the person in 2?
                      </legend>
                      <div className="space-y-3">
                        <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-purple-100 bg-white px-4 py-3 shadow-sm transition hover:border-purple-200 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-liz/30">
                          <input
                            type="radio"
                            name="livedTogether"
                            checked={form.livedTogether === "yes"}
                            onChange={() => update("livedTogether", "yes")}
                            className="mt-1 size-4 shrink-0 border-purple-200 accent-liz focus:ring-liz"
                          />
                          <span className="text-sm leading-relaxed text-slate-800">
                            Yes
                          </span>
                        </label>
                        <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-purple-100 bg-white px-4 py-3 shadow-sm transition hover:border-purple-200 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-liz/30">
                          <input
                            type="radio"
                            name="livedTogether"
                            checked={form.livedTogether === "no"}
                            onChange={() => update("livedTogether", "no")}
                            className="mt-1 size-4 shrink-0 border-purple-200 accent-liz focus:ring-liz"
                          />
                          <span className="text-sm leading-relaxed text-slate-800">
                            No
                          </span>
                        </label>
                      </div>
                    </fieldset>
                  )}
                </div>
              )}

              {step === 4 && (
                <div className="space-y-8">
                  <section className="space-y-6">
                    <h2 className="text-sm font-semibold text-slate-900">
                      Other restraining or protective orders
                    </h2>
                    <fieldset className="space-y-4">
                      <legend className="text-sm font-medium text-slate-800">
                        Do you have any other restraining/protective orders
                        currently in effect?
                      </legend>
                      <div className="space-y-3">
                        <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-purple-100 bg-white px-4 py-3 shadow-sm transition hover:border-purple-200 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-liz/30">
                          <input
                            type="radio"
                            name="hasRestrainingOrders"
                            checked={form.hasRestrainingOrders === "yes"}
                            onChange={() =>
                              update("hasRestrainingOrders", "yes")
                            }
                            className="mt-1 size-4 shrink-0 border-purple-200 accent-liz focus:ring-liz"
                          />
                          <span className="text-sm leading-relaxed text-slate-800">
                            Yes
                          </span>
                        </label>
                        <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-purple-100 bg-white px-4 py-3 shadow-sm transition hover:border-purple-200 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-liz/30">
                          <input
                            type="radio"
                            name="hasRestrainingOrders"
                            checked={form.hasRestrainingOrders === "no"}
                            onChange={() =>
                              update("hasRestrainingOrders", "no")
                            }
                            className="mt-1 size-4 shrink-0 border-purple-200 accent-liz focus:ring-liz"
                          />
                          <span className="text-sm leading-relaxed text-slate-800">
                            No
                          </span>
                        </label>
                      </div>
                    </fieldset>
                    {form.hasRestrainingOrders === "yes" && (
                      <div className="space-y-6 border-t border-purple-100/90 pt-6">
                        <p className="text-sm text-slate-600">
                          For each order, enter the date of the order and when it
                          expires.
                        </p>
                        <div className="grid gap-6 sm:grid-cols-2">
                          <div>
                            <label
                              htmlFor="order1Date"
                              className="text-sm font-medium text-slate-800"
                            >
                              Order 1 — date of order
                            </label>
                            <input
                              id="order1Date"
                              name="order1Date"
                              type="text"
                              autoComplete="off"
                              value={form.order1Date}
                              onChange={(e) =>
                                update("order1Date", e.target.value)
                              }
                              className={inputClass}
                            />
                          </div>
                          <div>
                            <label
                              htmlFor="order1Expires"
                              className="text-sm font-medium text-slate-800"
                            >
                              Order 1 — date it expires
                            </label>
                            <input
                              id="order1Expires"
                              name="order1Expires"
                              type="text"
                              autoComplete="off"
                              value={form.order1Expires}
                              onChange={(e) =>
                                update("order1Expires", e.target.value)
                              }
                              className={inputClass}
                            />
                          </div>
                        </div>
                        <div className="grid gap-6 sm:grid-cols-2">
                          <div>
                            <label
                              htmlFor="order2Date"
                              className="text-sm font-medium text-slate-800"
                            >
                              Order 2 — date of order
                            </label>
                            <input
                              id="order2Date"
                              name="order2Date"
                              type="text"
                              autoComplete="off"
                              value={form.order2Date}
                              onChange={(e) =>
                                update("order2Date", e.target.value)
                              }
                              className={inputClass}
                            />
                          </div>
                          <div>
                            <label
                              htmlFor="order2Expires"
                              className="text-sm font-medium text-slate-800"
                            >
                              Order 2 — date it expires
                            </label>
                            <input
                              id="order2Expires"
                              name="order2Expires"
                              type="text"
                              autoComplete="off"
                              value={form.order2Expires}
                              onChange={(e) =>
                                update("order2Expires", e.target.value)
                              }
                              className={inputClass}
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </section>

                  <section className="space-y-6 border-t border-purple-100/90 pt-8">
                    <h2 className="text-sm font-semibold text-slate-900">
                      Other court cases
                    </h2>
                    <fieldset className="space-y-4">
                      <legend className="text-sm font-medium text-slate-800">
                        Has any other court case involving you and this person
                        been filed?
                      </legend>
                      <div className="space-y-3">
                        <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-purple-100 bg-white px-4 py-3 shadow-sm transition hover:border-purple-200 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-liz/30">
                          <input
                            type="radio"
                            name="hasOtherCases"
                            checked={form.hasOtherCases === "yes"}
                            onChange={() => update("hasOtherCases", "yes")}
                            className="mt-1 size-4 shrink-0 border-purple-200 accent-liz focus:ring-liz"
                          />
                          <span className="text-sm leading-relaxed text-slate-800">
                            Yes
                          </span>
                        </label>
                        <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-purple-100 bg-white px-4 py-3 shadow-sm transition hover:border-purple-200 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-liz/30">
                          <input
                            type="radio"
                            name="hasOtherCases"
                            checked={form.hasOtherCases === "no"}
                            onChange={() => update("hasOtherCases", "no")}
                            className="mt-1 size-4 shrink-0 border-purple-200 accent-liz focus:ring-liz"
                          />
                          <span className="text-sm leading-relaxed text-slate-800">
                            No
                          </span>
                        </label>
                      </div>
                    </fieldset>

                    {form.hasOtherCases === "yes" && (
                      <div className="space-y-6 border-t border-purple-100/90 pt-6">
                        <fieldset className="space-y-4">
                          <legend className="text-sm font-medium text-slate-800">
                            Type of case (check all that apply)
                          </legend>
                          <div className="space-y-3">
                            {CASE_TYPE_OPTIONS.map(({ value, label }) => {
                              const checked = form.caseTypes.includes(value);
                              const detailKey = CASE_TYPE_DETAIL_KEY[value];
                              return (
                                <div
                                  key={value}
                                  className="rounded-xl border border-purple-100 bg-white px-4 py-3 shadow-sm"
                                >
                                  <label className="flex cursor-pointer items-start gap-3 transition hover:border-purple-200 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-liz/30">
                                    <input
                                      type="checkbox"
                                      checked={checked}
                                      onChange={() => {
                                        setForm((prev) => {
                                          const wasIncluded =
                                            prev.caseTypes.includes(value);
                                          const nextTypes = toggleInList(
                                            prev.caseTypes,
                                            value,
                                          );
                                          const next: FormData = {
                                            ...prev,
                                            caseTypes: nextTypes,
                                          };
                                          if (
                                            wasIncluded &&
                                            !nextTypes.includes(value)
                                          ) {
                                            const dk = CASE_TYPE_DETAIL_KEY[value];
                                            if (dk) next[dk] = "";
                                            if (value === "other") {
                                              next.otherCaseType = "";
                                            }
                                          }
                                          return next;
                                        });
                                      }}
                                      className="mt-1 size-4 shrink-0 rounded border-purple-200 accent-liz focus:ring-liz"
                                    />
                                    <span className="text-sm leading-relaxed text-slate-800">
                                      {label}
                                    </span>
                                  </label>
                                  {checked && detailKey && (
                                    <div className="mt-3 border-t border-purple-100/90 pt-3 pl-7">
                                      <label
                                        htmlFor={detailKey}
                                        className="text-sm font-medium text-slate-800"
                                      >
                                        Case details (city, state, year, case
                                        number)
                                      </label>
                                      <input
                                        id={detailKey}
                                        name={detailKey}
                                        type="text"
                                        autoComplete="off"
                                        value={form[detailKey]}
                                        onChange={(e) =>
                                          update(detailKey, e.target.value)
                                        }
                                        className={`${inputClass} mt-1.5`}
                                      />
                                    </div>
                                  )}
                                  {checked && value === "other" && (
                                    <div className="mt-3 border-t border-purple-100/90 pt-3 pl-7">
                                      <label
                                        htmlFor="otherCaseType"
                                        className="text-sm font-medium text-slate-800"
                                      >
                                        What kind of case?
                                      </label>
                                      <input
                                        id="otherCaseType"
                                        name="otherCaseType"
                                        type="text"
                                        autoComplete="off"
                                        value={form.otherCaseType}
                                        onChange={(e) =>
                                          update(
                                            "otherCaseType",
                                            e.target.value,
                                          )
                                        }
                                        className={`${inputClass} mt-1.5`}
                                      />
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </fieldset>
                      </div>
                    )}
                  </section>
                </div>
              )}

              {step === 5 && (
                <div className="space-y-8">
                  <div
                    className="flex gap-3 rounded-xl border-2 border-liz bg-liz/10 px-4 py-4 shadow-sm sm:px-5"
                    role="status"
                  >
                    <span
                      className="mt-0.5 inline-flex size-9 shrink-0 items-center justify-center rounded-full bg-liz text-sm font-bold text-white"
                      aria-hidden
                    >
                      i
                    </span>
                    <p className="text-sm font-medium leading-relaxed text-purple-950">
                      <span className="font-semibold">Tip:</span> Start with the
                      most recent incident. You can describe up to three separate
                      incidents on the official form—only the first is shown
                      here until you choose to add another.
                    </p>
                  </div>
                  <div>
                    <h2 className="text-sm font-semibold text-slate-900">
                      Section 5. Most recent abuse
                    </h2>
                    <p className="mt-1 text-sm text-slate-600">
                      Answer about the most recent incident. You may estimate
                      dates if you are unsure.
                    </p>
                  </div>

                  <div>
                    <label
                      htmlFor="recentAbuseDate"
                      className="text-sm font-medium text-slate-800"
                    >
                      5a. Date of abuse
                    </label>
                    <p className="mt-1 text-xs text-slate-500">
                      Give your best estimate if you do not know the exact date.
                    </p>
                    <input
                      id="recentAbuseDate"
                      name="recentAbuseDate"
                      type="text"
                      autoComplete="off"
                      value={form.recentAbuseDate}
                      onChange={(e) =>
                        update("recentAbuseDate", e.target.value)
                      }
                      className={inputClass}
                    />
                  </div>

                  <fieldset className="space-y-4">
                    <legend className="text-sm font-medium text-slate-800">
                      5b. Did anyone else hear or see what happened on this day?
                    </legend>
                    <div className="space-y-3">
                      {(
                        [
                          { value: "idk", label: "I don't know" },
                          { value: "no", label: "No" },
                          { value: "yes", label: "Yes" },
                        ] as const
                      ).map(({ value, label }) => (
                        <label
                          key={value}
                          className="flex cursor-pointer items-start gap-3 rounded-xl border border-purple-100 bg-white px-4 py-3 shadow-sm transition hover:border-purple-200 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-liz/30"
                        >
                          <input
                            type="radio"
                            name="recentAbuseWitnesses"
                            checked={form.recentAbuseWitnesses === value}
                            onChange={() => {
                              update("recentAbuseWitnesses", value);
                              if (value !== "yes") {
                                update("recentAbuseWitnessDetail", "");
                              }
                            }}
                            className="mt-1 size-4 shrink-0 border-purple-200 accent-liz focus:ring-liz"
                          />
                          <span className="text-sm leading-relaxed text-slate-800">
                            {label}
                          </span>
                        </label>
                      ))}
                    </div>
                  </fieldset>

                  {form.recentAbuseWitnesses === "yes" && (
                    <div>
                      <label
                        htmlFor="recentAbuseWitnessDetail"
                        className="text-sm font-medium text-slate-800"
                      >
                        Give names or describe who heard or saw what happened
                      </label>
                      <input
                        id="recentAbuseWitnessDetail"
                        name="recentAbuseWitnessDetail"
                        type="text"
                        autoComplete="off"
                        value={form.recentAbuseWitnessDetail}
                        onChange={(e) =>
                          update("recentAbuseWitnessDetail", e.target.value)
                        }
                        className={inputClass}
                      />
                    </div>
                  )}

                  <fieldset className="space-y-4">
                    <legend className="text-sm font-medium text-slate-800">
                      5c. Did the person use or threaten to use a gun or other
                      weapon?
                    </legend>
                    <div className="space-y-3">
                      <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-purple-100 bg-white px-4 py-3 shadow-sm transition hover:border-purple-200 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-liz/30">
                        <input
                          type="radio"
                          name="recentAbuseWeapon"
                          checked={form.recentAbuseWeapon === "no"}
                          onChange={() => {
                            update("recentAbuseWeapon", "no");
                            update("recentAbuseWeaponDetail", "");
                          }}
                          className="mt-1 size-4 shrink-0 border-purple-200 accent-liz focus:ring-liz"
                        />
                        <span className="text-sm leading-relaxed text-slate-800">
                          No
                        </span>
                      </label>
                      <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-purple-100 bg-white px-4 py-3 shadow-sm transition hover:border-purple-200 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-liz/30">
                        <input
                          type="radio"
                          name="recentAbuseWeapon"
                          checked={form.recentAbuseWeapon === "yes"}
                          onChange={() => update("recentAbuseWeapon", "yes")}
                          className="mt-1 size-4 shrink-0 border-purple-200 accent-liz focus:ring-liz"
                        />
                        <span className="text-sm leading-relaxed text-slate-800">
                          Yes
                        </span>
                      </label>
                    </div>
                  </fieldset>

                  {form.recentAbuseWeapon === "yes" && (
                    <div>
                      <label
                        htmlFor="recentAbuseWeaponDetail"
                        className="text-sm font-medium text-slate-800"
                      >
                        Describe the weapon
                      </label>
                      <input
                        id="recentAbuseWeaponDetail"
                        name="recentAbuseWeaponDetail"
                        type="text"
                        autoComplete="off"
                        value={form.recentAbuseWeaponDetail}
                        onChange={(e) =>
                          update("recentAbuseWeaponDetail", e.target.value)
                        }
                        className={inputClass}
                      />
                    </div>
                  )}

                  <fieldset className="space-y-4">
                    <legend className="text-sm font-medium text-slate-800">
                      5d. Did the person cause you emotional or physical harm?
                    </legend>
                    <div className="space-y-3">
                      <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-purple-100 bg-white px-4 py-3 shadow-sm transition hover:border-purple-200 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-liz/30">
                        <input
                          type="radio"
                          name="recentAbuseHarm"
                          checked={form.recentAbuseHarm === "no"}
                          onChange={() => {
                            update("recentAbuseHarm", "no");
                            update("recentAbuseHarmDetail", "");
                          }}
                          className="mt-1 size-4 shrink-0 border-purple-200 accent-liz focus:ring-liz"
                        />
                        <span className="text-sm leading-relaxed text-slate-800">
                          No
                        </span>
                      </label>
                      <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-purple-100 bg-white px-4 py-3 shadow-sm transition hover:border-purple-200 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-liz/30">
                        <input
                          type="radio"
                          name="recentAbuseHarm"
                          checked={form.recentAbuseHarm === "yes"}
                          onChange={() => update("recentAbuseHarm", "yes")}
                          className="mt-1 size-4 shrink-0 border-purple-200 accent-liz focus:ring-liz"
                        />
                        <span className="text-sm leading-relaxed text-slate-800">
                          Yes
                        </span>
                      </label>
                    </div>
                  </fieldset>

                  {form.recentAbuseHarm === "yes" && (
                    <div>
                      <label
                        htmlFor="recentAbuseHarmDetail"
                        className="text-sm font-medium text-slate-800"
                      >
                        Describe the harm
                      </label>
                      <p className="mt-1 text-xs text-slate-500">
                        Keep it brief. Space is limited to one line on the
                        official form.
                      </p>
                      <input
                        id="recentAbuseHarmDetail"
                        name="recentAbuseHarmDetail"
                        type="text"
                        autoComplete="off"
                        maxLength={HARM_DETAIL_MAX_LENGTH}
                        value={form.recentAbuseHarmDetail}
                        onChange={(e) =>
                          update("recentAbuseHarmDetail", e.target.value)
                        }
                        className={inputClass}
                        aria-describedby="recentAbuseHarmDetail-counter"
                      />
                      <p
                        id="recentAbuseHarmDetail-counter"
                        className="mt-1.5 text-xs tabular-nums text-slate-500"
                      >
                        {form.recentAbuseHarmDetail.length}/
                        {HARM_DETAIL_MAX_LENGTH} characters used
                      </p>
                    </div>
                  )}

                  <fieldset className="space-y-4">
                    <legend className="text-sm font-medium text-slate-800">
                      5e. Did the police come?
                    </legend>
                    <div className="space-y-3">
                      {(
                        [
                          { value: "idk", label: "I don't know" },
                          { value: "no", label: "No" },
                          { value: "yes", label: "Yes" },
                        ] as const
                      ).map(({ value, label }) => (
                        <label
                          key={value}
                          className="flex cursor-pointer items-start gap-3 rounded-xl border border-purple-100 bg-white px-4 py-3 shadow-sm transition hover:border-purple-200 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-liz/30"
                        >
                          <input
                            type="radio"
                            name="recentAbusePolice"
                            checked={form.recentAbusePolice === value}
                            onChange={() => update("recentAbusePolice", value)}
                            className="mt-1 size-4 shrink-0 border-purple-200 accent-liz focus:ring-liz"
                          />
                          <span className="text-sm leading-relaxed text-slate-800">
                            {label}
                          </span>
                        </label>
                      ))}
                    </div>
                    <p className="text-xs text-slate-500">
                      If the police gave you a restraining order, list it in
                      Section 4 of the form.
                    </p>
                  </fieldset>

                  <div
                    className="rounded-xl border border-purple-200/90 bg-purple-50/90 px-4 py-4 sm:px-5"
                    role="note"
                  >
                    <p className="text-sm font-bold leading-snug text-slate-900">
                      Listed below are some examples of what &quot;abuse&quot;
                      means under the law. Give information on any incident that
                      you believe was abusive.
                    </p>
                    <div className="mt-4 grid gap-4 sm:grid-cols-2 sm:gap-6">
                      {abuseExampleColumns.map((col, colIdx) => (
                        <ul
                          key={colIdx}
                          className="list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-slate-700"
                        >
                          {col.map((item) => (
                            <li key={item}>{item}</li>
                          ))}
                        </ul>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="recentAbuseDetails"
                      className="text-sm font-medium text-slate-800"
                    >
                      5f. Details of abuse
                    </label>
                    <p className="mt-2 text-sm font-bold leading-snug text-slate-800">
                      Note: You have plenty of space. Your response will be
                      automatically printed on a full-page addendum
                      (Attachment 5f) at the end of the form.
                    </p>
                    <textarea
                      id="recentAbuseDetails"
                      name="recentAbuseDetails"
                      rows={14}
                      autoComplete="off"
                      value={form.recentAbuseDetails}
                      onChange={(e) =>
                        update("recentAbuseDetails", e.target.value)
                      }
                      className={`${inputClass} mt-3 min-h-[20rem] resize-y`}
                    />
                  </div>

                  <fieldset className="space-y-4">
                    <legend className="text-sm font-medium text-slate-800">
                      5g. How often has the person abused you like this?
                    </legend>
                    <div className="space-y-3">
                      {(
                        [
                          { value: "once", label: "Just this once" },
                          { value: "2-5", label: "2–5 times" },
                          { value: "weekly", label: "Weekly" },
                          { value: "other", label: "Other" },
                        ] as const
                      ).map(({ value, label }) => (
                        <label
                          key={value}
                          className="flex cursor-pointer items-start gap-3 rounded-xl border border-purple-100 bg-white px-4 py-3 shadow-sm transition hover:border-purple-200 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-liz/30"
                        >
                          <input
                            type="radio"
                            name="recentAbuseFrequency"
                            checked={form.recentAbuseFrequency === value}
                            onChange={() => {
                              update("recentAbuseFrequency", value);
                              if (value !== "other") {
                                update("recentAbuseFrequencyOther", "");
                              }
                              if (value === "once") {
                                update("recentAbuseDates", "");
                              }
                            }}
                            className="mt-1 size-4 shrink-0 border-purple-200 accent-liz focus:ring-liz"
                          />
                          <span className="text-sm leading-relaxed text-slate-800">
                            {label}
                          </span>
                        </label>
                      ))}
                    </div>
                  </fieldset>

                  {form.recentAbuseFrequency === "other" && (
                    <div>
                      <label
                        htmlFor="recentAbuseFrequencyOther"
                        className="text-sm font-medium text-slate-800"
                      >
                        Describe how often (other)
                      </label>
                      <input
                        id="recentAbuseFrequencyOther"
                        name="recentAbuseFrequencyOther"
                        type="text"
                        autoComplete="off"
                        value={form.recentAbuseFrequencyOther}
                        onChange={(e) =>
                          update("recentAbuseFrequencyOther", e.target.value)
                        }
                        className={inputClass}
                      />
                    </div>
                  )}

                  {form.recentAbuseFrequency !== "" &&
                    form.recentAbuseFrequency !== "once" && (
                      <div>
                        <label
                          htmlFor="recentAbuseDates"
                          className="text-sm font-medium text-slate-800"
                        >
                          5g. Dates when it happened
                        </label>
                        <textarea
                          id="recentAbuseDates"
                          name="recentAbuseDates"
                          rows={3}
                          autoComplete="off"
                          value={form.recentAbuseDates}
                          onChange={(e) =>
                            update("recentAbuseDates", e.target.value)
                          }
                          className={textareaClass}
                        />
                      </div>
                    )}
                  <div className="border-t border-purple-100/90 pt-8">
                    {!showAbuseIncident2 && (
                      <button
                        type="button"
                        onClick={() => setShowAbuseIncident2(true)}
                        className="inline-flex min-h-11 w-full items-center justify-center rounded-xl border border-dashed border-purple-300 bg-white px-5 py-3 text-sm font-medium text-purple-900 shadow-sm transition hover:bg-purple-50"
                      >
                        + Add another incident (optional)
                      </button>
                    )}
                  </div>

                  {showAbuseIncident2 && (
                    <div className="space-y-8 border-t border-purple-100/90 pt-8">
                      <p className="text-sm leading-relaxed text-slate-600">
                        Optional: describe a <span className="font-medium">different</span> incident from Section 5 (DV-100 Section 6).
                      </p>
                      <div>
                        <h2 className="text-sm font-semibold text-slate-900">
                          Section 6. Second incident of abuse
                        </h2>
                        <p className="mt-1 text-sm text-slate-600">
                          Answer about a different incident from Section 5. You may
                          estimate dates if you are unsure.
                        </p>
                      </div>
                      <div>
                        <label
                          htmlFor="secondAbuseDate"
                          className="text-sm font-medium text-slate-800"
                        >
                          6a. Date of abuse
                        </label>
                        <p className="mt-1 text-xs text-slate-500">
                          Give your best estimate if you do not know the exact date.
                        </p>
                        <input
                          id="secondAbuseDate"
                          name="secondAbuseDate"
                          type="text"
                          autoComplete="off"
                          value={form.secondAbuseDate}
                          onChange={(e) =>
                            update("secondAbuseDate", e.target.value)
                          }
                          className={inputClass}
                        />
                      </div>
                      <fieldset className="space-y-4">
                        <legend className="text-sm font-medium text-slate-800">
                          6b. Did anyone else hear or see what happened on this
                          day?
                        </legend>
                        <div className="space-y-3">
                          {(
                            [
                              { value: "idk", label: "I don't know" },
                              { value: "no", label: "No" },
                              { value: "yes", label: "Yes" },
                            ] as const
                          ).map(({ value, label }) => (
                            <label
                              key={value}
                              className="flex cursor-pointer items-start gap-3 rounded-xl border border-purple-100 bg-white px-4 py-3 shadow-sm transition hover:border-purple-200 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-liz/30"
                            >
                              <input
                                type="radio"
                                name="secondAbuseWitnesses"
                                checked={form.secondAbuseWitnesses === value}
                                onChange={() => {
                                  update("secondAbuseWitnesses", value);
                                  if (value !== "yes") {
                                    update("secondAbuseWitnessDetail", "");
                                  }
                                }}
                                className="mt-1 size-4 shrink-0 border-purple-200 accent-liz focus:ring-liz"
                              />
                              <span className="text-sm leading-relaxed text-slate-800">
                                {label}
                              </span>
                            </label>
                          ))}
                        </div>
                      </fieldset>
                      {form.secondAbuseWitnesses === "yes" && (
                        <div>
                          <label
                            htmlFor="secondAbuseWitnessDetail"
                            className="text-sm font-medium text-slate-800"
                          >
                            Give names or describe who heard or saw what happened
                          </label>
                          <input
                            id="secondAbuseWitnessDetail"
                            name="secondAbuseWitnessDetail"
                            type="text"
                            autoComplete="off"
                            value={form.secondAbuseWitnessDetail}
                            onChange={(e) =>
                              update("secondAbuseWitnessDetail", e.target.value)
                            }
                            className={inputClass}
                          />
                        </div>
                      )}
                      <fieldset className="space-y-4">
                        <legend className="text-sm font-medium text-slate-800">
                          6c. Did the person use or threaten to use a gun or other
                          weapon?
                        </legend>
                        <div className="space-y-3">
                          <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-purple-100 bg-white px-4 py-3 shadow-sm transition hover:border-purple-200 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-liz/30">
                            <input
                              type="radio"
                              name="secondAbuseWeapon"
                              checked={form.secondAbuseWeapon === "no"}
                              onChange={() => {
                                update("secondAbuseWeapon", "no");
                                update("secondAbuseWeaponDetail", "");
                              }}
                              className="mt-1 size-4 shrink-0 border-purple-200 accent-liz focus:ring-liz"
                            />
                            <span className="text-sm leading-relaxed text-slate-800">
                              No
                            </span>
                          </label>
                          <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-purple-100 bg-white px-4 py-3 shadow-sm transition hover:border-purple-200 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-liz/30">
                            <input
                              type="radio"
                              name="secondAbuseWeapon"
                              checked={form.secondAbuseWeapon === "yes"}
                              onChange={() => update("secondAbuseWeapon", "yes")}
                              className="mt-1 size-4 shrink-0 border-purple-200 accent-liz focus:ring-liz"
                            />
                            <span className="text-sm leading-relaxed text-slate-800">
                              Yes
                            </span>
                          </label>
                        </div>
                      </fieldset>
                      {form.secondAbuseWeapon === "yes" && (
                        <div>
                          <label
                            htmlFor="secondAbuseWeaponDetail"
                            className="text-sm font-medium text-slate-800"
                          >
                            Describe the gun or weapon
                          </label>
                          <input
                            id="secondAbuseWeaponDetail"
                            name="secondAbuseWeaponDetail"
                            type="text"
                            autoComplete="off"
                            value={form.secondAbuseWeaponDetail}
                            onChange={(e) =>
                              update("secondAbuseWeaponDetail", e.target.value)
                            }
                            className={inputClass}
                          />
                        </div>
                      )}
                      <fieldset className="space-y-4">
                        <legend className="text-sm font-medium text-slate-800">
                          6d. Did the person cause you emotional or physical harm?
                        </legend>
                        <div className="space-y-3">
                          <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-purple-100 bg-white px-4 py-3 shadow-sm transition hover:border-purple-200 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-liz/30">
                            <input
                              type="radio"
                              name="secondAbuseHarm"
                              checked={form.secondAbuseHarm === "no"}
                              onChange={() => {
                                update("secondAbuseHarm", "no");
                                update("secondAbuseHarmDetail", "");
                              }}
                              className="mt-1 size-4 shrink-0 border-purple-200 accent-liz focus:ring-liz"
                            />
                            <span className="text-sm leading-relaxed text-slate-800">
                              No
                            </span>
                          </label>
                          <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-purple-100 bg-white px-4 py-3 shadow-sm transition hover:border-purple-200 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-liz/30">
                            <input
                              type="radio"
                              name="secondAbuseHarm"
                              checked={form.secondAbuseHarm === "yes"}
                              onChange={() => update("secondAbuseHarm", "yes")}
                              className="mt-1 size-4 shrink-0 border-purple-200 accent-liz focus:ring-liz"
                            />
                            <span className="text-sm leading-relaxed text-slate-800">
                              Yes
                            </span>
                          </label>
                        </div>
                      </fieldset>
                      {form.secondAbuseHarm === "yes" && (
                        <div>
                          <label
                            htmlFor="secondAbuseHarmDetail"
                            className="text-sm font-medium text-slate-800"
                          >
                            Describe the harm
                          </label>
                          <p className="mt-1 text-xs text-slate-500">
                            Keep it brief. Space is limited to one line on the
                            official form.
                          </p>
                          <input
                            id="secondAbuseHarmDetail"
                            name="secondAbuseHarmDetail"
                            type="text"
                            autoComplete="off"
                            maxLength={HARM_DETAIL_MAX_LENGTH}
                            value={form.secondAbuseHarmDetail}
                            onChange={(e) =>
                              update("secondAbuseHarmDetail", e.target.value)
                            }
                            className={inputClass}
                            aria-describedby="secondAbuseHarmDetail-counter"
                          />
                          <p
                            id="secondAbuseHarmDetail-counter"
                            className="mt-1.5 text-xs tabular-nums text-slate-500"
                          >
                            {form.secondAbuseHarmDetail.length}/
                            {HARM_DETAIL_MAX_LENGTH} characters
                          </p>
                        </div>
                      )}
                      <fieldset className="space-y-4">
                        <legend className="text-sm font-medium text-slate-800">
                          6e. Did the police come?
                        </legend>
                        <div className="space-y-3">
                          {(
                            [
                              { value: "idk", label: "I don't know" },
                              { value: "no", label: "No" },
                              { value: "yes", label: "Yes" },
                            ] as const
                          ).map(({ value, label }) => (
                            <label
                              key={value}
                              className="flex cursor-pointer items-start gap-3 rounded-xl border border-purple-100 bg-white px-4 py-3 shadow-sm transition hover:border-purple-200 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-liz/30"
                            >
                              <input
                                type="radio"
                                name="secondAbusePolice"
                                checked={form.secondAbusePolice === value}
                                onChange={() =>
                                  update("secondAbusePolice", value)
                                }
                                className="mt-1 size-4 shrink-0 border-purple-200 accent-liz focus:ring-liz"
                              />
                              <span className="text-sm leading-relaxed text-slate-800">
                                {label}
                              </span>
                            </label>
                          ))}
                        </div>
                        <p className="text-xs text-slate-500">
                          If the police gave you a restraining order, list it in
                          Section 4 of the form.
                        </p>
                      </fieldset>
                      <div>
                        <label
                          htmlFor="secondAbuseDetails"
                          className="text-sm font-medium text-slate-800"
                        >
                          6f. Details of abuse
                        </label>
                        <p className="mt-2 text-sm font-bold leading-snug text-slate-800">
                          Note: You have plenty of space. Your response will be
                          automatically printed on a full-page addendum (Attachment
                          6f) at the end of the form.
                        </p>
                        <textarea
                          id="secondAbuseDetails"
                          name="secondAbuseDetails"
                          rows={15}
                          autoComplete="off"
                          value={form.secondAbuseDetails}
                          onChange={(e) =>
                            update("secondAbuseDetails", e.target.value)
                          }
                          className={`${inputClass} mt-3 min-h-[20rem] resize-y`}
                        />
                      </div>
                      <fieldset className="space-y-4">
                        <legend className="text-sm font-medium text-slate-800">
                          6g. How often has the person abused you like this?
                        </legend>
                        <div className="space-y-3">
                          {(
                            [
                              { value: "once", label: "Just this once" },
                              { value: "2-5", label: "2–5 times" },
                              { value: "weekly", label: "Weekly" },
                              { value: "other", label: "Other" },
                            ] as const
                          ).map(({ value, label }) => (
                            <label
                              key={value}
                              className="flex cursor-pointer items-start gap-3 rounded-xl border border-purple-100 bg-white px-4 py-3 shadow-sm transition hover:border-purple-200 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-liz/30"
                            >
                              <input
                                type="radio"
                                name="secondAbuseFrequency"
                                checked={form.secondAbuseFrequency === value}
                                onChange={() => {
                                  update("secondAbuseFrequency", value);
                                  if (value !== "other") {
                                    update("secondAbuseFrequencyOther", "");
                                  }
                                  if (value === "once") {
                                    update("secondAbuseDates", "");
                                  }
                                }}
                                className="mt-1 size-4 shrink-0 border-purple-200 accent-liz focus:ring-liz"
                              />
                              <span className="text-sm leading-relaxed text-slate-800">
                                {label}
                              </span>
                            </label>
                          ))}
                        </div>
                      </fieldset>
                      {form.secondAbuseFrequency === "other" && (
                        <div>
                          <label
                            htmlFor="secondAbuseFrequencyOther"
                            className="text-sm font-medium text-slate-800"
                          >
                            Describe how often (other)
                          </label>
                          <input
                            id="secondAbuseFrequencyOther"
                            name="secondAbuseFrequencyOther"
                            type="text"
                            autoComplete="off"
                            value={form.secondAbuseFrequencyOther}
                            onChange={(e) =>
                              update("secondAbuseFrequencyOther", e.target.value)
                            }
                            className={inputClass}
                          />
                        </div>
                      )}
                      {form.secondAbuseFrequency !== "" &&
                        form.secondAbuseFrequency !== "once" && (
                          <div>
                            <label
                              htmlFor="secondAbuseDates"
                              className="text-sm font-medium text-slate-800"
                            >
                              6g. Dates or estimates of when it happened
                            </label>
                            <textarea
                              id="secondAbuseDates"
                              name="secondAbuseDates"
                              rows={3}
                              autoComplete="off"
                              value={form.secondAbuseDates}
                              onChange={(e) =>
                                update("secondAbuseDates", e.target.value)
                              }
                              className={textareaClass}
                            />
                          </div>
                        )}
                      {showAbuseIncident2 && !showAbuseIncident3 && (
                        <button
                          type="button"
                          onClick={() => setShowAbuseIncident3(true)}
                          className="inline-flex min-h-11 w-full items-center justify-center rounded-xl border border-dashed border-purple-300 bg-white px-5 py-3 text-sm font-medium text-purple-900 shadow-sm transition hover:bg-purple-50"
                        >
                          + Add a third incident (optional)
                        </button>
                      )}
                    </div>
                  )}

                  {showAbuseIncident3 && (
                    <div className="space-y-8 border-t border-purple-100/90 pt-8">
                      <p className="text-sm leading-relaxed text-slate-600">
                        Optional: a third incident if it applies (DV-100 Section 7). Leave blank if not.
                      </p>
                      <div>
                        <h2 className="text-sm font-semibold text-slate-900">
                          Section 7. Third incident of abuse
                        </h2>
                        <p className="mt-1 text-sm text-slate-600">
                          Answer about another incident, or skip this section if it
                          does not apply. You may estimate dates if you are unsure.
                        </p>
                      </div>
                      <div>
                        <label
                          htmlFor="thirdAbuseDate"
                          className="text-sm font-medium text-slate-800"
                        >
                          7a. Date of abuse
                        </label>
                        <p className="mt-1 text-xs text-slate-500">
                          Give your best estimate if you do not know the exact date.
                        </p>
                        <input
                          id="thirdAbuseDate"
                          name="thirdAbuseDate"
                          type="text"
                          autoComplete="off"
                          value={form.thirdAbuseDate}
                          onChange={(e) =>
                            update("thirdAbuseDate", e.target.value)
                          }
                          className={inputClass}
                        />
                      </div>
                      <fieldset className="space-y-4">
                        <legend className="text-sm font-medium text-slate-800">
                          7b. Did anyone else hear or see what happened on this
                          day?
                        </legend>
                        <div className="space-y-3">
                          {(
                            [
                              { value: "idk", label: "I don't know" },
                              { value: "no", label: "No" },
                              { value: "yes", label: "Yes" },
                            ] as const
                          ).map(({ value, label }) => (
                            <label
                              key={value}
                              className="flex cursor-pointer items-start gap-3 rounded-xl border border-purple-100 bg-white px-4 py-3 shadow-sm transition hover:border-purple-200 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-liz/30"
                            >
                              <input
                                type="radio"
                                name="thirdAbuseWitnesses"
                                checked={form.thirdAbuseWitnesses === value}
                                onChange={() => {
                                  update("thirdAbuseWitnesses", value);
                                  if (value !== "yes") {
                                    update("thirdAbuseWitnessDetail", "");
                                  }
                                }}
                                className="mt-1 size-4 shrink-0 border-purple-200 accent-liz focus:ring-liz"
                              />
                              <span className="text-sm leading-relaxed text-slate-800">
                                {label}
                              </span>
                            </label>
                          ))}
                        </div>
                      </fieldset>
                      {form.thirdAbuseWitnesses === "yes" && (
                        <div>
                          <label
                            htmlFor="thirdAbuseWitnessDetail"
                            className="text-sm font-medium text-slate-800"
                          >
                            Give names or describe who heard or saw what happened
                          </label>
                          <input
                            id="thirdAbuseWitnessDetail"
                            name="thirdAbuseWitnessDetail"
                            type="text"
                            autoComplete="off"
                            value={form.thirdAbuseWitnessDetail}
                            onChange={(e) =>
                              update("thirdAbuseWitnessDetail", e.target.value)
                            }
                            className={inputClass}
                          />
                        </div>
                      )}
                      <fieldset className="space-y-4">
                        <legend className="text-sm font-medium text-slate-800">
                          7c. Did the person use or threaten to use a gun or other
                          weapon?
                        </legend>
                        <div className="space-y-3">
                          <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-purple-100 bg-white px-4 py-3 shadow-sm transition hover:border-purple-200 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-liz/30">
                            <input
                              type="radio"
                              name="thirdAbuseWeapon"
                              checked={form.thirdAbuseWeapon === "no"}
                              onChange={() => {
                                update("thirdAbuseWeapon", "no");
                                update("thirdAbuseWeaponDetail", "");
                              }}
                              className="mt-1 size-4 shrink-0 border-purple-200 accent-liz focus:ring-liz"
                            />
                            <span className="text-sm leading-relaxed text-slate-800">
                              No
                            </span>
                          </label>
                          <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-purple-100 bg-white px-4 py-3 shadow-sm transition hover:border-purple-200 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-liz/30">
                            <input
                              type="radio"
                              name="thirdAbuseWeapon"
                              checked={form.thirdAbuseWeapon === "yes"}
                              onChange={() => update("thirdAbuseWeapon", "yes")}
                              className="mt-1 size-4 shrink-0 border-purple-200 accent-liz focus:ring-liz"
                            />
                            <span className="text-sm leading-relaxed text-slate-800">
                              Yes
                            </span>
                          </label>
                        </div>
                      </fieldset>
                      {form.thirdAbuseWeapon === "yes" && (
                        <div>
                          <label
                            htmlFor="thirdAbuseWeaponDetail"
                            className="text-sm font-medium text-slate-800"
                          >
                            Describe the gun or weapon
                          </label>
                          <input
                            id="thirdAbuseWeaponDetail"
                            name="thirdAbuseWeaponDetail"
                            type="text"
                            autoComplete="off"
                            value={form.thirdAbuseWeaponDetail}
                            onChange={(e) =>
                              update("thirdAbuseWeaponDetail", e.target.value)
                            }
                            className={inputClass}
                          />
                        </div>
                      )}
                      <fieldset className="space-y-4">
                        <legend className="text-sm font-medium text-slate-800">
                          7d. Did the person cause you emotional or physical harm?
                        </legend>
                        <div className="space-y-3">
                          <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-purple-100 bg-white px-4 py-3 shadow-sm transition hover:border-purple-200 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-liz/30">
                            <input
                              type="radio"
                              name="thirdAbuseHarm"
                              checked={form.thirdAbuseHarm === "no"}
                              onChange={() => {
                                update("thirdAbuseHarm", "no");
                                update("thirdAbuseHarmDetail", "");
                              }}
                              className="mt-1 size-4 shrink-0 border-purple-200 accent-liz focus:ring-liz"
                            />
                            <span className="text-sm leading-relaxed text-slate-800">
                              No
                            </span>
                          </label>
                          <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-purple-100 bg-white px-4 py-3 shadow-sm transition hover:border-purple-200 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-liz/30">
                            <input
                              type="radio"
                              name="thirdAbuseHarm"
                              checked={form.thirdAbuseHarm === "yes"}
                              onChange={() => update("thirdAbuseHarm", "yes")}
                              className="mt-1 size-4 shrink-0 border-purple-200 accent-liz focus:ring-liz"
                            />
                            <span className="text-sm leading-relaxed text-slate-800">
                              Yes
                            </span>
                          </label>
                        </div>
                      </fieldset>
                      {form.thirdAbuseHarm === "yes" && (
                        <div>
                          <label
                            htmlFor="thirdAbuseHarmDetail"
                            className="text-sm font-medium text-slate-800"
                          >
                            Describe the harm
                          </label>
                          <p className="mt-1 text-xs text-slate-500">
                            Keep it brief. Space is limited to one line on the
                            official form.
                          </p>
                          <input
                            id="thirdAbuseHarmDetail"
                            name="thirdAbuseHarmDetail"
                            type="text"
                            autoComplete="off"
                            maxLength={HARM_DETAIL_MAX_LENGTH}
                            value={form.thirdAbuseHarmDetail}
                            onChange={(e) =>
                              update("thirdAbuseHarmDetail", e.target.value)
                            }
                            className={inputClass}
                            aria-describedby="thirdAbuseHarmDetail-counter"
                          />
                          <p
                            id="thirdAbuseHarmDetail-counter"
                            className="mt-1.5 text-xs tabular-nums text-slate-500"
                          >
                            {form.thirdAbuseHarmDetail.length}/
                            {HARM_DETAIL_MAX_LENGTH} characters
                          </p>
                        </div>
                      )}
                      <fieldset className="space-y-4">
                        <legend className="text-sm font-medium text-slate-800">
                          7e. Did the police come?
                        </legend>
                        <div className="space-y-3">
                          {(
                            [
                              { value: "idk", label: "I don't know" },
                              { value: "no", label: "No" },
                              { value: "yes", label: "Yes" },
                            ] as const
                          ).map(({ value, label }) => (
                            <label
                              key={value}
                              className="flex cursor-pointer items-start gap-3 rounded-xl border border-purple-100 bg-white px-4 py-3 shadow-sm transition hover:border-purple-200 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-liz/30"
                            >
                              <input
                                type="radio"
                                name="thirdAbusePolice"
                                checked={form.thirdAbusePolice === value}
                                onChange={() =>
                                  update("thirdAbusePolice", value)
                                }
                                className="mt-1 size-4 shrink-0 border-purple-200 accent-liz focus:ring-liz"
                              />
                              <span className="text-sm leading-relaxed text-slate-800">
                                {label}
                              </span>
                            </label>
                          ))}
                        </div>
                        <p className="text-xs text-slate-500">
                          If the police gave you a restraining order, list it in
                          Section 4 of the form.
                        </p>
                      </fieldset>
                      <div>
                        <label
                          htmlFor="thirdAbuseDetails"
                          className="text-sm font-medium text-slate-800"
                        >
                          7f. Details of abuse
                        </label>
                        <p className="mt-2 text-sm font-bold leading-snug text-slate-800">
                          Note: You have plenty of space. Your response will be
                          automatically printed on a full-page addendum (Attachment
                          7f) at the end of the form.
                        </p>
                        <textarea
                          id="thirdAbuseDetails"
                          name="thirdAbuseDetails"
                          rows={15}
                          autoComplete="off"
                          value={form.thirdAbuseDetails}
                          onChange={(e) =>
                            update("thirdAbuseDetails", e.target.value)
                          }
                          className={`${inputClass} mt-3 min-h-[20rem] resize-y`}
                        />
                      </div>
                      <fieldset className="space-y-4">
                        <legend className="text-sm font-medium text-slate-800">
                          7g. How often has the person abused you like this?
                        </legend>
                        <div className="space-y-3">
                          {(
                            [
                              { value: "once", label: "Just this once" },
                              { value: "2-5", label: "2–5 times" },
                              { value: "weekly", label: "Weekly" },
                              { value: "other", label: "Other" },
                            ] as const
                          ).map(({ value, label }) => (
                            <label
                              key={value}
                              className="flex cursor-pointer items-start gap-3 rounded-xl border border-purple-100 bg-white px-4 py-3 shadow-sm transition hover:border-purple-200 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-liz/30"
                            >
                              <input
                                type="radio"
                                name="thirdAbuseFrequency"
                                checked={form.thirdAbuseFrequency === value}
                                onChange={() => {
                                  update("thirdAbuseFrequency", value);
                                  if (value !== "other") {
                                    update("thirdAbuseFrequencyOther", "");
                                  }
                                  if (value === "once") {
                                    update("thirdAbuseDates", "");
                                  }
                                }}
                                className="mt-1 size-4 shrink-0 border-purple-200 accent-liz focus:ring-liz"
                              />
                              <span className="text-sm leading-relaxed text-slate-800">
                                {label}
                              </span>
                            </label>
                          ))}
                        </div>
                      </fieldset>
                      {form.thirdAbuseFrequency === "other" && (
                        <div>
                          <label
                            htmlFor="thirdAbuseFrequencyOther"
                            className="text-sm font-medium text-slate-800"
                          >
                            Describe how often (other)
                          </label>
                          <input
                            id="thirdAbuseFrequencyOther"
                            name="thirdAbuseFrequencyOther"
                            type="text"
                            autoComplete="off"
                            value={form.thirdAbuseFrequencyOther}
                            onChange={(e) =>
                              update("thirdAbuseFrequencyOther", e.target.value)
                            }
                            className={inputClass}
                          />
                        </div>
                      )}
                      {form.thirdAbuseFrequency !== "" &&
                        form.thirdAbuseFrequency !== "once" && (
                          <div>
                            <label
                              htmlFor="thirdAbuseDates"
                              className="text-sm font-medium text-slate-800"
                            >
                              7g. Dates or estimates of when it happened
                            </label>
                            <textarea
                              id="thirdAbuseDates"
                              name="thirdAbuseDates"
                              rows={3}
                              autoComplete="off"
                              value={form.thirdAbuseDates}
                              onChange={(e) =>
                                update("thirdAbuseDates", e.target.value)
                              }
                              className={textareaClass}
                            />
                          </div>
                        )}
                    </div>
                  )}

                </div>
              )}

              {step === 6 && (
                <div className="space-y-8">
                  <div>
                    <h2 className="text-sm font-semibold text-slate-900">
                      Section 9. Firearms
                    </h2>
                    <p className="mt-1 text-sm text-slate-600">
                      Does the person in item 2 own or possess any firearms or
                      other guns?
                    </p>
                  </div>

                  <fieldset className="space-y-4">
                    <legend className="text-sm font-medium text-slate-800">
                      9a–9c. Firearms
                    </legend>
                    <div className="space-y-3">
                      {(
                        [
                          { value: "idk" as const, label: "I don't know" },
                          { value: "no" as const, label: "No" },
                          { value: "yes" as const, label: "Yes" },
                        ] as const
                      ).map(({ value, label }) => (
                        <label
                          key={value}
                          className="flex cursor-pointer items-start gap-3 rounded-xl border border-purple-100 bg-white px-4 py-3 shadow-sm transition hover:border-purple-200 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-liz/30"
                        >
                          <input
                            type="radio"
                            name="hasFirearms"
                            checked={form.hasFirearms === value}
                            onChange={() => update("hasFirearms", value)}
                            className="mt-1 size-4 shrink-0 border-purple-200 accent-liz focus:ring-liz"
                          />
                          <span className="text-sm leading-relaxed text-slate-800">
                            {label}
                          </span>
                        </label>
                      ))}
                    </div>
                  </fieldset>

                  {form.hasFirearms === "yes" && (
                    <div className="space-y-6">
                      {form.firearms.map((row, index) => (
                        <div
                          key={index}
                          className="space-y-4 rounded-xl border border-purple-100 bg-purple-50/30 px-4 py-4"
                        >
                          <p className="text-sm font-medium text-slate-800">
                            Firearm {index + 1}
                          </p>
                          <div>
                            <label
                              htmlFor={`firearm-desc-${index}`}
                              className="text-sm font-medium text-slate-800"
                            >
                              Description (type, make, model)
                            </label>
                            <input
                              id={`firearm-desc-${index}`}
                              type="text"
                              autoComplete="off"
                              value={row.description}
                              onChange={(e) =>
                                setForm((prev) => ({
                                  ...prev,
                                  firearms: prev.firearms.map((f, i) =>
                                    i === index
                                      ? { ...f, description: e.target.value }
                                      : f,
                                  ),
                                }))
                              }
                              className={inputClass}
                            />
                          </div>
                          <div>
                            <label
                              htmlFor={`firearm-amt-${index}`}
                              className="text-sm font-medium text-slate-800"
                            >
                              Amount
                            </label>
                            <input
                              id={`firearm-amt-${index}`}
                              type="text"
                              autoComplete="off"
                              value={row.amount}
                              onChange={(e) =>
                                setForm((prev) => ({
                                  ...prev,
                                  firearms: prev.firearms.map((f, i) =>
                                    i === index
                                      ? { ...f, amount: e.target.value }
                                      : f,
                                  ),
                                }))
                              }
                              className={inputClass}
                            />
                          </div>
                          <div>
                            <label
                              htmlFor={`firearm-loc-${index}`}
                              className="text-sm font-medium text-slate-800"
                            >
                              Location (if known)
                            </label>
                            <input
                              id={`firearm-loc-${index}`}
                              type="text"
                              autoComplete="off"
                              value={row.location}
                              onChange={(e) =>
                                setForm((prev) => ({
                                  ...prev,
                                  firearms: prev.firearms.map((f, i) =>
                                    i === index
                                      ? { ...f, location: e.target.value }
                                      : f,
                                  ),
                                }))
                              }
                              className={inputClass}
                            />
                          </div>
                        </div>
                      ))}
                      <button
                        type="button"
                        disabled={form.firearms.length >= 6}
                        onClick={() =>
                          setForm((prev) => ({
                            ...prev,
                            firearms: [...prev.firearms, defaultFirearmRow()],
                          }))
                        }
                        className="inline-flex min-h-11 items-center justify-center rounded-xl border border-purple-200 bg-white px-5 py-2.5 text-sm font-medium text-purple-800 shadow-sm transition hover:bg-purple-50 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        Add Firearm
                      </button>
                    </div>
                  )}
                </div>
              )}

              {step === 7 && (
                <div className="space-y-10">
                  <section className="space-y-4">
                    <h2 className="text-sm font-semibold text-slate-900">
                      Section 10. Order to not abuse
                    </h2>
                    <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-purple-100 bg-white px-4 py-3 shadow-sm transition hover:border-purple-200 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-liz/30">
                      <input
                        type="checkbox"
                        checked={form.orderToNotAbuse}
                        onChange={(e) =>
                          update("orderToNotAbuse", e.target.checked)
                        }
                        className="mt-1 size-4 shrink-0 border-purple-200 accent-liz focus:ring-liz"
                      />
                      <span className="text-sm font-medium text-slate-800">
                        Order to Not Abuse
                      </span>
                    </label>
                    <p className="rounded-xl border border-purple-100/80 bg-purple-50/40 px-4 py-3 text-sm leading-relaxed text-slate-800">
                      I ask the judge to order the person in item 2 to not do
                      the following things to me or anyone listed in Section 8:
                      Harass, attack, strike, threaten, assault (sexually or
                      otherwise), hit, follow, stalk, molest, destroy personal
                      property, keep under surveillance, impersonate (on the
                      internet, electronically, or otherwise), block movements,
                      annoy by phone or other electronic means (including
                      repeatedly contact), or disturb the peace.
                    </p>
                    <p className="text-sm leading-relaxed text-slate-700">
                      For more information on what &apos;disturbing the
                      peace&apos; means, read form{" "}
                      <a
                        href="https://courts.ca.gov/sites/default/files/courts/default/2024-11/dv500info.pdf"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-medium text-liz underline underline-offset-2 hover:text-liz"
                      >
                        DV-500-INFO
                      </a>
                      , Can a Domestic Violence Restraining Order Help Me?
                    </p>
                  </section>

                  <section className="space-y-4 border-t border-purple-100/90 pt-8">
                    <h2 className="text-sm font-semibold text-slate-900">
                      Section 11. No-contact order
                    </h2>
                    <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-purple-100 bg-white px-4 py-3 shadow-sm transition hover:border-purple-200 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-liz/30">
                      <input
                        type="checkbox"
                        checked={form.noContactOrder}
                        onChange={(e) =>
                          update("noContactOrder", e.target.checked)
                        }
                        className="mt-1 size-4 shrink-0 border-purple-200 accent-liz focus:ring-liz"
                      />
                      <span className="text-sm font-medium text-slate-800">
                        No-Contact Order
                      </span>
                    </label>
                    <p className="text-sm leading-relaxed text-slate-700">
                      I ask the judge to order the person in item 2 to not
                      contact me or anyone listed in Section 8.
                    </p>
                  </section>

                  <section className="space-y-6 border-t border-purple-100/90 pt-8">
                    <h2 className="text-sm font-semibold text-slate-900">
                      Section 12. Stay-away order
                    </h2>
                    <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-purple-100 bg-white px-4 py-3 shadow-sm transition hover:border-purple-200 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-liz/30">
                      <input
                        type="checkbox"
                        checked={form.stayAwayOrder}
                        onChange={(e) => {
                          if (e.target.checked) {
                            update("stayAwayOrder", true);
                          } else {
                            resetStayAwayOrders();
                          }
                        }}
                        className="mt-1 size-4 shrink-0 border-purple-200 accent-liz focus:ring-liz"
                      />
                      <span className="text-sm font-medium text-slate-800">
                        Stay-Away Order
                      </span>
                    </label>

                    {form.stayAwayOrder && (
                      <div className="space-y-8">
                        <p className="text-sm leading-relaxed text-slate-700">
                          I ask the judge to order the person in item 2 to stay
                          away from the places and people checked below.
                        </p>

                        <div>
                          <h3 className="text-sm font-medium text-slate-800">
                            12a. Stay away from (check all that apply)
                          </h3>
                          <div className="mt-4 grid gap-4 sm:grid-cols-2">
                            <div className="space-y-3">
                              {(
                                [
                                  {
                                    key: "stayAwayMe" as const,
                                    label: "Me",
                                  },
                                  {
                                    key: "stayAwayHome" as const,
                                    label: "My home",
                                  },
                                  {
                                    key: "stayAwayWork" as const,
                                    label: "My job or workplace",
                                  },
                                  {
                                    key: "stayAwayVehicle" as const,
                                    label: "My vehicle",
                                  },
                                ] as const
                              ).map(({ key, label }) => (
                                <label
                                  key={key}
                                  className="flex cursor-pointer items-start gap-3 rounded-lg border border-purple-100/80 bg-white px-3 py-2.5"
                                >
                                  <input
                                    type="checkbox"
                                    checked={Boolean(form[key])}
                                    onChange={(e) =>
                                      update(key, e.target.checked)
                                    }
                                    className="mt-0.5 size-4 shrink-0 border-purple-200 accent-liz focus:ring-liz"
                                  />
                                  <span className="text-sm text-slate-800">
                                    {label}
                                  </span>
                                </label>
                              ))}
                            </div>
                            <div className="space-y-3">
                              {(
                                [
                                  {
                                    key: "stayAwaySchool" as const,
                                    label: "My school",
                                  },
                                  {
                                    key: "stayAwayProtectedPersons" as const,
                                    label: "Each person in Section 8",
                                  },
                                  {
                                    key: "stayAwayChildrenSchool" as const,
                                    label: "My children's school or childcare",
                                  },
                                  {
                                    key: "stayAwayOther" as const,
                                    label: "Other (please explain)",
                                  },
                                ] as const
                              ).map(({ key, label }) => (
                                <label
                                  key={key}
                                  className="flex cursor-pointer items-start gap-3 rounded-lg border border-purple-100/80 bg-white px-3 py-2.5"
                                >
                                  <input
                                    type="checkbox"
                                    checked={Boolean(form[key])}
                                    onChange={(e) =>
                                      update(key, e.target.checked)
                                    }
                                    className="mt-0.5 size-4 shrink-0 border-purple-200 accent-liz focus:ring-liz"
                                  />
                                  <span className="text-sm text-slate-800">
                                    {label}
                                  </span>
                                </label>
                              ))}
                            </div>
                          </div>
                          {form.stayAwayOther && (
                            <div className="mt-4">
                              <label
                                htmlFor="stayAwayOtherExplain"
                                className="text-sm font-medium text-slate-800"
                              >
                                Explain &quot;Other&quot;
                              </label>
                              <input
                                id="stayAwayOtherExplain"
                                type="text"
                                autoComplete="off"
                                value={form.stayAwayOtherExplain}
                                onChange={(e) =>
                                  update("stayAwayOtherExplain", e.target.value)
                                }
                                className={inputClass}
                              />
                            </div>
                          )}
                        </div>

                        <fieldset className="space-y-4">
                          <legend className="text-sm font-medium text-slate-800">
                            12b. How far do you want the person to stay away?
                          </legend>
                          <div className="space-y-3">
                            {(
                              [
                                {
                                  value: "hundred" as const,
                                  label: "100 yards (300 feet)",
                                },
                                {
                                  value: "other" as const,
                                  label: "Other (give distance in yards)",
                                },
                              ] as const
                            ).map(({ value, label }) => (
                              <label
                                key={value}
                                className="flex cursor-pointer items-start gap-3 rounded-xl border border-purple-100 bg-white px-4 py-3 shadow-sm transition hover:border-purple-200 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-liz/30"
                              >
                                <input
                                  type="radio"
                                  name="stayAwayDistance"
                                  checked={form.stayAwayDistance === value}
                                  onChange={() => {
                                    update("stayAwayDistance", value);
                                    if (value !== "other") {
                                      update("stayAwayDistanceOther", "");
                                    }
                                  }}
                                  className="mt-1 size-4 shrink-0 border-purple-200 accent-liz focus:ring-liz"
                                />
                                <span className="text-sm leading-relaxed text-slate-800">
                                  {label}
                                </span>
                              </label>
                            ))}
                          </div>
                          {form.stayAwayDistance === "other" && (
                            <div>
                              <label
                                htmlFor="stayAwayDistanceOther"
                                className="text-sm font-medium text-slate-800"
                              >
                                Distance in yards
                              </label>
                              <input
                                id="stayAwayDistanceOther"
                                type="text"
                                autoComplete="off"
                                placeholder="e.g. 50"
                                value={form.stayAwayDistanceOther}
                                onChange={(e) =>
                                  update(
                                    "stayAwayDistanceOther",
                                    e.target.value,
                                  )
                                }
                                className={inputClass}
                              />
                            </div>
                          )}
                        </fieldset>

                        <fieldset className="space-y-4">
                          <legend className="text-sm font-medium text-slate-800">
                            12c. Do you and the person in item 2 live together
                            or live close to each other?
                          </legend>
                          <div className="space-y-3">
                            {(
                              [
                                { value: "no" as const, label: "No" },
                                { value: "yes" as const, label: "Yes" },
                              ] as const
                            ).map(({ value, label }) => (
                              <label
                                key={value}
                                className="flex cursor-pointer items-start gap-3 rounded-xl border border-purple-100 bg-white px-4 py-3 shadow-sm transition hover:border-purple-200 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-liz/30"
                              >
                                <input
                                  type="radio"
                                  name="liveTogether"
                                  checked={form.liveTogether === value}
                                  onChange={() => {
                                    setForm((prev) => ({
                                      ...prev,
                                      liveTogether: value,
                                      liveTogetherType: "",
                                      liveTogetherOther: "",
                                    }));
                                  }}
                                  className="mt-1 size-4 shrink-0 border-purple-200 accent-liz focus:ring-liz"
                                />
                                <span className="text-sm leading-relaxed text-slate-800">
                                  {label}
                                </span>
                              </label>
                            ))}
                          </div>
                          {form.liveTogether === "yes" && (
                            <div className="space-y-3 pl-0 sm:pl-2">
                              <p className="text-sm font-medium text-slate-800">
                                If yes, check one:
                              </p>
                              <div className="space-y-3">
                                {(
                                  [
                                    {
                                      value: "liveTogether" as const,
                                      label: "Live together",
                                      hint: "(If you live together, you can ask that the person in item 2 move out in Section 13.)",
                                    },
                                    {
                                      value: "sameBuilding" as const,
                                      label:
                                        "Live in the same building, but not in the same home",
                                    },
                                    {
                                      value: "sameNeighborhood" as const,
                                      label: "Live in the same neighborhood",
                                    },
                                    {
                                      value: "other" as const,
                                      label: "Other (please explain)",
                                    },
                                  ] as const
                                ).map((row) => {
                                  const { value, label } = row;
                                  const hint =
                                    "hint" in row
                                      ? row.hint
                                      : undefined;
                                  return (
                                    <label
                                      key={value}
                                      className="flex cursor-pointer items-start gap-3 rounded-xl border border-purple-100 bg-white px-4 py-3 shadow-sm transition hover:border-purple-200 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-liz/30"
                                    >
                                      <input
                                        type="radio"
                                        name="liveTogetherType"
                                        checked={
                                          form.liveTogetherType === value
                                        }
                                        onChange={() => {
                                          setForm((prev) => ({
                                            ...prev,
                                            liveTogetherType: value,
                                            liveTogetherOther:
                                              value === "other"
                                                ? prev.liveTogetherOther
                                                : "",
                                          }));
                                        }}
                                        className="mt-1 size-4 shrink-0 border-purple-200 accent-liz focus:ring-liz"
                                      />
                                      <span className="text-sm leading-relaxed text-slate-800">
                                        {label}
                                        {hint ? (
                                          <span className="mt-1 block text-xs font-normal text-slate-600">
                                            {hint}
                                          </span>
                                        ) : null}
                                      </span>
                                    </label>
                                  );
                                })}
                              </div>
                              {form.liveTogetherType === "other" && (
                                <div>
                                  <label
                                    htmlFor="liveTogetherOther"
                                    className="text-sm font-medium text-slate-800"
                                  >
                                    Explain
                                  </label>
                                  <input
                                    id="liveTogetherOther"
                                    type="text"
                                    autoComplete="off"
                                    value={form.liveTogetherOther}
                                    onChange={(e) =>
                                      update("liveTogetherOther", e.target.value)
                                    }
                                    className={inputClass}
                                  />
                                </div>
                              )}
                            </div>
                          )}
                        </fieldset>

                        <fieldset className="space-y-4">
                          <legend className="text-sm font-medium text-slate-800">
                            12d. Do you and the person in item 2 have the same
                            workplace or go to the same school?
                          </legend>
                          <div className="space-y-3">
                            {(
                              [
                                { value: "no" as const, label: "No" },
                                { value: "yes" as const, label: "Yes" },
                              ] as const
                            ).map(({ value, label }) => (
                              <label
                                key={value}
                                className="flex cursor-pointer items-start gap-3 rounded-xl border border-purple-100 bg-white px-4 py-3 shadow-sm transition hover:border-purple-200 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-liz/30"
                              >
                                <input
                                  type="radio"
                                  name="sameWorkplaceSchool"
                                  checked={form.sameWorkplaceSchool === value}
                                  onChange={() => {
                                    setForm((prev) => ({
                                      ...prev,
                                      sameWorkplaceSchool: value,
                                      workTogether: false,
                                      workTogetherCompany: "",
                                      sameSchool: false,
                                      sameSchoolName: "",
                                      sameWorkplaceOther: false,
                                      sameWorkplaceOtherExplain: "",
                                    }));
                                  }}
                                  className="mt-1 size-4 shrink-0 border-purple-200 accent-liz focus:ring-liz"
                                />
                                <span className="text-sm leading-relaxed text-slate-800">
                                  {label}
                                </span>
                              </label>
                            ))}
                          </div>
                          {form.sameWorkplaceSchool === "yes" && (
                            <div className="space-y-4 pl-0 sm:pl-2">
                              <p className="text-sm font-medium text-slate-800">
                                If yes, check all that apply:
                              </p>
                              <div className="space-y-4">
                                <div className="rounded-xl border border-purple-100/80 bg-white px-4 py-3">
                                  <label className="flex cursor-pointer items-start gap-3">
                                    <input
                                      type="checkbox"
                                      checked={form.workTogether}
                                      onChange={(e) =>
                                        setForm((prev) => ({
                                          ...prev,
                                          workTogether: e.target.checked,
                                          workTogetherCompany: e.target.checked
                                            ? prev.workTogetherCompany
                                            : "",
                                        }))
                                      }
                                      className="mt-1 size-4 shrink-0 border-purple-200 accent-liz focus:ring-liz"
                                    />
                                    <span className="text-sm text-slate-800">
                                      Work together at (name of company):
                                    </span>
                                  </label>
                                  {form.workTogether && (
                                    <input
                                      type="text"
                                      autoComplete="off"
                                      placeholder="Name of company"
                                      value={form.workTogetherCompany}
                                      onChange={(e) =>
                                        update(
                                          "workTogetherCompany",
                                          e.target.value,
                                        )
                                      }
                                      className={`${inputClass} mt-2`}
                                    />
                                  )}
                                </div>
                                <div className="rounded-xl border border-purple-100/80 bg-white px-4 py-3">
                                  <label className="flex cursor-pointer items-start gap-3">
                                    <input
                                      type="checkbox"
                                      checked={form.sameSchool}
                                      onChange={(e) =>
                                        setForm((prev) => ({
                                          ...prev,
                                          sameSchool: e.target.checked,
                                          sameSchoolName: e.target.checked
                                            ? prev.sameSchoolName
                                            : "",
                                        }))
                                      }
                                      className="mt-1 size-4 shrink-0 border-purple-200 accent-liz focus:ring-liz"
                                    />
                                    <span className="text-sm text-slate-800">
                                      Go to the same school (name of school):
                                    </span>
                                  </label>
                                  {form.sameSchool && (
                                    <input
                                      type="text"
                                      autoComplete="off"
                                      placeholder="Name of school"
                                      value={form.sameSchoolName}
                                      onChange={(e) =>
                                        update("sameSchoolName", e.target.value)
                                      }
                                      className={`${inputClass} mt-2`}
                                    />
                                  )}
                                </div>
                                <div className="rounded-xl border border-purple-100/80 bg-white px-4 py-3">
                                  <label className="flex cursor-pointer items-start gap-3">
                                    <input
                                      type="checkbox"
                                      checked={form.sameWorkplaceOther}
                                      onChange={(e) =>
                                        setForm((prev) => ({
                                          ...prev,
                                          sameWorkplaceOther: e.target.checked,
                                          sameWorkplaceOtherExplain:
                                            e.target.checked
                                              ? prev.sameWorkplaceOtherExplain
                                              : "",
                                        }))
                                      }
                                      className="mt-1 size-4 shrink-0 border-purple-200 accent-liz focus:ring-liz"
                                    />
                                    <span className="text-sm text-slate-800">
                                      Other (please explain):
                                    </span>
                                  </label>
                                  {form.sameWorkplaceOther && (
                                    <input
                                      type="text"
                                      autoComplete="off"
                                      placeholder="Please explain"
                                      value={form.sameWorkplaceOtherExplain}
                                      onChange={(e) =>
                                        update(
                                          "sameWorkplaceOtherExplain",
                                          e.target.value,
                                        )
                                      }
                                      className={`${inputClass} mt-2`}
                                    />
                                  )}
                                </div>
                              </div>
                            </div>
                          )}
                        </fieldset>
                      </div>
                    )}
                  </section>
                </div>
              )}

              {step === 8 && (
                <div className="space-y-10">
                  <section className="space-y-4">
                    <h2 className="text-sm font-semibold text-slate-900">
                      Section 13. Order to move out
                    </h2>
                    <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-purple-100 bg-white px-4 py-3 shadow-sm transition hover:border-purple-200 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-liz/30">
                      <input
                        type="checkbox"
                        checked={form.orderToMoveOut}
                        onChange={(e) => {
                          if (e.target.checked) {
                            update("orderToMoveOut", true);
                          } else {
                            resetMoveOutOrders();
                          }
                        }}
                        className="mt-1 size-4 shrink-0 border-purple-200 accent-liz focus:ring-liz"
                      />
                      <span className="text-sm font-medium text-slate-800">
                        Order to Move Out
                      </span>
                    </label>

                    {form.orderToMoveOut && (
                      <div className="space-y-6">
                        <div>
                          <label
                            htmlFor="moveOutOrderPersonAsk"
                            className="text-sm font-medium text-slate-800"
                          >
                            13a. I ask the judge to order the person in item 2
                            to move out of (address)
                          </label>
                          <input
                            id="moveOutOrderPersonAsk"
                            type="text"
                            autoComplete="off"
                            maxLength={MOVE_OUT_13A_MAX_LENGTH}
                            value={form.moveOutOrderPersonAsk}
                            onChange={(e) =>
                              update("moveOutOrderPersonAsk", e.target.value)
                            }
                            className={inputClass}
                          />
                          <p className="mt-1 text-xs text-slate-500">
                            {form.moveOutOrderPersonAsk.length} /{" "}
                            {MOVE_OUT_13A_MAX_LENGTH} characters
                          </p>
                        </div>

                        <div>
                          <h3 className="text-sm font-medium text-slate-800">
                            13b. I ask the judge to find that (check all that
                            apply)
                          </h3>
                          <div className="mt-4 grid gap-3 sm:grid-cols-2">
                            {(
                              [
                                {
                                  key: "moveOutOwnHome" as const,
                                  label: "I own the home",
                                },
                                {
                                  key: "moveOutNameOnLease" as const,
                                  label: "My name is on the lease",
                                },
                                {
                                  key: "moveOutWithChildren" as const,
                                  label:
                                    "I live at this address with my children",
                                },
                                {
                                  key: "moveOutLivedFor" as const,
                                  label:
                                    "I have lived at this address for",
                                },
                                {
                                  key: "moveOutPaysRent" as const,
                                  label:
                                    "I pay for some or all of the rent or mortgage",
                                },
                                {
                                  key: "moveOutOther" as const,
                                  label: "Other (please explain)",
                                },
                              ] as const
                            ).map(({ key, label }) => (
                              <label
                                key={key}
                                className="flex cursor-pointer items-start gap-3 rounded-lg border border-purple-100/80 bg-white px-3 py-2.5"
                              >
                                <input
                                  type="checkbox"
                                  checked={Boolean(form[key])}
                                  onChange={(e) => {
                                    const on = e.target.checked;
                                    if (key === "moveOutLivedFor" && !on) {
                                      setForm((prev) => ({
                                        ...prev,
                                        moveOutLivedFor: false,
                                        moveOutLivedYears: "",
                                        moveOutLivedMonths: "",
                                      }));
                                    } else if (key === "moveOutOther" && !on) {
                                      setForm((prev) => ({
                                        ...prev,
                                        moveOutOther: false,
                                        moveOutOtherExplain: "",
                                      }));
                                    } else {
                                      update(key, on);
                                    }
                                  }}
                                  className="mt-0.5 size-4 shrink-0 border-purple-200 accent-liz focus:ring-liz"
                                />
                                <span className="text-sm text-slate-800">
                                  {label}
                                </span>
                              </label>
                            ))}
                          </div>

                          {form.moveOutLivedFor && (
                            <div className="mt-4 flex flex-wrap gap-4">
                              <div className="min-w-[7rem] flex-1">
                                <label
                                  htmlFor="moveOutLivedYears"
                                  className="text-sm font-medium text-slate-800"
                                >
                                  Years
                                </label>
                                <input
                                  id="moveOutLivedYears"
                                  type="text"
                                  inputMode="numeric"
                                  autoComplete="off"
                                  maxLength={MOVE_OUT_DURATION_MAX_LENGTH}
                                  value={form.moveOutLivedYears}
                                  onChange={(e) =>
                                    update(
                                      "moveOutLivedYears",
                                      e.target.value,
                                    )
                                  }
                                  className={inputClass}
                                />
                              </div>
                              <div className="min-w-[7rem] flex-1">
                                <label
                                  htmlFor="moveOutLivedMonths"
                                  className="text-sm font-medium text-slate-800"
                                >
                                  Months
                                </label>
                                <input
                                  id="moveOutLivedMonths"
                                  type="text"
                                  inputMode="numeric"
                                  autoComplete="off"
                                  maxLength={MOVE_OUT_DURATION_MAX_LENGTH}
                                  value={form.moveOutLivedMonths}
                                  onChange={(e) =>
                                    update(
                                      "moveOutLivedMonths",
                                      e.target.value,
                                    )
                                  }
                                  className={inputClass}
                                />
                              </div>
                            </div>
                          )}

                          {form.moveOutOther && (
                            <div className="mt-4">
                              <label
                                htmlFor="moveOutOtherExplain"
                                className="text-sm font-medium text-slate-800"
                              >
                                13b. Other — explain
                              </label>
                              <textarea
                                id="moveOutOtherExplain"
                                autoComplete="off"
                                maxLength={MOVE_OUT_13B_OTHER_MAX_LENGTH}
                                value={form.moveOutOtherExplain}
                                onChange={(e) =>
                                  update(
                                    "moveOutOtherExplain",
                                    e.target.value,
                                  )
                                }
                                className={textareaClass}
                              />
                              <p className="mt-1 text-xs text-slate-500">
                                {form.moveOutOtherExplain.length} /{" "}
                                {MOVE_OUT_13B_OTHER_MAX_LENGTH} characters
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </section>

                  <section className="space-y-4 border-t border-purple-100/90 pt-8">
                    <h2 className="text-sm font-semibold text-slate-900">
                      Section 14. Other orders
                    </h2>
                    <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-purple-100 bg-white px-4 py-3 shadow-sm transition hover:border-purple-200 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-liz/30">
                      <input
                        type="checkbox"
                        checked={form.otherOrders}
                        onChange={(e) => {
                          const on = e.target.checked;
                          if (!on) {
                            setForm((prev) => ({
                              ...prev,
                              otherOrders: false,
                              otherOrdersDescribe: "",
                            }));
                          } else {
                            update("otherOrders", true);
                          }
                        }}
                        className="mt-1 size-4 shrink-0 border-purple-200 accent-liz focus:ring-liz"
                      />
                      <span className="text-sm font-medium text-slate-800">
                        Other Orders
                      </span>
                    </label>
                    {form.otherOrders && (
                      <div>
                        <label
                          htmlFor="otherOrdersDescribe"
                          className="text-sm font-medium text-slate-800"
                        >
                          14. Describe additional orders you want the judge to
                          make
                        </label>
                        <textarea
                          id="otherOrdersDescribe"
                          autoComplete="off"
                          maxLength={OTHER_ORDERS_14_MAX_LENGTH}
                          value={form.otherOrdersDescribe}
                          onChange={(e) =>
                            update("otherOrdersDescribe", e.target.value)
                          }
                          className={textareaClass}
                        />
                        <p className="mt-1 text-xs text-slate-500">
                          {form.otherOrdersDescribe.length} /{" "}
                          {OTHER_ORDERS_14_MAX_LENGTH} characters
                        </p>
                      </div>
                    )}
                  </section>

                  <section className="space-y-4 border-t border-purple-100/90 pt-8">
                    <h2 className="text-sm font-semibold text-slate-900">
                      Section 15. Child custody
                    </h2>
                    <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-purple-100 bg-white px-4 py-3 shadow-sm transition hover:border-purple-200 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-liz/30">
                      <input
                        type="checkbox"
                        checked={form.childCustodyVisitation}
                        onChange={(e) =>
                          update("childCustodyVisitation", e.target.checked)
                        }
                        className="mt-1 size-4 shrink-0 border-purple-200 accent-liz focus:ring-liz"
                      />
                      <span className="text-sm font-medium text-slate-800">
                        Child Custody and Visitation
                      </span>
                    </label>
                    {form.childCustodyVisitation && (
                      <div
                        className="rounded-xl border border-purple-200/90 bg-purple-50/80 px-4 py-3 text-sm leading-relaxed text-purple-950"
                        role="status"
                      >
                        You must fill out form{" "}
                        <a
                          href="https://www.courts.ca.gov/documents/dv105.pdf"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-medium text-liz underline underline-offset-2 hover:text-purple-800"
                        >
                          DV-105
                        </a>
                        ...
                      </div>
                    )}
                  </section>
                </div>
              )}

              {step === 9 && (
                <div className="space-y-10">
                  <section className="space-y-4">
                    <h2 className="text-sm font-semibold text-slate-900">
                      Section 16. Protect animals
                    </h2>
                    <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-purple-100 bg-white px-4 py-3 shadow-sm transition hover:border-purple-200 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-liz/30">
                      <input
                        type="checkbox"
                        checked={form.protectAnimals}
                        onChange={(e) => {
                          if (e.target.checked) {
                            update("protectAnimals", true);
                          } else {
                            resetProtectAnimals();
                          }
                        }}
                        className="mt-1 size-4 shrink-0 border-purple-200 accent-liz focus:ring-liz"
                      />
                      <span className="text-sm font-medium text-slate-800">
                        Protect Animals
                      </span>
                    </label>

                    {form.protectAnimals && (
                      <div className="space-y-6">
                        <div>
                          <h3 className="text-sm font-medium text-slate-800">
                            Animals (up to four)
                          </h3>
                          <div className="mt-3 space-y-4">
                            {form.protectedAnimals.map((animal, idx) => (
                              <div
                                key={`animal-${idx}`}
                                className="rounded-xl border border-purple-100/80 bg-white p-4 shadow-sm"
                              >
                                <p className="text-xs font-semibold uppercase tracking-wide text-purple-900/80">
                                  Animal {idx + 1}
                                </p>
                                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                                  <div>
                                    <label
                                      htmlFor={`animal-name-${idx}`}
                                      className="text-sm font-medium text-slate-800"
                                    >
                                      Name or other way to identify
                                    </label>
                                    <input
                                      id={`animal-name-${idx}`}
                                      type="text"
                                      autoComplete="off"
                                      value={animal.name}
                                      onChange={(e) =>
                                        setForm((prev) => {
                                          const next = [...prev.protectedAnimals];
                                          next[idx] = {
                                            ...next[idx],
                                            name: e.target.value,
                                          };
                                          return { ...prev, protectedAnimals: next };
                                        })
                                      }
                                      className={inputClass}
                                    />
                                  </div>
                                  <div>
                                    <label
                                      htmlFor={`animal-type-${idx}`}
                                      className="text-sm font-medium text-slate-800"
                                    >
                                      Type
                                    </label>
                                    <input
                                      id={`animal-type-${idx}`}
                                      type="text"
                                      autoComplete="off"
                                      value={animal.type}
                                      onChange={(e) =>
                                        setForm((prev) => {
                                          const next = [...prev.protectedAnimals];
                                          next[idx] = {
                                            ...next[idx],
                                            type: e.target.value,
                                          };
                                          return { ...prev, protectedAnimals: next };
                                        })
                                      }
                                      className={inputClass}
                                    />
                                  </div>
                                  <div>
                                    <label
                                      htmlFor={`animal-breed-${idx}`}
                                      className="text-sm font-medium text-slate-800"
                                    >
                                      Breed (if known)
                                    </label>
                                    <input
                                      id={`animal-breed-${idx}`}
                                      type="text"
                                      autoComplete="off"
                                      value={animal.breed}
                                      onChange={(e) =>
                                        setForm((prev) => {
                                          const next = [...prev.protectedAnimals];
                                          next[idx] = {
                                            ...next[idx],
                                            breed: e.target.value,
                                          };
                                          return { ...prev, protectedAnimals: next };
                                        })
                                      }
                                      className={inputClass}
                                    />
                                  </div>
                                  <div>
                                    <label
                                      htmlFor={`animal-color-${idx}`}
                                      className="text-sm font-medium text-slate-800"
                                    >
                                      Color
                                    </label>
                                    <input
                                      id={`animal-color-${idx}`}
                                      type="text"
                                      autoComplete="off"
                                      value={animal.color}
                                      onChange={(e) =>
                                        setForm((prev) => {
                                          const next = [...prev.protectedAnimals];
                                          next[idx] = {
                                            ...next[idx],
                                            color: e.target.value,
                                          };
                                          return { ...prev, protectedAnimals: next };
                                        })
                                      }
                                      className={inputClass}
                                    />
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        <fieldset className="space-y-3 rounded-xl border border-purple-100/80 bg-purple-50/40 p-4">
                          <legend className="text-sm font-medium text-slate-800">
                            Orders regarding animals
                          </legend>
                          <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-purple-100/80 bg-white px-3 py-2.5">
                            <input
                              type="checkbox"
                              checked={form.protectAnimalsStayAway}
                              onChange={(e) => {
                                const on = e.target.checked;
                                setForm((prev) => ({
                                  ...prev,
                                  protectAnimalsStayAway: on,
                                  ...(!on
                                    ? {
                                        protectAnimalsStayAwayDistance: "",
                                        protectAnimalsStayAwayOtherYards: "",
                                      }
                                    : {}),
                                }));
                              }}
                              className="mt-0.5 size-4 shrink-0 border-purple-200 accent-liz focus:ring-liz"
                            />
                            <span className="text-sm text-slate-800">
                              Stay away from animals by at least
                            </span>
                          </label>
                          {form.protectAnimalsStayAway && (
                            <div className="ml-7 space-y-3 border-l-2 border-purple-200/80 pl-4">
                              <div className="flex flex-col gap-2">
                                <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-800">
                                  <input
                                    type="radio"
                                    name="protectAnimalsStayAwayDistance"
                                    checked={
                                      form.protectAnimalsStayAwayDistance ===
                                      "hundred"
                                    }
                                    onChange={() =>
                                      setForm((prev) => ({
                                        ...prev,
                                        protectAnimalsStayAwayDistance: "hundred",
                                        protectAnimalsStayAwayOtherYards: "",
                                      }))
                                    }
                                    className="size-4 border-purple-200 accent-liz focus:ring-liz"
                                  />
                                  100 yards (300 feet)
                                </label>
                                <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-800">
                                  <input
                                    type="radio"
                                    name="protectAnimalsStayAwayDistance"
                                    checked={
                                      form.protectAnimalsStayAwayDistance ===
                                      "other"
                                    }
                                    onChange={() =>
                                      setForm((prev) => ({
                                        ...prev,
                                        protectAnimalsStayAwayDistance: "other",
                                      }))
                                    }
                                    className="size-4 border-purple-200 accent-liz focus:ring-liz"
                                  />
                                  Other (yards)
                                </label>
                              </div>
                              {form.protectAnimalsStayAwayDistance === "other" && (
                                <div>
                                  <label
                                    htmlFor="protectAnimalsStayAwayOtherYards"
                                    className="text-sm font-medium text-slate-800"
                                  >
                                    Number of yards
                                  </label>
                                  <input
                                    id="protectAnimalsStayAwayOtherYards"
                                    type="text"
                                    inputMode="numeric"
                                    autoComplete="off"
                                    value={form.protectAnimalsStayAwayOtherYards}
                                    onChange={(e) =>
                                      update(
                                        "protectAnimalsStayAwayOtherYards",
                                        e.target.value,
                                      )
                                    }
                                    className={inputClass}
                                  />
                                </div>
                              )}
                            </div>
                          )}

                          <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-purple-100/80 bg-white px-3 py-2.5">
                            <input
                              type="checkbox"
                              checked={form.protectAnimalsNotTake}
                              onChange={(e) =>
                                update("protectAnimalsNotTake", e.target.checked)
                              }
                              className="mt-0.5 size-4 shrink-0 border-purple-200 accent-liz focus:ring-liz"
                            />
                            <span className="text-sm text-slate-800">
                              Not take, sell, hide, molest, attack, strike,
                              threaten, harm, or otherwise get rid of the
                              animals; or get anyone else to do so
                            </span>
                          </label>

                          <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-purple-100/80 bg-white px-3 py-2.5">
                            <input
                              type="checkbox"
                              checked={form.protectAnimalsSolePossession}
                              onChange={(e) => {
                                const on = e.target.checked;
                                setForm((prev) => ({
                                  ...prev,
                                  protectAnimalsSolePossession: on,
                                  ...(!on
                                    ? {
                                        protectAnimalsSoleReasonAbuse: false,
                                        protectAnimalsSoleReasonCare: false,
                                        protectAnimalsSoleReasonPurchased: false,
                                        protectAnimalsSoleReasonOther: false,
                                        protectAnimalsSoleReasonOtherExplain: "",
                                      }
                                    : {}),
                                }));
                              }}
                              className="mt-0.5 size-4 shrink-0 border-purple-200 accent-liz focus:ring-liz"
                            />
                            <span className="text-sm text-slate-800">
                              Give me sole possession, care, and control of the
                              animals
                            </span>
                          </label>
                          {form.protectAnimalsSolePossession && (
                            <div className="ml-7 space-y-2 border-l-2 border-purple-200/80 pl-4">
                              {(
                                [
                                  {
                                    key: "protectAnimalsSoleReasonAbuse" as const,
                                    label:
                                      "Person in item 2 abuses the animals",
                                  },
                                  {
                                    key: "protectAnimalsSoleReasonCare" as const,
                                    label: "I take care of these animals",
                                  },
                                  {
                                    key: "protectAnimalsSoleReasonPurchased" as const,
                                    label: "I purchased these animals",
                                  },
                                ] as const
                              ).map(({ key, label }) => (
                                <label
                                  key={key}
                                  className="flex cursor-pointer items-start gap-3"
                                >
                                  <input
                                    type="checkbox"
                                    checked={Boolean(form[key])}
                                    onChange={(e) =>
                                      update(key, e.target.checked)
                                    }
                                    className="mt-0.5 size-4 shrink-0 border-purple-200 accent-liz focus:ring-liz"
                                  />
                                  <span className="text-sm text-slate-800">
                                    {label}
                                  </span>
                                </label>
                              ))}
                              <label className="flex cursor-pointer items-start gap-3">
                                <input
                                  type="checkbox"
                                  checked={form.protectAnimalsSoleReasonOther}
                                  onChange={(e) => {
                                    const on = e.target.checked;
                                    setForm((prev) => ({
                                      ...prev,
                                      protectAnimalsSoleReasonOther: on,
                                      ...(!on
                                        ? {
                                            protectAnimalsSoleReasonOtherExplain:
                                              "",
                                          }
                                        : {}),
                                    }));
                                  }}
                                  className="mt-0.5 size-4 shrink-0 border-purple-200 accent-liz focus:ring-liz"
                                />
                                <span className="text-sm text-slate-800">
                                  Other
                                </span>
                              </label>
                              {form.protectAnimalsSoleReasonOther && (
                                <textarea
                                  autoComplete="off"
                                  value={form.protectAnimalsSoleReasonOtherExplain}
                                  onChange={(e) =>
                                    update(
                                      "protectAnimalsSoleReasonOtherExplain",
                                      e.target.value,
                                    )
                                  }
                                  className={textareaClass}
                                />
                              )}
                            </div>
                          )}
                        </fieldset>
                      </div>
                    )}
                  </section>

                  <section className="space-y-4 border-t border-purple-100/90 pt-8">
                    <h2 className="text-sm font-semibold text-slate-900">
                      Section 17. Control of property
                    </h2>
                    <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-purple-100 bg-white px-4 py-3 shadow-sm transition hover:border-purple-200 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-liz/30">
                      <input
                        type="checkbox"
                        checked={form.controlProperty}
                        onChange={(e) => {
                          if (e.target.checked) {
                            update("controlProperty", true);
                          } else {
                            resetControlProperty();
                          }
                        }}
                        className="mt-1 size-4 shrink-0 border-purple-200 accent-liz focus:ring-liz"
                      />
                      <span className="text-sm font-medium text-slate-800">
                        Control of Property
                      </span>
                    </label>
                    {form.controlProperty && (
                      <div className="space-y-4">
                        <div>
                          <label
                            htmlFor="controlPropertyDescribe"
                            className="text-sm font-medium text-slate-800"
                          >
                            17a. Describe the property
                          </label>
                          <textarea
                            id="controlPropertyDescribe"
                            autoComplete="off"
                            value={form.controlPropertyDescribe}
                            onChange={(e) =>
                              update("controlPropertyDescribe", e.target.value)
                            }
                            className={textareaClass}
                          />
                        </div>
                        <div>
                          <label
                            htmlFor="controlPropertyWhy"
                            className="text-sm font-medium text-slate-800"
                          >
                            17b. Explain why you want control
                          </label>
                          <textarea
                            id="controlPropertyWhy"
                            autoComplete="off"
                            value={form.controlPropertyWhy}
                            onChange={(e) =>
                              update("controlPropertyWhy", e.target.value)
                            }
                            className={textareaClass}
                          />
                        </div>
                      </div>
                    )}
                  </section>

                  <section className="space-y-4 border-t border-purple-100/90 pt-8">
                    <h2 className="text-sm font-semibold text-slate-900">
                      Section 18. Health and other insurance
                    </h2>
                    <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-purple-100 bg-white px-4 py-3 shadow-sm transition hover:border-purple-200 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-liz/30">
                      <input
                        type="checkbox"
                        checked={form.healthOtherInsurance}
                        onChange={(e) =>
                          update("healthOtherInsurance", e.target.checked)
                        }
                        className="mt-1 size-4 shrink-0 border-purple-200 accent-liz focus:ring-liz"
                      />
                      <span className="text-sm font-medium text-slate-800">
                        Health and Other Insurance
                      </span>
                    </label>
                  </section>

                  <section className="space-y-4 border-t border-purple-100/90 pt-8">
                    <h2 className="text-sm font-semibold text-slate-900">
                      Section 19. Record communications
                    </h2>
                    <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-purple-100 bg-white px-4 py-3 shadow-sm transition hover:border-purple-200 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-liz/30">
                      <input
                        type="checkbox"
                        checked={form.recordCommunications}
                        onChange={(e) =>
                          update("recordCommunications", e.target.checked)
                        }
                        className="mt-1 size-4 shrink-0 border-purple-200 accent-liz focus:ring-liz"
                      />
                      <span className="text-sm font-medium text-slate-800">
                        Record Communications
                      </span>
                    </label>
                  </section>
                </div>
              )}

              {step === 10 && (
                <div className="space-y-10">
                  <section className="space-y-4">
                    <h2 className="text-sm font-semibold text-slate-900">
                      Section 20. Property restraint
                    </h2>
                    <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-purple-100 bg-white px-4 py-3 shadow-sm transition hover:border-purple-200 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-liz/30">
                      <input
                        type="checkbox"
                        checked={form.propertyRestraint}
                        onChange={(e) =>
                          update("propertyRestraint", e.target.checked)
                        }
                        className="mt-1 size-4 shrink-0 border-purple-200 accent-liz focus:ring-liz"
                      />
                      <span className="text-sm font-medium text-slate-800">
                        Property Restraint
                      </span>
                    </label>
                    <p className="text-xs leading-relaxed text-slate-500">
                      Only check this if you are married or a registered domestic
                      partner with the person you want protection from.
                    </p>
                  </section>

                  <section className="space-y-4 border-t border-purple-100/90 pt-8">
                    <h2 className="text-sm font-semibold text-slate-900">
                      Section 21. Extend deadline to give notice
                    </h2>
                    <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-purple-100 bg-white px-4 py-3 shadow-sm transition hover:border-purple-200 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-liz/30">
                      <input
                        type="checkbox"
                        checked={form.extendNoticeDeadline}
                        onChange={(e) => {
                          const on = e.target.checked;
                          setForm((prev) => ({
                            ...prev,
                            extendNoticeDeadline: on,
                            ...(!on ? { extendNoticeExplain: "" } : {}),
                          }));
                        }}
                        className="mt-1 size-4 shrink-0 border-purple-200 accent-liz focus:ring-liz"
                      />
                      <span className="text-sm font-medium text-slate-800">
                        Extend my deadline to give notice
                      </span>
                    </label>
                    <p className="text-xs leading-relaxed text-slate-500">
                      {`Usually, the judge will give you about two weeks to give notice, or to 'serve' the person of your request. `}
                      If you need more time to serve, the judge may be able to
                      give you a few extra days.
                    </p>
                    {form.extendNoticeDeadline && (
                      <div>
                        <label
                          htmlFor="extendNoticeExplain"
                          className="text-sm font-medium text-slate-800"
                        >
                          Explain why you need more time
                        </label>
                        <textarea
                          id="extendNoticeExplain"
                          autoComplete="off"
                          maxLength={PAGE10_EXTEND_NOTICE_EXPLAIN_MAX}
                          value={form.extendNoticeExplain}
                          onChange={(e) =>
                            update("extendNoticeExplain", e.target.value)
                          }
                          className={textareaClass}
                        />
                        <p className="mt-1 text-xs text-slate-500">
                          {form.extendNoticeExplain.length} /{" "}
                          {PAGE10_EXTEND_NOTICE_EXPLAIN_MAX} characters
                        </p>
                      </div>
                    )}
                  </section>

                  <section className="space-y-4 border-t border-purple-100/90 pt-8">
                    <h2 className="text-sm font-semibold text-slate-900">
                      Section 22. Pay debts owed for property
                    </h2>
                    <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-purple-100 bg-white px-4 py-3 shadow-sm transition hover:border-purple-200 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-liz/30">
                      <input
                        type="checkbox"
                        checked={form.payDebtsForProperty}
                        onChange={(e) => {
                          if (e.target.checked) {
                            update("payDebtsForProperty", true);
                          } else {
                            resetPayDebtsForProperty();
                          }
                        }}
                        className="mt-1 size-4 shrink-0 border-purple-200 accent-liz focus:ring-liz"
                      />
                      <span className="text-sm font-medium text-slate-800">
                        Pay Debts (Bills) Owed for Property
                      </span>
                    </label>
                    <p className="text-xs leading-relaxed text-slate-500">
                      If you want the person to pay any debts owed for property,
                      list them and explain why. The amount can be for the entire
                      bill or only a portion. Some examples include rent,
                      mortgage, car payment, etc.
                    </p>

                    {form.payDebtsForProperty && (
                      <div className="space-y-6">
                        <div>
                          <h3 className="text-sm font-medium text-slate-800">
                            Debts (up to three)
                          </h3>
                          <div className="mt-3 overflow-x-auto rounded-xl border border-purple-100/80 bg-white shadow-sm">
                            <table className="w-full min-w-[36rem] text-left text-sm">
                              <thead>
                                <tr className="border-b border-purple-100 bg-purple-50/50 text-xs font-semibold uppercase tracking-wide text-purple-900/80">
                                  <th className="px-3 py-2.5">Debt</th>
                                  <th className="px-3 py-2.5">Pay to</th>
                                  <th className="px-3 py-2.5">For</th>
                                  <th className="px-3 py-2.5">Amount</th>
                                  <th className="px-3 py-2.5">Due date</th>
                                </tr>
                              </thead>
                              <tbody>
                                {form.payDebtsRows.map((row, idx) => (
                                  <tr
                                    key={`debt-${idx}`}
                                    className="border-b border-purple-100/80 last:border-b-0"
                                  >
                                    <td className="whitespace-nowrap px-3 py-3 text-xs font-medium text-slate-500">
                                      {idx + 1}
                                    </td>
                                    <td className="px-3 py-2 align-top">
                                      <label
                                        htmlFor={`debt-payto-${idx}`}
                                        className="sr-only"
                                      >
                                        Debt {idx + 1} pay to
                                      </label>
                                      <input
                                        id={`debt-payto-${idx}`}
                                        type="text"
                                        autoComplete="off"
                                        maxLength={PAGE10_DEBT_PAY_TO_MAX}
                                        value={row.payTo}
                                        onChange={(e) =>
                                          setForm((prev) => {
                                            const next = [...prev.payDebtsRows];
                                            next[idx] = {
                                              ...next[idx],
                                              payTo: e.target.value,
                                            };
                                            return { ...prev, payDebtsRows: next };
                                          })
                                        }
                                        className={inputClass}
                                      />
                                    </td>
                                    <td className="px-3 py-2 align-top">
                                      <label
                                        htmlFor={`debt-for-${idx}`}
                                        className="sr-only"
                                      >
                                        Debt {idx + 1} for
                                      </label>
                                      <input
                                        id={`debt-for-${idx}`}
                                        type="text"
                                        autoComplete="off"
                                        maxLength={PAGE10_DEBT_FOR_MAX}
                                        value={row.payFor}
                                        onChange={(e) =>
                                          setForm((prev) => {
                                            const next = [...prev.payDebtsRows];
                                            next[idx] = {
                                              ...next[idx],
                                              payFor: e.target.value,
                                            };
                                            return { ...prev, payDebtsRows: next };
                                          })
                                        }
                                        className={inputClass}
                                      />
                                    </td>
                                    <td className="px-3 py-2 align-top">
                                      <label
                                        htmlFor={`debt-amt-${idx}`}
                                        className="sr-only"
                                      >
                                        Debt {idx + 1} amount
                                      </label>
                                      <input
                                        id={`debt-amt-${idx}`}
                                        type="text"
                                        autoComplete="off"
                                        maxLength={PAGE10_DEBT_AMOUNT_MAX}
                                        value={row.amount}
                                        onChange={(e) =>
                                          setForm((prev) => {
                                            const next = [...prev.payDebtsRows];
                                            next[idx] = {
                                              ...next[idx],
                                              amount: e.target.value,
                                            };
                                            return { ...prev, payDebtsRows: next };
                                          })
                                        }
                                        className={inputClass}
                                      />
                                    </td>
                                    <td className="px-3 py-2 align-top">
                                      <label
                                        htmlFor={`debt-due-${idx}`}
                                        className="sr-only"
                                      >
                                        Debt {idx + 1} due date
                                      </label>
                                      <input
                                        id={`debt-due-${idx}`}
                                        type="text"
                                        autoComplete="off"
                                        maxLength={PAGE10_DEBT_DUE_MAX}
                                        value={row.dueDate}
                                        onChange={(e) =>
                                          setForm((prev) => {
                                            const next = [...prev.payDebtsRows];
                                            next[idx] = {
                                              ...next[idx],
                                              dueDate: e.target.value,
                                            };
                                            return { ...prev, payDebtsRows: next };
                                          })
                                        }
                                        className={inputClass}
                                      />
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>

                        <div>
                          <label
                            htmlFor="payDebtsExplain"
                            className="text-sm font-medium text-slate-800"
                          >
                            Explain why you want the person to pay the debts
                            listed above
                          </label>
                          <textarea
                            id="payDebtsExplain"
                            autoComplete="off"
                            maxLength={PAGE10_PAY_DEBTS_EXPLAIN_MAX}
                            value={form.payDebtsExplain}
                            onChange={(e) =>
                              update("payDebtsExplain", e.target.value)
                            }
                            className={textareaClass}
                          />
                          <p className="mt-1 text-xs text-slate-500">
                            {form.payDebtsExplain.length} /{" "}
                            {PAGE10_PAY_DEBTS_EXPLAIN_MAX} characters
                          </p>
                        </div>

                        <fieldset className="space-y-2 rounded-xl border border-purple-100/80 bg-purple-50/40 p-4">
                          <legend className="text-sm font-medium text-slate-800">
                            Special decision (finding) by the judge if you did
                            not agree to the debt (optional)
                          </legend>
                          <p className="text-xs leading-relaxed text-slate-500">
                            If you did not agree to the debt or debts listed
                            above, you can ask the judge to decide (find) that
                            one or more debts was made without your permission
                            and resulted from the abuse. This may help you defend
                            against the debt if you are sued in another case.
                          </p>
                          <div className="flex flex-col gap-2 pt-1">
                            <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-800">
                              <input
                                type="radio"
                                name="payDebtsSpecialDecision"
                                checked={form.payDebtsSpecialDecision === "yes"}
                                onChange={() =>
                                  setForm((prev) => ({
                                    ...prev,
                                    payDebtsSpecialDecision: "yes",
                                  }))
                                }
                                className="size-4 border-purple-200 accent-liz focus:ring-liz"
                              />
                              Yes
                            </label>
                            <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-800">
                              <input
                                type="radio"
                                name="payDebtsSpecialDecision"
                                checked={form.payDebtsSpecialDecision === "no"}
                                onChange={() =>
                                  setForm((prev) => ({
                                    ...prev,
                                    payDebtsSpecialDecision: "no",
                                    payDebtsAbuseDebt1: false,
                                    payDebtsAbuseDebt2: false,
                                    payDebtsAbuseDebt3: false,
                                    payDebtsKnowHow: "",
                                    payDebtsExplainHow: "",
                                  }))
                                }
                                className="size-4 border-purple-200 accent-liz focus:ring-liz"
                              />
                              No
                            </label>
                          </div>

                          {form.payDebtsSpecialDecision === "yes" && (
                            <div className="mt-4 space-y-4 border-t border-purple-200/60 pt-4">
                              <p className="text-sm font-medium text-slate-800">
                                Which of the debts listed above resulted from the
                                abuse?
                              </p>
                              <div className="space-y-2">
                                {(
                                  [
                                    {
                                      key: "payDebtsAbuseDebt1" as const,
                                      label: "Debt 1",
                                    },
                                    {
                                      key: "payDebtsAbuseDebt2" as const,
                                      label: "Debt 2",
                                    },
                                    {
                                      key: "payDebtsAbuseDebt3" as const,
                                      label: "Debt 3",
                                    },
                                  ] as const
                                ).map(({ key, label }) => (
                                  <label
                                    key={key}
                                    className="flex cursor-pointer items-center gap-2 text-sm text-slate-800"
                                  >
                                    <input
                                      type="checkbox"
                                      checked={Boolean(form[key])}
                                      onChange={(e) =>
                                        update(key, e.target.checked)
                                      }
                                      className="size-4 border-purple-200 accent-liz focus:ring-liz"
                                    />
                                    {label}
                                  </label>
                                ))}
                              </div>

                              <div>
                                <p className="text-sm font-medium text-slate-800">
                                  Do you know how the person made the debt or
                                  debts?
                                </p>
                                <div className="mt-2 flex flex-col gap-2">
                                  <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-800">
                                    <input
                                      type="radio"
                                      name="payDebtsKnowHow"
                                      checked={form.payDebtsKnowHow === "yes"}
                                      onChange={() =>
                                        setForm((prev) => ({
                                          ...prev,
                                          payDebtsKnowHow: "yes",
                                        }))
                                      }
                                      className="size-4 border-purple-200 accent-liz focus:ring-liz"
                                    />
                                    Yes
                                  </label>
                                  <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-800">
                                    <input
                                      type="radio"
                                      name="payDebtsKnowHow"
                                      checked={form.payDebtsKnowHow === "no"}
                                      onChange={() =>
                                        setForm((prev) => ({
                                          ...prev,
                                          payDebtsKnowHow: "no",
                                          payDebtsExplainHow: "",
                                        }))
                                      }
                                      className="size-4 border-purple-200 accent-liz focus:ring-liz"
                                    />
                                    No
                                  </label>
                                </div>
                              </div>

                              {form.payDebtsKnowHow === "yes" && (
                                <div>
                                  <label
                                    htmlFor="payDebtsExplainHow"
                                    className="text-sm font-medium text-slate-800"
                                  >
                                    Explain how they made the debt or debts
                                  </label>
                                  <textarea
                                    id="payDebtsExplainHow"
                                    autoComplete="off"
                                    maxLength={
                                      PAGE10_PAY_DEBTS_SPECIAL_EXPLAIN_MAX
                                    }
                                    value={form.payDebtsExplainHow}
                                    onChange={(e) =>
                                      update("payDebtsExplainHow", e.target.value)
                                    }
                                    className={textareaClass}
                                  />
                                  <p className="mt-1 text-xs text-slate-500">
                                    {form.payDebtsExplainHow.length} /{" "}
                                    {PAGE10_PAY_DEBTS_SPECIAL_EXPLAIN_MAX}{" "}
                                    characters
                                  </p>
                                </div>
                              )}
                            </div>
                          )}
                        </fieldset>
                      </div>
                    )}
                  </section>
                </div>
              )}

              {step === 11 && (
                <Page11SupportFeesRestitutionStep
                  form={form}
                  setForm={setForm}
                  inputClass={inputClass}
                />
              )}

              {step === 12 && (
                <Page12InterventionWirelessStep
                  form={form}
                  setForm={setForm}
                  inputClass={inputClass}
                />
              )}

              {step === 13 && (
                <SignatureStep
                  formData={form}
                  updateFormData={(patch: Partial<FormData>) =>
                    setForm((prev) => ({ ...prev, ...patch }))
                  }
                />
              )}

              {step === 14 && (
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
                          {display(personInfoToDisplayName(respondent))}
                        </p>
                        <p>
                          <span className="text-slate-500">Age:</span>{" "}
                          {display(respondent.age)}
                        </p>
                        <p>
                          <span className="text-slate-500">Date of birth:</span>{" "}
                          {display(respondent.dateOfBirth)}
                        </p>
                        <p>
                          <span className="text-slate-500">Gender:</span>{" "}
                          {display(respondent.gender)}
                        </p>
                        <p>
                          <span className="text-slate-500">Race:</span>{" "}
                          {display(respondent.race)}
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
                                {display(p.name)}; age {display(p.age)};
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

            <div className="mt-10 flex flex-col-reverse gap-3 sm:flex-row sm:justify-between sm:gap-4">
              <button
                type="button"
                onClick={goBack}
                disabled={!canGoBack}
                className="inline-flex min-h-12 items-center justify-center rounded-xl border border-purple-200 bg-white px-6 py-3 text-sm font-medium text-slate-800 shadow-sm transition hover:border-purple-300 hover:bg-purple-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Back
              </button>
              {isLastStep ? (
                <button
                  type="button"
                  onClick={handleGenerateForms}
                  disabled={pdfGenerating}
                  className="inline-flex min-h-12 items-center justify-center rounded-xl bg-liz px-8 py-3 text-sm font-medium text-white shadow-md shadow-liz/25 transition hover:bg-purple-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-liz disabled:cursor-not-allowed disabled:opacity-60 sm:ml-auto"
                >
                  {pdfGenerating ? "Generating…" : "Generate Forms"}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={goNext}
                  className="inline-flex min-h-12 items-center justify-center rounded-xl bg-liz px-8 py-3 text-sm font-medium text-white shadow-md shadow-liz/25 transition hover:bg-purple-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-liz sm:ml-auto"
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
