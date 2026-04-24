"use client";

import { useRef } from "react";
import SignatureCanvas from "react-signature-canvas";

import { useFormStore } from "@/store/useFormStore";

export default function SignatureStep() {
  const perjuryDeclared = useFormStore((s) => s.signature.perjuryDeclared);
  const setSignature = useFormStore((s) => s.setSignature);
  const hasLawyer = useFormStore((s) => s.attorney.hasAttorney === "yes");

  const sigPetitionerRef = useRef<SignatureCanvas>(null);
  const sigAttorneyRef = useRef<SignatureCanvas>(null);

  const handleClear = () => {
    sigPetitionerRef.current?.clear();
    sigAttorneyRef.current?.clear();
    setSignature({
      signatureDataUrl: "",
      lawyerSignatureDataUrl: "",
      signatureDate: "",
      lawyerSignatureDate: "",
    });
  };

  const handleSavePetitionerSignature = () => {
    if (sigPetitionerRef.current?.isEmpty()) {
      alert("Please provide a signature.");
      return;
    }
    const dataUrl = sigPetitionerRef.current?.getTrimmedCanvas().toDataURL("image/png");
    setSignature({
      signatureDataUrl: dataUrl ?? "",
      signatureDate: new Date().toLocaleDateString(),
    });
  };

  const handleSaveAttorneySignature = () => {
    if (sigAttorneyRef.current?.isEmpty()) {
      alert("Please provide a signature.");
      return;
    }
    const dataUrl = sigAttorneyRef.current?.getTrimmedCanvas().toDataURL("image/png");
    setSignature({
      lawyerSignatureDataUrl: dataUrl ?? "",
      lawyerSignatureDate: new Date().toLocaleDateString(),
    });
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-md border-t-4 border-[#662D91]">
      <h2 className="text-2xl font-bold text-[#662D91]">Final Step: Sign Your Document</h2>

      <div className="flex items-start space-x-3 bg-purple-50 p-4 rounded-md">
        <input
          type="checkbox"
          id="perjury"
          className="mt-1 w-5 h-5 text-[#662D91] border-gray-300 rounded focus:ring-[#662D91]"
          checked={perjuryDeclared}
          onChange={(e) => setSignature({ perjuryDeclared: e.target.checked })}
        />
        <label htmlFor="perjury" className="text-sm text-gray-800 font-medium">
          I declare under penalty of perjury under the laws of the State of California that the
          information I have provided in this request is true and correct.
        </label>
      </div>

      <div
        className={`space-y-8 transition-opacity duration-300 ${perjuryDeclared ? "opacity-100" : "opacity-50 pointer-events-none"}`}
      >
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Your signature (petitioner — Section 33) — use your mouse or finger below:
          </label>
          <div className="border-2 border-dashed border-[#662D91] rounded-lg bg-gray-50">
            <SignatureCanvas
              ref={sigPetitionerRef}
              penColor="#0000FF"
              canvasProps={{ className: "w-full h-48 rounded-lg cursor-crosshair" }}
              onEnd={handleSavePetitionerSignature}
            />
          </div>
        </div>

        {hasLawyer ? (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Attorney signature (Section 34) — use your mouse or finger below:
            </label>
            <div className="border-2 border-dashed border-[#662D91] rounded-lg bg-gray-50">
              <SignatureCanvas
                ref={sigAttorneyRef}
                penColor="#0000FF"
                canvasProps={{ className: "w-full h-48 rounded-lg cursor-crosshair" }}
                onEnd={handleSaveAttorneySignature}
              />
            </div>
          </div>
        ) : null}

        <button
          type="button"
          onClick={handleClear}
          className="mt-2 text-sm text-[#662D91] hover:text-purple-900 underline"
        >
          {hasLawyer ? "Clear all signatures" : "Clear Signature"}
        </button>
      </div>
    </div>
  );
}
