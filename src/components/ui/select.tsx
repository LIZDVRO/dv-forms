import * as React from "react";

import { formFieldInputClassName } from "./input";

/** Same treatment as text inputs for native `<select>` when you add one. */
export const formFieldSelectClassName = formFieldInputClassName;

export const Select = React.forwardRef<
  HTMLSelectElement,
  React.ComponentPropsWithoutRef<"select">
>(({ className = "", children, ...props }, ref) => (
  <select
    ref={ref}
    className={[formFieldInputClassName, className].filter(Boolean).join(" ")}
    {...props}
  >
    {children}
  </select>
));
Select.displayName = "Select";
