/**
 * Executive Overview Dashboard
 * High-level metrics and KPIs for executives
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

export default function ExecutiveOverviewDashboard() {
  const [timeRange, setTimeRange] = useState<"7d" | "30d" | "90d" | "1y">(
    "30d",
  );

  // Mock data
  const revenueData = Array.from({ length: 30 }, (_, i) => ({
    date: `Day ${i + 1}`,
    revenue: Math.floor(Math.random() * 100000) + 200000,
    profit: Math.floor(Math.random() * 50000) + 50000,
  }));

  const departmentData = [
    { name: "Warehouse", value: 35, color: "#06b6d4" },
    { name: "Transportation", value: 25, color: "#3b82f6" },
    { name: "Compliance", value: 20, color: "#10b981" },
    { name: "QHSE", value: 15, color: "#f59e0b" },
    { name: "Other", value: 5, color: "#6b7280" },
  ];

  const complianceData = [
    { category: "ISO 9001", score: 95 },
    { category: "ISO 14001", score: 92 },
    { category: "ISO 45001", score: 88 },
    { category: "ISO 27001", score: 90 },
  ];

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/5 border border-white/10 rounded-xl p-6"
        >
          <div className="text-sm text-[#9ca3af] mb-2">Total Revenue</div>
          <div className="text-3xl font-bold text-white mb-1">$2.45M</div>
          <div className="text-sm text-green-400 flex items-center gap-1">
            <i className="ri-arrow-up-line"></i>
            +12.5% vs last month
          </div>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white/5 border border-white/10 rounded-xl p-6"
        >
          <div className="text-sm text-[#9ca3af] mb-2">Active Customers</div>
          <div className="text-3xl font-bold text-white mb-1">1,234</div>
          <div className="text-sm text-green-400 flex items-center gap-1">
            <i className="ri-arrow-up-line"></i>
            +8.3% growth
          </div>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white/5 border border-white/10 rounded-xl p-6"
        >
          <div className="text-sm text-[#9ca3af] mb-2">Compliance Score</div>
          <div className="text-3xl font-bold text-white mb-1">94%</div>
          <div className="text-sm text-amber-400 flex items-center gap-1">
            <i className="ri-arrow-up-line"></i>
            +2% improvement
          </div>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white/5 border border-white/10 rounded-xl p-6"
        >
          <div className="text-sm text-[#9ca3af] mb-2">
            Operational Efficiency
          </div>
          <div className="text-3xl font-bold text-white mb-1">87%</div>
          <div className="text-sm text-green-400 flex items-center gap-1">
            <i className="ri-arrow-up-line"></i>
            +5% improvement
          </div>
        </motion.div>
      </div>

      {/* Revenue Chart */}
      <div className="bg-white/5 border border-white/10 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">
            Revenue & Profit Trends
          </h3>
          <div className="flex items-center gap-2">
            {(["7d", "30d", "90d", "1y"] as const).map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-3 py-1 rounded text-sm transition-colors ${
                  timeRange === range
                    ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30"
                    : "bg-white/5 text-[#9ca3af] border border-white/10 hover:bg-white/10"
                }`}
              >
                {range}
              </button>
            ))}
          </div>
        </div>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={revenueData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis dataKey="date" stroke="#9ca3af" />
            <YAxis stroke="#9ca3af" />
            <Tooltip
              contentStyle={{
                backgroundColor: "#1f2937",
                border: "1px solid #374151",
              }}
            />
            <Legend />
            <Line
              type="monotone"
              dataKey="revenue"
              stroke="#06b6d4"
              strokeWidth={2}
            />
            <Line
              type="monotone"
              dataKey="profit"
              stroke="#10b981"
              strokeWidth={2}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Department Breakdown & Compliance */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white/5 border border-white/10 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4">
            Department Breakdown
          </h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={departmentData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) =>
                  `${name} ${(percent * 100).toFixed(0)}%`
                }
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {departmentData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4">
            Compliance Scores
          </h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={complianceData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="category" stroke="#9ca3af" />
              <YAxis stroke="#9ca3af" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#1f2937",
                  border: "1px solid #374151",
                }}
              />
              <Bar dataKey="score" fill="#06b6d4" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
