"use client";

import { useState, useMemo, useEffect } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import PageTemplate from "@/components/PageTemplate";
import Tooltip from "@/components/Tooltip";
import Modal from "@/components/Modal";
import ModuleLinks from "@/components/ModuleLinks";
import { getSalesOrderLinks } from "@/utils/moduleInterconnectivity";
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

export default function Reservations() {
  const router = useRouter();
  const [reservations, setReservations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch reservations from API
  useEffect(() => {
    const fetchReservations = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch('/api/wms/reservations?limit=100');
        const result = await response.json();
        
        if (result.success && result.data) {
          setReservations(result.data);
        } else {
          setError(result.error || 'Failed to fetch reservations');
        }
      } catch (err) {
        console.error('Error fetching reservations:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch reservations');
      } finally {
        setLoading(false);
      }
    };

    fetchReservations();
  }, []);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");
  const [selectedPriority, setSelectedPriority] = useState<string>("ALL");
  const [viewMode, setViewMode] = useState<
    "table" | "grid" | "analytics" | "realtime"
  >("table");
  const [selectedReservation, setSelectedReservation] = useState<any>(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [realTimeEnabled, setRealTimeEnabled] = useState(true);
  const [realTimeStats, setRealTimeStats] = useState({
    totalReservations: 0,
    active: 0,
    fulfillmentRate: 0,
    totalReserved: 0,
  });

  const filteredReservations = useMemo(() => {
    return reservations.filter((reservation) => {
      const matchesSearch =
        reservation.reservationNumber
          .toLowerCase()
          .includes(searchQuery.toLowerCase()) ||
        reservation.materialNumber
          .toLowerCase()
          .includes(searchQuery.toLowerCase()) ||
        reservation.orderNumber
          .toLowerCase()
          .includes(searchQuery.toLowerCase()) ||
        reservation.customerName
          .toLowerCase()
          .includes(searchQuery.toLowerCase());
      const matchesStatus =
        selectedStatus === "ALL" || reservation.status === selectedStatus;
      const matchesPriority =
        selectedPriority === "ALL" || reservation.priority === selectedPriority;
      return matchesSearch && matchesStatus && matchesPriority;
    });
  }, [reservations, searchQuery, selectedStatus, selectedPriority]);

  const totalReserved = useMemo(() => {
    return reservations.reduce((sum, r) => sum + r.reservedQuantity, 0);
  }, [reservations]);

  const statusStats = useMemo(() => {
    const stats: Record<string, { count: number; totalQuantity: number }> = {};
    reservations.forEach((reservation) => {
      if (!stats[reservation.status]) {
        stats[reservation.status] = { count: 0, totalQuantity: 0 };
      }
      stats[reservation.status].count++;
      stats[reservation.status].totalQuantity += reservation.reservedQuantity;
    });
    return stats;
  }, [reservations]);

  const priorityStats = useMemo(() => {
    const stats: Record<string, number> = {};
    reservations.forEach((reservation) => {
      stats[reservation.priority] = (stats[reservation.priority] || 0) + 1;
    });
    return stats;
  }, [reservations]);

  const chartData = useMemo(() => {
    return Object.entries(statusStats).map(([status, data]) => ({
      status,
      count: data.count,
      totalQuantity: data.totalQuantity,
    }));
  }, [statusStats]);

  const priorityData = useMemo(() => {
    return Object.entries(priorityStats).map(([priority, count]) => ({
      priority,
      count,
    }));
  }, [priorityStats]);

  // Daily trend
  const dailyTrend = useMemo(() => {
    const dailyData: Record<
      string,
      { date: string; created: number; fulfilled: number }
    > = {};

    reservations.forEach((r) => {
      const date = r.reservationDate
        ? format(new Date(r.reservationDate), "yyyy-MM-dd")
        : format(new Date(), "yyyy-MM-dd");
      if (!dailyData[date]) {
        dailyData[date] = { date, created: 0, fulfilled: 0 };
      }
      dailyData[date].created++;
      if (r.status === "FULFILLED") {
        dailyData[date].fulfilled++;
      }
    });

    return Object.values(dailyData)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .map((d) => ({
        date: format(new Date(d.date), "MMM dd"),
        created: d.created,
        fulfilled: d.fulfilled,
        fulfillmentRate: d.created > 0 ? (d.fulfilled / d.created) * 100 : 0,
      }));
  }, [reservations]);

  // Aggregate stats
  const aggregateStats = useMemo(() => {
    const total = reservations.length;
    const active = reservations.filter((r) => r.status === "ACTIVE").length;
    const fulfilled = reservations.filter(
      (r) => r.status === "FULFILLED",
    ).length;
    const fulfillmentRate = total > 0 ? (fulfilled / total) * 100 : 0;

    return {
      total,
      active,
      fulfilled,
      totalReserved,
      fulfillmentRate,
    };
  }, [reservations, totalReserved]);

  // Real-time updates
  useEffect(() => {
    if (!realTimeEnabled) return;

    const unsubscribe = realtimeSimulator.subscribe(
      "reservation-stats",
      (data: typeof realTimeStats) => {
        setRealTimeStats(data);
      },
    );

    const stop = realtimeSimulator.start(
      "reservation-stats",
      () => ({
        totalReservations: simulateKPIUpdates(aggregateStats.total, 0),
        active: simulateKPIUpdates(aggregateStats.active, 0.1),
        fulfillmentRate: simulateKPIUpdates(
          aggregateStats.fulfillmentRate,
          0.02,
        ),
        totalReserved: simulateKPIUpdates(aggregateStats.totalReserved, 0.05),
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
    aggregateStats.fulfillmentRate,
    aggregateStats.totalReserved,
  ]);

  // Simulate real-time status changes
  useEffect(() => {
    if (!realTimeEnabled) return;

    const interval = setInterval(() => {
      setReservations((prev) =>
        prev.map((r) => {
          if (r.status === "ACTIVE" && Math.random() < 0.02) {
            return { ...r, status: "FULFILLED" as const };
          }
          if (r.status === "ACTIVE" && Math.random() < 0.01) {
            return { ...r, status: "PARTIAL" as const };
          }
          return r;
        }),
      );
    }, 10000);

    return () => clearInterval(interval);
  }, [realTimeEnabled]);

  const stats = [
    {
      label: "Total Reservations",
      value: realTimeEnabled
        ? realTimeStats.totalReservations
        : aggregateStats.total,
      icon: "ri-bookmark-line",
      tooltip: "Total number of reservations",
      trend: "up" as const,
    },
    {
      label: "Total Reserved",
      value: realTimeEnabled
        ? realTimeStats.totalReserved.toFixed(0)
        : totalReserved.toFixed(0),
      icon: "ri-stack-line",
      tooltip: "Total reserved quantity",
      trend: "up" as const,
    },
    {
      label: "Active",
      value: realTimeEnabled ? realTimeStats.active : aggregateStats.active,
      icon: "ri-checkbox-circle-line",
      tooltip: "Active reservations",
      trend: "up" as const,
    },
    {
      label: "Fulfillment Rate",
      value: `${(realTimeEnabled ? realTimeStats.fulfillmentRate : aggregateStats.fulfillmentRate).toFixed(1)}%`,
      icon: "ri-check-double-line",
      tooltip: "Reservation fulfillment rate",
      trend: "up" as const,
    },
  ];

  const COLORS = {
    ACTIVE: "#10b981",
    PARTIAL: "#f59e0b",
    FULFILLED: "#06b6d4",
    CANCELLED: "#6b7280",
  };

  return (
    <PageTemplate
      title="Reservations"
      description="Stock reservations and allocations - Reserve stock for orders, track allocations, and manage reservation fulfillment"
      icon="ri-bookmark-line"
      systemInfo={{
        sap: "MB21 - Create Reservation, MB22 - Change Reservation, MB23 - Display Reservation",
        oracle: "Reservations - Stock Allocations, Reservation Management",
        manhattan: "Reservations - Stock Reservations, Allocation Management",
      }}
      examples={[
        "Reserve stock for specific orders",
        "Track reservation status and fulfillment",
        "Manage stock allocations",
        "Monitor reserved vs available quantities",
        "Handle partial and full reservations",
        "Cancel or modify reservations",
      ]}
      stats={stats}
      loading={loading}
      error={error}
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
            placeholder="Search by Reservation, Material, Order, Customer..."
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
          <option value="PARTIAL">Partial</option>
          <option value="FULFILLED">Fulfilled</option>
          <option value="CANCELLED">Cancelled</option>
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
                    Reservation Number
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-[#9ca3af] uppercase tracking-wider">
                    Material
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-[#9ca3af] uppercase tracking-wider">
                    Order
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-[#9ca3af] uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-[#9ca3af] uppercase tracking-wider">
                    Reserved Qty
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-[#9ca3af] uppercase tracking-wider">
                    Available Qty
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-[#9ca3af] uppercase tracking-wider">
                    Location
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-[#9ca3af] uppercase tracking-wider">
                    Required Date
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
                {filteredReservations.map((reservation, index) => (
                  <motion.tr
                    key={reservation.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.02 }}
                    className="hover:bg-white/5 transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-white font-mono">
                        {reservation.reservationNumber}
                      </div>
                      <div className="text-xs text-[#9ca3af]">
                        {format(
                          new Date(reservation.reservationDate),
                          "MMM dd, yyyy",
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <button
                          onClick={() =>
                            router.push(
                              `/inventory?material=${reservation.materialNumber}`,
                            )
                          }
                          className="text-sm font-medium text-cyan-400 hover:text-cyan-300 transition-colors font-mono"
                        >
                          {reservation.materialNumber}
                        </button>
                        <div className="text-xs text-[#9ca3af]">
                          {reservation.materialDescription}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() =>
                          router.push(
                            `/sales-orders?so=${reservation.orderNumber}`,
                          )
                        }
                        className="text-sm text-cyan-400 hover:text-cyan-300 transition-colors font-mono"
                      >
                        {reservation.orderNumber}
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <button
                          onClick={() =>
                            router.push(
                              `/customers?customer=${reservation.customerNumber}`,
                            )
                          }
                          className="text-sm text-cyan-400 hover:text-cyan-300 transition-colors"
                        >
                          {reservation.customerName}
                        </button>
                        <div className="text-xs text-[#9ca3af]">
                          {reservation.customerNumber}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-white font-medium">
                        {reservation.reservedQuantity.toFixed(2)}
                      </div>
                      <div className="text-xs text-[#9ca3af]">
                        {reservation.unit}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-white">
                        {reservation.availableQuantity.toFixed(2)}
                      </div>
                      <div className="text-xs text-[#9ca3af]">
                        {reservation.unit}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() =>
                          router.push(
                            `/storage-locations?location=${reservation.storageLocation}`,
                          )
                        }
                        className="text-sm text-cyan-400 hover:text-cyan-300 transition-colors font-mono"
                      >
                        {reservation.storageLocation}
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-white">
                        {format(
                          new Date(reservation.requiredDate),
                          "MMM dd, yyyy",
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col gap-1">
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium ${
                            reservation.status === "FULFILLED"
                              ? "bg-green-500/20 text-green-400 border border-green-500/30"
                              : reservation.status === "ACTIVE"
                                ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                                : reservation.status === "PARTIAL"
                                  ? "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30"
                                  : "bg-gray-500/20 text-gray-400 border border-gray-500/30"
                          }`}
                        >
                          {reservation.status}
                        </span>
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium ${
                            reservation.priority === "URGENT"
                              ? "bg-red-500/20 text-red-400"
                              : reservation.priority === "HIGH"
                                ? "bg-orange-500/20 text-orange-400"
                                : reservation.priority === "MEDIUM"
                                  ? "bg-yellow-500/20 text-yellow-400"
                                  : "bg-gray-500/20 text-gray-400"
                          }`}
                        >
                          {reservation.priority}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => {
                          setSelectedReservation(reservation);
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
          {filteredReservations.map((reservation, index) => (
            <motion.div
              key={reservation.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.03 }}
              className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-6 hover:border-cyan-500/50 hover:shadow-lg hover:shadow-cyan-500/10 transition-all cursor-pointer"
              onClick={() => {
                setSelectedReservation(reservation);
                setShowViewModal(true);
              }}
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-white font-mono mb-1">
                    {reservation.reservationNumber}
                  </h3>
                  <p className="text-sm text-[#9ca3af]">
                    {reservation.materialNumber}
                  </p>
                </div>
                <span
                  className={`px-2 py-1 rounded text-xs font-medium ${
                    reservation.status === "FULFILLED"
                      ? "bg-green-500/20 text-green-400"
                      : reservation.status === "ACTIVE"
                        ? "bg-blue-500/20 text-blue-400"
                        : "bg-gray-500/20 text-gray-400"
                  }`}
                >
                  {reservation.status}
                </span>
              </div>
              <div className="space-y-2 mb-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-[#9ca3af]">Order:</span>
                  <span className="text-white font-mono">
                    {reservation.orderNumber}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-[#9ca3af]">Customer:</span>
                  <span className="text-white">{reservation.customerName}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-[#9ca3af]">Reserved Qty:</span>
                  <span className="text-white font-medium">
                    {reservation.reservedQuantity.toFixed(2)} {reservation.unit}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-[#9ca3af]">Available Qty:</span>
                  <span className="text-white">
                    {reservation.availableQuantity.toFixed(2)}{" "}
                    {reservation.unit}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-[#9ca3af]">Required Date:</span>
                  <span className="text-white">
                    {format(new Date(reservation.requiredDate), "MMM dd, yyyy")}
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {viewMode === "analytics" && (
        <div className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
            >
              <h3 className="text-lg font-semibold text-white mb-4">
                Reservation Status Distribution
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
                          COLORS[entry.status as keyof typeof COLORS] ||
                          "#06b6d4"
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
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
          >
            <h3 className="text-lg font-semibold text-white mb-4">
              Daily Reservation Trend
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
                  dataKey="created"
                  fill="#3b82f6"
                  name="Created"
                />
                <Bar
                  yAxisId="left"
                  dataKey="fulfilled"
                  fill="#10b981"
                  name="Fulfilled"
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="fulfillmentRate"
                  stroke="#f59e0b"
                  strokeWidth={2}
                  name="Fulfillment Rate %"
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
                  Total Reservations
                </div>
                <div className="text-2xl font-bold text-white">
                  {realTimeStats.totalReservations}
                </div>
              </div>
              <div className="bg-white/5 rounded-lg p-4">
                <div className="text-xs text-[#9ca3af] mb-1">Active</div>
                <div className="text-2xl font-bold text-cyan-400">
                  {realTimeStats.active}
                </div>
              </div>
              <div className="bg-white/5 rounded-lg p-4">
                <div className="text-xs text-[#9ca3af] mb-1">
                  Fulfillment Rate
                </div>
                <div className="text-2xl font-bold text-green-400">
                  {realTimeStats.fulfillmentRate.toFixed(1)}%
                </div>
              </div>
              <div className="bg-white/5 rounded-lg p-4">
                <div className="text-xs text-[#9ca3af] mb-1">
                  Total Reserved
                </div>
                <div className="text-2xl font-bold text-yellow-400">
                  {realTimeStats.totalReserved.toFixed(0)}
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
              {filteredReservations
                .sort(
                  (a, b) =>
                    new Date(b.reservationDate).getTime() -
                    new Date(a.reservationDate).getTime(),
                )
                .slice(0, 10)
                .map((reservation) => (
                  <div
                    key={reservation.id}
                    className="flex items-center justify-between p-3 bg-white/5 rounded-lg"
                  >
                    <div className="flex-1">
                      <div className="text-sm font-medium text-white">
                        {reservation.reservationNumber}
                      </div>
                      <div className="text-xs text-[#9ca3af]">
                        {reservation.materialNumber} • {reservation.orderNumber}{" "}
                        • {reservation.customerName}
                        {reservation.reservationDate &&
                          ` • ${format(new Date(reservation.reservationDate), "MMM dd, HH:mm")}`}
                      </div>
                    </div>
                    <div
                      className={`text-xs px-2 py-1 rounded ${
                        reservation.status === "FULFILLED"
                          ? "bg-green-500/20 text-green-400"
                          : reservation.status === "ACTIVE"
                            ? "bg-cyan-500/20 text-cyan-400"
                            : reservation.status === "PARTIAL"
                              ? "bg-yellow-500/20 text-yellow-400"
                              : "bg-gray-500/20 text-gray-400"
                      }`}
                    >
                      {reservation.status}
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
          setSelectedReservation(null);
        }}
        title={`Reservation Details - ${selectedReservation?.reservationNumber || ""}`}
        size="lg"
      >
        {selectedReservation && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-[#9ca3af] mb-1 block">
                  Reservation Number
                </label>
                <div className="text-sm text-white font-mono">
                  {selectedReservation.reservationNumber}
                </div>
              </div>
              <div>
                <label className="text-xs text-[#9ca3af] mb-1 block">
                  Status
                </label>
                <span
                  className={`px-2 py-1 rounded text-xs font-medium ${
                    selectedReservation.status === "FULFILLED"
                      ? "bg-green-500/20 text-green-400"
                      : selectedReservation.status === "ACTIVE"
                        ? "bg-blue-500/20 text-blue-400"
                        : "bg-gray-500/20 text-gray-400"
                  }`}
                >
                  {selectedReservation.status}
                </span>
              </div>
              <div>
                <label className="text-xs text-[#9ca3af] mb-1 block">
                  Material Number
                </label>
                <button
                  onClick={() =>
                    router.push(
                      `/inventory?material=${selectedReservation.materialNumber}`,
                    )
                  }
                  className="text-sm text-cyan-400 hover:text-cyan-300 transition-colors font-mono"
                >
                  {selectedReservation.materialNumber}
                </button>
              </div>
              <div>
                <label className="text-xs text-[#9ca3af] mb-1 block">
                  Material Description
                </label>
                <div className="text-sm text-white">
                  {selectedReservation.materialDescription}
                </div>
              </div>
              <div>
                <label className="text-xs text-[#9ca3af] mb-1 block">
                  Order Number
                </label>
                <button
                  onClick={() =>
                    router.push(
                      `/sales-orders?so=${selectedReservation.orderNumber}`,
                    )
                  }
                  className="text-sm text-cyan-400 hover:text-cyan-300 transition-colors font-mono"
                >
                  {selectedReservation.orderNumber}
                </button>
              </div>
              <div>
                <label className="text-xs text-[#9ca3af] mb-1 block">
                  Customer
                </label>
                <button
                  onClick={() =>
                    router.push(
                      `/customers?customer=${selectedReservation.customerNumber}`,
                    )
                  }
                  className="text-sm text-cyan-400 hover:text-cyan-300 transition-colors"
                >
                  {selectedReservation.customerName}
                </button>
                <div className="text-xs text-[#9ca3af]">
                  {selectedReservation.customerNumber}
                </div>
              </div>
              <div>
                <label className="text-xs text-[#9ca3af] mb-1 block">
                  Reserved Quantity
                </label>
                <div className="text-sm text-white font-medium">
                  {selectedReservation.reservedQuantity.toFixed(2)}{" "}
                  {selectedReservation.unit}
                </div>
              </div>
              <div>
                <label className="text-xs text-[#9ca3af] mb-1 block">
                  Available Quantity
                </label>
                <div className="text-sm text-white">
                  {selectedReservation.availableQuantity.toFixed(2)}{" "}
                  {selectedReservation.unit}
                </div>
              </div>
              <div>
                <label className="text-xs text-[#9ca3af] mb-1 block">
                  Storage Location
                </label>
                <button
                  onClick={() =>
                    router.push(
                      `/storage-locations?location=${selectedReservation.storageLocation}`,
                    )
                  }
                  className="text-sm text-cyan-400 hover:text-cyan-300 transition-colors font-mono"
                >
                  {selectedReservation.storageLocation}
                </button>
              </div>
              {selectedReservation.batchNumber && (
                <div>
                  <label className="text-xs text-[#9ca3af] mb-1 block">
                    Batch Number
                  </label>
                  <button
                    onClick={() =>
                      router.push(
                        `/batches?batch=${selectedReservation.batchNumber}`,
                      )
                    }
                    className="text-sm text-cyan-400 hover:text-cyan-300 transition-colors font-mono"
                  >
                    {selectedReservation.batchNumber}
                  </button>
                </div>
              )}
              <div>
                <label className="text-xs text-[#9ca3af] mb-1 block">
                  Reservation Date
                </label>
                <div className="text-sm text-white">
                  {format(
                    new Date(selectedReservation.reservationDate),
                    "MMM dd, yyyy",
                  )}
                </div>
              </div>
              <div>
                <label className="text-xs text-[#9ca3af] mb-1 block">
                  Required Date
                </label>
                <div className="text-sm text-white">
                  {format(
                    new Date(selectedReservation.requiredDate),
                    "MMM dd, yyyy",
                  )}
                </div>
              </div>
              <div>
                <label className="text-xs text-[#9ca3af] mb-1 block">
                  Priority
                </label>
                <span
                  className={`px-2 py-1 rounded text-xs font-medium ${
                    selectedReservation.priority === "URGENT"
                      ? "bg-red-500/20 text-red-400"
                      : selectedReservation.priority === "HIGH"
                        ? "bg-orange-500/20 text-orange-400"
                        : selectedReservation.priority === "MEDIUM"
                          ? "bg-yellow-500/20 text-yellow-400"
                          : "bg-gray-500/20 text-gray-400"
                  }`}
                >
                  {selectedReservation.priority}
                </span>
              </div>
              <div>
                <label className="text-xs text-[#9ca3af] mb-1 block">
                  Reserved By
                </label>
                <div className="text-sm text-white">
                  {selectedReservation.reservedBy}
                </div>
              </div>
            </div>
            {selectedReservation.notes && (
              <div>
                <label className="text-xs text-[#9ca3af] mb-1 block">
                  Notes
                </label>
                <div className="text-sm text-white bg-white/5 p-3 rounded-lg">
                  {selectedReservation.notes}
                </div>
              </div>
            )}
            <div className="pt-4 border-t border-white/10">
              <ModuleLinks
                links={getSalesOrderLinks(selectedReservation.orderNumber)}
              />
            </div>
          </div>
        )}
      </Modal>
    </PageTemplate>
  );
}
