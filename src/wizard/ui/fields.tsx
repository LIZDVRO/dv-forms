"use client";

/**
 * Small, consistent building blocks for wizard questions.
 * One question, one plain label, an optional one-line hint, big tap targets.
 */
import { useId, useState, type ReactNode } from "react";

import type { Address } from "../types";

export function Question({
  label,
  hint,
  more,
  optional,
  error,
  children,
}: {
  label: ReactNode;
  hint?: ReactNode;
  more?: ReactNode;
  optional?: boolean;
  error?: string;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="space-y-2">
      <div>
        <div className="text-base font-medium text-slate-900">
          {label}
          {optional && <span className="ml-2 text-sm font-normal text-slate-500">(optional)</span>}
        </div>
        {hint && <p className="mt-0.5 text-sm text-slate-600">{hint}</p>}
        {more && (
          <button
            type="button"
            onClick={() => setOpen(!open)}
            className="mt-1 text-sm font-medium text-liz underline-offset-2 hover:underline"
          >
            {open ? "Less" : "More about this"}
          </button>
        )}
        {more && open && <div className="mt-2 rounded-lg bg-liz/5 p-3 text-sm text-slate-700">{more}</div>}
      </div>
      {children}
      {error && <p className="text-sm font-medium text-red-700">{error}</p>}
    </div>
  );
}

const inputCls =
  "w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-base text-slate-900 placeholder:text-slate-400 focus:border-liz focus:outline-none focus:ring-2 focus:ring-liz/25";

export function Text({
  value,
  onChange,
  placeholder,
  type = "text",
  inputMode,
  autoComplete = "off",
  className = "",
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: "text" | "date" | "tel" | "email";
  inputMode?: "text" | "numeric" | "decimal" | "tel" | "email";
  autoComplete?: string;
  className?: string;
}) {
  return (
    <input
      type={type}
      value={value}
      inputMode={inputMode}
      autoComplete={autoComplete}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      className={`${inputCls} ${className}`}
    />
  );
}

export function LongText({
  value,
  onChange,
  placeholder,
  rows = 6,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  rows?: number;
}) {
  return (
    <textarea
      value={value}
      rows={rows}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      className={`${inputCls} leading-relaxed`}
    />
  );
}

export interface Option<T extends string> {
  value: T;
  label: ReactNode;
  hint?: ReactNode;
}

const pill = (active: boolean) =>
  `rounded-lg border px-4 py-2.5 text-left text-base transition focus:outline-none focus-visible:ring-2 focus-visible:ring-liz/40 ${
    active ? "border-liz bg-liz text-white" : "border-slate-300 bg-white text-slate-800 hover:border-liz/60"
  }`;

/** Pick one. */
export function Choice<T extends string>({
  value,
  onChange,
  options,
  columns = false,
}: {
  value: T | "";
  onChange: (v: T) => void;
  options: Option<T>[];
  columns?: boolean;
}) {
  const name = useId();
  return (
    <div role="radiogroup" className={columns ? "grid gap-2 sm:grid-cols-2" : "flex flex-wrap gap-2"}>
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="radio"
          aria-checked={value === o.value}
          name={name}
          onClick={() => onChange(o.value)}
          className={pill(value === o.value)}
        >
          {o.label}
          {o.hint && <span className={`block text-sm ${value === o.value ? "text-white/85" : "text-slate-500"}`}>{o.hint}</span>}
        </button>
      ))}
    </div>
  );
}

/** Pick any. */
export function Multi<T extends string>({
  value,
  onChange,
  options,
  columns = false,
}: {
  value: T[];
  onChange: (v: T[]) => void;
  options: Option<T>[];
  columns?: boolean;
}) {
  const toggle = (v: T) => onChange(value.includes(v) ? value.filter((x) => x !== v) : [...value, v]);
  return (
    <div className={columns ? "grid gap-2 sm:grid-cols-2" : "flex flex-wrap gap-2"}>
      {options.map((o) => {
        const on = value.includes(o.value);
        return (
          <button key={o.value} type="button" role="checkbox" aria-checked={on} onClick={() => toggle(o.value)} className={pill(on)}>
            <span className="mr-2 inline-block w-4">{on ? "✓" : ""}</span>
            {o.label}
            {o.hint && <span className={`ml-6 block text-sm ${on ? "text-white/85" : "text-slate-500"}`}>{o.hint}</span>}
          </button>
        );
      })}
    </div>
  );
}

export function YesNo({
  value,
  onChange,
  dontKnow,
}: {
  value: string;
  onChange: (v: "Y" | "N" | "DK") => void;
  dontKnow?: boolean;
}) {
  const opts: Option<"Y" | "N" | "DK">[] = [
    { value: "Y", label: "Yes" },
    { value: "N", label: "No" },
  ];
  if (dontKnow) opts.push({ value: "DK", label: "I don't know" });
  return <Choice value={value as "Y" | "N" | "DK" | ""} onChange={onChange} options={opts} />;
}

export function AddressInput({ value, onChange }: { value: Address; onChange: (v: Address) => void }) {
  const up = (k: keyof Address) => (v: string) => onChange({ ...value, [k]: v });
  return (
    <div className="grid gap-2 sm:grid-cols-6">
      <Text className="sm:col-span-6" value={value.street} onChange={up("street")} placeholder="Street address or P.O. box" />
      <Text className="sm:col-span-3" value={value.city} onChange={up("city")} placeholder="City" />
      <Text className="sm:col-span-1" value={value.state} onChange={up("state")} placeholder="State" />
      <Text className="sm:col-span-2" value={value.zip} onChange={up("zip")} placeholder="ZIP" inputMode="numeric" />
    </div>
  );
}

export function Check({ checked, onChange, children }: { checked: boolean; onChange: (v: boolean) => void; children: ReactNode }) {
  return (
    <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-slate-200 bg-white p-3 hover:border-liz/50">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="mt-1 h-5 w-5 accent-liz" />
      <span className="text-base text-slate-800">{children}</span>
    </label>
  );
}

/** A repeatable list (people, cases, firearms …). */
export function Rows<T>({
  items,
  onChange,
  make,
  addLabel,
  max,
  render,
}: {
  items: T[];
  onChange: (v: T[]) => void;
  make: () => T;
  addLabel: string;
  max?: number;
  render: (item: T, update: (patch: Partial<T>) => void, index: number) => ReactNode;
}) {
  return (
    <div className="space-y-3">
      {items.map((item, i) => (
        <div key={i} className="rounded-xl border border-slate-200 bg-slate-50/60 p-4">
          {render(item, (patch) => onChange(items.map((x, j) => (j === i ? { ...x, ...patch } : x))), i)}
          <button
            type="button"
            onClick={() => onChange(items.filter((_, j) => j !== i))}
            className="mt-3 text-sm font-medium text-slate-500 hover:text-red-700"
          >
            Remove
          </button>
        </div>
      ))}
      {(max === undefined || items.length < max) && (
        <button
          type="button"
          onClick={() => onChange([...items, make()])}
          className="rounded-lg border border-dashed border-liz/50 px-4 py-2.5 text-base font-medium text-liz hover:bg-liz/5"
        >
          + {addLabel}
        </button>
      )}
    </div>
  );
}

export type Audience = "public" | "police" | "sheriff" | "court-confidential" | "phone-company";

const AUDIENCE: Record<Audience, { label: string; cls: string }> = {
  public: { label: "The other person and the public can see this", cls: "bg-amber-50 text-amber-900 border-amber-200" },
  police: { label: "Only law enforcement sees this", cls: "bg-sky-50 text-sky-900 border-sky-200" },
  sheriff: { label: "Only the sheriff sees this", cls: "bg-sky-50 text-sky-900 border-sky-200" },
  "court-confidential": { label: "Kept in the court's confidential file", cls: "bg-emerald-50 text-emerald-900 border-emerald-200" },
  "phone-company": { label: "Only the phone company sees this", cls: "bg-sky-50 text-sky-900 border-sky-200" },
};

/** "Who will see this" label (UX guide principle 1). */
export function Seen({ by }: { by: Audience }) {
  const a = AUDIENCE[by];
  return <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${a.cls}`}>👁 {a.label}</span>;
}

export function Group({ title, seen, children }: { title?: ReactNode; seen?: Audience; children: ReactNode }) {
  return (
    <section className="space-y-5">
      {(title || seen) && (
        <div className="flex flex-wrap items-center gap-2">
          {title && <h3 className="text-lg font-semibold text-slate-900">{title}</h3>}
          {seen && <Seen by={seen} />}
        </div>
      )}
      {children}
    </section>
  );
}

export function Note({ children, tone = "info" }: { children: ReactNode; tone?: "info" | "warn" }) {
  return (
    <div
      className={`rounded-lg border p-3 text-sm ${
        tone === "warn" ? "border-amber-200 bg-amber-50 text-amber-900" : "border-liz/20 bg-liz/5 text-slate-700"
      }`}
    >
      {children}
    </div>
  );
}
