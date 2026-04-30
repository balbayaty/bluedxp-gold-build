"use client";

/**
 * Root Cause Visualization Component
 * Interactive Fishbone (Ishikawa) diagram and 5 Whys analysis
 */

import { motion } from "framer-motion";
import { RootCauseAnalysis } from "@/types/lane-solutions";

interface RootCauseVisualizationProps {
  rootCause: RootCauseAnalysis;
}

export default function RootCauseVisualization({
  rootCause,
}: RootCauseVisualizationProps) {
  const fishboneCategories = [
    { key: "people", label: "People", color: "#6366F1", icon: "ri-user-line" },
    {
      key: "process",
      label: "Process",
      color: "#10B981",
      icon: "ri-flow-chart-line",
    },
    {
      key: "policy",
      label: "Policy",
      color: "#F59E0B",
      icon: "ri-file-list-line",
    },
    {
      key: "technology",
      label: "Technology",
      color: "#3B82F6",
      icon: "ri-computer-line",
    },
    {
      key: "environment",
      label: "Environment",
      color: "#F97316",
      icon: "ri-global-line",
    },
    {
      key: "measurement",
      label: "Measurement",
      color: "#8B5CF6",
      icon: "ri-bar-chart-line",
    },
  ] as const;

  return (
    <div className="space-y-6">
      {/* Problem Statement */}
      <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <i className="ri-alert-line text-2xl text-red-400 mt-1"></i>
          <div>
            <h3 className="text-white font-semibold mb-1">
              {rootCause.problem}
            </h3>
            <p className="text-[#9ca3af] text-sm">
              {rootCause.problemStatement}
            </p>
          </div>
        </div>
      </div>

      {/* Current vs Desired State */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white/5 border border-white/10 rounded-xl p-4">
          <h4 className="text-white font-semibold mb-3 flex items-center gap-2">
            <i className="ri-error-warning-line text-red-400"></i>
            Current State
          </h4>
          <p className="text-[#9ca3af] text-sm mb-3">
            {rootCause.currentState.description}
          </p>
          <div className="space-y-2">
            {rootCause.currentState.metrics.map((metric, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between text-sm"
              >
                <span className="text-[#9ca3af]">{metric.name}</span>
                <span className="text-white font-semibold">
                  {metric.value} {metric.unit}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-xl p-4">
          <h4 className="text-white font-semibold mb-3 flex items-center gap-2">
            <i className="ri-checkbox-circle-line text-green-400"></i>
            Desired State
          </h4>
          <p className="text-[#9ca3af] text-sm mb-3">
            {rootCause.desiredState.description}
          </p>
          <div className="space-y-2">
            {rootCause.desiredState.metrics.map((metric, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between text-sm"
              >
                <span className="text-[#9ca3af]">{metric.name}</span>
                <span className="text-green-400 font-semibold">
                  {metric.value} {metric.unit}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Fishbone Diagram */}
      <div className="bg-white/5 border border-white/10 rounded-xl p-6">
        <h4 className="text-white font-semibold mb-4 flex items-center gap-2">
          <i className="ri-node-tree text-cyan-400"></i>
          Fishbone (Ishikawa) Analysis
        </h4>

        <div className="relative">
          {/* Main spine */}
          <div className="absolute left-1/2 top-0 bottom-0 w-1 bg-gradient-to-b from-cyan-500 to-red-500 transform -translate-x-1/2"></div>

          {/* Problem box at end */}
          <div className="absolute right-0 top-1/2 transform -translate-y-1/2 bg-red-500/20 border-2 border-red-500 rounded-lg p-3 max-w-xs">
            <div className="text-red-400 font-semibold text-sm text-center">
              {rootCause.problem}
            </div>
          </div>

          {/* Category branches */}
          <div className="space-y-8 py-8">
            {fishboneCategories.map((category, idx) => {
              const factors = rootCause.fishboneAnalysis[category.key] || [];
              if (factors.length === 0) return null;

              const isLeft = idx % 2 === 0;
              const branchY = idx * 120 + 60;

              return (
                <div
                  key={category.key}
                  className="relative"
                  style={{ height: "100px" }}
                >
                  {/* Branch line */}
                  <svg className="absolute inset-0" style={{ height: "100px" }}>
                    <line
                      x1={isLeft ? "20%" : "80%"}
                      y1="50%"
                      x2="50%"
                      y2="50%"
                      stroke={category.color}
                      strokeWidth="2"
                      markerEnd="url(#arrowhead)"
                    />
                  </svg>

                  {/* Category box */}
                  <div
                    className={`absolute ${isLeft ? "left-0" : "right-0"} top-1/2 transform -translate-y-1/2 bg-white/5 border border-white/10 rounded-lg p-2 min-w-[150px]`}
                    style={{
                      backgroundColor: `${category.color}15`,
                      borderColor: category.color,
                    }}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <i
                        className={category.icon}
                        style={{ color: category.color }}
                      ></i>
                      <span className="text-white font-semibold text-sm">
                        {category.label}
                      </span>
                    </div>

                    {/* Factors */}
                    <div className="space-y-1">
                      {factors.slice(0, 3).map((factor, fIdx) => (
                        <div
                          key={fIdx}
                          className="text-xs text-[#9ca3af] flex items-start gap-1"
                        >
                          <span className="text-cyan-400">•</span>
                          <span>{factor}</span>
                        </div>
                      ))}
                      {factors.length > 3 && (
                        <div className="text-xs text-[#6b7280]">
                          +{factors.length - 3} more...
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Arrow marker definition */}
          <svg className="absolute opacity-0">
            <defs>
              <marker
                id="arrowhead"
                markerWidth="10"
                markerHeight="10"
                refX="9"
                refY="3"
                orient="auto"
              >
                <polygon points="0 0, 10 3, 0 6" fill="#9ca3af" />
              </marker>
            </defs>
          </svg>
        </div>
      </div>

      {/* 5 Whys Analysis */}
      {rootCause.fiveWhys && rootCause.fiveWhys.length > 0 && (
        <div className="bg-white/5 border border-white/10 rounded-xl p-6">
          <h4 className="text-white font-semibold mb-4 flex items-center gap-2">
            <i className="ri-question-line text-amber-400"></i>5 Whys Analysis
          </h4>
          <div className="space-y-3">
            {rootCause.fiveWhys.map((why, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="flex items-start gap-3 bg-white/5 rounded-lg p-3"
              >
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-amber-500/20 border border-amber-500/50 flex items-center justify-center text-amber-400 font-bold text-sm">
                  {idx + 1}
                </div>
                <p className="text-[#9ca3af] text-sm flex-1">{why}</p>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Contributing Factors */}
      <div className="bg-white/5 border border-white/10 rounded-xl p-6">
        <h4 className="text-white font-semibold mb-4 flex items-center gap-2">
          <i className="ri-pie-chart-line text-purple-400"></i>
          Contributing Factors
        </h4>
        <div className="space-y-3">
          {rootCause.contributingFactors.map((factor, idx) => (
            <div key={idx} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-[#9ca3af] text-sm">
                    {factor.factor}
                  </span>
                  {factor.controllable && (
                    <span className="px-2 py-0.5 bg-green-500/20 text-green-400 text-xs rounded">
                      Controllable
                    </span>
                  )}
                </div>
                <span className="text-white font-semibold">
                  {factor.contribution}%
                </span>
              </div>
              <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${factor.contribution}%` }}
                  transition={{ delay: idx * 0.1, duration: 0.5 }}
                  className="h-full bg-gradient-to-r from-purple-500 to-pink-500"
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
