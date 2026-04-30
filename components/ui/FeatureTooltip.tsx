"use client";

/**
 * Feature Tooltip Component
 * Shows requirements on hover for each feature
 * Glassmorphism design with smooth animations
 */

import React, { useState, useRef, useEffect } from "react";
import {
  FeatureRequirement,
  FeatureTooltipProps,
} from "@/types/featureTooltips";

// Priority badge colors
const priorityConfig = {
  HIGH: {
    bg: "bg-red-500/20",
    text: "text-red-400",
    border: "border-red-500/30",
    icon: "🔴",
  },
  MEDIUM: {
    bg: "bg-yellow-500/20",
    text: "text-yellow-400",
    border: "border-yellow-500/30",
    icon: "🟡",
  },
  LOW: {
    bg: "bg-green-500/20",
    text: "text-green-400",
    border: "border-green-500/30",
    icon: "🟢",
  },
};

// Status badge colors
const statusConfig = {
  ready: {
    bg: "bg-emerald-500/20",
    text: "text-emerald-400",
    label: "✅ Ready",
  },
  partial: { bg: "bg-blue-500/20", text: "text-blue-400", label: "🔧 Partial" },
  "not-ready": {
    bg: "bg-red-500/20",
    text: "text-red-400",
    label: "❌ Not Ready",
  },
  planned: {
    bg: "bg-purple-500/20",
    text: "text-purple-400",
    label: "📋 Planned",
  },
};

export function FeatureTooltip({
  feature,
  children,
  position = "right",
  disabled = false,
}: FeatureTooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const triggerRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const showTooltip = () => {
    if (disabled) return;
    timeoutRef.current = setTimeout(() => {
      setIsVisible(true);
    }, 300); // 300ms delay to prevent flickering
  };

  const hideTooltip = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setIsVisible(false);
  };

  useEffect(() => {
    if (isVisible && triggerRef.current && tooltipRef.current) {
      const triggerRect = triggerRef.current.getBoundingClientRect();
      const tooltipRect = tooltipRef.current.getBoundingClientRect();
      const padding = 12;

      let x = 0;
      let y = 0;

      switch (position) {
        case "top":
          x = triggerRect.left + triggerRect.width / 2 - tooltipRect.width / 2;
          y = triggerRect.top - tooltipRect.height - padding;
          break;
        case "bottom":
          x = triggerRect.left + triggerRect.width / 2 - tooltipRect.width / 2;
          y = triggerRect.bottom + padding;
          break;
        case "left":
          x = triggerRect.left - tooltipRect.width - padding;
          y = triggerRect.top + triggerRect.height / 2 - tooltipRect.height / 2;
          break;
        case "right":
        default:
          x = triggerRect.right + padding;
          y = triggerRect.top + triggerRect.height / 2 - tooltipRect.height / 2;
          break;
      }

      // Keep tooltip within viewport
      x = Math.max(10, Math.min(x, window.innerWidth - tooltipRect.width - 10));
      y = Math.max(
        10,
        Math.min(y, window.innerHeight - tooltipRect.height - 10),
      );

      setTooltipPosition({ x, y });
    }
  }, [isVisible, position]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const priority = priorityConfig[feature.priority];
  const status = statusConfig[feature.status];

  return (
    <>
      <div
        ref={triggerRef}
        onMouseEnter={showTooltip}
        onMouseLeave={hideTooltip}
        className="inline-block cursor-help"
      >
        {children}
      </div>

      {isVisible && (
        <div
          ref={tooltipRef}
          className="fixed z-[9999] pointer-events-none"
          style={{
            left: tooltipPosition.x,
            top: tooltipPosition.y,
            opacity: tooltipPosition.x === 0 && tooltipPosition.y === 0 ? 0 : 1,
            transition: "opacity 0.2s ease-in-out",
          }}
        >
          {/* Glassmorphism tooltip container */}
          <div className="w-[380px] p-4 rounded-xl border border-white/10 bg-slate-900/95 backdrop-blur-xl shadow-2xl shadow-black/50">
            {/* Header */}
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <h3 className="text-lg font-bold text-white mb-1">
                  {feature.name}
                </h3>
                <p className="text-sm text-slate-400 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            </div>

            {/* Priority & Status Badges */}
            <div className="flex items-center gap-2 mb-4">
              <span
                className={`px-2.5 py-1 rounded-full text-xs font-semibold ${priority.bg} ${priority.text} ${priority.border} border`}
              >
                {priority.icon} {feature.priority}
              </span>
              <span
                className={`px-2.5 py-1 rounded-full text-xs font-semibold ${status.bg} ${status.text}`}
              >
                {status.label}
              </span>
              {feature.phase && (
                <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-700/50 text-slate-300">
                  Phase {feature.phase}
                </span>
              )}
            </div>

            {/* Time Estimate */}
            <div className="flex items-center gap-2 mb-4 text-sm">
              <span className="text-slate-500">⏱️ Estimated Time:</span>
              <span className="text-cyan-400 font-semibold">
                {feature.estimatedTime}
              </span>
            </div>

            {/* Dependencies */}
            <div className="mb-3">
              <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                📦 Dependencies
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {feature.dependencies.map((dep, index) => (
                  <span
                    key={index}
                    className="px-2 py-0.5 rounded bg-orange-500/10 text-orange-400 text-xs border border-orange-500/20"
                  >
                    {dep}
                  </span>
                ))}
              </div>
            </div>

            {/* Required Services */}
            <div className="mb-3">
              <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                ⚙️ Required Services
              </h4>
              <div className="max-h-20 overflow-y-auto space-y-1">
                {feature.requiredServices.map((service, index) => (
                  <div
                    key={index}
                    className="text-xs text-slate-300 font-mono bg-slate-800/50 px-2 py-1 rounded"
                  >
                    {service}
                  </div>
                ))}
              </div>
            </div>

            {/* Integration Points */}
            <div className="mb-3">
              <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                🔗 Integration Points
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {feature.integrationPoints.map((point, index) => (
                  <span
                    key={index}
                    className="px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 text-xs border border-indigo-500/20"
                  >
                    {point}
                  </span>
                ))}
              </div>
            </div>

            {/* 4IR/5IR Alignment */}
            {feature.industrialAlignment &&
              feature.industrialAlignment.length > 0 && (
                <div className="pt-3 border-t border-slate-700/50">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500">
                      Industrial Alignment:
                    </span>
                    {feature.industrialAlignment.map((ir, index) => (
                      <span
                        key={index}
                        className={`px-2 py-0.5 rounded text-xs font-bold ${
                          ir === "4IR"
                            ? "bg-blue-500/20 text-blue-400"
                            : "bg-purple-500/20 text-purple-400"
                        }`}
                      >
                        {ir}
                      </span>
                    ))}
                  </div>
                </div>
              )}
          </div>
        </div>
      )}
    </>
  );
}

// Feature Card Component - A card that displays feature info with built-in tooltip
export function FeatureCard({
  feature,
  onClick,
}: {
  feature: FeatureRequirement;
  onClick?: () => void;
}) {
  const priority = priorityConfig[feature.priority];
  const status = statusConfig[feature.status];

  return (
    <FeatureTooltip feature={feature} position="right">
      <div
        onClick={onClick}
        className="group relative p-4 rounded-xl border border-slate-700/50 bg-slate-800/30 hover:bg-slate-800/60 hover:border-slate-600/50 transition-all duration-300 cursor-pointer"
      >
        {/* Hover glow effect */}
        <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-cyan-500/0 via-cyan-500/5 to-purple-500/0 opacity-0 group-hover:opacity-100 transition-opacity" />

        <div className="relative">
          {/* Header */}
          <div className="flex items-start justify-between mb-2">
            <h3 className="text-base font-semibold text-white group-hover:text-cyan-300 transition-colors">
              {feature.name}
            </h3>
            <span
              className={`px-2 py-0.5 rounded text-xs font-semibold ${priority.bg} ${priority.text}`}
            >
              {priority.icon}
            </span>
          </div>

          {/* Description */}
          <p className="text-sm text-slate-400 line-clamp-2 mb-3">
            {feature.description}
          </p>

          {/* Footer */}
          <div className="flex items-center justify-between">
            <span
              className={`px-2 py-0.5 rounded text-xs ${status.bg} ${status.text}`}
            >
              {status.label}
            </span>
            <span className="text-xs text-slate-500">
              ⏱️ {feature.estimatedTime}
            </span>
          </div>

          {/* Hover hint */}
          <div className="absolute -right-1 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
            <span className="text-cyan-400 text-lg">→</span>
          </div>
        </div>
      </div>
    </FeatureTooltip>
  );
}

export default FeatureTooltip;
