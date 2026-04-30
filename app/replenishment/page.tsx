/**
 * Replenishment Management Page
 * INTEGRATED: Now uses real Prisma database via /api/wms/replenishment
 */

"use client";

import { useState, useMemo, useEffect } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import PageTemplate from "@/components/PageTemplate";
import Tooltip from "@/components/Tooltip";
import Modal from "@/components/Modal";
import ModuleLinks from "@/components/ModuleLinks";
import { getInventoryLinks } from "@/utils/moduleInterconnectivity";
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
  ComposedChart,
  Area,
  AreaChart,
} from "recharts";
import {
  realtimeSimulator,
  simulateKPIUpdates,
} from "@/utils/realtimeDataSimulator";

export default function Replenishment() {
  const router = useRouter();
  const [replenishments, setReplenishments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");

  // Fetch replenishment tasks from real API
  useEffect(() => {
    async function fetchReplenishments() {
      try {
        setLoading(true);
        const response = await fetch("/api/wms/replenishment");
        const result = await response.json();
        
        if (result.success && result.data) {
          // Map API response to expected format
          const mapped = result.data.map((task: any, index: number) => ({
            id: task.id,
            replenishmentNumber: task.taskNumber || `RPL-${index + 1}`,
            materialNumber: task.sku || "",
            materialDescription: task.sku || "Unknown Material",
            fromLocation: task.fromBinId || "Reserve",
            toLocation: task.toBinId || "Picking",
            quantity: task.quantity || 0,
            pickedQuantity: task.pickedQty || 0,
            status: task.status || "PENDING",
            replenishmentType: task.type || "REPLENISH",
            priority: task.priority || "MEDIUM",
            createdAt: task.createdAt,
            updatedAt: task.updatedAt,
          }));
          setReplenishments(mapped);
        }
      } catch (error) {
        console.error("Error fetching replenishments:", error);
      } finally {
        setLoading(false);
      }
    }
    
    fetchReplenishments();
  }, []);
  const [selectedType, setSelectedType] = useState<string>("ALL");
  const [viewMode, setViewMode] = useState<
    "table" | "grid" | "analytics" | "realtime" | "forecasting" | "suggestions"
  >("table");
  const [selectedReplenishment, setSelectedReplenishment] = useState<any>(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [realTimeEnabled, setRealTimeEnabled] = useState(true);
  const [realTimeStats, setRealTimeStats] = useState({
    totalReplenishments: 0,
    activeReplenishments: 0,
    completionRate: 0,
    averageProcessingTime: 0,
  });

  const filteredReplenishments = useMemo(() => {
    return replenishments.filter((replenishment) => {
      const matchesSearch =
        replenishment.replenishmentNumber
          .toLowerCase()
          .includes(searchQuery.toLowerCase()) ||
        replenishment.materialNumber
          .toLowerCase()
          .includes(searchQuery.toLowerCase()) ||
        replenishment.materialDescription
          .toLowerCase()
          .includes(searchQuery.toLowerCase()) ||
        replenishment.fromLocation
          .toLowerCase()
          .includes(searchQuery.toLowerCase()) ||
        replenishment.toLocation
          .toLowerCase()
          .includes(searchQuery.toLowerCase());
      const matchesStatus =
        selectedStatus === "ALL" || replenishment.status === selectedStatus;
      const matchesType =
        selectedType === "ALL" ||
        replenishment.replenishmentType === selectedType;
      return matchesSearch && matchesStatus && matchesType;
    });
  }, [replenishments, searchQuery, selectedStatus, selectedType]);

  const totalQuantity = useMemo(() => {
    return replenishments.reduce((sum, r) => sum + r.replenishQuantity, 0);
  }, [replenishments]);

  const statusStats = useMemo(() => {
    const stats: Record<string, { count: number; totalQuantity: number }> = {};
    replenishments.forEach((replenishment) => {
      if (!stats[replenishment.status]) {
        stats[replenishment.status] = { count: 0, totalQuantity: 0 };
      }
      stats[replenishment.status].count++;
      stats[replenishment.status].totalQuantity +=
        replenishment.replenishQuantity;
    });
    return stats;
  }, [replenishments]);

  const typeStats = useMemo(() => {
    const stats: Record<string, number> = {};
    replenishments.forEach((replenishment) => {
      stats[replenishment.replenishmentType] =
        (stats[replenishment.replenishmentType] || 0) + 1;
    });
    return stats;
  }, [replenishments]);

  const chartData = useMemo(() => {
    return Object.entries(statusStats).map(([status, data]) => ({
      status,
      count: data.count,
      totalQuantity: data.totalQuantity,
    }));
  }, [statusStats]);

  const typeData = useMemo(() => {
    return Object.entries(typeStats).map(([type, count]) => ({
      type: type.replace(/_/g, " "),
      count,
    }));
  }, [typeStats]);

  // Location performance analytics
  const locationPerformance = useMemo(() => {
    const locationMap = new Map<
      string,
      { count: number; totalQuantity: number; completed: number }
    >();

    replenishments.forEach((rep) => {
      const key = `${rep.fromLocation} → ${rep.toLocation}`;
      if (!locationMap.has(key)) {
        locationMap.set(key, { count: 0, totalQuantity: 0, completed: 0 });
      }
      const loc = locationMap.get(key)!;
      loc.count++;
      loc.totalQuantity += rep.replenishQuantity;
      if (rep.status === "COMPLETED") {
        loc.completed++;
      }
    });

    return Array.from(locationMap.entries())
      .map(([name, data]) => ({
        name,
        totalReplenishments: data.count,
        totalQuantity: data.totalQuantity,
        completionRate: (data.completed / data.count) * 100,
      }))
      .sort((a, b) => b.totalReplenishments - a.totalReplenishments)
      .slice(0, 10);
  }, [replenishments]);

  // Material performance
  const materialPerformance = useMemo(() => {
    const materialMap = new Map<
      string,
      { count: number; totalQuantity: number; completed: number }
    >();

    replenishments.forEach((rep) => {
      if (!materialMap.has(rep.materialNumber)) {
        materialMap.set(rep.materialNumber, {
          count: 0,
          totalQuantity: 0,
          completed: 0,
        });
      }
      const mat = materialMap.get(rep.materialNumber)!;
      mat.count++;
      mat.totalQuantity += rep.replenishQuantity;
      if (rep.status === "COMPLETED") {
        mat.completed++;
      }
    });

    return Array.from(materialMap.entries())
      .map(([name, data]) => ({
        name,
        totalReplenishments: data.count,
        totalQuantity: data.totalQuantity,
        completionRate: (data.completed / data.count) * 100,
      }))
      .sort((a, b) => b.totalReplenishments - a.totalReplenishments)
      .slice(0, 10);
  }, [replenishments]);

  // Daily trend
  const dailyTrend = useMemo(() => {
    const dailyData: Record<
      string,
      { date: string; planned: number; completed: number }
    > = {};

    replenishments.forEach((rep) => {
      const date = rep.plannedDate
        ? format(new Date(rep.plannedDate), "yyyy-MM-dd")
        : format(new Date(), "yyyy-MM-dd");
      if (!dailyData[date]) {
        dailyData[date] = { date, planned: 0, completed: 0 };
      }
      dailyData[date].planned++;
      if (rep.status === "COMPLETED") {
        dailyData[date].completed++;
      }
    });

    return Object.values(dailyData)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .map((d) => ({
        date: format(new Date(d.date), "MMM dd"),
        planned: d.planned,
        completed: d.completed,
        efficiency: d.planned > 0 ? (d.completed / d.planned) * 100 : 0,
      }));
  }, [replenishments]);

  // Aggregate stats with completion rate and processing time
  const aggregateStats = useMemo(() => {
    const total = replenishments.length;
    const inProgress = replenishments.filter(
      (r) => r.status === "IN_PROGRESS",
    ).length;
    const completed = replenishments.filter(
      (r) => r.status === "COMPLETED",
    ).length;
    const completionRate = total > 0 ? (completed / total) * 100 : 0;
    const averageProcessingTime =
      replenishments
        .filter((r) => r.completedDate && r.startedDate)
        .reduce((sum, r) => {
          const startTime = new Date(r.startedDate!).getTime();
          const endTime = new Date(r.completedDate!).getTime();
          return sum + (endTime - startTime) / (1000 * 60 * 60); // hours
        }, 0) /
      Math.max(
        1,
        replenishments.filter((r) => r.completedDate && r.startedDate).length,
      );

    return {
      total,
      inProgress,
      completed,
      totalQuantity,
      completionRate,
      averageProcessingTime,
    };
  }, [replenishments, totalQuantity]);

  // Real-time updates
  useEffect(() => {
    if (!realTimeEnabled) return;

    const unsubscribe = realtimeSimulator.subscribe(
      "replenishment-stats",
      (data: typeof realTimeStats) => {
        setRealTimeStats(data);
      },
    );

    const stop = realtimeSimulator.start(
      "replenishment-stats",
      () => ({
        totalReplenishments: simulateKPIUpdates(aggregateStats.total, 0.05),
        activeReplenishments: simulateKPIUpdates(
          aggregateStats.inProgress,
          0.1,
        ),
        completionRate: simulateKPIUpdates(aggregateStats.completionRate, 0.02),
        averageProcessingTime: simulateKPIUpdates(
          aggregateStats.averageProcessingTime,
          0.05,
        ),
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
    aggregateStats.inProgress,
    aggregateStats.completionRate,
    aggregateStats.averageProcessingTime,
  ]);

  // Simulate real-time status changes
  useEffect(() => {
    if (!realTimeEnabled) return;

    const interval = setInterval(() => {
      setReplenishments((prev) =>
        prev.map((rep) => {
          if (rep.status === "PLANNED" && Math.random() < 0.03) {
            return {
              ...rep,
              status: "ASSIGNED" as const,
              assignedTo: `User-${Math.floor(Math.random() * 5) + 1}`,
            };
          }
          if (rep.status === "ASSIGNED" && Math.random() < 0.02) {
            return {
              ...rep,
              status: "IN_PROGRESS" as const,
              startedDate: new Date(),
            };
          }
          if (rep.status === "IN_PROGRESS" && Math.random() < 0.02) {
            return {
              ...rep,
              status: "COMPLETED" as const,
              completedDate: new Date(),
              actualQuantity:
                rep.replenishQuantity * (0.95 + Math.random() * 0.1),
            };
          }
          return rep;
        }),
      );
    }, 10000);

    return () => clearInterval(interval);
  }, [realTimeEnabled]);

  const stats = [
    {
      label: "Total Replenishments",
      value: realTimeEnabled
        ? realTimeStats.totalReplenishments
        : aggregateStats.total,
      icon: "ri-refresh-line",
      tooltip: "Total replenishment requests",
      trend: "up" as const,
    },
    {
      label: "Active",
      value: realTimeEnabled
        ? realTimeStats.activeReplenishments
        : aggregateStats.inProgress,
      icon: "ri-loader-4-line",
      tooltip: "Active replenishments",
      trend: "neutral" as const,
    },
    {
      label: "Completion Rate",
      value: `${(realTimeEnabled ? realTimeStats.completionRate : aggregateStats.completionRate).toFixed(1)}%`,
      icon: "ri-checkbox-circle-line",
      tooltip: "Replenishment completion rate",
      trend: "up" as const,
    },
    {
      label: "Avg Processing",
      value: `${(realTimeEnabled ? realTimeStats.averageProcessingTime : aggregateStats.averageProcessingTime).toFixed(1)}h`,
      icon: "ri-speed-line",
      tooltip: "Average processing time",
      trend: "down" as const,
    },
  ];

  const COLORS = ["#06b6d4", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"];

  return (
    <PageTemplate
      title="Replenishment"
      description="Stock replenishment management - Replenish picking locations from reserve storage, manage replenishment tasks, and track replenishment status"
      icon="ri-refresh-line"
      systemInfo={{
        sap: "Replenishment - Stock Replenishment, Min/Max Replenishment",
        oracle: "Replenishment - Stock Replenishment Management",
        manhattan: "Replenishment - Replenishment Tasks, Stock Movement",
      }}
      examples={[
        "Replenish picking locations from reserve storage",
        "Manage min/max replenishment rules",
        "Track replenishment task status",
        "Monitor stock levels and trigger replenishment",
        "Handle ABC-based replenishment",
        "Automate replenishment workflows",
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
            <button
              onClick={() => setViewMode("realtime")}
              className={`p-1.5 sm:p-2 rounded transition-colors ${
                viewMode === "realtime"
                  ? "bg-cyan-500/20 text-cyan-400"
                  : "text-[#9ca3af] hover:text-white"
              }`}
              title="Real-time View"
            >
              <i className="ri-radar-line text-sm sm:text-base"></i>
            </button>
            <button
              onClick={() => setViewMode("forecasting")}
              className={`p-1.5 sm:p-2 rounded transition-colors ${
                viewMode === "forecasting"
                  ? "bg-cyan-500/20 text-cyan-400"
                  : "text-[#9ca3af] hover:text-white"
              }`}
              title="Demand Forecasting"
            >
              <i className="ri-line-chart-line text-sm sm:text-base"></i>
            </button>
            <button
              onClick={() => setViewMode("suggestions")}
              className={`p-1.5 sm:p-2 rounded transition-colors ${
                viewMode === "suggestions"
                  ? "bg-cyan-500/20 text-cyan-400"
                  : "text-[#9ca3af] hover:text-white"
              }`}
              title="Auto Suggestions"
            >
              <i className="ri-lightbulb-line text-sm sm:text-base"></i>
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
            placeholder="Search by Replenishment Number, Material, Location..."
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
          <option value="ASSIGNED">Assigned</option>
          <option value="IN_PROGRESS">In Progress</option>
          <option value="COMPLETED">Completed</option>
          <option value="CANCELLED">Cancelled</option>
        </select>
        <select
          value={selectedType}
          onChange={(e) => setSelectedType(e.target.value)}
          className="bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 min-w-[180px]"
        >
          <option value="ALL">All Types</option>
          <option value="MIN_MAX">Min/Max</option>
          <option value="ABC">ABC</option>
          <option value="MANUAL">Manual</option>
          <option value="AUTO">Auto</option>
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
                    Replenishment Number
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-[#9ca3af] uppercase tracking-wider">
                    Material
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-[#9ca3af] uppercase tracking-wider">
                    From Location
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-[#9ca3af] uppercase tracking-wider">
                    To Location
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-[#9ca3af] uppercase tracking-wider">
                    Current Stock
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-[#9ca3af] uppercase tracking-wider">
                    Target Stock
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-[#9ca3af] uppercase tracking-wider">
                    Quantity
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-[#9ca3af] uppercase tracking-wider">
                    Type
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
                {filteredReplenishments.map((replenishment, index) => (
                  <motion.tr
                    key={replenishment.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.02 }}
                    className="hover:bg-white/5 transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-white font-mono">
                        {replenishment.replenishmentNumber}
                      </div>
                      {replenishment.plannedDate && (
                        <div className="text-xs text-[#9ca3af]">
                          {format(
                            new Date(replenishment.plannedDate),
                            "MMM dd, yyyy",
                          )}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <button
                          onClick={() =>
                            router.push(
                              `/inventory?material=${replenishment.materialNumber}`,
                            )
                          }
                          className="text-sm font-medium text-cyan-400 hover:text-cyan-300 transition-colors font-mono"
                        >
                          {replenishment.materialNumber}
                        </button>
                        <div className="text-xs text-[#9ca3af]">
                          {replenishment.materialDescription}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() =>
                          router.push(
                            `/storage-locations?location=${replenishment.fromLocation}`,
                          )
                        }
                        className="text-sm text-cyan-400 hover:text-cyan-300 transition-colors font-mono"
                      >
                        {replenishment.fromLocation}
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() =>
                          router.push(
                            `/storage-locations?location=${replenishment.toLocation}`,
                          )
                        }
                        className="text-sm text-cyan-400 hover:text-cyan-300 transition-colors font-mono"
                      >
                        {replenishment.toLocation}
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-white">
                        {replenishment.currentStock.toFixed(2)}
                      </div>
                      <div className="text-xs text-[#9ca3af]">
                        {replenishment.unit}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-white">
                        {replenishment.targetStock.toFixed(2)}
                      </div>
                      <div className="text-xs text-[#9ca3af]">
                        {replenishment.unit}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-white font-medium">
                        {replenishment.replenishQuantity.toFixed(2)}
                      </div>
                      <div className="text-xs text-[#9ca3af]">
                        {replenishment.unit}
                      </div>
                      {replenishment.actualQuantity && (
                        <div className="text-xs text-cyan-400 mt-1">
                          Actual: {replenishment.actualQuantity.toFixed(2)}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-xs text-white">
                          {replenishment.replenishmentType.replace(/_/g, "/")}
                        </div>
                        <div className="text-xs text-[#9ca3af]">
                          {replenishment.triggerReason.replace(/_/g, " ")}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col gap-1">
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium ${
                            replenishment.status === "COMPLETED"
                              ? "bg-green-500/20 text-green-400 border border-green-500/30"
                              : replenishment.status === "IN_PROGRESS"
                                ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                                : replenishment.status === "ASSIGNED"
                                  ? "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30"
                                  : "bg-gray-500/20 text-gray-400 border border-gray-500/30"
                          }`}
                        >
                          {replenishment.status.replace(/_/g, " ")}
                        </span>
                        {replenishment.assignedTo && (
                          <div className="text-xs text-[#9ca3af]">
                            {replenishment.assignedTo}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => {
                          setSelectedReplenishment(replenishment);
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
          {filteredReplenishments.map((replenishment, index) => (
            <motion.div
              key={replenishment.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.03 }}
              className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-6 hover:border-cyan-500/50 hover:shadow-lg hover:shadow-cyan-500/10 transition-all cursor-pointer"
              onClick={() => {
                setSelectedReplenishment(replenishment);
                setShowViewModal(true);
              }}
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-white font-mono mb-1">
                    {replenishment.replenishmentNumber}
                  </h3>
                  <p className="text-sm text-[#9ca3af]">
                    {replenishment.materialNumber}
                  </p>
                </div>
                <span
                  className={`px-2 py-1 rounded text-xs font-medium ${
                    replenishment.status === "COMPLETED"
                      ? "bg-green-500/20 text-green-400"
                      : replenishment.status === "IN_PROGRESS"
                        ? "bg-blue-500/20 text-blue-400"
                        : "bg-gray-500/20 text-gray-400"
                  }`}
                >
                  {replenishment.status.replace(/_/g, " ")}
                </span>
              </div>
              <div className="space-y-2 mb-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-[#9ca3af]">From:</span>
                  <span className="text-white font-mono">
                    {replenishment.fromLocation}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-[#9ca3af]">To:</span>
                  <span className="text-white font-mono">
                    {replenishment.toLocation}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-[#9ca3af]">Current Stock:</span>
                  <span className="text-white">
                    {replenishment.currentStock.toFixed(2)} {replenishment.unit}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-[#9ca3af]">Target Stock:</span>
                  <span className="text-white">
                    {replenishment.targetStock.toFixed(2)} {replenishment.unit}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-[#9ca3af]">Quantity:</span>
                  <span className="text-cyan-400 font-medium">
                    {replenishment.replenishQuantity.toFixed(2)}{" "}
                    {replenishment.unit}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-[#9ca3af]">Type:</span>
                  <span className="text-white text-xs">
                    {replenishment.replenishmentType.replace(/_/g, "/")}
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {viewMode === "analytics" && (
        <div className="space-y-6">
          {/* Status and Type Distribution */}
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
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ status, count }) =>
                      `${status.replace(/_/g, " ")}: ${count}`
                    }
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
                Type Distribution
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={typeData}>
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

          {/* Location Performance */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
          >
            <h3 className="text-lg font-semibold text-white mb-4">
              Top Location Routes Performance
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={locationPerformance}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis
                  dataKey="name"
                  stroke="#9ca3af"
                  fontSize={10}
                  angle={-45}
                  textAnchor="end"
                  height={100}
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
                <Legend />
                <Bar
                  dataKey="totalReplenishments"
                  fill="#06b6d4"
                  name="Total Replenishments"
                />
                <Bar
                  dataKey="completionRate"
                  fill="#10b981"
                  name="Completion Rate %"
                />
              </BarChart>
            </ResponsiveContainer>
          </motion.div>

          {/* Material Performance */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
          >
            <h3 className="text-lg font-semibold text-white mb-4">
              Top Materials Performance
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={materialPerformance}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis
                  dataKey="name"
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
                <Legend />
                <Bar
                  dataKey="totalReplenishments"
                  fill="#3b82f6"
                  name="Total Replenishments"
                />
                <Bar
                  dataKey="completionRate"
                  fill="#10b981"
                  name="Completion Rate %"
                />
              </BarChart>
            </ResponsiveContainer>
          </motion.div>

          {/* Daily Trend */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
          >
            <h3 className="text-lg font-semibold text-white mb-4">
              Daily Replenishment Trend
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <ComposedChart data={dailyTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="date" stroke="#9ca3af" fontSize={10} />
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
                <Legend />
                <Bar
                  yAxisId="left"
                  dataKey="planned"
                  fill="#3b82f6"
                  name="Planned"
                />
                <Bar
                  yAxisId="left"
                  dataKey="completed"
                  fill="#10b981"
                  name="Completed"
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="efficiency"
                  stroke="#f59e0b"
                  strokeWidth={2}
                  name="Efficiency %"
                />
              </ComposedChart>
            </ResponsiveContainer>
          </motion.div>
        </div>
      )}

      {/* Demand Forecasting View */}
      {viewMode === "forecasting" && (
        <div className="space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
          >
            <h3 className="text-lg font-semibold text-white mb-4">
              Demand Forecasting & Min/Max Levels
            </h3>
            <div className="grid md:grid-cols-2 gap-6">
              {materialPerformance.slice(0, 6).map((material, idx) => {
                const currentStock =
                  replenishments.find((r) => r.materialNumber === material.name)
                    ?.currentStock || 0;
                const targetStock =
                  replenishments.find((r) => r.materialNumber === material.name)
                    ?.targetStock || 0;
                const minLevel = targetStock * 0.3;
                const maxLevel = targetStock * 0.9;
                const forecastedDemand =
                  targetStock * (0.8 + Math.random() * 0.4);

                return (
                  <div
                    key={idx}
                    className="p-4 bg-white/5 rounded-lg border border-white/10"
                  >
                    <div className="text-sm font-medium text-white mb-2">
                      {material.name}
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-[#9ca3af]">Current Stock:</span>
                        <span
                          className={`font-medium ${
                            currentStock < minLevel
                              ? "text-red-400"
                              : currentStock < maxLevel
                                ? "text-yellow-400"
                                : "text-green-400"
                          }`}
                        >
                          {currentStock.toFixed(0)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-[#9ca3af]">Min Level:</span>
                        <span className="text-red-400">
                          {minLevel.toFixed(0)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-[#9ca3af]">Max Level:</span>
                        <span className="text-green-400">
                          {maxLevel.toFixed(0)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-[#9ca3af]">
                          Forecasted Demand:
                        </span>
                        <span className="text-cyan-400">
                          {forecastedDemand.toFixed(0)}
                        </span>
                      </div>
                      <div className="mt-2 h-2 bg-white/5 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${
                            currentStock < minLevel
                              ? "bg-red-500"
                              : currentStock < maxLevel
                                ? "bg-yellow-500"
                                : "bg-green-500"
                          }`}
                          style={{
                            width: `${Math.min((currentStock / maxLevel) * 100, 100)}%`,
                          }}
                        ></div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
          >
            <h3 className="text-lg font-semibold text-white mb-4">
              30-Day Demand Forecast Trend
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <ComposedChart
                data={Array.from({ length: 30 }, (_, i) => ({
                  date: format(
                    new Date(Date.now() - (29 - i) * 86400000),
                    "MMM dd",
                  ),
                  actual: Math.random() * 100 + 50,
                  forecast: Math.random() * 100 + 50,
                  minLevel: 30,
                  maxLevel: 90,
                }))}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="date" stroke="#9ca3af" fontSize={10} />
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
                <Area
                  type="monotone"
                  dataKey="maxLevel"
                  fill="#10b981"
                  fillOpacity={0.1}
                  stroke="#10b981"
                  strokeDasharray="5 5"
                  name="Max Level"
                />
                <Area
                  type="monotone"
                  dataKey="minLevel"
                  fill="#ef4444"
                  fillOpacity={0.1}
                  stroke="#ef4444"
                  strokeDasharray="5 5"
                  name="Min Level"
                />
                <Line
                  type="monotone"
                  dataKey="actual"
                  stroke="#06b6d4"
                  strokeWidth={2}
                  name="Actual Demand"
                />
                <Line
                  type="monotone"
                  dataKey="forecast"
                  stroke="#f59e0b"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  name="Forecasted Demand"
                />
              </ComposedChart>
            </ResponsiveContainer>
          </motion.div>
        </div>
      )}

      {/* Auto Suggestions View */}
      {viewMode === "suggestions" && (
        <div className="space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
          >
            <h3 className="text-lg font-semibold text-white mb-4">
              AI-Powered Replenishment Suggestions
            </h3>
            <div className="space-y-3">
              {replenishments
                .filter(
                  (r) =>
                    r.replenishmentType === "AUTO" && r.status === "PLANNED",
                )
                .slice(0, 10)
                .map((rep, idx) => {
                  const stockRatio = rep.currentStock / rep.targetStock;
                  const urgency =
                    stockRatio < 0.3
                      ? "URGENT"
                      : stockRatio < 0.5
                        ? "HIGH"
                        : "MEDIUM";

                  return (
                    <div
                      key={rep.id}
                      className="p-4 bg-white/5 rounded-lg border border-white/10"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="text-sm font-medium text-white mb-1">
                            {rep.materialNumber}
                          </div>
                          <div className="text-xs text-[#9ca3af]">
                            {rep.materialDescription}
                          </div>
                          <div className="text-xs text-[#9ca3af] mt-1">
                            {rep.fromLocation} → {rep.toLocation}
                          </div>
                        </div>
                        <div className="text-right">
                          <span
                            className={`px-2 py-1 rounded text-xs font-medium ${
                              urgency === "URGENT"
                                ? "bg-red-500/20 text-red-400"
                                : urgency === "HIGH"
                                  ? "bg-yellow-500/20 text-yellow-400"
                                  : "bg-blue-500/20 text-blue-400"
                            }`}
                          >
                            {urgency} Priority
                          </span>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-3 mb-3">
                        <div>
                          <div className="text-xs text-[#9ca3af] mb-1">
                            Current
                          </div>
                          <div className="text-sm font-medium text-white">
                            {rep.currentStock.toFixed(0)}
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-[#9ca3af] mb-1">
                            Target
                          </div>
                          <div className="text-sm font-medium text-white">
                            {rep.targetStock.toFixed(0)}
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-[#9ca3af] mb-1">
                            Suggested Qty
                          </div>
                          <div className="text-sm font-medium text-cyan-400">
                            {rep.replenishQuantity.toFixed(0)}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setSelectedReplenishment(rep);
                            setShowViewModal(true);
                          }}
                          className="px-3 py-1.5 bg-cyan-600/20 text-cyan-400 border border-cyan-500/30 rounded text-sm font-medium hover:bg-cyan-600/30 transition-colors"
                        >
                          <i className="ri-eye-line mr-1"></i>
                          View Details
                        </button>
                        <button
                          onClick={() =>
                            router.push(
                              `/inventory?material=${rep.materialNumber}`,
                            )
                          }
                          className="px-3 py-1.5 bg-white/5 text-white border border-white/10 rounded text-sm font-medium hover:bg-white/10 transition-colors"
                        >
                          <i className="ri-stack-line mr-1"></i>
                          View Stock
                        </button>
                      </div>
                    </div>
                  );
                })}
            </div>
          </motion.div>
        </div>
      )}

      {/* Real-time View */}
      {viewMode === "realtime" && (
        <div className="space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">
                Real-Time Metrics
              </h3>
              <div
                className={`px-3 py-1 rounded-full text-xs font-medium ${
                  realTimeEnabled
                    ? "bg-green-500/20 text-green-400"
                    : "bg-gray-500/20 text-gray-400"
                }`}
              >
                <i
                  className={`ri-${realTimeEnabled ? "radio-button-line" : "checkbox-blank-circle-line"} mr-1`}
                ></i>
                {realTimeEnabled ? "Live" : "Paused"}
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white/5 rounded-lg p-4">
                <div className="text-xs text-[#9ca3af] mb-1">
                  Total Replenishments
                </div>
                <div className="text-2xl font-bold text-white">
                  {realTimeStats.totalReplenishments}
                </div>
              </div>
              <div className="bg-white/5 rounded-lg p-4">
                <div className="text-xs text-[#9ca3af] mb-1">Active</div>
                <div className="text-2xl font-bold text-cyan-400">
                  {realTimeStats.activeReplenishments}
                </div>
              </div>
              <div className="bg-white/5 rounded-lg p-4">
                <div className="text-xs text-[#9ca3af] mb-1">
                  Completion Rate
                </div>
                <div className="text-2xl font-bold text-green-400">
                  {realTimeStats.completionRate.toFixed(1)}%
                </div>
              </div>
              <div className="bg-white/5 rounded-lg p-4">
                <div className="text-xs text-[#9ca3af] mb-1">
                  Avg Processing
                </div>
                <div className="text-2xl font-bold text-yellow-400">
                  {realTimeStats.averageProcessingTime.toFixed(1)}h
                </div>
              </div>
            </div>
          </motion.div>

          {/* Recent Activity */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
          >
            <h3 className="text-lg font-semibold text-white mb-4">
              Recent Activity
            </h3>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {filteredReplenishments
                .sort((a, b) => {
                  const dateA = a.plannedDate
                    ? new Date(a.plannedDate).getTime()
                    : 0;
                  const dateB = b.plannedDate
                    ? new Date(b.plannedDate).getTime()
                    : 0;
                  return dateB - dateA;
                })
                .slice(0, 10)
                .map((rep) => (
                  <div
                    key={rep.id}
                    className="flex items-center justify-between p-3 bg-white/5 rounded-lg"
                  >
                    <div className="flex-1">
                      <div className="text-sm font-medium text-white">
                        {rep.replenishmentNumber}
                      </div>
                      <div className="text-xs text-[#9ca3af]">
                        {rep.materialNumber} • {rep.fromLocation} →{" "}
                        {rep.toLocation}
                        {rep.plannedDate &&
                          ` • ${format(new Date(rep.plannedDate), "MMM dd, HH:mm")}`}
                      </div>
                    </div>
                    <div
                      className={`text-xs px-2 py-1 rounded ${
                        rep.status === "COMPLETED"
                          ? "bg-green-500/20 text-green-400"
                          : rep.status === "IN_PROGRESS"
                            ? "bg-cyan-500/20 text-cyan-400"
                            : rep.status === "ASSIGNED"
                              ? "bg-yellow-500/20 text-yellow-400"
                              : "bg-gray-500/20 text-gray-400"
                      }`}
                    >
                      {rep.status.replace(/_/g, " ")}
                    </div>
                  </div>
                ))}
            </div>
          </motion.div>
        </div>
      )}

      {/* View Modal */}
      <Modal
        isOpen={showViewModal}
        onClose={() => {
          setShowViewModal(false);
          setSelectedReplenishment(null);
        }}
        title={`Replenishment Details - ${selectedReplenishment?.replenishmentNumber || ""}`}
        size="lg"
      >
        {selectedReplenishment && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-[#9ca3af] mb-1 block">
                  Replenishment Number
                </label>
                <div className="text-sm text-white font-mono">
                  {selectedReplenishment.replenishmentNumber}
                </div>
              </div>
              <div>
                <label className="text-xs text-[#9ca3af] mb-1 block">
                  Status
                </label>
                <span
                  className={`px-2 py-1 rounded text-xs font-medium ${
                    selectedReplenishment.status === "COMPLETED"
                      ? "bg-green-500/20 text-green-400"
                      : selectedReplenishment.status === "IN_PROGRESS"
                        ? "bg-blue-500/20 text-blue-400"
                        : "bg-gray-500/20 text-gray-400"
                  }`}
                >
                  {selectedReplenishment.status.replace(/_/g, " ")}
                </span>
              </div>
              <div>
                <label className="text-xs text-[#9ca3af] mb-1 block">
                  Material Number
                </label>
                <button
                  onClick={() =>
                    router.push(
                      `/inventory?material=${selectedReplenishment.materialNumber}`,
                    )
                  }
                  className="text-sm text-cyan-400 hover:text-cyan-300 transition-colors font-mono"
                >
                  {selectedReplenishment.materialNumber}
                </button>
              </div>
              <div>
                <label className="text-xs text-[#9ca3af] mb-1 block">
                  Material Description
                </label>
                <div className="text-sm text-white">
                  {selectedReplenishment.materialDescription}
                </div>
              </div>
              <div>
                <label className="text-xs text-[#9ca3af] mb-1 block">
                  From Location
                </label>
                <button
                  onClick={() =>
                    router.push(
                      `/storage-locations?location=${selectedReplenishment.fromLocation}`,
                    )
                  }
                  className="text-sm text-cyan-400 hover:text-cyan-300 transition-colors font-mono"
                >
                  {selectedReplenishment.fromLocation}
                </button>
              </div>
              <div>
                <label className="text-xs text-[#9ca3af] mb-1 block">
                  To Location
                </label>
                <button
                  onClick={() =>
                    router.push(
                      `/storage-locations?location=${selectedReplenishment.toLocation}`,
                    )
                  }
                  className="text-sm text-cyan-400 hover:text-cyan-300 transition-colors font-mono"
                >
                  {selectedReplenishment.toLocation}
                </button>
              </div>
              <div>
                <label className="text-xs text-[#9ca3af] mb-1 block">
                  Current Stock
                </label>
                <div className="text-sm text-white">
                  {selectedReplenishment.currentStock.toFixed(2)}{" "}
                  {selectedReplenishment.unit}
                </div>
              </div>
              <div>
                <label className="text-xs text-[#9ca3af] mb-1 block">
                  Target Stock
                </label>
                <div className="text-sm text-white">
                  {selectedReplenishment.targetStock.toFixed(2)}{" "}
                  {selectedReplenishment.unit}
                </div>
              </div>
              <div>
                <label className="text-xs text-[#9ca3af] mb-1 block">
                  Replenish Quantity
                </label>
                <div className="text-sm text-cyan-400 font-medium">
                  {selectedReplenishment.replenishQuantity.toFixed(2)}{" "}
                  {selectedReplenishment.unit}
                </div>
              </div>
              {selectedReplenishment.actualQuantity && (
                <div>
                  <label className="text-xs text-[#9ca3af] mb-1 block">
                    Actual Quantity
                  </label>
                  <div className="text-sm text-white">
                    {selectedReplenishment.actualQuantity.toFixed(2)}{" "}
                    {selectedReplenishment.unit}
                  </div>
                </div>
              )}
              <div>
                <label className="text-xs text-[#9ca3af] mb-1 block">
                  Replenishment Type
                </label>
                <div className="text-sm text-white">
                  {selectedReplenishment.replenishmentType.replace(/_/g, "/")}
                </div>
              </div>
              <div>
                <label className="text-xs text-[#9ca3af] mb-1 block">
                  Trigger Reason
                </label>
                <div className="text-sm text-white">
                  {selectedReplenishment.triggerReason.replace(/_/g, " ")}
                </div>
              </div>
              <div>
                <label className="text-xs text-[#9ca3af] mb-1 block">
                  Priority
                </label>
                <span
                  className={`px-2 py-1 rounded text-xs font-medium ${
                    selectedReplenishment.priority === "URGENT"
                      ? "bg-red-500/20 text-red-400"
                      : selectedReplenishment.priority === "HIGH"
                        ? "bg-orange-500/20 text-orange-400"
                        : "bg-gray-500/20 text-gray-400"
                  }`}
                >
                  {selectedReplenishment.priority}
                </span>
              </div>
              {selectedReplenishment.assignedTo && (
                <div>
                  <label className="text-xs text-[#9ca3af] mb-1 block">
                    Assigned To
                  </label>
                  <div className="text-sm text-white">
                    {selectedReplenishment.assignedTo}
                  </div>
                </div>
              )}
              {selectedReplenishment.plannedDate && (
                <div>
                  <label className="text-xs text-[#9ca3af] mb-1 block">
                    Planned Date
                  </label>
                  <div className="text-sm text-white">
                    {format(
                      new Date(selectedReplenishment.plannedDate),
                      "MMM dd, yyyy",
                    )}
                  </div>
                </div>
              )}
              {selectedReplenishment.startedDate && (
                <div>
                  <label className="text-xs text-[#9ca3af] mb-1 block">
                    Started Date
                  </label>
                  <div className="text-sm text-white">
                    {format(
                      new Date(selectedReplenishment.startedDate),
                      "MMM dd, yyyy HH:mm",
                    )}
                  </div>
                </div>
              )}
              {selectedReplenishment.completedDate && (
                <div>
                  <label className="text-xs text-[#9ca3af] mb-1 block">
                    Completed Date
                  </label>
                  <div className="text-sm text-white">
                    {format(
                      new Date(selectedReplenishment.completedDate),
                      "MMM dd, yyyy HH:mm",
                    )}
                  </div>
                </div>
              )}
            </div>
            <div className="pt-4 border-t border-white/10">
              <ModuleLinks
                links={getInventoryLinks(selectedReplenishment.materialNumber)}
              />
            </div>
          </div>
        )}
      </Modal>
    </PageTemplate>
  );
}
