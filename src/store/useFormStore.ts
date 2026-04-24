// src/store/useFormStore.ts
import { create } from "zustand";

/**
 * Sixteen Blueprint domains persisted on `FormState` (attorney → signature).
 */
export const BLUEPRINT_ENTITY_IDS = [
  "attorney",
  "petitioner",
  "respondent",
  "relationship",
  "children",
  "otherProtectedPeople",
  "courtHistory",
  "abuseIncidents",
  "firearms",
  "protectionOrders",
  "moveOut",
  "custodyOrders",
  "childSafety",
  "propertyAnimals",
  "financial",
  "signature",
] as const;

export type BlueprintEntityId = (typeof BLUEPRINT_ENTITY_IDS)[number];

// ══════════════════════════════════════════════════════════════
// SHARED TYPES
// ══════════════════════════════════════════════════════════════

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

// ══════════════════════════════════════════════════════════════
// BLUEPRINT ENTITY 1 — ATTORNEY
// ══════════════════════════════════════════════════════════════

export interface AttorneyInfo {
  hasAttorney: "" | "yes" | "no";
  name: string;
  barNumber: string;
  firmName: string;
  firmAddress: PersonAddress;
  firmPhone: string;
  firmEmail: string;
}

// ══════════════════════════════════════════════════════════════
// BLUEPRINT ENTITY 2 — PETITIONER (`PersonInfo` + extras, e.g. fax)
// ══════════════════════════════════════════════════════════════

export interface PetitionerExtras {
  fax: string;
}

export type PetitionerInfo = PersonInfo & PetitionerExtras;

// ══════════════════════════════════════════════════════════════
// BLUEPRINT ENTITY 3 — RESPONDENT (identity + CLETS/SER + safety)
// ══════════════════════════════════════════════════════════════

export interface RespondentSafetyFlags {
  onProbationOrParole: boolean;
  historyOfViolence: boolean;
  specialTraining: boolean; // military, first responder, etc.
  specialTrainingDetails: string;
  mentalHealthIssues: boolean;
  aggressiveAnimal: boolean;
  deafOrHardOfHearing: boolean;
  otherSafetyInfo: string;
}

export interface RespondentBundle {
  person: PersonInfo;
  clets: RespondentCLETSInfo;
  safety: RespondentSafetyFlags;
}

// ══════════════════════════════════════════════════════════════
// BLUEPRINT ENTITY 4 — RELATIONSHIP TO RESPONDENT
// ══════════════════════════════════════════════════════════════

export interface RelationshipInfo {
  childrenTogether: boolean;
  childrenNames: string; // for DV-100 Item 3a text field
  marriedOrRDP: boolean;
  formerlyMarriedOrRDP: boolean;
  datingOrFormerlyDating: boolean;
  engagedOrFormerlyEngaged: boolean;
  related: boolean;
  relatedType: string[]; // parent, sibling, child, grandparent, etc.
  liveTogetherOrUsedTo: boolean;
  livedAsFamily: "" | "yes" | "no";
}

// ══════════════════════════════════════════════════════════════
// BLUEPRINT ENTITY 5 — CHILDREN (expanded from existing CustodyInfo)
// ══════════════════════════════════════════════════════════════

export interface ChildInfo {
  fullName: string;
  dateOfBirth: string;
  age: string; // auto-calculated or entered
  gender: string; // for CLETS-001
  race: string; // for CLETS-001
  livesWithPetitioner: "" | "yes" | "no";
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

export interface ChildrenInfo {
  petitionerRelationship: "" | "parent" | "legalGuardian" | "other";
  petitionerRelationshipDescription: string;
  respondentRelationship: "" | "parent" | "legalGuardian" | "other";
  respondentRelationshipDescription: string;
  children: ChildInfo[];
  allChildrenLivedTogether: "" | "yes" | "no";
  residenceHistory: ResidenceHistoryRow[];
  otherParentExists: "" | "yes" | "no";
  otherParentName: string;
  otherParentType: "" | "parent" | "legalGuardian";
}

// ══════════════════════════════════════════════════════════════
// BLUEPRINT ENTITY 6 — OTHER PROTECTED PEOPLE
// ══════════════════════════════════════════════════════════════

export interface ProtectedPerson {
  fullName: string;
  age: string;
  gender: string; // for CLETS
  race: string; // for CLETS
  dateOfBirth: string; // for CLETS
  relationship: string;
  livesWithPetitioner: "" | "yes" | "no";
}

export interface OtherProtectedPeopleInfo {
  wantsProtectionForOthers: "" | "yes" | "no";
  people: ProtectedPerson[];
  whyProtectionNeeded: string;
}

// ══════════════════════════════════════════════════════════════
// BLUEPRINT ENTITY 7 — COURT HISTORY
// ══════════════════════════════════════════════════════════════

export interface RestrainingOrderRecord {
  dateOfOrder: string;
  dateExpires: string;
}

export interface CourtCaseRecord {
  caseType: string; // custody, divorce, juvenile, guardianship, criminal, other
  caseTypeOther: string;
  location: string; // city/state/tribe
  year: string;
  caseNumber: string;
}

export interface CourtHistoryInfo {
  hasRestrainingOrders: "" | "yes" | "no";
  restrainingOrders: RestrainingOrderRecord[];
  hasOtherCases: "" | "yes" | "no";
  otherCases: CourtCaseRecord[];
  // DV-105 overlap: existing custody orders
  hasExistingCustodyOrder: "" | "yes" | "no";
  existingCustodyOrderDetails: string;
  whyChangeCustodyOrder: string;
}

// ══════════════════════════════════════════════════════════════
// BLUEPRINT ENTITY 8 — ABUSE INCIDENTS
// ══════════════════════════════════════════════════════════════

export interface AbuseIncident {
  dateOfAbuse: string;
  witnesses: "" | "yes" | "no" | "dontKnow";
  witnessNames: string;
  weaponUsed: "" | "yes" | "no";
  weaponDescription: string;
  harmCaused: "" | "yes" | "no";
  harmDescription: string;
  policeCame: "" | "yes" | "no" | "dontKnow";
  narrative: string;
  frequency: "" | "once" | "2to5" | "weekly" | "other";
  frequencyOther: string;
  frequencyDates: string;
}

// ══════════════════════════════════════════════════════════════
// BLUEPRINT ENTITY 9 — FIREARMS
// ══════════════════════════════════════════════════════════════

export interface FirearmRow {
  description: string;
  numberOrAmount: string;
  location: string;
}

export interface FirearmsInfo {
  hasFirearms: "" | "yes" | "no" | "dontKnow";
  firearms: FirearmRow[];
}

// ══════════════════════════════════════════════════════════════
// BLUEPRINT ENTITY 10 — PROTECTION ORDERS (Stay-Away, No-Contact)
// ══════════════════════════════════════════════════════════════

export interface ProtectionOrdersInfo {
  /** DV-100 Section 10 — Order to not abuse */
  wantsOrderToNotAbuse: boolean;
  // Item 11: No-Contact
  wantsNoContact: boolean;
  // Item 12: Stay-Away
  wantsStayAway: boolean;
  stayAwayFrom: {
    me: boolean;
    myHome: boolean;
    myJob: boolean;
    myVehicle: boolean;
    mySchool: boolean;
    childrensSchool: boolean;
    eachProtectedPerson: boolean;
    other: boolean;
    otherDescription: string;
  };
  stayAwayDistance: "" | "100" | "other";
  stayAwayDistanceOther: string;
  liveTogether: "" | "yes" | "no";
  liveTogetherType: "" | "samehome" | "samebuilding" | "sameneighborhood" | "other";
  liveTogetherOther: string;
  sameWorkOrSchool: "" | "yes" | "no";
  sameWorkOrSchoolDetails: {
    workTogether: boolean;
    workCompanyName: string;
    sameSchool: boolean;
    schoolName: string;
    other: boolean;
    otherDescription: string;
  };
}

// ══════════════════════════════════════════════════════════════
// BLUEPRINT ENTITY 11 — MOVE-OUT & OTHER ORDERS
// ══════════════════════════════════════════════════════════════

export interface MoveOutInfo {
  wantsMoveOut: boolean;
  moveOutAddress: string;
  rightToLive: {
    ownHome: boolean;
    nameOnLease: boolean;
    payRentOrMortgage: boolean;
    liveWithChildren: boolean;
    yearsAtAddress: string;
    monthsAtAddress: string;
    other: boolean;
    otherDescription: string;
  };
  otherOrders: string; // free text, DV-100 Item 14
}

// ══════════════════════════════════════════════════════════════
// BLUEPRINT ENTITY 12 — CHILD CUSTODY & VISITATION (DV-105)
// ══════════════════════════════════════════════════════════════

export interface SupervisorInfo {
  type: "" | "professional" | "nonprofessional";
  name: string;
  hasAgreed: boolean; // nonprofessional only
  feePercentMe: string;
  feePercentThem: string;
  feePercentOther: string;
}

export interface VisitScheduleRow {
  day: string; // Monday-Sunday
  startTime: string;
  endTime: string;
  personResponsible: string;
  location: string;
}

export interface CustodyOrdersInfo {
  wantsCustodyOrders: "" | "yes" | "no";
  legalCustody: "" | "soleToMe" | "soleToThem" | "joint" | "other";
  legalCustodyOther: string;
  physicalCustody: "" | "soleToMe" | "soleToThem" | "joint" | "other";
  physicalCustodyOther: string;
  // Visitation
  visitationType: "" | "none" | "yes" | "virtualOnly";
  wantsSupervised: "" | "yes" | "no";
  // Supervised visit details (DV-105 Item 12)
  supervisedVisitSupervisor: SupervisorInfo;
  supervisedVisitLocation: "" | "inPerson" | "virtual" | "both";
  supervisedVisitFrequency: "" | "onceWeek" | "twiceWeek" | "other";
  supervisedVisitHours: string;
  supervisedVisitOtherFrequency: string;
  supervisedVisitSchedule: VisitScheduleRow[];
  supervisedVisitRecurrence: "" | "everyWeek" | "everyOtherWeek" | "other";
  supervisedVisitRecurrenceOther: string;
  supervisedVisitStartDate: string;
  // Unsupervised visit details (DV-105 Item 13)
  unsupervisedExchangeSupervised: "" | "yes" | "no";
  unsupervisedExchangeSupervisor: SupervisorInfo;
  unsupervisedVisitLocation: "" | "inPerson" | "virtual" | "both";
  unsupervisedVisitSchedule: VisitScheduleRow[];
  unsupervisedVisitRecurrence: "" | "everyWeek" | "everyOtherWeek" | "other";
  unsupervisedVisitRecurrenceOther: string;
  unsupervisedVisitStartDate: string;
  unsupervisedVisitOtherDetails: string;
}

// ══════════════════════════════════════════════════════════════
// BLUEPRINT ENTITY 13 — CHILD SAFETY (Travel, Records, Abduction)
// ══════════════════════════════════════════════════════════════

export interface ChildSafetyInfo {
  // Travel restrictions (DV-105 Item 6)
  wantsTravelLimits: "" | "yes" | "no";
  travelLimitCounty: string;
  travelLimitCalifornia: boolean;
  travelLimitOther: string;
  // Records access (DV-105 Item 7)
  wantsRecordsBlocked: "" | "yes" | "no";
  recordsBlockedForAll: boolean;
  recordsBlockedForSpecific: string; // child names
  recordsBlocked: {
    medical: boolean;
    school: boolean;
    extracurricular: boolean;
    employment: boolean;
    other: boolean;
    otherDescription: string;
  };
  // Abduction risk (DV-105 Item 8 -> DV-108)
  abductionRisk: "" | "yes" | "no";
  // DV-108 reasons
  abductionReasons: {
    violatedCustodyOrder: boolean;
    noStrongTiesToCA: boolean;
    quitJob: boolean;
    appliedForPassport: boolean;
    appliedForBirthCert: boolean;
    closedBankAccount: boolean;
    hiddenDocuments: boolean;
    soldProperty: boolean;
    soldHomeEndedLease: boolean;
    otherRecentActions: boolean;
    otherRecentActionsDescription: string;
    historyAbuseOfMe: boolean;
    historyTakingChildren: boolean;
    historyAbuseOfOthers: boolean;
    historyChildAbuse: boolean;
    historyThreatsToTake: boolean;
    historyNonCooperation: boolean;
    criminalRecord: boolean;
    strongTiesOtherCounty: string;
    strongTiesOtherState: string;
    strongTiesOtherCountry: string;
    foreignCitizen: boolean;
    foreignCitizenCountry: string;
    foreignCitizenStrongTies: "" | "yes" | "no";
    explanationOfReasons: string;
  };
  // DV-108 orders requested
  abductionOrders: {
    noMoveWithoutPermission: boolean;
    turnInPassports: boolean;
    turnInPassportsDate: string;
    turnInPassportsTo: string;
    provideTravelPlan: boolean;
    travelPlanSchedule: boolean;
    travelPlanTickets: boolean;
    travelPlanAddresses: boolean;
    travelPlanOpenTicket: boolean;
    travelPlanOther: string;
    notifyOtherState: boolean;
    notifyOtherStateLocation: string;
    notifyEmbassy: boolean;
    notifyEmbassyName: string;
    notifyEmbassyProofDate: string;
    foreignCustodyOrder: boolean;
    foreignCustodyOrderCountry: string;
    postBond: boolean;
    postBondAmount: string;
  };
}

// ══════════════════════════════════════════════════════════════
// BLUEPRINT ENTITY 14 — ANIMALS, PROPERTY & INSURANCE
// ══════════════════════════════════════════════════════════════

export interface AnimalRow {
  name: string;
  type: string;
  breed: string;
  color: string;
}

export interface PropertyAnimalsInfo {
  // Animals (DV-100 Item 16)
  wantsAnimalProtection: boolean;
  animals: AnimalRow[];
  animalStayAwayDistance: "" | "100" | "other";
  animalStayAwayDistanceOther: string;
  animalNoHarm: boolean;
  animalSolePossession: boolean;
  animalSolePossessionReasons: {
    respondentAbuses: boolean;
    iCareForThem: boolean;
    iPurchasedThem: boolean;
    other: boolean;
    otherDescription: string;
  };
  // Property control (DV-100 Item 17)
  wantsPropertyControl: boolean;
  propertyDescription: string;
  propertyWhyControl: string;
  // Insurance (DV-100 Item 18)
  wantsInsuranceOrder: boolean;
  // Record communications (DV-100 Item 19)
  wantsRecordCommunications: boolean;
}

// ══════════════════════════════════════════════════════════════
// BLUEPRINT ENTITY 15a — DV-100 MONEY / SUPPORT / SERVICE REQUESTS
// ══════════════════════════════════════════════════════════════

export interface DebtRow {
  payTo: string;
  forWhat: string;
  amount: string;
  dueDate: string;
}

export interface RestitutionRow {
  payTo: string;
  forWhat: string;
  amount: string;
}

export interface WirelessAccountRow {
  phoneNumber: string;
  isMyNumber: boolean;
}

export interface FinancialRequestsInfo {
  // Property restraint (DV-100 Item 20, married/RDP only)
  wantsPropertyRestraint: boolean;
  // Debts (DV-100 Item 22)
  wantsDebtPayment: boolean;
  debts: DebtRow[];
  debtExplanation: string;
  debtSpecialFinding: "" | "yes" | "no";
  debtSpecialFindingWhich: { debt1: boolean; debt2: boolean; debt3: boolean };
  debtSpecialFindingKnowHow: "" | "yes" | "no";
  debtSpecialFindingExplanation: string;
  // Restitution (DV-100 Item 23)
  wantsRestitution: boolean;
  restitutionExpenses: RestitutionRow[];
  // Child support (DV-100 Item 24)
  wantsChildSupport: "" | "noOrderWantOne" | "haveOrderWantChange" | "no";
  receivingTANF: boolean;
  // Spousal support (DV-100 Item 25, married/RDP only)
  wantsSpousalSupport: boolean;
  // Lawyer fees (DV-100 Item 26)
  wantsLawyerFees: boolean;
  // Batterer intervention (DV-100 Item 27)
  wantsBattererIntervention: boolean;
  // Wireless transfer (DV-100 Item 28)
  wantsWirelessTransfer: boolean;
  wirelessAccounts: WirelessAccountRow[];
  // Extra service time (DV-100 Item 21)
  wantsExtraServiceTime: boolean;
  extraServiceTimeExplanation: string;
}

// ══════════════════════════════════════════════════════════════
// BLUEPRINT ENTITY 15b — FINANCIAL DECLARATION (FL-150 / FL-155)
// ══════════════════════════════════════════════════════════════

export interface EmploymentInfo {
  employer: string;
  employerAddress: string;
  employerPhone: string;
  occupation: string;
  dateStarted: string;
  dateEnded: string; // if unemployed
  hoursPerWeek: string;
  payAmount: string;
  payPeriod: "" | "month" | "week" | "hour";
}

export interface FinancialDeclarationInfo {
  // Auto-routed: FL-150 or FL-155
  formType: "" | "fl150" | "fl155";
  // Shared fields (both forms)
  employment: EmploymentInfo;
  taxFilingStatus: "" | "single" | "headOfHousehold" | "marriedSeparate" | "marriedJoint";
  taxJointSpouseName: string;
  publicAssistanceOnly: boolean;
  appliedForPublicAssistance: boolean;
  // Income sources (simplified for FL-155, detailed for FL-150)
  incomeSalary: string;
  incomeRetirement: string;
  incomeUnemployment: string;
  incomeWorkersComp: string;
  incomeSocialSecurity: string;
  incomeDisability: string;
  incomeInterest: string;
  incomeOther: string;
  incomeOtherDescription: string;
  // Children time split
  percentTimeWithMe: string;
  percentTimeWithOtherParent: string;
  custodyArrangementDescription: string;
  // Children expenses
  childExpenseDaycare: string;
  childExpenseHealthcare: string;
  childExpenseSchool: string;
  childExpenseTravel: string;
  // Deductions
  deductionJobExpenses: string;
  deductionUnionDues: string;
  deductionRetirement: string;
  deductionHealthInsurance: string;
  deductionChildSupportOther: string;
  deductionSpousalSupportOther: string;
  deductionHousing: string;
  deductionHousingInterest: string;
  deductionHousingTaxes: string;
  // Other party estimate
  otherPartyGrossMonthly: string;
  otherPartyEstimateBasis: string;
  // Spouse income (FL-155 only)
  currentSpouseIncome: string;
  // ── FL-150 ONLY fields below ──
  // Education (FL-150 Item 2)
  educationHighSchool: "" | "yes" | "no";
  educationHighestGrade: string;
  educationCollegeYears: string;
  educationCollegeDegrees: string;
  educationGradYears: string;
  educationGradDegrees: string;
  educationLicenses: string;
  educationVocational: string;
  // Tax details (FL-150 Item 3)
  taxLastYearFiled: string;
  taxState: string;
  taxExemptions: string;
  // Detailed income (FL-150 Item 5 - last month + avg monthly)
  incomeDetailedOvertime: string;
  incomeDetailedCommissions: string;
  incomeDetailedPublicAssistance: string;
  incomeDetailedSpousalSupport: string;
  incomeDetailedSpousalSupportSource: "" | "thisMarriage" | "otherMarriage";
  incomeDetailedSpousalSupportTaxable: boolean;
  incomeDetailedPartnerSupport: string;
  incomeDetailedPension: string;
  // Investment income (FL-150 Item 6)
  investmentDividends: string;
  investmentRental: string;
  investmentTrust: string;
  investmentOther: string;
  // Self-employment (FL-150 Item 7)
  selfEmployed: boolean;
  selfEmploymentRole: "" | "owner" | "partner" | "other";
  selfEmploymentRoleOther: string;
  selfEmploymentYears: string;
  selfEmploymentBusinessName: string;
  selfEmploymentBusinessType: string;
  selfEmploymentIncome: string;
  // One-time income (FL-150 Item 8)
  oneTimeIncome: string;
  // Income changes (FL-150 Item 9)
  incomeChanges: string;
  // Assets (FL-150 Item 11)
  assetsCash: string;
  assetsStocks: string;
  assetsProperty: string;
  // Household members (FL-150 Item 12, up to 5)
  householdMembers: {
    name: string;
    age: string;
    relationship: string;
    grossMonthlyIncome: string;
    paysExpenses: "" | "yes" | "no";
  }[];
  // Monthly expenses (FL-150 Item 13, 17 categories)
  expenseRent: string;
  expensePrincipal: string;
  expenseInterest: string;
  expensePropertyTax: string;
  expenseHomeInsurance: string;
  expenseMaintenance: string;
  expenseHealthcare: string;
  expenseChildcare: string;
  expenseGroceries: string;
  expenseEatingOut: string;
  expenseUtilities: string;
  expensePhone: string;
  expenseLaundry: string;
  expenseClothes: string;
  expenseEducation: string;
  expenseEntertainment: string;
  expenseAuto: string;
  expenseLifeInsurance: string;
  expenseSavings: string;
  expenseCharitable: string;
  expenseOther: string;
  expenseOtherDescription: string;
  expensePaidByOthers: string;
  // Installment debts (FL-150 Item 14)
  installmentDebts: {
    paidTo: string;
    forWhat: string;
    amount: string;
    balance: string;
    lastPaymentDate: string;
  }[];
  // Attorney fees (FL-150 Item 15)
  attorneyFeesPaid: string;
  attorneyFeesSource: string;
  attorneyFeesOwed: string;
  attorneyHourlyRate: string;
  // Children health insurance (FL-150 Item 17)
  childHealthInsuranceAvailable: "" | "yes" | "no";
  childHealthInsuranceCompany: string;
  childHealthInsuranceAddress: string;
  childHealthInsuranceCost: string;
  // Special hardships (FL-150 Item 19)
  hardshipHealth: string;
  hardshipLosses: string;
  hardshipOtherChildrenExpenses: string;
  hardshipOtherChildrenNames: string;
  hardshipOtherChildrenSupport: string;
  hardshipExplanation: string;
  // Other info (FL-150 Item 20)
  otherCourtInfo: string;
}

// ══════════════════════════════════════════════════════════════
// BLUEPRINT ENTITY 16 — SIGNATURE
// ══════════════════════════════════════════════════════════════

export interface SignatureInfo {
  perjuryDeclared: boolean;
  signatureDataUrl: string; // base64 from signature pad
  signatureDate: string;
  lawyerSignatureDataUrl: string;
  lawyerSignatureDate: string;
}

/** Blueprint entity 15 — nested: DV-100 financial requests + FL-150/155 declaration. */
export interface FinancialBundle {
  requests: FinancialRequestsInfo;
  declaration: FinancialDeclarationInfo;
}

// ══════════════════════════════════════════════════════════════
// MASTER FORM STATE — one slice per `BlueprintEntityId`
// ══════════════════════════════════════════════════════════════

export interface FormState {
  // ── Entities (16 Blueprint domains) ──
  attorney: AttorneyInfo;
  petitioner: PetitionerInfo;
  respondent: RespondentBundle;
  relationship: RelationshipInfo;
  children: ChildrenInfo;
  otherProtectedPeople: OtherProtectedPeopleInfo;
  courtHistory: CourtHistoryInfo;
  abuseIncidents: AbuseIncident[];
  firearms: FirearmsInfo;
  protectionOrders: ProtectionOrdersInfo;
  moveOut: MoveOutInfo;
  custodyOrders: CustodyOrdersInfo;
  childSafety: ChildSafetyInfo;
  propertyAnimals: PropertyAnimalsInfo;
  financial: FinancialBundle;
  signature: SignatureInfo;

  // ── Setters ──
  setAttorney: (data: Partial<AttorneyInfo>) => void;
  setPetitioner: (data: Partial<PetitionerInfo>) => void;
  setRespondentPerson: (data: Partial<PersonInfo>) => void;
  setRespondentCLETS: (data: Partial<RespondentCLETSInfo>) => void;
  setRespondentSafety: (data: Partial<RespondentSafetyFlags>) => void;
  setRelationship: (data: Partial<RelationshipInfo>) => void;
  setChildren: (data: Partial<ChildrenInfo>) => void;
  updateChild: (index: number, data: Partial<ChildInfo>) => void;
  updateResidenceRow: (index: number, data: Partial<ResidenceHistoryRow>) => void;
  setOtherProtectedPeople: (data: Partial<OtherProtectedPeopleInfo>) => void;
  updateProtectedPerson: (index: number, data: Partial<ProtectedPerson>) => void;
  setCourtHistory: (data: Partial<CourtHistoryInfo>) => void;
  setAbuseIncident: (index: number, data: Partial<AbuseIncident>) => void;
  setFirearms: (data: Partial<FirearmsInfo>) => void;
  setProtectionOrders: (data: Partial<ProtectionOrdersInfo>) => void;
  setMoveOut: (data: Partial<MoveOutInfo>) => void;
  setCustodyOrders: (data: Partial<CustodyOrdersInfo>) => void;
  setChildSafety: (data: Partial<ChildSafetyInfo>) => void;
  setPropertyAnimals: (data: Partial<PropertyAnimalsInfo>) => void;
  setFinancialRequests: (data: Partial<FinancialRequestsInfo>) => void;
  setFinancialDeclaration: (data: Partial<FinancialDeclarationInfo>) => void;
  setSignature: (data: Partial<SignatureInfo>) => void;

  // ── Computed / Routing Helpers ──
  hasChildren: () => boolean;
  isMarriedOrRDP: () => boolean;
  needsFinancialDeclaration: () => boolean;
  needsFL150: () => boolean;
}

// ══════════════════════════════════════════════════════════════
// INITIAL VALUES
// ══════════════════════════════════════════════════════════════

const emptyAddress: PersonAddress = { street: "", city: "", state: "", zip: "" };

const initialPersonInfo: PersonInfo = {
  firstName: "", middleName: "", lastName: "",
  age: "", dateOfBirth: "", gender: "", race: "",
  height: "", weight: "", hairColor: "", eyeColor: "",
  address: { ...emptyAddress },
  telephone: "", email: "",
  speaksEnglish: "", language: "",
};

const initialRespondentCLETS: RespondentCLETSInfo = {
  otherNamesUsed: "", marksScarsTattoos: "",
  driversLicense: "", driversLicenseState: "",
  ssn: "", employerNameAddress: "",
  vehicleType: "", vehicleModel: "", vehicleYear: "", vehiclePlate: "",
};

const initialAttorney: AttorneyInfo = {
  hasAttorney: "",
  name: "", barNumber: "", firmName: "",
  firmAddress: { ...emptyAddress },
  firmPhone: "", firmEmail: "",
};

const initialRespondentSafety: RespondentSafetyFlags = {
  onProbationOrParole: false, historyOfViolence: false,
  specialTraining: false, specialTrainingDetails: "",
  mentalHealthIssues: false, aggressiveAnimal: false,
  deafOrHardOfHearing: false, otherSafetyInfo: "",
};

const initialRelationship: RelationshipInfo = {
  childrenTogether: false, childrenNames: "",
  marriedOrRDP: false, formerlyMarriedOrRDP: false,
  datingOrFormerlyDating: false, engagedOrFormerlyEngaged: false,
  related: false, relatedType: [],
  liveTogetherOrUsedTo: false, livedAsFamily: "",
};

const blankChild = (): ChildInfo => ({
  fullName: "", dateOfBirth: "", age: "", gender: "", race: "", livesWithPetitioner: "",
});

const blankResidenceRow = (): ResidenceHistoryRow => ({
  dateFrom: "", dateUntil: "", cityState: "", addressConfidential: false,
  livedWithMe: false, livedWithPersonInItem2: false,
  livedWithOther: false, otherCaregiverRelationship: "",
});

const initialChildren: ChildrenInfo = {
  petitionerRelationship: "", petitionerRelationshipDescription: "",
  respondentRelationship: "", respondentRelationshipDescription: "",
  children: [blankChild(), blankChild(), blankChild(), blankChild()],
  allChildrenLivedTogether: "",
  residenceHistory: [
    blankResidenceRow(), blankResidenceRow(), blankResidenceRow(),
    blankResidenceRow(), blankResidenceRow(), blankResidenceRow(),
  ],
  otherParentExists: "", otherParentName: "", otherParentType: "",
};

const initialOtherProtectedPeople: OtherProtectedPeopleInfo = {
  wantsProtectionForOthers: "",
  people: [
    { fullName: "", age: "", gender: "", race: "", dateOfBirth: "", relationship: "", livesWithPetitioner: "" },
    { fullName: "", age: "", gender: "", race: "", dateOfBirth: "", relationship: "", livesWithPetitioner: "" },
    { fullName: "", age: "", gender: "", race: "", dateOfBirth: "", relationship: "", livesWithPetitioner: "" },
    { fullName: "", age: "", gender: "", race: "", dateOfBirth: "", relationship: "", livesWithPetitioner: "" },
    { fullName: "", age: "", gender: "", race: "", dateOfBirth: "", relationship: "", livesWithPetitioner: "" },
  ],
  whyProtectionNeeded: "",
};

const initialCourtHistory: CourtHistoryInfo = {
  hasRestrainingOrders: "",
  restrainingOrders: [{ dateOfOrder: "", dateExpires: "" }, { dateOfOrder: "", dateExpires: "" }],
  hasOtherCases: "",
  otherCases: [{ caseType: "", caseTypeOther: "", location: "", year: "", caseNumber: "" }],
  hasExistingCustodyOrder: "",
  existingCustodyOrderDetails: "",
  whyChangeCustodyOrder: "",
};

const blankAbuseIncident = (): AbuseIncident => ({
  dateOfAbuse: "", witnesses: "", witnessNames: "",
  weaponUsed: "", weaponDescription: "",
  harmCaused: "", harmDescription: "",
  policeCame: "", narrative: "",
  frequency: "", frequencyOther: "", frequencyDates: "",
});

const initialFirearms: FirearmsInfo = {
  hasFirearms: "",
  firearms: [
    { description: "", numberOrAmount: "", location: "" },
    { description: "", numberOrAmount: "", location: "" },
    { description: "", numberOrAmount: "", location: "" },
    { description: "", numberOrAmount: "", location: "" },
    { description: "", numberOrAmount: "", location: "" },
    { description: "", numberOrAmount: "", location: "" },
  ],
};

const initialProtectionOrders: ProtectionOrdersInfo = {
  wantsOrderToNotAbuse: false,
  wantsNoContact: false,
  wantsStayAway: false,
  stayAwayFrom: {
    me: false, myHome: false, myJob: false, myVehicle: false,
    mySchool: false, childrensSchool: false, eachProtectedPerson: false,
    other: false, otherDescription: "",
  },
  stayAwayDistance: "", stayAwayDistanceOther: "",
  liveTogether: "", liveTogetherType: "", liveTogetherOther: "",
  sameWorkOrSchool: "",
  sameWorkOrSchoolDetails: {
    workTogether: false, workCompanyName: "",
    sameSchool: false, schoolName: "",
    other: false, otherDescription: "",
  },
};

const initialMoveOut: MoveOutInfo = {
  wantsMoveOut: false, moveOutAddress: "",
  rightToLive: {
    ownHome: false, nameOnLease: false, payRentOrMortgage: false,
    liveWithChildren: false, yearsAtAddress: "", monthsAtAddress: "",
    other: false, otherDescription: "",
  },
  otherOrders: "",
};

const blankSupervisor = (): SupervisorInfo => ({
  type: "", name: "", hasAgreed: false,
  feePercentMe: "", feePercentThem: "", feePercentOther: "",
});

const initialCustodyOrders: CustodyOrdersInfo = {
  wantsCustodyOrders: "",
  legalCustody: "", legalCustodyOther: "",
  physicalCustody: "", physicalCustodyOther: "",
  visitationType: "", wantsSupervised: "",
  supervisedVisitSupervisor: blankSupervisor(),
  supervisedVisitLocation: "", supervisedVisitFrequency: "",
  supervisedVisitHours: "", supervisedVisitOtherFrequency: "",
  supervisedVisitSchedule: [],
  supervisedVisitRecurrence: "", supervisedVisitRecurrenceOther: "",
  supervisedVisitStartDate: "",
  unsupervisedExchangeSupervised: "",
  unsupervisedExchangeSupervisor: blankSupervisor(),
  unsupervisedVisitLocation: "",
  unsupervisedVisitSchedule: [],
  unsupervisedVisitRecurrence: "", unsupervisedVisitRecurrenceOther: "",
  unsupervisedVisitStartDate: "", unsupervisedVisitOtherDetails: "",
};

const initialChildSafety: ChildSafetyInfo = {
  wantsTravelLimits: "", travelLimitCounty: "",
  travelLimitCalifornia: false, travelLimitOther: "",
  wantsRecordsBlocked: "", recordsBlockedForAll: false, recordsBlockedForSpecific: "",
  recordsBlocked: {
    medical: false, school: false, extracurricular: false,
    employment: false, other: false, otherDescription: "",
  },
  abductionRisk: "",
  abductionReasons: {
    violatedCustodyOrder: false, noStrongTiesToCA: false,
    quitJob: false, appliedForPassport: false, appliedForBirthCert: false,
    closedBankAccount: false, hiddenDocuments: false, soldProperty: false,
    soldHomeEndedLease: false, otherRecentActions: false, otherRecentActionsDescription: "",
    historyAbuseOfMe: false, historyTakingChildren: false, historyAbuseOfOthers: false,
    historyChildAbuse: false, historyThreatsToTake: false, historyNonCooperation: false,
    criminalRecord: false,
    strongTiesOtherCounty: "", strongTiesOtherState: "", strongTiesOtherCountry: "",
    foreignCitizen: false, foreignCitizenCountry: "", foreignCitizenStrongTies: "",
    explanationOfReasons: "",
  },
  abductionOrders: {
    noMoveWithoutPermission: false,
    turnInPassports: false, turnInPassportsDate: "", turnInPassportsTo: "",
    provideTravelPlan: false, travelPlanSchedule: false, travelPlanTickets: false,
    travelPlanAddresses: false, travelPlanOpenTicket: false, travelPlanOther: "",
    notifyOtherState: false, notifyOtherStateLocation: "",
    notifyEmbassy: false, notifyEmbassyName: "", notifyEmbassyProofDate: "",
    foreignCustodyOrder: false, foreignCustodyOrderCountry: "",
    postBond: false, postBondAmount: "",
  },
};

const initialPropertyAnimals: PropertyAnimalsInfo = {
  wantsAnimalProtection: false,
  animals: [
    { name: "", type: "", breed: "", color: "" },
    { name: "", type: "", breed: "", color: "" },
    { name: "", type: "", breed: "", color: "" },
    { name: "", type: "", breed: "", color: "" },
  ],
  animalStayAwayDistance: "", animalStayAwayDistanceOther: "",
  animalNoHarm: false, animalSolePossession: false,
  animalSolePossessionReasons: {
    respondentAbuses: false, iCareForThem: false, iPurchasedThem: false,
    other: false, otherDescription: "",
  },
  wantsPropertyControl: false, propertyDescription: "", propertyWhyControl: "",
  wantsInsuranceOrder: false, wantsRecordCommunications: false,
};

const initialFinancialRequests: FinancialRequestsInfo = {
  wantsPropertyRestraint: false,
  wantsDebtPayment: false,
  debts: [
    { payTo: "", forWhat: "", amount: "", dueDate: "" },
    { payTo: "", forWhat: "", amount: "", dueDate: "" },
    { payTo: "", forWhat: "", amount: "", dueDate: "" },
  ],
  debtExplanation: "",
  debtSpecialFinding: "", debtSpecialFindingWhich: { debt1: false, debt2: false, debt3: false },
  debtSpecialFindingKnowHow: "", debtSpecialFindingExplanation: "",
  wantsRestitution: false,
  restitutionExpenses: [
    { payTo: "", forWhat: "", amount: "" },
    { payTo: "", forWhat: "", amount: "" },
    { payTo: "", forWhat: "", amount: "" },
    { payTo: "", forWhat: "", amount: "" },
  ],
  wantsChildSupport: "no", receivingTANF: false,
  wantsSpousalSupport: false, wantsLawyerFees: false,
  wantsBattererIntervention: false,
  wantsWirelessTransfer: false,
  wirelessAccounts: [
    { phoneNumber: "", isMyNumber: true },
    { phoneNumber: "", isMyNumber: true },
    { phoneNumber: "", isMyNumber: true },
    { phoneNumber: "", isMyNumber: true },
  ],
  wantsExtraServiceTime: false, extraServiceTimeExplanation: "",
};

const initialFinancialDeclaration: FinancialDeclarationInfo = {
  formType: "",
  employment: { employer: "", employerAddress: "", employerPhone: "", occupation: "", dateStarted: "", dateEnded: "", hoursPerWeek: "", payAmount: "", payPeriod: "" },
  taxFilingStatus: "", taxJointSpouseName: "",
  publicAssistanceOnly: false, appliedForPublicAssistance: false,
  incomeSalary: "", incomeRetirement: "", incomeUnemployment: "",
  incomeWorkersComp: "", incomeSocialSecurity: "", incomeDisability: "",
  incomeInterest: "", incomeOther: "", incomeOtherDescription: "",
  percentTimeWithMe: "", percentTimeWithOtherParent: "", custodyArrangementDescription: "",
  childExpenseDaycare: "", childExpenseHealthcare: "", childExpenseSchool: "", childExpenseTravel: "",
  deductionJobExpenses: "", deductionUnionDues: "", deductionRetirement: "",
  deductionHealthInsurance: "", deductionChildSupportOther: "", deductionSpousalSupportOther: "",
  deductionHousing: "", deductionHousingInterest: "", deductionHousingTaxes: "",
  otherPartyGrossMonthly: "", otherPartyEstimateBasis: "", currentSpouseIncome: "",
  educationHighSchool: "", educationHighestGrade: "", educationCollegeYears: "",
  educationCollegeDegrees: "", educationGradYears: "", educationGradDegrees: "",
  educationLicenses: "", educationVocational: "",
  taxLastYearFiled: "", taxState: "", taxExemptions: "",
  incomeDetailedOvertime: "", incomeDetailedCommissions: "", incomeDetailedPublicAssistance: "",
  incomeDetailedSpousalSupport: "", incomeDetailedSpousalSupportSource: "",
  incomeDetailedSpousalSupportTaxable: false, incomeDetailedPartnerSupport: "",
  incomeDetailedPension: "",
  investmentDividends: "", investmentRental: "", investmentTrust: "", investmentOther: "",
  selfEmployed: false, selfEmploymentRole: "", selfEmploymentRoleOther: "",
  selfEmploymentYears: "", selfEmploymentBusinessName: "", selfEmploymentBusinessType: "",
  selfEmploymentIncome: "", oneTimeIncome: "", incomeChanges: "",
  assetsCash: "", assetsStocks: "", assetsProperty: "",
  householdMembers: [],
  expenseRent: "", expensePrincipal: "", expenseInterest: "", expensePropertyTax: "",
  expenseHomeInsurance: "", expenseMaintenance: "", expenseHealthcare: "", expenseChildcare: "",
  expenseGroceries: "", expenseEatingOut: "", expenseUtilities: "", expensePhone: "",
  expenseLaundry: "", expenseClothes: "", expenseEducation: "", expenseEntertainment: "",
  expenseAuto: "", expenseLifeInsurance: "", expenseSavings: "", expenseCharitable: "",
  expenseOther: "", expenseOtherDescription: "", expensePaidByOthers: "",
  installmentDebts: [],
  attorneyFeesPaid: "", attorneyFeesSource: "", attorneyFeesOwed: "", attorneyHourlyRate: "",
  childHealthInsuranceAvailable: "", childHealthInsuranceCompany: "",
  childHealthInsuranceAddress: "", childHealthInsuranceCost: "",
  hardshipHealth: "", hardshipLosses: "", hardshipOtherChildrenExpenses: "",
  hardshipOtherChildrenNames: "", hardshipOtherChildrenSupport: "", hardshipExplanation: "",
  otherCourtInfo: "",
};

const initialSignature: SignatureInfo = {
  perjuryDeclared: false,
  signatureDataUrl: "", signatureDate: "",
  lawyerSignatureDataUrl: "", lawyerSignatureDate: "",
};

// ══════════════════════════════════════════════════════════════
// HELPERS
// ══════════════════════════════════════════════════════════════

function blankPerson(): PersonInfo {
  return { ...initialPersonInfo, address: { ...initialPersonInfo.address } };
}

function blankPetitioner(): PetitionerInfo {
  return { ...blankPerson(), fax: "" };
}

function deepMerge<T extends object>(target: T, source: Partial<T>): T {
  const result = { ...target } as T;
  for (const key of Object.keys(source) as (keyof T)[]) {
    const val = source[key];
    if (val !== undefined && val !== null && typeof val === "object" && !Array.isArray(val)) {
      result[key] = deepMerge(target[key] as object, val as object) as T[keyof T];
    } else if (val !== undefined) {
      result[key] = val as T[keyof T];
    }
  }
  return result;
}

// ══════════════════════════════════════════════════════════════
// STORE
// ══════════════════════════════════════════════════════════════

export const useFormStore = create<FormState>((set, get) => ({
  // ── Initial State ──
  attorney: { ...initialAttorney, firmAddress: { ...emptyAddress } },
  petitioner: blankPetitioner(),
  respondent: {
    person: blankPerson(),
    clets: { ...initialRespondentCLETS },
    safety: { ...initialRespondentSafety },
  },
  relationship: { ...initialRelationship },
  children: {
    ...initialChildren,
    children: initialChildren.children.map(() => blankChild()),
    residenceHistory: initialChildren.residenceHistory.map(() => blankResidenceRow()),
  },
  otherProtectedPeople: {
    ...initialOtherProtectedPeople,
    people: initialOtherProtectedPeople.people.map((p) => ({ ...p })),
  },
  courtHistory: { ...initialCourtHistory },
  abuseIncidents: [blankAbuseIncident(), blankAbuseIncident(), blankAbuseIncident()],
  firearms: {
    ...initialFirearms,
    firearms: initialFirearms.firearms.map((f) => ({ ...f })),
  },
  protectionOrders: {
    ...initialProtectionOrders,
    stayAwayFrom: { ...initialProtectionOrders.stayAwayFrom },
    sameWorkOrSchoolDetails: { ...initialProtectionOrders.sameWorkOrSchoolDetails },
  },
  moveOut: {
    ...initialMoveOut,
    rightToLive: { ...initialMoveOut.rightToLive },
  },
  custodyOrders: { ...initialCustodyOrders },
  childSafety: { ...initialChildSafety },
  propertyAnimals: {
    ...initialPropertyAnimals,
    animals: initialPropertyAnimals.animals.map((a) => ({ ...a })),
    animalSolePossessionReasons: { ...initialPropertyAnimals.animalSolePossessionReasons },
  },
  financial: {
    requests: {
      ...initialFinancialRequests,
      debts: initialFinancialRequests.debts.map((d) => ({ ...d })),
      restitutionExpenses: initialFinancialRequests.restitutionExpenses.map((r) => ({ ...r })),
      wirelessAccounts: initialFinancialRequests.wirelessAccounts.map((w) => ({ ...w })),
    },
    declaration: {
      ...initialFinancialDeclaration,
      employment: { ...initialFinancialDeclaration.employment },
    },
  },
  signature: { ...initialSignature },

  // ── Setters ──
  setAttorney: (data) =>
    set((s) => ({ attorney: deepMerge(s.attorney, data) })),

  setPetitioner: (data) =>
    set((s) => ({
      petitioner: {
        ...s.petitioner,
        ...data,
        address: data.address
          ? { ...s.petitioner.address, ...data.address }
          : s.petitioner.address,
      },
    })),

  setRespondentPerson: (data) =>
    set((s) => ({
      respondent: {
        ...s.respondent,
        person: {
          ...s.respondent.person,
          ...data,
          address: data.address
            ? { ...s.respondent.person.address, ...data.address }
            : s.respondent.person.address,
        },
      },
    })),

  setRespondentCLETS: (data) =>
    set((s) => ({
      respondent: {
        ...s.respondent,
        clets: { ...s.respondent.clets, ...data },
      },
    })),

  setRespondentSafety: (data) =>
    set((s) => ({
      respondent: {
        ...s.respondent,
        safety: { ...s.respondent.safety, ...data },
      },
    })),

  setRelationship: (data) =>
    set((s) => ({ relationship: { ...s.relationship, ...data } })),

  setChildren: (data) =>
    set((s) => ({ children: deepMerge(s.children, data) })),

  updateChild: (index, data) =>
    set((s) => {
      const updated = [...s.children.children];
      updated[index] = { ...updated[index], ...data };
      return { children: { ...s.children, children: updated } };
    }),

  updateResidenceRow: (index, data) =>
    set((s) => {
      const updated = [...s.children.residenceHistory];
      updated[index] = { ...updated[index], ...data };
      return { children: { ...s.children, residenceHistory: updated } };
    }),

  setOtherProtectedPeople: (data) =>
    set((s) => ({ otherProtectedPeople: deepMerge(s.otherProtectedPeople, data) })),

  updateProtectedPerson: (index, data) =>
    set((s) => {
      const updated = [...s.otherProtectedPeople.people];
      updated[index] = { ...updated[index], ...data };
      return { otherProtectedPeople: { ...s.otherProtectedPeople, people: updated } };
    }),

  setCourtHistory: (data) =>
    set((s) => ({ courtHistory: { ...s.courtHistory, ...data } })),

  setAbuseIncident: (index, data) =>
    set((s) => {
      const updated = [...s.abuseIncidents];
      updated[index] = { ...updated[index], ...data };
      return { abuseIncidents: updated };
    }),

  setFirearms: (data) =>
    set((s) => ({ firearms: { ...s.firearms, ...data } })),

  setProtectionOrders: (data) =>
    set((s) => ({ protectionOrders: deepMerge(s.protectionOrders, data) })),

  setMoveOut: (data) =>
    set((s) => ({ moveOut: deepMerge(s.moveOut, data) })),

  setCustodyOrders: (data) =>
    set((s) => ({ custodyOrders: deepMerge(s.custodyOrders, data) })),

  setChildSafety: (data) =>
    set((s) => ({ childSafety: deepMerge(s.childSafety, data) })),

  setPropertyAnimals: (data) =>
    set((s) => ({ propertyAnimals: deepMerge(s.propertyAnimals, data) })),

  setFinancialRequests: (data) =>
    set((s) => ({
      financial: {
        ...s.financial,
        requests: deepMerge(s.financial.requests, data),
      },
    })),

  setFinancialDeclaration: (data) =>
    set((s) => ({
      financial: {
        ...s.financial,
        declaration: deepMerge(s.financial.declaration, data),
      },
    })),

  setSignature: (data) =>
    set((s) => ({ signature: { ...s.signature, ...data } })),

  // ── Computed / Routing Helpers ──
  hasChildren: () => {
    const r = get().relationship;
    return r.childrenTogether;
  },

  isMarriedOrRDP: () => {
    const r = get().relationship;
    return r.marriedOrRDP || r.formerlyMarriedOrRDP;
  },

  needsFinancialDeclaration: () => {
    const f = get().financial.requests;
    return (
      f.wantsChildSupport !== "no" ||
      f.wantsSpousalSupport ||
      f.wantsLawyerFees
    );
  },

  needsFL150: () => {
    const f = get().financial.requests;
    const fd = get().financial.declaration;
    return (
      fd.selfEmployed ||
      f.wantsSpousalSupport ||
      f.wantsLawyerFees ||
      (fd.incomeOther !== "" && fd.incomeOther !== "0")
    );
  },
}));