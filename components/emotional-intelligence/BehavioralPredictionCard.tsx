/**
 * Behavioral Prediction Card Component
 *
 * Revolutionary prediction cards with confidence scores
 * Shows predictions, evidence, and recommended actions
 *
 * @module components/emotional-intelligence
 */

"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { BehavioralPrediction } from "@/lib/services/emotional-intelligence/unifiedEmotionalIntelligenceService";

interface BehavioralPredictionCardProps {
  prediction: BehavioralPrediction;
  onActionClick?: (action: string) => void;
  className?: string;
}

export function BehavioralPredictionCard({
  prediction,
  onActionClick,
  className = "",
}: BehavioralPredictionCardProps) {
  const [expanded, setExpanded] = useState(false);

  const confidenceColor =
    prediction.confidence >= 0.8
      ? "#22c55e" // Green
      : prediction.confidence >= 0.6
        ? "#f59e0b" // Amber
        : "#ef4444"; // Red

  const riskLevel =
    prediction.riskFactors.length >= 3
      ? "HIGH"
      : prediction.riskFactors.length >= 1
        ? "MEDIUM"
        : "LOW";

  return (
    <motion.div
      className={`behavioral-prediction-card bg-white/5 backdrop-blur-xl rounded-xl p-4 border border-white/10 hover:border-white/20 transition-all ${className}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02, y: -2 }}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-lg">🔮</span>
            <span className="text-sm font-semibold text-white">Prediction</span>
            <span
              className="px-2 py-0.5 rounded text-xs font-semibold"
              style={{
                backgroundColor: `${confidenceColor}20`,
                color: confidenceColor,
                border: `1px solid ${confidenceColor}40`,
              }}
            >
              {(prediction.confidence * 100).toFixed(0)}% Confidence
            </span>
          </div>
          <div className="text-xs text-gray-400">
            {prediction.entityType} {prediction.entityId.substring(0, 8)}
          </div>
        </div>
        <button
          onClick={() => setExpanded(!expanded)}
          className="text-gray-400 hover:text-white transition-colors"
        >
          {expanded ? "▼" : "▶"}
        </button>
      </div>

      {/* Prediction Text */}
      <div className="mb-3">
        <p className="text-sm text-white leading-relaxed">
          {prediction.prediction}
        </p>
        <div className="text-xs text-gray-400 mt-1">
          Timeframe: {prediction.timeframe}
        </div>
      </div>

      {/* Risk Factors (Always Visible) */}
      {prediction.riskFactors.length > 0 && (
        <div className="mb-3">
          <div className="text-xs font-semibold text-red-400 mb-1">
            Risk Factors:
          </div>
          <div className="flex flex-wrap gap-1">
            {prediction.riskFactors.slice(0, 3).map((factor, idx) => (
              <span
                key={idx}
                className="text-xs px-2 py-0.5 rounded bg-red-500/20 text-red-400 border border-red-500/30"
              >
                {factor}
              </span>
            ))}
            {prediction.riskFactors.length > 3 && (
              <span className="text-xs text-gray-400">
                +{prediction.riskFactors.length - 3} more
              </span>
            )}
          </div>
        </div>
      )}

      {/* Positive Signals */}
      {prediction.positiveSignals.length > 0 && (
        <div className="mb-3">
          <div className="text-xs font-semibold text-green-400 mb-1">
            Positive Signals:
          </div>
          <div className="flex flex-wrap gap-1">
            {prediction.positiveSignals.slice(0, 3).map((signal, idx) => (
              <span
                key={idx}
                className="text-xs px-2 py-0.5 rounded bg-green-500/20 text-green-400 border border-green-500/30"
              >
                {signal}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Expanded Details */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="pt-3 border-t border-white/10 space-y-3">
              {/* Supporting Evidence */}
              {prediction.supportingEvidence.length > 0 && (
                <div>
                  <div className="text-xs font-semibold text-gray-300 mb-2">
                    Supporting Evidence:
                  </div>
                  <ul className="space-y-1">
                    {prediction.supportingEvidence
                      .slice(0, 5)
                      .map((evidence, idx) => (
                        <li
                          key={idx}
                          className="text-xs text-gray-400 flex items-start gap-2"
                        >
                          <span className="text-blue-400 mt-1">•</span>
                          <span>{evidence}</span>
                        </li>
                      ))}
                  </ul>
                </div>
              )}

              {/* Recommended Actions */}
              {prediction.recommendedActions.length > 0 && (
                <div>
                  <div className="text-xs font-semibold text-gray-300 mb-2">
                    Recommended Actions:
                  </div>
                  <div className="space-y-2">
                    {prediction.recommendedActions.map((action, idx) => (
                      <motion.button
                        key={idx}
                        onClick={() => onActionClick?.(action)}
                        className="w-full text-left text-xs px-3 py-2 rounded-lg bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30 text-blue-400 transition-colors"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <div className="flex items-center gap-2">
                          <span>→</span>
                          <span>{action}</span>
                        </div>
                      </motion.button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default BehavioralPredictionCard;
