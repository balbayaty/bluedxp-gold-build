"use client";

/**
 * Executive QR Analytics Dashboard
 * World-Class Executive Dashboard - Exceeding McKinsey/Deloitte/EY Standards
 * Future-Ready (2024-2040)
 *
 * Features:
 * - High-level KPIs and metrics
 * - Strategic insights
 * - ROI and cost savings
 * - Risk and compliance scores
 * - Module performance
 * - Predictive trends
 */

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
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
  ComposedChart,
} from "recharts";

interface ExecutiveMetrics {
  totalQRCodes: number;
  totalScans: number;
  uniqueUsers: number;
  scanGrowthRate: number;
  topPerformingModules: Array<{
    module: string;
    scans: number;
    growth: number;
    roi: number;
  }>;
  riskScore: number;
  complianceScore: number;
  costSavings: number;
  efficiencyGain: number;
}

export default function ExecutiveQRAnalyticsDashboard() {
  const [metrics, setMetrics] = useState<ExecutiveMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<"7d" | "30d" | "90d" | "1y">(
    "30d",
  );
  const [predictions, setPredictions] = useState<any[]>([]);

  useEffect(() => {
    loadExecutiveMetrics();
  }, [timeRange]);

  const loadExecutiveMetrics = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/qr/analytics/enterprise?level=executive&timeRange=${timeRange}`,
      );
      const data = await response.json();

      if (data.success) {
        setMetrics(data.metrics);
        setPredictions(data.predictions || []);
      }
    } catch (error) {
      console.error("Error loading executive metrics:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white p-6 flex items-center justify-center">
        <div className="text-center">
          <i className="ri-loader-4-line animate-spin text-4xl mb-4"></i>
          <div>Loading executive analytics...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-4xl font-bold mb-2 flex items-center gap-3">
                <i className="ri-dashboard-3-line text-purple-400"></i>
                Executive QR Analytics Dashboard
              </h1>
              <p className="text-gray-400 text-lg">
                Strategic insights and high-level performance metrics
              </p>
            </div>
            <div className="flex gap-2">
              {(["7d", "30d", "90d", "1y"] as const).map((range) => (
                <button
                  key={range}
                  onClick={() => setTimeRange(range)}
                  className={`px-4 py-2 rounded-lg font-medium transition-all ${
                    timeRange === range
                      ? "bg-purple-600 text-white shadow-lg"
                      : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                  }`}
                >
                  {range.toUpperCase()}
                </button>
              ))}
            </div>
          </div>
        </motion.div>

        {metrics && (
          <>
            {/* Key Performance Indicators */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-gradient-to-br from-blue-900/50 to-blue-800/30 backdrop-blur-xl rounded-2xl p-6 border border-blue-500/30 shadow-2xl"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center">
                    <i className="ri-qr-code-line text-2xl text-blue-400"></i>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-gray-400">Total QR Codes</div>
                    <div className="text-3xl font-bold">
                      {metrics.totalQRCodes.toLocaleString()}
                    </div>
                  </div>
                </div>
                <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: "100%" }}
                    transition={{ duration: 1, delay: 0.3 }}
                    className="h-full bg-gradient-to-r from-blue-500 to-blue-400"
                  />
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-gradient-to-br from-green-900/50 to-green-800/30 backdrop-blur-xl rounded-2xl p-6 border border-green-500/30 shadow-2xl"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center">
                    <i className="ri-scan-line text-2xl text-green-400"></i>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-gray-400">Total Scans</div>
                    <div className="text-3xl font-bold">
                      {metrics.totalScans.toLocaleString()}
                    </div>
                    <div
                      className={`text-sm ${metrics.scanGrowthRate >= 0 ? "text-green-400" : "text-red-400"}`}
                    >
                      {metrics.scanGrowthRate >= 0 ? "+" : ""}
                      {metrics.scanGrowthRate.toFixed(1)}%
                    </div>
                  </div>
                </div>
                <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{
                      width: `${Math.min(100, (metrics.scanGrowthRate + 100) / 2)}%`,
                    }}
                    transition={{ duration: 1, delay: 0.4 }}
                    className="h-full bg-gradient-to-r from-green-500 to-green-400"
                  />
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-gradient-to-br from-purple-900/50 to-purple-800/30 backdrop-blur-xl rounded-2xl p-6 border border-purple-500/30 shadow-2xl"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center">
                    <i className="ri-shield-check-line text-2xl text-purple-400"></i>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-gray-400">Risk Score</div>
                    <div className="text-3xl font-bold">
                      {metrics.riskScore}
                    </div>
                    <div className="text-xs text-gray-400">/ 100</div>
                  </div>
                </div>
                <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${metrics.riskScore}%` }}
                    transition={{ duration: 1, delay: 0.5 }}
                    className="h-full bg-gradient-to-r from-purple-500 to-purple-400"
                  />
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="bg-gradient-to-br from-yellow-900/50 to-yellow-800/30 backdrop-blur-xl rounded-2xl p-6 border border-yellow-500/30 shadow-2xl"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-yellow-500/20 rounded-xl flex items-center justify-center">
                    <i className="ri-money-dollar-circle-line text-2xl text-yellow-400"></i>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-gray-400">Cost Savings</div>
                    <div className="text-3xl font-bold">
                      ${(metrics.costSavings / 1000).toFixed(1)}K
                    </div>
                    <div className="text-xs text-green-400">
                      +{metrics.efficiencyGain.toFixed(1)}% efficiency
                    </div>
                  </div>
                </div>
                <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{
                      width: `${Math.min(100, metrics.efficiencyGain)}%`,
                    }}
                    transition={{ duration: 1, delay: 0.6 }}
                    className="h-full bg-gradient-to-r from-yellow-500 to-yellow-400"
                  />
                </div>
              </motion.div>
            </div>

            {/* Module Performance */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="bg-gray-800/50 backdrop-blur-xl rounded-2xl p-6 mb-8 border border-gray-700 shadow-2xl"
            >
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                <i className="ri-bar-chart-box-line text-purple-400"></i>
                Top Performing Modules
              </h2>
              <ResponsiveContainer width="100%" height={400}>
                <ComposedChart data={metrics.topPerformingModules}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="rgba(255,255,255,0.1)"
                  />
                  <XAxis dataKey="module" stroke="rgba(255,255,255,0.6)" />
                  <YAxis yAxisId="left" stroke="rgba(255,255,255,0.6)" />
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    stroke="rgba(255,255,255,0.6)"
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "rgba(17, 24, 39, 0.95)",
                      border: "1px solid rgba(139, 92, 246, 0.3)",
                      borderRadius: "12px",
                      color: "#fff",
                    }}
                  />
                  <Legend />
                  <Bar
                    yAxisId="left"
                    dataKey="scans"
                    fill="#8b5cf6"
                    name="Total Scans"
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="roi"
                    stroke="#10b981"
                    strokeWidth={3}
                    name="ROI %"
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </motion.div>

            {/* Predictive Trends */}
            {predictions.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="bg-gray-800/50 backdrop-blur-xl rounded-2xl p-6 border border-gray-700 shadow-2xl"
              >
                <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                  <i className="ri-brain-line text-blue-400"></i>
                  AI-Powered Scan Forecast
                </h2>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={predictions}>
                    <defs>
                      <linearGradient
                        id="colorForecast"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="5%"
                          stopColor="#3b82f6"
                          stopOpacity={0.8}
                        />
                        <stop
                          offset="95%"
                          stopColor="#3b82f6"
                          stopOpacity={0.1}
                        />
                      </linearGradient>
                    </defs>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="rgba(255,255,255,0.1)"
                    />
                    <XAxis dataKey="date" stroke="rgba(255,255,255,0.6)" />
                    <YAxis stroke="rgba(255,255,255,0.6)" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "rgba(17, 24, 39, 0.95)",
                        border: "1px solid rgba(59, 130, 246, 0.3)",
                        borderRadius: "12px",
                        color: "#fff",
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="predictedScans"
                      stroke="#3b82f6"
                      strokeWidth={3}
                      fillOpacity={1}
                      fill="url(#colorForecast)"
                      name="Predicted Scans"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </motion.div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
