"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { format } from "date-fns";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  AreaChart,
  Area,
  ComposedChart,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import PageTemplate from "@/components/PageTemplate";

export default function ManufacturingAnalyticsPage() {
  const [timeRange, setTimeRange] = useState<"7D" | "30D" | "90D" | "1Y">(
    "30D",
  );

  // Production trend data
  const productionTrend = useMemo(() => {
    const days =
      timeRange === "7D"
        ? 7
        : timeRange === "30D"
          ? 30
          : timeRange === "90D"
            ? 90
            : 365;
    return Array.from({ length: days }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (days - 1 - i));
      return {
        date: format(date, "MMM dd"),
        planned: Math.floor(Math.random() * 50) + 20,
        actual: Math.floor(Math.random() * 50) + 15,
        efficiency: 80 + Math.random() * 20,
      };
    });
  }, [timeRange]);

  // Work center performance
  const workCenterPerformance = useMemo(() => {
    return Array.from({ length: 8 }, (_, i) => ({
      name: `WC-${i + 1}`,
      utilization: 75 + Math.random() * 20,
      efficiency: 85 + Math.random() * 15,
      output: Math.floor(Math.random() * 1000) + 500,
    }));
  }, []);

  // Quality metrics
  const qualityData = useMemo(() => {
    return [
      { name: "Passed", value: 92, color: "#10b981" },
      { name: "Failed", value: 5, color: "#ef4444" },
      { name: "Rework", value: 3, color: "#f59e0b" },
    ];
  }, []);

  // Order status distribution
  const orderStatusData = useMemo(() => {
    return [
      { status: "Completed", count: 45, color: "#10b981" },
      { status: "In Progress", count: 25, color: "#06b6d4" },
      { status: "Planned", count: 15, color: "#9ca3af" },
      { status: "On Hold", count: 8, color: "#f59e0b" },
      { status: "Cancelled", count: 2, color: "#ef4444" },
    ];
  }, []);

  const stats = [
    {
      label: "Total Production",
      value: productionTrend.reduce((sum, d) => sum + d.actual, 0),
      icon: "ri-file-list-3-line",
      tooltip: "Total production units",
      trend: "up" as const,
    },
    {
      label: "Avg Efficiency",
      value: `${(productionTrend.reduce((sum, d) => sum + d.efficiency, 0) / productionTrend.length).toFixed(1)}%`,
      icon: "ri-line-chart-line",
      tooltip: "Average efficiency",
      trend: "up" as const,
    },
    {
      label: "On-Time Delivery",
      value: "94.5%",
      icon: "ri-time-line",
      tooltip: "On-time delivery rate",
      trend: "up" as const,
    },
    {
      label: "Quality Pass Rate",
      value: "92%",
      icon: "ri-shield-check-line",
      tooltip: "Quality pass rate",
      trend: "up" as const,
    },
  ];

  return (
    <PageTemplate
      title="MaaS Analytics"
      description="Comprehensive manufacturing analytics, performance metrics, trends, and insights"
      shortDescription="Manufacturing analytics and insights"
      icon="ri-bar-chart-box-line"
      stats={stats}
      actions={
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          <select
            value={timeRange}
            onChange={(e) =>
              setTimeRange(e.target.value as "7D" | "30D" | "90D" | "1Y")
            }
            className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-cyan-500"
          >
            <option value="7D">Last 7 Days</option>
            <option value="30D">Last 30 Days</option>
            <option value="90D">Last 90 Days</option>
            <option value="1Y">Last Year</option>
          </select>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Production Trend */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
        >
          <h3 className="text-lg font-semibold text-white mb-4 sm:mb-6 flex items-center gap-2">
            <i className="ri-line-chart-line text-cyan-400 text-lg"></i>
            <span>Production Trend</span>
          </h3>
          <ResponsiveContainer width="100%" height={400}>
            <AreaChart data={productionTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis
                dataKey="date"
                stroke="#9ca3af"
                fontSize={12}
                angle={-45}
                textAnchor="end"
                height={80}
              />
              <YAxis yAxisId="left" stroke="#9ca3af" fontSize={12} />
              <YAxis
                yAxisId="right"
                orientation="right"
                stroke="#9ca3af"
                fontSize={12}
              />
              <RechartsTooltip
                contentStyle={{
                  backgroundColor: "#1f2937",
                  border: "1px solid #374151",
                  borderRadius: "8px",
                }}
                labelStyle={{ color: "#fff" }}
              />
              <Area
                yAxisId="left"
                type="monotone"
                dataKey="planned"
                stackId="1"
                stroke="#06b6d4"
                fill="#06b6d4"
                fillOpacity={0.6}
                name="Planned"
              />
              <Area
                yAxisId="left"
                type="monotone"
                dataKey="actual"
                stackId="1"
                stroke="#10b981"
                fill="#10b981"
                fillOpacity={0.6}
                name="Actual"
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="efficiency"
                stroke="#f59e0b"
                strokeWidth={3}
                name="Efficiency %"
              />
              <Legend />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Work Center Performance */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
        >
          <h3 className="text-lg font-semibold text-white mb-4 sm:mb-6 flex items-center gap-2">
            <i className="ri-building-2-line text-cyan-400 text-lg"></i>
            <span>Work Center Performance</span>
          </h3>
          <ResponsiveContainer width="100%" height={400}>
            <ComposedChart data={workCenterPerformance}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="name" stroke="#9ca3af" fontSize={12} />
              <YAxis yAxisId="left" stroke="#9ca3af" fontSize={12} />
              <YAxis
                yAxisId="right"
                orientation="right"
                stroke="#9ca3af"
                fontSize={12}
              />
              <RechartsTooltip
                contentStyle={{
                  backgroundColor: "#1f2937",
                  border: "1px solid #374151",
                  borderRadius: "8px",
                }}
                labelStyle={{ color: "#fff" }}
              />
              <Bar
                yAxisId="left"
                dataKey="output"
                fill="#06b6d4"
                name="Output"
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="utilization"
                stroke="#10b981"
                strokeWidth={3}
                name="Utilization %"
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="efficiency"
                stroke="#f59e0b"
                strokeWidth={3}
                name="Efficiency %"
              />
              <Legend />
            </ComposedChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Quality Distribution & Order Status */}
        <div className="grid md:grid-cols-2 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
          >
            <h3 className="text-lg font-semibold text-white mb-4 sm:mb-6 flex items-center gap-2">
              <i className="ri-shield-check-line text-cyan-400 text-lg"></i>
              <span>Quality Distribution</span>
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={qualityData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {qualityData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <RechartsTooltip />
              </PieChart>
            </ResponsiveContainer>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
          >
            <h3 className="text-lg font-semibold text-white mb-4 sm:mb-6 flex items-center gap-2">
              <i className="ri-file-list-3-line text-cyan-400 text-lg"></i>
              <span>Order Status Distribution</span>
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={orderStatusData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="status" stroke="#9ca3af" fontSize={12} />
                <YAxis stroke="#9ca3af" fontSize={12} />
                <RechartsTooltip
                  contentStyle={{
                    backgroundColor: "#1f2937",
                    border: "1px solid #374151",
                    borderRadius: "8px",
                  }}
                  labelStyle={{ color: "#fff" }}
                />
                <Bar dataKey="count" fill="#06b6d4" />
              </BarChart>
            </ResponsiveContainer>
          </motion.div>
        </div>
      </div>
    </PageTemplate>
  );
}
