"use client";

import { useCallback, useMemo } from "react";

import { formFieldTextareaClassName } from "@/components/ui/textarea";
import type { AbuseIncident } from "@/store/useFormStore";
import { useFormStore } from "@/store/useFormStore";

import {
  HARM_DETAIL_MAX_LENGTH,
  SECTION5_ABUSE_EXAMPLES,
} from "./wizardShared";

type Step3Props = {
  showAbuseIncident2: boolean;
  setShowAbuseIncident2: (v: boolean) => void;
  showAbuseIncident3: boolean;
  setShowAbuseIncident3: (v: boolean) => void;
  inputClass: string;
};

const textareaClass = formFieldTextareaClassName;

const WITNESS_VALS = [
  { store: "dontKnow" as const, label: "I don't know" },
  { store: "no" as const, label: "No" },
  { store: "yes" as const, label: "Yes" },
] as const;

const POLICE_VALS = WITNESS_VALS;

const FREQ_UIS: {
  key: "once" | "2-5" | "weekly" | "other";
  store: NonNullable<AbuseIncident["frequency"]>;
  label: string;
}[] = [
  { key: "once", store: "once", label: "Just this once" },
  { key: "2-5", store: "2to5", label: "2–5 times" },
  { key: "weekly", store: "weekly", label: "Weekly" },
  { key: "other", store: "other", label: "Other" },
];

function useIncident(index: 0 | 1 | 2) {
  return useFormStore((s) => s.abuseIncidents[index]);
}

function useSetAbuseIncident() {
  return useFormStore((s) => s.setAbuseIncident);
}

type AbuseBlockProps = {
  index: 0 | 1 | 2;
  sectionNo: "5" | "6" | "7";
  idPrefix: string;
  inputClass: string;
  /** When set (Section 5), inserts the “examples of abuse” box after 5e, before 5f. */
  abuseStatutoryExamples: readonly [readonly string[], readonly string[]] | null;
};

function AbuseIncidentBlock({
  index,
  sectionNo,
  idPrefix,
  inputClass,
  abuseStatutoryExamples,
}: AbuseBlockProps) {
  const inc = useIncident(index);
  const set = useSetAbuseIncident();
  const patch = useCallback(
    (p: Partial<AbuseIncident>) => {
      set(index, p);
    },
    [index, set],
  );

  return (
    <>
      <div>
        <label
          htmlFor={`${idPrefix}-abuseDate`}
          className="text-sm font-medium text-slate-800"
        >
          {sectionNo}a. Date of abuse
        </label>
        <p className="mt-1 text-xs text-slate-500">
          Give your best estimate if you do not know the exact date.
        </p>
        <input
          id={`${idPrefix}-abuseDate`}
          name={`${idPrefix}AbuseDate`}
          type="text"
          autoComplete="off"
          value={inc.dateOfAbuse}
          onChange={(e) => patch({ dateOfAbuse: e.target.value })}
          className={inputClass}
        />
      </div>

      <fieldset className="space-y-4">
        <legend className="text-sm font-medium text-slate-800">
          {sectionNo}b. Did anyone else hear or see what happened on this day?
        </legend>
        <div className="space-y-3">
          {WITNESS_VALS.map(({ store: wv, label }) => (
            <label
              key={wv}
              className="flex cursor-pointer items-start gap-3 py-3 pr-2 pl-0.5 transition"
            >
              <input
                type="radio"
                name={`${idPrefix}AbuseWitnesses`}
                checked={inc.witnesses === wv}
                onChange={() => {
                  patch({
                    witnesses: wv,
                    witnessNames: wv === "yes" ? inc.witnessNames : "",
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

      {inc.witnesses === "yes" && (
        <div>
          <label
            htmlFor={`${idPrefix}AbuseWitnessDetail`}
            className="text-sm font-medium text-slate-800"
          >
            Give names or describe who heard or saw what happened
          </label>
          <input
            id={`${idPrefix}AbuseWitnessDetail`}
            name={`${idPrefix}AbuseWitnessDetail`}
            type="text"
            autoComplete="off"
            value={inc.witnessNames}
            onChange={(e) => patch({ witnessNames: e.target.value })}
            className={inputClass}
          />
        </div>
      )}

      <fieldset className="space-y-4">
        <legend className="text-sm font-medium text-slate-800">
          {sectionNo}c. Did the person use or threaten to use a gun or other
          weapon?
        </legend>
        <div className="space-y-3">
          <label className="flex cursor-pointer items-start gap-3 py-3 pr-2 pl-0.5 transition">
            <input
              type="radio"
              name={`${idPrefix}AbuseWeapon`}
              checked={inc.weaponUsed === "no"}
              onChange={() => {
                patch({ weaponUsed: "no", weaponDescription: "" });
              }}
              className="mt-1 size-4 shrink-0 rounded-sm border border-purple-300/80 text-purple-700 accent-purple-700 outline-none focus-visible:ring-2 focus-visible:ring-purple-700 focus-visible:ring-offset-1"
            />
            <span className="text-sm leading-relaxed text-slate-800">No</span>
          </label>
          <label className="flex cursor-pointer items-start gap-3 py-3 pr-2 pl-0.5 transition">
            <input
              type="radio"
              name={`${idPrefix}AbuseWeapon`}
              checked={inc.weaponUsed === "yes"}
              onChange={() => patch({ weaponUsed: "yes" })}
              className="mt-1 size-4 shrink-0 rounded-sm border border-purple-300/80 text-purple-700 accent-purple-700 outline-none focus-visible:ring-2 focus-visible:ring-purple-700 focus-visible:ring-offset-1"
            />
            <span className="text-sm leading-relaxed text-slate-800">Yes</span>
          </label>
        </div>
      </fieldset>

      {inc.weaponUsed === "yes" && (
        <div>
          <label
            htmlFor={`${idPrefix}AbuseWeaponDetail`}
            className="text-sm font-medium text-slate-800"
          >
            {sectionNo === "6" || sectionNo === "7"
              ? "Describe the gun or weapon"
              : "Describe the weapon"}
          </label>
          <input
            id={`${idPrefix}AbuseWeaponDetail`}
            name={`${idPrefix}AbuseWeaponDetail`}
            type="text"
            autoComplete="off"
            value={inc.weaponDescription}
            onChange={(e) => patch({ weaponDescription: e.target.value })}
            className={inputClass}
          />
        </div>
      )}

      <fieldset className="space-y-4">
        <legend className="text-sm font-medium text-slate-800">
          {sectionNo}d. Did the person cause you emotional or physical harm?
        </legend>
        <div className="space-y-3">
          <label className="flex cursor-pointer items-start gap-3 py-3 pr-2 pl-0.5 transition">
            <input
              type="radio"
              name={`${idPrefix}AbuseHarm`}
              checked={inc.harmCaused === "no"}
              onChange={() => {
                patch({ harmCaused: "no", harmDescription: "" });
              }}
              className="mt-1 size-4 shrink-0 rounded-sm border border-purple-300/80 text-purple-700 accent-purple-700 outline-none focus-visible:ring-2 focus-visible:ring-purple-700 focus-visible:ring-offset-1"
            />
            <span className="text-sm leading-relaxed text-slate-800">No</span>
          </label>
          <label className="flex cursor-pointer items-start gap-3 py-3 pr-2 pl-0.5 transition">
            <input
              type="radio"
              name={`${idPrefix}AbuseHarm`}
              checked={inc.harmCaused === "yes"}
              onChange={() => patch({ harmCaused: "yes" })}
              className="mt-1 size-4 shrink-0 rounded-sm border border-purple-300/80 text-purple-700 accent-purple-700 outline-none focus-visible:ring-2 focus-visible:ring-purple-700 focus-visible:ring-offset-1"
            />
            <span className="text-sm leading-relaxed text-slate-800">Yes</span>
          </label>
        </div>
      </fieldset>

      {inc.harmCaused === "yes" && (
        <div>
          <label
            htmlFor={`${idPrefix}AbuseHarmDetail`}
            className="text-sm font-medium text-slate-800"
          >
            Describe the harm
          </label>
          <p className="mt-1 text-xs text-slate-500">
            Keep it brief. Space is limited to one line on the official form.
          </p>
          <input
            id={`${idPrefix}AbuseHarmDetail`}
            name={`${idPrefix}AbuseHarmDetail`}
            type="text"
            autoComplete="off"
            maxLength={HARM_DETAIL_MAX_LENGTH}
            value={inc.harmDescription}
            onChange={(e) => patch({ harmDescription: e.target.value })}
            className={inputClass}
            aria-describedby={`${idPrefix}AbuseHarmDetail-counter`}
          />
          <p
            id={`${idPrefix}AbuseHarmDetail-counter`}
            className="mt-1.5 text-xs tabular-nums text-slate-500"
          >
            {inc.harmDescription.length}/{HARM_DETAIL_MAX_LENGTH}{" "}
            {index === 0
              ? "characters used"
              : "characters"}
          </p>
        </div>
      )}

      <fieldset className="space-y-4">
        <legend className="text-sm font-medium text-slate-800">
          {sectionNo}e. Did the police come?
        </legend>
        <div className="space-y-3">
          {POLICE_VALS.map(({ store: pv, label }) => (
            <label
              key={pv}
              className="flex cursor-pointer items-start gap-3 py-3 pr-2 pl-0.5 transition"
            >
              <input
                type="radio"
                name={`${idPrefix}AbusePolice`}
                checked={inc.policeCame === pv}
                onChange={() => patch({ policeCame: pv })}
                className="mt-1 size-4 shrink-0 rounded-sm border border-purple-300/80 text-purple-700 accent-purple-700 outline-none focus-visible:ring-2 focus-visible:ring-purple-700 focus-visible:ring-offset-1"
              />
              <span className="text-sm leading-relaxed text-slate-800">
                {label}
              </span>
            </label>
          ))}
        </div>
        <p className="text-xs text-slate-500">
          If the police gave you a restraining order, list it in Section 4 of
          the form.
        </p>
      </fieldset>

      {abuseStatutoryExamples && (
        <div
          className="rounded-xl border border-purple-200/90 bg-purple-50/90 px-4 py-4 sm:px-5"
          role="note"
        >
          <p className="text-sm font-bold leading-snug text-slate-900">
            Listed below are some examples of what &quot;abuse&quot; means under
            the law. Give information on any incident that you believe was
            abusive.
          </p>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 sm:gap-6">
            {abuseStatutoryExamples.map((col, colIdx) => (
              <ul
                key={colIdx}
                className="list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-slate-700"
              >
                {col.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            ))}
          </div>
        </div>
      )}

      <div>
        <label
          htmlFor={`${idPrefix}AbuseDetails`}
          className="text-sm font-medium text-slate-800"
        >
          {sectionNo}f. Details of abuse
        </label>
        <p className="mt-2 text-sm font-bold leading-snug text-slate-800">
          {sectionNo === "5" && (
            <>
              Note: You have plenty of space. Your response will be
              automatically printed on a full-page addendum (Attachment 5f) at
              the end of the form.
            </>
          )}
          {sectionNo === "6" && (
            <>
              Note: You have plenty of space. Your response will be
              automatically printed on a full-page addendum (Attachment 6f) at
              the end of the form.
            </>
          )}
          {sectionNo === "7" && (
            <>
              Note: You have plenty of space. Your response will be
              automatically printed on a full-page addendum (Attachment 7f) at
              the end of the form.
            </>
          )}
        </p>
        <textarea
          id={`${idPrefix}AbuseDetails`}
          name={`${idPrefix}AbuseDetails`}
          rows={index === 0 ? 14 : 15}
          autoComplete="off"
          value={inc.narrative}
          onChange={(e) => patch({ narrative: e.target.value })}
          className={`${inputClass} mt-3 min-h-[20rem] resize-y`}
        />
      </div>

      <fieldset className="space-y-4">
        <legend className="text-sm font-medium text-slate-800">
          {sectionNo}g. How often has the person abused you like this?
        </legend>
        <div className="space-y-3">
          {FREQ_UIS.map(({ key, store: fStore, label }) => (
            <label
              key={key}
              className="flex cursor-pointer items-start gap-3 py-3 pr-2 pl-0.5 transition"
            >
              <input
                type="radio"
                name={`${idPrefix}AbuseFrequency`}
                checked={inc.frequency === fStore}
                onChange={() => {
                  patch({
                    frequency: fStore,
                    frequencyOther: key === "other" ? inc.frequencyOther : "",
                    frequencyDates: key === "once" ? "" : inc.frequencyDates,
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

      {inc.frequency === "other" && (
        <div>
          <label
            htmlFor={`${idPrefix}AbuseFrequencyOther`}
            className="text-sm font-medium text-slate-800"
          >
            Describe how often (other)
          </label>
          <input
            id={`${idPrefix}AbuseFrequencyOther`}
            name={`${idPrefix}AbuseFrequencyOther`}
            type="text"
            autoComplete="off"
            value={inc.frequencyOther}
            onChange={(e) => patch({ frequencyOther: e.target.value })}
            className={inputClass}
          />
        </div>
      )}

      {inc.frequency !== "" && inc.frequency !== "once" && (
        <div>
          <label
            htmlFor={`${idPrefix}AbuseDates`}
            className="text-sm font-medium text-slate-800"
          >
            {sectionNo}g.{" "}
            {sectionNo === "5" ? "Dates when it happened" : "Dates or estimates of when it happened"}
          </label>
          <textarea
            id={`${idPrefix}AbuseDates`}
            name={`${idPrefix}AbuseDates`}
            rows={3}
            autoComplete="off"
            value={inc.frequencyDates}
            onChange={(e) => patch({ frequencyDates: e.target.value })}
            className={textareaClass}
          />
        </div>
      )}
    </>
  );
}

export default function Step3_DescribeAbuse({
  showAbuseIncident2,
  setShowAbuseIncident2,
  showAbuseIncident3,
  setShowAbuseIncident3,
  inputClass,
}: Step3Props) {
  const abuseExampleColumns = useMemo(() => {
    const mid = Math.ceil(SECTION5_ABUSE_EXAMPLES.length / 2);
    return [
      SECTION5_ABUSE_EXAMPLES.slice(0, mid),
      SECTION5_ABUSE_EXAMPLES.slice(mid),
    ] as const;
  }, []);

  return (
    <div className="space-y-8">
      <div
        className="flex gap-3 rounded-xl border-2 border-liz bg-liz/10 px-4 py-4 shadow-sm sm:px-5"
        role="status"
      >
        <span
          className="mt-0.5 inline-flex size-9 shrink-0 items-center justify-center rounded-full bg-liz text-sm font-bold text-white"
          aria-hidden
        >
          i
        </span>
        <p className="text-sm font-medium leading-relaxed text-purple-950">
          <span className="font-semibold">Tip:</span> Start with the most
          recent incident. You can describe up to three separate incidents on
          the official form—only the first is shown here until you choose to add
          another.
        </p>
      </div>
      <div>
        <h2 className="text-sm font-semibold text-slate-900">
          Section 5. Most recent abuse
        </h2>
        <p className="mt-1 text-sm text-slate-600">
          Answer about the most recent incident. You may estimate dates if you
          are unsure.
        </p>
      </div>

      <AbuseIncidentBlock
        index={0}
        sectionNo="5"
        idPrefix="recent"
        inputClass={inputClass}
        abuseStatutoryExamples={abuseExampleColumns}
      />

      <div className="border-t border-purple-100/90 pt-8">
        {!showAbuseIncident2 && (
          <button
            type="button"
            onClick={() => setShowAbuseIncident2(true)}
            className="inline-flex min-h-11 w-full items-center justify-center rounded-xl border border-dashed border-purple-300 bg-white px-5 py-3 text-sm font-medium text-purple-900 shadow-sm transition hover:bg-purple-50"
          >
            + Add another incident (optional)
          </button>
        )}
      </div>

      {showAbuseIncident2 && (
        <div className="space-y-8 border-t border-purple-100/90 pt-8">
          <p className="text-sm leading-relaxed text-slate-600">
            Optional: describe a{" "}
            <span className="font-medium">different</span> incident from
            Section 5 (DV-100 Section 6).
          </p>
          <div>
            <h2 className="text-sm font-semibold text-slate-900">
              Section 6. Second incident of abuse
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              Answer about a different incident from Section 5. You may
              estimate dates if you are unsure.
            </p>
          </div>
          <AbuseIncidentBlock
            index={1}
            sectionNo="6"
            idPrefix="second"
            inputClass={inputClass}
            abuseStatutoryExamples={null}
          />
          {showAbuseIncident2 && !showAbuseIncident3 && (
            <button
              type="button"
              onClick={() => setShowAbuseIncident3(true)}
              className="inline-flex min-h-11 w-full items-center justify-center rounded-xl border border-dashed border-purple-300 bg-white px-5 py-3 text-sm font-medium text-purple-900 shadow-sm transition hover:bg-purple-50"
            >
              + Add a third incident (optional)
            </button>
          )}
        </div>
      )}

      {showAbuseIncident3 && (
        <div className="space-y-8 border-t border-purple-100/90 pt-8">
          <p className="text-sm leading-relaxed text-slate-600">
            Optional: a third incident if it applies (DV-100 Section 7). Leave
            blank if not.
          </p>
          <div>
            <h2 className="text-sm font-semibold text-slate-900">
              Section 7. Third incident of abuse
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              Answer about another incident, or skip this section if it does
              not apply. You may estimate dates if you are unsure.
            </p>
          </div>
          <AbuseIncidentBlock
            index={2}
            sectionNo="7"
            idPrefix="third"
            inputClass={inputClass}
            abuseStatutoryExamples={null}
          />
        </div>
      )}
    </div>
  );
}
