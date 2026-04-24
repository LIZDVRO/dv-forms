"use client";

import Link from "next/link";

import {
  getAbuseIncidentsPdfFieldsFromFormStore,
  getCourtHistoryPdfFieldsFromFormStore,
  getCustodyOrdersPdfFieldsFromFormStore,
  getFirearmsPdfFieldsFromFormStore,
  getMoveOutPdfFieldsFromFormStore,
  getPropertyAnimalsPdfFieldsFromFormStore,
  getProtectionOrdersPdfFieldsFromFormStore,
  getRelationshipPdfFieldsFromFormStore,
} from "@/lib/dv100-pdf";
import type { Dv100PdfFillRow } from "@/lib/dv100-pdf";
import type { PersonInfo } from "@/store/useFormStore";
import { useFormStore } from "@/store/useFormStore";
import {
  CASE_TYPE_OPTIONS,
  labelsForValues,
  personInfoToDisplayName,
  RELATED_TYPE_OPTIONS,
  RELATIONSHIP_OPTIONS,
} from "@/components/wizard-steps/wizardShared";

export type Step12PdfInfo = {
  filled: Dv100PdfFillRow[];
  missing: Dv100PdfFillRow[];
};

type Step12Props = {
  petitioner: PersonInfo;
  respondentPerson: PersonInfo;
  pdfError: string | null;
  pdfInfo: Step12PdfInfo | null;
};

function display(v: string): string {
  return v.trim() ? v : "—";
}

function displayYn(v: string): string {
  return v === "yes" ? "Yes" : v === "no" ? "No" : "—";
}

function displayIdkNoYes(v: string): string {
  return v === "idk"
    ? "I don't know"
    : v === "no"
      ? "No"
      : v === "yes"
        ? "Yes"
        : "—";
}

function frequencyReviewLabel(v: string): string {
  return v === "once"
    ? "Just this once"
    : v === "2-5"
      ? "2–5 times"
      : v === "weekly"
        ? "Weekly"
        : v === "other"
          ? "Other"
          : "—";
}

export default function Step12_ReviewGenerate({
  petitioner,
  respondentPerson,
  pdfError,
  pdfInfo,
}: Step12Props) {
  const attorney = useFormStore((s) => s.attorney);
  const otherProtectedPeople = useFormStore((s) => s.otherProtectedPeople);
  const relR = getRelationshipPdfFieldsFromFormStore();
  const abuseR = getAbuseIncidentsPdfFieldsFromFormStore();
  const gunsR = getFirearmsPdfFieldsFromFormStore();
  const chPdf = getCourtHistoryPdfFieldsFromFormStore();
  const poPdf = getProtectionOrdersPdfFieldsFromFormStore();
  const moveOutPdf = getMoveOutPdfFieldsFromFormStore();
  const custodyPdf = getCustodyOrdersPdfFieldsFromFormStore();
  const propertyAnimalsPdf = getPropertyAnimalsPdfFieldsFromFormStore();
  const fr = useFormStore((s) => s.financial.requests);

  return (
    <div className="space-y-8">
      {pdfError && (
        <p
          className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900"
          role="alert"
        >
          {pdfError}
        </p>
      )}
      {pdfInfo && (
        <div
          className="space-y-2 rounded-xl border border-purple-200 bg-purple-50 px-4 py-3 text-sm text-purple-900"
          role="status"
        >
          <p>
            Download started as{" "}
            <code className="rounded bg-white/80 px-1">filled_dv100.pdf</code>.
            Filled AcroForm fields:
          </p>
          {pdfInfo.filled.length === 0 ? (
            <p className="text-purple-950/80">
              None. Check the browser console for details. You can verify field
              names with{" "}
              <Link
                href="/inspect"
                className="font-medium underline underline-offset-2"
              >
                /inspect
              </Link>
              .
            </p>
          ) : (
            <ul className="list-inside list-disc text-purple-950/90">
              {pdfInfo.filled.map((row) => (
                <li key={`${row.pdfFieldName}-${row.label}`}>
                  {row.label} →{" "}
                  <code className="rounded bg-white/80 px-1">
                    {row.pdfFieldName}
                  </code>
                </li>
              ))}
            </ul>
          )}
          {pdfInfo.missing.length > 0 && (
            <p className="border-t border-purple-200/80 pt-2 text-amber-950">
              Could not fill:{" "}
              {pdfInfo.missing
                .map((m) => `${m.label} (${m.pdfFieldName})`)
                .join(", ")}
              . See console for errors. Field names can be checked on{" "}
              <Link
                href="/inspect"
                className="font-medium underline underline-offset-2"
              >
                /inspect
              </Link>
              .
            </p>
          )}
        </div>
      )}
      <dl className="space-y-6 text-sm sm:text-base">
        <div className="rounded-xl border border-purple-100/90 bg-purple-50/40 px-4 py-4">
          <dt className="text-xs font-semibold uppercase tracking-wide text-purple-800/90">
            Your information
          </dt>
          <dd className="mt-2 space-y-1 text-slate-800">
            <p>
              <span className="text-slate-500">Name:</span>{" "}
              {display(personInfoToDisplayName(petitioner))}
            </p>
            <p>
              <span className="text-slate-500">Age:</span>{" "}
              {display(petitioner.age)}
            </p>
            <p>
              <span className="text-slate-500">Date of birth:</span>{" "}
              {display(petitioner.dateOfBirth)}
            </p>
            <p>
              <span className="text-slate-500">Gender:</span>{" "}
              {display(petitioner.gender)}
            </p>
            <p>
              <span className="text-slate-500">Race:</span>{" "}
              {display(petitioner.race)}
            </p>
            <p>
              <span className="text-slate-500">Address:</span>{" "}
              {display(petitioner.address.street)}
            </p>
            <p>
              <span className="text-slate-500">City:</span>{" "}
              {display(petitioner.address.city)}
            </p>
            <p>
              <span className="text-slate-500">State:</span>{" "}
              {display(petitioner.address.state)}
            </p>
            <p>
              <span className="text-slate-500">Zip:</span>{" "}
              {display(petitioner.address.zip)}
            </p>
            <p>
              <span className="text-slate-500">Phone:</span>{" "}
              {display(petitioner.telephone)}
            </p>
            <p>
              <span className="text-slate-500">Email:</span>{" "}
              {display(petitioner.email)}
            </p>
          </dd>
        </div>
        <div className="rounded-xl border border-purple-100/90 bg-purple-50/40 px-4 py-4">
          <dt className="text-xs font-semibold uppercase tracking-wide text-purple-800/90">
            Legal representation
          </dt>
          <dd className="mt-2 space-y-1 text-slate-800">
            <p>
              <span className="text-slate-500">Has a lawyer:</span>{" "}
              {attorney.hasAttorney === "yes"
                ? "Yes"
                : attorney.hasAttorney === "no"
                  ? "No"
                  : "—"}
            </p>
            {attorney.hasAttorney === "yes" && (
              <>
                <p>
                  <span className="text-slate-500">Lawyer:</span>{" "}
                  {display(attorney.name)}
                </p>
                <p>
                  <span className="text-slate-500">Bar No.:</span>{" "}
                  {display(attorney.barNumber)}
                </p>
                <p>
                  <span className="text-slate-500">Firm:</span>{" "}
                  {display(attorney.firmName)}
                </p>
              </>
            )}
          </dd>
        </div>
        <div className="rounded-xl border border-purple-100/90 bg-purple-50/40 px-4 py-4">
          <dt className="text-xs font-semibold uppercase tracking-wide text-purple-800/90">
            Person you want protection from
          </dt>
          <dd className="mt-2 space-y-1 text-slate-800">
            <p>
              <span className="text-slate-500">Name:</span>{" "}
              {display(personInfoToDisplayName(respondentPerson))}
            </p>
            <p>
              <span className="text-slate-500">Age:</span>{" "}
              {display(respondentPerson.age)}
            </p>
            <p>
              <span className="text-slate-500">Date of birth:</span>{" "}
              {display(respondentPerson.dateOfBirth)}
            </p>
            <p>
              <span className="text-slate-500">Gender:</span>{" "}
              {display(respondentPerson.gender)}
            </p>
            <p>
              <span className="text-slate-500">Race:</span>{" "}
              {display(respondentPerson.race)}
            </p>
            <p>
              <span className="text-slate-500">Height:</span>{" "}
              {display(respondentPerson.height)}
            </p>
            <p>
              <span className="text-slate-500">Weight:</span>{" "}
              {display(respondentPerson.weight)}
            </p>
            <p>
              <span className="text-slate-500">Hair color:</span>{" "}
              {display(respondentPerson.hairColor)}
            </p>
            <p>
              <span className="text-slate-500">Eye color:</span>{" "}
              {display(respondentPerson.eyeColor)}
            </p>
            <p>
              <span className="text-slate-500">Telephone:</span>{" "}
              {display(respondentPerson.telephone)}
            </p>
            <p>
              <span className="text-slate-500">Address:</span>{" "}
              {display(respondentPerson.address.street)};{" "}
              {display(respondentPerson.address.city)},{" "}
              {display(respondentPerson.address.state)}{" "}
              {display(respondentPerson.address.zip)}
            </p>
          </dd>
        </div>
        <div className="rounded-xl border border-purple-100/90 bg-purple-50/40 px-4 py-4">
          <dt className="text-xs font-semibold uppercase tracking-wide text-purple-800/90">
            Relationship to other party
          </dt>
          <dd className="mt-2 space-y-1 text-slate-800">
            <p>
              <span className="text-slate-500">Applies:</span>{" "}
              {labelsForValues(relR.relationshipChecks, RELATIONSHIP_OPTIONS)}
            </p>
            {relR.relationshipChecks.includes("children") && (
              <p>
                <span className="text-slate-500">Children&apos;s names:</span>{" "}
                {display(relR.childrenNames)}
              </p>
            )}
            {relR.relationshipChecks.includes("related") && (
              <p>
                <span className="text-slate-500">Related as:</span>{" "}
                {labelsForValues(relR.relatedTypes, RELATED_TYPE_OPTIONS)}
              </p>
            )}
            {relR.relationshipChecks.includes("liveTogether") && (
              <p>
                <span className="text-slate-500">
                  Lived together with person in 2:
                </span>{" "}
                {displayYn(relR.livedTogether)}
              </p>
            )}
          </dd>
        </div>
        <div className="rounded-xl border border-purple-100/90 bg-purple-50/40 px-4 py-4">
          <dt className="text-xs font-semibold uppercase tracking-wide text-purple-800/90">
            Describe abuse (most recent)
          </dt>
          <dd className="mt-2 space-y-1 text-slate-800">
            <p>
              <span className="text-slate-500">Date of abuse:</span>{" "}
              {display(abuseR.recentAbuseDate)}
            </p>
            <p>
              <span className="text-slate-500">Anyone else hear or see:</span>{" "}
              {displayIdkNoYes(abuseR.recentAbuseWitnesses)}
            </p>
            {abuseR.recentAbuseWitnesses === "yes" && (
              <p>
                <span className="text-slate-500">
                  Names / who saw or heard:
                </span>{" "}
                {display(abuseR.recentAbuseWitnessDetail)}
              </p>
            )}
            <p>
              <span className="text-slate-500">Weapon used or threatened:</span>{" "}
              {displayYn(abuseR.recentAbuseWeapon)}
            </p>
            {abuseR.recentAbuseWeapon === "yes" && (
              <p>
                <span className="text-slate-500">Weapon:</span>{" "}
                {display(abuseR.recentAbuseWeaponDetail)}
              </p>
            )}
            <p>
              <span className="text-slate-500">
                Emotional or physical harm:
              </span>{" "}
              {displayYn(abuseR.recentAbuseHarm)}
            </p>
            {abuseR.recentAbuseHarm === "yes" && (
              <p>
                <span className="text-slate-500">Harm:</span>{" "}
                {display(abuseR.recentAbuseHarmDetail)}
              </p>
            )}
            <p>
              <span className="text-slate-500">Police came:</span>{" "}
              {displayIdkNoYes(abuseR.recentAbusePolice)}
            </p>
            <p>
              <span className="text-slate-500">Details of abuse:</span>{" "}
              {display(abuseR.recentAbuseDetails)}
            </p>
            <p>
              <span className="text-slate-500">Frequency:</span>{" "}
              {frequencyReviewLabel(abuseR.recentAbuseFrequency)}
            </p>
            {abuseR.recentAbuseFrequency === "other" && (
              <p>
                <span className="text-slate-500">Frequency (other):</span>{" "}
                {display(abuseR.recentAbuseFrequencyOther)}
              </p>
            )}
            {abuseR.recentAbuseFrequency !== "" &&
              abuseR.recentAbuseFrequency !== "once" && (
                <p>
                  <span className="text-slate-500">
                    Dates when it happened:
                  </span>{" "}
                  {display(abuseR.recentAbuseDates)}
                </p>
              )}
          </dd>
        </div>
        <div className="rounded-xl border border-purple-100/90 bg-purple-50/40 px-4 py-4">
          <dt className="text-xs font-semibold uppercase tracking-wide text-purple-800/90">
            Describe abuse (second incident)
          </dt>
          <dd className="mt-2 space-y-1 text-slate-800">
            <p>
              <span className="text-slate-500">Date of abuse:</span>{" "}
              {display(abuseR.secondAbuseDate)}
            </p>
            <p>
              <span className="text-slate-500">Anyone else hear or see:</span>{" "}
              {displayIdkNoYes(abuseR.secondAbuseWitnesses)}
            </p>
            {abuseR.secondAbuseWitnesses === "yes" && (
              <p>
                <span className="text-slate-500">
                  Names / who saw or heard:
                </span>{" "}
                {display(abuseR.secondAbuseWitnessDetail)}
              </p>
            )}
            <p>
              <span className="text-slate-500">Weapon used or threatened:</span>{" "}
              {displayYn(abuseR.secondAbuseWeapon)}
            </p>
            {abuseR.secondAbuseWeapon === "yes" && (
              <p>
                <span className="text-slate-500">Weapon:</span>{" "}
                {display(abuseR.secondAbuseWeaponDetail)}
              </p>
            )}
            <p>
              <span className="text-slate-500">
                Emotional or physical harm:
              </span>{" "}
              {displayYn(abuseR.secondAbuseHarm)}
            </p>
            {abuseR.secondAbuseHarm === "yes" && (
              <p>
                <span className="text-slate-500">Harm:</span>{" "}
                {display(abuseR.secondAbuseHarmDetail)}
              </p>
            )}
            <p>
              <span className="text-slate-500">Police came:</span>{" "}
              {displayIdkNoYes(abuseR.secondAbusePolice)}
            </p>
            <p>
              <span className="text-slate-500">Details of abuse:</span>{" "}
              {display(abuseR.secondAbuseDetails)}
            </p>
            <p>
              <span className="text-slate-500">Frequency:</span>{" "}
              {frequencyReviewLabel(abuseR.secondAbuseFrequency)}
            </p>
            {abuseR.secondAbuseFrequency === "other" && (
              <p>
                <span className="text-slate-500">Frequency (other):</span>{" "}
                {display(abuseR.secondAbuseFrequencyOther)}
              </p>
            )}
            {abuseR.secondAbuseFrequency !== "" &&
              abuseR.secondAbuseFrequency !== "once" && (
                <p>
                  <span className="text-slate-500">Dates or estimates:</span>{" "}
                  {display(abuseR.secondAbuseDates)}
                </p>
              )}
          </dd>
        </div>
        <div className="rounded-xl border border-purple-100/90 bg-purple-50/40 px-4 py-4">
          <dt className="text-xs font-semibold uppercase tracking-wide text-purple-800/90">
            Describe abuse (third incident)
          </dt>
          <dd className="mt-2 space-y-1 text-slate-800">
            <p>
              <span className="text-slate-500">Date of abuse:</span>{" "}
              {display(abuseR.thirdAbuseDate)}
            </p>
            <p>
              <span className="text-slate-500">Anyone else hear or see:</span>{" "}
              {displayIdkNoYes(abuseR.thirdAbuseWitnesses)}
            </p>
            {abuseR.thirdAbuseWitnesses === "yes" && (
              <p>
                <span className="text-slate-500">
                  Names / who saw or heard:
                </span>{" "}
                {display(abuseR.thirdAbuseWitnessDetail)}
              </p>
            )}
            <p>
              <span className="text-slate-500">Weapon used or threatened:</span>{" "}
              {displayYn(abuseR.thirdAbuseWeapon)}
            </p>
            {abuseR.thirdAbuseWeapon === "yes" && (
              <p>
                <span className="text-slate-500">Weapon:</span>{" "}
                {display(abuseR.thirdAbuseWeaponDetail)}
              </p>
            )}
            <p>
              <span className="text-slate-500">
                Emotional or physical harm:
              </span>{" "}
              {displayYn(abuseR.thirdAbuseHarm)}
            </p>
            {abuseR.thirdAbuseHarm === "yes" && (
              <p>
                <span className="text-slate-500">Harm:</span>{" "}
                {display(abuseR.thirdAbuseHarmDetail)}
              </p>
            )}
            <p>
              <span className="text-slate-500">Police came:</span>{" "}
              {displayIdkNoYes(abuseR.thirdAbusePolice)}
            </p>
            <p>
              <span className="text-slate-500">Details of abuse:</span>{" "}
              {display(abuseR.thirdAbuseDetails)}
            </p>
            <p>
              <span className="text-slate-500">Frequency:</span>{" "}
              {frequencyReviewLabel(abuseR.thirdAbuseFrequency)}
            </p>
            {abuseR.thirdAbuseFrequency === "other" && (
              <p>
                <span className="text-slate-500">Frequency (other):</span>{" "}
                {display(abuseR.thirdAbuseFrequencyOther)}
              </p>
            )}
            {abuseR.thirdAbuseFrequency !== "" &&
              abuseR.thirdAbuseFrequency !== "once" && (
                <p>
                  <span className="text-slate-500">Dates or estimates:</span>{" "}
                  {display(abuseR.thirdAbuseDates)}
                </p>
              )}
          </dd>
        </div>
        <div className="rounded-xl border border-purple-100/90 bg-purple-50/40 px-4 py-4">
          <dt className="text-xs font-semibold uppercase tracking-wide text-purple-800/90">
            Other protected people &amp; firearms
          </dt>
          <dd className="mt-2 space-y-1 text-slate-800">
            <p>
              <span className="text-slate-500">Others need protection:</span>{" "}
              {otherProtectedPeople.wantsProtectionForOthers === "yes"
                ? "Yes"
                : otherProtectedPeople.wantsProtectionForOthers === "no"
                  ? "No"
                  : "—"}
            </p>
            {otherProtectedPeople.wantsProtectionForOthers === "yes" && (
              <>
                {otherProtectedPeople.people.map((p, i) => (
                  <p key={`pp-${i}`}>
                    <span className="text-slate-500">Person {i + 1}:</span>{" "}
                    {display(p.fullName)}; age {display(p.age)}; DOB{" "}
                    {display(p.dateOfBirth)}; gender {display(p.gender)}; race{" "}
                    {display(p.race)}; relationship {display(p.relationship)};
                    lives with you{" "}
                    {p.livesWithPetitioner === "yes" || p.livesWithPetitioner === "no"
                      ? p.livesWithPetitioner === "yes"
                        ? "Yes"
                        : "No"
                      : "—"}
                  </p>
                ))}
                <p>
                  <span className="text-slate-500">
                    Why they need protection:
                  </span>{" "}
                  {display(otherProtectedPeople.whyProtectionNeeded)}
                </p>
              </>
            )}
            <p>
              <span className="text-slate-500">Firearms:</span>{" "}
              {displayIdkNoYes(gunsR.hasFirearms)}
            </p>
            {gunsR.hasFirearms === "yes" &&
              gunsR.firearms.map((f, i) => (
                <p key={`fa-${i}`}>
                  <span className="text-slate-500">Firearm {i + 1}:</span>{" "}
                  {display(f.description)} / amount {display(f.amount)} /
                  location {display(f.location)}
                </p>
              ))}
          </dd>
        </div>
        <div className="rounded-xl border border-purple-100/90 bg-purple-50/40 px-4 py-4">
          <dt className="text-xs font-semibold uppercase tracking-wide text-purple-800/90">
            Orders requested
          </dt>
          <dd className="mt-2 space-y-2 text-slate-800">
            <p>
              <span className="text-slate-500">Order to Not Abuse:</span>{" "}
              {poPdf.orderToNotAbuse ? "Yes" : "No"}
            </p>
            <p>
              <span className="text-slate-500">No-Contact Order:</span>{" "}
              {poPdf.noContactOrder ? "Yes" : "No"}
            </p>
            <p>
              <span className="text-slate-500">Stay-Away Order:</span>{" "}
              {poPdf.stayAwayOrder ? "Yes" : "No"}
            </p>
            {poPdf.stayAwayOrder ? (
              <div className="space-y-1 border-l-2 border-purple-200/80 pl-3 text-slate-800">
                <p>
                  <span className="text-slate-500">Stay away from:</span>{" "}
                  {(() => {
                    const parts: string[] = [];
                    if (poPdf.stayAwayMe) parts.push("Me");
                    if (poPdf.stayAwayHome) parts.push("My home");
                    if (poPdf.stayAwayWork) {
                      parts.push("My job or workplace");
                    }
                    if (poPdf.stayAwayVehicle) {
                      parts.push("My vehicle");
                    }
                    if (poPdf.stayAwaySchool) {
                      parts.push("My school");
                    }
                    if (poPdf.stayAwayProtectedPersons) {
                      parts.push("Each person in Section 8");
                    }
                    if (poPdf.stayAwayChildrenSchool) {
                      parts.push("My children's school or childcare");
                    }
                    if (poPdf.stayAwayOther) {
                      parts.push(
                        poPdf.stayAwayOtherExplain.trim()
                          ? `Other (${poPdf.stayAwayOtherExplain.trim()})`
                          : "Other (please explain)",
                      );
                    }
                    return parts.length > 0 ? parts.join(", ") : "—";
                  })()}
                </p>
                <p>
                  <span className="text-slate-500">Distance:</span>{" "}
                  {poPdf.stayAwayDistance === "hundred"
                    ? "100 yards (300 feet)"
                    : poPdf.stayAwayDistance === "other"
                      ? poPdf.stayAwayDistanceOther.trim()
                        ? `${poPdf.stayAwayDistanceOther.trim()} yards`
                        : "Other (yards not specified)"
                      : "—"}
                </p>
                <p>
                  <span className="text-slate-500">Live together/close:</span>{" "}
                  {poPdf.liveTogether === "no"
                    ? "No"
                    : poPdf.liveTogether === "yes"
                      ? (() => {
                          const sub =
                            poPdf.liveTogetherType === "liveTogether"
                              ? "Live together"
                              : poPdf.liveTogetherType === "sameBuilding"
                                ? "Same building, not same home"
                                : poPdf.liveTogetherType === "sameNeighborhood"
                                  ? "Same neighborhood"
                                  : poPdf.liveTogetherType === "other"
                                    ? poPdf.liveTogetherOther.trim()
                                      ? `Other (${poPdf.liveTogetherOther.trim()})`
                                      : "Other (please explain)"
                                    : "—";
                          return `Yes — ${sub}`;
                        })()
                      : "—"}
                </p>
                <p>
                  <span className="text-slate-500">Same workplace/school:</span>{" "}
                  {poPdf.sameWorkplaceSchool === "no"
                    ? "No"
                    : poPdf.sameWorkplaceSchool === "yes"
                      ? (() => {
                          const bits: string[] = [];
                          if (poPdf.workTogether) {
                            bits.push(
                              poPdf.workTogetherCompany.trim()
                                ? `Work together at ${poPdf.workTogetherCompany.trim()}`
                                : "Work together (company not specified)",
                            );
                          }
                          if (poPdf.sameSchool) {
                            bits.push(
                              poPdf.sameSchoolName.trim()
                                ? `Same school: ${poPdf.sameSchoolName.trim()}`
                                : "Same school (name not specified)",
                            );
                          }
                          if (poPdf.sameWorkplaceOther) {
                            bits.push(
                              poPdf.sameWorkplaceOtherExplain.trim()
                                ? `Other: ${poPdf.sameWorkplaceOtherExplain.trim()}`
                                : "Other (please explain)",
                            );
                          }
                          return bits.length > 0
                            ? `Yes — ${bits.join(" / ")}`
                            : "Yes — (none selected)";
                        })()
                      : "—"}
                </p>
              </div>
            ) : null}
          </dd>
        </div>
        <div className="rounded-xl border border-purple-100/90 bg-purple-50/40 px-4 py-4">
          <dt className="text-xs font-semibold uppercase tracking-wide text-purple-800/90">
            More orders (Page 8)
          </dt>
          <dd className="mt-2 space-y-2 text-slate-800">
            <p>
              <span className="text-slate-500">Order to move out:</span>{" "}
              {moveOutPdf.orderToMoveOut ? "Yes" : "No"}
            </p>
            {moveOutPdf.orderToMoveOut ? (
              <div className="space-y-1 border-l-2 border-purple-200/80 pl-3">
                <p>
                  <span className="text-slate-500">13a:</span>{" "}
                  {display(moveOutPdf.moveOutOrderPersonAsk)}
                </p>
                <p>
                  <span className="text-slate-500">13b:</span>{" "}
                  {(() => {
                    const parts: string[] = [];
                    if (moveOutPdf.moveOutOwnHome) parts.push("I own the home");
                    if (moveOutPdf.moveOutNameOnLease) {
                      parts.push("My name is on the lease");
                    }
                    if (moveOutPdf.moveOutWithChildren) {
                      parts.push("I live at this address with my children");
                    }
                    if (moveOutPdf.moveOutLivedFor) {
                      const y = moveOutPdf.moveOutLivedYears.trim();
                      const m = moveOutPdf.moveOutLivedMonths.trim();
                      const dur =
                        y || m
                          ? `I have lived at this address for (${y || "—"} yr, ${m || "—"} mo)`
                          : "I have lived at this address for";
                      parts.push(dur);
                    }
                    if (moveOutPdf.moveOutPaysRent) {
                      parts.push(
                        "I pay for some or all of the rent or mortgage",
                      );
                    }
                    if (moveOutPdf.moveOutOther) {
                      parts.push(
                        moveOutPdf.moveOutOtherExplain.trim()
                          ? `Other (${moveOutPdf.moveOutOtherExplain.trim()})`
                          : "Other (please explain)",
                      );
                    }
                    return parts.length > 0 ? parts.join("; ") : "—";
                  })()}
                </p>
              </div>
            ) : null}
            <p>
              <span className="text-slate-500">Other orders:</span>{" "}
              {moveOutPdf.otherOrders ? "Yes" : "No"}
            </p>
            {moveOutPdf.otherOrders && (
              <p>
                <span className="text-slate-500">14. Describe:</span>{" "}
                {display(moveOutPdf.otherOrdersDescribe)}
              </p>
            )}
            <p>
              <span className="text-slate-500">
                Child custody and visitation:
              </span>{" "}
              {custodyPdf.childCustodyVisitation
                ? "Yes (complete DV-105)"
                : "No"}
            </p>
          </dd>
        </div>
        <div className="rounded-xl border border-purple-100/90 bg-purple-50/40 px-4 py-4">
          <dt className="text-xs font-semibold uppercase tracking-wide text-purple-800/90">
            Property, animals &amp; other orders (Page 9)
          </dt>
          <dd className="mt-2 space-y-2 text-slate-800">
            <p>
              <span className="text-slate-500">Protect animals:</span>{" "}
              {propertyAnimalsPdf.protectAnimals ? "Yes" : "No"}
            </p>
            {propertyAnimalsPdf.protectAnimals ? (
              <div className="space-y-1 border-l-2 border-purple-200/80 pl-3">
                {propertyAnimalsPdf.protectedAnimals.map((a, i) => (
                  <p key={`ra-${i}`}>
                    <span className="text-slate-500">Animal {i + 1}:</span>{" "}
                    {display(a.name)} / {display(a.type)} / {display(a.breed)} /{" "}
                    {display(a.color)}
                  </p>
                ))}
                <p>
                  <span className="text-slate-500">
                    Stay away from animals:
                  </span>{" "}
                  {propertyAnimalsPdf.protectAnimalsStayAway
                    ? propertyAnimalsPdf.protectAnimalsStayAwayDistance ===
                        "hundred"
                      ? "100 yards (300 feet)"
                      : propertyAnimalsPdf.protectAnimalsStayAwayDistance ===
                          "other"
                        ? propertyAnimalsPdf.protectAnimalsStayAwayOtherYards.trim()
                          ? `${propertyAnimalsPdf.protectAnimalsStayAwayOtherYards.trim()} yards`
                          : "Other (yards not specified)"
                        : "—"
                    : "No"}
                </p>
                <p>
                  <span className="text-slate-500">
                    Not take / harm animals:
                  </span>{" "}
                  {propertyAnimalsPdf.protectAnimalsNotTake ? "Yes" : "No"}
                </p>
                <p>
                  <span className="text-slate-500">
                    Sole possession of animals:
                  </span>{" "}
                  {propertyAnimalsPdf.protectAnimalsSolePossession
                    ? "Yes"
                    : "No"}
                </p>
                {propertyAnimalsPdf.protectAnimalsSolePossession ? (
                  <p>
                    <span className="text-slate-500">Reasons:</span>{" "}
                    {(() => {
                      const parts: string[] = [];
                      if (propertyAnimalsPdf.protectAnimalsSoleReasonAbuse) {
                        parts.push("Person in 2 abuses the animals");
                      }
                      if (propertyAnimalsPdf.protectAnimalsSoleReasonCare) {
                        parts.push("I take care of these animals");
                      }
                      if (propertyAnimalsPdf.protectAnimalsSoleReasonPurchased) {
                        parts.push("I purchased these animals");
                      }
                      if (propertyAnimalsPdf.protectAnimalsSoleReasonOther) {
                        parts.push(
                          propertyAnimalsPdf.protectAnimalsSoleReasonOtherExplain.trim()
                            ? `Other (${propertyAnimalsPdf.protectAnimalsSoleReasonOtherExplain.trim()})`
                            : "Other",
                        );
                      }
                      return parts.length > 0 ? parts.join("; ") : "—";
                    })()}
                  </p>
                ) : null}
              </div>
            ) : null}
            <p>
              <span className="text-slate-500">Control of property:</span>{" "}
              {propertyAnimalsPdf.controlProperty ? "Yes" : "No"}
            </p>
            {propertyAnimalsPdf.controlProperty ? (
              <>
                <p>
                  <span className="text-slate-500">17a:</span>{" "}
                  {display(propertyAnimalsPdf.controlPropertyDescribe)}
                </p>
                <p>
                  <span className="text-slate-500">17b:</span>{" "}
                  {display(propertyAnimalsPdf.controlPropertyWhy)}
                </p>
              </>
            ) : null}
            <p>
              <span className="text-slate-500">
                Health and other insurance:
              </span>{" "}
              {propertyAnimalsPdf.healthOtherInsurance ? "Yes" : "No"}
            </p>
            <p>
              <span className="text-slate-500">Record communications:</span>{" "}
              {propertyAnimalsPdf.recordCommunications ? "Yes" : "No"}
            </p>
          </dd>
        </div>
        <div className="rounded-xl border border-purple-100/90 bg-purple-50/40 px-4 py-4">
          <dt className="text-xs font-semibold uppercase tracking-wide text-purple-800/90">
            Property, notice &amp; debts (Page 10)
          </dt>
          <dd className="mt-2 space-y-2 text-slate-800">
            <p>
              <span className="text-slate-500">Property restraint:</span>{" "}
              {fr.wantsPropertyRestraint ? "Yes" : "No"}
            </p>
            <p>
              <span className="text-slate-500">
                Extend deadline to give notice:
              </span>{" "}
              {fr.wantsExtraServiceTime ? "Yes" : "No"}
            </p>
            {fr.wantsExtraServiceTime ? (
              <p>
                <span className="text-slate-500">Why more time:</span>{" "}
                {display(fr.extraServiceTimeExplanation)}
              </p>
            ) : null}
            <p>
              <span className="text-slate-500">Pay debts for property:</span>{" "}
              {fr.wantsDebtPayment ? "Yes" : "No"}
            </p>
            {fr.wantsDebtPayment ? (
              <div className="space-y-1 border-l-2 border-purple-200/80 pl-3">
                {fr.debts.map((d, i) => (
                  <p key={`pd-${i}`}>
                    <span className="text-slate-500">Debt {i + 1}:</span>{" "}
                    {display(d.payTo)} / {display(d.forWhat)} /{" "}
                    {display(d.amount)} / {display(d.dueDate)}
                  </p>
                ))}
                <p>
                  <span className="text-slate-500">Why they should pay:</span>{" "}
                  {display(fr.debtExplanation)}
                </p>
                <p>
                  <span className="text-slate-500">Special judge finding:</span>{" "}
                  {fr.debtSpecialFinding === "yes"
                    ? "Yes"
                    : fr.debtSpecialFinding === "no"
                      ? "No"
                      : "—"}
                </p>
                {fr.debtSpecialFinding === "yes" ? (
                  <>
                    <p>
                      <span className="text-slate-500">Debts from abuse:</span>{" "}
                      {[
                        fr.debtSpecialFindingWhich.debt1 && "1",
                        fr.debtSpecialFindingWhich.debt2 && "2",
                        fr.debtSpecialFindingWhich.debt3 && "3",
                      ]
                        .filter(Boolean)
                        .join(", ") || "—"}
                    </p>
                    <p>
                      <span className="text-slate-500">
                        Know how debts were made:
                      </span>{" "}
                      {fr.debtSpecialFindingKnowHow === "yes"
                        ? "Yes"
                        : fr.debtSpecialFindingKnowHow === "no"
                          ? "No"
                          : "—"}
                    </p>
                    {fr.debtSpecialFindingKnowHow === "yes" ? (
                      <p>
                        <span className="text-slate-500">How:</span>{" "}
                        {display(fr.debtSpecialFindingExplanation)}
                      </p>
                    ) : null}
                  </>
                ) : null}
              </div>
            ) : null}
          </dd>
        </div>
        <div className="rounded-xl border border-purple-100/90 bg-purple-50/40 px-4 py-4">
          <dt className="text-xs font-semibold uppercase tracking-wide text-purple-800/90">
            Support, fees &amp; restitution (Page 11)
          </dt>
          <dd className="mt-2 space-y-1 text-slate-800">
            <p>
              <span className="text-slate-500">
                Pay expenses caused by abuse (Section 23):
              </span>{" "}
              {fr.wantsRestitution ? "Yes" : "No"}
            </p>
            {fr.wantsRestitution ? (
              <>
                <p>
                  <span className="text-slate-500">
                    Abuser pays $250 LIZ fee (invoice appended):
                  </span>{" "}
                  {fr.requestAbuserPayLizFee ? "Yes" : "No"}
                </p>
                <div className="mt-2 space-y-1">
                  <p className="text-slate-500">Expense grid:</p>
                  <ul className="list-inside list-disc text-slate-700">
                    {fr.restitutionExpenses.map((row, i) => (
                      <li key={i}>
                        {i + 1}. Pay to: {display(row.payTo)} · For:{" "}
                        {display(row.forWhat)} · Amount: {display(row.amount)}
                      </li>
                    ))}
                  </ul>
                </div>
              </>
            ) : null}
            <p>
              <span className="text-slate-500">Child support:</span>{" "}
              {fr.wantsChildSupport ? "Yes" : "No"}
            </p>
            {fr.wantsChildSupport ? (
              <ul className="ml-4 list-inside list-disc space-y-0.5 text-slate-700">
                <li>
                  No order, want one:{" "}
                  {fr.childSupportNoOrderWantOne ? "Yes" : "No"}
                </li>
                <li>
                  Have order, want changed:{" "}
                  {fr.childSupportHaveOrderWantChanged ? "Yes" : "No"}
                </li>
                <li>
                  TANF / Welfare / CalWORKS:{" "}
                  {fr.receivingTANF ? "Yes" : "No"}
                </li>
              </ul>
            ) : null}
            <p>
              <span className="text-slate-500">Spousal support:</span>{" "}
              {fr.wantsSpousalSupport ? "Yes" : "No"}
            </p>
            <p>
              <span className="text-slate-500">
                Lawyer&apos;s fees and costs:
              </span>{" "}
              {fr.wantsLawyerFees ? "Yes" : "No"}
            </p>
          </dd>
        </div>
        <div className="rounded-xl border border-purple-100/90 bg-purple-50/40 px-4 py-4">
          <dt className="text-xs font-semibold uppercase tracking-wide text-purple-800/90">
            Intervention &amp; wireless (Page 12)
          </dt>
          <dd className="mt-2 space-y-1 text-slate-800">
            <p>
              <span className="text-slate-500">
                Batterer intervention program (Section 27):
              </span>{" "}
              {fr.wantsBattererIntervention ? "Yes" : "No"}
            </p>
            <p>
              <span className="text-slate-500">
                Transfer of wireless phone account (Section 28):
              </span>{" "}
              {fr.wantsWirelessTransfer ? "Yes" : "No"}
            </p>
            {fr.wantsWirelessTransfer ? (
              <div className="mt-2 space-y-1">
                <p className="text-slate-500">Wireless number rows:</p>
                <ul className="list-inside list-disc text-slate-700">
                  {fr.wirelessAccounts.map((row, i) => (
                    <li key={i}>
                      Row {String.fromCharCode(97 + i)}: My number{" "}
                      {row.isMyNumber ? "Yes" : "No"} · Child in my care{" "}
                      {row.isChildNumber ? "Yes" : "No"} · Phone:{" "}
                      {display(row.phoneNumber)}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </dd>
        </div>
        <div className="rounded-xl border border-purple-100/90 bg-purple-50/40 px-4 py-4">
          <dt className="text-xs font-semibold uppercase tracking-wide text-purple-800/90">
            Other court cases
          </dt>
          <dd className="mt-2 space-y-1 text-slate-800">
            <p>
              <span className="text-slate-500">
                Other restraining/protective orders in effect:
              </span>{" "}
              {displayYn(chPdf.hasRestrainingOrders)}
            </p>
            {chPdf.hasRestrainingOrders === "yes" && (
              <>
                <p>
                  <span className="text-slate-500">
                    Order 1 — date / expires:
                  </span>{" "}
                  {display(chPdf.order1Date)} / {display(chPdf.order1Expires)}
                </p>
                <p>
                  <span className="text-slate-500">
                    Order 2 — date / expires:
                  </span>{" "}
                  {display(chPdf.order2Date)} / {display(chPdf.order2Expires)}
                </p>
              </>
            )}
            <p>
              <span className="text-slate-500">Other court case filed:</span>{" "}
              {displayYn(chPdf.hasOtherCases)}
            </p>
            {chPdf.hasOtherCases === "yes" && (
              <>
                <p>
                  <span className="text-slate-500">Case types:</span>{" "}
                  {labelsForValues(chPdf.caseTypes, CASE_TYPE_OPTIONS)}
                </p>
                {chPdf.caseTypes.includes("custody") && (
                  <p>
                    <span className="text-slate-500">
                      Custody — case details:
                    </span>{" "}
                    {display(chPdf.custodyCaseDetails)}
                  </p>
                )}
                {chPdf.caseTypes.includes("divorce") && (
                  <p>
                    <span className="text-slate-500">
                      Divorce — case details:
                    </span>{" "}
                    {display(chPdf.divorceCaseDetails)}
                  </p>
                )}
                {chPdf.caseTypes.includes("juvenile") && (
                  <p>
                    <span className="text-slate-500">
                      Juvenile — case details:
                    </span>{" "}
                    {display(chPdf.juvenileCaseDetails)}
                  </p>
                )}
                {chPdf.caseTypes.includes("guardianship") && (
                  <p>
                    <span className="text-slate-500">
                      Guardianship — case details:
                    </span>{" "}
                    {display(chPdf.guardianshipCaseDetails)}
                  </p>
                )}
                {chPdf.caseTypes.includes("criminal") && (
                  <p>
                    <span className="text-slate-500">
                      Criminal — case details:
                    </span>{" "}
                    {display(chPdf.criminalCaseDetails)}
                  </p>
                )}
                {chPdf.caseTypes.includes("other") && (
                  <p>
                    <span className="text-slate-500">
                      Other — what kind of case:
                    </span>{" "}
                    {display(chPdf.otherCaseType)}
                  </p>
                )}
              </>
            )}
          </dd>
        </div>
      </dl>
    </div>
  );
}
