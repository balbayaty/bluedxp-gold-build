"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  ComposedChart,
  Area,
  AreaChart,
} from "recharts";
import {
  SpaceUtilization,
  CustomerSpaceAllocation,
  UtilizationTrend,
} from "@/types/spaceUtilization";
import { format } from "date-fns";

interface SpaceUtilizationChartProps {
  data: SpaceUtilization;
  showCustomerBreakdown?: boolean;
  showTrends?: boolean;
  className?: string;
}

export default function SpaceUtilizationChart({
  data,
  showCustomerBreakdown = true,
  showTrends = true,
  className = "",
}: SpaceUtilizationChartProps) {
  // Customer Breakdown Data
  const customerBreakdownData = useMemo(() => {
    return data.customerBreakdown
      .sort((a, b) => b.usedArea - a.usedArea)
      .slice(0, 10)
      .map((customer) => ({
        name: customer.customerName.substring(0, 15),
        usedArea: customer.usedArea,
        allocatedArea: customer.allocatedArea,
        utilization: customer.areaUtilization,
        palletUtilization: customer.palletUtilization,
        tier: customer.serviceTier,
      }));
  }, [data.customerBreakdown]);

  // Utilization Trends Data
  const trendsData = useMemo(() => {
    return data.trends
      .slice(-30) // Last 30 data points
      .map((trend) => ({
        date: format(new Date(trend.date), "MMM dd"),
        utilization: trend.utilization,
        palletUtilization: trend.palletUtilization,
        volumeUtilization: trend.volumeUtilization,
      }));
  }, [data.trends]);

  // Forecast Data
  const forecastData = useMemo(() => {
    const lastTrend = data.trends[data.trends.length - 1];
    const forecasts = data.forecasts.slice(0, 30);

    return [
      ...data.trends.slice(-7).map((t) => ({
        date: format(new Date(t.date), "MMM dd"),
        actual: t.utilization,
        forecast: null as number | null,
        type: "actual" as const,
      })),
      ...forecasts.map((f) => ({
        date: format(new Date(f.date), "MMM dd"),
        actual: null as number | null,
        forecast: f.predictedUtilization,
        type: "forecast" as const,
      })),
    ];
  }, [data.trends, data.forecasts]);

  // Overall Metrics
  const metrics = useMemo(() => {
    return {
      currentUtilization: data.currentUtilization.utilizationPercentage,
      palletUtilization: data.currentUtilization.palletUtilizationPercentage,
      volumeUtilization: data.currentUtilization.volumeUtilizationPercentage,
      availableArea: data.availableCapacity.totalArea,
      usedArea: data.currentUtilization.usedArea,
      totalArea: data.totalCapacity.totalArea,
    };
  }, [data]);

  const COLORS = {
    PLATINUM: "#8b5cf6",
    GOLD: "#f59e0b",
    SILVER: "#6b7280",
    BRONZE: "#92400e",
    STANDARD: "#374151",
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-4"
        >
          <div className="text-xs text-[#9ca3af] mb-1">Overall Utilization</div>
          <div className="text-2xl font-bold text-white mb-2">
            {metrics.currentUtilization.toFixed(1)}%
          </div>
          <div className="w-full bg-white/5 rounded-full h-2 overflow-hidden">
            <div
              className={`h-full ${
                metrics.currentUtilization >= 90
                  ? "bg-red-500"
                  : metrics.currentUtilization >= 75
                    ? "bg-yellow-500"
                    : "bg-green-500"
              }`}
              style={{ width: `${metrics.currentUtilization}%` }}
            ></div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-4"
        >
          <div className="text-xs text-[#9ca3af] mb-1">Pallet Utilization</div>
          <div className="text-2xl font-bold text-white mb-2">
            {metrics.palletUtilization.toFixed(1)}%
          </div>
          <div className="w-full bg-white/5 rounded-full h-2 overflow-hidden">
            <div
              className="h-full bg-cyan-500"
              style={{ width: `${metrics.palletUtilization}%` }}
            ></div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-4"
        >
          <div className="text-xs text-[#9ca3af] mb-1">Used Area</div>
          <div className="text-2xl font-bold text-white">
            {metrics.usedArea.toLocaleString()} m²
          </div>
          <div className="text-xs text-[#6b7280] mt-1">
            of {metrics.totalArea.toLocaleString()} m²
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-4"
        >
          <div className="text-xs text-[#9ca3af] mb-1">Available Area</div>
          <div className="text-2xl font-bold text-white">
            {metrics.availableArea.toLocaleString()} m²
          </div>
          <div className="text-xs text-[#6b7280] mt-1">
            {((metrics.availableArea / metrics.totalArea) * 100).toFixed(1)}%
            available
          </div>
        </motion.div>
      </div>

      {/* Customer Breakdown */}
      {showCustomerBreakdown && customerBreakdownData.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
        >
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <i className="ri-pie-chart-line text-cyan-400 text-lg"></i>
            <span>Space Utilization by Customer</span>
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={customerBreakdownData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis
                dataKey="name"
                stroke="#9ca3af"
                fontSize={12}
                angle={-45}
                textAnchor="end"
                height={80}
              />
              <YAxis stroke="#9ca3af" fontSize={12} />
              <RechartsTooltip
                contentStyle={{
                  backgroundColor: "#1f2937",
                  border: "1px solid #374151",
                  borderRadius: "8px",
                }}
                labelStyle={{ color: "#fff" }}
              />
              <Bar dataKey="usedArea" fill="#06b6d4" name="Used Area (m²)" />
              <Bar
                dataKey="allocatedArea"
                fill="#374151"
                name="Allocated Area (m²)"
              />
              <Legend />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
      )}

      {/* Utilization Trends */}
      {showTrends && trendsData.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
        >
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <i className="ri-line-chart-line text-cyan-400 text-lg"></i>
            <span>Utilization Trends (Last 30 Days)</span>
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <ComposedChart data={trendsData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="date" stroke="#9ca3af" fontSize={12} />
              <YAxis stroke="#9ca3af" fontSize={12} />
              <RechartsTooltip
                contentStyle={{
                  backgroundColor: "#1f2937",
                  border: "1px solid #374151",
                  borderRadius: "8px",
                }}
                labelStyle={{ color: "#fff" }}
              />
              <Area
                type="monotone"
                dataKey="utilization"
                fill="#06b6d4"
                fillOpacity={0.3}
                stroke="#06b6d4"
                name="Area Utilization %"
              />
              <Line
                type="monotone"
                dataKey="palletUtilization"
                stroke="#10b981"
                strokeWidth={2}
                name="Pallet Utilization %"
              />
              <Line
                type="monotone"
                dataKey="volumeUtilization"
                stroke="#f59e0b"
                strokeWidth={2}
                name="Volume Utilization %"
              />
              <Legend />
            </ComposedChart>
          </ResponsiveContainer>
        </motion.div>
      )}

      {/* Forecast */}
      {data.forecasts.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
        >
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <i className="ri-lightbulb-flash-line text-cyan-400 text-lg"></i>
            <span>Utilization Forecast</span>
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <ComposedChart data={forecastData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="date" stroke="#9ca3af" fontSize={12} />
              <YAxis stroke="#9ca3af" fontSize={12} />
              <RechartsTooltip
                contentStyle={{
                  backgroundColor: "#1f2937",
                  border: "1px solid #374151",
                  borderRadius: "8px",
                }}
                labelStyle={{ color: "#fff" }}
              />
              <Area
                type="monotone"
                dataKey="actual"
                fill="#06b6d4"
                fillOpacity={0.3}
                stroke="#06b6d4"
                name="Actual Utilization"
              />
              <Line
                type="monotone"
                dataKey="forecast"
                stroke="#f59e0b"
                strokeWidth={2}
                strokeDasharray="5 5"
                name="Forecast"
              />
              <Legend />
            </ComposedChart>
          </ResponsiveContainer>
        </motion.div>
      )}

      {/* Customer Distribution Pie Chart */}
      {showCustomerBreakdown && customerBreakdownData.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
        >
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <i className="ri-pie-chart-2-line text-cyan-400 text-lg"></i>
            <span>Customer Space Distribution</span>
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={customerBreakdownData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, utilization }) =>
                  `${name}: ${utilization.toFixed(0)}%`
                }
                outerRadius={80}
                fill="#8884d8"
                dataKey="usedArea"
              >
                {customerBreakdownData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={
                      COLORS[entry.tier as keyof typeof COLORS] || "#374151"
                    }
                  />
                ))}
              </Pie>
              <RechartsTooltip
                contentStyle={{
                  backgroundColor: "#1f2937",
                  border: "1px solid #374151",
                  borderRadius: "8px",
                }}
                labelStyle={{ color: "#fff" }}
              />
            </PieChart>
          </ResponsiveContainer>
        </motion.div>
      )}
    </div>
  );
}
