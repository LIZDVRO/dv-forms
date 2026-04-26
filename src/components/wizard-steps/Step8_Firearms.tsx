"use client";

import { useEffect, useState } from "react";

import { useFormStore, type FirearmRow } from "@/store/useFormStore";

type Step8FirearmsProps = {
  inputClass: string;
};

const MAX_FIREARMS = 6;

function blankFirearmRow(): FirearmRow {
  return { description: "", numberOrAmount: "", location: "" };
}

export default function Step8_Firearms({ inputClass }: Step8FirearmsProps) {
  const firearms = useFormStore((s) => s.firearms);
  const setFirearms = useFormStore((s) => s.setFirearms);
  const [visibleFirearmRows, setVisibleFirearmRows] = useState(1);

  useEffect(() => {
    if (firearms.hasFirearms !== "yes") {
      setVisibleFirearmRows(1);
      return;
    }
    const n = firearms.firearms.length;
    if (n === 0) {
      return;
    }
    setVisibleFirearmRows((v) => Math.max(v, Math.min(MAX_FIREARMS, n)));
  }, [firearms.firearms.length, firearms.hasFirearms]);

  const setFirearmRow = (index: number, patch: Partial<FirearmRow>) => {
    const rows = useFormStore.getState().firearms.firearms;
    setFirearms({
      firearms: rows.map((r, i) => (i === index ? { ...r, ...patch } : r)),
    });
  };

  return (
    <div className="space-y-8">
      <fieldset className="space-y-4">
        <legend className="text-sm font-medium text-slate-800">
          Does the person causing harm have firearms?
        </legend>
        <div className="space-y-3">
          {(
            [
              { value: "dontKnow" as const, label: "Don't know" },
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
                checked={firearms.hasFirearms === value}
                onChange={() => setFirearms({ hasFirearms: value })}
                className="mt-1 size-4 shrink-0 rounded-sm border border-purple-300/80 text-purple-700 accent-purple-700 outline-none focus-visible:ring-2 focus-visible:ring-purple-700 focus-visible:ring-offset-1"
              />
              <span className="text-sm leading-relaxed text-slate-800">{label}</span>
            </label>
          ))}
        </div>
      </fieldset>

      {firearms.hasFirearms === "yes" && (
        <div className="space-y-6">
          {firearms.firearms
            .slice(0, Math.min(MAX_FIREARMS, Math.max(1, visibleFirearmRows)))
            .map((row, index) => (
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
                      setFirearmRow(index, { description: e.target.value })
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
                    value={row.numberOrAmount}
                    onChange={(e) =>
                      setFirearmRow(index, { numberOrAmount: e.target.value })
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
                      setFirearmRow(index, { location: e.target.value })
                    }
                    className={inputClass}
                  />
                </div>
              </div>
            ))}
          {visibleFirearmRows < MAX_FIREARMS && (
            <button
              type="button"
              onClick={() => {
                const countAfter = Math.min(
                  MAX_FIREARMS,
                  visibleFirearmRows + 1,
                );
                if (firearms.firearms.length < countAfter) {
                  setFirearms({
                    firearms: [
                      ...useFormStore.getState().firearms.firearms,
                      blankFirearmRow(),
                    ],
                  });
                }
                setVisibleFirearmRows(countAfter);
              }}
              className="inline-flex min-h-11 items-center justify-center rounded-xl border border-purple-200 bg-white px-5 py-2.5 text-sm font-medium text-purple-800 shadow-sm transition hover:bg-purple-50"
            >
              Add Firearm
            </button>
          )}
        </div>
      )}
    </div>
  );
}
