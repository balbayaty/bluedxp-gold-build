"use client";

import React, { useRef, useState } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { FiTarget, FiZap, FiActivity, FiShield } from "react-icons/fi";

interface QuantumHolographicWidgetProps {
  id: string;
  title: string;
  children: React.ReactNode;
  icon?: React.ReactNode;
  accentColor?: string; // e.g. #06b6d4
  isEditMode?: boolean;
}

export const QuantumHolographicWidget: React.FC<
  QuantumHolographicWidgetProps
> = ({
  id,
  title,
  children,
  icon = <FiTarget />,
  accentColor = "#06b6d4",
  isEditMode = false,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  // Mouse position motion values for parallax
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  // Smooth out the movement
  const mouseXSpring = useSpring(x);
  const mouseYSpring = useSpring(y);

  // Transform motion values to rotation degrees
  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], [10, -10]);
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], [-10, 10]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    // Convert to range [-0.5, 0.5]
    x.set(mouseX / width - 0.5);
    y.set(mouseY / height - 0.5);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <div
      className="perspective-1000 h-full w-full"
      style={{ perspective: "1200px" }}
    >
      <motion.div
        ref={containerRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={{
          rotateX,
          rotateY,
          transformStyle: "preserve-3d",
        }}
        className="relative group h-full w-full rounded-3xl bg-slate-950/40 border border-white/10 backdrop-blur-3xl overflow-hidden"
      >
        {/* 1. HOLOGRAPHIC SCANLINES */}
        <div className="absolute inset-0 pointer-events-none opacity-[0.03] z-50">
          <div className="h-full w-full bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_4px,3px_100%]" />
        </div>

        {/* 2. AMBIENT GLOW FOLLOWING MOUSE */}
        <motion.div
          className="absolute pointer-events-none z-0 blur-[100px] opacity-30 group-hover:opacity-60 transition-opacity duration-500"
          style={{
            left: useTransform(mouseXSpring, [-0.5, 0.5], ["0%", "100%"]),
            top: useTransform(mouseYSpring, [-0.5, 0.5], ["0%", "100%"]),
            width: "300px",
            height: "300px",
            background: `radial-gradient(circle, ${accentColor} 0%, transparent 70%)`,
            transform: "translate(-50%, -50%)",
          }}
        />

        {/* 3. DYNAMIC PULSING GRID */}
        <div className="absolute inset-0 z-0 opacity-10">
          <div
            className="h-full w-full bg-[size:30px_30px]"
            style={{
              backgroundImage: `linear-gradient(to right, ${accentColor} 1px, transparent 1px), linear-gradient(to bottom, ${accentColor} 1px, transparent 1px)`,
            }}
          />
        </div>

        {/* 4. FLOATING CONTENT (Z-Index + translateZ) */}
        <div
          className="relative z-10 p-6 flex flex-col h-full"
          style={{ transform: "translateZ(50px)" }}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center relative overflow-hidden group/icon"
                style={{
                  backgroundColor: `${accentColor}20`,
                  border: `1px solid ${accentColor}40`,
                }}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent" />
                <div
                  className="relative z-10 text-2xl"
                  style={{ color: accentColor }}
                >
                  {icon}
                </div>
                {/* Icon Pulse */}
                <div
                  className="absolute inset-0 animate-ping opacity-20 scale-150"
                  style={{ backgroundColor: accentColor }}
                />
              </div>

              <div>
                <h3 className="text-xl font-black text-white italic tracking-tighter uppercase flex items-center gap-2">
                  <span className="opacity-50 text-xs">{"//"}</span>
                  {title}
                  <FiZap className="text-yellow-400 animate-pulse" />
                </h3>
                <div className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                  <span className="text-[10px] font-mono text-slate-500 tracking-widest uppercase">
                    Quantum Sync: Locked
                  </span>
                </div>
              </div>
            </div>

            {/* Matrix-style ID */}
            <div className="text-[8px] font-mono text-slate-600 rotate-90 origin-right">
              ID::{id.substring(0, 8)}::SYS_ON
            </div>
          </div>

          {/* Main Body */}
          <div className="flex-1 overflow-visible">{children}</div>

          {/* Footer - "Industrial" Stats */}
          <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-between">
            <div className="flex gap-4">
              {[
                { label: "CPU", val: "12%", icon: <FiActivity /> },
                { label: "SEC", val: "MAX", icon: <FiShield /> },
              ].map((stat, i) => (
                <div
                  key={i}
                  className="flex items-center gap-1.5 text-slate-500"
                >
                  <span className="text-xs" style={{ color: accentColor }}>
                    {stat.icon}
                  </span>
                  <span className="text-[10px] font-bold font-mono">
                    {stat.label}
                  </span>
                  <span className="text-[10px] text-white font-black">
                    {stat.val}
                  </span>
                </div>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <div className="h-1 w-12 rounded-full bg-slate-800 relative overflow-hidden">
                <motion.div
                  animate={{ x: [-48, 48] }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    ease: "linear",
                  }}
                  className="absolute inset-0 w-1/2 bg-gradient-to-r from-transparent via-white/40 to-transparent"
                />
              </div>
              <span className="text-[9px] font-mono text-slate-500 animate-pulse">
                PROCESSING...
              </span>
            </div>
          </div>
        </div>

        {/* 5. CYBER CORNER BRACKETS */}
        {[
          "top-2 left-2 border-t-2 border-l-2",
          "top-2 right-2 border-t-2 border-r-2",
          "bottom-2 left-2 border-b-2 border-l-2",
          "bottom-2 right-2 border-b-2 border-r-2",
        ].map((pos, i) => (
          <div
            key={i}
            className={`absolute w-4 h-4 opacity-40 transition-all duration-500 group-hover:scale-125 ${pos}`}
            style={{ borderColor: accentColor }}
          />
        ))}

        {/* Shimmer Effect */}
        <div className="absolute inset-0 pointer-events-none bg-gradient-to-tr from-white/0 via-white/5 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 ease-in-out" />
      </motion.div>
    </div>
  );
};

export default QuantumHolographicWidget;
