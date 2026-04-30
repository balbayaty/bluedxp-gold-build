/**
 * Relationship Health Dashboard Component
 *
 * Revolutionary relationship health visualization
 * Shows health scores, trends, and recommendations
 *
 * @module components/emotional-intelligence
 */

"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  RadialBarChart,
  RadialBar,
  PolarAngleAxis,
  ResponsiveContainer,
  Cell,
} from "recharts";
import type { RelationshipHealth } from "@/lib/services/emotional-intelligence/unifiedEmotionalIntelligenceService";

interface RelationshipHealthDashboardProps {
  relationships: RelationshipHealth[];
  onRelationshipClick?: (health: RelationshipHealth) => void;
  className?: string;
}

export function RelationshipHealthDashboard({
  relationships,
  onRelationshipClick,
  className = "",
}: RelationshipHealthDashboardProps) {
  const [selectedRelationship, setSelectedRelationship] =
    useState<RelationshipHealth | null>(null);
  const [sortBy, setSortBy] = useState<"health" | "trend" | "risk">("health");

  // Sort relationships
  const sortedRelationships = [...relationships].sort((a, b) => {
    switch (sortBy) {
      case "health":
        return b.healthScore - a.healthScore;
      case "trend":
        const trendOrder = { improving: 3, stable: 2, declining: 1 };
        return trendOrder[b.trend] - trendOrder[a.trend];
      case "risk":
        const riskOrder = { HIGH: 3, MEDIUM: 2, LOW: 1 };
        return riskOrder[b.riskLevel] - riskOrder[a.riskLevel];
      default:
        return 0;
    }
  });

  // Calculate overall statistics
  const stats = {
    total: relationships.length,
    averageHealth:
      relationships.reduce((sum, r) => sum + r.healthScore, 0) /
      relationships.length,
    improving: relationships.filter((r) => r.trend === "improving").length,
    declining: relationships.filter((r) => r.trend === "declining").length,
    highRisk: relationships.filter((r) => r.riskLevel === "HIGH").length,
  };

  const getHealthColor = (score: number) => {
    if (score >= 80) return "#22c55e"; // Green
    if (score >= 60) return "#f59e0b"; // Amber
    if (score >= 40) return "#f97316"; // Orange
    return "#ef4444"; // Red
  };

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case "improving":
        return "#22c55e";
      case "declining":
        return "#ef4444";
      default:
        return "#94a3b8";
    }
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case "HIGH":
        return "#ef4444";
      case "MEDIUM":
        return "#f59e0b";
      default:
        return "#22c55e";
    }
  };

  return (
    <div className={`relationship-health-dashboard ${className}`}>
      {/* Statistics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <motion.div
          className="bg-gradient-to-br from-blue-500/20 to-indigo-600/20 backdrop-blur-xl rounded-xl p-4 border border-blue-500/30"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="text-sm text-blue-300 mb-1">Total Relationships</div>
          <div className="text-2xl font-bold text-blue-400">{stats.total}</div>
        </motion.div>

        <motion.div
          className="bg-gradient-to-br from-green-500/20 to-emerald-600/20 backdrop-blur-xl rounded-xl p-4 border border-green-500/30"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="text-sm text-green-300 mb-1">Average Health</div>
          <div className="text-2xl font-bold text-green-400">
            {stats.averageHealth.toFixed(0)}
          </div>
        </motion.div>

        <motion.div
          className="bg-gradient-to-br from-purple-500/20 to-pink-600/20 backdrop-blur-xl rounded-xl p-4 border border-purple-500/30"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="text-sm text-purple-300 mb-1">Improving</div>
          <div className="text-2xl font-bold text-purple-400">
            {stats.improving}
          </div>
          <div className="text-xs text-purple-400/70">
            {((stats.improving / stats.total) * 100).toFixed(0)}%
          </div>
        </motion.div>

        <motion.div
          className="bg-gradient-to-br from-red-500/20 to-rose-600/20 backdrop-blur-xl rounded-xl p-4 border border-red-500/30"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="text-sm text-red-300 mb-1">High Risk</div>
          <div className="text-2xl font-bold text-red-400">
            {stats.highRisk}
          </div>
          <div className="text-xs text-red-400/70">
            {((stats.highRisk / stats.total) * 100).toFixed(0)}%
          </div>
        </motion.div>
      </div>

      {/* Sort Controls */}
      <div className="mb-4 flex items-center gap-2">
        <span className="text-sm text-gray-400">Sort by:</span>
        {(["health", "trend", "risk"] as const).map((option) => (
          <button
            key={option}
            onClick={() => setSortBy(option)}
            className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
              sortBy === option
                ? "bg-blue-500/30 text-blue-400 border border-blue-500/50"
                : "bg-white/5 text-gray-400 hover:bg-white/10 border border-white/10"
            }`}
          >
            {option.charAt(0).toUpperCase() + option.slice(1)}
          </button>
        ))}
      </div>

      {/* Relationship Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <AnimatePresence>
          {sortedRelationships.map((relationship, idx) => {
            const healthColor = getHealthColor(relationship.healthScore);
            const trendColor = getTrendColor(relationship.trend);
            const riskColor = getRiskColor(relationship.riskLevel);

            // Radial chart data
            const radialData = [
              {
                name: "Health",
                value: relationship.healthScore,
                fill: healthColor,
              },
            ];

            return (
              <motion.div
                key={`${relationship.entityId1}-${relationship.entityId2}`}
                className="bg-white/5 backdrop-blur-xl rounded-xl p-4 border border-white/10 hover:border-white/20 transition-all cursor-pointer"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ delay: idx * 0.05 }}
                onClick={() => {
                  setSelectedRelationship(relationship);
                  onRelationshipClick?.(relationship);
                }}
                whileHover={{ scale: 1.02, y: -2 }}
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="text-sm font-semibold text-white mb-1">
                      {relationship.entityType1} ↔ {relationship.entityType2}
                    </div>
                    <div className="text-xs text-gray-400">
                      {relationship.entityId1.substring(0, 8)} ↔{" "}
                      {relationship.entityId2.substring(0, 8)}
                    </div>
                  </div>
                  <div
                    className="px-2 py-1 rounded text-xs font-semibold"
                    style={{
                      backgroundColor: `${riskColor}20`,
                      color: riskColor,
                      border: `1px solid ${riskColor}40`,
                    }}
                  >
                    {relationship.riskLevel}
                  </div>
                </div>

                {/* Health Score Radial Chart */}
                <div className="mb-4">
                  <ResponsiveContainer width="100%" height={120}>
                    <RadialBarChart
                      cx="50%"
                      cy="50%"
                      innerRadius="60%"
                      outerRadius="90%"
                      data={radialData}
                      startAngle={90}
                      endAngle={-270}
                    >
                      <PolarAngleAxis
                        type="number"
                        domain={[0, 100]}
                        angleAxisId={0}
                        tick={false}
                      />
                      <RadialBar
                        dataKey="value"
                        cornerRadius={10}
                        fill={healthColor}
                      />
                    </RadialBarChart>
                  </ResponsiveContainer>
                  <div className="text-center -mt-16">
                    <div
                      className="text-2xl font-bold"
                      style={{ color: healthColor }}
                    >
                      {relationship.healthScore}
                    </div>
                    <div className="text-xs text-gray-400">Health Score</div>
                  </div>
                </div>

                {/* Metrics */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-400">Sentiment:</span>
                    <span
                      className="font-semibold capitalize"
                      style={{
                        color:
                          relationship.sentiment === "positive"
                            ? "#22c55e"
                            : relationship.sentiment === "negative"
                              ? "#ef4444"
                              : "#94a3b8",
                      }}
                    >
                      {relationship.sentiment}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-400">Trend:</span>
                    <div className="flex items-center gap-1">
                      <span
                        className="font-semibold capitalize"
                        style={{ color: trendColor }}
                      >
                        {relationship.trend}
                      </span>
                      <span style={{ color: trendColor }}>
                        {relationship.trend === "improving"
                          ? "↑"
                          : relationship.trend === "declining"
                            ? "↓"
                            : "→"}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-400">Interactions:</span>
                    <span className="text-white font-semibold">
                      {relationship.interactionCount}
                    </span>
                  </div>
                  {relationship.lastInteraction && (
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-400">Last:</span>
                      <span className="text-gray-300">
                        {new Date(
                          relationship.lastInteraction,
                        ).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                </div>

                {/* Recommendations Preview */}
                {relationship.recommendations.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-white/10">
                    <div className="text-xs text-gray-400 mb-1">
                      Top Recommendation:
                    </div>
                    <div className="text-xs text-white line-clamp-1">
                      {relationship.recommendations[0]}
                    </div>
                  </div>
                )}
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Selected Relationship Details Modal */}
      <AnimatePresence>
        {selectedRelationship && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedRelationship(null)}
          >
            <motion.div
              className="bg-gray-900 rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-white/20"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold text-white">
                  Relationship Details
                </h3>
                <button
                  onClick={() => setSelectedRelationship(null)}
                  className="text-gray-400 hover:text-white"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <div className="text-sm text-gray-400 mb-2">Entities</div>
                  <div className="text-white">
                    {selectedRelationship.entityType1}{" "}
                    {selectedRelationship.entityId1} ↔{" "}
                    {selectedRelationship.entityType2}{" "}
                    {selectedRelationship.entityId2}
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <div className="text-sm text-gray-400 mb-1">
                      Health Score
                    </div>
                    <div
                      className="text-2xl font-bold"
                      style={{
                        color: getHealthColor(selectedRelationship.healthScore),
                      }}
                    >
                      {selectedRelationship.healthScore}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-400 mb-1">Sentiment</div>
                    <div className="text-lg font-semibold text-white capitalize">
                      {selectedRelationship.sentiment}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-400 mb-1">Risk Level</div>
                    <div
                      className="text-lg font-semibold"
                      style={{
                        color: getRiskColor(selectedRelationship.riskLevel),
                      }}
                    >
                      {selectedRelationship.riskLevel}
                    </div>
                  </div>
                </div>

                <div>
                  <div className="text-sm text-gray-400 mb-2">
                    Recommendations
                  </div>
                  <ul className="space-y-1">
                    {selectedRelationship.recommendations.map((rec, idx) => (
                      <li
                        key={idx}
                        className="text-sm text-white flex items-start gap-2"
                      >
                        <span className="text-blue-400 mt-1">•</span>
                        <span>{rec}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default RelationshipHealthDashboard;
