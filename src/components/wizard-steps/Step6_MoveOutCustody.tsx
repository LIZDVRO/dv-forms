"use client";

import { useFormStore } from "@/store/useFormStore";

import {
  MOVE_OUT_13A_MAX_LENGTH,
  MOVE_OUT_13B_OTHER_MAX_LENGTH,
  MOVE_OUT_DURATION_MAX_LENGTH,
  OTHER_ORDERS_14_MAX_LENGTH,
} from "./wizardShared";

type Step6Props = {
  inputClass: string;
  textareaClass: string;
};

export default function Step6_MoveOutCustody({
  inputClass,
  textareaClass,
}: Step6Props) {
  const moveOut = useFormStore((s) => s.moveOut);
  const setMoveOut = useFormStore((s) => s.setMoveOut);
  const wantsCustodyOrders = useFormStore((s) => s.custodyOrders.wantsCustodyOrders);
  const setCustodyOrders = useFormStore((s) => s.setCustodyOrders);

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

      <section className="space-y-4 border-t border-purple-100/90 pt-8">
        <h2 className="text-sm font-semibold text-slate-900">Section 15. Child custody</h2>
        <label className="flex cursor-pointer items-start gap-3 py-3 pr-2 pl-0.5 transition">
          <input
            type="checkbox"
            checked={wantsCustodyOrders === "yes"}
            onChange={(e) =>
              setCustodyOrders({
                wantsCustodyOrders: e.target.checked ? "yes" : "",
              })
            }
            className="mt-1 size-4 shrink-0 rounded-sm border border-purple-300/80 text-purple-700 accent-purple-700 outline-none focus-visible:ring-2 focus-visible:ring-purple-700 focus-visible:ring-offset-1"
          />
          <span className="text-sm font-medium text-slate-800">
            Child Custody and Visitation
          </span>
        </label>
        {wantsCustodyOrders === "yes" && (
          <div
            className="rounded-xl border border-purple-200/90 bg-purple-50/80 px-4 py-3 text-sm leading-relaxed text-purple-950"
            role="status"
          >
            You must fill out form{" "}
            <a
              href="https://www.courts.ca.gov/documents/dv105.pdf"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-liz underline underline-offset-2 hover:text-purple-800"
            >
              DV-105
            </a>
            ...
          </div>
        )}
      </section>
    </div>
  );
}
