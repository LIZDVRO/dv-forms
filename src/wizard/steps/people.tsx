"use client";

import { emptyPerson } from "../defaults";
import { matchLanguage, otherLanguageName } from "../languages";
import { useWizard } from "../store";
import type { Gender, RosterPerson } from "../types";
import { AddressInput, Choice, Group, LongText, Note, Question, Rows, Text, YesNo } from "../ui/fields";
import type { StepProps } from "./types";

const GENDERS = [
  { value: "F" as const, label: "Female" },
  { value: "M" as const, label: "Male" },
  { value: "X" as const, label: "Nonbinary" },
];

/** Step 1 · you (P1–P9). */
export function You({ errors }: StepProps) {
  const { a, set } = useWizard();
  const lawyer = a.S5 === "Y";
  return (
    <div className="space-y-8">
      <Group seen="public">
        <Question label="Your full legal name" error={errors.P1}>
          <Text value={a.P1} onChange={(v) => set((x) => void (x.P1 = v))} autoComplete="off" />
        </Question>
        {!lawyer && (
          <>
            <Question
              label="A safe address where you can get court mail"
              hint="The court and the other person will send papers here. It does not have to be where you live."
              more={
                <>
                  You can use a P.O. box, a Safe at Home address, or someone else&apos;s address if they agree and will tell you
                  right away when court mail comes. Safe at Home is free (sos.ca.gov/registries/safe-home) but approval can
                  take a few weeks.
                </>
              }
            >
              <AddressInput value={a.P6} onChange={(v) => set((x) => void (x.P6 = v))} />
            </Question>
            <Question label="A safe phone number" optional hint="Leave blank if you don't want the other person to have it.">
              <Text type="tel" value={a.P7} onChange={(v) => set((x) => void (x.P7 = v))} className="sm:w-72" />
            </Question>
            <div className="grid gap-5 sm:grid-cols-2">
              <Question label="Safe email" optional>
                <Text type="email" value={a.P8.email} onChange={(v) => set((x) => void (x.P8.email = v))} />
              </Question>
              <Question label="Fax" optional>
                <Text type="tel" value={a.P8.fax} onChange={(v) => set((x) => void (x.P8.fax = v))} />
              </Question>
            </div>
          </>
        )}
        {lawyer && (
          <Question label="A safe phone number" optional hint="For law enforcement only.">
            <Text type="tel" value={a.P7} onChange={(v) => set((x) => void (x.P7 = v))} className="sm:w-72" />
          </Question>
        )}
      </Group>

      <Group seen="police">
        <Question
          label="Your date of birth"
          optional
          hint="It helps police enforce the order outside California."
          more="If you give your date of birth, the order goes into the federal database too, so it is easier to enforce in other states."
        >
          <Text type="date" value={a.P2} onChange={(v) => set((x) => void (x.P2 = v))} className="sm:w-56" />
        </Question>
        {!a.P2 && (
          <Question label="Your age" error={errors.P3} hint="Shown on the request (DV-100).">
            <Text value={a.P3} onChange={(v) => set((x) => void (x.P3 = v))} inputMode="numeric" className="w-28" />
          </Question>
        )}
        {(Number(a.P3) > 0 && Number(a.P3) < 18) && (
          <Note>If you are 12 to 17, you can ask on your own, but the judge may ask that an adult help you. A court self-help center can help.</Note>
        )}
        <Question label="Gender">
          <Choice value={a.P4} onChange={(v) => set((x) => void (x.P4 = v as Gender))} options={GENDERS} />
        </Question>
        <Question label="Race" optional>
          <Text value={a.P5} onChange={(v) => set((x) => void (x.P5 = v))} className="sm:w-72" />
        </Question>
        <Question label="Do you speak English?">
          <YesNo
            value={a.P9}
            onChange={(v) =>
              set((x) => {
                x.P9 = v === "Y" ? "Y" : "N";
                // Not speaking English pre-answers the interpreter question (map I1).
                if (x.P9 === "N" && !x.I1) x.I1 = "Y";
              })
            }
          />
        </Question>
        {a.P9 === "N" && (
          <Question label="Which language do you speak?" hint="You can ask the court for a free interpreter. We'll ask about that later.">
            <Text
              value={a.P9language}
              onChange={(v) =>
                set((x) => {
                  x.P9language = v;
                  const match = matchLanguage(v);
                  x.I1language = match ?? (v.trim() ? "other" : "");
                  x.I1other = match ? "" : otherLanguageName(v);
                })
              }
              className="sm:w-72"
            />
          </Question>
        )}
      </Group>
    </div>
  );
}

/** Step 2 · the person you want protection from (R1–R17). */
export function Respondent({ errors }: StepProps) {
  const { a, set } = useWizard();
  return (
    <div className="space-y-8">
      <Group seen="public">
        <Question label="Their full name" error={errors.R1}>
          <Text value={a.R1} onChange={(v) => set((x) => void (x.R1 = v))} />
        </Question>
        <Question label="Their date of birth" optional hint="If you know it.">
          <Text type="date" value={a.R3} onChange={(v) => set((x) => void (x.R3 = v))} className="sm:w-56" />
        </Question>
        {!a.R3 && (
          <Question label="Their age" hint="A guess is fine." error={errors.R4}>
            <Text value={a.R4} onChange={(v) => set((x) => void (x.R4 = v))} inputMode="numeric" className="w-28" />
          </Question>
        )}
        <Question label="Their gender" error={errors.R5}>
          <Choice value={a.R5} onChange={(v) => set((x) => void (x.R5 = v as Gender))} options={GENDERS} />
        </Question>
        <Question label="Their race" error={errors.R6} hint="Police need this to enter the order.">
          <Text value={a.R6} onChange={(v) => set((x) => void (x.R6 = v))} className="sm:w-72" />
        </Question>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Question label="Height" optional>
            <Text value={a.R7.height} onChange={(v) => set((x) => void (x.R7.height = v))} placeholder={`5'10"`} />
          </Question>
          <Question label="Weight" optional>
            <Text value={a.R7.weight} onChange={(v) => set((x) => void (x.R7.weight = v))} />
          </Question>
          <Question label="Hair" optional>
            <Text value={a.R7.hair} onChange={(v) => set((x) => void (x.R7.hair = v))} />
          </Question>
          <Question label="Eyes" optional>
            <Text value={a.R7.eyes} onChange={(v) => set((x) => void (x.R7.eyes = v))} />
          </Question>
        </div>
        <Question label="Their home address" optional hint="It goes on the temporary order so police can find them.">
          <AddressInput value={a.R14} onChange={(v) => set((x) => void (x.R14 = v))} />
        </Question>
      </Group>

      <Group seen="police">
        <Question label="Other names or nicknames" optional>
          <Text value={a.R2} onChange={(v) => set((x) => void (x.R2 = v))} />
        </Question>
        <Question label="Their phone number" optional>
          <Text type="tel" value={a.R12} onChange={(v) => set((x) => void (x.R12 = v))} className="sm:w-72" />
        </Question>
        <Question label="Marks, scars, or tattoos" optional>
          <Text value={a.R8} onChange={(v) => set((x) => void (x.R8 = v))} />
        </Question>
        <div className="grid gap-5 sm:grid-cols-2">
          <Question label="Driver's license number" optional>
            <Text value={a.R9.number} onChange={(v) => set((x) => void (x.R9.number = v))} />
          </Question>
          <Question label="License state" optional>
            <Text value={a.R9.state} onChange={(v) => set((x) => void (x.R9.state = v))} className="w-28" />
          </Question>
        </div>
        <Question label="Social Security number" optional hint="Only on the law-enforcement form, never filed in the court record.">
          <Text value={a.R10} onChange={(v) => set((x) => void (x.R10 = v))} className="sm:w-56" />
        </Question>
        <Question label="The vehicle they drive most" optional>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
            <Text value={a.R11.type} onChange={(v) => set((x) => void (x.R11.type = v))} placeholder="Type" />
            <Text value={a.R11.model} onChange={(v) => set((x) => void (x.R11.model = v))} placeholder="Model" />
            <Text value={a.R11.year} onChange={(v) => set((x) => void (x.R11.year = v))} placeholder="Year" />
            <Text value={a.R11.color} onChange={(v) => set((x) => void (x.R11.color = v))} placeholder="Color" />
            <Text value={a.R11.plate} onChange={(v) => set((x) => void (x.R11.plate = v))} placeholder="Plate" />
          </div>
        </Question>
        <Question label="Where do they work?" optional>
          <div className="grid gap-2 sm:grid-cols-2">
            <Text value={a.R13.name} onChange={(v) => set((x) => void (x.R13.name = v))} placeholder="Employer" />
            <Text value={a.R13.address} onChange={(v) => set((x) => void (x.R13.address = v))} placeholder="Address" />
          </div>
        </Question>
        <Question label="Do they speak English?">
          <YesNo dontKnow value={a.R17} onChange={(v) => set((x) => void (x.R17 = v))} />
        </Question>
        {a.R17 === "N" && (
          <Question label="Which language?">
            <Text value={a.R17language} onChange={(v) => set((x) => void (x.R17language = v))} className="sm:w-72" />
          </Question>
        )}
      </Group>
    </div>
  );
}

/** Step 3 · relationship and eligibility (RL1–RL4). */
export function Relationship({ errors }: StepProps) {
  const { a, set } = useWizard();
  const none = a.RL1.length === 0;
  return (
    <div className="space-y-8">
      <Group seen="public">
        <Question
          label="How are you connected to this person?"
          hint="Choose all that apply."
          error={errors.RL1}
          more="A domestic violence restraining order needs one of these relationships. Roommates alone don't count."
        >
          <div className="grid gap-2 sm:grid-cols-2">
            {(
              [
                ["children", "We have a child or children together"],
                ["married", "We are married or registered partners"],
                ["formerly married", "We used to be married or partners"],
                ["dating", "We are dating or used to date"],
                ["engaged", "We are or used to be engaged"],
                ["related", "We are related"],
                ["live together", "We live or lived together"],
              ] as const
            ).map(([k, label]) => {
              const on = a.RL1.includes(k);
              return (
                <button
                  key={k}
                  type="button"
                  role="checkbox"
                  aria-checked={on}
                  onClick={() => set((x) => void (x.RL1 = on ? x.RL1.filter((r) => r !== k) : [...x.RL1, k]))}
                  className={`rounded-lg border px-4 py-2.5 text-left text-base ${on ? "border-liz bg-liz text-white" : "border-slate-300 bg-white hover:border-liz/60"}`}
                >
                  <span className="mr-2 inline-block w-4">{on ? "✓" : ""}</span>
                  {label}
                </button>
              );
            })}
          </div>
        </Question>
        {a.RL1.includes("related") && (
          <Question label="How are they related to you? They are my…">
            <div className="grid gap-2 sm:grid-cols-2">
              {(
                [
                  ["parent/step/in-law", "Parent, stepparent, or parent-in-law"],
                  ["child/step/adopted", "Child, stepchild, or adopted child"],
                  ["sibling/step/in-law", "Brother, sister, or in-law"],
                  ["grandparent", "Grandparent"],
                  ["child's spouse", "Child's spouse"],
                  ["grandchild", "Grandchild"],
                ] as const
              ).map(([k, label]) => {
                const on = a.RL2.includes(k);
                return (
                  <button
                    key={k}
                    type="button"
                    role="checkbox"
                    aria-checked={on}
                    onClick={() => set((x) => void (x.RL2 = on ? x.RL2.filter((r) => r !== k) : [...x.RL2, k]))}
                    className={`rounded-lg border px-4 py-2.5 text-left text-base ${on ? "border-liz bg-liz text-white" : "border-slate-300 bg-white hover:border-liz/60"}`}
                  >
                    <span className="mr-2 inline-block w-4">{on ? "✓" : ""}</span>
                    {label}
                  </button>
                );
              })}
            </div>
          </Question>
        )}
        {a.RL1.includes("live together") && (
          <Question label="Did you live together as a family or household, more than just roommates?" error={errors.RL3}>
            <YesNo value={a.RL3} onChange={(v) => set((x) => void (x.RL3 = v === "Y" ? "Y" : "N"))} />
          </Question>
        )}
        {none && (
          <p className="text-sm text-slate-600">
            None of these? You may qualify for another kind of restraining order (civil harassment, elder abuse, or gun violence).
            See selfhelp.courts.ca.gov/restraining-orders.
          </p>
        )}
      </Group>
      <Group>
        <Question label="Do you live with or near this person now?">
          <Choice
            value={a.RL4}
            onChange={(v) => set((x) => void (x.RL4 = v))}
            columns
            options={[
              { value: "no", label: "No" },
              { value: "together", label: "We live together" },
              { value: "same building", label: "Same building, different home" },
              { value: "same neighborhood", label: "Same neighborhood" },
              { value: "other", label: "Other" },
            ]}
          />
        </Question>
        {a.RL4 === "other" && (
          <Question label="Please explain">
            <Text value={a.RL4other} onChange={(v) => set((x) => void (x.RL4other = v))} />
          </Question>
        )}
      </Group>
    </div>
  );
}

/** Step 4 · one roster of children and household members (PR1–PR10). */
export function Roster() {
  const { a, set } = useWizard();
  const kidsTogether = a.RL1.includes("children");
  const anyProtected = a.roster.some((p) => p.protect === "Y");
  return (
    <div className="space-y-8">
      <Group seen="public">
        <p className="text-base text-slate-700">
          Add your children and anyone else you live with or want protected. Add each person once; we&apos;ll put them on every form
          that needs them.
        </p>
        <Rows<RosterPerson>
          items={a.roster}
          onChange={(v) => set((x) => void (x.roster = v))}
          make={emptyPerson}
          addLabel="Add a person"
          render={(p, up) => (
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <Question label="Full name">
                  <Text value={p.name} onChange={(v) => up({ name: v })} />
                </Question>
                <Question label="Relationship to you" hint="For example: daughter, mother, roommate.">
                  <Text value={p.relationship} onChange={(v) => up({ relationship: v })} />
                </Question>
                <Question label="Date of birth" optional>
                  <Text type="date" value={p.dob} onChange={(v) => up({ dob: v })} />
                </Question>
                {!p.dob && (
                  <Question label="Age">
                    <Text value={p.age} onChange={(v) => up({ age: v })} inputMode="numeric" className="w-28" />
                  </Question>
                )}
              </div>
              <Question label="Do they live with you?">
                <YesNo value={p.livesWithYou} onChange={(v) => up({ livesWithYou: v === "Y" ? "Y" : "N" })} />
              </Question>
              {kidsTogether && (
                <Question label="Is this a child you have with the other person?">
                  <YesNo value={p.sharedChild} onChange={(v) => up({ sharedChild: v === "Y" ? "Y" : "N" })} />
                </Question>
              )}
              <Question label="Should the order protect this person too?">
                <YesNo value={p.protect} onChange={(v) => up({ protect: v === "Y" ? "Y" : "N" })} />
              </Question>
              {p.protect === "Y" && (
                <div className="grid gap-4 sm:grid-cols-2">
                  <Question label="Their gender" hint="For law enforcement only.">
                    <Choice value={p.gender} onChange={(v) => up({ gender: v as Gender })} options={GENDERS} />
                  </Question>
                  <Question label="Their race" optional hint="For law enforcement only.">
                    <Text value={p.race} onChange={(v) => up({ race: v })} />
                  </Question>
                </div>
              )}
            </div>
          )}
        />
        {anyProtected && (
          <Question label="Why do these people need protection?">
            <LongText value={a.PR10} onChange={(v) => set((x) => void (x.PR10 = v))} rows={4} />
          </Question>
        )}
        {a.roster.some((p) => p.protect === "Y" && personIsMinor(p)) && (
          <Note>
            Worried about a child&apos;s information being public? Using a safe mailing address (not where the child lives) is
            enough to protect an address. Keeping a child&apos;s name or other details private needs another form (DV-160),
            which this version doesn&apos;t make yet.
          </Note>
        )}
      </Group>
    </div>
  );
}

function personIsMinor(p: RosterPerson) {
  if (p.dob) return Date.now() - new Date(p.dob).getTime() < 18 * 365.25 * 86400e3;
  return Number(p.age) > 0 && Number(p.age) < 18;
}
