/**
 * Interactive Vision Analysis Dashboard
 * Mind-blowing real-time dashboard for vision analysis
 * Non-breaking: New component
 */

"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  LineChart,
  Line,
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
} from "recharts";

interface AnalysisMetric {
  id: string;
  label: string;
  value: number | string;
  trend: "up" | "down" | "neutral";
  change?: number;
  icon: string;
  color: string;
}

interface InteractiveAnalysisDashboardProps {
  analysisData?: {
    totalAnalyses: number;
    anomaliesDetected: number;
    qualityScore: number;
    complianceRate: number;
    processingTime: number;
    successRate: number;
  };
  realTimeUpdates?: boolean;
}

export default function InteractiveAnalysisDashboard({
  analysisData,
  realTimeUpdates = true,
}: InteractiveAnalysisDashboardProps) {
  const [metrics, setMetrics] = useState<AnalysisMetric[]>([]);
  const [selectedTimeframe, setSelectedTimeframe] = useState<
    "24h" | "7d" | "30d" | "all"
  >("24h");
  const [isLive, setIsLive] = useState(true);

  // Initialize metrics
  useEffect(() => {
    if (analysisData) {
      setMetrics([
        {
          id: "total",
          label: "Total Analyses",
          value: analysisData.totalAnalyses,
          trend: "up",
          change: 12,
          icon: "ri-eye-line",
          color: "cyan",
        },
        {
          id: "anomalies",
          label: "Anomalies Detected",
          value: analysisData.anomaliesDetected,
          trend: "down",
          change: -5,
          icon: "ri-alert-line",
          color: "red",
        },
        {
          id: "quality",
          label: "Quality Score",
          value: `${analysisData.qualityScore}%`,
          trend: "up",
          change: 3,
          icon: "ri-star-line",
          color: "yellow",
        },
        {
          id: "compliance",
          label: "Compliance Rate",
          value: `${analysisData.complianceRate}%`,
          trend: "up",
          change: 2,
          icon: "ri-shield-check-line",
          color: "green",
        },
      ]);
    }
  }, [analysisData]);

  // Mock chart data
  const trendData = [
    { time: "00:00", analyses: 12, anomalies: 2 },
    { time: "04:00", analyses: 18, anomalies: 3 },
    { time: "08:00", analyses: 25, anomalies: 1 },
    { time: "12:00", analyses: 32, anomalies: 4 },
    { time: "16:00", analyses: 28, anomalies: 2 },
    { time: "20:00", analyses: 22, anomalies: 1 },
  ];

  const moduleData = [
    { name: "WMS", value: 45, color: "#06b6d4" },
    { name: "QHSE", value: 25, color: "#10b981" },
    { name: "ISO-IMS", value: 15, color: "#f59e0b" },
    { name: "TMS", value: 15, color: "#8b5cf6" },
  ];

  return (
    <div className="space-y-6">
      {/* Header with Live Indicator */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-2xl font-bold text-white">
            Vision Analysis Dashboard
          </h2>
          {isLive && (
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ repeat: Infinity, duration: 2 }}
              className="flex items-center gap-2 px-3 py-1 bg-red-500/20 border border-red-500/50 rounded-full"
            >
              <div className="w-2 h-2 bg-red-500 rounded-full"></div>
              <span className="text-red-400 text-sm font-medium">LIVE</span>
            </motion.div>
          )}
        </div>
        <div className="flex items-center gap-2">
          {(["24h", "7d", "30d", "all"] as const).map((timeframe) => (
            <button
              key={timeframe}
              onClick={() => setSelectedTimeframe(timeframe)}
              className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                selectedTimeframe === timeframe
                  ? "bg-cyan-500 text-white"
                  : "bg-white/5 text-white/60 hover:text-white hover:bg-white/10"
              }`}
            >
              {timeframe}
            </button>
          ))}
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <AnimatePresence>
          {metrics.map((metric, index) => (
            <motion.div
              key={metric.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-gradient-to-br from-white/5 to-white/0 border border-white/10 rounded-xl p-6 backdrop-blur-xl hover:border-cyan-500/50 transition-all group"
            >
              <div className="flex items-start justify-between mb-4">
                <div className={`p-3 rounded-lg bg-${metric.color}-500/20`}>
                  <i
                    className={`ri-${metric.icon} text-2xl text-${metric.color}-400`}
                  ></i>
                </div>
                {metric.change && (
                  <div
                    className={`flex items-center gap-1 text-sm ${
                      metric.trend === "up"
                        ? "text-green-400"
                        : metric.trend === "down"
                          ? "text-red-400"
                          : "text-gray-400"
                    }`}
                  >
                    <i
                      className={`ri-arrow-${metric.trend === "up" ? "up" : "down"}-line`}
                    ></i>
                    {Math.abs(metric.change)}%
                  </div>
                )}
              </div>
              <div className="space-y-1">
                <p className="text-white/60 text-sm">{metric.label}</p>
                <p className="text-3xl font-bold text-white">{metric.value}</p>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Trend Chart */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-6"
        >
          <h3 className="text-lg font-semibold text-white mb-4">
            Analysis Trends
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="time" stroke="#9ca3af" fontSize={12} />
              <YAxis stroke="#9ca3af" fontSize={12} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#1f2937",
                  border: "1px solid #374151",
                  borderRadius: "8px",
                }}
                labelStyle={{ color: "#fff" }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="analyses"
                stroke="#06b6d4"
                strokeWidth={2}
                dot={{ fill: "#06b6d4", r: 4 }}
                name="Analyses"
              />
              <Line
                type="monotone"
                dataKey="anomalies"
                stroke="#ef4444"
                strokeWidth={2}
                dot={{ fill: "#ef4444", r: 4 }}
                name="Anomalies"
              />
            </LineChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Module Distribution */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-6"
        >
          <h3 className="text-lg font-semibold text-white mb-4">By Module</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={moduleData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) =>
                  `${name} ${(percent * 100).toFixed(0)}%`
                }
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {moduleData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      {/* Recent Analyses */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-6"
      >
        <h3 className="text-lg font-semibold text-white mb-4">
          Recent Analyses
        </h3>
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((item, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 + index * 0.05 }}
              className="flex items-center justify-between p-4 bg-white/5 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
                  <i className="ri-eye-line text-white text-xl"></i>
                </div>
                <div>
                  <p className="text-white font-medium">
                    Damage Analysis #{1000 + index}
                  </p>
                  <p className="text-white/60 text-sm">WMS • 2 minutes ago</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <span className="px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-xs font-medium">
                  Success
                </span>
                <i className="ri-arrow-right-s-line text-white/40"></i>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
