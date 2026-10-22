"use client";

/**
 * Step 11 · interpreter (INT-300) and serving the papers (SER-001).
 */
import { INT300_LANGUAGES } from "../languages";
import { useWizard } from "../store";
import type { Answers, Witness } from "../types";
import { AddressInput, Check, Choice, Group, LongText, Multi, Note, Question, Rows, Text, YesNo } from "../ui/fields";
import { COUNTIES } from "./setup";

const yn = (v: string) => (v === "Y" ? "Y" : "N");
const them = (a: Answers) => a.R1.trim().split(/\s+/)[0] || "the other person";

const LANGUAGE_LABELS: Record<string, string> = {
  Spanish: "Spanish (español)",
  Vietnamese: "Vietnamese (Tiếng Việt)",
  Korean: "Korean (한국어)",
  Mandarin: "Mandarin (普通话)",
  Cantonese: "Cantonese (广东话)",
  Farsi: "Farsi (فارسی)",
  Russian: "Russian (русский)",
  Tagalog: "Tagalog",
  Arabic: "Arabic (العربية)",
  Punjabi: "Punjabi (ਪੰਜਾਬੀ)",
  Hmong: "Hmong (Hmoob)",
};

/** Most common locally first; every INT-300 language is offered. */
const SHOWN_LANGUAGES = ["Spanish", "Hmong", "Punjabi", ...INT300_LANGUAGES.filter((l) => l !== "Spanish" && l !== "Punjabi")];

/** Pre-check what the sheriff should know from earlier answers (map R21). */
function prefillSheriff(x: Answers) {
  if (x.R21.length === 0 && x.cards.some((c) => c.A6.trim())) x.R21 = ["violent history"];
  if (!x.V2 && x.S1) x.V2 = x.S1;
}

export function Service() {
  const { a, set } = useWizard();
  const name = them(a);
  return (
    <div className="space-y-8">
      <Group title="Interpreter">
        <Question
          label="Do you need an interpreter in court?"
          hint="Interpreters are free in restraining order cases. This makes form INT-300."
        >
          <YesNo value={a.I1} onChange={(v) => set((x) => void (x.I1 = yn(v)))} />
        </Question>
        {a.I1 === "Y" && (
          <Question label="Which language?">
            <Choice
              value={a.I1language === "other" && a.I1other === "Hmong" ? "Hmong" : a.I1language}
              onChange={(v) =>
                set((x) => {
                  // Hmong is common locally but not printed on INT-300, so it goes on the "Other" line.
                  x.I1language = v === "Hmong" ? "other" : v;
                  if (v === "Hmong") x.I1other = "Hmong";
                  else if (v === "other" && x.I1other === "Hmong") x.I1other = "";
                })
              }
              columns
              options={[
                ...SHOWN_LANGUAGES.map((l) => ({ value: l as string, label: LANGUAGE_LABELS[l] ?? l })),
                { value: "other", label: "Another language" },
              ]}
            />
            {a.I1language === "other" && a.I1other !== "Hmong" && (
              <div className="grid gap-2 sm:grid-cols-2">
                <Text value={a.I1other} onChange={(v) => set((x) => void (x.I1other = v))} placeholder="Language" />
                <Text value={a.I2} onChange={(v) => set((x) => void (x.I2 = v))} placeholder="Town of origin (indigenous languages)" />
              </div>
            )}
          </Question>
        )}
        <Question label="Will any witness need an interpreter?" hint="We make a separate form for each witness." optional>
          <Rows<Witness>
            items={a.I3}
            onChange={(v) => set((x) => void (x.I3 = v))}
            make={() => ({ name: "", language: a.I1 === "Y" ? "same" : "other", otherLanguage: "" })}
            addLabel="Add a witness"
            render={(w, up) => (
              <div className="space-y-3">
                <Text value={w.name} onChange={(v) => up({ name: v })} placeholder="Witness's name (for your records)" />
                <Choice
                  value={w.language}
                  onChange={(v) => up({ language: v })}
                  options={[
                    ...(a.I1 === "Y" ? [{ value: "same" as const, label: "Same language as me" }] : []),
                    { value: "other" as const, label: a.I1 === "Y" ? "A different language" : "Language" },
                  ]}
                />
                {w.language === "other" && <Text value={w.otherLanguage} onChange={(v) => up({ otherLanguage: v })} placeholder="Language" />}
              </div>
            )}
          />
        </Question>
      </Group>

      <Group title="Serving the papers">
        <Question
          label={`Who will give ${name} copies of the papers?`}
          hint="You can't do it yourself. The sheriff serves restraining orders for free."
        >
          <Choice
            value={a.V1}
            onChange={(v) =>
              set((x) => {
                x.V1 = v;
                if (v === "sheriff") prefillSheriff(x);
              })
            }
            options={[
              { value: "sheriff", label: "The sheriff", hint: "Free. We'll make form SER-001." },
              { value: "adult", label: "Another adult", hint: "18 or older, not you or a protected person" },
              { value: "unsure", label: "Not sure yet" },
            ]}
          />
        </Question>
        {a.V1 === "adult" && (
          <Note>
            The person who serves must fill out the proof of service (DV-200) and give it back to you to file before your court date.
          </Note>
        )}
      </Group>

      {a.V1 === "sheriff" && (
        <Group title="For the sheriff" seen="sheriff">
          <Question label="County where they'll be served">
            <select
              value={a.V2 || a.S1}
              onChange={(e) => set((x) => void (x.V2 = e.target.value))}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-base focus:border-liz focus:outline-none focus:ring-2 focus:ring-liz/25 sm:w-80"
            >
              {COUNTIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </Question>
          <Question
            label="Where is the best place to find them?"
            hint={
              a.R14.street ? `Leave blank to use their home address (${a.R14.street}${a.R14.city ? `, ${a.R14.city}` : ""}).` : undefined
            }
            optional={!!a.R14.street}
          >
            <AddressInput value={a.R15.address} onChange={(v) => set((x) => void (x.R15.address = v))} />
            {a.R15.address.street && (
              <Choice
                value={a.R15.kind}
                onChange={(v) => set((x) => void (x.R15.kind = v))}
                options={[
                  { value: "home", label: "Home" },
                  { value: "business", label: "Work or business" },
                ]}
              />
            )}
          </Question>
          <div className="grid gap-4 sm:grid-cols-2">
            <Question label="Gate code or instructions" optional>
              <Text value={a.R15.instructions} onChange={(v) => set((x) => void (x.R15.instructions = v))} />
            </Question>
            <Question label="Best time to find them there" optional>
              <Text value={a.R15.bestTime} onChange={(v) => set((x) => void (x.R15.bestTime = v))} placeholder="e.g. after 6 p.m." />
            </Question>
          </div>
          <Question
            label="Another place to find them"
            optional
            hint={a.R13.address ? `Leave blank to use their work address (${a.R13.name || a.R13.address}).` : undefined}
          >
            <AddressInput value={a.R15.alt} onChange={(v) => set((x) => void (x.R15.alt = v))} />
            {a.R15.alt.street && (
              <>
                <Choice
                  value={a.R15.altKind}
                  onChange={(v) => set((x) => void (x.R15.altKind = v))}
                  options={[
                    { value: "home", label: "Home" },
                    { value: "business", label: "Work or business" },
                  ]}
                />
                <div className="grid gap-2 sm:grid-cols-2">
                  <Text value={a.R15.altInstructions} onChange={(v) => set((x) => void (x.R15.altInstructions = v))} placeholder="Gate code or instructions" />
                  <Text value={a.R15.altBestTime} onChange={(v) => set((x) => void (x.R15.altBestTime = v))} placeholder="Best time" />
                </div>
              </>
            )}
          </Question>
          <Question label="Are they in jail or prison?">
            <YesNo value={a.R16} onChange={(v) => set((x) => void (x.R16 = yn(v)))} />
          </Question>
          {a.R16 === "Y" && <Text value={a.R16facility} onChange={(v) => set((x) => void (x.R16facility = v))} placeholder="Name of the facility" />}
          <Question label="Is there anything the sheriff should know for safety?" hint="Check all that apply.">
            <Multi
              value={a.R21}
              onChange={(v) => set((x) => void (x.R21 = v))}
              columns
              options={[
                { value: "violent history", label: "History of violence or abuse" },
                { value: "military or first-responder training", label: "Military, police, or similar training" },
                { value: "probation or parole", label: "On probation or parole" },
                { value: "aggressive animal", label: "Has an aggressive animal" },
                { value: "mental health issues", label: "Mental health issues" },
                { value: "deaf or hard of hearing", label: "Deaf or hard of hearing" },
                { value: "other", label: "Something else" },
              ]}
            />
            {a.R21.includes("other") && <Text value={a.R21other} onChange={(v) => set((x) => void (x.R21other = v))} placeholder="What else?" />}
          </Question>
          {(a.R18 === "Y" || a.R17 === "N") && (
            <Note>
              {`We'll also tell the sheriff${a.R18 === "Y" ? " that they have guns" : ""}${a.R18 === "Y" && a.R17 === "N" ? " and" : ""}${
                a.R17 === "N" ? " that they don't speak English" : ""
              }, from your earlier answers.`}
            </Note>
          )}
          <Check checked={a.R22 === "Y"} onChange={(v) => set((x) => void (x.R22 = v ? "Y" : "N"))}>
            I&apos;ll give the sheriff a photo of them
          </Check>
          <Question label="Anything else the sheriff should know?" optional>
            <LongText value={a.V3} onChange={(v) => set((x) => void (x.V3 = v))} rows={3} />
          </Question>
        </Group>
      )}
    </div>
  );
}
