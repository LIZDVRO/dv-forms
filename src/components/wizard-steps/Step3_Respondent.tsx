"use client";

import { useState } from "react";

import type { RelationshipInfo } from "@/store/useFormStore";
import { useFormStore } from "@/store/useFormStore";

import {
  GENDER_OPTIONS,
  invoiceFieldInputClassName,
  parseDisplayNameToPersonInfo,
  personInfoToDisplayName,
  RELATED_TYPE_OPTIONS,
  RELATIONSHIP_OPTIONS,
  toggleInList,
} from "./wizardShared";

const RELATIONSHIP_TO_STORE_KEY: Record<
  string,
  keyof Pick<
    RelationshipInfo,
    | "childrenTogether"
    | "marriedOrRDP"
    | "formerlyMarriedOrRDP"
    | "datingOrFormerlyDating"
    | "engagedOrFormerlyEngaged"
    | "related"
    | "liveTogetherOrUsedTo"
  >
> = {
  children: "childrenTogether",
  married: "marriedOrRDP",
  usedToBeMarried: "formerlyMarriedOrRDP",
  dating: "datingOrFormerlyDating",
  engaged: "engagedOrFormerlyEngaged",
  related: "related",
  liveTogether: "liveTogetherOrUsedTo",
};

type Step2Props = {
  inputClass: string;
};

export default function Step3_Respondent({ inputClass }: Step2Props) {
  const respondentPerson = useFormStore((s) => s.respondent.person);
  const setRespondentPerson = useFormStore((s) => s.setRespondentPerson);
  const respondentCLETS = useFormStore((s) => s.respondent.clets);
  const setRespondentCLETS = useFormStore((s) => s.setRespondentCLETS);
  const relationship = useFormStore((s) => s.relationship);
  const setRelationship = useFormStore((s) => s.setRelationship);
  const [respondentFullName, setRespondentFullName] = useState(() =>
    personInfoToDisplayName(respondentPerson),
  );

  const toggleRelationship = (value: string) => {
    const k = RELATIONSHIP_TO_STORE_KEY[value];
    if (!k) {
      return;
    }
    const r = useFormStore.getState().relationship;
    const was = Boolean(r[k]);
    const on = !was;
    if (value === "children" && !on) {
      setRelationship({ [k]: on, childrenNames: "" });
      return;
    }
    if (value === "related" && !on) {
      setRelationship({ [k]: on, relatedType: [] });
      return;
    }
    if (value === "liveTogether" && !on) {
      setRelationship({ [k]: on, livedAsFamily: "" });
      return;
    }
    setRelationship({ [k]: on } as Partial<RelationshipInfo>);
  };

  const isRelChecked = (r: typeof relationship, value: string) => {
    const k = RELATIONSHIP_TO_STORE_KEY[value];
    if (!k) {
      return false;
    }
    return Boolean(r[k]);
  };

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
          htmlFor="respondentStreet"
          className="text-sm font-medium text-slate-800"
        >
          Street address
        </label>
        <input
          id="respondentStreet"
          name="respondentStreet"
          type="text"
          autoComplete="street-address"
          value={respondentPerson.address.street}
          onChange={(e) =>
            setRespondentPerson({
              address: { ...respondentPerson.address, street: e.target.value },
            })
          }
          className={inputClass}
        />
      </div>
      <div className="grid gap-6 sm:grid-cols-2">
        <div>
          <label
            htmlFor="respondentCity"
            className="text-sm font-medium text-slate-800"
          >
            City
          </label>
          <input
            id="respondentCity"
            name="respondentCity"
            type="text"
            autoComplete="address-level2"
            value={respondentPerson.address.city}
            onChange={(e) =>
              setRespondentPerson({
                address: { ...respondentPerson.address, city: e.target.value },
              })
            }
            className={inputClass}
          />
        </div>
        <div>
          <label
            htmlFor="respondentState"
            className="text-sm font-medium text-slate-800"
          >
            State
          </label>
          <input
            id="respondentState"
            name="respondentState"
            type="text"
            autoComplete="address-level1"
            value={respondentPerson.address.state}
            onChange={(e) =>
              setRespondentPerson({
                address: { ...respondentPerson.address, state: e.target.value },
              })
            }
            className={inputClass}
          />
        </div>
        <div className="sm:col-span-2">
          <label
            htmlFor="respondentZip"
            className="text-sm font-medium text-slate-800"
          >
            Zip
          </label>
          <input
            id="respondentZip"
            name="respondentZip"
            type="text"
            inputMode="numeric"
            autoComplete="postal-code"
            value={respondentPerson.address.zip}
            onChange={(e) =>
              setRespondentPerson({
                address: { ...respondentPerson.address, zip: e.target.value },
              })
            }
            className={inputClass}
          />
        </div>
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
                checked={isRelChecked(relationship, value)}
                onChange={() => toggleRelationship(value)}
                className="mt-1 size-4 shrink-0 rounded-sm border border-purple-300/80 text-purple-700 accent-purple-700 outline-none focus-visible:ring-2 focus-visible:ring-purple-700 focus-visible:ring-offset-1"
              />
              <span className="text-sm leading-relaxed text-slate-800">
                {label}
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      {relationship.childrenTogether && (
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
            value={relationship.childrenNames}
            onChange={(e) =>
              setRelationship({ childrenNames: e.target.value })
            }
            className={inputClass}
          />
        </div>
      )}

      {relationship.related && (
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
                  checked={relationship.relatedType.includes(value)}
                  onChange={() => {
                    const r = useFormStore.getState().relationship;
                    setRelationship({
                      relatedType: toggleInList(r.relatedType, value),
                    });
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
      )}

      {relationship.liveTogetherOrUsedTo && (
        <fieldset className="space-y-4 border-t border-purple-100/90 pt-6">
          <legend className="text-sm font-medium text-slate-800">
            Have you lived together with the person in 2?
          </legend>
          <div className="space-y-3">
            <label className="flex cursor-pointer items-start gap-3 py-3 pr-2 pl-0.5 transition">
              <input
                type="radio"
                name="livedTogether"
                checked={relationship.livedAsFamily === "yes"}
                onChange={() => setRelationship({ livedAsFamily: "yes" })}
                className="mt-1 size-4 shrink-0 rounded-sm border border-purple-300/80 text-purple-700 accent-purple-700 outline-none focus-visible:ring-2 focus-visible:ring-purple-700 focus-visible:ring-offset-1"
              />
              <span className="text-sm leading-relaxed text-slate-800">Yes</span>
            </label>
            <label className="flex cursor-pointer items-start gap-3 py-3 pr-2 pl-0.5 transition">
              <input
                type="radio"
                name="livedTogether"
                checked={relationship.livedAsFamily === "no"}
                onChange={() => setRelationship({ livedAsFamily: "no" })}
                className="mt-1 size-4 shrink-0 rounded-sm border border-purple-300/80 text-purple-700 accent-purple-700 outline-none focus-visible:ring-2 focus-visible:ring-purple-700 focus-visible:ring-offset-1"
              />
              <span className="text-sm leading-relaxed text-slate-800">No</span>
            </label>
          </div>
        </fieldset>
      )}
    </div>
  );
}
