"use client";

import { motion } from "framer-motion";
import {
  CountItem,
  RootCauseAnalysis,
  VarianceSeverity,
} from "@/types/cycleCounting";
import Tooltip from "./Tooltip";

interface VarianceAnalysisProps {
  item: CountItem;
  rootCauseAnalysis?: RootCauseAnalysis;
  onAnalyze?: () => void;
}

export default function VarianceAnalysis({
  item,
  rootCauseAnalysis,
  onAnalyze,
}: VarianceAnalysisProps) {
  if (!item.variance || Math.abs(item.variance) < 0.01) {
    return (
      <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4">
        <div className="flex items-center gap-2">
          <i className="ri-checkbox-circle-line text-green-400 text-xl"></i>
          <div>
            <div className="text-sm font-semibold text-white">No Variance</div>
            <div className="text-xs text-[#9ca3af]">
              Count matches book quantity
            </div>
          </div>
        </div>
      </div>
    );
  }

  const variancePercentage = item.variancePercentage || 0;
  const varianceValue = item.varianceValue || 0;
  const severity = item.varianceSeverity || "MINOR";

  const severityColors: Record<VarianceSeverity, string> = {
    NONE: "green",
    MINOR: "yellow",
    MODERATE: "orange",
    MAJOR: "red",
    CRITICAL: "red",
  };

  const severityColor = severityColors[severity] || "yellow";

  return (
    <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white">Variance Analysis</h3>
        {onAnalyze && !rootCauseAnalysis && (
          <button
            onClick={onAnalyze}
            className="px-4 py-2 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400 border border-cyan-500/30 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
          >
            <i className="ri-brain-line"></i>
            Analyze Root Cause
          </button>
        )}
      </div>

      {/* Variance Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white/5 rounded-lg p-4 border border-white/10">
          <div className="text-xs text-[#9ca3af] mb-1">Variance</div>
          <div
            className={`text-2xl font-bold ${
              item.variance > 0 ? "text-green-400" : "text-red-400"
            }`}
          >
            {item.variance > 0 ? "+" : ""}
            {item.variance.toFixed(2)} {item.unit}
          </div>
        </div>
        <div className="bg-white/5 rounded-lg p-4 border border-white/10">
          <div className="text-xs text-[#9ca3af] mb-1">Variance %</div>
          <div className={`text-2xl font-bold text-${severityColor}-400`}>
            {variancePercentage > 0 ? "+" : ""}
            {variancePercentage.toFixed(2)}%
          </div>
        </div>
        <div className="bg-white/5 rounded-lg p-4 border border-white/10">
          <div className="text-xs text-[#9ca3af] mb-1">Value Impact</div>
          <div
            className={`text-2xl font-bold ${
              varianceValue > 0 ? "text-green-400" : "text-red-400"
            }`}
          >
            {varianceValue > 0 ? "+" : ""}AED{" "}
            {Math.abs(varianceValue).toFixed(2)}
          </div>
        </div>
      </div>

      {/* Severity Indicator */}
      <div
        className={`mb-6 p-4 rounded-lg border-2 ${
          severity === "CRITICAL" || severity === "MAJOR"
            ? "bg-red-500/10 border-red-500/20"
            : severity === "MODERATE"
              ? "bg-orange-500/10 border-orange-500/20"
              : "bg-yellow-500/10 border-yellow-500/20"
        }`}
      >
        <div className="flex items-center gap-3">
          <i className={`ri-alert-line text-${severityColor}-400 text-2xl`}></i>
          <div className="flex-1">
            <div className="text-sm font-semibold text-white mb-1">
              {severity} Variance Detected
            </div>
            <div className="text-xs text-[#9ca3af]">
              {severity === "CRITICAL" &&
                "Immediate action required - Variance exceeds 10%"}
              {severity === "MAJOR" &&
                "Significant variance detected - Review required"}
              {severity === "MODERATE" &&
                "Moderate variance - May require investigation"}
              {severity === "MINOR" &&
                "Minor variance - Within acceptable tolerance"}
            </div>
          </div>
        </div>
      </div>

      {/* Root Cause Analysis */}
      {rootCauseAnalysis && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-cyan-500/10 border border-cyan-500/20 rounded-lg p-4 mb-4"
        >
          <div className="flex items-center gap-2 mb-3">
            <i className="ri-brain-line text-cyan-400 text-lg"></i>
            <h4 className="text-sm font-semibold text-white">
              Root Cause Analysis
            </h4>
            <span className="ml-auto px-2 py-1 bg-cyan-500/20 text-cyan-400 rounded text-xs font-medium">
              {Math.round(rootCauseAnalysis.probability * 100)}% confidence
            </span>
          </div>

          <div className="space-y-2">
            <div>
              <div className="text-xs text-[#9ca3af] mb-1">Category</div>
              <div className="text-sm font-medium text-white">
                {rootCauseAnalysis.category.replace("_", " ")}
              </div>
            </div>
            <div>
              <div className="text-xs text-[#9ca3af] mb-1">Description</div>
              <div className="text-sm text-white">
                {rootCauseAnalysis.description}
              </div>
            </div>
            {rootCauseAnalysis.evidence &&
              rootCauseAnalysis.evidence.length > 0 && (
                <div>
                  <div className="text-xs text-[#9ca3af] mb-1">Evidence</div>
                  <ul className="list-disc list-inside space-y-1">
                    {rootCauseAnalysis.evidence.map((evidence, idx) => (
                      <li key={idx} className="text-xs text-white">
                        {evidence}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            {rootCauseAnalysis.recommendedAction && (
              <div>
                <div className="text-xs text-[#9ca3af] mb-1">
                  Recommended Action
                </div>
                <div className="text-sm text-cyan-400">
                  {rootCauseAnalysis.recommendedAction}
                </div>
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* Comparison */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
          <div className="text-xs text-blue-400 mb-1">Book Quantity</div>
          <div className="text-2xl font-bold text-white">
            {item.bookQuantity.toFixed(2)} {item.unit}
          </div>
          <div className="text-xs text-[#9ca3af] mt-1">System Record</div>
        </div>
        <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
          <div className="text-xs text-green-400 mb-1">Counted Quantity</div>
          <div className="text-2xl font-bold text-white">
            {item.countedQuantity?.toFixed(2) || "0.00"} {item.unit}
          </div>
          <div className="text-xs text-[#9ca3af] mt-1">Physical Count</div>
        </div>
      </div>
    </div>
  );
}
