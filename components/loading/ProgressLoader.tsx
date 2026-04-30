"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";

interface ProgressLoaderProps {
  progress?: number;
  label?: string;
  showPercentage?: boolean;
  className?: string;
  size?: "sm" | "md" | "lg";
}

const sizeClasses = {
  sm: "h-0.5",
  md: "h-1",
  lg: "h-1.5",
};

export default function ProgressLoader({
  progress: externalProgress,
  label,
  showPercentage = false,
  className = "",
  size = "md",
}: ProgressLoaderProps) {
  const [internalProgress, setInternalProgress] = useState(0);
  const progress =
    externalProgress !== undefined ? externalProgress : internalProgress;

  useEffect(() => {
    if (externalProgress === undefined) {
      const interval = setInterval(() => {
        setInternalProgress((prev) => {
          if (prev >= 100) return 100;
          const increment = Math.random() * 3 + 1;
          return Math.min(prev + increment, 100);
        });
      }, 50);
      return () => clearInterval(interval);
    }
  }, [externalProgress]);

  return (
    <div className={`w-full ${className}`}>
      {(label || showPercentage) && (
        <div className="flex items-center justify-between mb-2">
          {label && (
            <span className="text-sm text-white/70 font-medium">{label}</span>
          )}
          {showPercentage && (
            <span className="text-sm text-white/60 font-light">
              {Math.round(progress)}%
            </span>
          )}
        </div>
      )}
      <div
        className={`${sizeClasses[size]} bg-white/5 rounded-full overflow-hidden backdrop-blur-sm border border-white/10`}
      >
        <motion.div
          className={`h-full bg-gradient-to-r from-blue-500 via-cyan-400 to-blue-500 rounded-full relative overflow-hidden`}
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.3, ease: "easeOut" }}
        >
          {/* Shimmer Effect */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
            animate={{
              x: ["-100%", "200%"],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "linear",
            }}
          />
        </motion.div>
      </div>
    </div>
  );
}
