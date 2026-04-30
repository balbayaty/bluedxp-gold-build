/**
 * Warehouse Optimization Panel
 * Mind-blowing optimization insights and recommendations
 * Real-time • Interactive • Beautiful
 */

"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  warehouseOptimizationService,
  type SlottingRecommendation,
  type PickPathOptimization,
  type SpaceUtilization,
} from "@/lib/services/wms/warehouseOptimizationService";
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from "recharts";

interface WarehouseOptimizationPanelProps {
  warehouseId: string;
  warehouseName?: string;
}

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"];

export default function WarehouseOptimizationPanel({
  warehouseId,
  warehouseName,
}: WarehouseOptimizationPanelProps) {
  const [slottingRecommendations, setSlottingRecommendations] = useState<
    SlottingRecommendation[]
  >([]);
  const [spaceUtilization, setSpaceUtilization] =
    useState<SpaceUtilization | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"SLOTTING" | "SPACE" | "LABOR">(
    "SLOTTING",
  );

  useEffect(() => {
    loadOptimizations();
  }, [warehouseId]);

  const loadOptimizations = async () => {
    setLoading(true);
    try {
      const [slotting, space] = await Promise.all([
        warehouseOptimizationService.optimizeSlotting(warehouseId),
        warehouseOptimizationService.analyzeSpaceUtilization(warehouseId),
      ]);
      setSlottingRecommendations(slotting);
      setSpaceUtilization(space);
    } catch (error) {
      console.error("Error loading optimizations:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  const spaceData =
    spaceUtilization?.recommendations.map((rec) => ({
      area: rec.area,
      current: rec.currentUtilization,
      recommended: rec.recommendedUtilization,
    })) || [];

  const priorityCounts = {
    HIGH: slottingRecommendations.filter((r) => r.priority === "HIGH").length,
    MEDIUM: slottingRecommendations.filter((r) => r.priority === "MEDIUM")
      .length,
    LOW: slottingRecommendations.filter((r) => r.priority === "LOW").length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <i className="ri-settings-3-line text-blue-500"></i>
            Warehouse Optimization
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {warehouseName || warehouseId} • AI-Powered Optimization
          </p>
        </div>
        <button
          onClick={loadOptimizations}
          className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors flex items-center gap-2"
        >
          <i className="ri-refresh-line"></i>
          Refresh
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200 dark:border-gray-700">
        {(["SLOTTING", "SPACE", "LABOR"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 font-medium transition-colors border-b-2 ${
              activeTab === tab
                ? "border-blue-500 text-blue-500"
                : "border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white shadow-xl"
        >
          <div className="flex items-center justify-between mb-2">
            <i className="ri-map-pin-line text-2xl opacity-80"></i>
            <span className="text-xs bg-white/20 px-2 py-1 rounded-full">
              Slotting
            </span>
          </div>
          <div className="text-3xl font-bold">
            {slottingRecommendations.length}
          </div>
          <div className="text-sm opacity-90 mt-1">Recommendations</div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white shadow-xl"
        >
          <div className="flex items-center justify-between mb-2">
            <i className="ri-stack-line text-2xl opacity-80"></i>
            <span className="text-xs bg-white/20 px-2 py-1 rounded-full">
              Space
            </span>
          </div>
          <div className="text-3xl font-bold">
            {spaceUtilization?.utilizationPercentage.toFixed(1) || 0}%
          </div>
          <div className="text-sm opacity-90 mt-1">Utilization</div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white shadow-xl"
        >
          <div className="flex items-center justify-between mb-2">
            <i className="ri-time-line text-2xl opacity-80"></i>
            <span className="text-xs bg-white/20 px-2 py-1 rounded-full">
              Time
            </span>
          </div>
          <div className="text-3xl font-bold">
            {slottingRecommendations.reduce(
              (sum, r) => sum + (r.expectedImprovement.pickTimeReduction || 0),
              0,
            )}
            s
          </div>
          <div className="text-sm opacity-90 mt-1">Time Savings</div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-6 text-white shadow-xl"
        >
          <div className="flex items-center justify-between mb-2">
            <i className="ri-route-line text-2xl opacity-80"></i>
            <span className="text-xs bg-white/20 px-2 py-1 rounded-full">
              Distance
            </span>
          </div>
          <div className="text-3xl font-bold">
            {slottingRecommendations.reduce(
              (sum, r) =>
                sum + (r.expectedImprovement.travelDistanceReduction || 0),
              0,
            )}
            m
          </div>
          <div className="text-sm opacity-90 mt-1">Distance Savings</div>
        </motion.div>
      </div>

      {/* Slotting Recommendations */}
      {activeTab === "SLOTTING" && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg"
        >
          <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <i className="ri-map-pin-line text-blue-500"></i>
            Slotting Optimization Recommendations
          </h4>

          {/* Priority Distribution */}
          <div className="mb-6">
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={Object.entries(priorityCounts).map(([name, value]) => ({
                    name,
                    value,
                  }))}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) =>
                    `${name}: ${(percent * 100).toFixed(0)}%`
                  }
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {Object.entries(priorityCounts).map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Recommendations List */}
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {slottingRecommendations.map((rec, index) => (
              <motion.div
                key={rec.skuId}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className={`p-4 rounded-lg border-2 ${
                  rec.priority === "HIGH"
                    ? "border-red-500 bg-red-50 dark:bg-red-900/20"
                    : rec.priority === "MEDIUM"
                      ? "border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20"
                      : "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span
                        className={`px-2 py-1 rounded text-xs font-semibold ${
                          rec.priority === "HIGH"
                            ? "bg-red-500 text-white"
                            : rec.priority === "MEDIUM"
                              ? "bg-yellow-500 text-white"
                              : "bg-blue-500 text-white"
                        }`}
                      >
                        {rec.priority}
                      </span>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        SKU: {rec.skuId}
                      </span>
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                      {rec.reason}
                    </div>
                    <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                      <span>
                        <i className="ri-arrow-right-line mr-1"></i>
                        {rec.currentLocation} → {rec.recommendedLocation}
                      </span>
                    </div>
                  </div>
                  <div className="text-right ml-4">
                    <div className="text-lg font-bold text-green-600 dark:text-green-400">
                      -{rec.expectedImprovement.pickTimeReduction || 0}s
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      Time Saved
                    </div>
                    <div className="text-lg font-bold text-blue-600 dark:text-blue-400 mt-1">
                      -{rec.expectedImprovement.travelDistanceReduction || 0}m
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      Distance Saved
                    </div>
                  </div>
                </div>
                <button
                  onClick={() =>
                    warehouseOptimizationService.applySlottingRecommendation(
                      rec.skuId,
                    )
                  }
                  className="mt-3 px-3 py-1.5 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm transition-colors"
                >
                  Apply Recommendation
                </button>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Space Utilization */}
      {activeTab === "SPACE" && spaceUtilization && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg"
        >
          <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <i className="ri-stack-line text-green-500"></i>
            Space Utilization Analysis
          </h4>

          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
              <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                Total Space
              </div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {spaceUtilization.totalSpace.toLocaleString()} m³
              </div>
            </div>
            <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
              <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                Used Space
              </div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {spaceUtilization.usedSpace.toLocaleString()} m³
              </div>
            </div>
            <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
              <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                Available
              </div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {spaceUtilization.availableSpace.toLocaleString()} m³
              </div>
            </div>
          </div>

          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={spaceData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="area" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="current" fill="#3b82f6" name="Current" />
              <Bar dataKey="recommended" fill="#10b981" name="Recommended" />
            </BarChart>
          </ResponsiveContainer>

          <div className="mt-6 space-y-3">
            {spaceUtilization.recommendations.map((rec, index) => (
              <div
                key={index}
                className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg"
              >
                <div className="font-semibold text-gray-900 dark:text-white mb-1">
                  {rec.area}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                  Current: {rec.currentUtilization}% → Recommended:{" "}
                  {rec.recommendedUtilization}%
                </div>
                <div className="text-sm text-blue-600 dark:text-blue-400">
                  {rec.action}
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Labor Optimization */}
      {activeTab === "LABOR" && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg"
        >
          <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <i className="ri-user-line text-purple-500"></i>
            Labor Optimization
          </h4>
          <div className="text-center py-12 text-gray-500 dark:text-gray-400">
            Labor optimization data will be displayed here
          </div>
        </motion.div>
      )}
    </div>
  );
}
