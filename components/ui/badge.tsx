/**
 * Badge UI Component
 * Following UI/UX Standards
 */

import { ReactNode } from "react";

export interface BadgeProps {
  children: ReactNode;
  variant?:
    | "default"
    | "success"
    | "warning"
    | "error"
    | "info"
    | "purple"
    | "gold"
    | "silver";
  className?: string;
}

const variantStyles = {
  default: "bg-gray-500/20 text-gray-400 border-gray-500/30",
  success: "bg-green-500/20 text-green-400 border-green-500/30",
  warning: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  error: "bg-red-500/20 text-red-400 border-red-500/30",
  info: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
  purple: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  gold: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  silver: "bg-gray-500/20 text-gray-400 border-gray-500/30",
};

export function Badge({
  children,
  variant = "default",
  className = "",
}: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium border ${variantStyles[variant]} ${className}`}
    >
      {children}
    </span>
  );
}
