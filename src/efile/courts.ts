/**
 * Counties where the "File online now" (Rhetoric) panel appears, and the
 * Rhetoric court for each courthouse. Any county not listed keeps the Green
 * Filing link.
 *
 * Source: Rhetoric's list of live courts that accept a NEW Domestic Violence
 * Prevention case (Mustafa Moiz, Nov 11, 2026: ca_dv_prevention_support.xlsx).
 * Left out: Alameda and San Bernardino (no new DV cases), courthouses marked
 * "existing cases only" (e.g. Butte - Oroville, Contra Costa Family Law main,
 * LA Norwalk, SLO Grover Beach), and San Diego's child-support (DCSS) divisions.
 *
 * `verified`: checked on Rhetoric's test system (Nov 11, 2026 sweep,
 * scripts/rhetoric-sweep.ts): "New case", Family, both DV case types, and a
 * filing code for every form. Merced was also filed end to end. Not verified:
 * Santa Barbara - Lompoc (test offered only "Existing case"). Removed: San
 * Mateo's San Mateo courthouse (offered only Civil and Adoptions). Live court
 * lists can differ from test; a failed fill shows "Try again" and the LIZ
 * e-filing link. Only verified counties show the panel while
 * EFILE_ONLY_VERIFIED is true.
 */
export interface EfileCourt {
  code: string;
  label: string;
}
export interface EfileCounty {
  courts: EfileCourt[];
  verified?: boolean;
}

/** true: show the panel only for verified counties. */
export const EFILE_ONLY_VERIFIED = true;

export const EFILE_COURTS: Record<string, EfileCounty> = {
  Butte: { verified: true, courts: [{ code: "butte:chicfam", label: "Chico" }] },
  Calaveras: { verified: true, courts: [{ code: "calaveras:fam", label: "Family Law" }] },
  Colusa: { verified: true, courts: [{ code: "colusa:fam", label: "Family Law" }] },
  "Contra Costa": { verified: true, courts: [{ code: "contracosta:flmc", label: "Martinez" }] },
  Glenn: { verified: true, courts: [{ code: "glenn:fam", label: "Family Law" }] },
  "Los Angeles": { verified: true, courts: [
    { code: "losangeles:maavc", label: "Antelope Valley (Lancaster)" },
    { code: "losangeles:chatc", label: "Chatsworth" },
    { code: "losangeles:cc", label: "Compton" },
    { code: "losangeles:ggdc", label: "Governor George Deukmejian (Long Beach)" },
    { code: "losangeles:faming", label: "Inglewood" },
    { code: "losangeles:pc", label: "Pasadena" },
    { code: "losangeles:pcs", label: "Pomona South" },
    { code: "losangeles:smc", label: "Santa Monica" },
    { code: "losangeles:stanmc", label: "Stanley Mosk (downtown Los Angeles)" },
    { code: "losangeles:tc", label: "Torrance" },
    { code: "losangeles:vnce", label: "Van Nuys East" },
    { code: "losangeles:wc", label: "Whittier" },
  ] },
  Mariposa: { verified: true, courts: [{ code: "mariposa:fam", label: "Family Law" }] },
  Mendocino: { verified: true, courts: [
    { code: "mendocino:ufam", label: "Ukiah" },
    { code: "mendocino:tmfam", label: "Ten Mile (Fort Bragg)" },
  ] },
  Merced: { verified: true, courts: [
    { code: "merced:mercedfam", label: "Merced" },
    { code: "merced:losbanosfam", label: "Los Banos" },
  ] },
  Napa: { verified: true, courts: [{ code: "napa:fam", label: "Family Law" }] },
  Orange: { verified: true, courts: [{ code: "orange:dom", label: "Domestic Violence" }] },
  "San Diego": { verified: true, courts: [
    { code: "sandiego:fc", label: "Central" },
    { code: "sandiego:fe", label: "East (El Cajon)" },
    { code: "sandiego:fn", label: "North (Vista)" },
    { code: "sandiego:fs", label: "South (Chula Vista)" },
  ] },
  "San Luis Obispo": { verified: true, courts: [
    { code: "slo:slofam", label: "San Luis Obispo" },
    { code: "slo:prfam", label: "Paso Robles" },
  ] },
  "San Mateo": { verified: true, courts: [
    { code: "sanmateo:rcfam", label: "Redwood City" },
  ] },
  "Santa Barbara": { courts: [{ code: "santabarbara:lom", label: "Lompoc" }] },
  "Santa Clara": { verified: true, courts: [{ code: "santaclara:fam", label: "Family Law" }] },
  "Santa Cruz": { verified: true, courts: [{ code: "santacruz:fam", label: "Family Law" }] },
  Sonoma: { verified: true, courts: [{ code: "sonoma:fam", label: "Family Law" }] },
  Stanislaus: { verified: true, courts: [{ code: "stanislaus:fam", label: "Family Law" }] },
  Sutter: { verified: true, courts: [{ code: "sutter:fam", label: "Family Law" }] },
  Tehama: { verified: true, courts: [{ code: "tehama:fam", label: "Family Law" }] },
  Yuba: { verified: true, courts: [{ code: "yuba:fam", label: "Family Law" }] },
};

/** The county's e-filing courts, or undefined if the Rhetoric panel shouldn't appear. */
export function efileCountyFor(county: string): EfileCounty | undefined {
  const c = EFILE_COURTS[county];
  if (!c) return undefined;
  if (EFILE_ONLY_VERIFIED && !c.verified) return undefined;
  return c;
}

/** True when `code` is one of the county's listed courts (checked on the server too). */
export function isEfileCourt(county: string, code: string): boolean {
  return !!efileCountyFor(county)?.courts.some((c) => c.code === code);
}
