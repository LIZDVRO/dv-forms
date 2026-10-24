/**
 * Sheriff civil units for the counties the wizard serves, plus neighboring counties where
 * the other person may live (service happens where they are), and how each one takes a
 * service request electronically.
 *
 * The law: since Jan 1, 2026 every sheriff must accept SER-001 and the papers to serve
 * by email, fax, or in person (Gov. Code § 26666.5), must accept an electronic signature
 * (§ 26666), and may not charge a DV petitioner for the electronic transmission
 * (§ 26666.5(b)(2)). SER-001 and what is on it are confidential (§ 7927.430).
 *
 * Only counties with a confirmed electronic path (an email address or a portal) are listed;
 * the page offers no others. Add a county once its sheriff publishes or confirms the address
 * it uses for § 26666.5 email requests. Each entry says when and where it was checked.
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
  /** Words the office asks to start the email subject with (Sonoma: "TRO"). */
  subjectPrefix?: string;
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
    // Rechecked Oct 22, 2026: still the address on the civil page; no portal, and nothing says email submissions changed.
    email: "SheriffsCivil@tularecounty.ca.gov",
    fax: "559-713-3794",
    phone: "559-636-5090",
    address: "221 S. Mooney Blvd., Room 102, Visalia, CA 93291 (Visalia Courthouse; open Mon 8 a.m.–noon, Tue–Fri 8 a.m.–4 p.m.)",
    notes: [
      // Tulare's site also posts a "SER-001 Supplemental Questionnaire". It's built for evictions, and a sheriff
      // can't require any form besides the Judicial Council's (Gov. Code § 26666.10(d)), so it isn't asked for here.
      "Tulare's website also has a SER-001 Supplemental Questionnaire. You don't need it for a restraining order: your SER-001 has everything the sheriff needs.",
    ],
    checked: "2026-10-22",
  },
  Kings: {
    county: "Kings",
    name: "Kings County Sheriff's Office, Civil Division",
    // Not on Kings' website. The Civil Division gave this address for DV restraining orders by phone, Oct 22, 2026.
    email: "kcso.civil@co.kings.ca.us",
    fax: "559-852-2841",
    phone: "559-852-2888",
    address: "1550 Kings County Drive, Hanford, CA 93230",
    notes: ["Kings asks for your papers at least 10 business days before the service deadline. Send them as soon as you get them."],
    checked: "2026-10-22",
  },
  Merced: {
    county: "Merced",
    name: "Merced County Sheriff's Office, Civil Bureau",
    // Listed on the Civil Bureau page; the Civil Bureau confirmed by phone, Oct 23, 2026, that DV
    // restraining order requests can be emailed here. (Merced also has a Tyler "Online Service Request"
    // portal, but it requires creating an account, so email is the path offered.)
    email: "MercedSheriffCivil@countyofmerced.com",
    fax: "",
    phone: "209-385-7639",
    address: "777 W. 22nd Street, Merced, CA 95340",
    notes: [],
    checked: "2026-10-23",
  },
  // Not one of LIZ's filing counties, but borders Tulare and Kings, so the other person may live there.
  Kern: {
    county: "Kern",
    name: "Kern County Sheriff's Office, Civil Section",
    // From the Civil Processing Unit page (kernsheriff.org/civil-processing-unit), Oct 22, 2026.
    email: "Civil@KernSheriff.org",
    fax: "661-392-6768",
    phone: "661-392-6750",
    address: "34970 McMurtrey Ave., 2nd Floor, Bakersfield, CA 93308 (open Mon–Fri, 8 a.m.–5 p.m.; drop box open 24 hours)",
    notes: [],
    checked: "2026-10-22",
  },

  // The counties below each say on their own civil page that they take service requests by email
  // (checked Oct 23, 2026). They are listed because the other person may live there.
  "San Bernardino": {
    county: "San Bernardino",
    name: "San Bernardino County Sheriff's Department, Civil Division",
    // "We accept service requests in person, by mail, email, or fax." (wp.sbcounty.gov/sheriff/corrections/civil-process-services)
    email: "civildocs@sbcsd.org",
    fax: "909-387-5630",
    phone: "909-387-5700",
    address: "157 W. 5th Street, 3rd Floor, San Bernardino, CA 92415",
    notes: [],
    checked: "2026-10-23",
  },
  "San Francisco": {
    county: "San Francisco",
    name: "San Francisco Sheriff's Office, Civil Unit",
    // "We accept service requests in person, by mail or electronically … sfso.civilfiling@sfgov.org" (sfsheriff.com/services/civil-section).
    // Its $1.35/page printing fee can't be charged to a DV petitioner (Gov. Code § 26666.5(b)(2)).
    email: "sfso.civilfiling@sfgov.org",
    fax: "",
    phone: "415-554-7235",
    address: "City Hall, Room 456, 1 Dr. Carlton B. Goodlett Place, San Francisco, CA 94102",
    notes: [
      "San Francisco's website mentions a printing fee for emailed papers. It doesn't apply to domestic violence restraining orders (Gov. Code § 26666.5(b)(2)).",
    ],
    checked: "2026-10-23",
  },
  "Santa Clara": {
    county: "Santa Clara",
    name: "Santa Clara County Sheriff's Office, Civil Unit",
    // Takes "electronic service requests" by email, as PDFs, since Jan 1, 2026
    // (sheriff.santaclaracounty.gov/services/civil-services/civil-division-services-and-fees).
    // Its $1.25/page fee for emailed papers can't be charged to a DV petitioner (§ 26666.5(b)(2)).
    email: "civil.sheriff@shf.sccgov.org",
    fax: "408-998-0636",
    phone: "408-808-4800",
    address: "55 West Younger Avenue, 2nd Floor, San Jose, CA 95110 (open Mon–Thu, 9 a.m.–3 p.m.)",
    notes: [
      "Santa Clara's website mentions a per-page fee for emailed papers. It doesn't apply to domestic violence restraining orders (Gov. Code § 26666.5(b)(2)).",
    ],
    checked: "2026-10-23",
  },
  Sonoma: {
    county: "Sonoma",
    name: "Sonoma County Sheriff's Office, Civil Bureau",
    // TROs by email, fax or in person; subject line "TRO" and the case number
    // (sonomasheriff.org/s/Methods-of-TRO-Submittal-instructions-website-ey7c.pdf). That PDF gives the old
    // sonoma-county.org address; the Civil Bureau page now shows the sonomacounty.gov one (Oct 23, 2026).
    email: "Sheriff-Civil@sonomacounty.gov",
    subjectPrefix: "TRO",
    fax: "707-526-0403",
    phone: "707-565-2751",
    address: "2796 Ventura Avenue, Santa Rosa, CA 95403",
    notes: [],
    checked: "2026-10-23",
  },
  "El Dorado": {
    county: "El Dorado",
    name: "El Dorado County Sheriff's Office, Civil Unit",
    // "Welcome to our online civil service submission page! … submit your packet … here" (eldoradocounty.ca.gov/…/support_services/civil).
    email: "edsocivil@eldoradosheriff.gov",
    fax: "",
    phone: "530-621-5665",
    address: "200 Industrial Drive, Placerville, CA 95667 (South Lake Tahoe: 1360 Johnson Blvd., 530-573-3014)",
    notes: [],
    checked: "2026-10-23",
  },
  Nevada: {
    county: "Nevada",
    name: "Nevada County Sheriff's Office, Civil Services",
    // "If the fee is waived for service, the documents, instruction letter and fee waiver may be … emailed to
    // civil@nevadacountyca.gov." (nevadacountyca.gov/3891). DV service is free by law (Fam. Code § 6383(b)(3)).
    email: "civil@nevadacountyca.gov",
    fax: "530-470-0439",
    phone: "530-265-1220",
    address: "950 Maidu Ave., #280, Nevada City, CA 95959",
    notes: [],
    checked: "2026-10-23",
  },
  Tehama: {
    county: "Tehama",
    name: "Tehama County Sheriff's Office, Civil Division",
    // "Documents can be sent to: civil@tehamaso.org" (tehamaso.org/civil-division).
    email: "civil@tehamaso.org",
    fax: "",
    phone: "530-529-7930",
    address: "22840 Antelope Blvd., Red Bluff, CA 96080",
    notes: ["Tehama asks you to call the Civil Division at 530-529-7930 before you send papers for the first time."],
    checked: "2026-10-23",
  },
};

/** Alphabetical, for the county picker. */
export const SHERIFF_COUNTIES = Object.keys(SHERIFF_OFFICES).sort();
