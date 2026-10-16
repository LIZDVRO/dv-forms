"use client";

import { useEffect } from "react";

const QUICK_EXIT_URL = "https://us.shein.com/";

/** Leave at once (Esc works too). replace() keeps this page out of the Back button's history. */
export function QuickExitButton() {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") window.location.replace(QUICK_EXIT_URL);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
  return (
    <button
      type="button"
      onClick={() => window.location.replace(QUICK_EXIT_URL)}
      className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-red-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-400"
      title="Leave this site now (Esc)"
    >
      Quick exit
    </button>
  );
}
