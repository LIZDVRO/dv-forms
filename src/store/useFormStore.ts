import { create } from "zustand";

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
  /** Driver license number */
  driversLicense: string;
  /** Licensing state */
  driversLicenseState: string;
  ssn: string;
  employerNameAddress: string;
  vehicleType: string;
  vehicleModel: string;
  vehicleYear: string;
  vehiclePlate: string;
}

export interface FormState {
  petitioner: PersonInfo;
  respondent: PersonInfo;
  respondentCLETS: RespondentCLETSInfo;

  setPetitioner: (data: Partial<PersonInfo>) => void;
  setRespondent: (data: Partial<PersonInfo>) => void;
  setRespondentCLETS: (data: Partial<RespondentCLETSInfo>) => void;
}

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

function blankPerson(): PersonInfo {
  return {
    ...initialPersonInfo,
    address: { ...initialPersonInfo.address },
  };
}

export const useFormStore = create<FormState>((set) => ({
  petitioner: blankPerson(),
  respondent: blankPerson(),
  respondentCLETS: { ...initialRespondentCLETS },

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
}));
