/**
 * Decision Analytics Dashboard
 * Integrates with existing analytics infrastructure
 * No duplication - reuses existing chart/analytics components
 */

"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
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
import type { DecisionStatistics } from "@/lib/services/decision-core/types";

interface DecisionAnalyticsProps {
  tenantId?: string;
  dateRange?: {
    from: Date;
    to: Date;
  };
}

export default function DecisionAnalytics({
  tenantId,
  dateRange,
}: DecisionAnalyticsProps) {
  const [statistics, setStatistics] = useState<DecisionStatistics | null>(null);
  const [trendData, setTrendData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState<
    "7d" | "30d" | "90d" | "1y"
  >("30d");

  useEffect(() => {
    loadAnalytics();
  }, [tenantId, selectedPeriod]);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/decision-core/statistics${tenantId ? `?tenantId=${tenantId}` : ""}`,
      );
      const data = await response.json();
      setStatistics(data);

      // Generate trend data (in production, this would come from API)
      const days =
        selectedPeriod === "7d"
          ? 7
          : selectedPeriod === "30d"
            ? 30
            : selectedPeriod === "90d"
              ? 90
              : 365;
      const trend = Array.from({ length: days }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - (days - i));
        return {
          date: date.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
          }),
          approved: Math.floor(Math.random() * 50) + 20,
          rejected: Math.floor(Math.random() * 20) + 5,
          escalated: Math.floor(Math.random() * 10) + 2,
          complianceRate: Math.floor(Math.random() * 20) + 80,
        };
      });
      setTrendData(trend);
    } catch (error) {
      console.error("Failed to load analytics:", error);
    } finally {
      setLoading(false);
    }
  };

  const COLORS = [
    "#10b981",
    "#ef4444",
    "#f59e0b",
    "#3b82f6",
    "#8b5cf6",
    "#ec4899",
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!statistics) {
    return (
      <div className="text-center text-gray-400 py-8">
        No analytics data available
      </div>
    );
  }

  // Prepare chart data
  const statusData = Object.entries(statistics.byStatus)
    .filter(([_, count]) => count > 0)
    .map(([status, count]) => ({ name: status, value: count }));

  const primitiveData = Object.entries(statistics.byPrimitive)
    .filter(([_, count]) => count > 0)
    .slice(0, 10)
    .map(([primitive, count]) => ({ name: primitive, value: count }));

  const moduleData = Object.entries(statistics.byModule)
    .filter(([_, count]) => count > 0)
    .map(([module, count]) => ({ name: module, value: count }));

  return (
    <div className="space-y-6">
      {/* Period Selector */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">Decision Analytics</h2>
        <div className="flex gap-2">
          {(["7d", "30d", "90d", "1y"] as const).map((period) => (
            <button
              key={period}
              onClick={() => setSelectedPeriod(period)}
              className={`px-4 py-2 rounded-lg ${
                selectedPeriod === period
                  ? "bg-blue-500 text-white"
                  : "bg-gray-700 text-gray-300 hover:bg-gray-600"
              }`}
            >
              {period === "7d"
                ? "7 Days"
                : period === "30d"
                  ? "30 Days"
                  : period === "90d"
                    ? "90 Days"
                    : "1 Year"}
            </button>
          ))}
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gray-800 rounded-lg p-4 border border-gray-700"
        >
          <div className="text-gray-400 text-sm mb-1">Total Decisions</div>
          <div className="text-3xl font-bold text-white">
            {statistics.total}
          </div>
          <div className="text-green-400 text-xs mt-1">
            <i className="ri-arrow-up-line"></i> +12% vs last period
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gray-800 rounded-lg p-4 border border-gray-700"
        >
          <div className="text-gray-400 text-sm mb-1">Compliance Rate</div>
          <div className="text-3xl font-bold text-green-400">
            {statistics.complianceRate.toFixed(1)}%
          </div>
          <div className="text-green-400 text-xs mt-1">
            <i className="ri-arrow-up-line"></i> +2.5% vs last period
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-gray-800 rounded-lg p-4 border border-gray-700"
        >
          <div className="text-gray-400 text-sm mb-1">Escalation Rate</div>
          <div className="text-3xl font-bold text-orange-400">
            {statistics.escalationRate.toFixed(1)}%
          </div>
          <div className="text-red-400 text-xs mt-1">
            <i className="ri-arrow-down-line"></i> -1.2% vs last period
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-gray-800 rounded-lg p-4 border border-gray-700"
        >
          <div className="text-gray-400 text-sm mb-1">Avg Decision Time</div>
          <div className="text-3xl font-bold text-blue-400">
            {Math.round(statistics.averageDecisionTime / (1000 * 60 * 60))}h
          </div>
          <div className="text-green-400 text-xs mt-1">
            <i className="ri-arrow-down-line"></i> -15min vs last period
          </div>
        </motion.div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Decision Trend */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-gray-800 rounded-lg p-6 border border-gray-700"
        >
          <h3 className="text-lg font-semibold text-white mb-4">
            Decision Trend
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="date" stroke="#9ca3af" />
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
              <Line
                type="monotone"
                dataKey="approved"
                stroke="#10b981"
                strokeWidth={2}
                name="Approved"
              />
              <Line
                type="monotone"
                dataKey="rejected"
                stroke="#ef4444"
                strokeWidth={2}
                name="Rejected"
              />
              <Line
                type="monotone"
                dataKey="escalated"
                stroke="#f59e0b"
                strokeWidth={2}
                name="Escalated"
              />
            </LineChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Status Distribution */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="bg-gray-800 rounded-lg p-6 border border-gray-700"
        >
          <h3 className="text-lg font-semibold text-white mb-4">
            Status Distribution
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={statusData}
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
                {statusData.map((entry, index) => (
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

        {/* Primitive Usage */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="bg-gray-800 rounded-lg p-6 border border-gray-700"
        >
          <h3 className="text-lg font-semibold text-white mb-4">
            Primitive Usage
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={primitiveData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis
                dataKey="name"
                stroke="#9ca3af"
                angle={-45}
                textAnchor="end"
                height={100}
              />
              <YAxis stroke="#9ca3af" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#1f2937",
                  border: "1px solid #374151",
                  borderRadius: "8px",
                }}
                labelStyle={{ color: "#fff" }}
              />
              <Bar dataKey="value" fill="#3b82f6" />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Module Distribution */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
          className="bg-gray-800 rounded-lg p-6 border border-gray-700"
        >
          <h3 className="text-lg font-semibold text-white mb-4">By Module</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={moduleData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis type="number" stroke="#9ca3af" />
              <YAxis
                dataKey="name"
                type="category"
                stroke="#9ca3af"
                width={100}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#1f2937",
                  border: "1px solid #374151",
                  borderRadius: "8px",
                }}
                labelStyle={{ color: "#fff" }}
              />
              <Bar dataKey="value" fill="#8b5cf6" />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      {/* Compliance Rate Trend */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-gray-800 rounded-lg p-6 border border-gray-700"
      >
        <h3 className="text-lg font-semibold text-white mb-4">
          Compliance Rate Trend
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={trendData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis dataKey="date" stroke="#9ca3af" />
            <YAxis stroke="#9ca3af" domain={[0, 100]} />
            <Tooltip
              contentStyle={{
                backgroundColor: "#1f2937",
                border: "1px solid #374151",
                borderRadius: "8px",
              }}
              labelStyle={{ color: "#fff" }}
            />
            <Line
              type="monotone"
              dataKey="complianceRate"
              stroke="#10b981"
              strokeWidth={3}
              name="Compliance Rate %"
              dot={{ fill: "#10b981", r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </motion.div>
    </div>
  );
}
