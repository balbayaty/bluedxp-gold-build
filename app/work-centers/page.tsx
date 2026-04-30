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

interface WorkCenter {
  id: string;
  workCenterCode: string;
  workCenterName: string;
  type:
    | "RECEIVING"
    | "PUTAWAY"
    | "PICKING"
    | "DISPATCHING"
    | "QC"
    | "CROSS_DOCK"
    | "STORAGE"
    | "VALUE_ADDED";
  location: string;
  warehouse: string;
  capacity: number;
  currentLoad: number;
  utilization: number;
  status: "ACTIVE" | "MAINTENANCE" | "IDLE" | "OVERLOADED" | "CLOSED";
  assignedPersonnel: number;
  maxPersonnel: number;
  capabilities: Array<{
    id: string;
    name: string;
    enabled: boolean;
  }>;
  operatingHours: {
    monday: { isOpen: boolean; openTime?: string; closeTime?: string };
    tuesday: { isOpen: boolean; openTime?: string; closeTime?: string };
    wednesday: { isOpen: boolean; openTime?: string; closeTime?: string };
    thursday: { isOpen: boolean; openTime?: string; closeTime?: string };
    friday: { isOpen: boolean; openTime?: string; closeTime?: string };
    saturday: { isOpen: boolean; openTime?: string; closeTime?: string };
    sunday: { isOpen: boolean; openTime?: string; closeTime?: string };
  };
  metrics: {
    totalOrders: number;
    ordersToday: number;
    ordersThisWeek: number;
    ordersThisMonth: number;
    averageOrderFulfillmentTime: number;
    onTimeDeliveryRate: number;
    inventoryAccuracy: number;
    spaceEfficiency: number;
    throughput: number;
    costPerOrder: number;
    revenue: number;
  };
  resources: Array<{
    id: string;
    type: string;
    name: string;
    status: string;
    utilization: number;
  }>;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export default function WorkCenters() {
  const router = useRouter();
  const [workCenters, setWorkCenters] = useState<WorkCenter[]>(() => {
    const types: WorkCenter["type"][] = [
      "RECEIVING",
      "PUTAWAY",
      "PICKING",
      "DISPATCHING",
      "QC",
      "CROSS_DOCK",
      "STORAGE",
      "VALUE_ADDED",
    ];
    const statuses: WorkCenter["status"][] = [
      "ACTIVE",
      "MAINTENANCE",
      "IDLE",
      "OVERLOADED",
      "CLOSED",
    ];
    const warehouses = ["WH-A", "WH-B", "WH-C"];

    return Array.from({ length: 25 }, (_, i) => {
      const type = types[Math.floor(Math.random() * types.length)];
      const status = statuses[Math.floor(Math.random() * statuses.length)];
      const capacity = Math.floor(Math.random() * 20) + 5;
      const currentLoad = Math.floor(Math.random() * capacity);
      const utilization = (currentLoad / capacity) * 100;
      const assignedPersonnel = Math.floor(Math.random() * 10) + 1;
      const maxPersonnel = assignedPersonnel + Math.floor(Math.random() * 5);

      return {
        id: `WC-${Date.now()}-${i}`,
        workCenterCode: `WC-${String(i + 1).padStart(4, "0")}`,
        workCenterName: `${type.replace(/_/g, " ")} Center ${i + 1}`,
        type,
        location: `Zone ${String.fromCharCode(65 + (i % 5))}`,
        warehouse: warehouses[i % warehouses.length],
        capacity,
        currentLoad,
        utilization,
        status,
        assignedPersonnel,
        maxPersonnel,
        capabilities: [
          {
            id: "cap-1",
            name: "Picking",
            enabled: type === "PICKING" || Math.random() > 0.5,
          },
          {
            id: "cap-2",
            name: "Putaway",
            enabled: type === "PUTAWAY" || Math.random() > 0.5,
          },
          {
            id: "cap-3",
            name: "Cross-Docking",
            enabled: type === "CROSS_DOCK" || Math.random() > 0.5,
          },
          {
            id: "cap-4",
            name: "Value-Added Services",
            enabled: type === "VALUE_ADDED" || Math.random() > 0.5,
          },
        ],
        operatingHours: {
          monday: { isOpen: true, openTime: "08:00", closeTime: "18:00" },
          tuesday: { isOpen: true, openTime: "08:00", closeTime: "18:00" },
          wednesday: { isOpen: true, openTime: "08:00", closeTime: "18:00" },
          thursday: { isOpen: true, openTime: "08:00", closeTime: "18:00" },
          friday: { isOpen: true, openTime: "08:00", closeTime: "18:00" },
          saturday: {
            isOpen: Math.random() > 0.3,
            openTime: "08:00",
            closeTime: "14:00",
          },
          sunday: { isOpen: Math.random() > 0.5 },
        },
        metrics: {
          totalOrders: Math.floor(Math.random() * 10000) + 1000,
          ordersToday: Math.floor(Math.random() * 100) + 10,
          ordersThisWeek: Math.floor(Math.random() * 500) + 50,
          ordersThisMonth: Math.floor(Math.random() * 2000) + 200,
          averageOrderFulfillmentTime: Math.random() * 8 + 2,
          onTimeDeliveryRate: Math.random() * 9 + 90,
          inventoryAccuracy: Math.random() * 4.9 + 95,
          spaceEfficiency: Math.random() * 20 + 75,
          throughput: Math.random() * 150 + 50,
          costPerOrder: Math.random() * 40 + 10,
          revenue: Math.random() * 900000 + 100000,
        },
        resources: Array.from(
          { length: Math.floor(Math.random() * 10) + 5 },
          (_, j) => ({
            id: `resource-${i + 1}-${j + 1}`,
            type: ["FORKLIFT", "REACH_TRUCK", "PALLET_JACK"][
              Math.floor(Math.random() * 3)
            ],
            name: `Resource ${j + 1}`,
            status: ["AVAILABLE", "IN_USE", "MAINTENANCE"][
              Math.floor(Math.random() * 3)
            ],
            utilization: Math.random() * 100,
          }),
        ),
        createdAt: new Date(Date.now() - Math.random() * 365 * 86400000),
        updatedAt: new Date(),
      };
    });
  });

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");
  const [selectedType, setSelectedType] = useState<string>("ALL");
  const [viewMode, setViewMode] = useState<
    "table" | "grid" | "analytics" | "realtime" | "capacity" | "allocation"
  >("table");
  const [selectedWorkCenter, setSelectedWorkCenter] =
    useState<WorkCenter | null>(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [realTimeEnabled, setRealTimeEnabled] = useState(true);
  const [realTimeStats, setRealTimeStats] = useState({
    totalWorkCenters: 0,
    active: 0,
    averageUtilization: 0,
    totalThroughput: 0,
  });

  const filteredWorkCenters = useMemo(() => {
    return workCenters.filter((wc) => {
      const matchesSearch =
        wc.workCenterCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
        wc.workCenterName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        wc.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
        wc.warehouse.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus =
        selectedStatus === "ALL" || wc.status === selectedStatus;
      const matchesType = selectedType === "ALL" || wc.type === selectedType;
      return matchesSearch && matchesStatus && matchesType;
    });
  }, [workCenters, searchQuery, selectedStatus, selectedType]);

  // Analytics
  const statusDistribution = useMemo(() => {
    const counts: Record<string, number> = {};
    workCenters.forEach((wc) => {
      counts[wc.status] = (counts[wc.status] || 0) + 1;
    });
    return Object.entries(counts).map(([status, count]) => ({ status, count }));
  }, [workCenters]);

  const typeDistribution = useMemo(() => {
    const counts: Record<string, number> = {};
    workCenters.forEach((wc) => {
      counts[wc.type] = (counts[wc.type] || 0) + 1;
    });
    return Object.entries(counts).map(([type, count]) => ({
      type: type.replace(/_/g, " "),
      count,
    }));
  }, [workCenters]);

  const utilizationData = useMemo(() => {
    return workCenters
      .map((wc) => ({
        name: wc.workCenterCode,
        utilization: wc.utilization,
        capacity: wc.capacity,
        currentLoad: wc.currentLoad,
      }))
      .sort((a, b) => b.utilization - a.utilization)
      .slice(0, 10);
  }, [workCenters]);

  const performanceData = useMemo(() => {
    return workCenters
      .map((wc) => ({
        name: wc.workCenterCode,
        onTimeRate: wc.metrics.onTimeDeliveryRate,
        accuracy: wc.metrics.inventoryAccuracy,
        throughput: wc.metrics.throughput,
      }))
      .sort((a, b) => b.throughput - a.throughput)
      .slice(0, 10);
  }, [workCenters]);

  // Aggregate stats
  const aggregateStats = useMemo(() => {
    const total = workCenters.length;
    const active = workCenters.filter((wc) => wc.status === "ACTIVE").length;
    const avgUtilization =
      workCenters.reduce((sum, wc) => sum + wc.utilization, 0) / total;
    const totalThroughput = workCenters.reduce(
      (sum, wc) => sum + wc.metrics.throughput,
      0,
    );

    return {
      total,
      active,
      averageUtilization: avgUtilization,
      totalThroughput,
    };
  }, [workCenters]);

  // Real-time updates
  useEffect(() => {
    if (!realTimeEnabled) return;

    const unsubscribe = realtimeSimulator.subscribe(
      "work-center-stats",
      (data: typeof realTimeStats) => {
        setRealTimeStats(data);
      },
    );

    const stop = realtimeSimulator.start(
      "work-center-stats",
      () => ({
        totalWorkCenters: simulateKPIUpdates(aggregateStats.total, 0),
        active: simulateKPIUpdates(aggregateStats.active, 0.1),
        averageUtilization: simulateKPIUpdates(
          aggregateStats.averageUtilization,
          0.05,
        ),
        totalThroughput: simulateKPIUpdates(
          aggregateStats.totalThroughput,
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
    aggregateStats.active,
    aggregateStats.averageUtilization,
    aggregateStats.totalThroughput,
  ]);

  // Simulate real-time status changes
  useEffect(() => {
    if (!realTimeEnabled) return;

    const interval = setInterval(() => {
      setWorkCenters((prev) =>
        prev.map((wc) => {
          if (wc.status === "ACTIVE" && Math.random() < 0.02) {
            const newLoad = Math.min(wc.capacity, wc.currentLoad + 1);
            return {
              ...wc,
              currentLoad: newLoad,
              utilization: (newLoad / wc.capacity) * 100,
              status:
                newLoad >= wc.capacity * 0.9
                  ? ("OVERLOADED" as const)
                  : wc.status,
            };
          }
          if (wc.status === "OVERLOADED" && Math.random() < 0.02) {
            const newLoad = Math.max(0, wc.currentLoad - 1);
            return {
              ...wc,
              currentLoad: newLoad,
              utilization: (newLoad / wc.capacity) * 100,
              status:
                newLoad < wc.capacity * 0.9 ? ("ACTIVE" as const) : wc.status,
            };
          }
          if (wc.status === "IDLE" && Math.random() < 0.03) {
            return { ...wc, status: "ACTIVE" as const };
          }
          return wc;
        }),
      );
    }, 10000);

    return () => clearInterval(interval);
  }, [realTimeEnabled]);

  const stats = [
    {
      label: "Total Work Centers",
      value: realTimeEnabled
        ? realTimeStats.totalWorkCenters
        : aggregateStats.total,
      icon: "ri-building-2-line",
      tooltip: "Total work centers",
      trend: "up" as const,
    },
    {
      label: "Active",
      value: realTimeEnabled ? realTimeStats.active : aggregateStats.active,
      icon: "ri-play-circle-line",
      tooltip: "Active work centers",
      trend: "up" as const,
    },
    {
      label: "Avg Utilization",
      value: `${(realTimeEnabled ? realTimeStats.averageUtilization : aggregateStats.averageUtilization).toFixed(1)}%`,
      icon: "ri-speed-line",
      tooltip: "Average work center utilization",
      trend: "up" as const,
    },
    {
      label: "Total Throughput",
      value: `${(realTimeEnabled ? realTimeStats.totalThroughput : aggregateStats.totalThroughput).toFixed(0)}/hr`,
      icon: "ri-dashboard-line",
      tooltip: "Total throughput across all centers",
      trend: "up" as const,
    },
  ];

  const COLORS = ["#06b6d4", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"];

  const handleView = (workCenter: WorkCenter) => {
    setSelectedWorkCenter(workCenter);
    setShowViewModal(true);
  };

  return (
    <PageTemplate
      title="Work Centers"
      description="Work center management - Manage warehouse work centers, track capacity, utilization, and performance metrics"
      icon="ri-building-2-line"
      systemInfo={{
        sap: "CR01 - Work Center, Capacity Planning",
        oracle: "Work Center, Resource Planning",
        manhattan: "Work Centers, Capacity Management",
      }}
      examples={[
        "Manage work center capacity",
        "Track utilization and performance",
        "Monitor work center status",
        "Schedule maintenance",
        "Optimize resource allocation",
        "Track throughput and efficiency",
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
              onClick={() => setViewMode("capacity")}
              className={`p-1.5 sm:p-2 rounded transition-colors ${
                viewMode === "capacity"
                  ? "bg-cyan-500/20 text-cyan-400"
                  : "text-[#9ca3af] hover:text-white"
              }`}
              title="Capacity Planning"
            >
              <i className="ri-bar-chart-box-line text-sm sm:text-base"></i>
            </button>
            <button
              onClick={() => setViewMode("allocation")}
              className={`p-1.5 sm:p-2 rounded transition-colors ${
                viewMode === "allocation"
                  ? "bg-cyan-500/20 text-cyan-400"
                  : "text-[#9ca3af] hover:text-white"
              }`}
              title="Resource Allocation"
            >
              <i className="ri-user-settings-line text-sm sm:text-base"></i>
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
            placeholder="Search by Work Center Code, Name, Location, Warehouse..."
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
          <option value="MAINTENANCE">Maintenance</option>
          <option value="IDLE">Idle</option>
          <option value="OVERLOADED">Overloaded</option>
          <option value="CLOSED">Closed</option>
        </select>
        <select
          value={selectedType}
          onChange={(e) => setSelectedType(e.target.value)}
          className="bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 min-w-[180px]"
        >
          <option value="ALL">All Types</option>
          <option value="RECEIVING">Receiving</option>
          <option value="PUTAWAY">Putaway</option>
          <option value="PICKING">Picking</option>
          <option value="DISPATCHING">Dispatching</option>
          <option value="QC">Quality Control</option>
          <option value="CROSS_DOCK">Cross-Dock</option>
          <option value="STORAGE">Storage</option>
          <option value="VALUE_ADDED">Value-Added</option>
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
                    Work Center Code
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
                    Capacity
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-[#9ca3af] uppercase tracking-wider">
                    Utilization
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-[#9ca3af] uppercase tracking-wider">
                    Personnel
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-[#9ca3af] uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {filteredWorkCenters.map((wc, index) => (
                  <motion.tr
                    key={wc.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.02 }}
                    className="hover:bg-white/5 transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-white font-mono">
                        {wc.workCenterCode}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-white">
                        {wc.workCenterName}
                      </div>
                      <div className="text-xs text-[#9ca3af]">
                        {wc.warehouse}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-white">
                        {wc.type.replace(/_/g, " ")}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() =>
                          router.push(
                            `/storage-locations?location=${wc.location}`,
                          )
                        }
                        className="text-sm text-cyan-400 hover:text-cyan-300 transition-colors font-mono"
                      >
                        {wc.location}
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${
                          wc.status === "ACTIVE"
                            ? "bg-green-500/20 text-green-400 border border-green-500/30"
                            : wc.status === "MAINTENANCE"
                              ? "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30"
                              : wc.status === "OVERLOADED"
                                ? "bg-red-500/20 text-red-400 border border-red-500/30"
                                : wc.status === "IDLE"
                                  ? "bg-gray-500/20 text-gray-400 border border-gray-500/30"
                                  : "bg-red-500/20 text-red-400 border border-red-500/30"
                        }`}
                      >
                        {wc.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-white">
                        {wc.currentLoad} / {wc.capacity}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-gray-700 rounded-full h-2 min-w-[60px]">
                          <div
                            className={`h-2 rounded-full ${
                              wc.utilization > 90
                                ? "bg-red-500"
                                : wc.utilization > 70
                                  ? "bg-yellow-500"
                                  : "bg-green-500"
                            }`}
                            style={{
                              width: `${Math.min(wc.utilization, 100)}%`,
                            }}
                          ></div>
                        </div>
                        <span className="text-sm text-white w-12 text-right">
                          {wc.utilization.toFixed(0)}%
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-white">
                        {wc.assignedPersonnel} / {wc.maxPersonnel}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => handleView(wc)}
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
          {filteredWorkCenters.map((wc, index) => (
            <motion.div
              key={wc.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.03 }}
              className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-6 hover:border-cyan-500/50 hover:shadow-lg hover:shadow-cyan-500/10 transition-all cursor-pointer"
              onClick={() => handleView(wc)}
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-white font-mono mb-1">
                    {wc.workCenterCode}
                  </h3>
                  <p className="text-sm text-[#9ca3af]">{wc.workCenterName}</p>
                </div>
                <span
                  className={`px-2 py-1 rounded text-xs font-medium ${
                    wc.status === "ACTIVE"
                      ? "bg-green-500/20 text-green-400"
                      : wc.status === "MAINTENANCE"
                        ? "bg-yellow-500/20 text-yellow-400"
                        : wc.status === "OVERLOADED"
                          ? "bg-red-500/20 text-red-400"
                          : "bg-gray-500/20 text-gray-400"
                  }`}
                >
                  {wc.status}
                </span>
              </div>
              <div className="space-y-2 mb-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-[#9ca3af]">Type:</span>
                  <span className="text-white">
                    {wc.type.replace(/_/g, " ")}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-[#9ca3af]">Location:</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      router.push(`/storage-locations?location=${wc.location}`);
                    }}
                    className="text-cyan-400 hover:text-cyan-300 transition-colors font-mono text-xs"
                  >
                    {wc.location}
                  </button>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-[#9ca3af]">Capacity:</span>
                  <span className="text-white font-medium">
                    {wc.currentLoad} / {wc.capacity}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-[#9ca3af]">Utilization:</span>
                  <span className="text-white font-medium">
                    {wc.utilization.toFixed(0)}%
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-[#9ca3af]">Personnel:</span>
                  <span className="text-white">
                    {wc.assignedPersonnel} / {wc.maxPersonnel}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-[#9ca3af]">Throughput:</span>
                  <span className="text-green-400 font-medium">
                    {wc.metrics.throughput.toFixed(0)}/hr
                  </span>
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
              Top Work Centers by Utilization
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
                <Bar dataKey="currentLoad" fill="#10b981" name="Current Load" />
              </BarChart>
            </ResponsiveContainer>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
          >
            <h3 className="text-lg font-semibold text-white mb-4">
              Performance Metrics
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <ComposedChart data={performanceData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="name" stroke="#9ca3af" fontSize={10} />
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
                  dataKey="onTimeRate"
                  fill="#10b981"
                  name="On-Time Rate %"
                />
                <Bar
                  yAxisId="left"
                  dataKey="accuracy"
                  fill="#06b6d4"
                  name="Accuracy %"
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="throughput"
                  stroke="#f59e0b"
                  strokeWidth={2}
                  name="Throughput /hr"
                />
              </ComposedChart>
            </ResponsiveContainer>
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
                  Total Work Centers
                </div>
                <div className="text-2xl font-bold text-white">
                  {realTimeStats.totalWorkCenters}
                </div>
              </div>
              <div className="bg-white/5 rounded-lg p-4">
                <div className="text-xs text-[#9ca3af] mb-1">Active</div>
                <div className="text-2xl font-bold text-green-400">
                  {realTimeStats.active}
                </div>
              </div>
              <div className="bg-white/5 rounded-lg p-4">
                <div className="text-xs text-[#9ca3af] mb-1">
                  Avg Utilization
                </div>
                <div className="text-2xl font-bold text-cyan-400">
                  {realTimeStats.averageUtilization.toFixed(1)}%
                </div>
              </div>
              <div className="bg-white/5 rounded-lg p-4">
                <div className="text-xs text-[#9ca3af] mb-1">
                  Total Throughput
                </div>
                <div className="text-2xl font-bold text-yellow-400">
                  {realTimeStats.totalThroughput.toFixed(0)}/hr
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
              {filteredWorkCenters
                .sort(
                  (a, b) =>
                    new Date(b.updatedAt).getTime() -
                    new Date(a.updatedAt).getTime(),
                )
                .slice(0, 10)
                .map((wc) => (
                  <div
                    key={wc.id}
                    className="flex items-center justify-between p-3 bg-white/5 rounded-lg"
                  >
                    <div className="flex-1">
                      <div className="text-sm font-medium text-white">
                        {wc.workCenterCode}
                      </div>
                      <div className="text-xs text-[#9ca3af]">
                        {wc.workCenterName} • {wc.location} •{" "}
                        {wc.type.replace(/_/g, " ")}
                      </div>
                    </div>
                    <div
                      className={`text-xs px-2 py-1 rounded ${
                        wc.status === "ACTIVE"
                          ? "bg-green-500/20 text-green-400"
                          : wc.status === "MAINTENANCE"
                            ? "bg-yellow-500/20 text-yellow-400"
                            : wc.status === "OVERLOADED"
                              ? "bg-red-500/20 text-red-400"
                              : "bg-gray-500/20 text-gray-400"
                      }`}
                    >
                      {wc.status}
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
          setSelectedWorkCenter(null);
        }}
        title={`Work Center Details - ${selectedWorkCenter?.workCenterCode || ""}`}
        size="lg"
      >
        {selectedWorkCenter && (
          <div className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-[#9ca3af] mb-1">
                  Work Center Code
                </div>
                <div className="text-white font-medium font-mono">
                  {selectedWorkCenter.workCenterCode}
                </div>
              </div>
              <div>
                <div className="text-sm text-[#9ca3af] mb-1">Status</div>
                <span
                  className={`px-2 py-1 rounded text-xs font-medium ${
                    selectedWorkCenter.status === "ACTIVE"
                      ? "bg-green-500/20 text-green-400"
                      : selectedWorkCenter.status === "MAINTENANCE"
                        ? "bg-yellow-500/20 text-yellow-400"
                        : selectedWorkCenter.status === "OVERLOADED"
                          ? "bg-red-500/20 text-red-400"
                          : "bg-gray-500/20 text-gray-400"
                  }`}
                >
                  {selectedWorkCenter.status}
                </span>
              </div>
              <div>
                <div className="text-sm text-[#9ca3af] mb-1">Name</div>
                <div className="text-white font-medium">
                  {selectedWorkCenter.workCenterName}
                </div>
              </div>
              <div>
                <div className="text-sm text-[#9ca3af] mb-1">Type</div>
                <div className="text-white">
                  {selectedWorkCenter.type.replace(/_/g, " ")}
                </div>
              </div>
              <div>
                <div className="text-sm text-[#9ca3af] mb-1">Location</div>
                <button
                  onClick={() =>
                    router.push(
                      `/storage-locations?location=${selectedWorkCenter.location}`,
                    )
                  }
                  className="text-cyan-400 hover:text-cyan-300 transition-colors font-mono"
                >
                  {selectedWorkCenter.location}
                </button>
              </div>
              <div>
                <div className="text-sm text-[#9ca3af] mb-1">Warehouse</div>
                <div className="text-white font-mono">
                  {selectedWorkCenter.warehouse}
                </div>
              </div>
              <div>
                <div className="text-sm text-[#9ca3af] mb-1">Capacity</div>
                <div className="text-white">
                  {selectedWorkCenter.currentLoad} /{" "}
                  {selectedWorkCenter.capacity}
                </div>
              </div>
              <div>
                <div className="text-sm text-[#9ca3af] mb-1">Utilization</div>
                <div className="text-white font-medium">
                  {selectedWorkCenter.utilization.toFixed(1)}%
                </div>
              </div>
              <div>
                <div className="text-sm text-[#9ca3af] mb-1">Personnel</div>
                <div className="text-white">
                  {selectedWorkCenter.assignedPersonnel} /{" "}
                  {selectedWorkCenter.maxPersonnel}
                </div>
              </div>
              <div>
                <div className="text-sm text-[#9ca3af] mb-1">Throughput</div>
                <div className="text-green-400 font-medium">
                  {selectedWorkCenter.metrics.throughput.toFixed(0)}/hr
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-white/10">
              <div className="text-sm text-[#9ca3af] mb-2">Capabilities</div>
              <div className="flex flex-wrap gap-2">
                {selectedWorkCenter.capabilities.map((cap) => (
                  <span
                    key={cap.id}
                    className={`px-2 py-1 rounded text-xs ${
                      cap.enabled
                        ? "bg-green-500/20 text-green-400 border border-green-500/30"
                        : "bg-gray-500/20 text-gray-400 border border-gray-500/30"
                    }`}
                  >
                    {cap.name} {cap.enabled ? "✓" : "✗"}
                  </span>
                ))}
              </div>
            </div>

            <div className="pt-4 border-t border-white/10">
              <div className="text-sm text-[#9ca3af] mb-2">
                Performance Metrics
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                <div className="bg-white/5 rounded-lg p-3">
                  <div className="text-xs text-[#9ca3af] mb-1">
                    On-Time Rate
                  </div>
                  <div className="text-lg font-bold text-green-400">
                    {selectedWorkCenter.metrics.onTimeDeliveryRate.toFixed(1)}%
                  </div>
                </div>
                <div className="bg-white/5 rounded-lg p-3">
                  <div className="text-xs text-[#9ca3af] mb-1">Accuracy</div>
                  <div className="text-lg font-bold text-cyan-400">
                    {selectedWorkCenter.metrics.inventoryAccuracy.toFixed(1)}%
                  </div>
                </div>
                <div className="bg-white/5 rounded-lg p-3">
                  <div className="text-xs text-[#9ca3af] mb-1">
                    Space Efficiency
                  </div>
                  <div className="text-lg font-bold text-yellow-400">
                    {selectedWorkCenter.metrics.spaceEfficiency.toFixed(1)}%
                  </div>
                </div>
                <div className="bg-white/5 rounded-lg p-3">
                  <div className="text-xs text-[#9ca3af] mb-1">
                    Orders Today
                  </div>
                  <div className="text-lg font-bold text-white">
                    {selectedWorkCenter.metrics.ordersToday}
                  </div>
                </div>
                <div className="bg-white/5 rounded-lg p-3">
                  <div className="text-xs text-[#9ca3af] mb-1">
                    Avg Fulfillment
                  </div>
                  <div className="text-lg font-bold text-white">
                    {selectedWorkCenter.metrics.averageOrderFulfillmentTime.toFixed(
                      1,
                    )}
                    h
                  </div>
                </div>
                <div className="bg-white/5 rounded-lg p-3">
                  <div className="text-xs text-[#9ca3af] mb-1">Cost/Order</div>
                  <div className="text-lg font-bold text-white">
                    AED {selectedWorkCenter.metrics.costPerOrder.toFixed(2)}
                  </div>
                </div>
              </div>
            </div>

            {selectedWorkCenter.resources.length > 0 && (
              <div className="pt-4 border-t border-white/10">
                <div className="text-sm text-[#9ca3af] mb-2">
                  Resources ({selectedWorkCenter.resources.length})
                </div>
                <div className="space-y-1 max-h-40 overflow-y-auto">
                  {selectedWorkCenter.resources.slice(0, 5).map((res) => (
                    <div
                      key={res.id}
                      className="flex items-center justify-between text-xs bg-white/5 p-2 rounded"
                    >
                      <span className="text-white">
                        {res.name} ({res.type})
                      </span>
                      <span
                        className={`${
                          res.status === "AVAILABLE"
                            ? "text-green-400"
                            : res.status === "IN_USE"
                              ? "text-cyan-400"
                              : "text-yellow-400"
                        }`}
                      >
                        {res.status}
                      </span>
                    </div>
                  ))}
                  {selectedWorkCenter.resources.length > 5 && (
                    <div className="text-xs text-[#9ca3af] text-center pt-1">
                      +{selectedWorkCenter.resources.length - 5} more resources
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </PageTemplate>
  );
}
