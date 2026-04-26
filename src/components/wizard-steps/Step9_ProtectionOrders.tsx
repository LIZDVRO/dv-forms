"use client";

import type { ProtectionOrdersInfo } from "@/store/useFormStore";
import { useFormStore } from "@/store/useFormStore";

import {
  MOVE_OUT_13A_MAX_LENGTH,
  MOVE_OUT_13B_OTHER_MAX_LENGTH,
  MOVE_OUT_DURATION_MAX_LENGTH,
  OTHER_ORDERS_14_MAX_LENGTH,
} from "./wizardShared";

const clearedStayAwayState: Pick<
  ProtectionOrdersInfo,
  | "wantsStayAway"
  | "stayAwayFrom"
  | "stayAwayDistance"
  | "stayAwayDistanceOther"
  | "liveTogether"
  | "liveTogetherType"
  | "liveTogetherOther"
  | "sameWorkOrSchool"
  | "sameWorkOrSchoolDetails"
> = {
  wantsStayAway: false,
  stayAwayFrom: {
    me: false,
    myHome: false,
    myJob: false,
    myVehicle: false,
    mySchool: false,
    childrensSchool: false,
    eachProtectedPerson: false,
    other: false,
    otherDescription: "",
  },
  stayAwayDistance: "",
  stayAwayDistanceOther: "",
  liveTogether: "",
  liveTogetherType: "",
  liveTogetherOther: "",
  sameWorkOrSchool: "",
  sameWorkOrSchoolDetails: {
    workTogether: false,
    workCompanyName: "",
    sameSchool: false,
    schoolName: "",
    other: false,
    otherDescription: "",
  },
};

type Step9Props = {
  inputClass: string;
  textareaClass: string;
};

export default function Step9_ProtectionOrders({
  inputClass,
  textareaClass,
}: Step9Props) {
  const protectionOrders = useFormStore((s) => s.protectionOrders);
  const setProtectionOrders = useFormStore((s) => s.setProtectionOrders);
  const moveOut = useFormStore((s) => s.moveOut);
  const setMoveOut = useFormStore((s) => s.setMoveOut);

  const { stayAwayFrom: sa, sameWorkOrSchoolDetails: ws } = protectionOrders;
  const rl = moveOut.rightToLive;

  const resetMoveOutFields = () => {
    setMoveOut({
      wantsMoveOut: false,
      moveOutAddress: "",
      rightToLive: {
        ownHome: false,
        nameOnLease: false,
        payRentOrMortgage: false,
        liveWithChildren: false,
        yearsAtAddress: "",
        monthsAtAddress: "",
        other: false,
        otherDescription: "",
      },
    });
  };

  return (
    <div className="space-y-10">
      <section className="space-y-4">
        <h2 className="text-sm font-semibold text-slate-900">
          Section 10. Order to not abuse
        </h2>
        <label className="flex cursor-pointer items-start gap-3 py-3 pr-2 pl-0.5 transition">
          <input
            type="checkbox"
            checked={protectionOrders.wantsOrderToNotAbuse}
            onChange={(e) =>
              setProtectionOrders({ wantsOrderToNotAbuse: e.target.checked })
            }
            className="mt-1 size-4 shrink-0 rounded-sm border border-purple-300/80 text-purple-700 accent-purple-700 outline-none focus-visible:ring-2 focus-visible:ring-purple-700 focus-visible:ring-offset-1"
          />
          <span className="text-sm font-medium text-slate-800">
            Order to Not Abuse
          </span>
        </label>
        <p className="rounded-xl border border-purple-100/80 bg-purple-50/40 px-4 py-3 text-sm leading-relaxed text-slate-800">
          I ask the judge to order the person in item 2 to not do the following
          things to me or anyone listed in Section 8: Harass, attack, strike,
          threaten, assault (sexually or otherwise), hit, follow, stalk, molest,
          destroy personal property, keep under surveillance, impersonate (on
          the internet, electronically, or otherwise), block movements, annoy by
          phone or other electronic means (including repeatedly contact), or
          disturb the peace.
        </p>
        <p className="text-sm leading-relaxed text-slate-700">
          For more information on what &apos;disturbing the peace&apos; means,
          read form{" "}
          <a
            href="https://courts.ca.gov/sites/default/files/courts/default/2024-11/dv500info.pdf"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-liz underline underline-offset-2 hover:text-liz"
          >
            DV-500-INFO
          </a>
          , Can a Domestic Violence Restraining Order Help Me?
        </p>
      </section>

      <section className="space-y-4 border-t border-purple-100/90 pt-8">
        <h2 className="text-sm font-semibold text-slate-900">
          Section 11. No-contact order
        </h2>
        <label className="flex cursor-pointer items-start gap-3 py-3 pr-2 pl-0.5 transition">
          <input
            type="checkbox"
            checked={protectionOrders.wantsNoContact}
            onChange={(e) =>
              setProtectionOrders({ wantsNoContact: e.target.checked })
            }
            className="mt-1 size-4 shrink-0 rounded-sm border border-purple-300/80 text-purple-700 accent-purple-700 outline-none focus-visible:ring-2 focus-visible:ring-purple-700 focus-visible:ring-offset-1"
          />
          <span className="text-sm font-medium text-slate-800">No-Contact Order</span>
        </label>
        <p className="text-sm leading-relaxed text-slate-700">
          I ask the judge to order the person in item 2 to not contact me or
          anyone listed in Section 8.
        </p>
      </section>

      <section className="space-y-6 border-t border-purple-100/90 pt-8">
        <h2 className="text-sm font-semibold text-slate-900">
          Section 12. Stay-away order
        </h2>
        <label className="flex cursor-pointer items-start gap-3 py-3 pr-2 pl-0.5 transition">
          <input
            type="checkbox"
            checked={protectionOrders.wantsStayAway}
            onChange={(e) => {
              if (e.target.checked) {
                setProtectionOrders({ wantsStayAway: true });
              } else {
                setProtectionOrders(clearedStayAwayState);
              }
            }}
            className="mt-1 size-4 shrink-0 rounded-sm border border-purple-300/80 text-purple-700 accent-purple-700 outline-none focus-visible:ring-2 focus-visible:ring-purple-700 focus-visible:ring-offset-1"
          />
          <span className="text-sm font-medium text-slate-800">Stay-Away Order</span>
        </label>

        {protectionOrders.wantsStayAway && (
          <div className="space-y-8">
            <p className="text-sm leading-relaxed text-slate-700">
              I ask the judge to order the person in item 2 to stay away from the
              places and people checked below.
            </p>

            <div>
              <h3 className="text-sm font-medium text-slate-800">
                12a. Stay away from (check all that apply)
              </h3>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div className="space-y-3">
                  {(
                    [
                      { key: "me" as const, label: "Me" },
                      { key: "myHome" as const, label: "My home" },
                      { key: "myJob" as const, label: "My job or workplace" },
                      { key: "myVehicle" as const, label: "My vehicle" },
                    ] as const
                  ).map(({ key, label }) => (
                    <label
                      key={key}
                      className="flex cursor-pointer items-start gap-3 py-2.5 pr-2 pl-0.5 transition"
                    >
                      <input
                        type="checkbox"
                        checked={Boolean(sa[key])}
                        onChange={(e) =>
                          setProtectionOrders({
                            stayAwayFrom: { ...sa, [key]: e.target.checked },
                          })
                        }
                        className="mt-0.5 size-4 shrink-0 rounded-sm border border-purple-300/80 text-purple-700 accent-purple-700 outline-none focus-visible:ring-2 focus-visible:ring-purple-700 focus-visible:ring-offset-1"
                      />
                      <span className="text-sm text-slate-800">{label}</span>
                    </label>
                  ))}
                </div>
                <div className="space-y-3">
                  {(
                    [
                      { key: "mySchool" as const, label: "My school" },
                      {
                        key: "eachProtectedPerson" as const,
                        label: "Each person in Section 8",
                      },
                      {
                        key: "childrensSchool" as const,
                        label: "My children's school or childcare",
                      },
                      {
                        key: "other" as const,
                        label: "Other (please explain)",
                      },
                    ] as const
                  ).map(({ key, label }) => (
                    <label
                      key={key}
                      className="flex cursor-pointer items-start gap-3 py-2.5 pr-2 pl-0.5 transition"
                    >
                      <input
                        type="checkbox"
                        checked={Boolean(sa[key])}
                        onChange={(e) =>
                          setProtectionOrders({
                            stayAwayFrom: { ...sa, [key]: e.target.checked },
                          })
                        }
                        className="mt-0.5 size-4 shrink-0 rounded-sm border border-purple-300/80 text-purple-700 accent-purple-700 outline-none focus-visible:ring-2 focus-visible:ring-purple-700 focus-visible:ring-offset-1"
                      />
                      <span className="text-sm text-slate-800">{label}</span>
                    </label>
                  ))}
                </div>
              </div>
              {sa.other && (
                <div className="mt-4">
                  <label
                    htmlFor="stayAwayOtherExplain"
                    className="text-sm font-medium text-slate-800"
                  >
                    Explain &quot;Other&quot;
                  </label>
                  <input
                    id="stayAwayOtherExplain"
                    type="text"
                    autoComplete="off"
                    value={sa.otherDescription}
                    onChange={(e) =>
                      setProtectionOrders({
                        stayAwayFrom: {
                          ...sa,
                          otherDescription: e.target.value,
                        },
                      })
                    }
                    className={inputClass}
                  />
                </div>
              )}
            </div>

            <fieldset className="space-y-4">
              <legend className="text-sm font-medium text-slate-800">
                12b. How far do you want the person to stay away?
              </legend>
              <div className="space-y-3">
                {(
                  [
                    { value: "100" as const, label: "100 yards (300 feet)" },
                    {
                      value: "other" as const,
                      label: "Other (give distance in yards)",
                    },
                  ] as const
                ).map(({ value, label }) => (
                  <label
                    key={value}
                    className="flex cursor-pointer items-start gap-3 py-3 pr-2 pl-0.5 transition"
                  >
                    <input
                      type="radio"
                      name="stayAwayDistance"
                      checked={protectionOrders.stayAwayDistance === value}
                      onChange={() => {
                        setProtectionOrders({
                          stayAwayDistance: value,
                          stayAwayDistanceOther:
                            value === "other"
                              ? protectionOrders.stayAwayDistanceOther
                              : "",
                        });
                      }}
                      className="mt-1 size-4 shrink-0 rounded-sm border border-purple-300/80 text-purple-700 accent-purple-700 outline-none focus-visible:ring-2 focus-visible:ring-purple-700 focus-visible:ring-offset-1"
                    />
                    <span className="text-sm leading-relaxed text-slate-800">
                      {label}
                    </span>
                  </label>
                ))}
              </div>
              {protectionOrders.stayAwayDistance === "other" && (
                <div>
                  <label
                    htmlFor="stayAwayDistanceOther"
                    className="text-sm font-medium text-slate-800"
                  >
                    Distance in yards
                  </label>
                  <input
                    id="stayAwayDistanceOther"
                    type="text"
                    autoComplete="off"
                    placeholder="e.g. 50"
                    value={protectionOrders.stayAwayDistanceOther}
                    onChange={(e) =>
                      setProtectionOrders({
                        stayAwayDistanceOther: e.target.value,
                      })
                    }
                    className={inputClass}
                  />
                </div>
              )}
            </fieldset>

            <fieldset className="space-y-4">
              <legend className="text-sm font-medium text-slate-800">
                12c. Do you and the person in item 2 live together or live close to
                each other?
              </legend>
              <div className="space-y-3">
                {(
                  [
                    { value: "no" as const, label: "No" },
                    { value: "yes" as const, label: "Yes" },
                  ] as const
                ).map(({ value, label }) => (
                  <label
                    key={value}
                    className="flex cursor-pointer items-start gap-3 py-3 pr-2 pl-0.5 transition"
                  >
                    <input
                      type="radio"
                      name="liveTogether"
                      checked={protectionOrders.liveTogether === value}
                      onChange={() =>
                        setProtectionOrders({
                          liveTogether: value,
                          liveTogetherType: "",
                          liveTogetherOther: "",
                        })
                      }
                      className="mt-1 size-4 shrink-0 rounded-sm border border-purple-300/80 text-purple-700 accent-purple-700 outline-none focus-visible:ring-2 focus-visible:ring-purple-700 focus-visible:ring-offset-1"
                    />
                    <span className="text-sm leading-relaxed text-slate-800">
                      {label}
                    </span>
                  </label>
                ))}
              </div>
              {protectionOrders.liveTogether === "yes" && (
                <div className="space-y-3 pl-0 sm:pl-2">
                  <p className="text-sm font-medium text-slate-800">If yes, check one:</p>
                  <div className="space-y-3">
                    {(
                      [
                        {
                          value: "samehome" as const,
                          label: "Live together",
                          hint: "(If you live together, you can ask that the person in item 2 move out in Section 13.)",
                        },
                        {
                          value: "samebuilding" as const,
                          label:
                            "Live in the same building, but not in the same home",
                        },
                        {
                          value: "sameneighborhood" as const,
                          label: "Live in the same neighborhood",
                        },
                        { value: "other" as const, label: "Other (please explain)" },
                      ] as const
                    ).map((row) => {
                      const { value, label } = row;
                      const hint = "hint" in row ? row.hint : undefined;
                      return (
                        <label
                          key={value}
                          className="flex cursor-pointer items-start gap-3 py-3 pr-2 pl-0.5 transition"
                        >
                          <input
                            type="radio"
                            name="liveTogetherType"
                            checked={protectionOrders.liveTogetherType === value}
                            onChange={() =>
                              setProtectionOrders({
                                liveTogetherType: value,
                                liveTogetherOther:
                                  value === "other"
                                    ? protectionOrders.liveTogetherOther
                                    : "",
                              })
                            }
                            className="mt-1 size-4 shrink-0 rounded-sm border border-purple-300/80 text-purple-700 accent-purple-700 outline-none focus-visible:ring-2 focus-visible:ring-purple-700 focus-visible:ring-offset-1"
                          />
                          <span className="text-sm leading-relaxed text-slate-800">
                            {label}
                            {hint ? (
                              <span className="mt-1 block text-xs font-normal text-slate-600">
                                {hint}
                              </span>
                            ) : null}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                  {protectionOrders.liveTogetherType === "other" && (
                    <div>
                      <label
                        htmlFor="liveTogetherOther"
                        className="text-sm font-medium text-slate-800"
                      >
                        Explain
                      </label>
                      <input
                        id="liveTogetherOther"
                        type="text"
                        autoComplete="off"
                        value={protectionOrders.liveTogetherOther}
                        onChange={(e) =>
                          setProtectionOrders({
                            liveTogetherOther: e.target.value,
                          })
                        }
                        className={inputClass}
                      />
                    </div>
                  )}
                </div>
              )}
            </fieldset>

            <fieldset className="space-y-4">
              <legend className="text-sm font-medium text-slate-800">
                12d. Do you and the person in item 2 have the same workplace or go
                to the same school?
              </legend>
              <div className="space-y-3">
                {(
                  [
                    { value: "no" as const, label: "No" },
                    { value: "yes" as const, label: "Yes" },
                  ] as const
                ).map(({ value, label }) => (
                  <label
                    key={value}
                    className="flex cursor-pointer items-start gap-3 py-3 pr-2 pl-0.5 transition"
                  >
                    <input
                      type="radio"
                      name="sameWorkplaceSchool"
                      checked={protectionOrders.sameWorkOrSchool === value}
                      onChange={() =>
                        setProtectionOrders({
                          sameWorkOrSchool: value,
                          sameWorkOrSchoolDetails: {
                            workTogether: false,
                            workCompanyName: "",
                            sameSchool: false,
                            schoolName: "",
                            other: false,
                            otherDescription: "",
                          },
                        })
                      }
                      className="mt-1 size-4 shrink-0 rounded-sm border border-purple-300/80 text-purple-700 accent-purple-700 outline-none focus-visible:ring-2 focus-visible:ring-purple-700 focus-visible:ring-offset-1"
                    />
                    <span className="text-sm leading-relaxed text-slate-800">
                      {label}
                    </span>
                  </label>
                ))}
              </div>
              {protectionOrders.sameWorkOrSchool === "yes" && (
                <div className="space-y-4 pl-0 sm:pl-2">
                  <p className="text-sm font-medium text-slate-800">
                    If yes, check all that apply:
                  </p>
                  <div className="space-y-4">
                    <div className="rounded-xl border border-purple-100/80 bg-white px-4 py-3">
                      <label className="flex cursor-pointer items-start gap-3 py-1.5 pr-1">
                        <input
                          type="checkbox"
                          checked={ws.workTogether}
                          onChange={(e) =>
                            setProtectionOrders({
                              sameWorkOrSchoolDetails: {
                                ...ws,
                                workTogether: e.target.checked,
                                workCompanyName: e.target.checked
                                  ? ws.workCompanyName
                                  : "",
                              },
                            })
                          }
                          className="mt-1 size-4 shrink-0 rounded-sm border border-purple-300/80 text-purple-700 accent-purple-700 outline-none focus-visible:ring-2 focus-visible:ring-purple-700 focus-visible:ring-offset-1"
                        />
                        <span className="text-sm text-slate-800">
                          Work together at (name of company):
                        </span>
                      </label>
                      {ws.workTogether && (
                        <input
                          type="text"
                          autoComplete="off"
                          placeholder="Name of company"
                          value={ws.workCompanyName}
                          onChange={(e) =>
                            setProtectionOrders({
                              sameWorkOrSchoolDetails: {
                                ...ws,
                                workCompanyName: e.target.value,
                              },
                            })
                          }
                          className={`${inputClass} mt-2`}
                        />
                      )}
                    </div>
                    <div className="rounded-xl border border-purple-100/80 bg-white px-4 py-3">
                      <label className="flex cursor-pointer items-start gap-3 py-1.5 pr-1">
                        <input
                          type="checkbox"
                          checked={ws.sameSchool}
                          onChange={(e) =>
                            setProtectionOrders({
                              sameWorkOrSchoolDetails: {
                                ...ws,
                                sameSchool: e.target.checked,
                                schoolName: e.target.checked ? ws.schoolName : "",
                              },
                            })
                          }
                          className="mt-1 size-4 shrink-0 rounded-sm border border-purple-300/80 text-purple-700 accent-purple-700 outline-none focus-visible:ring-2 focus-visible:ring-purple-700 focus-visible:ring-offset-1"
                        />
                        <span className="text-sm text-slate-800">
                          Go to the same school (name of school):
                        </span>
                      </label>
                      {ws.sameSchool && (
                        <input
                          type="text"
                          autoComplete="off"
                          placeholder="Name of school"
                          value={ws.schoolName}
                          onChange={(e) =>
                            setProtectionOrders({
                              sameWorkOrSchoolDetails: {
                                ...ws,
                                schoolName: e.target.value,
                              },
                            })
                          }
                          className={`${inputClass} mt-2`}
                        />
                      )}
                    </div>
                    <div className="rounded-xl border border-purple-100/80 bg-white px-4 py-3">
                      <label className="flex cursor-pointer items-start gap-3 py-1.5 pr-1">
                        <input
                          type="checkbox"
                          checked={ws.other}
                          onChange={(e) =>
                            setProtectionOrders({
                              sameWorkOrSchoolDetails: {
                                ...ws,
                                other: e.target.checked,
                                otherDescription: e.target.checked
                                  ? ws.otherDescription
                                  : "",
                              },
                            })
                          }
                          className="mt-1 size-4 shrink-0 rounded-sm border border-purple-300/80 text-purple-700 accent-purple-700 outline-none focus-visible:ring-2 focus-visible:ring-purple-700 focus-visible:ring-offset-1"
                        />
                        <span className="text-sm text-slate-800">
                          Other (please explain):
                        </span>
                      </label>
                      {ws.other && (
                        <input
                          type="text"
                          autoComplete="off"
                          placeholder="Please explain"
                          value={ws.otherDescription}
                          onChange={(e) =>
                            setProtectionOrders({
                              sameWorkOrSchoolDetails: {
                                ...ws,
                                otherDescription: e.target.value,
                              },
                            })
                          }
                          className={`${inputClass} mt-2`}
                        />
                      )}
                    </div>
                  </div>
                </div>
              )}
            </fieldset>
          </div>
        )}
      </section>

      <section className="space-y-4 border-t border-purple-100/90 pt-8">
        <h2 className="text-sm font-semibold text-slate-900">
          Section 13. Order to move out
        </h2>
        <label className="flex cursor-pointer items-start gap-3 py-3 pr-2 pl-0.5 transition">
          <input
            type="checkbox"
            checked={moveOut.wantsMoveOut}
            onChange={(e) => {
              if (e.target.checked) {
                setMoveOut({ wantsMoveOut: true });
              } else {
                resetMoveOutFields();
              }
            }}
            className="mt-1 size-4 shrink-0 rounded-sm border border-purple-300/80 text-purple-700 accent-purple-700 outline-none focus-visible:ring-2 focus-visible:ring-purple-700 focus-visible:ring-offset-1"
          />
          <span className="text-sm font-medium text-slate-800">Order to Move Out</span>
        </label>

        {moveOut.wantsMoveOut && (
          <div className="space-y-6">
            <div>
              <label
                htmlFor="moveOutOrderPersonAsk"
                className="text-sm font-medium text-slate-800"
              >
                13a. I ask the judge to order the person in item 2 to move out of
                (address)
              </label>
              <input
                id="moveOutOrderPersonAsk"
                type="text"
                autoComplete="off"
                maxLength={MOVE_OUT_13A_MAX_LENGTH}
                value={moveOut.moveOutAddress}
                onChange={(e) => setMoveOut({ moveOutAddress: e.target.value })}
                className={inputClass}
              />
              <p className="mt-1 text-xs text-slate-500">
                {moveOut.moveOutAddress.length} / {MOVE_OUT_13A_MAX_LENGTH}{" "}
                characters
              </p>
            </div>

            <div>
              <h3 className="text-sm font-medium text-slate-800">
                13b. I ask the judge to find that (check all that apply)
              </h3>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {(
                  [
                    { key: "ownHome" as const, label: "I own the home" },
                    {
                      key: "nameOnLease" as const,
                      label: "My name is on the lease",
                    },
                    {
                      key: "liveWithChildren" as const,
                      label: "I live at this address with my children",
                    },
                    {
                      key: "payRentOrMortgage" as const,
                      label:
                        "I pay for some or all of the rent or mortgage",
                    },
                    {
                      key: "other" as const,
                      label: "Other (please explain)",
                    },
                  ] as const
                ).map(({ key, label }) => (
                  <label
                    key={key}
                    className="flex cursor-pointer items-start gap-3 py-2.5 pr-2 pl-0.5 transition"
                  >
                    <input
                      type="checkbox"
                      checked={Boolean(rl[key])}
                      onChange={(e) => {
                        const on = e.target.checked;
                        if (key === "other" && !on) {
                          setMoveOut({
                            rightToLive: {
                              ...rl,
                              other: false,
                              otherDescription: "",
                            },
                          });
                        } else {
                          setMoveOut({
                            rightToLive: { ...rl, [key]: on },
                          });
                        }
                      }}
                      className="mt-0.5 size-4 shrink-0 rounded-sm border border-purple-300/80 text-purple-700 accent-purple-700 outline-none focus-visible:ring-2 focus-visible:ring-purple-700 focus-visible:ring-offset-1"
                    />
                    <span className="text-sm text-slate-800">{label}</span>
                  </label>
                ))}
              </div>

              <div className="mt-4 flex flex-wrap gap-4">
                <p className="w-full text-sm font-medium text-slate-800">
                  I have lived at this address for (years / months)
                </p>
                <div className="min-w-[7rem] flex-1">
                  <label
                    htmlFor="moveOutLivedYears"
                    className="text-sm font-medium text-slate-800"
                  >
                    Years
                  </label>
                  <input
                    id="moveOutLivedYears"
                    type="text"
                    inputMode="numeric"
                    autoComplete="off"
                    maxLength={MOVE_OUT_DURATION_MAX_LENGTH}
                    value={rl.yearsAtAddress}
                    onChange={(e) =>
                      setMoveOut({
                        rightToLive: {
                          ...rl,
                          yearsAtAddress: e.target.value,
                        },
                      })
                    }
                    className={inputClass}
                  />
                </div>
                <div className="min-w-[7rem] flex-1">
                  <label
                    htmlFor="moveOutLivedMonths"
                    className="text-sm font-medium text-slate-800"
                  >
                    Months
                  </label>
                  <input
                    id="moveOutLivedMonths"
                    type="text"
                    inputMode="numeric"
                    autoComplete="off"
                    maxLength={MOVE_OUT_DURATION_MAX_LENGTH}
                    value={rl.monthsAtAddress}
                    onChange={(e) =>
                      setMoveOut({
                        rightToLive: {
                          ...rl,
                          monthsAtAddress: e.target.value,
                        },
                      })
                    }
                    className={inputClass}
                  />
                </div>
              </div>

              {rl.other && (
                <div className="mt-4">
                  <label
                    htmlFor="moveOutOtherExplain"
                    className="text-sm font-medium text-slate-800"
                  >
                    13b. Other — explain
                  </label>
                  <textarea
                    id="moveOutOtherExplain"
                    autoComplete="off"
                    maxLength={MOVE_OUT_13B_OTHER_MAX_LENGTH}
                    value={rl.otherDescription}
                    onChange={(e) =>
                      setMoveOut({
                        rightToLive: {
                          ...rl,
                          otherDescription: e.target.value,
                        },
                      })
                    }
                    className={textareaClass}
                  />
                  <p className="mt-1 text-xs text-slate-500">
                    {rl.otherDescription.length} /{" "}
                    {MOVE_OUT_13B_OTHER_MAX_LENGTH} characters
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </section>

      <section className="space-y-4 border-t border-purple-100/90 pt-8">
        <h2 className="text-sm font-semibold text-slate-900">Section 14. Other orders</h2>
        <label className="flex cursor-pointer items-start gap-3 py-3 pr-2 pl-0.5 transition">
          <input
            type="checkbox"
            checked={moveOut.otherOrders.length > 0}
            onChange={(e) => {
              if (e.target.checked) {
                setMoveOut({
                  otherOrders:
                    moveOut.otherOrders.length > 0 ? moveOut.otherOrders : " ",
                });
              } else {
                setMoveOut({ otherOrders: "" });
              }
            }}
            className="mt-1 size-4 shrink-0 rounded-sm border border-purple-300/80 text-purple-700 accent-purple-700 outline-none focus-visible:ring-2 focus-visible:ring-purple-700 focus-visible:ring-offset-1"
          />
          <span className="text-sm font-medium text-slate-800">Other Orders</span>
        </label>
        {moveOut.otherOrders.length > 0 && (
          <div>
            <label
              htmlFor="moveOutOtherOrders"
              className="text-sm font-medium text-slate-800"
            >
              14. Describe additional orders you want the judge to make
            </label>
            <textarea
              id="moveOutOtherOrders"
              autoComplete="off"
              maxLength={OTHER_ORDERS_14_MAX_LENGTH}
              value={moveOut.otherOrders}
              onChange={(e) => setMoveOut({ otherOrders: e.target.value })}
              className={textareaClass}
            />
            <p className="mt-1 text-xs text-slate-500">
              {moveOut.otherOrders.length} / {OTHER_ORDERS_14_MAX_LENGTH}{" "}
              characters
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
