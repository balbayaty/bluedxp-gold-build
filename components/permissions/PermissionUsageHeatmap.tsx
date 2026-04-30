/**
 * 🔥 PERMISSION USAGE HEATMAP VISUALIZATION
 *
 * Beautiful heatmap showing:
 * - Time-based usage patterns
 * - Peak hours/days
 * - Usage intensity
 * - Success rates
 * - Interactive exploration
 */

"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { permissionUsageHeatmap } from "@/lib/services/permissions/permissionUsageHeatmap";
import type {
  HeatmapData,
  UsageAnalytics,
  UsagePattern,
} from "@/lib/services/permissions/permissionUsageHeatmap";

export default function PermissionUsageHeatmapComponent() {
  const [analytics, setAnalytics] = useState<UsageAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<"7d" | "30d" | "90d" | "all">(
    "30d",
  );
  const [selectedCell, setSelectedCell] = useState<HeatmapData | null>(null);

  useEffect(() => {
    loadAnalytics();
  }, [timeRange]);

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      const endDate = new Date();
      const startDate = new Date();

      switch (timeRange) {
        case "7d":
          startDate.setDate(endDate.getDate() - 7);
          break;
        case "30d":
          startDate.setDate(endDate.getDate() - 30);
          break;
        case "90d":
          startDate.setDate(endDate.getDate() - 90);
          break;
        default:
          startDate.setFullYear(2020); // All time
      }

      const data = await permissionUsageHeatmap.getAnalytics({
        start: startDate,
        end: endDate,
      });
      setAnalytics(data);
    } catch (error) {
      console.error("Failed to load analytics:", error);
    } finally {
      setLoading(false);
    }
  };

  const getIntensityColor = (count: number, maxCount: number) => {
    if (count === 0) return "bg-gray-900";
    const intensity = count / maxCount;
    if (intensity > 0.8) return "bg-red-500";
    if (intensity > 0.6) return "bg-orange-500";
    if (intensity > 0.4) return "bg-yellow-500";
    if (intensity > 0.2) return "bg-green-500";
    return "bg-blue-500";
  };

  const getMaxCount = (heatmap: HeatmapData[]) => {
    return Math.max(...heatmap.map((d) => d.count), 1);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white flex items-center justify-center">
        <div className="text-center">
          <i className="ri-loader-4-line text-6xl animate-spin text-cyan-400 mb-4"></i>
          <p className="text-gray-400">Loading heatmap...</p>
        </div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white flex items-center justify-center">
        <div className="text-center">
          <i className="ri-fire-line text-6xl text-gray-600 mb-4"></i>
          <p className="text-gray-400">No usage data available</p>
        </div>
      </div>
    );
  }

  const maxCount = getMaxCount(analytics.heatmap);
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold mb-2 flex items-center gap-3">
                <i className="ri-fire-line text-cyan-400"></i>
                Permission Usage Heatmap
              </h1>
              <p className="text-gray-400">
                Visualize permission usage patterns over time
              </p>
            </div>
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value as any)}
              className="px-4 py-2 bg-white/10 border border-white/20 rounded-lg"
            >
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
              <option value="all">All time</option>
            </select>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white/5 backdrop-blur-xl rounded-xl border border-white/10 p-6">
            <div className="text-3xl font-bold text-cyan-400 mb-1">
              {analytics.totalAccesses.toLocaleString()}
            </div>
            <div className="text-sm text-gray-400">Total Accesses</div>
          </div>
          <div className="bg-white/5 backdrop-blur-xl rounded-xl border border-white/10 p-6">
            <div className="text-3xl font-bold text-blue-400 mb-1">
              {analytics.uniqueUsers}
            </div>
            <div className="text-sm text-gray-400">Unique Users</div>
          </div>
          <div className="bg-white/5 backdrop-blur-xl rounded-xl border border-white/10 p-6">
            <div className="text-3xl font-bold text-green-400 mb-1">
              {analytics.patterns.length}
            </div>
            <div className="text-sm text-gray-400">Usage Patterns</div>
          </div>
          <div className="bg-white/5 backdrop-blur-xl rounded-xl border border-white/10 p-6">
            <div className="text-3xl font-bold text-yellow-400 mb-1">
              {analytics.insights.length}
            </div>
            <div className="text-sm text-gray-400">Insights</div>
          </div>
        </div>

        {/* Heatmap */}
        <div className="bg-white/5 backdrop-blur-xl rounded-xl border border-white/10 p-6 mb-8">
          <h2 className="text-xl font-bold mb-4">Usage Heatmap</h2>
          <div className="overflow-x-auto">
            <div className="inline-block min-w-full">
              {/* Hour labels */}
              <div className="flex mb-2">
                <div className="w-16"></div>
                {Array.from({ length: 24 }, (_, i) => (
                  <div
                    key={i}
                    className="flex-1 text-center text-xs text-gray-400"
                  >
                    {i}
                  </div>
                ))}
              </div>
              {/* Heatmap grid */}
              {Array.from({ length: 7 }, (_, day) => (
                <div key={day} className="flex items-center mb-1">
                  <div className="w-16 text-sm text-gray-400">
                    {dayNames[day]}
                  </div>
                  {Array.from({ length: 24 }, (_, hour) => {
                    const cell = analytics.heatmap.find(
                      (d) => d.day === day && d.hour === hour,
                    );
                    const count = cell?.count || 0;
                    return (
                      <motion.div
                        key={hour}
                        className="flex-1 h-8 mx-0.5 rounded cursor-pointer hover:scale-110 transition-transform"
                        style={{
                          backgroundColor:
                            count === 0
                              ? "#1f2937"
                              : `rgba(59, 130, 246, ${Math.min(1, count / maxCount)})`,
                        }}
                        onClick={() => setSelectedCell(cell || null)}
                        whileHover={{ scale: 1.1 }}
                        title={`${dayNames[day]} ${hour}:00 - ${count} accesses`}
                      />
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
          {/* Legend */}
          <div className="mt-4 flex items-center gap-4">
            <span className="text-sm text-gray-400">Less</span>
            <div className="flex-1 h-4 bg-gradient-to-r from-gray-900 via-blue-500 to-red-500 rounded"></div>
            <span className="text-sm text-gray-400">More</span>
          </div>
        </div>

        {/* Selected Cell Info */}
        {selectedCell && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/5 backdrop-blur-xl rounded-xl border border-white/10 p-6 mb-8"
          >
            <h3 className="text-lg font-bold mb-4">Cell Details</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <div className="text-sm text-gray-400 mb-1">Day</div>
                <div className="font-semibold">
                  {dayNames[selectedCell.day]}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-400 mb-1">Hour</div>
                <div className="font-semibold">{selectedCell.hour}:00</div>
              </div>
              <div>
                <div className="text-sm text-gray-400 mb-1">Accesses</div>
                <div className="font-semibold">{selectedCell.count}</div>
              </div>
              <div>
                <div className="text-sm text-gray-400 mb-1">Success Rate</div>
                <div className="font-semibold">
                  {selectedCell.successRate.toFixed(1)}%
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Insights & Recommendations */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white/5 backdrop-blur-xl rounded-xl border border-white/10 p-6">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <i className="ri-lightbulb-line text-yellow-400"></i>
              Insights
            </h2>
            <div className="space-y-2">
              {analytics.insights.length === 0 ? (
                <p className="text-gray-400 text-sm">No insights available</p>
              ) : (
                analytics.insights.map((insight, idx) => (
                  <div key={idx} className="p-3 bg-white/5 rounded-lg text-sm">
                    {insight}
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="bg-white/5 backdrop-blur-xl rounded-xl border border-white/10 p-6">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <i className="ri-star-line text-cyan-400"></i>
              Recommendations
            </h2>
            <div className="space-y-2">
              {analytics.recommendations.length === 0 ? (
                <p className="text-gray-400 text-sm">No recommendations</p>
              ) : (
                analytics.recommendations.map((rec, idx) => (
                  <div key={idx} className="p-3 bg-white/5 rounded-lg text-sm">
                    {rec}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
