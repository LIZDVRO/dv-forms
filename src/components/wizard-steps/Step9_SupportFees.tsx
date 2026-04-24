"use client";

import { formFieldInputControlClassName } from "@/components/ui/input";
import {
  DV100_LIZ_DOC_ASSIST_FOR,
  DV100_LIZ_FEE_AMOUNT,
  DV100_LIZ_INVOICE_LINE_AMOUNT,
  DV100_LIZ_PAYEE,
} from "@/lib/dv100-pdf";
import { type FinancialRequestsInfo, useFormStore } from "@/store/useFormStore";

type RestitutionTuple = FinancialRequestsInfo["restitutionExpenses"];

function mapRestitutionTuple(
  prev: FinancialRequestsInfo,
  mapRow: (
    row: RestitutionTuple[number],
    index: number,
  ) => RestitutionTuple[number],
): RestitutionTuple {
  return prev.restitutionExpenses.map(mapRow) as RestitutionTuple;
}

const checkboxClass =
  "mt-1 size-4 shrink-0 border-purple-200 accent-liz focus:ring-liz";

const labelCardClass =
  "flex cursor-pointer items-start gap-3 rounded-xl border border-purple-100 bg-white px-4 py-3 shadow-sm transition hover:border-purple-200 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-liz/30";

export default function Step9_SupportFees() {
  const fr = useFormStore((s) => s.financial.requests);
  const setFinancialRequests = useFormStore((s) => s.setFinancialRequests);

  const updateRestitutionRow = (
    index: number,
    key: keyof RestitutionTuple[number],
    value: string,
  ) => {
    if (fr.requestAbuserPayLizFee && index === 0) return;
    const prev = useFormStore.getState().financial.requests;
    setFinancialRequests({
      restitutionExpenses: mapRestitutionTuple(prev, (row, i) =>
        i === index ? { ...row, [key]: value } : row,
      ),
    });
  };

  return (
    <div className="space-y-8">
      <section className="space-y-4">
        <h2 className="text-sm font-semibold text-slate-900">
          Section 23. Pay expenses caused by the abuse (restitution)
        </h2>
        <label className={labelCardClass}>
          <input
            type="checkbox"
            checked={fr.wantsRestitution}
            onChange={(e) => {
              const checked = e.target.checked;
              if (!checked) {
                setFinancialRequests({
                  wantsRestitution: false,
                  requestAbuserPayLizFee: false,
                  restitutionExpenses: [
                    { payTo: "", forWhat: "", amount: "" },
                    { payTo: "", forWhat: "", amount: "" },
                    { payTo: "", forWhat: "", amount: "" },
                    { payTo: "", forWhat: "", amount: "" },
                  ],
                });
              } else {
                setFinancialRequests({ wantsRestitution: true });
              }
            }}
            className={checkboxClass}
          />
          <span className="text-sm font-medium text-slate-800">
            Pay Expenses Caused by the Abuse
          </span>
        </label>

        {fr.wantsRestitution ? (
          <div className="space-y-6">
            <label className={labelCardClass}>
              <input
                type="checkbox"
                checked={fr.requestAbuserPayLizFee}
                onChange={(e) => {
                  const checked = e.target.checked;
                  if (checked) {
                    const prev = useFormStore.getState().financial.requests;
                    setFinancialRequests({
                      requestAbuserPayLizFee: true,
                      restitutionExpenses: mapRestitutionTuple(prev, (row, i) =>
                        i === 0
                          ? {
                              payTo: DV100_LIZ_PAYEE,
                              forWhat: DV100_LIZ_DOC_ASSIST_FOR,
                              amount: DV100_LIZ_FEE_AMOUNT,
                            }
                          : row,
                      ),
                    });
                  } else {
                    const prev = useFormStore.getState().financial.requests;
                    setFinancialRequests({
                      requestAbuserPayLizFee: false,
                      restitutionExpenses: mapRestitutionTuple(prev, (row, i) =>
                        i === 0 ? { payTo: "", forWhat: "", amount: "" } : row,
                      ),
                    });
                  }
                }}
                className={checkboxClass}
              />
              <span className="text-sm font-medium text-slate-800">
                Request the abuser pay the $250 document assistance fee directly to LIZ Break
                Free.
              </span>
            </label>

            {fr.requestAbuserPayLizFee ? (
              <div
                className="rounded-xl border border-liz/30 bg-liz/8 px-4 py-3 text-sm leading-relaxed text-slate-800"
                role="status"
              >
                <p className="font-medium text-purple-950">
                  A one-page LIZ invoice ({DV100_LIZ_INVOICE_LINE_AMOUNT}) will be appended to
                  your downloaded DV-100 for the court.
                </p>
              </div>
            ) : null}

            <div>
              <p className="text-sm font-medium text-slate-800">
                Expenses (up to four lines — matches the DV-100 grid)
              </p>
              <div className="mt-3 overflow-x-auto rounded-xl border border-purple-100 bg-white shadow-sm">
                <table className="min-w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-purple-100 bg-purple-50/60 text-xs font-semibold uppercase tracking-wide text-slate-600">
                      <th className="px-3 py-2">#</th>
                      <th className="px-3 py-2">Pay to</th>
                      <th className="px-3 py-2">For</th>
                      <th className="px-3 py-2">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {fr.restitutionExpenses.map((row, idx) => {
                      const rowLocked = fr.requestAbuserPayLizFee && idx === 0;
                      return (
                        <tr key={idx} className="border-b border-purple-50 last:border-0">
                          <td className="px-3 py-2 align-top text-slate-500">{idx + 1}</td>
                          <td className="px-3 py-2 align-top">
                            <input
                              type="text"
                              autoComplete="off"
                              disabled={rowLocked}
                              readOnly={rowLocked}
                              value={row.payTo}
                              onChange={(e) =>
                                updateRestitutionRow(idx, "payTo", e.target.value)
                              }
                              className={formFieldInputControlClassName}
                              aria-label={`Pay to, row ${idx + 1}`}
                            />
                          </td>
                          <td className="px-3 py-2 align-top">
                            <input
                              type="text"
                              autoComplete="off"
                              disabled={rowLocked}
                              readOnly={rowLocked}
                              value={row.forWhat}
                              onChange={(e) =>
                                updateRestitutionRow(idx, "forWhat", e.target.value)
                              }
                              className={formFieldInputControlClassName}
                              aria-label={`For, row ${idx + 1}`}
                            />
                          </td>
                          <td className="px-3 py-2 align-top">
                            <input
                              type="text"
                              autoComplete="off"
                              disabled={rowLocked}
                              readOnly={rowLocked}
                              value={row.amount}
                              onChange={(e) =>
                                updateRestitutionRow(idx, "amount", e.target.value)
                              }
                              className={formFieldInputControlClassName}
                              aria-label={`Amount, row ${idx + 1}`}
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ) : null}
      </section>

      <section className="space-y-4 border-t border-purple-100/90 pt-8">
        <h2 className="text-sm font-semibold text-slate-900">Section 24. Child support</h2>
        <label className={labelCardClass}>
          <input
            type="checkbox"
            checked={fr.wantsChildSupport}
            onChange={(e) => {
              const checked = e.target.checked;
              setFinancialRequests({
                wantsChildSupport: checked,
                ...(checked
                  ? {}
                  : {
                      childSupportNoOrderWantOne: false,
                      childSupportHaveOrderWantChanged: false,
                      receivingTANF: false,
                    }),
              });
            }}
            className={checkboxClass}
          />
          <span className="space-y-1">
            <span className="block text-sm font-medium text-slate-800">Child Support</span>
            <span className="block text-xs font-normal text-slate-500">
              (This applies only if you have a minor child with the person in 2.)
            </span>
          </span>
        </label>

        {fr.wantsChildSupport ? (
          <div className="ml-2 space-y-3 border-l-2 border-purple-100 pl-4">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
              Check all that apply
            </p>
            <label className={labelCardClass}>
              <input
                type="checkbox"
                checked={fr.childSupportNoOrderWantOne}
                onChange={(e) =>
                  setFinancialRequests({
                    childSupportNoOrderWantOne: e.target.checked,
                  })
                }
                className={checkboxClass}
              />
              <span className="text-sm text-slate-800">
                I do not have a child support order and I want one.
              </span>
            </label>
            <label className={labelCardClass}>
              <input
                type="checkbox"
                checked={fr.childSupportHaveOrderWantChanged}
                onChange={(e) =>
                  setFinancialRequests({
                    childSupportHaveOrderWantChanged: e.target.checked,
                  })
                }
                className={checkboxClass}
              />
              <span className="text-sm text-slate-800">
                I have a child support order and I want it changed (attach a copy if you have
                one).
              </span>
            </label>
            <label className={labelCardClass}>
              <input
                type="checkbox"
                checked={fr.receivingTANF}
                onChange={(e) =>
                  setFinancialRequests({ receivingTANF: e.target.checked })
                }
                className={checkboxClass}
              />
              <span className="text-sm text-slate-800">
                I now receive or have applied for TANF, Welfare, or CalWORKS.
              </span>
            </label>
          </div>
        ) : null}
      </section>

      <section className="space-y-4 border-t border-purple-100/90 pt-8">
        <h2 className="text-sm font-semibold text-slate-900">Section 25. Spousal Support</h2>
        <label className={labelCardClass}>
          <input
            type="checkbox"
            checked={fr.wantsSpousalSupport}
            onChange={(e) =>
              setFinancialRequests({ wantsSpousalSupport: e.target.checked })
            }
            className={checkboxClass}
          />
          <span className="space-y-1">
            <span className="block text-sm font-medium text-slate-800">Spousal Support</span>
            <span className="block text-xs font-normal text-slate-500">
              (You must be married or a registered domestic partner with the person in 2.)
            </span>
            <span className="block text-sm font-normal text-slate-800">
              I ask the judge to order the person in 2 to give me financial assistance.
            </span>
          </span>
        </label>
      </section>

      <section className="space-y-4 border-t border-purple-100/90 pt-8">
        <h2 className="text-sm font-semibold text-slate-900">
          Section 26. Lawyer&apos;s fees and costs
        </h2>
        <label className={labelCardClass}>
          <input
            type="checkbox"
            checked={fr.wantsLawyerFees}
            onChange={(e) =>
              setFinancialRequests({ wantsLawyerFees: e.target.checked })
            }
            className={checkboxClass}
          />
          <span className="text-sm font-medium text-slate-800">
            I ask that the person in 2 pay for some or all of my lawyer&apos;s fees and costs.
          </span>
        </label>
      </section>
    </div>
  );
}
