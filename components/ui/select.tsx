/**
 * Select UI Component
 * Following UI/UX Standards
 * Enhanced with SelectItem support
 */

import {
  SelectHTMLAttributes,
  forwardRef,
  ReactNode,
  useState,
  useRef,
  useEffect,
} from "react";

export interface SelectProps extends Omit<
  SelectHTMLAttributes<HTMLSelectElement>,
  "onValueChange"
> {
  className?: string;
  value?: string;
  onValueChange?: (value: string) => void;
  children?: ReactNode;
}

export interface SelectTriggerProps {
  children: ReactNode;
  className?: string;
}

export interface SelectContentProps {
  children: ReactNode;
  className?: string;
}

export interface SelectValueProps {
  placeholder?: string;
  className?: string;
  children?: ReactNode;
}

export interface SelectItemProps {
  children: ReactNode;
  value: string;
  className?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className = "", children, value, onValueChange, ...props }, ref) => {
    const internalRef = useRef<HTMLSelectElement>(null);
    const selectRef =
      (ref as React.RefObject<HTMLSelectElement>) || internalRef;

    const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      if (onValueChange) {
        onValueChange(e.target.value);
      }
      if (props.onChange) {
        props.onChange(e);
      }
    };

    return (
      <select
        ref={selectRef}
        value={value}
        onChange={handleChange}
        className={`bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-colors ${className}`}
        {...props}
      >
        {children}
      </select>
    );
  },
);

Select.displayName = "Select";

// Shadcn-style components for compatibility
export function SelectTrigger({
  children,
  className = "",
}: SelectTriggerProps) {
  return (
    <div
      className={`bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white flex items-center justify-between ${className}`}
    >
      {children}
    </div>
  );
}

export function SelectContent({
  children,
  className = "",
}: SelectContentProps) {
  return <div className={className}>{children}</div>;
}

export function SelectValue({
  placeholder,
  children,
  className = "",
}: SelectValueProps) {
  return (
    <span className={className}>{children || placeholder || "Select..."}</span>
  );
}

export function SelectItem({
  children,
  value,
  className = "",
}: SelectItemProps) {
  return (
    <option value={value} className={className}>
      {children}
    </option>
  );
}
