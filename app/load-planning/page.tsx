"use client";

import { useState, useMemo, useEffect } from "react";
import { motion } from "framer-motion";
import { useRouter, useSearchParams } from "next/navigation";
import PageTemplate from "@/components/PageTemplate";
import Tooltip from "@/components/Tooltip";
import Modal from "@/components/Modal";
import ModuleLinks from "@/components/ModuleLinks";
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
import Link from "next/link";
import { apiFetch } from "@/utils/apiFetch";

export default function LoadPlanning() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const routeFilter = searchParams.get("route");
  const waveFilter = searchParams.get("wave");
  const [loads, setLoads] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");
  const [selectedTruckType, setSelectedTruckType] = useState<string>("ALL");
  const [viewMode, setViewMode] = useState<"table" | "grid" | "analytics">(
    "table",
  );
  const [selectedLoad, setSelectedLoad] = useState<any>(null);
  const [showViewModal, setShowViewModal] = useState(false);

  const filteredLoads = useMemo(() => {
    return loads.filter((load) => {
      const matchesSearch =
        load.loadNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        load.truckNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        load.driverName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        load.destination.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus =
        selectedStatus === "ALL" || load.status === selectedStatus;
      const matchesTruckType =
        selectedTruckType === "ALL" || load.truckType === selectedTruckType;
      const matchesRoute = !routeFilter || load.loadNumber === routeFilter;
      const matchesWave = !waveFilter || load.loadNumber === waveFilter;
      return (
        matchesSearch &&
        matchesStatus &&
        matchesTruckType &&
        matchesRoute &&
        matchesWave
      );
    });
  }, [
    loads,
    searchQuery,
    selectedStatus,
    selectedTruckType,
    routeFilter,
    waveFilter,
  ]);

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        setIsLoading(true);
        setLoadError(null);
        const res = await apiFetch("/api/transportation/load-planning");
        const data = (await res.json()) as any[];
        if (!mounted) return;
        setLoads(data || []);
      } catch (e) {
        if (!mounted) return;
        setLoadError(e instanceof Error ? e.message : String(e));
      } finally {
        if (!mounted) return;
        setIsLoading(false);
      }
    }
    load();
    return () => {
      mounted = false;
    };
  }, []);

  const utilizationStats = useMemo(() => {
    const avgWeightUtil =
      loads.reduce((sum, l) => sum + l.weightUtilization, 0) / loads.length;
    const avgVolumeUtil =
      loads.reduce((sum, l) => sum + l.volumeUtilization, 0) / loads.length;
    const optimized = loads.filter((l) => l.routeOptimized).length;
    return { avgWeightUtil, avgVolumeUtil, optimized, total: loads.length };
  }, [loads]);

  const statusStats = useMemo(() => {
    const stats: Record<string, number> = {};
    loads.forEach((load) => {
      stats[load.status] = (stats[load.status] || 0) + 1;
    });
    return stats;
  }, [loads]);

  const truckTypeStats = useMemo(() => {
    const stats: Record<string, number> = {};
    loads.forEach((load) => {
      stats[load.truckType] = (stats[load.truckType] || 0) + 1;
    });
    return stats;
  }, [loads]);

  const chartData = useMemo(() => {
    return Object.entries(statusStats).map(([status, count]) => ({
      status,
      count,
    }));
  }, [statusStats]);

  const truckTypeData = useMemo(() => {
    return Object.entries(truckTypeStats).map(([type, count]) => ({
      type,
      count,
    }));
  }, [truckTypeStats]);

  const stats = [
    {
      label: "Total Loads",
      value: loads.length,
      icon: "ri-truck-line",
      tooltip: "Total number of load plans",
      trend: "up" as const,
    },
    {
      label: "Avg Weight Util",
      value: `${utilizationStats.avgWeightUtil.toFixed(1)}%`,
      icon: "ri-scales-3-line",
      tooltip: "Average weight utilization across all loads",
      trend: "neutral" as const,
    },
    {
      label: "Avg Volume Util",
      value: `${utilizationStats.avgVolumeUtil.toFixed(1)}%`,
      icon: "ri-box-3-line",
      tooltip: "Average volume utilization across all loads",
      trend: "neutral" as const,
    },
    {
      label: "Optimized",
      value: utilizationStats.optimized,
      icon: "ri-route-line",
      tooltip: "Number of route-optimized loads",
      trend: "up" as const,
    },
  ];

  const COLORS = ["#06b6d4", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"];

  return (
    <PageTemplate
      title="Load Planning"
      description="Truck optimization and load planning - Optimize vehicle loads, routes, and capacity utilization for efficient transportation"
      icon="ri-truck-line"
      systemInfo={{
        sap: "Load Planning - Transportation Management (TM)",
        oracle: "Load Optimization - Transportation Management",
        manhattan: "Load Planning - Route & Capacity Optimization",
      }}
      examples={[
        "Optimize truck loads for maximum capacity utilization",
        "Plan routes for efficient delivery",
        "Track weight and volume utilization",
        "Manage special handling requirements",
        "Monitor load status and delivery schedules",
      ]}
      stats={stats}
      actions={
        <div className="flex items-center gap-3">
          <Link
            href="/load-design"
            className="bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white px-6 py-3 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 shadow-lg shadow-purple-500/20"
          >
            <i className="ri-magic-line"></i>
            Advanced Load Design
          </Link>
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
          <Tooltip content="Create New Load Plan" position="bottom">
            <button className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white px-6 py-3 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 shadow-lg shadow-cyan-500/20">
              <i className="ri-add-line"></i>
              Create Load
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
            placeholder="Search by Load Number, Truck, Driver, Destination..."
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
          <option value="LOADING">Loading</option>
          <option value="IN_TRANSIT">In Transit</option>
          <option value="DELIVERED">Delivered</option>
          <option value="CANCELLED">Cancelled</option>
        </select>
        <select
          value={selectedTruckType}
          onChange={(e) => setSelectedTruckType(e.target.value)}
          className="bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 min-w-[180px]"
        >
          <option value="ALL">All Truck Types</option>
          <option value="FLATBED">Flatbed</option>
          <option value="REEFER">Reefer</option>
          <option value="DRY_VAN">Dry Van</option>
          <option value="BOX_TRUCK">Box Truck</option>
          <option value="CONTAINER">Container</option>
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
                    Load Number
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-[#9ca3af] uppercase tracking-wider">
                    Truck
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-[#9ca3af] uppercase tracking-wider">
                    Route
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-[#9ca3af] uppercase tracking-wider">
                    Weight Util
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-[#9ca3af] uppercase tracking-wider">
                    Volume Util
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-[#9ca3af] uppercase tracking-wider">
                    Items/Orders
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
                {filteredLoads.map((load, index) => (
                  <motion.tr
                    key={load.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.02 }}
                    className="hover:bg-white/5 transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-white font-mono">
                        {load.loadNumber}
                      </div>
                      <div className="text-xs text-[#9ca3af]">
                        {format(new Date(load.plannedDate), "MMM dd, yyyy")}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm text-white font-medium">
                          {load.truckNumber}
                        </div>
                        <div className="text-xs text-[#9ca3af]">
                          {load.truckType}
                        </div>
                        <div className="text-xs text-[#9ca3af]">
                          {load.driverName}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm text-white">
                          {load.origin} → {load.destination}
                        </div>
                        <div className="text-xs text-[#9ca3af]">
                          {load.estimatedDistance.toFixed(0)} km
                        </div>
                        {load.routeOptimized && (
                          <button
                            onClick={() =>
                              router.push(`/routes?load=${load.loadNumber}`)
                            }
                            className="text-xs text-purple-400 hover:text-purple-300 transition-colors cursor-pointer mt-1"
                          >
                            <i className="ri-route-line mr-1"></i>
                            View Route
                          </button>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-white/5 rounded-full h-2 overflow-hidden">
                          <div
                            className={`h-full ${
                              load.weightUtilization > 80
                                ? "bg-green-500"
                                : load.weightUtilization > 60
                                  ? "bg-yellow-500"
                                  : "bg-red-500"
                            }`}
                            style={{
                              width: `${Math.min(load.weightUtilization, 100)}%`,
                            }}
                          ></div>
                        </div>
                        <span className="text-sm text-white font-medium w-12 text-right">
                          {load.weightUtilization.toFixed(1)}%
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-white/5 rounded-full h-2 overflow-hidden">
                          <div
                            className={`h-full ${
                              load.volumeUtilization > 80
                                ? "bg-green-500"
                                : load.volumeUtilization > 60
                                  ? "bg-yellow-500"
                                  : "bg-red-500"
                            }`}
                            style={{
                              width: `${Math.min(load.volumeUtilization, 100)}%`,
                            }}
                          ></div>
                        </div>
                        <span className="text-sm text-white font-medium w-12 text-right">
                          {load.volumeUtilization.toFixed(1)}%
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-white">
                        {load.totalItems} items
                      </div>
                      <div className="text-xs text-[#9ca3af]">
                        {load.totalOrders} orders
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${
                          load.status === "DELIVERED"
                            ? "bg-green-500/20 text-green-400 border border-green-500/30"
                            : load.status === "IN_TRANSIT"
                              ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                              : load.status === "LOADING"
                                ? "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30"
                                : "bg-gray-500/20 text-gray-400 border border-gray-500/30"
                        }`}
                      >
                        {load.status}
                      </span>
                      {load.routeOptimized && (
                        <div className="mt-1">
                          <i className="ri-checkbox-circle-line text-green-400 text-xs"></i>
                          <span className="text-xs text-green-400 ml-1">
                            Optimized
                          </span>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <Tooltip content="View Details" position="top">
                          <button
                            onClick={() => {
                              setSelectedLoad(load);
                              setShowViewModal(true);
                            }}
                            className="p-2 bg-cyan-600/20 text-cyan-400 border border-cyan-500/30 rounded hover:bg-cyan-600/30 transition-colors"
                          >
                            <i className="ri-eye-line"></i>
                          </button>
                        </Tooltip>
                        {load.routeOptimized && (
                          <Tooltip content="View Route" position="top">
                            <button
                              onClick={() =>
                                router.push(`/routes?load=${load.loadNumber}`)
                              }
                              className="p-2 bg-purple-600/20 text-purple-400 border border-purple-500/30 rounded hover:bg-purple-600/30 transition-colors"
                            >
                              <i className="ri-route-line"></i>
                            </button>
                          </Tooltip>
                        )}
                        {load.status === "IN_TRANSIT" && (
                          <Tooltip content="Track Shipment" position="top">
                            <button
                              onClick={() =>
                                router.push(`/tracking?load=${load.loadNumber}`)
                              }
                              className="p-2 bg-blue-600/20 text-blue-400 border border-blue-500/30 rounded hover:bg-blue-600/30 transition-colors"
                            >
                              <i className="ri-map-pin-line"></i>
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
          {filteredLoads.map((load, index) => (
            <motion.div
              key={load.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.03 }}
              className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-6 hover:border-cyan-500/50 hover:shadow-lg hover:shadow-cyan-500/10 transition-all cursor-pointer"
              onClick={() => {
                setSelectedLoad(load);
                setShowViewModal(true);
              }}
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-white font-mono mb-1">
                    {load.loadNumber}
                  </h3>
                  <p className="text-sm text-[#9ca3af]">
                    {load.truckNumber} - {load.truckType}
                  </p>
                </div>
                <span
                  className={`px-2 py-1 rounded text-xs font-medium ${
                    load.status === "DELIVERED"
                      ? "bg-green-500/20 text-green-400"
                      : load.status === "IN_TRANSIT"
                        ? "bg-blue-500/20 text-blue-400"
                        : "bg-gray-500/20 text-gray-400"
                  }`}
                >
                  {load.status}
                </span>
              </div>
              <div className="space-y-2 mb-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-[#9ca3af]">Route:</span>
                  <span className="text-white">
                    {load.origin} → {load.destination}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-[#9ca3af]">Weight Util:</span>
                  <span className="text-white font-medium">
                    {load.weightUtilization.toFixed(1)}%
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-[#9ca3af]">Volume Util:</span>
                  <span className="text-white font-medium">
                    {load.volumeUtilization.toFixed(1)}%
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-[#9ca3af]">Items:</span>
                  <span className="text-white">
                    {load.totalItems} ({load.totalOrders} orders)
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
              Load Status Distribution
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
              Truck Type Distribution
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={truckTypeData}>
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
        </div>
      )}

      {/* View Modal */}
      <Modal
        isOpen={showViewModal}
        onClose={() => {
          setShowViewModal(false);
          setSelectedLoad(null);
        }}
        title={`Load Plan Details - ${selectedLoad?.loadNumber || ""}`}
        size="lg"
      >
        {selectedLoad && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-[#9ca3af] mb-1 block">
                  Load Number
                </label>
                <div className="text-sm text-white font-mono">
                  {selectedLoad.loadNumber}
                </div>
              </div>
              <div>
                <label className="text-xs text-[#9ca3af] mb-1 block">
                  Status
                </label>
                <span
                  className={`px-2 py-1 rounded text-xs font-medium ${
                    selectedLoad.status === "DELIVERED"
                      ? "bg-green-500/20 text-green-400"
                      : selectedLoad.status === "IN_TRANSIT"
                        ? "bg-blue-500/20 text-blue-400"
                        : "bg-gray-500/20 text-gray-400"
                  }`}
                >
                  {selectedLoad.status}
                </span>
              </div>
              <div>
                <label className="text-xs text-[#9ca3af] mb-1 block">
                  Truck Number
                </label>
                <div className="text-sm text-white">
                  {selectedLoad.truckNumber}
                </div>
              </div>
              <div>
                <label className="text-xs text-[#9ca3af] mb-1 block">
                  Truck Type
                </label>
                <div className="text-sm text-white">
                  {selectedLoad.truckType}
                </div>
              </div>
              <div>
                <label className="text-xs text-[#9ca3af] mb-1 block">
                  Driver
                </label>
                <div className="text-sm text-white">
                  {selectedLoad.driverName}
                </div>
              </div>
              <div>
                <label className="text-xs text-[#9ca3af] mb-1 block">
                  Planned Date
                </label>
                <div className="text-sm text-white">
                  {format(new Date(selectedLoad.plannedDate), "MMM dd, yyyy")}
                </div>
              </div>
              <div>
                <label className="text-xs text-[#9ca3af] mb-1 block">
                  Route
                </label>
                <div className="text-sm text-white">
                  {selectedLoad.origin} → {selectedLoad.destination}
                </div>
              </div>
              <div>
                <label className="text-xs text-[#9ca3af] mb-1 block">
                  Distance
                </label>
                <div className="text-sm text-white">
                  {selectedLoad.estimatedDistance.toFixed(0)} km
                </div>
              </div>
              <div>
                <label className="text-xs text-[#9ca3af] mb-1 block">
                  Weight Utilization
                </label>
                <div className="text-sm text-white font-medium">
                  {selectedLoad.weightUtilization.toFixed(1)}%
                </div>
                <div className="text-xs text-[#9ca3af]">
                  {selectedLoad.totalWeight.toFixed(0)} /{" "}
                  {selectedLoad.truckCapacity.toFixed(0)} kg
                </div>
              </div>
              <div>
                <label className="text-xs text-[#9ca3af] mb-1 block">
                  Volume Utilization
                </label>
                <div className="text-sm text-white font-medium">
                  {selectedLoad.volumeUtilization.toFixed(1)}%
                </div>
                <div className="text-xs text-[#9ca3af]">
                  {selectedLoad.totalVolume.toFixed(1)} /{" "}
                  {selectedLoad.volumeCapacity.toFixed(1)} m³
                </div>
              </div>
              <div>
                <label className="text-xs text-[#9ca3af] mb-1 block">
                  Total Items
                </label>
                <div className="text-sm text-white">
                  {selectedLoad.totalItems} items
                </div>
              </div>
              <div>
                <label className="text-xs text-[#9ca3af] mb-1 block">
                  Total Orders
                </label>
                <div className="text-sm text-white">
                  {selectedLoad.totalOrders} orders
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 pt-4 border-t border-white/10">
              {selectedLoad.routeOptimized && (
                <button
                  onClick={() =>
                    router.push(`/routes?load=${selectedLoad.loadNumber}`)
                  }
                  className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  <i className="ri-route-line"></i>
                  View Route
                </button>
              )}
              {selectedLoad.status === "IN_TRANSIT" && (
                <button
                  onClick={() =>
                    router.push(`/tracking?load=${selectedLoad.loadNumber}`)
                  }
                  className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  <i className="ri-map-pin-line"></i>
                  Track Shipment
                </button>
              )}
              <button
                onClick={() =>
                  router.push(`/wave-planning?load=${selectedLoad.loadNumber}`)
                }
                className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <i className="ri-sound-module-line"></i>
                View Wave
              </button>
            </div>
          </div>
        )}
      </Modal>
    </PageTemplate>
  );
}
