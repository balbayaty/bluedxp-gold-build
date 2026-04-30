/**
 * RFI Advanced Analytics Dashboard
 * Comprehensive visualizations and insights
 */

"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import PageTemplate from "@/components/PageTemplate";
import ProposalErrorBoundary from "@/components/proposals/ProposalErrorBoundary";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
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
  ComposedChart,
} from "recharts";

const COLORS = [
  "#3b82f6",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#ec4899",
  "#06b6d4",
];

export default function RFIAnalyticsPage() {
  const { hasModuleAccess } = useAuth();
  const [analytics, setAnalytics] = useState<any>(null);
  const [throughput, setThroughput] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<"7D" | "30D" | "90D" | "1Y">(
    "30D",
  );

  // Permission check
  const hasAccess = hasModuleAccess("proposals-rfq", "read_only");

  useEffect(() => {
    loadAnalytics();
  }, [timeRange]);

  const loadAnalytics = async () => {
    try {
      const response = await fetch(`/api/rfi/analytics?timeRange=${timeRange}`);
      const data = await response.json();
      if (data.success) {
        setAnalytics(data.data.analytics);
        setThroughput(data.data.throughput);
      }
    } catch (error) {
      console.error("Error loading analytics:", error);
    } finally {
      setLoading(false);
    }
  };

  // Prepare chart data
  const readinessDistribution = analytics?.byStatus
    ? Object.entries(analytics.byStatus).map(
        ([status, count]: [string, any]) => ({
          status,
          count,
        }),
      )
    : [];

  const trendsData = analytics?.trends || [];

  if (!hasAccess) {
    return (
      <PageTemplate
        title="Access Denied"
        description="You do not have permission to view RFI analytics"
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
              You do not have the required permissions to view RFI analytics.
              Please contact your administrator.
            </p>
          </div>
        </div>
      </PageTemplate>
    );
  }

  if (loading) {
    return (
      <PageTemplate
        title="RFI Analytics"
        description="Comprehensive insights into RFI processing, automation, and throughput"
        icon="ri-bar-chart-box-line"
      >
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </PageTemplate>
    );
  }

  return (
    <ProposalErrorBoundary>
      <PageTemplate
        title="RFI Analytics Dashboard"
        description="Comprehensive insights into RFI processing, automation, and throughput"
        icon="ri-bar-chart-box-line"
      >
        <div className="space-y-6">
          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6"
            >
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Total RFIs
              </div>
              <div className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                {analytics?.totalRFIs || 0}
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6"
            >
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Avg Readiness
              </div>
              <div className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                {Math.round(analytics?.averageReadiness || 0)}%
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6"
            >
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Automation Rate
              </div>
              <div className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                {Math.round(analytics?.automationRate || 0)}%
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6"
            >
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Conversion Rate
              </div>
              <div className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                {Math.round(analytics?.conversionRate || 0)}%
              </div>
            </motion.div>
          </div>

          {/* Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Status Distribution */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-semibold mb-4">
                RFI Status Distribution
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={readinessDistribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ status, percent }) =>
                      `${status}: ${(percent * 100).toFixed(0)}%`
                    }
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="count"
                  >
                    {readinessDistribution.map((_, index) => (
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

            {/* Readiness Trends */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-semibold mb-4">Readiness Trends</h3>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={trendsData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Area
                    type="monotone"
                    dataKey="avgReadiness"
                    stroke="#3b82f6"
                    fill="#3b82f6"
                    fillOpacity={0.6}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Throughput Metrics */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-semibold mb-4">Throughput Metrics</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart
                  data={[
                    {
                      name: "Time to RFQ",
                      value: throughput?.timeToRFQ
                        ? Math.round(throughput.timeToRFQ / 1000 / 60)
                        : 0,
                    },
                    {
                      name: "Time to Proposal",
                      value: throughput?.timeToProposal
                        ? Math.round(throughput.timeToProposal / 1000 / 60)
                        : 0,
                    },
                    {
                      name: "Total Processing",
                      value: throughput?.totalProcessingTime
                        ? Math.round(throughput.totalProcessingTime / 1000 / 60)
                        : 0,
                    },
                  ]}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill="#10b981" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Top Companies */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-semibold mb-4">
                Top Companies by RFI Count
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart
                  data={analytics?.topCompanies?.slice(0, 10) || []}
                  layout="vertical"
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="companyName" type="category" width={150} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#8b5cf6" radius={[0, 8, 8, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Throughput Details */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-semibold mb-4">Throughput Analysis</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Avg Time to RFQ
                </div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
                  {throughput?.timeToRFQ
                    ? Math.round(throughput.timeToRFQ / 1000 / 60)
                    : 0}{" "}
                  min
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Avg Time to Proposal
                </div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
                  {throughput?.timeToProposal
                    ? Math.round(throughput.timeToProposal / 1000 / 60)
                    : 0}{" "}
                  min
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Automation Score
                </div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
                  {Math.round(throughput?.automationScore || 0)}%
                </div>
              </div>
            </div>
          </div>
        </div>
      </PageTemplate>
    </ProposalErrorBoundary>
  );
}
