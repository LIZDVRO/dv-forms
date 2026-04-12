"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import {
  DV100_PDF_URL,
  inspectPdfFormFields,
  loadDv100Document,
  type PdfFieldInspectRow,
} from "@/lib/dv100-pdf";

export default function InspectPage() {
  const [rows, setRows] = useState<PdfFieldInspectRow[] | null>(null);
  const [meta, setMeta] = useState<{
    encrypted: boolean;
    hasXFA: boolean;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const doc = await loadDv100Document();
        const form = doc.getForm();
        if (cancelled) return;
        setMeta({
          encrypted: doc.isEncrypted,
          hasXFA: form.hasXFA(),
        });
        setRows(inspectPdfFormFields(form));
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : String(e));
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="min-h-full bg-white p-6 font-mono text-sm text-black">
      <div className="mb-6 space-y-2">
        <Link href="/" className="text-blue-700 underline">
          Home
        </Link>
        <h1 className="text-lg font-bold">PDF field inspector</h1>
        <p className="text-neutral-600">
          Source: <code>{DV100_PDF_URL}</code> (loaded with{" "}
          <code>ignoreEncryption: true</code> when the file is encrypted).
        </p>
        {meta && (
          <p className="text-neutral-600">
            Encrypted: <code>{String(meta.encrypted)}</code> · Has XFA:{" "}
            <code>{String(meta.hasXFA)}</code> · Field count:{" "}
            <code>{rows?.length ?? "—"}</code>
          </p>
        )}
      </div>

      {error && (
        <pre className="mb-4 whitespace-pre-wrap text-red-700">{error}</pre>
      )}

      {rows && rows.length === 0 && !error && (
        <p className="mb-4 text-amber-800">
          pdf-lib reported zero AcroForm fields. The PDF may use structures
          pdf-lib cannot read, or field dictionaries may not resolve. If you see
          names here on a different export of the form, align field names in{" "}
          <code>generateDV100PDF</code> in <code>src/lib/dv100-pdf.ts</code>.
        </p>
      )}

      {rows && rows.length > 0 && (
        <ul className="max-w-4xl divide-y divide-neutral-300 border border-neutral-300">
          {rows.map((row) => (
            <li key={row.name} className="grid grid-cols-[1fr_auto_1fr] gap-2 px-2 py-1.5">
              <span className="break-all">{row.name}</span>
              <span className="text-neutral-500">{row.type}</span>
              <span className="break-all text-neutral-700">
                {row.defaultValue === "" ? "—" : row.defaultValue}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
