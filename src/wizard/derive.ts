/**
 * Values that are calculated, never asked (map: "Derived, never asked").
 */
import { courthouseFor } from "./courthouses";
import type { Address, Answers, RosterPerson } from "./types";

/** ISO date → MM/DD/YYYY, the Judicial Council format. Text passes through. */
export function fmtDate(iso: string | undefined): string {
  if (!iso) return "";
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso.trim());
  return m ? `${m[2]}/${m[3]}/${m[1]}` : iso;
}

/** Whole years between an ISO date of birth and an ISO "as of" date. */
export function ageFrom(dobIso: string, asOfIso: string): string {
  const d = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dobIso ?? "");
  const a = /^(\d{4})-(\d{2})-(\d{2})$/.exec(asOfIso ?? "");
  if (!d || !a) return "";
  let age = +a[1] - +d[1];
  if (+a[2] < +d[2] || (+a[2] === +d[2] && +a[3] < +d[3])) age -= 1;
  return age >= 0 ? String(age) : "";
}

export function personAge(p: RosterPerson, asOf: string): string {
  return p.dob ? ageFrom(p.dob, asOf) : p.age;
}

/** Amount for a form that pre-prints "$": no currency sign, two decimals. */
export function money(v: string): string {
  const n = Number(String(v ?? "").replace(/[$,\s]/g, ""));
  if (!v || Number.isNaN(n)) return v ?? "";
  return n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function oneLine(a: Address | string): string {
  if (typeof a === "string") return a.replace(/\s*\n\s*/g, ", ");
  const cityLine = [a.city, [a.state, a.zip].filter(Boolean).join(" ")].filter(Boolean).join(", ");
  return [a.street, cityLine].filter(Boolean).join(", ");
}

/** Caption block: county name, then the courthouse street address (S1 + S2). */
export function courtCaption(a: Answers): string {
  const county = a.S1.trim();
  if (!county) return "";
  const c = courthouseFor(county, a.S2);
  return c ? [county, c.name, c.street, `${c.city}, CA ${c.zip}`].join("\n") : county;
}

/**
 * DV-110 / DV-130 item 2 "Relationship to person in 1": a short phrase
 * describing the respondent's relationship to the petitioner (from RL1–RL2).
 */
export function relationshipPhrase(a: Answers): string {
  const parts: string[] = [];
  const has = (k: string) => a.RL1.includes(k as never);
  if (has("married")) parts.push("Spouse");
  if (has("formerly married")) parts.push("Former spouse");
  if (has("engaged")) parts.push("Engaged (now or before)");
  if (has("dating")) parts.push("Dating (now or before)");
  if (has("related")) {
    const rel = a.RL2.map((r) => {
      const map: Record<string, string> = {
        "parent/step/in-law": "Parent",
        "sibling/step/in-law": "Sibling",
        "child/step/adopted": "Child",
        grandparent: "Grandparent",
        "child's spouse": "Child's spouse",
        grandchild: "Grandchild",
      };
      return map[r] ?? r;
    });
    parts.push(rel.length ? rel.join(", ") : "Relative");
  }
  if (has("live together")) parts.push("Lived together");
  if (has("children")) parts.push("Parent of our children");
  return parts.join("; ");
}

/** "2024-03" → "03/2024" (DV-105 residence history). */
export function fmtMonthYear(ym: string | undefined): string {
  if (!ym) return "";
  const m = /^(\d{4})-(\d{2})/.exec(ym.trim());
  return m ? `${m[2]}/${m[1]}` : ym;
}

/** "14:30" → "2:30 PM" (visit schedule). */
export function fmtTime(t: string | undefined): string {
  if (!t) return "";
  const m = /^(\d{1,2}):(\d{2})/.exec(t.trim());
  if (!m) return t;
  const h = +m[1];
  return `${h % 12 || 12}:${m[2]} ${h < 12 ? "AM" : "PM"}`;
}

/** Custody forms are used only when custody is requested and the parties have children together. */
export function custodyRequested(a: Answers): boolean {
  return !!a.orders.O15 && a.RL1.includes("children");
}

/** LIZ Break Free's document-assistance fee: always the first expense on DV-100 item 23, with the invoice attached. */
export const LIZ_FEE = { payTo: "LIZ Break Free", for: "Document Assist.", amount: "250" } as const;

/** DV-100 item 23 rows: the LIZ fee, then the person's own expenses. */
export function expenses23(a: Answers): { payTo: string; for: string; amount: string }[] {
  return a.orders.O23 ? [LIZ_FEE, ...a.O23.filter((x) => x.payTo.trim() || x.for.trim() || x.amount.trim())] : [];
}

/** FL-150 is needed when child support, spousal support or lawyer's fees are requested. */
export function financesRequested(a: Answers): boolean {
  return (!!a.orders.O24 && a.RL1.includes("children")) || (!!a.orders.O25 && a.RL1.includes("married")) || !!a.orders.O26;
}

/** True when the person is under 18, or when their age is unknown. */
export function under18(p: RosterPerson, asOf: string): boolean {
  const age = personAge(p, asOf);
  return age === "" || Number(age) < 18;
}

export interface Derived {
  /** Roster people the order should protect (PR8 = Y), roster order. */
  protectedPeople: RosterPerson[];
  /** Shared children (PR7 = Y), oldest first. */
  sharedChildren: RosterPerson[];
  /** Shared children under 18, oldest first (DV-105 item 3, DV-140 item 3). */
  custodyKids: RosterPerson[];
  hasChildren: boolean;
  married: boolean;
  asOf: string;
  lawyer: boolean;
}

export function derive(a: Answers): Derived {
  const protectedPeople = a.roster.filter((p) => p.protect === "Y" && p.name.trim());
  const sharedChildren = a.roster
    .filter((p) => p.sharedChild === "Y" && p.name.trim())
    .sort((x, y) => (x.dob || "9999").localeCompare(y.dob || "9999"));
  return {
    protectedPeople,
    sharedChildren,
    custodyKids: sharedChildren.filter((p) => under18(p, a.G1)),
    hasChildren: a.RL1.includes("children"),
    married: a.RL1.includes("married"),
    asOf: a.G1,
    lawyer: a.S5 === "Y",
  };
}

/** Respondent's age: from R3 when given, else the estimate R4. */
export function respondentAge(a: Answers): string {
  return a.R3 ? ageFrom(a.R3, a.G1) : a.R4;
}

export function petitionerAge(a: Answers): string {
  return a.P2 ? ageFrom(a.P2, a.G1) : a.P3;
}

export function firearmSummary(a: Answers, includeArmor: boolean): string {
  const guns = a.R19.filter((r) => r.what.trim())
    .map((r) => [r.count, r.what].filter(Boolean).join(" ") + (r.where ? ` (${r.where})` : ""))
    .join("; ");
  const armor = includeArmor && a.R20 === "Y" ? `body armor${a.R20details ? `: ${a.R20details}` : ""}` : "";
  return [guns, armor].filter(Boolean).join("; ");
}
