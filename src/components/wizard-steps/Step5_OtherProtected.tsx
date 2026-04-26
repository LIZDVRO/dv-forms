"use client";

import { useEffect, useState } from "react";

import { useFormStore, type ProtectedPerson } from "@/store/useFormStore";
import { formFieldTextareaClassName } from "@/components/ui/textarea";

import { GENDER_OPTIONS, PROTECTED_PEOPLE_WHY_MAX_LENGTH } from "./wizardShared";

type Step5Props = {
  inputClass: string;
};

const textareaClass = formFieldTextareaClassName;

function blankProtectedPerson(): ProtectedPerson {
  return {
    fullName: "",
    age: "",
    gender: "",
    race: "",
    dateOfBirth: "",
    relationship: "",
    livesWithPetitioner: "",
  };
}

const MAX_OTHER_PROTECTED = 5;

function otherProtectedRowHasData(p: ProtectedPerson): boolean {
  return [
    p.fullName,
    p.age,
    p.gender,
    p.race,
    p.dateOfBirth,
    p.relationship,
  ].some((s) => String(s ?? "").trim() !== "");
}

export default function Step5_OtherProtected({ inputClass }: Step5Props) {
  const otherProtectedPeople = useFormStore((s) => s.otherProtectedPeople);
  const setOtherProtectedPeople = useFormStore((s) => s.setOtherProtectedPeople);
  const updateProtectedPerson = useFormStore((s) => s.updateProtectedPerson);

  const [visibleOtherProtected, setVisibleOtherProtected] = useState(1);

  useEffect(() => {
    if (otherProtectedPeople.wantsProtectionForOthers !== "yes") {
      setVisibleOtherProtected(1);
      return;
    }
    const n = otherProtectedPeople.people.length;
    if (n === 0) {
      return;
    }
    setVisibleOtherProtected((v) => Math.max(v, Math.min(MAX_OTHER_PROTECTED, n)));
  }, [
    otherProtectedPeople.people.length,
    otherProtectedPeople.wantsProtectionForOthers,
  ]);

  const visibleOtherProtectedPeople = otherProtectedPeople.people.slice(
    0,
    Math.min(MAX_OTHER_PROTECTED, Math.max(1, visibleOtherProtected)),
  );
  const filledOtherProtectedCount = otherProtectedPeople.people.filter(
    otherProtectedRowHasData,
  ).length;

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-sm font-semibold text-slate-900">
          Other protected people
        </h2>
        <p className="mt-1 text-sm text-slate-600">
          Is there anyone else who needs protection from the person causing harm?
        </p>
      </div>

      <fieldset className="space-y-4">
        <legend className="text-sm font-medium text-slate-800">
          Anyone else who needs protection
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
                name="protectOtherPeople"
                checked={otherProtectedPeople.wantsProtectionForOthers === value}
                onChange={() =>
                  setOtherProtectedPeople({ wantsProtectionForOthers: value })
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

      {otherProtectedPeople.wantsProtectionForOthers === "yes" && (
        <>
          {filledOtherProtectedCount > 4 && (
            <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-bold text-amber-950">
              Note: You have listed more than 4 people. An extra page titled
              &apos;DV-100, Other Protected People&apos; will automatically be
              created and attached to your final document.
            </p>
          )}

          <div className="space-y-6">
            {visibleOtherProtectedPeople.map((person, index) => (
              <div
                key={index}
                className="space-y-4 rounded-xl border border-purple-100 bg-purple-50/30 px-4 py-4"
              >
                <p className="text-sm font-medium text-slate-800">
                  Protected person {index + 1}
                </p>
                <div>
                  <label
                    htmlFor={`protected-name-${index}`}
                    className="text-sm font-medium text-slate-800"
                  >
                    Full name
                  </label>
                  <input
                    id={`protected-name-${index}`}
                    type="text"
                    autoComplete="off"
                    value={person.fullName}
                    onChange={(e) =>
                      updateProtectedPerson(index, { fullName: e.target.value })
                    }
                    className={inputClass}
                  />
                </div>
                <div>
                  <label
                    htmlFor={`protected-age-${index}`}
                    className="text-sm font-medium text-slate-800"
                  >
                    Age
                  </label>
                  <input
                    id={`protected-age-${index}`}
                    type="text"
                    autoComplete="off"
                    value={person.age}
                    onChange={(e) =>
                      updateProtectedPerson(index, { age: e.target.value })
                    }
                    className={inputClass}
                  />
                </div>
                <div>
                  <label
                    htmlFor={`protected-dob-${index}`}
                    className="text-sm font-medium text-slate-800"
                  >
                    Date of birth
                  </label>
                  <input
                    id={`protected-dob-${index}`}
                    type="text"
                    placeholder="MM / DD / YYYY"
                    autoComplete="off"
                    value={person.dateOfBirth}
                    onChange={(e) =>
                      updateProtectedPerson(index, {
                        dateOfBirth: e.target.value,
                      })
                    }
                    className={inputClass}
                  />
                </div>
                <fieldset className="space-y-4">
                  <legend className="text-sm font-medium text-slate-800">
                    Gender
                  </legend>
                  <div className="space-y-3">
                    {GENDER_OPTIONS.map((option) => (
                      <label
                        key={option}
                        className="flex cursor-pointer items-start gap-3 py-3 pr-2 pl-0.5 transition"
                      >
                        <input
                          type="radio"
                          name={`protected-gender-${index}`}
                          value={option}
                          checked={person.gender === option}
                          onChange={() =>
                            updateProtectedPerson(index, { gender: option })
                          }
                          className="mt-1 size-4 shrink-0 rounded-sm border border-purple-300/80 text-purple-700 accent-purple-700 outline-none focus-visible:ring-2 focus-visible:ring-purple-700 focus-visible:ring-offset-1"
                        />
                        <span className="text-sm leading-relaxed text-slate-800">
                          {option}
                        </span>
                      </label>
                    ))}
                  </div>
                </fieldset>
                <div>
                  <label
                    htmlFor={`protected-race-${index}`}
                    className="text-sm font-medium text-slate-800"
                  >
                    Race
                  </label>
                  <input
                    id={`protected-race-${index}`}
                    type="text"
                    autoComplete="off"
                    value={person.race}
                    onChange={(e) =>
                      updateProtectedPerson(index, { race: e.target.value })
                    }
                    className={inputClass}
                  />
                </div>
                <div>
                  <label
                    htmlFor={`protected-rel-${index}`}
                    className="text-sm font-medium text-slate-800"
                  >
                    Relationship to you
                  </label>
                  <input
                    id={`protected-rel-${index}`}
                    type="text"
                    autoComplete="off"
                    value={person.relationship}
                    onChange={(e) =>
                      updateProtectedPerson(index, {
                        relationship: e.target.value,
                      })
                    }
                    className={inputClass}
                  />
                </div>
                <fieldset className="space-y-3">
                  <legend className="text-sm font-medium text-slate-800">
                    Lives with you
                  </legend>
                  <div className="space-y-2">
                    {(
                      [
                        { v: "yes" as const, lab: "Yes" },
                        { v: "no" as const, lab: "No" },
                      ] as const
                    ).map(({ v, lab }) => (
                      <label
                        key={v}
                        className="flex cursor-pointer items-start gap-3 py-2.5 pr-2 pl-0.5 transition"
                      >
                        <input
                          type="radio"
                          name={`protected-lives-${index}`}
                          checked={person.livesWithPetitioner === v}
                          onChange={() =>
                            updateProtectedPerson(index, {
                              livesWithPetitioner: v,
                            })
                          }
                          className="mt-0.5 size-4 shrink-0 rounded-sm border border-purple-300/80 text-purple-700 accent-purple-700 outline-none focus-visible:ring-2 focus-visible:ring-purple-700 focus-visible:ring-offset-1"
                        />
                        <span className="text-sm text-slate-800">{lab}</span>
                      </label>
                    ))}
                  </div>
                </fieldset>
              </div>
            ))}
          </div>

          {visibleOtherProtected < MAX_OTHER_PROTECTED && (
            <button
              type="button"
              onClick={() => {
                const countAfter = Math.min(
                  MAX_OTHER_PROTECTED,
                  visibleOtherProtected + 1,
                );
                if (otherProtectedPeople.people.length < countAfter) {
                  setOtherProtectedPeople({
                    people: [
                      ...otherProtectedPeople.people,
                      blankProtectedPerson(),
                    ],
                  });
                }
                setVisibleOtherProtected(countAfter);
              }}
              className="inline-flex min-h-11 items-center justify-center rounded-xl border border-purple-200 bg-white px-5 py-2.5 text-sm font-medium text-purple-800 shadow-sm transition hover:bg-purple-50"
            >
              Add Person
            </button>
          )}

          <div>
            <label
              htmlFor="protectedPeopleWhy"
              className="text-sm font-medium text-slate-800"
            >
              Why do these people need protection?
            </label>
            <p className="mt-1 text-xs text-slate-500">
              Keep it brief. Space is limited to the box on the form.
            </p>
            <textarea
              id="protectedPeopleWhy"
              name="protectedPeopleWhy"
              rows={5}
              maxLength={PROTECTED_PEOPLE_WHY_MAX_LENGTH}
              autoComplete="off"
              value={otherProtectedPeople.whyProtectionNeeded}
              onChange={(e) =>
                setOtherProtectedPeople({ whyProtectionNeeded: e.target.value })
              }
              className={textareaClass}
              aria-describedby="protectedPeopleWhy-counter"
            />
            <p
              id="protectedPeopleWhy-counter"
              className="mt-1.5 text-xs tabular-nums text-slate-500"
            >
              {otherProtectedPeople.whyProtectionNeeded.length}/
              {PROTECTED_PEOPLE_WHY_MAX_LENGTH} characters
            </p>
          </div>
        </>
      )}
    </div>
  );
}
