"use client";

/**
 * Step 4a · keeping a minor's information confidential (DV-160). Shown when PR14 = Y.
 * The request and the proposed order (DV-165) go in the court's confidential file.
 */
import { petitionerAge, under18 } from "../derive";
import { useWizard } from "../store";
import type { Answers } from "../types";
import { AddressInput, Choice, Group, LongText, Multi, Note, Question, Rows, Text } from "../ui/fields";
import type { StepProps } from "./types";

const them = (a: Answers) => a.R1.trim().split(/\s+/)[0] || "the other person";

const WHAT = [
  { value: "name", label: "Their name" },
  { value: "address", label: "Their address" },
  { value: "other", label: "Other information about them (like their school)" },
];

export function Confidential({ errors }: StepProps) {
  const { a, set } = useWizard();
  const minors = a.roster.filter((p) => p.name.trim() && under18(p, a.G1));
  const age = Number(petitionerAge(a));
  const iAmMinor = age > 0 && age < 18;
  const forOthers = a.M1 !== "the minor";
  return (
    <div className="space-y-8">
      <Group seen="court-confidential">
        <Note>
          {`This request (DV-160) is kept in the court's confidential file. The public can't see it. ${them(a)} can, unless you also ask to keep information from them below.`}
        </Note>
        <Question label="Who is asking?" error={errors.M1}>
          <Choice
            value={a.M1}
            onChange={(v) => set((x) => void (x.M1 = v))}
            options={[
              { value: "parent", label: "Me, as the child's parent" },
              { value: "legal guardian", label: "Me, as the child's legal guardian" },
              ...(iAmMinor ? [{ value: "the minor" as const, label: "Me, and I'm under 18" }] : []),
            ]}
          />
        </Question>
        {forOthers && (
          <Question label="Which children?" error={errors.M2}>
            <Multi<string>
              value={a.M2}
              onChange={(v) => set((x) => void (x.M2 = v))}
              options={minors.map((p) => ({ value: p.id, label: p.name }))}
            />
          </Question>
        )}
        {forOthers && a.M2.length >= 2 && (
          <Question label="Is it the same information for every child?">
            <Choice
              value={a.M3}
              onChange={(v) => set((x) => void (x.M3 = v))}
              options={[
                { value: "Y", label: "Yes" },
                { value: "N", label: "No" },
              ]}
            />
            {a.M3 === "N" && <Note>Explain which information goes with which child in the &quot;other information&quot; list below.</Note>}
          </Question>
        )}
      </Group>

      <Group title="Keep from the public" seen="court-confidential">
        <Question label="What should the public not be able to see?">
          <Multi value={a.M4} onChange={(v) => set((x) => void (x.M4 = v))} options={WHAT} />
        </Question>
        {a.M4.includes("address") && (
          <Question label="The address to keep private">
            <AddressInput value={a.M5} onChange={(v) => set((x) => void (x.M5 = v))} />
          </Question>
        )}
        {a.M4.includes("other") && (
          <Question label="List the information, and where it appears in your forms" hint="For example: their school's name, in DV-100 item 5.">
            <Rows<{ location: string; text: string }>
              items={a.M6}
              onChange={(v) => set((x) => void (x.M6 = v))}
              make={() => ({ location: "", text: "" })}
              addLabel="Add information"
              render={(r, up) => (
                <div className="grid gap-2 sm:grid-cols-2">
                  <Text value={r.text} onChange={(v) => up({ text: v })} placeholder="Information to hide" />
                  <Text value={r.location} onChange={(v) => up({ location: v })} placeholder="Where (form and item)" />
                </div>
              )}
            />
          </Question>
        )}
        <Question label="Why should it be kept from the public?">
          <LongText value={a.M7} onChange={(v) => set((x) => void (x.M7 = v))} rows={3} />
        </Question>
        <Question label="What do you think would happen if it weren't?">
          <LongText value={a.M8} onChange={(v) => set((x) => void (x.M8 = v))} rows={3} />
        </Question>
        <Question label="If the judge says no, do you want to:">
          <Choice
            value={a.M9}
            onChange={(v) => set((x) => void (x.M9 = v))}
            options={[
              { value: "go forward", label: "Go forward with my restraining order request", hint: "The information will be public." },
              { value: "cancel", label: "Cancel my restraining order request", hint: "You can file again later." },
            ]}
          />
        </Question>
      </Group>

      <Group title={`Keep from ${them(a)} too`} seen="court-confidential">
        <Question label={`Should any of it also be kept from ${them(a)}?`} hint="Optional. They must still get what they need to follow the order." optional>
          <Multi value={a.M10.what} onChange={(v) => set((x) => void (x.M10.what = v))} options={WHAT} />
        </Question>
        {a.M10.what.includes("other") && (
          <Text value={a.M10.otherText} onChange={(v) => set((x) => void (x.M10.otherText = v))} placeholder="What other information?" />
        )}
        {a.M10.what.length > 0 && (
          <>
            <Question label={`Why should it be kept from ${them(a)}?`}>
              <LongText value={a.M10.why} onChange={(v) => set((x) => void (x.M10.why = v))} rows={3} />
            </Question>
            <Question label="What do you think would happen if they got it?">
              <LongText value={a.M10.whatWouldHappen} onChange={(v) => set((x) => void (x.M10.whatWouldHappen = v))} rows={3} />
            </Question>
            <Question label="If the judge says no to this part, do you want to:">
              <Choice
                value={a.M10.ifDenied}
                onChange={(v) => set((x) => void (x.M10.ifDenied = v))}
                options={[
                  { value: "go forward", label: "Go forward with my restraining order request" },
                  { value: "cancel", label: "Cancel my restraining order request" },
                ]}
              />
            </Question>
          </>
        )}
      </Group>

      <Group title="Who else may see it" seen="court-confidential">
        <Question label="If the judge agrees, who else should be allowed to get full copies?" optional>
          <Multi
            value={a.M11.who}
            onChange={(v) => set((x) => void (x.M11.who = v))}
            options={[
              { value: "school", label: "The child's school or after-school program" },
              { value: "childcare", label: "The child's childcare provider" },
              { value: "supervised visitation provider", label: "A supervised visitation provider" },
              { value: "other", label: "Someone else" },
            ]}
          />
        </Question>
        {a.M11.who.includes("other") && (
          <Text value={a.M11.otherName} onChange={(v) => set((x) => void (x.M11.otherName = v))} placeholder="Name of person or organization" />
        )}
        {a.M11.who.length > 0 && (
          <Question label="With which information?">
            <Multi
              value={a.M11.what}
              onChange={(v) => set((x) => void (x.M11.what = v))}
              options={[
                { value: "name", label: "The child's name" },
                { value: "address", label: "The child's address" },
                { value: "5c information", label: "The other information listed above" },
              ]}
            />
          </Question>
        )}
      </Group>
    </div>
  );
}
