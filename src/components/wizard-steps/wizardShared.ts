import {
  type Dv100FirearmRow,
  type Dv100ProtectedAnimal,
  type Dv100ProtectedPerson,
  DV100_GENDER_OPTIONS,
} from "@/lib/dv100-pdf";
import type { PersonInfo } from "@/store/useFormStore";

/** Wizard step headings (15 steps), index-aligned with `form/page.tsx` step state. */
export const STEP_TITLES = [
  "Venue",
  "Legal Representation",
  "You (The Survivor)",
  "The Person Causing Harm",
  "The Children",
  "Other Protected People",
  "Existing Court Cases",
  "Describe the Abuse",
  "Firearms & Weapons",
  "Stay-Away & Move-Out",
  "Child Custody & Visitation",
  "Pets & Property",
  "Debts, Support & Fees",
  "Interventions & Cell Phones",
  "Sign & Generate",
] as const;

export const GENDER_OPTIONS = DV100_GENDER_OPTIONS;

export {
  COURT_ADDRESSES,
  WIZARD_COUNTY_OPTIONS,
  type WizardCountyOption,
} from "@/lib/courtAddresses";

export const PROTECTED_PEOPLE_WHY_MAX_LENGTH = 400;
export const HARM_DETAIL_MAX_LENGTH = 85;

export const MOVE_OUT_13A_MAX_LENGTH = 65;
export const MOVE_OUT_DURATION_MAX_LENGTH = 3;
export const MOVE_OUT_13B_OTHER_MAX_LENGTH = 400;
export const OTHER_ORDERS_14_MAX_LENGTH = 1000;
export const PAGE10_EXTEND_NOTICE_EXPLAIN_MAX = 300;
export const PAGE10_PAY_DEBTS_EXPLAIN_MAX = 300;
export const PAGE10_PAY_DEBTS_SPECIAL_EXPLAIN_MAX = 300;
export const PAGE10_DEBT_PAY_TO_MAX = 20;
export const PAGE10_DEBT_FOR_MAX = 20;
export const PAGE10_DEBT_AMOUNT_MAX = 10;
export const PAGE10_DEBT_DUE_MAX = 15;

export const invoiceFieldInputClassName =
  "mt-2 w-full rounded-none border-0 border-b border-gray-300 bg-white px-0 py-3 text-base text-slate-900 shadow-none outline-none ring-0 transition placeholder:text-slate-400 focus:border-[#662D91] focus:outline-none focus:ring-0 focus-visible:border-[#662D91] focus-visible:outline-none focus-visible:ring-0";

export const RELATIONSHIP_OPTIONS: { value: string; label: string }[] = [
  { value: "children", label: "We have a child or children together" },
  { value: "married", label: "We are married or registered domestic partners" },
  {
    value: "usedToBeMarried",
    label: "We used to be married or registered domestic partners",
  },
  { value: "dating", label: "We are dating or used to date" },
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

export const RELATED_TYPE_OPTIONS: { value: string; label: string }[] = [
  { value: "parent", label: "Parent/stepparent/parent-in-law" },
  { value: "child", label: "Child/stepchild/adopted child" },
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

export const CASE_TYPE_OPTIONS: { value: string; label: string }[] = [
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

export const CASE_TYPE_DETAIL_KEY: Partial<
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

/** DV-100 Section 5 — statutory examples shown above the "details of abuse" field. */
export const SECTION5_ABUSE_EXAMPLES = [
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

export function defaultProtectedPerson(): Dv100ProtectedPerson {
  return {
    name: "",
    age: "",
    relationship: "",
    livesWithYou: null,
    race: "",
    gender: "",
    dateOfBirth: "",
  };
}

export function defaultProtectedAnimal(): Dv100ProtectedAnimal {
  return { name: "", type: "", breed: "", color: "" };
}

export function initialProtectedAnimals(): Dv100ProtectedAnimal[] {
  return [
    defaultProtectedAnimal(),
    defaultProtectedAnimal(),
    defaultProtectedAnimal(),
    defaultProtectedAnimal(),
  ];
}

export function defaultFirearmRow(): Dv100FirearmRow {
  return { description: "", amount: "", location: "" };
}

export function toggleInList(list: string[], value: string): string[] {
  return list.includes(value) ? list.filter((x) => x !== value) : [...list, value];
}

export function personInfoToDisplayName(p: PersonInfo): string {
  return [p.firstName, p.middleName, p.lastName]
    .map((s) => s.trim())
    .filter(Boolean)
    .join(" ");
}

export function labelsForValues(
  values: string[],
  options: { value: string; label: string }[],
): string {
  if (values.length === 0) return "—";
  return values
    .map((v) => options.find((o) => o.value === v)?.label ?? v)
    .join(", ");
}

export function parseDisplayNameToPersonInfo(
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
