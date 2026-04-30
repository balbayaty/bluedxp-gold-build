/**
 * Advanced Process Analytics Dashboard
 * Deep analytics, predictive insights, and AI-powered recommendations
 */

"use client";

import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import {
  processAnalyticsService,
  processOrchestrator,
} from "@/lib/services/process-lifecycle";
import type {
  PredictiveInsight,
  ProcessAnalytics,
} from "@/types/process-lifecycle";
import ErrorBoundary from "@/components/ErrorBoundary";
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
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from "recharts";

export default function ProcessAnalyticsPage() {
  const [loading, setLoading] = useState(true);
  const [selectedEntityType, setSelectedEntityType] =
    useState<string>("SALES_ORDER");
  const [analytics, setAnalytics] = useState<ProcessAnalytics | null>(null);
  const [insights, setInsights] = useState<PredictiveInsight[]>([]);
  const [viewMode, setViewMode] = useState<
    "overview" | "insights" | "trends" | "predictions"
  >("overview");
  const [realTimeEnabled, setRealTimeEnabled] = useState(true);
  const [selectedInsight, setSelectedInsight] = useState<string | null>(null);

  useEffect(() => {
    loadData();
    if (realTimeEnabled) {
      const interval = setInterval(loadData, 15000);
      return () => clearInterval(interval);
    }
  }, [selectedEntityType, realTimeEnabled]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [analyticsData, insightsData] = await Promise.all([
        processAnalyticsService.getProcessAnalytics(selectedEntityType),
        processOrchestrator.getPredictiveInsights("", selectedEntityType),
      ]);
      setAnalytics(analyticsData);
      setInsights(insightsData);
    } catch (error) {
      console.error("Error loading analytics:", error);
    } finally {
      setLoading(false);
    }
  };

  const bottleneckData = useMemo(() => {
    if (!analytics) return [];
    return analytics.bottleneckStages.slice(0, 5).map((stage) => ({
      name: stage.stageName,
      score: stage.bottleneckScore,
      waitTime: Math.floor(stage.averageWaitTime / 60),
    }));
  }, [analytics]);

  const trendData = useMemo(() => {
    if (!analytics) return [];
    return analytics.trends.slice(-14).map((t) => ({
      date: new Date(t.date).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      }),
      instances: t.instances,
      efficiency: t.efficiency,
      duration: Math.floor(t.averageDuration / 3600),
    }));
  }, [analytics]);

  const insightByType = useMemo(() => {
    const counts: Record<string, number> = {};
    insights.forEach((i) => {
      counts[i.type] = (counts[i.type] || 0) + 1;
    });
    return Object.entries(counts).map(([type, count]) => ({
      type,
      value: count,
    }));
  }, [insights]);

  if (loading && !analytics) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <div className="text-[#9ca3af]">Loading Analytics...</div>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary
      fallback={<div className="text-red-400 p-4">Error loading Analytics</div>}
    >
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
                <i className="ri-line-chart-line text-blue-400"></i>
                Process Analytics
              </h1>
              <p className="text-[#9ca3af]">
                Advanced analytics, predictive insights, and AI-powered
                recommendations
              </p>
            </div>
            <div className="flex items-center gap-3">
              <select
                value={selectedEntityType}
                onChange={(e) => setSelectedEntityType(e.target.value)}
                className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-blue-500/50"
              >
                <option value="SALES_ORDER">Sales Orders</option>
                <option value="PURCHASE_ORDER">Purchase Orders</option>
                <option value="ASN">ASNs</option>
                <option value="NCR">NCRs</option>
                <option value="ALL">All Processes</option>
              </select>
              <button
                onClick={() => setRealTimeEnabled(!realTimeEnabled)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  realTimeEnabled
                    ? "bg-green-500/20 text-green-400 border border-green-500/30"
                    : "bg-white/5 text-[#9ca3af] border border-white/10"
                }`}
              >
                <i
                  className={`ri-${realTimeEnabled ? "pause" : "play"}-line mr-2`}
                ></i>
                {realTimeEnabled ? "Live" : "Paused"}
              </button>
            </div>
          </div>

          {/* View Mode Tabs */}
          <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-lg p-1">
            {(["overview", "insights", "trends", "predictions"] as const).map(
              (mode) => (
                <button
                  key={mode}
                  onClick={() => setViewMode(mode)}
                  className={`flex-1 px-4 py-2 rounded text-sm font-medium transition-colors ${
                    viewMode === mode
                      ? "bg-blue-500 text-white"
                      : "text-[#9ca3af] hover:text-white"
                  }`}
                >
                  <i
                    className={`ri-${mode === "overview" ? "dashboard-line" : mode === "insights" ? "lightbulb-line" : mode === "trends" ? "line-chart-line" : "ai-line"} mr-2`}
                  ></i>
                  {mode.charAt(0).toUpperCase() + mode.slice(1)}
                </button>
              ),
            )}
          </div>
        </div>

        {/* Overview Metrics */}
        {viewMode === "overview" && analytics && (
          <div className="space-y-6">
            {/* Key Metrics */}
            <div className="grid md:grid-cols-4 gap-4">
              {[
                {
                  label: "Total Instances",
                  value: analytics.totalInstances,
                  icon: "ri-file-list-line",
                  color: "blue",
                },
                {
                  label: "Active",
                  value: analytics.activeInstances,
                  icon: "ri-loader-4-line",
                  color: "cyan",
                },
                {
                  label: "Avg Efficiency",
                  value: `${analytics.averageEfficiency.toFixed(1)}%`,
                  icon: "ri-speed-line",
                  color: "green",
                },
                {
                  label: "SLA Compliance",
                  value: `${analytics.slaComplianceRate.toFixed(1)}%`,
                  icon: "ri-shield-check-line",
                  color: "yellow",
                },
              ].map((metric, idx) => (
                <motion.div
                  key={metric.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className={`bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-6 hover:border-${metric.color}-500/30 transition-all`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <i
                      className={`ri-${metric.icon} text-${metric.color}-400 text-xl`}
                    ></i>
                    {realTimeEnabled && (
                      <div
                        className={`w-2 h-2 rounded-full bg-${metric.color}-400 animate-pulse`}
                      ></div>
                    )}
                  </div>
                  <div className="text-2xl font-bold text-white mb-1">
                    {metric.value}
                  </div>
                  <div className="text-xs text-[#9ca3af]">{metric.label}</div>
                </motion.div>
              ))}
            </div>

            {/* Charts Grid */}
            <div className="grid md:grid-cols-2 gap-6">
              {/* Bottleneck Analysis */}
              <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
                <h3 className="text-lg font-semibold text-white mb-4">
                  Bottleneck Analysis
                </h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={bottleneckData}>
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
                    />
                    <Bar
                      dataKey="score"
                      fill="#ef4444"
                      name="Bottleneck Score"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Top Variants */}
              <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
                <h3 className="text-lg font-semibold text-white mb-4">
                  Top Process Variants
                </h3>
                <ResponsiveContainer width="100%" height={300}>
                  <ComposedChart data={analytics.topVariants.slice(0, 5)}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="variantId" stroke="#9ca3af" fontSize={10} />
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
                    />
                    <Bar
                      yAxisId="left"
                      dataKey="frequency"
                      fill="#3b82f6"
                      name="Frequency"
                    />
                    <Line
                      yAxisId="right"
                      type="monotone"
                      dataKey="efficiency"
                      stroke="#10b981"
                      strokeWidth={2}
                      name="Efficiency %"
                    />
                    <Legend />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Trends */}
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4">
                Performance Trends (Last 14 Days)
              </h3>
              <ResponsiveContainer width="100%" height={400}>
                <AreaChart data={trendData}>
                  <defs>
                    <linearGradient
                      id="colorEfficiency"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient
                      id="colorInstances"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="date" stroke="#9ca3af" fontSize={12} />
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
                  />
                  <Area
                    yAxisId="left"
                    type="monotone"
                    dataKey="instances"
                    stroke="#3b82f6"
                    fillOpacity={1}
                    fill="url(#colorInstances)"
                    name="Instances"
                  />
                  <Area
                    yAxisId="right"
                    type="monotone"
                    dataKey="efficiency"
                    stroke="#10b981"
                    fillOpacity={1}
                    fill="url(#colorEfficiency)"
                    name="Efficiency %"
                  />
                  <Legend />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Insights View */}
        {viewMode === "insights" && (
          <div className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
                <h3 className="text-lg font-semibold text-white mb-4">
                  Insights by Type
                </h3>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={insightByType}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ type, percent }) =>
                        `${type}: ${(percent * 100).toFixed(0)}%`
                      }
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {insightByType.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={
                            [
                              "#3b82f6",
                              "#10b981",
                              "#f59e0b",
                              "#ef4444",
                              "#8b5cf6",
                            ][index % 5]
                          }
                        />
                      ))}
                    </Pie>
                    <RechartsTooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
                <h3 className="text-lg font-semibold text-white mb-4">
                  Insights Summary
                </h3>
                <div className="space-y-4">
                  {[
                    {
                      type: "bottleneck",
                      count: insights.filter((i) => i.type === "bottleneck")
                        .length,
                      color: "red",
                    },
                    {
                      type: "optimization",
                      count: insights.filter((i) => i.type === "optimization")
                        .length,
                      color: "yellow",
                    },
                    {
                      type: "sla_breach",
                      count: insights.filter((i) => i.type === "sla_breach")
                        .length,
                      color: "orange",
                    },
                    {
                      type: "risk",
                      count: insights.filter((i) => i.type === "risk").length,
                      color: "purple",
                    },
                  ].map((summary) => (
                    <div
                      key={summary.type}
                      className="flex items-center justify-between p-3 bg-white/5 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-10 h-10 rounded-lg bg-${summary.color}-500/20 flex items-center justify-center`}
                        >
                          <i
                            className={`ri-${summary.type === "bottleneck" ? "speed-up-line" : summary.type === "optimization" ? "lightbulb-line" : summary.type === "sla_breach" ? "alarm-warning-line" : "shield-cross-line"} text-${summary.color}-400`}
                          ></i>
                        </div>
                        <div>
                          <div className="text-sm font-semibold text-white capitalize">
                            {summary.type.replace(/_/g, " ")}
                          </div>
                          <div className="text-xs text-[#9ca3af]">
                            Insights detected
                          </div>
                        </div>
                      </div>
                      <div className="text-2xl font-bold text-white">
                        {summary.count}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Insights List */}
            <div className="space-y-3">
              {insights.map((insight, idx) => (
                <motion.div
                  key={insight.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  onClick={() =>
                    setSelectedInsight(
                      selectedInsight === insight.id ? null : insight.id,
                    )
                  }
                  className={`bg-white/5 backdrop-blur-xl border rounded-xl p-6 cursor-pointer transition-all ${
                    selectedInsight === insight.id
                      ? "border-blue-500/50 bg-blue-500/10"
                      : "border-white/10 hover:border-blue-500/30"
                  }`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-start gap-3 flex-1">
                      <div
                        className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                          insight.severity === "critical"
                            ? "bg-red-500/20"
                            : insight.severity === "high"
                              ? "bg-orange-500/20"
                              : "bg-yellow-500/20"
                        }`}
                      >
                        <i
                          className={`ri-${insight.type === "bottleneck" ? "speed-up-line" : insight.type === "optimization" ? "lightbulb-line" : insight.type === "sla_breach" ? "alarm-warning-line" : "shield-cross-line"} text-xl ${
                            insight.severity === "critical"
                              ? "text-red-400"
                              : insight.severity === "high"
                                ? "text-orange-400"
                                : "text-yellow-400"
                          }`}
                        ></i>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="text-lg font-semibold text-white">
                            {insight.title}
                          </h4>
                          <span
                            className={`px-2 py-1 rounded text-xs font-medium ${
                              insight.severity === "critical"
                                ? "bg-red-500/20 text-red-400"
                                : insight.severity === "high"
                                  ? "bg-orange-500/20 text-orange-400"
                                  : "bg-yellow-500/20 text-yellow-400"
                            }`}
                          >
                            {insight.severity.toUpperCase()}
                          </span>
                        </div>
                        <p className="text-sm text-white/80 mb-2">
                          {insight.description}
                        </p>
                        {selectedInsight === insight.id &&
                          insight.recommendations && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: "auto" }}
                              className="mt-3 pt-3 border-t border-white/10"
                            >
                              <div className="text-xs font-semibold text-white mb-2">
                                Recommendations:
                              </div>
                              <ul className="space-y-1">
                                {insight.recommendations.map((rec, i) => (
                                  <li
                                    key={i}
                                    className="text-xs text-white/60 flex items-start gap-2"
                                  >
                                    <i className="ri-checkbox-circle-line text-green-400 mt-0.5"></i>
                                    {rec}
                                  </li>
                                ))}
                              </ul>
                            </motion.div>
                          )}
                      </div>
                    </div>
                    <div className="text-right ml-4">
                      <div className="text-xs text-[#9ca3af] mb-1">
                        Confidence
                      </div>
                      <div className="text-lg font-bold text-white">
                        {insight.confidence}%
                      </div>
                      {insight.actionable && (
                        <button className="mt-2 px-3 py-1 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 border border-blue-500/30 rounded text-xs font-medium transition-colors">
                          Take Action
                        </button>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Trends View */}
        {viewMode === "trends" && analytics && (
          <div className="space-y-6">
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4">
                Efficiency Trend
              </h3>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="date" stroke="#9ca3af" fontSize={12} />
                  <YAxis stroke="#9ca3af" fontSize={12} />
                  <RechartsTooltip
                    contentStyle={{
                      backgroundColor: "#1f2937",
                      border: "1px solid #374151",
                      borderRadius: "8px",
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="efficiency"
                    stroke="#10b981"
                    strokeWidth={3}
                    name="Efficiency %"
                  />
                  <Line
                    type="monotone"
                    dataKey="instances"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    name="Instances"
                  />
                  <Legend />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Predictions View */}
        {viewMode === "predictions" && (
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-purple-500/10 to-blue-600/10 border border-purple-500/30 rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <i className="ri-ai-line text-purple-400 text-2xl"></i>
                <div>
                  <h3 className="text-lg font-semibold text-white">
                    AI-Powered Predictions
                  </h3>
                  <p className="text-sm text-[#9ca3af]">
                    Machine learning predictions based on historical data
                  </p>
                </div>
              </div>
              <div className="grid md:grid-cols-3 gap-4">
                {[
                  {
                    title: "SLA Breach Risk",
                    value: "12%",
                    trend: "down",
                    description:
                      "Predicted risk of SLA breaches in next 7 days",
                  },
                  {
                    title: "Bottleneck Probability",
                    value: "28%",
                    trend: "up",
                    description: "Likelihood of bottlenecks in PICKING stage",
                  },
                  {
                    title: "Efficiency Forecast",
                    value: "94%",
                    trend: "up",
                    description: "Predicted efficiency for next week",
                  },
                ].map((prediction, idx) => (
                  <div
                    key={idx}
                    className="bg-white/5 rounded-lg p-4 border border-white/10"
                  >
                    <div className="text-sm text-[#9ca3af] mb-1">
                      {prediction.title}
                    </div>
                    <div className="flex items-center gap-2 mb-2">
                      <div className="text-2xl font-bold text-white">
                        {prediction.value}
                      </div>
                      <i
                        className={`ri-arrow-${prediction.trend === "up" ? "up" : "down"}-line text-${prediction.trend === "up" ? "green" : "red"}-400`}
                      ></i>
                    </div>
                    <div className="text-xs text-[#9ca3af]">
                      {prediction.description}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </ErrorBoundary>
  );
}
