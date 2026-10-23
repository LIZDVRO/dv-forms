"use client";

import { COURTHOUSES } from "../courthouses";
import { useWizard } from "../store";
import { AddressInput, Choice, Group, Note, Question, Text, YesNo } from "../ui/fields";
import type { StepProps } from "./types";
import { ConsentBoxes } from "@/legal/consent";

export const COUNTIES = [
  "Alameda", "Alpine", "Amador", "Butte", "Calaveras", "Colusa", "Contra Costa", "Del Norte", "El Dorado", "Fresno",
  "Glenn", "Humboldt", "Imperial", "Inyo", "Kern", "Kings", "Lake", "Lassen", "Los Angeles", "Madera", "Marin",
  "Mariposa", "Mendocino", "Merced", "Modoc", "Mono", "Monterey", "Napa", "Nevada", "Orange", "Placer", "Plumas",
  "Riverside", "Sacramento", "San Benito", "San Bernardino", "San Diego", "San Francisco", "San Joaquin",
  "San Luis Obispo", "San Mateo", "Santa Barbara", "Santa Clara", "Santa Cruz", "Shasta", "Sierra", "Siskiyou",
  "Solano", "Sonoma", "Stanislaus", "Sutter", "Tehama", "Trinity", "Tulare", "Tuolumne", "Ventura", "Yolo", "Yuba",
];

/** Phase 0 (DV-500-INFO): what this is, before any questions. */
export function Start({ errors }: StepProps) {
  return (
    <div className="space-y-5 text-base leading-relaxed text-slate-700">
      <p>
        This free service will help you fill out the court forms to ask for a{" "}
        <strong>domestic violence restraining order</strong>{" "}in California. Many long, repetitive court forms become one
        shorter set of plain-language questions. We ask each question once and fill in every form for you.
      </p>
      <Note>
        <strong>Nothing is saved.</strong>{" "}Your answers stay on this screen only. If you close or refresh the page, they
        are gone. At the end you&apos;ll download your forms.
      </Note>
      <Note tone="warn">
        <strong>Need to leave fast?</strong>{" "}Press{" "}<kbd className="rounded border bg-white px-1">Esc</kbd>{" "}or the Quick exit
        button at any time. It clears everything.
      </Note>
      <p className="text-sm text-slate-600">
        Based on your answers, this makes the forms that apply to you: the request and temporary order (DV-100, DV-101,
        DV-109, DV-110, CLETS-001); child custody and visitation (DV-105, DV-105(A), DV-140, DV-150), with DV-108 and DV-145
        to prevent child abduction; child support, spousal support and lawyer&apos;s fees (FL-150); transferring a phone
        account (DV-900, DV-901); an interpreter (INT-300); keeping a child&apos;s information private (DV-160, DV-165, DV-170,
        DV-175); the order after your court date (DV-130); and serving the papers (SER-001, DV-200, DV-250, DV-210).
      </p>
      <ConsentBoxes error={errors.consent} />
    </div>
  );
}

export function CourtAndLawyer({ errors }: StepProps) {
  const { a, set } = useWizard();
  return (
    <div className="space-y-8">
      <Group>
        <Question label="Which county are you filing in?" hint="Where you live, or where the abuse happened." error={errors.S1}>
          <select
            value={a.S1}
            onChange={(e) =>
              set((x) => {
                x.S1 = e.target.value;
                x.S2 = "";
              })
            }
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-base focus:border-liz focus:outline-none focus:ring-2 focus:ring-liz/25 sm:w-80"
          >
            <option value="">Choose a county…</option>
            {COUNTIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </Question>
        {(COURTHOUSES[a.S1]?.length ?? 0) > 1 && (
          <Question label="Which courthouse?" hint="Choose the one closest to you, or where your court told you to file." error={errors.S2}>
            <Choice
              value={a.S2}
              onChange={(v) => set((x) => void (x.S2 = v))}
              columns
              options={COURTHOUSES[a.S1].map((c) => ({ value: c.id, label: c.name, hint: `${c.street}, ${c.city}` }))}
            />
          </Question>
        )}
        <Question label="Is this a new request?">
          <Choice
            value={a.S3}
            onChange={(v) => set((x) => void (x.S3 = v))}
            options={[
              { value: "new", label: "Yes, it's new" },
              { value: "update", label: "No, I already have a case" },
            ]}
          />
        </Question>
        {a.S3 === "update" && (
          <Question label="Case number">
            <Text value={a.S4} onChange={(v) => set((x) => void (x.S4 = v))} className="sm:w-80" />
          </Question>
        )}
      </Group>

      <Group>
        <Question label="Is a lawyer helping you with this case?">
          <YesNo value={a.S5} onChange={(v) => set((x) => void (x.S5 = v === "Y" ? "Y" : "N"))} />
        </Question>
        {a.S5 === "Y" && (
          <div className="space-y-5 rounded-xl border border-slate-200 p-4">
            <p className="text-sm text-slate-600">The forms will use your lawyer&apos;s address and contact details instead of yours.</p>
            <Question label="Lawyer's name" error={errors.L1}>
              <Text value={a.L1} onChange={(v) => set((x) => void (x.L1 = v))} />
            </Question>
            <div className="grid gap-5 sm:grid-cols-2">
              <Question label="State Bar number">
                <Text value={a.L2} onChange={(v) => set((x) => void (x.L2 = v))} inputMode="numeric" />
              </Question>
              <Question label="Firm name" optional>
                <Text value={a.L3} onChange={(v) => set((x) => void (x.L3 = v))} />
              </Question>
            </div>
            <Question label="Firm mailing address">
              <AddressInput value={a.L4} onChange={(v) => set((x) => void (x.L4 = v))} />
            </Question>
            <div className="grid gap-5 sm:grid-cols-3">
              <Question label="Phone">
                <Text type="tel" value={a.L5.phone} onChange={(v) => set((x) => void (x.L5.phone = v))} />
              </Question>
              <Question label="Fax" optional>
                <Text type="tel" value={a.L5.fax} onChange={(v) => set((x) => void (x.L5.fax = v))} />
              </Question>
              <Question label="Email">
                <Text type="email" value={a.L5.email} onChange={(v) => set((x) => void (x.L5.email = v))} />
              </Question>
            </div>
          </div>
        )}
      </Group>
    </div>
  );
}
