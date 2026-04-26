"use client";

import { COURT_ADDRESSES, WIZARD_COUNTY_OPTIONS } from "@/lib/courtAddresses";
import { useFormStore } from "@/store/useFormStore";

type Step0VenueProps = {
  inputClass: string;
};

export default function Step0_Venue({ inputClass }: Step0VenueProps) {
  const petitionerExtras = useFormStore((s) => s.petitionerExtras);
  const setPetitionerExtras = useFormStore((s) => s.setPetitionerExtras);

  return (
    <div>
      <section aria-labelledby="venue-heading">
        <h2
          id="venue-heading"
          className="text-sm font-semibold text-slate-900"
        >
          Venue
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">
          Select the county where you live or where the abuse happened. This
          determines which court will process your forms.
        </p>
        <div className="mt-4">
          <label
            htmlFor="county"
            className="text-sm font-medium text-slate-800"
          >
            County (Superior Court)
          </label>
          <p className="mb-2 text-xs text-slate-600">
            Used for the court name and address on the petition and restraining
            order forms.{" "}
            {petitionerExtras.county
              ? COURT_ADDRESSES[petitionerExtras.county]?.split("\n").join(" · ")
              : null}
          </p>
          <select
            id="county"
            name="county"
            value={petitionerExtras.county}
            onChange={(e) => setPetitionerExtras({ county: e.target.value })}
            className={inputClass}
          >
            <option value="">Select a county</option>
            {WIZARD_COUNTY_OPTIONS.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
      </section>
    </div>
  );
}
