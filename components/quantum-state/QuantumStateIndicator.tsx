/**
 * Quantum State Indicator Component
 *
 * Visual indicator for shipment quantum state
 * Can be used anywhere in the app
 *
 * @module components/quantum-state
 */

"use client";

import { useQuantumState } from "@/hooks/useQuantumState";
import { STATE_DEFINITIONS } from "@/lib/services/schrodingers-truck/types";
import { motion } from "framer-motion";

interface QuantumStateIndicatorProps {
  shipmentId: string;
  showDetails?: boolean;
  size?: "small" | "medium" | "large";
  className?: string;
}

export function QuantumStateIndicator({
  shipmentId,
  showDetails = false,
  size = "medium",
  className = "",
}: QuantumStateIndicatorProps) {
  const { quantumState, loading, error } = useQuantumState(shipmentId);

  if (loading) {
    return (
      <div className={`quantum-state-loading ${className}`}>
        <div className="animate-pulse">Loading quantum state...</div>
      </div>
    );
  }

  if (error || !quantumState) {
    return (
      <div className={`quantum-state-error ${className}`}>
        <span className="text-gray-400">No quantum state</span>
      </div>
    );
  }

  const stateDef = STATE_DEFINITIONS[quantumState.currentState];
  const sizeClasses = {
    small: "text-xs px-2 py-1",
    medium: "text-sm px-3 py-1.5",
    large: "text-base px-4 py-2",
  };

  return (
    <div className={`quantum-state-indicator ${className}`}>
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
        <span className="font-semibold">{quantumState.currentState}</span>
        {showDetails && (
          <span className="text-xs opacity-75">
            {(quantumState.probabilities.onTime * 100).toFixed(0)}% on-time
          </span>
        )}
      </motion.div>

      {showDetails && (
        <div className="mt-2 space-y-1">
          <div className="flex justify-between text-xs">
            <span>On-Time:</span>
            <span className="font-medium">
              {(quantumState.probabilities.onTime * 100).toFixed(1)}%
            </span>
          </div>
          <div className="flex justify-between text-xs">
            <span>Delayed:</span>
            <span className="font-medium">
              {(quantumState.probabilities.delayed * 100).toFixed(1)}%
            </span>
          </div>
          <div className="flex justify-between text-xs">
            <span>No-Show:</span>
            <span className="font-medium">
              {(quantumState.probabilities.noShow * 100).toFixed(1)}%
            </span>
          </div>
          <div className="mt-2 pt-2 border-t border-gray-200">
            <div className="text-xs text-gray-500">
              Confidence: {(quantumState.overallConfidence * 100).toFixed(0)}%
            </div>
            <div className="text-xs text-gray-500">
              Observations: {quantumState.observationCount}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default QuantumStateIndicator;
