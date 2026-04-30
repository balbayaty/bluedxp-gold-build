"use client";

import { motion } from "framer-motion";
import PremiumSpinner from "./PremiumSpinner";

interface ButtonLoaderProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizeClasses = {
  sm: "w-3 h-3",
  md: "w-4 h-4",
  lg: "w-5 h-5",
};

export default function ButtonLoader({
  size = "md",
  className = "",
}: ButtonLoaderProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`inline-flex items-center justify-center ${className}`}
    >
      <motion.div
        className={`${sizeClasses[size]} border-2 border-white/30 border-t-white rounded-full`}
        animate={{ rotate: 360 }}
        transition={{
          duration: 0.6,
          repeat: Infinity,
          ease: "linear",
        }}
      />
    </motion.div>
  );
}
