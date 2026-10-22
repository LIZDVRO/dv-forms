/**
 * Sheriff civil units for the counties the wizard serves, and how each one takes a
 * service request electronically.
 *
 * The law: since Jan 1, 2026 every sheriff must accept SER-001 and the papers to serve
 * by email, fax, or in person (Gov. Code § 26666.5), must accept an electronic signature
 * (§ 26666), and may not charge a DV petitioner for the electronic transmission
 * (§ 26666.5(b)(2)). SER-001 and what is on it are confidential (§ 7927.430).
 *
 * Checked against each sheriff's civil page, Oct 16, 2026. Where `email` is null the
 * county has not published an address yet; call the civil unit, confirm the address
 * they use for § 26666.5 email requests, and add it here.
 */
/**
 * A county's online submission site. `separateFiles` means it has one upload box per
 * document, so SER-001, the signed order and the other papers go up as separate PDFs.
 */
export interface Portal {
  url: string;
  label: string;
  separateFiles?: boolean;
  /** Largest file the portal accepts, in MB. */
  maxFileMb?: number;
}

export interface SheriffOffice {
  county: string;
  name: string;
  /** Email for service requests, when the county has published one. */
  email: string | null;
  /** Online submission portal, for counties that use one instead of email. */
  portal?: Portal;
  fax: string;
  phone: string;
  /** Where to drop papers off in person. */
  address: string;
  /** Things this office asks for, in plain words. */
  notes: string[];
  /** When this entry was last checked. */
  checked: string;
}

export const SHERIFF_OFFICES: Record<string, SheriffOffice> = {
  Fresno: {
    county: "Fresno",
    name: "Fresno County Sheriff's Office, Civil Unit",
    // Email submissions ended Jan 20, 2026 (Civil Unit auto-reply, Oct 22, 2026).
    email: null,
    // Upload boxes and the 10 MB limit are from the portal's own code (wizard-step4.js), Oct 22, 2026.
    portal: { url: "https://civilconnect.fresnosheriff.org/Wizard", label: "Civil Connect", separateFiles: true, maxFileMb: 10 },
    fax: "559-600-8322",
    phone: "559-600-8230",
    address: "770 E. Shaw Ave., Suite 300, Fresno, CA 93710 (window open Mon, Wed, Fri, 9 a.m.–3 p.m.; mail: P.O. Box 45025, Fresno, CA 93718)",
    notes: [
      "Fresno takes electronic requests only through Civil Connect. It stopped taking them by email in January 2026.",
      "Your papers must have the court's seal and the judge's and clerk's signatures.",
      "If the judge ordered a move-out or a child handover, also call the Civil Unit at 559-600-8230, and submit early in the day.",
      "If the judge denied your temporary order, service may not be free. Call the Civil Unit before you submit.",
    ],
    checked: "2026-10-22",
  },
  Tulare: {
    county: "Tulare",
    name: "Tulare County Sheriff's Office, Civil Unit",
    email: "SheriffsCivil@tularecounty.ca.gov",
    fax: "559-713-3794",
    phone: "559-636-5090",
    address: "221 S. Mooney Blvd., Room 102, Visalia, CA 93291",
    notes: [],
    checked: "2026-10-16",
  },
  Kings: {
    county: "Kings",
    name: "Kings County Sheriff's Office, Civil Division",
    email: null,
    fax: "559-852-2841",
    phone: "559-852-2888",
    address: "1550 Kings County Drive, Hanford, CA 93230",
    notes: ["Kings asks for your papers at least 10 business days before the service deadline. Send them as soon as you get them."],
    checked: "2026-10-16",
  },
  Madera: {
    county: "Madera",
    name: "Madera County Sheriff's Office, Civil Division",
    email: null,
    fax: "559-675-8413",
    phone: "559-675-7737",
    address: "2725 Falcon Drive, Madera, CA 93637",
    notes: [],
    checked: "2026-10-16",
  },
  Merced: {
    county: "Merced",
    name: "Merced County Sheriff's Office, Civil Bureau",
    email: null,
    fax: "",
    phone: "209-385-7639",
    address: "777 W. 22nd Street, Merced, CA 95340",
    notes: [],
    checked: "2026-10-16",
  },
};

export const SHERIFF_COUNTIES = Object.keys(SHERIFF_OFFICES);
