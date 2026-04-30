"use client";

import { useState, useMemo, useEffect } from "react";
import { motion } from "framer-motion";
import PageTemplate from "@/components/PageTemplate";
import Tooltip from "@/components/Tooltip";
import Modal from "@/components/Modal";
import { generateExpiryRecords } from "@/utils/mockDataGenerators";
import { format } from "date-fns";
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
} from "recharts";
import {
  realtimeSimulator,
  simulateKPIUpdates,
} from "@/utils/realtimeDataSimulator";

export default function ExpiryManagement() {
  const [expiryRecords, setExpiryRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch expiry records from API
  useEffect(() => {
    const fetchExpiryRecords = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch('/api/wms/expiry-management?days=30');
        const result = await response.json();

        if (result.success && result.data) {
          setExpiryRecords(result.data);
        } else {
          setError(result.error || 'Failed to fetch expiry records');
        }
      } catch (err) {
        console.error('Error fetching expiry records:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch expiry records');
      } finally {
        setLoading(false);
      }
    };

    fetchExpiryRecords();
  }, []);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");
  const [selectedPriority, setSelectedPriority] = useState<string>("ALL");
  const [selectedLocation, setSelectedLocation] = useState<string>("ALL");
  const [viewMode, setViewMode] = useState<
    "table" | "grid" | "analytics" | "alerts"
  >("table");
  const [selectedRecord, setSelectedRecord] = useState<any>(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [alertDays, setAlertDays] = useState(30);
  const [realTimeEnabled, setRealTimeEnabled] = useState(true);
  const [realTimeStats, setRealTimeStats] = useState({
    totalItems: 0,
    expired: 0,
    expiringSoon: 0,
    valueAtRisk: 0,
  });

  const filteredRecords = useMemo(() => {
    return expiryRecords.filter((record) => {
      const matchesSearch =
        record.materialNumber
          .toLowerCase()
          .includes(searchQuery.toLowerCase()) ||
        record.materialDescription
          .toLowerCase()
          .includes(searchQuery.toLowerCase()) ||
        record.batchNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (record.serialNumber &&
          record.serialNumber
            .toLowerCase()
            .includes(searchQuery.toLowerCase()));
      const matchesStatus =
        selectedStatus === "ALL" || record.status === selectedStatus;
      const matchesPriority =
        selectedPriority === "ALL" || record.priority === selectedPriority;
      const matchesLocation =
        selectedLocation === "ALL" ||
        record.location.startsWith(selectedLocation);
      return (
        matchesSearch && matchesStatus && matchesPriority && matchesLocation
      );
    });
  }, [
    expiryRecords,
    searchQuery,
    selectedStatus,
    selectedPriority,
    selectedLocation,
  ]);

  const criticalAlerts = useMemo(() => {
    return expiryRecords.filter(
      (r) => r.requiresAttention || r.requiresDisposal,
    );
  }, [expiryRecords]);

  const expiredItems = useMemo(() => {
    return expiryRecords.filter((r) => r.status === "EXPIRED");
  }, [expiryRecords]);

  const expiringSoon = useMemo(() => {
    return expiryRecords.filter((r) => r.status === "EXPIRING_SOON");
  }, [expiryRecords]);

  const totalValueAtRisk = useMemo(() => {
    return criticalAlerts.reduce((sum, r) => sum + r.totalValue, 0);
  }, [criticalAlerts]);

  const statusStats = useMemo(() => {
    const stats: Record<string, { count: number; totalValue: number }> = {};
    expiryRecords.forEach((record) => {
      if (!stats[record.status]) {
        stats[record.status] = { count: 0, totalValue: 0 };
      }
      stats[record.status].count++;
      stats[record.status].totalValue += record.totalValue;
    });
    return stats;
  }, [expiryRecords]);

  const priorityStats = useMemo(() => {
    const stats: Record<string, number> = {};
    expiryRecords.forEach((record) => {
      stats[record.priority] = (stats[record.priority] || 0) + 1;
    });
    return stats;
  }, [expiryRecords]);

  const expiryTimeline = useMemo(() => {
    const timeline: Record<string, number> = {};
    expiryRecords.forEach((record) => {
      const days = Math.floor(record.daysUntilExpiry / 30) * 30; // Group by 30-day intervals
      const key =
        days < 0
          ? "Expired"
          : days === 0
            ? "0-30 days"
            : `${days}-${days + 30} days`;
      timeline[key] = (timeline[key] || 0) + 1;
    });
    return Object.entries(timeline).map(([period, count]) => ({
      period,
      count,
    }));
  }, [expiryRecords]);

  const chartData = useMemo(() => {
    return Object.entries(statusStats).map(([status, data]) => ({
      status: status.replace(/_/g, " "),
      count: data.count,
      totalValue: data.totalValue,
    }));
  }, [statusStats]);

  const priorityData = useMemo(() => {
    return Object.entries(priorityStats).map(([priority, count]) => ({
      priority,
      count,
    }));
  }, [priorityStats]);

  const locations = [
    "ALL",
    ...Array.from(new Set(expiryRecords.map((r) => r.location.split("-")[0]))),
  ];

  const aggregateStats = useMemo(() => {
    return {
      totalItems: expiryRecords.length,
      expired: expiredItems.length,
      expiringSoon: expiringSoon.length,
      valueAtRisk: totalValueAtRisk,
    };
  }, [
    expiryRecords.length,
    expiredItems.length,
    expiringSoon.length,
    totalValueAtRisk,
  ]);

  useEffect(() => {
    if (!realTimeEnabled) return;

    const unsubscribe = realtimeSimulator.subscribe(
      "expiry-management-stats",
      (data: typeof realTimeStats) => {
        setRealTimeStats(data);
      },
    );

    const stop = realtimeSimulator.start(
      "expiry-management-stats",
      () => ({
        totalItems: aggregateStats.totalItems,
        expired: simulateKPIUpdates(aggregateStats.expired, 0.1),
        expiringSoon: simulateKPIUpdates(aggregateStats.expiringSoon, 0.05),
        valueAtRisk: simulateKPIUpdates(aggregateStats.valueAtRisk, 0.02),
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
    aggregateStats.totalItems,
    aggregateStats.expired,
    aggregateStats.expiringSoon,
    aggregateStats.valueAtRisk,
  ]);

  const stats = [
    {
      label: "Total Items",
      value: realTimeEnabled
        ? realTimeStats.totalItems
        : aggregateStats.totalItems,
      icon: "ri-stack-line",
      tooltip: "Total items with expiry tracking",
      trend: "up" as const,
    },
    {
      label: "Expired",
      value: realTimeEnabled ? realTimeStats.expired : aggregateStats.expired,
      icon: "ri-error-warning-line",
      tooltip: "Items that have expired",
      trend: "neutral" as const,
    },
    {
      label: "Expiring Soon",
      value: realTimeEnabled
        ? realTimeStats.expiringSoon
        : aggregateStats.expiringSoon,
      icon: "ri-time-line",
      tooltip: `Items expiring within ${alertDays} days`,
      trend: "neutral" as const,
    },
    {
      label: "Value at Risk",
      value: `AED ${(realTimeEnabled ? realTimeStats.valueAtRisk : aggregateStats.valueAtRisk).toLocaleString()}`,
      icon: "ri-money-dollar-circle-line",
      tooltip: "Total value of items requiring attention",
      trend: "neutral" as const,
    },
  ];

  const COLORS = {
    ACTIVE: "#10b981",
    EXPIRING_SOON: "#f59e0b",
    EXPIRED: "#ef4444",
    QUARANTINE: "#8b5cf6",
    DISPOSED: "#6b7280",
  };

  const PRIORITY_COLORS = {
    LOW: "#10b981",
    MEDIUM: "#f59e0b",
    HIGH: "#ef4444",
    CRITICAL: "#dc2626",
  };

  if (loading) {
    return (
      <PageTemplate
        title="Expiry Management"
        description="Expiry tracking and management"
        icon="ri-time-line"
      >
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
            <p className="text-white">Loading expiry records...</p>
          </div>
        </div>
      </PageTemplate>
    );
  }

  if (error) {
    return (
      <PageTemplate
        title="Expiry Management"
        description="Expiry tracking and management"
        icon="ri-time-line"
      >
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <p className="text-red-400 mb-4">Error: {error}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Retry
            </button>
          </div>
        </div>
      </PageTemplate>
    );
  }

  return (
    <PageTemplate
      title="Expiry Management"
      description="Expiry tracking and management - Monitor, alert, and manage material expiry dates with FEFO/FIFO support and automated alerts"
      icon="ri-time-line"
      systemInfo={{
        sap: "Expiry Management - Batch Management (MSC1N, MMBE), Shelf Life Management",
        oracle: "Expiry Tracking - Lot Expiry Management, Shelf Life Control",
        manhattan:
          "Expiry Management - FEFO/FIFO, Expiry Alerts, Shelf Life Tracking",
      }}
      examples={[
        "Track expiry dates for all materials and batches",
        "Monitor items expiring soon with automated alerts",
        "FEFO (First Expiry First Out) picking strategy",
        "Expired items quarantine and disposal management",
        "Expiry analytics and reporting",
        "Shelf life tracking and management",
      ]}
      stats={stats}
      actions={
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-lg p-1">
            {(["table", "grid", "analytics", "alerts"] as const).map((mode) => (
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
                  className={`ri-${mode === "table" ? "table-line" : mode === "grid" ? "grid-line" : mode === "analytics" ? "bar-chart-line" : "alarm-line"} mr-1`}
                ></i>
                {mode.charAt(0).toUpperCase() + mode.slice(1)}
              </button>
            ))}
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
          <Tooltip content="Export Expiry Report" position="bottom">
            <button className="bg-white/5 border border-white/10 hover:border-cyan-500/50 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2">
              <i className="ri-download-line"></i>
              Export
            </button>
          </Tooltip>
        </div>
      }
    >
      {/* Filters */}
      <div className="mb-6 flex items-center gap-4 flex-wrap">
        <div className="relative flex-1 min-w-[300px] max-w-md">
          <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-[#9ca3af] text-sm"></i>
          <input
            type="text"
            placeholder="Search by Material, Batch, Serial Number..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-lg pl-10 pr-4 py-2.5 text-sm text-white placeholder-[#6b7280] focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all"
          />
        </div>
        <select
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
          className="bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 min-w-[180px]"
        >
          <option value="ALL">All Status</option>
          <option value="ACTIVE">Active</option>
          <option value="EXPIRING_SOON">Expiring Soon</option>
          <option value="EXPIRED">Expired</option>
          <option value="QUARANTINE">Quarantine</option>
          <option value="DISPOSED">Disposed</option>
        </select>
        <select
          value={selectedPriority}
          onChange={(e) => setSelectedPriority(e.target.value)}
          className="bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 min-w-[180px]"
        >
          <option value="ALL">All Priority</option>
          <option value="LOW">Low</option>
          <option value="MEDIUM">Medium</option>
          <option value="HIGH">High</option>
          <option value="CRITICAL">Critical</option>
        </select>
        <select
          value={selectedLocation}
          onChange={(e) => setSelectedLocation(e.target.value)}
          className="bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 min-w-[180px]"
        >
          <option value="ALL">All Locations</option>
          {locations
            .filter((l) => l !== "ALL")
            .map((loc) => (
              <option key={loc} value={loc}>
                {loc}
              </option>
            ))}
        </select>
      </div>

      {/* View Modes */}
      {viewMode === "table" && (
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-white/5 border-b border-white/10">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium text-[#9ca3af] uppercase tracking-wider">
                    Material
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-[#9ca3af] uppercase tracking-wider">
                    Batch/Serial
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-[#9ca3af] uppercase tracking-wider">
                    Location
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-[#9ca3af] uppercase tracking-wider">
                    Quantity
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-[#9ca3af] uppercase tracking-wider">
                    Expiry Date
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-[#9ca3af] uppercase tracking-wider">
                    Days Until
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-[#9ca3af] uppercase tracking-wider">
                    Priority
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-[#9ca3af] uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-[#9ca3af] uppercase tracking-wider">
                    FEFO
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-[#9ca3af] uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {filteredRecords.map((record, index) => (
                  <motion.tr
                    key={record.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.01 }}
                    className={`hover:bg-white/5 transition-colors ${
                      record.requiresDisposal
                        ? "bg-red-500/5"
                        : record.requiresAttention
                          ? "bg-yellow-500/5"
                          : ""
                    }`}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-white font-mono">
                          {record.materialNumber}
                        </div>
                        <div className="text-xs text-[#9ca3af]">
                          {record.materialDescription}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm text-white font-mono">
                          {record.batchNumber}
                        </div>
                        {record.serialNumber && (
                          <div className="text-xs text-[#9ca3af]">
                            S/N: {record.serialNumber}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-white font-mono">
                        {record.location}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-white font-medium">
                        {record.quantity.toFixed(2)}
                      </div>
                      <div className="text-xs text-[#9ca3af]">
                        {record.unit}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div
                        className={`text-sm font-medium ${
                          record.daysUntilExpiry < 0
                            ? "text-red-400"
                            : record.daysUntilExpiry <= 30
                              ? "text-yellow-400"
                              : "text-white"
                        }`}
                      >
                        {format(new Date(record.expiryDate), "MMM dd, yyyy")}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div
                        className={`text-sm font-medium ${
                          record.daysUntilExpiry < 0
                            ? "text-red-400"
                            : record.daysUntilExpiry <= 7
                              ? "text-red-400"
                              : record.daysUntilExpiry <= 30
                                ? "text-yellow-400"
                                : "text-white"
                        }`}
                      >
                        {record.daysUntilExpiry < 0
                          ? `Expired ${Math.abs(record.daysUntilExpiry)} days ago`
                          : `${record.daysUntilExpiry} days`}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${
                          record.priority === "CRITICAL"
                            ? "bg-red-500/20 text-red-400 border border-red-500/30"
                            : record.priority === "HIGH"
                              ? "bg-orange-500/20 text-orange-400 border border-orange-500/30"
                              : record.priority === "MEDIUM"
                                ? "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30"
                                : "bg-green-500/20 text-green-400 border border-green-500/30"
                        }`}
                      >
                        {record.priority}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${
                          (record.status as string) === "EXPIRED"
                            ? "bg-red-500/20 text-red-400 border border-red-500/30"
                            : (record.status as string) === "EXPIRING_SOON"
                              ? "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30"
                              : (record.status as string) === "QUARANTINE"
                                ? "bg-purple-500/20 text-purple-400 border border-purple-500/30"
                                : (record.status as string) === "DISPOSED"
                                  ? "bg-gray-500/20 text-gray-400 border border-gray-500/30"
                                  : "bg-green-500/20 text-green-400 border border-green-500/30"
                        }`}
                      >
                        {String(record.status).replace(/_/g, " ")}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-xs text-[#9ca3af]">
                        Rank: {index + 1}
                      </div>
                      <div className="text-xs text-cyan-400">FEFO Priority</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => {
                          setSelectedRecord(record);
                          setShowViewModal(true);
                        }}
                        className="p-2 bg-cyan-600/20 text-cyan-400 border border-cyan-500/30 rounded hover:bg-cyan-600/30 transition-colors"
                      >
                        <i className="ri-eye-line"></i>
                      </button>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {viewMode === "grid" && (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredRecords.map((record, index) => (
            <motion.div
              key={record.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.03 }}
              className={`bg-white/5 backdrop-blur-xl border rounded-xl p-6 hover:border-cyan-500/50 hover:shadow-lg hover:shadow-cyan-500/10 transition-all cursor-pointer ${
                record.requiresDisposal
                  ? "border-red-500/30 bg-red-500/5"
                  : record.requiresAttention
                    ? "border-yellow-500/30 bg-yellow-500/5"
                    : "border-white/10"
              }`}
              onClick={() => {
                setSelectedRecord(record);
                setShowViewModal(true);
              }}
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-white font-mono mb-1">
                    {record.materialNumber}
                  </h3>
                  <p className="text-sm text-[#9ca3af]">
                    {record.materialDescription}
                  </p>
                </div>
                <span
                  className={`px-2 py-1 rounded text-xs font-medium ${
                    record.priority === "CRITICAL"
                      ? "bg-red-500/20 text-red-400"
                      : record.priority === "HIGH"
                        ? "bg-orange-500/20 text-orange-400"
                        : record.priority === "MEDIUM"
                          ? "bg-yellow-500/20 text-yellow-400"
                          : "bg-green-500/20 text-green-400"
                  }`}
                >
                  {record.priority}
                </span>
              </div>
              <div className="space-y-2 mb-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-[#9ca3af]">Batch:</span>
                  <span className="text-white font-mono">
                    {record.batchNumber}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-[#9ca3af]">Expiry Date:</span>
                  <span
                    className={`font-medium ${
                      record.daysUntilExpiry < 0
                        ? "text-red-400"
                        : record.daysUntilExpiry <= 30
                          ? "text-yellow-400"
                          : "text-white"
                    }`}
                  >
                    {format(new Date(record.expiryDate), "MMM dd, yyyy")}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-[#9ca3af]">Days Until:</span>
                  <span
                    className={`font-medium ${
                      record.daysUntilExpiry < 0
                        ? "text-red-400"
                        : record.daysUntilExpiry <= 7
                          ? "text-red-400"
                          : record.daysUntilExpiry <= 30
                            ? "text-yellow-400"
                            : "text-white"
                    }`}
                  >
                    {record.daysUntilExpiry < 0
                      ? `Expired ${Math.abs(record.daysUntilExpiry)}d ago`
                      : `${record.daysUntilExpiry} days`}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-[#9ca3af]">Quantity:</span>
                  <span className="text-white">
                    {record.quantity.toFixed(2)} {record.unit}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-[#9ca3af]">Total Value:</span>
                  <span className="text-white font-medium">
                    AED {record.totalValue.toFixed(2)}
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {viewMode === "analytics" && (
        <div className="grid md:grid-cols-2 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
          >
            <h3 className="text-lg font-semibold text-white mb-4">
              Expiry Status Distribution
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ status, count }) => `${status}: ${count}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="count"
                >
                  {chartData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={
                        Object.values(COLORS)[
                          index % Object.keys(COLORS).length
                        ]
                      }
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
              Priority Distribution
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={priorityData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="priority" stroke="#9ca3af" fontSize={12} />
                <YAxis stroke="#9ca3af" fontSize={12} />
                <RechartsTooltip
                  contentStyle={{
                    backgroundColor: "#1f2937",
                    border: "1px solid #374151",
                    borderRadius: "8px",
                  }}
                  labelStyle={{ color: "#fff" }}
                />
                <Bar dataKey="count" fill="#06b6d4" />
              </BarChart>
            </ResponsiveContainer>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 md:col-span-2"
          >
            <h3 className="text-lg font-semibold text-white mb-4">
              Expiry Timeline (Next 6 Months)
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={expiryTimeline}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="period" stroke="#9ca3af" fontSize={12} />
                <YAxis stroke="#9ca3af" fontSize={12} />
                <RechartsTooltip
                  contentStyle={{
                    backgroundColor: "#1f2937",
                    border: "1px solid #374151",
                    borderRadius: "8px",
                  }}
                  labelStyle={{ color: "#fff" }}
                />
                <Bar dataKey="count" fill="#06b6d4" />
              </BarChart>
            </ResponsiveContainer>
          </motion.div>
        </div>
      )}

      {viewMode === "alerts" && (
        <div className="space-y-4">
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-red-400 flex items-center gap-2">
                <i className="ri-error-warning-line"></i>
                Critical Alerts - Expired Items
              </h3>
              <span className="px-3 py-1 bg-red-500/20 text-red-400 rounded-full text-sm font-medium">
                {expiredItems.length} items
              </span>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {expiredItems.slice(0, 9).map((item, index) => (
                <div
                  key={item.id}
                  className="bg-white/5 border border-red-500/30 rounded-lg p-4"
                >
                  <div className="text-sm font-medium text-white font-mono mb-1">
                    {item.materialNumber}
                  </div>
                  <div className="text-xs text-[#9ca3af] mb-2">
                    {item.batchNumber}
                  </div>
                  <div className="text-xs text-red-400">
                    Expired {Math.abs(item.daysUntilExpiry)} days ago
                  </div>
                  <div className="text-xs text-white mt-1">
                    Value: AED {item.totalValue.toFixed(2)}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-yellow-400 flex items-center gap-2">
                <i className="ri-alarm-line"></i>
                Expiring Soon - Requires Attention
              </h3>
              <span className="px-3 py-1 bg-yellow-500/20 text-yellow-400 rounded-full text-sm font-medium">
                {expiringSoon.length} items
              </span>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {expiringSoon.slice(0, 9).map((item, index) => (
                <div
                  key={item.id}
                  className="bg-white/5 border border-yellow-500/30 rounded-lg p-4"
                >
                  <div className="text-sm font-medium text-white font-mono mb-1">
                    {item.materialNumber}
                  </div>
                  <div className="text-xs text-[#9ca3af] mb-2">
                    {item.batchNumber}
                  </div>
                  <div className="text-xs text-yellow-400">
                    {item.daysUntilExpiry} days until expiry
                  </div>
                  <div className="text-xs text-white mt-1">
                    Value: AED {item.totalValue.toFixed(2)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* View Modal */}
      <Modal
        isOpen={showViewModal}
        onClose={() => {
          setShowViewModal(false);
          setSelectedRecord(null);
        }}
        title={`Expiry Details - ${selectedRecord?.materialNumber || ""}`}
        size="lg"
      >
        {selectedRecord && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-[#9ca3af] mb-1 block">
                  Material Number
                </label>
                <div className="text-sm text-white font-mono">
                  {selectedRecord.materialNumber}
                </div>
              </div>
              <div>
                <label className="text-xs text-[#9ca3af] mb-1 block">
                  Material Description
                </label>
                <div className="text-sm text-white">
                  {selectedRecord.materialDescription}
                </div>
              </div>
              <div>
                <label className="text-xs text-[#9ca3af] mb-1 block">
                  Batch Number
                </label>
                <div className="text-sm text-white font-mono">
                  {selectedRecord.batchNumber}
                </div>
              </div>
              {selectedRecord.serialNumber && (
                <div>
                  <label className="text-xs text-[#9ca3af] mb-1 block">
                    Serial Number
                  </label>
                  <div className="text-sm text-white font-mono">
                    {selectedRecord.serialNumber}
                  </div>
                </div>
              )}
              <div>
                <label className="text-xs text-[#9ca3af] mb-1 block">
                  Location
                </label>
                <div className="text-sm text-white font-mono">
                  {selectedRecord.location}
                </div>
              </div>
              <div>
                <label className="text-xs text-[#9ca3af] mb-1 block">
                  Quantity
                </label>
                <div className="text-sm text-white">
                  {selectedRecord.quantity.toFixed(2)} {selectedRecord.unit}
                </div>
              </div>
              <div>
                <label className="text-xs text-[#9ca3af] mb-1 block">
                  Production Date
                </label>
                <div className="text-sm text-white">
                  {format(
                    new Date(selectedRecord.productionDate),
                    "MMM dd, yyyy",
                  )}
                </div>
              </div>
              <div>
                <label className="text-xs text-[#9ca3af] mb-1 block">
                  Expiry Date
                </label>
                <div
                  className={`text-sm font-medium ${
                    selectedRecord.daysUntilExpiry < 0
                      ? "text-red-400"
                      : selectedRecord.daysUntilExpiry <= 30
                        ? "text-yellow-400"
                        : "text-white"
                  }`}
                >
                  {format(new Date(selectedRecord.expiryDate), "MMM dd, yyyy")}
                </div>
              </div>
              <div>
                <label className="text-xs text-[#9ca3af] mb-1 block">
                  Days Until Expiry
                </label>
                <div
                  className={`text-sm font-medium ${
                    selectedRecord.daysUntilExpiry < 0
                      ? "text-red-400"
                      : selectedRecord.daysUntilExpiry <= 7
                        ? "text-red-400"
                        : selectedRecord.daysUntilExpiry <= 30
                          ? "text-yellow-400"
                          : "text-white"
                  }`}
                >
                  {selectedRecord.daysUntilExpiry < 0
                    ? `Expired ${Math.abs(selectedRecord.daysUntilExpiry)} days ago`
                    : `${selectedRecord.daysUntilExpiry} days`}
                </div>
              </div>
              <div>
                <label className="text-xs text-[#9ca3af] mb-1 block">
                  Shelf Life
                </label>
                <div className="text-sm text-white">
                  {selectedRecord.shelfLife} days
                </div>
              </div>
              <div>
                <label className="text-xs text-[#9ca3af] mb-1 block">
                  Priority
                </label>
                <span
                  className={`px-2 py-1 rounded text-xs font-medium ${
                    selectedRecord.priority === "CRITICAL"
                      ? "bg-red-500/20 text-red-400"
                      : selectedRecord.priority === "HIGH"
                        ? "bg-orange-500/20 text-orange-400"
                        : selectedRecord.priority === "MEDIUM"
                          ? "bg-yellow-500/20 text-yellow-400"
                          : "bg-green-500/20 text-green-400"
                  }`}
                >
                  {selectedRecord.priority}
                </span>
              </div>
              <div>
                <label className="text-xs text-[#9ca3af] mb-1 block">
                  Status
                </label>
                <span
                  className={`px-2 py-1 rounded text-xs font-medium ${
                    selectedRecord.status === "EXPIRED"
                      ? "bg-red-500/20 text-red-400"
                      : (selectedRecord.status as string) === "EXPIRING_SOON"
                        ? "bg-yellow-500/20 text-yellow-400"
                        : "bg-green-500/20 text-green-400"
                  }`}
                >
                  {selectedRecord.status.replace(/_/g, " ")}
                </span>
              </div>
              <div>
                <label className="text-xs text-[#9ca3af] mb-1 block">
                  Total Value
                </label>
                <div className="text-sm text-white font-medium">
                  AED {selectedRecord.totalValue.toFixed(2)}
                </div>
              </div>
              <div>
                <label className="text-xs text-[#9ca3af] mb-1 block">
                  FEFO Priority
                </label>
                <div className="text-sm text-cyan-400">
                  Rank:{" "}
                  {filteredRecords.findIndex(
                    (r) => r.id === selectedRecord.id,
                  ) + 1}
                </div>
              </div>
            </div>
            {selectedRecord.requiresDisposal && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
                <div className="text-sm font-medium text-red-400 mb-2">
                  ⚠️ Requires Immediate Disposal
                </div>
                <div className="text-xs text-[#9ca3af]">
                  This item has expired and requires disposal action.
                </div>
              </div>
            )}
            {selectedRecord.requiresAttention &&
              !selectedRecord.requiresDisposal && (
                <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
                  <div className="text-sm font-medium text-yellow-400 mb-2">
                    ⚠️ Requires Attention
                  </div>
                  <div className="text-xs text-[#9ca3af]">
                    This item is expiring soon and requires immediate action.
                  </div>
                </div>
              )}
          </div>
        )}
      </Modal>
    </PageTemplate>
  );
}
