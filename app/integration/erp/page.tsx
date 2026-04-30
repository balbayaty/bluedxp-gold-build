"use client";

import { useState, useMemo, useEffect } from "react";
import { motion } from "framer-motion";
import PageTemplate from "@/components/PageTemplate";
import Tooltip from "@/components/Tooltip";
import Modal from "@/components/Modal";
import { format, subMinutes } from "date-fns";
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
} from "recharts";
import {
  realtimeSimulator,
  simulateKPIUpdates,
} from "@/utils/realtimeDataSimulator";
import {
  getBenchmarksByCategory,
  getBenchmarkColor,
  compareToBenchmark,
} from "@/utils/benchmarks";
import { useRouter } from "next/navigation";
import { logger } from "@/lib/services/observability/logger";

interface ERPConnection {
  id: string;
  name: string;
  system: "SAP" | "ORACLE" | "CUSTOM";
  status: "ACTIVE" | "INACTIVE" | "ERROR" | "SYNCING";
  lastSync?: Date | string;
  syncFrequency: "REAL_TIME" | "HOURLY" | "DAILY" | "MANUAL";
  syncStatus: {
    success: number;
    failed: number;
    pending: number;
  };
  dataMappings: {
    source: string;
    target: string;
    status: "MAPPED" | "UNMAPPED" | "ERROR";
  }[];
  endpoint: string;
  credentials: {
    username: string;
    encrypted: boolean;
  };
}

// Benchmark Comparison Component
function BenchmarkComparisonSection({ successRate }: { successRate: number }) {
  const router = useRouter();
  const integrationBenchmarks = getBenchmarksByCategory(
    "integration-performance",
  );
  const ourMetrics: Record<string, number> = {
    "api-response-time": 145, // ms
    "integration-uptime": 99.97, // %
    "data-sync-frequency": 5, // minutes
    "error-rate": 0.03, // %
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-r from-cyan-500/10 to-blue-600/10 backdrop-blur-xl border border-cyan-500/20 rounded-2xl p-6"
    >
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-xl font-bold text-white mb-1 flex items-center gap-2">
            <i className="ri-line-chart-line text-cyan-400"></i>
            Performance vs Industry Benchmarks
          </h3>
          <p className="text-gray-400 text-sm">
            Compare your ERP integration performance against global standards
          </p>
        </div>
        <button
          onClick={() => router.push("/integration/benchmarks")}
          className="px-4 py-2 bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 rounded-lg hover:bg-cyan-500/30 transition-colors text-sm font-medium"
        >
          View All Benchmarks
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {integrationBenchmarks.map((benchmark) => {
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
                  className="w-12 h-12 rounded-lg flex items-center justify-center text-lg font-bold"
                  style={{ backgroundColor: `${color}20`, color }}
                >
                  {benchmark.percentile}%
                </div>
              </div>
              <div className="flex items-center gap-2 mt-2">
                <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${benchmark.percentile}%`,
                      backgroundColor: color,
                    }}
                  />
                </div>
                <span
                  className={`text-xs font-semibold ${
                    comparison.status === "above"
                      ? "text-green-400"
                      : comparison.status === "below"
                        ? "text-red-400"
                        : "text-gray-400"
                  }`}
                >
                  {comparison.status === "above" ? "+" : ""}
                  {comparison.percentage.toFixed(1)}%
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}

export default function ERPIntegration() {
  const [connections, setConnections] = useState<ERPConnection[]>([
    {
      id: "erp-1",
      name: "SAP Production",
      system: "SAP",
      status: "ACTIVE",
      lastSync: subMinutes(new Date(), 15),
      syncFrequency: "REAL_TIME",
      syncStatus: {
        success: 1245,
        failed: 12,
        pending: 3,
      },
      dataMappings: [
        { source: "MATNR", target: "materialNumber", status: "MAPPED" },
        { source: "MAKTX", target: "materialDescription", status: "MAPPED" },
        { source: "LGORT", target: "storageLocation", status: "MAPPED" },
        { source: "MEINS", target: "unit", status: "MAPPED" },
      ],
      endpoint: "https://sap-prod.example.com/api",
      credentials: {
        username: "wms_user",
        encrypted: true,
      },
    },
    {
      id: "erp-2",
      name: "Oracle ERP",
      system: "ORACLE",
      status: "ACTIVE",
      lastSync: subMinutes(new Date(), 45),
      syncFrequency: "HOURLY",
      syncStatus: {
        success: 892,
        failed: 5,
        pending: 0,
      },
      dataMappings: [
        { source: "ITEM_NUMBER", target: "materialNumber", status: "MAPPED" },
        {
          source: "DESCRIPTION",
          target: "materialDescription",
          status: "MAPPED",
        },
        { source: "LOCATION", target: "storageLocation", status: "MAPPED" },
      ],
      endpoint: "https://oracle-erp.example.com/api",
      credentials: {
        username: "wms_integration",
        encrypted: true,
      },
    },
    {
      id: "erp-3",
      name: "Custom ERP",
      system: "CUSTOM",
      status: "ERROR",
      lastSync: subMinutes(new Date(), 120),
      syncFrequency: "DAILY",
      syncStatus: {
        success: 234,
        failed: 45,
        pending: 12,
      },
      dataMappings: [
        { source: "product_id", target: "materialNumber", status: "MAPPED" },
        {
          source: "product_name",
          target: "materialDescription",
          status: "ERROR",
        },
      ],
      endpoint: "https://custom-erp.example.com/api",
      credentials: {
        username: "api_user",
        encrypted: true,
      },
    },
  ]);

  const [selectedConnection, setSelectedConnection] =
    useState<ERPConnection | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showMappingModal, setShowMappingModal] = useState(false);
  const [showSyncModal, setShowSyncModal] = useState(false);
  const [viewMode, setViewMode] = useState<
    "overview" | "mappings" | "sync" | "monitoring"
  >("overview");
  const [realTimeEnabled, setRealTimeEnabled] = useState(true);
  const [realTimeStats, setRealTimeStats] = useState({
    totalConnections: 0,
    activeConnections: 0,
    totalSuccess: 0,
    successRate: 0,
  });

  // Sync history (simulated)
  const syncHistory = useMemo(() => {
    return Array.from({ length: 30 }, (_, i) => {
      const date = subMinutes(new Date(), (30 - i) * 15);
      return {
        time: format(date, "HH:mm"),
        success: Math.floor(Math.random() * 50) + 20,
        failed: Math.floor(Math.random() * 5),
        duration: Math.floor(Math.random() * 30) + 10,
      };
    });
  }, []);

  // System distribution
  const systemDistribution = useMemo(() => {
    const counts: Record<string, number> = {};
    connections.forEach((conn) => {
      counts[conn.system] = (counts[conn.system] || 0) + 1;
    });
    return Object.entries(counts).map(([system, count]) => ({ system, count }));
  }, [connections]);

  // Status distribution
  const statusDistribution = useMemo(() => {
    const counts: Record<string, number> = {};
    connections.forEach((conn) => {
      counts[conn.status] = (counts[conn.status] || 0) + 1;
    });
    return Object.entries(counts).map(([status, count]) => ({ status, count }));
  }, [connections]);

  const aggregateStats = useMemo(() => {
    const totalSuccess = connections.reduce(
      (sum, c) => sum + c.syncStatus.success,
      0,
    );
    const totalFailed = connections.reduce(
      (sum, c) => sum + c.syncStatus.failed,
      0,
    );
    const totalPending = connections.reduce(
      (sum, c) => sum + c.syncStatus.pending,
      0,
    );
    const successRate =
      totalSuccess + totalFailed > 0
        ? (totalSuccess / (totalSuccess + totalFailed)) * 100
        : 0;

    return {
      totalConnections: connections.length,
      activeConnections: connections.filter((c) => c.status === "ACTIVE")
        .length,
      totalSuccess,
      totalFailed,
      totalPending,
      successRate,
    };
  }, [connections]);

  // Real-time updates
  useEffect(() => {
    if (!realTimeEnabled) return;

    const unsubscribe = realtimeSimulator.subscribe(
      "erp-stats",
      (data: typeof realTimeStats) => {
        setRealTimeStats(data);
      },
    );

    const stop = realtimeSimulator.start(
      "erp-stats",
      () => ({
        totalConnections: aggregateStats.totalConnections,
        activeConnections: simulateKPIUpdates(
          aggregateStats.activeConnections,
          0.1,
        ),
        totalSuccess: simulateKPIUpdates(aggregateStats.totalSuccess, 0.05),
        successRate: simulateKPIUpdates(aggregateStats.successRate, 0.02),
      }),
      5000,
      true,
    );

    return () => {
      unsubscribe();
      stop();
    };
  }, [
    realTimeEnabled,
    aggregateStats.totalConnections,
    aggregateStats.activeConnections,
    aggregateStats.totalSuccess,
    aggregateStats.successRate,
  ]);

  // Simulate real-time sync updates
  useEffect(() => {
    if (!realTimeEnabled) return;

    const interval = setInterval(() => {
      setConnections((prev) =>
        prev.map((conn) => {
          if (conn.status === "ACTIVE" && Math.random() < 0.1) {
            return {
              ...conn,
              lastSync: new Date(),
              syncStatus: {
                ...conn.syncStatus,
                success: conn.syncStatus.success + 1,
              },
            };
          }
          return conn;
        }),
      );
    }, 10000);

    return () => clearInterval(interval);
  }, [realTimeEnabled]);

  const stats = [
    {
      label: "Total Connections",
      value: realTimeEnabled
        ? realTimeStats.totalConnections
        : aggregateStats.totalConnections,
      icon: "ri-exchange-line",
      tooltip: "Total ERP connections",
      trend: "up" as const,
    },
    {
      label: "Active",
      value: realTimeEnabled
        ? realTimeStats.activeConnections
        : aggregateStats.activeConnections,
      icon: "ri-checkbox-circle-line",
      tooltip: "Active connections",
      trend: "up" as const,
    },
    {
      label: "Sync Success Rate",
      value: `${(realTimeEnabled ? realTimeStats.successRate : aggregateStats.successRate).toFixed(1)}%`,
      icon: "ri-line-chart-line",
      tooltip: "Sync success rate",
      trend: "up" as const,
    },
    {
      label: "Total Syncs",
      value: (realTimeEnabled
        ? realTimeStats.totalSuccess
        : aggregateStats.totalSuccess
      ).toLocaleString(),
      icon: "ri-refresh-line",
      tooltip: "Total synchronization operations",
      trend: "up" as const,
    },
  ];

  const handleSync = (connection: ERPConnection) => {
    setSelectedConnection(connection);
    setShowSyncModal(true);
  };

  const handleMapping = (connection: ERPConnection) => {
    setSelectedConnection(connection);
    setShowMappingModal(true);
  };

  return (
    <PageTemplate
      title="ERP Integration"
      description="SAP, Oracle, and custom ERP integration with data synchronization, mapping, and monitoring"
      icon="ri-exchange-line"
      systemInfo={{
        sap: "ERP Integration, SAP Connector",
        oracle: "ERP Integration, Oracle Connector",
        manhattan: "ERP Integration, System Connectors",
      }}
      examples={[
        "SAP and Oracle ERP integration",
        "Real-time data synchronization",
        "Data field mapping",
        "Sync monitoring and history",
        "Error handling and retry",
        "Connection management",
      ]}
      stats={stats}
      actions={
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
          <div className="flex items-center gap-1 sm:gap-2 bg-white/5 border border-white/10 rounded-lg p-1 sm:p-2">
            {(["overview", "mappings", "sync", "monitoring"] as const).map(
              (mode) => (
                <button
                  key={mode}
                  onClick={() => setViewMode(mode)}
                  className={`p-1.5 sm:p-2 rounded transition-colors ${
                    viewMode === mode
                      ? "bg-cyan-500/20 text-cyan-400"
                      : "text-[#9ca3af] hover:text-white"
                  }`}
                  title={mode.charAt(0).toUpperCase() + mode.slice(1)}
                >
                  <i
                    className={`ri-${mode === "overview" ? "dashboard-line" : mode === "mappings" ? "file-transfer-line" : mode === "sync" ? "refresh-line" : "eye-line"} text-sm sm:text-base`}
                  ></i>
                </button>
              ),
            )}
          </div>
          <button
            onClick={() => setRealTimeEnabled(!realTimeEnabled)}
            className={`px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors ${
              realTimeEnabled
                ? "bg-green-500/20 text-green-400 border border-green-500/30"
                : "bg-white/5 text-[#9ca3af] border border-white/10"
            }`}
          >
            <i
              className={`ri-${realTimeEnabled ? "radio-button-line" : "checkbox-blank-circle-line"} mr-1`}
            ></i>
            Real-time
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg text-xs sm:text-sm font-medium transition-colors flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20 whitespace-nowrap"
          >
            <i className="ri-add-line"></i>
            <span className="hidden sm:inline">New Connection</span>
            <span className="sm:hidden">New</span>
          </button>
        </div>
      }
    >
      {/* Overview View */}
      {viewMode === "overview" && (
        <div className="space-y-6">
          {/* Benchmark Comparison */}
          <BenchmarkComparisonSection
            successRate={
              realTimeEnabled
                ? realTimeStats.successRate
                : aggregateStats.successRate
            }
          />

          {/* Connection Cards */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {connections.map((connection, index) => (
              <motion.div
                key={connection.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`bg-white/5 backdrop-blur-xl border rounded-2xl p-6 ${
                  connection.status === "ACTIVE"
                    ? "border-green-500/30"
                    : connection.status === "ERROR"
                      ? "border-red-500/30"
                      : connection.status === "SYNCING"
                        ? "border-yellow-500/30"
                        : "border-white/10"
                }`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-lg font-semibold text-white">
                        {connection.name}
                      </h3>
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${
                          connection.system === "SAP"
                            ? "bg-blue-500/20 text-blue-400"
                            : connection.system === "ORACLE"
                              ? "bg-red-500/20 text-red-400"
                              : "bg-purple-500/20 text-purple-400"
                        }`}
                      >
                        {connection.system}
                      </span>
                    </div>
                    <div
                      className={`text-sm ${
                        connection.status === "ACTIVE"
                          ? "text-green-400"
                          : connection.status === "ERROR"
                            ? "text-red-400"
                            : connection.status === "SYNCING"
                              ? "text-yellow-400"
                              : "text-[#9ca3af]"
                      }`}
                    >
                      <i
                        className={`ri-${connection.status === "ACTIVE" ? "check" : connection.status === "ERROR" ? "close" : "loader"}-line mr-1`}
                      ></i>
                      {connection.status}
                    </div>
                  </div>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="text-xs text-[#9ca3af]">
                    <i className="ri-time-line mr-1"></i>
                    Last Sync:{" "}
                    {connection.lastSync
                      ? format(new Date(connection.lastSync), "MMM dd, HH:mm")
                      : "Never"}
                  </div>
                  <div className="text-xs text-[#9ca3af]">
                    <i className="ri-refresh-line mr-1"></i>
                    Frequency: {connection.syncFrequency.replace(/_/g, " ")}
                  </div>
                  <div className="text-xs text-[#9ca3af]">
                    <i className="ri-file-transfer-line mr-1"></i>
                    Mappings:{" "}
                    {
                      connection.dataMappings.filter(
                        (m) => m.status === "MAPPED",
                      ).length
                    }
                    /{connection.dataMappings.length}
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 mb-4">
                  <div className="text-center p-2 bg-white/5 rounded">
                    <div className="text-sm font-bold text-green-400">
                      {connection.syncStatus.success}
                    </div>
                    <div className="text-xs text-[#9ca3af]">Success</div>
                  </div>
                  <div className="text-center p-2 bg-white/5 rounded">
                    <div className="text-sm font-bold text-red-400">
                      {connection.syncStatus.failed}
                    </div>
                    <div className="text-xs text-[#9ca3af]">Failed</div>
                  </div>
                  <div className="text-center p-2 bg-white/5 rounded">
                    <div className="text-sm font-bold text-yellow-400">
                      {connection.syncStatus.pending}
                    </div>
                    <div className="text-xs text-[#9ca3af]">Pending</div>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-4 border-t border-white/10">
                  <button
                    onClick={() => handleSync(connection)}
                    className="flex-1 px-3 py-2 bg-cyan-600/20 text-cyan-400 border border-cyan-500/30 rounded text-sm font-medium hover:bg-cyan-600/30 transition-colors"
                  >
                    <i className="ri-refresh-line mr-1"></i>
                    Sync Now
                  </button>
                  <Tooltip content="Manage Mappings" position="top">
                    <button
                      onClick={() => handleMapping(connection)}
                      className="px-3 py-2 bg-blue-600/20 text-blue-400 border border-blue-500/30 rounded text-sm font-medium hover:bg-blue-600/30 transition-colors"
                    >
                      <i className="ri-file-transfer-line"></i>
                    </button>
                  </Tooltip>
                </div>
              </motion.div>
            ))}
          </div>

          {/* System Distribution */}
          <div className="grid md:grid-cols-2 gap-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
            >
              <h3 className="text-lg font-semibold text-white mb-4">
                System Distribution
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={systemDistribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ system, count }) => `${system}: ${count}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="count"
                  >
                    {systemDistribution.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={["#06b6d4", "#ef4444", "#8b5cf6"][index % 3]}
                      />
                    ))}
                  </Pie>
                  <RechartsTooltip />
                </PieChart>
              </ResponsiveContainer>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
            >
              <h3 className="text-lg font-semibold text-white mb-4">
                Status Distribution
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={statusDistribution}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="status" stroke="#9ca3af" fontSize={12} />
                  <YAxis stroke="#9ca3af" fontSize={12} />
                  <RechartsTooltip
                    contentStyle={{
                      backgroundColor: "#1f2937",
                      border: "1px solid #374151",
                      borderRadius: "8px",
                    }}
                    labelStyle={{ color: "#fff" }}
                  />
                  <Bar dataKey="count" fill="#06b6d4" name="Connections" />
                </BarChart>
              </ResponsiveContainer>
            </motion.div>
          </div>
        </div>
      )}

      {/* Monitoring View */}
      {viewMode === "monitoring" && (
        <div className="space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
          >
            <h3 className="text-lg font-semibold text-white mb-4">
              Sync History (Last 30 Operations)
            </h3>
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={syncHistory}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="time" stroke="#9ca3af" fontSize={10} />
                <YAxis stroke="#9ca3af" fontSize={12} />
                <RechartsTooltip
                  contentStyle={{
                    backgroundColor: "#1f2937",
                    border: "1px solid #374151",
                    borderRadius: "8px",
                  }}
                  labelStyle={{ color: "#fff" }}
                />
                <Line
                  type="monotone"
                  dataKey="success"
                  stroke="#10b981"
                  strokeWidth={2}
                  name="Success"
                />
                <Line
                  type="monotone"
                  dataKey="failed"
                  stroke="#ef4444"
                  strokeWidth={2}
                  name="Failed"
                />
                <Legend />
              </LineChart>
            </ResponsiveContainer>
          </motion.div>
        </div>
      )}

      {/* Sync Modal */}
      <Modal
        isOpen={showSyncModal}
        onClose={() => {
          setShowSyncModal(false);
          setSelectedConnection(null);
        }}
        title={`Sync ${selectedConnection?.name || "Connection"}`}
        size="md"
      >
        {selectedConnection && (
          <div className="space-y-4">
            <div className="text-sm text-[#9ca3af]">
              Initiate synchronization for {selectedConnection.name}?
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-white/5 rounded-lg">
                <div className="text-xs text-[#9ca3af] mb-1">Last Sync</div>
                <div className="text-sm text-white">
                  {selectedConnection.lastSync
                    ? format(new Date(selectedConnection.lastSync), "PPp")
                    : "Never"}
                </div>
              </div>
              <div className="p-3 bg-white/5 rounded-lg">
                <div className="text-xs text-[#9ca3af] mb-1">Frequency</div>
                <div className="text-sm text-white">
                  {selectedConnection.syncFrequency.replace(/_/g, " ")}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3 pt-4">
              <button
                onClick={() => {
                  // Simulate sync
                  logger.info("Syncing ERP connection", undefined, {
                    module: "integration",
                    service: "erp",
                    connectionName: selectedConnection.name,
                  });
                  setShowSyncModal(false);
                  setSelectedConnection(null);
                }}
                className="flex-1 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white px-6 py-3 rounded-lg text-sm font-medium transition-colors"
              >
                <i className="ri-refresh-line mr-2"></i>
                Start Sync
              </button>
              <button
                onClick={() => {
                  setShowSyncModal(false);
                  setSelectedConnection(null);
                }}
                className="px-6 py-3 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-lg text-sm font-medium transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Mapping Modal */}
      <Modal
        isOpen={showMappingModal}
        onClose={() => {
          setShowMappingModal(false);
          setSelectedConnection(null);
        }}
        title={`Data Mappings - ${selectedConnection?.name || ""}`}
        size="lg"
      >
        {selectedConnection && (
          <div className="space-y-4">
            <div className="text-sm text-[#9ca3af] mb-4">
              Map ERP fields to WMS fields for {selectedConnection.system}{" "}
              integration
            </div>
            <div className="space-y-2">
              {selectedConnection.dataMappings.map((mapping, index) => (
                <div
                  key={index}
                  className="flex items-center gap-4 p-3 bg-white/5 rounded-lg"
                >
                  <div className="flex-1">
                    <div className="text-sm text-white font-medium">
                      {mapping.source}
                    </div>
                    <div className="text-xs text-[#9ca3af]">ERP Field</div>
                  </div>
                  <i className="ri-arrow-right-line text-cyan-400"></i>
                  <div className="flex-1">
                    <div className="text-sm text-white font-medium">
                      {mapping.target}
                    </div>
                    <div className="text-xs text-[#9ca3af]">WMS Field</div>
                  </div>
                  <div
                    className={`px-3 py-1 rounded text-xs font-medium ${
                      mapping.status === "MAPPED"
                        ? "bg-green-500/20 text-green-400"
                        : mapping.status === "ERROR"
                          ? "bg-red-500/20 text-red-400"
                          : "bg-yellow-500/20 text-yellow-400"
                    }`}
                  >
                    {mapping.status}
                  </div>
                </div>
              ))}
            </div>
            <div className="flex items-center gap-3 pt-4">
              <button
                onClick={() => {
                  setShowMappingModal(false);
                  setSelectedConnection(null);
                }}
                className="flex-1 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white px-6 py-3 rounded-lg text-sm font-medium transition-colors"
              >
                Save Mappings
              </button>
              <button
                onClick={() => {
                  setShowMappingModal(false);
                  setSelectedConnection(null);
                }}
                className="px-6 py-3 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-lg text-sm font-medium transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Create Connection Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Create ERP Connection"
        size="lg"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-[#9ca3af] mb-2">
              Connection Name
            </label>
            <input
              type="text"
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
              placeholder="Enter connection name"
            />
          </div>
          <div>
            <label className="block text-sm text-[#9ca3af] mb-2">
              ERP System
            </label>
            <select className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500">
              <option value="SAP">SAP</option>
              <option value="ORACLE">Oracle</option>
              <option value="CUSTOM">Custom</option>
            </select>
          </div>
          <div>
            <label className="block text-sm text-[#9ca3af] mb-2">
              Endpoint URL
            </label>
            <input
              type="text"
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
              placeholder="https://erp.example.com/api"
            />
          </div>
          <div className="flex items-center gap-3 pt-4">
            <button
              onClick={() => setShowCreateModal(false)}
              className="flex-1 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white px-6 py-3 rounded-lg text-sm font-medium transition-colors"
            >
              Create Connection
            </button>
            <button
              onClick={() => setShowCreateModal(false)}
              className="px-6 py-3 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-lg text-sm font-medium transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </Modal>
    </PageTemplate>
  );
}
