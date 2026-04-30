/**
 * Label UI Component
 * Following UI/UX Standards
 */

import { LabelHTMLAttributes, forwardRef } from "react";

export interface LabelProps extends LabelHTMLAttributes<HTMLLabelElement> {
  className?: string;
}

export const Label = forwardRef<HTMLLabelElement, LabelProps>(
  ({ className = "", ...props }, ref) => {
    return (
      <label
        ref={ref}
        className={`text-sm font-medium text-white block mb-2 ${className}`}
        {...props}
      />
    );
  },
);

Label.displayName = "Label";
