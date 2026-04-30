/**
 * Bin Master Page
 * INTEGRATED: Now uses real Prisma database via /api/wms/bins
 */

"use client";

import { useState, useMemo, useEffect } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import PageTemplate from "@/components/PageTemplate";
import Tooltip from "@/components/Tooltip";
import Modal from "@/components/Modal";
import ModuleLinks from "@/components/ModuleLinks";
import {
  getStorageLocationLinks,
  getInventoryLinks,
} from "@/utils/moduleInterconnectivity";
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

interface Bin {
  id: string;
  binCode: string;
  storageLocation: string;
  zone: string;
  aisle: string;
  rack: string;
  level: string;
  binType: "PALLET" | "CARTON" | "BULK" | "SHELF" | "FLOW_RACK" | "CUSTOM";
  capacity: number;
  currentStock: number;
  availableCapacity: number;
  utilization: number;
  maxWeight: number;
  currentWeight: number;
  materialNumber?: string;
  materialDescription?: string;
  batchNumber?: string;
  quantity?: number;
  status: "EMPTY" | "OCCUPIED" | "FULL" | "RESERVED" | "BLOCKED";
  lastActivity?: Date | string;
  lastPutaway?: Date | string;
  lastPicking?: Date | string;
  createdAt: Date | string;
}

export default function BinMaster() {
  const router = useRouter();
  const [bins, setBins] = useState<Bin[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch bins from real API
  useEffect(() => {
    async function fetchBins() {
      try {
        setLoading(true);
        const response = await fetch("/api/wms/bins?limit=200");
        const result = await response.json();
        
        if (result.success && result.data) {
          // Map API response to Bin interface
          const mappedBins = result.data.map((bin: any) => ({
            id: bin.id,
            binCode: bin.binCode,
            storageLocation: bin.areaName || bin.zone || "Unknown",
            zone: bin.zone || "",
            aisle: bin.aisle || "",
            rack: bin.rack || "",
            level: bin.level || "",
            binType: bin.binType || "PALLET",
            capacity: bin.capacity || 100,
            currentStock: bin.currentStock || 0,
            availableCapacity: bin.availableCapacity || (bin.capacity - bin.currentStock),
            utilization: bin.utilization || 0,
            maxWeight: bin.maxWeight || 1000,
            currentWeight: bin.currentWeight || 0,
            status: bin.status || "EMPTY",
            lastActivity: bin.updatedAt,
            createdAt: bin.createdAt,
          }));
          setBins(mappedBins);
        }
      } catch (error) {
        console.error("Error fetching bins:", error);
      } finally {
        setLoading(false);
      }
    }
    
    fetchBins();
  }, []);

  // Legacy mock data structure removed - now using real API data

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");
  const [selectedZone, setSelectedZone] = useState<string>("ALL");
  const [selectedType, setSelectedType] = useState<string>("ALL");
  const [viewMode, setViewMode] = useState<"table" | "grid" | "analytics">(
    "table",
  );
  const [selectedBin, setSelectedBin] = useState<Bin | null>(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [realTimeEnabled, setRealTimeEnabled] = useState(true);
  const [realTimeStats, setRealTimeStats] = useState({
    totalBins: 0,
    occupiedBins: 0,
    emptyBins: 0,
    avgUtilization: 0,
  });

  const filteredBins = useMemo(() => {
    return bins.filter((bin) => {
      const matchesSearch =
        bin.binCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
        bin.storageLocation.toLowerCase().includes(searchQuery.toLowerCase()) ||
        bin.materialNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        bin.materialDescription
          ?.toLowerCase()
          .includes(searchQuery.toLowerCase());
      const matchesStatus =
        selectedStatus === "ALL" || bin.status === selectedStatus;
      const matchesZone = selectedZone === "ALL" || bin.zone === selectedZone;
      const matchesType =
        selectedType === "ALL" || bin.binType === selectedType;
      return matchesSearch && matchesStatus && matchesZone && matchesType;
    });
  }, [bins, searchQuery, selectedStatus, selectedZone, selectedType]);

  // Analytics
  const statusDistribution = useMemo(() => {
    const counts: Record<string, number> = {};
    bins.forEach((b) => {
      counts[b.status] = (counts[b.status] || 0) + 1;
    });
    return Object.entries(counts).map(([status, count]) => ({ status, count }));
  }, [bins]);

  const typeDistribution = useMemo(() => {
    const counts: Record<string, number> = {};
    bins.forEach((b) => {
      counts[b.binType] = (counts[b.binType] || 0) + 1;
    });
    return Object.entries(counts).map(([type, count]) => ({
      type: type.replace(/_/g, " "),
      count,
    }));
  }, [bins]);

  const zoneUtilization = useMemo(() => {
    const zoneData: Record<
      string,
      { total: number; occupied: number; utilization: number }
    > = {};
    bins.forEach((b) => {
      if (!zoneData[b.zone]) {
        zoneData[b.zone] = { total: 0, occupied: 0, utilization: 0 };
      }
      zoneData[b.zone].total++;
      if (b.status !== "EMPTY") {
        zoneData[b.zone].occupied++;
      }
      zoneData[b.zone].utilization += b.utilization;
    });
    return Object.entries(zoneData).map(([zone, data]) => ({
      zone,
      total: data.total,
      occupied: data.occupied,
      utilization: data.utilization / data.total,
    }));
  }, [bins]);

  // Aggregate stats
  const aggregateStats = useMemo(() => {
    const total = bins.length;
    const occupied = bins.filter((b) => b.status !== "EMPTY").length;
    const empty = bins.filter((b) => b.status === "EMPTY").length;
    const avgUtilization =
      bins.reduce((sum, b) => sum + b.utilization, 0) / bins.length;

    return {
      total,
      occupied,
      empty,
      avgUtilization,
    };
  }, [bins]);

  // Real-time updates
  useEffect(() => {
    if (!realTimeEnabled) return;

    const unsubscribe = realtimeSimulator.subscribe(
      "bin-stats",
      (data: typeof realTimeStats) => {
        setRealTimeStats(data);
      },
    );

    const stop = realtimeSimulator.start(
      "bin-stats",
      () => ({
        totalBins: aggregateStats.total,
        occupiedBins: simulateKPIUpdates(aggregateStats.occupied, 0.1),
        emptyBins: simulateKPIUpdates(aggregateStats.empty, 0.1),
        avgUtilization: simulateKPIUpdates(aggregateStats.avgUtilization, 0.02),
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
    aggregateStats.total,
    aggregateStats.occupied,
    aggregateStats.empty,
    aggregateStats.avgUtilization,
  ]);

  const uniqueZones = useMemo(() => {
    return Array.from(new Set(bins.map((b) => b.zone))).sort();
  }, [bins]);

  const stats = [
    {
      label: "Total Bins",
      value: realTimeEnabled ? realTimeStats.totalBins : aggregateStats.total,
      icon: "ri-stack-line",
      tooltip: "Total bin locations",
      trend: "up" as const,
    },
    {
      label: "Occupied",
      value: realTimeEnabled
        ? realTimeStats.occupiedBins
        : aggregateStats.occupied,
      icon: "ri-checkbox-circle-line",
      tooltip: "Occupied bins",
      trend: "neutral" as const,
    },
    {
      label: "Empty",
      value: realTimeEnabled ? realTimeStats.emptyBins : aggregateStats.empty,
      icon: "ri-checkbox-blank-circle-line",
      tooltip: "Empty bins",
      trend: "neutral" as const,
    },
    {
      label: "Avg Utilization",
      value: `${(realTimeEnabled ? realTimeStats.avgUtilization : aggregateStats.avgUtilization).toFixed(1)}%`,
      icon: "ri-bar-chart-box-line",
      tooltip: "Average bin utilization",
      trend: "neutral" as const,
    },
  ];

  const COLORS = [
    "#06b6d4",
    "#10b981",
    "#f59e0b",
    "#ef4444",
    "#8b5cf6",
    "#ec4899",
  ];

  const handleView = (bin: Bin) => {
    setSelectedBin(bin);
    setShowViewModal(true);
  };

  return (
    <PageTemplate
      title="Bin Master"
      description="Bin-level storage management with capacity tracking, utilization analytics, and material assignment"
      icon="ri-stack-line"
      systemInfo={{
        sap: "Bin Management, Storage Bin",
        oracle: "Bin Master, Storage Location",
        manhattan: "Bin Management, Storage Bin",
      }}
      examples={[
        "Bin-level inventory tracking",
        "Capacity and utilization management",
        "Material assignment to bins",
        "Bin status monitoring",
        "Zone-based analytics",
      ]}
      stats={stats}
      actions={
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
          <div className="flex items-center gap-1 sm:gap-2 bg-white/5 border border-white/10 rounded-lg p-1 sm:p-2">
            <button
              onClick={() => setViewMode("table")}
              className={`p-1.5 sm:p-2 rounded transition-colors ${
                viewMode === "table"
                  ? "bg-cyan-500/20 text-cyan-400"
                  : "text-[#9ca3af] hover:text-white"
              }`}
              title="Table View"
            >
              <i className="ri-table-line text-sm sm:text-base"></i>
            </button>
            <button
              onClick={() => setViewMode("grid")}
              className={`p-1.5 sm:p-2 rounded transition-colors ${
                viewMode === "grid"
                  ? "bg-cyan-500/20 text-cyan-400"
                  : "text-[#9ca3af] hover:text-white"
              }`}
              title="Grid View"
            >
              <i className="ri-grid-line text-sm sm:text-base"></i>
            </button>
            <button
              onClick={() => setViewMode("analytics")}
              className={`p-1.5 sm:p-2 rounded transition-colors ${
                viewMode === "analytics"
                  ? "bg-cyan-500/20 text-cyan-400"
                  : "text-[#9ca3af] hover:text-white"
              }`}
              title="Analytics View"
            >
              <i className="ri-bar-chart-line text-sm sm:text-base"></i>
            </button>
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
        </div>
      }
    >
      {/* Filters */}
      <div className="mb-6 flex items-center gap-4 flex-wrap">
        <div className="relative flex-1 min-w-[300px] max-w-md">
          <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-[#9ca3af] text-sm"></i>
          <input
            type="text"
            placeholder="Search bins..."
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
          <option value="EMPTY">Empty</option>
          <option value="OCCUPIED">Occupied</option>
          <option value="FULL">Full</option>
          <option value="RESERVED">Reserved</option>
          <option value="BLOCKED">Blocked</option>
        </select>
        <select
          value={selectedZone}
          onChange={(e) => setSelectedZone(e.target.value)}
          className="bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 min-w-[180px]"
        >
          <option value="ALL">All Zones</option>
          {uniqueZones.map((zone) => (
            <option key={zone} value={zone}>
              Zone {zone}
            </option>
          ))}
        </select>
        <select
          value={selectedType}
          onChange={(e) => setSelectedType(e.target.value)}
          className="bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 min-w-[180px]"
        >
          <option value="ALL">All Types</option>
          <option value="PALLET">Pallet</option>
          <option value="CARTON">Carton</option>
          <option value="BULK">Bulk</option>
          <option value="SHELF">Shelf</option>
          <option value="FLOW_RACK">Flow Rack</option>
        </select>
      </div>

      {/* Table View */}
      {viewMode === "table" && (
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-white/5 border-b border-white/10">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium text-[#9ca3af] uppercase tracking-wider">
                    Bin Code
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-[#9ca3af] uppercase tracking-wider">
                    Location
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-[#9ca3af] uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-[#9ca3af] uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-[#9ca3af] uppercase tracking-wider">
                    Material
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-[#9ca3af] uppercase tracking-wider">
                    Utilization
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-[#9ca3af] uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {filteredBins.map((bin, index) => (
                  <motion.tr
                    key={bin.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.02 }}
                    className="hover:bg-white/5 transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-white font-mono">
                        {bin.binCode}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() =>
                          router.push(
                            `/storage-locations?location=${bin.storageLocation}`,
                          )
                        }
                        className="text-sm text-cyan-400 hover:text-cyan-300 font-mono"
                      >
                        {bin.storageLocation}
                      </button>
                      <div className="text-xs text-[#9ca3af]">
                        Zone {bin.zone}, Aisle {bin.aisle}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-xs px-2 py-1 rounded bg-cyan-500/20 text-cyan-400">
                        {bin.binType.replace(/_/g, " ")}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${
                          bin.status === "OCCUPIED"
                            ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                            : bin.status === "FULL"
                              ? "bg-red-500/20 text-red-400 border border-red-500/30"
                              : bin.status === "EMPTY"
                                ? "bg-gray-500/20 text-gray-400 border border-gray-500/30"
                                : bin.status === "RESERVED"
                                  ? "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30"
                                  : "bg-orange-500/20 text-orange-400 border border-orange-500/30"
                        }`}
                      >
                        {bin.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {bin.materialNumber ? (
                        <div>
                          <button
                            onClick={() =>
                              router.push(
                                `/inventory?material=${bin.materialNumber}`,
                              )
                            }
                            className="text-sm text-cyan-400 hover:text-cyan-300 font-mono"
                          >
                            {bin.materialNumber}
                          </button>
                          <div className="text-xs text-[#9ca3af]">
                            {bin.materialDescription}
                          </div>
                          {bin.batchNumber && (
                            <div className="text-xs text-[#9ca3af]">
                              Batch: {bin.batchNumber}
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-xs text-[#9ca3af]">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm text-white font-medium">
                          {bin.utilization.toFixed(1)}%
                        </div>
                        <div className="w-24 bg-white/10 rounded-full h-1.5 mt-1">
                          <div
                            className={`h-1.5 rounded-full ${
                              bin.utilization > 90
                                ? "bg-red-400"
                                : bin.utilization > 75
                                  ? "bg-yellow-400"
                                  : "bg-green-400"
                            }`}
                            style={{ width: `${bin.utilization}%` }}
                          ></div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Tooltip content="View Details" position="top">
                        <button
                          onClick={() => handleView(bin)}
                          className="p-2 bg-cyan-600/20 text-cyan-400 border border-cyan-500/30 rounded hover:bg-cyan-600/30 transition-colors"
                        >
                          <i className="ri-eye-line"></i>
                        </button>
                      </Tooltip>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Grid View */}
      {viewMode === "grid" && (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredBins.map((bin, index) => (
            <motion.div
              key={bin.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.03 }}
              className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-6 hover:border-cyan-500/50 hover:shadow-lg hover:shadow-cyan-500/10 transition-all cursor-pointer"
              onClick={() => handleView(bin)}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-white mb-1 font-mono">
                    {bin.binCode}
                  </h3>
                  <p className="text-sm text-[#9ca3af]">
                    {bin.storageLocation}
                  </p>
                </div>
                <span
                  className={`px-2 py-1 rounded text-xs font-medium ${
                    bin.status === "OCCUPIED"
                      ? "bg-blue-500/20 text-blue-400"
                      : bin.status === "FULL"
                        ? "bg-red-500/20 text-red-400"
                        : "bg-gray-500/20 text-gray-400"
                  }`}
                >
                  {bin.status}
                </span>
              </div>
              <div className="space-y-2 mb-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-[#9ca3af]">Type:</span>
                  <span className="text-white text-xs">
                    {bin.binType.replace(/_/g, " ")}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-[#9ca3af]">Zone:</span>
                  <span className="text-white">Zone {bin.zone}</span>
                </div>
                {bin.materialNumber && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-[#9ca3af]">Material:</span>
                    <span className="text-white font-mono text-xs">
                      {bin.materialNumber}
                    </span>
                  </div>
                )}
                {bin.quantity && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-[#9ca3af]">Quantity:</span>
                    <span className="text-white font-medium">
                      {bin.quantity}
                    </span>
                  </div>
                )}
                <div className="flex items-center justify-between text-sm">
                  <span className="text-[#9ca3af]">Utilization:</span>
                  <span className="text-white font-medium">
                    {bin.utilization.toFixed(1)}%
                  </span>
                </div>
                <div className="w-full bg-white/10 rounded-full h-2 mt-2">
                  <div
                    className={`h-2 rounded-full ${
                      bin.utilization > 90
                        ? "bg-red-400"
                        : bin.utilization > 75
                          ? "bg-yellow-400"
                          : "bg-green-400"
                    }`}
                    style={{ width: `${bin.utilization}%` }}
                  ></div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Analytics View */}
      {viewMode === "analytics" && (
        <div className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
            >
              <h3 className="text-lg font-semibold text-white mb-4">
                Status Distribution
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={statusDistribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ status, count }) => `${status}: ${count}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="count"
                  >
                    {statusDistribution.map((entry, index) => (
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
                Bin Type Distribution
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={typeDistribution}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis
                    dataKey="type"
                    stroke="#9ca3af"
                    fontSize={10}
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
                    labelStyle={{ color: "#fff" }}
                  />
                  <Bar dataKey="count" fill="#06b6d4" />
                </BarChart>
              </ResponsiveContainer>
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
          >
            <h3 className="text-lg font-semibold text-white mb-4">
              Zone Utilization
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={zoneUtilization}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="zone" stroke="#9ca3af" fontSize={12} />
                <YAxis stroke="#9ca3af" fontSize={12} />
                <RechartsTooltip
                  contentStyle={{
                    backgroundColor: "#1f2937",
                    border: "1px solid #374151",
                    borderRadius: "8px",
                  }}
                  labelStyle={{ color: "#fff" }}
                />
                <Legend />
                <Bar dataKey="occupied" fill="#06b6d4" name="Occupied Bins" />
                <Bar dataKey="total" fill="#374151" name="Total Bins" />
                <Line
                  type="monotone"
                  dataKey="utilization"
                  stroke="#f59e0b"
                  strokeWidth={2}
                  name="Utilization %"
                />
              </BarChart>
            </ResponsiveContainer>
          </motion.div>
        </div>
      )}

      {/* View Modal */}
      <Modal
        isOpen={showViewModal}
        onClose={() => {
          setShowViewModal(false);
          setSelectedBin(null);
        }}
        title={`Bin Details - ${selectedBin?.binCode || ""}`}
        size="lg"
      >
        {selectedBin && (
          <div className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-[#9ca3af] mb-1">Bin Code</div>
                <div className="text-white font-medium font-mono">
                  {selectedBin.binCode}
                </div>
              </div>
              <div>
                <div className="text-sm text-[#9ca3af] mb-1">
                  Storage Location
                </div>
                <button
                  onClick={() =>
                    router.push(
                      `/storage-locations?location=${selectedBin.storageLocation}`,
                    )
                  }
                  className="text-cyan-400 hover:text-cyan-300 font-mono"
                >
                  {selectedBin.storageLocation}
                </button>
              </div>
              <div>
                <div className="text-sm text-[#9ca3af] mb-1">Zone</div>
                <div className="text-white">Zone {selectedBin.zone}</div>
              </div>
              <div>
                <div className="text-sm text-[#9ca3af] mb-1">Bin Type</div>
                <div className="text-white">
                  {selectedBin.binType.replace(/_/g, " ")}
                </div>
              </div>
              <div>
                <div className="text-sm text-[#9ca3af] mb-1">Status</div>
                <span
                  className={`px-2 py-1 rounded text-xs font-medium ${
                    selectedBin.status === "OCCUPIED"
                      ? "bg-blue-500/20 text-blue-400"
                      : selectedBin.status === "FULL"
                        ? "bg-red-500/20 text-red-400"
                        : "bg-gray-500/20 text-gray-400"
                  }`}
                >
                  {selectedBin.status}
                </span>
              </div>
              <div>
                <div className="text-sm text-[#9ca3af] mb-1">Utilization</div>
                <div className="text-white font-medium">
                  {selectedBin.utilization.toFixed(1)}%
                </div>
              </div>
              <div>
                <div className="text-sm text-[#9ca3af] mb-1">Capacity</div>
                <div className="text-white">
                  {selectedBin.capacity.toFixed(2)}
                </div>
              </div>
              <div>
                <div className="text-sm text-[#9ca3af] mb-1">Current Stock</div>
                <div className="text-white font-medium">
                  {selectedBin.currentStock.toFixed(2)}
                </div>
              </div>
            </div>
            {selectedBin.materialNumber && (
              <div>
                <div className="text-sm text-[#9ca3af] mb-2">
                  Material Information
                </div>
                <div className="grid md:grid-cols-2 gap-3">
                  <div>
                    <div className="text-xs text-[#9ca3af] mb-1">
                      Material Number
                    </div>
                    <button
                      onClick={() =>
                        router.push(
                          `/inventory?material=${selectedBin.materialNumber}`,
                        )
                      }
                      className="text-cyan-400 hover:text-cyan-300 font-mono text-sm"
                    >
                      {selectedBin.materialNumber}
                    </button>
                  </div>
                  <div>
                    <div className="text-xs text-[#9ca3af] mb-1">
                      Description
                    </div>
                    <div className="text-white text-sm">
                      {selectedBin.materialDescription}
                    </div>
                  </div>
                  {selectedBin.batchNumber && (
                    <div>
                      <div className="text-xs text-[#9ca3af] mb-1">
                        Batch Number
                      </div>
                      <button
                        onClick={() =>
                          router.push(
                            `/batches?batch=${selectedBin.batchNumber}`,
                          )
                        }
                        className="text-cyan-400 hover:text-cyan-300 font-mono text-sm"
                      >
                        {selectedBin.batchNumber}
                      </button>
                    </div>
                  )}
                  {selectedBin.quantity && (
                    <div>
                      <div className="text-xs text-[#9ca3af] mb-1">
                        Quantity
                      </div>
                      <div className="text-white text-sm font-medium">
                        {selectedBin.quantity}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
            <ModuleLinks
              links={[
                ...getStorageLocationLinks(selectedBin.storageLocation),
                ...(selectedBin.materialNumber
                  ? getInventoryLinks(selectedBin.materialNumber)
                  : []),
              ]}
            />
          </div>
        )}
      </Modal>
    </PageTemplate>
  );
}
