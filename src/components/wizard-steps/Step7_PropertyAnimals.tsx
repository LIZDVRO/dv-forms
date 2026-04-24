"use client";

import type { Dispatch, SetStateAction } from "react";

import type { Dv100PdfFormData } from "@/lib/dv100-pdf";

type FormData = Dv100PdfFormData;

type Step7Props = {
  form: FormData;
  setForm: Dispatch<SetStateAction<FormData>>;
  update: <K extends keyof FormData>(key: K, value: FormData[K]) => void;
  inputClass: string;
  textareaClass: string;
  resetProtectAnimals: () => void;
  resetControlProperty: () => void;
};

export default function Step7_PropertyAnimals({
  form,
  setForm,
  update,
  inputClass,
  textareaClass,
  resetProtectAnimals,
  resetControlProperty,
}: Step7Props) {
  return (
    <div className="space-y-10">
      <section className="space-y-4">
        <h2 className="text-sm font-semibold text-slate-900">
          Section 16. Protect animals
        </h2>
        <label className="flex cursor-pointer items-start gap-3 py-3 pr-2 pl-0.5 transition">
          <input
            type="checkbox"
            checked={form.protectAnimals}
            onChange={(e) => {
              if (e.target.checked) {
                update("protectAnimals", true);
              } else {
                resetProtectAnimals();
              }
            }}
            className="mt-1 size-4 shrink-0 rounded-sm border border-purple-300/80 text-purple-700 accent-purple-700 outline-none focus-visible:ring-2 focus-visible:ring-purple-700 focus-visible:ring-offset-1"
          />
          <span className="text-sm font-medium text-slate-800">Protect Animals</span>
        </label>

        {form.protectAnimals && (
          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-medium text-slate-800">Animals (up to four)</h3>
              <div className="mt-3 space-y-4">
                {form.protectedAnimals.map((animal, idx) => (
                  <div
                    key={`animal-${idx}`}
                    className="rounded-xl border border-purple-100/80 bg-white p-4 shadow-sm"
                  >
                    <p className="text-xs font-semibold uppercase tracking-wide text-purple-900/80">
                      Animal {idx + 1}
                    </p>
                    <div className="mt-3 grid gap-3 sm:grid-cols-2">
                      <div>
                        <label
                          htmlFor={`animal-name-${idx}`}
                          className="text-sm font-medium text-slate-800"
                        >
                          Name or other way to identify
                        </label>
                        <input
                          id={`animal-name-${idx}`}
                          type="text"
                          autoComplete="off"
                          value={animal.name}
                          onChange={(e) =>
                            setForm((prev) => {
                              const next = [...prev.protectedAnimals];
                              next[idx] = { ...next[idx], name: e.target.value };
                              return { ...prev, protectedAnimals: next };
                            })
                          }
                          className={inputClass}
                        />
                      </div>
                      <div>
                        <label
                          htmlFor={`animal-type-${idx}`}
                          className="text-sm font-medium text-slate-800"
                        >
                          Type
                        </label>
                        <input
                          id={`animal-type-${idx}`}
                          type="text"
                          autoComplete="off"
                          value={animal.type}
                          onChange={(e) =>
                            setForm((prev) => {
                              const next = [...prev.protectedAnimals];
                              next[idx] = { ...next[idx], type: e.target.value };
                              return { ...prev, protectedAnimals: next };
                            })
                          }
                          className={inputClass}
                        />
                      </div>
                      <div>
                        <label
                          htmlFor={`animal-breed-${idx}`}
                          className="text-sm font-medium text-slate-800"
                        >
                          Breed (if known)
                        </label>
                        <input
                          id={`animal-breed-${idx}`}
                          type="text"
                          autoComplete="off"
                          value={animal.breed}
                          onChange={(e) =>
                            setForm((prev) => {
                              const next = [...prev.protectedAnimals];
                              next[idx] = { ...next[idx], breed: e.target.value };
                              return { ...prev, protectedAnimals: next };
                            })
                          }
                          className={inputClass}
                        />
                      </div>
                      <div>
                        <label
                          htmlFor={`animal-color-${idx}`}
                          className="text-sm font-medium text-slate-800"
                        >
                          Color
                        </label>
                        <input
                          id={`animal-color-${idx}`}
                          type="text"
                          autoComplete="off"
                          value={animal.color}
                          onChange={(e) =>
                            setForm((prev) => {
                              const next = [...prev.protectedAnimals];
                              next[idx] = { ...next[idx], color: e.target.value };
                              return { ...prev, protectedAnimals: next };
                            })
                          }
                          className={inputClass}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <fieldset className="space-y-3 rounded-xl border border-purple-100/80 bg-purple-50/40 p-4">
              <legend className="text-sm font-medium text-slate-800">
                Orders regarding animals
              </legend>
              <label className="flex cursor-pointer items-start gap-3 py-2.5 pr-2 pl-0.5 transition">
                <input
                  type="checkbox"
                  checked={form.protectAnimalsStayAway}
                  onChange={(e) => {
                    const on = e.target.checked;
                    setForm((prev) => ({
                      ...prev,
                      protectAnimalsStayAway: on,
                      ...(!on
                        ? {
                            protectAnimalsStayAwayDistance: "",
                            protectAnimalsStayAwayOtherYards: "",
                          }
                        : {}),
                    }));
                  }}
                  className="mt-0.5 size-4 shrink-0 rounded-sm border border-purple-300/80 text-purple-700 accent-purple-700 outline-none focus-visible:ring-2 focus-visible:ring-purple-700 focus-visible:ring-offset-1"
                />
                <span className="text-sm text-slate-800">
                  Stay away from animals by at least
                </span>
              </label>
              {form.protectAnimalsStayAway && (
                <div className="ml-7 space-y-3 border-l-2 border-purple-200/80 pl-4">
                  <div className="flex flex-col gap-2">
                    <label className="flex cursor-pointer items-center gap-2 py-1 text-sm text-slate-800">
                      <input
                        type="radio"
                        name="protectAnimalsStayAwayDistance"
                        checked={
                          form.protectAnimalsStayAwayDistance === "hundred"
                        }
                        onChange={() =>
                          setForm((prev) => ({
                            ...prev,
                            protectAnimalsStayAwayDistance: "hundred",
                            protectAnimalsStayAwayOtherYards: "",
                          }))
                        }
                        className="size-4 shrink-0 rounded-sm border border-purple-300/80 text-purple-700 accent-purple-700 outline-none focus-visible:ring-2 focus-visible:ring-purple-700 focus-visible:ring-offset-1"
                      />
                      100 yards (300 feet)
                    </label>
                    <label className="flex cursor-pointer items-center gap-2 py-1 text-sm text-slate-800">
                      <input
                        type="radio"
                        name="protectAnimalsStayAwayDistance"
                        checked={form.protectAnimalsStayAwayDistance === "other"}
                        onChange={() =>
                          setForm((prev) => ({
                            ...prev,
                            protectAnimalsStayAwayDistance: "other",
                          }))
                        }
                        className="size-4 shrink-0 rounded-sm border border-purple-300/80 text-purple-700 accent-purple-700 outline-none focus-visible:ring-2 focus-visible:ring-purple-700 focus-visible:ring-offset-1"
                      />
                      Other (yards)
                    </label>
                  </div>
                  {form.protectAnimalsStayAwayDistance === "other" && (
                    <div>
                      <label
                        htmlFor="protectAnimalsStayAwayOtherYards"
                        className="text-sm font-medium text-slate-800"
                      >
                        Number of yards
                      </label>
                      <input
                        id="protectAnimalsStayAwayOtherYards"
                        type="text"
                        inputMode="numeric"
                        autoComplete="off"
                        value={form.protectAnimalsStayAwayOtherYards}
                        onChange={(e) =>
                          update(
                            "protectAnimalsStayAwayOtherYards",
                            e.target.value,
                          )
                        }
                        className={inputClass}
                      />
                    </div>
                  )}
                </div>
              )}

              <label className="flex cursor-pointer items-start gap-3 py-2.5 pr-2 pl-0.5 transition">
                <input
                  type="checkbox"
                  checked={form.protectAnimalsNotTake}
                  onChange={(e) =>
                    update("protectAnimalsNotTake", e.target.checked)
                  }
                  className="mt-0.5 size-4 shrink-0 rounded-sm border border-purple-300/80 text-purple-700 accent-purple-700 outline-none focus-visible:ring-2 focus-visible:ring-purple-700 focus-visible:ring-offset-1"
                />
                <span className="text-sm text-slate-800">
                  Not take, sell, hide, molest, attack, strike, threaten, harm,
                  or otherwise get rid of the animals; or get anyone else to do
                  so
                </span>
              </label>

              <label className="flex cursor-pointer items-start gap-3 py-2.5 pr-2 pl-0.5 transition">
                <input
                  type="checkbox"
                  checked={form.protectAnimalsSolePossession}
                  onChange={(e) => {
                    const on = e.target.checked;
                    setForm((prev) => ({
                      ...prev,
                      protectAnimalsSolePossession: on,
                      ...(!on
                        ? {
                            protectAnimalsSoleReasonAbuse: false,
                            protectAnimalsSoleReasonCare: false,
                            protectAnimalsSoleReasonPurchased: false,
                            protectAnimalsSoleReasonOther: false,
                            protectAnimalsSoleReasonOtherExplain: "",
                          }
                        : {}),
                    }));
                  }}
                  className="mt-0.5 size-4 shrink-0 rounded-sm border border-purple-300/80 text-purple-700 accent-purple-700 outline-none focus-visible:ring-2 focus-visible:ring-purple-700 focus-visible:ring-offset-1"
                />
                <span className="text-sm text-slate-800">
                  Give me sole possession, care, and control of the animals
                </span>
              </label>
              {form.protectAnimalsSolePossession && (
                <div className="ml-7 space-y-2 border-l-2 border-purple-200/80 pl-4">
                  {(
                    [
                      {
                        key: "protectAnimalsSoleReasonAbuse" as const,
                        label: "Person in item 2 abuses the animals",
                      },
                      {
                        key: "protectAnimalsSoleReasonCare" as const,
                        label: "I take care of these animals",
                      },
                      {
                        key: "protectAnimalsSoleReasonPurchased" as const,
                        label: "I purchased these animals",
                      },
                    ] as const
                  ).map(({ key, label }) => (
                    <label
                      key={key}
                      className="flex cursor-pointer items-start gap-3 py-1.5 pr-1"
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
                  <label className="flex cursor-pointer items-start gap-3 py-1.5 pr-1">
                    <input
                      type="checkbox"
                      checked={form.protectAnimalsSoleReasonOther}
                      onChange={(e) => {
                        const on = e.target.checked;
                        setForm((prev) => ({
                          ...prev,
                          protectAnimalsSoleReasonOther: on,
                          ...(!on
                            ? { protectAnimalsSoleReasonOtherExplain: "" }
                            : {}),
                        }));
                      }}
                      className="mt-0.5 size-4 shrink-0 rounded-sm border border-purple-300/80 text-purple-700 accent-purple-700 outline-none focus-visible:ring-2 focus-visible:ring-purple-700 focus-visible:ring-offset-1"
                    />
                    <span className="text-sm text-slate-800">Other</span>
                  </label>
                  {form.protectAnimalsSoleReasonOther && (
                    <textarea
                      autoComplete="off"
                      value={form.protectAnimalsSoleReasonOtherExplain}
                      onChange={(e) =>
                        update(
                          "protectAnimalsSoleReasonOtherExplain",
                          e.target.value,
                        )
                      }
                      className={textareaClass}
                    />
                  )}
                </div>
              )}
            </fieldset>
          </div>
        )}
      </section>

      <section className="space-y-4 border-t border-purple-100/90 pt-8">
        <h2 className="text-sm font-semibold text-slate-900">
          Section 17. Control of property
        </h2>
        <label className="flex cursor-pointer items-start gap-3 py-3 pr-2 pl-0.5 transition">
          <input
            type="checkbox"
            checked={form.controlProperty}
            onChange={(e) => {
              if (e.target.checked) {
                update("controlProperty", true);
              } else {
                resetControlProperty();
              }
            }}
            className="mt-1 size-4 shrink-0 rounded-sm border border-purple-300/80 text-purple-700 accent-purple-700 outline-none focus-visible:ring-2 focus-visible:ring-purple-700 focus-visible:ring-offset-1"
          />
          <span className="text-sm font-medium text-slate-800">Control of Property</span>
        </label>
        {form.controlProperty && (
          <div className="space-y-4">
            <div>
              <label
                htmlFor="controlPropertyDescribe"
                className="text-sm font-medium text-slate-800"
              >
                17a. Describe the property
              </label>
              <textarea
                id="controlPropertyDescribe"
                autoComplete="off"
                value={form.controlPropertyDescribe}
                onChange={(e) =>
                  update("controlPropertyDescribe", e.target.value)
                }
                className={textareaClass}
              />
            </div>
            <div>
              <label
                htmlFor="controlPropertyWhy"
                className="text-sm font-medium text-slate-800"
              >
                17b. Explain why you want control
              </label>
              <textarea
                id="controlPropertyWhy"
                autoComplete="off"
                value={form.controlPropertyWhy}
                onChange={(e) => update("controlPropertyWhy", e.target.value)}
                className={textareaClass}
              />
            </div>
          </div>
        )}
      </section>

      <section className="space-y-4 border-t border-purple-100/90 pt-8">
        <h2 className="text-sm font-semibold text-slate-900">
          Section 18. Health and other insurance
        </h2>
        <label className="flex cursor-pointer items-start gap-3 py-3 pr-2 pl-0.5 transition">
          <input
            type="checkbox"
            checked={form.healthOtherInsurance}
            onChange={(e) =>
              update("healthOtherInsurance", e.target.checked)
            }
            className="mt-1 size-4 shrink-0 rounded-sm border border-purple-300/80 text-purple-700 accent-purple-700 outline-none focus-visible:ring-2 focus-visible:ring-purple-700 focus-visible:ring-offset-1"
          />
          <span className="text-sm font-medium text-slate-800">
            Health and Other Insurance
          </span>
        </label>
      </section>

      <section className="space-y-4 border-t border-purple-100/90 pt-8">
        <h2 className="text-sm font-semibold text-slate-900">
          Section 19. Record communications
        </h2>
        <label className="flex cursor-pointer items-start gap-3 py-3 pr-2 pl-0.5 transition">
          <input
            type="checkbox"
            checked={form.recordCommunications}
            onChange={(e) =>
              update("recordCommunications", e.target.checked)
            }
            className="mt-1 size-4 shrink-0 rounded-sm border border-purple-300/80 text-purple-700 accent-purple-700 outline-none focus-visible:ring-2 focus-visible:ring-purple-700 focus-visible:ring-offset-1"
          />
          <span className="text-sm font-medium text-slate-800">
            Record Communications
          </span>
        </label>
      </section>
    </div>
  );
}
