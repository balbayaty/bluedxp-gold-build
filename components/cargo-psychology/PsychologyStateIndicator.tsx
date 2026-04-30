/**
 * Psychology State Indicator Component
 *
 * Visual indicator for shipment psychology state
 * Can be used anywhere in the app
 *
 * @module components/cargo-psychology
 */

"use client";

import { useCargoPsychology } from "@/hooks/useCargoPsychology";
import { PSYCHOLOGY_STATE_DEFINITIONS } from "@/lib/services/cargo-psychology/types";
import { motion } from "framer-motion";

interface PsychologyStateIndicatorProps {
  shipmentId: string;
  showDetails?: boolean;
  size?: "small" | "medium" | "large";
  className?: string;
}

export function PsychologyStateIndicator({
  shipmentId,
  showDetails = false,
  size = "medium",
  className = "",
}: PsychologyStateIndicatorProps) {
  const { psychologyState, loading, error } = useCargoPsychology(shipmentId);

  if (loading) {
    return (
      <div className={`psychology-state-loading ${className}`}>
        <div className="animate-pulse">Analyzing psychology...</div>
      </div>
    );
  }

  if (error || !psychologyState) {
    return (
      <div className={`psychology-state-error ${className}`}>
        <span className="text-gray-400">No psychology data</span>
      </div>
    );
  }

  const stateDef = PSYCHOLOGY_STATE_DEFINITIONS[psychologyState.currentState];
  const sizeClasses = {
    small: "text-xs px-2 py-1",
    medium: "text-sm px-3 py-1.5",
    large: "text-base px-4 py-2",
  };

  return (
    <div className={`psychology-state-indicator ${className}`}>
      <motion.div
        className={`inline-flex items-center gap-2 rounded-full font-medium ${sizeClasses[size]}`}
        style={{
          backgroundColor: `${stateDef.color}20`,
          color: stateDef.color,
        }}
        initial={{ scale: 0.9 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.2 }}
      >
        <span className="text-lg">{stateDef.icon}</span>
        <span className="font-semibold">{psychologyState.currentState}</span>
        {showDetails && (
          <span className="text-xs opacity-75">
            Score: {(psychologyState.currentScore.score * 100).toFixed(0)}
          </span>
        )}
      </motion.div>

      {showDetails && (
        <div className="mt-2 space-y-1">
          <div className="text-xs text-gray-600">{stateDef.description}</div>
          <div className="text-xs text-gray-500">
            No-Show Rate: {stateDef.noShowRate}
          </div>
          <div className="mt-2 pt-2 border-t border-gray-200">
            <div className="text-xs font-semibold mb-1">Risk Factors:</div>
            {psychologyState.currentScore.riskFactors.length > 0 ? (
              <ul className="text-xs text-red-600 space-y-0.5">
                {psychologyState.currentScore.riskFactors
                  .slice(0, 3)
                  .map((factor, idx) => (
                    <li key={idx}>• {factor}</li>
                  ))}
              </ul>
            ) : (
              <div className="text-xs text-gray-400">None identified</div>
            )}
          </div>
          <div className="mt-2 pt-2 border-t border-gray-200">
            <div className="text-xs font-semibold mb-1">Positive Signals:</div>
            {psychologyState.currentScore.positiveSignals.length > 0 ? (
              <ul className="text-xs text-green-600 space-y-0.5">
                {psychologyState.currentScore.positiveSignals
                  .slice(0, 3)
                  .map((signal, idx) => (
                    <li key={idx}>• {signal}</li>
                  ))}
              </ul>
            ) : (
              <div className="text-xs text-gray-400">None identified</div>
            )}
          </div>
          <div className="mt-2 pt-2 border-t border-gray-200">
            <div className="text-xs text-gray-500">
              Confidence:{" "}
              {(psychologyState.currentScore.confidence * 100).toFixed(0)}%
            </div>
            <div className="text-xs text-gray-500">
              Signals Analyzed:{" "}
              {psychologyState.currentScore.signalAnalyses.length}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default PsychologyStateIndicator;
