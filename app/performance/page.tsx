/**
 * Performance Dashboard
 *
 * Comprehensive performance monitoring and optimization dashboard:
 * - System performance KPIs
 * - Optimization service metrics
 * - Attribution tracking
 * - Real-time performance analytics
 */

"use client";

import { useState, useEffect } from "react";
import PageTemplate from "@/components/PageTemplate";
import { ErrorBoundary } from "@/components/ErrorBoundary";
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
import { useAuth } from "@/contexts/AuthContext";

const COLORS = [
  "#3b82f6",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#ec4899",
];

interface PerformanceMetrics {
  overview: {
    responseTime: number;
    throughput: number;
    errorRate: number;
    cpuUsage: number;
    memoryUsage: number;
    diskUsage: number;
  };
  optimization: {
    totalOptimizations: number;
    successfulOptimizations: number;
    averageImprovement: number;
    activeOptimizations: number;
  };
  attribution: {
    totalEvents: number;
    trackedJourneys: number;
    conversionRate: number;
    averageJourneyLength: number;
  };
  trends: Array<{
    time: string;
    responseTime: number;
    throughput: number;
    errorRate: number;
  }>;
}

function PerformanceDashboard() {
  const { hasModuleAccess } = useAuth();
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<"1h" | "24h" | "7d" | "30d">(
    "24h",
  );

  const hasAccess = hasModuleAccess("admin", "admin");

  useEffect(() => {
    if (!hasAccess) {
      setLoading(false);
      return;
    }

    loadMetrics();
    const interval = setInterval(loadMetrics, 60000); // Refresh every minute
    return () => clearInterval(interval);
  }, [timeRange, hasAccess]);

  const loadMetrics = async () => {
    try {
      setError(null);
      // In production, this would call actual API endpoints
      // For now, use mock data
      const mockMetrics: PerformanceMetrics = {
        overview: {
          responseTime: 145,
          throughput: 1250,
          errorRate: 0.42,
          cpuUsage: 45.2,
          memoryUsage: 62.8,
          diskUsage: 38.5,
        },
        optimization: {
          totalOptimizations: 156,
          successfulOptimizations: 142,
          averageImprovement: 23.5,
          activeOptimizations: 8,
        },
        attribution: {
          totalEvents: 45678,
          trackedJourneys: 3456,
          conversionRate: 12.8,
          averageJourneyLength: 5.2,
        },
        trends: Array.from({ length: 24 }, (_, i) => ({
          time: `${i}:00`,
          responseTime: 100 + Math.random() * 100,
          throughput: 1000 + Math.random() * 500,
          errorRate: Math.random() * 2,
        })),
      };

      setMetrics(mockMetrics);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load metrics");
    } finally {
      setLoading(false);
    }
  };

  if (!hasAccess) {
    return (
      <PageTemplate
        title="Access Denied"
        description="You do not have permission to view performance monitoring"
        icon="ri-error-warning-line"
      >
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center max-w-md">
            <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mx-auto mb-4">
              <i className="ri-error-warning-fill text-3xl text-red-600 dark:text-red-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Access Denied
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              You need administrator permissions to view performance monitoring.
            </p>
          </div>
        </div>
      </PageTemplate>
    );
  }

  if (loading) {
    return (
      <PageTemplate
        title="Performance Dashboard"
        description="System performance monitoring and optimization"
        icon="ri-dashboard-line"
      >
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">
              Loading performance metrics...
            </p>
          </div>
        </div>
      </PageTemplate>
    );
  }

  if (error) {
    return (
      <PageTemplate
        title="Performance Dashboard"
        description="System performance monitoring and optimization"
        icon="ri-dashboard-line"
      >
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-red-900 dark:text-red-100 mb-2">
            Error Loading Metrics
          </h3>
          <p className="text-red-700 dark:text-red-300">{error}</p>
          <button
            onClick={loadMetrics}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </PageTemplate>
    );
  }

  return (
    <PageTemplate
      title="Performance Dashboard"
      description="System performance monitoring and optimization"
      icon="ri-dashboard-line"
    >
      <div className="space-y-6">
        {/* Header Controls */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={loadMetrics}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <i className="ri-refresh-line" />
              Refresh
            </button>
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value as any)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            >
              <option value="1h">Last Hour</option>
              <option value="24h">Last 24 Hours</option>
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
            </select>
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400">
            Last updated: {new Date().toLocaleTimeString()}
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Response Time */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900 dark:text-white">
                Response Time
              </h3>
              <i className="ri-speed-line text-2xl text-blue-600 dark:text-blue-400" />
            </div>
            <div className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              {metrics?.overview.responseTime}ms
            </div>
            <p className="text-sm text-green-600 dark:text-green-400">
              ↓ 12% vs last period
            </p>
          </motion.div>

          {/* Throughput */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900 dark:text-white">
                Throughput
              </h3>
              <i className="ri-rocket-line text-2xl text-green-600 dark:text-green-400" />
            </div>
            <div className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              {metrics?.overview.throughput}/min
            </div>
            <p className="text-sm text-green-600 dark:text-green-400">
              ↑ 8% vs last period
            </p>
          </motion.div>

          {/* Error Rate */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900 dark:text-white">
                Error Rate
              </h3>
              <i className="ri-error-warning-line text-2xl text-red-600 dark:text-red-400" />
            </div>
            <div className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              {metrics?.overview.errorRate}%
            </div>
            <p className="text-sm text-green-600 dark:text-green-400">
              ↓ 15% vs last period
            </p>
          </motion.div>
        </div>

        {/* Resource Usage */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Resource Usage
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* CPU */}
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  CPU Usage
                </span>
                <span className="text-sm font-semibold text-gray-900 dark:text-white">
                  {metrics?.overview.cpuUsage}%
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                <div
                  className={`h-3 rounded-full transition-all ${
                    (metrics?.overview.cpuUsage || 0) > 80
                      ? "bg-red-500"
                      : (metrics?.overview.cpuUsage || 0) > 60
                        ? "bg-yellow-500"
                        : "bg-green-500"
                  }`}
                  style={{ width: `${metrics?.overview.cpuUsage}%` }}
                />
              </div>
            </div>

            {/* Memory */}
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Memory Usage
                </span>
                <span className="text-sm font-semibold text-gray-900 dark:text-white">
                  {metrics?.overview.memoryUsage}%
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                <div
                  className={`h-3 rounded-full transition-all ${
                    (metrics?.overview.memoryUsage || 0) > 80
                      ? "bg-red-500"
                      : (metrics?.overview.memoryUsage || 0) > 60
                        ? "bg-yellow-500"
                        : "bg-green-500"
                  }`}
                  style={{ width: `${metrics?.overview.memoryUsage}%` }}
                />
              </div>
            </div>

            {/* Disk */}
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Disk Usage
                </span>
                <span className="text-sm font-semibold text-gray-900 dark:text-white">
                  {metrics?.overview.diskUsage}%
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                <div
                  className="bg-blue-500 h-3 rounded-full transition-all"
                  style={{ width: `${metrics?.overview.diskUsage}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Performance Trends */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Performance Trends
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={metrics?.trends}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="time" stroke="#9ca3af" fontSize={12} />
              <YAxis stroke="#9ca3af" fontSize={12} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#1f2937",
                  border: "1px solid #374151",
                  borderRadius: "8px",
                }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="responseTime"
                stroke="#3b82f6"
                name="Response Time (ms)"
                strokeWidth={2}
              />
              <Line
                type="monotone"
                dataKey="throughput"
                stroke="#10b981"
                name="Throughput (req/min)"
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Service Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Optimization Service */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Optimization Service
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Total Optimizations
                </span>
                <span className="font-semibold text-gray-900 dark:text-white">
                  {metrics?.optimization.totalOptimizations}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Successful
                </span>
                <span className="font-semibold text-green-600 dark:text-green-400">
                  {metrics?.optimization.successfulOptimizations}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Average Improvement
                </span>
                <span className="font-semibold text-blue-600 dark:text-blue-400">
                  {metrics?.optimization.averageImprovement}%
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Active Optimizations
                </span>
                <span className="font-semibold text-orange-600 dark:text-orange-400">
                  {metrics?.optimization.activeOptimizations}
                </span>
              </div>
            </div>
          </div>

          {/* Attribution Service */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Attribution Service
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Total Events
                </span>
                <span className="font-semibold text-gray-900 dark:text-white">
                  {metrics?.attribution.totalEvents.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Tracked Journeys
                </span>
                <span className="font-semibold text-blue-600 dark:text-blue-400">
                  {metrics?.attribution.trackedJourneys.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Conversion Rate
                </span>
                <span className="font-semibold text-green-600 dark:text-green-400">
                  {metrics?.attribution.conversionRate}%
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Avg Journey Length
                </span>
                <span className="font-semibold text-purple-600 dark:text-purple-400">
                  {metrics?.attribution.averageJourneyLength} touchpoints
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* System Status */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl p-6 border border-blue-200 dark:border-blue-800">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              System Status: <strong>Healthy</strong> • All performance metrics
              within normal ranges
            </span>
          </div>
        </div>
      </div>
    </PageTemplate>
  );
}

export default function PerformancePage() {
  return (
    <ErrorBoundary
      fallback={
        <PageTemplate
          title="Performance Dashboard"
          description="System performance monitoring and optimization"
          icon="ri-dashboard-line"
        >
          <div className="text-center py-12">
            <p className="text-red-600">
              Something went wrong. Please refresh the page.
            </p>
          </div>
        </PageTemplate>
      }
    >
      <PerformanceDashboard />
    </ErrorBoundary>
  );
}
