import * as React from "react";

import { formFieldInputClassName } from "./input";

export const formFieldTextareaClassName = `${formFieldInputClassName} min-h-[6.5rem] resize-y`;

export const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.ComponentPropsWithoutRef<"textarea">
>(({ className = "", ...props }, ref) => (
  <textarea
    ref={ref}
    className={[formFieldTextareaClassName, className].filter(Boolean).join(" ")}
    {...props}
  />
));
Textarea.displayName = "Textarea";
