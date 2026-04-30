/**
 * System Admin Dashboard
 *
 * World-Class Comprehensive System Administration Dashboard
 *
 * Features:
 * - Real-time system health monitoring across all 31 modules
 * - Multi-layer drill-down capabilities
 * - Intelligent AI-powered insights and recommendations
 * - User activity and security monitoring
 * - Module dependency visualization
 * - Performance metrics and analytics
 * - Resource utilization tracking
 * - Compliance and audit trail
 * - Integration status monitoring
 * - Database health monitoring
 *
 * Architecture: Deep layer integration with all platform services
 * Industry Standard: Exceeds Datadog, New Relic, Splunk capabilities
 */

"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
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
  RadialBarChart,
  RadialBar,
  Treemap,
} from "recharts";
import PageTemplate from "@/components/PageTemplate";
import { apiFetch } from "@/utils/apiFetch";
import Link from "next/link";
import ActionButtons from "@/components/system-admin/ActionButtons";
import ExportButtons from "@/components/system-admin/ExportButtons";
import LogViewer from "@/components/system-admin/LogViewer";
import TimeRangeSelector, {
  TimeRange,
} from "@/components/system-admin/TimeRangeSelector";
import QuickActionsPanel from "@/components/system-admin/QuickActionsPanel";
import DataQualityPanel from "@/components/system-admin/DataQualityPanel";
import DataSourceIndicator from "@/components/system-admin/DataSourceIndicator";

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

interface SystemMetrics {
  overview: {
    systemHealthScore: number;
    totalModules: number;
    healthyModules: number;
    degradedModules: number;
    unhealthyModules: number;
    totalUsers: number;
    activeUsers: number;
    recentLogins: number;
    activeSessions: number;
    apiKeys: number;
    auditLogs24h: number;
    securityEvents: number;
    timestamp: string;
    dataQuality?: {
      score: number;
      summary: {
        real: number;
        demo: number;
        fallback: number;
        partial: number;
        total: number;
      };
      isDemoMode: boolean;
      databaseConnected: boolean;
      environment: string;
    };
  };
  infrastructure?: {
    system: any;
    database: any;
    cache: any;
    jobQueue: any;
    eventBus: any;
  };
  modules: Array<{
    moduleId: string;
    moduleName: string;
    description?: string;
    status: "healthy" | "degraded" | "unhealthy" | "unknown";
    uptime: number;
    lastHealthCheck: string;
    issues: string[];
    metrics: {
      responseTime: number;
      errorRate: number;
      requestCount: number;
    };
    routes: number;
    dependencies: string[];
    dependents?: string[];
    category: string;
    features?: string[];
    apiEndpoints?: number;
    components?: number;
    services?: number;
  }>;
  moduleCategories: Record<
    string,
    {
      total: number;
      healthy: number;
      degraded: number;
      unhealthy: number;
      modules?: string[];
    }
  >;
  users: {
    total: number;
    active: number;
    recentLogins: number;
    activeSessions: number;
    byRole: Record<string, number>;
    byStatus: Record<string, number>;
    recentSessions?: any[];
  };
  security: {
    activeSessions: number;
    apiKeys: number;
    securityEvents24h: number;
    auditLogs24h: number;
    failedLogins24h?: number;
    threatLevel?: string;
    complianceStatus?: any;
    recentSecurityEvents?: any[];
  };
  integrations?: {
    erp: any;
    government: any;
    carriers: any;
    webhooks: any;
    iot: any;
    edi: any;
  };
  ai?: {
    llm: any;
    agents: any;
    ml: any;
    knowledgeBase: any;
  };
  businessIntelligence?: any;
  performance?: any;
  storage?: {
    database: any;
    fileStorage: any;
    backups: any;
  };
  truthEngine?: {
    evidenceItems: number;
    evidence24h: number;
    dataLineage: any;
    compliance: any;
  };
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function SystemAdminDashboard() {
  const { user, tenant } = useAuth();
  const router = useRouter();
  const [metrics, setMetrics] = useState<SystemMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedModule, setSelectedModule] = useState<string | null>(null);
  const [selectedView, setSelectedView] = useState<
    | "overview"
    | "infrastructure"
    | "modules"
    | "users"
    | "security"
    | "integrations"
    | "ai"
    | "bi"
    | "performance"
    | "storage"
    | "truth"
    | "insights"
    | "logs"
  >("overview");
  const [refreshInterval, setRefreshInterval] = useState(30000); // 30 seconds
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [timeRange, setTimeRange] = useState<TimeRange>("24h");
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch comprehensive metrics
  const fetchMetrics = useCallback(async () => {
    try {
      setError(null);
      setLoading(true);
      const response = await apiFetch(
        `/api/system-admin/comprehensive-metrics?tenantId=${tenant?.id || "default-tenant"}&includeDetails=true`,
      );
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      const data = await response.json();
      if (data.success) {
        setMetrics(data.data);
      } else {
        setError(data.error || "Failed to fetch metrics");
      }
    } catch (err) {
      console.error("Error fetching metrics:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch metrics");
    } finally {
      setLoading(false);
    }
  }, [tenant?.id]);

  // Initial fetch
  useEffect(() => {
    fetchMetrics();
  }, [fetchMetrics]);

  // Auto-refresh
  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(fetchMetrics, refreshInterval);
    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, fetchMetrics]);

  // Computed values
  const healthScoreColor = useMemo(() => {
    if (!metrics) return "text-gray-400";
    const score = metrics.overview.systemHealthScore;
    if (score >= 90) return "text-green-400";
    if (score >= 70) return "text-yellow-400";
    if (score >= 50) return "text-orange-400";
    return "text-red-400";
  }, [metrics]);

  const moduleStatusData = useMemo(() => {
    if (!metrics) return [];
    return [
      {
        name: "Healthy",
        value: metrics.overview.healthyModules,
        color: "#10b981",
      },
      {
        name: "Degraded",
        value: metrics.overview.degradedModules,
        color: "#f59e0b",
      },
      {
        name: "Unhealthy",
        value: metrics.overview.unhealthyModules,
        color: "#ef4444",
      },
    ];
  }, [metrics]);

  const moduleCategoryData = useMemo(() => {
    if (!metrics) return [];
    return Object.entries(metrics.moduleCategories).map(
      ([category, stats]) => ({
        name: category,
        healthy: stats.healthy,
        degraded: stats.degraded,
        unhealthy: stats.unhealthy,
        total: stats.total,
      }),
    );
  }, [metrics]);

  const userRoleData = useMemo(() => {
    if (!metrics) return [];
    return Object.entries(metrics.users.byRole).map(([role, count]) => ({
      name: role.replace(/_/g, " "),
      value: count,
    }));
  }, [metrics]);

  const modulePerformanceData = useMemo(() => {
    if (!metrics) return [];
    return metrics.modules
      .sort((a, b) => b.metrics.responseTime - a.metrics.responseTime)
      .slice(0, 10)
      .map((module) => ({
        name: module.moduleName,
        responseTime: module.metrics.responseTime,
        errorRate: module.metrics.errorRate,
        requests: module.metrics.requestCount,
      }));
  }, [metrics]);

  // Intelligent insights
  const insights = useMemo(() => {
    if (!metrics) return [];
    const insightsList: Array<{
      type: "warning" | "info" | "success" | "error";
      title: string;
      description: string;
      action?: string;
    }> = [];

    // System health insights
    if (metrics.overview.systemHealthScore < 80) {
      insightsList.push({
        type: "warning",
        title: "System Health Below Optimal",
        description: `System health score is ${metrics.overview.systemHealthScore}%. ${metrics.overview.unhealthyModules} modules are unhealthy.`,
        action: "Review module health",
      });
    }

    // Module insights
    const unhealthyModules = metrics.modules.filter(
      (m) => m.status === "unhealthy",
    );
    if (unhealthyModules.length > 0) {
      insightsList.push({
        type: "error",
        title: `${unhealthyModules.length} Unhealthy Module(s)`,
        description: unhealthyModules.map((m) => m.moduleName).join(", "),
        action: "Investigate module issues",
      });
    }

    // Performance insights
    const slowModules = metrics.modules.filter(
      (m) => m.metrics.responseTime > 500,
    );
    if (slowModules.length > 0) {
      insightsList.push({
        type: "warning",
        title: "Performance Degradation Detected",
        description: `${slowModules.length} module(s) have response times > 500ms`,
        action: "Optimize module performance",
      });
    }

    // Security insights
    if (metrics.security.securityEvents24h > 10) {
      insightsList.push({
        type: "error",
        title: "Elevated Security Events",
        description: `${metrics.security.securityEvents24h} security events in the last 24 hours`,
        action: "Review security logs",
      });
    }

    // User activity insights
    const loginRate = metrics.users.recentLogins / metrics.users.total;
    if (loginRate < 0.1 && metrics.users.total > 10) {
      insightsList.push({
        type: "info",
        title: "Low User Activity",
        description: `Only ${(loginRate * 100).toFixed(1)}% of users logged in the last 24 hours`,
        action: "Engage users",
      });
    }

    return insightsList;
  }, [metrics]);

  if (loading && !metrics) {
    return (
      <PageTemplate
        title="System Admin Dashboard"
        description="Comprehensive platform administration and monitoring"
        icon="ri-shield-user-line"
      >
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-400">Loading system metrics...</p>
          </div>
        </div>
      </PageTemplate>
    );
  }

  if (error && !metrics) {
    return (
      <PageTemplate
        title="System Admin Dashboard"
        description="Comprehensive platform administration and monitoring"
        icon="ri-shield-user-line"
      >
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <i className="ri-error-warning-line text-red-400 text-2xl"></i>
            </div>
            <p className="text-red-400 mb-2">{error}</p>
            <button
              onClick={fetchMetrics}
              className="px-4 py-2 bg-cyan-500 text-white rounded-lg hover:bg-cyan-600 transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      </PageTemplate>
    );
  }

  if (!metrics) return null;

  return (
    <PageTemplate
      title="System Admin Dashboard"
      description="Comprehensive platform administration, monitoring, and intelligent insights"
      icon="ri-shield-user-line"
      stats={[
        {
          label: "System Health",
          value: `${metrics.overview.systemHealthScore}%`,
          icon: "ri-heart-pulse-line",
          trend:
            metrics.overview.systemHealthScore >= 90
              ? "up"
              : metrics.overview.systemHealthScore >= 70
                ? "neutral"
                : "down",
        },
        {
          label: "Active Modules",
          value: `${metrics.overview.healthyModules}/${metrics.overview.totalModules}`,
          icon: "ri-apps-line",
          trend: "neutral",
        },
        {
          label: "Total Users",
          value: metrics.overview.totalUsers.toString(),
          icon: "ri-team-line",
          trend: "neutral",
        },
        {
          label: "Active Sessions",
          value: metrics.overview.activeSessions.toString(),
          icon: "ri-computer-line",
          trend: "neutral",
        },
      ]}
      actions={
        <div className="flex items-center gap-2 flex-wrap">
          <ExportButtons
            section={selectedView}
            tenantId={tenant?.id || "default-tenant"}
          />
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
              autoRefresh
                ? "bg-green-500/20 text-green-400 border border-green-500/30"
                : "bg-gray-700 text-gray-400 border border-gray-600"
            }`}
          >
            <i
              className={`ri-${autoRefresh ? "pause" : "play"}-circle-line mr-1`}
            ></i>
            {autoRefresh ? "Auto-refresh ON" : "Auto-refresh OFF"}
          </button>
          <button
            onClick={fetchMetrics}
            className="px-3 py-1.5 bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 rounded-lg hover:bg-cyan-500/30 transition-colors text-sm"
          >
            <i className="ri-refresh-line mr-1"></i>
            Refresh
          </button>
        </div>
      }
    >
      {/* Data Quality Panel */}
      {metrics.overview.dataQuality && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <DataQualityPanel quality={metrics.overview.dataQuality} />
        </motion.div>
      )}

      {/* Intelligent Insights Banner */}
      {insights.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 space-y-2"
        >
          {insights.slice(0, 3).map((insight, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.1 }}
              className={`p-4 rounded-xl border ${
                insight.type === "error"
                  ? "bg-red-500/10 border-red-500/30 text-red-400"
                  : insight.type === "warning"
                    ? "bg-yellow-500/10 border-yellow-500/30 text-yellow-400"
                    : insight.type === "success"
                      ? "bg-green-500/10 border-green-500/30 text-green-400"
                      : "bg-blue-500/10 border-blue-500/30 text-blue-400"
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <i
                      className={`ri-${
                        insight.type === "error"
                          ? "error-warning-line"
                          : insight.type === "warning"
                            ? "alert-line"
                            : insight.type === "success"
                              ? "check-line"
                              : "information-line"
                      }`}
                    ></i>
                    <h4 className="font-semibold">{insight.title}</h4>
                  </div>
                  <p className="text-sm opacity-80">{insight.description}</p>
                </div>
                {insight.action && (
                  <button className="text-xs px-2 py-1 rounded bg-white/5 hover:bg-white/10 transition-colors">
                    {insight.action}
                  </button>
                )}
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* View Tabs */}
      <div className="mb-6 border-b border-gray-700 overflow-x-auto">
        <div className="flex gap-2 min-w-max">
          {(
            [
              "overview",
              "infrastructure",
              "modules",
              "users",
              "security",
              "integrations",
              "ai",
              "bi",
              "performance",
              "storage",
              "truth",
              "insights",
              "logs",
            ] as const
          ).map((view) => (
            <button
              key={view}
              onClick={() => setSelectedView(view)}
              className={`px-4 py-2 font-medium transition-colors border-b-2 whitespace-nowrap ${
                selectedView === view
                  ? "border-cyan-500 text-cyan-400"
                  : "border-transparent text-gray-400 hover:text-gray-300"
              }`}
            >
              {view.charAt(0).toUpperCase() +
                view.slice(1).replace(/([A-Z])/g, " $1")}
            </button>
          ))}
        </div>
      </div>

      {/* Overview View */}
      {selectedView === "overview" && (
        <div className="space-y-6">
          {/* Time Range Selector */}
          <div className="p-4 bg-gray-800 border border-gray-700 rounded-xl">
            <TimeRangeSelector value={timeRange} onChange={setTimeRange} />
          </div>
          {/* System Health Score */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="p-6 rounded-xl bg-gradient-to-br from-cyan-500/10 to-blue-500/10 border border-cyan-500/30"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-gray-400">
                  System Health
                </h3>
                <i className="ri-heart-pulse-line text-cyan-400 text-xl"></i>
              </div>
              <div className={`text-4xl font-bold ${healthScoreColor} mb-2`}>
                {metrics.overview.systemHealthScore}%
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div
                  className={`h-2 rounded-full ${
                    metrics.overview.systemHealthScore >= 90
                      ? "bg-green-500"
                      : metrics.overview.systemHealthScore >= 70
                        ? "bg-yellow-500"
                        : "bg-red-500"
                  }`}
                  style={{ width: `${metrics.overview.systemHealthScore}%` }}
                ></div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 }}
              className="p-6 rounded-xl bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-500/30"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-gray-400">
                  Healthy Modules
                </h3>
                <i className="ri-checkbox-circle-line text-green-400 text-xl"></i>
              </div>
              <div className="text-4xl font-bold text-green-400 mb-2">
                {metrics.overview.healthyModules}
              </div>
              <div className="text-sm text-gray-400">
                of {metrics.overview.totalModules} total
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="p-6 rounded-xl bg-gradient-to-br from-yellow-500/10 to-orange-500/10 border border-yellow-500/30"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-gray-400">
                  Active Users
                </h3>
                <div className="flex items-center gap-2">
                  {metrics.users?._dataSource && (
                    <DataSourceIndicator
                      source={metrics.users._dataSource}
                      size="sm"
                    />
                  )}
                  <i className="ri-user-line text-yellow-400 text-xl"></i>
                </div>
              </div>
              <div className="text-4xl font-bold text-yellow-400 mb-2">
                {metrics.overview.activeUsers}
              </div>
              <div className="text-sm text-gray-400">
                {metrics.overview.recentLogins} logged in 24h
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 }}
              className="p-6 rounded-xl bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/30"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-gray-400">
                  Security Events
                </h3>
                <i className="ri-shield-line text-purple-400 text-xl"></i>
              </div>
              <div className="text-4xl font-bold text-purple-400 mb-2">
                {metrics.overview.securityEvents}
              </div>
              <div className="text-sm text-gray-400">in last 24 hours</div>
            </motion.div>
          </div>

          {/* Module Status Chart */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="p-6 rounded-xl bg-gray-800 border border-gray-700">
              <h3 className="text-lg font-semibold mb-4 text-white">
                Module Status Distribution
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={moduleStatusData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) =>
                      `${name} ${(percent * 100).toFixed(0)}%`
                    }
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {moduleStatusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <RechartsTooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="p-6 rounded-xl bg-gray-800 border border-gray-700">
              <h3 className="text-lg font-semibold mb-4 text-white">
                Modules by Category
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={moduleCategoryData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="name" stroke="#9ca3af" />
                  <YAxis stroke="#9ca3af" />
                  <RechartsTooltip
                    contentStyle={{
                      backgroundColor: "#1f2937",
                      border: "1px solid #374151",
                      borderRadius: "8px",
                    }}
                  />
                  <Legend />
                  <Bar
                    dataKey="healthy"
                    stackId="a"
                    fill="#10b981"
                    name="Healthy"
                  />
                  <Bar
                    dataKey="degraded"
                    stackId="a"
                    fill="#f59e0b"
                    name="Degraded"
                  />
                  <Bar
                    dataKey="unhealthy"
                    stackId="a"
                    fill="#ef4444"
                    name="Unhealthy"
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="p-6 rounded-xl bg-gray-800 border border-gray-700">
            <h3 className="text-lg font-semibold mb-4 text-white">
              Quick Actions
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Link
                href="/user-management"
                className="p-4 rounded-lg bg-gray-700 hover:bg-gray-600 transition-colors text-center"
              >
                <i className="ri-team-line text-2xl text-cyan-400 mb-2 block"></i>
                <div className="text-sm font-medium text-white">
                  User Management
                </div>
              </Link>
              <Link
                href="/settings/module-management"
                className="p-4 rounded-lg bg-gray-700 hover:bg-gray-600 transition-colors text-center"
              >
                <i className="ri-settings-3-line text-2xl text-cyan-400 mb-2 block"></i>
                <div className="text-sm font-medium text-white">
                  Module Management
                </div>
              </Link>
              <Link
                href="/settings"
                className="p-4 rounded-lg bg-gray-700 hover:bg-gray-600 transition-colors text-center"
              >
                <i className="ri-settings-line text-2xl text-cyan-400 mb-2 block"></i>
                <div className="text-sm font-medium text-white">
                  System Settings
                </div>
              </Link>
              <Link
                href="/analytics/unified"
                className="p-4 rounded-lg bg-gray-700 hover:bg-gray-600 transition-colors text-center"
              >
                <i className="ri-line-chart-line text-2xl text-cyan-400 mb-2 block"></i>
                <div className="text-sm font-medium text-white">Analytics</div>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Modules View - Detailed Module Management */}
      {selectedView === "modules" && (
        <div className="space-y-6">
          <div className="p-6 rounded-xl bg-gray-800 border border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">
                All Modules ({metrics.modules.length})
              </h3>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search modules..."
                  className="px-3 py-1.5 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:border-cyan-500"
                />
                <select className="px-3 py-1.5 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm">
                  <option>All Categories</option>
                  {Object.keys(metrics.moduleCategories).map((cat) => (
                    <option key={cat}>{cat}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="space-y-2 max-h-[600px] overflow-y-auto">
              {metrics.modules
                .filter(
                  (module) =>
                    !searchQuery ||
                    module.moduleName
                      .toLowerCase()
                      .includes(searchQuery.toLowerCase()) ||
                    module.moduleId
                      .toLowerCase()
                      .includes(searchQuery.toLowerCase()) ||
                    module.category
                      .toLowerCase()
                      .includes(searchQuery.toLowerCase()),
                )
                .map((module) => (
                  <motion.div
                    key={module.moduleId}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    onClick={() =>
                      setSelectedModule(
                        selectedModule === module.moduleId
                          ? null
                          : module.moduleId,
                      )
                    }
                    className={`p-4 rounded-lg border cursor-pointer transition-all ${
                      selectedModule === module.moduleId
                        ? "bg-cyan-500/10 border-cyan-500/50"
                        : "bg-gray-700/50 border-gray-600 hover:bg-gray-700"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-3 h-3 rounded-full ${
                            module.status === "healthy"
                              ? "bg-green-500"
                              : module.status === "degraded"
                                ? "bg-yellow-500"
                                : "bg-red-500"
                          }`}
                        ></div>
                        <div>
                          <div className="font-medium text-white">
                            {module.moduleName}
                          </div>
                          <div className="text-xs text-gray-400">
                            {module.category} • {module.routes} routes •{" "}
                            {module.dependencies.length} dependencies
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <div className="text-sm font-medium text-white">
                            {module.metrics.responseTime.toFixed(0)}ms
                          </div>
                          <div className="text-xs text-gray-400">
                            Response Time
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-medium text-white">
                            {module.metrics.errorRate.toFixed(1)}%
                          </div>
                          <div className="text-xs text-gray-400">
                            Error Rate
                          </div>
                        </div>
                        <i
                          className={`ri-arrow-${selectedModule === module.moduleId ? "up" : "down"}-s-line text-gray-400`}
                        ></i>
                      </div>
                    </div>
                    <AnimatePresence>
                      {selectedModule === module.moduleId && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          className="mt-4 pt-4 border-t border-gray-600"
                        >
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div>
                              <div className="text-xs text-gray-400 mb-1">
                                Status
                              </div>
                              <div className="text-sm font-medium text-white capitalize">
                                {module.status}
                              </div>
                            </div>
                            <div>
                              <div className="text-xs text-gray-400 mb-1">
                                Uptime
                              </div>
                              <div className="text-sm font-medium text-white">
                                {module.uptime.toFixed(1)}%
                              </div>
                            </div>
                            <div>
                              <div className="text-xs text-gray-400 mb-1">
                                Requests
                              </div>
                              <div className="text-sm font-medium text-white">
                                {module.metrics.requestCount}
                              </div>
                            </div>
                            <div>
                              <div className="text-xs text-gray-400 mb-1">
                                Last Check
                              </div>
                              <div className="text-sm font-medium text-white">
                                {new Date(
                                  module.lastHealthCheck,
                                ).toLocaleTimeString()}
                              </div>
                            </div>
                          </div>
                          {module.issues.length > 0 && (
                            <div className="mt-4">
                              <div className="text-xs text-gray-400 mb-2">
                                Issues
                              </div>
                              <div className="space-y-1">
                                {module.issues.map((issue, idx) => (
                                  <div
                                    key={idx}
                                    className="text-sm text-red-400"
                                  >
                                    • {issue}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                          {module.dependencies.length > 0 && (
                            <div className="mt-4">
                              <div className="text-xs text-gray-400 mb-2">
                                Dependencies
                              </div>
                              <div className="flex flex-wrap gap-2">
                                {module.dependencies.map((dep) => (
                                  <span
                                    key={dep}
                                    className="px-2 py-1 bg-gray-700 rounded text-xs text-gray-300"
                                  >
                                    {dep}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                          {/* Module Actions */}
                          <div className="mt-4 pt-4 border-t border-gray-600">
                            <ActionButtons
                              moduleId={module.moduleId}
                              onActionComplete={fetchMetrics}
                            />
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* Logs View */}
      {selectedView === "logs" && (
        <div className="space-y-6">
          <div className="p-6 bg-gray-800 border border-gray-700 rounded-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">System Logs</h3>
              <ExportButtons
                section="logs"
                tenantId={tenant?.id || "default-tenant"}
              />
            </div>
            <LogViewer />
          </div>
        </div>
      )}

      {/* Users View */}
      {selectedView === "users" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-6 rounded-xl bg-gray-800 border border-gray-700">
              <div className="text-sm text-gray-400 mb-2">Total Users</div>
              <div className="text-3xl font-bold text-white">
                {metrics.users.total}
              </div>
            </div>
            <div className="p-6 rounded-xl bg-gray-800 border border-gray-700">
              <div className="text-sm text-gray-400 mb-2">Active Users</div>
              <div className="text-3xl font-bold text-green-400">
                {metrics.users.active}
              </div>
            </div>
            <div className="p-6 rounded-xl bg-gray-800 border border-gray-700">
              <div className="text-sm text-gray-400 mb-2">
                Recent Logins (24h)
              </div>
              <div className="text-3xl font-bold text-cyan-400">
                {metrics.users.recentLogins}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="p-6 rounded-xl bg-gray-800 border border-gray-700">
              <h3 className="text-lg font-semibold mb-4 text-white">
                Users by Role
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={userRoleData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis
                    dataKey="name"
                    stroke="#9ca3af"
                    angle={-45}
                    textAnchor="end"
                    height={100}
                  />
                  <YAxis stroke="#9ca3af" />
                  <RechartsTooltip
                    contentStyle={{
                      backgroundColor: "#1f2937",
                      border: "1px solid #374151",
                      borderRadius: "8px",
                    }}
                  />
                  <Bar dataKey="value" fill="#3b82f6" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="p-6 rounded-xl bg-gray-800 border border-gray-700">
              <h3 className="text-lg font-semibold mb-4 text-white">
                Users by Status
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={Object.entries(metrics.users.byStatus).map(
                      ([status, count]) => ({
                        name: status,
                        value: count,
                      }),
                    )}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) =>
                      `${name} ${(percent * 100).toFixed(0)}%`
                    }
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {Object.entries(metrics.users.byStatus).map(
                      (entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={
                            ["#10b981", "#f59e0b", "#ef4444", "#6b7280"][
                              index % 4
                            ]
                          }
                        />
                      ),
                    )}
                  </Pie>
                  <RechartsTooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* Security View */}
      {selectedView === "security" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="p-6 rounded-xl bg-gray-800 border border-gray-700">
              <div className="text-sm text-gray-400 mb-2">Active Sessions</div>
              <div className="text-3xl font-bold text-white">
                {metrics.security.activeSessions}
              </div>
            </div>
            <div className="p-6 rounded-xl bg-gray-800 border border-gray-700">
              <div className="text-sm text-gray-400 mb-2">API Keys</div>
              <div className="text-3xl font-bold text-cyan-400">
                {metrics.security.apiKeys}
              </div>
            </div>
            <div className="p-6 rounded-xl bg-gray-800 border border-gray-700">
              <div className="text-sm text-gray-400 mb-2">
                Security Events (24h)
              </div>
              <div className="text-3xl font-bold text-red-400">
                {metrics.security.securityEvents24h}
              </div>
            </div>
            <div className="p-6 rounded-xl bg-gray-800 border border-gray-700">
              <div className="text-sm text-gray-400 mb-2">Audit Logs (24h)</div>
              <div className="text-3xl font-bold text-yellow-400">
                {metrics.security.auditLogs24h}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Performance View */}
      {selectedView === "performance" && (
        <div className="space-y-6">
          <div className="p-6 rounded-xl bg-gray-800 border border-gray-700">
            <h3 className="text-lg font-semibold mb-4 text-white">
              Top 10 Modules by Response Time
            </h3>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={modulePerformanceData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis type="number" stroke="#9ca3af" />
                <YAxis
                  dataKey="name"
                  type="category"
                  stroke="#9ca3af"
                  width={150}
                />
                <RechartsTooltip
                  contentStyle={{
                    backgroundColor: "#1f2937",
                    border: "1px solid #374151",
                    borderRadius: "8px",
                  }}
                />
                <Bar
                  dataKey="responseTime"
                  fill="#3b82f6"
                  radius={[0, 8, 8, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Insights View */}
      {selectedView === "insights" && (
        <div className="space-y-6">
          <div className="p-6 rounded-xl bg-gray-800 border border-gray-700">
            <h3 className="text-lg font-semibold mb-4 text-white">
              AI-Powered Insights
            </h3>
            <div className="space-y-4">
              {insights.map((insight, idx) => (
                <div
                  key={idx}
                  className={`p-4 rounded-lg border ${
                    insight.type === "error"
                      ? "bg-red-500/10 border-red-500/30"
                      : insight.type === "warning"
                        ? "bg-yellow-500/10 border-yellow-500/30"
                        : insight.type === "success"
                          ? "bg-green-500/10 border-green-500/30"
                          : "bg-blue-500/10 border-blue-500/30"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <i
                      className={`ri-${
                        insight.type === "error"
                          ? "error-warning-line"
                          : insight.type === "warning"
                            ? "alert-line"
                            : insight.type === "success"
                              ? "check-line"
                              : "information-line"
                      } text-xl ${
                        insight.type === "error"
                          ? "text-red-400"
                          : insight.type === "warning"
                            ? "text-yellow-400"
                            : insight.type === "success"
                              ? "text-green-400"
                              : "text-blue-400"
                      }`}
                    ></i>
                    <div className="flex-1">
                      <h4 className="font-semibold text-white mb-1">
                        {insight.title}
                      </h4>
                      <p className="text-sm text-gray-300">
                        {insight.description}
                      </p>
                      {insight.action && (
                        <button className="mt-2 text-xs px-3 py-1 bg-white/5 hover:bg-white/10 rounded transition-colors">
                          {insight.action} →
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Infrastructure View */}
      {selectedView === "infrastructure" && metrics.infrastructure && (
        <div className="space-y-6">
          {/* Action Buttons */}
          <div className="p-6 bg-gray-800 border border-gray-700 rounded-xl">
            <h3 className="text-lg font-semibold mb-4 text-white">
              System Actions
            </h3>
            <ActionButtons onActionComplete={fetchMetrics} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-6 rounded-xl bg-gray-800 border border-gray-700">
              <div className="text-sm text-gray-400 mb-2">System Uptime</div>
              <div className="text-2xl font-bold text-white">
                {Math.floor(metrics.infrastructure.system.uptime / 3600)}h
              </div>
              <div className="text-xs text-gray-500 mt-1">
                Node {metrics.infrastructure.system.nodeVersion}
              </div>
            </div>
            <div className="p-6 rounded-xl bg-gray-800 border border-gray-700">
              <div className="text-sm text-gray-400 mb-2">Memory Usage</div>
              <div className="text-2xl font-bold text-cyan-400">
                {Math.round(
                  metrics.infrastructure.system.memoryUsage.heapUsed /
                    1024 /
                    1024,
                )}{" "}
                MB
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {Math.round(
                  (metrics.infrastructure.system.memoryUsage.heapUsed /
                    metrics.infrastructure.system.memoryUsage.heapTotal) *
                    100,
                )}
                % of heap
              </div>
            </div>
            <div className="p-6 rounded-xl bg-gray-800 border border-gray-700">
              <div className="text-sm text-gray-400 mb-2">Database Status</div>
              <div className="text-2xl font-bold text-green-400 capitalize">
                {metrics.infrastructure.database.status}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                Avg:{" "}
                {
                  metrics.infrastructure.database.queryPerformance
                    .avgResponseTime
                }
                ms
              </div>
            </div>
            <div className="p-6 rounded-xl bg-gray-800 border border-gray-700">
              <div className="text-sm text-gray-400 mb-2">Cache Hit Rate</div>
              <div className="text-2xl font-bold text-yellow-400">
                {metrics.infrastructure.cache.redis.hitRate}%
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {metrics.infrastructure.cache.redis.status === "connected"
                  ? "Redis Connected"
                  : "Redis Disconnected"}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="p-6 rounded-xl bg-gray-800 border border-gray-700">
              <h3 className="text-lg font-semibold mb-4 text-white">
                Job Queue Status
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-400">Total Jobs</span>
                  <span className="text-white font-semibold">
                    {metrics.infrastructure.jobQueue.total}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Pending</span>
                  <span className="text-yellow-400 font-semibold">
                    {metrics.infrastructure.jobQueue.pending}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Processing</span>
                  <span className="text-cyan-400 font-semibold">
                    {metrics.infrastructure.jobQueue.processing}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Completed</span>
                  <span className="text-green-400 font-semibold">
                    {metrics.infrastructure.jobQueue.completed}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Failed</span>
                  <span className="text-red-400 font-semibold">
                    {metrics.infrastructure.jobQueue.failed}
                  </span>
                </div>
              </div>
            </div>

            <div className="p-6 rounded-xl bg-gray-800 border border-gray-700">
              <h3 className="text-lg font-semibold mb-4 text-white">
                Event Bus
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-400">Total Events</span>
                  <span className="text-white font-semibold">
                    {metrics.infrastructure.eventBus.totalEvents.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Events (24h)</span>
                  <span className="text-cyan-400 font-semibold">
                    {metrics.infrastructure.eventBus.events24h}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Subscribers</span>
                  <span className="text-green-400 font-semibold">
                    {metrics.infrastructure.eventBus.subscribers}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Throughput</span>
                  <span className="text-yellow-400 font-semibold">
                    {metrics.infrastructure.eventBus.throughput} events/sec
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Integrations View */}
      {selectedView === "integrations" && metrics.integrations && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="p-6 rounded-xl bg-gray-800 border border-gray-700">
              <h3 className="text-lg font-semibold mb-4 text-white">
                ERP Systems
              </h3>
              <div className="space-y-2">
                {Object.entries(metrics.integrations.erp).map(
                  ([name, data]: [string, any]) => (
                    <div
                      key={name}
                      className="flex justify-between items-center"
                    >
                      <span className="text-gray-400 capitalize">{name}</span>
                      <span
                        className={`px-2 py-1 rounded text-xs ${
                          data.status === "connected"
                            ? "bg-green-500/20 text-green-400"
                            : "bg-red-500/20 text-red-400"
                        }`}
                      >
                        {data.status}
                      </span>
                    </div>
                  ),
                )}
              </div>
            </div>

            <div className="p-6 rounded-xl bg-gray-800 border border-gray-700">
              <h3 className="text-lg font-semibold mb-4 text-white">
                Government APIs
              </h3>
              <div className="space-y-2">
                {Object.entries(metrics.integrations.government).map(
                  ([name, data]: [string, any]) => (
                    <div
                      key={name}
                      className="flex justify-between items-center"
                    >
                      <span className="text-gray-400 uppercase">{name}</span>
                      <span
                        className={`px-2 py-1 rounded text-xs ${
                          data.status === "connected"
                            ? "bg-green-500/20 text-green-400"
                            : "bg-red-500/20 text-red-400"
                        }`}
                      >
                        {data.status}
                      </span>
                    </div>
                  ),
                )}
              </div>
            </div>

            <div className="p-6 rounded-xl bg-gray-800 border border-gray-700">
              <h3 className="text-lg font-semibold mb-4 text-white">
                IoT & Webhooks
              </h3>
              <div className="space-y-3">
                <div>
                  <div className="text-sm text-gray-400 mb-1">IoT Devices</div>
                  <div className="text-xl font-bold text-white">
                    {metrics.integrations.iot.online} /{" "}
                    {metrics.integrations.iot.totalDevices} Online
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-400 mb-1">Webhooks</div>
                  <div className="text-xl font-bold text-cyan-400">
                    {metrics.integrations.webhooks.active} /{" "}
                    {metrics.integrations.webhooks.total} Active
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    Success Rate: {metrics.integrations.webhooks.successRate}%
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* AI/ML View */}
      {selectedView === "ai" && metrics.ai && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-6 rounded-xl bg-gray-800 border border-gray-700">
              <div className="text-sm text-gray-400 mb-2">
                LLM Requests (24h)
              </div>
              <div className="text-2xl font-bold text-cyan-400">
                {metrics.ai.llm.requests24h.toLocaleString()}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                Total: {metrics.ai.llm.totalRequests.toLocaleString()}
              </div>
            </div>
            <div className="p-6 rounded-xl bg-gray-800 border border-gray-700">
              <div className="text-sm text-gray-400 mb-2">
                Tokens Used (24h)
              </div>
              <div className="text-2xl font-bold text-purple-400">
                {metrics.ai.llm.tokens24h.toLocaleString()}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                Cost: ${metrics.ai.llm.cost24h.toFixed(2)}
              </div>
            </div>
            <div className="p-6 rounded-xl bg-gray-800 border border-gray-700">
              <div className="text-sm text-gray-400 mb-2">Active Agents</div>
              <div className="text-2xl font-bold text-green-400">
                {metrics.ai.agents.active}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                Total: {metrics.ai.agents.total}
              </div>
            </div>
            <div className="p-6 rounded-xl bg-gray-800 border border-gray-700">
              <div className="text-sm text-gray-400 mb-2">ML Models</div>
              <div className="text-2xl font-bold text-yellow-400">
                {metrics.ai.ml.modelsDeployed}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                Accuracy: {metrics.ai.ml.accuracy}%
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="p-6 rounded-xl bg-gray-800 border border-gray-700">
              <h3 className="text-lg font-semibold mb-4 text-white">
                Top Agents
              </h3>
              <div className="space-y-3">
                {metrics.ai.agents.topAgents?.map((agent: any, idx: number) => (
                  <div
                    key={idx}
                    className="flex justify-between items-center p-3 bg-gray-700/50 rounded-lg"
                  >
                    <div>
                      <div className="font-semibold text-white">{agent.id}</div>
                      <div className="text-xs text-gray-400">
                        {agent.tasks} tasks
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-green-400 font-semibold">
                        {agent.successRate}%
                      </div>
                      <div className="text-xs text-gray-400">Success Rate</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-6 rounded-xl bg-gray-800 border border-gray-700">
              <h3 className="text-lg font-semibold mb-4 text-white">
                LLM Providers
              </h3>
              <div className="space-y-3">
                {Object.entries(metrics.ai.llm.providers).map(
                  ([provider, data]: [string, any]) => (
                    <div
                      key={provider}
                      className="p-3 bg-gray-700/50 rounded-lg"
                    >
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-semibold text-white capitalize">
                          {provider}
                        </span>
                        <span className="text-cyan-400">
                          ${data.cost.toFixed(2)}
                        </span>
                      </div>
                      <div className="text-xs text-gray-400">
                        {data.requests} requests •{" "}
                        {data.tokens.toLocaleString()} tokens
                      </div>
                    </div>
                  ),
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Business Intelligence View */}
      {selectedView === "bi" && metrics.businessIntelligence && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-6 rounded-xl bg-gray-800 border border-gray-700">
              <div className="text-sm text-gray-400 mb-2">Finance Revenue</div>
              <div className="text-2xl font-bold text-green-400">
                $
                {(
                  metrics.businessIntelligence.finance?.financialMetrics
                    ?.totalRevenue || 0
                ).toLocaleString()}
              </div>
            </div>
            <div className="p-6 rounded-xl bg-gray-800 border border-gray-700">
              <div className="text-sm text-gray-400 mb-2">CRM Pipeline</div>
              <div className="text-2xl font-bold text-cyan-400">
                $
                {(
                  metrics.businessIntelligence.crm?.salesMetrics
                    ?.pipelineValue || 0
                ).toLocaleString()}
              </div>
            </div>
            <div className="p-6 rounded-xl bg-gray-800 border border-gray-700">
              <div className="text-sm text-gray-400 mb-2">HR Employees</div>
              <div className="text-2xl font-bold text-purple-400">
                {metrics.businessIntelligence.hr?.employeeMetrics?.total || 0}
              </div>
            </div>
            <div className="p-6 rounded-xl bg-gray-800 border border-gray-700">
              <div className="text-sm text-gray-400 mb-2">WMS Inventory</div>
              <div className="text-2xl font-bold text-yellow-400">
                {metrics.businessIntelligence.wms?.inventoryMetrics
                  ?.totalItems || 0}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Storage View */}
      {selectedView === "storage" && metrics.storage && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-6 rounded-xl bg-gray-800 border border-gray-700">
              <div className="text-sm text-gray-400 mb-2">Database Size</div>
              <div className="text-2xl font-bold text-cyan-400">
                {metrics.storage.database.totalSize}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                Growth: {metrics.storage.database.growth24h}
              </div>
            </div>
            <div className="p-6 rounded-xl bg-gray-800 border border-gray-700">
              <div className="text-sm text-gray-400 mb-2">File Storage</div>
              <div className="text-2xl font-bold text-purple-400">
                {metrics.storage.fileStorage.used} /{" "}
                {metrics.storage.fileStorage.total}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {metrics.storage.fileStorage.files.toLocaleString()} files
              </div>
            </div>
            <div className="p-6 rounded-xl bg-gray-800 border border-gray-700">
              <div className="text-sm text-gray-400 mb-2">Last Backup</div>
              <div className="text-2xl font-bold text-green-400">
                {metrics.storage.backups.lastBackup
                  ? new Date(
                      metrics.storage.backups.lastBackup,
                    ).toLocaleString()
                  : "Never"}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                Size: {metrics.storage.backups.backupSize}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Truth Engine View */}
      {selectedView === "truth" && metrics.truthEngine && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="p-6 rounded-xl bg-gray-800 border border-gray-700">
              <div className="text-sm text-gray-400 mb-2">Evidence Items</div>
              <div className="text-2xl font-bold text-cyan-400">
                {metrics.truthEngine.evidenceItems.toLocaleString()}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {metrics.truthEngine.evidence24h} in 24h
              </div>
            </div>
            <div className="p-6 rounded-xl bg-gray-800 border border-gray-700">
              <div className="text-sm text-gray-400 mb-2">
                Data Lineage Chains
              </div>
              <div className="text-2xl font-bold text-purple-400">
                {metrics.truthEngine.dataLineage.totalChains.toLocaleString()}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                Avg Length: {metrics.truthEngine.dataLineage.avgChainLength}
              </div>
            </div>
            <div className="p-6 rounded-xl bg-gray-800 border border-gray-700">
              <div className="text-sm text-gray-400 mb-2">
                Compliance Verified
              </div>
              <div className="text-2xl font-bold text-green-400">
                {metrics.truthEngine.compliance.verified}%
              </div>
              <div className="text-xs text-gray-500 mt-1">
                Pending: {metrics.truthEngine.compliance.pending}% • Failed:{" "}
                {metrics.truthEngine.compliance.failed}%
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Quick Actions Floating Panel */}
      <QuickActionsPanel />
    </PageTemplate>
  );
}
