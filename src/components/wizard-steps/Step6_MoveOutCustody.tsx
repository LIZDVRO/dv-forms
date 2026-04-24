"use client";

import type { Dispatch, SetStateAction } from "react";

import type { Dv100PdfFormData } from "@/lib/dv100-pdf";

import {
  MOVE_OUT_13A_MAX_LENGTH,
  MOVE_OUT_13B_OTHER_MAX_LENGTH,
  MOVE_OUT_DURATION_MAX_LENGTH,
  OTHER_ORDERS_14_MAX_LENGTH,
} from "./wizardShared";

type FormData = Dv100PdfFormData;

type Step6Props = {
  form: FormData;
  setForm: Dispatch<SetStateAction<FormData>>;
  update: <K extends keyof FormData>(key: K, value: FormData[K]) => void;
  inputClass: string;
  textareaClass: string;
  resetMoveOutOrders: () => void;
};

export default function Step6_MoveOutCustody({
  form,
  setForm,
  update,
  inputClass,
  textareaClass,
  resetMoveOutOrders,
}: Step6Props) {
  return (
    <div className="space-y-10">
      <section className="space-y-4">
        <h2 className="text-sm font-semibold text-slate-900">
          Section 13. Order to move out
        </h2>
        <label className="flex cursor-pointer items-start gap-3 py-3 pr-2 pl-0.5 transition">
          <input
            type="checkbox"
            checked={form.orderToMoveOut}
            onChange={(e) => {
              if (e.target.checked) {
                update("orderToMoveOut", true);
              } else {
                resetMoveOutOrders();
              }
            }}
            className="mt-1 size-4 shrink-0 rounded-sm border border-purple-300/80 text-purple-700 accent-purple-700 outline-none focus-visible:ring-2 focus-visible:ring-purple-700 focus-visible:ring-offset-1"
          />
          <span className="text-sm font-medium text-slate-800">Order to Move Out</span>
        </label>

        {form.orderToMoveOut && (
          <div className="space-y-6">
            <div>
              <label
                htmlFor="moveOutOrderPersonAsk"
                className="text-sm font-medium text-slate-800"
              >
                13a. I ask the judge to order the person in item 2 to move out of
                (address)
              </label>
              <input
                id="moveOutOrderPersonAsk"
                type="text"
                autoComplete="off"
                maxLength={MOVE_OUT_13A_MAX_LENGTH}
                value={form.moveOutOrderPersonAsk}
                onChange={(e) =>
                  update("moveOutOrderPersonAsk", e.target.value)
                }
                className={inputClass}
              />
              <p className="mt-1 text-xs text-slate-500">
                {form.moveOutOrderPersonAsk.length} / {MOVE_OUT_13A_MAX_LENGTH}{" "}
                characters
              </p>
            </div>

            <div>
              <h3 className="text-sm font-medium text-slate-800">
                13b. I ask the judge to find that (check all that apply)
              </h3>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {(
                  [
                    { key: "moveOutOwnHome" as const, label: "I own the home" },
                    {
                      key: "moveOutNameOnLease" as const,
                      label: "My name is on the lease",
                    },
                    {
                      key: "moveOutWithChildren" as const,
                      label: "I live at this address with my children",
                    },
                    {
                      key: "moveOutLivedFor" as const,
                      label: "I have lived at this address for",
                    },
                    {
                      key: "moveOutPaysRent" as const,
                      label:
                        "I pay for some or all of the rent or mortgage",
                    },
                    {
                      key: "moveOutOther" as const,
                      label: "Other (please explain)",
                    },
                  ] as const
                ).map(({ key, label }) => (
                  <label
                    key={key}
                    className="flex cursor-pointer items-start gap-3 py-2.5 pr-2 pl-0.5 transition"
                  >
                    <input
                      type="checkbox"
                      checked={Boolean(form[key])}
                      onChange={(e) => {
                        const on = e.target.checked;
                        if (key === "moveOutLivedFor" && !on) {
                          setForm((prev) => ({
                            ...prev,
                            moveOutLivedFor: false,
                            moveOutLivedYears: "",
                            moveOutLivedMonths: "",
                          }));
                        } else if (key === "moveOutOther" && !on) {
                          setForm((prev) => ({
                            ...prev,
                            moveOutOther: false,
                            moveOutOtherExplain: "",
                          }));
                        } else {
                          update(key, on);
                        }
                      }}
                      className="mt-0.5 size-4 shrink-0 rounded-sm border border-purple-300/80 text-purple-700 accent-purple-700 outline-none focus-visible:ring-2 focus-visible:ring-purple-700 focus-visible:ring-offset-1"
                    />
                    <span className="text-sm text-slate-800">{label}</span>
                  </label>
                ))}
              </div>

              {form.moveOutLivedFor && (
                <div className="mt-4 flex flex-wrap gap-4">
                  <div className="min-w-[7rem] flex-1">
                    <label
                      htmlFor="moveOutLivedYears"
                      className="text-sm font-medium text-slate-800"
                    >
                      Years
                    </label>
                    <input
                      id="moveOutLivedYears"
                      type="text"
                      inputMode="numeric"
                      autoComplete="off"
                      maxLength={MOVE_OUT_DURATION_MAX_LENGTH}
                      value={form.moveOutLivedYears}
                      onChange={(e) =>
                        update("moveOutLivedYears", e.target.value)
                      }
                      className={inputClass}
                    />
                  </div>
                  <div className="min-w-[7rem] flex-1">
                    <label
                      htmlFor="moveOutLivedMonths"
                      className="text-sm font-medium text-slate-800"
                    >
                      Months
                    </label>
                    <input
                      id="moveOutLivedMonths"
                      type="text"
                      inputMode="numeric"
                      autoComplete="off"
                      maxLength={MOVE_OUT_DURATION_MAX_LENGTH}
                      value={form.moveOutLivedMonths}
                      onChange={(e) =>
                        update("moveOutLivedMonths", e.target.value)
                      }
                      className={inputClass}
                    />
                  </div>
                </div>
              )}

              {form.moveOutOther && (
                <div className="mt-4">
                  <label
                    htmlFor="moveOutOtherExplain"
                    className="text-sm font-medium text-slate-800"
                  >
                    13b. Other — explain
                  </label>
                  <textarea
                    id="moveOutOtherExplain"
                    autoComplete="off"
                    maxLength={MOVE_OUT_13B_OTHER_MAX_LENGTH}
                    value={form.moveOutOtherExplain}
                    onChange={(e) =>
                      update("moveOutOtherExplain", e.target.value)
                    }
                    className={textareaClass}
                  />
                  <p className="mt-1 text-xs text-slate-500">
                    {form.moveOutOtherExplain.length} /{" "}
                    {MOVE_OUT_13B_OTHER_MAX_LENGTH} characters
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </section>

      <section className="space-y-4 border-t border-purple-100/90 pt-8">
        <h2 className="text-sm font-semibold text-slate-900">Section 14. Other orders</h2>
        <label className="flex cursor-pointer items-start gap-3 py-3 pr-2 pl-0.5 transition">
          <input
            type="checkbox"
            checked={form.otherOrders}
            onChange={(e) => {
              const on = e.target.checked;
              if (!on) {
                setForm((prev) => ({
                  ...prev,
                  otherOrders: false,
                  otherOrdersDescribe: "",
                }));
              } else {
                update("otherOrders", true);
              }
            }}
            className="mt-1 size-4 shrink-0 rounded-sm border border-purple-300/80 text-purple-700 accent-purple-700 outline-none focus-visible:ring-2 focus-visible:ring-purple-700 focus-visible:ring-offset-1"
          />
          <span className="text-sm font-medium text-slate-800">Other Orders</span>
        </label>
        {form.otherOrders && (
          <div>
            <label
              htmlFor="otherOrdersDescribe"
              className="text-sm font-medium text-slate-800"
            >
              14. Describe additional orders you want the judge to make
            </label>
            <textarea
              id="otherOrdersDescribe"
              autoComplete="off"
              maxLength={OTHER_ORDERS_14_MAX_LENGTH}
              value={form.otherOrdersDescribe}
              onChange={(e) =>
                update("otherOrdersDescribe", e.target.value)
              }
              className={textareaClass}
            />
            <p className="mt-1 text-xs text-slate-500">
              {form.otherOrdersDescribe.length} / {OTHER_ORDERS_14_MAX_LENGTH}{" "}
              characters
            </p>
          </div>
        )}
      </section>

      <section className="space-y-4 border-t border-purple-100/90 pt-8">
        <h2 className="text-sm font-semibold text-slate-900">Section 15. Child custody</h2>
        <label className="flex cursor-pointer items-start gap-3 py-3 pr-2 pl-0.5 transition">
          <input
            type="checkbox"
            checked={form.childCustodyVisitation}
            onChange={(e) =>
              update("childCustodyVisitation", e.target.checked)
            }
            className="mt-1 size-4 shrink-0 rounded-sm border border-purple-300/80 text-purple-700 accent-purple-700 outline-none focus-visible:ring-2 focus-visible:ring-purple-700 focus-visible:ring-offset-1"
          />
          <span className="text-sm font-medium text-slate-800">
            Child Custody and Visitation
          </span>
        </label>
        {form.childCustodyVisitation && (
          <div
            className="rounded-xl border border-purple-200/90 bg-purple-50/80 px-4 py-3 text-sm leading-relaxed text-purple-950"
            role="status"
          >
            You must fill out form{" "}
            <a
              href="https://www.courts.ca.gov/documents/dv105.pdf"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-liz underline underline-offset-2 hover:text-purple-800"
            >
              DV-105
            </a>
            ...
          </div>
        )}
      </section>
    </div>
  );
}
