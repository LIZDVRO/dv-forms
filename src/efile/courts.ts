/**
 * Counties where the "File online now" (Rhetoric) panel appears, and the
 * Rhetoric court for each courthouse. Any county not listed keeps the Green
 * Filing link. Source: Rhetoric's LIVE court list, read Nov 10, 2026 (family
 * law or domestic violence courts only; child support, Family Court Services,
 * adoptions and civil-harassment courts left out).
 *
 * `verified` means the whole path (new case, DV case type, parties, forms,
 * fee waiver) has been confirmed for that court. Merced so far.
 * Listed is not the same as accepting a NEW DV case (in test, Fresno Family
 * listed only "Existing case"), so verify each county before going live, or
 * turn on only the verified ones with EFILE_ONLY_VERIFIED below.
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
  Alameda: { courts: [
    { code: "alameda:fam", label: "Family Law (main)" },
    { code: "alameda:famala", label: "Alameda" },
    { code: "alameda:famhay", label: "Hayward" },
  ] },
  Butte: { courts: [{ code: "butte:chicfam", label: "Chico" }] },
  Calaveras: { courts: [{ code: "calaveras:fam", label: "Family Law" }] },
  Colusa: { courts: [{ code: "colusa:fam", label: "Family Law" }] },
  "Contra Costa": { courts: [
    { code: "contracosta:fl", label: "Family Law (main)" },
    { code: "contracosta:flmc", label: "Martinez" },
  ] },
  Glenn: { courts: [{ code: "glenn:fam", label: "Family Law" }] },
  "Los Angeles": { courts: [
    { code: "losangeles:maavc", label: "Antelope Valley" },
    { code: "losangeles:chatc", label: "Chatsworth" },
    { code: "losangeles:cc", label: "Compton" },
    { code: "losangeles:ggdc", label: "Governor George Deukmejian (Long Beach)" },
    { code: "losangeles:faming", label: "Inglewood" },
    { code: "losangeles:pc", label: "Pasadena" },
    { code: "losangeles:pcs", label: "Pomona South" },
    { code: "losangeles:smc", label: "Santa Monica" },
    { code: "losangeles:stanmc", label: "Stanley Mosk (SMC)" },
    { code: "losangeles:tc", label: "Torrance" },
    { code: "losangeles:vnce", label: "Van Nuys East" },
    { code: "losangeles:wc", label: "Whittier" },
  ] },
  Mariposa: { courts: [{ code: "mariposa:fam", label: "Family Law" }] },
  Mendocino: { courts: [
    { code: "mendocino:ufam", label: "Ukiah" },
    { code: "mendocino:tmfam", label: "Ten Mile (Fort Bragg)" },
  ] },
  Merced: { verified: true, courts: [
    { code: "merced:mercedfam", label: "Merced" },
    { code: "merced:losbanosfam", label: "Los Banos" },
  ] },
  Napa: { courts: [{ code: "napa:fam", label: "Family Law" }] },
  Orange: { courts: [
    { code: "orange:dom", label: "Domestic Violence" },
    { code: "orange:of", label: "Other Family" },
  ] },
  "San Bernardino": { courts: [
    { code: "sanbernardino:fam", label: "Family Law (main)" },
    { code: "sanbernardino:famsanber", label: "San Bernardino" },
    { code: "sanbernardino:fambar", label: "Barstow" },
    { code: "sanbernardino:famjotr", label: "Joshua Tree" },
    { code: "sanbernardino:famneedles", label: "Needles" },
    { code: "sanbernardino:famvict", label: "Victorville" },
  ] },
  "San Diego": { courts: [
    { code: "sandiego:fc", label: "Central" },
    { code: "sandiego:fe", label: "East" },
    { code: "sandiego:fn", label: "North" },
    { code: "sandiego:fs", label: "South" },
  ] },
  "San Luis Obispo": { courts: [
    { code: "slo:slofam", label: "San Luis Obispo" },
    { code: "slo:prfam", label: "Paso Robles" },
    { code: "slo:gbfam", label: "Grover Beach" },
  ] },
  "San Mateo": { courts: [
    { code: "sanmateo:rcfam", label: "Redwood City" },
    { code: "sanmateo:smfam", label: "San Mateo" },
  ] },
  "Santa Barbara": { courts: [{ code: "santabarbara:lom", label: "Lompoc" }] },
  "Santa Clara": { courts: [{ code: "santaclara:fam", label: "Family Law" }] },
  "Santa Cruz": { courts: [{ code: "santacruz:fam", label: "Family Law" }] },
  Sonoma: { courts: [{ code: "sonoma:fam", label: "Family Law" }] },
  Stanislaus: { courts: [{ code: "stanislaus:fam", label: "Family Law" }] },
  Sutter: { courts: [{ code: "sutter:fam", label: "Family Law" }] },
  Tehama: { courts: [{ code: "tehama:fam", label: "Family Law" }] },
  Yuba: { courts: [{ code: "yuba:fam", label: "Family Law" }] },
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
