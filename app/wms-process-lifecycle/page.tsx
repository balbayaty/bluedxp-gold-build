/**
 * WMS Process & Lifecycle Dashboard
 * Comprehensive dashboard for all WMS processes, lifecycles, SLAs, and KPIs
 */

"use client";

import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { wmsSlaKpiService } from "@/lib/services/process-lifecycle/wms/wmsSlaKpiService";
import { wmsLifecycleIntegration } from "@/lib/services/process-lifecycle/wms/wmsLifecycleIntegration";
import { lifecycleService } from "@/lib/services/process-lifecycle/lifecycle/lifecycleService";
import LifecycleView from "@/components/process-lifecycle/lifecycle/LifecycleView";
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
} from "recharts";

export default function WmsProcessLifecyclePage() {
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [selectedEntityType, setSelectedEntityType] = useState<string>("ALL");
  const [selectedEntity, setSelectedEntity] = useState<{
    id: string;
    type: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [realTimeEnabled, setRealTimeEnabled] = useState(true);
  const [viewMode, setViewMode] = useState<
    "overview" | "lifecycles" | "sla" | "kpis" | "analytics"
  >("overview");

  useEffect(() => {
    loadDashboardData();
    if (realTimeEnabled) {
      const interval = setInterval(loadDashboardData, 10000);
      return () => clearInterval(interval);
    }
  }, [realTimeEnabled, selectedEntityType]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [performance, slaMetrics, kpis] = await Promise.all([
        wmsSlaKpiService.getPerformanceDashboard(),
        wmsSlaKpiService.getSlaMetrics(
          selectedEntityType === "ALL"
            ? undefined
            : (selectedEntityType as any),
        ),
        wmsSlaKpiService.getKpis(),
      ]);

      setDashboardData({
        performance,
        slaMetrics,
        kpis,
      });
    } catch (error) {
      console.error("Error loading dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const kpiChartData = useMemo(() => {
    if (!dashboardData?.kpis) return [];
    return dashboardData.kpis.map((kpi: any) => ({
      name: kpi.name,
      value: kpi.value,
      target: kpi.target,
      category: kpi.category,
    }));
  }, [dashboardData?.kpis]);

  const slaChartData = useMemo(() => {
    if (!dashboardData?.slaMetrics) return [];
    return dashboardData.slaMetrics.slice(0, 10).map((metric: any) => ({
      name: metric.stageName.substring(0, 20),
      compliance: metric.complianceRate,
      target: 100,
    }));
  }, [dashboardData?.slaMetrics]);

  if (loading && !dashboardData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-cyan-500 mx-auto mb-4"></div>
          <div className="text-[#9ca3af]">Loading WMS Process Dashboard...</div>
        </div>
      </div>
    );
  }

  if (selectedEntity) {
    return (
      <ErrorBoundary
        fallback={
          <div className="text-red-400 p-4">Error loading Lifecycle</div>
        }
      >
        <div className="container mx-auto px-4 py-8">
          <button
            onClick={() => setSelectedEntity(null)}
            className="mb-4 px-4 py-2 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-lg text-sm font-medium transition-colors"
          >
            <i className="ri-arrow-left-line mr-2"></i>
            Back to Dashboard
          </button>
          <LifecycleView
            entityId={selectedEntity.id}
            entityType={selectedEntity.type as any}
            viewMode="timeline"
            showLayers={["overview", "details", "events", "modules", "ai"]}
            enableRealTime={true}
            enablePredictive={true}
          />
        </div>
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary
      fallback={
        <div className="text-red-400 p-4">
          Error loading WMS Process Dashboard
        </div>
      }
    >
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
                <i className="ri-warehouse-line text-cyan-400"></i>
                WMS Process & Lifecycle Management
              </h1>
              <p className="text-[#9ca3af]">
                Comprehensive process tracking, SLA monitoring, and KPI
                analytics for warehouse operations
              </p>
            </div>
            <div className="flex items-center gap-3">
              <select
                value={selectedEntityType}
                onChange={(e) => setSelectedEntityType(e.target.value)}
                className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-cyan-500/50"
              >
                <option value="ALL">All Processes</option>
                <option value="ASN">ASNs</option>
                <option value="TASK">Tasks</option>
                <option value="PICKING">Picking</option>
                <option value="PUTAWAY">Putaway</option>
                <option value="CYCLE_COUNT">Cycle Count</option>
                <option value="GOODS_RECEIPT">Goods Receipt</option>
                <option value="WAVE">Wave Planning</option>
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
              ["overview", "lifecycles", "sla", "kpis", "analytics"] as const
            ).map((mode) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`flex-1 px-4 py-2 rounded text-sm font-medium transition-colors ${
                  viewMode === mode
                    ? "bg-cyan-500 text-white"
                    : "text-[#9ca3af] hover:text-white"
                }`}
              >
                <i
                  className={`ri-${mode === "overview" ? "dashboard-line" : mode === "lifecycles" ? "flow-chart-line" : mode === "sla" ? "shield-check-line" : mode === "kpis" ? "bar-chart-line" : "line-chart-line"} mr-2`}
                ></i>
                {mode.charAt(0).toUpperCase() + mode.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Overview */}
        {viewMode === "overview" && dashboardData && (
          <div className="space-y-6">
            {/* Key Metrics */}
            <div className="grid md:grid-cols-4 gap-4">
              {[
                {
                  label: "Overall Efficiency",
                  value: `${dashboardData.performance.overallEfficiency.toFixed(1)}%`,
                  icon: "ri-speed-line",
                  color: "cyan",
                },
                {
                  label: "SLA Compliance",
                  value: `${dashboardData.performance.slaCompliance.toFixed(1)}%`,
                  icon: "ri-shield-check-line",
                  color: "green",
                },
                {
                  label: "Active Processes",
                  value: "142",
                  icon: "ri-loader-4-line",
                  color: "blue",
                },
                {
                  label: "Bottlenecks",
                  value:
                    dashboardData.performance.topBottlenecks.length.toString(),
                  icon: "ri-alert-line",
                  color: "red",
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

            {/* KPI Overview */}
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4">
                Key Performance Indicators
              </h3>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {dashboardData.kpis.map((kpi: any, idx: number) => (
                  <motion.div
                    key={kpi.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: idx * 0.05 }}
                    className="bg-white/5 rounded-lg p-4 border border-white/10"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-sm font-semibold text-white">
                        {kpi.name}
                      </div>
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${
                          kpi.status === "on_target"
                            ? "bg-green-500/20 text-green-400"
                            : kpi.status === "at_risk"
                              ? "bg-yellow-500/20 text-yellow-400"
                              : "bg-red-500/20 text-red-400"
                        }`}
                      >
                        {kpi.status.replace("_", " ")}
                      </span>
                    </div>
                    <div className="flex items-baseline gap-2 mb-2">
                      <div className="text-2xl font-bold text-white">
                        {kpi.value}
                      </div>
                      <div className="text-sm text-[#9ca3af]">{kpi.unit}</div>
                    </div>
                    <div className="w-full bg-white/10 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${
                          kpi.status === "on_target"
                            ? "bg-green-500"
                            : kpi.status === "at_risk"
                              ? "bg-yellow-500"
                              : "bg-red-500"
                        }`}
                        style={{
                          width: `${Math.min(100, (kpi.value / kpi.target) * 100)}%`,
                        }}
                      />
                    </div>
                    <div className="text-xs text-[#9ca3af] mt-1">
                      Target: {kpi.target}
                      {kpi.unit}
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Top Bottlenecks */}
            {dashboardData.performance.topBottlenecks.length > 0 && (
              <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <i className="ri-alert-line text-red-400"></i>
                  Top Bottlenecks
                </h3>
                <div className="space-y-3">
                  {dashboardData.performance.topBottlenecks.map(
                    (bottleneck: any, idx: number) => (
                      <div
                        key={idx}
                        className="bg-white/5 rounded-lg p-4 border border-white/10"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="text-sm font-semibold text-white">
                            {bottleneck.stageName}
                          </div>
                          <span
                            className={`px-2 py-1 rounded text-xs font-medium ${
                              bottleneck.impact === "high"
                                ? "bg-red-500/20 text-red-400"
                                : bottleneck.impact === "medium"
                                  ? "bg-yellow-500/20 text-yellow-400"
                                  : "bg-blue-500/20 text-blue-400"
                            }`}
                          >
                            {bottleneck.impact.toUpperCase()}
                          </span>
                        </div>
                        <div className="text-xs text-[#9ca3af]">
                          Average Delay:{" "}
                          {Math.floor(bottleneck.averageDelay / 60)} minutes
                        </div>
                      </div>
                    ),
                  )}
                </div>
              </div>
            )}

            {/* Recommendations */}
            {dashboardData.performance.recommendations.length > 0 && (
              <div className="bg-gradient-to-r from-cyan-500/10 to-blue-600/10 border border-cyan-500/30 rounded-2xl p-6">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <i className="ri-lightbulb-line text-yellow-400"></i>
                  Recommendations
                </h3>
                <div className="space-y-3">
                  {dashboardData.performance.recommendations.map(
                    (rec: any, idx: number) => (
                      <div
                        key={idx}
                        className="bg-white/5 rounded-lg p-4 border border-white/10"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="text-sm font-semibold text-white">
                            {rec.title}
                          </div>
                          <span
                            className={`px-2 py-1 rounded text-xs font-medium ${
                              rec.priority === "high"
                                ? "bg-red-500/20 text-red-400"
                                : rec.priority === "medium"
                                  ? "bg-yellow-500/20 text-yellow-400"
                                  : "bg-blue-500/20 text-blue-400"
                            }`}
                          >
                            {rec.priority.toUpperCase()}
                          </span>
                        </div>
                        <div className="text-xs text-[#9ca3af]">
                          {rec.description}
                        </div>
                      </div>
                    ),
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* SLA View */}
        {viewMode === "sla" && dashboardData && (
          <div className="space-y-6">
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4">
                SLA Compliance Metrics
              </h3>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={slaChartData}>
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
                    dataKey="compliance"
                    fill="#10b981"
                    name="Compliance %"
                  />
                  <Bar dataKey="target" fill="#3b82f6" name="Target" />
                  <Legend />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {dashboardData.slaMetrics.map((metric: any, idx: number) => (
                <div
                  key={idx}
                  className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-6"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <div className="text-sm font-semibold text-white">
                        {metric.stageName}
                      </div>
                      <div className="text-xs text-[#9ca3af]">
                        {metric.entityType}
                      </div>
                    </div>
                    <div
                      className={`text-2xl font-bold ${
                        metric.complianceRate >= 95
                          ? "text-green-400"
                          : metric.complianceRate >= 85
                            ? "text-yellow-400"
                            : "text-red-400"
                      }`}
                    >
                      {metric.complianceRate.toFixed(1)}%
                    </div>
                  </div>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-[#9ca3af]">Target Duration:</span>
                      <span className="text-white">
                        {Math.floor(metric.targetDuration / 60)} min
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#9ca3af]">Average Duration:</span>
                      <span className="text-white">
                        {Math.floor(metric.averageDuration / 60)} min
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#9ca3af]">On Time:</span>
                      <span className="text-green-400">
                        {metric.onTimeCount} / {metric.totalCount}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* KPIs View */}
        {viewMode === "kpis" && dashboardData && (
          <div className="space-y-6">
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4">
                KPI Performance
              </h3>
              <ResponsiveContainer width="100%" height={400}>
                <ComposedChart data={kpiChartData}>
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
                  <Bar dataKey="value" fill="#3b82f6" name="Current Value" />
                  <Line
                    type="monotone"
                    dataKey="target"
                    stroke="#10b981"
                    strokeWidth={2}
                    name="Target"
                  />
                  <Legend />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Quick Links */}
        <div className="mt-6 bg-gradient-to-r from-cyan-500/10 to-blue-600/10 border border-cyan-500/30 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <i className="ri-links-line text-cyan-400 text-xl"></i>
            <h3 className="text-lg font-semibold text-white">
              Quick Access to WMS Modules
            </h3>
          </div>
          <div className="grid md:grid-cols-4 gap-3">
            {[
              { label: "ASNs", href: "/inbound", icon: "ri-inbox-line" },
              { label: "Tasks", href: "/tasks", icon: "ri-task-line" },
              { label: "Picking", href: "/picking", icon: "ri-handbag-line" },
              { label: "Putaway", href: "/putaway", icon: "ri-stack-line" },
              {
                label: "Cycle Count",
                href: "/cycle-counting",
                icon: "ri-file-list-3-line",
              },
              {
                label: "Goods Receipt",
                href: "/goods-receipt",
                icon: "ri-inbox-line",
              },
              {
                label: "Wave Planning",
                href: "/wave-planning",
                icon: "ri-sound-module-line",
              },
              { label: "Inventory", href: "/inventory", icon: "ri-stack-line" },
            ].map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-lg text-sm font-medium transition-colors"
              >
                <i className={`${link.icon} text-cyan-400`}></i>
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
}
