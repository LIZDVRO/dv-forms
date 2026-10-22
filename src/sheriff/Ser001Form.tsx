"use client";

/**
 * A short form that makes SER-001 on the sheriff page, for people who don't have the one
 * from their LIZ forms. Everything it asks is on the papers the court gave back (DV-100
 * items 1 and 2) or is something only they know (where to find the other person).
 */
import { useState } from "react";

import type { Answers } from "@/wizard/types";
import { AddressInput, Check, Choice, Group, LongText, Multi, Note, Question, Text, YesNo } from "@/wizard/ui/fields";

import { RETURNED_PAPERS, USUAL_PAPERS, makeSer001, newSer001Draft } from "./ser001";

const SAFETY = [
  { value: "violent history", label: "History of violence or abuse" },
  { value: "military or first-responder training", label: "Military, police, or similar training" },
  { value: "probation or parole", label: "On probation or parole" },
  { value: "aggressive animal", label: "Has an aggressive animal" },
  { value: "mental health issues", label: "Mental health issues" },
  { value: "deaf or hard of hearing", label: "Deaf or hard of hearing" },
  { value: "other", label: "Something else" },
];

export function Ser001Form({ county, onDone }: { county: string; onDone: (file: File) => void }) {
  const [a, setA] = useState<Answers>(() => newSer001Draft(county));
  const [papers, setPapers] = useState<string[]>(USUAL_PAPERS);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const set = (fn: (x: Answers) => void) =>
    setA((prev) => {
      const next = structuredClone(prev);
      fn(next);
      return next;
    });

  const make = async () => {
    setError("");
    if (!a.P1.trim()) return setError("Enter your name.");
    if (!a.R1.trim()) return setError("Enter the name of the person to be served.");
    if (!a.R15.address.street.trim() || !a.R15.address.city.trim()) return setError("Enter where the sheriff can find them.");
    setBusy(true);
    try {
      onDone(await makeSer001({ ...a, V2: county, S1: county }, papers));
    } catch (e) {
      console.error(e);
      setError("Something went wrong making your SER-001. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-8 rounded-xl border border-liz/30 bg-white p-4 sm:p-5">
      <p className="text-base text-slate-700">
        Have your papers from the court in front of you. Most answers are on DV-100: item 1 is about you, item 2 is about the other
        person. The sheriff keeps SER-001 confidential.
      </p>

      <Group title="About you">
        <Question label="Your full name" hint="DV-100, item 1.">
          <Text value={a.P1} onChange={(v) => set((x) => void (x.P1 = v))} />
        </Question>
        <Question label="Address where the sheriff can mail you" hint="It doesn't have to be your home. A safe mailing address is fine.">
          <AddressInput value={a.P6} onChange={(v) => set((x) => void (x.P6 = v))} />
        </Question>
        <div className="grid gap-4 sm:grid-cols-2">
          <Question label="Phone" hint="One the other person can't see.">
            <Text type="tel" inputMode="tel" value={a.P7} onChange={(v) => set((x) => void (x.P7 = v))} />
          </Question>
          <Question label="Email" optional>
            <Text type="email" inputMode="email" value={a.P8.email} onChange={(v) => set((x) => void (x.P8.email = v))} />
          </Question>
        </div>
      </Group>

      <Group title="The person to be served" seen="sheriff">
        <Question label="Their full name" hint="Exactly as it's written on DV-109 and DV-110.">
          <Text value={a.R1} onChange={(v) => set((x) => void (x.R1 = v))} />
        </Question>
        <Question label="Other names they use" optional>
          <Text value={a.R2} onChange={(v) => set((x) => void (x.R2 = v))} />
        </Question>
        <Question label="Gender" optional>
          <Choice
            value={a.R5}
            onChange={(v) => set((x) => void (x.R5 = v))}
            options={[
              { value: "M", label: "Male" },
              { value: "F", label: "Female" },
              { value: "X", label: "Nonbinary" },
            ]}
          />
        </Question>
        <div className="grid gap-4 sm:grid-cols-2">
          <Question label="Date of birth" optional hint="Or their age, if you don't know it.">
            <Text type="date" value={a.R3} onChange={(v) => set((x) => void (x.R3 = v))} />
          </Question>
          <Question label="Age" optional>
            <Text inputMode="numeric" value={a.R4} onChange={(v) => set((x) => void (x.R4 = v.replace(/\D/g, "")))} className="sm:w-28" />
          </Question>
        </div>
        <Question label="Race or ethnicity" optional>
          <Text value={a.R6} onChange={(v) => set((x) => void (x.R6 = v))} />
        </Question>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Question label="Height" optional>
            <Text value={a.R7.height} onChange={(v) => set((x) => void (x.R7.height = v))} placeholder={`5'10"`} />
          </Question>
          <Question label="Weight" optional>
            <Text value={a.R7.weight} onChange={(v) => set((x) => void (x.R7.weight = v))} placeholder="180" />
          </Question>
          <Question label="Hair" optional>
            <Text value={a.R7.hair} onChange={(v) => set((x) => void (x.R7.hair = v))} />
          </Question>
          <Question label="Eyes" optional>
            <Text value={a.R7.eyes} onChange={(v) => set((x) => void (x.R7.eyes = v))} />
          </Question>
        </div>
        <Question label="Tattoos, scars or other marks" optional>
          <Text value={a.R8} onChange={(v) => set((x) => void (x.R8 = v))} />
        </Question>
        <div className="grid gap-4 sm:grid-cols-2">
          <Question label="Their car" optional hint="Make, model, color, plate.">
            <Text value={a.R11.type} onChange={(v) => set((x) => void (x.R11.type = v))} />
          </Question>
          <Question label="Their phone" optional>
            <Text type="tel" inputMode="tel" value={a.R12} onChange={(v) => set((x) => void (x.R12 = v))} />
          </Question>
        </div>
      </Group>

      <Group title="Where the sheriff can find them" seen="sheriff">
        <Question label="Best address to find them" hint={`It needs to be in ${county || "the"} County.`}>
          <AddressInput value={a.R15.address} onChange={(v) => set((x) => void (x.R15.address = v))} />
          <Choice
            value={a.R15.kind}
            onChange={(v) => set((x) => void (x.R15.kind = v))}
            options={[
              { value: "home", label: "Home" },
              { value: "business", label: "Work or business" },
            ]}
          />
        </Question>
        <div className="grid gap-4 sm:grid-cols-2">
          <Question label="Gate code or instructions" optional>
            <Text value={a.R15.instructions} onChange={(v) => set((x) => void (x.R15.instructions = v))} />
          </Question>
          <Question label="Best time to find them there" optional>
            <Text value={a.R15.bestTime} onChange={(v) => set((x) => void (x.R15.bestTime = v))} placeholder="e.g. after 6 p.m." />
          </Question>
        </div>
        <Question label="Another place to find them" optional>
          <AddressInput value={a.R15.alt} onChange={(v) => set((x) => void (x.R15.alt = v))} />
          {a.R15.alt.street && (
            <Choice
              value={a.R15.altKind}
              onChange={(v) => set((x) => void (x.R15.altKind = v))}
              options={[
                { value: "home", label: "Home" },
                { value: "business", label: "Work or business" },
              ]}
            />
          )}
        </Question>
        <Question label="Are they in jail or prison?">
          <YesNo value={a.R16} onChange={(v) => set((x) => void (x.R16 = v === "Y" ? "Y" : "N"))} />
        </Question>
        {a.R16 === "Y" && <Text value={a.R16facility} onChange={(v) => set((x) => void (x.R16facility = v))} placeholder="Name of the facility" />}
      </Group>

      <Group title="Safety" seen="sheriff">
        <Question label="Do they have guns?">
          <YesNo value={a.R18} onChange={(v) => set((x) => void (x.R18 = v))} dontKnow />
        </Question>
        <Question label="Is there anything else the sheriff should know for safety?" hint="Check all that apply." optional>
          <Multi value={a.R21} onChange={(v) => set((x) => void (x.R21 = v))} columns options={SAFETY} />
          {a.R21.includes("other") && <Text value={a.R21other} onChange={(v) => set((x) => void (x.R21other = v))} placeholder="What else?" />}
        </Question>
        <Check
          checked={a.R17 === "N"}
          onChange={(on) => set((x) => void (x.R17 = on ? "N" : "Y"))}
        >
          They don&apos;t speak English
        </Check>
        {a.R17 === "N" && <Text value={a.R17language} onChange={(v) => set((x) => void (x.R17language = v))} placeholder="Language they speak" />}
        <Check checked={a.R22 === "Y"} onChange={(on) => set((x) => void (x.R22 = on ? "Y" : "N"))}>
          I&apos;ll give the sheriff a photo of them
        </Check>
        <Question label="Anything else the sheriff should know?" optional>
          <LongText value={a.V3} onChange={(v) => set((x) => void (x.V3 = v))} rows={3} />
        </Question>
      </Group>

      <Group title="Which papers did the court give back?">
        <div className="space-y-2">
          {RETURNED_PAPERS.map((p) => (
            <Check
              key={p.id}
              checked={papers.includes(p.id)}
              onChange={(on) => setPapers((list) => (on ? [...list, p.id] : list.filter((id) => id !== p.id)))}
            >
              {p.label}
            </Check>
          ))}
        </div>
        <Note>We also list the blank forms served with them, like DV-120.</Note>
      </Group>

      <div className="space-y-2">
        <button
          type="button"
          onClick={make}
          disabled={busy}
          className="w-full rounded-xl bg-liz px-6 py-3 text-base font-semibold text-white shadow hover:bg-liz/90 disabled:opacity-60 sm:w-auto"
        >
          {busy ? "Making your SER-001…" : "Make my SER-001"}
        </button>
        {error && <p className="text-base font-medium text-red-700">{error}</p>}
      </div>
    </div>
  );
}
