"use client";

import React from "react";
import { motion } from "framer-motion";

interface LiquidMetricProps {
  label: string;
  value: number; // 0 to 100
  max?: number;
  color?: string;
  height?: number;
}

export const LiquidMetric: React.FC<LiquidMetricProps> = ({
  label,
  value,
  max = 100,
  color = "#06b6d4",
  height = 8,
}) => {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);

  return (
    <div className="w-full mb-4">
      <div className="flex justify-between items-end mb-1.5 px-1">
        <span className="text-xs font-bold text-slate-400 uppercase tracking-tighter">
          {label}
        </span>
        <span
          className="text-sm font-mono font-black text-white"
          style={{ color: percentage > 90 ? "#ef4444" : "inherit" }}
        >
          {percentage.toFixed(2)}%
        </span>
      </div>

      <div
        className="relative w-full rounded-full overflow-hidden bg-slate-900/80 border border-white/5 shadow-inner"
        style={{ height: `${height * 2}px` }}
      >
        {/* Background "Tube" Glow */}
        <div
          className="absolute inset-0 opacity-20 blur-sm"
          style={{ backgroundColor: color }}
        />

        {/* The Liquid Fill */}
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 1.5, ease: "easeOut" }}
          className="absolute top-0 left-0 h-full relative"
          style={{
            backgroundColor: color,
            boxShadow: `0 0 15px ${color}, inset 0 0 10px rgba(255,255,255,0.5)`,
          }}
        >
          {/* Animated Wave Effect */}
          <motion.div
            animate={{
              x: [-20, 0],
              opacity: [0.4, 0.7, 0.4],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "linear",
            }}
            className="absolute inset-0 w-[200%]"
            style={{
              background: `linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.3) 50%, transparent 100%)`,
            }}
          />

          {/* Liquid "Bubbles" */}
          {[...Array(3)].map((_, i) => (
            <motion.div
              key={i}
              animate={{
                y: [height * 2, -height],
                x: [Math.random() * 20, Math.random() * -20],
                opacity: [0, 1, 0],
                scale: [0.5, 1.2, 0.5],
              }}
              transition={{
                duration: 2 + Math.random() * 2,
                repeat: Infinity,
                delay: Math.random() * 2,
              }}
              className="absolute rounded-full bg-white/40 blur-[1px]"
              style={{
                width: `${Math.random() * 4 + 2}px`,
                height: `${Math.random() * 4 + 2}px`,
                left: `${Math.random() * 100}%`,
              }}
            />
          ))}
        </motion.div>

        {/* Glass Reflection Overlay */}
        <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-white/10 via-transparent to-black/20" />
      </div>
    </div>
  );
};

export default LiquidMetric;
