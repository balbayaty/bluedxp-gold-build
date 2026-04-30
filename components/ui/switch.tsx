/**
 * Switch UI Component
 * Following UI/UX Standards
 */

import { InputHTMLAttributes, forwardRef } from "react";

export interface SwitchProps extends Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "type"
> {
  className?: string;
}

export const Switch = forwardRef<HTMLInputElement, SwitchProps>(
  ({ className = "", ...props }, ref) => {
    return (
      <label
        className={`relative inline-flex items-center cursor-pointer ${className}`}
      >
        <input ref={ref} type="checkbox" className="sr-only peer" {...props} />
        <div className="w-11 h-6 bg-white/10 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-cyan-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan-500"></div>
      </label>
    );
  },
);

Switch.displayName = "Switch";
