"use client";

import React from "react";
import { motion } from "framer-motion";

interface NeuralIconProps {
  icon: string;
  active?: boolean;
  isDarkMode?: boolean;
  color?: "blue" | "emerald" | "purple" | "amber" | "cyan" | "rose";
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

export const NeuralIcon: React.FC<NeuralIconProps> = ({
  icon,
  active = false,
  isDarkMode = true,
  color = "blue",
  size = "md",
  className = "",
}) => {
  const colorMap = {
    blue: {
      from: "from-blue-400",
      to: "to-indigo-600",
      glow: "shadow-blue-500/30",
      text: "text-blue-400",
      gradient: "from-blue-400 via-indigo-400 to-blue-600",
    },
    emerald: {
      from: "from-emerald-400",
      to: "to-teal-600",
      glow: "shadow-emerald-500/30",
      text: "text-emerald-400",
      gradient: "from-emerald-400 via-teal-400 to-emerald-600",
    },
    purple: {
      from: "from-purple-400",
      to: "to-fuchsia-600",
      glow: "shadow-purple-500/30",
      text: "text-purple-400",
      gradient: "from-purple-400 via-fuchsia-400 to-purple-600",
    },
    amber: {
      from: "from-amber-400",
      to: "to-orange-600",
      glow: "shadow-amber-500/30",
      text: "text-amber-400",
      gradient: "from-amber-400 via-orange-400 to-amber-600",
    },
    cyan: {
      from: "from-cyan-400",
      to: "to-blue-500",
      glow: "shadow-cyan-500/30",
      text: "text-cyan-400",
      gradient: "from-cyan-400 via-blue-400 to-cyan-600",
    },
    rose: {
      from: "from-rose-400",
      to: "to-pink-600",
      glow: "shadow-rose-500/30",
      text: "text-rose-400",
      gradient: "from-rose-400 via-pink-400 to-rose-600",
    },
  };

  const selectedColor = colorMap[color];

  const sizeStyles = {
    sm: "w-8 h-8 rounded-xl",
    md: "w-10 h-10 rounded-2xl",
    lg: "w-12 h-12 rounded-[1.25rem]",
    xl: "w-14 h-14 rounded-[1.5rem]",
  };

  const iconSizes = {
    sm: "text-base",
    md: "text-xl",
    lg: "text-2xl",
    xl: "text-3xl",
  };

  return (
    <div
      className={`relative flex items-center justify-center ${sizeStyles[size]} ${className}`}
    >
      {/* Outer Glow / Pedestal */}
      <motion.div
        className={`absolute inset-0 rounded-[inherit] transition-all duration-500 ${
          active
            ? `${selectedColor.glow} shadow-lg opacity-100`
            : "opacity-0 group-hover/nav:opacity-50"
        } ${isDarkMode ? "bg-white/5" : "bg-gray-100"}`}
        style={{
          backdropFilter: active ? "blur(8px)" : "none",
        }}
      />

      {/* Glass Layer */}
      <div
        className={`absolute inset-0 rounded-[inherit] border transition-all duration-500 ${
          active
            ? isDarkMode
              ? "border-white/20"
              : "border-blue-200"
            : isDarkMode
              ? "border-white/5 group-hover/nav:border-white/10"
              : "border-gray-200/50 group-hover/nav:border-blue-200/50"
        }`}
      />

      {/* Gradient Background (Active only) */}
      {active && (
        <motion.div
          layoutId="activeIconBg"
          className={`absolute inset-0 rounded-[inherit] bg-gradient-to-br ${selectedColor.from} ${selectedColor.to} opacity-20`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.2 }}
          exit={{ opacity: 0 }}
        />
      )}

      {/* Neural Spark / Pulse (Active only) */}
      {active && (
        <div className="absolute inset-0 rounded-[inherit] overflow-hidden pointer-events-none">
          <motion.div
            className="absolute inset-[-50%] bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.2)_0%,transparent_70%)]"
            animate={{
              x: ["-20%", "20%"],
              y: ["-20%", "20%"],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              repeatType: "reverse",
              ease: "easeInOut",
            }}
          />
        </div>
      )}

      {/* The Icon Itself */}
      <motion.div
        className="relative z-10 flex items-center justify-center"
        animate={
          active
            ? {
                y: [0, -2, 0],
              }
            : {}
        }
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      >
        <i
          className={`${icon} ${iconSizes[size]} transition-all duration-500 ${
            active
              ? `text-white drop-shadow-[0_4px_12px_rgba(0,0,0,0.5)]`
              : `${isDarkMode ? "text-gray-400 group-hover/nav:text-white" : "text-gray-500 group-hover/nav:text-blue-600"}`
          }`}
        />

        {/* Color Accent (Optional subtle dot or line) */}
        {!active && (
          <div
            className={`absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full opacity-0 group-hover/nav:opacity-100 transition-opacity duration-500 bg-gradient-to-r ${selectedColor.from} ${selectedColor.to}`}
          />
        )}
      </motion.div>

      {/* Intelligent Ring (Active only) */}
      {active && (
        <svg
          className="absolute inset-0 w-full h-full -rotate-90 pointer-events-none"
          viewBox="0 0 100 100"
        >
          <circle
            cx="50"
            cy="50"
            r="48"
            fill="none"
            stroke="currentColor"
            strokeWidth="1"
            className={`${selectedColor.text} opacity-20`}
            strokeDasharray="4 4"
          />
          <motion.circle
            cx="50"
            cy="50"
            r="48"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className={selectedColor.text}
            strokeDasharray="10 300"
            animate={{
              strokeDashoffset: [0, -300],
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              ease: "linear",
            }}
          />
        </svg>
      )}
    </div>
  );
};
