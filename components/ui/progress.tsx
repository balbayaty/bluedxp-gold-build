/**
 * Progress UI Component
 * Following UI/UX Standards
 *
 * Displays a progress bar with customizable value and styling
 */

"use client";

import { HTMLAttributes } from "react";
import { motion } from "framer-motion";

export interface ProgressProps extends HTMLAttributes<HTMLDivElement> {
  value: number; // 0-100
  className?: string;
}

export function Progress({ value, className = "", ...props }: ProgressProps) {
  // Clamp value between 0 and 100
  const clampedValue = Math.min(Math.max(value, 0), 100);

  return (
    <div
      className={`relative h-2 w-full overflow-hidden rounded-full bg-white/5 ${className}`}
      {...props}
    >
      <motion.div
        className="h-full bg-gradient-to-r from-cyan-500 to-blue-600 rounded-full"
        initial={{ width: 0 }}
        animate={{ width: `${clampedValue}%` }}
        transition={{ duration: 0.3, ease: "easeOut" }}
      />
    </div>
  );
}
