"use client";

import { useState } from "react";

import { useFormStore } from "@/store/useFormStore";

import {
  GENDER_OPTIONS,
  invoiceFieldInputClassName,
  parseDisplayNameToPersonInfo,
  personInfoToDisplayName,
} from "./wizardShared";

type Step2Props = {
  inputClass: string;
};

export default function Step2_Survivor({ inputClass }: Step2Props) {
  const petitioner = useFormStore((s) => s.petitioner);
  const setPetitioner = useFormStore((s) => s.setPetitioner);

  const [petitionerFullName, setPetitionerFullName] = useState(() =>
    personInfoToDisplayName(petitioner),
  );

  return (
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
  );
}
