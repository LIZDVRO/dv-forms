import type { Answers, IncidentCard } from "../types";
import type { Binding, FieldValue } from "./engine";
import type { Derived } from "../derive";

export const b = (f: string, v: (a: Answers, d: Derived) => FieldValue): Binding => ({ f, v });

/** Case number on stage-1 forms: S4 only for updates; otherwise the clerk fills it. */
export const caseNo = (a: Answers) => (a.S3 === "update" ? a.S4 : "");

/** Incident card k if the user filled it in. */
export function card(a: Answers, k: number): IncidentCard | undefined {
  const c = a.cards[k];
  return c && (c.A6.trim() || c.A1.trim()) ? c : undefined;
}

/** Petitioner contact, replaced by the lawyer's when S5 = Y (map Step 0). */
export const contact = {
  street: (a: Answers) => (a.S5 === "Y" ? a.L4.street : a.P6.street),
  city: (a: Answers) => (a.S5 === "Y" ? a.L4.city : a.P6.city),
  state: (a: Answers) => (a.S5 === "Y" ? a.L4.state : a.P6.state),
  zip: (a: Answers) => (a.S5 === "Y" ? a.L4.zip : a.P6.zip),
  phone: (a: Answers) => (a.S5 === "Y" ? a.L5.phone : a.P7),
  fax: (a: Answers) => (a.S5 === "Y" ? a.L5.fax : a.P8.fax),
  email: (a: Answers) => (a.S5 === "Y" ? a.L5.email : a.P8.email),
};

/** Fields named x, x[1], x[2] … in widget order. */
export const idx = (base: string, i: number) => (i === 0 ? base : `${base}[${i}]`);

/** Split text across two single-line fields, breaking at a word near n characters. */
export function twoLines(text: string, n = 45): [string, string] {
  const s = (text ?? "").trim();
  if (s.length <= n) return [s, ""];
  const cut = s.lastIndexOf(" ", n);
  const at = cut > 10 ? cut : n;
  return [s.slice(0, at).trim(), s.slice(at).trim()];
}
