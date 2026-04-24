"use client";

import Link from "next/link";

import type { Dv100PdfFillRow, Dv100PdfFormData } from "@/lib/dv100-pdf";
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
  form: Dv100PdfFormData;
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
  form,
  petitioner,
  respondentPerson,
  pdfError,
  pdfInfo,
}: Step12Props) {
  const attorney = useFormStore((s) => s.attorney);
  const otherProtectedPeople = useFormStore((s) => s.otherProtectedPeople);

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
          </dd>
        </div>
        <div className="rounded-xl border border-purple-100/90 bg-purple-50/40 px-4 py-4">
          <dt className="text-xs font-semibold uppercase tracking-wide text-purple-800/90">
            Relationship to other party
          </dt>
          <dd className="mt-2 space-y-1 text-slate-800">
            <p>
              <span className="text-slate-500">Applies:</span>{" "}
              {labelsForValues(form.relationshipChecks, RELATIONSHIP_OPTIONS)}
            </p>
            {form.relationshipChecks.includes("children") && (
              <p>
                <span className="text-slate-500">Children&apos;s names:</span>{" "}
                {display(form.childrenNames)}
              </p>
            )}
            {form.relationshipChecks.includes("related") && (
              <p>
                <span className="text-slate-500">Related as:</span>{" "}
                {labelsForValues(form.relatedTypes, RELATED_TYPE_OPTIONS)}
              </p>
            )}
            {form.relationshipChecks.includes("liveTogether") && (
              <p>
                <span className="text-slate-500">
                  Lived together with person in 2:
                </span>{" "}
                {displayYn(form.livedTogether)}
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
              {display(form.recentAbuseDate)}
            </p>
            <p>
              <span className="text-slate-500">Anyone else hear or see:</span>{" "}
              {displayIdkNoYes(form.recentAbuseWitnesses)}
            </p>
            {form.recentAbuseWitnesses === "yes" && (
              <p>
                <span className="text-slate-500">
                  Names / who saw or heard:
                </span>{" "}
                {display(form.recentAbuseWitnessDetail)}
              </p>
            )}
            <p>
              <span className="text-slate-500">Weapon used or threatened:</span>{" "}
              {displayYn(form.recentAbuseWeapon)}
            </p>
            {form.recentAbuseWeapon === "yes" && (
              <p>
                <span className="text-slate-500">Weapon:</span>{" "}
                {display(form.recentAbuseWeaponDetail)}
              </p>
            )}
            <p>
              <span className="text-slate-500">
                Emotional or physical harm:
              </span>{" "}
              {displayYn(form.recentAbuseHarm)}
            </p>
            {form.recentAbuseHarm === "yes" && (
              <p>
                <span className="text-slate-500">Harm:</span>{" "}
                {display(form.recentAbuseHarmDetail)}
              </p>
            )}
            <p>
              <span className="text-slate-500">Police came:</span>{" "}
              {displayIdkNoYes(form.recentAbusePolice)}
            </p>
            <p>
              <span className="text-slate-500">Details of abuse:</span>{" "}
              {display(form.recentAbuseDetails)}
            </p>
            <p>
              <span className="text-slate-500">Frequency:</span>{" "}
              {frequencyReviewLabel(form.recentAbuseFrequency)}
            </p>
            {form.recentAbuseFrequency === "other" && (
              <p>
                <span className="text-slate-500">Frequency (other):</span>{" "}
                {display(form.recentAbuseFrequencyOther)}
              </p>
            )}
            {form.recentAbuseFrequency !== "" &&
              form.recentAbuseFrequency !== "once" && (
                <p>
                  <span className="text-slate-500">
                    Dates when it happened:
                  </span>{" "}
                  {display(form.recentAbuseDates)}
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
              {display(form.secondAbuseDate)}
            </p>
            <p>
              <span className="text-slate-500">Anyone else hear or see:</span>{" "}
              {displayIdkNoYes(form.secondAbuseWitnesses)}
            </p>
            {form.secondAbuseWitnesses === "yes" && (
              <p>
                <span className="text-slate-500">
                  Names / who saw or heard:
                </span>{" "}
                {display(form.secondAbuseWitnessDetail)}
              </p>
            )}
            <p>
              <span className="text-slate-500">Weapon used or threatened:</span>{" "}
              {displayYn(form.secondAbuseWeapon)}
            </p>
            {form.secondAbuseWeapon === "yes" && (
              <p>
                <span className="text-slate-500">Weapon:</span>{" "}
                {display(form.secondAbuseWeaponDetail)}
              </p>
            )}
            <p>
              <span className="text-slate-500">
                Emotional or physical harm:
              </span>{" "}
              {displayYn(form.secondAbuseHarm)}
            </p>
            {form.secondAbuseHarm === "yes" && (
              <p>
                <span className="text-slate-500">Harm:</span>{" "}
                {display(form.secondAbuseHarmDetail)}
              </p>
            )}
            <p>
              <span className="text-slate-500">Police came:</span>{" "}
              {displayIdkNoYes(form.secondAbusePolice)}
            </p>
            <p>
              <span className="text-slate-500">Details of abuse:</span>{" "}
              {display(form.secondAbuseDetails)}
            </p>
            <p>
              <span className="text-slate-500">Frequency:</span>{" "}
              {frequencyReviewLabel(form.secondAbuseFrequency)}
            </p>
            {form.secondAbuseFrequency === "other" && (
              <p>
                <span className="text-slate-500">Frequency (other):</span>{" "}
                {display(form.secondAbuseFrequencyOther)}
              </p>
            )}
            {form.secondAbuseFrequency !== "" &&
              form.secondAbuseFrequency !== "once" && (
                <p>
                  <span className="text-slate-500">Dates or estimates:</span>{" "}
                  {display(form.secondAbuseDates)}
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
              {display(form.thirdAbuseDate)}
            </p>
            <p>
              <span className="text-slate-500">Anyone else hear or see:</span>{" "}
              {displayIdkNoYes(form.thirdAbuseWitnesses)}
            </p>
            {form.thirdAbuseWitnesses === "yes" && (
              <p>
                <span className="text-slate-500">
                  Names / who saw or heard:
                </span>{" "}
                {display(form.thirdAbuseWitnessDetail)}
              </p>
            )}
            <p>
              <span className="text-slate-500">Weapon used or threatened:</span>{" "}
              {displayYn(form.thirdAbuseWeapon)}
            </p>
            {form.thirdAbuseWeapon === "yes" && (
              <p>
                <span className="text-slate-500">Weapon:</span>{" "}
                {display(form.thirdAbuseWeaponDetail)}
              </p>
            )}
            <p>
              <span className="text-slate-500">
                Emotional or physical harm:
              </span>{" "}
              {displayYn(form.thirdAbuseHarm)}
            </p>
            {form.thirdAbuseHarm === "yes" && (
              <p>
                <span className="text-slate-500">Harm:</span>{" "}
                {display(form.thirdAbuseHarmDetail)}
              </p>
            )}
            <p>
              <span className="text-slate-500">Police came:</span>{" "}
              {displayIdkNoYes(form.thirdAbusePolice)}
            </p>
            <p>
              <span className="text-slate-500">Details of abuse:</span>{" "}
              {display(form.thirdAbuseDetails)}
            </p>
            <p>
              <span className="text-slate-500">Frequency:</span>{" "}
              {frequencyReviewLabel(form.thirdAbuseFrequency)}
            </p>
            {form.thirdAbuseFrequency === "other" && (
              <p>
                <span className="text-slate-500">Frequency (other):</span>{" "}
                {display(form.thirdAbuseFrequencyOther)}
              </p>
            )}
            {form.thirdAbuseFrequency !== "" &&
              form.thirdAbuseFrequency !== "once" && (
                <p>
                  <span className="text-slate-500">Dates or estimates:</span>{" "}
                  {display(form.thirdAbuseDates)}
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
              {displayIdkNoYes(form.hasFirearms)}
            </p>
            {form.hasFirearms === "yes" &&
              form.firearms.map((f, i) => (
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
              {form.orderToNotAbuse ? "Yes" : "No"}
            </p>
            <p>
              <span className="text-slate-500">No-Contact Order:</span>{" "}
              {form.noContactOrder ? "Yes" : "No"}
            </p>
            <p>
              <span className="text-slate-500">Stay-Away Order:</span>{" "}
              {form.stayAwayOrder ? "Yes" : "No"}
            </p>
            {form.stayAwayOrder ? (
              <div className="space-y-1 border-l-2 border-purple-200/80 pl-3 text-slate-800">
                <p>
                  <span className="text-slate-500">Stay away from:</span>{" "}
                  {(() => {
                    const parts: string[] = [];
                    if (form.stayAwayMe) parts.push("Me");
                    if (form.stayAwayHome) parts.push("My home");
                    if (form.stayAwayWork) {
                      parts.push("My job or workplace");
                    }
                    if (form.stayAwayVehicle) {
                      parts.push("My vehicle");
                    }
                    if (form.stayAwaySchool) {
                      parts.push("My school");
                    }
                    if (form.stayAwayProtectedPersons) {
                      parts.push("Each person in Section 8");
                    }
                    if (form.stayAwayChildrenSchool) {
                      parts.push("My children's school or childcare");
                    }
                    if (form.stayAwayOther) {
                      parts.push(
                        form.stayAwayOtherExplain.trim()
                          ? `Other (${form.stayAwayOtherExplain.trim()})`
                          : "Other (please explain)",
                      );
                    }
                    return parts.length > 0 ? parts.join(", ") : "—";
                  })()}
                </p>
                <p>
                  <span className="text-slate-500">Distance:</span>{" "}
                  {form.stayAwayDistance === "hundred"
                    ? "100 yards (300 feet)"
                    : form.stayAwayDistance === "other"
                      ? form.stayAwayDistanceOther.trim()
                        ? `${form.stayAwayDistanceOther.trim()} yards`
                        : "Other (yards not specified)"
                      : "—"}
                </p>
                <p>
                  <span className="text-slate-500">Live together/close:</span>{" "}
                  {form.liveTogether === "no"
                    ? "No"
                    : form.liveTogether === "yes"
                      ? (() => {
                          const sub =
                            form.liveTogetherType === "liveTogether"
                              ? "Live together"
                              : form.liveTogetherType === "sameBuilding"
                                ? "Same building, not same home"
                                : form.liveTogetherType === "sameNeighborhood"
                                  ? "Same neighborhood"
                                  : form.liveTogetherType === "other"
                                    ? form.liveTogetherOther.trim()
                                      ? `Other (${form.liveTogetherOther.trim()})`
                                      : "Other (please explain)"
                                    : "—";
                          return `Yes — ${sub}`;
                        })()
                      : "—"}
                </p>
                <p>
                  <span className="text-slate-500">Same workplace/school:</span>{" "}
                  {form.sameWorkplaceSchool === "no"
                    ? "No"
                    : form.sameWorkplaceSchool === "yes"
                      ? (() => {
                          const bits: string[] = [];
                          if (form.workTogether) {
                            bits.push(
                              form.workTogetherCompany.trim()
                                ? `Work together at ${form.workTogetherCompany.trim()}`
                                : "Work together (company not specified)",
                            );
                          }
                          if (form.sameSchool) {
                            bits.push(
                              form.sameSchoolName.trim()
                                ? `Same school: ${form.sameSchoolName.trim()}`
                                : "Same school (name not specified)",
                            );
                          }
                          if (form.sameWorkplaceOther) {
                            bits.push(
                              form.sameWorkplaceOtherExplain.trim()
                                ? `Other: ${form.sameWorkplaceOtherExplain.trim()}`
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
              {form.orderToMoveOut ? "Yes" : "No"}
            </p>
            {form.orderToMoveOut ? (
              <div className="space-y-1 border-l-2 border-purple-200/80 pl-3">
                <p>
                  <span className="text-slate-500">13a:</span>{" "}
                  {display(form.moveOutOrderPersonAsk)}
                </p>
                <p>
                  <span className="text-slate-500">13b:</span>{" "}
                  {(() => {
                    const parts: string[] = [];
                    if (form.moveOutOwnHome) parts.push("I own the home");
                    if (form.moveOutNameOnLease) {
                      parts.push("My name is on the lease");
                    }
                    if (form.moveOutWithChildren) {
                      parts.push("I live at this address with my children");
                    }
                    if (form.moveOutLivedFor) {
                      const y = form.moveOutLivedYears.trim();
                      const m = form.moveOutLivedMonths.trim();
                      const dur =
                        y || m
                          ? `I have lived at this address for (${y || "—"} yr, ${m || "—"} mo)`
                          : "I have lived at this address for";
                      parts.push(dur);
                    }
                    if (form.moveOutPaysRent) {
                      parts.push(
                        "I pay for some or all of the rent or mortgage",
                      );
                    }
                    if (form.moveOutOther) {
                      parts.push(
                        form.moveOutOtherExplain.trim()
                          ? `Other (${form.moveOutOtherExplain.trim()})`
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
              {form.otherOrders ? "Yes" : "No"}
            </p>
            {form.otherOrders && (
              <p>
                <span className="text-slate-500">14. Describe:</span>{" "}
                {display(form.otherOrdersDescribe)}
              </p>
            )}
            <p>
              <span className="text-slate-500">
                Child custody and visitation:
              </span>{" "}
              {form.childCustodyVisitation ? "Yes (complete DV-105)" : "No"}
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
              {form.protectAnimals ? "Yes" : "No"}
            </p>
            {form.protectAnimals ? (
              <div className="space-y-1 border-l-2 border-purple-200/80 pl-3">
                {form.protectedAnimals.map((a, i) => (
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
                  {form.protectAnimalsStayAway
                    ? form.protectAnimalsStayAwayDistance === "hundred"
                      ? "100 yards (300 feet)"
                      : form.protectAnimalsStayAwayDistance === "other"
                        ? form.protectAnimalsStayAwayOtherYards.trim()
                          ? `${form.protectAnimalsStayAwayOtherYards.trim()} yards`
                          : "Other (yards not specified)"
                        : "—"
                    : "No"}
                </p>
                <p>
                  <span className="text-slate-500">
                    Not take / harm animals:
                  </span>{" "}
                  {form.protectAnimalsNotTake ? "Yes" : "No"}
                </p>
                <p>
                  <span className="text-slate-500">
                    Sole possession of animals:
                  </span>{" "}
                  {form.protectAnimalsSolePossession ? "Yes" : "No"}
                </p>
                {form.protectAnimalsSolePossession ? (
                  <p>
                    <span className="text-slate-500">Reasons:</span>{" "}
                    {(() => {
                      const parts: string[] = [];
                      if (form.protectAnimalsSoleReasonAbuse) {
                        parts.push("Person in 2 abuses the animals");
                      }
                      if (form.protectAnimalsSoleReasonCare) {
                        parts.push("I take care of these animals");
                      }
                      if (form.protectAnimalsSoleReasonPurchased) {
                        parts.push("I purchased these animals");
                      }
                      if (form.protectAnimalsSoleReasonOther) {
                        parts.push(
                          form.protectAnimalsSoleReasonOtherExplain.trim()
                            ? `Other (${form.protectAnimalsSoleReasonOtherExplain.trim()})`
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
              {form.controlProperty ? "Yes" : "No"}
            </p>
            {form.controlProperty ? (
              <>
                <p>
                  <span className="text-slate-500">17a:</span>{" "}
                  {display(form.controlPropertyDescribe)}
                </p>
                <p>
                  <span className="text-slate-500">17b:</span>{" "}
                  {display(form.controlPropertyWhy)}
                </p>
              </>
            ) : null}
            <p>
              <span className="text-slate-500">
                Health and other insurance:
              </span>{" "}
              {form.healthOtherInsurance ? "Yes" : "No"}
            </p>
            <p>
              <span className="text-slate-500">Record communications:</span>{" "}
              {form.recordCommunications ? "Yes" : "No"}
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
              {form.propertyRestraint ? "Yes" : "No"}
            </p>
            <p>
              <span className="text-slate-500">
                Extend deadline to give notice:
              </span>{" "}
              {form.extendNoticeDeadline ? "Yes" : "No"}
            </p>
            {form.extendNoticeDeadline ? (
              <p>
                <span className="text-slate-500">Why more time:</span>{" "}
                {display(form.extendNoticeExplain)}
              </p>
            ) : null}
            <p>
              <span className="text-slate-500">Pay debts for property:</span>{" "}
              {form.payDebtsForProperty ? "Yes" : "No"}
            </p>
            {form.payDebtsForProperty ? (
              <div className="space-y-1 border-l-2 border-purple-200/80 pl-3">
                {form.payDebtsRows.map((d, i) => (
                  <p key={`pd-${i}`}>
                    <span className="text-slate-500">Debt {i + 1}:</span>{" "}
                    {display(d.payTo)} / {display(d.payFor)} /{" "}
                    {display(d.amount)} / {display(d.dueDate)}
                  </p>
                ))}
                <p>
                  <span className="text-slate-500">Why they should pay:</span>{" "}
                  {display(form.payDebtsExplain)}
                </p>
                <p>
                  <span className="text-slate-500">Special judge finding:</span>{" "}
                  {form.payDebtsSpecialDecision === "yes"
                    ? "Yes"
                    : form.payDebtsSpecialDecision === "no"
                      ? "No"
                      : "—"}
                </p>
                {form.payDebtsSpecialDecision === "yes" ? (
                  <>
                    <p>
                      <span className="text-slate-500">Debts from abuse:</span>{" "}
                      {[
                        form.payDebtsAbuseDebt1 && "1",
                        form.payDebtsAbuseDebt2 && "2",
                        form.payDebtsAbuseDebt3 && "3",
                      ]
                        .filter(Boolean)
                        .join(", ") || "—"}
                    </p>
                    <p>
                      <span className="text-slate-500">
                        Know how debts were made:
                      </span>{" "}
                      {form.payDebtsKnowHow === "yes"
                        ? "Yes"
                        : form.payDebtsKnowHow === "no"
                          ? "No"
                          : "—"}
                    </p>
                    {form.payDebtsKnowHow === "yes" ? (
                      <p>
                        <span className="text-slate-500">How:</span>{" "}
                        {display(form.payDebtsExplainHow)}
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
              {form.requestRestitution ? "Yes" : "No"}
            </p>
            {form.requestRestitution ? (
              <>
                <p>
                  <span className="text-slate-500">
                    Abuser pays $250 LIZ fee (invoice appended):
                  </span>{" "}
                  {form.requestAbuserPayLizFee ? "Yes" : "No"}
                </p>
                <div className="mt-2 space-y-1">
                  <p className="text-slate-500">Expense grid:</p>
                  <ul className="list-inside list-disc text-slate-700">
                    {form.restitutionExpenses.map((row, i) => (
                      <li key={i}>
                        {i + 1}. Pay to: {display(row.payTo)} · For:{" "}
                        {display(row.forReason)} · Amount: {display(row.amount)}
                      </li>
                    ))}
                  </ul>
                </div>
              </>
            ) : null}
            <p>
              <span className="text-slate-500">Child support:</span>{" "}
              {form.requestChildSupport ? "Yes" : "No"}
            </p>
            {form.requestChildSupport ? (
              <ul className="ml-4 list-inside list-disc space-y-0.5 text-slate-700">
                <li>
                  No order, want one:{" "}
                  {form.childSupportNoOrderWantOne ? "Yes" : "No"}
                </li>
                <li>
                  Have order, want changed:{" "}
                  {form.childSupportHaveOrderWantChanged ? "Yes" : "No"}
                </li>
                <li>
                  TANF / Welfare / CalWORKS:{" "}
                  {form.childSupportTANF ? "Yes" : "No"}
                </li>
              </ul>
            ) : null}
            <p>
              <span className="text-slate-500">Spousal support:</span>{" "}
              {form.requestSpousalSupport ? "Yes" : "No"}
            </p>
            <p>
              <span className="text-slate-500">
                Lawyer&apos;s fees and costs:
              </span>{" "}
              {form.requestLawyerFees ? "Yes" : "No"}
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
              {form.requestBattererIntervention ? "Yes" : "No"}
            </p>
            <p>
              <span className="text-slate-500">
                Transfer of wireless phone account (Section 28):
              </span>{" "}
              {form.requestWirelessTransfer ? "Yes" : "No"}
            </p>
            {form.requestWirelessTransfer ? (
              <div className="mt-2 space-y-1">
                <p className="text-slate-500">Wireless number rows:</p>
                <ul className="list-inside list-disc text-slate-700">
                  {form.wirelessAccounts.map((row, i) => (
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
              {displayYn(form.hasRestrainingOrders)}
            </p>
            {form.hasRestrainingOrders === "yes" && (
              <>
                <p>
                  <span className="text-slate-500">
                    Order 1 — date / expires:
                  </span>{" "}
                  {display(form.order1Date)} / {display(form.order1Expires)}
                </p>
                <p>
                  <span className="text-slate-500">
                    Order 2 — date / expires:
                  </span>{" "}
                  {display(form.order2Date)} / {display(form.order2Expires)}
                </p>
              </>
            )}
            <p>
              <span className="text-slate-500">Other court case filed:</span>{" "}
              {displayYn(form.hasOtherCases)}
            </p>
            {form.hasOtherCases === "yes" && (
              <>
                <p>
                  <span className="text-slate-500">Case types:</span>{" "}
                  {labelsForValues(form.caseTypes, CASE_TYPE_OPTIONS)}
                </p>
                {form.caseTypes.includes("custody") && (
                  <p>
                    <span className="text-slate-500">
                      Custody — case details:
                    </span>{" "}
                    {display(form.custodyCaseDetails)}
                  </p>
                )}
                {form.caseTypes.includes("divorce") && (
                  <p>
                    <span className="text-slate-500">
                      Divorce — case details:
                    </span>{" "}
                    {display(form.divorceCaseDetails)}
                  </p>
                )}
                {form.caseTypes.includes("juvenile") && (
                  <p>
                    <span className="text-slate-500">
                      Juvenile — case details:
                    </span>{" "}
                    {display(form.juvenileCaseDetails)}
                  </p>
                )}
                {form.caseTypes.includes("guardianship") && (
                  <p>
                    <span className="text-slate-500">
                      Guardianship — case details:
                    </span>{" "}
                    {display(form.guardianshipCaseDetails)}
                  </p>
                )}
                {form.caseTypes.includes("criminal") && (
                  <p>
                    <span className="text-slate-500">
                      Criminal — case details:
                    </span>{" "}
                    {display(form.criminalCaseDetails)}
                  </p>
                )}
                {form.caseTypes.includes("other") && (
                  <p>
                    <span className="text-slate-500">
                      Other — what kind of case:
                    </span>{" "}
                    {display(form.otherCaseType)}
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
