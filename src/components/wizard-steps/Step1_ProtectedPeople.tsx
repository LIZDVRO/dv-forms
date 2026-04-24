"use client";

import type { Dispatch, SetStateAction } from "react";

import type { Dv100PdfFormData } from "@/lib/dv100-pdf";
import type { PetitionerInfo } from "@/store/useFormStore";
import { formFieldTextareaClassName } from "@/components/ui/textarea";

import {
  defaultProtectedPerson,
  GENDER_OPTIONS,
  invoiceFieldInputClassName,
  parseDisplayNameToPersonInfo,
  PROTECTED_PEOPLE_WHY_MAX_LENGTH,
} from "./wizardShared";

type FormData = Dv100PdfFormData;

type Step1Props = {
  form: FormData;
  setForm: Dispatch<SetStateAction<FormData>>;
  update: <K extends keyof FormData>(key: K, value: FormData[K]) => void;
  petitioner: PetitionerInfo;
  setPetitioner: (patch: Partial<PetitionerInfo>) => void;
  petitionerFullName: string;
  setPetitionerFullName: (v: string) => void;
  inputClass: string;
};

const textareaClass = formFieldTextareaClassName;

export default function Step1_ProtectedPeople({
  form,
  setForm,
  update,
  petitioner,
  setPetitioner,
  petitionerFullName,
  setPetitionerFullName,
  inputClass,
}: Step1Props) {
  return (
    <>
      <div className="space-y-6">
        <div>
          <label
            htmlFor="petitionerName"
            className="text-sm font-medium text-slate-800"
          >
            Your full name
          </label>
          <input
            id="petitionerName"
            name="petitionerName"
            type="text"
            autoComplete="name"
            value={petitionerFullName}
            onChange={(e) => {
              const v = e.target.value;
              setPetitionerFullName(v);
              setPetitioner(parseDisplayNameToPersonInfo(v));
            }}
            className={inputClass}
          />
        </div>
        <div>
          <label
            htmlFor="petitionerAge"
            className="text-sm font-medium text-slate-800"
          >
            Your age
          </label>
          <input
            id="petitionerAge"
            name="petitionerAge"
            type="text"
            inputMode="numeric"
            autoComplete="off"
            value={petitioner.age}
            onChange={(e) => setPetitioner({ age: e.target.value })}
            className={invoiceFieldInputClassName}
          />
        </div>
        <div>
          <label
            htmlFor="petitionerDob"
            className="text-sm font-medium text-slate-800"
          >
            Date of birth
          </label>
          <input
            id="petitionerDob"
            name="petitionerDob"
            type="text"
            placeholder="MM / DD / YYYY"
            autoComplete="bday"
            value={petitioner.dateOfBirth}
            onChange={(e) => setPetitioner({ dateOfBirth: e.target.value })}
            className={inputClass}
          />
        </div>
        <fieldset className="space-y-4">
          <legend className="text-sm font-medium text-slate-800">Gender</legend>
          <div className="space-y-3">
            {GENDER_OPTIONS.map((option) => (
              <label
                key={option}
                className="flex cursor-pointer items-start gap-3 py-3 pr-2 pl-0.5 transition"
              >
                <input
                  type="radio"
                  name="petitionerGender"
                  value={option}
                  checked={petitioner.gender === option}
                  onChange={() => setPetitioner({ gender: option })}
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
            htmlFor="petitionerRace"
            className="text-sm font-medium text-slate-800"
          >
            Race
          </label>
          <input
            id="petitionerRace"
            name="petitionerRace"
            type="text"
            autoComplete="off"
            value={petitioner.race}
            onChange={(e) => setPetitioner({ race: e.target.value })}
            className={invoiceFieldInputClassName}
          />
        </div>
        <div>
          <label
            htmlFor="petitionerAddress"
            className="text-sm font-medium text-slate-800"
          >
            Street address
          </label>
          <input
            id="petitionerAddress"
            name="petitionerAddress"
            type="text"
            autoComplete="street-address"
            value={petitioner.address.street}
            onChange={(e) =>
              setPetitioner({
                address: { ...petitioner.address, street: e.target.value },
              })
            }
            className={inputClass}
          />
        </div>
        <div className="grid gap-6 sm:grid-cols-2">
          <div>
            <label
              htmlFor="petitionerCity"
              className="text-sm font-medium text-slate-800"
            >
              City
            </label>
            <input
              id="petitionerCity"
              name="petitionerCity"
              type="text"
              autoComplete="address-level2"
              value={petitioner.address.city}
              onChange={(e) =>
                setPetitioner({
                  address: { ...petitioner.address, city: e.target.value },
                })
              }
              className={inputClass}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="petitionerState"
                className="text-sm font-medium text-slate-800"
              >
                State
              </label>
              <input
                id="petitionerState"
                name="petitionerState"
                type="text"
                autoComplete="address-level1"
                value={petitioner.address.state}
                onChange={(e) =>
                  setPetitioner({
                    address: { ...petitioner.address, state: e.target.value },
                  })
                }
                className={inputClass}
              />
            </div>
            <div>
              <label
                htmlFor="petitionerZip"
                className="text-sm font-medium text-slate-800"
              >
                Zip
              </label>
              <input
                id="petitionerZip"
                name="petitionerZip"
                type="text"
                autoComplete="postal-code"
                value={petitioner.address.zip}
                onChange={(e) =>
                  setPetitioner({
                    address: { ...petitioner.address, zip: e.target.value },
                  })
                }
                className={inputClass}
              />
            </div>
          </div>
        </div>
        <div>
          <label
            htmlFor="petitionerPhone"
            className="text-sm font-medium text-slate-800"
          >
            Telephone
          </label>
          <input
            id="petitionerPhone"
            name="petitionerPhone"
            type="tel"
            autoComplete="tel"
            value={petitioner.telephone}
            onChange={(e) => setPetitioner({ telephone: e.target.value })}
            className={inputClass}
          />
        </div>
        <div>
          <label
            htmlFor="petitionerEmail"
            className="text-sm font-medium text-slate-800"
          >
            Email
          </label>
          <input
            id="petitionerEmail"
            name="petitionerEmail"
            type="email"
            autoComplete="email"
            value={petitioner.email}
            onChange={(e) => setPetitioner({ email: e.target.value })}
            className={inputClass}
          />
        </div>
        <fieldset className="space-y-4">
          <legend className="text-sm font-medium text-slate-800">
            Does this person speak English?
          </legend>
          <div className="space-y-3">
            {(
              [
                { value: "yes" as const, label: "Yes" },
                { value: "no" as const, label: "No" },
                { value: "unknown" as const, label: "I don't know" },
              ] as const
            ).map(({ value, label }) => (
              <label
                key={value}
                className="flex cursor-pointer items-start gap-3 py-3 pr-2 pl-0.5 transition"
              >
                <input
                  type="radio"
                  name="petitionerSpeaksEnglish"
                  checked={petitioner.speaksEnglish === value}
                  onChange={() =>
                    setPetitioner({
                      speaksEnglish: value,
                      language: value === "no" ? petitioner.language : "",
                    })
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
        {petitioner.speaksEnglish === "no" && (
          <div>
            <label
              htmlFor="petitionerLanguage"
              className="text-sm font-medium text-slate-800"
            >
              What language?
            </label>
            <input
              id="petitionerLanguage"
              name="petitionerLanguage"
              type="text"
              autoComplete="language"
              value={petitioner.language}
              onChange={(e) => setPetitioner({ language: e.target.value })}
              className={invoiceFieldInputClassName}
            />
          </div>
        )}
        <div
          className="rounded-xl border border-amber-200/90 bg-amber-50/80 px-4 py-3 text-sm leading-relaxed text-amber-950"
          role="note"
        >
          <strong className="font-semibold">Privacy:</strong> If you need to keep
          your home address confidential, do{" "}
          <span className="font-medium">not</span> enter it here. You may use a
          safe mailing address or leave address fields blank, following court
          self-help guidance for your county.
        </div>
      </div>

      <hr className="my-8 border-0 border-t border-purple-200/70" />

      <div className="space-y-8">
        <div>
          <h2 className="text-sm font-semibold text-slate-900">
            Other Protected People
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            Besides yourself, does anyone else need protection from the person
            causing harm?
          </p>
        </div>

        <fieldset className="space-y-4">
          <legend className="text-sm font-medium text-slate-800">
            Other people who need protection
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
                  checked={form.protectOtherPeople === value}
                  onChange={() => {
                    update("protectOtherPeople", value);
                  }}
                  className="mt-1 size-4 shrink-0 rounded-sm border border-purple-300/80 text-purple-700 accent-purple-700 outline-none focus-visible:ring-2 focus-visible:ring-purple-700 focus-visible:ring-offset-1"
                />
                <span className="text-sm leading-relaxed text-slate-800">
                  {label}
                </span>
              </label>
            ))}
          </div>
        </fieldset>

        {form.protectOtherPeople === "yes" && (
          <>
            {form.protectedPeople.length > 4 && (
              <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-bold text-amber-950">
                Note: You have listed more than 4 people. An extra page titled
                &apos;DV-100, Other Protected People&apos; will automatically be
                created and attached to your final document.
              </p>
            )}

            <div className="space-y-6">
              {form.protectedPeople.map((person, index) => (
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
                      value={person.name}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          protectedPeople: prev.protectedPeople.map((p, i) =>
                            i === index ? { ...p, name: e.target.value } : p,
                          ),
                        }))
                      }
                      className={invoiceFieldInputClassName}
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
                        setForm((prev) => ({
                          ...prev,
                          protectedPeople: prev.protectedPeople.map((p, i) =>
                            i === index ? { ...p, age: e.target.value } : p,
                          ),
                        }))
                      }
                      className={invoiceFieldInputClassName}
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
                        setForm((prev) => ({
                          ...prev,
                          protectedPeople: prev.protectedPeople.map((p, i) =>
                            i === index
                              ? { ...p, dateOfBirth: e.target.value }
                              : p,
                          ),
                        }))
                      }
                      className={invoiceFieldInputClassName}
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
                              setForm((prev) => ({
                                ...prev,
                                protectedPeople: prev.protectedPeople.map(
                                  (p, i) =>
                                    i === index
                                      ? { ...p, gender: option }
                                      : p,
                                ),
                              }))
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
                        setForm((prev) => ({
                          ...prev,
                          protectedPeople: prev.protectedPeople.map((p, i) =>
                            i === index ? { ...p, race: e.target.value } : p,
                          ),
                        }))
                      }
                      className={invoiceFieldInputClassName}
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
                        setForm((prev) => ({
                          ...prev,
                          protectedPeople: prev.protectedPeople.map((p, i) =>
                            i === index
                              ? { ...p, relationship: e.target.value }
                              : p,
                          ),
                        }))
                      }
                      className={invoiceFieldInputClassName}
                    />
                  </div>
                  <fieldset className="space-y-3">
                    <legend className="text-sm font-medium text-slate-800">
                      Lives with you
                    </legend>
                    <div className="space-y-2">
                      {(
                        [
                          { v: "Yes" as const, lab: "Yes" },
                          { v: "No" as const, lab: "No" },
                        ] as const
                      ).map(({ v, lab }) => (
                        <label
                          key={v}
                          className="flex cursor-pointer items-start gap-3 py-2.5 pr-2 pl-0.5 transition"
                        >
                          <input
                            type="radio"
                            name={`protected-lives-${index}`}
                            checked={person.livesWithYou === v}
                            onChange={() =>
                              setForm((prev) => ({
                                ...prev,
                                protectedPeople: prev.protectedPeople.map(
                                  (p, i) =>
                                    i === index
                                      ? { ...p, livesWithYou: v }
                                      : p,
                                ),
                              }))
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

            <button
              type="button"
              onClick={() =>
                setForm((prev) => ({
                  ...prev,
                  protectedPeople: [
                    ...prev.protectedPeople,
                    defaultProtectedPerson(),
                  ],
                }))
              }
              className="inline-flex min-h-11 items-center justify-center rounded-xl border border-purple-200 bg-white px-5 py-2.5 text-sm font-medium text-purple-800 shadow-sm transition hover:bg-purple-50"
            >
              Add Another Person
            </button>

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
                value={form.protectedPeopleWhy}
                onChange={(e) => update("protectedPeopleWhy", e.target.value)}
                className={textareaClass}
                aria-describedby="protectedPeopleWhy-counter"
              />
              <p
                id="protectedPeopleWhy-counter"
                className="mt-1.5 text-xs tabular-nums text-slate-500"
              >
                {form.protectedPeopleWhy.length}/
                {PROTECTED_PEOPLE_WHY_MAX_LENGTH} characters
              </p>
            </div>
          </>
        )}
      </div>
    </>
  );
}
