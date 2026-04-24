"use client";

import type { Dispatch, SetStateAction } from "react";

import type { Dv100PdfFormData } from "@/lib/dv100-pdf";

type FormData = Dv100PdfFormData;

type Step5Props = {
  form: FormData;
  setForm: Dispatch<SetStateAction<FormData>>;
  update: <K extends keyof FormData>(key: K, value: FormData[K]) => void;
  inputClass: string;
  resetStayAwayOrders: () => void;
};

export default function Step5_OrdersRequested({
  form,
  setForm,
  update,
  inputClass,
  resetStayAwayOrders,
}: Step5Props) {
  return (
    <div className="space-y-10">
      <section className="space-y-4">
        <h2 className="text-sm font-semibold text-slate-900">
          Section 10. Order to not abuse
        </h2>
        <label className="flex cursor-pointer items-start gap-3 py-3 pr-2 pl-0.5 transition">
          <input
            type="checkbox"
            checked={form.orderToNotAbuse}
            onChange={(e) => update("orderToNotAbuse", e.target.checked)}
            className="mt-1 size-4 shrink-0 rounded-sm border border-purple-300/80 text-purple-700 accent-purple-700 outline-none focus-visible:ring-2 focus-visible:ring-purple-700 focus-visible:ring-offset-1"
          />
          <span className="text-sm font-medium text-slate-800">
            Order to Not Abuse
          </span>
        </label>
        <p className="rounded-xl border border-purple-100/80 bg-purple-50/40 px-4 py-3 text-sm leading-relaxed text-slate-800">
          I ask the judge to order the person in item 2 to not do the following
          things to me or anyone listed in Section 8: Harass, attack, strike,
          threaten, assault (sexually or otherwise), hit, follow, stalk, molest,
          destroy personal property, keep under surveillance, impersonate (on
          the internet, electronically, or otherwise), block movements, annoy by
          phone or other electronic means (including repeatedly contact), or
          disturb the peace.
        </p>
        <p className="text-sm leading-relaxed text-slate-700">
          For more information on what &apos;disturbing the peace&apos; means,
          read form{" "}
          <a
            href="https://courts.ca.gov/sites/default/files/courts/default/2024-11/dv500info.pdf"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-liz underline underline-offset-2 hover:text-liz"
          >
            DV-500-INFO
          </a>
          , Can a Domestic Violence Restraining Order Help Me?
        </p>
      </section>

      <section className="space-y-4 border-t border-purple-100/90 pt-8">
        <h2 className="text-sm font-semibold text-slate-900">
          Section 11. No-contact order
        </h2>
        <label className="flex cursor-pointer items-start gap-3 py-3 pr-2 pl-0.5 transition">
          <input
            type="checkbox"
            checked={form.noContactOrder}
            onChange={(e) => update("noContactOrder", e.target.checked)}
            className="mt-1 size-4 shrink-0 rounded-sm border border-purple-300/80 text-purple-700 accent-purple-700 outline-none focus-visible:ring-2 focus-visible:ring-purple-700 focus-visible:ring-offset-1"
          />
          <span className="text-sm font-medium text-slate-800">No-Contact Order</span>
        </label>
        <p className="text-sm leading-relaxed text-slate-700">
          I ask the judge to order the person in item 2 to not contact me or
          anyone listed in Section 8.
        </p>
      </section>

      <section className="space-y-6 border-t border-purple-100/90 pt-8">
        <h2 className="text-sm font-semibold text-slate-900">
          Section 12. Stay-away order
        </h2>
        <label className="flex cursor-pointer items-start gap-3 py-3 pr-2 pl-0.5 transition">
          <input
            type="checkbox"
            checked={form.stayAwayOrder}
            onChange={(e) => {
              if (e.target.checked) {
                update("stayAwayOrder", true);
              } else {
                resetStayAwayOrders();
              }
            }}
            className="mt-1 size-4 shrink-0 rounded-sm border border-purple-300/80 text-purple-700 accent-purple-700 outline-none focus-visible:ring-2 focus-visible:ring-purple-700 focus-visible:ring-offset-1"
          />
          <span className="text-sm font-medium text-slate-800">Stay-Away Order</span>
        </label>

        {form.stayAwayOrder && (
          <div className="space-y-8">
            <p className="text-sm leading-relaxed text-slate-700">
              I ask the judge to order the person in item 2 to stay away from the
              places and people checked below.
            </p>

            <div>
              <h3 className="text-sm font-medium text-slate-800">
                12a. Stay away from (check all that apply)
              </h3>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div className="space-y-3">
                  {(
                    [
                      { key: "stayAwayMe" as const, label: "Me" },
                      { key: "stayAwayHome" as const, label: "My home" },
                      {
                        key: "stayAwayWork" as const,
                        label: "My job or workplace",
                      },
                      {
                        key: "stayAwayVehicle" as const,
                        label: "My vehicle",
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
                        onChange={(e) => update(key, e.target.checked)}
                        className="mt-0.5 size-4 shrink-0 rounded-sm border border-purple-300/80 text-purple-700 accent-purple-700 outline-none focus-visible:ring-2 focus-visible:ring-purple-700 focus-visible:ring-offset-1"
                      />
                      <span className="text-sm text-slate-800">{label}</span>
                    </label>
                  ))}
                </div>
                <div className="space-y-3">
                  {(
                    [
                      { key: "stayAwaySchool" as const, label: "My school" },
                      {
                        key: "stayAwayProtectedPersons" as const,
                        label: "Each person in Section 8",
                      },
                      {
                        key: "stayAwayChildrenSchool" as const,
                        label: "My children's school or childcare",
                      },
                      {
                        key: "stayAwayOther" as const,
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
                        onChange={(e) => update(key, e.target.checked)}
                        className="mt-0.5 size-4 shrink-0 rounded-sm border border-purple-300/80 text-purple-700 accent-purple-700 outline-none focus-visible:ring-2 focus-visible:ring-purple-700 focus-visible:ring-offset-1"
                      />
                      <span className="text-sm text-slate-800">{label}</span>
                    </label>
                  ))}
                </div>
              </div>
              {form.stayAwayOther && (
                <div className="mt-4">
                  <label
                    htmlFor="stayAwayOtherExplain"
                    className="text-sm font-medium text-slate-800"
                  >
                    Explain &quot;Other&quot;
                  </label>
                  <input
                    id="stayAwayOtherExplain"
                    type="text"
                    autoComplete="off"
                    value={form.stayAwayOtherExplain}
                    onChange={(e) =>
                      update("stayAwayOtherExplain", e.target.value)
                    }
                    className={inputClass}
                  />
                </div>
              )}
            </div>

            <fieldset className="space-y-4">
              <legend className="text-sm font-medium text-slate-800">
                12b. How far do you want the person to stay away?
              </legend>
              <div className="space-y-3">
                {(
                  [
                    { value: "hundred" as const, label: "100 yards (300 feet)" },
                    {
                      value: "other" as const,
                      label: "Other (give distance in yards)",
                    },
                  ] as const
                ).map(({ value, label }) => (
                  <label
                    key={value}
                    className="flex cursor-pointer items-start gap-3 py-3 pr-2 pl-0.5 transition"
                  >
                    <input
                      type="radio"
                      name="stayAwayDistance"
                      checked={form.stayAwayDistance === value}
                      onChange={() => {
                        update("stayAwayDistance", value);
                        if (value !== "other") {
                          update("stayAwayDistanceOther", "");
                        }
                      }}
                      className="mt-1 size-4 shrink-0 rounded-sm border border-purple-300/80 text-purple-700 accent-purple-700 outline-none focus-visible:ring-2 focus-visible:ring-purple-700 focus-visible:ring-offset-1"
                    />
                    <span className="text-sm leading-relaxed text-slate-800">
                      {label}
                    </span>
                  </label>
                ))}
              </div>
              {form.stayAwayDistance === "other" && (
                <div>
                  <label
                    htmlFor="stayAwayDistanceOther"
                    className="text-sm font-medium text-slate-800"
                  >
                    Distance in yards
                  </label>
                  <input
                    id="stayAwayDistanceOther"
                    type="text"
                    autoComplete="off"
                    placeholder="e.g. 50"
                    value={form.stayAwayDistanceOther}
                    onChange={(e) =>
                      update("stayAwayDistanceOther", e.target.value)
                    }
                    className={inputClass}
                  />
                </div>
              )}
            </fieldset>

            <fieldset className="space-y-4">
              <legend className="text-sm font-medium text-slate-800">
                12c. Do you and the person in item 2 live together or live close to
                each other?
              </legend>
              <div className="space-y-3">
                {(
                  [
                    { value: "no" as const, label: "No" },
                    { value: "yes" as const, label: "Yes" },
                  ] as const
                ).map(({ value, label }) => (
                  <label
                    key={value}
                    className="flex cursor-pointer items-start gap-3 py-3 pr-2 pl-0.5 transition"
                  >
                    <input
                      type="radio"
                      name="liveTogether"
                      checked={form.liveTogether === value}
                      onChange={() => {
                        setForm((prev) => ({
                          ...prev,
                          liveTogether: value,
                          liveTogetherType: "",
                          liveTogetherOther: "",
                        }));
                      }}
                      className="mt-1 size-4 shrink-0 rounded-sm border border-purple-300/80 text-purple-700 accent-purple-700 outline-none focus-visible:ring-2 focus-visible:ring-purple-700 focus-visible:ring-offset-1"
                    />
                    <span className="text-sm leading-relaxed text-slate-800">
                      {label}
                    </span>
                  </label>
                ))}
              </div>
              {form.liveTogether === "yes" && (
                <div className="space-y-3 pl-0 sm:pl-2">
                  <p className="text-sm font-medium text-slate-800">If yes, check one:</p>
                  <div className="space-y-3">
                    {(
                      [
                        {
                          value: "liveTogether" as const,
                          label: "Live together",
                          hint: "(If you live together, you can ask that the person in item 2 move out in Section 13.)",
                        },
                        {
                          value: "sameBuilding" as const,
                          label:
                            "Live in the same building, but not in the same home",
                        },
                        {
                          value: "sameNeighborhood" as const,
                          label: "Live in the same neighborhood",
                        },
                        { value: "other" as const, label: "Other (please explain)" },
                      ] as const
                    ).map((row) => {
                      const { value, label } = row;
                      const hint = "hint" in row ? row.hint : undefined;
                      return (
                        <label
                          key={value}
                          className="flex cursor-pointer items-start gap-3 py-3 pr-2 pl-0.5 transition"
                        >
                          <input
                            type="radio"
                            name="liveTogetherType"
                            checked={form.liveTogetherType === value}
                            onChange={() => {
                              setForm((prev) => ({
                                ...prev,
                                liveTogetherType: value,
                                liveTogetherOther:
                                  value === "other" ? prev.liveTogetherOther : "",
                              }));
                            }}
                            className="mt-1 size-4 shrink-0 rounded-sm border border-purple-300/80 text-purple-700 accent-purple-700 outline-none focus-visible:ring-2 focus-visible:ring-purple-700 focus-visible:ring-offset-1"
                          />
                          <span className="text-sm leading-relaxed text-slate-800">
                            {label}
                            {hint ? (
                              <span className="mt-1 block text-xs font-normal text-slate-600">
                                {hint}
                              </span>
                            ) : null}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                  {form.liveTogetherType === "other" && (
                    <div>
                      <label
                        htmlFor="liveTogetherOther"
                        className="text-sm font-medium text-slate-800"
                      >
                        Explain
                      </label>
                      <input
                        id="liveTogetherOther"
                        type="text"
                        autoComplete="off"
                        value={form.liveTogetherOther}
                        onChange={(e) =>
                          update("liveTogetherOther", e.target.value)
                        }
                        className={inputClass}
                      />
                    </div>
                  )}
                </div>
              )}
            </fieldset>

            <fieldset className="space-y-4">
              <legend className="text-sm font-medium text-slate-800">
                12d. Do you and the person in item 2 have the same workplace or go
                to the same school?
              </legend>
              <div className="space-y-3">
                {(
                  [
                    { value: "no" as const, label: "No" },
                    { value: "yes" as const, label: "Yes" },
                  ] as const
                ).map(({ value, label }) => (
                  <label
                    key={value}
                    className="flex cursor-pointer items-start gap-3 py-3 pr-2 pl-0.5 transition"
                  >
                    <input
                      type="radio"
                      name="sameWorkplaceSchool"
                      checked={form.sameWorkplaceSchool === value}
                      onChange={() => {
                        setForm((prev) => ({
                          ...prev,
                          sameWorkplaceSchool: value,
                          workTogether: false,
                          workTogetherCompany: "",
                          sameSchool: false,
                          sameSchoolName: "",
                          sameWorkplaceOther: false,
                          sameWorkplaceOtherExplain: "",
                        }));
                      }}
                      className="mt-1 size-4 shrink-0 rounded-sm border border-purple-300/80 text-purple-700 accent-purple-700 outline-none focus-visible:ring-2 focus-visible:ring-purple-700 focus-visible:ring-offset-1"
                    />
                    <span className="text-sm leading-relaxed text-slate-800">
                      {label}
                    </span>
                  </label>
                ))}
              </div>
              {form.sameWorkplaceSchool === "yes" && (
                <div className="space-y-4 pl-0 sm:pl-2">
                  <p className="text-sm font-medium text-slate-800">
                    If yes, check all that apply:
                  </p>
                  <div className="space-y-4">
                    <div className="rounded-xl border border-purple-100/80 bg-white px-4 py-3">
                      <label className="flex cursor-pointer items-start gap-3 py-1.5 pr-1">
                        <input
                          type="checkbox"
                          checked={form.workTogether}
                          onChange={(e) =>
                            setForm((prev) => ({
                              ...prev,
                              workTogether: e.target.checked,
                              workTogetherCompany: e.target.checked
                                ? prev.workTogetherCompany
                                : "",
                            }))
                          }
                          className="mt-1 size-4 shrink-0 rounded-sm border border-purple-300/80 text-purple-700 accent-purple-700 outline-none focus-visible:ring-2 focus-visible:ring-purple-700 focus-visible:ring-offset-1"
                        />
                        <span className="text-sm text-slate-800">
                          Work together at (name of company):
                        </span>
                      </label>
                      {form.workTogether && (
                        <input
                          type="text"
                          autoComplete="off"
                          placeholder="Name of company"
                          value={form.workTogetherCompany}
                          onChange={(e) =>
                            update("workTogetherCompany", e.target.value)
                          }
                          className={`${inputClass} mt-2`}
                        />
                      )}
                    </div>
                    <div className="rounded-xl border border-purple-100/80 bg-white px-4 py-3">
                      <label className="flex cursor-pointer items-start gap-3 py-1.5 pr-1">
                        <input
                          type="checkbox"
                          checked={form.sameSchool}
                          onChange={(e) =>
                            setForm((prev) => ({
                              ...prev,
                              sameSchool: e.target.checked,
                              sameSchoolName: e.target.checked
                                ? prev.sameSchoolName
                                : "",
                            }))
                          }
                          className="mt-1 size-4 shrink-0 rounded-sm border border-purple-300/80 text-purple-700 accent-purple-700 outline-none focus-visible:ring-2 focus-visible:ring-purple-700 focus-visible:ring-offset-1"
                        />
                        <span className="text-sm text-slate-800">
                          Go to the same school (name of school):
                        </span>
                      </label>
                      {form.sameSchool && (
                        <input
                          type="text"
                          autoComplete="off"
                          placeholder="Name of school"
                          value={form.sameSchoolName}
                          onChange={(e) =>
                            update("sameSchoolName", e.target.value)
                          }
                          className={`${inputClass} mt-2`}
                        />
                      )}
                    </div>
                    <div className="rounded-xl border border-purple-100/80 bg-white px-4 py-3">
                      <label className="flex cursor-pointer items-start gap-3 py-1.5 pr-1">
                        <input
                          type="checkbox"
                          checked={form.sameWorkplaceOther}
                          onChange={(e) =>
                            setForm((prev) => ({
                              ...prev,
                              sameWorkplaceOther: e.target.checked,
                              sameWorkplaceOtherExplain: e.target.checked
                                ? prev.sameWorkplaceOtherExplain
                                : "",
                            }))
                          }
                          className="mt-1 size-4 shrink-0 rounded-sm border border-purple-300/80 text-purple-700 accent-purple-700 outline-none focus-visible:ring-2 focus-visible:ring-purple-700 focus-visible:ring-offset-1"
                        />
                        <span className="text-sm text-slate-800">
                          Other (please explain):
                        </span>
                      </label>
                      {form.sameWorkplaceOther && (
                        <input
                          type="text"
                          autoComplete="off"
                          placeholder="Please explain"
                          value={form.sameWorkplaceOtherExplain}
                          onChange={(e) =>
                            update("sameWorkplaceOtherExplain", e.target.value)
                          }
                          className={`${inputClass} mt-2`}
                        />
                      )}
                    </div>
                  </div>
                </div>
              )}
            </fieldset>
          </div>
        )}
      </section>
    </div>
  );
}
