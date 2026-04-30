"use client";

import { motion } from "framer-motion";
import PremiumSpinner from "./PremiumSpinner";

interface PremiumLoaderProps {
  message?: string;
  size?: "sm" | "md" | "lg" | "xl";
  variant?: "default" | "minimal" | "pulse";
  fullScreen?: boolean;
  className?: string;
}

export default function PremiumLoader({
  message,
  size = "md",
  variant = "default",
  fullScreen = false,
  className = "",
}: PremiumLoaderProps) {
  const content = (
    <div
      className={`flex flex-col items-center justify-center gap-4 ${className}`}
    >
      <PremiumSpinner size={size} variant={variant} />
      {message && (
        <motion.p
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-sm text-white/70 font-medium tracking-wide"
        >
          {message}
        </motion.p>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl"
        >
          {content}
        </motion.div>
      </div>
    );
  }

  return content;
}
