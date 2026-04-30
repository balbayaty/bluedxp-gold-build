/**
 * Pattern Detection Visualization - Mind-Blowing AI Visualization
 *
 * Features:
 * - Interactive pattern visualization
 * - Cluster analysis
 * - Trend detection
 * - Correlation mapping
 * - Deep drill-down
 */

"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import type { NCRPattern } from "@/lib/services/iso-ims/ncrService";

interface PatternDetectionVisualizationProps {
  patterns: NCRPattern[];
  onPatternClick?: (patternId: string) => void;
}

export default function PatternDetectionVisualization({
  patterns,
  onPatternClick,
}: PatternDetectionVisualizationProps) {
  const [selectedPattern, setSelectedPattern] = useState<string | null>(null);

  const getPatternColor = (type: string) => {
    switch (type) {
      case "RECURRING":
        return "from-red-500 to-pink-600";
      case "TREND":
        return "from-blue-500 to-cyan-600";
      case "CLUSTER":
        return "from-purple-500 to-indigo-600";
      case "CORRELATION":
        return "from-green-500 to-emerald-600";
      case "ANOMALY":
        return "from-yellow-500 to-orange-600";
      default:
        return "from-gray-500 to-gray-600";
    }
  };

  const getSeveritySize = (severity: string) => {
    switch (severity) {
      case "CRITICAL":
        return "w-24 h-24";
      case "HIGH":
        return "w-20 h-20";
      case "MEDIUM":
        return "w-16 h-16";
      default:
        return "w-12 h-12";
    }
  };

  return (
    <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-white mb-1">
            Pattern Detection
          </h3>
          <p className="text-sm text-gray-400">
            AI-powered pattern recognition
          </p>
        </div>
        <div className="flex items-center gap-2">
          <i className="ri-ai-generate-line text-2xl text-purple-400"></i>
          <span className="text-sm text-gray-300">
            {patterns.length} Patterns Detected
          </span>
        </div>
      </div>

      {/* Pattern Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        {patterns.map((pattern) => (
          <motion.div
            key={pattern.id}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            whileHover={{ scale: 1.05, y: -5 }}
            onClick={() => {
              setSelectedPattern(pattern.id);
              onPatternClick?.(pattern.id);
            }}
            className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
              selectedPattern === pattern.id
                ? "border-blue-500 bg-blue-900/20 shadow-lg shadow-blue-500/20"
                : "border-gray-700 bg-gray-700/50 hover:border-gray-600"
            }`}
          >
            <div className="flex items-start gap-3 mb-3">
              <div
                className={`${getSeveritySize(pattern.severity)} rounded-full bg-gradient-to-br ${getPatternColor(pattern.patternType)} flex items-center justify-center`}
              >
                <i className="ri-pie-chart-line text-white text-2xl"></i>
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-medium text-gray-400 uppercase">
                    {pattern.patternType}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded text-xs font-medium ${
                      pattern.severity === "CRITICAL"
                        ? "bg-red-900/30 text-red-400"
                        : pattern.severity === "HIGH"
                          ? "bg-orange-900/30 text-orange-400"
                          : pattern.severity === "MEDIUM"
                            ? "bg-yellow-900/30 text-yellow-400"
                            : "bg-gray-700 text-gray-400"
                    }`}
                  >
                    {pattern.severity}
                  </span>
                </div>
                <p className="text-sm text-white font-medium">
                  {pattern.description}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs text-gray-400 mb-3">
              <span>Confidence: {pattern.confidence}%</span>
              <span>{pattern.affectedNCRs.length} NCRs</span>
            </div>

            {/* Recommendations Preview */}
            {pattern.recommendations.length > 0 && (
              <div className="mt-3 pt-3 border-t border-gray-600">
                <div className="text-xs text-gray-400 mb-1">
                  Top Recommendation:
                </div>
                <p className="text-xs text-gray-300 line-clamp-2">
                  {pattern.recommendations[0]}
                </p>
              </div>
            )}
          </motion.div>
        ))}
      </div>

      {/* Selected Pattern Details */}
      {selectedPattern && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-6 pt-6 border-t border-gray-700"
        >
          {(() => {
            const pattern = patterns.find((p) => p.id === selectedPattern);
            if (!pattern) return null;

            return (
              <div>
                <h4 className="text-sm font-semibold text-white mb-4">
                  Pattern Details
                </h4>
                <div className="space-y-4">
                  <div>
                    <h5 className="text-xs font-semibold text-gray-400 mb-2">
                      Description
                    </h5>
                    <p className="text-sm text-gray-300">
                      {pattern.description}
                    </p>
                  </div>
                  <div>
                    <h5 className="text-xs font-semibold text-gray-400 mb-2">
                      Affected NCRs
                    </h5>
                    <div className="flex flex-wrap gap-2">
                      {pattern.affectedNCRs.map((ncrId) => (
                        <button
                          key={ncrId}
                          onClick={() =>
                            (window.location.href = `/ncr-management?ncr=${ncrId}`)
                          }
                          className="px-2 py-1 rounded bg-gray-700 hover:bg-gray-600 text-xs text-gray-300 transition-colors"
                        >
                          {ncrId}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h5 className="text-xs font-semibold text-gray-400 mb-2">
                      Recommendations
                    </h5>
                    <ul className="space-y-2">
                      {pattern.recommendations.map((rec, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <i className="ri-checkbox-circle-line text-green-400 mt-0.5"></i>
                          <span className="text-sm text-gray-300">{rec}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            );
          })()}
        </motion.div>
      )}
    </div>
  );
}
