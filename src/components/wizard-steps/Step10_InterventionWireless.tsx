"use client";

import type { Dispatch, SetStateAction } from "react";

import type {
  Dv100PdfFormData,
  Dv100WirelessAccountRow,
} from "@/lib/dv100-pdf";
import { emptyWirelessAccounts } from "@/lib/dv100-pdf";

type FormData = Dv100PdfFormData;

type Step10Props = {
  form: FormData;
  setForm: Dispatch<SetStateAction<FormData>>;
  inputClass: string;
};

const checkboxClass =
  "mt-1 size-4 shrink-0 border-purple-200 accent-liz focus:ring-liz";

const labelCardClass =
  "flex cursor-pointer items-start gap-3 rounded-xl border border-purple-100 bg-white px-4 py-3 shadow-sm transition hover:border-purple-200 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-liz/30";

type WirelessTuple = FormData["wirelessAccounts"];

function mapWirelessTuple(
  prev: FormData,
  mapRow: (
    row: Dv100WirelessAccountRow,
    index: number,
  ) => Dv100WirelessAccountRow,
): WirelessTuple {
  return prev.wirelessAccounts.map(mapRow) as WirelessTuple;
}

const ROW_LABELS = ["a", "b", "c", "d"] as const;

export default function Step10_InterventionWireless({
  form,
  setForm,
  inputClass,
}: Step10Props) {
  const updateWirelessRow = (
    index: number,
    patch: Partial<Dv100WirelessAccountRow>,
  ) => {
    setForm((prev) => ({
      ...prev,
      wirelessAccounts: mapWirelessTuple(prev, (row, i) =>
        i === index ? { ...row, ...patch } : row,
      ),
    }));
  };

  return (
    <div className="space-y-8">
      <section className="space-y-4">
        <h2 className="text-sm font-semibold text-slate-900">
          Section 27. Batterer intervention program
        </h2>
        <label className={labelCardClass}>
          <input
            type="checkbox"
            checked={form.requestBattererIntervention}
            onChange={(e) =>
              setForm((prev) => ({
                ...prev,
                requestBattererIntervention: e.target.checked,
              }))
            }
            className={checkboxClass}
          />
          <div className="min-w-0 space-y-1">
            <span className="text-sm font-medium text-slate-800">
              Batterer Intervention Program
            </span>
            <p className="text-xs leading-relaxed text-slate-500">
              I ask the judge to order the person listed in 2 to go to a 52-week
              batterer intervention program.
            </p>
          </div>
        </label>
      </section>

      <section className="space-y-4 border-t border-purple-100/90 pt-8">
        <h2 className="text-sm font-semibold text-slate-900">
          Section 28. Transfer of wireless phone account
        </h2>
        <label className={labelCardClass}>
          <input
            type="checkbox"
            checked={form.requestWirelessTransfer}
            onChange={(e) => {
              const on = e.target.checked;
              setForm((prev) => ({
                ...prev,
                requestWirelessTransfer: on,
                ...(!on ? { wirelessAccounts: emptyWirelessAccounts() } : {}),
              }));
            }}
            className={checkboxClass}
          />
          <div className="min-w-0 space-y-1">
            <span className="text-sm font-medium text-slate-800">
              Transfer of Wireless Phone Account
            </span>
            <p className="text-xs leading-relaxed text-slate-500">
              You may ask the court to order the transfer of wireless telephone
              numbers and billing responsibility as allowed by law. If granted,
              billing for the numbers you list may shift according to the order;
              confirm details with your provider and the court.
            </p>
          </div>
        </label>

        {form.requestWirelessTransfer ? (
          <div className="overflow-x-auto rounded-xl border border-purple-100/80 bg-white shadow-sm">
            <table className="w-full min-w-[36rem] text-left text-sm">
              <thead>
                <tr className="border-b border-purple-100 bg-purple-50/50 text-xs font-semibold uppercase tracking-wide text-purple-900/80">
                  <th className="px-3 py-2.5">Row</th>
                  <th className="px-3 py-2.5">My number</th>
                  <th className="px-3 py-2.5">Number of child in my care</th>
                  <th className="px-3 py-2.5">Phone (including area code)</th>
                </tr>
              </thead>
              <tbody>
                {form.wirelessAccounts.map((row, idx) => (
                  <tr
                    key={`wireless-${idx}`}
                    className="border-b border-purple-100/80 last:border-b-0"
                  >
                    <td className="whitespace-nowrap px-3 py-3 text-xs font-medium text-slate-500">
                      {ROW_LABELS[idx]}
                    </td>
                    <td className="px-3 py-2 align-top">
                      <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-800">
                        <input
                          type="checkbox"
                          checked={row.isMyNumber}
                          onChange={(e) =>
                            updateWirelessRow(idx, {
                              isMyNumber: e.target.checked,
                            })
                          }
                          className="size-4 shrink-0 border-purple-200 accent-liz focus:ring-liz"
                        />
                        <span className="sr-only sm:not-sr-only sm:inline">
                          My number
                        </span>
                      </label>
                    </td>
                    <td className="px-3 py-2 align-top">
                      <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-800">
                        <input
                          type="checkbox"
                          checked={row.isChildNumber}
                          onChange={(e) =>
                            updateWirelessRow(idx, {
                              isChildNumber: e.target.checked,
                            })
                          }
                          className="size-4 shrink-0 border-purple-200 accent-liz focus:ring-liz"
                        />
                        <span className="sr-only sm:not-sr-only sm:inline">
                          Child
                        </span>
                      </label>
                    </td>
                    <td className="px-3 py-2 align-top">
                      <label
                        htmlFor={`wireless-phone-${idx}`}
                        className="sr-only"
                      >
                        Row {ROW_LABELS[idx]} phone number
                      </label>
                      <input
                        id={`wireless-phone-${idx}`}
                        type="text"
                        inputMode="tel"
                        autoComplete="tel"
                        maxLength={15}
                        value={row.phoneNumber}
                        onChange={(e) =>
                          updateWirelessRow(idx, {
                            phoneNumber: e.target.value,
                          })
                        }
                        className={inputClass}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </section>

      <aside
        className="rounded-xl border border-liz/30 bg-liz/10 px-4 py-4 text-sm text-slate-800 shadow-sm"
        role="note"
      >
        <p className="font-semibold text-purple-950">
          Sections 29–31: Automatic orders
        </p>
        <p className="mt-2 leading-relaxed text-slate-700">
          If the judge grants the restraining order, automatic orders regarding
          firearms, body armor, and looking for protected people will apply. No
          input is required for these sections.
        </p>
      </aside>
    </div>
  );
}
