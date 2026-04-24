"use client";

import type { Dv100PdfFormData } from "@/lib/dv100-pdf";

type FormData = Dv100PdfFormData;

type Step0Props = {
  form: FormData;
  update: <K extends keyof FormData>(key: K, value: FormData[K]) => void;
  inputClass: string;
};

export default function Step0_LegalRep({
  form,
  update,
  inputClass,
}: Step0Props) {
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
              name="hasLawyer"
              checked={form.hasLawyer === true}
              onChange={() => update("hasLawyer", true)}
              className="mt-1 size-4 shrink-0 rounded-sm border border-purple-300/80 text-purple-700 accent-purple-700 outline-none focus-visible:ring-2 focus-visible:ring-purple-700 focus-visible:ring-offset-1"
            />
            <span className="text-sm leading-relaxed text-slate-800">Yes</span>
          </label>
          <label className="flex cursor-pointer items-start gap-3 py-3 pr-2 pl-0.5 transition">
            <input
              type="radio"
              name="hasLawyer"
              checked={form.hasLawyer === false}
              onChange={() => update("hasLawyer", false)}
              className="mt-1 size-4 shrink-0 rounded-sm border border-purple-300/80 text-purple-700 accent-purple-700 outline-none focus-visible:ring-2 focus-visible:ring-purple-700 focus-visible:ring-offset-1"
            />
            <span className="text-sm leading-relaxed text-slate-800">No</span>
          </label>
        </div>
      </fieldset>

      {form.hasLawyer && (
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
              value={form.lawyerName}
              onChange={(e) => update("lawyerName", e.target.value)}
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
              value={form.lawyerBarNo}
              onChange={(e) => update("lawyerBarNo", e.target.value)}
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
              value={form.lawyerFirm}
              onChange={(e) => update("lawyerFirm", e.target.value)}
              className={inputClass}
            />
          </div>
        </div>
      )}
    </div>
  );
}
