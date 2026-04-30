"use client";

import { ReactNode } from "react";

interface FormFieldProps {
  label: string;
  children: ReactNode;
  error?: string;
  required?: boolean;
  tooltip?: string;
}

export default function FormField({
  label,
  children,
  error,
  required,
  tooltip,
}: FormFieldProps) {
  return (
    <div className="mb-4">
      <label className="block text-sm font-medium text-white mb-2">
        {label}
        {required && <span className="text-red-400 ml-1">*</span>}
        {tooltip && (
          <span className="ml-2 text-[#9ca3af] cursor-help" title={tooltip}>
            <i className="ri-information-line"></i>
          </span>
        )}
      </label>
      {children}
      {error && <p className="mt-1 text-sm text-red-400">{error}</p>}
    </div>
  );
}
