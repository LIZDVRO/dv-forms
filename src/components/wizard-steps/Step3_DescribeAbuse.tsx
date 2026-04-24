"use client";

import { useMemo } from "react";

import type { Dv100PdfFormData } from "@/lib/dv100-pdf";
import { formFieldTextareaClassName } from "@/components/ui/textarea";

import {
  HARM_DETAIL_MAX_LENGTH,
  SECTION5_ABUSE_EXAMPLES,
} from "./wizardShared";

type FormData = Dv100PdfFormData;

type Step3Props = {
  form: FormData;
  update: <K extends keyof FormData>(key: K, value: FormData[K]) => void;
  showAbuseIncident2: boolean;
  setShowAbuseIncident2: (v: boolean) => void;
  showAbuseIncident3: boolean;
  setShowAbuseIncident3: (v: boolean) => void;
  inputClass: string;
};

const textareaClass = formFieldTextareaClassName;

export default function Step3_DescribeAbuse({
  form,
  update,
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
      <span className="font-semibold">Tip:</span> Start with the
      most recent incident. You can describe up to three separate
      incidents on the official form—only the first is shown
      here until you choose to add another.
    </p>
  </div>
  <div>
    <h2 className="text-sm font-semibold text-slate-900">
      Section 5. Most recent abuse
    </h2>
    <p className="mt-1 text-sm text-slate-600">
      Answer about the most recent incident. You may estimate
      dates if you are unsure.
    </p>
  </div>

  <div>
    <label
      htmlFor="recentAbuseDate"
      className="text-sm font-medium text-slate-800"
    >
      5a. Date of abuse
    </label>
    <p className="mt-1 text-xs text-slate-500">
      Give your best estimate if you do not know the exact date.
    </p>
    <input
      id="recentAbuseDate"
      name="recentAbuseDate"
      type="text"
      autoComplete="off"
      value={form.recentAbuseDate}
      onChange={(e) =>
        update("recentAbuseDate", e.target.value)
      }
      className={inputClass}
    />
  </div>

  <fieldset className="space-y-4">
    <legend className="text-sm font-medium text-slate-800">
      5b. Did anyone else hear or see what happened on this day?
    </legend>
    <div className="space-y-3">
      {(
        [
          { value: "idk", label: "I don't know" },
          { value: "no", label: "No" },
          { value: "yes", label: "Yes" },
        ] as const
      ).map(({ value, label }) => (
        <label
          key={value}
          className="flex cursor-pointer items-start gap-3 py-3 pr-2 pl-0.5 transition"
        >
          <input
            type="radio"
            name="recentAbuseWitnesses"
            checked={form.recentAbuseWitnesses === value}
            onChange={() => {
              update("recentAbuseWitnesses", value);
              if (value !== "yes") {
                update("recentAbuseWitnessDetail", "");
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

  {form.recentAbuseWitnesses === "yes" && (
    <div>
      <label
        htmlFor="recentAbuseWitnessDetail"
        className="text-sm font-medium text-slate-800"
      >
        Give names or describe who heard or saw what happened
      </label>
      <input
        id="recentAbuseWitnessDetail"
        name="recentAbuseWitnessDetail"
        type="text"
        autoComplete="off"
        value={form.recentAbuseWitnessDetail}
        onChange={(e) =>
          update("recentAbuseWitnessDetail", e.target.value)
        }
        className={inputClass}
      />
    </div>
  )}

  <fieldset className="space-y-4">
    <legend className="text-sm font-medium text-slate-800">
      5c. Did the person use or threaten to use a gun or other
      weapon?
    </legend>
    <div className="space-y-3">
      <label className="flex cursor-pointer items-start gap-3 py-3 pr-2 pl-0.5 transition">
        <input
          type="radio"
          name="recentAbuseWeapon"
          checked={form.recentAbuseWeapon === "no"}
          onChange={() => {
            update("recentAbuseWeapon", "no");
            update("recentAbuseWeaponDetail", "");
          }}
          className="mt-1 size-4 shrink-0 rounded-sm border border-purple-300/80 text-purple-700 accent-purple-700 outline-none focus-visible:ring-2 focus-visible:ring-purple-700 focus-visible:ring-offset-1"
        />
        <span className="text-sm leading-relaxed text-slate-800">
          No
        </span>
      </label>
      <label className="flex cursor-pointer items-start gap-3 py-3 pr-2 pl-0.5 transition">
        <input
          type="radio"
          name="recentAbuseWeapon"
          checked={form.recentAbuseWeapon === "yes"}
          onChange={() => update("recentAbuseWeapon", "yes")}
          className="mt-1 size-4 shrink-0 rounded-sm border border-purple-300/80 text-purple-700 accent-purple-700 outline-none focus-visible:ring-2 focus-visible:ring-purple-700 focus-visible:ring-offset-1"
        />
        <span className="text-sm leading-relaxed text-slate-800">
          Yes
        </span>
      </label>
    </div>
  </fieldset>

  {form.recentAbuseWeapon === "yes" && (
    <div>
      <label
        htmlFor="recentAbuseWeaponDetail"
        className="text-sm font-medium text-slate-800"
      >
        Describe the weapon
      </label>
      <input
        id="recentAbuseWeaponDetail"
        name="recentAbuseWeaponDetail"
        type="text"
        autoComplete="off"
        value={form.recentAbuseWeaponDetail}
        onChange={(e) =>
          update("recentAbuseWeaponDetail", e.target.value)
        }
        className={inputClass}
      />
    </div>
  )}

  <fieldset className="space-y-4">
    <legend className="text-sm font-medium text-slate-800">
      5d. Did the person cause you emotional or physical harm?
    </legend>
    <div className="space-y-3">
      <label className="flex cursor-pointer items-start gap-3 py-3 pr-2 pl-0.5 transition">
        <input
          type="radio"
          name="recentAbuseHarm"
          checked={form.recentAbuseHarm === "no"}
          onChange={() => {
            update("recentAbuseHarm", "no");
            update("recentAbuseHarmDetail", "");
          }}
          className="mt-1 size-4 shrink-0 rounded-sm border border-purple-300/80 text-purple-700 accent-purple-700 outline-none focus-visible:ring-2 focus-visible:ring-purple-700 focus-visible:ring-offset-1"
        />
        <span className="text-sm leading-relaxed text-slate-800">
          No
        </span>
      </label>
      <label className="flex cursor-pointer items-start gap-3 py-3 pr-2 pl-0.5 transition">
        <input
          type="radio"
          name="recentAbuseHarm"
          checked={form.recentAbuseHarm === "yes"}
          onChange={() => update("recentAbuseHarm", "yes")}
          className="mt-1 size-4 shrink-0 rounded-sm border border-purple-300/80 text-purple-700 accent-purple-700 outline-none focus-visible:ring-2 focus-visible:ring-purple-700 focus-visible:ring-offset-1"
        />
        <span className="text-sm leading-relaxed text-slate-800">
          Yes
        </span>
      </label>
    </div>
  </fieldset>

  {form.recentAbuseHarm === "yes" && (
    <div>
      <label
        htmlFor="recentAbuseHarmDetail"
        className="text-sm font-medium text-slate-800"
      >
        Describe the harm
      </label>
      <p className="mt-1 text-xs text-slate-500">
        Keep it brief. Space is limited to one line on the
        official form.
      </p>
      <input
        id="recentAbuseHarmDetail"
        name="recentAbuseHarmDetail"
        type="text"
        autoComplete="off"
        maxLength={HARM_DETAIL_MAX_LENGTH}
        value={form.recentAbuseHarmDetail}
        onChange={(e) =>
          update("recentAbuseHarmDetail", e.target.value)
        }
        className={inputClass}
        aria-describedby="recentAbuseHarmDetail-counter"
      />
      <p
        id="recentAbuseHarmDetail-counter"
        className="mt-1.5 text-xs tabular-nums text-slate-500"
      >
        {form.recentAbuseHarmDetail.length}/
        {HARM_DETAIL_MAX_LENGTH} characters used
      </p>
    </div>
  )}

  <fieldset className="space-y-4">
    <legend className="text-sm font-medium text-slate-800">
      5e. Did the police come?
    </legend>
    <div className="space-y-3">
      {(
        [
          { value: "idk", label: "I don't know" },
          { value: "no", label: "No" },
          { value: "yes", label: "Yes" },
        ] as const
      ).map(({ value, label }) => (
        <label
          key={value}
          className="flex cursor-pointer items-start gap-3 py-3 pr-2 pl-0.5 transition"
        >
          <input
            type="radio"
            name="recentAbusePolice"
            checked={form.recentAbusePolice === value}
            onChange={() => update("recentAbusePolice", value)}
            className="mt-1 size-4 shrink-0 rounded-sm border border-purple-300/80 text-purple-700 accent-purple-700 outline-none focus-visible:ring-2 focus-visible:ring-purple-700 focus-visible:ring-offset-1"
          />
          <span className="text-sm leading-relaxed text-slate-800">
            {label}
          </span>
        </label>
      ))}
    </div>
    <p className="text-xs text-slate-500">
      If the police gave you a restraining order, list it in
      Section 4 of the form.
    </p>
  </fieldset>

  <div
    className="rounded-xl border border-purple-200/90 bg-purple-50/90 px-4 py-4 sm:px-5"
    role="note"
  >
    <p className="text-sm font-bold leading-snug text-slate-900">
      Listed below are some examples of what &quot;abuse&quot;
      means under the law. Give information on any incident that
      you believe was abusive.
    </p>
    <div className="mt-4 grid gap-4 sm:grid-cols-2 sm:gap-6">
      {abuseExampleColumns.map((col, colIdx) => (
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

  <div>
    <label
      htmlFor="recentAbuseDetails"
      className="text-sm font-medium text-slate-800"
    >
      5f. Details of abuse
    </label>
    <p className="mt-2 text-sm font-bold leading-snug text-slate-800">
      Note: You have plenty of space. Your response will be
      automatically printed on a full-page addendum
      (Attachment 5f) at the end of the form.
    </p>
    <textarea
      id="recentAbuseDetails"
      name="recentAbuseDetails"
      rows={14}
      autoComplete="off"
      value={form.recentAbuseDetails}
      onChange={(e) =>
        update("recentAbuseDetails", e.target.value)
      }
      className={`${inputClass} mt-3 min-h-[20rem] resize-y`}
    />
  </div>

  <fieldset className="space-y-4">
    <legend className="text-sm font-medium text-slate-800">
      5g. How often has the person abused you like this?
    </legend>
    <div className="space-y-3">
      {(
        [
          { value: "once", label: "Just this once" },
          { value: "2-5", label: "2–5 times" },
          { value: "weekly", label: "Weekly" },
          { value: "other", label: "Other" },
        ] as const
      ).map(({ value, label }) => (
        <label
          key={value}
          className="flex cursor-pointer items-start gap-3 py-3 pr-2 pl-0.5 transition"
        >
          <input
            type="radio"
            name="recentAbuseFrequency"
            checked={form.recentAbuseFrequency === value}
            onChange={() => {
              update("recentAbuseFrequency", value);
              if (value !== "other") {
                update("recentAbuseFrequencyOther", "");
              }
              if (value === "once") {
                update("recentAbuseDates", "");
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

  {form.recentAbuseFrequency === "other" && (
    <div>
      <label
        htmlFor="recentAbuseFrequencyOther"
        className="text-sm font-medium text-slate-800"
      >
        Describe how often (other)
      </label>
      <input
        id="recentAbuseFrequencyOther"
        name="recentAbuseFrequencyOther"
        type="text"
        autoComplete="off"
        value={form.recentAbuseFrequencyOther}
        onChange={(e) =>
          update("recentAbuseFrequencyOther", e.target.value)
        }
        className={inputClass}
      />
    </div>
  )}

  {form.recentAbuseFrequency !== "" &&
    form.recentAbuseFrequency !== "once" && (
      <div>
        <label
          htmlFor="recentAbuseDates"
          className="text-sm font-medium text-slate-800"
        >
          5g. Dates when it happened
        </label>
        <textarea
          id="recentAbuseDates"
          name="recentAbuseDates"
          rows={3}
          autoComplete="off"
          value={form.recentAbuseDates}
          onChange={(e) =>
            update("recentAbuseDates", e.target.value)
          }
          className={textareaClass}
        />
      </div>
    )}
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
        Optional: describe a <span className="font-medium">different</span> incident from Section 5 (DV-100 Section 6).
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
      <div>
        <label
          htmlFor="secondAbuseDate"
          className="text-sm font-medium text-slate-800"
        >
          6a. Date of abuse
        </label>
        <p className="mt-1 text-xs text-slate-500">
          Give your best estimate if you do not know the exact date.
        </p>
        <input
          id="secondAbuseDate"
          name="secondAbuseDate"
          type="text"
          autoComplete="off"
          value={form.secondAbuseDate}
          onChange={(e) =>
            update("secondAbuseDate", e.target.value)
          }
          className={inputClass}
        />
      </div>
      <fieldset className="space-y-4">
        <legend className="text-sm font-medium text-slate-800">
          6b. Did anyone else hear or see what happened on this
          day?
        </legend>
        <div className="space-y-3">
          {(
            [
              { value: "idk", label: "I don't know" },
              { value: "no", label: "No" },
              { value: "yes", label: "Yes" },
            ] as const
          ).map(({ value, label }) => (
            <label
              key={value}
              className="flex cursor-pointer items-start gap-3 py-3 pr-2 pl-0.5 transition"
            >
              <input
                type="radio"
                name="secondAbuseWitnesses"
                checked={form.secondAbuseWitnesses === value}
                onChange={() => {
                  update("secondAbuseWitnesses", value);
                  if (value !== "yes") {
                    update("secondAbuseWitnessDetail", "");
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
      {form.secondAbuseWitnesses === "yes" && (
        <div>
          <label
            htmlFor="secondAbuseWitnessDetail"
            className="text-sm font-medium text-slate-800"
          >
            Give names or describe who heard or saw what happened
          </label>
          <input
            id="secondAbuseWitnessDetail"
            name="secondAbuseWitnessDetail"
            type="text"
            autoComplete="off"
            value={form.secondAbuseWitnessDetail}
            onChange={(e) =>
              update("secondAbuseWitnessDetail", e.target.value)
            }
            className={inputClass}
          />
        </div>
      )}
      <fieldset className="space-y-4">
        <legend className="text-sm font-medium text-slate-800">
          6c. Did the person use or threaten to use a gun or other
          weapon?
        </legend>
        <div className="space-y-3">
          <label className="flex cursor-pointer items-start gap-3 py-3 pr-2 pl-0.5 transition">
            <input
              type="radio"
              name="secondAbuseWeapon"
              checked={form.secondAbuseWeapon === "no"}
              onChange={() => {
                update("secondAbuseWeapon", "no");
                update("secondAbuseWeaponDetail", "");
              }}
              className="mt-1 size-4 shrink-0 rounded-sm border border-purple-300/80 text-purple-700 accent-purple-700 outline-none focus-visible:ring-2 focus-visible:ring-purple-700 focus-visible:ring-offset-1"
            />
            <span className="text-sm leading-relaxed text-slate-800">
              No
            </span>
          </label>
          <label className="flex cursor-pointer items-start gap-3 py-3 pr-2 pl-0.5 transition">
            <input
              type="radio"
              name="secondAbuseWeapon"
              checked={form.secondAbuseWeapon === "yes"}
              onChange={() => update("secondAbuseWeapon", "yes")}
              className="mt-1 size-4 shrink-0 rounded-sm border border-purple-300/80 text-purple-700 accent-purple-700 outline-none focus-visible:ring-2 focus-visible:ring-purple-700 focus-visible:ring-offset-1"
            />
            <span className="text-sm leading-relaxed text-slate-800">
              Yes
            </span>
          </label>
        </div>
      </fieldset>
      {form.secondAbuseWeapon === "yes" && (
        <div>
          <label
            htmlFor="secondAbuseWeaponDetail"
            className="text-sm font-medium text-slate-800"
          >
            Describe the gun or weapon
          </label>
          <input
            id="secondAbuseWeaponDetail"
            name="secondAbuseWeaponDetail"
            type="text"
            autoComplete="off"
            value={form.secondAbuseWeaponDetail}
            onChange={(e) =>
              update("secondAbuseWeaponDetail", e.target.value)
            }
            className={inputClass}
          />
        </div>
      )}
      <fieldset className="space-y-4">
        <legend className="text-sm font-medium text-slate-800">
          6d. Did the person cause you emotional or physical harm?
        </legend>
        <div className="space-y-3">
          <label className="flex cursor-pointer items-start gap-3 py-3 pr-2 pl-0.5 transition">
            <input
              type="radio"
              name="secondAbuseHarm"
              checked={form.secondAbuseHarm === "no"}
              onChange={() => {
                update("secondAbuseHarm", "no");
                update("secondAbuseHarmDetail", "");
              }}
              className="mt-1 size-4 shrink-0 rounded-sm border border-purple-300/80 text-purple-700 accent-purple-700 outline-none focus-visible:ring-2 focus-visible:ring-purple-700 focus-visible:ring-offset-1"
            />
            <span className="text-sm leading-relaxed text-slate-800">
              No
            </span>
          </label>
          <label className="flex cursor-pointer items-start gap-3 py-3 pr-2 pl-0.5 transition">
            <input
              type="radio"
              name="secondAbuseHarm"
              checked={form.secondAbuseHarm === "yes"}
              onChange={() => update("secondAbuseHarm", "yes")}
              className="mt-1 size-4 shrink-0 rounded-sm border border-purple-300/80 text-purple-700 accent-purple-700 outline-none focus-visible:ring-2 focus-visible:ring-purple-700 focus-visible:ring-offset-1"
            />
            <span className="text-sm leading-relaxed text-slate-800">
              Yes
            </span>
          </label>
        </div>
      </fieldset>
      {form.secondAbuseHarm === "yes" && (
        <div>
          <label
            htmlFor="secondAbuseHarmDetail"
            className="text-sm font-medium text-slate-800"
          >
            Describe the harm
          </label>
          <p className="mt-1 text-xs text-slate-500">
            Keep it brief. Space is limited to one line on the
            official form.
          </p>
          <input
            id="secondAbuseHarmDetail"
            name="secondAbuseHarmDetail"
            type="text"
            autoComplete="off"
            maxLength={HARM_DETAIL_MAX_LENGTH}
            value={form.secondAbuseHarmDetail}
            onChange={(e) =>
              update("secondAbuseHarmDetail", e.target.value)
            }
            className={inputClass}
            aria-describedby="secondAbuseHarmDetail-counter"
          />
          <p
            id="secondAbuseHarmDetail-counter"
            className="mt-1.5 text-xs tabular-nums text-slate-500"
          >
            {form.secondAbuseHarmDetail.length}/
            {HARM_DETAIL_MAX_LENGTH} characters
          </p>
        </div>
      )}
      <fieldset className="space-y-4">
        <legend className="text-sm font-medium text-slate-800">
          6e. Did the police come?
        </legend>
        <div className="space-y-3">
          {(
            [
              { value: "idk", label: "I don't know" },
              { value: "no", label: "No" },
              { value: "yes", label: "Yes" },
            ] as const
          ).map(({ value, label }) => (
            <label
              key={value}
              className="flex cursor-pointer items-start gap-3 py-3 pr-2 pl-0.5 transition"
            >
              <input
                type="radio"
                name="secondAbusePolice"
                checked={form.secondAbusePolice === value}
                onChange={() =>
                  update("secondAbusePolice", value)
                }
                className="mt-1 size-4 shrink-0 rounded-sm border border-purple-300/80 text-purple-700 accent-purple-700 outline-none focus-visible:ring-2 focus-visible:ring-purple-700 focus-visible:ring-offset-1"
              />
              <span className="text-sm leading-relaxed text-slate-800">
                {label}
              </span>
            </label>
          ))}
        </div>
        <p className="text-xs text-slate-500">
          If the police gave you a restraining order, list it in
          Section 4 of the form.
        </p>
      </fieldset>
      <div>
        <label
          htmlFor="secondAbuseDetails"
          className="text-sm font-medium text-slate-800"
        >
          6f. Details of abuse
        </label>
        <p className="mt-2 text-sm font-bold leading-snug text-slate-800">
          Note: You have plenty of space. Your response will be
          automatically printed on a full-page addendum (Attachment
          6f) at the end of the form.
        </p>
        <textarea
          id="secondAbuseDetails"
          name="secondAbuseDetails"
          rows={15}
          autoComplete="off"
          value={form.secondAbuseDetails}
          onChange={(e) =>
            update("secondAbuseDetails", e.target.value)
          }
          className={`${inputClass} mt-3 min-h-[20rem] resize-y`}
        />
      </div>
      <fieldset className="space-y-4">
        <legend className="text-sm font-medium text-slate-800">
          6g. How often has the person abused you like this?
        </legend>
        <div className="space-y-3">
          {(
            [
              { value: "once", label: "Just this once" },
              { value: "2-5", label: "2–5 times" },
              { value: "weekly", label: "Weekly" },
              { value: "other", label: "Other" },
            ] as const
          ).map(({ value, label }) => (
            <label
              key={value}
              className="flex cursor-pointer items-start gap-3 py-3 pr-2 pl-0.5 transition"
            >
              <input
                type="radio"
                name="secondAbuseFrequency"
                checked={form.secondAbuseFrequency === value}
                onChange={() => {
                  update("secondAbuseFrequency", value);
                  if (value !== "other") {
                    update("secondAbuseFrequencyOther", "");
                  }
                  if (value === "once") {
                    update("secondAbuseDates", "");
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
      {form.secondAbuseFrequency === "other" && (
        <div>
          <label
            htmlFor="secondAbuseFrequencyOther"
            className="text-sm font-medium text-slate-800"
          >
            Describe how often (other)
          </label>
          <input
            id="secondAbuseFrequencyOther"
            name="secondAbuseFrequencyOther"
            type="text"
            autoComplete="off"
            value={form.secondAbuseFrequencyOther}
            onChange={(e) =>
              update("secondAbuseFrequencyOther", e.target.value)
            }
            className={inputClass}
          />
        </div>
      )}
      {form.secondAbuseFrequency !== "" &&
        form.secondAbuseFrequency !== "once" && (
          <div>
            <label
              htmlFor="secondAbuseDates"
              className="text-sm font-medium text-slate-800"
            >
              6g. Dates or estimates of when it happened
            </label>
            <textarea
              id="secondAbuseDates"
              name="secondAbuseDates"
              rows={3}
              autoComplete="off"
              value={form.secondAbuseDates}
              onChange={(e) =>
                update("secondAbuseDates", e.target.value)
              }
              className={textareaClass}
            />
          </div>
        )}
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
        Optional: a third incident if it applies (DV-100 Section 7). Leave blank if not.
      </p>
      <div>
        <h2 className="text-sm font-semibold text-slate-900">
          Section 7. Third incident of abuse
        </h2>
        <p className="mt-1 text-sm text-slate-600">
          Answer about another incident, or skip this section if it
          does not apply. You may estimate dates if you are unsure.
        </p>
      </div>
      <div>
        <label
          htmlFor="thirdAbuseDate"
          className="text-sm font-medium text-slate-800"
        >
          7a. Date of abuse
        </label>
        <p className="mt-1 text-xs text-slate-500">
          Give your best estimate if you do not know the exact date.
        </p>
        <input
          id="thirdAbuseDate"
          name="thirdAbuseDate"
          type="text"
          autoComplete="off"
          value={form.thirdAbuseDate}
          onChange={(e) =>
            update("thirdAbuseDate", e.target.value)
          }
          className={inputClass}
        />
      </div>
      <fieldset className="space-y-4">
        <legend className="text-sm font-medium text-slate-800">
          7b. Did anyone else hear or see what happened on this
          day?
        </legend>
        <div className="space-y-3">
          {(
            [
              { value: "idk", label: "I don't know" },
              { value: "no", label: "No" },
              { value: "yes", label: "Yes" },
            ] as const
          ).map(({ value, label }) => (
            <label
              key={value}
              className="flex cursor-pointer items-start gap-3 py-3 pr-2 pl-0.5 transition"
            >
              <input
                type="radio"
                name="thirdAbuseWitnesses"
                checked={form.thirdAbuseWitnesses === value}
                onChange={() => {
                  update("thirdAbuseWitnesses", value);
                  if (value !== "yes") {
                    update("thirdAbuseWitnessDetail", "");
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
      {form.thirdAbuseWitnesses === "yes" && (
        <div>
          <label
            htmlFor="thirdAbuseWitnessDetail"
            className="text-sm font-medium text-slate-800"
          >
            Give names or describe who heard or saw what happened
          </label>
          <input
            id="thirdAbuseWitnessDetail"
            name="thirdAbuseWitnessDetail"
            type="text"
            autoComplete="off"
            value={form.thirdAbuseWitnessDetail}
            onChange={(e) =>
              update("thirdAbuseWitnessDetail", e.target.value)
            }
            className={inputClass}
          />
        </div>
      )}
      <fieldset className="space-y-4">
        <legend className="text-sm font-medium text-slate-800">
          7c. Did the person use or threaten to use a gun or other
          weapon?
        </legend>
        <div className="space-y-3">
          <label className="flex cursor-pointer items-start gap-3 py-3 pr-2 pl-0.5 transition">
            <input
              type="radio"
              name="thirdAbuseWeapon"
              checked={form.thirdAbuseWeapon === "no"}
              onChange={() => {
                update("thirdAbuseWeapon", "no");
                update("thirdAbuseWeaponDetail", "");
              }}
              className="mt-1 size-4 shrink-0 rounded-sm border border-purple-300/80 text-purple-700 accent-purple-700 outline-none focus-visible:ring-2 focus-visible:ring-purple-700 focus-visible:ring-offset-1"
            />
            <span className="text-sm leading-relaxed text-slate-800">
              No
            </span>
          </label>
          <label className="flex cursor-pointer items-start gap-3 py-3 pr-2 pl-0.5 transition">
            <input
              type="radio"
              name="thirdAbuseWeapon"
              checked={form.thirdAbuseWeapon === "yes"}
              onChange={() => update("thirdAbuseWeapon", "yes")}
              className="mt-1 size-4 shrink-0 rounded-sm border border-purple-300/80 text-purple-700 accent-purple-700 outline-none focus-visible:ring-2 focus-visible:ring-purple-700 focus-visible:ring-offset-1"
            />
            <span className="text-sm leading-relaxed text-slate-800">
              Yes
            </span>
          </label>
        </div>
      </fieldset>
      {form.thirdAbuseWeapon === "yes" && (
        <div>
          <label
            htmlFor="thirdAbuseWeaponDetail"
            className="text-sm font-medium text-slate-800"
          >
            Describe the gun or weapon
          </label>
          <input
            id="thirdAbuseWeaponDetail"
            name="thirdAbuseWeaponDetail"
            type="text"
            autoComplete="off"
            value={form.thirdAbuseWeaponDetail}
            onChange={(e) =>
              update("thirdAbuseWeaponDetail", e.target.value)
            }
            className={inputClass}
          />
        </div>
      )}
      <fieldset className="space-y-4">
        <legend className="text-sm font-medium text-slate-800">
          7d. Did the person cause you emotional or physical harm?
        </legend>
        <div className="space-y-3">
          <label className="flex cursor-pointer items-start gap-3 py-3 pr-2 pl-0.5 transition">
            <input
              type="radio"
              name="thirdAbuseHarm"
              checked={form.thirdAbuseHarm === "no"}
              onChange={() => {
                update("thirdAbuseHarm", "no");
                update("thirdAbuseHarmDetail", "");
              }}
              className="mt-1 size-4 shrink-0 rounded-sm border border-purple-300/80 text-purple-700 accent-purple-700 outline-none focus-visible:ring-2 focus-visible:ring-purple-700 focus-visible:ring-offset-1"
            />
            <span className="text-sm leading-relaxed text-slate-800">
              No
            </span>
          </label>
          <label className="flex cursor-pointer items-start gap-3 py-3 pr-2 pl-0.5 transition">
            <input
              type="radio"
              name="thirdAbuseHarm"
              checked={form.thirdAbuseHarm === "yes"}
              onChange={() => update("thirdAbuseHarm", "yes")}
              className="mt-1 size-4 shrink-0 rounded-sm border border-purple-300/80 text-purple-700 accent-purple-700 outline-none focus-visible:ring-2 focus-visible:ring-purple-700 focus-visible:ring-offset-1"
            />
            <span className="text-sm leading-relaxed text-slate-800">
              Yes
            </span>
          </label>
        </div>
      </fieldset>
      {form.thirdAbuseHarm === "yes" && (
        <div>
          <label
            htmlFor="thirdAbuseHarmDetail"
            className="text-sm font-medium text-slate-800"
          >
            Describe the harm
          </label>
          <p className="mt-1 text-xs text-slate-500">
            Keep it brief. Space is limited to one line on the
            official form.
          </p>
          <input
            id="thirdAbuseHarmDetail"
            name="thirdAbuseHarmDetail"
            type="text"
            autoComplete="off"
            maxLength={HARM_DETAIL_MAX_LENGTH}
            value={form.thirdAbuseHarmDetail}
            onChange={(e) =>
              update("thirdAbuseHarmDetail", e.target.value)
            }
            className={inputClass}
            aria-describedby="thirdAbuseHarmDetail-counter"
          />
          <p
            id="thirdAbuseHarmDetail-counter"
            className="mt-1.5 text-xs tabular-nums text-slate-500"
          >
            {form.thirdAbuseHarmDetail.length}/
            {HARM_DETAIL_MAX_LENGTH} characters
          </p>
        </div>
      )}
      <fieldset className="space-y-4">
        <legend className="text-sm font-medium text-slate-800">
          7e. Did the police come?
        </legend>
        <div className="space-y-3">
          {(
            [
              { value: "idk", label: "I don't know" },
              { value: "no", label: "No" },
              { value: "yes", label: "Yes" },
            ] as const
          ).map(({ value, label }) => (
            <label
              key={value}
              className="flex cursor-pointer items-start gap-3 py-3 pr-2 pl-0.5 transition"
            >
              <input
                type="radio"
                name="thirdAbusePolice"
                checked={form.thirdAbusePolice === value}
                onChange={() =>
                  update("thirdAbusePolice", value)
                }
                className="mt-1 size-4 shrink-0 rounded-sm border border-purple-300/80 text-purple-700 accent-purple-700 outline-none focus-visible:ring-2 focus-visible:ring-purple-700 focus-visible:ring-offset-1"
              />
              <span className="text-sm leading-relaxed text-slate-800">
                {label}
              </span>
            </label>
          ))}
        </div>
        <p className="text-xs text-slate-500">
          If the police gave you a restraining order, list it in
          Section 4 of the form.
        </p>
      </fieldset>
      <div>
        <label
          htmlFor="thirdAbuseDetails"
          className="text-sm font-medium text-slate-800"
        >
          7f. Details of abuse
        </label>
        <p className="mt-2 text-sm font-bold leading-snug text-slate-800">
          Note: You have plenty of space. Your response will be
          automatically printed on a full-page addendum (Attachment
          7f) at the end of the form.
        </p>
        <textarea
          id="thirdAbuseDetails"
          name="thirdAbuseDetails"
          rows={15}
          autoComplete="off"
          value={form.thirdAbuseDetails}
          onChange={(e) =>
            update("thirdAbuseDetails", e.target.value)
          }
          className={`${inputClass} mt-3 min-h-[20rem] resize-y`}
        />
      </div>
      <fieldset className="space-y-4">
        <legend className="text-sm font-medium text-slate-800">
          7g. How often has the person abused you like this?
        </legend>
        <div className="space-y-3">
          {(
            [
              { value: "once", label: "Just this once" },
              { value: "2-5", label: "2–5 times" },
              { value: "weekly", label: "Weekly" },
              { value: "other", label: "Other" },
            ] as const
          ).map(({ value, label }) => (
            <label
              key={value}
              className="flex cursor-pointer items-start gap-3 py-3 pr-2 pl-0.5 transition"
            >
              <input
                type="radio"
                name="thirdAbuseFrequency"
                checked={form.thirdAbuseFrequency === value}
                onChange={() => {
                  update("thirdAbuseFrequency", value);
                  if (value !== "other") {
                    update("thirdAbuseFrequencyOther", "");
                  }
                  if (value === "once") {
                    update("thirdAbuseDates", "");
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
      {form.thirdAbuseFrequency === "other" && (
        <div>
          <label
            htmlFor="thirdAbuseFrequencyOther"
            className="text-sm font-medium text-slate-800"
          >
            Describe how often (other)
          </label>
          <input
            id="thirdAbuseFrequencyOther"
            name="thirdAbuseFrequencyOther"
            type="text"
            autoComplete="off"
            value={form.thirdAbuseFrequencyOther}
            onChange={(e) =>
              update("thirdAbuseFrequencyOther", e.target.value)
            }
            className={inputClass}
          />
        </div>
      )}
      {form.thirdAbuseFrequency !== "" &&
        form.thirdAbuseFrequency !== "once" && (
          <div>
            <label
              htmlFor="thirdAbuseDates"
              className="text-sm font-medium text-slate-800"
            >
              7g. Dates or estimates of when it happened
            </label>
            <textarea
              id="thirdAbuseDates"
              name="thirdAbuseDates"
              rows={3}
              autoComplete="off"
              value={form.thirdAbuseDates}
              onChange={(e) =>
                update("thirdAbuseDates", e.target.value)
              }
              className={textareaClass}
            />
          </div>
        )}
    </div>
  )}

</div>
  );
}
