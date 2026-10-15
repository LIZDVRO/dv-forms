"use client";

/**
 * Step 10 · finances for FL-150 (child support, spousal support, lawyer's fees).
 * Three short screens: income, expenses, and (for child support) the children.
 * Most money questions are optional; blank prints as blank.
 */
import type { ReactNode } from "react";

import { derive, under18 } from "../derive";
import { num } from "../fill/forms/fl150";
import { useWizard } from "../store";
import { EXPENSE_LINES, INCOME_TYPES } from "../types";
import type { Answers, IncomeAmount, IncomeType, InstallmentDebt } from "../types";
import { Check, Choice, Group, LongText, Multi, Note, Question, Rows, Text, YesNo } from "../ui/fields";

const yn = (v: string) => (v === "Y" ? "Y" : "N");
const them = (a: Answers) => a.R1.trim().split(/\s+/)[0] || "the other person";

/** A dollar amount. */
function Money({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div className="relative">
      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">$</span>
      <input
        value={value}
        inputMode="decimal"
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-slate-300 bg-white py-2.5 pl-7 pr-3 text-base text-slate-900 placeholder:text-slate-400 focus:border-liz focus:outline-none focus:ring-2 focus:ring-liz/25"
      />
    </div>
  );
}

/** A labeled row: text on the left, a dollar box on the right. */
function MoneyRow({ label, value, onChange, children }: { label: ReactNode; value: string; onChange: (v: string) => void; children?: ReactNode }) {
  return (
    <div className="grid items-center gap-2 border-b border-slate-100 py-2 sm:grid-cols-[1fr_11rem]">
      <div className="text-base text-slate-800">
        {label}
        {children}
      </div>
      <Money value={value} onChange={onChange} />
    </div>
  );
}

const INCOME_LABELS: Record<IncomeType, string> = {
  wages: "Wages or salary",
  overtime: "Overtime",
  "commissions or bonuses": "Commissions or bonuses",
  "public assistance": "Public assistance (CalWORKs, TANF, SSI, GA)",
  "spousal support": "Spousal support",
  "partner support": "Domestic partner support",
  pension: "Pension or retirement",
  "Social Security": "Social Security retirement (not SSI)",
  disability: "Disability (Social Security, SDI, or private)",
  unemployment: "Unemployment",
  "workers' comp": "Workers' compensation",
  other: "Other (military allowance, royalties…)",
  "interest or dividends": "Interest or dividends",
  rental: "Rental property",
  trust: "Trust income",
  "other investment": "Other investment income",
};

/** Step 10a · income, job, taxes. */
export function Income() {
  const { a, set } = useWizard();
  const setInc = (t: IncomeType, p: Partial<IncomeAmount>) =>
    set((x) => void (x.F3[t] = { lastMonth: "", average: "", ...x.F3[t], ...p }));
  return (
    <div className="space-y-8">
      <Note>
        The judge uses this to decide support and fees. It goes on form FL-150, which {them(a)} will get a copy of. Bring your last two
        pay stubs and your latest tax return to court (black out your Social Security number).
      </Note>

      <Group title="Your job" seen="public">
        <Question label="Do you have a job now?">
          <YesNo value={a.F4.employed} onChange={(v) => set((x) => void (x.F4.employed = yn(v)))} />
        </Question>
        {a.F4.employed && (
          <>
            <p className="text-sm text-slate-600">
              {a.F4.employed === "Y" ? "Tell us about your current job." : "Tell us about your most recent job, if you had one."}
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              <Question label="Employer">
                <Text value={a.F4.employer} onChange={(v) => set((x) => void (x.F4.employer = v))} />
              </Question>
              <Question label="Your job title">
                <Text value={a.F4.occupation} onChange={(v) => set((x) => void (x.F4.occupation = v))} />
              </Question>
              <Question label="Employer's address" optional>
                <Text value={a.F4.employerAddress} onChange={(v) => set((x) => void (x.F4.employerAddress = v))} />
              </Question>
              <Question label="Employer's phone" optional>
                <Text type="tel" value={a.F4.employerPhone} onChange={(v) => set((x) => void (x.F4.employerPhone = v))} />
              </Question>
              <Question label="Date you started">
                <Text type="date" value={a.F4.startDate} onChange={(v) => set((x) => void (x.F4.startDate = v))} />
              </Question>
              {a.F4.employed === "N" && (
                <Question label="Date it ended">
                  <Text type="date" value={a.F4.endDate} onChange={(v) => set((x) => void (x.F4.endDate = v))} />
                </Question>
              )}
              <Question label="Hours per week">
                <Text value={a.F4.hoursPerWeek} onChange={(v) => set((x) => void (x.F4.hoursPerWeek = v))} inputMode="numeric" />
              </Question>
            </div>
            <Question label="Your pay before taxes">
              <div className="flex flex-wrap items-center gap-3">
                <div className="w-40">
                  <Money value={a.F4.pay} onChange={(v) => set((x) => void (x.F4.pay = v))} />
                </div>
                <Choice
                  value={a.F4.payPeriod}
                  onChange={(v) => set((x) => void (x.F4.payPeriod = v))}
                  options={[
                    { value: "hour", label: "per hour" },
                    { value: "week", label: "per week" },
                    { value: "month", label: "per month" },
                  ]}
                />
              </div>
            </Question>
          </>
        )}
        <Question label="Are you self-employed or do you own a business?">
          <YesNo value={a.F1} onChange={(v) => set((x) => void (x.F1 = yn(v)))} />
        </Question>
        {a.F1 === "Y" && (
          <div className="space-y-4 rounded-xl border border-slate-200 p-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Question label="Business name">
                <Text value={a.F7.name} onChange={(v) => set((x) => void (x.F7.name = v))} />
              </Question>
              <Question label="Type of business">
                <Text value={a.F7.type} onChange={(v) => set((x) => void (x.F7.type = v))} />
              </Question>
              <Question label="Years in this business">
                <Text value={a.F7.years} onChange={(v) => set((x) => void (x.F7.years = v))} inputMode="numeric" />
              </Question>
              <Question label="I am the">
                <Choice
                  value={a.F7.role}
                  onChange={(v) => set((x) => void (x.F7.role = v))}
                  options={[
                    { value: "owner", label: "Owner" },
                    { value: "partner", label: "Partner" },
                    { value: "other", label: "Other" },
                  ]}
                />
                {a.F7.role === "other" && <Text value={a.F7.roleOther} onChange={(v) => set((x) => void (x.F7.roleOther = v))} />}
              </Question>
              <Question label="Profit last month (after business expenses)">
                <Money value={a.F7.lastMonth} onChange={(v) => set((x) => void (x.F7.lastMonth = v))} />
              </Question>
              <Question label="Average monthly profit (last 12 months)">
                <Money value={a.F7.average} onChange={(v) => set((x) => void (x.F7.average = v))} />
              </Question>
            </div>
            <Note>Bring a profit and loss statement for the last two years, or your Schedule C.</Note>
          </div>
        )}
      </Group>

      <Group title="Money you get each month" seen="public">
        <Question label="Which of these do you get?" hint="Before taxes. Check all that apply.">
          <Multi<IncomeType>
            value={a.F2}
            onChange={(v) => set((x) => void (x.F2 = v))}
            columns
            options={INCOME_TYPES.map((t) => ({ value: t, label: INCOME_LABELS[t] }))}
          />
        </Question>
        {a.F2.length > 0 && (
          <div className="space-y-4">
            {a.F2.map((t) => {
              const v = a.F3[t] ?? { lastMonth: "", average: "" };
              return (
                <div key={t} className="space-y-3 rounded-xl border border-slate-200 p-4">
                  <h4 className="text-base font-semibold text-slate-900">{INCOME_LABELS[t]}</h4>
                  {(t === "other" || t === "other investment") && (
                    <Text value={v.describe ?? ""} onChange={(d) => setInc(t, { describe: d })} placeholder="What is it?" />
                  )}
                  {(t === "spousal support" || t === "partner support") && (
                    <Choice
                      value={v.from ?? ""}
                      onChange={(f) => setInc(t, { from: f })}
                      options={[
                        { value: "this", label: t === "spousal support" ? "From this marriage" : "From this partnership" },
                        { value: "different", label: t === "spousal support" ? "From a different marriage" : "From a different partnership" },
                      ]}
                    />
                  )}
                  {t === "spousal support" && (
                    <Check checked={!!v.taxable} onChange={(c) => setInc(t, { taxable: c })}>
                      It is federally taxable (ordered before 2019)
                    </Check>
                  )}
                  {t === "disability" && (
                    <Multi
                      value={v.kinds ?? []}
                      onChange={(k) => setInc(t, { kinds: k })}
                      options={[
                        { value: "Social Security", label: "Social Security (not SSI)" },
                        { value: "SDI", label: "State disability (SDI)" },
                        { value: "private insurance", label: "Private insurance" },
                      ]}
                    />
                  )}
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Question label="Last month">
                      <Money value={v.lastMonth} onChange={(m) => setInc(t, { lastMonth: m })} />
                    </Question>
                    <Question label="Average per month" hint="Total for the last 12 months, divided by 12.">
                      <Money value={v.average} onChange={(m) => setInc(t, { average: m })} />
                    </Question>
                  </div>
                </div>
              );
            })}
          </div>
        )}
        <Question label="Did you get any one-time money in the last 12 months?" hint="Like an inheritance or lottery win. Say where from and how much." optional>
          <Text value={a.F8.oneTime} onChange={(v) => set((x) => void (x.F8.oneTime = v))} />
        </Question>
        <Question label="Has your income changed a lot in the last 12 months?" hint="If so, explain." optional>
          <Text value={a.F8.change} onChange={(v) => set((x) => void (x.F8.change = v))} />
        </Question>
      </Group>

      <Group title={`${them(a)}'s income`} seen="public">
        <Question label={`About how much does ${them(a)} earn per month, before taxes?`} hint="A guess is fine." optional>
          <div className="w-48">
            <Money value={a.F14.amount} onChange={(v) => set((x) => void (x.F14.amount = v))} />
          </div>
        </Question>
        {a.F14.amount && (
          <Question label="What is your guess based on?">
            <Text value={a.F14.basis} onChange={(v) => set((x) => void (x.F14.basis = v))} placeholder="For example: what they told me, their job" />
          </Question>
        )}
      </Group>

      <Group title="Taxes and education" seen="public">
        <div className="grid gap-4 sm:grid-cols-3">
          <Question label="Last year you filed taxes" optional>
            <Text value={a.F6.lastYearFiled} onChange={(v) => set((x) => void (x.F6.lastYearFiled = v))} inputMode="numeric" placeholder="2025" />
          </Question>
          <Question label="State you file in">
            <Text value={a.F6.state} onChange={(v) => set((x) => void (x.F6.state = v))} />
          </Question>
          <Question label="Exemptions you claim" optional>
            <Text value={a.F6.exemptions} onChange={(v) => set((x) => void (x.F6.exemptions = v))} inputMode="numeric" />
          </Question>
        </div>
        <Question label="Filing status">
          <Choice
            value={a.F6.status}
            onChange={(v) => set((x) => void (x.F6.status = v))}
            columns
            options={[
              { value: "single", label: "Single" },
              { value: "head of household", label: "Head of household" },
              { value: "married filing separately", label: "Married, filing separately" },
              { value: "married filing jointly", label: "Married, filing jointly" },
            ]}
          />
          {a.F6.status === "married filing jointly" && (
            <Text value={a.F6.jointFilerName} onChange={(v) => set((x) => void (x.F6.jointFilerName = v))} placeholder="Filing jointly with (name)" />
          )}
        </Question>
        <Question label="Did you finish high school or get a GED?">
          <YesNo value={a.F5.highSchool} onChange={(v) => set((x) => void (x.F5.highSchool = yn(v)))} />
          {a.F5.highSchool === "N" && (
            <Text value={a.F5.highestGrade} onChange={(v) => set((x) => void (x.F5.highestGrade = v))} placeholder="Highest grade finished" className="sm:w-60" />
          )}
        </Question>
        <div className="grid gap-4 sm:grid-cols-2">
          <Question label="Years of college" optional>
            <Text value={a.F5.collegeYears} onChange={(v) => set((x) => void (x.F5.collegeYears = v))} inputMode="numeric" />
          </Question>
          <Question label="College degrees" optional>
            <Text value={a.F5.collegeDegrees} onChange={(v) => set((x) => void (x.F5.collegeDegrees = v))} />
          </Question>
          <Question label="Years of graduate school" optional>
            <Text value={a.F5.gradYears} onChange={(v) => set((x) => void (x.F5.gradYears = v))} inputMode="numeric" />
          </Question>
          <Question label="Graduate degrees" optional>
            <Text value={a.F5.gradDegrees} onChange={(v) => set((x) => void (x.F5.gradDegrees = v))} />
          </Question>
          <Question label="Professional licenses" optional>
            <Text value={a.F5.licenses} onChange={(v) => set((x) => void (x.F5.licenses = v))} />
          </Question>
          <Question label="Vocational training" optional>
            <Text value={a.F5.vocational} onChange={(v) => set((x) => void (x.F5.vocational = v))} />
          </Question>
        </div>
      </Group>
    </div>
  );
}

/** Step 10b · household, expenses, debts, deductions, assets, fees. */
export function Expenses() {
  const { a, set } = useWizard();
  // Adults only: children still print on FL-150 item 12, with no income.
  const home = a.roster.map((p, i) => [p, i] as const).filter(([p]) => p.livesWithYou === "Y" && p.name.trim() && !under18(p, a.G1));
  const total =
    num(a.F11.rentOrMortgage) +
    EXPENSE_LINES.reduce((t, [k]) => t + num(a.F11.lines[k]), 0) +
    a.F12.reduce((t, d) => t + num(d.amount), 0) +
    num(a.F11.other);
  return (
    <div className="space-y-8">
      {home.length > 0 && (
        <Group title="Adults who live with you" seen="public">
          <p className="text-sm text-slate-600">
            For adults who live with you: their monthly income, if any, and whether they help pay household bills. Children are listed
            for you.
          </p>
          {home.map(([p, i]) => (
            <div key={p.id} className="grid items-center gap-3 rounded-xl border border-slate-200 p-3 sm:grid-cols-[1fr_10rem_auto]">
              <div className="text-base text-slate-900">
                {p.name} <span className="text-sm text-slate-500">· {p.relationship}</span>
              </div>
              <Money value={p.income ?? ""} onChange={(v) => set((x) => void (x.roster[i].income = v))} placeholder="Monthly income" />
              <Check checked={p.paysExpenses === "Y"} onChange={(v) => set((x) => void (x.roster[i].paysExpenses = v ? "Y" : "N"))}>
                Helps pay bills
              </Check>
            </div>
          ))}
        </Group>
      )}

      <Group title="Your monthly expenses" seen="public">
        <Question label="These amounts are:">
          <Choice
            value={a.F11.basis}
            onChange={(v) => set((x) => void (x.F11.basis = v))}
            options={[
              { value: "actual", label: "What I actually spend" },
              { value: "estimated", label: "My best estimate" },
              { value: "proposed", label: "What I'll need" },
            ]}
          />
        </Question>
        <Question label="Housing">
          <Choice
            value={a.F11.housing}
            onChange={(v) => set((x) => void (x.F11.housing = v))}
            options={[
              { value: "rent", label: "I rent" },
              { value: "mortgage", label: "I pay a mortgage" },
            ]}
          />
        </Question>
        <div>
          {a.F11.housing && (
            <MoneyRow label={a.F11.housing === "rent" ? "Rent" : "Mortgage payment"} value={a.F11.rentOrMortgage} onChange={(v) => set((x) => void (x.F11.rentOrMortgage = v))} />
          )}
          {a.F11.housing === "mortgage" && (
            <>
              <MoneyRow label="— of which principal" value={a.F11.mortgagePrincipal} onChange={(v) => set((x) => void (x.F11.mortgagePrincipal = v))} />
              <MoneyRow label="— of which interest" value={a.F11.mortgageInterest} onChange={(v) => set((x) => void (x.F11.mortgageInterest = v))} />
            </>
          )}
          {EXPENSE_LINES.map(([k, label]) => (
            <MoneyRow key={k} label={label} value={a.F11.lines[k] ?? ""} onChange={(v) => set((x) => void (x.F11.lines[k] = v))} />
          ))}
          <MoneyRow label="Other" value={a.F11.other} onChange={(v) => set((x) => void (x.F11.other = v))}>
            {num(a.F11.other) > 0 && (
              <Text value={a.F11.otherDescribe} onChange={(v) => set((x) => void (x.F11.otherDescribe = v))} placeholder="What is it?" />
            )}
          </MoneyRow>
          <div className="flex justify-between py-3 text-base font-semibold text-slate-900">
            <span>Total (with debt payments below)</span>
            <span>${total.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </div>
          <MoneyRow label="Amount others pay toward these expenses" value={a.F11.paidByOthers} onChange={(v) => set((x) => void (x.F11.paidByOthers = v))} />
        </div>
      </Group>

      <Group title="Monthly debt payments" seen="public">
        <p className="text-sm text-slate-600">Car loans, credit cards, and other debts you pay each month (not rent or mortgage).</p>
        <Rows<InstallmentDebt>
          items={a.F12}
          onChange={(v) => set((x) => void (x.F12 = v))}
          make={() => ({ paidTo: "", for: "", amount: "", balance: "", lastPayment: "" })}
          addLabel="Add a debt"
          render={(d, up) => (
            <div className="grid gap-2 sm:grid-cols-5">
              <Text value={d.paidTo} onChange={(v) => up({ paidTo: v })} placeholder="Paid to" />
              <Text value={d.for} onChange={(v) => up({ for: v })} placeholder="For" />
              <Money value={d.amount} onChange={(v) => up({ amount: v })} placeholder="Monthly" />
              <Money value={d.balance} onChange={(v) => up({ balance: v })} placeholder="Balance" />
              <Text type="date" value={d.lastPayment} onChange={(v) => up({ lastPayment: v })} />
            </div>
          )}
        />
      </Group>

      <Group title="Taken out of your pay each month" seen="public">
        <div>
          <MoneyRow label="Union dues" value={a.F9.unionDues} onChange={(v) => set((x) => void (x.F9.unionDues = v))} />
          <MoneyRow label="Required retirement (not Social Security, FICA, 401k, or IRA)" value={a.F9.retirement} onChange={(v) => set((x) => void (x.F9.retirement = v))} />
          <MoneyRow label="Health insurance for you and your children" value={a.F9.healthInsurance} onChange={(v) => set((x) => void (x.F9.healthInsurance = v))} />
          <MoneyRow label="Child support you pay for children from other relationships" value={a.F9.otherChildSupport} onChange={(v) => set((x) => void (x.F9.otherChildSupport = v))} />
          <MoneyRow label="Court-ordered spousal support you pay (other marriage)" value={a.F9.spousalSupport} onChange={(v) => set((x) => void (x.F9.spousalSupport = v))}>
            {num(a.F9.spousalSupport) > 0 && (
              <Check checked={a.F9.spousalTaxDeductible} onChange={(v) => set((x) => void (x.F9.spousalTaxDeductible = v))}>
                Federally tax deductible
              </Check>
            )}
          </MoneyRow>
          <MoneyRow label="Court-ordered partner support you pay (other partnership)" value={a.F9.partnerSupport} onChange={(v) => set((x) => void (x.F9.partnerSupport = v))} />
          <MoneyRow label="Job expenses your employer doesn't pay back" value={a.F9.jobExpenses} onChange={(v) => set((x) => void (x.F9.jobExpenses = v))}>
            {num(a.F9.jobExpenses) > 0 && (
              <Text value={a.F9.jobExpensesWhy} onChange={(v) => set((x) => void (x.F9.jobExpensesWhy = v))} placeholder="What are they for?" />
            )}
          </MoneyRow>
        </div>
      </Group>

      <Group title="What you own" seen="public">
        <div>
          <MoneyRow label="Cash and bank accounts" value={a.F10.cash} onChange={(v) => set((x) => void (x.F10.cash = v))} />
          <MoneyRow label="Stocks, bonds, and other things you could sell quickly" value={a.F10.stocks} onChange={(v) => set((x) => void (x.F10.stocks = v))} />
          <MoneyRow
            label="Everything else (home, car, etc.), minus what you owe on it"
            value={a.F10.property}
            onChange={(v) =>
              set((x) => {
                x.F10.property = v;
                if (num(v) > 0 && !x.F10.real && !x.F10.personal) x.F10.personal = true;
              })
            }
          >
            {num(a.F10.property) > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                <Check checked={a.F10.real} onChange={(v) => set((x) => void (x.F10.real = v))}>
                  Includes a home or land
                </Check>
                <Check checked={a.F10.personal} onChange={(v) => set((x) => void (x.F10.personal = v))}>
                  Includes a car or other things
                </Check>
              </div>
            )}
          </MoneyRow>
        </div>
      </Group>

      {a.orders.O26 && a.S5 === "Y" && (
        <Group title="Your lawyer's fees" seen="public">
          <div>
            <MoneyRow label="Paid to your lawyer so far" value={a.F13.paid} onChange={(v) => set((x) => void (x.F13.paid = v))} />
            <MoneyRow label="Still owed" value={a.F13.owed} onChange={(v) => set((x) => void (x.F13.owed = v))} />
            <MoneyRow label="Your lawyer's hourly rate" value={a.L6} onChange={(v) => set((x) => void (x.L6 = v))} />
          </div>
          <Question label="Where did the money you paid come from?">
            <Text value={a.F13.source} onChange={(v) => set((x) => void (x.F13.source = v))} />
          </Question>
          <Note>Your lawyer signs page 3 of FL-150 to confirm the fee arrangement.</Note>
        </Group>
      )}
    </div>
  );
}

/** Step 10c · child support details (FL-150 page 4). */
export function ChildSupport() {
  const { a, set } = useWizard();
  const kids = derive(a).custodyKids.length;
  return (
    <div className="space-y-8">
      <Group title="Time with each parent" seen="public">
        <p className="text-base text-slate-700">
          You have {kids} child{kids === 1 ? "" : "ren"} under 18 with {them(a)}. About how much of their time do they spend with each of you?
        </p>
        <div className="grid grid-cols-2 gap-4 sm:w-96">
          <Question label="With me (%)">
            <Text value={a.F16.percentMe} onChange={(v) => set((x) => void (x.F16.percentMe = v))} inputMode="numeric" />
          </Question>
          <Question label={`With ${them(a)} (%)`}>
            <Text value={a.F16.percentRespondent} onChange={(v) => set((x) => void (x.F16.percentRespondent = v))} inputMode="numeric" />
          </Question>
        </div>
        <Question label="Not sure, or no schedule yet? Describe it" optional>
          <Text value={a.F16.schedule} onChange={(v) => set((x) => void (x.F16.schedule = v))} placeholder="For example: they live with me; he sees them some weekends" />
        </Question>
      </Group>

      <Group title="Health insurance for the children" seen="public">
        <Question label="Can you get health insurance for the children through your job?">
          <YesNo value={a.F17.available} onChange={(v) => set((x) => void (x.F17.available = yn(v)))} />
        </Question>
        {a.F17.available === "Y" && (
          <div className="grid gap-4 sm:grid-cols-2">
            <Question label="Insurance company">
              <Text value={a.F17.company} onChange={(v) => set((x) => void (x.F17.company = v))} />
            </Question>
            <Question label="Monthly cost for the children" hint="Don't include what your employer pays.">
              <Money value={a.F17.cost} onChange={(v) => set((x) => void (x.F17.cost = v))} />
            </Question>
            <div className="sm:col-span-2">
              <Question label="Company's address" optional>
                <Text value={a.F17.address} onChange={(v) => set((x) => void (x.F17.address = v))} />
              </Question>
            </div>
          </div>
        )}
      </Group>

      <Group title="Extra costs for the children (per month)" seen="public">
        <div>
          <MoneyRow label="Child care so you can work or go to school" value={a.F18.childcare} onChange={(v) => set((x) => void (x.F18.childcare = v))} />
          <MoneyRow label="Health care not covered by insurance" value={a.F18.health} onChange={(v) => set((x) => void (x.F18.health = v))} />
          <MoneyRow label="Travel for visits" value={a.F18.travel} onChange={(v) => set((x) => void (x.F18.travel = v))} />
          <MoneyRow label="School or other special needs" value={a.F18.specialNeeds} onChange={(v) => set((x) => void (x.F18.specialNeeds = v))}>
            {num(a.F18.specialNeeds) > 0 && (
              <Text value={a.F18.specialNeedsDescribe} onChange={(v) => set((x) => void (x.F18.specialNeedsDescribe = v))} placeholder="Describe" />
            )}
          </MoneyRow>
        </div>
      </Group>

      <Group title="Special hardships" seen="public">
        <p className="text-sm text-slate-600">Optional. Costs the judge can consider when setting support. Bring proof.</p>
        {(
          [
            ["Very high health costs (beyond the line above)", "healthAmount", "healthMonths"],
            ["Major uninsured losses (fire, theft…)", "lossesAmount", "lossesMonths"],
            ["Costs for your other children under 18 living with you", "otherChildrenAmount", "otherChildrenMonths"],
          ] as const
        ).map(([label, amount, months]) => (
          <div key={amount} className="grid items-end gap-3 sm:grid-cols-[1fr_10rem_8rem]">
            <div className="text-base text-slate-800">{label}</div>
            <Money value={a.F19[amount]} onChange={(v) => set((x) => void (x.F19[amount] = v))} placeholder="Per month" />
            <Text value={a.F19[months]} onChange={(v) => set((x) => void (x.F19[months] = v))} placeholder="How many months" inputMode="numeric" />
          </div>
        ))}
        {num(a.F19.otherChildrenAmount) > 0 && (
          <div className="grid items-center gap-3 sm:grid-cols-[1fr_10rem]">
            <div className="text-base text-slate-800">Child support you get for those children</div>
            <Money value={a.F19.supportReceived} onChange={(v) => set((x) => void (x.F19.supportReceived = v))} />
          </div>
        )}
        {(num(a.F19.healthAmount) || num(a.F19.lossesAmount) || num(a.F19.otherChildrenAmount)) > 0 && (
          <Question label="Why do these create an extreme financial hardship?">
            <LongText value={a.F19.why} onChange={(v) => set((x) => void (x.F19.why = v))} rows={3} />
          </Question>
        )}
      </Group>

      <Group seen="public">
        <Question label="Anything else the court should know about support?" optional>
          <LongText value={a.F20} onChange={(v) => set((x) => void (x.F20 = v))} rows={3} />
        </Question>
      </Group>
    </div>
  );
}
