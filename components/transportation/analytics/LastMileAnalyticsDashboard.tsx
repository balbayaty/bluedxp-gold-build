/**
 * Last-Mile Analytics Dashboard Component
 *
 * Comprehensive analytics for last-mile delivery optimization
 */

"use client";

import { useState } from "react";
import {
  Package,
  Clock,
  MapPin,
  TrendingUp,
  Download,
  CheckCircle,
  AlertCircle,
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
  PieChart,
  Pie,
  Cell,
} from "recharts";
import type { DeliveryRoute } from "@/lib/services/transportation";

interface LastMileAnalyticsDashboardProps {
  routes: DeliveryRoute[];
  onDrillDown?: (routeId: string) => void;
}

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"];

export default function LastMileAnalyticsDashboard({
  routes,
  onDrillDown,
}: LastMileAnalyticsDashboardProps) {
  const [dateRange, setDateRange] = useState<"7D" | "30D" | "90D" | "ALL">(
    "30D",
  );

  const analytics = calculateLastMileAnalytics(routes, dateRange);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Last-Mile Analytics</h2>
          <p className="text-sm text-gray-500 mt-1">
            Comprehensive insights into delivery performance
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
          title="Total Routes"
          value={analytics.totalRoutes}
          icon={MapPin}
          color="blue"
        />
        <MetricCard
          title="On-Time Rate"
          value={`${analytics.onTimeRate.toFixed(1)}%`}
          icon={CheckCircle}
          color="green"
        />
        <MetricCard
          title="Avg Delivery Time"
          value={`${analytics.avgDeliveryTime.toFixed(1)} min`}
          icon={Clock}
          color="purple"
        />
        <MetricCard
          title="Total Distance"
          value={`${analytics.totalDistance.toFixed(1)} km`}
          icon={Package}
          color="orange"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Delivery Status */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-bold mb-4">Delivery Status</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={analytics.statusDistribution}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) =>
                  `${name} ${(percent * 100).toFixed(0)}%`
                }
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {analytics.statusDistribution.map((entry, index) => (
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

        {/* Time Trends */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-bold mb-4">Delivery Time Trends</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={analytics.timeTrends}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="name" stroke="#6b7280" />
              <YAxis stroke="#6b7280" />
              <Tooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey="avgTime"
                stroke="#3b82f6"
                strokeWidth={2}
                name="Avg Time (min)"
              />
              <Line
                type="monotone"
                dataKey="onTime"
                stroke="#10b981"
                strokeWidth={2}
                name="On-Time %"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Performance Metrics */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-bold mb-4">Route Performance</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={analytics.performanceData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="name" stroke="#6b7280" />
            <YAxis stroke="#6b7280" />
            <Tooltip />
            <Legend />
            <Bar dataKey="stops" fill="#3b82f6" name="Stops" />
            <Bar dataKey="distance" fill="#10b981" name="Distance (km)" />
            <Bar dataKey="time" fill="#8b5cf6" name="Time (min)" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Top Routes */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-bold mb-4">Top Performing Routes</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="text-left p-3 font-medium">Route</th>
                <th className="text-right p-3 font-medium">Stops</th>
                <th className="text-right p-3 font-medium">Distance</th>
                <th className="text-right p-3 font-medium">Time</th>
                <th className="text-right p-3 font-medium">On-Time</th>
                <th className="text-center p-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {analytics.topRoutes.map((route, idx) => (
                <tr
                  key={idx}
                  className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition cursor-pointer"
                  onClick={() => onDrillDown?.(route.id)}
                >
                  <td className="p-3 font-medium">{route.id}</td>
                  <td className="text-right p-3">{route.stops}</td>
                  <td className="text-right p-3">
                    {route.distance.toFixed(1)} km
                  </td>
                  <td className="text-right p-3">
                    {route.time.toFixed(1)} min
                  </td>
                  <td className="text-right p-3 text-green-600 dark:text-green-400">
                    {route.onTime.toFixed(1)}%
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

function calculateLastMileAnalytics(
  routes: DeliveryRoute[],
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
  const filtered = routes.filter((route) => {
    const created = new Date(route.createdAt);
    return now.getTime() - created.getTime() <= daysAgo * 24 * 60 * 60 * 1000;
  });

  if (filtered.length === 0) {
    return {
      totalRoutes: 0,
      onTimeRate: 0,
      avgDeliveryTime: 0,
      totalDistance: 0,
      statusDistribution: [],
      timeTrends: [],
      performanceData: [],
      topRoutes: [],
    };
  }

  const totalRoutes = filtered.length;
  const totalDistance = filtered.reduce((sum, r) => sum + r.totalDistance, 0);
  const totalTime = filtered.reduce((sum, r) => sum + r.totalTime, 0);
  const avgDeliveryTime = totalTime / filtered.length;

  // Calculate on-time rate
  const onTimeDeliveries = filtered.reduce((sum, route) => {
    return sum + route.stops.filter((s) => s.status === "DELIVERED").length;
  }, 0);
  const totalDeliveries = filtered.reduce(
    (sum, route) => sum + route.stops.length,
    0,
  );
  const onTimeRate =
    totalDeliveries > 0 ? (onTimeDeliveries / totalDeliveries) * 100 : 0;

  // Status distribution
  const statusCounts = { DELIVERED: 0, IN_TRANSIT: 0, PENDING: 0, FAILED: 0 };
  filtered.forEach((route) => {
    route.stops.forEach((stop) => {
      if (stop.status in statusCounts) {
        statusCounts[stop.status as keyof typeof statusCounts]++;
      }
    });
  });

  const statusDistribution = Object.entries(statusCounts)
    .filter(([_, count]) => count > 0)
    .map(([name, value]) => ({ name, value }));

  // Time trends
  const timeTrends = filtered.slice(0, 10).map((route, idx) => ({
    name: `Route ${idx + 1}`,
    avgTime: route.totalTime / route.stops.length,
    onTime:
      (route.stops.filter((s) => s.status === "DELIVERED").length /
        route.stops.length) *
      100,
  }));

  // Performance data
  const performanceData = filtered.slice(0, 10).map((route, idx) => ({
    name: `Route ${idx + 1}`,
    stops: route.stops.length,
    distance: route.totalDistance,
    time: route.totalTime,
  }));

  // Top routes
  const topRoutes = filtered
    .map((route) => ({
      id: route.id,
      stops: route.stops.length,
      distance: route.totalDistance,
      time: route.totalTime,
      onTime:
        (route.stops.filter((s) => s.status === "DELIVERED").length /
          route.stops.length) *
        100,
    }))
    .sort((a, b) => b.onTime - a.onTime)
    .slice(0, 10);

  return {
    totalRoutes,
    onTimeRate,
    avgDeliveryTime,
    totalDistance,
    statusDistribution,
    timeTrends,
    performanceData,
    topRoutes,
  };
}
