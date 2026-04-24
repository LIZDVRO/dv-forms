"use client";

import type { Dispatch, SetStateAction } from "react";

import SignatureStep from "@/components/SignatureStep";
import type { Dv100PdfFormData } from "@/lib/dv100-pdf";

type Step11Props = {
  form: Dv100PdfFormData;
  setForm: Dispatch<SetStateAction<Dv100PdfFormData>>;
};

export default function Step11_Signature({ form, setForm }: Step11Props) {
  return (
    <SignatureStep
      formData={form}
      updateFormData={(patch: Partial<Dv100PdfFormData>) =>
        setForm((prev) => ({ ...prev, ...patch }))
      }
    />
  );
}
