/**
 * Data Source Indicator Component
 *
 * Visual indicator showing whether data is real, demo, fallback, or partial
 * Provides tooltips with detailed information about data quality
 *
 * 4IR & 5IR Aligned • Integration-First • Deep Architecture
 */

"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type {
  DataSource,
  DataFreshness,
} from "@/lib/services/system-admin/dataSourceTracker";

export interface DataSourceIndicatorProps {
  source: DataSource;
  freshness?: DataFreshness;
  reliability?: number;
  notes?: string;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
  className?: string;
}

const sourceConfig = {
  real: {
    label: "Live Data",
    icon: "ri-database-2-line",
    color: "text-green-400",
    bgColor: "bg-green-400/10",
    borderColor: "border-green-400/30",
    description: "Data from connected services",
  },
  demo: {
    label: "Demo Data",
    icon: "ri-test-tube-line",
    color: "text-yellow-400",
    bgColor: "bg-yellow-400/10",
    borderColor: "border-yellow-400/30",
    description: "Placeholder data for demonstration",
  },
  fallback: {
    label: "Fallback",
    icon: "ri-error-warning-line",
    color: "text-orange-400",
    bgColor: "bg-orange-400/10",
    borderColor: "border-orange-400/30",
    description: "Using fallback/default values",
  },
  partial: {
    label: "Mixed",
    icon: "ri-stack-line",
    color: "text-blue-400",
    bgColor: "bg-blue-400/10",
    borderColor: "border-blue-400/30",
    description: "Mix of real and demo data",
  },
};

const freshnessConfig = {
  live: { label: "Live", color: "text-green-300" },
  recent: { label: "Recent", color: "text-blue-300" },
  stale: { label: "Stale", color: "text-orange-300" },
  unknown: { label: "Unknown", color: "text-gray-400" },
};

export default function DataSourceIndicator({
  source,
  freshness = "unknown",
  reliability,
  notes,
  size = "md",
  showLabel = false,
  className = "",
}: DataSourceIndicatorProps) {
  const [isHovered, setIsHovered] = useState(false);
  const config = sourceConfig[source];
  const freshnessInfo = freshnessConfig[freshness];

  const sizeClasses = {
    sm: "text-xs px-1.5 py-0.5",
    md: "text-sm px-2 py-1",
    lg: "text-base px-3 py-1.5",
  };

  const iconSizes = {
    sm: "text-xs",
    md: "text-sm",
    lg: "text-base",
  };

  return (
    <div
      className={`relative inline-flex items-center gap-1.5 ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div
        className={`
          inline-flex items-center gap-1.5 rounded-md border
          ${config.bgColor} ${config.borderColor} ${config.color}
          ${sizeClasses[size]} transition-all duration-200
          ${isHovered ? "scale-105 shadow-lg" : ""}
        `}
      >
        <i className={`${config.icon} ${iconSizes[size]}`} />
        {showLabel && <span className="font-medium">{config.label}</span>}
        {reliability !== undefined && (
          <span className="text-xs opacity-75">({reliability}%)</span>
        )}
      </div>

      {/* Tooltip */}
      <AnimatePresence>
        {isHovered && (
          <motion.div
            initial={{ opacity: 0, y: 5, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 5, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50"
          >
            <div className="bg-gray-900 border border-gray-700 rounded-lg shadow-xl p-3 min-w-[200px] max-w-[300px]">
              <div className="flex items-center gap-2 mb-2">
                <i className={`${config.icon} ${config.color}`} />
                <span className="font-semibold text-white">{config.label}</span>
              </div>
              <p className="text-xs text-gray-400 mb-2">{config.description}</p>

              <div className="space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-gray-500">Freshness:</span>
                  <span className={freshnessInfo.color}>
                    {freshnessInfo.label}
                  </span>
                </div>
                {reliability !== undefined && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Reliability:</span>
                    <span className="text-white">{reliability}%</span>
                  </div>
                )}
                {notes && (
                  <div className="mt-2 pt-2 border-t border-gray-700">
                    <p className="text-gray-400 text-xs">{notes}</p>
                  </div>
                )}
              </div>
            </div>
            {/* Arrow */}
            <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1">
              <div className="w-2 h-2 bg-gray-900 border-r border-b border-gray-700 rotate-45"></div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/**
 * Data Quality Badge - Shows overall data quality score
 */
export function DataQualityBadge({
  score,
  className = "",
}: {
  score: number;
  className?: string;
}) {
  const getColor = () => {
    if (score >= 80)
      return "text-green-400 bg-green-400/10 border-green-400/30";
    if (score >= 60)
      return "text-yellow-400 bg-yellow-400/10 border-yellow-400/30";
    if (score >= 40)
      return "text-orange-400 bg-orange-400/10 border-orange-400/30";
    return "text-red-400 bg-red-400/10 border-red-400/30";
  };

  const getLabel = () => {
    if (score >= 80) return "Excellent";
    if (score >= 60) return "Good";
    if (score >= 40) return "Fair";
    return "Poor";
  };

  return (
    <div
      className={`
        inline-flex items-center gap-2 rounded-md border px-3 py-1.5
        ${getColor()} ${className}
      `}
    >
      <i className="ri-bar-chart-line text-sm" />
      <span className="text-sm font-medium">Data Quality: {score}%</span>
      <span className="text-xs opacity-75">({getLabel()})</span>
    </div>
  );
}
