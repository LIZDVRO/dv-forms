"use client";

import type { Dispatch, SetStateAction } from "react";

import type { Dv100PdfFormData } from "@/lib/dv100-pdf";

import {
  CASE_TYPE_DETAIL_KEY,
  CASE_TYPE_OPTIONS,
  toggleInList,
} from "./wizardShared";

type FormData = Dv100PdfFormData;

type Step4Props = {
  form: FormData;
  setForm: Dispatch<SetStateAction<FormData>>;
  update: <K extends keyof FormData>(key: K, value: FormData[K]) => void;
  inputClass: string;
};

export default function Step4_OtherCourtCases({
  form,
  setForm,
  update,
  inputClass,
}: Step4Props) {
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
                checked={form.hasRestrainingOrders === "yes"}
                onChange={() => update("hasRestrainingOrders", "yes")}
                className="mt-1 size-4 shrink-0 rounded-sm border border-purple-300/80 text-purple-700 accent-purple-700 outline-none focus-visible:ring-2 focus-visible:ring-purple-700 focus-visible:ring-offset-1"
              />
              <span className="text-sm leading-relaxed text-slate-800">Yes</span>
            </label>
            <label className="flex cursor-pointer items-start gap-3 py-3 pr-2 pl-0.5 transition">
              <input
                type="radio"
                name="hasRestrainingOrders"
                checked={form.hasRestrainingOrders === "no"}
                onChange={() => update("hasRestrainingOrders", "no")}
                className="mt-1 size-4 shrink-0 rounded-sm border border-purple-300/80 text-purple-700 accent-purple-700 outline-none focus-visible:ring-2 focus-visible:ring-purple-700 focus-visible:ring-offset-1"
              />
              <span className="text-sm leading-relaxed text-slate-800">No</span>
            </label>
          </div>
        </fieldset>
        {form.hasRestrainingOrders === "yes" && (
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
                  value={form.order1Date}
                  onChange={(e) => update("order1Date", e.target.value)}
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
                  value={form.order1Expires}
                  onChange={(e) => update("order1Expires", e.target.value)}
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
                  value={form.order2Date}
                  onChange={(e) => update("order2Date", e.target.value)}
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
                  value={form.order2Expires}
                  onChange={(e) => update("order2Expires", e.target.value)}
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
                checked={form.hasOtherCases === "yes"}
                onChange={() => update("hasOtherCases", "yes")}
                className="mt-1 size-4 shrink-0 rounded-sm border border-purple-300/80 text-purple-700 accent-purple-700 outline-none focus-visible:ring-2 focus-visible:ring-purple-700 focus-visible:ring-offset-1"
              />
              <span className="text-sm leading-relaxed text-slate-800">Yes</span>
            </label>
            <label className="flex cursor-pointer items-start gap-3 py-3 pr-2 pl-0.5 transition">
              <input
                type="radio"
                name="hasOtherCases"
                checked={form.hasOtherCases === "no"}
                onChange={() => update("hasOtherCases", "no")}
                className="mt-1 size-4 shrink-0 rounded-sm border border-purple-300/80 text-purple-700 accent-purple-700 outline-none focus-visible:ring-2 focus-visible:ring-purple-700 focus-visible:ring-offset-1"
              />
              <span className="text-sm leading-relaxed text-slate-800">No</span>
            </label>
          </div>
        </fieldset>

        {form.hasOtherCases === "yes" && (
          <div className="space-y-6 border-t border-purple-100/90 pt-6">
            <fieldset className="space-y-4">
              <legend className="text-sm font-medium text-slate-800">
                Type of case (check all that apply)
              </legend>
              <div className="space-y-3">
                {CASE_TYPE_OPTIONS.map(({ value, label }) => {
                  const checked = form.caseTypes.includes(value);
                  const detailKey = CASE_TYPE_DETAIL_KEY[value];
                  return (
                    <div
                      key={value}
                      className="rounded-xl border border-purple-100 bg-white px-4 py-3 shadow-sm"
                    >
                      <label className="flex cursor-pointer items-start gap-3 py-2.5 pr-2 pl-0.5 transition">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => {
                            setForm((prev) => {
                              const wasIncluded = prev.caseTypes.includes(value);
                              const nextTypes = toggleInList(
                                prev.caseTypes,
                                value,
                              );
                              const next: FormData = {
                                ...prev,
                                caseTypes: nextTypes,
                              };
                              if (wasIncluded && !nextTypes.includes(value)) {
                                const dk = CASE_TYPE_DETAIL_KEY[value];
                                if (dk) next[dk] = "";
                                if (value === "other") {
                                  next.otherCaseType = "";
                                }
                              }
                              return next;
                            });
                          }}
                          className="mt-1 size-4 shrink-0 rounded-sm border border-purple-300/80 text-purple-700 accent-purple-700 outline-none focus-visible:ring-2 focus-visible:ring-purple-700 focus-visible:ring-offset-1"
                        />
                        <span className="text-sm leading-relaxed text-slate-800">
                          {label}
                        </span>
                      </label>
                      {checked && detailKey && (
                        <div className="mt-3 border-t border-purple-100/90 pt-3 pl-7">
                          <label
                            htmlFor={detailKey}
                            className="text-sm font-medium text-slate-800"
                          >
                            Case details (city, state, year, case number)
                          </label>
                          <input
                            id={detailKey}
                            name={detailKey}
                            type="text"
                            autoComplete="off"
                            value={form[detailKey]}
                            onChange={(e) => update(detailKey, e.target.value)}
                            className={`${inputClass} mt-1.5`}
                          />
                        </div>
                      )}
                      {checked && value === "other" && (
                        <div className="mt-3 border-t border-purple-100/90 pt-3 pl-7">
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
                            value={form.otherCaseType}
                            onChange={(e) =>
                              update("otherCaseType", e.target.value)
                            }
                            className={`${inputClass} mt-1.5`}
                          />
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
