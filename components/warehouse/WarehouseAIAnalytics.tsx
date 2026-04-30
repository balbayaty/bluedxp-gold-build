"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { aiAnalyticsService } from "@/lib/services/wms/aiAnalyticsService";
import type {
  DemandForecast,
  InventoryOptimization,
  ABCXYZClassification,
} from "@/lib/services/wms/aiAnalyticsService";

interface WarehouseAIAnalyticsProps {
  warehouseId: string;
}

const COLORS = [
  "#06b6d4",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#ec4899",
];

export default function WarehouseAIAnalytics({
  warehouseId,
}: WarehouseAIAnalyticsProps) {
  const [loading, setLoading] = useState(true);
  const [forecasts, setForecasts] = useState<DemandForecast[]>([]);
  const [optimizations, setOptimizations] = useState<InventoryOptimization[]>(
    [],
  );
  const [classifications, setClassifications] = useState<
    ABCXYZClassification[]
  >([]);
  const [selectedPeriod, setSelectedPeriod] = useState<
    "DAILY" | "WEEKLY" | "MONTHLY" | "QUARTERLY"
  >("MONTHLY");
  const [selectedMetric, setSelectedMetric] = useState<
    "forecast" | "optimization" | "classification"
  >("forecast");

  useEffect(() => {
    loadAnalytics();
  }, [warehouseId, selectedPeriod]);

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      // Load demand forecasts for top SKUs
      const mockSKUs = ["sku-001", "sku-002", "sku-003", "sku-004", "sku-005"];
      const forecastPromises = mockSKUs.map((skuId) =>
        aiAnalyticsService.forecastDemand(skuId, selectedPeriod, {
          warehouseId,
        }),
      );
      const forecastResults = await Promise.all(forecastPromises);
      setForecasts(forecastResults);

      // Load inventory optimizations
      const optimizationPromises = mockSKUs.map((skuId) =>
        aiAnalyticsService.optimizeInventory(skuId, { warehouseId }),
      );
      const optimizationResults = await Promise.all(optimizationPromises);
      setOptimizations(optimizationResults);

      // Load ABC/XYZ classifications
      const classificationPromises = mockSKUs.map((skuId) =>
        aiAnalyticsService.classifyABCXYZ(skuId, { warehouseId }),
      );
      const classificationResults = await Promise.all(classificationPromises);
      setClassifications(classificationResults);
    } catch (error) {
      console.error("Error loading analytics:", error);
    } finally {
      setLoading(false);
    }
  };

  const forecastChartData = forecasts.map((forecast, index) => ({
    name: `SKU-${index + 1}`,
    predicted: forecast.predictedDemand,
    lower: forecast.lowerBound,
    upper: forecast.upperBound,
    confidence: forecast.confidenceLevel,
  }));

  const optimizationChartData = optimizations.map((opt, index) => ({
    name: `SKU-${index + 1}`,
    current: opt.currentStock,
    optimal: opt.optimalStock,
    savings: opt.expectedImpact.costSavings || 0,
  }));

  const classificationData = classifications.reduce(
    (acc, cls) => {
      const key = cls.combinedClass;
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );

  const pieData = Object.entries(classificationData).map(([name, value]) => ({
    name,
    value,
  }));

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <i className="ri-loader-4-line text-6xl text-cyan-400 animate-spin mb-4"></i>
          <p className="text-white text-lg">Loading AI Analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex items-center justify-between p-4 rounded-lg bg-white/5 border border-white/10">
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setSelectedMetric("forecast")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              selectedMetric === "forecast"
                ? "bg-cyan-500 text-white"
                : "bg-white/5 text-gray-400 hover:text-white"
            }`}
          >
            <i className="ri-line-chart-line mr-2"></i>
            Demand Forecast
          </button>
          <button
            onClick={() => setSelectedMetric("optimization")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              selectedMetric === "optimization"
                ? "bg-cyan-500 text-white"
                : "bg-white/5 text-gray-400 hover:text-white"
            }`}
          >
            <i className="ri-lightbulb-line mr-2"></i>
            Optimization
          </button>
          <button
            onClick={() => setSelectedMetric("classification")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              selectedMetric === "classification"
                ? "bg-cyan-500 text-white"
                : "bg-white/5 text-gray-400 hover:text-white"
            }`}
          >
            <i className="ri-bar-chart-box-line mr-2"></i>
            ABC/XYZ
          </button>
        </div>
        {selectedMetric === "forecast" && (
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value as any)}
            className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm"
          >
            <option value="DAILY">Daily</option>
            <option value="WEEKLY">Weekly</option>
            <option value="MONTHLY">Monthly</option>
            <option value="QUARTERLY">Quarterly</option>
          </select>
        )}
      </div>

      {/* Demand Forecast */}
      {selectedMetric === "forecast" && (
        <div className="space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-6 rounded-xl bg-white/5 backdrop-blur-xl border border-white/10 shadow-lg"
          >
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
              <i className="ri-line-chart-line mr-2 text-cyan-400"></i>
              Demand Forecast ({selectedPeriod})
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={forecastChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="name" stroke="#9ca3af" />
                <YAxis stroke="#9ca3af" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1f2937",
                    border: "1px solid #374151",
                    borderRadius: "8px",
                  }}
                  labelStyle={{ color: "#fff" }}
                />
                <Legend />
                <Bar
                  dataKey="predicted"
                  fill="#06b6d4"
                  name="Predicted Demand"
                />
                <Bar dataKey="lower" fill="#10b981" name="Lower Bound" />
                <Bar dataKey="upper" fill="#f59e0b" name="Upper Bound" />
              </BarChart>
            </ResponsiveContainer>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {forecasts.slice(0, 3).map((forecast, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
                className="p-4 rounded-lg bg-white/5 border border-white/10"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-[#9ca3af]">
                    SKU-{index + 1}
                  </span>
                  <span
                    className={`px-2 py-1 rounded text-xs ${
                      forecast.confidenceLevel > 80
                        ? "bg-green-500/20 text-green-400"
                        : forecast.confidenceLevel > 60
                          ? "bg-yellow-500/20 text-yellow-400"
                          : "bg-red-500/20 text-red-400"
                    }`}
                  >
                    {forecast.confidenceLevel}% confidence
                  </span>
                </div>
                <div className="text-2xl font-bold text-white mb-1">
                  {forecast.predictedDemand.toLocaleString()}
                </div>
                <div className="text-xs text-[#9ca3af]">
                  Range: {forecast.lowerBound.toLocaleString()} -{" "}
                  {forecast.upperBound.toLocaleString()}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Inventory Optimization */}
      {selectedMetric === "optimization" && (
        <div className="space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-6 rounded-xl bg-white/5 backdrop-blur-xl border border-white/10 shadow-lg"
          >
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
              <i className="ri-lightbulb-line mr-2 text-yellow-400"></i>
              Inventory Optimization Recommendations
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={optimizationChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="name" stroke="#9ca3af" />
                <YAxis stroke="#9ca3af" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1f2937",
                    border: "1px solid #374151",
                    borderRadius: "8px",
                  }}
                  labelStyle={{ color: "#fff" }}
                />
                <Legend />
                <Bar dataKey="current" fill="#ef4444" name="Current Stock" />
                <Bar dataKey="optimal" fill="#10b981" name="Optimal Stock" />
              </BarChart>
            </ResponsiveContainer>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {optimizations.map((opt, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="p-6 rounded-lg bg-white/5 border border-white/10"
              >
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-white font-semibold">SKU-{index + 1}</h4>
                  <span
                    className={`px-3 py-1 rounded text-xs font-medium ${
                      opt.recommendedAction === "INCREASE"
                        ? "bg-green-500/20 text-green-400"
                        : opt.recommendedAction === "DECREASE"
                          ? "bg-red-500/20 text-red-400"
                          : "bg-blue-500/20 text-blue-400"
                    }`}
                  >
                    {opt.recommendedAction}
                  </span>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-[#9ca3af]">Current</span>
                    <span className="text-white font-medium">
                      {opt.currentStock}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-[#9ca3af]">Optimal</span>
                    <span className="text-green-400 font-medium">
                      {opt.optimalStock}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-[#9ca3af]">Recommended</span>
                    <span className="text-cyan-400 font-medium">
                      {opt.recommendedQuantity}
                    </span>
                  </div>
                  {opt.expectedImpact.costSavings && (
                    <div className="mt-3 pt-3 border-t border-white/10">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-[#9ca3af]">
                          Potential Savings
                        </span>
                        <span className="text-green-400 font-bold">
                          ${opt.expectedImpact.costSavings.toLocaleString()}
                          /month
                        </span>
                      </div>
                    </div>
                  )}
                  <p className="text-xs text-[#9ca3af] mt-2">{opt.reason}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* ABC/XYZ Classification */}
      {selectedMetric === "classification" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-6 rounded-xl bg-white/5 backdrop-blur-xl border border-white/10 shadow-lg"
            >
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                <i className="ri-bar-chart-box-line mr-2 text-purple-400"></i>
                ABC/XYZ Classification Distribution
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={pieData}
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
                    {pieData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#1f2937",
                      border: "1px solid #374151",
                      borderRadius: "8px",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-6 rounded-xl bg-white/5 backdrop-blur-xl border border-white/10 shadow-lg"
            >
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                <i className="ri-list-check mr-2 text-cyan-400"></i>
                Classification Details
              </h3>
              <div className="space-y-3 max-h-[300px] overflow-y-auto">
                {classifications.map((cls, index) => (
                  <div
                    key={index}
                    className="p-3 rounded-lg bg-white/5 border border-white/10"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-white font-medium">
                        SKU-{index + 1}
                      </span>
                      <span
                        className={`px-2 py-1 rounded text-xs font-bold ${
                          cls.combinedClass.startsWith("A")
                            ? "bg-red-500/20 text-red-400"
                            : cls.combinedClass.startsWith("B")
                              ? "bg-yellow-500/20 text-yellow-400"
                              : "bg-blue-500/20 text-blue-400"
                        }`}
                      >
                        {cls.combinedClass}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-[#9ca3af]">ABC:</span>
                        <span className="text-white ml-1">{cls.abcClass}</span>
                      </div>
                      <div>
                        <span className="text-[#9ca3af]">XYZ:</span>
                        <span className="text-white ml-1">{cls.xyzClass}</span>
                      </div>
                    </div>
                    {cls.recommendations.length > 0 && (
                      <div className="mt-2 pt-2 border-t border-white/10">
                        <p className="text-xs text-[#9ca3af] mb-1">
                          Recommendations:
                        </p>
                        <ul className="text-xs text-white/70 space-y-1">
                          {cls.recommendations.slice(0, 2).map((rec, idx) => (
                            <li
                              key={idx}
                              className="flex items-start space-x-1"
                            >
                              <i className="ri-checkbox-circle-line text-green-400 mt-0.5"></i>
                              <span>{rec}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      )}
    </div>
  );
}
