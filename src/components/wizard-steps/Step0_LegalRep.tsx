"use client";

import { useFormStore } from "@/store/useFormStore";

type Step0Props = {
  inputClass: string;
};

export default function Step0_LegalRep({ inputClass }: Step0Props) {
  const attorney = useFormStore((s) => s.attorney);
  const setAttorney = useFormStore((s) => s.setAttorney);

  return (
    <div className="space-y-6">
      <fieldset className="space-y-4">
        <legend className="text-sm font-medium text-slate-800">
          Is an attorney preparing or assisting with this form?
        </legend>
        <div className="space-y-3">
          <label className="flex cursor-pointer items-start gap-3 py-3 pr-2 pl-0.5 transition">
            <input
              type="radio"
              name="hasAttorney"
              checked={attorney.hasAttorney === "yes"}
              onChange={() => setAttorney({ hasAttorney: "yes" })}
              className="mt-1 size-4 shrink-0 rounded-sm border border-purple-300/80 text-purple-700 accent-purple-700 outline-none focus-visible:ring-2 focus-visible:ring-purple-700 focus-visible:ring-offset-1"
            />
            <span className="text-sm leading-relaxed text-slate-800">Yes</span>
          </label>
          <label className="flex cursor-pointer items-start gap-3 py-3 pr-2 pl-0.5 transition">
            <input
              type="radio"
              name="hasAttorney"
              checked={attorney.hasAttorney === "no"}
              onChange={() => setAttorney({ hasAttorney: "no" })}
              className="mt-1 size-4 shrink-0 rounded-sm border border-purple-300/80 text-purple-700 accent-purple-700 outline-none focus-visible:ring-2 focus-visible:ring-purple-700 focus-visible:ring-offset-1"
            />
            <span className="text-sm leading-relaxed text-slate-800">No</span>
          </label>
        </div>
      </fieldset>

      {attorney.hasAttorney === "yes" && (
        <div className="space-y-6 border-t border-purple-100/90 pt-6">
          <div>
            <label
              htmlFor="lawyerName"
              className="text-sm font-medium text-slate-800"
            >
              Lawyer&apos;s name
            </label>
            <input
              id="lawyerName"
              name="lawyerName"
              type="text"
              autoComplete="name"
              value={attorney.name}
              onChange={(e) => setAttorney({ name: e.target.value })}
              className={inputClass}
            />
          </div>
          <div>
            <label
              htmlFor="lawyerBarNo"
              className="text-sm font-medium text-slate-800"
            >
              State Bar No.
            </label>
            <input
              id="lawyerBarNo"
              name="lawyerBarNo"
              type="text"
              autoComplete="off"
              value={attorney.barNumber}
              onChange={(e) => setAttorney({ barNumber: e.target.value })}
              className={inputClass}
            />
          </div>
          <div>
            <label
              htmlFor="lawyerFirm"
              className="text-sm font-medium text-slate-800"
            >
              Firm name
            </label>
            <input
              id="lawyerFirm"
              name="lawyerFirm"
              type="text"
              autoComplete="organization"
              value={attorney.firmName}
              onChange={(e) => setAttorney({ firmName: e.target.value })}
              className={inputClass}
            />
          </div>
        </div>
      )}
    </div>
  );
}
