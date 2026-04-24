"use client";

import type { Dispatch, SetStateAction } from "react";

import type { Dv100PdfFormData } from "@/lib/dv100-pdf";

import {
  PAGE10_DEBT_AMOUNT_MAX,
  PAGE10_DEBT_DUE_MAX,
  PAGE10_DEBT_FOR_MAX,
  PAGE10_DEBT_PAY_TO_MAX,
  PAGE10_EXTEND_NOTICE_EXPLAIN_MAX,
  PAGE10_PAY_DEBTS_EXPLAIN_MAX,
  PAGE10_PAY_DEBTS_SPECIAL_EXPLAIN_MAX,
} from "./wizardShared";

type FormData = Dv100PdfFormData;

type Step8Props = {
  form: FormData;
  setForm: Dispatch<SetStateAction<FormData>>;
  update: <K extends keyof FormData>(key: K, value: FormData[K]) => void;
  inputClass: string;
  textareaClass: string;
  resetPayDebtsForProperty: () => void;
};

export default function Step8_PropertyNoticeDebts({
  form,
  setForm,
  update,
  inputClass,
  textareaClass,
  resetPayDebtsForProperty,
}: Step8Props) {
  return (
    <div className="space-y-10">
      <section className="space-y-4">
        <h2 className="text-sm font-semibold text-slate-900">
          Section 20. Property restraint
        </h2>
        <label className="flex cursor-pointer items-start gap-3 py-3 pr-2 pl-0.5 transition">
          <input
            type="checkbox"
            checked={form.propertyRestraint}
            onChange={(e) =>
              update("propertyRestraint", e.target.checked)
            }
            className="mt-1 size-4 shrink-0 rounded-sm border border-purple-300/80 text-purple-700 accent-purple-700 outline-none focus-visible:ring-2 focus-visible:ring-purple-700 focus-visible:ring-offset-1"
          />
          <span className="text-sm font-medium text-slate-800">Property Restraint</span>
        </label>
        <p className="text-xs leading-relaxed text-slate-500">
          Only check this if you are married or a registered domestic partner with
          the person you want protection from.
        </p>
      </section>

      <section className="space-y-4 border-t border-purple-100/90 pt-8">
        <h2 className="text-sm font-semibold text-slate-900">
          Section 21. Extend deadline to give notice
        </h2>
        <label className="flex cursor-pointer items-start gap-3 py-3 pr-2 pl-0.5 transition">
          <input
            type="checkbox"
            checked={form.extendNoticeDeadline}
            onChange={(e) => {
              const on = e.target.checked;
              setForm((prev) => ({
                ...prev,
                extendNoticeDeadline: on,
                ...(!on ? { extendNoticeExplain: "" } : {}),
              }));
            }}
            className="mt-1 size-4 shrink-0 rounded-sm border border-purple-300/80 text-purple-700 accent-purple-700 outline-none focus-visible:ring-2 focus-visible:ring-purple-700 focus-visible:ring-offset-1"
          />
          <span className="text-sm font-medium text-slate-800">
            Extend my deadline to give notice
          </span>
        </label>
        <p className="text-xs leading-relaxed text-slate-500">
          {`Usually, the judge will give you about two weeks to give notice, or to 'serve' the person of your request. `}
          If you need more time to serve, the judge may be able to give you a few
          extra days.
        </p>
        {form.extendNoticeDeadline && (
          <div>
            <label
              htmlFor="extendNoticeExplain"
              className="text-sm font-medium text-slate-800"
            >
              Explain why you need more time
            </label>
            <textarea
              id="extendNoticeExplain"
              autoComplete="off"
              maxLength={PAGE10_EXTEND_NOTICE_EXPLAIN_MAX}
              value={form.extendNoticeExplain}
              onChange={(e) =>
                update("extendNoticeExplain", e.target.value)
              }
              className={textareaClass}
            />
            <p className="mt-1 text-xs text-slate-500">
              {form.extendNoticeExplain.length} /{" "}
              {PAGE10_EXTEND_NOTICE_EXPLAIN_MAX} characters
            </p>
          </div>
        )}
      </section>

      <section className="space-y-4 border-t border-purple-100/90 pt-8">
        <h2 className="text-sm font-semibold text-slate-900">
          Section 22. Pay debts owed for property
        </h2>
        <label className="flex cursor-pointer items-start gap-3 py-3 pr-2 pl-0.5 transition">
          <input
            type="checkbox"
            checked={form.payDebtsForProperty}
            onChange={(e) => {
              if (e.target.checked) {
                update("payDebtsForProperty", true);
              } else {
                resetPayDebtsForProperty();
              }
            }}
            className="mt-1 size-4 shrink-0 rounded-sm border border-purple-300/80 text-purple-700 accent-purple-700 outline-none focus-visible:ring-2 focus-visible:ring-purple-700 focus-visible:ring-offset-1"
          />
          <span className="text-sm font-medium text-slate-800">
            Pay Debts (Bills) Owed for Property
          </span>
        </label>
        <p className="text-xs leading-relaxed text-slate-500">
          If you want the person to pay any debts owed for property, list them and
          explain why. The amount can be for the entire bill or only a portion.
          Some examples include rent, mortgage, car payment, etc.
        </p>

        {form.payDebtsForProperty && (
          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-medium text-slate-800">Debts (up to three)</h3>
              <div className="mt-3 overflow-x-auto rounded-xl border border-purple-100/80 bg-white shadow-sm">
                <table className="w-full min-w-[36rem] text-left text-sm">
                  <thead>
                    <tr className="border-b border-purple-100 bg-purple-50/50 text-xs font-semibold uppercase tracking-wide text-purple-900/80">
                      <th className="px-3 py-2.5">Debt</th>
                      <th className="px-3 py-2.5">Pay to</th>
                      <th className="px-3 py-2.5">For</th>
                      <th className="px-3 py-2.5">Amount</th>
                      <th className="px-3 py-2.5">Due date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {form.payDebtsRows.map((row, idx) => (
                      <tr
                        key={`debt-${idx}`}
                        className="border-b border-purple-100/80 last:border-b-0"
                      >
                        <td className="whitespace-nowrap px-3 py-3 text-xs font-medium text-slate-500">
                          {idx + 1}
                        </td>
                        <td className="px-3 py-2 align-top">
                          <label htmlFor={`debt-payto-${idx}`} className="sr-only">
                            Debt {idx + 1} pay to
                          </label>
                          <input
                            id={`debt-payto-${idx}`}
                            type="text"
                            autoComplete="off"
                            maxLength={PAGE10_DEBT_PAY_TO_MAX}
                            value={row.payTo}
                            onChange={(e) =>
                              setForm((prev) => {
                                const next = [...prev.payDebtsRows];
                                next[idx] = { ...next[idx], payTo: e.target.value };
                                return { ...prev, payDebtsRows: next };
                              })
                            }
                            className={inputClass}
                          />
                        </td>
                        <td className="px-3 py-2 align-top">
                          <label htmlFor={`debt-for-${idx}`} className="sr-only">
                            Debt {idx + 1} for
                          </label>
                          <input
                            id={`debt-for-${idx}`}
                            type="text"
                            autoComplete="off"
                            maxLength={PAGE10_DEBT_FOR_MAX}
                            value={row.payFor}
                            onChange={(e) =>
                              setForm((prev) => {
                                const next = [...prev.payDebtsRows];
                                next[idx] = {
                                  ...next[idx],
                                  payFor: e.target.value,
                                };
                                return { ...prev, payDebtsRows: next };
                              })
                            }
                            className={inputClass}
                          />
                        </td>
                        <td className="px-3 py-2 align-top">
                          <label htmlFor={`debt-amt-${idx}`} className="sr-only">
                            Debt {idx + 1} amount
                          </label>
                          <input
                            id={`debt-amt-${idx}`}
                            type="text"
                            autoComplete="off"
                            maxLength={PAGE10_DEBT_AMOUNT_MAX}
                            value={row.amount}
                            onChange={(e) =>
                              setForm((prev) => {
                                const next = [...prev.payDebtsRows];
                                next[idx] = {
                                  ...next[idx],
                                  amount: e.target.value,
                                };
                                return { ...prev, payDebtsRows: next };
                              })
                            }
                            className={inputClass}
                          />
                        </td>
                        <td className="px-3 py-2 align-top">
                          <label htmlFor={`debt-due-${idx}`} className="sr-only">
                            Debt {idx + 1} due date
                          </label>
                          <input
                            id={`debt-due-${idx}`}
                            type="text"
                            autoComplete="off"
                            maxLength={PAGE10_DEBT_DUE_MAX}
                            value={row.dueDate}
                            onChange={(e) =>
                              setForm((prev) => {
                                const next = [...prev.payDebtsRows];
                                next[idx] = {
                                  ...next[idx],
                                  dueDate: e.target.value,
                                };
                                return { ...prev, payDebtsRows: next };
                              })
                            }
                            className={inputClass}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div>
              <label
                htmlFor="payDebtsExplain"
                className="text-sm font-medium text-slate-800"
              >
                Explain why you want the person to pay the debts listed above
              </label>
              <textarea
                id="payDebtsExplain"
                autoComplete="off"
                maxLength={PAGE10_PAY_DEBTS_EXPLAIN_MAX}
                value={form.payDebtsExplain}
                onChange={(e) =>
                  update("payDebtsExplain", e.target.value)
                }
                className={textareaClass}
              />
              <p className="mt-1 text-xs text-slate-500">
                {form.payDebtsExplain.length} / {PAGE10_PAY_DEBTS_EXPLAIN_MAX}{" "}
                characters
              </p>
            </div>

            <fieldset className="space-y-2 rounded-xl border border-purple-100/80 bg-purple-50/40 p-4">
              <legend className="text-sm font-medium text-slate-800">
                Special decision (finding) by the judge if you did not agree to
                the debt (optional)
              </legend>
              <p className="text-xs leading-relaxed text-slate-500">
                If you did not agree to the debt or debts listed above, you can
                ask the judge to decide (find) that one or more debts was made
                without your permission and resulted from the abuse. This may
                help you defend against the debt if you are sued in another case.
              </p>
              <div className="flex flex-col gap-2 pt-1">
                <label className="flex cursor-pointer items-center gap-2 py-1 text-sm text-slate-800">
                  <input
                    type="radio"
                    name="payDebtsSpecialDecision"
                    checked={form.payDebtsSpecialDecision === "yes"}
                    onChange={() =>
                      setForm((prev) => ({
                        ...prev,
                        payDebtsSpecialDecision: "yes",
                      }))
                    }
                    className="size-4 shrink-0 rounded-sm border border-purple-300/80 text-purple-700 accent-purple-700 outline-none focus-visible:ring-2 focus-visible:ring-purple-700 focus-visible:ring-offset-1"
                  />
                  Yes
                </label>
                <label className="flex cursor-pointer items-center gap-2 py-1 text-sm text-slate-800">
                  <input
                    type="radio"
                    name="payDebtsSpecialDecision"
                    checked={form.payDebtsSpecialDecision === "no"}
                    onChange={() =>
                      setForm((prev) => ({
                        ...prev,
                        payDebtsSpecialDecision: "no",
                        payDebtsAbuseDebt1: false,
                        payDebtsAbuseDebt2: false,
                        payDebtsAbuseDebt3: false,
                        payDebtsKnowHow: "",
                        payDebtsExplainHow: "",
                      }))
                    }
                    className="size-4 shrink-0 rounded-sm border border-purple-300/80 text-purple-700 accent-purple-700 outline-none focus-visible:ring-2 focus-visible:ring-purple-700 focus-visible:ring-offset-1"
                  />
                  No
                </label>
              </div>

              {form.payDebtsSpecialDecision === "yes" && (
                <div className="mt-4 space-y-4 border-t border-purple-200/60 pt-4">
                  <p className="text-sm font-medium text-slate-800">
                    Which of the debts listed above resulted from the abuse?
                  </p>
                  <div className="space-y-2">
                    {(
                      [
                        { key: "payDebtsAbuseDebt1" as const, label: "Debt 1" },
                        { key: "payDebtsAbuseDebt2" as const, label: "Debt 2" },
                        { key: "payDebtsAbuseDebt3" as const, label: "Debt 3" },
                      ] as const
                    ).map(({ key, label }) => (
                      <label
                        key={key}
                        className="flex cursor-pointer items-center gap-2 py-1 text-sm text-slate-800"
                      >
                        <input
                          type="checkbox"
                          checked={Boolean(form[key])}
                          onChange={(e) => update(key, e.target.checked)}
                          className="size-4 shrink-0 rounded-sm border border-purple-300/80 text-purple-700 accent-purple-700 outline-none focus-visible:ring-2 focus-visible:ring-purple-700 focus-visible:ring-offset-1"
                        />
                        {label}
                      </label>
                    ))}
                  </div>

                  <div>
                    <p className="text-sm font-medium text-slate-800">
                      Do you know how the person made the debt or debts?
                    </p>
                    <div className="mt-2 flex flex-col gap-2">
                      <label className="flex cursor-pointer items-center gap-2 py-1 text-sm text-slate-800">
                        <input
                          type="radio"
                          name="payDebtsKnowHow"
                          checked={form.payDebtsKnowHow === "yes"}
                          onChange={() =>
                            setForm((prev) => ({
                              ...prev,
                              payDebtsKnowHow: "yes",
                            }))
                          }
                          className="size-4 shrink-0 rounded-sm border border-purple-300/80 text-purple-700 accent-purple-700 outline-none focus-visible:ring-2 focus-visible:ring-purple-700 focus-visible:ring-offset-1"
                        />
                        Yes
                      </label>
                      <label className="flex cursor-pointer items-center gap-2 py-1 text-sm text-slate-800">
                        <input
                          type="radio"
                          name="payDebtsKnowHow"
                          checked={form.payDebtsKnowHow === "no"}
                          onChange={() =>
                            setForm((prev) => ({
                              ...prev,
                              payDebtsKnowHow: "no",
                              payDebtsExplainHow: "",
                            }))
                          }
                          className="size-4 shrink-0 rounded-sm border border-purple-300/80 text-purple-700 accent-purple-700 outline-none focus-visible:ring-2 focus-visible:ring-purple-700 focus-visible:ring-offset-1"
                        />
                        No
                      </label>
                    </div>
                  </div>

                  {form.payDebtsKnowHow === "yes" && (
                    <div>
                      <label
                        htmlFor="payDebtsExplainHow"
                        className="text-sm font-medium text-slate-800"
                      >
                        Explain how they made the debt or debts
                      </label>
                      <textarea
                        id="payDebtsExplainHow"
                        autoComplete="off"
                        maxLength={PAGE10_PAY_DEBTS_SPECIAL_EXPLAIN_MAX}
                        value={form.payDebtsExplainHow}
                        onChange={(e) =>
                          update("payDebtsExplainHow", e.target.value)
                        }
                        className={textareaClass}
                      />
                      <p className="mt-1 text-xs text-slate-500">
                        {form.payDebtsExplainHow.length} /{" "}
                        {PAGE10_PAY_DEBTS_SPECIAL_EXPLAIN_MAX} characters
                      </p>
                    </div>
                  )}
                </div>
              )}
            </fieldset>
          </div>
        )}
      </section>
    </div>
  );
}
