/**
 * Warehouse Decision Support Component
 * Decision tracking and analytics
 * 4IR & 5IR Aligned • Modern UI • Deep Integration
 */

"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { warehouseDecisionIntegration } from "@/lib/services/wms/decisionIntegration";
import type { WarehouseDecision } from "@/lib/services/wms/decisionIntegration";

interface WarehouseDecisionSupportProps {
  warehouseId: string;
}

export default function WarehouseDecisionSupport({
  warehouseId,
}: WarehouseDecisionSupportProps) {
  const [decisions, setDecisions] = useState<WarehouseDecision[]>([]);
  const [statistics, setStatistics] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadDecisions();
    loadStatistics();
  }, [warehouseId]);

  const loadDecisions = async () => {
    // In production, would load all warehouse decisions
    // For now, show empty state
    setIsLoading(false);
  };

  const loadStatistics = async () => {
    try {
      const stats =
        await warehouseDecisionIntegration.getDecisionStatistics(warehouseId);
      setStatistics(stats);
    } catch (error) {
      console.error("Error loading statistics:", error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <i className="ri-loader-4-line text-4xl text-cyan-400 animate-spin"></i>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Statistics */}
      {statistics && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-6 rounded-xl bg-white/5 backdrop-blur-xl border border-white/10 shadow-lg"
        >
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
            <i className="ri-lightbulb-line mr-3 text-cyan-400"></i>
            Decision Support
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="p-4 rounded-lg bg-gradient-to-br from-cyan-500/10 to-blue-500/10 border border-cyan-500/30">
              <p className="text-sm text-gray-400 mb-1">Total Decisions</p>
              <p className="text-3xl font-bold text-white">
                {statistics.totalDecisions}
              </p>
            </div>
            <div className="p-4 rounded-lg bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-500/30">
              <p className="text-sm text-gray-400 mb-1">Avg Confidence</p>
              <p className="text-3xl font-bold text-white">
                {statistics.averageConfidence.toFixed(1)}%
              </p>
            </div>
            <div className="p-4 rounded-lg bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/30">
              <p className="text-sm text-gray-400 mb-1">Decision Types</p>
              <p className="text-3xl font-bold text-white">
                {Object.keys(statistics.byType).length}
              </p>
            </div>
            <div className="p-4 rounded-lg bg-gradient-to-br from-yellow-500/10 to-amber-500/10 border border-yellow-500/30">
              <p className="text-sm text-gray-400 mb-1">Status Types</p>
              <p className="text-3xl font-bold text-white">
                {Object.keys(statistics.byStatus).length}
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Decision Types Breakdown */}
      {statistics && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="p-6 rounded-xl bg-white/5 backdrop-blur-xl border border-white/10 shadow-lg"
        >
          <h3 className="text-lg font-semibold text-white mb-4">
            Decision Types
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {Object.entries(statistics.byType).map(([type, count]) => (
              <div
                key={type}
                className="p-3 rounded-lg bg-white/5 border border-white/10"
              >
                <p className="text-sm text-gray-400">{type}</p>
                <p className="text-xl font-bold text-white">
                  {count as number}
                </p>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Recent Decisions */}
      {decisions.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="p-6 rounded-xl bg-white/5 backdrop-blur-xl border border-white/10 shadow-lg"
        >
          <h3 className="text-lg font-semibold text-white mb-4">
            Recent Decisions
          </h3>
          <div className="space-y-3">
            {decisions.map((decision) => (
              <div
                key={decision.id}
                className="p-4 rounded-lg bg-white/5 border border-white/10"
              >
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="text-white font-medium">
                      {decision.decisionType}
                    </p>
                    <p className="text-sm text-gray-400">
                      {decision.entityType}: {decision.entityId}
                    </p>
                  </div>
                  <div className="text-right">
                    <span
                      className={`px-2 py-1 rounded text-xs ${
                        decision.status === "APPROVED"
                          ? "bg-green-500/20 text-green-400"
                          : decision.status === "REJECTED"
                            ? "bg-red-500/20 text-red-400"
                            : decision.status === "PENDING"
                              ? "bg-yellow-500/20 text-yellow-400"
                              : "bg-gray-500/20 text-gray-400"
                      }`}
                    >
                      {decision.status}
                    </span>
                  </div>
                </div>
                <p className="text-sm text-gray-300">{decision.reasoning}</p>
                <div className="flex items-center justify-between mt-2 text-xs text-gray-400">
                  <span>Confidence: {decision.confidence}%</span>
                  <span>{new Date(decision.createdAt).toLocaleString()}</span>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {decisions.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-6 rounded-xl bg-white/5 backdrop-blur-xl border border-white/10 shadow-lg text-center"
        >
          <i className="ri-lightbulb-line text-4xl text-gray-400 mb-4"></i>
          <p className="text-gray-400">
            No decisions recorded yet. Decisions will appear here as they are
            made.
          </p>
        </motion.div>
      )}
    </div>
  );
}
