"use client";

/**
 * Step 8 · custody (DV-105, DV-105(A), DV-140) and Step 9 · abduction (DV-108, DV-145).
 * Shown only when custody is requested (O15). The children come from the roster.
 */
import { useState } from "react";

import { derive, fmtDate } from "../derive";
import { emptyResidence } from "../defaults";
import { useWizard } from "../store";
import { WEEKDAYS } from "../types";
import type { Answers, CaseRecord, CaseType, Guardian, LivedWith, Residence, ResidenceGroup, Schedule, Supervisor } from "../types";
import { Check, Choice, Group, LongText, Multi, Note, Question, Rows, Text, YesNo } from "../ui/fields";
import type { StepProps } from "./types";

const yn = (v: string) => (v === "Y" ? "Y" : "N");
const them = (a: Answers) => a.R1.trim().split(/\s+/)[0] || "the other person";

function GuardianQuestion({
  label,
  value,
  other,
  onChange,
  onOther,
  error,
}: {
  label: string;
  value: Guardian;
  other: string;
  onChange: (v: Guardian) => void;
  onOther: (v: string) => void;
  error?: string;
}) {
  return (
    <Question label={label} error={error}>
      <Choice
        value={value}
        onChange={onChange}
        options={[
          { value: "parent", label: "Parent" },
          { value: "legal guardian", label: "Legal guardian" },
          { value: "other", label: "Other" },
        ]}
      />
      {value === "other" && <Text value={other} onChange={onOther} placeholder="Describe" />}
    </Question>
  );
}

/** One place the children lived. Row 0 is where they live now. */
interface Place {
  label: string;
  city: string;
  state: string;
}

function ResidenceRow({
  r,
  i,
  up,
  respondent,
  places,
}: {
  r: Residence;
  i: number;
  up: (p: Partial<Residence>) => void;
  respondent: string;
  places: Place[];
}) {
  const picked = places.find((p) => p.city === r.city && p.state === r.state);
  return (
    <div className="space-y-4">
      <h4 className="text-base font-semibold text-slate-900">{i === 0 ? "Where they live now" : "Before that"}</h4>
      <div className="grid gap-4 sm:grid-cols-2">
        <Question label="From (month and year)">
          <Text type="month" value={r.from} onChange={(v) => up({ from: v })} />
        </Question>
        {i > 0 && (
          <Question label="Until">
            <Text type="month" value={r.until} onChange={(v) => up({ until: v })} />
          </Question>
        )}
      </div>
      {i === 0 && places.length > 0 && (
        <Question label="Where?">
          <Choice
            value={picked ? `${picked.city}|${picked.state}` : r.city ? "__other" : ""}
            onChange={(v) => {
              if (v === "__other") return up({ city: " ", state: "CA" });
              const [city, state] = v.split("|");
              up({ city, state });
            }}
            columns
            options={[
              ...places.map((p) => ({ value: `${p.city}|${p.state}`, label: p.label, hint: `${p.city}, ${p.state}` })),
              { value: "__other", label: "Somewhere else" },
            ]}
          />
        </Question>
      )}
      {(i > 0 || !places.length || (!!r.city && !picked)) && (
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="sm:col-span-2">
            <Question label="City" hint="Or tribal land.">
              <Text value={r.city.trim()} onChange={(v) => up({ city: v || " " })} />
            </Question>
          </div>
          <Question label="State">
            <Text value={r.state} onChange={(v) => up({ state: v })} />
          </Question>
        </div>
      )}
      {i === 0 && (
        <Check checked={r.private} onChange={(v) => up({ private: v })}>
          Keep this address private. The form will show only the state.
        </Check>
      )}
      <Question label="Who did the children live with there?">
        <Multi<LivedWith>
          value={r.livedWith}
          onChange={(v) => up({ livedWith: v })}
          options={[
            { value: "me", label: "Me" },
            { value: "respondent", label: respondent },
            { value: "other", label: "Someone else" },
          ]}
        />
      </Question>
      {r.livedWith.includes("other") && (
        <Question label="Their relationship to the children" hint="For example: grandmother, aunt.">
          <Text value={r.otherRelationship} onChange={(v) => up({ otherRelationship: v })} />
        </Question>
      )}
    </div>
  );
}

function ResidenceList({
  rows,
  onChange,
  respondent,
  places,
}: {
  rows: Residence[];
  onChange: (v: Residence[]) => void;
  respondent: string;
  places: Place[];
}) {
  return (
    <Rows<Residence>
      items={rows}
      onChange={onChange}
      make={emptyResidence}
      addLabel={rows.length ? "Add an earlier place" : "Add where they live now"}
      render={(r, up, i) => <ResidenceRow r={r} i={i} up={up} respondent={respondent} places={places} />}
    />
  );
}

function CaseRows({ items, onChange }: { items: CaseRecord[]; onChange: (v: CaseRecord[]) => void }) {
  return (
    <Rows<CaseRecord>
      items={items}
      onChange={onChange}
      make={() => ({ type: "juvenile", kind: "", where: "", year: "", caseNumber: "", kids: "Y" })}
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
        </div>
      )}
    />
  );
}

/** Step 8a · the children: parents, where they lived, other cases. */
export function Children({ errors }: StepProps) {
  const { a, set } = useWizard();
  const d = derive(a);
  const kids = d.custodyKids;
  const respondent = a.R1 || "The other person";
  const [editParents, setEditParents] = useState(a.PR11 !== "parent" || a.PR12 !== "parent");
  // Addresses already given, offered as one-tap answers for where the children live now.
  const places: Place[] = [];
  const addPlace = (label: string, city: string, state: string) => {
    if (city.trim() && !places.some((p) => p.city === city && p.state === state)) places.push({ label, city, state: state || "CA" });
  };
  addPlace("Where I live (my mailing address)", a.P6.city, a.P6.state);
  if (a.RL4 === "together") addPlace(`With me and ${them(a)}`, a.R14.city, a.R14.state);
  if (a.O13.address.trim()) {
    const m = /,\s*([^,]+),\s*([A-Z]{2})\b/.exec(a.O13.address);
    if (m) addPlace("The home in my move-out request", m[1], m[2]);
  }
  return (
    <div className="space-y-8">
      <Group seen="public">
        {kids.length === 0 ? (
          <Note tone="warn">
            We don&apos;t have any children under 18 that you share with {them(a)}. Go back to <strong>People to protect</strong>{" "}
            and add them, answering yes to &quot;Is this a child you have with the other person?&quot;
          </Note>
        ) : (
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="text-sm text-slate-600">The custody request is for:</p>
            <ul className="mt-1 text-base text-slate-900">
              {kids.map((k) => (
                <li key={k.id}>
                  {k.name}
                  {k.dob && <span className="text-slate-500"> · born {fmtDate(k.dob)}</span>}
                </li>
              ))}
            </ul>
          </div>
        )}
        {!editParents ? (
          <div className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-4">
            <p className="text-base text-slate-800">You and {them(a)} are the children&apos;s parents.</p>
            <button type="button" onClick={() => setEditParents(true)} className="text-sm font-medium text-liz hover:underline">
              Not right? Change
            </button>
          </div>
        ) : (
          <>
            <GuardianQuestion
              label="What is your relationship to the children?"
              value={a.PR11}
              other={a.PR11other}
              onChange={(v) => set((x) => void (x.PR11 = v))}
              onOther={(v) => set((x) => void (x.PR11other = v))}
              error={errors.PR11}
            />
            <GuardianQuestion
              label={`What is ${them(a)}'s relationship to the children?`}
              value={a.PR12}
              other={a.PR12other}
              onChange={(v) => set((x) => void (x.PR12 = v))}
              onOther={(v) => set((x) => void (x.PR12other = v))}
              error={errors.PR12}
            />
          </>
        )}
        <Question label="Is there another parent or legal guardian?" hint={`Besides you and ${them(a)}.`}>
          <YesNo value={a.PR13.has} onChange={(v) => set((x) => void (x.PR13.has = yn(v)))} />
        </Question>
        {a.PR13.has === "Y" && (
          <div className="grid gap-4 sm:grid-cols-2">
            <Question label="Their name">
              <Text value={a.PR13.name} onChange={(v) => set((x) => void (x.PR13.name = v))} />
            </Question>
            <Question label="They are a">
              <Choice
                value={a.PR13.role}
                onChange={(v) => set((x) => void (x.PR13.role = v))}
                options={[
                  { value: "parent", label: "Parent" },
                  { value: "legal guardian", label: "Legal guardian" },
                ]}
              />
            </Question>
          </div>
        )}
      </Group>

      <Group title="Where the children have lived" seen="public">
        <Question
          label="Have all the children lived in the same places for the last five years?"
          hint="The judge needs five years of history to decide which court handles custody."
          error={errors.K1}
        >
          <YesNo
            value={a.K1}
            onChange={(v) =>
              set((x) => {
                x.K1 = yn(v);
                // Start the history with where they live now, from answers already given.
                const now = x.K2[0];
                if (x.K1 === "Y" && now && !now.city.trim() && places[0]) {
                  now.city = places[0].city;
                  now.state = places[0].state;
                  if (!now.livedWith.length && kids.every((k) => k.livesWithYou === "Y")) now.livedWith = ["me"];
                }
              })
            }
          />
        </Question>
        {a.K1 === "Y" && (
          <>
            <p className="text-sm text-slate-600">Start with where they live now, then go back five years.</p>
            <ResidenceList rows={a.K2} onChange={(v) => set((x) => void (x.K2 = v))} respondent={respondent} places={places} />
          </>
        )}
        {a.K1 === "N" && (
          <>
            <p className="text-sm text-slate-600">
              Make a group for children who lived in the same places, and list where each group lived. This goes on form DV-105(A).
            </p>
            <Rows<ResidenceGroup>
              items={a.K2A}
              onChange={(v) => set((x) => void (x.K2A = v))}
              make={() => ({ children: [], rows: [emptyResidence()] })}
              addLabel={a.K2A.length ? "Add another group" : "Add a group"}
              render={(g, up, gi) => (
                <div className="space-y-5">
                  <Question label={`Group ${gi + 1}: which children?`}>
                    <Multi<string>
                      value={g.children}
                      onChange={(v) => up({ children: v })}
                      options={kids.map((k) => ({ value: k.id, label: k.name }))}
                    />
                  </Question>
                  <ResidenceList rows={g.rows} onChange={(v) => up({ rows: v })} respondent={respondent} places={places} />
                </div>
              )}
            />
          </>
        )}
      </Group>

      <Group title="Other cases and orders" seen="public">
        {a.C3 === "Y" && a.C4.length > 0 && (
          <Question label="Which of the cases you listed earlier involve your children?" hint="Checked cases go on the custody form too.">
            <div className="space-y-2">
              {a.C4.map((c, i) => (
                <Check key={i} checked={c.kids === "Y"} onChange={(v) => set((x) => void (x.C4[i].kids = v ? "Y" : "N"))}>
                  {c.type === "other" ? c.kind || "Other" : c.type[0].toUpperCase() + c.type.slice(1)} case
                  {[c.where, c.year, c.caseNumber && `no. ${c.caseNumber}`].filter(Boolean).length > 0 &&
                    ` — ${[c.where, c.year, c.caseNumber && `no. ${c.caseNumber}`].filter(Boolean).join(", ")}`}
                </Check>
              ))}
            </div>
          </Question>
        )}
        <Question label={`Any ${a.C3 === "Y" && a.C4.length ? "other " : ""}court case about your children that doesn't involve ${them(a)}?`} hint="For example a juvenile court or guardianship case.">
          <YesNo value={a.C5} onChange={(v) => set((x) => void (x.C5 = yn(v)))} />
        </Question>
        {a.C5 === "Y" && <CaseRows items={a.C5cases} onChange={(v) => set((x) => void (x.C5cases = v))} />}
        <Question label="Is there a custody or visitation order in effect now?">
          <YesNo value={a.C6} onChange={(v) => set((x) => void (x.C6 = yn(v)))} />
        </Question>
        {a.C6 === "Y" && (
          <>
            <Question label="What did the judge order?" hint="Who has custody, and the visit schedule.">
              <LongText value={a.C7} onChange={(v) => set((x) => void (x.C7 = v))} rows={3} />
            </Question>
            <Question label="Why do you want it changed?">
              <LongText value={a.C8} onChange={(v) => set((x) => void (x.C8 = v))} rows={3} />
            </Question>
            <Note>Bring a copy of that order when you file, if you have one.</Note>
          </>
        )}
      </Group>
    </div>
  );
}

function SupervisorEditor({ s, onChange, what }: { s: Supervisor; onChange: (p: Partial<Supervisor>) => void; what: string }) {
  return (
    <div className="space-y-4 rounded-xl border border-slate-200 p-4">
      <Question label={`Who should supervise ${what}?`}>
        <Choice
          value={s.type}
          onChange={(v) => onChange({ type: v })}
          options={[
            { value: "professional", label: "A professional", hint: "A paid supervision provider" },
            { value: "trusted person", label: "Someone I trust", hint: "Like a relative or friend" },
          ]}
        />
      </Question>
      {s.type && (
        <Question label="Their name" optional={s.type === "professional"} hint={s.type === "professional" ? "If you know it." : undefined}>
          <Text value={s.name} onChange={(v) => onChange({ name: v })} />
        </Question>
      )}
      {s.type === "professional" && (
        <Question label="Who pays the fees? (percent)" optional>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {(
              [
                ["feeMe", "Me (%)", "numeric"],
                ["feeRespondent", "Them (%)", "numeric"],
                ["feeOtherName", "Someone else (name)", "text"],
                ["feeOther", "Someone else (%)", "numeric"],
              ] as const
            ).map(([k, label, mode]) => (
              <label key={k} className="block space-y-1 text-sm text-slate-600">
                <span>{label}</span>
                <Text value={s[k]} onChange={(v) => onChange({ [k]: v })} inputMode={mode} />
              </label>
            ))}
          </div>
        </Question>
      )}
      {s.type === "trusted person" && (
        <Check checked={s.agreed} onChange={(v) => onChange({ agreed: v })}>
          They have agreed to do this
        </Check>
      )}
    </div>
  );
}

function ScheduleEditor({ s, onChange }: { s: Schedule; onChange: (fn: (s: Schedule) => void) => void }) {
  return (
    <div className="space-y-4 rounded-xl border border-slate-200 p-4">
      <p className="text-sm text-slate-600">Check each day with a visit.</p>
      {WEEKDAYS.map((day) => {
        const v = s.days[day];
        return (
          <div key={day} className="space-y-3">
            <Check checked={v.on} onChange={(on) => onChange((x) => void (x.days[day].on = on))}>
              {{ Mon: "Monday", Tue: "Tuesday", Wed: "Wednesday", Thu: "Thursday", Fri: "Friday", Sat: "Saturday", Sun: "Sunday" }[day]}
            </Check>
            {v.on && (
              <div className="grid gap-3 pl-8 sm:grid-cols-2">
                <Question label="Start">
                  <Text type="time" value={v.start} onChange={(t) => onChange((x) => void (x.days[day].start = t))} />
                </Question>
                <Question label="End" optional>
                  <Text type="time" value={v.end} onChange={(t) => onChange((x) => void (x.days[day].end = t))} />
                </Question>
                <Question label="Who brings the children?" hint="Or makes them available for a video visit.">
                  <Text value={v.whoBrings} onChange={(t) => onChange((x) => void (x.days[day].whoBrings = t))} />
                </Question>
                <Question label="Drop-off and pick-up place">
                  <Text value={v.place} onChange={(t) => onChange((x) => void (x.days[day].place = t))} />
                </Question>
                <div className="sm:col-span-2">
                  <Check checked={v.virtual} onChange={(c) => onChange((x) => void (x.days[day].virtual = c))}>
                    This is a video or phone visit
                  </Check>
                </div>
              </div>
            )}
          </div>
        );
      })}
      <Question label="Repeat">
        <Choice
          value={s.repeat}
          onChange={(v) => onChange((x) => void (x.repeat = v))}
          options={[
            { value: "every week", label: "Every week" },
            { value: "every other week", label: "Every other week" },
            { value: "other", label: "Other" },
          ]}
        />
      </Question>
      {s.repeat === "other" && <Text value={s.repeatOther} onChange={(v) => onChange((x) => void (x.repeatOther = v))} placeholder="Describe" />}
      <Question label="Start date">
        <Text type="date" value={s.startDate} onChange={(v) => onChange((x) => void (x.startDate = v))} className="sm:w-56" />
      </Question>
    </div>
  );
}

/** Pre-check DV-108 reasons the user already told us about (map Step 9). */
function prefillAbduction(x: Answers) {
  if (x.B4.length === 0 && x.cards.some((c) => c.A6.trim())) x.B4 = ["abusing you"];
}

/** Step 8b · custody orders, travel, records, and visits. */
export function CustodyOrders({ errors }: StepProps) {
  const { a, set } = useWizard();
  const d = derive(a);
  const name = them(a);
  const visits = a.K7 === "yes" || a.K7 === "virtual only";
  return (
    <div className="space-y-8">
      <Group title="Custody" seen="public">
        <Question
          label="Do you want the judge to make custody orders now?"
          more={
            <>
              <strong>Legal custody</strong> is who makes decisions about the children&apos;s health, school, and welfare.{" "}
              <strong>Physical custody</strong> is who the children live with. Orders now last until your court date.
            </>
          }
        >
          <YesNo value={a.K6.on} onChange={(v) => set((x) => void (x.K6.on = yn(v)))} />
        </Question>
        {a.K6.on === "Y" &&
          (
            [
              ["legal", "legalOther", "Legal custody (decisions)"],
              ["physical", "physicalOther", "Physical custody (where they live)"],
            ] as const
          ).map(([k, other, label]) => (
            <Question key={k} label={label}>
              <Choice
                value={a.K6[k]}
                onChange={(v) => set((x) => void (x.K6[k] = v))}
                columns
                options={[
                  { value: "sole to me", label: "Only me" },
                  { value: "sole to respondent", label: `Only ${name}` },
                  { value: "joint", label: "Shared by both of us" },
                  { value: "other", label: "Other" },
                ]}
              />
              {a.K6[k] === "other" && <Text value={a.K6[other]} onChange={(v) => set((x) => void (x.K6[other] = v))} placeholder="Describe" />}
            </Question>
          ))}
      </Group>

      <Group title="Visits until your court date" seen="public">
        <Question label={`Should ${name} have visits with the children?`} error={errors.K7}>
          <Choice
            value={a.K7}
            onChange={(v) => set((x) => void (x.K7 = v))}
            options={[
              { value: "no visits", label: "No visits" },
              { value: "yes", label: "Yes" },
              { value: "virtual only", label: "Only video or phone visits" },
            ]}
          />
        </Question>
        {visits && (
          <Question label="Should someone else supervise the visits?" hint="A supervisor stays with the children during the visit.">
            <YesNo value={a.K8} onChange={(v) => set((x) => void (x.K8 = yn(v)))} />
          </Question>
        )}
        {visits && a.K8 === "Y" && (
          <>
            <SupervisorEditor s={a.K9} onChange={(p) => set((x) => void Object.assign(x.K9, p))} what="the visits" />
            {a.K7 !== "virtual only" && <VisitPlace />}
            <Question label="How often and how long?">
              <Choice
                value={a.K11.kind}
                onChange={(v) => set((x) => void (x.K11.kind = v))}
                columns
                options={[
                  { value: "once a week", label: "Once a week" },
                  { value: "twice a week", label: "Twice a week" },
                  { value: "schedule", label: "Set days and times" },
                  { value: "other", label: "Other" },
                ]}
              />
            </Question>
            {(a.K11.kind === "once a week" || a.K11.kind === "twice a week") && (
              <Question label="Hours each visit">
                <Text value={a.K11.hours} onChange={(v) => set((x) => void (x.K11.hours = v))} inputMode="numeric" className="w-28" />
              </Question>
            )}
            {a.K11.kind === "other" && (
              <Question label="Describe">
                <Text value={a.K11.otherText} onChange={(v) => set((x) => void (x.K11.otherText = v))} />
              </Question>
            )}
            {a.K11.kind === "schedule" && <ScheduleEditor s={a.K14} onChange={(fn) => set((x) => fn(x.K14))} />}
          </>
        )}
        {visits && a.K8 === "N" && (
          <>
            <Question label="Should drop-off and pick-up be supervised?" hint="Someone else hands the children over, so you don't have to meet.">
              <YesNo value={a.K12on} onChange={(v) => set((x) => void (x.K12on = yn(v)))} />
            </Question>
            {a.K12on === "Y" && <SupervisorEditor s={a.K12} onChange={(p) => set((x) => void Object.assign(x.K12, p))} what="drop-off and pick-up" />}
            {a.K7 !== "virtual only" && <VisitPlace />}
            <Question label="When should visits happen, and who drives?" hint="For example: every other weekend, Saturday 10 AM to Sunday 5 PM.">
              <LongText value={a.K13} onChange={(v) => set((x) => void (x.K13 = v))} rows={3} />
            </Question>
            <Check checked={a.K14use} onChange={(v) => set((x) => void (x.K14use = v))}>
              Add a weekly chart with days and times
            </Check>
            {a.K14use && <ScheduleEditor s={a.K14} onChange={(fn) => set((x) => fn(x.K14))} />}
          </>
        )}
      </Group>

      <Group title="Travel, records, and abduction" seen="public">
        <Question label={`Do you want to limit where ${name} can take the children?`}>
          <YesNo value={a.K3.on} onChange={(v) => set((x) => void (x.K3.on = yn(v)))} />
        </Question>
        {a.K3.on === "Y" && (
          <>
            <Question label="They would need your written permission or a court order to take the children out of:">
              <Multi
                value={a.K3.places}
                onChange={(v) => set((x) => void (x.K3.places = v))}
                options={[
                  { value: "this county", label: a.S1 ? `${a.S1} County` : "This county" },
                  { value: "California", label: "California" },
                  { value: "other", label: "Other places" },
                ]}
              />
            </Question>
            {a.K3.places.includes("other") && (
              <Text value={a.K3.otherPlaces} onChange={(v) => set((x) => void (x.K3.otherPlaces = v))} placeholder="List the places" />
            )}
          </>
        )}
        <Question label={`Should ${name} be blocked from the children's records?`} hint="Providers like doctors and schools won't release them to them.">
          <YesNo value={a.K4.on} onChange={(v) => set((x) => void (x.K4.on = yn(v)))} />
        </Question>
        {a.K4.on === "Y" && (
          <>
            {d.custodyKids.length > 1 && (
              <Question label="For which children?">
                <Choice
                  value={a.K4.children}
                  onChange={(v) => set((x) => void (x.K4.children = v))}
                  options={[
                    { value: "all", label: "All of them" },
                    { value: "named", label: "Only some" },
                  ]}
                />
                {a.K4.children === "named" && (
                  <Multi<string>
                    value={a.K4.named}
                    onChange={(v) => set((x) => void (x.K4.named = v))}
                    options={d.custodyKids.map((k) => ({ value: k.id, label: k.name }))}
                  />
                )}
              </Question>
            )}
            <Question label="Which records?">
              <Multi
                value={a.K4.records}
                onChange={(v) => set((x) => void (x.K4.records = v))}
                columns
                options={[
                  { value: "medical", label: "Medical, dental, and mental health" },
                  { value: "school", label: "School and daycare" },
                  { value: "activities", label: "Activities, camps, and sports" },
                  { value: "child's job", label: "The child's job or volunteering" },
                  { value: "other", label: "Other" },
                ]}
              />
            </Question>
            {a.K4.records.includes("other") && (
              <Text value={a.K4.otherText} onChange={(v) => set((x) => void (x.K4.otherText = v))} placeholder="Other records" />
            )}
          </>
        )}
        <Question label={`Do you think ${name} might take the children and hide them from you?`} hint="If yes, we'll ask a few more questions for form DV-108.">
          <YesNo
            value={a.K5}
            onChange={(v) =>
              set((x) => {
                x.K5 = yn(v);
                if (x.K5 === "Y") prefillAbduction(x);
              })
            }
          />
        </Question>
      </Group>
    </div>
  );
}

function VisitPlace() {
  const { a, set } = useWizard();
  return (
    <Question label="Where should visits happen?">
      <Choice
        value={a.K10.kind}
        onChange={(v) => set((x) => void (x.K10.kind = v))}
        options={[
          { value: "safe place", label: "In person at a safe place" },
          { value: "virtual", label: "Video or phone" },
          { value: "other", label: "Other" },
        ]}
      />
      {a.K10.kind === "other" && <Text value={a.K10.otherText} onChange={(v) => set((x) => void (x.K10.otherText = v))} placeholder="Describe" />}
    </Question>
  );
}

const PROTECTIONS: [string, string][] = [
  ["no move without permission", "Don't move with the children without my written permission or a court order"],
  ["surrender documents", "Turn in passports and other travel documents"],
  ["travel plan", "Give me a travel plan before any trip"],
  ["register in another state", "Register this order in another state before visits there"],
  ["notify embassy", "Tell an embassy or consulate about passport limits"],
  ["foreign custody order", "Get a matching custody order in another country before travel there"],
  ["bond", "Post a bond (money that can be used to bring the children back)"],
];

/** Step 9 · preventing abduction (DV-108). */
export function Abduction() {
  const { a, set } = useWizard();
  const name = them(a);
  const want = (v: string) => a.B9.includes(v);
  return (
    <div className="space-y-8">
      <Group title={`Why you're worried ${name} might take the children`} seen="public">
        <Question label="Have they broken, or threatened to break, a custody or visitation order?" hint={a.C6 === "Y" ? "You said there's a custody order now." : undefined}>
          <YesNo value={a.B1} onChange={(v) => set((x) => void (x.B1 = yn(v)))} />
        </Question>
        <Question label="Do they lack strong ties to California?" hint="Like family, a job, or a home here.">
          <YesNo value={a.B2} onChange={(v) => set((x) => void (x.B2 = yn(v)))} />
        </Question>
        <Question label="Have they recently done any of these?">
          <Multi
            value={a.B3}
            onChange={(v) => set((x) => void (x.B3 = v))}
            columns
            options={[
              { value: "quit a job", label: "Quit a job" },
              { value: "closed a bank account", label: "Closed a bank account" },
              { value: "sold or got rid of property", label: "Sold or got rid of property" },
              { value: "sold a home or ended a lease", label: "Sold a home or ended a lease" },
              { value: "applied for documents", label: "Applied for a passport, birth certificate, or school or medical records" },
              { value: "hid or destroyed documents", label: "Hid or destroyed documents" },
              { value: "other", label: "Something else" },
            ]}
          />
        </Question>
        {a.B3.includes("other") && <Text value={a.B3other} onChange={(v) => set((x) => void (x.B3other = v))} placeholder="What did they do?" />}
        <Question label="Do they have a history of any of these?">
          <Multi
            value={a.B4}
            onChange={(v) => set((x) => void (x.B4 = v))}
            columns
            options={[
              { value: "abusing you", label: "Abusing me" },
              { value: "child abuse", label: "Child abuse" },
              { value: "abusing other partners", label: "Abusing other partners" },
              { value: "taking or hiding the children", label: "Taking or hiding the children from me" },
              { value: "threatening to take the children", label: "Threatening to take or hide the children" },
              { value: "not cooperating in parenting", label: "Not cooperating with me in parenting" },
            ]}
          />
        </Question>
        <Question label="Do they have a criminal record?">
          <YesNo value={a.B5} onChange={(v) => set((x) => void (x.B5 = yn(v)))} />
        </Question>
        <Question label="Do they have strong ties somewhere else?">
          <Multi
            value={a.B6}
            onChange={(v) => set((x) => void (x.B6 = v))}
            options={[
              { value: "another county", label: "Another California county" },
              { value: "another state", label: "Another state" },
              { value: "another country", label: "Another country" },
            ]}
          />
        </Question>
        <div className="grid gap-2 sm:grid-cols-3">
          {a.B6.includes("another county") && <Text value={a.B6county} onChange={(v) => set((x) => void (x.B6county = v))} placeholder="Which county?" />}
          {a.B6.includes("another state") && <Text value={a.B6state} onChange={(v) => set((x) => void (x.B6state = v))} placeholder="Which state?" />}
          {a.B6.includes("another country") && <Text value={a.B6country} onChange={(v) => set((x) => void (x.B6country = v))} placeholder="Which country?" />}
        </div>
        <Question label="Are they a citizen of another country?">
          <YesNo value={a.B7.citizen} onChange={(v) => set((x) => void (x.B7.citizen = yn(v)))} />
        </Question>
        {a.B7.citizen === "Y" && (
          <>
            <Text value={a.B7.countries} onChange={(v) => set((x) => void (x.B7.countries = v))} placeholder="Which country or countries?" />
            <Question label="Do they have strong family, cultural, or emotional ties there?">
              <YesNo value={a.B7.strongTies} onChange={(v) => set((x) => void (x.B7.strongTies = yn(v)))} />
            </Question>
          </>
        )}
        <Question label="Give examples or reasons for your answers" hint="What they said or did that worries you.">
          <LongText value={a.B8} onChange={(v) => set((x) => void (x.B8 = v))} rows={4} />
        </Question>
      </Group>

      <Group title="Protections you want" seen="public">
        <Multi value={a.B9} onChange={(v) => set((x) => void (x.B9 = v))} options={PROTECTIONS.map(([value, label]) => ({ value, label }))} columns />
        {want("surrender documents") && (
          <div className="grid gap-4 sm:grid-cols-3">
            <Question label="Which documents?">
              <Text value={a.B10.documents} onChange={(v) => set((x) => void (x.B10.documents = v))} placeholder="Passports, visas…" />
            </Question>
            <Question label="Turn in by">
              <Text type="date" value={a.B10.date} onChange={(v) => set((x) => void (x.B10.date = v))} />
            </Question>
            <Question label="Give them to">
              <Text value={a.B10.giveTo} onChange={(v) => set((x) => void (x.B10.giveTo = v))} />
            </Question>
          </div>
        )}
        {want("travel plan") && (
          <Question label="Before a trip, they must give you:">
            <Multi
              value={a.B11}
              onChange={(v) => set((x) => void (x.B11 = v))}
              columns
              options={[
                { value: "schedule", label: "The children's travel schedule" },
                { value: "round-trip tickets", label: "Copies of round-trip tickets" },
                { value: "addresses and phones", label: "Addresses and phone numbers where the children will be" },
                { value: "open ticket for you", label: "An open ticket for me, in case the children aren't returned" },
                { value: "other", label: "Other" },
              ]}
            />
            {a.B11.includes("other") && <Text value={a.B11other} onChange={(v) => set((x) => void (x.B11other = v))} placeholder="Describe" />}
          </Question>
        )}
        {want("register in another state") && (
          <Question label="County and state to register in">
            <Text value={a.B12} onChange={(v) => set((x) => void (x.B12 = v))} />
          </Question>
        )}
        {want("notify embassy") && (
          <div className="grid gap-4 sm:grid-cols-2">
            <Question label="Embassy or consulate">
              <Text value={a.B13.embassy} onChange={(v) => set((x) => void (x.B13.embassy = v))} />
            </Question>
            <Question label="Proof due by">
              <Text type="date" value={a.B13.proofDate} onChange={(v) => set((x) => void (x.B13.proofDate = v))} />
            </Question>
          </div>
        )}
        {want("foreign custody order") && (
          <Question label="Which country?">
            <Text value={a.B14} onChange={(v) => set((x) => void (x.B14 = v))} />
          </Question>
        )}
        {want("bond") && (
          <Question label="Bond amount ($)">
            <Text value={a.B15} onChange={(v) => set((x) => void (x.B15 = v))} inputMode="decimal" className="w-40" />
          </Question>
        )}
      </Group>
    </div>
  );
}
