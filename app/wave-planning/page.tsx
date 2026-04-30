"use client";

import { useState, useMemo, useEffect } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import PageTemplate from "@/components/PageTemplate";
import Tooltip from "@/components/Tooltip";
import Modal from "@/components/Modal";
import ModuleLinks from "@/components/ModuleLinks";
import { generateWaves } from "@/utils/mockDataGenerators";
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

export default function WavePlanning() {
  const router = useRouter();
  const [waves, setWaves] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch waves from API
  useEffect(() => {
    const fetchWaves = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch('/api/wms/wave-planning?limit=100');
        const result = await response.json();

        if (result.success && result.data) {
          setWaves(result.data);
        } else {
          setError(result.error || 'Failed to fetch waves');
        }
      } catch (err) {
        console.error('Error fetching waves:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch waves');
      } finally {
        setLoading(false);
      }
    };

    fetchWaves();
  }, []);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");
  const [selectedWaveType, setSelectedWaveType] = useState<string>("ALL");
  const [viewMode, setViewMode] = useState<"table" | "grid" | "analytics">(
    "table",
  );
  const [selectedWave, setSelectedWave] = useState<any>(null);
  const [showViewModal, setShowViewModal] = useState(false);

  const filteredWaves = useMemo(() => {
    return waves.filter((wave) => {
      const matchesSearch =
        wave.waveNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        wave.waveName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        wave.orderNumbers.some((on) =>
          on.toLowerCase().includes(searchQuery.toLowerCase()),
        );
      const matchesStatus =
        selectedStatus === "ALL" || wave.status === selectedStatus;
      const matchesWaveType =
        selectedWaveType === "ALL" || wave.waveType === selectedWaveType;
      return matchesSearch && matchesStatus && matchesWaveType;
    });
  }, [waves, searchQuery, selectedStatus, selectedWaveType]);

  const totalValue = useMemo(() => {
    return waves.reduce((sum, w) => sum + w.totalValue, 0);
  }, [waves]);

  const statusStats = useMemo(() => {
    const stats: Record<string, { count: number; totalItems: number }> = {};
    waves.forEach((wave) => {
      if (!stats[wave.status]) {
        stats[wave.status] = { count: 0, totalItems: 0 };
      }
      stats[wave.status].count++;
      stats[wave.status].totalItems += wave.totalItems;
    });
    return stats;
  }, [waves]);

  const waveTypeStats = useMemo(() => {
    const stats: Record<string, number> = {};
    waves.forEach((wave) => {
      stats[wave.waveType] = (stats[wave.waveType] || 0) + 1;
    });
    return stats;
  }, [waves]);

  const chartData = useMemo(() => {
    return Object.entries(statusStats).map(([status, data]) => ({
      status,
      count: data.count,
      totalItems: data.totalItems,
    }));
  }, [statusStats]);

  const waveTypeData = useMemo(() => {
    return Object.entries(waveTypeStats).map(([type, count]) => ({
      type,
      count,
    }));
  }, [waveTypeStats]);

  const performanceData = useMemo(() => {
    return filteredWaves
      .filter((w) => w.actualDuration && w.estimatedDuration)
      .map((wave) => ({
        wave: wave.waveNumber.substring(0, 8),
        estimated: wave.estimatedDuration,
        actual: wave.actualDuration,
        efficiency: (
          (wave.estimatedDuration / wave.actualDuration!) *
          100
        ).toFixed(1),
      }));
  }, [filteredWaves]);

  const stats = [
    {
      label: "Total Waves",
      value: waves.length,
      icon: "ri-sound-module-line",
      tooltip: "Total number of waves",
      trend: "up" as const,
    },
    {
      label: "Total Orders",
      value: waves.reduce((sum, w) => sum + w.totalOrders, 0),
      icon: "ri-shopping-cart-line",
      tooltip: "Total orders in waves",
      trend: "up" as const,
    },
    {
      label: "Total Items",
      value: waves.reduce((sum, w) => sum + w.totalItems, 0),
      icon: "ri-stack-line",
      tooltip: "Total items in waves",
      trend: "up" as const,
    },
    {
      label: "Total Value",
      value: `AED ${totalValue.toLocaleString()}`,
      icon: "ri-money-dollar-circle-line",
      tooltip: "Total value of waves",
      trend: "up" as const,
    },
  ];

  const COLORS = ["#06b6d4", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"];

  if (loading) {
    return (
      <PageTemplate
        title="Wave Planning"
        description="Batch optimization and wave planning"
        icon="ri-sound-module-line"
      >
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
            <p className="text-white">Loading waves...</p>
          </div>
        </div>
      </PageTemplate>
    );
  }

  if (error) {
    return (
      <PageTemplate
        title="Wave Planning"
        description="Batch optimization and wave planning"
        icon="ri-sound-module-line"
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
      title="Wave Planning"
      description="Batch optimization and wave planning - Group orders into waves for efficient picking, optimize resource allocation, and track wave performance"
      icon="ri-sound-module-line"
      systemInfo={{
        sap: "Wave Planning - Order Grouping, Batch Optimization",
        oracle: "Wave Management - Wave Planning, Order Grouping",
        manhattan: "Wave Planning - Wave Optimization, Batch Management",
      }}
      examples={[
        "Group orders into waves for efficient picking",
        "Optimize wave composition by zone, priority, or carrier",
        "Track wave performance and completion",
        "Manage picker allocation per wave",
        "Monitor wave efficiency and duration",
        "Automate wave creation based on rules",
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
          <Tooltip content="Create New Wave" position="bottom">
            <button className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white px-6 py-3 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 shadow-lg shadow-cyan-500/20">
              <i className="ri-add-line"></i>
              Create Wave
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
            placeholder="Search by Wave Number, Order Number..."
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
          <option value="PLANNED">Planned</option>
          <option value="RELEASED">Released</option>
          <option value="IN_PROGRESS">In Progress</option>
          <option value="COMPLETED">Completed</option>
          <option value="CANCELLED">Cancelled</option>
        </select>
        <select
          value={selectedWaveType}
          onChange={(e) => setSelectedWaveType(e.target.value)}
          className="bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 min-w-[180px]"
        >
          <option value="ALL">All Wave Types</option>
          <option value="SINGLE">Single</option>
          <option value="BATCH">Batch</option>
          <option value="ZONE">Zone</option>
          <option value="CLUSTER">Cluster</option>
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
                    Wave Number
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-[#9ca3af] uppercase tracking-wider">
                    Wave Name
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-[#9ca3af] uppercase tracking-wider">
                    Orders
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-[#9ca3af] uppercase tracking-wider">
                    Items
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-[#9ca3af] uppercase tracking-wider">
                    Value
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-[#9ca3af] uppercase tracking-wider">
                    Type/Strategy
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-[#9ca3af] uppercase tracking-wider">
                    Pickers
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-[#9ca3af] uppercase tracking-wider">
                    Duration
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-[#9ca3af] uppercase tracking-wider">
                    Progress
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
                {filteredWaves.map((wave, index) => (
                  <motion.tr
                    key={wave.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.02 }}
                    className="hover:bg-white/5 transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-white font-mono">
                        {wave.waveNumber}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-white">{wave.waveName}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-white font-medium">
                        {wave.totalOrders}
                      </div>
                      <div className="text-xs text-[#9ca3af]">
                        {wave.orderNumbers.slice(0, 2).map((so, idx) => (
                          <button
                            key={idx}
                            onClick={() =>
                              router.push(`/sales-orders?so=${so}`)
                            }
                            className="hover:text-cyan-400 transition-colors cursor-pointer mr-1"
                          >
                            {so}
                          </button>
                        ))}
                        ...
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-white font-medium">
                        {wave.totalItems}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-white font-medium">
                        AED {wave.totalValue.toLocaleString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-xs text-white">
                          {wave.waveType}
                        </div>
                        <div className="text-xs text-[#9ca3af]">
                          {wave.strategy}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-white">
                        {wave.pickersAssigned} / {wave.pickersRequired}
                      </div>
                      <div className="text-xs text-[#9ca3af]">
                        Assigned / Required
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-white">
                        {wave.actualDuration
                          ? `${wave.actualDuration.toFixed(0)} min`
                          : `${wave.estimatedDuration.toFixed(0)} min (est)`}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-white/5 rounded-full h-2 overflow-hidden">
                          <div
                            className="h-full bg-cyan-500"
                            style={{
                              width: `${Math.min(wave.completionPercentage, 100)}%`,
                            }}
                          ></div>
                        </div>
                        <span className="text-xs text-white w-12 text-right">
                          {wave.completionPercentage.toFixed(0)}%
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col gap-1">
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium ${
                            wave.status === "COMPLETED"
                              ? "bg-green-500/20 text-green-400 border border-green-500/30"
                              : wave.status === "IN_PROGRESS"
                                ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                                : wave.status === "RELEASED"
                                  ? "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30"
                                  : "bg-gray-500/20 text-gray-400 border border-gray-500/30"
                          }`}
                        >
                          {wave.status}
                        </span>
                        {wave.optimized && (
                          <div className="mt-1">
                            <i className="ri-checkbox-circle-line text-green-400 text-xs"></i>
                            <span className="text-xs text-green-400 ml-1">
                              Optimized
                            </span>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <Tooltip content="View Details" position="top">
                          <button
                            onClick={() => {
                              setSelectedWave(wave);
                              setShowViewModal(true);
                            }}
                            className="p-2 bg-cyan-600/20 text-cyan-400 border border-cyan-500/30 rounded hover:bg-cyan-600/30 transition-colors"
                          >
                            <i className="ri-eye-line"></i>
                          </button>
                        </Tooltip>
                        {(wave.status === "RELEASED" ||
                          wave.status === "IN_PROGRESS") && (
                          <Tooltip content="View Picking" position="top">
                            <button
                              onClick={() =>
                                router.push(`/picking?wave=${wave.waveNumber}`)
                              }
                              className="p-2 bg-green-600/20 text-green-400 border border-green-500/30 rounded hover:bg-green-600/30 transition-colors"
                            >
                              <i className="ri-handbag-line"></i>
                            </button>
                          </Tooltip>
                        )}
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
          {filteredWaves.map((wave, index) => (
            <motion.div
              key={wave.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.03 }}
              className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-6 hover:border-cyan-500/50 hover:shadow-lg hover:shadow-cyan-500/10 transition-all cursor-pointer"
              onClick={() => {
                setSelectedWave(wave);
                setShowViewModal(true);
              }}
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-white font-mono mb-1">
                    {wave.waveNumber}
                  </h3>
                  <p className="text-sm text-[#9ca3af]">{wave.waveName}</p>
                </div>
                <span
                  className={`px-2 py-1 rounded text-xs font-medium ${
                    wave.status === "COMPLETED"
                      ? "bg-green-500/20 text-green-400"
                      : wave.status === "IN_PROGRESS"
                        ? "bg-blue-500/20 text-blue-400"
                        : "bg-gray-500/20 text-gray-400"
                  }`}
                >
                  {wave.status}
                </span>
              </div>
              <div className="space-y-2 mb-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-[#9ca3af]">Orders:</span>
                  <span className="text-white font-medium">
                    {wave.totalOrders} orders
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-[#9ca3af]">Items:</span>
                  <span className="text-white font-medium">
                    {wave.totalItems} items
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-[#9ca3af]">Value:</span>
                  <span className="text-white font-medium">
                    AED {wave.totalValue.toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-[#9ca3af]">Pickers:</span>
                  <span className="text-white">
                    {wave.pickersAssigned} / {wave.pickersRequired}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-[#9ca3af]">Progress:</span>
                  <span className="text-white font-medium">
                    {wave.completionPercentage.toFixed(0)}%
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
              Wave Status Distribution
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
                      fill={COLORS[index % COLORS.length]}
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
              Wave Type Distribution
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={waveTypeData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="type" stroke="#9ca3af" fontSize={12} />
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

          {performanceData.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 md:col-span-2"
            >
              <h3 className="text-lg font-semibold text-white mb-4">
                Wave Performance (Estimated vs Actual Duration)
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={performanceData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="wave" stroke="#9ca3af" fontSize={12} />
                  <YAxis stroke="#9ca3af" fontSize={12} />
                  <RechartsTooltip
                    contentStyle={{
                      backgroundColor: "#1f2937",
                      border: "1px solid #374151",
                      borderRadius: "8px",
                    }}
                    labelStyle={{ color: "#fff" }}
                  />
                  <Bar
                    dataKey="estimated"
                    fill="#06b6d4"
                    name="Estimated (min)"
                  />
                  <Bar dataKey="actual" fill="#10b981" name="Actual (min)" />
                  <Legend />
                </BarChart>
              </ResponsiveContainer>
            </motion.div>
          )}
        </div>
      )}

      {/* View Modal */}
      <Modal
        isOpen={showViewModal}
        onClose={() => {
          setShowViewModal(false);
          setSelectedWave(null);
        }}
        title={`Wave Details - ${selectedWave?.waveNumber || ""}`}
        size="lg"
      >
        {selectedWave && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-[#9ca3af] mb-1 block">
                  Wave Number
                </label>
                <div className="text-sm text-white font-mono">
                  {selectedWave.waveNumber}
                </div>
              </div>
              <div>
                <label className="text-xs text-[#9ca3af] mb-1 block">
                  Wave Name
                </label>
                <div className="text-sm text-white">
                  {selectedWave.waveName}
                </div>
              </div>
              <div>
                <label className="text-xs text-[#9ca3af] mb-1 block">
                  Status
                </label>
                <span
                  className={`px-2 py-1 rounded text-xs font-medium ${
                    selectedWave.status === "COMPLETED"
                      ? "bg-green-500/20 text-green-400"
                      : selectedWave.status === "IN_PROGRESS"
                        ? "bg-blue-500/20 text-blue-400"
                        : "bg-gray-500/20 text-gray-400"
                  }`}
                >
                  {selectedWave.status}
                </span>
              </div>
              <div>
                <label className="text-xs text-[#9ca3af] mb-1 block">
                  Priority
                </label>
                <span
                  className={`px-2 py-1 rounded text-xs font-medium ${
                    selectedWave.priority === "URGENT"
                      ? "bg-red-500/20 text-red-400"
                      : selectedWave.priority === "HIGH"
                        ? "bg-orange-500/20 text-orange-400"
                        : "bg-gray-500/20 text-gray-400"
                  }`}
                >
                  {selectedWave.priority}
                </span>
              </div>
              <div>
                <label className="text-xs text-[#9ca3af] mb-1 block">
                  Total Orders
                </label>
                <div className="text-sm text-white font-medium">
                  {selectedWave.totalOrders}
                </div>
              </div>
              <div>
                <label className="text-xs text-[#9ca3af] mb-1 block">
                  Total Items
                </label>
                <div className="text-sm text-white font-medium">
                  {selectedWave.totalItems}
                </div>
              </div>
              <div>
                <label className="text-xs text-[#9ca3af] mb-1 block">
                  Total Value
                </label>
                <div className="text-sm text-white font-medium">
                  AED {selectedWave.totalValue.toLocaleString()}
                </div>
              </div>
              <div>
                <label className="text-xs text-[#9ca3af] mb-1 block">
                  Wave Type
                </label>
                <div className="text-sm text-white">
                  {selectedWave.waveType}
                </div>
              </div>
              <div>
                <label className="text-xs text-[#9ca3af] mb-1 block">
                  Strategy
                </label>
                <div className="text-sm text-white">
                  {selectedWave.strategy}
                </div>
              </div>
              <div>
                <label className="text-xs text-[#9ca3af] mb-1 block">
                  Pickers
                </label>
                <div className="text-sm text-white">
                  {selectedWave.pickersAssigned} /{" "}
                  {selectedWave.pickersRequired}
                </div>
              </div>
              <div>
                <label className="text-xs text-[#9ca3af] mb-1 block">
                  Estimated Duration
                </label>
                <div className="text-sm text-white">
                  {selectedWave.estimatedDuration.toFixed(0)} minutes
                </div>
              </div>
              {selectedWave.actualDuration && (
                <div>
                  <label className="text-xs text-[#9ca3af] mb-1 block">
                    Actual Duration
                  </label>
                  <div className="text-sm text-white">
                    {selectedWave.actualDuration.toFixed(0)} minutes
                  </div>
                </div>
              )}
              <div>
                <label className="text-xs text-[#9ca3af] mb-1 block">
                  Completion
                </label>
                <div className="text-sm text-white font-medium">
                  {selectedWave.completionPercentage.toFixed(0)}%
                </div>
              </div>
              {selectedWave.plannedStartTime && (
                <div>
                  <label className="text-xs text-[#9ca3af] mb-1 block">
                    Planned Start
                  </label>
                  <div className="text-sm text-white">
                    {format(
                      new Date(selectedWave.plannedStartTime),
                      "MMM dd, yyyy HH:mm",
                    )}
                  </div>
                </div>
              )}
            </div>
            <div>
              <label className="text-xs text-[#9ca3af] mb-1 block">
                Order Numbers
              </label>
              <div className="text-sm text-white bg-white/5 p-3 rounded-lg font-mono flex flex-wrap gap-2">
                {selectedWave.orderNumbers.map((so, idx) => (
                  <button
                    key={idx}
                    onClick={() => router.push(`/sales-orders?so=${so}`)}
                    className="hover:text-cyan-400 transition-colors cursor-pointer"
                  >
                    {so}
                  </button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 pt-4 border-t border-white/10">
              <button
                onClick={() =>
                  router.push(`/picking?wave=${selectedWave.waveNumber}`)
                }
                className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <i className="ri-handbag-line"></i>
                View Picking
              </button>
              <button
                onClick={() =>
                  router.push(`/load-planning?wave=${selectedWave.waveNumber}`)
                }
                className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <i className="ri-truck-line"></i>
                View Load Plan
              </button>
              <button
                onClick={() =>
                  router.push(`/sales-orders?wave=${selectedWave.waveNumber}`)
                }
                className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <i className="ri-shopping-cart-2-line"></i>
                View Sales Orders
              </button>
            </div>
          </div>
        )}
      </Modal>
    </PageTemplate>
  );
}
