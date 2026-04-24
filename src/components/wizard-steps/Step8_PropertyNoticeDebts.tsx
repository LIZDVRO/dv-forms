"use client";

import { useFormStore } from "@/store/useFormStore";

import {
  PAGE10_DEBT_AMOUNT_MAX,
  PAGE10_DEBT_DUE_MAX,
  PAGE10_DEBT_FOR_MAX,
  PAGE10_DEBT_PAY_TO_MAX,
  PAGE10_EXTEND_NOTICE_EXPLAIN_MAX,
  PAGE10_PAY_DEBTS_EXPLAIN_MAX,
  PAGE10_PAY_DEBTS_SPECIAL_EXPLAIN_MAX,
} from "./wizardShared";

type Step8Props = {
  inputClass: string;
  textareaClass: string;
};

export default function Step8_PropertyNoticeDebts({
  inputClass,
  textareaClass,
}: Step8Props) {
  const fr = useFormStore((s) => s.financial.requests);
  const setFinancialRequests = useFormStore((s) => s.setFinancialRequests);

  const resetPayDebts = () => {
    setFinancialRequests({
      wantsDebtPayment: false,
      debts: [
        { payTo: "", forWhat: "", amount: "", dueDate: "" },
        { payTo: "", forWhat: "", amount: "", dueDate: "" },
        { payTo: "", forWhat: "", amount: "", dueDate: "" },
      ],
      debtExplanation: "",
      debtSpecialFinding: "",
      debtSpecialFindingWhich: { debt1: false, debt2: false, debt3: false },
      debtSpecialFindingKnowHow: "",
      debtSpecialFindingExplanation: "",
    });
  };

  return (
    <div className="space-y-10">
      <section className="space-y-4">
        <h2 className="text-sm font-semibold text-slate-900">
          Section 20. Property restraint
        </h2>
        <label className="flex cursor-pointer items-start gap-3 py-3 pr-2 pl-0.5 transition">
          <input
            type="checkbox"
            checked={fr.wantsPropertyRestraint}
            onChange={(e) =>
              setFinancialRequests({ wantsPropertyRestraint: e.target.checked })
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
            checked={fr.wantsExtraServiceTime}
            onChange={(e) => {
              const on = e.target.checked;
              setFinancialRequests({
                wantsExtraServiceTime: on,
                ...(!on ? { extraServiceTimeExplanation: "" } : {}),
              });
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
        {fr.wantsExtraServiceTime && (
          <div>
            <label
              htmlFor="extraServiceTimeExplanation"
              className="text-sm font-medium text-slate-800"
            >
              Explain why you need more time
            </label>
            <textarea
              id="extraServiceTimeExplanation"
              autoComplete="off"
              maxLength={PAGE10_EXTEND_NOTICE_EXPLAIN_MAX}
              value={fr.extraServiceTimeExplanation}
              onChange={(e) =>
                setFinancialRequests({ extraServiceTimeExplanation: e.target.value })
              }
              className={textareaClass}
            />
            <p className="mt-1 text-xs text-slate-500">
              {fr.extraServiceTimeExplanation.length} /{" "}
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
            checked={fr.wantsDebtPayment}
            onChange={(e) => {
              if (e.target.checked) {
                setFinancialRequests({ wantsDebtPayment: true });
              } else {
                resetPayDebts();
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

        {fr.wantsDebtPayment && (
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
                    {fr.debts.map((row, idx) => (
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
                            onChange={(e) => {
                              const r = useFormStore.getState().financial.requests;
                              const next = [...r.debts];
                              next[idx] = { ...next[idx]!, payTo: e.target.value };
                              setFinancialRequests({ debts: next });
                            }}
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
                            value={row.forWhat}
                            onChange={(e) => {
                              const r = useFormStore.getState().financial.requests;
                              const next = [...r.debts];
                              next[idx] = { ...next[idx]!, forWhat: e.target.value };
                              setFinancialRequests({ debts: next });
                            }}
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
                            onChange={(e) => {
                              const r = useFormStore.getState().financial.requests;
                              const next = [...r.debts];
                              next[idx] = { ...next[idx]!, amount: e.target.value };
                              setFinancialRequests({ debts: next });
                            }}
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
                            onChange={(e) => {
                              const r = useFormStore.getState().financial.requests;
                              const next = [...r.debts];
                              next[idx] = { ...next[idx]!, dueDate: e.target.value };
                              setFinancialRequests({ debts: next });
                            }}
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
                htmlFor="debtExplanation"
                className="text-sm font-medium text-slate-800"
              >
                Explain why you want the person to pay the debts listed above
              </label>
              <textarea
                id="debtExplanation"
                autoComplete="off"
                maxLength={PAGE10_PAY_DEBTS_EXPLAIN_MAX}
                value={fr.debtExplanation}
                onChange={(e) =>
                  setFinancialRequests({ debtExplanation: e.target.value })
                }
                className={textareaClass}
              />
              <p className="mt-1 text-xs text-slate-500">
                {fr.debtExplanation.length} / {PAGE10_PAY_DEBTS_EXPLAIN_MAX}{" "}
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
                    name="debtSpecialFinding"
                    checked={fr.debtSpecialFinding === "yes"}
                    onChange={() =>
                      setFinancialRequests({
                        debtSpecialFinding: "yes",
                      })
                    }
                    className="size-4 shrink-0 rounded-sm border border-purple-300/80 text-purple-700 accent-purple-700 outline-none focus-visible:ring-2 focus-visible:ring-purple-700 focus-visible:ring-offset-1"
                  />
                  Yes
                </label>
                <label className="flex cursor-pointer items-center gap-2 py-1 text-sm text-slate-800">
                  <input
                    type="radio"
                    name="debtSpecialFinding"
                    checked={fr.debtSpecialFinding === "no"}
                    onChange={() =>
                      setFinancialRequests({
                        debtSpecialFinding: "no",
                        debtSpecialFindingWhich: {
                          debt1: false,
                          debt2: false,
                          debt3: false,
                        },
                        debtSpecialFindingKnowHow: "",
                        debtSpecialFindingExplanation: "",
                      })
                    }
                    className="size-4 shrink-0 rounded-sm border border-purple-300/80 text-purple-700 accent-purple-700 outline-none focus-visible:ring-2 focus-visible:ring-purple-700 focus-visible:ring-offset-1"
                  />
                  No
                </label>
              </div>

              {fr.debtSpecialFinding === "yes" && (
                <div className="mt-4 space-y-4 border-t border-purple-200/60 pt-4">
                  <p className="text-sm font-medium text-slate-800">
                    Which of the debts listed above resulted from the abuse?
                  </p>
                  <div className="space-y-2">
                    {(
                      [
                        { k: "debt1" as const, label: "Debt 1" },
                        { k: "debt2" as const, label: "Debt 2" },
                        { k: "debt3" as const, label: "Debt 3" },
                      ] as const
                    ).map(({ k, label }) => (
                      <label
                        key={k}
                        className="flex cursor-pointer items-center gap-2 py-1 text-sm text-slate-800"
                      >
                        <input
                          type="checkbox"
                          checked={Boolean(fr.debtSpecialFindingWhich[k])}
                          onChange={(e) => {
                            const r = useFormStore.getState().financial.requests;
                            setFinancialRequests({
                              debtSpecialFindingWhich: {
                                ...r.debtSpecialFindingWhich,
                                [k]: e.target.checked,
                              },
                            });
                          }}
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
                          name="debtSpecialFindingKnowHow"
                          checked={fr.debtSpecialFindingKnowHow === "yes"}
                          onChange={() =>
                            setFinancialRequests({
                              debtSpecialFindingKnowHow: "yes",
                            })
                          }
                          className="size-4 shrink-0 rounded-sm border border-purple-300/80 text-purple-700 accent-purple-700 outline-none focus-visible:ring-2 focus-visible:ring-purple-700 focus-visible:ring-offset-1"
                        />
                        Yes
                      </label>
                      <label className="flex cursor-pointer items-center gap-2 py-1 text-sm text-slate-800">
                        <input
                          type="radio"
                          name="debtSpecialFindingKnowHow"
                          checked={fr.debtSpecialFindingKnowHow === "no"}
                          onChange={() =>
                            setFinancialRequests({
                              debtSpecialFindingKnowHow: "no",
                              debtSpecialFindingExplanation: "",
                            })
                          }
                          className="size-4 shrink-0 rounded-sm border border-purple-300/80 text-purple-700 accent-purple-700 outline-none focus-visible:ring-2 focus-visible:ring-purple-700 focus-visible:ring-offset-1"
                        />
                        No
                      </label>
                    </div>
                  </div>

                  {fr.debtSpecialFindingKnowHow === "yes" && (
                    <div>
                      <label
                        htmlFor="debtSpecialFindingExplanation"
                        className="text-sm font-medium text-slate-800"
                      >
                        Explain how they made the debt or debts
                      </label>
                      <textarea
                        id="debtSpecialFindingExplanation"
                        autoComplete="off"
                        maxLength={PAGE10_PAY_DEBTS_SPECIAL_EXPLAIN_MAX}
                        value={fr.debtSpecialFindingExplanation}
                        onChange={(e) =>
                          setFinancialRequests({
                            debtSpecialFindingExplanation: e.target.value,
                          })
                        }
                        className={textareaClass}
                      />
                      <p className="mt-1 text-xs text-slate-500">
                        {fr.debtSpecialFindingExplanation.length} /{" "}
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
