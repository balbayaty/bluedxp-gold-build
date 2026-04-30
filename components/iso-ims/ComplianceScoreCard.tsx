/**
 * Compliance Score Card - Mind-Blowing Visualization
 *
 * Features:
 * - Real-time compliance score with animations
 * - Deep drill-down capabilities
 * - Multi-standard breakdown
 * - Trend visualization
 * - AI-powered insights
 * - Interactive hover effects
 */

"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { ComplianceScore } from "@/lib/services/iso-ims/complianceEngine";

interface ComplianceScoreCardProps {
  score: ComplianceScore;
  onDrillDown?: (standard: string) => void;
  showTrends?: boolean;
  showBreakdown?: boolean;
}

export default function ComplianceScoreCard({
  score,
  onDrillDown,
  showTrends = true,
  showBreakdown = true,
}: ComplianceScoreCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [hoveredStandard, setHoveredStandard] = useState<string | null>(null);

  const getScoreColor = (scoreValue: number) => {
    if (scoreValue >= 90) return "from-green-500 to-emerald-600";
    if (scoreValue >= 75) return "from-blue-500 to-cyan-600";
    if (scoreValue >= 60) return "from-yellow-500 to-orange-600";
    return "from-red-500 to-pink-600";
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "GOOD":
        return "text-green-400 bg-green-900/30";
      case "WARNING":
        return "text-yellow-400 bg-yellow-900/30";
      case "CRITICAL":
        return "text-red-400 bg-red-900/30";
      default:
        return "text-gray-400 bg-gray-700";
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 rounded-xl p-6 shadow-xl"
    >
      {/* Main Score Display */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-200 mb-2">
            Overall Compliance Score
          </h3>
          <div className="flex items-baseline gap-4">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200, damping: 15 }}
              className="relative"
            >
              <span
                className={`text-6xl font-bold bg-gradient-to-r ${getScoreColor(score.overall)} bg-clip-text text-transparent`}
              >
                {Math.round(score.overall)}%
              </span>
              <motion.div
                className="absolute -top-2 -right-2"
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
              >
                <i className="ri-ai-generate-line text-2xl text-purple-400"></i>
              </motion.div>
            </motion.div>
            <div className="flex flex-col">
              <span className="text-sm text-gray-400">AI-Calculated</span>
              <span className="text-xs text-gray-500">
                Confidence: {score.confidence}%
              </span>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mt-4 w-full bg-gray-700 rounded-full h-3 overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${score.overall}%` }}
              transition={{ duration: 1.5, ease: "easeOut" }}
              className={`h-full bg-gradient-to-r ${getScoreColor(score.overall)} rounded-full relative`}
            >
              <motion.div
                className="absolute inset-0 bg-white/20"
                animate={{ x: ["-100%", "100%"] }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              />
            </motion.div>
          </div>
        </div>

        <button
          onClick={() => setExpanded(!expanded)}
          className="ml-4 p-2 rounded-lg bg-gray-700 hover:bg-gray-600 transition-colors"
          aria-label={expanded ? "Collapse" : "Expand"}
        >
          <i
            className={`ri-${expanded ? "arrow-up" : "arrow-down"}-s-line text-xl text-gray-300`}
          ></i>
        </button>
      </div>

      {/* Standards Breakdown */}
      {showBreakdown && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {Object.entries(score.byStandard).map(([standard, standardScore]) => (
            <motion.div
              key={standard}
              whileHover={{ scale: 1.05, y: -5 }}
              onHoverStart={() => setHoveredStandard(standard)}
              onHoverEnd={() => setHoveredStandard(null)}
              onClick={() => onDrillDown?.(standard)}
              className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                hoveredStandard === standard
                  ? "border-blue-500 bg-blue-900/20 shadow-lg shadow-blue-500/20"
                  : "border-gray-700 bg-gray-800/50"
              }`}
            >
              <div className="text-xs text-gray-400 mb-1">{standard}</div>
              <div
                className={`text-2xl font-bold bg-gradient-to-r ${getScoreColor(standardScore)} bg-clip-text text-transparent`}
              >
                {Math.round(standardScore)}%
              </div>
              <div className="mt-2 w-full bg-gray-700 rounded-full h-1.5">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${standardScore}%` }}
                  transition={{ duration: 1, delay: 0.2 }}
                  className={`h-full bg-gradient-to-r ${getScoreColor(standardScore)} rounded-full`}
                />
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Factors */}
      <div className="mb-6">
        <h4 className="text-sm font-semibold text-gray-300 mb-3">
          Key Factors
        </h4>
        <div className="space-y-2">
          {score.factors.map((factor, index) => (
            <motion.div
              key={factor.factor}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="flex items-center justify-between p-3 rounded-lg bg-gray-800/50 border border-gray-700"
            >
              <div className="flex items-center gap-3 flex-1">
                <span
                  className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(factor.status)}`}
                >
                  {factor.status}
                </span>
                <span className="text-sm text-gray-300">{factor.factor}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-24 bg-gray-700 rounded-full h-2">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${factor.impact * 100}%` }}
                    transition={{ duration: 0.8, delay: index * 0.1 }}
                    className="h-full bg-blue-500 rounded-full"
                  />
                </div>
                <span className="text-xs text-gray-400 w-12 text-right">
                  {(factor.impact * 100).toFixed(0)}%
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Expanded View */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            {/* Trends */}
            {showTrends && score.trends.length > 0 && (
              <div className="mt-6 pt-6 border-t border-gray-700">
                <h4 className="text-sm font-semibold text-gray-300 mb-4">
                  Trend Analysis
                </h4>
                <div className="relative h-32">
                  <svg
                    className="w-full h-full"
                    viewBox="0 0 400 100"
                    preserveAspectRatio="none"
                  >
                    <defs>
                      <linearGradient
                        id="trendGradient"
                        x1="0%"
                        y1="0%"
                        x2="0%"
                        y2="100%"
                      >
                        <stop offset="0%" stopColor="rgba(59, 130, 246, 0.5)" />
                        <stop offset="100%" stopColor="rgba(59, 130, 246, 0)" />
                      </linearGradient>
                    </defs>
                    <motion.path
                      d={`M ${score.trends
                        .map((t, i) => {
                          const x = (i / (score.trends.length - 1)) * 400;
                          const y = 100 - (t.score / 100) * 100;
                          return `${i === 0 ? "M" : "L"} ${x} ${y}`;
                        })
                        .join(" ")}`}
                      fill="url(#trendGradient)"
                      stroke="rgb(59, 130, 246)"
                      strokeWidth="2"
                      initial={{ pathLength: 0 }}
                      animate={{ pathLength: 1 }}
                      transition={{ duration: 2, ease: "easeInOut" }}
                    />
                  </svg>
                </div>
              </div>
            )}

            {/* Category Breakdown */}
            <div className="mt-6 pt-6 border-t border-gray-700">
              <h4 className="text-sm font-semibold text-gray-300 mb-4">
                Category Breakdown
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {Object.entries(score.byCategory).map(
                  ([category, categoryScore]) => (
                    <div key={category} className="text-center">
                      <div className="text-xs text-gray-400 mb-2 capitalize">
                        {category}
                      </div>
                      <div
                        className={`text-3xl font-bold bg-gradient-to-r ${getScoreColor(categoryScore)} bg-clip-text text-transparent`}
                      >
                        {Math.round(categoryScore)}%
                      </div>
                    </div>
                  ),
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
