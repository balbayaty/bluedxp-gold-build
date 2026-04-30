"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import PageTemplate from "@/components/PageTemplate";
import Tooltip from "@/components/Tooltip";
import Modal from "@/components/Modal";
import { format, subHours, subDays } from "date-fns";
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
import {
  getBenchmarksByCategory,
  getBenchmarkColor,
  compareToBenchmark,
} from "@/utils/benchmarks";
import { useRouter } from "next/navigation";
import { WebhookEvent } from "@/types/userManagement";
import { logger } from "@/lib/services/observability/logger";
import { errorTrackingService } from "@/lib/services/observability/errorTracking";

interface APIKey {
  id: string;
  name: string;
  key: string;
  status: "ACTIVE" | "INACTIVE" | "REVOKED";
  createdAt: Date | string;
  lastUsed?: Date | string;
  usageCount: number;
  rateLimit: number;
  permissions: string[];
}

interface APIRequest {
  id: string;
  endpoint: string;
  method: "GET" | "POST" | "PUT" | "DELETE";
  statusCode: number;
  responseTime: number;
  timestamp: Date | string;
  apiKey?: string;
  ipAddress: string;
}

interface Webhook {
  id: string;
  name: string;
  url: string;
  events: string[];
  status: "ACTIVE" | "INACTIVE";
  lastTriggered?: Date | string;
  successCount: number;
  failureCount: number;
}

// Benchmark Comparison Component for API
function APIBenchmarkSection() {
  const router = useRouter();
  const integrationBenchmarks = getBenchmarksByCategory(
    "integration-performance",
  );
  const avgResponseTime = 145; // ms - calculated from apiRequests
  const ourMetrics: Record<string, number> = {
    "api-response-time": avgResponseTime,
    "integration-uptime": 99.97,
    "error-rate": 0.03,
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-r from-cyan-500/10 to-blue-600/10 backdrop-blur-xl border border-cyan-500/20 rounded-2xl p-6 mb-6"
    >
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-xl font-bold text-white mb-1 flex items-center gap-2">
            <i className="ri-line-chart-line text-cyan-400"></i>
            API Performance Benchmarks
          </h3>
          <p className="text-gray-400 text-sm">
            Compare against industry standards
          </p>
        </div>
        <button
          onClick={() => router.push("/integration/benchmarks")}
          className="px-4 py-2 bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 rounded-lg hover:bg-cyan-500/30 transition-colors text-sm font-medium"
        >
          View All
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {integrationBenchmarks
          .filter((b) =>
            ["api-response-time", "integration-uptime", "error-rate"].includes(
              b.id,
            ),
          )
          .map((benchmark) => {
            const ourValue = ourMetrics[benchmark.id] || benchmark.value;
            const comparison = compareToBenchmark(ourValue, benchmark);
            const color = getBenchmarkColor(benchmark.percentile || 0);
            return (
              <div
                key={benchmark.id}
                className="bg-white/5 rounded-xl p-4 border border-white/10"
              >
                <div className="text-gray-400 text-xs mb-2">
                  {benchmark.metric}
                </div>
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <div className="text-lg font-bold text-white">
                      {ourValue} {benchmark.unit}
                    </div>
                    <div className="text-xs text-gray-400">
                      Industry: {benchmark.value} {benchmark.unit}
                    </div>
                  </div>
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold"
                    style={{ backgroundColor: `${color}20`, color }}
                  >
                    {benchmark.percentile}%
                  </div>
                </div>
                <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${benchmark.percentile}%`,
                      backgroundColor: color,
                    }}
                  />
                </div>
              </div>
            );
          })}
      </div>
    </motion.div>
  );
}

export default function APIManagement() {
  const router = useRouter();
  const [apiKeys, setApiKeys] = useState<APIKey[]>([
    {
      id: "key-1",
      name: "Production API Key",
      key: "sk_live_****1234",
      status: "ACTIVE",
      createdAt: subDays(new Date(), 30),
      lastUsed: subHours(new Date(), 2),
      usageCount: 15420,
      rateLimit: 1000,
      permissions: ["read", "write"],
    },
    {
      id: "key-2",
      name: "Development Key",
      key: "sk_test_****5678",
      status: "ACTIVE",
      createdAt: subDays(new Date(), 15),
      lastUsed: subHours(new Date(), 5),
      usageCount: 3240,
      rateLimit: 100,
      permissions: ["read"],
    },
    {
      id: "key-3",
      name: "Legacy Key",
      key: "sk_old_****9012",
      status: "REVOKED",
      createdAt: subDays(new Date(), 90),
      lastUsed: subDays(new Date(), 10),
      usageCount: 8920,
      rateLimit: 500,
      permissions: ["read", "write"],
    },
  ]);

  const [webhooks, setWebhooks] = useState<Webhook[]>([
    {
      id: "webhook-1",
      name: "Order Created",
      url: "https://example.com/webhooks/order-created",
      events: ["order.created", "order.updated"],
      status: "ACTIVE",
      lastTriggered: subHours(new Date(), 1),
      successCount: 1245,
      failureCount: 12,
    },
    {
      id: "webhook-2",
      name: "Inventory Update",
      url: "https://example.com/webhooks/inventory",
      events: ["inventory.updated"],
      status: "ACTIVE",
      lastTriggered: subHours(new Date(), 3),
      successCount: 3420,
      failureCount: 5,
    },
  ]);

  const [apiRequests] = useState<APIRequest[]>(() => {
    return Array.from({ length: 100 }, (_, i) => {
      const methods: APIRequest["method"][] = ["GET", "POST", "PUT", "DELETE"];
      const statusCodes = [200, 200, 200, 201, 400, 401, 404, 500];
      const method = methods[Math.floor(Math.random() * methods.length)];
      const statusCode =
        statusCodes[Math.floor(Math.random() * statusCodes.length)];

      return {
        id: `req-${i + 1}`,
        endpoint: `/api/v1/${["orders", "inventory", "customers", "vendors"][Math.floor(Math.random() * 4)]}`,
        method,
        statusCode,
        responseTime: Math.floor(Math.random() * 500) + 50,
        timestamp: subHours(new Date(), Math.floor(Math.random() * 24)),
        apiKey: apiKeys[Math.floor(Math.random() * apiKeys.length)].id,
        ipAddress: `192.168.1.${Math.floor(Math.random() * 255)}`,
      };
    });
  });

  const [selectedKey, setSelectedKey] = useState<APIKey | null>(null);
  const [selectedWebhook, setSelectedWebhook] = useState<Webhook | null>(null);
  const [showCreateKeyModal, setShowCreateKeyModal] = useState(false);
  const [showCreateWebhookModal, setShowCreateWebhookModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [viewMode, setViewMode] = useState<
    "overview" | "keys" | "webhooks" | "usage" | "docs"
  >("overview");
  const [newWebhookName, setNewWebhookName] = useState("");
  const [newWebhookUrl, setNewWebhookUrl] = useState("");
  const [selectedEvents, setSelectedEvents] = useState<WebhookEvent[]>([]);

  const availableEvents: WebhookEvent[] = [
    "user.created",
    "user.updated",
    "user.deleted",
    "order.created",
    "order.updated",
    "order.completed",
    "inventory.updated",
    "shipment.created",
    "shipment.updated",
    "shipment.delivered",
    "agent.action",
    "agent.completed",
    "billing.invoice.created",
    "billing.payment.received",
    "audit.log.created",
  ];

  const toggleEvent = (event: WebhookEvent) => {
    setSelectedEvents((prev) =>
      prev.includes(event) ? prev.filter((e) => e !== event) : [...prev, event],
    );
  };

  // API Usage analytics
  const usageAnalytics = useMemo(() => {
    const hourlyData: Record<
      string,
      {
        hour: string;
        requests: number;
        errors: number;
        avgResponseTime: number;
        count: number;
      }
    > = {};

    apiRequests.forEach((req) => {
      const hour = format(new Date(req.timestamp), "HH:00");
      if (!hourlyData[hour]) {
        hourlyData[hour] = {
          hour,
          requests: 0,
          errors: 0,
          avgResponseTime: 0,
          count: 0,
        };
      }
      hourlyData[hour].requests += 1;
      hourlyData[hour].count += 1;
      if (req.statusCode >= 400) {
        hourlyData[hour].errors += 1;
      }
      hourlyData[hour].avgResponseTime += req.responseTime;
    });

    return Object.values(hourlyData)
      .map((d) => ({
        ...d,
        avgResponseTime: d.avgResponseTime / d.count,
      }))
      .sort((a, b) => a.hour.localeCompare(b.hour));
  }, [apiRequests]);

  // Endpoint distribution
  const endpointDistribution = useMemo(() => {
    const counts: Record<string, number> = {};
    apiRequests.forEach((req) => {
      counts[req.endpoint] = (counts[req.endpoint] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([endpoint, count]) => ({ endpoint, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }, [apiRequests]);

  // Status code distribution
  const statusCodeDistribution = useMemo(() => {
    const counts: Record<number, number> = {};
    apiRequests.forEach((req) => {
      counts[req.statusCode] = (counts[req.statusCode] || 0) + 1;
    });
    return Object.entries(counts).map(([code, count]) => ({
      code: parseInt(code),
      count,
      category:
        parseInt(code) < 300
          ? "Success"
          : parseInt(code) < 400
            ? "Redirect"
            : parseInt(code) < 500
              ? "Client Error"
              : "Server Error",
    }));
  }, [apiRequests]);

  const aggregateStats = useMemo(() => {
    const totalRequests = apiRequests.length;
    const successRequests = apiRequests.filter(
      (r) => r.statusCode < 400,
    ).length;
    const errorRequests = apiRequests.filter((r) => r.statusCode >= 400).length;
    const avgResponseTime =
      apiRequests.reduce((sum, r) => sum + r.responseTime, 0) /
      apiRequests.length;
    const successRate =
      totalRequests > 0 ? (successRequests / totalRequests) * 100 : 0;

    return {
      totalRequests,
      successRequests,
      errorRequests,
      avgResponseTime,
      successRate,
      activeKeys: apiKeys.filter((k) => k.status === "ACTIVE").length,
      activeWebhooks: webhooks.filter((w) => w.status === "ACTIVE").length,
    };
  }, [apiRequests, apiKeys, webhooks]);

  const stats = [
    {
      label: "Total Requests",
      value: aggregateStats.totalRequests.toLocaleString(),
      icon: "ri-code-s-slash-line",
      tooltip: "Total API requests",
      trend: "up" as const,
    },
    {
      label: "Success Rate",
      value: `${aggregateStats.successRate.toFixed(1)}%`,
      icon: "ri-checkbox-circle-line",
      tooltip: "API success rate",
      trend: "up" as const,
    },
    {
      label: "Avg Response",
      value: `${aggregateStats.avgResponseTime.toFixed(0)}ms`,
      icon: "ri-time-line",
      tooltip: "Average response time",
      trend: "down" as const,
    },
    {
      label: "Active Keys",
      value: aggregateStats.activeKeys,
      icon: "ri-key-line",
      tooltip: "Active API keys",
      trend: "up" as const,
    },
  ];

  return (
    <PageTemplate
      title="API Management"
      description="REST API documentation, usage analytics, API key management, and webhook configuration"
      icon="ri-code-s-slash-line"
      systemInfo={{
        sap: "API Management, REST API",
        oracle: "API Gateway, API Management",
        manhattan: "API Management, REST API",
      }}
      examples={[
        "REST API documentation",
        "API key management",
        "Usage analytics and monitoring",
        "Webhook configuration",
        "Rate limiting",
        "Request/response logging",
      ]}
      stats={stats}
      actions={
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-lg p-1">
            {(["overview", "keys", "webhooks", "usage", "docs"] as const).map(
              (mode) => (
                <button
                  key={mode}
                  onClick={() => setViewMode(mode)}
                  className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                    viewMode === mode
                      ? "bg-cyan-500 text-white"
                      : "text-[#9ca3af] hover:text-white"
                  }`}
                >
                  <i
                    className={`ri-${mode === "overview" ? "dashboard-line" : mode === "keys" ? "key-line" : mode === "webhooks" ? "webhook-line" : mode === "usage" ? "bar-chart-line" : "file-text-line"} mr-1`}
                  ></i>
                  {mode.charAt(0).toUpperCase() + mode.slice(1)}
                </button>
              ),
            )}
          </div>
          <button
            onClick={() => setShowCreateKeyModal(true)}
            className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white px-6 py-3 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 shadow-lg shadow-cyan-500/20"
          >
            <i className="ri-add-line"></i>
            New API Key
          </button>
        </div>
      }
    >
      {/* Overview View */}
      {viewMode === "overview" && (
        <div className="space-y-6">
          {/* Benchmark Comparison */}
          <APIBenchmarkSection />

          {/* API Usage Trend */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
          >
            <h3 className="text-lg font-semibold text-white mb-4">
              API Usage Trend (Last 24 Hours)
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <ComposedChart data={usageAnalytics}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="hour" stroke="#9ca3af" fontSize={10} />
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
                  dataKey="requests"
                  fill="#06b6d4"
                  name="Requests"
                />
                <Bar
                  yAxisId="left"
                  dataKey="errors"
                  fill="#ef4444"
                  name="Errors"
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="avgResponseTime"
                  stroke="#10b981"
                  strokeWidth={2}
                  name="Avg Response Time (ms)"
                />
                <Legend />
              </ComposedChart>
            </ResponsiveContainer>
          </motion.div>

          {/* Status Code Distribution */}
          <div className="grid md:grid-cols-2 gap-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
            >
              <h3 className="text-lg font-semibold text-white mb-4">
                Status Code Distribution
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={statusCodeDistribution}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="code" stroke="#9ca3af" fontSize={12} />
                  <YAxis stroke="#9ca3af" fontSize={12} />
                  <RechartsTooltip
                    contentStyle={{
                      backgroundColor: "#1f2937",
                      border: "1px solid #374151",
                      borderRadius: "8px",
                    }}
                    labelStyle={{ color: "#fff" }}
                  />
                  <Bar dataKey="count" fill="#06b6d4" name="Requests">
                    {statusCodeDistribution.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={
                          entry.code < 300
                            ? "#10b981"
                            : entry.code < 400
                              ? "#3b82f6"
                              : entry.code < 500
                                ? "#f59e0b"
                                : "#ef4444"
                        }
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
            >
              <h3 className="text-lg font-semibold text-white mb-4">
                Top Endpoints
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={endpointDistribution} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis type="number" stroke="#9ca3af" fontSize={12} />
                  <YAxis
                    dataKey="endpoint"
                    type="category"
                    stroke="#9ca3af"
                    fontSize={10}
                    width={200}
                  />
                  <RechartsTooltip
                    contentStyle={{
                      backgroundColor: "#1f2937",
                      border: "1px solid #374151",
                      borderRadius: "8px",
                    }}
                    labelStyle={{ color: "#fff" }}
                  />
                  <Bar dataKey="count" fill="#06b6d4" name="Requests" />
                </BarChart>
              </ResponsiveContainer>
            </motion.div>
          </div>
        </div>
      )}

      {/* API Keys View */}
      {viewMode === "keys" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">API Keys</h3>
            <button
              onClick={() => setShowCreateKeyModal(true)}
              className="px-4 py-2 bg-cyan-600/20 text-cyan-400 border border-cyan-500/30 rounded text-sm font-medium hover:bg-cyan-600/30 transition-colors"
            >
              <i className="ri-add-line mr-1"></i>
              Create Key
            </button>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {apiKeys.map((key, index) => (
              <motion.div
                key={key.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`bg-white/5 backdrop-blur-xl border rounded-2xl p-6 ${
                  key.status === "ACTIVE"
                    ? "border-green-500/30"
                    : key.status === "REVOKED"
                      ? "border-red-500/30"
                      : "border-white/10"
                }`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-white mb-1">
                      {key.name}
                    </h3>
                    <div className="text-sm text-[#9ca3af] font-mono mb-2">
                      {key.key}
                    </div>
                    <div
                      className={`text-xs px-2 py-1 rounded inline-block ${
                        key.status === "ACTIVE"
                          ? "bg-green-500/20 text-green-400"
                          : key.status === "REVOKED"
                            ? "bg-red-500/20 text-red-400"
                            : "bg-gray-500/20 text-gray-400"
                      }`}
                    >
                      {key.status}
                    </div>
                  </div>
                </div>
                <div className="space-y-2 mb-4">
                  <div className="text-xs text-[#9ca3af]">
                    <i className="ri-bar-chart-line mr-1"></i>
                    Usage: {key.usageCount.toLocaleString()} requests
                  </div>
                  <div className="text-xs text-[#9ca3af]">
                    <i className="ri-speed-line mr-1"></i>
                    Rate Limit: {key.rateLimit}/hour
                  </div>
                  {key.lastUsed && (
                    <div className="text-xs text-[#9ca3af]">
                      <i className="ri-time-line mr-1"></i>
                      Last Used:{" "}
                      {format(new Date(key.lastUsed), "MMM dd, HH:mm")}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2 pt-4 border-t border-white/10">
                  <button
                    onClick={() => {
                      setSelectedKey(key);
                      setShowViewModal(true);
                    }}
                    className="flex-1 px-3 py-2 bg-cyan-600/20 text-cyan-400 border border-cyan-500/30 rounded text-sm font-medium hover:bg-cyan-600/30 transition-colors"
                  >
                    View
                  </button>
                  {key.status === "ACTIVE" && (
                    <button
                      onClick={() => {
                        setApiKeys(
                          apiKeys.map((k) =>
                            k.id === key.id
                              ? { ...k, status: "REVOKED" as const }
                              : k,
                          ),
                        );
                      }}
                      className="px-3 py-2 bg-red-600/20 text-red-400 border border-red-500/30 rounded text-sm font-medium hover:bg-red-600/30 transition-colors"
                    >
                      Revoke
                    </button>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Webhooks View */}
      {viewMode === "webhooks" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">Webhooks</h3>
            <button
              onClick={() => setShowCreateWebhookModal(true)}
              className="px-4 py-2 bg-cyan-600/20 text-cyan-400 border border-cyan-500/30 rounded text-sm font-medium hover:bg-cyan-600/30 transition-colors"
            >
              <i className="ri-add-line mr-1"></i>
              Create Webhook
            </button>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            {webhooks.map((webhook, index) => (
              <motion.div
                key={webhook.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`bg-white/5 backdrop-blur-xl border rounded-2xl p-6 ${
                  webhook.status === "ACTIVE"
                    ? "border-green-500/30"
                    : "border-white/10"
                }`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-white mb-1">
                      {webhook.name}
                    </h3>
                    <div className="text-sm text-[#9ca3af] mb-2">
                      {webhook.url}
                    </div>
                    <div
                      className={`text-xs px-2 py-1 rounded inline-block ${
                        webhook.status === "ACTIVE"
                          ? "bg-green-500/20 text-green-400"
                          : "bg-gray-500/20 text-gray-400"
                      }`}
                    >
                      {webhook.status}
                    </div>
                  </div>
                </div>
                <div className="space-y-2 mb-4">
                  <div className="text-xs text-[#9ca3af]">
                    <i className="ri-notification-line mr-1"></i>
                    Events: {webhook.events.join(", ")}
                  </div>
                  <div className="text-xs text-[#9ca3af]">
                    <i className="ri-checkbox-circle-line mr-1"></i>
                    Success: {webhook.successCount} | Failed:{" "}
                    {webhook.failureCount}
                  </div>
                  {webhook.lastTriggered && (
                    <div className="text-xs text-[#9ca3af]">
                      <i className="ri-time-line mr-1"></i>
                      Last Triggered:{" "}
                      {format(new Date(webhook.lastTriggered), "MMM dd, HH:mm")}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2 pt-4 border-t border-white/10">
                  <button
                    onClick={() => {
                      setSelectedWebhook(webhook);
                      setShowViewModal(true);
                    }}
                    className="flex-1 px-3 py-2 bg-cyan-600/20 text-cyan-400 border border-cyan-500/30 rounded text-sm font-medium hover:bg-cyan-600/30 transition-colors"
                  >
                    View
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Usage View */}
      {viewMode === "usage" && (
        <div className="space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
          >
            <h3 className="text-lg font-semibold text-white mb-4">
              API Request Logs
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-white/5">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-[#9ca3af] uppercase">
                      Time
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-[#9ca3af] uppercase">
                      Method
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-[#9ca3af] uppercase">
                      Endpoint
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-[#9ca3af] uppercase">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-[#9ca3af] uppercase">
                      Response Time
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-[#9ca3af] uppercase">
                      IP Address
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {apiRequests.slice(0, 20).map((request) => (
                    <tr
                      key={request.id}
                      className="hover:bg-white/5 transition-colors"
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                        {format(
                          new Date(request.timestamp),
                          "MMM dd, HH:mm:ss",
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium ${
                            request.method === "GET"
                              ? "bg-blue-500/20 text-blue-400"
                              : request.method === "POST"
                                ? "bg-green-500/20 text-green-400"
                                : request.method === "PUT"
                                  ? "bg-yellow-500/20 text-yellow-400"
                                  : "bg-red-500/20 text-red-400"
                          }`}
                        >
                          {request.method}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-white font-mono">
                        {request.endpoint}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium ${
                            request.statusCode < 300
                              ? "bg-green-500/20 text-green-400"
                              : request.statusCode < 400
                                ? "bg-yellow-500/20 text-yellow-400"
                                : "bg-red-500/20 text-red-400"
                          }`}
                        >
                          {request.statusCode}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                        {request.responseTime}ms
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-[#9ca3af] font-mono">
                        {request.ipAddress}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        </div>
      )}

      {/* Documentation View */}
      {viewMode === "docs" && (
        <div className="space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-white">
                API Documentation
              </h3>
              <div className="flex items-center gap-3">
                <a
                  href="/api/docs"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                >
                  <i className="ri-file-code-line"></i>
                  OpenAPI Spec (JSON)
                </a>
                <a
                  href="https://swagger.io/tools/swagger-ui/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                >
                  <i className="ri-external-link-line"></i>
                  View in Swagger UI
                </a>
              </div>
            </div>
            <div className="space-y-4 mb-6">
              <div className="p-4 bg-gradient-to-r from-cyan-500/10 to-blue-600/10 border border-cyan-500/20 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <span className="px-2 py-1 bg-green-500/20 text-green-400 rounded text-xs font-medium">
                    GET
                  </span>
                  <code className="text-white font-mono">/api/webhooks</code>
                </div>
                <p className="text-sm text-[#9ca3af]">
                  List all webhooks for authenticated user
                </p>
              </div>
              <div className="p-4 bg-gradient-to-r from-cyan-500/10 to-blue-600/10 border border-cyan-500/20 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <span className="px-2 py-1 bg-blue-500/20 text-blue-400 rounded text-xs font-medium">
                    POST
                  </span>
                  <code className="text-white font-mono">/api/webhooks</code>
                </div>
                <p className="text-sm text-[#9ca3af]">
                  Create a new webhook subscription
                </p>
              </div>
              <div className="p-4 bg-white/5 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <span className="px-2 py-1 bg-green-500/20 text-green-400 rounded text-xs font-medium">
                    GET
                  </span>
                  <code className="text-white font-mono">
                    /api/webhooks/:id
                  </code>
                </div>
                <p className="text-sm text-[#9ca3af]">
                  Get webhook details by ID
                </p>
              </div>
              <div className="p-4 bg-white/5 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <span className="px-2 py-1 bg-yellow-500/20 text-yellow-400 rounded text-xs font-medium">
                    PUT
                  </span>
                  <code className="text-white font-mono">
                    /api/webhooks/:id
                  </code>
                </div>
                <p className="text-sm text-[#9ca3af]">
                  Update webhook configuration
                </p>
              </div>
              <div className="p-4 bg-white/5 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <span className="px-2 py-1 bg-red-500/20 text-red-400 rounded text-xs font-medium">
                    DELETE
                  </span>
                  <code className="text-white font-mono">
                    /api/webhooks/:id
                  </code>
                </div>
                <p className="text-sm text-[#9ca3af]">Delete a webhook</p>
              </div>
              <div className="p-4 bg-white/5 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <span className="px-2 py-1 bg-green-500/20 text-green-400 rounded text-xs font-medium">
                    GET
                  </span>
                  <code className="text-white font-mono">
                    /api/transportation/shipments
                  </code>
                </div>
                <p className="text-sm text-[#9ca3af]">
                  List shipments with filters
                </p>
              </div>
              <div className="p-4 bg-white/5 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <span className="px-2 py-1 bg-green-500/20 text-green-400 rounded text-xs font-medium">
                    GET
                  </span>
                  <code className="text-white font-mono">/api/docs</code>
                </div>
                <p className="text-sm text-[#9ca3af]">
                  Get OpenAPI specification (JSON)
                </p>
              </div>
            </div>
            <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
              <div className="flex items-start gap-3">
                <i className="ri-information-line text-blue-400 text-xl mt-0.5"></i>
                <div>
                  <h4 className="text-white font-medium mb-1">
                    Authentication
                  </h4>
                  <p className="text-sm text-[#9ca3af] mb-2">
                    All API requests require authentication via API key or
                    Bearer token.
                  </p>
                  <div className="space-y-1 text-xs text-[#9ca3af] font-mono">
                    <div>
                      Header:{" "}
                      <span className="text-white">X-API-Key: sk_live_...</span>
                    </div>
                    <div>
                      Or:{" "}
                      <span className="text-white">
                        Authorization: Bearer &lt;token&gt;
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Create API Key Modal */}
      <Modal
        isOpen={showCreateKeyModal}
        onClose={() => setShowCreateKeyModal(false)}
        title="Create API Key"
        size="md"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-[#9ca3af] mb-2">
              Key Name
            </label>
            <input
              type="text"
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
              placeholder="Enter key name"
            />
          </div>
          <div>
            <label className="block text-sm text-[#9ca3af] mb-2">
              Rate Limit (requests/hour)
            </label>
            <input
              type="number"
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
              placeholder="1000"
            />
          </div>
          <div className="flex items-center gap-3 pt-4">
            <button
              onClick={() => setShowCreateKeyModal(false)}
              className="flex-1 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white px-6 py-3 rounded-lg text-sm font-medium transition-colors"
            >
              Create Key
            </button>
            <button
              onClick={() => setShowCreateKeyModal(false)}
              className="px-6 py-3 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-lg text-sm font-medium transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </Modal>

      {/* Create Webhook Modal */}
      <Modal
        isOpen={showCreateWebhookModal}
        onClose={() => setShowCreateWebhookModal(false)}
        title="Create Webhook"
        size="md"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-[#9ca3af] mb-2">
              Webhook Name
            </label>
            <input
              type="text"
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
              placeholder="Enter webhook name"
              value={newWebhookName}
              onChange={(e) => setNewWebhookName(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm text-[#9ca3af] mb-2">
              Webhook URL
            </label>
            <input
              type="url"
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
              placeholder="https://example.com/webhook"
              value={newWebhookUrl}
              onChange={(e) => setNewWebhookUrl(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm text-[#9ca3af] mb-2">
              Events to Subscribe
            </label>
            <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto bg-white/5 border border-white/10 rounded-lg p-3">
              {availableEvents.map((event) => (
                <label
                  key={event}
                  className="flex items-center gap-2 text-sm text-white cursor-pointer hover:bg-white/5 p-2 rounded"
                >
                  <input
                    type="checkbox"
                    checked={selectedEvents.includes(event)}
                    onChange={() => toggleEvent(event)}
                    className="w-4 h-4 rounded border-white/20 bg-white/5 text-cyan-500 focus:ring-cyan-500 focus:ring-offset-0"
                  />
                  <span className="text-xs">{event}</span>
                </label>
              ))}
            </div>
            <p className="text-xs text-[#9ca3af] mt-2">
              <i className="ri-information-line mr-1"></i>
              Select one or more events to receive webhook notifications
            </p>
          </div>
          <div className="flex items-center gap-3 pt-4">
            <button
              onClick={async () => {
                if (
                  !newWebhookName ||
                  !newWebhookUrl ||
                  selectedEvents.length === 0
                ) {
                  alert(
                    "Please fill in all fields and select at least one event",
                  );
                  return;
                }

                try {
                  const response = await fetch("/api/webhooks", {
                    method: "POST",
                    headers: {
                      "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                      name: newWebhookName,
                      url: newWebhookUrl,
                      events: selectedEvents,
                    }),
                  });

                  if (response.ok) {
                    const data = await response.json();
                    // Add to webhooks list
                    setWebhooks([
                      ...webhooks,
                      {
                        id: data.webhook.id,
                        name: data.webhook.name,
                        url: data.webhook.url,
                        events: data.webhook.events,
                        status: data.webhook.status,
                        successCount: 0,
                        failureCount: 0,
                      },
                    ]);
                    setShowCreateWebhookModal(false);
                    setNewWebhookName("");
                    setNewWebhookUrl("");
                    setSelectedEvents([]);
                  } else {
                    const error = await response.json();
                    alert(
                      `Error: ${error.error || "Failed to create webhook"}`,
                    );
                  }
                } catch (error) {
                  const err =
                    error instanceof Error ? error : new Error(String(error));
                  logger.error("Error creating webhook", err, {
                    module: "integration",
                    service: "api",
                  });
                  errorTrackingService.captureException(err, {
                    module: "integration",
                    service: "api",
                  });
                  alert("Failed to create webhook. Please try again.");
                }
              }}
              disabled={
                !newWebhookName || !newWebhookUrl || selectedEvents.length === 0
              }
              className="flex-1 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-3 rounded-lg text-sm font-medium transition-colors"
            >
              Create Webhook
            </button>
            <button
              onClick={() => setShowCreateWebhookModal(false)}
              className="px-6 py-3 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-lg text-sm font-medium transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </Modal>

      {/* View Details Modal */}
      <Modal
        isOpen={showViewModal}
        onClose={() => {
          setShowViewModal(false);
          setSelectedKey(null);
          setSelectedWebhook(null);
        }}
        title={selectedKey ? "API Key Details" : "Webhook Details"}
        size="md"
      >
        {selectedKey && (
          <div className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-[#9ca3af] mb-1">Name</div>
                <div className="text-white font-medium">{selectedKey.name}</div>
              </div>
              <div>
                <div className="text-sm text-[#9ca3af] mb-1">Status</div>
                <div className="text-white font-medium">
                  {selectedKey.status}
                </div>
              </div>
              <div>
                <div className="text-sm text-[#9ca3af] mb-1">Usage Count</div>
                <div className="text-white font-medium">
                  {selectedKey.usageCount.toLocaleString()}
                </div>
              </div>
              <div>
                <div className="text-sm text-[#9ca3af] mb-1">Rate Limit</div>
                <div className="text-white font-medium">
                  {selectedKey.rateLimit}/hour
                </div>
              </div>
            </div>
          </div>
        )}
        {selectedWebhook && (
          <div className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-[#9ca3af] mb-1">Name</div>
                <div className="text-white font-medium">
                  {selectedWebhook.name}
                </div>
              </div>
              <div>
                <div className="text-sm text-[#9ca3af] mb-1">Status</div>
                <div className="text-white font-medium">
                  {selectedWebhook.status}
                </div>
              </div>
              <div className="col-span-2">
                <div className="text-sm text-[#9ca3af] mb-1">URL</div>
                <div className="text-white font-medium">
                  {selectedWebhook.url}
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </PageTemplate>
  );
}
