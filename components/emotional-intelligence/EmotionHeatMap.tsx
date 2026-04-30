/**
 * Emotion Heat Map Component
 *
 * Revolutionary 3D heat map visualization of emotional states
 * Color-coded, interactive, real-time updates
 *
 * @module components/emotional-intelligence
 */

"use client";

import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import type {
  EmotionalState,
  EntityType,
} from "@/lib/services/emotional-intelligence/unifiedEmotionalIntelligenceService";

interface EmotionDataPoint {
  entityId: string;
  entityType: EntityType;
  state: EmotionalState;
  sentiment: "positive" | "negative" | "neutral" | "mixed";
  intensity: number;
  timestamp: Date;
  x: number; // Grid position
  y: number; // Grid position
}

interface EmotionHeatMapProps {
  data: EmotionDataPoint[];
  timeRange?: "24h" | "7d" | "30d" | "all";
  entityTypeFilter?: EntityType[];
  onEntityClick?: (entityId: string, entityType: EntityType) => void;
  className?: string;
}

const EMOTION_COLORS: Record<EmotionalState, string> = {
  POSITIVE: "#22c55e", // Green
  SATISFIED: "#10b981", // Emerald
  ENGAGED: "#3b82f6", // Blue
  NEUTRAL: "#94a3b8", // Slate
  NEGATIVE: "#ef4444", // Red
  STRESSED: "#f59e0b", // Amber
  FRUSTRATED: "#dc2626", // Red-600
  DISENGAGED: "#64748b", // Slate-500
};

const EMOTION_LABELS: Record<EmotionalState, string> = {
  POSITIVE: "Positive",
  SATISFIED: "Satisfied",
  ENGAGED: "Engaged",
  NEUTRAL: "Neutral",
  NEGATIVE: "Negative",
  STRESSED: "Stressed",
  FRUSTRATED: "Frustrated",
  DISENGAGED: "Disengaged",
};

export function EmotionHeatMap({
  data,
  timeRange = "7d",
  entityTypeFilter,
  onEntityClick,
  className = "",
}: EmotionHeatMapProps) {
  const [selectedEntity, setSelectedEntity] = useState<string | null>(null);
  const [hoveredEntity, setHoveredEntity] = useState<string | null>(null);

  // Filter and process data
  const processedData = useMemo(() => {
    let filtered = data;

    // Filter by time range
    if (timeRange !== "all") {
      const now = new Date();
      const cutoff = new Date();
      switch (timeRange) {
        case "24h":
          cutoff.setHours(now.getHours() - 24);
          break;
        case "7d":
          cutoff.setDate(now.getDate() - 7);
          break;
        case "30d":
          cutoff.setDate(now.getDate() - 30);
          break;
      }
      filtered = filtered.filter((d) => new Date(d.timestamp) >= cutoff);
    }

    // Filter by entity type
    if (entityTypeFilter && entityTypeFilter.length > 0) {
      filtered = filtered.filter((d) =>
        entityTypeFilter.includes(d.entityType),
      );
    }

    // Get latest state for each entity
    const entityMap = new Map<string, EmotionDataPoint>();
    filtered.forEach((point) => {
      const key = `${point.entityType}:${point.entityId}`;
      const existing = entityMap.get(key);
      if (
        !existing ||
        new Date(point.timestamp) > new Date(existing.timestamp)
      ) {
        entityMap.set(key, point);
      }
    });

    return Array.from(entityMap.values());
  }, [data, timeRange, entityTypeFilter]);

  // Create grid layout
  const gridData = useMemo(() => {
    const size = Math.ceil(Math.sqrt(processedData.length));
    const grid: (EmotionDataPoint | null)[][] = Array(size)
      .fill(null)
      .map(() => Array(size).fill(null));

    processedData.forEach((point, idx) => {
      const row = Math.floor(idx / size);
      const col = idx % size;
      if (row < size && col < size) {
        grid[row][col] = point;
      }
    });

    return grid;
  }, [processedData]);

  // Calculate statistics
  const stats = useMemo(() => {
    const stateCounts: Record<EmotionalState, number> = {
      POSITIVE: 0,
      SATISFIED: 0,
      ENGAGED: 0,
      NEUTRAL: 0,
      NEGATIVE: 0,
      STRESSED: 0,
      FRUSTRATED: 0,
      DISENGAGED: 0,
    };

    processedData.forEach((point) => {
      stateCounts[point.state] = (stateCounts[point.state] || 0) + 1;
    });

    const total = processedData.length;
    const positiveCount =
      stateCounts.POSITIVE + stateCounts.SATISFIED + stateCounts.ENGAGED;
    const negativeCount =
      stateCounts.NEGATIVE + stateCounts.STRESSED + stateCounts.FRUSTRATED;
    const neutralCount = stateCounts.NEUTRAL + stateCounts.DISENGAGED;

    return {
      total,
      positive: positiveCount,
      negative: negativeCount,
      neutral: neutralCount,
      positivePercent: total > 0 ? (positiveCount / total) * 100 : 0,
      negativePercent: total > 0 ? (negativeCount / total) * 100 : 0,
      neutralPercent: total > 0 ? (neutralCount / total) * 100 : 0,
      stateCounts,
    };
  }, [processedData]);

  return (
    <div className={`emotion-heat-map ${className}`}>
      {/* Statistics Bar */}
      <div className="mb-6 grid grid-cols-1 md:grid-cols-4 gap-4">
        <motion.div
          className="bg-gradient-to-br from-green-500/20 to-emerald-600/20 backdrop-blur-xl rounded-xl p-4 border border-green-500/30"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="text-sm text-green-300 mb-1">Positive</div>
          <div className="text-2xl font-bold text-green-400">
            {stats.positive}
          </div>
          <div className="text-xs text-green-400/70">
            {stats.positivePercent.toFixed(1)}%
          </div>
        </motion.div>

        <motion.div
          className="bg-gradient-to-br from-red-500/20 to-rose-600/20 backdrop-blur-xl rounded-xl p-4 border border-red-500/30"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="text-sm text-red-300 mb-1">Negative</div>
          <div className="text-2xl font-bold text-red-400">
            {stats.negative}
          </div>
          <div className="text-xs text-red-400/70">
            {stats.negativePercent.toFixed(1)}%
          </div>
        </motion.div>

        <motion.div
          className="bg-gradient-to-br from-slate-500/20 to-gray-600/20 backdrop-blur-xl rounded-xl p-4 border border-slate-500/30"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="text-sm text-slate-300 mb-1">Neutral</div>
          <div className="text-2xl font-bold text-slate-400">
            {stats.neutral}
          </div>
          <div className="text-xs text-slate-400/70">
            {stats.neutralPercent.toFixed(1)}%
          </div>
        </motion.div>

        <motion.div
          className="bg-gradient-to-br from-blue-500/20 to-indigo-600/20 backdrop-blur-xl rounded-xl p-4 border border-blue-500/30"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <div className="text-sm text-blue-300 mb-1">Total</div>
          <div className="text-2xl font-bold text-blue-400">{stats.total}</div>
          <div className="text-xs text-blue-400/70">Entities</div>
        </motion.div>
      </div>

      {/* Heat Map Grid */}
      <div className="relative">
        <div
          className="grid gap-2"
          style={{
            gridTemplateColumns: `repeat(${gridData.length}, minmax(0, 1fr))`,
          }}
        >
          {gridData.map((row, rowIdx) =>
            row.map((cell, colIdx) => {
              if (!cell) {
                return (
                  <div key={`${rowIdx}-${colIdx}`} className="aspect-square" />
                );
              }

              const key = `${cell.entityType}:${cell.entityId}`;
              const isSelected = selectedEntity === key;
              const isHovered = hoveredEntity === key;
              const color = EMOTION_COLORS[cell.state];
              const intensity = cell.intensity;

              return (
                <motion.div
                  key={key}
                  className="aspect-square relative group cursor-pointer"
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{
                    scale: isHovered ? 1.1 : isSelected ? 1.05 : 1,
                    opacity: 1,
                  }}
                  whileHover={{ scale: 1.1, zIndex: 10 }}
                  onClick={() => {
                    setSelectedEntity(isSelected ? null : key);
                    onEntityClick?.(cell.entityId, cell.entityType);
                  }}
                  onMouseEnter={() => setHoveredEntity(key)}
                  onMouseLeave={() => setHoveredEntity(null)}
                >
                  <div
                    className="w-full h-full rounded-lg border-2 transition-all duration-300"
                    style={{
                      backgroundColor: `${color}${Math.round(intensity * 255)
                        .toString(16)
                        .padStart(2, "0")}`,
                      borderColor: isSelected
                        ? color
                        : isHovered
                          ? `${color}80`
                          : `${color}40`,
                      boxShadow: isHovered
                        ? `0 0 20px ${color}60, 0 0 40px ${color}40`
                        : isSelected
                          ? `0 0 15px ${color}50`
                          : "none",
                    }}
                  >
                    {/* Entity Type Badge */}
                    <div className="absolute top-1 left-1 text-xs font-semibold text-white/80 bg-black/30 px-1.5 py-0.5 rounded">
                      {cell.entityType.substring(0, 3)}
                    </div>

                    {/* Intensity Indicator */}
                    <div className="absolute bottom-1 right-1">
                      <div
                        className="w-2 h-2 rounded-full"
                        style={{
                          backgroundColor: color,
                          opacity: intensity,
                          boxShadow: `0 0 8px ${color}`,
                        }}
                      />
                    </div>
                  </div>

                  {/* Tooltip */}
                  {isHovered && (
                    <motion.div
                      className="absolute z-20 bg-black/90 backdrop-blur-xl rounded-lg p-3 border border-white/20 shadow-2xl"
                      style={{
                        top: "100%",
                        left: "50%",
                        transform: "translateX(-50%)",
                        marginTop: "8px",
                      }}
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                    >
                      <div className="text-xs font-semibold text-white mb-1">
                        {cell.entityType} {cell.entityId.substring(0, 8)}
                      </div>
                      <div className="text-xs text-gray-300 mb-1">
                        State:{" "}
                        <span style={{ color }}>
                          {EMOTION_LABELS[cell.state]}
                        </span>
                      </div>
                      <div className="text-xs text-gray-400">
                        Sentiment: {cell.sentiment}
                      </div>
                      <div className="text-xs text-gray-400">
                        Intensity: {(intensity * 100).toFixed(0)}%
                      </div>
                    </motion.div>
                  )}
                </motion.div>
              );
            }),
          )}
        </div>
      </div>

      {/* Legend */}
      <div className="mt-6 flex flex-wrap gap-4 justify-center">
        {Object.entries(EMOTION_COLORS).map(([state, color]) => (
          <div key={state} className="flex items-center gap-2">
            <div
              className="w-4 h-4 rounded"
              style={{ backgroundColor: color }}
            />
            <span className="text-sm text-gray-300">
              {EMOTION_LABELS[state as EmotionalState]}
            </span>
            <span className="text-xs text-gray-500">
              ({stats.stateCounts[state as EmotionalState]})
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default EmotionHeatMap;
