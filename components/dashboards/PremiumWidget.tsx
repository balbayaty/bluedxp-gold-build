"use client";

import React, { useMemo } from "react";
import { motion } from "framer-motion";
import { FiEdit, FiTrash2, FiZap, FiInfo } from "react-icons/fi";

interface PremiumWidgetProps {
  id: string;
  title: string;
  icon?: React.ReactNode;
  gradient?: string;
  children: React.ReactNode;
  isEditMode?: boolean;
  isSelected?: boolean;
  isRemovable?: boolean;
  onEdit?: () => void;
  onRemove?: () => void;
  onClick?: () => void;
  lastUpdated?: Date;
  config?: {
    borderRadius?: number;
    padding?: number;
    showHeader?: boolean;
    showIcon?: boolean;
    showActions?: boolean;
  };
}

export const PremiumWidget: React.FC<PremiumWidgetProps> = ({
  id,
  title,
  icon,
  gradient = "from-blue-500 to-cyan-500",
  children,
  isEditMode = false,
  isSelected = false,
  isRemovable = true,
  onEdit,
  onRemove,
  onClick,
  lastUpdated,
  config = {
    borderRadius: 16,
    padding: 20,
    showHeader: true,
    showIcon: true,
    showActions: true,
  },
}) => {
  // Generate a unique noise pattern for the frosted glass effect
  const noiseUrl =
    "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3Clf filter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E\")";

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      className={`group relative overflow-hidden h-full flex flex-col transition-all duration-300 ${
        isSelected ? "ring-2 ring-cyan-500 shadow-lg shadow-cyan-500/20" : ""
      }`}
      style={{
        borderRadius: `${config.borderRadius}px`,
      }}
      onClick={onClick}
    >
      {/* 1. ADVANCED GLASSMORPHISM BACKGROUND */}
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-2xl transition-colors duration-500 group-hover:bg-slate-900/80" />

      {/* 2. NOISE TEXTURE LAYER */}
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none mix-blend-overlay"
        style={{ backgroundImage: noiseUrl }}
      />

      {/* 3. ROTATING BORDER LIGHT (Premium Effect) */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700">
          <div className="absolute top-[-50%] left-[-50%] w-[200%] h-[200%] animate-spin-slow bg-[conic-gradient(transparent,transparent,transparent,rgba(6,182,212,0.4))] blur-xl" />
        </div>
      </div>

      {/* 4. INNER GLOW & BORDER */}
      <div className="absolute inset-0 border border-slate-700/50 rounded-[inherit] pointer-events-none" />
      <div className="absolute inset-[1px] border border-white/5 rounded-[inherit] pointer-events-none" />

      {/* 5. CONTENT TOP GRADIENT BAR */}
      <div
        className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r ${gradient}`}
      />

      {/* 6. SIDE ACCENT (Subtle) */}
      <div
        className={`absolute left-0 top-1 bottom-0 w-[2px] bg-gradient-to-b ${gradient} opacity-20`}
      />

      {/* WIDGET CONTENT */}
      <div
        className="relative z-10 flex flex-col h-full"
        style={{ padding: `${config.padding}px` }}
      >
        {/* Header */}
        {config.showHeader && (
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              {config.showIcon && icon && (
                <div
                  className={`p-2 rounded-lg bg-slate-800/50 border border-white/5 text-xl ${gradient.includes("from-") ? `bg-gradient-to-br ${gradient} bg-clip-text text-transparent` : ""}`}
                >
                  {icon}
                </div>
              )}
              <h3 className="font-bold text-white tracking-tight text-lg group-hover:text-cyan-400 transition-colors">
                {title}
              </h3>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              {isEditMode && (
                <>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onEdit?.();
                    }}
                    className="p-1.5 rounded-md hover:bg-white/10 text-slate-400 hover:text-white transition-all"
                  >
                    <FiEdit className="w-4 h-4" />
                  </button>
                  {isRemovable && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onRemove?.();
                      }}
                      className="p-1.5 rounded-md hover:bg-red-500/20 text-slate-400 hover:text-red-400 transition-all"
                    >
                      <FiTrash2 className="w-4 h-4" />
                    </button>
                  )}
                </>
              )}
              {!isEditMode && (
                <div className="p-1.5 text-slate-500">
                  <FiInfo className="w-4 h-4" />
                </div>
              )}
            </div>
          </div>
        )}

        {/* Body */}
        <div className="flex-1 relative">{children}</div>

        {/* Footer Info */}
        {lastUpdated && (
          <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-[10px] text-slate-500 uppercase tracking-widest font-medium">
            <div className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
              Live Data
            </div>
            <div>
              Updated{" "}
              {new Date(lastUpdated).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </div>
          </div>
        )}
      </div>

      {/* Decorative Glow Elements */}
      <div
        className={`absolute -bottom-10 -right-10 w-20 h-20 bg-gradient-to-br ${gradient} blur-3xl opacity-10 pointer-events-none`}
      />
      <div
        className={`absolute -top-10 -left-10 w-20 h-20 bg-gradient-to-br ${gradient} blur-3xl opacity-10 pointer-events-none`}
      />
    </motion.div>
  );
};

export default PremiumWidget;
