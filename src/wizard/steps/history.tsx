"use client";

import { emptyCard } from "../defaults";
import { useWizard } from "../store";
import type { CaseRecord, CaseType, Firearm, IncidentCard, OrderRecord } from "../types";
import { Choice, Group, LongText, Note, Question, Rows, Text, YesNo } from "../ui/fields";
import type { StepProps } from "./types";

/** Step 5 · other orders and court cases (C1–C4). */
export function History() {
  const { a, set } = useWizard();
  return (
    <div className="space-y-8">
      <Group seen="public">
        <Question
          label="Is there a restraining order in place now, or did one end in the last 6 months?"
          hint="Include emergency orders from police and orders from criminal court."
        >
          <YesNo value={a.C1} onChange={(v) => set((x) => void (x.C1 = v === "Y" ? "Y" : "N"))} />
        </Question>
        {a.C1 === "Y" && (
          <>
            <Rows<OrderRecord>
              items={a.C2}
              onChange={(v) => set((x) => void (x.C2 = v))}
              make={() => ({ type: "", dateMade: "", expires: "", caseNumber: "", county: "" })}
              addLabel="Add an order"
              render={(o, up) => (
                <div className="grid gap-4 sm:grid-cols-2">
                  <Question label="Type of order">
                    <Text value={o.type} onChange={(v) => up({ type: v })} placeholder="e.g. police emergency order" />
                  </Question>
                  <Question label="Case number and county" optional>
                    <div className="grid grid-cols-2 gap-2">
                      <Text value={o.caseNumber} onChange={(v) => up({ caseNumber: v })} placeholder="Case no." />
                      <Text value={o.county} onChange={(v) => up({ county: v })} placeholder="County" />
                    </div>
                  </Question>
                  <Question label="Date it was made">
                    <Text type="date" value={o.dateMade} onChange={(v) => up({ dateMade: v })} />
                  </Question>
                  <Question label="Date it ends">
                    <Text type="date" value={o.expires} onChange={(v) => up({ expires: v })} />
                  </Question>
                </div>
              )}
            />
            <Note>Attach a copy of each order to your forms if you have one.</Note>
          </>
        )}
      </Group>
      <Group>
        <Question label="Do you have any other court case with this person?" hint="Custody, divorce, juvenile, guardianship, criminal, or other.">
          <YesNo value={a.C3} onChange={(v) => set((x) => void (x.C3 = v === "Y" ? "Y" : "N"))} />
        </Question>
        {a.C3 === "Y" && (
          <Rows<CaseRecord>
            items={a.C4}
            onChange={(v) => set((x) => void (x.C4 = v))}
            make={() => ({ type: "custody", kind: "", where: "", year: "", caseNumber: "" })}
            addLabel="Add a case"
            render={(c, up) => (
              <div className="space-y-4">
                <Question label="Type of case">
                  <Choice
                    value={c.type}
                    onChange={(v) => up({ type: v as CaseType })}
                    options={(["custody", "divorce", "juvenile", "guardianship", "criminal", "child support", "other"] as const).map((t) => ({
                      value: t,
                      label: t[0].toUpperCase() + t.slice(1),
                    }))}
                  />
                </Question>
                {c.type === "other" && (
                  <Question label="What kind of case?">
                    <Text value={c.kind} onChange={(v) => up({ kind: v })} />
                  </Question>
                )}
                <div className="grid gap-4 sm:grid-cols-3">
                  <Question label="Where it was filed" hint="City and state, or tribe.">
                    <Text value={c.where} onChange={(v) => up({ where: v })} />
                  </Question>
                  <Question label="Year filed">
                    <Text value={c.year} onChange={(v) => up({ year: v })} inputMode="numeric" />
                  </Question>
                  <Question label="Case number" optional>
                    <Text value={c.caseNumber} onChange={(v) => up({ caseNumber: v })} />
                  </Question>
                </div>
                {a.RL1.includes("children") && (
                  <Question label="Does this case involve your children?">
                    <YesNo value={c.kids ?? ""} onChange={(v) => up({ kids: v === "Y" ? "Y" : "N" })} />
                  </Question>
                )}
              </div>
            )}
          />
        )}
      </Group>
    </div>
  );
}

const CARD_TITLES = [
  "The most recent abuse",
  "Another time (a different kind of abuse, if there was one)",
  "One more time",
];

function CardEditor({ c, k, update, error }: { c: IncidentCard; k: number; update: (p: Partial<IncidentCard>) => void; error?: string }) {
  return (
    <div className="space-y-5">
      <h4 className="text-base font-semibold text-slate-900">{CARD_TITLES[k]}</h4>
      <Question label="When did it happen?" hint="A guess is fine.">
        <Text type="date" value={c.A1} onChange={(v) => update({ A1: v })} className="sm:w-56" />
      </Question>
      <Question
        label="What happened?"
        hint="Say what was said, done, or sent, in your own words."
        more="This is the most important part: the judge decides mainly from what you write here. Include threats, injuries, texts or messages, and whether children were there."
        error={error}
      >
        <LongText value={c.A6} onChange={(v) => update({ A6: v })} rows={8} />
      </Question>
      <Question label="Did anyone else see or hear it?">
        <YesNo dontKnow value={c.A2} onChange={(v) => update({ A2: v })} />
      </Question>
      {c.A2 === "Y" && (
        <Question label="Who?">
          <Text value={c.A2names} onChange={(v) => update({ A2names: v })} />
        </Question>
      )}
      <Question label="Did they use or threaten to use a gun or other weapon?">
        <YesNo value={c.A3} onChange={(v) => update({ A3: v === "Y" ? "Y" : "N" })} />
      </Question>
      {c.A3 === "Y" && (
        <Question label="Describe the weapon">
          <Text value={c.A3text} onChange={(v) => update({ A3text: v })} />
        </Question>
      )}
      <Question label="Did it hurt you physically or emotionally?">
        <YesNo value={c.A4} onChange={(v) => update({ A4: v === "Y" ? "Y" : "N" })} />
      </Question>
      {c.A4 === "Y" && (
        <Question label="Describe the harm">
          <Text value={c.A4text} onChange={(v) => update({ A4text: v })} />
        </Question>
      )}
      <Question label="Did the police come?">
        <YesNo dontKnow value={c.A5} onChange={(v) => update({ A5: v })} />
      </Question>
      {c.A5 === "Y" && <Note>If police gave you an emergency protective order, add it on the &quot;Past orders and cases&quot; step.</Note>}
      <Question label="How often has this kind of abuse happened?">
        <Choice
          value={c.A7}
          onChange={(v) => update({ A7: v })}
          options={[
            { value: "once", label: "Just this once" },
            { value: "2-5", label: "2 to 5 times" },
            { value: "weekly", label: "Weekly" },
            { value: "other", label: "Other" },
          ]}
        />
      </Question>
      {c.A7 === "other" && (
        <Question label="How often?">
          <Text value={c.A7other} onChange={(v) => update({ A7other: v })} />
        </Question>
      )}
      {c.A7 && c.A7 !== "once" && (
        <Question label="When did it happen?" optional hint="Dates or rough times, if you know them.">
          <Text value={c.A7dates} onChange={(v) => update({ A7dates: v })} />
        </Question>
      )}
    </div>
  );
}

/** Step 6 · what happened (incident cards 1–3). */
export function Incidents({ errors }: StepProps) {
  const { a, set } = useWizard();
  return (
    <div className="space-y-6">
      <Group seen="public">
        <p className="text-base text-slate-700">Start with the most recent time. You can add up to two more.</p>
        {a.cards.map((c, k) => (
          <div key={k} className="rounded-xl border border-slate-200 bg-slate-50/60 p-4">
            <CardEditor
              c={c}
              k={k}
              error={k === 0 ? errors.A6 : undefined}
              update={(p) => set((x) => void (x.cards[k] = { ...x.cards[k], ...p }))}
            />
            {k > 0 && (
              <button
                type="button"
                onClick={() => set((x) => void x.cards.splice(k, 1))}
                className="mt-3 text-sm font-medium text-slate-500 hover:text-red-700"
              >
                Remove this one
              </button>
            )}
          </div>
        ))}
        {a.cards.length < 3 && (
          <button
            type="button"
            onClick={() => set((x) => void x.cards.push(emptyCard()))}
            className="rounded-lg border border-dashed border-liz/50 px-4 py-2.5 text-base font-medium text-liz hover:bg-liz/5"
          >
            + Add another time
          </button>
        )}
      </Group>
    </div>
  );
}

/** Firearms and body armor (R18–R20). */
export function Weapons() {
  const { a, set } = useWizard();
  return (
    <div className="space-y-8">
      <Group seen="public">
        <Question
          label="Does the other person have guns, gun parts, or ammunition?"
          more="Include 'ghost guns' (homemade or unregistered). The judge can tell police, who must try to collect them."
        >
          <YesNo dontKnow value={a.R18} onChange={(v) => set((x) => void (x.R18 = v))} />
        </Question>
        {a.R18 === "Y" && (
          <Rows<Firearm>
            items={a.R19}
            onChange={(v) => set((x) => void (x.R19 = v))}
            make={() => ({ what: "", count: "", where: "" })}
            addLabel="Add a gun, part, or ammunition"
            render={(g, up) => (
              <div className="grid gap-4 sm:grid-cols-3">
                <Question label="What is it?">
                  <Text value={g.what} onChange={(v) => up({ what: v })} />
                </Question>
                <Question label="How many?" optional>
                  <Text value={g.count} onChange={(v) => up({ count: v })} />
                </Question>
                <Question label="Where is it kept?" optional>
                  <Text value={g.where} onChange={(v) => up({ where: v })} />
                </Question>
              </div>
            )}
          />
        )}
      </Group>
      <Group seen="police">
        <Question label="Do they have body armor?">
          <YesNo dontKnow value={a.R20} onChange={(v) => set((x) => void (x.R20 = v))} />
        </Question>
        {a.R20 === "Y" && (
          <Question label="Describe it" optional>
            <Text value={a.R20details} onChange={(v) => set((x) => void (x.R20details = v))} />
          </Question>
        )}
      </Group>
    </div>
  );
}
