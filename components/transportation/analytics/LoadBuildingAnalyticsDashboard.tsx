/**
 * Load Building Analytics Dashboard Component
 *
 * Comprehensive analytics for load building and optimization
 * Modern, professional, sexy UI with full drill-down capabilities
 */

"use client";

import { useState } from "react";
import {
  BarChart3,
  TrendingUp,
  Package,
  Layers,
  Target,
  Download,
  Box,
  Weight,
  Activity,
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
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from "recharts";
import type { LoadPlan } from "@/lib/services/transportation";

interface LoadBuildingAnalyticsDashboardProps {
  loadPlans: LoadPlan[];
  onDrillDown?: (loadPlanId: string) => void;
}

export default function LoadBuildingAnalyticsDashboard({
  loadPlans,
  onDrillDown,
}: LoadBuildingAnalyticsDashboardProps) {
  const [dateRange, setDateRange] = useState<"7D" | "30D" | "90D" | "ALL">(
    "30D",
  );

  const analytics = calculateLoadAnalytics(loadPlans, dateRange);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Load Building Analytics</h2>
          <p className="text-sm text-gray-500 mt-1">
            Comprehensive insights into load optimization
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
          title="Avg Weight Utilization"
          value={`${analytics.avgWeightUtilization.toFixed(1)}%`}
          icon={Weight}
          color="blue"
        />
        <MetricCard
          title="Avg Volume Utilization"
          value={`${analytics.avgVolumeUtilization.toFixed(1)}%`}
          icon={Box}
          color="green"
        />
        <MetricCard
          title="Avg Space Efficiency"
          value={`${analytics.avgSpaceEfficiency.toFixed(1)}%`}
          icon={Layers}
          color="purple"
        />
        <MetricCard
          title="Avg Stability"
          value={`${analytics.avgStability.toFixed(1)}%`}
          icon={Target}
          color="orange"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Utilization Trends */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-bold mb-4">Utilization Trends</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={analytics.utilizationData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="name" stroke="#6b7280" />
              <YAxis stroke="#6b7280" />
              <Tooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey="weight"
                stroke="#3b82f6"
                strokeWidth={2}
                name="Weight %"
              />
              <Line
                type="monotone"
                dataKey="volume"
                stroke="#10b981"
                strokeWidth={2}
                name="Volume %"
              />
              <Line
                type="monotone"
                dataKey="space"
                stroke="#8b5cf6"
                strokeWidth={2}
                name="Space %"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Algorithm Performance */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-bold mb-4">Algorithm Performance</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={analytics.algorithmData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="name" stroke="#6b7280" />
              <YAxis stroke="#6b7280" />
              <Tooltip />
              <Legend />
              <Bar dataKey="avgScore" fill="#3b82f6" name="Avg Score" />
              <Bar dataKey="avgTime" fill="#10b981" name="Avg Time (ms)" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Optimization Metrics */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-bold mb-4">Optimization Metrics</h3>
        <ResponsiveContainer width="100%" height={300}>
          <RadarChart data={analytics.optimizationMetrics}>
            <PolarGrid stroke="#e5e7eb" />
            <PolarAngleAxis dataKey="metric" stroke="#6b7280" />
            <PolarRadiusAxis angle={90} domain={[0, 100]} stroke="#6b7280" />
            <Radar
              name="Current"
              dataKey="value"
              stroke="#3b82f6"
              fill="#3b82f6"
              fillOpacity={0.6}
            />
            <Radar
              name="Target"
              dataKey="target"
              stroke="#10b981"
              fill="#10b981"
              fillOpacity={0.2}
            />
            <Tooltip />
            <Legend />
          </RadarChart>
        </ResponsiveContainer>
      </div>

      {/* Top Performers */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-bold mb-4">Top Performing Load Plans</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="text-left p-3 font-medium">Load Plan</th>
                <th className="text-right p-3 font-medium">Weight Util.</th>
                <th className="text-right p-3 font-medium">Volume Util.</th>
                <th className="text-right p-3 font-medium">Space Eff.</th>
                <th className="text-right p-3 font-medium">Stability</th>
                <th className="text-right p-3 font-medium">Score</th>
                <th className="text-center p-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {analytics.topPerformers.map((plan, idx) => (
                <tr
                  key={idx}
                  className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition cursor-pointer"
                  onClick={() => onDrillDown?.(plan.id)}
                >
                  <td className="p-3 font-medium">{plan.id}</td>
                  <td className="text-right p-3">
                    {plan.weightUtilization.toFixed(1)}%
                  </td>
                  <td className="text-right p-3">
                    {plan.volumeUtilization.toFixed(1)}%
                  </td>
                  <td className="text-right p-3">
                    {plan.spaceEfficiency.toFixed(1)}%
                  </td>
                  <td className="text-right p-3">
                    {plan.stability.toFixed(1)}%
                  </td>
                  <td className="text-right p-3 font-medium">
                    {plan.score.toFixed(1)}
                  </td>
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

function calculateLoadAnalytics(loadPlans: LoadPlan[], dateRange: string) {
  const now = new Date();
  const daysAgo =
    dateRange === "7D"
      ? 7
      : dateRange === "30D"
        ? 30
        : dateRange === "90D"
          ? 90
          : Infinity;
  const filtered = loadPlans.filter((plan) => {
    const created = new Date(plan.createdAt);
    return now.getTime() - created.getTime() <= daysAgo * 24 * 60 * 60 * 1000;
  });

  if (filtered.length === 0) {
    return {
      avgWeightUtilization: 0,
      avgVolumeUtilization: 0,
      avgSpaceEfficiency: 0,
      avgStability: 0,
      utilizationData: [],
      algorithmData: [],
      optimizationMetrics: [],
      topPerformers: [],
    };
  }

  const totalWeightUtil = filtered.reduce(
    (sum, p) => sum + p.metrics.weightUtilization,
    0,
  );
  const totalVolumeUtil = filtered.reduce(
    (sum, p) => sum + p.metrics.volumeUtilization,
    0,
  );
  const totalSpaceEff = filtered.reduce(
    (sum, p) => sum + p.metrics.spaceEfficiency,
    0,
  );
  const totalStability = filtered.reduce(
    (sum, p) => sum + p.metrics.stability,
    0,
  );

  const avgWeightUtilization = totalWeightUtil / filtered.length;
  const avgVolumeUtilization = totalVolumeUtil / filtered.length;
  const avgSpaceEfficiency = totalSpaceEff / filtered.length;
  const avgStability = totalStability / filtered.length;

  // Utilization trends
  const utilizationData = filtered.slice(0, 10).map((plan, idx) => ({
    name: `Plan ${idx + 1}`,
    weight: plan.metrics.weightUtilization,
    volume: plan.metrics.volumeUtilization,
    space: plan.metrics.spaceEfficiency,
  }));

  // Algorithm performance
  const algorithmMap = new Map<string, { scores: number[]; times: number[] }>();
  filtered.forEach((plan) => {
    const algo = plan.optimization.algorithm;
    if (!algorithmMap.has(algo)) {
      algorithmMap.set(algo, { scores: [], times: [] });
    }
    const data = algorithmMap.get(algo)!;
    data.scores.push(plan.optimization.score);
    data.times.push(plan.optimization.executionTime);
  });

  const algorithmData = Array.from(algorithmMap.entries()).map(
    ([name, data]) => ({
      name,
      avgScore: data.scores.reduce((sum, s) => sum + s, 0) / data.scores.length,
      avgTime: data.times.reduce((sum, t) => sum + t, 0) / data.times.length,
    }),
  );

  // Optimization metrics
  const optimizationMetrics = [
    { metric: "Weight Util", value: avgWeightUtilization, target: 90 },
    { metric: "Volume Util", value: avgVolumeUtilization, target: 85 },
    { metric: "Space Eff", value: avgSpaceEfficiency, target: 80 },
    { metric: "Stability", value: avgStability, target: 95 },
  ];

  // Top performers
  const topPerformers = filtered
    .map((plan) => ({
      id: plan.id,
      weightUtilization: plan.metrics.weightUtilization,
      volumeUtilization: plan.metrics.volumeUtilization,
      spaceEfficiency: plan.metrics.spaceEfficiency,
      stability: plan.metrics.stability,
      score: plan.optimization.score,
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 10);

  return {
    avgWeightUtilization,
    avgVolumeUtilization,
    avgSpaceEfficiency,
    avgStability,
    utilizationData,
    algorithmData,
    optimizationMetrics,
    topPerformers,
  };
}
