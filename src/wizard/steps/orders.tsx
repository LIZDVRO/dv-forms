"use client";

import type { ReactNode } from "react";

import { LIZ_FEE, oneLine } from "../derive";
import { useWizard } from "../store";
import type { Animal, Debt, Expense, OrderId, PhoneNumber } from "../types";
import { AddressInput, Check, Choice, Group, LongText, Multi, Note, Question, Rows, Text, YesNo } from "../ui/fields";

function Order({ id, title, hint, children }: { id: OrderId; title: ReactNode; hint?: ReactNode; children?: ReactNode }) {
  const { a, set } = useWizard();
  const on = !!a.orders[id];
  return (
    <div className={`rounded-xl border p-4 ${on ? "border-liz/50 bg-liz/5" : "border-slate-200 bg-white"}`}>
      <label className="flex cursor-pointer items-start gap-3">
        <input
          type="checkbox"
          checked={on}
          onChange={(e) => set((x) => void (x.orders[id] = e.target.checked))}
          className="mt-1 h-5 w-5 accent-liz"
        />
        <span>
          <span className="block text-base font-medium text-slate-900">{title}</span>
          {hint && <span className="block text-sm text-slate-600">{hint}</span>}
        </span>
      </label>
      {on && children && <div className="mt-4 space-y-5 border-t border-liz/15 pt-4">{children}</div>}
    </div>
  );
}

/** Pick an address you already gave, or type another. */
function AddressPick({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { label: string; address: string }[];
}) {
  const known = options.find((o) => o.address === value);
  // A single space marks "another address" chosen before anything is typed.
  const other = !!value && !known;
  return (
    <div className="space-y-2">
      <Choice
        value={known ? known.address : other ? "__other" : ""}
        onChange={(v) => onChange(v === "__other" ? " " : v)}
        columns
        options={[
          ...options.map((o) => ({ value: o.address, label: o.label, hint: o.address })),
          { value: "__other", label: "Another address" },
        ]}
      />
      {(other || !options.length) && (
        <Text value={value.trim()} onChange={(v) => onChange(v || " ")} placeholder="Street, city, ZIP" />
      )}
    </div>
  );
}

/** Step 7 · the orders you want (DV-100 items 10–28, minus support and fees for now). */
export function Orders() {
  const { a, set } = useWizard();
  const married = a.RL1.includes("married");
  const hasProtected = a.roster.some((p) => p.protect === "Y");
  const hasChild = a.RL1.includes("children") || a.roster.some((p) => p.relationship.toLowerCase().includes("child"));
  return (
    <div className="space-y-4">
      <Group seen="public">
        <p className="text-base text-slate-700">Check each order you want the judge to make. Stopping the abuse is already checked.</p>
        <Order id="O10" title="Stop the abuse" hint="They must not harass, threaten, hit, follow, or stalk you." />
        <Order id="O11" title="No contact" hint="No calls, texts, messages, or contact through other people." />
        <Order id="O12" title="Stay away" hint="Keep a set distance from you and the places you choose.">
          <Question label="Stay away from:">
            <Multi
              value={a.O12.places}
              onChange={(v) => set((x) => void (x.O12.places = v))}
              columns
              options={[
                { value: "me", label: "Me" },
                { value: "my home", label: "My home" },
                { value: "my job", label: "My job or workplace" },
                { value: "my vehicle", label: "My vehicle" },
                { value: "my school", label: "My school" },
                ...(hasProtected ? [{ value: "protected people", label: "The people I listed to protect" }] : []),
                ...(hasChild ? [{ value: "children's school or childcare", label: "My children's school or childcare" }] : []),
                { value: "other", label: "Other" },
              ]}
            />
          </Question>
          {a.O12.places.includes("other") && (
            <Question label="Other place">
              <Text value={a.O12.placesOther} onChange={(v) => set((x) => void (x.O12.placesOther = v))} />
            </Question>
          )}
          <Question label="How far away?">
            <Choice
              value={a.O12.distance}
              onChange={(v) => set((x) => void (x.O12.distance = v))}
              options={[
                { value: "100 yards", label: "100 yards (300 feet)" },
                { value: "other", label: "Other distance" },
              ]}
            />
          </Question>
          {a.O12.distance === "other" && (
            <Question label="Distance in yards">
              <Text value={a.O12.distanceYards} onChange={(v) => set((x) => void (x.O12.distanceYards = v))} inputMode="numeric" className="w-32" />
            </Question>
          )}
          <Question label="Do you work at the same place or go to the same school?" optional>
            <div className="grid gap-2 sm:grid-cols-3">
              <Text value={a.O12.workCompany} onChange={(v) => set((x) => void (x.O12.workCompany = v))} placeholder="Same company" />
              <Text value={a.O12.school} onChange={(v) => set((x) => void (x.O12.school = v))} placeholder="Same school" />
              <Text value={a.O12.sameOther} onChange={(v) => set((x) => void (x.O12.sameOther = v))} placeholder="Other" />
            </div>
          </Question>
        </Order>
        <Order id="O13" title="Make them move out" hint="If you live together.">
          <Question label="Which home?">
            <AddressPick
              value={a.O13.address}
              onChange={(v) => set((x) => void (x.O13.address = v))}
              options={[
                ...(a.R14.street ? [{ label: `${a.R1.split(" ")[0] || "Their"}'s address`, address: oneLine(a.R14) }] : []),
                ...(a.P6.street ? [{ label: "My mailing address", address: oneLine(a.P6) }] : []),
              ]}
            />
          </Question>
          {a.O13.address && a.P6.street && a.O13.address.toLowerCase().includes(a.P6.street.toLowerCase()) && (
            <Note tone="warn">This is the same as the mailing address you gave. The other person will see it on your request.</Note>
          )}
          <Question label="Why do you have the right to live there?">
            <Multi
              value={a.O13.reasons}
              onChange={(v) => set((x) => void (x.O13.reasons = v))}
              columns
              options={[
                { value: "own", label: "I own the home" },
                { value: "lease", label: "My name is on the lease" },
                { value: "live there with my children", label: "I live there with my children" },
                { value: "pay rent or mortgage", label: "I pay some or all of the rent or mortgage" },
                { value: "lived there", label: "I've lived there a while" },
                { value: "other", label: "Other" },
              ]}
            />
          </Question>
          {a.O13.reasons.includes("lived there") && (
            <div className="grid grid-cols-2 gap-4 sm:w-80">
              <Question label="Years">
                <Text value={a.O13.years} onChange={(v) => set((x) => void (x.O13.years = v))} inputMode="numeric" />
              </Question>
              <Question label="Months">
                <Text value={a.O13.months} onChange={(v) => set((x) => void (x.O13.months = v))} inputMode="numeric" />
              </Question>
            </div>
          )}
          {a.O13.reasons.includes("other") && (
            <Question label="Other reason">
              <Text value={a.O13.otherText} onChange={(v) => set((x) => void (x.O13.otherText = v))} />
            </Question>
          )}
        </Order>
        {a.RL1.includes("children") && (
          <Order
            id="O15"
            title="Child custody and visitation"
            hint="Temporary orders about who the children live with and visits. We'll ask about this next."
          >
            {!a.roster.some((p) => p.sharedChild === "Y") && (
              <Note tone="warn">
                Add your children on the <strong>People to protect</strong>{" "}step, and answer yes to &quot;Is this a child you have with the
                other person?&quot;
              </Note>
            )}
          </Order>
        )}
        <Order id="O16" title="Protect my animals">
          <Rows<Animal>
            items={a.O16.animals}
            onChange={(v) => set((x) => void (x.O16.animals = v))}
            make={() => ({ name: "", type: "", breed: "", color: "" })}
            addLabel="Add an animal"
            render={(x, up) => (
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                <Text value={x.name} onChange={(v) => up({ name: v })} placeholder="Name" />
                <Text value={x.type} onChange={(v) => up({ type: v })} placeholder="Type (dog, cat…)" />
                <Text value={x.breed} onChange={(v) => up({ breed: v })} placeholder="Breed" />
                <Text value={x.color} onChange={(v) => up({ color: v })} placeholder="Color" />
              </div>
            )}
          />
          <Check checked={a.O16.stayAway} onChange={(v) => set((x) => void (x.O16.stayAway = v))}>
            They must stay at least 100 yards from the animals
          </Check>
          <Check checked={a.O16.noHarm} onChange={(v) => set((x) => void (x.O16.noHarm = v))}>
            They must not take, sell, hide, or harm the animals
          </Check>
          <Check checked={a.O16.soleCare} onChange={(v) => set((x) => void (x.O16.soleCare = v))}>
            Give me sole care of the animals
          </Check>
          {a.O16.soleCare && (
            <Question label="Because:">
              <Multi
                value={a.O16.soleCareWhy}
                onChange={(v) => set((x) => void (x.O16.soleCareWhy = v))}
                options={[
                  { value: "they abuse the animals", label: "They abuse the animals" },
                  { value: "I care for them", label: "I take care of them" },
                  { value: "I bought them", label: "I bought them" },
                  { value: "other", label: "Other" },
                ]}
              />
            </Question>
          )}
          {a.O16.soleCareWhy.includes("other") && (
            <Text value={a.O16.soleCareOther} onChange={(v) => set((x) => void (x.O16.soleCareOther = v))} placeholder="Other reason" />
          )}
        </Order>
        <Order id="O17" title="Give me control of property" hint="For example a car, phone, or keys.">
          <Question label="What property?">
            <Text value={a.O17.property} onChange={(v) => set((x) => void (x.O17.property = v))} />
          </Question>
          <Question label="Why do you need it?">
            <LongText value={a.O17.why} onChange={(v) => set((x) => void (x.O17.why = v))} rows={3} />
          </Question>
        </Order>
        <Order id="O18" title="Don't change insurance" hint="They can't cancel or change insurance that covers you or your family." />
        <Order id="O19" title="Let me record their calls or messages that break the order" />
        {married && <Order id="O20" title="Don't sell or hide property" hint="Only for married or registered partners." />}
        <Order id="O21" title="Give me more time to serve them" hint="Usually you have about two weeks.">
          <Question label="Why do you need more time?">
            <LongText value={a.O21} onChange={(v) => set((x) => void (x.O21 = v))} rows={3} />
          </Question>
        </Order>

        <h3 className="pt-4 text-lg font-semibold text-slate-900">Decided at your court date</h3>
        <Order id="O23" title="Pay expenses caused by the abuse" hint="Like a broken phone or medical bills. Bring proof to court.">
          <div className="flex items-center justify-between gap-3 rounded-xl border border-liz/30 bg-white p-3">
            <div>
              <div className="text-base font-medium text-slate-900">LIZ Break Free — form preparation</div>
              <div className="text-sm text-slate-600">Included automatically. We&apos;ll give you the invoice to bring to your court date as proof.</div>
            </div>
            <div className="text-base font-semibold text-slate-900">${LIZ_FEE.amount}.00</div>
          </div>
          <p className="text-sm text-slate-600">Add any other costs the abuse caused you:</p>
          <Rows<Expense>
            items={a.O23}
            onChange={(v) => set((x) => void (x.O23 = v))}
            make={() => ({ payTo: "", for: "", amount: "" })}
            addLabel="Add an expense"
            render={(x, up) => (
              <div className="grid grid-cols-3 gap-2">
                <Text value={x.payTo} onChange={(v) => up({ payTo: v })} placeholder="Pay to" />
                <Text value={x.for} onChange={(v) => up({ for: v })} placeholder="For" />
                <Text value={x.amount} onChange={(v) => up({ amount: v })} placeholder="Amount $" inputMode="decimal" />
              </div>
            )}
          />
        </Order>
        <Order id="O22" title="Pay debts for property" hint="Like a car payment or mortgage.">
          <Rows<Debt>
            items={a.O22.debts}
            onChange={(v) => set((x) => void (x.O22.debts = v))}
            make={() => ({ payTo: "", for: "", amount: "", due: "", fromAbuse: false })}
            addLabel="Add a debt"
            render={(x, up) => (
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                <Text value={x.payTo} onChange={(v) => up({ payTo: v })} placeholder="Pay to" />
                <Text value={x.for} onChange={(v) => up({ for: v })} placeholder="For" />
                <Text value={x.amount} onChange={(v) => up({ amount: v })} placeholder="Amount $" inputMode="decimal" />
                <Text type="date" value={x.due} onChange={(v) => up({ due: v })} />
              </div>
            )}
          />
          <Question label="Why should they pay these?">
            <LongText value={a.O22.why} onChange={(v) => set((x) => void (x.O22.why = v))} rows={3} />
          </Question>
          <Question
            label="Do you want the judge to find that any of these debts came from the abuse?"
            hint="This can help if you didn't agree to the debt and are sued for it later."
          >
            <YesNo value={a.O22.finding} onChange={(v) => set((x) => void (x.O22.finding = v === "Y" ? "Y" : "N"))} />
          </Question>
          {a.O22.finding === "Y" && (
            <>
              <Question label="Which debts came from the abuse?">
                <div className="space-y-2">
                  {a.O22.debts.slice(0, 3).map((d, i) => (
                    <Check key={i} checked={d.fromAbuse} onChange={(v) => set((x) => void (x.O22.debts[i].fromAbuse = v))}>
                      {d.payTo || `Debt ${i + 1}`} {d.for && `— ${d.for}`}
                    </Check>
                  ))}
                </div>
              </Question>
              <Question label="How did they make the debt?" optional>
                <LongText value={a.O22.how} onChange={(v) => set((x) => void (x.O22.how = v))} rows={3} />
              </Question>
            </>
          )}
        </Order>
        {a.RL1.includes("children") && (
          <Order id="O24" title="Child support" hint="For children under 18 you have with the other person. We'll ask about your income next.">
            <Question label="Which applies to you?">
              <Multi
                value={a.O24status}
                onChange={(v) => set((x) => void (x.O24status = v))}
                options={[
                  { value: "no order, want one", label: "I don't have a child support order and I want one" },
                  { value: "change existing order", label: "I have a child support order and want it changed" },
                  { value: "TANF/CalWORKs", label: "I get or applied for CalWORKs, TANF, or welfare" },
                ]}
              />
            </Question>
            {a.O24status.includes("change existing order") && <Note>Bring a copy of your current support order when you file.</Note>}
          </Order>
        )}
        {married && <Order id="O25" title="Spousal support" hint="Only for married or registered partners. We'll ask about your income next." />}
        <Order id="O26" title="They pay my lawyer's fees and costs" hint="We'll ask about your income next." />
        <Order id="O27" title="Batterer intervention program" hint="Usually a year-long program to stop abusive behavior. They pay for it." />
        <Order id="O28" title="Transfer my phone account" hint="If they hold the account for your phone or your child's phone. You'll be responsible for the bill.">
          <Rows<PhoneNumber>
            items={a.O28}
            onChange={(v) => set((x) => void (x.O28 = v))}
            make={() => ({ whose: "mine", phone: "" })}
            addLabel="Add a phone number"
            render={(x, up) => (
              <div className="flex flex-wrap items-center gap-3">
                <Choice
                  value={x.whose}
                  onChange={(v) => up({ whose: v })}
                  options={[
                    { value: "mine", label: "My number" },
                    { value: "child", label: "A child in my care" },
                  ]}
                />
                <Text type="tel" value={x.phone} onChange={(v) => up({ phone: v })} placeholder="(555) 555-5555" className="sm:w-56" />
              </div>
            )}
          />
          <Question label="Phone company" hint="For the transfer order (DV-900).">
            <Text value={a.W1} onChange={(v) => set((x) => void (x.W1 = v))} className="sm:w-72" />
          </Question>
          <div className="grid gap-4 sm:grid-cols-3">
            <Question label="Name on the account now" optional hint={`Leave blank if it's ${a.R1 || "the other person"}.`}>
              <Text value={a.W2} onChange={(v) => set((x) => void (x.W2 = v))} />
            </Question>
            <Question label="Account billing number" optional>
              <Text type="tel" value={a.W3} onChange={(v) => set((x) => void (x.W3 = v))} />
            </Question>
            <Question label="New account holder" optional hint="Leave blank for you.">
              <Text value={a.W4} onChange={(v) => set((x) => void (x.W4 = v))} />
            </Question>
          </div>
          <Note>
            After the judge signs the transfer order, you&apos;ll send the phone company a confidential form (DV-901) so they can reach
            you. {a.R1 || "The other person"} never sees it. Use contact details they don&apos;t control.
          </Note>
          <div className="grid gap-4 sm:grid-cols-3">
            <Question label="Best phone for the company to reach you" optional hint="Leave blank to use your safe phone.">
              <Text type="tel" value={a.W5} onChange={(v) => set((x) => void (x.W5 = v))} />
            </Question>
            <Question label="Another phone" optional>
              <Text type="tel" value={a.W6} onChange={(v) => set((x) => void (x.W6 = v))} />
            </Question>
            <Question label="Email" optional hint="Leave blank to use your safe email.">
              <Text type="email" value={a.W7} onChange={(v) => set((x) => void (x.W7 = v))} />
            </Question>
          </div>
          <Question label="Mailing address for the company" optional hint="Leave blank to use your safe mailing address.">
            <AddressInput value={a.W8} onChange={(v) => set((x) => void (x.W8 = v))} />
          </Question>
        </Order>
      </Group>
    </div>
  );
}
