"use client";

import { useEffect, useState } from "react";

import { useFormStore } from "@/store/useFormStore";

type Step7Props = {
  inputClass: string;
  textareaClass: string;
};

const MAX_ANIMALS = 4;

const emptyAnimals = () => [
  { name: "", type: "", breed: "", color: "" },
];

const emptySoleReasons = () => ({
  respondentAbuses: false,
  iCareForThem: false,
  iPurchasedThem: false,
  other: false,
  otherDescription: "",
});

export default function Step11_PropertyAnimals({
  inputClass,
  textareaClass,
}: Step7Props) {
  const pa = useFormStore((s) => s.propertyAnimals);
  const setPropertyAnimals = useFormStore((s) => s.setPropertyAnimals);
  const reasons = pa.animalSolePossessionReasons;
  const [visibleAnimalRows, setVisibleAnimalRows] = useState(1);

  useEffect(() => {
    if (!pa.wantsAnimalProtection) {
      setVisibleAnimalRows(1);
      return;
    }
    const n = pa.animals.length;
    if (n === 0) {
      return;
    }
    setVisibleAnimalRows((v) => Math.max(v, Math.min(MAX_ANIMALS, n)));
  }, [pa.animals.length, pa.wantsAnimalProtection]);

  const resetAnimalProtection = () => {
    setPropertyAnimals({
      wantsAnimalProtection: false,
      animals: emptyAnimals(),
      animalStayAwayDistance: "",
      animalStayAwayDistanceOther: "",
      animalNoHarm: false,
      animalSolePossession: false,
      animalSolePossessionReasons: emptySoleReasons(),
    });
  };

  const resetPropertyControl = () => {
    setPropertyAnimals({
      wantsPropertyControl: false,
      propertyDescription: "",
      propertyWhyControl: "",
    });
  };

  const stayAwayActive =
    pa.animalStayAwayDistance === "100" || pa.animalStayAwayDistance === "other";

  return (
    <div className="space-y-10">
      <section className="space-y-4">
        <h2 className="text-sm font-semibold text-slate-900">
          Section 16. Protect animals
        </h2>
        <label className="flex cursor-pointer items-start gap-3 py-3 pr-2 pl-0.5 transition">
          <input
            type="checkbox"
            checked={pa.wantsAnimalProtection}
            onChange={(e) => {
              if (e.target.checked) {
                setPropertyAnimals({ wantsAnimalProtection: true });
              } else {
                resetAnimalProtection();
              }
            }}
            className="mt-1 size-4 shrink-0 rounded-sm border border-purple-300/80 text-purple-700 accent-purple-700 outline-none focus-visible:ring-2 focus-visible:ring-purple-700 focus-visible:ring-offset-1"
          />
          <span className="text-sm font-medium text-slate-800">Protect Animals</span>
        </label>

        {pa.wantsAnimalProtection && (
          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-medium text-slate-800">Animals (up to four)</h3>
              <div className="mt-3 space-y-4">
                {pa.animals
                  .slice(0, Math.min(MAX_ANIMALS, Math.max(1, visibleAnimalRows)))
                  .map((animal, idx) => (
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
                          onChange={(e) => {
                            const next = [...pa.animals];
                            next[idx] = { ...next[idx], name: e.target.value };
                            setPropertyAnimals({ animals: next });
                          }}
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
                          onChange={(e) => {
                            const next = [...pa.animals];
                            next[idx] = { ...next[idx], type: e.target.value };
                            setPropertyAnimals({ animals: next });
                          }}
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
                          onChange={(e) => {
                            const next = [...pa.animals];
                            next[idx] = { ...next[idx], breed: e.target.value };
                            setPropertyAnimals({ animals: next });
                          }}
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
                          onChange={(e) => {
                            const next = [...pa.animals];
                            next[idx] = { ...next[idx], color: e.target.value };
                            setPropertyAnimals({ animals: next });
                          }}
                          className={inputClass}
                        />
                      </div>
                    </div>
                  </div>
                ))}
                {visibleAnimalRows < MAX_ANIMALS && (
                  <button
                    type="button"
                    onClick={() => {
                      const countAfter = Math.min(
                        MAX_ANIMALS,
                        visibleAnimalRows + 1,
                      );
                      if (pa.animals.length < countAfter) {
                        setPropertyAnimals({
                          animals: [
                            ...useFormStore.getState().propertyAnimals.animals,
                            {
                              name: "",
                              type: "",
                              breed: "",
                              color: "",
                            },
                          ],
                        });
                      }
                      setVisibleAnimalRows(countAfter);
                    }}
                    className="inline-flex min-h-11 w-full max-w-sm items-center justify-center rounded-xl border border-purple-200 bg-white px-5 py-2.5 text-sm font-medium text-purple-800 shadow-sm transition hover:bg-purple-50"
                  >
                    Add Another Animal
                  </button>
                )}
              </div>
            </div>

            <fieldset className="space-y-3 rounded-xl border border-purple-100/80 bg-purple-50/40 p-4">
              <legend className="text-sm font-medium text-slate-800">
                Orders regarding animals
              </legend>
              <label className="flex cursor-pointer items-start gap-3 py-2.5 pr-2 pl-0.5 transition">
                <input
                  type="checkbox"
                  checked={stayAwayActive}
                  onChange={(e) => {
                    const on = e.target.checked;
                    if (!on) {
                      setPropertyAnimals({
                        animalStayAwayDistance: "",
                        animalStayAwayDistanceOther: "",
                      });
                    } else {
                      setPropertyAnimals({ animalStayAwayDistance: "100" });
                    }
                  }}
                  className="mt-0.5 size-4 shrink-0 rounded-sm border border-purple-300/80 text-purple-700 accent-purple-700 outline-none focus-visible:ring-2 focus-visible:ring-purple-700 focus-visible:ring-offset-1"
                />
                <span className="text-sm text-slate-800">
                  Stay away from animals by at least
                </span>
              </label>
              {stayAwayActive && (
                <div className="ml-7 space-y-3 border-l-2 border-purple-200/80 pl-4">
                  <div className="flex flex-col gap-2">
                    <label className="flex cursor-pointer items-center gap-2 py-1 text-sm text-slate-800">
                      <input
                        type="radio"
                        name="animalStayAwayDistance"
                        checked={pa.animalStayAwayDistance === "100"}
                        onChange={() =>
                          setPropertyAnimals({
                            animalStayAwayDistance: "100",
                            animalStayAwayDistanceOther: "",
                          })
                        }
                        className="size-4 shrink-0 rounded-sm border border-purple-300/80 text-purple-700 accent-purple-700 outline-none focus-visible:ring-2 focus-visible:ring-purple-700 focus-visible:ring-offset-1"
                      />
                      100 yards (300 feet)
                    </label>
                    <label className="flex cursor-pointer items-center gap-2 py-1 text-sm text-slate-800">
                      <input
                        type="radio"
                        name="animalStayAwayDistance"
                        checked={pa.animalStayAwayDistance === "other"}
                        onChange={() =>
                          setPropertyAnimals({
                            animalStayAwayDistance: "other",
                          })
                        }
                        className="size-4 shrink-0 rounded-sm border border-purple-300/80 text-purple-700 accent-purple-700 outline-none focus-visible:ring-2 focus-visible:ring-purple-700 focus-visible:ring-offset-1"
                      />
                      Other (yards)
                    </label>
                  </div>
                  {pa.animalStayAwayDistance === "other" && (
                    <div>
                      <label
                        htmlFor="animalStayAwayDistanceOther"
                        className="text-sm font-medium text-slate-800"
                      >
                        Number of yards
                      </label>
                      <input
                        id="animalStayAwayDistanceOther"
                        type="text"
                        inputMode="numeric"
                        autoComplete="off"
                        value={pa.animalStayAwayDistanceOther}
                        onChange={(e) =>
                          setPropertyAnimals({
                            animalStayAwayDistanceOther: e.target.value,
                          })
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
                  checked={pa.animalNoHarm}
                  onChange={(e) =>
                    setPropertyAnimals({ animalNoHarm: e.target.checked })
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
                  checked={pa.animalSolePossession}
                  onChange={(e) => {
                    const on = e.target.checked;
                    if (!on) {
                      setPropertyAnimals({
                        animalSolePossession: false,
                        animalSolePossessionReasons: emptySoleReasons(),
                      });
                    } else {
                      setPropertyAnimals({ animalSolePossession: true });
                    }
                  }}
                  className="mt-0.5 size-4 shrink-0 rounded-sm border border-purple-300/80 text-purple-700 accent-purple-700 outline-none focus-visible:ring-2 focus-visible:ring-purple-700 focus-visible:ring-offset-1"
                />
                <span className="text-sm text-slate-800">
                  Give me sole possession, care, and control of the animals
                </span>
              </label>
              {pa.animalSolePossession && (
                <div className="ml-7 space-y-2 border-l-2 border-purple-200/80 pl-4">
                  {(
                    [
                      {
                        key: "respondentAbuses" as const,
                        label: "Person in item 2 abuses the animals",
                      },
                      {
                        key: "iCareForThem" as const,
                        label: "I take care of these animals",
                      },
                      {
                        key: "iPurchasedThem" as const,
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
                        checked={Boolean(reasons[key])}
                        onChange={(e) =>
                          setPropertyAnimals({
                            animalSolePossessionReasons: {
                              ...reasons,
                              [key]: e.target.checked,
                            },
                          })
                        }
                        className="mt-0.5 size-4 shrink-0 rounded-sm border border-purple-300/80 text-purple-700 accent-purple-700 outline-none focus-visible:ring-2 focus-visible:ring-purple-700 focus-visible:ring-offset-1"
                      />
                      <span className="text-sm text-slate-800">{label}</span>
                    </label>
                  ))}
                  <label className="flex cursor-pointer items-start gap-3 py-1.5 pr-1">
                    <input
                      type="checkbox"
                      checked={reasons.other}
                      onChange={(e) => {
                        const on = e.target.checked;
                        setPropertyAnimals({
                          animalSolePossessionReasons: {
                            ...reasons,
                            other: on,
                            ...(!on ? { otherDescription: "" } : {}),
                          },
                        });
                      }}
                      className="mt-0.5 size-4 shrink-0 rounded-sm border border-purple-300/80 text-purple-700 accent-purple-700 outline-none focus-visible:ring-2 focus-visible:ring-purple-700 focus-visible:ring-offset-1"
                    />
                    <span className="text-sm text-slate-800">Other</span>
                  </label>
                  {reasons.other && (
                    <textarea
                      autoComplete="off"
                      value={reasons.otherDescription}
                      onChange={(e) =>
                        setPropertyAnimals({
                          animalSolePossessionReasons: {
                            ...reasons,
                            otherDescription: e.target.value,
                          },
                        })
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
            checked={pa.wantsPropertyControl}
            onChange={(e) => {
              if (e.target.checked) {
                setPropertyAnimals({ wantsPropertyControl: true });
              } else {
                resetPropertyControl();
              }
            }}
            className="mt-1 size-4 shrink-0 rounded-sm border border-purple-300/80 text-purple-700 accent-purple-700 outline-none focus-visible:ring-2 focus-visible:ring-purple-700 focus-visible:ring-offset-1"
          />
          <span className="text-sm font-medium text-slate-800">Control of Property</span>
        </label>
        {pa.wantsPropertyControl && (
          <div className="space-y-4">
            <div>
              <label
                htmlFor="propertyDescription"
                className="text-sm font-medium text-slate-800"
              >
                17a. Describe the property
              </label>
              <textarea
                id="propertyDescription"
                autoComplete="off"
                value={pa.propertyDescription}
                onChange={(e) =>
                  setPropertyAnimals({ propertyDescription: e.target.value })
                }
                className={textareaClass}
              />
            </div>
            <div>
              <label
                htmlFor="propertyWhyControl"
                className="text-sm font-medium text-slate-800"
              >
                17b. Explain why you want control
              </label>
              <textarea
                id="propertyWhyControl"
                autoComplete="off"
                value={pa.propertyWhyControl}
                onChange={(e) =>
                  setPropertyAnimals({ propertyWhyControl: e.target.value })
                }
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
            checked={pa.wantsInsuranceOrder}
            onChange={(e) =>
              setPropertyAnimals({ wantsInsuranceOrder: e.target.checked })
            }
            className="mt-1 size-4 shrink-0 rounded-sm border border-purple-300/80 text-purple-700 accent-purple-700 outline-none focus-visible:ring-2 focus-visible:ring-purple-700 focus-visible:ring-offset-1"
          />
          <div className="min-w-0">
            <span className="text-sm font-medium text-slate-800">
              Health and other insurance
            </span>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">
              I ask the judge to order the person in Item 2 not to cash, borrow
              against, cancel, transfer, dispose of, or change the beneficiaries
              of any insurance or other coverage held for the benefit of the
              parties, or their child(ren), for whom support may be ordered.
            </p>
          </div>
        </label>
      </section>

      <section className="space-y-4 border-t border-purple-100/90 pt-8">
        <h2 className="text-sm font-semibold text-slate-900">
          Section 19. Record communications
        </h2>
        <label className="flex cursor-pointer items-start gap-3 py-3 pr-2 pl-0.5 transition">
          <input
            type="checkbox"
            checked={pa.wantsRecordCommunications}
            onChange={(e) =>
              setPropertyAnimals({
                wantsRecordCommunications: e.target.checked,
              })
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
