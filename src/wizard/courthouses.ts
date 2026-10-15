/**
 * Courthouses that handle civil domestic violence restraining orders (map: S1 + S2).
 * Each entry was confirmed against that court's own DV filing instructions (Oct 2026).
 * Counties not listed here print the county name only in the caption.
 */
export interface Courthouse {
  id: string;
  name: string;
  street: string;
  city: string;
  zip: string;
}

export const COURTHOUSES: Record<string, Courthouse[]> = {
  Fresno: [{ id: "sisk", name: "B.F. Sisk Courthouse", street: "1130 O Street", city: "Fresno", zip: "93721" }],
  Kings: [{ id: "hanford", name: "Kings County Superior Court", street: "1640 Kings County Drive", city: "Hanford", zip: "93230" }],
  Madera: [{ id: "main", name: "Main Courthouse, Civil Division", street: "200 South G Street", city: "Madera", zip: "93637" }],
  Merced: [{ id: "merced", name: "Merced County Superior Court", street: "2260 N Street", city: "Merced", zip: "95340" }],
  Tulare: [
    { id: "visalia", name: "Visalia Courthouse", street: "221 S. Mooney Blvd, Room 201", city: "Visalia", zip: "93291" },
    { id: "porterville", name: "South County Justice Center", street: "300 E. Olive Ave", city: "Porterville", zip: "93257" },
  ],
};

/** The courthouse for the answers: the only one in the county, or the one chosen (S2). */
export function courthouseFor(county: string, branchId: string): Courthouse | undefined {
  const list = COURTHOUSES[county];
  if (!list?.length) return undefined;
  return list.length === 1 ? list[0] : list.find((c) => c.id === branchId);
}
