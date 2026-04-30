"use client";

import { useState, useEffect } from "react";
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
import type {
  DemandForecast,
  InventoryOptimization,
  ABCXYZClassification,
} from "@/lib/services/wms/aiAnalyticsService";
import { format } from "date-fns";

interface AIAnalyticsDashboardProps {
  skuId: string;
  skuCode: string;
}

const COLORS = [
  "#06b6d4",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#ec4899",
];

export default function AIAnalyticsDashboard({
  skuId,
  skuCode,
}: AIAnalyticsDashboardProps) {
  const [loading, setLoading] = useState(true);
  const [forecast, setForecast] = useState<DemandForecast | null>(null);
  const [optimization, setOptimization] =
    useState<InventoryOptimization | null>(null);
  const [classification, setClassification] =
    useState<ABCXYZClassification | null>(null);
  const [safetyStock, setSafetyStock] = useState<any>(null);
  const [reorderPoint, setReorderPoint] = useState<any>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<
    "DAILY" | "WEEKLY" | "MONTHLY" | "QUARTERLY"
  >("MONTHLY");
  const [applyingOptimization, setApplyingOptimization] = useState(false);

  useEffect(() => {
    loadAnalytics();
  }, [skuId, selectedPeriod]);

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/wms/sku/analytics?skuId=${skuId}&type=all`,
      );
      const result = await response.json();

      if (result.success && result.data) {
        setForecast(result.data.forecast || null);
        setOptimization(result.data.optimization || null);
        setClassification(result.data.classification || null);
        setSafetyStock(result.data.safetyStock || null);
        setReorderPoint(result.data.reorderPoint || null);
      }
    } catch (error) {
      console.error("Error loading analytics:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleApplyOptimization = async () => {
    if (!optimization) return;

    setApplyingOptimization(true);
    try {
      const response = await fetch("/api/wms/sku/analytics/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          skuId,
          optimization,
          safetyStock,
          reorderPoint,
        }),
      });

      const result = await response.json();

      if (result.success) {
        alert(
          `Optimization applied successfully!\n\nApplied:\n${result.data.appliedRecommendations.join("\n")}`,
        );
        await loadAnalytics(); // Reload to show updated values
      } else {
        alert(`Failed to apply optimization: ${result.error}`);
      }
    } catch (error) {
      console.error("Error applying optimization:", error);
      alert("Error applying optimization");
    } finally {
      setApplyingOptimization(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-600 mx-auto"></div>
          <p className="mt-4 text-gray-400">Loading AI analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">
            AI Analytics Dashboard
          </h2>
          <p className="text-gray-400">SKU: {skuCode}</p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value as any)}
            className="bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-sm text-white"
          >
            <option value="DAILY">Daily</option>
            <option value="WEEKLY">Weekly</option>
            <option value="MONTHLY">Monthly</option>
            <option value="QUARTERLY">Quarterly</option>
          </select>
          <button
            onClick={loadAnalytics}
            className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 rounded-lg text-white text-sm font-medium"
          >
            <i className="ri-refresh-line mr-1"></i>
            Refresh
          </button>
        </div>
      </div>

      {/* Demand Forecast */}
      {forecast && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">
              Demand Forecast
            </h3>
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded text-xs font-medium bg-cyan-500/20 text-cyan-400">
                {forecast.forecastPeriod}
              </span>
              <span className="px-3 py-1 rounded text-xs font-medium bg-blue-500/20 text-blue-400">
                {forecast.confidenceLevel}% Confidence
              </span>
            </div>
          </div>
          <div className="grid md:grid-cols-3 gap-4 mb-4">
            <div className="p-3 bg-white/5 rounded-lg">
              <div className="text-xs text-gray-400 mb-1">Predicted Demand</div>
              <div className="text-lg font-semibold text-cyan-400">
                {forecast.predictedDemand.toLocaleString()}
              </div>
            </div>
            <div className="p-3 bg-white/5 rounded-lg">
              <div className="text-xs text-gray-400 mb-1">Lower Bound</div>
              <div className="text-sm text-yellow-400">
                {forecast.lowerBound.toLocaleString()}
              </div>
            </div>
            <div className="p-3 bg-white/5 rounded-lg">
              <div className="text-xs text-gray-400 mb-1">Upper Bound</div>
              <div className="text-sm text-green-400">
                {forecast.upperBound.toLocaleString()}
              </div>
            </div>
          </div>
          {forecast.factors && (
            <div className="mb-4 p-3 bg-white/5 rounded-lg">
              <div className="text-xs text-gray-400 mb-2">Forecast Factors</div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                {forecast.factors.seasonality && (
                  <div>
                    <span className="text-gray-400">Seasonality:</span>
                    <span className="text-white ml-1">
                      {(forecast.factors.seasonality * 100).toFixed(0)}%
                    </span>
                  </div>
                )}
                {forecast.factors.trend && (
                  <div>
                    <span className="text-gray-400">Trend:</span>
                    <span className="text-white ml-1">
                      {(forecast.factors.trend * 100).toFixed(0)}%
                    </span>
                  </div>
                )}
                {forecast.factors.historical && (
                  <div>
                    <span className="text-gray-400">Historical:</span>
                    <span className="text-white ml-1">
                      {(forecast.factors.historical * 100).toFixed(0)}%
                    </span>
                  </div>
                )}
                {forecast.factors.promotions && (
                  <div>
                    <span className="text-gray-400">Promotions:</span>
                    <span className="text-white ml-1">
                      {(forecast.factors.promotions * 100).toFixed(0)}%
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}
        </motion.div>
      )}

      {/* Inventory Optimization */}
      {optimization && (
        <div className="grid md:grid-cols-2 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
          >
            <h3 className="text-lg font-semibold text-white mb-4">
              Inventory Optimization
            </h3>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-white/5 rounded-lg">
                  <div className="text-xs text-gray-400 mb-1">
                    Current Stock
                  </div>
                  <div className="text-lg font-semibold text-white">
                    {optimization.currentStock}
                  </div>
                </div>
                <div
                  className={`p-3 rounded-lg border ${
                    optimization.recommendedAction === "INCREASE"
                      ? "bg-green-500/20 border-green-500/30"
                      : optimization.recommendedAction === "DECREASE"
                        ? "bg-red-500/20 border-red-500/30"
                        : "bg-cyan-500/20 border-cyan-500/30"
                  }`}
                >
                  <div
                    className="text-xs mb-1"
                    style={{
                      color:
                        optimization.recommendedAction === "INCREASE"
                          ? "#4ade80"
                          : optimization.recommendedAction === "DECREASE"
                            ? "#f87171"
                            : "#06b6d4",
                    }}
                  >
                    Optimal Stock
                  </div>
                  <div
                    className="text-lg font-semibold"
                    style={{
                      color:
                        optimization.recommendedAction === "INCREASE"
                          ? "#4ade80"
                          : optimization.recommendedAction === "DECREASE"
                            ? "#f87171"
                            : "#06b6d4",
                    }}
                  >
                    {optimization.optimalStock}
                  </div>
                </div>
              </div>
              <div className="p-3 bg-white/5 rounded-lg">
                <div className="text-xs text-gray-400 mb-1">
                  Recommended Action
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`px-3 py-1 rounded text-xs font-medium ${
                      optimization.recommendedAction === "INCREASE"
                        ? "bg-green-500/20 text-green-400"
                        : optimization.recommendedAction === "DECREASE"
                          ? "bg-red-500/20 text-red-400"
                          : "bg-cyan-500/20 text-cyan-400"
                    }`}
                  >
                    {optimization.recommendedAction}
                  </span>
                  <span className="text-sm text-white">
                    Quantity: {optimization.recommendedQuantity}
                  </span>
                </div>
              </div>
              {optimization.expectedImpact && (
                <div className="grid grid-cols-3 gap-2">
                  {optimization.expectedImpact.costSavings !== undefined && (
                    <div className="p-2 bg-green-500/20 rounded-lg border border-green-500/30">
                      <div className="text-xs text-green-400 mb-1">
                        Cost Savings
                      </div>
                      <div className="text-sm font-semibold text-green-400">
                        {optimization.expectedImpact.costSavings.toLocaleString()}{" "}
                        SAR
                      </div>
                    </div>
                  )}
                  {optimization.expectedImpact.serviceLevel !== undefined && (
                    <div className="p-2 bg-blue-500/20 rounded-lg border border-blue-500/30">
                      <div className="text-xs text-blue-400 mb-1">
                        Service Level
                      </div>
                      <div className="text-sm font-semibold text-blue-400">
                        {(
                          optimization.expectedImpact.serviceLevel * 100
                        ).toFixed(1)}
                        %
                      </div>
                    </div>
                  )}
                  {optimization.expectedImpact.stockoutRisk !== undefined && (
                    <div className="p-2 bg-red-500/20 rounded-lg border border-red-500/30">
                      <div className="text-xs text-red-400 mb-1">
                        Stockout Risk
                      </div>
                      <div className="text-sm font-semibold text-red-400">
                        {(
                          optimization.expectedImpact.stockoutRisk * 100
                        ).toFixed(1)}
                        %
                      </div>
                    </div>
                  )}
                </div>
              )}
              <div className="p-3 bg-white/5 rounded-lg">
                <div className="text-xs text-gray-400 mb-1">Reason</div>
                <div className="text-sm text-gray-300">
                  {optimization.reason}
                </div>
              </div>
              <button
                onClick={handleApplyOptimization}
                disabled={applyingOptimization}
                className="w-full px-4 py-2 bg-cyan-600 hover:bg-cyan-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg text-white font-medium transition-colors"
              >
                {applyingOptimization ? (
                  <>
                    <i className="ri-loader-4-line animate-spin mr-2"></i>
                    Applying...
                  </>
                ) : (
                  <>
                    <i className="ri-check-line mr-2"></i>
                    Apply Optimization
                  </>
                )}
              </button>
            </div>
          </motion.div>

          {/* Safety Stock & Reorder Point Optimization */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 space-y-4"
          >
            {safetyStock && (
              <div>
                <h4 className="text-sm font-semibold text-white mb-3">
                  Safety Stock Optimization
                </h4>
                <div className="grid grid-cols-2 gap-2 mb-2">
                  <div className="p-2 bg-white/5 rounded-lg">
                    <div className="text-xs text-gray-400 mb-1">Current</div>
                    <div className="text-sm text-white">
                      {safetyStock.currentSafetyStock}
                    </div>
                  </div>
                  <div className="p-2 bg-cyan-500/20 rounded-lg border border-cyan-500/30">
                    <div className="text-xs text-cyan-400 mb-1">
                      Recommended
                    </div>
                    <div className="text-sm font-semibold text-cyan-400">
                      {safetyStock.recommendedSafetyStock}
                    </div>
                  </div>
                </div>
                <div className="text-xs text-gray-400">
                  Method: {safetyStock.calculationMethod}
                </div>
              </div>
            )}
            {reorderPoint && (
              <div>
                <h4 className="text-sm font-semibold text-white mb-3">
                  Reorder Point Optimization
                </h4>
                <div className="grid grid-cols-2 gap-2 mb-2">
                  <div className="p-2 bg-white/5 rounded-lg">
                    <div className="text-xs text-gray-400 mb-1">Current</div>
                    <div className="text-sm text-white">
                      {reorderPoint.currentReorderPoint}
                    </div>
                  </div>
                  <div className="p-2 bg-purple-500/20 rounded-lg border border-purple-500/30">
                    <div className="text-xs text-purple-400 mb-1">
                      Recommended
                    </div>
                    <div className="text-sm font-semibold text-purple-400">
                      {reorderPoint.recommendedReorderPoint}
                    </div>
                  </div>
                </div>
                <div className="text-xs text-gray-400">
                  Method: {reorderPoint.calculationMethod}
                </div>
              </div>
            )}
          </motion.div>
        </div>
      )}

      {/* ABC/XYZ Classification */}
      {classification && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
        >
          <h3 className="text-lg font-semibold text-white mb-4">
            ABC/XYZ Classification
          </h3>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center p-4 bg-white/5 rounded-lg">
              <div className="text-xs text-gray-400 mb-1">ABC Class</div>
              <div className="text-3xl font-bold text-cyan-400">
                {classification.abcClass}
              </div>
              <div className="text-xs text-gray-400 mt-1">
                Value: {classification.value.toLocaleString()}
              </div>
            </div>
            <div className="text-center p-4 bg-white/5 rounded-lg">
              <div className="text-xs text-gray-400 mb-1">XYZ Class</div>
              <div className="text-3xl font-bold text-purple-400">
                {classification.xyzClass}
              </div>
              <div className="text-xs text-gray-400 mt-1">
                Variability: {classification.variability.toFixed(2)}
              </div>
            </div>
            <div className="text-center p-4 bg-cyan-500/20 rounded-lg border border-cyan-500/30">
              <div className="text-xs text-cyan-400 mb-1">Combined</div>
              <div className="text-3xl font-bold text-cyan-400">
                {classification.combinedClass}
              </div>
            </div>
          </div>
          <div className="mt-4">
            <h4 className="text-sm font-semibold text-white mb-2">
              Recommendations
            </h4>
            <ul className="space-y-1">
              {classification.recommendations.map((rec, index) => (
                <li
                  key={index}
                  className="text-sm text-gray-300 flex items-start gap-2"
                >
                  <i className="ri-arrow-right-line text-cyan-400 mt-0.5"></i>
                  <span>{rec}</span>
                </li>
              ))}
            </ul>
          </div>
        </motion.div>
      )}
    </div>
  );
}
