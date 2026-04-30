"use client";

/**
 * PlaybookTooltip Component
 * ==========================
 * Enhanced tooltip component for playbook items with deep hover information
 */

import React, { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

// =============================================================================
// TOOLTIP TYPES
// =============================================================================

interface TooltipContent {
  summary: string;
  details: string;
  keyPoints: string[];
}

interface PlaybookTooltipProps {
  children: React.ReactNode;
  content: TooltipContent;
  position?: "top" | "bottom" | "left" | "right";
  delay?: number;
  className?: string;
}

interface InfoBadgeProps {
  label: string;
  value: string | number;
  color?: "blue" | "green" | "yellow" | "red" | "purple" | "cyan";
  tooltip?: TooltipContent;
  size?: "sm" | "md" | "lg";
}

interface HoverCardProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  badge?: { label: string; color: string };
  icon?: string;
  className?: string;
}

interface LayerTooltipProps {
  layer: string;
  items: string[];
  description: string;
  depth: number;
  children: React.ReactNode;
}

// =============================================================================
// PLAYBOOK TOOLTIP COMPONENT
// =============================================================================

export function PlaybookTooltip({
  children,
  content,
  position = "top",
  delay = 300,
  className = "",
}: PlaybookTooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleMouseEnter = () => {
    timeoutRef.current = setTimeout(() => setIsVisible(true), delay);
  };

  const handleMouseLeave = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setIsVisible(false);
  };

  const positionStyles = {
    top: "bottom-full left-1/2 -translate-x-1/2 mb-2",
    bottom: "top-full left-1/2 -translate-x-1/2 mt-2",
    left: "right-full top-1/2 -translate-y-1/2 mr-2",
    right: "left-full top-1/2 -translate-y-1/2 ml-2",
  };

  const arrowStyles = {
    top: "top-full left-1/2 -translate-x-1/2 border-t-slate-800",
    bottom: "bottom-full left-1/2 -translate-x-1/2 border-b-slate-800",
    left: "left-full top-1/2 -translate-y-1/2 border-l-slate-800",
    right: "right-full top-1/2 -translate-y-1/2 border-r-slate-800",
  };

  return (
    <div
      className={`relative inline-block ${className}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {children}

      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.15 }}
            className={`absolute z-50 ${positionStyles[position]} pointer-events-none`}
          >
            {/* Tooltip Container */}
            <div className="bg-slate-800/95 backdrop-blur-lg border border-slate-700/50 rounded-xl p-4 shadow-2xl min-w-[280px] max-w-[400px]">
              {/* Summary */}
              <div className="text-sm font-semibold text-cyan-300 mb-2">
                {content.summary}
              </div>

              {/* Details */}
              <div className="text-xs text-slate-300 mb-3 leading-relaxed">
                {content.details}
              </div>

              {/* Key Points */}
              {content.keyPoints.length > 0 && (
                <div className="space-y-1">
                  <div className="text-[10px] text-slate-500 uppercase tracking-wider">
                    Key Points
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {content.keyPoints.map((point, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 text-[10px] bg-slate-700/50 text-slate-300 rounded-full"
                      >
                        {point}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Hover hint */}
              <div className="mt-3 pt-2 border-t border-slate-700/50 text-[10px] text-slate-500 flex items-center gap-1">
                <span className="opacity-70">ℹ️</span>
                Click for more details
              </div>
            </div>

            {/* Arrow */}
            <div
              className={`absolute w-2 h-2 bg-slate-800 rotate-45 ${arrowStyles[position]}`}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// =============================================================================
// INFO BADGE WITH TOOLTIP
// =============================================================================

export function InfoBadge({
  label,
  value,
  color = "blue",
  tooltip,
  size = "md",
}: InfoBadgeProps) {
  const colorClasses = {
    blue: "bg-blue-500/20 text-blue-300 border-blue-500/30",
    green: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
    yellow: "bg-amber-500/20 text-amber-300 border-amber-500/30",
    red: "bg-red-500/20 text-red-300 border-red-500/30",
    purple: "bg-purple-500/20 text-purple-300 border-purple-500/30",
    cyan: "bg-cyan-500/20 text-cyan-300 border-cyan-500/30",
  };

  const sizeClasses = {
    sm: "text-[10px] px-1.5 py-0.5",
    md: "text-xs px-2 py-1",
    lg: "text-sm px-3 py-1.5",
  };

  const badge = (
    <span
      className={`
      inline-flex items-center gap-1 rounded-full border
      ${colorClasses[color]} ${sizeClasses[size]}
      transition-all duration-200 hover:scale-105 cursor-help
    `}
    >
      <span className="opacity-70">{label}:</span>
      <span className="font-semibold">{value}</span>
    </span>
  );

  if (tooltip) {
    return <PlaybookTooltip content={tooltip}>{badge}</PlaybookTooltip>;
  }

  return badge;
}

// =============================================================================
// HOVER CARD
// =============================================================================

export function HoverCard({
  title,
  subtitle,
  children,
  badge,
  icon,
  className = "",
}: HoverCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <motion.div
      className={`
        relative bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-4
        transition-all duration-300 cursor-pointer
        ${isHovered ? "border-cyan-500/50 shadow-lg shadow-cyan-500/10 bg-slate-800/70" : ""}
        ${className}
      `}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      whileHover={{ y: -2 }}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          {icon && <span className="text-lg">{icon}</span>}
          <div>
            <h4 className="text-sm font-semibold text-white">{title}</h4>
            {subtitle && <p className="text-xs text-slate-400">{subtitle}</p>}
          </div>
        </div>
        {badge && (
          <span
            className={`px-2 py-0.5 text-[10px] rounded-full ${badge.color}`}
          >
            {badge.label}
          </span>
        )}
      </div>

      {/* Content */}
      <div className="text-xs text-slate-300">{children}</div>

      {/* Hover indicator */}
      <AnimatePresence>
        {isHovered && (
          <motion.div
            initial={{ opacity: 0, width: 0 }}
            animate={{ opacity: 1, width: "100%" }}
            exit={{ opacity: 0, width: 0 }}
            className="absolute bottom-0 left-0 h-0.5 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full"
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// =============================================================================
// LAYER TOOLTIP
// =============================================================================

export function LayerTooltip({
  layer,
  items,
  description,
  depth,
  children,
}: LayerTooltipProps) {
  const content: TooltipContent = {
    summary: `${layer} (Depth: ${depth})`,
    details: description,
    keyPoints: items,
  };

  return (
    <PlaybookTooltip content={content} position="right">
      {children}
    </PlaybookTooltip>
  );
}

// =============================================================================
// COMPLIANCE BADGE
// =============================================================================

interface ComplianceBadgeProps {
  standard: string;
  status: "compliant" | "partial" | "pending" | "not-applicable";
  readinessPercentage?: number;
}

export function ComplianceBadge({
  standard,
  status,
  readinessPercentage,
}: ComplianceBadgeProps) {
  const statusConfig = {
    compliant: {
      color: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
      icon: "✅",
      label: "Compliant",
    },
    partial: {
      color: "bg-amber-500/20 text-amber-300 border-amber-500/30",
      icon: "⚠️",
      label: "Partial",
    },
    pending: {
      color: "bg-blue-500/20 text-blue-300 border-blue-500/30",
      icon: "🔄",
      label: "Pending",
    },
    "not-applicable": {
      color: "bg-slate-500/20 text-slate-400 border-slate-500/30",
      icon: "➖",
      label: "N/A",
    },
  };

  const config = statusConfig[status];

  return (
    <PlaybookTooltip
      content={{
        summary: `${standard} Compliance Status`,
        details: `Current compliance status: ${config.label}${readinessPercentage ? `. Readiness: ${readinessPercentage}%` : ""}`,
        keyPoints: readinessPercentage ? [`${readinessPercentage}% Ready`] : [],
      }}
    >
      <span
        className={`
        inline-flex items-center gap-1 px-2 py-1 rounded-lg border text-xs
        ${config.color} cursor-help
      `}
      >
        <span>{config.icon}</span>
        <span className="font-medium">{standard}</span>
        {readinessPercentage !== undefined && (
          <span className="opacity-70">({readinessPercentage}%)</span>
        )}
      </span>
    </PlaybookTooltip>
  );
}

// =============================================================================
// PRIORITY INDICATOR
// =============================================================================

interface PriorityIndicatorProps {
  priority: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  showLabel?: boolean;
}

export function PriorityIndicator({
  priority,
  showLabel = true,
}: PriorityIndicatorProps) {
  const config = {
    CRITICAL: {
      color: "text-red-400",
      bg: "bg-red-500",
      pulse: true,
      icon: "🔴",
    },
    HIGH: {
      color: "text-orange-400",
      bg: "bg-orange-500",
      pulse: false,
      icon: "🟠",
    },
    MEDIUM: {
      color: "text-yellow-400",
      bg: "bg-yellow-500",
      pulse: false,
      icon: "🟡",
    },
    LOW: {
      color: "text-green-400",
      bg: "bg-green-500",
      pulse: false,
      icon: "🟢",
    },
  };

  const c = config[priority];

  return (
    <PlaybookTooltip
      content={{
        summary: `${priority} Priority`,
        details:
          priority === "CRITICAL"
            ? "This feature is critical to platform operations and regulatory compliance."
            : priority === "HIGH"
              ? "This feature provides significant business value and competitive advantage."
              : priority === "MEDIUM"
                ? "This feature enhances operations but is not immediately critical."
                : "This feature is a nice-to-have enhancement.",
        keyPoints:
          priority === "CRITICAL"
            ? [
                "Immediate attention required",
                "Regulatory impact",
                "Blocking dependency",
              ]
            : priority === "HIGH"
              ? [
                  "High business value",
                  "Customer requested",
                  "Competitive necessity",
                ]
              : ["Standard priority", "Roadmap item"],
      }}
    >
      <div className={`flex items-center gap-1.5 cursor-help ${c.color}`}>
        <span className="relative">
          {c.icon}
          {c.pulse && (
            <span
              className={`absolute inset-0 rounded-full ${c.bg} animate-ping opacity-30`}
            />
          )}
        </span>
        {showLabel && <span className="text-xs font-medium">{priority}</span>}
      </div>
    </PlaybookTooltip>
  );
}

// =============================================================================
// INDUSTRIAL REVOLUTION BADGE
// =============================================================================

interface IndustrialBadgeProps {
  revolution: "4IR" | "5IR";
  alignmentScore: number;
  pillars: string[];
}

export function IndustrialBadge({
  revolution,
  alignmentScore,
  pillars,
}: IndustrialBadgeProps) {
  const is4IR = revolution === "4IR";

  return (
    <PlaybookTooltip
      content={{
        summary: `${revolution} Alignment: ${alignmentScore}%`,
        details: is4IR
          ? "Fourth Industrial Revolution alignment - focusing on IoT, AI, big data, and automation."
          : "Fifth Industrial Revolution alignment - focusing on human-centric AI, sustainability, and resilience.",
        keyPoints: pillars,
      }}
    >
      <div
        className={`
        flex items-center gap-2 px-3 py-1.5 rounded-lg border cursor-help
        ${
          is4IR
            ? "bg-blue-500/10 border-blue-500/30 text-blue-300"
            : "bg-purple-500/10 border-purple-500/30 text-purple-300"
        }
      `}
      >
        <span className="text-lg">{is4IR ? "🔧" : "🌱"}</span>
        <div>
          <div className="text-xs font-semibold">{revolution}</div>
          <div className="text-[10px] opacity-70">
            {alignmentScore}% aligned
          </div>
        </div>
        {/* Mini progress bar */}
        <div className="w-12 h-1.5 bg-slate-700 rounded-full overflow-hidden">
          <div
            className={`h-full ${is4IR ? "bg-blue-500" : "bg-purple-500"}`}
            style={{ width: `${alignmentScore}%` }}
          />
        </div>
      </div>
    </PlaybookTooltip>
  );
}

// =============================================================================
// MARKET TREND INDICATOR
// =============================================================================

interface TrendIndicatorProps {
  trend: string;
  category: string;
  maturity: "emerging" | "growing" | "mature" | "declining";
  impact: "transformational" | "significant" | "moderate" | "low";
}

export function TrendIndicator({
  trend,
  category,
  maturity,
  impact,
}: TrendIndicatorProps) {
  const maturityConfig = {
    emerging: { icon: "🌱", color: "text-green-400" },
    growing: { icon: "📈", color: "text-blue-400" },
    mature: { icon: "📊", color: "text-yellow-400" },
    declining: { icon: "📉", color: "text-red-400" },
  };

  const impactConfig = {
    transformational: { label: "Transformational", color: "bg-purple-500/20" },
    significant: { label: "Significant", color: "bg-blue-500/20" },
    moderate: { label: "Moderate", color: "bg-yellow-500/20" },
    low: { label: "Low", color: "bg-slate-500/20" },
  };

  return (
    <PlaybookTooltip
      content={{
        summary: `${trend} (${category})`,
        details: `A ${maturity} trend with ${impact} impact on the market.`,
        keyPoints: [
          `Maturity: ${maturity}`,
          `Impact: ${impact}`,
          `Category: ${category}`,
        ],
      }}
    >
      <div className="flex items-center gap-2 p-2 bg-slate-800/50 rounded-lg cursor-help hover:bg-slate-700/50 transition-colors">
        <span className="text-lg">{maturityConfig[maturity].icon}</span>
        <div className="flex-1">
          <div className="text-xs font-medium text-white truncate">{trend}</div>
          <div className="text-[10px] text-slate-400">{category}</div>
        </div>
        <span
          className={`px-1.5 py-0.5 text-[10px] rounded ${impactConfig[impact].color} text-white`}
        >
          {impactConfig[impact].label}
        </span>
      </div>
    </PlaybookTooltip>
  );
}

// =============================================================================
// EXPORTS
// =============================================================================

export default PlaybookTooltip;
