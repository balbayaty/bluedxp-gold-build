"use client";

import { useState, useMemo, useEffect } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import PageTemplate from "@/components/PageTemplate";
import Tooltip from "@/components/Tooltip";
import Modal from "@/components/Modal";
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
} from "recharts";
import {
  realtimeSimulator,
  simulateKPIUpdates,
} from "@/utils/realtimeDataSimulator";

interface Resource {
  id: string;
  resourceNumber: string;
  name: string;
  type:
    | "FORKLIFT"
    | "REACH_TRUCK"
    | "PALLET_JACK"
    | "CONVEYOR"
    | "SCANNER"
    | "OTHER";
  status:
    | "AVAILABLE"
    | "IN_USE"
    | "MAINTENANCE"
    | "OUT_OF_SERVICE"
    | "RESERVED";
  location: string;
  utilization: number;
  lastMaintenanceDate?: Date | string;
  nextMaintenanceDate?: Date | string;
  totalHours: number;
  hoursThisMonth: number;
  assignedTo?: string;
  assignedTask?: string;
  manufacturer?: string;
  model?: string;
  serialNumber?: string;
  purchaseDate?: Date | string;
  warrantyExpiry?: Date | string;
  costPerHour?: number;
  currency?: string;
  notes?: string;
  createdAt: Date | string;
}

export default function ResourceMaster() {
  const router = useRouter();
  const [resources, setResources] = useState<Resource[]>(() => {
    const types: Resource["type"][] = [
      "FORKLIFT",
      "REACH_TRUCK",
      "PALLET_JACK",
      "CONVEYOR",
      "SCANNER",
      "OTHER",
    ];
    const statuses: Resource["status"][] = [
      "AVAILABLE",
      "IN_USE",
      "MAINTENANCE",
      "OUT_OF_SERVICE",
      "RESERVED",
    ];

    return Array.from({ length: 40 }, (_, i) => {
      const type = types[Math.floor(Math.random() * types.length)];
      const status = statuses[Math.floor(Math.random() * statuses.length)];
      const utilization = Math.random() * 100;
      const lastMaintenance =
        Math.random() > 0.3
          ? new Date(Date.now() - Math.random() * 90 * 86400000)
          : undefined;
      const nextMaintenance = lastMaintenance
        ? new Date(lastMaintenance.getTime() + 30 * 86400000)
        : undefined;

      return {
        id: `RES-${Date.now()}-${i}`,
        resourceNumber: `RES-${String(i + 1).padStart(6, "0")}`,
        name: `${type.replace(/_/g, " ")} ${i + 1}`,
        type,
        status,
        location: `WH-${["A", "B", "C"][i % 3]}-${String(Math.floor(Math.random() * 10) + 1).padStart(2, "0")}`,
        utilization,
        lastMaintenanceDate: lastMaintenance,
        nextMaintenanceDate: nextMaintenance,
        totalHours: Math.random() * 10000,
        hoursThisMonth: Math.random() * 200,
        assignedTo:
          status === "IN_USE"
            ? `User ${Math.floor(Math.random() * 20) + 1}`
            : undefined,
        assignedTask:
          status === "IN_USE"
            ? `TASK-${String(Math.floor(Math.random() * 100) + 1).padStart(6, "0")}`
            : undefined,
        manufacturer: ["Toyota", "Crown", "Raymond", "Hyster", "Yale"][
          Math.floor(Math.random() * 5)
        ],
        model: `Model ${Math.floor(Math.random() * 50) + 1}`,
        serialNumber: `SN-${String(i + 1).padStart(8, "0")}`,
        purchaseDate: new Date(Date.now() - Math.random() * 1825 * 86400000),
        warrantyExpiry: new Date(Date.now() + Math.random() * 365 * 86400000),
        costPerHour: Math.random() * 50 + 10,
        currency: "SAR",
        notes: Math.random() > 0.7 ? `Resource notes for ${type}` : undefined,
        createdAt: new Date(Date.now() - Math.random() * 365 * 86400000),
      };
    });
  });

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");
  const [selectedType, setSelectedType] = useState<string>("ALL");
  const [viewMode, setViewMode] = useState<
    "table" | "grid" | "analytics" | "realtime" | "maintenance" | "calendar"
  >("table");
  const [selectedResource, setSelectedResource] = useState<Resource | null>(
    null,
  );
  const [showViewModal, setShowViewModal] = useState(false);
  const [realTimeEnabled, setRealTimeEnabled] = useState(true);
  const [realTimeStats, setRealTimeStats] = useState({
    totalResources: 0,
    available: 0,
    inUse: 0,
    averageUtilization: 0,
  });

  const filteredResources = useMemo(() => {
    return resources.filter((res) => {
      const matchesSearch =
        res.resourceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        res.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        res.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
        res.serialNumber?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus =
        selectedStatus === "ALL" || res.status === selectedStatus;
      const matchesType = selectedType === "ALL" || res.type === selectedType;
      return matchesSearch && matchesStatus && matchesType;
    });
  }, [resources, searchQuery, selectedStatus, selectedType]);

  // Analytics
  const statusDistribution = useMemo(() => {
    const counts: Record<string, number> = {};
    resources.forEach((res) => {
      counts[res.status] = (counts[res.status] || 0) + 1;
    });
    return Object.entries(counts).map(([status, count]) => ({ status, count }));
  }, [resources]);

  const typeDistribution = useMemo(() => {
    const counts: Record<string, number> = {};
    resources.forEach((res) => {
      counts[res.type] = (counts[res.type] || 0) + 1;
    });
    return Object.entries(counts).map(([type, count]) => ({
      type: type.replace(/_/g, " "),
      count,
    }));
  }, [resources]);

  const utilizationData = useMemo(() => {
    return resources
      .map((res) => ({
        name: res.resourceNumber,
        utilization: res.utilization,
        hours: res.hoursThisMonth,
      }))
      .sort((a, b) => b.utilization - a.utilization)
      .slice(0, 10);
  }, [resources]);

  const maintenanceData = useMemo(() => {
    const dueSoon = resources.filter((res) => {
      if (!res.nextMaintenanceDate) return false;
      const daysUntil = Math.ceil(
        (new Date(res.nextMaintenanceDate).getTime() - Date.now()) / 86400000,
      );
      return daysUntil <= 30 && daysUntil >= 0;
    }).length;

    const overdue = resources.filter((res) => {
      if (!res.nextMaintenanceDate) return false;
      return new Date(res.nextMaintenanceDate).getTime() < Date.now();
    }).length;

    return { dueSoon, overdue, total: resources.length };
  }, [resources]);

  // Aggregate stats
  const aggregateStats = useMemo(() => {
    const total = resources.length;
    const available = resources.filter((r) => r.status === "AVAILABLE").length;
    const inUse = resources.filter((r) => r.status === "IN_USE").length;
    const avgUtilization =
      resources.reduce((sum, r) => sum + r.utilization, 0) / total;

    return {
      total,
      available,
      inUse,
      averageUtilization: avgUtilization,
    };
  }, [resources]);

  // Real-time updates
  useEffect(() => {
    if (!realTimeEnabled) return;

    const unsubscribe = realtimeSimulator.subscribe(
      "resource-stats",
      (data: typeof realTimeStats) => {
        setRealTimeStats(data);
      },
    );

    const stop = realtimeSimulator.start(
      "resource-stats",
      () => ({
        totalResources: simulateKPIUpdates(aggregateStats.total, 0),
        available: simulateKPIUpdates(aggregateStats.available, 0.1),
        inUse: simulateKPIUpdates(aggregateStats.inUse, 0.1),
        averageUtilization: simulateKPIUpdates(
          aggregateStats.averageUtilization,
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
    aggregateStats.available,
    aggregateStats.inUse,
    aggregateStats.averageUtilization,
  ]);

  // Simulate real-time status changes
  useEffect(() => {
    if (!realTimeEnabled) return;

    const interval = setInterval(() => {
      setResources((prev) =>
        prev.map((res) => {
          if (res.status === "AVAILABLE" && Math.random() < 0.02) {
            return {
              ...res,
              status: "IN_USE" as const,
              utilization: Math.min(100, res.utilization + Math.random() * 5),
            };
          }
          if (res.status === "IN_USE" && Math.random() < 0.02) {
            return {
              ...res,
              status: "AVAILABLE" as const,
              utilization: Math.max(0, res.utilization - Math.random() * 5),
            };
          }
          if (res.status === "IN_USE" && Math.random() < 0.01) {
            return { ...res, status: "MAINTENANCE" as const };
          }
          return res;
        }),
      );
    }, 10000);

    return () => clearInterval(interval);
  }, [realTimeEnabled]);

  const stats = [
    {
      label: "Total Resources",
      value: realTimeEnabled
        ? realTimeStats.totalResources
        : aggregateStats.total,
      icon: "ri-tools-line",
      tooltip: "Total equipment and resources",
      trend: "up" as const,
    },
    {
      label: "Available",
      value: realTimeEnabled
        ? realTimeStats.available
        : aggregateStats.available,
      icon: "ri-checkbox-circle-line",
      tooltip: "Resources available for use",
      trend: "up" as const,
    },
    {
      label: "In Use",
      value: realTimeEnabled ? realTimeStats.inUse : aggregateStats.inUse,
      icon: "ri-play-circle-line",
      tooltip: "Resources currently in use",
      trend: "neutral" as const,
    },
    {
      label: "Avg Utilization",
      value: `${(realTimeEnabled ? realTimeStats.averageUtilization : aggregateStats.averageUtilization).toFixed(1)}%`,
      icon: "ri-speed-line",
      tooltip: "Average resource utilization",
      trend: "up" as const,
    },
  ];

  const COLORS = ["#06b6d4", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"];

  const handleView = (resource: Resource) => {
    setSelectedResource(resource);
    setShowViewModal(true);
  };

  return (
    <PageTemplate
      title="Resource Master"
      description="Equipment and resource management - Track, manage, and optimize warehouse equipment, vehicles, and tools"
      icon="ri-tools-line"
      systemInfo={{
        sap: "Resource Master, Equipment Management",
        oracle: "Resources, Equipment Management",
        manhattan: "Resource Management, Equipment Tracking",
      }}
      examples={[
        "Track equipment status and location",
        "Monitor resource utilization",
        "Schedule maintenance",
        "Manage equipment assignments",
        "Optimize resource allocation",
        "Track equipment costs",
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
              onClick={() => setViewMode("maintenance")}
              className={`p-1.5 sm:p-2 rounded transition-colors ${
                viewMode === "maintenance"
                  ? "bg-cyan-500/20 text-cyan-400"
                  : "text-[#9ca3af] hover:text-white"
              }`}
              title="Maintenance Schedule"
            >
              <i className="ri-tools-line text-sm sm:text-base"></i>
            </button>
            <button
              onClick={() => setViewMode("calendar")}
              className={`p-1.5 sm:p-2 rounded transition-colors ${
                viewMode === "calendar"
                  ? "bg-cyan-500/20 text-cyan-400"
                  : "text-[#9ca3af] hover:text-white"
              }`}
              title="Availability Calendar"
            >
              <i className="ri-calendar-line text-sm sm:text-base"></i>
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
            placeholder="Search by Resource Number, Name, Location, Serial..."
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
          <option value="AVAILABLE">Available</option>
          <option value="IN_USE">In Use</option>
          <option value="MAINTENANCE">Maintenance</option>
          <option value="OUT_OF_SERVICE">Out of Service</option>
          <option value="RESERVED">Reserved</option>
        </select>
        <select
          value={selectedType}
          onChange={(e) => setSelectedType(e.target.value)}
          className="bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 min-w-[180px]"
        >
          <option value="ALL">All Types</option>
          <option value="FORKLIFT">Forklift</option>
          <option value="REACH_TRUCK">Reach Truck</option>
          <option value="PALLET_JACK">Pallet Jack</option>
          <option value="CONVEYOR">Conveyor</option>
          <option value="SCANNER">Scanner</option>
          <option value="OTHER">Other</option>
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
                    Resource Number
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-[#9ca3af] uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-[#9ca3af] uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-[#9ca3af] uppercase tracking-wider">
                    Location
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-[#9ca3af] uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-[#9ca3af] uppercase tracking-wider">
                    Utilization
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-[#9ca3af] uppercase tracking-wider">
                    Assigned To
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-[#9ca3af] uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {filteredResources.map((res, index) => (
                  <motion.tr
                    key={res.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.02 }}
                    className="hover:bg-white/5 transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-white font-mono">
                        {res.resourceNumber}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-white">{res.name}</div>
                      {res.manufacturer && (
                        <div className="text-xs text-[#9ca3af]">
                          {res.manufacturer} {res.model}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-white">
                        {res.type.replace(/_/g, " ")}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() =>
                          router.push(
                            `/storage-locations?location=${res.location}`,
                          )
                        }
                        className="text-sm text-cyan-400 hover:text-cyan-300 transition-colors font-mono"
                      >
                        {res.location}
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${
                          res.status === "AVAILABLE"
                            ? "bg-green-500/20 text-green-400 border border-green-500/30"
                            : res.status === "IN_USE"
                              ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                              : res.status === "MAINTENANCE"
                                ? "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30"
                                : res.status === "OUT_OF_SERVICE"
                                  ? "bg-red-500/20 text-red-400 border border-red-500/30"
                                  : "bg-gray-500/20 text-gray-400 border border-gray-500/30"
                        }`}
                      >
                        {res.status.replace(/_/g, " ")}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-gray-700 rounded-full h-2 min-w-[60px]">
                          <div
                            className={`h-2 rounded-full ${
                              res.utilization > 80
                                ? "bg-red-500"
                                : res.utilization > 60
                                  ? "bg-yellow-500"
                                  : "bg-green-500"
                            }`}
                            style={{
                              width: `${Math.min(res.utilization, 100)}%`,
                            }}
                          ></div>
                        </div>
                        <span className="text-sm text-white w-12 text-right">
                          {res.utilization.toFixed(0)}%
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {res.assignedTo ? (
                        <div>
                          <div className="text-sm text-white">
                            {res.assignedTo}
                          </div>
                          {res.assignedTask && (
                            <button
                              onClick={() =>
                                router.push(`/tasks?task=${res.assignedTask}`)
                              }
                              className="text-xs text-cyan-400 hover:text-cyan-300 transition-colors font-mono"
                            >
                              {res.assignedTask}
                            </button>
                          )}
                        </div>
                      ) : (
                        <span className="text-xs text-[#9ca3af]">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => handleView(res)}
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

      {/* Grid View */}
      {viewMode === "grid" && (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredResources.map((res, index) => (
            <motion.div
              key={res.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.03 }}
              className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-6 hover:border-cyan-500/50 hover:shadow-lg hover:shadow-cyan-500/10 transition-all cursor-pointer"
              onClick={() => handleView(res)}
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-white font-mono mb-1">
                    {res.resourceNumber}
                  </h3>
                  <p className="text-sm text-[#9ca3af]">{res.name}</p>
                </div>
                <span
                  className={`px-2 py-1 rounded text-xs font-medium ${
                    res.status === "AVAILABLE"
                      ? "bg-green-500/20 text-green-400"
                      : res.status === "IN_USE"
                        ? "bg-blue-500/20 text-blue-400"
                        : res.status === "MAINTENANCE"
                          ? "bg-yellow-500/20 text-yellow-400"
                          : "bg-red-500/20 text-red-400"
                  }`}
                >
                  {res.status.replace(/_/g, " ")}
                </span>
              </div>
              <div className="space-y-2 mb-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-[#9ca3af]">Type:</span>
                  <span className="text-white">
                    {res.type.replace(/_/g, " ")}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-[#9ca3af]">Location:</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      router.push(
                        `/storage-locations?location=${res.location}`,
                      );
                    }}
                    className="text-cyan-400 hover:text-cyan-300 transition-colors font-mono text-xs"
                  >
                    {res.location}
                  </button>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-[#9ca3af]">Utilization:</span>
                  <span className="text-white font-medium">
                    {res.utilization.toFixed(0)}%
                  </span>
                </div>
                {res.assignedTo && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-[#9ca3af]">Assigned To:</span>
                    <span className="text-white">{res.assignedTo}</span>
                  </div>
                )}
                {res.nextMaintenanceDate && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-[#9ca3af]">Next Maintenance:</span>
                    <span
                      className={`text-xs ${
                        new Date(res.nextMaintenanceDate).getTime() < Date.now()
                          ? "text-red-400"
                          : new Date(res.nextMaintenanceDate).getTime() <
                              Date.now() + 7 * 86400000
                            ? "text-yellow-400"
                            : "text-green-400"
                      }`}
                    >
                      {format(new Date(res.nextMaintenanceDate), "MMM dd")}
                    </span>
                  </div>
                )}
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
                    label={({ status, count }) =>
                      `${status.replace(/_/g, " ")}: ${count}`
                    }
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
                Type Distribution
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
              Top Resources by Utilization
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={utilizationData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="name" stroke="#9ca3af" fontSize={10} />
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
                  dataKey="utilization"
                  fill="#06b6d4"
                  name="Utilization %"
                />
                <Bar dataKey="hours" fill="#10b981" name="Hours This Month" />
              </BarChart>
            </ResponsiveContainer>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
          >
            <h3 className="text-lg font-semibold text-white mb-4">
              Maintenance Status
            </h3>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="bg-white/5 rounded-lg p-4">
                <div className="text-xs text-[#9ca3af] mb-1">
                  Total Resources
                </div>
                <div className="text-2xl font-bold text-white">
                  {maintenanceData.total}
                </div>
              </div>
              <div className="bg-white/5 rounded-lg p-4">
                <div className="text-xs text-[#9ca3af] mb-1">
                  Due Soon (≤30 days)
                </div>
                <div className="text-2xl font-bold text-yellow-400">
                  {maintenanceData.dueSoon}
                </div>
              </div>
              <div className="bg-white/5 rounded-lg p-4">
                <div className="text-xs text-[#9ca3af] mb-1">Overdue</div>
                <div className="text-2xl font-bold text-red-400">
                  {maintenanceData.overdue}
                </div>
              </div>
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
                  Total Resources
                </div>
                <div className="text-2xl font-bold text-white">
                  {realTimeStats.totalResources}
                </div>
              </div>
              <div className="bg-white/5 rounded-lg p-4">
                <div className="text-xs text-[#9ca3af] mb-1">Available</div>
                <div className="text-2xl font-bold text-green-400">
                  {realTimeStats.available}
                </div>
              </div>
              <div className="bg-white/5 rounded-lg p-4">
                <div className="text-xs text-[#9ca3af] mb-1">In Use</div>
                <div className="text-2xl font-bold text-cyan-400">
                  {realTimeStats.inUse}
                </div>
              </div>
              <div className="bg-white/5 rounded-lg p-4">
                <div className="text-xs text-[#9ca3af] mb-1">
                  Avg Utilization
                </div>
                <div className="text-2xl font-bold text-yellow-400">
                  {realTimeStats.averageUtilization.toFixed(1)}%
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
              {filteredResources
                .sort(
                  (a, b) =>
                    new Date(b.createdAt).getTime() -
                    new Date(a.createdAt).getTime(),
                )
                .slice(0, 10)
                .map((res) => (
                  <div
                    key={res.id}
                    className="flex items-center justify-between p-3 bg-white/5 rounded-lg"
                  >
                    <div className="flex-1">
                      <div className="text-sm font-medium text-white">
                        {res.resourceNumber}
                      </div>
                      <div className="text-xs text-[#9ca3af]">
                        {res.name} • {res.location} •{" "}
                        {res.type.replace(/_/g, " ")}
                      </div>
                    </div>
                    <div
                      className={`text-xs px-2 py-1 rounded ${
                        res.status === "AVAILABLE"
                          ? "bg-green-500/20 text-green-400"
                          : res.status === "IN_USE"
                            ? "bg-cyan-500/20 text-cyan-400"
                            : res.status === "MAINTENANCE"
                              ? "bg-yellow-500/20 text-yellow-400"
                              : "bg-red-500/20 text-red-400"
                      }`}
                    >
                      {res.status.replace(/_/g, " ")}
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
          setSelectedResource(null);
        }}
        title={`Resource Details - ${selectedResource?.resourceNumber || ""}`}
        size="lg"
      >
        {selectedResource && (
          <div className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-[#9ca3af] mb-1">
                  Resource Number
                </div>
                <div className="text-white font-medium font-mono">
                  {selectedResource.resourceNumber}
                </div>
              </div>
              <div>
                <div className="text-sm text-[#9ca3af] mb-1">Status</div>
                <span
                  className={`px-2 py-1 rounded text-xs font-medium ${
                    selectedResource.status === "AVAILABLE"
                      ? "bg-green-500/20 text-green-400"
                      : selectedResource.status === "IN_USE"
                        ? "bg-blue-500/20 text-blue-400"
                        : selectedResource.status === "MAINTENANCE"
                          ? "bg-yellow-500/20 text-yellow-400"
                          : "bg-red-500/20 text-red-400"
                  }`}
                >
                  {selectedResource.status.replace(/_/g, " ")}
                </span>
              </div>
              <div>
                <div className="text-sm text-[#9ca3af] mb-1">Name</div>
                <div className="text-white font-medium">
                  {selectedResource.name}
                </div>
              </div>
              <div>
                <div className="text-sm text-[#9ca3af] mb-1">Type</div>
                <div className="text-white">
                  {selectedResource.type.replace(/_/g, " ")}
                </div>
              </div>
              <div>
                <div className="text-sm text-[#9ca3af] mb-1">Location</div>
                <button
                  onClick={() =>
                    router.push(
                      `/storage-locations?location=${selectedResource.location}`,
                    )
                  }
                  className="text-cyan-400 hover:text-cyan-300 transition-colors font-mono"
                >
                  {selectedResource.location}
                </button>
              </div>
              <div>
                <div className="text-sm text-[#9ca3af] mb-1">Utilization</div>
                <div className="text-white font-medium">
                  {selectedResource.utilization.toFixed(1)}%
                </div>
              </div>
              {selectedResource.manufacturer && (
                <div>
                  <div className="text-sm text-[#9ca3af] mb-1">
                    Manufacturer
                  </div>
                  <div className="text-white">
                    {selectedResource.manufacturer} {selectedResource.model}
                  </div>
                </div>
              )}
              {selectedResource.serialNumber && (
                <div>
                  <div className="text-sm text-[#9ca3af] mb-1">
                    Serial Number
                  </div>
                  <div className="text-white font-mono">
                    {selectedResource.serialNumber}
                  </div>
                </div>
              )}
              {selectedResource.assignedTo && (
                <div>
                  <div className="text-sm text-[#9ca3af] mb-1">Assigned To</div>
                  <div className="text-white">
                    {selectedResource.assignedTo}
                  </div>
                  {selectedResource.assignedTask && (
                    <button
                      onClick={() =>
                        router.push(
                          `/tasks?task=${selectedResource.assignedTask}`,
                        )
                      }
                      className="text-xs text-cyan-400 hover:text-cyan-300 transition-colors font-mono mt-1"
                    >
                      {selectedResource.assignedTask}
                    </button>
                  )}
                </div>
              )}
              {selectedResource.lastMaintenanceDate && (
                <div>
                  <div className="text-sm text-[#9ca3af] mb-1">
                    Last Maintenance
                  </div>
                  <div className="text-white">
                    {format(
                      new Date(selectedResource.lastMaintenanceDate),
                      "MMM dd, yyyy",
                    )}
                  </div>
                </div>
              )}
              {selectedResource.nextMaintenanceDate && (
                <div>
                  <div className="text-sm text-[#9ca3af] mb-1">
                    Next Maintenance
                  </div>
                  <div
                    className={`${
                      new Date(selectedResource.nextMaintenanceDate).getTime() <
                      Date.now()
                        ? "text-red-400"
                        : new Date(
                              selectedResource.nextMaintenanceDate,
                            ).getTime() <
                            Date.now() + 7 * 86400000
                          ? "text-yellow-400"
                          : "text-green-400"
                    }`}
                  >
                    {format(
                      new Date(selectedResource.nextMaintenanceDate),
                      "MMM dd, yyyy",
                    )}
                  </div>
                </div>
              )}
              <div>
                <div className="text-sm text-[#9ca3af] mb-1">Total Hours</div>
                <div className="text-white">
                  {selectedResource.totalHours.toFixed(0)}
                </div>
              </div>
              <div>
                <div className="text-sm text-[#9ca3af] mb-1">
                  Hours This Month
                </div>
                <div className="text-white">
                  {selectedResource.hoursThisMonth.toFixed(0)}
                </div>
              </div>
            </div>
            {selectedResource.notes && (
              <div>
                <div className="text-sm text-[#9ca3af] mb-1">Notes</div>
                <div className="text-white bg-white/5 p-3 rounded-lg">
                  {selectedResource.notes}
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </PageTemplate>
  );
}
