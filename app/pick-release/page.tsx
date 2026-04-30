"use client";

import { useState, useMemo, useEffect } from "react";
import { motion } from "framer-motion";
import PageTemplate from "@/components/PageTemplate";
import Tooltip from "@/components/Tooltip";
import Modal from "@/components/Modal";
import ConfirmDialog from "@/components/ConfirmDialog";
import { generatePickReleases } from "@/utils/mockDataGenerators";
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
} from "recharts";
import {
  realtimeSimulator,
  simulateKPIUpdates,
} from "@/utils/realtimeDataSimulator";

export default function PickRelease() {
  const [releases, setReleases] = useState(() => generatePickReleases(70));
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");
  const [selectedPriority, setSelectedPriority] = useState<string>("ALL");
  const [viewMode, setViewMode] = useState<"table" | "grid" | "analytics">(
    "table",
  );
  const [selectedRelease, setSelectedRelease] = useState<any>(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showReleaseDialog, setShowReleaseDialog] = useState(false);
  const [realTimeEnabled, setRealTimeEnabled] = useState(true);
  const [realTimeStats, setRealTimeStats] = useState({
    totalReleases: 0,
    released: 0,
    pending: 0,
    onHold: 0,
  });

  const filteredReleases = useMemo(() => {
    return releases.filter((release) => {
      const matchesSearch =
        release.releaseNumber
          .toLowerCase()
          .includes(searchQuery.toLowerCase()) ||
        release.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        release.customerName.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus =
        selectedStatus === "ALL" || release.status === selectedStatus;
      const matchesPriority =
        selectedPriority === "ALL" || release.priority === selectedPriority;
      return matchesSearch && matchesStatus && matchesPriority;
    });
  }, [releases, searchQuery, selectedStatus, selectedPriority]);

  const pendingReleases = useMemo(() => {
    return releases.filter((r) => r.status === "PENDING");
  }, [releases]);

  const onHoldReleases = useMemo(() => {
    return releases.filter((r) => r.status === "ON_HOLD");
  }, [releases]);

  const statusStats = useMemo(() => {
    const stats: Record<string, number> = {};
    releases.forEach((release) => {
      stats[release.status] = (stats[release.status] || 0) + 1;
    });
    return stats;
  }, [releases]);

  const chartData = useMemo(() => {
    return Object.entries(statusStats).map(([status, count]) => ({
      status,
      count,
    }));
  }, [statusStats]);

  const aggregateStats = useMemo(() => {
    return {
      totalReleases: releases.length,
      released: releases.filter((r) => r.status === "RELEASED").length,
      pending: pendingReleases.length,
      onHold: onHoldReleases.length,
    };
  }, [
    releases.length,
    releases,
    pendingReleases.length,
    onHoldReleases.length,
  ]);

  useEffect(() => {
    if (!realTimeEnabled) return;

    const unsubscribe = realtimeSimulator.subscribe(
      "pick-release-stats",
      (data: typeof realTimeStats) => {
        setRealTimeStats(data);
      },
    );

    const stop = realtimeSimulator.start(
      "pick-release-stats",
      () => ({
        totalReleases: aggregateStats.totalReleases,
        released: simulateKPIUpdates(aggregateStats.released, 0.05),
        pending: simulateKPIUpdates(aggregateStats.pending, 0.1),
        onHold: simulateKPIUpdates(aggregateStats.onHold, 0.05),
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
    aggregateStats.totalReleases,
    aggregateStats.released,
    aggregateStats.pending,
    aggregateStats.onHold,
  ]);

  const stats = [
    {
      label: "Total Releases",
      value: realTimeEnabled
        ? realTimeStats.totalReleases
        : aggregateStats.totalReleases,
      icon: "ri-play-circle-line",
      tooltip: "Total pick releases",
      trend: "up" as const,
    },
    {
      label: "Released",
      value: realTimeEnabled ? realTimeStats.released : aggregateStats.released,
      icon: "ri-checkbox-circle-line",
      tooltip: "Orders released for picking",
      trend: "up" as const,
    },
    {
      label: "Pending",
      value: realTimeEnabled ? realTimeStats.pending : aggregateStats.pending,
      icon: "ri-time-line",
      tooltip: "Orders pending release",
      trend: "neutral" as const,
    },
    {
      label: "On Hold",
      value: realTimeEnabled ? realTimeStats.onHold : aggregateStats.onHold,
      icon: "ri-pause-circle-line",
      tooltip: "Orders on hold",
      trend: "neutral" as const,
    },
  ];

  const COLORS = {
    RELEASED: "#10b981",
    PENDING: "#f59e0b",
    ON_HOLD: "#ef4444",
  };

  const handleRelease = (release: any) => {
    setSelectedRelease(release);
    setShowReleaseDialog(true);
  };

  const confirmRelease = () => {
    if (selectedRelease) {
      setReleases((prev) =>
        prev.map((r) =>
          r.id === selectedRelease.id
            ? {
                ...r,
                status: "RELEASED" as any,
                releaseDate: new Date(),
                releasedBy: "Current User",
              }
            : r,
        ),
      );
      setShowReleaseDialog(false);
      setSelectedRelease(null);
    }
  };

  return (
    <PageTemplate
      title="Pick Release"
      description="Release orders for picking - Review, approve, and release orders for picking operations with stock availability checks"
      icon="ri-play-circle-line"
      systemInfo={{
        sap: "Pick Release - Order Release, Stock Availability Check",
        oracle: "Pick Release - Order Release Management",
        manhattan: "Pick Release - Order Release, Availability Management",
      }}
      examples={[
        "Review orders before releasing for picking",
        "Check stock availability before release",
        "Release orders individually or in bulk",
        "Handle orders on hold (credit, stock, quality)",
        "Assign picking strategy during release",
        "Track release status and history",
      ]}
      stats={stats}
      actions={
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-lg p-1">
            {(["table", "grid", "analytics"] as const).map((mode) => (
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
                  className={`ri-${mode === "table" ? "table-line" : mode === "grid" ? "grid-line" : "bar-chart-line"} mr-1`}
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
          {pendingReleases.length > 0 && (
            <Tooltip
              content={`Release ${pendingReleases.length} Pending Orders`}
              position="bottom"
            >
              <button
                onClick={() => {
                  // Bulk release logic
                  setReleases((prev) =>
                    prev.map((r) =>
                      r.status === "PENDING"
                        ? {
                            ...r,
                            status: "RELEASED" as any,
                            releaseDate: new Date(),
                            releasedBy: "Current User",
                          }
                        : r,
                    ),
                  );
                }}
                className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white px-6 py-3 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 shadow-lg shadow-cyan-500/20"
              >
                <i className="ri-play-line"></i>
                Release All ({pendingReleases.length})
              </button>
            </Tooltip>
          )}
        </div>
      }
    >
      {/* Filters */}
      <div className="mb-6 flex items-center gap-4 flex-wrap">
        <div className="relative flex-1 min-w-[300px] max-w-md">
          <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-[#9ca3af] text-sm"></i>
          <input
            type="text"
            placeholder="Search by Release Number, Order, Customer..."
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
          <option value="RELEASED">Released</option>
          <option value="PENDING">Pending</option>
          <option value="ON_HOLD">On Hold</option>
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
          <option value="URGENT">Urgent</option>
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
                    Release Number
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-[#9ca3af] uppercase tracking-wider">
                    Order Number
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-[#9ca3af] uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-[#9ca3af] uppercase tracking-wider">
                    Items
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-[#9ca3af] uppercase tracking-wider">
                    Value
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-[#9ca3af] uppercase tracking-wider">
                    Required Date
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-[#9ca3af] uppercase tracking-wider">
                    Stock Availability
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-[#9ca3af] uppercase tracking-wider">
                    Picking Strategy
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-[#9ca3af] uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-[#9ca3af] uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {filteredReleases.map((release, index) => (
                  <motion.tr
                    key={release.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.02 }}
                    className={`hover:bg-white/5 transition-colors ${
                      release.status === "ON_HOLD"
                        ? "bg-red-500/5"
                        : release.status === "PENDING"
                          ? "bg-yellow-500/5"
                          : ""
                    }`}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-white font-mono">
                        {release.releaseNumber}
                      </div>
                      {release.releaseDate && (
                        <div className="text-xs text-[#9ca3af]">
                          {format(
                            new Date(release.releaseDate),
                            "MMM dd, yyyy",
                          )}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Tooltip
                        content={`Order: ${release.orderNumber}`}
                        position="right"
                      >
                        <div className="text-sm text-white font-mono cursor-help">
                          {release.orderNumber}
                        </div>
                      </Tooltip>
                      <div className="text-xs text-[#9ca3af]">
                        {format(new Date(release.orderDate), "MMM dd, yyyy")}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm text-white">
                          {release.customerName}
                        </div>
                        <div className="text-xs text-[#9ca3af]">
                          {release.customerNumber}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-white font-medium">
                        {release.totalItems}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-white font-medium">
                        {release.currency} {release.totalValue.toLocaleString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-white">
                        {format(new Date(release.requiredDate), "MMM dd, yyyy")}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-white/5 rounded-full h-2 overflow-hidden">
                          <div
                            className={`h-full ${
                              release.stockAvailability >= 100
                                ? "bg-green-500"
                                : release.stockAvailability >= 80
                                  ? "bg-yellow-500"
                                  : "bg-red-500"
                            }`}
                            style={{
                              width: `${Math.min(release.stockAvailability, 100)}%`,
                            }}
                          ></div>
                        </div>
                        <span className="text-xs text-white w-12 text-right">
                          {release.stockAvailability.toFixed(0)}%
                        </span>
                      </div>
                      {!release.availableStock && (
                        <div className="text-xs text-red-400 mt-1">
                          Stock Unavailable
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-white">
                        {release.pickingStrategy}
                      </div>
                      {release.waveNumber && (
                        <div className="text-xs text-cyan-400 font-mono">
                          {release.waveNumber}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col gap-1">
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium ${
                            release.status === "RELEASED"
                              ? "bg-green-500/20 text-green-400 border border-green-500/30"
                              : release.status === "PENDING"
                                ? "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30"
                                : "bg-red-500/20 text-red-400 border border-red-500/30"
                          }`}
                        >
                          {release.status}
                        </span>
                        {release.holdReason && (
                          <div className="text-xs text-red-400">
                            {release.holdReason.replace(/_/g, " ")}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        {release.status === "PENDING" &&
                          release.availableStock && (
                            <Tooltip content="Release Order" position="top">
                              <button
                                onClick={() => handleRelease(release)}
                                className="p-2 bg-green-600/20 text-green-400 border border-green-500/30 rounded hover:bg-green-600/30 transition-colors"
                              >
                                <i className="ri-play-line"></i>
                              </button>
                            </Tooltip>
                          )}
                        <Tooltip content="View Details" position="top">
                          <button
                            onClick={() => {
                              setSelectedRelease(release);
                              setShowViewModal(true);
                            }}
                            className="p-2 bg-cyan-600/20 text-cyan-400 border border-cyan-500/30 rounded hover:bg-cyan-600/30 transition-colors"
                          >
                            <i className="ri-eye-line"></i>
                          </button>
                        </Tooltip>
                      </div>
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
          {filteredReleases.map((release, index) => (
            <motion.div
              key={release.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.03 }}
              className={`bg-white/5 backdrop-blur-xl border rounded-xl p-6 hover:border-cyan-500/50 hover:shadow-lg hover:shadow-cyan-500/10 transition-all cursor-pointer ${
                release.status === "ON_HOLD"
                  ? "border-red-500/30 bg-red-500/5"
                  : release.status === "PENDING"
                    ? "border-yellow-500/30 bg-yellow-500/5"
                    : "border-white/10"
              }`}
              onClick={() => {
                setSelectedRelease(release);
                setShowViewModal(true);
              }}
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-white font-mono mb-1">
                    {release.releaseNumber}
                  </h3>
                  <p className="text-sm text-[#9ca3af]">
                    {release.orderNumber}
                  </p>
                </div>
                <span
                  className={`px-2 py-1 rounded text-xs font-medium ${
                    release.status === "RELEASED"
                      ? "bg-green-500/20 text-green-400"
                      : release.status === "PENDING"
                        ? "bg-yellow-500/20 text-yellow-400"
                        : "bg-red-500/20 text-red-400"
                  }`}
                >
                  {release.status}
                </span>
              </div>
              <div className="space-y-2 mb-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-[#9ca3af]">Customer:</span>
                  <span className="text-white">{release.customerName}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-[#9ca3af]">Items:</span>
                  <span className="text-white font-medium">
                    {release.totalItems}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-[#9ca3af]">Value:</span>
                  <span className="text-white font-medium">
                    {release.currency} {release.totalValue.toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-[#9ca3af]">Stock Availability:</span>
                  <span
                    className={`font-medium ${
                      release.stockAvailability >= 100
                        ? "text-green-400"
                        : release.stockAvailability >= 80
                          ? "text-yellow-400"
                          : "text-red-400"
                    }`}
                  >
                    {release.stockAvailability.toFixed(0)}%
                  </span>
                </div>
                {release.holdReason && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-[#9ca3af]">Hold Reason:</span>
                    <span className="text-red-400 text-xs">
                      {release.holdReason.replace(/_/g, " ")}
                    </span>
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {viewMode === "analytics" && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
        >
          <h3 className="text-lg font-semibold text-white mb-4">
            Release Status Distribution
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
                    fill={COLORS[entry.status as keyof typeof COLORS]}
                  />
                ))}
              </Pie>
              <RechartsTooltip />
            </PieChart>
          </ResponsiveContainer>
        </motion.div>
      )}

      {/* View Modal */}
      <Modal
        isOpen={showViewModal}
        onClose={() => {
          setShowViewModal(false);
          setSelectedRelease(null);
        }}
        title={`Pick Release Details - ${selectedRelease?.releaseNumber || ""}`}
        size="lg"
      >
        {selectedRelease && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-[#9ca3af] mb-1 block">
                  Release Number
                </label>
                <div className="text-sm text-white font-mono">
                  {selectedRelease.releaseNumber}
                </div>
              </div>
              <div>
                <label className="text-xs text-[#9ca3af] mb-1 block">
                  Status
                </label>
                <span
                  className={`px-2 py-1 rounded text-xs font-medium ${
                    selectedRelease.status === "RELEASED"
                      ? "bg-green-500/20 text-green-400"
                      : selectedRelease.status === "PENDING"
                        ? "bg-yellow-500/20 text-yellow-400"
                        : "bg-red-500/20 text-red-400"
                  }`}
                >
                  {selectedRelease.status}
                </span>
              </div>
              <div>
                <label className="text-xs text-[#9ca3af] mb-1 block">
                  Order Number
                </label>
                <div className="text-sm text-white font-mono">
                  {selectedRelease.orderNumber}
                </div>
              </div>
              <div>
                <label className="text-xs text-[#9ca3af] mb-1 block">
                  Customer
                </label>
                <div className="text-sm text-white">
                  {selectedRelease.customerName}
                </div>
                <div className="text-xs text-[#9ca3af]">
                  {selectedRelease.customerNumber}
                </div>
              </div>
              <div>
                <label className="text-xs text-[#9ca3af] mb-1 block">
                  Total Items
                </label>
                <div className="text-sm text-white font-medium">
                  {selectedRelease.totalItems}
                </div>
              </div>
              <div>
                <label className="text-xs text-[#9ca3af] mb-1 block">
                  Total Value
                </label>
                <div className="text-sm text-white font-medium">
                  {selectedRelease.currency}{" "}
                  {selectedRelease.totalValue.toLocaleString()}
                </div>
              </div>
              <div>
                <label className="text-xs text-[#9ca3af] mb-1 block">
                  Required Date
                </label>
                <div className="text-sm text-white">
                  {format(
                    new Date(selectedRelease.requiredDate),
                    "MMM dd, yyyy",
                  )}
                </div>
              </div>
              <div>
                <label className="text-xs text-[#9ca3af] mb-1 block">
                  Stock Availability
                </label>
                <div
                  className={`text-sm font-medium ${
                    selectedRelease.stockAvailability >= 100
                      ? "text-green-400"
                      : selectedRelease.stockAvailability >= 80
                        ? "text-yellow-400"
                        : "text-red-400"
                  }`}
                >
                  {selectedRelease.stockAvailability.toFixed(0)}%
                </div>
              </div>
              <div>
                <label className="text-xs text-[#9ca3af] mb-1 block">
                  Picking Strategy
                </label>
                <div className="text-sm text-white">
                  {selectedRelease.pickingStrategy}
                </div>
              </div>
              {selectedRelease.waveNumber && (
                <div>
                  <label className="text-xs text-[#9ca3af] mb-1 block">
                    Wave Number
                  </label>
                  <div className="text-sm text-cyan-400 font-mono">
                    {selectedRelease.waveNumber}
                  </div>
                </div>
              )}
              {selectedRelease.holdReason && (
                <div>
                  <label className="text-xs text-[#9ca3af] mb-1 block">
                    Hold Reason
                  </label>
                  <div className="text-sm text-red-400">
                    {selectedRelease.holdReason.replace(/_/g, " ")}
                  </div>
                </div>
              )}
              {selectedRelease.releaseDate && (
                <div>
                  <label className="text-xs text-[#9ca3af] mb-1 block">
                    Release Date
                  </label>
                  <div className="text-sm text-white">
                    {format(
                      new Date(selectedRelease.releaseDate),
                      "MMM dd, yyyy HH:mm",
                    )}
                  </div>
                </div>
              )}
              {selectedRelease.releasedBy && (
                <div>
                  <label className="text-xs text-[#9ca3af] mb-1 block">
                    Released By
                  </label>
                  <div className="text-sm text-white">
                    {selectedRelease.releasedBy}
                  </div>
                </div>
              )}
            </div>
            {selectedRelease.status === "PENDING" &&
              selectedRelease.availableStock && (
                <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
                  <div className="text-sm font-medium text-green-400 mb-2">
                    ✓ Ready to Release
                  </div>
                  <div className="text-xs text-[#9ca3af]">
                    Stock is available and order can be released for picking.
                  </div>
                </div>
              )}
            {selectedRelease.status === "ON_HOLD" && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
                <div className="text-sm font-medium text-red-400 mb-2">
                  ⚠️ On Hold
                </div>
                <div className="text-xs text-[#9ca3af]">
                  This order cannot be released:{" "}
                  {selectedRelease.holdReason?.replace(/_/g, " ")}
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Release Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showReleaseDialog}
        onClose={() => {
          setShowReleaseDialog(false);
          setSelectedRelease(null);
        }}
        onConfirm={confirmRelease}
        title="Release Order for Picking"
        message={`Are you sure you want to release order ${selectedRelease?.orderNumber} for picking?`}
        confirmText="Release"
        variant="info"
      />
    </PageTemplate>
  );
}
