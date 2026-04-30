/**
 * Data Quality Panel
 *
 * Comprehensive panel showing data source breakdown and quality metrics
 *
 * 4IR & 5IR Aligned • Integration-First • Deep Architecture
 */

"use client";

import { motion } from "framer-motion";
import DataSourceIndicator, { DataQualityBadge } from "./DataSourceIndicator";

export interface DataQualitySummary {
  score: number;
  summary: {
    real: number;
    demo: number;
    fallback: number;
    partial: number;
    total: number;
  };
  isDemoMode: boolean;
  databaseConnected: boolean;
  environment: string;
}

interface DataQualityPanelProps {
  quality: DataQualitySummary;
  className?: string;
}

export default function DataQualityPanel({
  quality,
  className = "",
}: DataQualityPanelProps) {
  const { score, summary, isDemoMode, databaseConnected, environment } =
    quality;

  const total = summary.total;
  const realPercentage =
    total > 0 ? Math.round((summary.real / total) * 100) : 0;
  const demoPercentage =
    total > 0 ? Math.round((summary.demo / total) * 100) : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-gray-800/50 border border-gray-700 rounded-lg p-4 ${className}`}
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-white flex items-center gap-2">
          <i className="ri-information-line text-blue-400" />
          Data Quality Overview
        </h3>
        <DataQualityBadge score={score} />
      </div>

      <div className="space-y-3">
        {/* Progress Bars */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-400">Real Data</span>
            <span className="text-green-400 font-medium">
              {summary.real} ({realPercentage}%)
            </span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-2">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${realPercentage}%` }}
              transition={{ duration: 0.5 }}
              className="bg-green-400 h-2 rounded-full"
            />
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-400">Demo Data</span>
            <span className="text-yellow-400 font-medium">
              {summary.demo} ({demoPercentage}%)
            </span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-2">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${demoPercentage}%` }}
              transition={{ duration: 0.5 }}
              className="bg-yellow-400 h-2 rounded-full"
            />
          </div>
        </div>

        {/* Status Indicators */}
        <div className="grid grid-cols-2 gap-3 pt-2 border-t border-gray-700">
          <div className="flex items-center gap-2">
            <div
              className={`w-2 h-2 rounded-full ${databaseConnected ? "bg-green-400" : "bg-red-400"}`}
            />
            <span className="text-xs text-gray-400">
              Database:{" "}
              <span
                className={
                  databaseConnected ? "text-green-400" : "text-red-400"
                }
              >
                {databaseConnected ? "Connected" : "Disconnected"}
              </span>
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div
              className={`w-2 h-2 rounded-full ${isDemoMode ? "bg-yellow-400" : "bg-green-400"}`}
            />
            <span className="text-xs text-gray-400">
              Mode:{" "}
              <span
                className={isDemoMode ? "text-yellow-400" : "text-green-400"}
              >
                {isDemoMode ? "Demo" : "Production"}
              </span>
            </span>
          </div>
        </div>

        {/* Breakdown */}
        <div className="pt-2 border-t border-gray-700">
          <div className="text-xs text-gray-500 mb-2">
            Data Source Breakdown:
          </div>
          <div className="flex flex-wrap gap-2">
            {summary.real > 0 && (
              <DataSourceIndicator source="real" size="sm" showLabel />
            )}
            {summary.demo > 0 && (
              <DataSourceIndicator source="demo" size="sm" showLabel />
            )}
            {summary.partial > 0 && (
              <DataSourceIndicator source="partial" size="sm" showLabel />
            )}
            {summary.fallback > 0 && (
              <DataSourceIndicator source="fallback" size="sm" showLabel />
            )}
          </div>
        </div>

        {/* Environment Info */}
        <div className="pt-2 border-t border-gray-700">
          <div className="text-xs text-gray-500">
            Environment:{" "}
            <span className="text-gray-300 font-mono">{environment}</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
