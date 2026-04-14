import * as React from "react";

/** Control styles only (no outer margin) — for tight layouts like table cells. */
export const formFieldInputControlClassName =
  "w-full rounded-none border-0 border-b-2 border-b-purple-200/90 bg-transparent px-0 py-3 text-base text-slate-900 shadow-none outline-none ring-0 transition placeholder:text-slate-400 focus:border-b-liz focus:outline-none focus:ring-0 focus-visible:border-b-liz focus-visible:outline-none focus-visible:ring-0";

/** Default stacked fields: `mt-2` + underline control styles. */
export const formFieldInputClassName = `mt-2 ${formFieldInputControlClassName}`;

export const Input = React.forwardRef<
  HTMLInputElement,
  React.ComponentPropsWithoutRef<"input">
>(({ className = "", ...props }, ref) => (
  <input
    ref={ref}
    className={[formFieldInputClassName, className].filter(Boolean).join(" ")}
    {...props}
  />
));
Input.displayName = "Input";
