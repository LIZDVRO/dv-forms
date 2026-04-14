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
  address: PersonAddress;
  telephone: string;
  email: string;
}

export interface FormState {
  petitioner: PersonInfo;
  respondent: PersonInfo;

  setPetitioner: (data: Partial<PersonInfo>) => void;
  setRespondent: (data: Partial<PersonInfo>) => void;
}

const emptyAddress: PersonAddress = {
  street: "",
  city: "",
  state: "",
  zip: "",
};

function blankPerson(): PersonInfo {
  return {
    firstName: "",
    middleName: "",
    lastName: "",
    age: "",
    dateOfBirth: "",
    gender: "",
    race: "",
    address: { ...emptyAddress },
    telephone: "",
    email: "",
  };
}

export const useFormStore = create<FormState>((set) => ({
  petitioner: blankPerson(),
  respondent: blankPerson(),

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
}));
