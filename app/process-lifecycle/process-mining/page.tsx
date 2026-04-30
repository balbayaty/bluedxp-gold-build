/**
 * Advanced Process Mining Dashboard
 * Deep process analysis, variant detection, and performance optimization
 */

"use client";

import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import {
  processMiningService,
  processAnalyticsService,
} from "@/lib/services/process-lifecycle";
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
  Sankey,
  Treemap,
} from "recharts";

export default function ProcessMiningPage() {
  const [loading, setLoading] = useState(true);
  const [selectedProcessType, setSelectedProcessType] =
    useState<string>("SALES_ORDER");
  const [variants, setVariants] = useState<any[]>([]);
  const [metrics, setMetrics] = useState<any>(null);
  const [deviations, setDeviations] = useState<any[]>([]);
  const [viewMode, setViewMode] = useState<
    "overview" | "variants" | "deviations" | "performance"
  >("overview");
  const [realTimeEnabled, setRealTimeEnabled] = useState(true);

  useEffect(() => {
    loadData();
    if (realTimeEnabled) {
      const interval = setInterval(loadData, 10000);
      return () => clearInterval(interval);
    }
  }, [selectedProcessType, realTimeEnabled]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [variantData, metricsData] = await Promise.all([
        processMiningService.analyzeVariants(selectedProcessType),
        processMiningService.getPerformanceMetrics(selectedProcessType),
      ]);
      setVariants(variantData);
      setMetrics(metricsData);

      // Get deviations from all cases
      const allCases =
        await processMiningService.getAllCases(selectedProcessType);
      const allDeviations = allCases.flatMap((c) => c.deviations || []);
      setDeviations(allDeviations);
    } catch (error) {
      console.error("Error loading process mining data:", error);
    } finally {
      setLoading(false);
    }
  };

  const variantChartData = useMemo(() => {
    return variants.slice(0, 10).map((v) => ({
      name: v.variantId.substring(0, 20),
      frequency: v.frequency,
      avgDuration: Math.floor(v.averageDuration / 3600),
      efficiency: v.efficiency,
    }));
  }, [variants]);

  const deviationByType = useMemo(() => {
    const counts: Record<string, number> = {};
    deviations.forEach((d) => {
      counts[d.type] = (counts[d.type] || 0) + 1;
    });
    return Object.entries(counts).map(([type, count]) => ({ type, count }));
  }, [deviations]);

  if (loading && !metrics) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-yellow-500 mx-auto mb-4"></div>
          <div className="text-[#9ca3af]">
            Loading Process Mining Analysis...
          </div>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary
      fallback={
        <div className="text-red-400 p-4">Error loading Process Mining</div>
      }
    >
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
                <i className="ri-bar-chart-box-line text-yellow-400"></i>
                Process Mining
              </h1>
              <p className="text-[#9ca3af]">
                Deep process analysis, variant detection, and optimization
                insights
              </p>
            </div>
            <div className="flex items-center gap-3">
              <select
                value={selectedProcessType}
                onChange={(e) => setSelectedProcessType(e.target.value)}
                className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-yellow-500/50"
              >
                <option value="SALES_ORDER">Sales Orders</option>
                <option value="PURCHASE_ORDER">Purchase Orders</option>
                <option value="ASN">ASNs</option>
                <option value="NCR">NCRs</option>
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
            {(
              ["overview", "variants", "deviations", "performance"] as const
            ).map((mode) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`flex-1 px-4 py-2 rounded text-sm font-medium transition-colors ${
                  viewMode === mode
                    ? "bg-yellow-500 text-white"
                    : "text-[#9ca3af] hover:text-white"
                }`}
              >
                <i
                  className={`ri-${mode === "overview" ? "dashboard-line" : mode === "variants" ? "git-branch-line" : mode === "deviations" ? "alert-line" : "speed-line"} mr-2`}
                ></i>
                {mode.charAt(0).toUpperCase() + mode.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Metrics Cards */}
        {viewMode === "overview" && (
          <div className="grid md:grid-cols-4 gap-4 mb-6">
            {[
              {
                label: "Total Cases",
                value: metrics?.totalCases || 0,
                icon: "ri-file-list-line",
                color: "blue",
              },
              {
                label: "Variants",
                value: variants.length,
                icon: "ri-git-branch-line",
                color: "purple",
              },
              {
                label: "Deviations",
                value: deviations.length,
                icon: "ri-alert-line",
                color: "red",
              },
              {
                label: "Avg Efficiency",
                value: `${(metrics?.averageEfficiency || 0).toFixed(1)}%`,
                icon: "ri-speed-line",
                color: "green",
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
        )}

        {/* Variants View */}
        {viewMode === "variants" && (
          <div className="space-y-6">
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4">
                Process Variants
              </h3>
              <ResponsiveContainer width="100%" height={400}>
                <ComposedChart data={variantChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis
                    dataKey="name"
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
                    stroke="#f59e0b"
                    strokeWidth={2}
                    name="Efficiency %"
                  />
                  <Legend />
                </ComposedChart>
              </ResponsiveContainer>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {variants.slice(0, 6).map((variant, idx) => (
                <motion.div
                  key={variant.variantId}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-6"
                >
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-sm font-semibold text-white">
                      Variant {idx + 1}
                    </h4>
                    <span className="px-2 py-1 bg-purple-500/20 text-purple-400 rounded text-xs font-medium">
                      {variant.frequency} cases
                    </span>
                  </div>
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-[#9ca3af]">Frequency:</span>
                      <span className="text-white font-medium">
                        {variant.frequency}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-[#9ca3af]">Avg Duration:</span>
                      <span className="text-white font-medium">
                        {Math.floor(variant.averageDuration / 3600)}h
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-[#9ca3af]">Efficiency:</span>
                      <span className="text-white font-medium">
                        {variant.efficiency.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                  <div className="text-xs text-[#9ca3af]">
                    <div className="font-medium mb-1">Event Sequence:</div>
                    <div className="flex flex-wrap gap-1">
                      {variant.events
                        .slice(0, 5)
                        .map((event: string, i: number) => (
                          <span
                            key={i}
                            className="px-2 py-1 bg-white/5 rounded text-[#9ca3af]"
                          >
                            {event}
                          </span>
                        ))}
                      {variant.events.length > 5 && (
                        <span className="px-2 py-1 bg-white/5 rounded text-[#9ca3af]">
                          +{variant.events.length - 5} more
                        </span>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Deviations View */}
        {viewMode === "deviations" && (
          <div className="space-y-6">
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4">
                Deviation Analysis
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={deviationByType}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="type" stroke="#9ca3af" fontSize={12} />
                  <YAxis stroke="#9ca3af" fontSize={12} />
                  <RechartsTooltip
                    contentStyle={{
                      backgroundColor: "#1f2937",
                      border: "1px solid #374151",
                      borderRadius: "8px",
                    }}
                  />
                  <Bar dataKey="count" fill="#ef4444" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="space-y-3">
              {deviations.slice(0, 10).map((deviation, idx) => (
                <motion.div
                  key={deviation.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className={`bg-white/5 backdrop-blur-xl border rounded-xl p-4 ${
                    deviation.severity === "CRITICAL"
                      ? "border-red-500/30 bg-red-500/10"
                      : deviation.severity === "HIGH"
                        ? "border-orange-500/30 bg-orange-500/10"
                        : "border-yellow-500/30 bg-yellow-500/10"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium ${
                            deviation.severity === "CRITICAL"
                              ? "bg-red-500/20 text-red-400"
                              : deviation.severity === "HIGH"
                                ? "bg-orange-500/20 text-orange-400"
                                : "bg-yellow-500/20 text-yellow-400"
                          }`}
                        >
                          {deviation.severity}
                        </span>
                        <span className="px-2 py-1 bg-white/5 rounded text-xs font-medium text-white">
                          {deviation.type}
                        </span>
                      </div>
                      <p className="text-sm text-white/80">
                        {deviation.description}
                      </p>
                      {deviation.impact && (
                        <div className="mt-2 text-xs text-[#9ca3af]">
                          Impact: {Math.floor(deviation.impact)} hours
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Performance View */}
        {viewMode === "performance" && metrics && (
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4">
                Performance Metrics
              </h3>
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span className="text-[#9ca3af]">Average Duration</span>
                    <span className="text-white font-semibold">
                      {Math.floor(metrics.averageDuration / 3600)}h
                    </span>
                  </div>
                  <div className="w-full bg-white/10 rounded-full h-2">
                    <div
                      className="bg-blue-500 h-2 rounded-full"
                      style={{
                        width: `${Math.min(100, (metrics.averageDuration / 7200) * 100)}%`,
                      }}
                    />
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span className="text-[#9ca3af]">Average Efficiency</span>
                    <span className="text-white font-semibold">
                      {metrics.averageEfficiency.toFixed(1)}%
                    </span>
                  </div>
                  <div className="w-full bg-white/10 rounded-full h-2">
                    <div
                      className="bg-green-500 h-2 rounded-full"
                      style={{ width: `${metrics.averageEfficiency}%` }}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/10">
                  <div>
                    <div className="text-xs text-[#9ca3af] mb-1">
                      Total Deviations
                    </div>
                    <div className="text-xl font-bold text-white">
                      {metrics.totalDeviations}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-[#9ca3af] mb-1">Critical</div>
                    <div className="text-xl font-bold text-red-400">
                      {metrics.criticalDeviations}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4">
                Optimization Recommendations
              </h3>
              <div className="space-y-3">
                {[
                  {
                    title: "Reduce Variant Complexity",
                    description: "Standardize process flow to reduce variants",
                    impact: "High",
                  },
                  {
                    title: "Address Critical Deviations",
                    description: `${metrics.criticalDeviations} critical deviations need attention`,
                    impact: "Critical",
                  },
                  {
                    title: "Improve Average Efficiency",
                    description: `Current: ${metrics.averageEfficiency.toFixed(1)}%, Target: 95%`,
                    impact: "Medium",
                  },
                ].map((rec, idx) => (
                  <div
                    key={idx}
                    className="bg-white/5 rounded-lg p-3 border border-white/10"
                  >
                    <div className="flex items-start justify-between mb-1">
                      <div className="text-sm font-semibold text-white">
                        {rec.title}
                      </div>
                      <span
                        className={`px-2 py-0.5 rounded text-xs font-medium ${
                          rec.impact === "Critical"
                            ? "bg-red-500/20 text-red-400"
                            : rec.impact === "High"
                              ? "bg-orange-500/20 text-orange-400"
                              : "bg-yellow-500/20 text-yellow-400"
                        }`}
                      >
                        {rec.impact}
                      </span>
                    </div>
                    <p className="text-xs text-[#9ca3af]">{rec.description}</p>
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
