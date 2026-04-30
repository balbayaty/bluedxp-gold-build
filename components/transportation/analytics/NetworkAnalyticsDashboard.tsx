/**
 * Network Analytics Dashboard Component
 *
 * Comprehensive analytics for network modeling and optimization
 */

"use client";

import { useState } from "react";
import {
  Network,
  TrendingUp,
  DollarSign,
  MapPin,
  Activity,
  Download,
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
  ScatterChart,
  Scatter,
  ZAxis,
} from "recharts";
import type {
  NetworkOptimizationResult,
  NetworkModel,
} from "@/lib/services/transportation";

interface NetworkAnalyticsDashboardProps {
  models: NetworkModel[];
  optimizations: NetworkOptimizationResult[];
  onDrillDown?: (modelId: string) => void;
}

export default function NetworkAnalyticsDashboard({
  models,
  optimizations,
  onDrillDown,
}: NetworkAnalyticsDashboardProps) {
  const [dateRange, setDateRange] = useState<"7D" | "30D" | "90D" | "ALL">(
    "30D",
  );

  const analytics = calculateNetworkAnalytics(models, optimizations, dateRange);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Network Analytics</h2>
          <p className="text-sm text-gray-500 mt-1">
            Comprehensive insights into network performance
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
          title="Total Models"
          value={analytics.totalModels}
          icon={Network}
          color="blue"
        />
        <MetricCard
          title="Avg Cost"
          value={`$${analytics.avgCost.toLocaleString()}`}
          icon={DollarSign}
          color="green"
        />
        <MetricCard
          title="Avg Distance"
          value={`${analytics.avgDistance.toFixed(1)} km`}
          icon={MapPin}
          color="purple"
        />
        <MetricCard
          title="Network Efficiency"
          value={`${analytics.avgEfficiency.toFixed(1)}%`}
          icon={Activity}
          color="orange"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Cost vs Distance */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-bold mb-4">Cost vs Distance</h3>
          <ResponsiveContainer width="100%" height={300}>
            <ScatterChart data={analytics.costDistanceData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis
                type="number"
                dataKey="distance"
                name="Distance"
                unit=" km"
                stroke="#6b7280"
              />
              <YAxis
                type="number"
                dataKey="cost"
                name="Cost"
                unit=" $"
                stroke="#6b7280"
              />
              <ZAxis
                type="number"
                dataKey="efficiency"
                name="Efficiency"
                unit="%"
              />
              <Tooltip cursor={{ strokeDasharray: "3 3" }} />
              <Scatter name="Networks" dataKey="cost" fill="#3b82f6" />
            </ScatterChart>
          </ResponsiveContainer>
        </div>

        {/* Efficiency Trends */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-bold mb-4">Efficiency Trends</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={analytics.efficiencyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="name" stroke="#6b7280" />
              <YAxis stroke="#6b7280" />
              <Tooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey="efficiency"
                stroke="#3b82f6"
                strokeWidth={2}
              />
              <Line
                type="monotone"
                dataKey="coverage"
                stroke="#10b981"
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Network Metrics */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-bold mb-4">Network Performance</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={analytics.performanceData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="name" stroke="#6b7280" />
            <YAxis stroke="#6b7280" />
            <Tooltip />
            <Legend />
            <Bar dataKey="cost" fill="#3b82f6" name="Cost ($)" />
            <Bar dataKey="distance" fill="#10b981" name="Distance (km)" />
            <Bar dataKey="efficiency" fill="#8b5cf6" name="Efficiency (%)" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Top Networks */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-bold mb-4">Top Performing Networks</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="text-left p-3 font-medium">Network</th>
                <th className="text-right p-3 font-medium">Cost</th>
                <th className="text-right p-3 font-medium">Distance</th>
                <th className="text-right p-3 font-medium">Efficiency</th>
                <th className="text-right p-3 font-medium">Coverage</th>
                <th className="text-center p-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {analytics.topNetworks.map((network, idx) => (
                <tr
                  key={idx}
                  className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition cursor-pointer"
                  onClick={() => onDrillDown?.(network.modelId)}
                >
                  <td className="p-3 font-medium">{network.name}</td>
                  <td className="text-right p-3">
                    ${network.cost.toLocaleString()}
                  </td>
                  <td className="text-right p-3">
                    {network.distance.toFixed(1)} km
                  </td>
                  <td className="text-right p-3">
                    {network.efficiency.toFixed(1)}%
                  </td>
                  <td className="text-right p-3">
                    {network.coverage.toFixed(1)}%
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

function calculateNetworkAnalytics(
  models: NetworkModel[],
  optimizations: NetworkOptimizationResult[],
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
  const filteredModels = models.filter((m) => {
    const created = new Date(m.createdAt);
    return now.getTime() - created.getTime() <= daysAgo * 24 * 60 * 60 * 1000;
  });

  const totalModels = filteredModels.length;
  const totalCost = optimizations.reduce(
    (sum, o) => sum + o.metrics.totalCost,
    0,
  );
  const totalDistance = optimizations.reduce(
    (sum, o) => sum + o.metrics.totalDistance,
    0,
  );
  const totalEfficiency = optimizations.reduce(
    (sum, o) => sum + o.metrics.networkEfficiency,
    0,
  );

  const avgCost =
    optimizations.length > 0 ? totalCost / optimizations.length : 0;
  const avgDistance =
    optimizations.length > 0 ? totalDistance / optimizations.length : 0;
  const avgEfficiency =
    optimizations.length > 0 ? totalEfficiency / optimizations.length : 0;

  // Cost vs Distance scatter
  const costDistanceData = optimizations.slice(0, 20).map((opt) => ({
    distance: opt.metrics.totalDistance,
    cost: opt.metrics.totalCost,
    efficiency: opt.metrics.networkEfficiency,
  }));

  // Efficiency trends
  const efficiencyData = optimizations.slice(0, 10).map((opt, idx) => ({
    name: `Network ${idx + 1}`,
    efficiency: opt.metrics.networkEfficiency,
    coverage: opt.metrics.coverage,
  }));

  // Performance data
  const performanceData = optimizations.slice(0, 10).map((opt, idx) => ({
    name: `Network ${idx + 1}`,
    cost: opt.metrics.totalCost,
    distance: opt.metrics.totalDistance,
    efficiency: opt.metrics.networkEfficiency,
  }));

  // Top networks
  const topNetworks = optimizations
    .map((opt) => ({
      modelId: opt.modelId,
      name: `Network ${opt.modelId}`,
      cost: opt.metrics.totalCost,
      distance: opt.metrics.totalDistance,
      efficiency: opt.metrics.networkEfficiency,
      coverage: opt.metrics.coverage,
    }))
    .sort((a, b) => b.efficiency - a.efficiency)
    .slice(0, 10);

  return {
    totalModels,
    avgCost,
    avgDistance,
    avgEfficiency,
    costDistanceData,
    efficiencyData,
    performanceData,
    topNetworks,
  };
}
