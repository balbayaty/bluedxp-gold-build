/**
 * Geofence Enterprise Analytics Dashboard
 *
 * McKinsey, SAP, Oracle-grade analytics dashboard featuring:
 * - Real-time KPIs & metrics
 * - Predictive analytics
 * - Zone performance visualization
 * - Event analytics
 * - Trend analysis
 * - AI-powered insights
 * - Export capabilities
 */

"use client";

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
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import type {
  GeofenceAnalytics,
  ZonePerformanceMetrics,
} from "@/lib/services/geofence/analytics/geofenceAnalyticsService";

interface GeofenceAnalyticsDashboardProps {
  tenantId?: string;
  period?: { start: Date; end: Date };
}

const COLORS = [
  "#3b82f6",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#ec4899",
  "#f97316",
  "#06b6d4",
];

export default function GeofenceAnalyticsDashboard({
  tenantId = "default",
  period,
}: GeofenceAnalyticsDashboardProps) {
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState<GeofenceAnalytics | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedZone, setSelectedZone] = useState<string | null>(null);

  const defaultPeriod = {
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
    end: new Date(),
  };
  const analyticsPeriod = period || defaultPeriod;

  useEffect(() => {
    loadAnalytics();
  }, [tenantId, analyticsPeriod]);

  const loadAnalytics = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(
        `/api/geofence/analytics?tenantId=${encodeURIComponent(tenantId)}&start=${analyticsPeriod.start.toISOString()}&end=${analyticsPeriod.end.toISOString()}`,
      );
      if (!response.ok) throw new Error("Failed to load analytics");
      const data = await response.json();
      if (data.success) {
        setAnalytics(data.data);
      } else {
        throw new Error(data.error || "Failed to load analytics");
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load analytics");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-500">Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
        <p className="text-red-700 dark:text-red-300">{error}</p>
        <button
          onClick={loadAnalytics}
          className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-500 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="text-center py-12 text-gray-500">
        <p>No analytics data available</p>
        <p className="text-sm mt-2">
          Create zones and generate events to see analytics
        </p>
      </div>
    );
  }

  const selectedZoneMetrics = selectedZone
    ? analytics.zoneMetrics.find((zm) => zm.zoneId === selectedZone)
    : null;

  // Prepare chart data
  const zonePerformanceData = analytics.zoneMetrics.map((zm) => ({
    name: zm.zoneName.substring(0, 15),
    efficiency: zm.efficiencyScore,
    onTime: zm.onTimeRate,
    violations: zm.dwellTimeViolations,
  }));

  const eventTypeData = Object.entries(
    analytics.eventAnalytics.eventsByType,
  ).map(([type, count]) => ({
    name: type.replace(/_/g, " "),
    value: count,
  }));

  const dwellTimeTrendData = selectedZoneMetrics
    ? selectedZoneMetrics.trends.dwellTime.map((t) => ({
        period: t.period,
        value: t.value,
        change: t.change || 0,
      }))
    : [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Geofence Analytics
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {analyticsPeriod.start.toLocaleDateString()} -{" "}
            {analyticsPeriod.end.toLocaleDateString()}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => {
              const csv = generateCSV(analytics);
              downloadCSV(csv, `geofence-analytics-${Date.now()}.csv`);
            }}
            className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors text-sm"
          >
            Export CSV
          </button>
          <button
            onClick={loadAnalytics}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition-colors text-sm"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Summary KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700"
        >
          <div className="text-sm font-medium text-gray-500 dark:text-gray-400">
            Total Zones
          </div>
          <div className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
            {analytics.summary.totalZones}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {analytics.summary.activeZones} active
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700"
        >
          <div className="text-sm font-medium text-gray-500 dark:text-gray-400">
            Total Events
          </div>
          <div className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
            {analytics.summary.totalEvents}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {analytics.eventAnalytics.anomalies} anomalies
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700"
        >
          <div className="text-sm font-medium text-gray-500 dark:text-gray-400">
            Avg Dwell Time
          </div>
          <div className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
            {analytics.summary.averageDwellTime.toFixed(1)}m
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            per zone entry
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700"
        >
          <div className="text-sm font-medium text-gray-500 dark:text-gray-400">
            Efficiency Score
          </div>
          <div className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
            {analytics.summary.efficiencyScore.toFixed(1)}%
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Compliance: {analytics.summary.complianceScore.toFixed(1)}%
          </div>
        </motion.div>
      </div>

      {/* Insights */}
      {analytics.insights.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            AI Insights
          </h3>
          <div className="space-y-3">
            {analytics.insights.map((insight, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.1 }}
                className={`p-4 rounded-lg border ${
                  insight.type === "RISK"
                    ? "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800"
                    : insight.type === "OPPORTUNITY"
                      ? "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800"
                      : "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-semibold ${
                          insight.type === "RISK"
                            ? "bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300"
                            : insight.type === "OPPORTUNITY"
                              ? "bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300"
                              : "bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300"
                        }`}
                      >
                        {insight.type}
                      </span>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-semibold ${
                          insight.impact === "CRITICAL"
                            ? "bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300"
                            : insight.impact === "HIGH"
                              ? "bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-300"
                              : "bg-yellow-100 dark:bg-yellow-900/40 text-yellow-700 dark:text-yellow-300"
                        }`}
                      >
                        {insight.impact} IMPACT
                      </span>
                    </div>
                    <h4 className="font-semibold text-gray-900 dark:text-white">
                      {insight.title}
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      {insight.description}
                    </p>
                    {insight.value && (
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mt-2">
                        Estimated Value: ${insight.value.toLocaleString()}
                      </p>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Zone Performance */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Zone Performance
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={zonePerformanceData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="name" stroke="#6b7280" fontSize={12} />
              <YAxis stroke="#6b7280" fontSize={12} />
              <RechartsTooltip
                contentStyle={{
                  backgroundColor: "#1f2937",
                  border: "1px solid #374151",
                  borderRadius: "8px",
                }}
              />
              <Legend />
              <Bar dataKey="efficiency" fill="#3b82f6" name="Efficiency %" />
              <Bar dataKey="onTime" fill="#10b981" name="On-Time %" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Event Types Distribution */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Event Types
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={eventTypeData}
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
                {eventTypeData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length]}
                  />
                ))}
              </Pie>
              <RechartsTooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Zone Details */}
      {analytics.zoneMetrics.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Zone Details
          </h3>
          <div className="mb-4">
            <select
              value={selectedZone || ""}
              onChange={(e) => setSelectedZone(e.target.value || null)}
              className="px-3 py-2 rounded-lg bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            >
              <option value="">All Zones</option>
              {analytics.zoneMetrics.map((zm) => (
                <option key={zm.zoneId} value={zm.zoneId}>
                  {zm.zoneName}
                </option>
              ))}
            </select>
          </div>

          {selectedZoneMetrics ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    Entries
                  </div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {selectedZoneMetrics.totalEntries}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    Exits
                  </div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {selectedZoneMetrics.totalExits}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    Avg Dwell
                  </div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {selectedZoneMetrics.averageDwellTime.toFixed(1)}m
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    Violations
                  </div>
                  <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                    {selectedZoneMetrics.dwellTimeViolations}
                  </div>
                </div>
              </div>

              {dwellTimeTrendData.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Dwell Time Trend
                  </h4>
                  <ResponsiveContainer width="100%" height={200}>
                    <AreaChart data={dwellTimeTrendData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="period" stroke="#6b7280" fontSize={12} />
                      <YAxis stroke="#6b7280" fontSize={12} />
                      <RechartsTooltip
                        contentStyle={{
                          backgroundColor: "#1f2937",
                          border: "1px solid #374151",
                          borderRadius: "8px",
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="value"
                        stroke="#3b82f6"
                        fill="#3b82f6"
                        fillOpacity={0.3}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="text-left py-2 px-4 text-gray-700 dark:text-gray-300">
                      Zone
                    </th>
                    <th className="text-right py-2 px-4 text-gray-700 dark:text-gray-300">
                      Entries
                    </th>
                    <th className="text-right py-2 px-4 text-gray-700 dark:text-gray-300">
                      Exits
                    </th>
                    <th className="text-right py-2 px-4 text-gray-700 dark:text-gray-300">
                      Avg Dwell
                    </th>
                    <th className="text-right py-2 px-4 text-gray-700 dark:text-gray-300">
                      Violations
                    </th>
                    <th className="text-right py-2 px-4 text-gray-700 dark:text-gray-300">
                      Efficiency
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {analytics.zoneMetrics.map((zm) => (
                    <tr
                      key={zm.zoneId}
                      className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer"
                      onClick={() => setSelectedZone(zm.zoneId)}
                    >
                      <td className="py-2 px-4 font-medium text-gray-900 dark:text-white">
                        {zm.zoneName}
                      </td>
                      <td className="py-2 px-4 text-right text-gray-600 dark:text-gray-400">
                        {zm.totalEntries}
                      </td>
                      <td className="py-2 px-4 text-right text-gray-600 dark:text-gray-400">
                        {zm.totalExits}
                      </td>
                      <td className="py-2 px-4 text-right text-gray-600 dark:text-gray-400">
                        {zm.averageDwellTime.toFixed(1)}m
                      </td>
                      <td className="py-2 px-4 text-right text-red-600 dark:text-red-400">
                        {zm.dwellTimeViolations}
                      </td>
                      <td className="py-2 px-4 text-right">
                        <span
                          className={`font-semibold ${
                            zm.efficiencyScore >= 80
                              ? "text-green-600 dark:text-green-400"
                              : zm.efficiencyScore >= 60
                                ? "text-yellow-600 dark:text-yellow-400"
                                : "text-red-600 dark:text-red-400"
                          }`}
                        >
                          {zm.efficiencyScore.toFixed(1)}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Helper functions
function generateCSV(analytics: GeofenceAnalytics): string {
  const rows: string[] = [];
  rows.push("Geofence Analytics Report");
  rows.push(
    `Period: ${analytics.period.start.toISOString()} - ${analytics.period.end.toISOString()}`,
  );
  rows.push("");
  rows.push("Summary");
  rows.push(`Total Zones,${analytics.summary.totalZones}`);
  rows.push(`Active Zones,${analytics.summary.activeZones}`);
  rows.push(`Total Events,${analytics.summary.totalEvents}`);
  rows.push(`Average Dwell Time,${analytics.summary.averageDwellTime}`);
  rows.push(`Efficiency Score,${analytics.summary.efficiencyScore}`);
  rows.push(`Compliance Score,${analytics.summary.complianceScore}`);
  rows.push("");
  rows.push("Zone Performance");
  rows.push(
    "Zone Name,Type,Entries,Exits,Avg Dwell,Median Dwell,Max Dwell,Min Dwell,Violations,Warnings,On-Time Rate,Efficiency Score,Cost Impact",
  );
  for (const zm of analytics.zoneMetrics) {
    rows.push(
      `${zm.zoneName},${zm.zoneType},${zm.totalEntries},${zm.totalExits},${zm.averageDwellTime},${zm.medianDwellTime},${zm.maxDwellTime},${zm.minDwellTime},${zm.dwellTimeViolations},${zm.dwellTimeWarnings},${zm.onTimeRate},${zm.efficiencyScore},${zm.costImpact}`,
    );
  }
  return rows.join("\n");
}

function downloadCSV(csv: string, filename: string): void {
  const blob = new Blob([csv], { type: "text/csv" });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
}
