/**
 * Unified Intelligence Card Component
 * Reusable card for displaying intelligence insights
 */

"use client";

import { motion } from "framer-motion";
import { format } from "date-fns";

interface IntelligenceCardProps {
  id: string;
  type: "ROOT_CAUSE" | "ANOMALY" | "PATTERN" | "PREDICTION" | "INSIGHT";
  title: string;
  description: string;
  confidence: number;
  impact: "HIGH" | "MEDIUM" | "LOW";
  sourceModules: string[];
  timestamp: Date | string;
  status?: string;
  onClick?: () => void;
  metadata?: Record<string, any>;
}

const typeIcons = {
  ROOT_CAUSE: "ri-search-line",
  ANOMALY: "ri-alert-line",
  PATTERN: "ri-shape-line",
  PREDICTION: "ri-lightbulb-flash-line",
  INSIGHT: "ri-lightbulb-line",
};

const typeColors = {
  ROOT_CAUSE: "cyan",
  ANOMALY: "red",
  PATTERN: "blue",
  PREDICTION: "purple",
  INSIGHT: "green",
};

export default function UnifiedIntelligenceCard({
  id,
  type,
  title,
  description,
  confidence,
  impact,
  sourceModules,
  timestamp,
  status,
  onClick,
  metadata,
}: IntelligenceCardProps) {
  const icon = typeIcons[type];
  const color = typeColors[type];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-6 hover:border-${color}-500/50 hover:shadow-lg hover:shadow-${color}-500/10 transition-all ${
        onClick ? "cursor-pointer" : ""
      }`}
      onClick={onClick}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <div
              className={`w-10 h-10 rounded-lg bg-${color}-500/20 flex items-center justify-center`}
            >
              <i className={`${icon} text-${color}-400 text-xl`}></i>
            </div>
            <span
              className={`px-2 py-1 rounded text-xs font-medium bg-${color}-500/20 text-${color}-400`}
            >
              {type.replace(/_/g, " ")}
            </span>
            {sourceModules.length > 1 && (
              <span className="px-2 py-1 rounded text-xs font-medium bg-purple-500/20 text-purple-400">
                Cross-Module
              </span>
            )}
            {status && (
              <span
                className={`px-2 py-1 rounded text-xs font-medium ${
                  status === "NEW"
                    ? "bg-yellow-500/20 text-yellow-400"
                    : status === "REVIEWED"
                      ? "bg-blue-500/20 text-blue-400"
                      : "bg-gray-500/20 text-gray-400"
                }`}
              >
                {status}
              </span>
            )}
          </div>
          <h3 className="text-lg font-semibold text-white mb-1">{title}</h3>
          <p className="text-sm text-[#9ca3af] line-clamp-2">{description}</p>
          <p className="text-xs text-[#9ca3af] mt-2">
            {sourceModules.join(", ")} • {format(new Date(timestamp), "PPp")}
          </p>
        </div>
        <div className="text-right ml-4">
          <div className={`text-2xl font-bold text-${color}-400`}>
            {Math.round(confidence)}%
          </div>
          <div className="text-xs text-[#9ca3af]">Confidence</div>
          <div
            className={`mt-2 px-2 py-1 rounded text-xs font-medium ${
              impact === "HIGH"
                ? "bg-red-500/20 text-red-400"
                : impact === "MEDIUM"
                  ? "bg-yellow-500/20 text-yellow-400"
                  : "bg-gray-500/20 text-gray-400"
            }`}
          >
            {impact}
          </div>
        </div>
      </div>
      {metadata && Object.keys(metadata).length > 0 && (
        <div className="pt-4 border-t border-white/10">
          <div className="grid grid-cols-2 gap-2 text-xs">
            {Object.entries(metadata)
              .slice(0, 4)
              .map(([key, value]) => (
                <div key={key}>
                  <span className="text-[#9ca3af]">{key}:</span>
                  <span className="text-white ml-1">{String(value)}</span>
                </div>
              ))}
          </div>
        </div>
      )}
    </motion.div>
  );
}
