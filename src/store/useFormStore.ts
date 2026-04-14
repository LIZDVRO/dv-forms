import { create } from 'zustand';

// 1. This defines what a "Person" looks like in our app
export interface PersonInfo {
  firstName: string;
  middleName: string;
  lastName: string;
}

// 2. This defines the overall shape of our entire global state
export interface FormState {
  petitioner: PersonInfo;
  respondent: PersonInfo;
  
  // These are the actions we'll use to update the data
  setPetitioner: (data: Partial<PersonInfo>) => void;
  setRespondent: (data: Partial<PersonInfo>) => void;
}

// 3. Blank default values so the form starts empty
const initialPersonInfo: PersonInfo = {
  firstName: '',
  middleName: '',
  lastName: '',
};

// 4. This actually creates the global store!
export const useFormStore = create<FormState>((set) => ({
  // Set the starting state
  petitioner: { ...initialPersonInfo },
  respondent: { ...initialPersonInfo },

  // Create the update functions
  setPetitioner: (data) =>
    set((state) => ({ petitioner: { ...state.petitioner, ...data } })),
  
  setRespondent: (data) =>
    set((state) => ({ respondent: { ...state.respondent, ...data } })),
}));
