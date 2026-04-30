/**
 * Load Design Analytics Dashboard
 *
 * Comprehensive analytics and insights for load design operations
 * Real-time metrics, trends, and predictive analytics
 */

"use client";

import { useState, useEffect } from "react";
import PageTemplate from "@/components/PageTemplate";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { loadAnalyticsService } from "@/lib/services/load-design/analytics/loadAnalyticsService";
import type {
  LoadAnalytics,
  AnalyticsFilters,
} from "@/lib/services/load-design/analytics/loadAnalyticsService";
import ExportButton from "@/components/load-design/ExportButton";

const COLORS = [
  "#3b82f6",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#06b6d4",
];

export default function LoadDesignAnalyticsPage() {
  const [analytics, setAnalytics] = useState<LoadAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<"7d" | "30d" | "90d" | "1y">(
    "30d",
  );
  const [filters, setFilters] = useState<AnalyticsFilters>({});

  useEffect(() => {
    loadAnalytics();
  }, [timeRange, filters]);

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
        case "1y":
          startDate.setFullYear(endDate.getFullYear() - 1);
          break;
      }

      // Fetch analytics from API (which now uses database)
      const response = await fetch(
        `/api/load-design/analytics?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}` +
          (filters.vehicleType ? `&vehicleType=${filters.vehicleType}` : "") +
          (filters.transportMode
            ? `&transportMode=${filters.transportMode}`
            : "") +
          (filters.carrierId ? `&carrierId=${filters.carrierId}` : ""),
      );

      if (!response.ok) {
        throw new Error("Failed to fetch analytics");
      }

      const result = await response.json();
      if (result.success) {
        setAnalytics(result.data);
      }
    } catch (error) {
      console.error("Failed to load analytics:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !analytics) {
    return (
      <PageTemplate
        title="Load Design Analytics"
        description="Comprehensive analytics and insights"
        icon="ri-bar-chart-box-line"
      >
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">
              Loading analytics...
            </p>
          </div>
        </div>
      </PageTemplate>
    );
  }

  return (
    <PageTemplate
      title="Load Design Analytics"
      description="Comprehensive analytics and insights for load optimization"
      icon="ri-bar-chart-box-line"
    >
      <div className="space-y-6">
        {/* Time Range Selector */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ExportButton
              type="analytics"
              analytics={analytics}
              filters={filters}
            />
          </div>
          <div className="flex items-center gap-2">
            {(["7d", "30d", "90d", "1y"] as const).map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  timeRange === range
                    ? "bg-blue-600 text-white shadow-lg"
                    : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                }`}
              >
                {range === "7d"
                  ? "7 Days"
                  : range === "30d"
                    ? "30 Days"
                    : range === "90d"
                      ? "90 Days"
                      : "1 Year"}
              </button>
            ))}
          </div>
        </div>

        {/* Key Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Average Utilization
              </div>
              <div
                className={`text-xs px-2 py-1 rounded ${
                  analytics.utilization.trend === "increasing"
                    ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                    : analytics.utilization.trend === "decreasing"
                      ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                      : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200"
                }`}
              >
                {analytics.utilization.trend}
              </div>
            </div>
            <div className="text-3xl font-bold text-blue-600">
              {analytics.utilization.average.toFixed(1)}%
            </div>
            <div className="text-xs text-gray-500 mt-1">
              Best: {analytics.utilization.best.toFixed(1)}% | Worst:{" "}
              {analytics.utilization.worst.toFixed(1)}%
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Total Cost
              </div>
              <div
                className={`text-xs px-2 py-1 rounded ${
                  analytics.cost.trend === "decreasing"
                    ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                    : analytics.cost.trend === "increasing"
                      ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                      : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200"
                }`}
              >
                {analytics.cost.trend}
              </div>
            </div>
            <div className="text-3xl font-bold text-green-600">
              {(analytics.cost.total / 1000).toFixed(1)}K SAR
            </div>
            <div className="text-xs text-gray-500 mt-1">
              Avg: {(analytics.cost.average / 1000).toFixed(1)}K SAR
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Compliance Score
              </div>
              <div
                className={`text-xs px-2 py-1 rounded ${
                  analytics.compliance.trend === "improving"
                    ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                    : analytics.compliance.trend === "declining"
                      ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                      : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200"
                }`}
              >
                {analytics.compliance.trend}
              </div>
            </div>
            <div className="text-3xl font-bold text-purple-600">
              {analytics.compliance.score.toFixed(1)}%
            </div>
            <div className="text-xs text-gray-500 mt-1">
              Violations: {analytics.compliance.violations.total} (
              {analytics.compliance.violations.critical} critical)
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Cost Savings
              </div>
              <div className="text-xs px-2 py-1 rounded bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                {analytics.cost.savings.percentage.toFixed(1)}%
              </div>
            </div>
            <div className="text-3xl font-bold text-orange-600">
              {(analytics.cost.savings.achieved / 1000).toFixed(1)}K SAR
            </div>
            <div className="text-xs text-gray-500 mt-1">
              Potential: {(analytics.cost.savings.potential / 1000).toFixed(1)}K
              SAR
            </div>
          </div>
        </div>

        {/* Utilization Distribution */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold mb-4">
            Utilization Distribution
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={analytics.utilization.distribution}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="range" stroke="#6b7280" />
              <YAxis stroke="#6b7280" />
              <Tooltip />
              <Bar dataKey="count" fill="#3b82f6" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Cost Breakdown */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold mb-4">Cost Breakdown</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={Object.entries(analytics.cost.breakdown).map(
                  ([name, value]) => ({
                    name: name.charAt(0).toUpperCase() + name.slice(1),
                    value,
                  }),
                )}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) =>
                  `${name}: ${(percent * 100).toFixed(0)}%`
                }
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {Object.entries(analytics.cost.breakdown).map((_, index) => (
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

        {/* Trends Over Time */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold mb-4">Trends Over Time</h3>
          <ResponsiveContainer width="100%" height={400}>
            <AreaChart data={analytics.trends.weekly}>
              <defs>
                <linearGradient
                  id="colorUtilization"
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1} />
                </linearGradient>
                <linearGradient
                  id="colorCompliance"
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0.1} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="week" stroke="#6b7280" />
              <YAxis yAxisId="left" stroke="#6b7280" />
              <YAxis yAxisId="right" orientation="right" stroke="#6b7280" />
              <Tooltip />
              <Legend />
              <Area
                yAxisId="left"
                type="monotone"
                dataKey="utilization"
                stroke="#3b82f6"
                fillOpacity={1}
                fill="url(#colorUtilization)"
                name="Utilization %"
              />
              <Area
                yAxisId="right"
                type="monotone"
                dataKey="compliance"
                stroke="#10b981"
                fillOpacity={1}
                fill="url(#colorCompliance)"
                name="Compliance %"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Carrier Performance */}
        {analytics.carriers.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold mb-4">Carrier Performance</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={analytics.carriers} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis type="number" stroke="#6b7280" />
                <YAxis
                  dataKey="name"
                  type="category"
                  stroke="#6b7280"
                  width={150}
                />
                <Tooltip />
                <Legend />
                <Bar
                  dataKey="rating"
                  fill="#3b82f6"
                  name="Rating"
                  radius={[0, 8, 8, 0]}
                />
                <Bar
                  dataKey="onTimeRate"
                  fill="#10b981"
                  name="On-Time %"
                  radius={[0, 8, 8, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* AI Predictions & Recommendations */}
        <div className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg p-6 shadow-sm border border-blue-200 dark:border-blue-800">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <i className="ri-brain-line text-blue-600"></i>
            AI Predictions & Recommendations
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4">
              <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                Next Week Utilization
              </div>
              <div className="text-2xl font-bold text-blue-600">
                {analytics.predictions.nextWeekUtilization.toFixed(1)}%
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4">
              <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                Next Week Cost
              </div>
              <div className="text-2xl font-bold text-green-600">
                {(analytics.predictions.nextWeekCost / 1000).toFixed(1)}K SAR
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4">
              <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                Next Week Compliance
              </div>
              <div className="text-2xl font-bold text-purple-600">
                {analytics.predictions.nextWeekCompliance.toFixed(1)}%
              </div>
            </div>
          </div>
          {analytics.predictions.recommendations.length > 0 && (
            <div className="space-y-2">
              <div className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Recommendations:
              </div>
              {analytics.predictions.recommendations.map((rec, index) => (
                <div
                  key={index}
                  className="flex items-start gap-2 bg-white dark:bg-gray-800 rounded-lg p-3"
                >
                  <i className="ri-lightbulb-line text-yellow-500 mt-0.5"></i>
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    {rec}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </PageTemplate>
  );
}
