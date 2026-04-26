"use client";

import { useFormStore } from "@/store/useFormStore";

import { invoiceFieldInputClassName } from "./wizardShared";

type Step10Props = {
  inputClass: string;
};

const CUSTODY_OPTS = [
  { value: "" as const, label: "Select…" },
  { value: "soleToMe" as const, label: "Sole to me" },
  { value: "soleToThem" as const, label: "Sole to them" },
  { value: "joint" as const, label: "Joint" },
  { value: "other" as const, label: "Other" },
] as const;

export default function Step10_Custody({ inputClass }: Step10Props) {
  const custody = useFormStore((s) => s.custodyOrders);
  const setCustodyOrders = useFormStore((s) => s.setCustodyOrders);

  return (
    <div className="space-y-10">
      <section className="space-y-4">
        <p className="text-sm font-medium text-slate-800">Legal custody</p>
        <select
          aria-label="Legal custody"
          value={custody.legalCustody}
          onChange={(e) =>
            setCustodyOrders({
              legalCustody: e.target.value as (typeof CUSTODY_OPTS)[number]["value"],
            })
          }
          className={inputClass}
        >
          {CUSTODY_OPTS.map((o) => (
            <option key={o.value || "unset"} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        {custody.legalCustody === "other" && (
          <div>
            <label
              htmlFor="legalCustodyOther"
              className="text-sm font-medium text-slate-800"
            >
              Describe
            </label>
            <input
              id="legalCustodyOther"
              type="text"
              value={custody.legalCustodyOther}
              onChange={(e) =>
                setCustodyOrders({ legalCustodyOther: e.target.value })
              }
              className={invoiceFieldInputClassName}
            />
          </div>
        )}
      </section>

      <section className="space-y-4 border-t border-purple-100/90 pt-8">
        <p className="text-sm font-medium text-slate-800">Physical custody</p>
        <select
          aria-label="Physical custody"
          value={custody.physicalCustody}
          onChange={(e) =>
            setCustodyOrders({
              physicalCustody: e.target.value as (typeof CUSTODY_OPTS)[number]["value"],
            })
          }
          className={inputClass}
        >
          {CUSTODY_OPTS.map((o) => (
            <option key={`p-${o.value || "unset"}`} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        {custody.physicalCustody === "other" && (
          <div>
            <label
              htmlFor="physicalCustodyOther"
              className="text-sm font-medium text-slate-800"
            >
              Describe
            </label>
            <input
              id="physicalCustodyOther"
              type="text"
              value={custody.physicalCustodyOther}
              onChange={(e) =>
                setCustodyOrders({ physicalCustodyOther: e.target.value })
              }
              className={invoiceFieldInputClassName}
            />
          </div>
        )}
      </section>

      <section className="space-y-4 border-t border-purple-100/90 pt-8">
        <p className="text-sm font-medium text-slate-800">Visitation</p>
        <fieldset className="space-y-3">
          <legend className="sr-only">Visitation type</legend>
          {(
            [
              {
                key: "none" as const,
                label: "No visits",
                patch: {
                  visitationType: "none" as const,
                  wantsSupervised: "" as const,
                },
              },
              {
                key: "supervised",
                label: "Supervised",
                patch: {
                  visitationType: "yes" as const,
                  wantsSupervised: "yes" as const,
                },
              },
              {
                key: "unsupervised",
                label: "Unsupervised",
                patch: {
                  visitationType: "yes" as const,
                  wantsSupervised: "no" as const,
                },
              },
              {
                key: "virtual",
                label: "Virtual only",
                patch: {
                  visitationType: "virtualOnly" as const,
                  wantsSupervised: "" as const,
                },
              },
            ] as const
          ).map(({ key, label, patch }) => {
            const checked =
              key === "none"
                ? custody.visitationType === "none"
                : key === "virtual"
                  ? custody.visitationType === "virtualOnly"
                  : key === "supervised"
                    ? custody.visitationType === "yes" &&
                      custody.wantsSupervised === "yes"
                    : custody.visitationType === "yes" &&
                      custody.wantsSupervised === "no";
            return (
              <label
                key={key}
                className="flex cursor-pointer items-start gap-3 py-3 pr-2 pl-0.5 transition"
              >
                <input
                  type="radio"
                  name="visitationTypeUi"
                  checked={checked}
                  onChange={() => setCustodyOrders(patch)}
                  className="mt-1 size-4 shrink-0 rounded-sm border border-purple-300/80 text-purple-700 accent-purple-700 outline-none focus-visible:ring-2 focus-visible:ring-purple-700 focus-visible:ring-offset-1"
                />
                <span className="text-sm leading-relaxed text-slate-800">
                  {label}
                </span>
              </label>
            );
          })}
        </fieldset>
      </section>

      <p
        className="rounded-xl border border-purple-100 bg-purple-50/50 px-4 py-3 text-sm text-purple-950"
        role="note"
      >
        A full DV-105 parenting schedule can be added in a later update. For now,
        capture your preferences above.
      </p>
    </div>
  );
}
