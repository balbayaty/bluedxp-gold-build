"use client";

import { motion } from "framer-motion";

interface PremiumSpinnerProps {
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
  variant?: "default" | "minimal" | "pulse";
}

const sizeClasses = {
  sm: "w-4 h-4",
  md: "w-6 h-6",
  lg: "w-8 h-8",
  xl: "w-12 h-12",
};

export default function PremiumSpinner({
  size = "md",
  className = "",
  variant = "default",
}: PremiumSpinnerProps) {
  if (variant === "pulse") {
    return (
      <div className={`flex items-center gap-1 ${className}`}>
        {[0, 1, 2].map((index) => (
          <motion.div
            key={index}
            className={`${sizeClasses[size]} rounded-full bg-gradient-to-r from-blue-400 to-cyan-400`}
            animate={{
              scale: [1, 1.3, 1],
              opacity: [0.5, 1, 0.5],
            }}
            transition={{
              duration: 1.2,
              repeat: Infinity,
              delay: index * 0.15,
              ease: "easeInOut",
            }}
          />
        ))}
      </div>
    );
  }

  if (variant === "minimal") {
    return (
      <motion.div
        className={`${sizeClasses[size]} border-2 border-blue-500/30 border-t-blue-500 rounded-full ${className}`}
        animate={{ rotate: 360 }}
        transition={{
          duration: 0.8,
          repeat: Infinity,
          ease: "linear",
        }}
      />
    );
  }

  return (
    <div className={`relative ${sizeClasses[size]} ${className}`}>
      {/* Outer ring */}
      <motion.div
        className="absolute inset-0 border-2 border-blue-500/20 rounded-full"
        animate={{ rotate: 360 }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          ease: "linear",
        }}
      />
      {/* Inner spinning ring */}
      <motion.div
        className="absolute inset-0 border-2 border-transparent border-t-blue-500 border-r-cyan-400 rounded-full"
        animate={{ rotate: 360 }}
        transition={{
          duration: 0.8,
          repeat: Infinity,
          ease: "linear",
        }}
      />
      {/* Center dot */}
      <motion.div
        className="absolute inset-0 flex items-center justify-center"
        animate={{
          scale: [1, 1.2, 1],
        }}
        transition={{
          duration: 1,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      >
        <div className="w-1/3 h-1/3 bg-gradient-to-r from-blue-400 to-cyan-400 rounded-full" />
      </motion.div>
    </div>
  );
}
