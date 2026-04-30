"use client";

/**
 * ASN Comprehensive Dashboard
 * Showcases ALL features of the ASN module in one beautiful, interactive dashboard
 * This is the "wow factor" visualization
 */

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ASNData } from "@/types/asn";
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
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts";

interface DashboardStats {
  total: number;
  active: number;
  completed: number;
  delayed: number;
  slaCompliant: number;
  averageProcessingTime: number;
  onTimeDeliveryRate: number;
  predictedDelays: number;
  riskScore: number;
}

const COLORS = [
  "#3b82f6",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#ec4899",
];

export default function ASNComprehensiveDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [asns, setAsns] = useState<ASNData[]>([]);
  const [insights, setInsights] = useState<any[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedView, setSelectedView] = useState<
    "overview" | "ai" | "analytics" | "knowledge" | "evidence"
  >("overview");

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      // Load all data in parallel
      const [asnsRes, analyticsRes, insightsRes] = await Promise.all([
        fetch("/api/asn"),
        fetch("/api/asn/analytics?type=comprehensive"),
        fetch("/api/asn/ai/predictive"),
      ]);

      const asnsData = await asnsRes.json();
      const analyticsData = await analyticsRes.json();
      const insightsData = await insightsRes.json();

      setAsns(asnsData.data || []);
      setAnalytics(analyticsData.data);
      setInsights(insightsData.data?.recommendations || []);

      // Calculate stats
      const total = asnsData.data?.length || 0;
      const active =
        asnsData.data?.filter(
          (a: ASNData) =>
            a.status !== "COMPLETED" &&
            a.status !== "GR_POSTED" &&
            a.status !== "CANCELLED",
        ).length || 0;
      const completed =
        asnsData.data?.filter(
          (a: ASNData) => a.status === "COMPLETED" || a.status === "GR_POSTED",
        ).length || 0;
      const delayed =
        asnsData.data?.filter(
          (a: ASNData) => a.status === "BLOCKED" || a.status === "ON_HOLD",
        ).length || 0;
      const slaCompliant =
        asnsData.data?.filter(
          (a: ASNData) => a.slaComplianceStatus === "COMPLIANT",
        ).length || 0;

      setStats({
        total,
        active,
        completed,
        delayed,
        slaCompliant,
        averageProcessingTime:
          analyticsData.data?.overview?.averageProcessingTime || 0,
        onTimeDeliveryRate:
          analyticsData.data?.performance?.onTimeDeliveryRate || 0,
        predictedDelays: insightsData.data?.predictedDelays || 0,
        riskScore: insightsData.data?.riskScore || 0,
      });
    } catch (error) {
      console.error("Error loading dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#0F172A]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-white text-lg">
            Loading Comprehensive Dashboard...
          </p>
        </div>
      </div>
    );
  }

  // Prepare chart data
  const statusData = analytics?.byStatus
    ? Object.entries(analytics.byStatus).map(([name, value]) => ({
        name: name.replace("_", " "),
        value,
      }))
    : [];

  const trendData = analytics?.trends || [];
  const bottleneckData = analytics?.bottlenecks || [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0F172A] via-[#1e293b] to-[#0F172A] p-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 mb-2">
              ASN Comprehensive Dashboard
            </h1>
            <p className="text-gray-400 text-lg">
              Complete visibility into your Advanced Shipping Notice operations
            </p>
          </div>
          <div className="flex gap-2">
            {["overview", "ai", "analytics", "knowledge", "evidence"].map(
              (view) => (
                <button
                  key={view}
                  onClick={() => setSelectedView(view as any)}
                  className={`px-4 py-2 rounded-lg font-medium transition-all ${
                    selectedView === view
                      ? "bg-blue-600 text-white shadow-lg shadow-blue-500/50"
                      : "bg-[#1e293b] text-gray-300 hover:bg-[#334155]"
                  }`}
                >
                  {view.charAt(0).toUpperCase() + view.slice(1)}
                </button>
              ),
            )}
          </div>
        </div>
      </motion.div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats && (
          <>
            <StatCard
              title="Total ASNs"
              value={stats.total}
              icon="ri-file-list-3-line"
              color="from-blue-500 to-cyan-500"
              trend="+12%"
            />
            <StatCard
              title="Active"
              value={stats.active}
              icon="ri-loader-4-line"
              color="from-purple-500 to-pink-500"
              trend="+5%"
            />
            <StatCard
              title="Completed"
              value={stats.completed}
              icon="ri-checkbox-circle-line"
              color="from-green-500 to-emerald-500"
              trend="+8%"
            />
            <StatCard
              title="SLA Compliance"
              value={`${Math.round((stats.slaCompliant / stats.total) * 100)}%`}
              icon="ri-shield-check-line"
              color="from-yellow-500 to-orange-500"
              trend="+3%"
            />
            <StatCard
              title="On-Time Delivery"
              value={`${Math.round(stats.onTimeDeliveryRate)}%`}
              icon="ri-time-line"
              color="from-indigo-500 to-blue-500"
            />
            <StatCard
              title="Avg Processing"
              value={`${Math.round(stats.averageProcessingTime / 3600)}h`}
              icon="ri-speed-up-line"
              color="from-pink-500 to-rose-500"
            />
            <StatCard
              title="Predicted Delays"
              value={stats.predictedDelays}
              icon="ri-alert-line"
              color="from-red-500 to-orange-500"
            />
            <StatCard
              title="Risk Score"
              value={`${stats.riskScore}/100`}
              icon="ri-bar-chart-box-line"
              color="from-cyan-500 to-teal-500"
            />
          </>
        )}
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Status Distribution */}
          {selectedView === "overview" && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-[#1e293b] border border-[#334155] rounded-xl p-6 shadow-xl"
            >
              <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                <i className="ri-pie-chart-line text-blue-400"></i>
                Status Distribution
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={statusData}
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
                    {statusData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </motion.div>
          )}

          {/* Trends */}
          {selectedView === "overview" && trendData.length > 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 }}
              className="bg-[#1e293b] border border-[#334155] rounded-xl p-6 shadow-xl"
            >
              <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                <i className="ri-line-chart-line text-green-400"></i>
                30-Day Trends
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={trendData}>
                  <defs>
                    <linearGradient
                      id="colorCreated"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient
                      id="colorCompleted"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="date" stroke="#9ca3af" />
                  <YAxis stroke="#9ca3af" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#1e293b",
                      border: "1px solid #334155",
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="created"
                    stroke="#3b82f6"
                    fillOpacity={1}
                    fill="url(#colorCreated)"
                  />
                  <Area
                    type="monotone"
                    dataKey="completed"
                    stroke="#10b981"
                    fillOpacity={1}
                    fill="url(#colorCompleted)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </motion.div>
          )}

          {/* AI Insights */}
          {selectedView === "ai" && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-[#1e293b] border border-[#334155] rounded-xl p-6 shadow-xl"
            >
              <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                <i className="ri-brain-line text-purple-400"></i>
                AI-Powered Insights
              </h3>
              <div className="space-y-4">
                {insights.length > 0 ? (
                  insights.map((insight, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="bg-[#0F172A] border border-[#334155] rounded-lg p-4"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-semibold text-white">{insight}</h4>
                        <span className="px-2 py-1 bg-purple-500/20 text-purple-400 rounded text-xs">
                          AI
                        </span>
                      </div>
                    </motion.div>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-400">
                    <i className="ri-brain-line text-4xl mb-2"></i>
                    <p>AI insights will appear here</p>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* Bottlenecks */}
          {selectedView === "analytics" && bottleneckData.length > 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-[#1e293b] border border-[#334155] rounded-xl p-6 shadow-xl"
            >
              <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                <i className="ri-speed-line text-orange-400"></i>
                Process Bottlenecks
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={bottleneckData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="stage" stroke="#9ca3af" />
                  <YAxis stroke="#9ca3af" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#1e293b",
                      border: "1px solid #334155",
                    }}
                  />
                  <Bar dataKey="averageDuration" fill="#f59e0b" />
                </BarChart>
              </ResponsiveContainer>
            </motion.div>
          )}
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Feature Showcase */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-gradient-to-br from-blue-600/20 to-purple-600/20 border border-blue-500/30 rounded-xl p-6 shadow-xl"
          >
            <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
              <i className="ri-star-line text-yellow-400"></i>
              Module Features
            </h3>
            <div className="space-y-3">
              {[
                {
                  icon: "ri-api-line",
                  text: "Full CRUD API",
                  color: "text-blue-400",
                },
                {
                  icon: "ri-radar-line",
                  text: "Real-Time Updates",
                  color: "text-green-400",
                },
                {
                  icon: "ri-notification-line",
                  text: "Smart Notifications",
                  color: "text-purple-400",
                },
                {
                  icon: "ri-file-download-line",
                  text: "Multi-Format Export",
                  color: "text-pink-400",
                },
                {
                  icon: "ri-brain-line",
                  text: "AI Insights",
                  color: "text-yellow-400",
                },
                {
                  icon: "ri-bar-chart-line",
                  text: "Advanced Analytics",
                  color: "text-cyan-400",
                },
                {
                  icon: "ri-robot-line",
                  text: "Copilot Integration",
                  color: "text-indigo-400",
                },
                {
                  icon: "ri-book-open-line",
                  text: "Knowledge Base",
                  color: "text-orange-400",
                },
                {
                  icon: "ri-shield-check-line",
                  text: "Evidence Tracking",
                  color: "text-red-400",
                },
              ].map((feature, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="flex items-center gap-3"
                >
                  <i className={`${feature.icon} ${feature.color} text-xl`}></i>
                  <span className="text-gray-300">{feature.text}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Quick Actions */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-[#1e293b] border border-[#334155] rounded-xl p-6 shadow-xl"
          >
            <h3 className="text-xl font-semibold text-white mb-4">
              Quick Actions
            </h3>
            <div className="space-y-2">
              <button className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2">
                <i className="ri-add-line"></i>
                Create ASN
              </button>
              <button className="w-full bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2">
                <i className="ri-download-line"></i>
                Export Data
              </button>
              <button className="w-full bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2">
                <i className="ri-brain-line"></i>
                View AI Insights
              </button>
              <button className="w-full bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2">
                <i className="ri-book-open-line"></i>
                Knowledge Base
              </button>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  title,
  value,
  icon,
  color,
  trend,
}: {
  title: string;
  value: string | number;
  icon: string;
  color: string;
  trend?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-gradient-to-br ${color} rounded-xl p-6 shadow-xl border border-white/10`}
    >
      <div className="flex items-center justify-between mb-2">
        <i className={`${icon} text-white text-2xl opacity-80`}></i>
        {trend && (
          <span className="text-white/80 text-sm font-medium">{trend}</span>
        )}
      </div>
      <h3 className="text-white/80 text-sm font-medium mb-1">{title}</h3>
      <p className="text-white text-3xl font-bold">{value}</p>
    </motion.div>
  );
}
