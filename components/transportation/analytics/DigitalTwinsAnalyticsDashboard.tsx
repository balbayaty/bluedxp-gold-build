/**
 * Digital Twins Analytics Dashboard Component
 *
 * Comprehensive analytics for digital twins and predictive maintenance
 */

"use client";

import { useState } from "react";
import {
  Cpu,
  Activity,
  AlertTriangle,
  TrendingUp,
  Download,
  CheckCircle,
} from "lucide-react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts";
import type { DigitalTwin } from "@/lib/services/transportation";

interface DigitalTwinsAnalyticsDashboardProps {
  twins: DigitalTwin[];
  onDrillDown?: (twinId: string) => void;
}

export default function DigitalTwinsAnalyticsDashboard({
  twins,
  onDrillDown,
}: DigitalTwinsAnalyticsDashboardProps) {
  const [dateRange, setDateRange] = useState<"7D" | "30D" | "90D" | "ALL">(
    "30D",
  );

  const analytics = calculateDigitalTwinsAnalytics(twins, dateRange);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Digital Twins Analytics</h2>
          <p className="text-sm text-gray-500 mt-1">
            Comprehensive insights into twin health and predictions
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
            {["7D", "30D", "90D", "ALL"].map((range) => (
              <button
                key={range}
                onClick={() => setDateRange(range as any)}
                className={`px-3 py-1.5 rounded text-sm font-medium transition ${
                  dateRange === range
                    ? "bg-blue-500 text-white"
                    : "text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600"
                }`}
              >
                {range}
              </button>
            ))}
          </div>
          <button className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition flex items-center gap-2">
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Total Twins"
          value={analytics.totalTwins}
          icon={Cpu}
          color="blue"
        />
        <MetricCard
          title="Avg Health Score"
          value={`${analytics.avgHealthScore.toFixed(1)}%`}
          icon={Activity}
          color="green"
        />
        <MetricCard
          title="Active Predictions"
          value={analytics.activePredictions}
          icon={AlertTriangle}
          color="orange"
        />
        <MetricCard
          title="Healthy Rate"
          value={`${analytics.healthyRate.toFixed(1)}%`}
          icon={CheckCircle}
          color="purple"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Health Trends */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-bold mb-4">Health Score Trends</h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={analytics.healthTrends}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="name" stroke="#6b7280" />
              <YAxis stroke="#6b7280" />
              <Tooltip />
              <Area
                type="monotone"
                dataKey="score"
                stroke="#3b82f6"
                fill="#3b82f6"
                fillOpacity={0.2}
              />
              <Area
                type="monotone"
                dataKey="avg"
                stroke="#10b981"
                fill="#10b981"
                fillOpacity={0.1}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Health Distribution */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-bold mb-4">Health Status Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={analytics.healthDistribution}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="name" stroke="#6b7280" />
              <YAxis stroke="#6b7280" />
              <Tooltip />
              <Bar dataKey="value" fill="#3b82f6" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Predictions Analysis */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-bold mb-4">Predictions Analysis</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={analytics.predictionsData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="name" stroke="#6b7280" />
            <YAxis stroke="#6b7280" />
            <Tooltip />
            <Legend />
            <Line
              type="monotone"
              dataKey="maintenance"
              stroke="#f59e0b"
              strokeWidth={2}
              name="Maintenance"
            />
            <Line
              type="monotone"
              dataKey="failure"
              stroke="#ef4444"
              strokeWidth={2}
              name="Failure"
            />
            <Line
              type="monotone"
              dataKey="optimization"
              stroke="#10b981"
              strokeWidth={2}
              name="Optimization"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Top Twins */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-bold mb-4">Digital Twins Overview</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="text-left p-3 font-medium">Twin</th>
                <th className="text-left p-3 font-medium">Type</th>
                <th className="text-right p-3 font-medium">Health Score</th>
                <th className="text-right p-3 font-medium">Status</th>
                <th className="text-right p-3 font-medium">Predictions</th>
                <th className="text-center p-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {analytics.topTwins.map((twin, idx) => (
                <tr
                  key={idx}
                  className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition cursor-pointer"
                  onClick={() => onDrillDown?.(twin.id)}
                >
                  <td className="p-3 font-medium">{twin.name}</td>
                  <td className="p-3">{twin.type}</td>
                  <td className="text-right p-3">
                    {twin.healthScore.toFixed(1)}%
                  </td>
                  <td className="text-right p-3">
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium ${
                        twin.status === "HEALTHY"
                          ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
                          : twin.status === "DEGRADED"
                            ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300"
                            : "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300"
                      }`}
                    >
                      {twin.status}
                    </span>
                  </td>
                  <td className="text-right p-3">{twin.predictions}</td>
                  <td className="text-center p-3">
                    <button className="text-blue-500 hover:text-blue-600 transition">
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function MetricCard({ title, value, icon: Icon, color }: any) {
  const colorClasses = {
    blue: "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400",
    green:
      "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-600 dark:text-green-400",
    purple:
      "bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800 text-purple-600 dark:text-purple-400",
    orange:
      "bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800 text-orange-600 dark:text-orange-400",
  };

  return (
    <div
      className={`rounded-lg p-4 border ${colorClasses[color as keyof typeof colorClasses]}`}
    >
      <div className="flex items-center gap-2 mb-2">
        <Icon className="w-4 h-4" />
        <span className="text-sm font-medium">{title}</span>
      </div>
      <div className="text-2xl font-bold">{value}</div>
    </div>
  );
}

function calculateDigitalTwinsAnalytics(
  twins: DigitalTwin[],
  dateRange: string,
) {
  const now = new Date();
  const daysAgo =
    dateRange === "7D"
      ? 7
      : dateRange === "30D"
        ? 30
        : dateRange === "90D"
          ? 90
          : Infinity;
  const filtered = twins.filter((twin) => {
    const created = new Date(twin.createdAt);
    return now.getTime() - created.getTime() <= daysAgo * 24 * 60 * 60 * 1000;
  });

  if (filtered.length === 0) {
    return {
      totalTwins: 0,
      avgHealthScore: 0,
      activePredictions: 0,
      healthyRate: 0,
      healthTrends: [],
      healthDistribution: [],
      predictionsData: [],
      topTwins: [],
    };
  }

  const totalTwins = filtered.length;
  const totalHealthScore = filtered.reduce((sum, t) => sum + t.health.score, 0);
  const avgHealthScore = totalHealthScore / totalTwins;
  const activePredictions = filtered.reduce(
    (sum, t) => sum + t.predictions.length,
    0,
  );
  const healthyCount = filtered.filter(
    (t) => t.health.overall === "HEALTHY",
  ).length;
  const healthyRate = (healthyCount / totalTwins) * 100;

  // Health trends
  const healthTrends = filtered.slice(0, 10).map((twin, idx) => ({
    name: `Twin ${idx + 1}`,
    score: twin.health.score,
    avg: avgHealthScore,
  }));

  // Health distribution
  const healthCounts = { HEALTHY: 0, DEGRADED: 0, CRITICAL: 0, FAILED: 0 };
  filtered.forEach((twin) => {
    const status = twin.health.overall;
    if (status in healthCounts) {
      healthCounts[status as keyof typeof healthCounts]++;
    }
  });

  const healthDistribution = Object.entries(healthCounts)
    .filter(([_, count]) => count > 0)
    .map(([name, value]) => ({ name, value }));

  // Predictions data
  const predictionsData = filtered.slice(0, 10).map((twin, idx) => ({
    name: `Twin ${idx + 1}`,
    maintenance: twin.predictions.filter((p) => p.type === "MAINTENANCE")
      .length,
    failure: twin.predictions.filter((p) => p.type === "FAILURE").length,
    optimization: twin.predictions.filter((p) => p.type === "OPTIMIZATION")
      .length,
  }));

  // Top twins
  const topTwins = filtered
    .map((twin) => ({
      id: twin.id,
      name: twin.name,
      type: twin.entityType,
      healthScore: twin.health.score,
      status: twin.health.overall,
      predictions: twin.predictions.length,
    }))
    .sort((a, b) => b.healthScore - a.healthScore)
    .slice(0, 10);

  return {
    totalTwins,
    avgHealthScore,
    activePredictions,
    healthyRate,
    healthTrends,
    healthDistribution,
    predictionsData,
    topTwins,
  };
}
