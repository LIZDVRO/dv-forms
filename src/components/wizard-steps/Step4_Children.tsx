"use client";

import type { ChildInfo } from "@/store/useFormStore";
import { useFormStore } from "@/store/useFormStore";

import { GENDER_OPTIONS, invoiceFieldInputClassName } from "./wizardShared";

type Step4Props = {
  inputClass: string;
};

const MAX_CHILDREN = 10;

function blankChildRow(): ChildInfo {
  return {
    fullName: "",
    dateOfBirth: "",
    age: "",
    gender: "",
    race: "",
    livesWithWhom: "",
    livesWithPetitioner: "",
  };
}

const REL_OPTS = [
  { value: "" as const, label: "Select…" },
  { value: "parent" as const, label: "Parent" },
  { value: "legalGuardian" as const, label: "Legal Guardian" },
  { value: "other" as const, label: "Other" },
] as const;

export default function Step4_Children({ inputClass }: Step4Props) {
  const relationship = useFormStore((s) => s.relationship);
  const setRelationship = useFormStore((s) => s.setRelationship);
  const childrenState = useFormStore((s) => s.children);
  const setChildren = useFormStore((s) => s.setChildren);
  const updateChild = useFormStore((s) => s.updateChild);
  const updateResidenceRow = useFormStore((s) => s.updateResidenceRow);

  const hasMinorChildrenWithRespondent = relationship.childrenTogether;

  const ensureAtLeastOneChildRow = () => {
    const list = useFormStore.getState().children.children;
    if (list.length === 0) {
      setChildren({ children: [blankChildRow()] });
    }
  };

  const addChildRow = () => {
    const list = useFormStore.getState().children.children;
    if (list.length >= MAX_CHILDREN) return;
    setChildren({ children: [...list, blankChildRow()] });
  };

  const removeChildRow = (index: number) => {
    const list = useFormStore.getState().children.children;
    if (list.length <= 1) return;
    setChildren({
      children: list.filter((_, i) => i !== index),
    });
  };

  return (
    <div className="space-y-10">
      <fieldset className="space-y-4">
        <legend className="text-sm font-medium text-slate-800">
          Do you have children under 18 with the person in Step 3?
        </legend>
        <div className="space-y-3">
          {(
            [
              { v: true as const, lab: "Yes" },
              { v: false as const, lab: "No" },
            ] as const
          ).map(({ v, lab }) => (
            <label
              key={String(v)}
              className="flex cursor-pointer items-start gap-3 py-3 pr-2 pl-0.5 transition"
            >
              <input
                type="radio"
                name="minorChildrenWithRespondent"
                checked={hasMinorChildrenWithRespondent === v}
                onChange={() => {
                  setRelationship({ childrenTogether: v });
                  if (v) {
                    ensureAtLeastOneChildRow();
                  }
                }}
                className="mt-1 size-4 shrink-0 rounded-sm border border-purple-300/80 text-purple-700 accent-purple-700 outline-none focus-visible:ring-2 focus-visible:ring-purple-700 focus-visible:ring-offset-1"
              />
              <span className="text-sm leading-relaxed text-slate-800">{lab}</span>
            </label>
          ))}
        </div>
      </fieldset>

      {hasMinorChildrenWithRespondent && (
        <>
          <div className="space-y-6">
            <p className="text-sm font-medium text-slate-800">Children</p>
            {childrenState.children.map((child, index) => (
              <div
                key={index}
                className="space-y-4 rounded-xl border border-purple-100 bg-purple-50/30 px-4 py-4"
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-medium text-slate-800">Child {index + 1}</p>
                  {childrenState.children.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeChildRow(index)}
                      className="text-sm font-medium text-red-700 underline-offset-2 hover:underline"
                    >
                      Remove
                    </button>
                  )}
                </div>
                <div>
                  <label
                    htmlFor={`child-name-${index}`}
                    className="text-sm font-medium text-slate-800"
                  >
                    Name
                  </label>
                  <input
                    id={`child-name-${index}`}
                    type="text"
                    autoComplete="name"
                    value={child.fullName}
                    onChange={(e) =>
                      updateChild(index, { fullName: e.target.value })
                    }
                    className={invoiceFieldInputClassName}
                  />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label
                      htmlFor={`child-dob-${index}`}
                      className="text-sm font-medium text-slate-800"
                    >
                      Date of birth
                    </label>
                    <input
                      id={`child-dob-${index}`}
                      type="text"
                      placeholder="MM / DD / YYYY"
                      value={child.dateOfBirth}
                      onChange={(e) =>
                        updateChild(index, { dateOfBirth: e.target.value })
                      }
                      className={invoiceFieldInputClassName}
                    />
                  </div>
                  <div>
                    <label
                      htmlFor={`child-age-${index}`}
                      className="text-sm font-medium text-slate-800"
                    >
                      Age
                    </label>
                    <input
                      id={`child-age-${index}`}
                      type="text"
                      inputMode="numeric"
                      value={child.age}
                      onChange={(e) =>
                        updateChild(index, { age: e.target.value })
                      }
                      className={invoiceFieldInputClassName}
                    />
                  </div>
                </div>
                <fieldset className="space-y-2">
                  <legend className="text-sm font-medium text-slate-800">Gender</legend>
                  <div className="flex flex-wrap gap-2">
                    {GENDER_OPTIONS.map((option) => (
                      <label
                        key={`${index}-${option}`}
                        className="flex cursor-pointer items-center gap-2 rounded-lg border border-purple-100 bg-white px-3 py-2 text-sm"
                      >
                        <input
                          type="radio"
                          name={`child-gender-${index}`}
                          checked={child.gender === option}
                          onChange={() => updateChild(index, { gender: option })}
                          className="size-4 accent-purple-700"
                        />
                        {option}
                      </label>
                    ))}
                  </div>
                </fieldset>
                <div>
                  <label
                    htmlFor={`child-race-${index}`}
                    className="text-sm font-medium text-slate-800"
                  >
                    Race
                  </label>
                  <input
                    id={`child-race-${index}`}
                    type="text"
                    value={child.race}
                    onChange={(e) =>
                      updateChild(index, { race: e.target.value })
                    }
                    className={invoiceFieldInputClassName}
                  />
                </div>
                <div>
                  <label
                    htmlFor={`child-lives-${index}`}
                    className="text-sm font-medium text-slate-800"
                  >
                    Who they live with
                  </label>
                  <input
                    id={`child-lives-${index}`}
                    type="text"
                    placeholder="e.g. With me, split time, other caregiver"
                    value={child.livesWithWhom}
                    onChange={(e) =>
                      updateChild(index, { livesWithWhom: e.target.value })
                    }
                    className={invoiceFieldInputClassName}
                  />
                </div>
              </div>
            ))}
            {childrenState.children.length < MAX_CHILDREN && (
              <button
                type="button"
                onClick={addChildRow}
                className="inline-flex min-h-11 items-center justify-center rounded-xl border border-purple-200 bg-white px-5 py-2.5 text-sm font-medium text-purple-800 shadow-sm transition hover:bg-purple-50"
              >
                Add Child
              </button>
            )}
          </div>

          <div className="space-y-4 border-t border-purple-100/90 pt-8">
            <p className="text-sm font-medium text-slate-800">
              Your relationship to these children
            </p>
            <select
              aria-label="Petitioner relationship to children"
              value={childrenState.petitionerRelationship}
              onChange={(e) =>
                setChildren({
                  petitionerRelationship: e.target
                    .value as (typeof REL_OPTS)[number]["value"],
                })
              }
              className={inputClass}
            >
              {REL_OPTS.map((o) => (
                <option key={o.value || "unset"} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
            {childrenState.petitionerRelationship === "other" && (
              <div>
                <label
                  htmlFor="petitionerRelOther"
                  className="text-sm font-medium text-slate-800"
                >
                  Describe
                </label>
                <input
                  id="petitionerRelOther"
                  type="text"
                  value={childrenState.petitionerRelationshipDescription}
                  onChange={(e) =>
                    setChildren({
                      petitionerRelationshipDescription: e.target.value,
                    })
                  }
                  className={invoiceFieldInputClassName}
                />
              </div>
            )}
          </div>

          <div className="space-y-4 border-t border-purple-100/90 pt-8">
            <p className="text-sm font-medium text-slate-800">
              {"Respondent's relationship to these children"}
            </p>
            <select
              aria-label="Respondent relationship to children"
              value={childrenState.respondentRelationship}
              onChange={(e) =>
                setChildren({
                  respondentRelationship: e.target
                    .value as (typeof REL_OPTS)[number]["value"],
                })
              }
              className={inputClass}
            >
              {REL_OPTS.map((o) => (
                <option key={`r-${o.value || "unset"}`} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
            {childrenState.respondentRelationship === "other" && (
              <div>
                <label
                  htmlFor="respondentRelOther"
                  className="text-sm font-medium text-slate-800"
                >
                  Describe
                </label>
                <input
                  id="respondentRelOther"
                  type="text"
                  value={childrenState.respondentRelationshipDescription}
                  onChange={(e) =>
                    setChildren({
                      respondentRelationshipDescription: e.target.value,
                    })
                  }
                  className={invoiceFieldInputClassName}
                />
              </div>
            )}
          </div>

          <fieldset className="space-y-4 border-t border-purple-100/90 pt-8">
            <legend className="text-sm font-medium text-slate-800">
              Have all children lived together for the last 5 years?
            </legend>
            <div className="space-y-3">
              {(
                [
                  { value: "yes" as const, label: "Yes" },
                  { value: "no" as const, label: "No" },
                ] as const
              ).map(({ value, label }) => (
                <label
                  key={value}
                  className="flex cursor-pointer items-start gap-3 py-3 pr-2 pl-0.5 transition"
                >
                  <input
                    type="radio"
                    name="allChildrenLivedTogether"
                    checked={childrenState.allChildrenLivedTogether === value}
                    onChange={() =>
                      setChildren({ allChildrenLivedTogether: value })
                    }
                    className="mt-1 size-4 shrink-0 rounded-sm border border-purple-300/80 text-purple-700 accent-purple-700 outline-none focus-visible:ring-2 focus-visible:ring-purple-700 focus-visible:ring-offset-1"
                  />
                  <span className="text-sm leading-relaxed text-slate-800">
                    {label}
                  </span>
                </label>
              ))}
            </div>
          </fieldset>

          {childrenState.allChildrenLivedTogether === "yes" && (
            <div className="space-y-4 border-t border-purple-100/90 pt-8">
              <p className="text-sm font-medium text-slate-800">
                5-year residence history (all children)
              </p>
              <p className="text-xs text-slate-600">
                List where the children have lived. Check the boxes that apply for
                each address.
              </p>
              <div className="overflow-x-auto rounded-xl border border-purple-100">
                <table className="min-w-full text-left text-xs sm:text-sm">
                  <thead>
                    <tr className="border-b border-purple-100 bg-purple-50/60">
                      <th className="px-2 py-2 font-medium">From</th>
                      <th className="px-2 py-2 font-medium">Until</th>
                      <th className="px-2 py-2 font-medium">City / State</th>
                      <th className="px-2 py-2 font-medium">With me</th>
                      <th className="px-2 py-2 font-medium">With person in 2</th>
                      <th className="px-2 py-2 font-medium">Other</th>
                      <th className="px-2 py-2 font-medium">Other detail</th>
                    </tr>
                  </thead>
                  <tbody>
                    {childrenState.residenceHistory.map((row, i) => (
                      <tr key={i} className="border-b border-purple-50 align-top">
                        <td className="px-2 py-2">
                          <input
                            type="text"
                            value={row.dateFrom}
                            onChange={(e) =>
                              updateResidenceRow(i, { dateFrom: e.target.value })
                            }
                            className={invoiceFieldInputClassName}
                            aria-label={`Residence from row ${i + 1}`}
                          />
                        </td>
                        <td className="px-2 py-2">
                          <input
                            type="text"
                            value={row.dateUntil}
                            onChange={(e) =>
                              updateResidenceRow(i, { dateUntil: e.target.value })
                            }
                            className={invoiceFieldInputClassName}
                            aria-label={`Residence until row ${i + 1}`}
                          />
                        </td>
                        <td className="px-2 py-2">
                          <input
                            type="text"
                            value={row.cityState}
                            onChange={(e) =>
                              updateResidenceRow(i, { cityState: e.target.value })
                            }
                            className={invoiceFieldInputClassName}
                            aria-label={`City state row ${i + 1}`}
                          />
                        </td>
                        <td className="px-2 py-2 text-center">
                          <input
                            type="checkbox"
                            checked={row.livedWithMe}
                            onChange={(e) =>
                              updateResidenceRow(i, {
                                livedWithMe: e.target.checked,
                              })
                            }
                            aria-label={`Lived with me row ${i + 1}`}
                          />
                        </td>
                        <td className="px-2 py-2 text-center">
                          <input
                            type="checkbox"
                            checked={row.livedWithPersonInItem2}
                            onChange={(e) =>
                              updateResidenceRow(i, {
                                livedWithPersonInItem2: e.target.checked,
                              })
                            }
                            aria-label={`Lived with respondent row ${i + 1}`}
                          />
                        </td>
                        <td className="px-2 py-2 text-center">
                          <input
                            type="checkbox"
                            checked={row.livedWithOther}
                            onChange={(e) =>
                              updateResidenceRow(i, {
                                livedWithOther: e.target.checked,
                              })
                            }
                            aria-label={`Other caregiver row ${i + 1}`}
                          />
                        </td>
                        <td className="px-2 py-2">
                          <input
                            type="text"
                            value={row.otherCaregiverRelationship}
                            onChange={(e) =>
                              updateResidenceRow(i, {
                                otherCaregiverRelationship: e.target.value,
                              })
                            }
                            className={invoiceFieldInputClassName}
                            aria-label={`Other caregiver relationship row ${i + 1}`}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
