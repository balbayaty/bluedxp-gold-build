/**
 * Proposals Analytics Page
 * Comprehensive analytics and performance insights
 */

"use client";

import { useState, useMemo } from "react";
import PageTemplate from "@/components/PageTemplate";
import ProposalErrorBoundary from "@/components/proposals/ProposalErrorBoundary";
import { useAuth } from "@/contexts/AuthContext";
import { motion } from "framer-motion";
import {
  AreaChart,
  Area,
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
  LineChart,
  Line,
} from "recharts";

const monthlyData = [
  { month: "Jul", rfqs: 28, proposals: 22, won: 15, value: 1850000 },
  { month: "Aug", rfqs: 35, proposals: 28, won: 18, value: 2200000 },
  { month: "Sep", rfqs: 32, proposals: 26, won: 17, value: 2100000 },
  { month: "Oct", rfqs: 40, proposals: 32, won: 22, value: 2800000 },
  { month: "Nov", rfqs: 45, proposals: 38, won: 25, value: 3200000 },
  { month: "Dec", rfqs: 47, proposals: 35, won: 23, value: 2950000 },
  { month: "Jan", rfqs: 52, proposals: 42, won: 28, value: 3500000 },
];

const serviceBreakdown = [
  { name: "Warehousing", value: 850000, count: 15, color: "#6366F1" },
  { name: "Transportation", value: 620000, count: 12, color: "#10B981" },
  { name: "Customs", value: 340000, count: 8, color: "#F59E0B" },
  { name: "Freight Forwarding", value: 450000, count: 6, color: "#3B82F6" },
  { name: "Rail Freight", value: 190000, count: 4, color: "#8B5CF6" },
];

const conversionFunnel = [
  { stage: "RFQs Received", value: 52, percentage: 100 },
  { stage: "Under Review", value: 48, percentage: 92 },
  { stage: "Proposal Sent", value: 42, percentage: 81 },
  { stage: "Negotiation", value: 35, percentage: 67 },
  { stage: "Won", value: 28, percentage: 54 },
];

const topCustomers = [
  { name: "Saudi Aramco", proposals: 8, value: 2450000, winRate: 75 },
  { name: "SABIC", proposals: 6, value: 1850000, winRate: 83 },
  { name: "Almarai", proposals: 5, value: 1200000, winRate: 60 },
  { name: "P&G Saudi", proposals: 4, value: 980000, winRate: 100 },
  { name: "Saudi Electricity", proposals: 3, value: 750000, winRate: 67 },
];

const performanceMetrics = [
  {
    metric: "Average Response Time",
    value: "2.3 days",
    change: -15,
    icon: "ri-time-line",
  },
  {
    metric: "Avg Proposal Value",
    value: "SAR 125K",
    change: 8,
    icon: "ri-money-dollar-circle-line",
  },
  { metric: "Win Rate", value: "68%", change: 4, icon: "ri-trophy-line" },
  {
    metric: "Customer Retention",
    value: "92%",
    change: 2,
    icon: "ri-user-heart-line",
  },
];

export default function ProposalAnalytics() {
  const { hasModuleAccess } = useAuth();
  const [timeRange, setTimeRange] = useState("6M");

  // Permission check
  const hasAccess = hasModuleAccess("proposals-rfq", "read_only");

  const totalValue = useMemo(
    () => serviceBreakdown.reduce((sum, s) => sum + s.value, 0),
    [],
  );

  if (!hasAccess) {
    return (
      <PageTemplate
        title="Access Denied"
        description="You do not have permission to view proposal analytics"
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
              You do not have the required permissions to view proposal
              analytics. Please contact your administrator.
            </p>
          </div>
        </div>
      </PageTemplate>
    );
  }

  return (
    <ProposalErrorBoundary>
      <PageTemplate
        title="Proposal Analytics"
        description="Performance insights and business intelligence"
        icon="ri-bar-chart-box-line"
      >
        <div className="space-y-6">
          {/* Header Controls */}
          <div className="flex justify-between items-center">
            <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
              {["1M", "3M", "6M", "1Y", "ALL"].map((range) => (
                <button
                  key={range}
                  onClick={() => setTimeRange(range)}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                    timeRange === range
                      ? "bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow"
                      : "text-gray-600 dark:text-gray-400"
                  }`}
                >
                  {range}
                </button>
              ))}
            </div>
            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2">
              <i className="ri-download-line" />
              Export Report
            </button>
          </div>

          {/* KPI Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {performanceMetrics.map((metric, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {metric.metric}
                    </p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                      {metric.value}
                    </p>
                    <p
                      className={`text-sm mt-1 flex items-center gap-1 ${
                        metric.change > 0
                          ? "text-green-500"
                          : metric.change < 0
                            ? "text-red-500"
                            : "text-gray-500"
                      }`}
                    >
                      <i
                        className={
                          metric.change > 0
                            ? "ri-arrow-up-line"
                            : metric.change < 0
                              ? "ri-arrow-down-line"
                              : ""
                        }
                      />
                      {Math.abs(metric.change)}% vs last period
                    </p>
                  </div>
                  <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600">
                    <i className={`${metric.icon} text-xl`} />
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Pipeline Trend */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Pipeline Trend
              </h3>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={monthlyData}>
                    <defs>
                      <linearGradient
                        id="colorRfqs"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="5%"
                          stopColor="#3B82F6"
                          stopOpacity={0.3}
                        />
                        <stop
                          offset="95%"
                          stopColor="#3B82F6"
                          stopOpacity={0}
                        />
                      </linearGradient>
                      <linearGradient id="colorWon" x1="0" y1="0" x2="0" y2="1">
                        <stop
                          offset="5%"
                          stopColor="#10B981"
                          stopOpacity={0.3}
                        />
                        <stop
                          offset="95%"
                          stopColor="#10B981"
                          stopOpacity={0}
                        />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "rgba(0,0,0,0.8)",
                        border: "none",
                        borderRadius: "8px",
                      }}
                    />
                    <Legend />
                    <Area
                      type="monotone"
                      dataKey="rfqs"
                      name="RFQs"
                      stroke="#3B82F6"
                      fillOpacity={1}
                      fill="url(#colorRfqs)"
                    />
                    <Area
                      type="monotone"
                      dataKey="proposals"
                      name="Proposals"
                      stroke="#8B5CF6"
                      fillOpacity={0.3}
                      fill="#8B5CF6"
                    />
                    <Area
                      type="monotone"
                      dataKey="won"
                      name="Won"
                      stroke="#10B981"
                      fillOpacity={1}
                      fill="url(#colorWon)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Revenue by Service */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Revenue by Service
              </h3>
              <div className="h-80 flex items-center">
                <ResponsiveContainer width="50%" height="100%">
                  <PieChart>
                    <Pie
                      data={serviceBreakdown}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {serviceBreakdown.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: number) => [
                        `SAR ${(value / 1000).toFixed(0)}K`,
                        "Revenue",
                      ]}
                      contentStyle={{
                        backgroundColor: "rgba(0,0,0,0.8)",
                        border: "none",
                        borderRadius: "8px",
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-3">
                  {serviceBreakdown.map((service, index) => (
                    <div key={index} className="flex items-center gap-3">
                      <div
                        className="w-4 h-4 rounded"
                        style={{ backgroundColor: service.color }}
                      ></div>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white text-sm">
                          {service.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          SAR {(service.value / 1000).toFixed(0)}K (
                          {((service.value / totalValue) * 100).toFixed(0)}%)
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Conversion Funnel & Top Customers */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Conversion Funnel */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Conversion Funnel
              </h3>
              <div className="space-y-4">
                {conversionFunnel.map((stage, index) => (
                  <div key={index}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-600 dark:text-gray-400">
                        {stage.stage}
                      </span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {stage.value} ({stage.percentage}%)
                      </span>
                    </div>
                    <div className="h-8 bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${stage.percentage}%` }}
                        transition={{ duration: 0.5, delay: index * 0.1 }}
                        className="h-full rounded-lg"
                        style={{
                          backgroundColor:
                            index === 0
                              ? "#3B82F6"
                              : index === 1
                                ? "#8B5CF6"
                                : index === 2
                                  ? "#F59E0B"
                                  : index === 3
                                    ? "#F97316"
                                    : "#10B981",
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-6 p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-emerald-700 dark:text-emerald-400">
                      Overall Conversion Rate
                    </p>
                    <p className="text-2xl font-bold text-emerald-600">54%</p>
                  </div>
                  <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                    <i className="ri-trophy-line text-2xl text-emerald-600" />
                  </div>
                </div>
              </div>
            </div>

            {/* Top Customers */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Top Customers
              </h3>
              <div className="space-y-4">
                {topCustomers.map((customer, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-center gap-4 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
                  >
                    <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 font-bold">
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900 dark:text-white">
                        {customer.name}
                      </p>
                      <p className="text-sm text-gray-500">
                        {customer.proposals} proposals
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-gray-900 dark:text-white">
                        SAR {(customer.value / 1000000).toFixed(2)}M
                      </p>
                      <p
                        className={`text-xs ${customer.winRate >= 80 ? "text-green-500" : customer.winRate >= 60 ? "text-yellow-500" : "text-red-500"}`}
                      >
                        {customer.winRate}% win rate
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>

          {/* Monthly Revenue */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Monthly Pipeline Value
            </h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis
                    tickFormatter={(value) =>
                      `${(value / 1000000).toFixed(1)}M`
                    }
                  />
                  <Tooltip
                    formatter={(value: number) => [
                      `SAR ${(value / 1000000).toFixed(2)}M`,
                      "Value",
                    ]}
                    contentStyle={{
                      backgroundColor: "rgba(0,0,0,0.8)",
                      border: "none",
                      borderRadius: "8px",
                    }}
                  />
                  <Bar
                    dataKey="value"
                    fill="#3B82F6"
                    radius={[4, 4, 0, 0]}
                    name="Pipeline Value"
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <motion.div
              whileHover={{ scale: 1.02 }}
              className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-6 text-white cursor-pointer"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg bg-white/20 flex items-center justify-center">
                  <i className="ri-file-chart-line text-2xl" />
                </div>
                <div>
                  <h3 className="font-semibold">Generate Report</h3>
                  <p className="text-sm opacity-80">Export analytics report</p>
                </div>
              </div>
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.02 }}
              className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl p-6 text-white cursor-pointer"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg bg-white/20 flex items-center justify-center">
                  <i className="ri-mail-send-line text-2xl" />
                </div>
                <div>
                  <h3 className="font-semibold">Schedule Report</h3>
                  <p className="text-sm opacity-80">Set up auto-reporting</p>
                </div>
              </div>
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.02 }}
              className="bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-xl p-6 text-white cursor-pointer"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg bg-white/20 flex items-center justify-center">
                  <i className="ri-presentation-line text-2xl" />
                </div>
                <div>
                  <h3 className="font-semibold">Management Review</h3>
                  <p className="text-sm opacity-80">Create presentation</p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </PageTemplate>
    </ProposalErrorBoundary>
  );
}
