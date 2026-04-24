"use client";

import type { Dispatch, SetStateAction } from "react";

import type { Dv100PdfFormData } from "@/lib/dv100-pdf";
import type { PersonInfo, RespondentCLETSInfo } from "@/store/useFormStore";

import {
  defaultFirearmRow,
  GENDER_OPTIONS,
  invoiceFieldInputClassName,
  parseDisplayNameToPersonInfo,
  RELATED_TYPE_OPTIONS,
  RELATIONSHIP_OPTIONS,
  toggleInList,
} from "./wizardShared";

type FormData = Dv100PdfFormData;

type Step2Props = {
  form: FormData;
  setForm: Dispatch<SetStateAction<FormData>>;
  update: <K extends keyof FormData>(key: K, value: FormData[K]) => void;
  respondentPerson: PersonInfo;
  setRespondentPerson: (patch: Partial<PersonInfo>) => void;
  respondentCLETS: RespondentCLETSInfo;
  setRespondentCLETS: (patch: Partial<RespondentCLETSInfo>) => void;
  respondentFullName: string;
  setRespondentFullName: (v: string) => void;
  inputClass: string;
};

export default function Step2_PersonCausingHarm({
  form,
  setForm,
  update,
  respondentPerson,
  setRespondentPerson,
  respondentCLETS,
  setRespondentCLETS,
  respondentFullName,
  setRespondentFullName,
  inputClass,
}: Step2Props) {
  return (
    <div className="space-y-6">
      <div>
        <label
          htmlFor="respondentName"
          className="text-sm font-medium text-slate-800"
        >
          Full name
        </label>
        <input
          id="respondentName"
          name="respondentName"
          type="text"
          autoComplete="name"
          value={respondentFullName}
          onChange={(e) => {
            const v = e.target.value;
            setRespondentFullName(v);
            setRespondentPerson(parseDisplayNameToPersonInfo(v));
          }}
          className={inputClass}
        />
      </div>
      <div>
        <label
          htmlFor="respondentAge"
          className="text-sm font-medium text-slate-800"
        >
          Age (or best estimate)
        </label>
        <input
          id="respondentAge"
          name="respondentAge"
          type="text"
          inputMode="numeric"
          value={respondentPerson.age}
          onChange={(e) => setRespondentPerson({ age: e.target.value })}
          className={inputClass}
        />
      </div>
      <div>
        <label
          htmlFor="respondentDob"
          className="text-sm font-medium text-slate-800"
        >
          Date of birth (if known)
        </label>
        <input
          id="respondentDob"
          name="respondentDob"
          type="text"
          placeholder="MM / DD / YYYY"
          autoComplete="off"
          value={respondentPerson.dateOfBirth}
          onChange={(e) =>
            setRespondentPerson({ dateOfBirth: e.target.value })
          }
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
                name="respondentGender"
                value={option}
                checked={respondentPerson.gender === option}
                onChange={() => setRespondentPerson({ gender: option })}
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
          htmlFor="respondentRace"
          className="text-sm font-medium text-slate-800"
        >
          Race
        </label>
        <input
          id="respondentRace"
          name="respondentRace"
          type="text"
          autoComplete="off"
          value={respondentPerson.race}
          onChange={(e) => setRespondentPerson({ race: e.target.value })}
          className={inputClass}
        />
      </div>
      <div>
        <label
          htmlFor="respondentHeight"
          className="text-sm font-medium text-slate-800"
        >
          Height
        </label>
        <input
          id="respondentHeight"
          name="respondentHeight"
          type="text"
          autoComplete="off"
          value={respondentPerson.height}
          onChange={(e) => setRespondentPerson({ height: e.target.value })}
          className={invoiceFieldInputClassName}
        />
      </div>
      <div>
        <label
          htmlFor="respondentWeight"
          className="text-sm font-medium text-slate-800"
        >
          Weight
        </label>
        <input
          id="respondentWeight"
          name="respondentWeight"
          type="text"
          autoComplete="off"
          value={respondentPerson.weight}
          onChange={(e) => setRespondentPerson({ weight: e.target.value })}
          className={invoiceFieldInputClassName}
        />
      </div>
      <div>
        <label
          htmlFor="respondentHairColor"
          className="text-sm font-medium text-slate-800"
        >
          Hair color
        </label>
        <input
          id="respondentHairColor"
          name="respondentHairColor"
          type="text"
          autoComplete="off"
          value={respondentPerson.hairColor}
          onChange={(e) =>
            setRespondentPerson({ hairColor: e.target.value })
          }
          className={invoiceFieldInputClassName}
        />
      </div>
      <div>
        <label
          htmlFor="respondentEyeColor"
          className="text-sm font-medium text-slate-800"
        >
          Eye color
        </label>
        <input
          id="respondentEyeColor"
          name="respondentEyeColor"
          type="text"
          autoComplete="off"
          value={respondentPerson.eyeColor}
          onChange={(e) => setRespondentPerson({ eyeColor: e.target.value })}
          className={invoiceFieldInputClassName}
        />
      </div>
      <div>
        <label
          htmlFor="respondentTelephone"
          className="text-sm font-medium text-slate-800"
        >
          Telephone
        </label>
        <input
          id="respondentTelephone"
          name="respondentTelephone"
          type="tel"
          autoComplete="tel"
          value={respondentPerson.telephone}
          onChange={(e) =>
            setRespondentPerson({ telephone: e.target.value })
          }
          className={invoiceFieldInputClassName}
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
                name="respondentSpeaksEnglish"
                checked={respondentPerson.speaksEnglish === value}
                onChange={() =>
                  setRespondentPerson({
                    speaksEnglish: value,
                    language:
                      value === "no" ? respondentPerson.language : "",
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
      {respondentPerson.speaksEnglish === "no" && (
        <div>
          <label
            htmlFor="respondentLanguage"
            className="text-sm font-medium text-slate-800"
          >
            What language?
          </label>
          <input
            id="respondentLanguage"
            name="respondentLanguage"
            type="text"
            autoComplete="language"
            value={respondentPerson.language}
            onChange={(e) =>
              setRespondentPerson({ language: e.target.value })
            }
            className={invoiceFieldInputClassName}
          />
        </div>
      )}

      <div className="space-y-6 border-t border-gray-200 pt-8">
        <div>
          <h2 className="text-sm font-semibold text-slate-900">
            Law enforcement identifying information
          </h2>
          <p className="mt-1 text-sm leading-relaxed text-slate-600">
            Optional details that can help law enforcement identify the person
            causing harm. Skip anything you do not know or prefer not to share
            here.
          </p>
        </div>
        <div>
          <label
            htmlFor="cletsOtherNamesUsed"
            className="text-sm font-medium text-slate-800"
          >
            Other names used
          </label>
          <input
            id="cletsOtherNamesUsed"
            name="cletsOtherNamesUsed"
            type="text"
            autoComplete="off"
            value={respondentCLETS.otherNamesUsed}
            onChange={(e) =>
              setRespondentCLETS({ otherNamesUsed: e.target.value })
            }
            className={invoiceFieldInputClassName}
          />
        </div>
        <div>
          <label
            htmlFor="cletsMarksScars"
            className="text-sm font-medium text-slate-800"
          >
            Marks, scars, or tattoos
          </label>
          <input
            id="cletsMarksScars"
            name="cletsMarksScars"
            type="text"
            autoComplete="off"
            value={respondentCLETS.marksScarsTattoos}
            onChange={(e) =>
              setRespondentCLETS({ marksScarsTattoos: e.target.value })
            }
            className={invoiceFieldInputClassName}
          />
        </div>
        <div className="grid gap-6 sm:grid-cols-2">
          <div>
            <label
              htmlFor="cletsDriversLicense"
              className="text-sm font-medium text-slate-800"
            >
              Driver&apos;s license number
            </label>
            <input
              id="cletsDriversLicense"
              name="cletsDriversLicense"
              type="text"
              autoComplete="off"
              value={respondentCLETS.driversLicense}
              onChange={(e) =>
                setRespondentCLETS({ driversLicense: e.target.value })
              }
              className={invoiceFieldInputClassName}
            />
          </div>
          <div>
            <label
              htmlFor="cletsDriversLicenseState"
              className="text-sm font-medium text-slate-800"
            >
              License state
            </label>
            <input
              id="cletsDriversLicenseState"
              name="cletsDriversLicenseState"
              type="text"
              autoComplete="off"
              value={respondentCLETS.driversLicenseState}
              onChange={(e) =>
                setRespondentCLETS({ driversLicenseState: e.target.value })
              }
              className={invoiceFieldInputClassName}
            />
          </div>
        </div>
        <div>
          <label
            htmlFor="cletsSsn"
            className="text-sm font-medium text-slate-800"
          >
            Social Security Number
          </label>
          <input
            id="cletsSsn"
            name="cletsSsn"
            type="text"
            autoComplete="off"
            inputMode="numeric"
            value={respondentCLETS.ssn}
            onChange={(e) => setRespondentCLETS({ ssn: e.target.value })}
            className={invoiceFieldInputClassName}
          />
        </div>
        <div>
          <label
            htmlFor="cletsEmployer"
            className="text-sm font-medium text-slate-800"
          >
            Name of employer and address
          </label>
          <input
            id="cletsEmployer"
            name="cletsEmployer"
            type="text"
            autoComplete="organization"
            value={respondentCLETS.employerNameAddress}
            onChange={(e) =>
              setRespondentCLETS({ employerNameAddress: e.target.value })
            }
            className={invoiceFieldInputClassName}
          />
        </div>
      </div>

      <div className="space-y-6 border-t border-gray-200 pt-8">
        <h2 className="text-sm font-semibold text-slate-900">
          Respondent vehicle
        </h2>
        <div className="grid gap-6 sm:grid-cols-2">
          <div>
            <label
              htmlFor="cletsVehicleType"
              className="text-sm font-medium text-slate-800"
            >
              Vehicle type
            </label>
            <input
              id="cletsVehicleType"
              name="cletsVehicleType"
              type="text"
              autoComplete="off"
              value={respondentCLETS.vehicleType}
              onChange={(e) =>
                setRespondentCLETS({ vehicleType: e.target.value })
              }
              className={invoiceFieldInputClassName}
            />
          </div>
          <div>
            <label
              htmlFor="cletsVehicleModel"
              className="text-sm font-medium text-slate-800"
            >
              Model
            </label>
            <input
              id="cletsVehicleModel"
              name="cletsVehicleModel"
              type="text"
              autoComplete="off"
              value={respondentCLETS.vehicleModel}
              onChange={(e) =>
                setRespondentCLETS({ vehicleModel: e.target.value })
              }
              className={invoiceFieldInputClassName}
            />
          </div>
        </div>
        <div className="grid gap-6 sm:grid-cols-2">
          <div>
            <label
              htmlFor="cletsVehicleYear"
              className="text-sm font-medium text-slate-800"
            >
              Year
            </label>
            <input
              id="cletsVehicleYear"
              name="cletsVehicleYear"
              type="text"
              inputMode="numeric"
              autoComplete="off"
              value={respondentCLETS.vehicleYear}
              onChange={(e) =>
                setRespondentCLETS({ vehicleYear: e.target.value })
              }
              className={invoiceFieldInputClassName}
            />
          </div>
          <div>
            <label
              htmlFor="cletsVehiclePlate"
              className="text-sm font-medium text-slate-800"
            >
              Plate number
            </label>
            <input
              id="cletsVehiclePlate"
              name="cletsVehiclePlate"
              type="text"
              autoComplete="off"
              value={respondentCLETS.vehiclePlate}
              onChange={(e) =>
                setRespondentCLETS({ vehiclePlate: e.target.value })
              }
              className={invoiceFieldInputClassName}
            />
          </div>
        </div>
      </div>

      <hr className="my-8 border-0 border-t border-purple-200/70" />
      <fieldset className="space-y-4">
        <legend className="text-sm font-medium text-slate-800">
          Check all that apply
        </legend>
        <div className="space-y-3">
          {RELATIONSHIP_OPTIONS.map(({ value, label }) => (
            <label
              key={value}
              className="flex cursor-pointer items-start gap-3 py-3 pr-2 pl-0.5 transition"
            >
              <input
                type="checkbox"
                checked={form.relationshipChecks.includes(value)}
                onChange={() => {
                  const next = toggleInList(form.relationshipChecks, value);
                  update("relationshipChecks", next);
                  if (!next.includes("children")) {
                    update("childrenNames", "");
                  }
                  if (!next.includes("related")) {
                    update("relatedTypes", []);
                  }
                  if (!next.includes("liveTogether")) {
                    update("livedTogether", "");
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
      </fieldset>

      {form.relationshipChecks.includes("children") && (
        <div>
          <label
            htmlFor="childrenNames"
            className="text-sm font-medium text-slate-800"
          >
            Names of children
          </label>
          <input
            id="childrenNames"
            name="childrenNames"
            type="text"
            autoComplete="off"
            value={form.childrenNames}
            onChange={(e) => update("childrenNames", e.target.value)}
            className={inputClass}
          />
        </div>
      )}

      {form.relationshipChecks.includes("related") && (
        <fieldset className="space-y-4 border-t border-purple-100/90 pt-6">
          <legend className="text-sm font-medium text-slate-800">
            The person in 2 is my (check all that apply)
          </legend>
          <div className="space-y-3">
            {RELATED_TYPE_OPTIONS.map(({ value, label }) => (
              <label
                key={value}
                className="flex cursor-pointer items-start gap-3 py-3 pr-2 pl-0.5 transition"
              >
                <input
                  type="checkbox"
                  checked={form.relatedTypes.includes(value)}
                  onChange={() =>
                    update(
                      "relatedTypes",
                      toggleInList(form.relatedTypes, value),
                    )
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
      )}

      {form.relationshipChecks.includes("liveTogether") && (
        <fieldset className="space-y-4 border-t border-purple-100/90 pt-6">
          <legend className="text-sm font-medium text-slate-800">
            Have you lived together with the person in 2?
          </legend>
          <div className="space-y-3">
            <label className="flex cursor-pointer items-start gap-3 py-3 pr-2 pl-0.5 transition">
              <input
                type="radio"
                name="livedTogether"
                checked={form.livedTogether === "yes"}
                onChange={() => update("livedTogether", "yes")}
                className="mt-1 size-4 shrink-0 rounded-sm border border-purple-300/80 text-purple-700 accent-purple-700 outline-none focus-visible:ring-2 focus-visible:ring-purple-700 focus-visible:ring-offset-1"
              />
              <span className="text-sm leading-relaxed text-slate-800">Yes</span>
            </label>
            <label className="flex cursor-pointer items-start gap-3 py-3 pr-2 pl-0.5 transition">
              <input
                type="radio"
                name="livedTogether"
                checked={form.livedTogether === "no"}
                onChange={() => update("livedTogether", "no")}
                className="mt-1 size-4 shrink-0 rounded-sm border border-purple-300/80 text-purple-700 accent-purple-700 outline-none focus-visible:ring-2 focus-visible:ring-purple-700 focus-visible:ring-offset-1"
              />
              <span className="text-sm leading-relaxed text-slate-800">No</span>
            </label>
          </div>
        </fieldset>
      )}

      <hr className="my-8 border-0 border-t border-gray-200" />

      <div className="space-y-8">
        <fieldset className="space-y-4">
          <legend className="text-sm font-medium text-slate-800">
            Does this person own or possess any firearms or other guns?
          </legend>
          <div className="space-y-3">
            {(
              [
                { value: "idk" as const, label: "I don't know" },
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
                  name="hasFirearms"
                  checked={form.hasFirearms === value}
                  onChange={() => update("hasFirearms", value)}
                  className="mt-1 size-4 shrink-0 rounded-sm border border-purple-300/80 text-purple-700 accent-purple-700 outline-none focus-visible:ring-2 focus-visible:ring-purple-700 focus-visible:ring-offset-1"
                />
                <span className="text-sm leading-relaxed text-slate-800">
                  {label}
                </span>
              </label>
            ))}
          </div>
        </fieldset>

        {form.hasFirearms === "yes" && (
          <div className="space-y-6">
            {form.firearms.map((row, index) => (
              <div
                key={index}
                className="space-y-4 rounded-xl border border-purple-100 bg-purple-50/30 px-4 py-4"
              >
                <p className="text-sm font-medium text-slate-800">
                  Firearm {index + 1}
                </p>
                <div>
                  <label
                    htmlFor={`firearm-desc-${index}`}
                    className="text-sm font-medium text-slate-800"
                  >
                    Description (type, make, model)
                  </label>
                  <input
                    id={`firearm-desc-${index}`}
                    type="text"
                    autoComplete="off"
                    value={row.description}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        firearms: prev.firearms.map((f, i) =>
                          i === index
                            ? { ...f, description: e.target.value }
                            : f,
                        ),
                      }))
                    }
                    className={inputClass}
                  />
                </div>
                <div>
                  <label
                    htmlFor={`firearm-amt-${index}`}
                    className="text-sm font-medium text-slate-800"
                  >
                    Amount
                  </label>
                  <input
                    id={`firearm-amt-${index}`}
                    type="text"
                    autoComplete="off"
                    value={row.amount}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        firearms: prev.firearms.map((f, i) =>
                          i === index ? { ...f, amount: e.target.value } : f,
                        ),
                      }))
                    }
                    className={inputClass}
                  />
                </div>
                <div>
                  <label
                    htmlFor={`firearm-loc-${index}`}
                    className="text-sm font-medium text-slate-800"
                  >
                    Location (if known)
                  </label>
                  <input
                    id={`firearm-loc-${index}`}
                    type="text"
                    autoComplete="off"
                    value={row.location}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        firearms: prev.firearms.map((f, i) =>
                          i === index
                            ? { ...f, location: e.target.value }
                            : f,
                        ),
                      }))
                    }
                    className={inputClass}
                  />
                </div>
              </div>
            ))}
            <button
              type="button"
              disabled={form.firearms.length >= 6}
              onClick={() =>
                setForm((prev) => ({
                  ...prev,
                  firearms: [...prev.firearms, defaultFirearmRow()],
                }))
              }
              className="inline-flex min-h-11 items-center justify-center rounded-xl border border-purple-200 bg-white px-5 py-2.5 text-sm font-medium text-purple-800 shadow-sm transition hover:bg-purple-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Add Firearm
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
