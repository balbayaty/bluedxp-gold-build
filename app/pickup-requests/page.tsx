"use client";

import { useState, useMemo, useEffect } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import PageTemplate from "@/components/PageTemplate";
import Tooltip from "@/components/Tooltip";
import Modal from "@/components/Modal";
import ModuleLinks from "@/components/ModuleLinks";
import {
  generateSalesOrders,
  generateCarriers,
} from "@/utils/mockDataGenerators";
import {
  getSalesOrderLinks,
  getShipmentLinks,
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

interface PickupRequest {
  id: string;
  requestNumber: string;
  soNumber: string;
  customerNumber: string;
  customerName: string;
  requestedDate: Date | string;
  requestedBy: string;
  preferredPickupDate: Date | string;
  preferredPickupTime: string;
  actualPickupDate?: Date | string;
  status:
    | "PENDING"
    | "CONFIRMED"
    | "SCHEDULED"
    | "IN_PROGRESS"
    | "COMPLETED"
    | "CANCELLED";
  carrierCode?: string;
  carrierName?: string;
  driverName?: string;
  driverPhone?: string;
  vehicleNumber?: string;
  pickupAddress: string;
  pickupCity: string;
  totalItems: number;
  totalWeight: number;
  totalVolume: number;
  totalValue: number;
  currency: string;
  specialInstructions?: string;
  requestMethod: "PORTAL" | "PHONE" | "EMAIL" | "API" | "EDI";
  confirmationNumber?: string;
  waybillNumber?: string;
  trackingNumber?: string;
  notes?: string;
  createdAt: Date | string;
}

const generatePickupRequests = (count: number = 100): PickupRequest[] => {
  const salesOrders = generateSalesOrders(150);
  const carriers = generateCarriers(10);

  return Array.from({ length: count }, (_, i) => {
    const so = salesOrders[Math.floor(Math.random() * salesOrders.length)];
    const carrier =
      Math.random() > 0.5
        ? carriers[Math.floor(Math.random() * carriers.length)]
        : undefined;
    const requestedDate = new Date(Date.now() - Math.random() * 30 * 86400000);
    const preferredPickupDate = new Date(
      requestedDate.getTime() + Math.random() * 7 * 86400000,
    );
    const statuses: PickupRequest["status"][] = [
      "PENDING",
      "CONFIRMED",
      "SCHEDULED",
      "IN_PROGRESS",
      "COMPLETED",
      "CANCELLED",
    ];
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    const methods: PickupRequest["requestMethod"][] = [
      "PORTAL",
      "PHONE",
      "EMAIL",
      "API",
      "EDI",
    ];

    return {
      id: `PR-${String(i + 1).padStart(6, "0")}`,
      requestNumber: `PR-${new Date().getFullYear()}-${String(i + 1).padStart(6, "0")}`,
      soNumber: so.soNumber,
      customerNumber: so.customerNumber,
      customerName: so.customerName,
      requestedDate,
      requestedBy: `User ${Math.floor(Math.random() * 10) + 1}`,
      preferredPickupDate,
      preferredPickupTime: `${String(Math.floor(Math.random() * 12) + 8).padStart(2, "0")}:00`,
      actualPickupDate: ["COMPLETED", "IN_PROGRESS"].includes(status)
        ? new Date(preferredPickupDate.getTime() + Math.random() * 86400000)
        : undefined,
      status,
      carrierCode: carrier?.carrierCode,
      carrierName: carrier?.carrierName,
      driverName: ["SCHEDULED", "IN_PROGRESS", "COMPLETED"].includes(status)
        ? `Driver ${Math.floor(Math.random() * 20) + 1}`
        : undefined,
      driverPhone: ["SCHEDULED", "IN_PROGRESS", "COMPLETED"].includes(status)
        ? `+971${Math.floor(Math.random() * 90000000 + 500000000)}`
        : undefined,
      vehicleNumber: ["SCHEDULED", "IN_PROGRESS", "COMPLETED"].includes(status)
        ? `VEH-${String(Math.floor(Math.random() * 1000) + 1).padStart(4, "0")}`
        : undefined,
      pickupAddress: `Warehouse ${["A", "B", "C"][Math.floor(Math.random() * 3)]}, Industrial Area`,
      pickupCity: ["Dubai", "Abu Dhabi", "Sharjah", "Al Ain"][
        Math.floor(Math.random() * 4)
      ],
      totalItems: so.totalItems || Math.floor(Math.random() * 50) + 1,
      totalWeight: Math.random() * 1000 + 50,
      totalVolume: Math.random() * 10 + 0.5,
      totalValue: so.totalValue || 0,
      currency: so.currency || "SAR",
      specialInstructions:
        Math.random() > 0.7 ? "Fragile items, handle with care" : undefined,
      requestMethod: methods[Math.floor(Math.random() * methods.length)],
      confirmationNumber: [
        "CONFIRMED",
        "SCHEDULED",
        "IN_PROGRESS",
        "COMPLETED",
      ].includes(status)
        ? `CONF-${String(i + 1).padStart(6, "0")}`
        : undefined,
      waybillNumber: ["IN_PROGRESS", "COMPLETED"].includes(status)
        ? `WB-${String(i + 1).padStart(10, "0")}`
        : undefined,
      trackingNumber: ["IN_PROGRESS", "COMPLETED"].includes(status)
        ? `TRK-${String(i + 1).padStart(10, "0")}`
        : undefined,
      notes:
        Math.random() > 0.7 ? "Customer requested early pickup" : undefined,
      createdAt: requestedDate,
    };
  });
};

export default function PickupRequests() {
  const router = useRouter();
  const [requests, setRequests] = useState<PickupRequest[]>(() =>
    generatePickupRequests(120),
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");
  const [selectedCarrier, setSelectedCarrier] = useState<string>("ALL");
  const [selectedMethod, setSelectedMethod] = useState<string>("ALL");
  const [viewMode, setViewMode] = useState<"table" | "grid" | "analytics">(
    "table",
  );
  const [selectedRequest, setSelectedRequest] = useState<PickupRequest | null>(
    null,
  );
  const [showViewModal, setShowViewModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [realTimeEnabled, setRealTimeEnabled] = useState(true);
  const [realTimeStats, setRealTimeStats] = useState({
    totalRequests: 0,
    pending: 0,
    scheduled: 0,
    completed: 0,
  });

  const filteredRequests = useMemo(() => {
    return requests.filter((req) => {
      const matchesSearch =
        req.requestNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        req.soNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        req.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        req.trackingNumber?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus =
        selectedStatus === "ALL" || req.status === selectedStatus;
      const matchesCarrier =
        selectedCarrier === "ALL" || req.carrierName === selectedCarrier;
      const matchesMethod =
        selectedMethod === "ALL" || req.requestMethod === selectedMethod;
      return matchesSearch && matchesStatus && matchesCarrier && matchesMethod;
    });
  }, [requests, searchQuery, selectedStatus, selectedCarrier, selectedMethod]);

  const statusDistribution = useMemo(() => {
    const counts: Record<string, number> = {};
    requests.forEach((r) => {
      counts[r.status] = (counts[r.status] || 0) + 1;
    });
    return Object.entries(counts).map(([status, count]) => ({
      status: status.replace(/_/g, " "),
      count,
    }));
  }, [requests]);

  const methodDistribution = useMemo(() => {
    const counts: Record<string, number> = {};
    requests.forEach((r) => {
      counts[r.requestMethod] = (counts[r.requestMethod] || 0) + 1;
    });
    return Object.entries(counts).map(([method, count]) => ({ method, count }));
  }, [requests]);

  const dailyTrend = useMemo(() => {
    const dailyData: Record<
      string,
      { date: string; requested: number; completed: number }
    > = {};

    requests.forEach((r) => {
      const date = format(new Date(r.requestedDate), "yyyy-MM-dd");
      if (!dailyData[date]) {
        dailyData[date] = { date, requested: 0, completed: 0 };
      }
      dailyData[date].requested++;
      if (r.status === "COMPLETED") {
        dailyData[date].completed++;
      }
    });

    return Object.values(dailyData)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(-30)
      .map((d) => ({
        date: format(new Date(d.date), "MMM dd"),
        requested: d.requested,
        completed: d.completed,
      }));
  }, [requests]);

  const aggregateStats = useMemo(() => {
    const totalRequests = requests.length;
    const pending = requests.filter((r) => r.status === "PENDING").length;
    const scheduled = requests.filter((r) =>
      ["SCHEDULED", "IN_PROGRESS"].includes(r.status),
    ).length;
    const completed = requests.filter((r) => r.status === "COMPLETED").length;

    return {
      totalRequests,
      pending,
      scheduled,
      completed,
    };
  }, [requests]);

  useEffect(() => {
    if (!realTimeEnabled) return;

    const unsubscribe = realtimeSimulator.subscribe(
      "pickup-request-stats",
      (data: typeof realTimeStats) => {
        setRealTimeStats(data);
      },
    );

    const stop = realtimeSimulator.start(
      "pickup-request-stats",
      () => ({
        totalRequests: aggregateStats.totalRequests,
        pending: simulateKPIUpdates(aggregateStats.pending, 0.1),
        scheduled: simulateKPIUpdates(aggregateStats.scheduled, 0.1),
        completed: simulateKPIUpdates(aggregateStats.completed, 0.05),
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
    aggregateStats.totalRequests,
    aggregateStats.pending,
    aggregateStats.scheduled,
    aggregateStats.completed,
  ]);

  const uniqueCarriers = useMemo(() => {
    return Array.from(
      new Set(requests.filter((r) => r.carrierName).map((r) => r.carrierName!)),
    ).sort();
  }, [requests]);

  const stats = [
    {
      label: "Total Requests",
      value: realTimeEnabled
        ? realTimeStats.totalRequests
        : aggregateStats.totalRequests,
      icon: "ri-calendar-todo-line",
      tooltip: "Total pickup requests",
      trend: "up" as const,
    },
    {
      label: "Pending",
      value: realTimeEnabled ? realTimeStats.pending : aggregateStats.pending,
      icon: "ri-time-line",
      tooltip: "Pending requests",
      trend: "neutral" as const,
    },
    {
      label: "Scheduled",
      value: realTimeEnabled
        ? realTimeStats.scheduled
        : aggregateStats.scheduled,
      icon: "ri-calendar-check-line",
      tooltip: "Scheduled pickups",
      trend: "up" as const,
    },
    {
      label: "Completed",
      value: realTimeEnabled
        ? realTimeStats.completed
        : aggregateStats.completed,
      icon: "ri-checkbox-circle-line",
      tooltip: "Completed pickups",
      trend: "up" as const,
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

  const handleView = (request: PickupRequest) => {
    setSelectedRequest(request);
    setShowViewModal(true);
  };

  const handleConfirm = (request: PickupRequest) => {
    setSelectedRequest(request);
    setShowConfirmModal(true);
  };

  const confirmPickup = () => {
    if (selectedRequest) {
      setRequests((prev) =>
        prev.map((r) =>
          r.id === selectedRequest.id
            ? {
                ...r,
                status: "CONFIRMED" as const,
                confirmationNumber: `CONF-${String(Math.floor(Math.random() * 1000000)).padStart(6, "0")}`,
              }
            : r,
        ),
      );
      setShowConfirmModal(false);
      setSelectedRequest(null);
    }
  };

  return (
    <PageTemplate
      title="Pickup Request Management"
      description="Carrier pickup request management with scheduling, carrier assignment, driver coordination, and pickup tracking"
      icon="ri-calendar-todo-line"
      systemInfo={{
        sap: "Pickup Request, Carrier Pickup",
        oracle: "Pickup Request, Carrier Pickup",
        manhattan: "Pickup Request, Carrier Pickup",
      }}
      examples={[
        "Pickup request creation",
        "Carrier assignment",
        "Pickup scheduling",
        "Driver coordination",
        "Pickup tracking",
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
            placeholder="Search pickup requests..."
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
          <option value="PENDING">Pending</option>
          <option value="CONFIRMED">Confirmed</option>
          <option value="SCHEDULED">Scheduled</option>
          <option value="IN_PROGRESS">In Progress</option>
          <option value="COMPLETED">Completed</option>
          <option value="CANCELLED">Cancelled</option>
        </select>
        <select
          value={selectedCarrier}
          onChange={(e) => setSelectedCarrier(e.target.value)}
          className="bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 min-w-[180px]"
        >
          <option value="ALL">All Carriers</option>
          {uniqueCarriers.map((carrier) => (
            <option key={carrier} value={carrier}>
              {carrier}
            </option>
          ))}
        </select>
        <select
          value={selectedMethod}
          onChange={(e) => setSelectedMethod(e.target.value)}
          className="bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 min-w-[180px]"
        >
          <option value="ALL">All Methods</option>
          <option value="PORTAL">Portal</option>
          <option value="PHONE">Phone</option>
          <option value="EMAIL">Email</option>
          <option value="API">API</option>
          <option value="EDI">EDI</option>
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
                    Request
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-[#9ca3af] uppercase tracking-wider">
                    Sales Order
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-[#9ca3af] uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-[#9ca3af] uppercase tracking-wider">
                    Pickup Date
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-[#9ca3af] uppercase tracking-wider">
                    Carrier
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-[#9ca3af] uppercase tracking-wider">
                    Items
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
                {filteredRequests.map((request, index) => (
                  <motion.tr
                    key={request.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.02 }}
                    className="hover:bg-white/5 transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-white font-mono">
                        {request.requestNumber}
                      </div>
                      <div className="text-xs text-[#9ca3af]">
                        {format(
                          new Date(request.requestedDate),
                          "MMM dd, yyyy",
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() =>
                          router.push(`/sales-orders?so=${request.soNumber}`)
                        }
                        className="text-sm text-cyan-400 hover:text-cyan-300 font-mono"
                      >
                        {request.soNumber}
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-white">
                        {request.customerName}
                      </div>
                      <div className="text-xs text-[#9ca3af] font-mono">
                        {request.customerNumber}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-white">
                        {format(
                          new Date(request.preferredPickupDate),
                          "MMM dd, yyyy",
                        )}
                      </div>
                      <div className="text-xs text-[#9ca3af]">
                        {request.preferredPickupTime}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {request.carrierName ? (
                        <div>
                          <div className="text-sm text-white">
                            {request.carrierName}
                          </div>
                          <div className="text-xs text-[#9ca3af] font-mono">
                            {request.carrierCode}
                          </div>
                        </div>
                      ) : (
                        <span className="text-xs text-[#9ca3af]">
                          Not assigned
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-white font-medium">
                        {request.totalItems} items
                      </div>
                      <div className="text-xs text-[#9ca3af]">
                        {request.totalWeight.toFixed(2)} kg
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${
                          request.status === "COMPLETED"
                            ? "bg-green-500/20 text-green-400 border border-green-500/30"
                            : request.status === "IN_PROGRESS"
                              ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                              : request.status === "SCHEDULED" ||
                                  request.status === "CONFIRMED"
                                ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30"
                                : request.status === "PENDING"
                                  ? "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30"
                                  : "bg-red-500/20 text-red-400 border border-red-500/30"
                        }`}
                      >
                        {request.status.replace(/_/g, " ")}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <Tooltip content="View Details" position="top">
                          <button
                            onClick={() => handleView(request)}
                            className="p-2 bg-cyan-600/20 text-cyan-400 border border-cyan-500/30 rounded hover:bg-cyan-600/30 transition-colors"
                          >
                            <i className="ri-eye-line"></i>
                          </button>
                        </Tooltip>
                        {request.status === "PENDING" && (
                          <Tooltip content="Confirm Request" position="top">
                            <button
                              onClick={() => handleConfirm(request)}
                              className="p-2 bg-green-600/20 text-green-400 border border-green-500/30 rounded hover:bg-green-600/30 transition-colors"
                            >
                              <i className="ri-check-line"></i>
                            </button>
                          </Tooltip>
                        )}
                        {request.trackingNumber && (
                          <Tooltip content="Track Shipment" position="top">
                            <button
                              onClick={() =>
                                router.push(
                                  `/tracking?tracking=${request.trackingNumber}`,
                                )
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

      {/* Grid View */}
      {viewMode === "grid" && (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredRequests.map((request, index) => (
            <motion.div
              key={request.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.03 }}
              className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-6 hover:border-cyan-500/50 hover:shadow-lg hover:shadow-cyan-500/10 transition-all"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-white mb-1 font-mono">
                    {request.requestNumber}
                  </h3>
                  <p className="text-sm text-[#9ca3af]">
                    {format(new Date(request.requestedDate), "MMM dd, yyyy")}
                  </p>
                </div>
                <span
                  className={`px-2 py-1 rounded text-xs font-medium ${
                    request.status === "COMPLETED"
                      ? "bg-green-500/20 text-green-400"
                      : request.status === "IN_PROGRESS"
                        ? "bg-blue-500/20 text-blue-400"
                        : request.status === "SCHEDULED" ||
                            request.status === "CONFIRMED"
                          ? "bg-cyan-500/20 text-cyan-400"
                          : "bg-yellow-500/20 text-yellow-400"
                  }`}
                >
                  {request.status.replace(/_/g, " ")}
                </span>
              </div>
              <div className="space-y-2 mb-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-[#9ca3af]">Sales Order:</span>
                  <button
                    onClick={() =>
                      router.push(`/sales-orders?so=${request.soNumber}`)
                    }
                    className="text-cyan-400 hover:text-cyan-300 font-mono text-xs"
                  >
                    {request.soNumber}
                  </button>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-[#9ca3af]">Customer:</span>
                  <span className="text-white text-xs">
                    {request.customerName}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-[#9ca3af]">Pickup Date:</span>
                  <span className="text-white text-xs">
                    {format(new Date(request.preferredPickupDate), "MMM dd")}{" "}
                    {request.preferredPickupTime}
                  </span>
                </div>
                {request.carrierName && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-[#9ca3af]">Carrier:</span>
                    <span className="text-white text-xs">
                      {request.carrierName}
                    </span>
                  </div>
                )}
                <div className="flex items-center justify-between text-sm">
                  <span className="text-[#9ca3af]">Items:</span>
                  <span className="text-white">
                    {request.totalItems} items, {request.totalWeight.toFixed(2)}{" "}
                    kg
                  </span>
                </div>
                {request.driverName && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-[#9ca3af]">Driver:</span>
                    <span className="text-white text-xs">
                      {request.driverName}
                    </span>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2 pt-4 border-t border-white/10">
                <button
                  onClick={() => handleView(request)}
                  className="flex-1 px-3 py-2 bg-cyan-600/20 text-cyan-400 border border-cyan-500/30 rounded text-sm font-medium hover:bg-cyan-600/30 transition-colors"
                >
                  <i className="ri-eye-line mr-1"></i>
                  View
                </button>
                {request.status === "PENDING" && (
                  <button
                    onClick={() => handleConfirm(request)}
                    className="px-3 py-2 bg-green-600/20 text-green-400 border border-green-500/30 rounded text-sm font-medium hover:bg-green-600/30 transition-colors"
                  >
                    <i className="ri-check-line"></i>
                  </button>
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
                Request Method Distribution
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={methodDistribution}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="method" stroke="#9ca3af" fontSize={10} />
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
              Daily Pickup Request Trend
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={dailyTrend}>
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
                <Line
                  type="monotone"
                  dataKey="requested"
                  stroke="#06b6d4"
                  strokeWidth={2}
                  name="Requested"
                />
                <Line
                  type="monotone"
                  dataKey="completed"
                  stroke="#10b981"
                  strokeWidth={2}
                  name="Completed"
                />
              </LineChart>
            </ResponsiveContainer>
          </motion.div>
        </div>
      )}

      {/* View Modal */}
      <Modal
        isOpen={showViewModal}
        onClose={() => {
          setShowViewModal(false);
          setSelectedRequest(null);
        }}
        title={`Pickup Request - ${selectedRequest?.requestNumber || ""}`}
        size="lg"
      >
        {selectedRequest && (
          <div className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-[#9ca3af] mb-1">
                  Request Number
                </div>
                <div className="text-white font-medium font-mono">
                  {selectedRequest.requestNumber}
                </div>
              </div>
              <div>
                <div className="text-sm text-[#9ca3af] mb-1">Sales Order</div>
                <button
                  onClick={() =>
                    router.push(`/sales-orders?so=${selectedRequest.soNumber}`)
                  }
                  className="text-cyan-400 hover:text-cyan-300 font-mono"
                >
                  {selectedRequest.soNumber}
                </button>
              </div>
              <div>
                <div className="text-sm text-[#9ca3af] mb-1">Customer</div>
                <div className="text-white">{selectedRequest.customerName}</div>
                <div className="text-xs text-[#9ca3af] font-mono">
                  {selectedRequest.customerNumber}
                </div>
              </div>
              <div>
                <div className="text-sm text-[#9ca3af] mb-1">Status</div>
                <span
                  className={`px-2 py-1 rounded text-xs font-medium ${
                    selectedRequest.status === "COMPLETED"
                      ? "bg-green-500/20 text-green-400"
                      : selectedRequest.status === "IN_PROGRESS"
                        ? "bg-blue-500/20 text-blue-400"
                        : selectedRequest.status === "SCHEDULED" ||
                            selectedRequest.status === "CONFIRMED"
                          ? "bg-cyan-500/20 text-cyan-400"
                          : "bg-yellow-500/20 text-yellow-400"
                  }`}
                >
                  {selectedRequest.status.replace(/_/g, " ")}
                </span>
              </div>
              <div>
                <div className="text-sm text-[#9ca3af] mb-1">
                  Preferred Pickup Date
                </div>
                <div className="text-white">
                  {format(new Date(selectedRequest.preferredPickupDate), "PP")}
                </div>
                <div className="text-xs text-[#9ca3af]">
                  Time: {selectedRequest.preferredPickupTime}
                </div>
              </div>
              {selectedRequest.actualPickupDate && (
                <div>
                  <div className="text-sm text-[#9ca3af] mb-1">
                    Actual Pickup Date
                  </div>
                  <div className="text-white">
                    {format(new Date(selectedRequest.actualPickupDate), "PPp")}
                  </div>
                </div>
              )}
              <div>
                <div className="text-sm text-[#9ca3af] mb-1">
                  Pickup Address
                </div>
                <div className="text-white">
                  {selectedRequest.pickupAddress}
                </div>
                <div className="text-xs text-[#9ca3af]">
                  {selectedRequest.pickupCity}
                </div>
              </div>
              {selectedRequest.carrierName && (
                <div>
                  <div className="text-sm text-[#9ca3af] mb-1">Carrier</div>
                  <div className="text-white">
                    {selectedRequest.carrierName}
                  </div>
                  <div className="text-xs text-[#9ca3af] font-mono">
                    {selectedRequest.carrierCode}
                  </div>
                </div>
              )}
              {selectedRequest.driverName && (
                <div>
                  <div className="text-sm text-[#9ca3af] mb-1">Driver</div>
                  <div className="text-white">{selectedRequest.driverName}</div>
                  {selectedRequest.driverPhone && (
                    <div className="text-xs text-[#9ca3af]">
                      {selectedRequest.driverPhone}
                    </div>
                  )}
                </div>
              )}
              {selectedRequest.vehicleNumber && (
                <div>
                  <div className="text-sm text-[#9ca3af] mb-1">
                    Vehicle Number
                  </div>
                  <div className="text-white font-mono">
                    {selectedRequest.vehicleNumber}
                  </div>
                </div>
              )}
              {selectedRequest.trackingNumber && (
                <div>
                  <div className="text-sm text-[#9ca3af] mb-1">
                    Tracking Number
                  </div>
                  <button
                    onClick={() =>
                      router.push(
                        `/tracking?tracking=${selectedRequest.trackingNumber}`,
                      )
                    }
                    className="text-cyan-400 hover:text-cyan-300 font-mono"
                  >
                    {selectedRequest.trackingNumber}
                  </button>
                </div>
              )}
            </div>
            <div className="grid grid-cols-4 gap-3">
              <div className="p-3 bg-white/5 rounded-lg">
                <div className="text-xs text-[#9ca3af] mb-1">Total Items</div>
                <div className="text-lg font-semibold text-white">
                  {selectedRequest.totalItems}
                </div>
              </div>
              <div className="p-3 bg-white/5 rounded-lg">
                <div className="text-xs text-[#9ca3af] mb-1">Total Weight</div>
                <div className="text-lg font-semibold text-white">
                  {selectedRequest.totalWeight.toFixed(2)} kg
                </div>
              </div>
              <div className="p-3 bg-white/5 rounded-lg">
                <div className="text-xs text-[#9ca3af] mb-1">Total Volume</div>
                <div className="text-lg font-semibold text-white">
                  {selectedRequest.totalVolume.toFixed(2)} m³
                </div>
              </div>
              <div className="p-3 bg-white/5 rounded-lg">
                <div className="text-xs text-[#9ca3af] mb-1">Total Value</div>
                <div className="text-lg font-semibold text-white">
                  {selectedRequest.totalValue.toLocaleString()}{" "}
                  {selectedRequest.currency}
                </div>
              </div>
            </div>
            <div>
              <div className="text-sm text-[#9ca3af] mb-1">Request Method</div>
              <div className="text-white">{selectedRequest.requestMethod}</div>
            </div>
            {selectedRequest.specialInstructions && (
              <div>
                <div className="text-sm text-[#9ca3af] mb-1">
                  Special Instructions
                </div>
                <div className="text-white">
                  {selectedRequest.specialInstructions}
                </div>
              </div>
            )}
            {selectedRequest.notes && (
              <div>
                <div className="text-sm text-[#9ca3af] mb-1">Notes</div>
                <div className="text-white">{selectedRequest.notes}</div>
              </div>
            )}
            <ModuleLinks
              links={[
                ...getSalesOrderLinks(selectedRequest.soNumber),
                ...(selectedRequest.trackingNumber
                  ? getShipmentLinks(selectedRequest.trackingNumber)
                  : []),
              ]}
            />
          </div>
        )}
      </Modal>

      {/* Confirm Modal */}
      <Modal
        isOpen={showConfirmModal}
        onClose={() => {
          setShowConfirmModal(false);
          setSelectedRequest(null);
        }}
        title="Confirm Pickup Request"
        size="md"
      >
        {selectedRequest && (
          <div className="space-y-4">
            <p className="text-white">
              Confirm pickup request{" "}
              <strong>{selectedRequest.requestNumber}</strong>?
            </p>
            <div className="bg-white/5 rounded-lg p-4">
              <div className="text-sm text-[#9ca3af] mb-2">Request Details</div>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-[#9ca3af]">Sales Order:</span>
                  <span className="text-white font-mono">
                    {selectedRequest.soNumber}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#9ca3af]">Customer:</span>
                  <span className="text-white">
                    {selectedRequest.customerName}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#9ca3af]">Pickup Date:</span>
                  <span className="text-white">
                    {format(
                      new Date(selectedRequest.preferredPickupDate),
                      "PP",
                    )}{" "}
                    {selectedRequest.preferredPickupTime}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#9ca3af]">Items:</span>
                  <span className="text-white">
                    {selectedRequest.totalItems} items
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={confirmPickup}
                className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
              >
                Confirm
              </button>
              <button
                onClick={() => {
                  setShowConfirmModal(false);
                  setSelectedRequest(null);
                }}
                className="flex-1 px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded-lg font-medium transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </Modal>
    </PageTemplate>
  );
}
