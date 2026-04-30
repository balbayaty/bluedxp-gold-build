"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  format,
  subDays,
  subWeeks,
  subMonths,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
} from "date-fns";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  AreaChart,
  Area,
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

/**
 * Customer Dashboard Reporting
 *
 * Comprehensive weekly and monthly reports that customers receive
 * Includes visualizations, metrics, and insights
 */
export default function CustomerDashboard() {
  const [reportPeriod, setReportPeriod] = useState<"weekly" | "monthly">(
    "weekly",
  );
  const [selectedDate, setSelectedDate] = useState(new Date());

  // Generate sample data for reports
  const generateWeeklyData = () => {
    const days = [];
    const start = startOfWeek(selectedDate);
    for (let i = 0; i < 7; i++) {
      const date = new Date(start);
      date.setDate(start.getDate() + i);
      days.push({
        date: format(date, "EEE"),
        orders: Math.floor(Math.random() * 50) + 20,
        shipments: Math.floor(Math.random() * 45) + 18,
        onTime: Math.floor(Math.random() * 40) + 15,
        delayed: Math.floor(Math.random() * 5) + 1,
        accuracy: Math.floor(Math.random() * 5) + 95,
        inventory: Math.floor(Math.random() * 1000) + 5000,
      });
    }
    return days;
  };

  const generateMonthlyData = () => {
    const weeks = [];
    const start = startOfMonth(selectedDate);
    for (let i = 0; i < 4; i++) {
      const weekStart = new Date(start);
      weekStart.setDate(start.getDate() + i * 7);
      weeks.push({
        week: `Week ${i + 1}`,
        orders: Math.floor(Math.random() * 200) + 100,
        shipments: Math.floor(Math.random() * 180) + 90,
        onTime: Math.floor(Math.random() * 150) + 80,
        delayed: Math.floor(Math.random() * 20) + 5,
        accuracy: Math.floor(Math.random() * 3) + 97,
        inventory: Math.floor(Math.random() * 2000) + 4000,
        revenue: Math.floor(Math.random() * 50000) + 100000,
      });
    }
    return weeks;
  };

  const weeklyData = generateWeeklyData();
  const monthlyData = generateMonthlyData();

  // Calculate summary metrics
  const weeklySummary = {
    totalOrders: weeklyData.reduce((sum, d) => sum + d.orders, 0),
    totalShipments: weeklyData.reduce((sum, d) => sum + d.shipments, 0),
    onTimeRate: (
      (weeklyData.reduce((sum, d) => sum + d.onTime, 0) /
        weeklyData.reduce((sum, d) => sum + d.shipments, 0)) *
      100
    ).toFixed(1),
    avgAccuracy: (
      weeklyData.reduce((sum, d) => sum + d.accuracy, 0) / weeklyData.length
    ).toFixed(1),
    totalDelayed: weeklyData.reduce((sum, d) => sum + d.delayed, 0),
  };

  const monthlySummary = {
    totalOrders: monthlyData.reduce((sum, d) => sum + d.orders, 0),
    totalShipments: monthlyData.reduce((sum, d) => sum + d.shipments, 0),
    onTimeRate: (
      (monthlyData.reduce((sum, d) => sum + d.onTime, 0) /
        monthlyData.reduce((sum, d) => sum + d.shipments, 0)) *
      100
    ).toFixed(1),
    avgAccuracy: (
      monthlyData.reduce((sum, d) => sum + d.accuracy, 0) / monthlyData.length
    ).toFixed(1),
    totalDelayed: monthlyData.reduce((sum, d) => sum + d.delayed, 0),
    totalRevenue: monthlyData.reduce((sum, d) => sum + d.revenue, 0),
  };

  // SLA Compliance data
  const slaComplianceData = [
    { name: "Dock-to-Stock", target: 4, actual: 3.8, compliance: 95 },
    { name: "Order-to-Ship", target: 24, actual: 22.5, compliance: 94 },
    { name: "Pick Accuracy", target: 99.8, actual: 99.6, compliance: 100 },
    { name: "Inventory Accuracy", target: 99.5, actual: 99.3, compliance: 100 },
    { name: "ASN Receipt", target: 24, actual: 23.2, compliance: 97 },
  ];

  // Performance by category
  const performanceByCategory = [
    { name: "Inbound", value: 96, color: "#06b6d4" },
    { name: "Outbound", value: 94, color: "#3b82f6" },
    { name: "Value-Added", value: 98, color: "#10b981" },
    { name: "Reverse Logistics", value: 92, color: "#f59e0b" },
  ];

  const COLORS = ["#06b6d4", "#3b82f6", "#10b981", "#f59e0b", "#ef4444"];

  return (
    <div className="min-h-screen bg-[#111827] text-white">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-cyan-600 border-b border-blue-500/30">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold mb-2">Customer Dashboard</h1>
              <p className="text-blue-100 text-lg">
                Weekly & Monthly Performance Reports
              </p>
              <p className="text-blue-200 text-sm mt-2">
                Report Period:{" "}
                {reportPeriod === "weekly"
                  ? `Week of ${format(startOfWeek(selectedDate), "MMM dd")} - ${format(endOfWeek(selectedDate), "MMM dd, yyyy")}`
                  : format(selectedDate, "MMMM yyyy")}
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div>
                <label className="block text-sm font-medium mb-2 text-blue-100">
                  Report Type
                </label>
                <select
                  value={reportPeriod}
                  onChange={(e) =>
                    setReportPeriod(e.target.value as "weekly" | "monthly")
                  }
                  className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-lg px-4 py-2 text-white font-medium focus:outline-none focus:ring-2 focus:ring-white/50"
                >
                  <option value="weekly">Weekly Report</option>
                  <option value="monthly">Monthly Report</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 text-blue-100">
                  Date
                </label>
                <input
                  type="date"
                  value={format(selectedDate, "yyyy-MM-dd")}
                  onChange={(e) => setSelectedDate(new Date(e.target.value))}
                  className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-lg px-4 py-2 text-white font-medium focus:outline-none focus:ring-2 focus:ring-white/50"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-[#1f2937] border border-[#374151] rounded-xl p-6"
          >
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-400">
                Total Orders
              </h3>
              <i className="ri-shopping-cart-line text-cyan-400 text-xl"></i>
            </div>
            <p className="text-3xl font-bold text-white">
              {reportPeriod === "weekly"
                ? weeklySummary.totalOrders
                : monthlySummary.totalOrders}
            </p>
            <p className="text-xs text-gray-400 mt-2">
              {reportPeriod === "weekly" ? "This week" : "This month"}
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-[#1f2937] border border-[#374151] rounded-xl p-6"
          >
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-400">
                On-Time Rate
              </h3>
              <i className="ri-time-line text-green-400 text-xl"></i>
            </div>
            <p className="text-3xl font-bold text-white">
              {reportPeriod === "weekly"
                ? weeklySummary.onTimeRate
                : monthlySummary.onTimeRate}
              %
            </p>
            <p className="text-xs text-gray-400 mt-2">SLA Target: ≥98%</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-[#1f2937] border border-[#374151] rounded-xl p-6"
          >
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-400">
                Pick Accuracy
              </h3>
              <i className="ri-checkbox-circle-line text-blue-400 text-xl"></i>
            </div>
            <p className="text-3xl font-bold text-white">
              {reportPeriod === "weekly"
                ? weeklySummary.avgAccuracy
                : monthlySummary.avgAccuracy}
              %
            </p>
            <p className="text-xs text-gray-400 mt-2">Target: ≥99.8%</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-[#1f2937] border border-[#374151] rounded-xl p-6"
          >
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-400">
                {reportPeriod === "weekly"
                  ? "Delayed Shipments"
                  : "Total Revenue"}
              </h3>
              <i
                className={
                  reportPeriod === "weekly"
                    ? "ri-error-warning-line text-yellow-400 text-xl"
                    : "ri-money-dollar-circle-line text-green-400 text-xl"
                }
              ></i>
            </div>
            <p className="text-3xl font-bold text-white">
              {reportPeriod === "weekly"
                ? weeklySummary.totalDelayed
                : `$${monthlySummary.totalRevenue.toLocaleString()}`}
            </p>
            <p className="text-xs text-gray-400 mt-2">
              {reportPeriod === "weekly" ? "Requires attention" : "This month"}
            </p>
          </motion.div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Orders & Shipments Trend */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-[#1f2937] border border-[#374151] rounded-xl p-6"
          >
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
              <i className="ri-line-chart-line text-cyan-400"></i>
              Orders & Shipments Trend
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart
                data={reportPeriod === "weekly" ? weeklyData : monthlyData}
              >
                <defs>
                  <linearGradient id="colorOrders" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient
                    id="colorShipments"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <linearGradient
                      id="colorShipments"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis
                  dataKey={reportPeriod === "weekly" ? "date" : "week"}
                  stroke="#9ca3af"
                  style={{ fontSize: "12px" }}
                />
                <YAxis stroke="#9ca3af" style={{ fontSize: "12px" }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1f2937",
                    border: "1px solid #374151",
                    borderRadius: "8px",
                    color: "#fff",
                  }}
                />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="orders"
                  stroke="#06b6d4"
                  fillOpacity={1}
                  fill="url(#colorOrders)"
                  name="Orders"
                />
                <Area
                  type="monotone"
                  dataKey="shipments"
                  stroke="#3b82f6"
                  fillOpacity={1}
                  fill="url(#colorShipments)"
                  name="Shipments"
                />
              </AreaChart>
            </ResponsiveContainer>
          </motion.div>

          {/* On-Time vs Delayed */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-[#1f2937] border border-[#374151] rounded-xl p-6"
          >
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
              <i className="ri-bar-chart-line text-cyan-400"></i>
              On-Time vs Delayed Shipments
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                data={reportPeriod === "weekly" ? weeklyData : monthlyData}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis
                  dataKey={reportPeriod === "weekly" ? "date" : "week"}
                  stroke="#9ca3af"
                  style={{ fontSize: "12px" }}
                />
                <YAxis stroke="#9ca3af" style={{ fontSize: "12px" }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1f2937",
                    border: "1px solid #374151",
                    borderRadius: "8px",
                    color: "#fff",
                  }}
                />
                <Legend />
                <Bar dataKey="onTime" fill="#10b981" name="On-Time" />
                <Bar dataKey="delayed" fill="#ef4444" name="Delayed" />
              </BarChart>
            </ResponsiveContainer>
          </motion.div>
        </div>

        {/* SLA Compliance & Performance */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* SLA Compliance */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-[#1f2937] border border-[#374151] rounded-xl p-6"
          >
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
              <i className="ri-shield-check-line text-cyan-400"></i>
              SLA Compliance Status
            </h3>
            <div className="space-y-4">
              {slaComplianceData.map((sla, idx) => (
                <div
                  key={idx}
                  className="bg-[#111827] border border-[#374151] rounded-lg p-4"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-white">
                      {sla.name}
                    </span>
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium ${
                        sla.compliance >= 95
                          ? "bg-green-500/20 text-green-400 border border-green-500/30"
                          : sla.compliance >= 90
                            ? "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30"
                            : "bg-red-500/20 text-red-400 border border-red-500/30"
                      }`}
                    >
                      {sla.compliance}% Compliant
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-gray-400 mb-2">
                    <span>
                      Target: {sla.target}{" "}
                      {sla.name.includes("Accuracy") ? "%" : "hours"}
                    </span>
                    <span>
                      Actual: {sla.actual}{" "}
                      {sla.name.includes("Accuracy") ? "%" : "hours"}
                    </span>
                  </div>
                  <div className="w-full bg-[#374151] rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${
                        sla.compliance >= 95
                          ? "bg-green-500"
                          : sla.compliance >= 90
                            ? "bg-yellow-500"
                            : "bg-red-500"
                      }`}
                      style={{ width: `${sla.compliance}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Performance by Category */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-[#1f2937] border border-[#374151] rounded-xl p-6"
          >
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
              <i className="ri-pie-chart-line text-cyan-400"></i>
              Performance by Category
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={performanceByCategory}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {performanceByCategory.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1f2937",
                    border: "1px solid #374151",
                    borderRadius: "8px",
                    color: "#fff",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="grid grid-cols-2 gap-2 mt-4">
              {performanceByCategory.map((item, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: COLORS[idx] }}
                  ></div>
                  <span className="text-sm text-gray-300">
                    {item.name}: {item.value}%
                  </span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Accuracy Trend */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-[#1f2937] border border-[#374151] rounded-xl p-6 mb-8"
        >
          <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
            <i className="ri-line-chart-line text-cyan-400"></i>
            Pick Accuracy Trend
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart
              data={reportPeriod === "weekly" ? weeklyData : monthlyData}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis
                dataKey={reportPeriod === "weekly" ? "date" : "week"}
                stroke="#9ca3af"
                style={{ fontSize: "12px" }}
              />
              <YAxis
                domain={[90, 100]}
                stroke="#9ca3af"
                style={{ fontSize: "12px" }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#1f2937",
                  border: "1px solid #374151",
                  borderRadius: "8px",
                  color: "#fff",
                }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="accuracy"
                stroke="#10b981"
                strokeWidth={3}
                name="Pick Accuracy %"
                dot={{ fill: "#10b981", r: 4 }}
              />
              <Line
                type="monotone"
                dataKey={() => 99.8}
                stroke="#ef4444"
                strokeWidth={2}
                strokeDasharray="5 5"
                name="Target (99.8%)"
              />
            </LineChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Report Summary */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-[#1f2937] border border-[#374151] rounded-xl p-6"
        >
          <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
            <i className="ri-file-text-line text-cyan-400"></i>
            Report Summary
          </h3>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h4 className="text-sm font-semibold text-gray-400 mb-3">
                Key Highlights
              </h4>
              <ul className="space-y-2 text-sm text-gray-300">
                <li className="flex items-center gap-2">
                  <i className="ri-checkbox-circle-line text-green-400"></i>
                  {reportPeriod === "weekly"
                    ? weeklySummary.totalOrders
                    : monthlySummary.totalOrders}{" "}
                  orders processed successfully
                </li>
                <li className="flex items-center gap-2">
                  <i className="ri-checkbox-circle-line text-green-400"></i>
                  {reportPeriod === "weekly"
                    ? weeklySummary.onTimeRate
                    : monthlySummary.onTimeRate}
                  % on-time delivery rate
                </li>
                <li className="flex items-center gap-2">
                  <i className="ri-checkbox-circle-line text-green-400"></i>
                  {reportPeriod === "weekly"
                    ? weeklySummary.avgAccuracy
                    : monthlySummary.avgAccuracy}
                  % average pick accuracy
                </li>
                {reportPeriod === "weekly" && (
                  <li className="flex items-center gap-2">
                    <i className="ri-error-warning-line text-yellow-400"></i>
                    {weeklySummary.totalDelayed} delayed shipments requiring
                    attention
                  </li>
                )}
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-gray-400 mb-3">
                Recommendations
              </h4>
              <ul className="space-y-2 text-sm text-gray-300">
                <li className="flex items-start gap-2">
                  <i className="ri-lightbulb-line text-cyan-400 mt-0.5"></i>
                  Continue monitoring on-time delivery rates to maintain SLA
                  compliance
                </li>
                <li className="flex items-start gap-2">
                  <i className="ri-lightbulb-line text-cyan-400 mt-0.5"></i>
                  Pick accuracy is above target - excellent performance
                </li>
                <li className="flex items-start gap-2">
                  <i className="ri-lightbulb-line text-cyan-400 mt-0.5"></i>
                  Consider optimizing inventory levels based on current trends
                </li>
              </ul>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
