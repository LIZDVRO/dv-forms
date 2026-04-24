import { create } from "zustand";

// ── Shared Types ──────────────────────────────────────────────

export interface PersonAddress {
  street: string;
  city: string;
  state: string;
  zip: string;
}

export interface PersonInfo {
  firstName: string;
  middleName: string;
  lastName: string;
  age: string;
  dateOfBirth: string;
  gender: string;
  race: string;
  height: string;
  weight: string;
  hairColor: string;
  eyeColor: string;
  address: PersonAddress;
  telephone: string;
  email: string;
  speaksEnglish: "" | "yes" | "no" | "unknown";
  language: string;
}

export interface RespondentCLETSInfo {
  otherNamesUsed: string;
  marksScarsTattoos: string;
  driversLicense: string;
  driversLicenseState: string;
  ssn: string;
  employerNameAddress: string;
  vehicleType: string;
  vehicleModel: string;
  vehicleYear: string;
  vehiclePlate: string;
}

// ── DV-105 Custody Types ──────────────────────────────────────

export interface ChildInfo {
  fullName: string;
  dateOfBirth: string;
}

export interface ResidenceHistoryRow {
  dateFrom: string;
  dateUntil: string;
  cityState: string;
  addressConfidential: boolean;
  livedWithMe: boolean;
  livedWithPersonInItem2: boolean;
  livedWithOther: boolean;
  otherCaregiverRelationship: string;
}

export interface CustodyInfo {
  /** Petitioner's relationship to the children */
  petitionerRelationship: "" | "parent" | "legal_guardian" | "other";
  petitionerRelationshipOtherDesc: string;

  /** Respondent's relationship to the children */
  respondentRelationship: "" | "parent" | "legal_guardian" | "other";
  respondentRelationshipOtherDesc: string;

  /** Up to 4 children (overflow triggers attachment) */
  children: [ChildInfo, ChildInfo, ChildInfo, ChildInfo];
  childrenNeedMoreSpace: boolean;

  /** Did all children live together for the last 5 years? */
  allChildrenLivedTogether: "" | "yes" | "no";

  /** Up to 6 rows of residence history */
  residenceHistory: [
    ResidenceHistoryRow,
    ResidenceHistoryRow,
    ResidenceHistoryRow,
    ResidenceHistoryRow,
    ResidenceHistoryRow,
    ResidenceHistoryRow
  ];
}

// ── Store Shape ───────────────────────────────────────────────

export interface FormState {
  petitioner: PersonInfo;
  respondent: PersonInfo;
  respondentCLETS: RespondentCLETSInfo;
  custody: CustodyInfo;

  setPetitioner: (data: Partial<PersonInfo>) => void;
  setRespondent: (data: Partial<PersonInfo>) => void;
  setRespondentCLETS: (data: Partial<RespondentCLETSInfo>) => void;
  setCustody: (data: Partial<CustodyInfo>) => void;
  updateChild: (index: number, data: Partial<ChildInfo>) => void;
  updateResidenceRow: (index: number, data: Partial<ResidenceHistoryRow>) => void;
}

// ── Defaults ──────────────────────────────────────────────────

const emptyAddress: PersonAddress = {
  street: "",
  city: "",
  state: "",
  zip: "",
};

const initialPersonInfo: PersonInfo = {
  firstName: "",
  middleName: "",
  lastName: "",
  age: "",
  dateOfBirth: "",
  gender: "",
  race: "",
  height: "",
  weight: "",
  hairColor: "",
  eyeColor: "",
  address: { ...emptyAddress },
  telephone: "",
  email: "",
  speaksEnglish: "",
  language: "",
};

const initialRespondentCLETS: RespondentCLETSInfo = {
  otherNamesUsed: "",
  marksScarsTattoos: "",
  driversLicense: "",
  driversLicenseState: "",
  ssn: "",
  employerNameAddress: "",
  vehicleType: "",
  vehicleModel: "",
  vehicleYear: "",
  vehiclePlate: "",
};

const blankChild = (): ChildInfo => ({
  fullName: "",
  dateOfBirth: "",
});

const blankResidenceRow = (): ResidenceHistoryRow => ({
  dateFrom: "",
  dateUntil: "",
  cityState: "",
  addressConfidential: false,
  livedWithMe: false,
  livedWithPersonInItem2: false,
  livedWithOther: false,
  otherCaregiverRelationship: "",
});

const initialCustody: CustodyInfo = {
  petitionerRelationship: "",
  petitionerRelationshipOtherDesc: "",
  respondentRelationship: "",
  respondentRelationshipOtherDesc: "",
  children: [blankChild(), blankChild(), blankChild(), blankChild()],
  childrenNeedMoreSpace: false,
  allChildrenLivedTogether: "",
  residenceHistory: [
    blankResidenceRow(),
    blankResidenceRow(),
    blankResidenceRow(),
    blankResidenceRow(),
    blankResidenceRow(),
    blankResidenceRow(),
  ],
};

function blankPerson(): PersonInfo {
  return {
    ...initialPersonInfo,
    address: { ...initialPersonInfo.address },
  };
}

// ── Store ─────────────────────────────────────────────────────

export const useFormStore = create<FormState>((set) => ({
  petitioner: blankPerson(),
  respondent: blankPerson(),
  respondentCLETS: { ...initialRespondentCLETS },
  custody: { ...initialCustody },

  setPetitioner: (data) =>
    set((state) => ({
      petitioner: {
        ...state.petitioner,
        ...data,
        address: data.address
          ? { ...state.petitioner.address, ...data.address }
          : state.petitioner.address,
      },
    })),

  setRespondent: (data) =>
    set((state) => ({
      respondent: {
        ...state.respondent,
        ...data,
        address: data.address
          ? { ...state.respondent.address, ...data.address }
          : state.respondent.address,
      },
    })),

  setRespondentCLETS: (data) =>
    set((state) => ({
      respondentCLETS: {
        ...state.respondentCLETS,
        ...data,
      },
    })),

  setCustody: (data) =>
    set((state) => ({
      custody: {
        ...state.custody,
        ...data,
      },
    })),

  updateChild: (index, data) =>
    set((state) => {
      const updated = [...state.custody.children] as CustodyInfo["children"];
      updated[index] = { ...updated[index], ...data };
      return {
        custody: { ...state.custody, children: updated },
      };
    }),

  updateResidenceRow: (index, data) =>
    set((state) => {
      const updated = [...state.custody.residenceHistory] as CustodyInfo["residenceHistory"];
      updated[index] = { ...updated[index], ...data };
      return {
        custody: { ...state.custody, residenceHistory: updated },
      };
    }),
}));
