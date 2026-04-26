"use client";

import type { CourtCaseRecord } from "@/store/useFormStore";
import { useFormStore } from "@/store/useFormStore";

import { CASE_TYPE_OPTIONS } from "./wizardShared";

const blankCaseRow = (): CourtCaseRecord => ({
  caseType: "",
  caseTypeOther: "",
  location: "",
  year: "",
  caseNumber: "",
});

type Step4Props = {
  inputClass: string;
};

export default function Step6_CourtHistory({ inputClass }: Step4Props) {
  const courtHistory = useFormStore((s) => s.courtHistory);
  const setCourtHistory = useFormStore((s) => s.setCourtHistory);

  const ro0 = courtHistory.restrainingOrders[0] ?? {
    dateOfOrder: "",
    dateExpires: "",
  };
  const ro1 = courtHistory.restrainingOrders[1] ?? {
    dateOfOrder: "",
    dateExpires: "",
  };

  const setRestrainingSlot = (
    index: 0 | 1,
    patch: Partial<{ dateOfOrder: string; dateExpires: string }>,
  ) => {
    const next = [...courtHistory.restrainingOrders];
    while (next.length < 2) {
      next.push({ dateOfOrder: "", dateExpires: "" });
    }
    const slot = next[index] ?? { dateOfOrder: "", dateExpires: "" };
    next[index] = { ...slot, ...patch };
    setCourtHistory({ restrainingOrders: next });
  };

  const otherCases = courtHistory.otherCases ?? [];

  const isCaseTypeSelected = (value: string) =>
    otherCases.some((c) => c.caseType === value);

  const rowForType = (value: string) =>
    otherCases.find((c) => c.caseType === value);

  const toggleCaseType = (value: string) => {
    if (isCaseTypeSelected(value)) {
      setCourtHistory({
        otherCases: otherCases.filter((c) => c.caseType !== value),
      });
      return;
    }
    setCourtHistory({
      otherCases: [
        ...otherCases,
        {
          caseType: value,
          caseTypeOther: "",
          location: "",
          year: "",
          caseNumber: "",
        },
      ],
    });
  };

  const updateCaseRow = (
    caseType: string,
    patch: Partial<CourtCaseRecord>,
  ) => {
    setCourtHistory({
      otherCases: otherCases.map((c) =>
        c.caseType === caseType ? { ...c, ...patch } : c,
      ),
    });
  };

  return (
    <div className="space-y-8">
      <section className="space-y-6">
        <h2 className="text-sm font-semibold text-slate-900">
          Other restraining or protective orders
        </h2>
        <fieldset className="space-y-4">
          <legend className="text-sm font-medium text-slate-800">
            Do you have any other restraining/protective orders currently in
            effect?
          </legend>
          <div className="space-y-3">
            <label className="flex cursor-pointer items-start gap-3 py-3 pr-2 pl-0.5 transition">
              <input
                type="radio"
                name="hasRestrainingOrders"
                checked={courtHistory.hasRestrainingOrders === "yes"}
                onChange={() =>
                  setCourtHistory({
                    hasRestrainingOrders: "yes",
                  })
                }
                className="mt-1 size-4 shrink-0 rounded-sm border border-purple-300/80 text-purple-700 accent-purple-700 outline-none focus-visible:ring-2 focus-visible:ring-purple-700 focus-visible:ring-offset-1"
              />
              <span className="text-sm leading-relaxed text-slate-800">Yes</span>
            </label>
            <label className="flex cursor-pointer items-start gap-3 py-3 pr-2 pl-0.5 transition">
              <input
                type="radio"
                name="hasRestrainingOrders"
                checked={courtHistory.hasRestrainingOrders === "no"}
                onChange={() =>
                  setCourtHistory({
                    hasRestrainingOrders: "no",
                    restrainingOrders: [
                      { dateOfOrder: "", dateExpires: "" },
                      { dateOfOrder: "", dateExpires: "" },
                    ],
                  })
                }
                className="mt-1 size-4 shrink-0 rounded-sm border border-purple-300/80 text-purple-700 accent-purple-700 outline-none focus-visible:ring-2 focus-visible:ring-purple-700 focus-visible:ring-offset-1"
              />
              <span className="text-sm leading-relaxed text-slate-800">No</span>
            </label>
          </div>
        </fieldset>
        {courtHistory.hasRestrainingOrders === "yes" && (
          <div className="space-y-6 border-t border-purple-100/90 pt-6">
            <p className="text-sm text-slate-600">
              For each order, enter the date of the order and when it expires.
            </p>
            <div className="grid gap-6 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="order1Date"
                  className="text-sm font-medium text-slate-800"
                >
                  Order 1 — date of order
                </label>
                <input
                  id="order1Date"
                  name="order1Date"
                  type="text"
                  autoComplete="off"
                  value={ro0.dateOfOrder}
                  onChange={(e) =>
                    setRestrainingSlot(0, { dateOfOrder: e.target.value })
                  }
                  className={inputClass}
                />
              </div>
              <div>
                <label
                  htmlFor="order1Expires"
                  className="text-sm font-medium text-slate-800"
                >
                  Order 1 — date it expires
                </label>
                <input
                  id="order1Expires"
                  name="order1Expires"
                  type="text"
                  autoComplete="off"
                  value={ro0.dateExpires}
                  onChange={(e) =>
                    setRestrainingSlot(0, { dateExpires: e.target.value })
                  }
                  className={inputClass}
                />
              </div>
            </div>
            <div className="grid gap-6 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="order2Date"
                  className="text-sm font-medium text-slate-800"
                >
                  Order 2 — date of order
                </label>
                <input
                  id="order2Date"
                  name="order2Date"
                  type="text"
                  autoComplete="off"
                  value={ro1.dateOfOrder}
                  onChange={(e) =>
                    setRestrainingSlot(1, { dateOfOrder: e.target.value })
                  }
                  className={inputClass}
                />
              </div>
              <div>
                <label
                  htmlFor="order2Expires"
                  className="text-sm font-medium text-slate-800"
                >
                  Order 2 — date it expires
                </label>
                <input
                  id="order2Expires"
                  name="order2Expires"
                  type="text"
                  autoComplete="off"
                  value={ro1.dateExpires}
                  onChange={(e) =>
                    setRestrainingSlot(1, { dateExpires: e.target.value })
                  }
                  className={inputClass}
                />
              </div>
            </div>
          </div>
        )}
      </section>

      <section className="space-y-6 border-t border-purple-100/90 pt-8">
        <h2 className="text-sm font-semibold text-slate-900">Other court cases</h2>
        <fieldset className="space-y-4">
          <legend className="text-sm font-medium text-slate-800">
            Has any other court case involving you and this person been filed?
          </legend>
          <div className="space-y-3">
            <label className="flex cursor-pointer items-start gap-3 py-3 pr-2 pl-0.5 transition">
              <input
                type="radio"
                name="hasOtherCases"
                checked={courtHistory.hasOtherCases === "yes"}
                onChange={() =>
                  setCourtHistory({
                    hasOtherCases: "yes",
                  })
                }
                className="mt-1 size-4 shrink-0 rounded-sm border border-purple-300/80 text-purple-700 accent-purple-700 outline-none focus-visible:ring-2 focus-visible:ring-purple-700 focus-visible:ring-offset-1"
              />
              <span className="text-sm leading-relaxed text-slate-800">Yes</span>
            </label>
            <label className="flex cursor-pointer items-start gap-3 py-3 pr-2 pl-0.5 transition">
              <input
                type="radio"
                name="hasOtherCases"
                checked={courtHistory.hasOtherCases === "no"}
                onChange={() =>
                  setCourtHistory({
                    hasOtherCases: "no",
                    otherCases: [blankCaseRow()],
                  })
                }
                className="mt-1 size-4 shrink-0 rounded-sm border border-purple-300/80 text-purple-700 accent-purple-700 outline-none focus-visible:ring-2 focus-visible:ring-purple-700 focus-visible:ring-offset-1"
              />
              <span className="text-sm leading-relaxed text-slate-800">No</span>
            </label>
          </div>
        </fieldset>

        {courtHistory.hasOtherCases === "yes" && (
          <div className="space-y-6 border-t border-purple-100/90 pt-6">
            <fieldset className="space-y-4">
              <legend className="text-sm font-medium text-slate-800">
                Type of case (check all that apply)
              </legend>
              <div className="space-y-3">
                {CASE_TYPE_OPTIONS.map(({ value, label }) => {
                  const checked = isCaseTypeSelected(value);
                  const row = rowForType(value);
                  return (
                    <div
                      key={value}
                      className="rounded-xl border border-purple-100 bg-white px-4 py-3 shadow-sm"
                    >
                      <label className="flex cursor-pointer items-start gap-3 py-2.5 pr-2 pl-0.5 transition">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleCaseType(value)}
                          className="mt-1 size-4 shrink-0 rounded-sm border border-purple-300/80 text-purple-700 accent-purple-700 outline-none focus-visible:ring-2 focus-visible:ring-purple-700 focus-visible:ring-offset-1"
                        />
                        <span className="text-sm leading-relaxed text-slate-800">
                          {label}
                        </span>
                      </label>
                      {checked && row && value !== "other" && (
                        <div className="mt-3 space-y-3 border-t border-purple-100/90 pt-3 pl-7">
                          <p className="text-xs font-medium text-slate-600">
                            Where filed, year, and case number (as known)
                          </p>
                          <div>
                            <label
                              htmlFor={`${value}-location`}
                              className="text-sm font-medium text-slate-800"
                            >
                              City, state, or tribe
                            </label>
                            <input
                              id={`${value}-location`}
                              type="text"
                              autoComplete="off"
                              value={row.location}
                              onChange={(e) =>
                                updateCaseRow(value, {
                                  location: e.target.value,
                                })
                              }
                              className={`${inputClass} mt-1.5`}
                            />
                          </div>
                          <div className="grid gap-3 sm:grid-cols-2">
                            <div>
                              <label
                                htmlFor={`${value}-year`}
                                className="text-sm font-medium text-slate-800"
                              >
                                Year filed
                              </label>
                              <input
                                id={`${value}-year`}
                                type="text"
                                autoComplete="off"
                                value={row.year}
                                onChange={(e) =>
                                  updateCaseRow(value, { year: e.target.value })
                                }
                                className={`${inputClass} mt-1.5`}
                              />
                            </div>
                            <div>
                              <label
                                htmlFor={`${value}-num`}
                                className="text-sm font-medium text-slate-800"
                              >
                                Case number
                              </label>
                              <input
                                id={`${value}-num`}
                                type="text"
                                autoComplete="off"
                                value={row.caseNumber}
                                onChange={(e) =>
                                  updateCaseRow(value, {
                                    caseNumber: e.target.value,
                                  })
                                }
                                className={`${inputClass} mt-1.5`}
                              />
                            </div>
                          </div>
                        </div>
                      )}
                      {checked && row && value === "other" && (
                        <div className="mt-3 space-y-3 border-t border-purple-100/90 pt-3 pl-7">
                          <div>
                            <label
                              htmlFor="otherCaseType"
                              className="text-sm font-medium text-slate-800"
                            >
                              What kind of case?
                            </label>
                            <input
                              id="otherCaseType"
                              name="otherCaseType"
                              type="text"
                              autoComplete="off"
                              value={row.caseTypeOther}
                              onChange={(e) =>
                                updateCaseRow("other", {
                                  caseTypeOther: e.target.value,
                                })
                              }
                              className={`${inputClass} mt-1.5`}
                            />
                          </div>
                          <div>
                            <label
                              htmlFor="other-location"
                              className="text-sm font-medium text-slate-800"
                            >
                              City, state, or tribe
                            </label>
                            <input
                              id="other-location"
                              type="text"
                              autoComplete="off"
                              value={row.location}
                              onChange={(e) =>
                                updateCaseRow("other", {
                                  location: e.target.value,
                                })
                              }
                              className={`${inputClass} mt-1.5`}
                            />
                          </div>
                          <div className="grid gap-3 sm:grid-cols-2">
                            <div>
                              <label
                                htmlFor="other-year"
                                className="text-sm font-medium text-slate-800"
                              >
                                Year filed
                              </label>
                              <input
                                id="other-year"
                                type="text"
                                autoComplete="off"
                                value={row.year}
                                onChange={(e) =>
                                  updateCaseRow("other", {
                                    year: e.target.value,
                                  })
                                }
                                className={`${inputClass} mt-1.5`}
                              />
                            </div>
                            <div>
                              <label
                                htmlFor="other-num"
                                className="text-sm font-medium text-slate-800"
                              >
                                Case number
                              </label>
                              <input
                                id="other-num"
                                type="text"
                                autoComplete="off"
                                value={row.caseNumber}
                                onChange={(e) =>
                                  updateCaseRow("other", {
                                    caseNumber: e.target.value,
                                  })
                                }
                                className={`${inputClass} mt-1.5`}
                              />
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </fieldset>
          </div>
        )}
      </section>
    </div>
  );
}
