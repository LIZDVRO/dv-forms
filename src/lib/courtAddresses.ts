/** Superior Court locations for form captions (Fresno / Kings / Tulare). */
export const COURT_ADDRESSES: Record<string, string> = {
  Fresno: "1130 O Street\nFresno, CA 93724",
  Kings: "1640 Kings County Drive\nHanford, CA 93230",
  Tulare: "221 S Mooney Blvd\nVisalia, CA 93291",
};

export const WIZARD_COUNTY_OPTIONS = ["Fresno", "Kings", "Tulare"] as const;
export type WizardCountyOption = (typeof WIZARD_COUNTY_OPTIONS)[number];
