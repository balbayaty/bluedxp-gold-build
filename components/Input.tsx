"use client";

import { InputHTMLAttributes } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: string;
}

export default function Input({
  label,
  error,
  icon,
  className = "",
  ...props
}: InputProps) {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-white mb-2">
          {label}
        </label>
      )}
      <div className="relative">
        {icon && (
          <i
            className={`${icon} absolute left-3 top-1/2 -translate-y-1/2 text-[#9ca3af] text-sm`}
          ></i>
        )}
        <input
          className={`w-full bg-white/5 border ${
            error ? "border-red-500" : "border-white/10"
          } rounded-lg px-4 ${icon ? "pl-10" : ""} py-2.5 text-sm text-white placeholder-[#6b7280] focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all ${className}`}
          {...props}
        />
      </div>
      {error && <p className="mt-1 text-sm text-red-400">{error}</p>}
    </div>
  );
}
