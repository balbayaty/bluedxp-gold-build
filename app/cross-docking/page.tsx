"use client";

import { useState, useMemo, useEffect } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import PageTemplate from "@/components/PageTemplate";
import Tooltip from "@/components/Tooltip";
import Modal from "@/components/Modal";
import ModuleLinks from "@/components/ModuleLinks";
import {
  generatePurchaseOrders,
  generateSalesOrders,
} from "@/utils/mockDataGenerators";
import { getSalesOrderLinks } from "@/utils/moduleInterconnectivity";
import { format, differenceInMinutes } from "date-fns";
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

interface CrossDock {
  id: string;
  crossDockNumber: string;
  inboundASN: string;
  outboundOrder: string;
  materialNumber: string;
  materialDescription: string;
  quantity: number;
  unit: string;
  inboundLocation: string;
  outboundLocation: string;
  status: "PLANNED" | "IN_TRANSIT" | "AT_DOCK" | "COMPLETED" | "CANCELLED";
  arrivalTime?: Date | string;
  departureTime?: Date | string;
  duration?: number;
}

export default function CrossDocking() {
  const router = useRouter();
  const [purchaseOrders, setPurchaseOrders] = useState(() =>
    generatePurchaseOrders(30),
  );
  const [salesOrders] = useState(() => generateSalesOrders(30));
  const [crossDocks, setCrossDocks] = useState<CrossDock[]>(() => {
    return Array.from({ length: 25 }, (_, i) => {
      const so = salesOrders[Math.floor(Math.random() * salesOrders.length)];
      const arrivalTime =
        Math.random() > 0.3
          ? new Date(Date.now() - Math.random() * 86400000)
          : undefined;
      const departureTime =
        arrivalTime && Math.random() > 0.5
          ? new Date(arrivalTime.getTime() + Math.random() * 3600000)
          : undefined;
      const duration =
        arrivalTime && departureTime
          ? differenceInMinutes(departureTime, arrivalTime)
          : undefined;

      return {
        id: `CD-${Date.now()}-${i}`,
        crossDockNumber: `CD-${new Date().getFullYear()}-${String(i + 1).padStart(6, "0")}`,
        inboundASN: `ASN-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 30) + 1).padStart(4, "0")}`,
        outboundOrder: so.soNumber,
        materialNumber: `MAT-${String(Math.floor(Math.random() * 50) + 1).padStart(6, "0")}`,
        materialDescription: `Material ${Math.floor(Math.random() * 12) + 1}`,
        quantity: Math.random() * 100,
        unit: "EA",
        inboundLocation: "RECEIVING",
        outboundLocation: "DISPATCHING",
        status:
          i < 5
            ? ("PLANNED" as const)
            : i < 10
              ? ("IN_TRANSIT" as const)
              : i < 15
                ? ("AT_DOCK" as const)
                : i < 22
                  ? ("COMPLETED" as const)
                  : ("CANCELLED" as const),
        arrivalTime,
        departureTime,
        duration,
      };
    });
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<CrossDock | null>(null);
  const [formData, setFormData] = useState<Partial<CrossDock>>({});
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");
  const [viewMode, setViewMode] = useState<
    "table" | "grid" | "analytics" | "realtime" | "scheduling" | "matching"
  >("table");
  const [realTimeEnabled, setRealTimeEnabled] = useState(true);
  const [realTimeStats, setRealTimeStats] = useState({
    totalCrossDocks: 0,
    atDock: 0,
    throughput: 0,
    averageDwellTime: 0,
  });

  const filteredCrossDocks = useMemo(() => {
    return crossDocks.filter((cd) => {
      const matchesSearch =
        cd.crossDockNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        cd.inboundASN.toLowerCase().includes(searchQuery.toLowerCase()) ||
        cd.outboundOrder.toLowerCase().includes(searchQuery.toLowerCase()) ||
        cd.materialNumber.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus =
        selectedStatus === "ALL" || cd.status === selectedStatus;
      return matchesSearch && matchesStatus;
    });
  }, [crossDocks, searchQuery, selectedStatus]);

  // Dock utilization analytics
  const dockUtilization = useMemo(() => {
    const atDock = crossDocks.filter((cd) => cd.status === "AT_DOCK").length;
    const maxCapacity = 10; // Assume max dock capacity
    return {
      current: atDock,
      max: maxCapacity,
      utilization: (atDock / maxCapacity) * 100,
    };
  }, [crossDocks]);

  // Throughput analytics
  const throughputData = useMemo(() => {
    const completed = crossDocks.filter((cd) => cd.status === "COMPLETED");
    const totalQuantity = completed.reduce((sum, cd) => sum + cd.quantity, 0);
    const totalDuration = completed
      .filter((cd) => cd.duration)
      .reduce((sum, cd) => sum + (cd.duration || 0), 0);
    const avgDuration =
      completed.filter((cd) => cd.duration).length > 0
        ? totalDuration / completed.filter((cd) => cd.duration).length
        : 0;

    return {
      totalCompleted: completed.length,
      totalQuantity,
      averageDwellTime: avgDuration,
      throughput: avgDuration > 0 ? (totalQuantity / avgDuration) * 60 : 0, // units per hour
    };
  }, [crossDocks]);

  // Material flow analytics
  const materialFlow = useMemo(() => {
    const flowMap = new Map<string, { count: number; totalQuantity: number }>();

    crossDocks.forEach((cd) => {
      const key = `${cd.inboundLocation} → ${cd.outboundLocation}`;
      if (!flowMap.has(key)) {
        flowMap.set(key, { count: 0, totalQuantity: 0 });
      }
      const flow = flowMap.get(key)!;
      flow.count++;
      flow.totalQuantity += cd.quantity;
    });

    return Array.from(flowMap.entries())
      .map(([route, data]) => ({
        route,
        count: data.count,
        totalQuantity: data.totalQuantity,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }, [crossDocks]);

  // Daily trend
  const dailyTrend = useMemo(() => {
    const dailyData: Record<
      string,
      { date: string; planned: number; completed: number }
    > = {};

    crossDocks.forEach((cd) => {
      const date = cd.arrivalTime
        ? format(new Date(cd.arrivalTime), "yyyy-MM-dd")
        : format(new Date(), "yyyy-MM-dd");
      if (!dailyData[date]) {
        dailyData[date] = { date, planned: 0, completed: 0 };
      }
      if (cd.status === "PLANNED" || cd.status === "IN_TRANSIT") {
        dailyData[date].planned++;
      }
      if (cd.status === "COMPLETED") {
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
  }, [crossDocks]);

  // Status distribution
  const statusDistribution = useMemo(() => {
    const counts: Record<string, number> = {};
    crossDocks.forEach((cd) => {
      counts[cd.status] = (counts[cd.status] || 0) + 1;
    });
    return Object.entries(counts).map(([status, count]) => ({ status, count }));
  }, [crossDocks]);

  // Aggregate stats
  const aggregateStats = useMemo(() => {
    const total = crossDocks.length;
    const atDock = crossDocks.filter((cd) => cd.status === "AT_DOCK").length;
    const inTransit = crossDocks.filter(
      (cd) => cd.status === "IN_TRANSIT",
    ).length;
    const completed = crossDocks.filter(
      (cd) => cd.status === "COMPLETED",
    ).length;
    const avgDwellTime =
      crossDocks
        .filter((cd) => cd.duration)
        .reduce((sum, cd) => sum + (cd.duration || 0), 0) /
      Math.max(1, crossDocks.filter((cd) => cd.duration).length);

    return {
      total,
      atDock,
      inTransit,
      completed,
      throughput: throughputData.throughput,
      averageDwellTime: avgDwellTime,
    };
  }, [crossDocks, throughputData.throughput]);

  // Real-time updates
  useEffect(() => {
    if (!realTimeEnabled) return;

    const unsubscribe = realtimeSimulator.subscribe(
      "cross-dock-stats",
      (data: typeof realTimeStats) => {
        setRealTimeStats(data);
      },
    );

    const stop = realtimeSimulator.start(
      "cross-dock-stats",
      () => ({
        totalCrossDocks: simulateKPIUpdates(aggregateStats.total, 0.05),
        atDock: simulateKPIUpdates(aggregateStats.atDock, 0.1),
        throughput: simulateKPIUpdates(aggregateStats.throughput, 0.05),
        averageDwellTime: simulateKPIUpdates(
          aggregateStats.averageDwellTime,
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
    aggregateStats.atDock,
    aggregateStats.throughput,
    aggregateStats.averageDwellTime,
  ]);

  // Simulate real-time status changes
  useEffect(() => {
    if (!realTimeEnabled) return;

    const interval = setInterval(() => {
      setCrossDocks((prev) =>
        prev.map((cd) => {
          if (cd.status === "PLANNED" && Math.random() < 0.03) {
            return { ...cd, status: "IN_TRANSIT" as const };
          }
          if (cd.status === "IN_TRANSIT" && Math.random() < 0.02) {
            return {
              ...cd,
              status: "AT_DOCK" as const,
              arrivalTime: new Date(),
            };
          }
          if (cd.status === "AT_DOCK" && Math.random() < 0.02) {
            const departureTime = new Date();
            const duration = cd.arrivalTime
              ? differenceInMinutes(departureTime, new Date(cd.arrivalTime))
              : undefined;
            return {
              ...cd,
              status: "COMPLETED" as const,
              departureTime,
              duration,
            };
          }
          return cd;
        }),
      );
    }, 10000);

    return () => clearInterval(interval);
  }, [realTimeEnabled]);

  const stats = [
    {
      label: "Total Cross-Docks",
      value: realTimeEnabled
        ? realTimeStats.totalCrossDocks
        : aggregateStats.total,
      icon: "ri-swap-box-line",
      tooltip: "Total cross-docking operations",
      trend: "up" as const,
    },
    {
      label: "At Dock",
      value: realTimeEnabled ? realTimeStats.atDock : aggregateStats.atDock,
      icon: "ri-warehouse-line",
      tooltip: "Materials currently at cross-dock",
      trend: "neutral" as const,
    },
    {
      label: "Throughput",
      value: `${(realTimeEnabled ? realTimeStats.throughput : aggregateStats.throughput).toFixed(1)}/hr`,
      icon: "ri-speed-line",
      tooltip: "Units processed per hour",
      trend: "up" as const,
    },
    {
      label: "Avg Dwell Time",
      value: `${(realTimeEnabled ? realTimeStats.averageDwellTime : aggregateStats.averageDwellTime).toFixed(0)}m`,
      icon: "ri-time-line",
      tooltip: "Average time at dock",
      trend: "down" as const,
    },
  ];

  const handleCreate = () => {
    setFormData({});
    setShowCreateModal(true);
  };

  const handleEdit = (item: any) => {
    setSelectedItem(item);
    setFormData(item);
    setShowEditModal(true);
  };

  const handleView = (item: any) => {
    setSelectedItem(item);
    setShowViewModal(true);
  };

  const handleDelete = (item: any) => {
    setSelectedItem(item);
    setShowDeleteDialog(true);
  };

  const confirmDelete = () => {
    if (selectedItem) {
      // Note: This page uses read-only data, so deletion is not implemented
      setSelectedItem(null);
      setShowDeleteDialog(false);
    }
  };

  const handleSave = () => {
    if (showCreateModal) {
      // Create new cross dock
      const newItem: CrossDock = {
        id: `CD-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
        crossDockNumber: `CD-${new Date().getFullYear()}-${String(crossDocks.length + 1).padStart(6, "0")}`,
        inboundASN:
          (formData as any).inboundASN ||
          `ASN-${new Date().getFullYear()}-0001`,
        outboundOrder:
          (formData as any).outboundOrder ||
          salesOrders[0]?.soNumber ||
          "SO-000001",
        materialNumber: (formData as any).materialNumber || "MAT-000001",
        materialDescription:
          (formData as any).materialDescription || "New Material",
        quantity: (formData as any).quantity || 0,
        unit: (formData as any).unit || "EA",
        inboundLocation: (formData as any).inboundLocation || "RECEIVING",
        outboundLocation: (formData as any).outboundLocation || "DISPATCHING",
        status: (formData as any).status || "PLANNED",
        arrivalTime: (formData as any).arrivalTime,
        departureTime: (formData as any).departureTime,
        duration: (formData as any).duration,
      };
      setCrossDocks((prev) => [...prev, newItem]);
      setShowCreateModal(false);
      setFormData({});
    } else if (
      showEditModal &&
      selectedItem &&
      "crossDockNumber" in selectedItem
    ) {
      // Update cross dock
      setCrossDocks((prev) =>
        prev.map((item) =>
          item.id === selectedItem.id
            ? ({ ...item, ...formData } as CrossDock)
            : item,
        ),
      );
      setShowEditModal(false);
      setSelectedItem(null);
      setFormData({});
    }
  };
  return (
    <PageTemplate
      title="Cross-Docking"
      description="Direct transfer operations - Transfer materials directly from receiving to shipping without storage, optimizing throughput and reducing handling"
      icon="ri-swap-box-line"
      systemInfo={{
        sap: "Cross-Docking, Direct Transfer, Flow-Through",
        oracle: "Cross-Dock, Direct Transfer, Flow-Through",
        manhattan: "Cross-Dock Management, Direct Transfer, Flow-Through",
      }}
      examples={[
        "Transfer materials directly from receiving to shipping",
        "Optimize throughput without storage",
        "Reduce handling and storage costs",
        "Track cross-dock operations",
        "Manage dock capacity",
        "Handle time-sensitive materials",
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
            placeholder="Search by Cross-Dock Number, ASN, Order, Material..."
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
          <option value="IN_TRANSIT">In Transit</option>
          <option value="AT_DOCK">At Dock</option>
          <option value="COMPLETED">Completed</option>
          <option value="CANCELLED">Cancelled</option>
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
                    Cross-Dock Number
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-[#9ca3af] uppercase tracking-wider">
                    Inbound ASN
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-[#9ca3af] uppercase tracking-wider">
                    Outbound Order
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-[#9ca3af] uppercase tracking-wider">
                    Material
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-[#9ca3af] uppercase tracking-wider">
                    Quantity
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-[#9ca3af] uppercase tracking-wider">
                    From → To
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
                {filteredCrossDocks.map((cd, index) => (
                  <motion.tr
                    key={cd.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.02 }}
                    className="hover:bg-white/5 transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Tooltip
                        content={`Cross-Dock Number: ${cd.crossDockNumber}`}
                        systemInfo={{
                          sap: "Cross-Dock",
                          oracle: "Cross-Dock Number",
                        }}
                        position="right"
                      >
                        <span className="text-sm font-medium text-white font-mono cursor-help">
                          {cd.crossDockNumber}
                        </span>
                      </Tooltip>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() =>
                          router.push(`/inbound?asn=${cd.inboundASN}`)
                        }
                        className="text-sm text-cyan-400 hover:text-cyan-300 transition-colors font-mono"
                      >
                        {cd.inboundASN}
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() =>
                          router.push(`/sales-orders?so=${cd.outboundOrder}`)
                        }
                        className="text-sm text-cyan-400 hover:text-cyan-300 transition-colors font-mono"
                      >
                        {cd.outboundOrder}
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <button
                          onClick={() =>
                            router.push(
                              `/inventory?material=${cd.materialNumber}`,
                            )
                          }
                          className="text-sm font-medium text-cyan-400 hover:text-cyan-300 transition-colors font-mono"
                        >
                          {cd.materialNumber}
                        </button>
                        <div className="text-xs text-[#9ca3af]">
                          {cd.materialDescription}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-white font-medium">
                        {cd.quantity.toFixed(2)}
                      </div>
                      <div className="text-xs text-[#9ca3af]">{cd.unit}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Tooltip
                        content={`From: ${cd.inboundLocation} → To: ${cd.outboundLocation}`}
                        systemInfo={{
                          sap: "Cross-Dock Flow",
                          oracle: "Transfer Flow",
                        }}
                        position="right"
                      >
                        <div className="flex items-center gap-2 cursor-help">
                          <span className="text-sm text-white font-mono">
                            {cd.inboundLocation}
                          </span>
                          <i className="ri-arrow-right-line text-cyan-400"></i>
                          <span className="text-sm text-white font-mono">
                            {cd.outboundLocation}
                          </span>
                        </div>
                      </Tooltip>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${
                          cd.status === "COMPLETED"
                            ? "bg-green-500/20 text-green-400 border border-green-500/30"
                            : cd.status === "AT_DOCK"
                              ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                              : cd.status === "IN_TRANSIT"
                                ? "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30"
                                : cd.status === "PLANNED"
                                  ? "bg-gray-500/20 text-gray-400 border border-gray-500/30"
                                  : "bg-red-500/20 text-red-400 border border-red-500/30"
                        }`}
                      >
                        {cd.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <Tooltip
                          content="View Cross-Dock Details"
                          position="top"
                        >
                          <button
                            onClick={() => handleView(cd)}
                            className="p-2 bg-cyan-600/20 text-cyan-400 border border-cyan-500/30 rounded hover:bg-cyan-600/30 transition-colors"
                          >
                            <i className="ri-eye-line"></i>
                          </button>
                        </Tooltip>
                        {cd.status === "AT_DOCK" && (
                          <Tooltip content="Complete Cross-Dock" position="top">
                            <button className="p-2 bg-green-600/20 text-green-400 border border-green-500/30 rounded hover:bg-green-600/30 transition-colors">
                              <i className="ri-check-line"></i>
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

      {/* Grid View */}
      {viewMode === "grid" && (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCrossDocks.map((cd, index) => (
            <motion.div
              key={cd.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.03 }}
              className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-6 hover:border-cyan-500/50 hover:shadow-lg hover:shadow-cyan-500/10 transition-all cursor-pointer"
              onClick={() => handleView(cd)}
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-white font-mono mb-1">
                    {cd.crossDockNumber}
                  </h3>
                  <p className="text-sm text-[#9ca3af]">{cd.materialNumber}</p>
                </div>
                <span
                  className={`px-2 py-1 rounded text-xs font-medium ${
                    cd.status === "COMPLETED"
                      ? "bg-green-500/20 text-green-400"
                      : cd.status === "AT_DOCK"
                        ? "bg-blue-500/20 text-blue-400"
                        : cd.status === "IN_TRANSIT"
                          ? "bg-yellow-500/20 text-yellow-400"
                          : "bg-gray-500/20 text-gray-400"
                  }`}
                >
                  {cd.status.replace(/_/g, " ")}
                </span>
              </div>
              <div className="space-y-2 mb-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-[#9ca3af]">Inbound:</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      router.push(`/inbound?asn=${cd.inboundASN}`);
                    }}
                    className="text-cyan-400 hover:text-cyan-300 transition-colors font-mono text-xs"
                  >
                    {cd.inboundASN}
                  </button>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-[#9ca3af]">Outbound:</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      router.push(`/sales-orders?so=${cd.outboundOrder}`);
                    }}
                    className="text-cyan-400 hover:text-cyan-300 transition-colors font-mono text-xs"
                  >
                    {cd.outboundOrder}
                  </button>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-[#9ca3af]">Quantity:</span>
                  <span className="text-white font-medium">
                    {cd.quantity.toFixed(2)} {cd.unit}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-[#9ca3af]">Route:</span>
                  <span className="text-white text-xs font-mono">
                    {cd.inboundLocation} → {cd.outboundLocation}
                  </span>
                </div>
                {cd.duration && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-[#9ca3af]">Dwell Time:</span>
                    <span className="text-yellow-400">{cd.duration}m</span>
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
          {/* Status Distribution */}
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
                      fill={
                        ["#06b6d4", "#3b82f6", "#10b981", "#f59e0b", "#ef4444"][
                          index % 5
                        ]
                      }
                    />
                  ))}
                </Pie>
                <RechartsTooltip />
              </PieChart>
            </ResponsiveContainer>
          </motion.div>

          {/* Material Flow */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
          >
            <h3 className="text-lg font-semibold text-white mb-4">
              Top Material Flow Routes
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={materialFlow}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis
                  dataKey="route"
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
                <Bar dataKey="count" fill="#06b6d4" name="Operations" />
                <Bar
                  dataKey="totalQuantity"
                  fill="#10b981"
                  name="Total Quantity"
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
              Daily Cross-Dock Trend
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

          {/* Dock Utilization */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
          >
            <h3 className="text-lg font-semibold text-white mb-4">
              Dock Utilization
            </h3>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="bg-white/5 rounded-lg p-4">
                <div className="text-xs text-[#9ca3af] mb-1">Current Usage</div>
                <div className="text-2xl font-bold text-white">
                  {dockUtilization.current}
                </div>
                <div className="text-xs text-[#9ca3af] mt-1">
                  of {dockUtilization.max} docks
                </div>
              </div>
              <div className="bg-white/5 rounded-lg p-4">
                <div className="text-xs text-[#9ca3af] mb-1">Utilization</div>
                <div className="text-2xl font-bold text-cyan-400">
                  {dockUtilization.utilization.toFixed(1)}%
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2 mt-2">
                  <div
                    className={`h-2 rounded-full ${
                      dockUtilization.utilization > 80
                        ? "bg-red-500"
                        : dockUtilization.utilization > 60
                          ? "bg-yellow-500"
                          : "bg-green-500"
                    }`}
                    style={{
                      width: `${Math.min(dockUtilization.utilization, 100)}%`,
                    }}
                  ></div>
                </div>
              </div>
              <div className="bg-white/5 rounded-lg p-4">
                <div className="text-xs text-[#9ca3af] mb-1">Throughput</div>
                <div className="text-2xl font-bold text-green-400">
                  {throughputData.throughput.toFixed(1)}
                </div>
                <div className="text-xs text-[#9ca3af] mt-1">units/hour</div>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Dock Scheduling View */}
      {viewMode === "scheduling" && (
        <div className="space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
          >
            <h3 className="text-lg font-semibold text-white mb-4">
              Dock Schedule & Capacity
            </h3>
            <div className="grid md:grid-cols-2 gap-6 mb-6">
              <div className="p-4 bg-white/5 rounded-lg">
                <div className="text-xs text-[#9ca3af] mb-1">Total Docks</div>
                <div className="text-3xl font-bold text-white">
                  {dockUtilization.max}
                </div>
              </div>
              <div className="p-4 bg-white/5 rounded-lg">
                <div className="text-xs text-[#9ca3af] mb-1">
                  Available Docks
                </div>
                <div className="text-3xl font-bold text-green-400">
                  {dockUtilization.max - dockUtilization.current}
                </div>
              </div>
            </div>
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-white mb-3">
                Scheduled Cross-Docks
              </h4>
              {crossDocks
                .filter(
                  (cd) =>
                    cd.status === "PLANNED" ||
                    cd.status === "IN_TRANSIT" ||
                    cd.status === "AT_DOCK",
                )
                .sort((a, b) => {
                  const dateA = a.arrivalTime
                    ? new Date(a.arrivalTime).getTime()
                    : 0;
                  const dateB = b.arrivalTime
                    ? new Date(b.arrivalTime).getTime()
                    : 0;
                  return dateA - dateB;
                })
                .map((cd, idx) => (
                  <div
                    key={cd.id}
                    className="p-4 bg-white/5 rounded-lg border border-white/10"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="text-sm font-medium text-white mb-1">
                          {cd.crossDockNumber}
                        </div>
                        <div className="text-xs text-[#9ca3af]">
                          {cd.materialNumber} • {cd.quantity.toFixed(0)}{" "}
                          {cd.unit}
                        </div>
                        <div className="text-xs text-[#9ca3af] mt-1">
                          {cd.inboundLocation} → {cd.outboundLocation}
                        </div>
                      </div>
                      <div className="text-right">
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium ${
                            cd.status === "AT_DOCK"
                              ? "bg-cyan-500/20 text-cyan-400"
                              : cd.status === "IN_TRANSIT"
                                ? "bg-yellow-500/20 text-yellow-400"
                                : "bg-gray-500/20 text-gray-400"
                          }`}
                        >
                          {cd.status.replace(/_/g, " ")}
                        </span>
                        {cd.arrivalTime && (
                          <div className="text-xs text-[#9ca3af] mt-1">
                            {format(new Date(cd.arrivalTime), "HH:mm")}
                          </div>
                        )}
                      </div>
                    </div>
                    {cd.duration && (
                      <div className="text-xs text-cyan-400">
                        Dwell Time: {cd.duration} minutes
                      </div>
                    )}
                  </div>
                ))}
            </div>
          </motion.div>
        </div>
      )}

      {/* Inbound/Outbound Matching View */}
      {viewMode === "matching" && (
        <div className="space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
          >
            <h3 className="text-lg font-semibold text-white mb-4">
              Inbound/Outbound Matching
            </h3>
            <div className="space-y-3">
              {crossDocks.map((cd, idx) => (
                <div
                  key={cd.id}
                  className="p-4 bg-white/5 rounded-lg border border-white/10"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex-1">
                      <div className="text-sm font-medium text-white mb-1">
                        {cd.crossDockNumber}
                      </div>
                      <div className="text-xs text-[#9ca3af]">
                        {cd.materialDescription}
                      </div>
                    </div>
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium ${
                        cd.status === "COMPLETED"
                          ? "bg-green-500/20 text-green-400"
                          : cd.status === "AT_DOCK"
                            ? "bg-cyan-500/20 text-cyan-400"
                            : "bg-gray-500/20 text-gray-400"
                      }`}
                    >
                      {cd.status.replace(/_/g, " ")}
                    </span>
                  </div>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                      <div className="text-xs text-blue-400 mb-1">Inbound</div>
                      <div className="text-sm font-medium text-white">
                        {cd.inboundASN}
                      </div>
                      <div className="text-xs text-[#9ca3af] mt-1">
                        {cd.inboundLocation}
                      </div>
                    </div>
                    <div className="p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
                      <div className="text-xs text-green-400 mb-1">
                        Outbound
                      </div>
                      <div className="text-sm font-medium text-white">
                        <button
                          onClick={() =>
                            router.push(`/sales-orders?so=${cd.outboundOrder}`)
                          }
                          className="text-cyan-400 hover:text-cyan-300 transition-colors"
                        >
                          {cd.outboundOrder}
                        </button>
                      </div>
                      <div className="text-xs text-[#9ca3af] mt-1">
                        {cd.outboundLocation}
                      </div>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center justify-between text-xs">
                    <span className="text-[#9ca3af]">Quantity:</span>
                    <span className="text-white font-medium">
                      {cd.quantity.toFixed(0)} {cd.unit}
                    </span>
                  </div>
                </div>
              ))}
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
                  Total Cross-Docks
                </div>
                <div className="text-2xl font-bold text-white">
                  {realTimeStats.totalCrossDocks}
                </div>
              </div>
              <div className="bg-white/5 rounded-lg p-4">
                <div className="text-xs text-[#9ca3af] mb-1">At Dock</div>
                <div className="text-2xl font-bold text-cyan-400">
                  {realTimeStats.atDock}
                </div>
              </div>
              <div className="bg-white/5 rounded-lg p-4">
                <div className="text-xs text-[#9ca3af] mb-1">Throughput</div>
                <div className="text-2xl font-bold text-green-400">
                  {realTimeStats.throughput.toFixed(1)}/hr
                </div>
              </div>
              <div className="bg-white/5 rounded-lg p-4">
                <div className="text-xs text-[#9ca3af] mb-1">
                  Avg Dwell Time
                </div>
                <div className="text-2xl font-bold text-yellow-400">
                  {realTimeStats.averageDwellTime.toFixed(0)}m
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
              {filteredCrossDocks
                .sort((a, b) => {
                  const timeA = a.arrivalTime
                    ? new Date(a.arrivalTime).getTime()
                    : 0;
                  const timeB = b.arrivalTime
                    ? new Date(b.arrivalTime).getTime()
                    : 0;
                  return timeB - timeA;
                })
                .slice(0, 10)
                .map((cd) => (
                  <div
                    key={cd.id}
                    className="flex items-center justify-between p-3 bg-white/5 rounded-lg"
                  >
                    <div className="flex-1">
                      <div className="text-sm font-medium text-white">
                        {cd.crossDockNumber}
                      </div>
                      <div className="text-xs text-[#9ca3af]">
                        {cd.materialNumber} • {cd.inboundLocation} →{" "}
                        {cd.outboundLocation}
                        {cd.arrivalTime &&
                          ` • ${format(new Date(cd.arrivalTime), "MMM dd, HH:mm")}`}
                      </div>
                    </div>
                    <div
                      className={`text-xs px-2 py-1 rounded ${
                        cd.status === "COMPLETED"
                          ? "bg-green-500/20 text-green-400"
                          : cd.status === "AT_DOCK"
                            ? "bg-cyan-500/20 text-cyan-400"
                            : cd.status === "IN_TRANSIT"
                              ? "bg-yellow-500/20 text-yellow-400"
                              : "bg-gray-500/20 text-gray-400"
                      }`}
                    >
                      {cd.status.replace(/_/g, " ")}
                    </div>
                  </div>
                ))}
            </div>
          </motion.div>
        </div>
      )}

      {/* Create/Edit Modal */}
      <Modal
        isOpen={showCreateModal || showEditModal}
        onClose={() => {
          setShowCreateModal(false);
          setShowEditModal(false);
          setFormData({});
          setSelectedItem(null);
        }}
        title={showCreateModal ? "Create New Item" : "Edit Item"}
        size="lg"
      >
        <div className="space-y-4">
          <p className="text-[#9ca3af]">
            Form fields will be customized per page type.
          </p>
          <div className="flex items-center gap-3 justify-end pt-4 border-t border-white/10">
            <button
              onClick={() => {
                setShowCreateModal(false);
                setShowEditModal(false);
                setFormData({});
                setSelectedItem(null);
              }}
              className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white rounded-lg transition-colors"
            >
              {showCreateModal ? "Create" : "Save Changes"}
            </button>
          </div>
        </div>
      </Modal>

      {/* View Modal */}
      <Modal
        isOpen={showViewModal}
        onClose={() => {
          setShowViewModal(false);
          setSelectedItem(null);
        }}
        title={`Cross-Dock Details - ${selectedItem?.crossDockNumber || ""}`}
        size="lg"
      >
        {selectedItem && (
          <div className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-[#9ca3af] mb-1">
                  Cross-Dock Number
                </div>
                <div className="text-white font-medium font-mono">
                  {selectedItem.crossDockNumber}
                </div>
              </div>
              <div>
                <div className="text-sm text-[#9ca3af] mb-1">Status</div>
                <span
                  className={`px-2 py-1 rounded text-xs font-medium ${
                    selectedItem.status === "COMPLETED"
                      ? "bg-green-500/20 text-green-400"
                      : selectedItem.status === "AT_DOCK"
                        ? "bg-blue-500/20 text-blue-400"
                        : selectedItem.status === "IN_TRANSIT"
                          ? "bg-yellow-500/20 text-yellow-400"
                          : "bg-gray-500/20 text-gray-400"
                  }`}
                >
                  {selectedItem.status.replace(/_/g, " ")}
                </span>
              </div>
              <div>
                <div className="text-sm text-[#9ca3af] mb-1">Inbound ASN</div>
                <button
                  onClick={() =>
                    router.push(`/inbound?asn=${selectedItem.inboundASN}`)
                  }
                  className="text-cyan-400 hover:text-cyan-300 transition-colors font-mono"
                >
                  {selectedItem.inboundASN}
                </button>
              </div>
              <div>
                <div className="text-sm text-[#9ca3af] mb-1">
                  Outbound Order
                </div>
                <button
                  onClick={() =>
                    router.push(
                      `/sales-orders?so=${selectedItem.outboundOrder}`,
                    )
                  }
                  className="text-cyan-400 hover:text-cyan-300 transition-colors font-mono"
                >
                  {selectedItem.outboundOrder}
                </button>
              </div>
              <div>
                <div className="text-sm text-[#9ca3af] mb-1">Material</div>
                <button
                  onClick={() =>
                    router.push(
                      `/inventory?material=${selectedItem.materialNumber}`,
                    )
                  }
                  className="text-cyan-400 hover:text-cyan-300 transition-colors font-mono"
                >
                  {selectedItem.materialNumber}
                </button>
                <div className="text-xs text-[#9ca3af] mt-1">
                  {selectedItem.materialDescription}
                </div>
              </div>
              <div>
                <div className="text-sm text-[#9ca3af] mb-1">Quantity</div>
                <div className="text-white font-medium">
                  {selectedItem.quantity.toFixed(2)} {selectedItem.unit}
                </div>
              </div>
              <div>
                <div className="text-sm text-[#9ca3af] mb-1">Route</div>
                <div className="text-white font-mono">
                  {selectedItem.inboundLocation} →{" "}
                  {selectedItem.outboundLocation}
                </div>
              </div>
              {selectedItem.arrivalTime && (
                <div>
                  <div className="text-sm text-[#9ca3af] mb-1">
                    Arrival Time
                  </div>
                  <div className="text-white">
                    {format(
                      new Date(selectedItem.arrivalTime),
                      "MMM dd, yyyy HH:mm",
                    )}
                  </div>
                </div>
              )}
              {selectedItem.departureTime && (
                <div>
                  <div className="text-sm text-[#9ca3af] mb-1">
                    Departure Time
                  </div>
                  <div className="text-white">
                    {format(
                      new Date(selectedItem.departureTime),
                      "MMM dd, yyyy HH:mm",
                    )}
                  </div>
                </div>
              )}
              {selectedItem.duration && (
                <div>
                  <div className="text-sm text-[#9ca3af] mb-1">Dwell Time</div>
                  <div className="text-yellow-400 font-medium">
                    {selectedItem.duration} minutes
                  </div>
                </div>
              )}
            </div>
            <div className="pt-4 border-t border-white/10">
              <ModuleLinks
                links={getSalesOrderLinks(selectedItem.outboundOrder)}
              />
            </div>
          </div>
        )}
      </Modal>

      {/* Delete Confirmation */}
      <Modal
        isOpen={showDeleteDialog}
        onClose={() => {
          setShowDeleteDialog(false);
          setSelectedItem(null);
        }}
        title="Delete Item"
      >
        <div className="space-y-4">
          <p className="text-white">
            Are you sure you want to delete this item? This action cannot be
            undone.
          </p>
          <div className="flex items-center gap-3">
            <button
              onClick={confirmDelete}
              className="flex-1 bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg text-sm font-medium transition-colors"
            >
              Delete
            </button>
            <button
              onClick={() => {
                setShowDeleteDialog(false);
                setSelectedItem(null);
              }}
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
