"use client";

import { useState, useMemo, useEffect } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import PageTemplate from "@/components/PageTemplate";
import Tooltip from "@/components/Tooltip";
import Modal from "@/components/Modal";
import ModuleLinks from "@/components/ModuleLinks";
import {
  getShipmentLinks,
  getSalesOrderLinks,
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

interface ShipConfirmation {
  id: string;
  shipConfirmationNumber: string;
  shipmentNumber: string;
  soNumber: string;
  customerNumber: string;
  customerName: string;
  carrierName: string;
  carrierCode: string;
  shipDate: Date | string;
  confirmedAt: Date | string;
  confirmedBy: string;
  status: "PENDING" | "CONFIRMED" | "IN_TRANSIT" | "DELIVERED" | "CANCELLED";
  waybillNumber?: string;
  trackingNumber?: string;
  vehicleNumber?: string;
  driverName?: string;
  driverPhone?: string;
  totalWeight: number;
  totalVolume: number;
  totalItems: number;
  totalValue: number;
  currency: string;
  shippingMethod: "STANDARD" | "EXPRESS" | "OVERNIGHT" | "ECONOMY";
  confirmationMethod: "MANUAL" | "API" | "EDI" | "PORTAL";
  notes?: string;
  createdAt: Date | string;
}


export default function ShipConfirmation() {
  const router = useRouter();
  const [confirmations, setConfirmations] = useState<ShipConfirmation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch ship confirmations from API
  useEffect(() => {
    const fetchConfirmations = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch('/api/wms/ship-confirmation?limit=100');
        const result = await response.json();
        
        if (result.success && result.data) {
          // Map API response to component interface
          const mappedConfirmations: ShipConfirmation[] = result.data.map((conf: any) => ({
            id: conf.id,
            shipConfirmationNumber: conf.shipConfirmationNumber,
            shipmentNumber: conf.shipmentNumber,
            soNumber: conf.soNumber,
            customerNumber: conf.customerNumber,
            customerName: conf.customerName,
            carrierName: conf.carrierName,
            carrierCode: conf.carrierCode,
            shipDate: conf.shipDate,
            confirmedAt: conf.confirmedAt,
            confirmedBy: conf.confirmedBy,
            status: conf.status,
            waybillNumber: conf.waybillNumber,
            trackingNumber: conf.trackingNumber,
            totalWeight: conf.totalWeight,
            totalVolume: conf.totalVolume,
            totalItems: conf.totalItems,
            totalValue: conf.totalValue,
            currency: conf.currency,
            shippingMethod: conf.shippingMethod,
            confirmationMethod: conf.confirmationMethod,
            notes: conf.notes,
            createdAt: conf.createdAt,
          }));
          setConfirmations(mappedConfirmations);
        } else {
          setError(result.error || 'Failed to fetch ship confirmations');
        }
      } catch (err) {
        console.error('Error fetching ship confirmations:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch ship confirmations');
      } finally {
        setLoading(false);
      }
    };

    fetchConfirmations();
  }, []);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");
  const [selectedCarrier, setSelectedCarrier] = useState<string>("ALL");
  const [selectedMethod, setSelectedMethod] = useState<string>("ALL");
  const [viewMode, setViewMode] = useState<"table" | "grid" | "analytics">(
    "table",
  );
  const [selectedConfirmation, setSelectedConfirmation] =
    useState<ShipConfirmation | null>(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [realTimeEnabled, setRealTimeEnabled] = useState(true);
  const [realTimeStats, setRealTimeStats] = useState({
    totalConfirmations: 0,
    confirmed: 0,
    inTransit: 0,
    delivered: 0,
  });

  const filteredConfirmations = useMemo(() => {
    return confirmations.filter((conf) => {
      const matchesSearch =
        conf.shipConfirmationNumber
          .toLowerCase()
          .includes(searchQuery.toLowerCase()) ||
        conf.shipmentNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        conf.soNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        conf.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        conf.trackingNumber?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus =
        selectedStatus === "ALL" || conf.status === selectedStatus;
      const matchesCarrier =
        selectedCarrier === "ALL" || conf.carrierName === selectedCarrier;
      const matchesMethod =
        selectedMethod === "ALL" || conf.confirmationMethod === selectedMethod;
      return matchesSearch && matchesStatus && matchesCarrier && matchesMethod;
    });
  }, [
    confirmations,
    searchQuery,
    selectedStatus,
    selectedCarrier,
    selectedMethod,
  ]);

  const statusDistribution = useMemo(() => {
    const counts: Record<string, number> = {};
    confirmations.forEach((c) => {
      counts[c.status] = (counts[c.status] || 0) + 1;
    });
    return Object.entries(counts).map(([status, count]) => ({
      status: status.replace(/_/g, " "),
      count,
    }));
  }, [confirmations]);

  const carrierDistribution = useMemo(() => {
    const counts: Record<string, number> = {};
    confirmations.forEach((c) => {
      counts[c.carrierName] = (counts[c.carrierName] || 0) + 1;
    });
    return Object.entries(counts).map(([carrier, count]) => ({
      carrier,
      count,
    }));
  }, [confirmations]);

  const dailyTrend = useMemo(() => {
    const dailyData: Record<
      string,
      { date: string; confirmed: number; delivered: number }
    > = {};

    confirmations.forEach((c) => {
      const date = format(new Date(c.shipDate), "yyyy-MM-dd");
      if (!dailyData[date]) {
        dailyData[date] = { date, confirmed: 0, delivered: 0 };
      }
      if (["CONFIRMED", "IN_TRANSIT", "DELIVERED"].includes(c.status)) {
        dailyData[date].confirmed++;
      }
      if (c.status === "DELIVERED") {
        dailyData[date].delivered++;
      }
    });

    return Object.values(dailyData)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(-30)
      .map((d) => ({
        date: format(new Date(d.date), "MMM dd"),
        confirmed: d.confirmed,
        delivered: d.delivered,
      }));
  }, [confirmations]);

  const aggregateStats = useMemo(() => {
    const totalConfirmations = confirmations.length;
    const confirmed = confirmations.filter((c) =>
      ["CONFIRMED", "IN_TRANSIT", "DELIVERED"].includes(c.status),
    ).length;
    const inTransit = confirmations.filter(
      (c) => c.status === "IN_TRANSIT",
    ).length;
    const delivered = confirmations.filter(
      (c) => c.status === "DELIVERED",
    ).length;

    return {
      totalConfirmations,
      confirmed,
      inTransit,
      delivered,
    };
  }, [confirmations]);

  useEffect(() => {
    if (!realTimeEnabled) return;

    const unsubscribe = realtimeSimulator.subscribe(
      "ship-confirmation-stats",
      (data: typeof realTimeStats) => {
        setRealTimeStats(data);
      },
    );

    const stop = realtimeSimulator.start(
      "ship-confirmation-stats",
      () => ({
        totalConfirmations: aggregateStats.totalConfirmations,
        confirmed: simulateKPIUpdates(aggregateStats.confirmed, 0.05),
        inTransit: simulateKPIUpdates(aggregateStats.inTransit, 0.1),
        delivered: simulateKPIUpdates(aggregateStats.delivered, 0.05),
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
    aggregateStats.totalConfirmations,
    aggregateStats.confirmed,
    aggregateStats.inTransit,
    aggregateStats.delivered,
  ]);

  const uniqueCarriers = useMemo(() => {
    return Array.from(new Set(confirmations.map((c) => c.carrierName))).sort();
  }, [confirmations]);

  const stats = [
    {
      label: "Total Confirmations",
      value: realTimeEnabled
        ? realTimeStats.totalConfirmations
        : aggregateStats.totalConfirmations,
      icon: "ri-ship-line",
      tooltip: "Total ship confirmations",
      trend: "up" as const,
    },
    {
      label: "Confirmed",
      value: realTimeEnabled
        ? realTimeStats.confirmed
        : aggregateStats.confirmed,
      icon: "ri-checkbox-circle-line",
      tooltip: "Confirmed shipments",
      trend: "up" as const,
    },
    {
      label: "In Transit",
      value: realTimeEnabled
        ? realTimeStats.inTransit
        : aggregateStats.inTransit,
      icon: "ri-road-map-line",
      tooltip: "Shipments in transit",
      trend: "neutral" as const,
    },
    {
      label: "Delivered",
      value: realTimeEnabled
        ? realTimeStats.delivered
        : aggregateStats.delivered,
      icon: "ri-truck-line",
      tooltip: "Delivered shipments",
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

  const handleView = (confirmation: ShipConfirmation) => {
    setSelectedConfirmation(confirmation);
    setShowViewModal(true);
  };

  const handleConfirm = (confirmation: ShipConfirmation) => {
    setSelectedConfirmation(confirmation);
    setShowConfirmModal(true);
  };

  const confirmShipment = () => {
    if (selectedConfirmation) {
      setConfirmations((prev) =>
        prev.map((c) =>
          c.id === selectedConfirmation.id
            ? {
                ...c,
                status: "CONFIRMED" as const,
                confirmedBy: "Current User",
                confirmedAt: new Date(),
                waybillNumber: `WB-${String(Math.floor(Math.random() * 1000000)).padStart(10, "0")}`,
                vehicleNumber: `VEH-${String(Math.floor(Math.random() * 1000) + 1).padStart(4, "0")}`,
                driverName: `Driver ${Math.floor(Math.random() * 20) + 1}`,
                driverPhone: `+971${Math.floor(Math.random() * 90000000 + 500000000)}`,
              }
            : c,
        ),
      );
      setShowConfirmModal(false);
      setSelectedConfirmation(null);
    }
  };

  return (
    <PageTemplate
      title="Ship Confirmation"
      description="Ship confirmation management with carrier integration, waybill generation, driver assignment, and shipment tracking"
      icon="ri-ship-line"
      systemInfo={{
        sap: "Ship Confirmation, Shipping Documents",
        oracle: "Ship Confirmation, Shipping Documents",
        manhattan: "Ship Confirmation, Shipping Documents",
      }}
      examples={[
        "Ship confirmation workflow",
        "Waybill generation",
        "Carrier integration",
        "Driver assignment",
        "Tracking integration",
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
            placeholder="Search ship confirmations..."
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
          <option value="IN_TRANSIT">In Transit</option>
          <option value="DELIVERED">Delivered</option>
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
          <option value="MANUAL">Manual</option>
          <option value="API">API</option>
          <option value="EDI">EDI</option>
          <option value="PORTAL">Portal</option>
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
                    Confirmation
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-[#9ca3af] uppercase tracking-wider">
                    Shipment
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-[#9ca3af] uppercase tracking-wider">
                    Sales Order
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-[#9ca3af] uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-[#9ca3af] uppercase tracking-wider">
                    Carrier
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-[#9ca3af] uppercase tracking-wider">
                    Ship Date
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
                {filteredConfirmations.map((confirmation, index) => (
                  <motion.tr
                    key={confirmation.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.02 }}
                    className="hover:bg-white/5 transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-white font-mono">
                        {confirmation.shipConfirmationNumber}
                      </div>
                      <div className="text-xs text-[#9ca3af]">
                        {format(
                          new Date(confirmation.shipDate),
                          "MMM dd, yyyy",
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() =>
                          router.push(
                            `/shipments?shipment=${confirmation.shipmentNumber}`,
                          )
                        }
                        className="text-sm text-cyan-400 hover:text-cyan-300 font-mono"
                      >
                        {confirmation.shipmentNumber}
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() =>
                          router.push(
                            `/sales-orders?so=${confirmation.soNumber}`,
                          )
                        }
                        className="text-sm text-cyan-400 hover:text-cyan-300 font-mono"
                      >
                        {confirmation.soNumber}
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-white">
                        {confirmation.customerName}
                      </div>
                      <div className="text-xs text-[#9ca3af] font-mono">
                        {confirmation.customerNumber}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-white">
                        {confirmation.carrierName}
                      </div>
                      <div className="text-xs text-[#9ca3af] font-mono">
                        {confirmation.carrierCode}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-white">
                        {format(
                          new Date(confirmation.shipDate),
                          "MMM dd, yyyy",
                        )}
                      </div>
                      {confirmation.confirmedAt && (
                        <div className="text-xs text-[#9ca3af]">
                          Confirmed:{" "}
                          {format(new Date(confirmation.confirmedAt), "MMM dd")}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${
                          confirmation.status === "DELIVERED"
                            ? "bg-green-500/20 text-green-400 border border-green-500/30"
                            : confirmation.status === "IN_TRANSIT"
                              ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                              : confirmation.status === "CONFIRMED"
                                ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30"
                                : confirmation.status === "PENDING"
                                  ? "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30"
                                  : "bg-red-500/20 text-red-400 border border-red-500/30"
                        }`}
                      >
                        {confirmation.status.replace(/_/g, " ")}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <Tooltip content="View Details" position="top">
                          <button
                            onClick={() => handleView(confirmation)}
                            className="p-2 bg-cyan-600/20 text-cyan-400 border border-cyan-500/30 rounded hover:bg-cyan-600/30 transition-colors"
                          >
                            <i className="ri-eye-line"></i>
                          </button>
                        </Tooltip>
                        {confirmation.status === "PENDING" && (
                          <Tooltip content="Confirm Shipment" position="top">
                            <button
                              onClick={() => handleConfirm(confirmation)}
                              className="p-2 bg-green-600/20 text-green-400 border border-green-500/30 rounded hover:bg-green-600/30 transition-colors"
                            >
                              <i className="ri-check-line"></i>
                            </button>
                          </Tooltip>
                        )}
                        {confirmation.trackingNumber && (
                          <Tooltip content="Track Shipment" position="top">
                            <button
                              onClick={() =>
                                router.push(
                                  `/tracking?tracking=${confirmation.trackingNumber}`,
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
          {filteredConfirmations.map((confirmation, index) => (
            <motion.div
              key={confirmation.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.03 }}
              className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-6 hover:border-cyan-500/50 hover:shadow-lg hover:shadow-cyan-500/10 transition-all"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-white mb-1 font-mono">
                    {confirmation.shipConfirmationNumber}
                  </h3>
                  <p className="text-sm text-[#9ca3af]">
                    {format(new Date(confirmation.shipDate), "MMM dd, yyyy")}
                  </p>
                </div>
                <span
                  className={`px-2 py-1 rounded text-xs font-medium ${
                    confirmation.status === "DELIVERED"
                      ? "bg-green-500/20 text-green-400"
                      : confirmation.status === "IN_TRANSIT"
                        ? "bg-blue-500/20 text-blue-400"
                        : confirmation.status === "CONFIRMED"
                          ? "bg-cyan-500/20 text-cyan-400"
                          : "bg-yellow-500/20 text-yellow-400"
                  }`}
                >
                  {confirmation.status.replace(/_/g, " ")}
                </span>
              </div>
              <div className="space-y-2 mb-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-[#9ca3af]">Shipment:</span>
                  <button
                    onClick={() =>
                      router.push(
                        `/shipments?shipment=${confirmation.shipmentNumber}`,
                      )
                    }
                    className="text-cyan-400 hover:text-cyan-300 font-mono text-xs"
                  >
                    {confirmation.shipmentNumber}
                  </button>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-[#9ca3af]">Sales Order:</span>
                  <button
                    onClick={() =>
                      router.push(`/sales-orders?so=${confirmation.soNumber}`)
                    }
                    className="text-cyan-400 hover:text-cyan-300 font-mono text-xs"
                  >
                    {confirmation.soNumber}
                  </button>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-[#9ca3af]">Customer:</span>
                  <span className="text-white text-xs">
                    {confirmation.customerName}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-[#9ca3af]">Carrier:</span>
                  <span className="text-white text-xs">
                    {confirmation.carrierName}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-[#9ca3af]">Method:</span>
                  <span className="text-white text-xs">
                    {confirmation.shippingMethod}
                  </span>
                </div>
                {confirmation.waybillNumber && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-[#9ca3af]">Waybill:</span>
                    <span className="text-white font-mono text-xs">
                      {confirmation.waybillNumber}
                    </span>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2 pt-4 border-t border-white/10">
                <button
                  onClick={() => handleView(confirmation)}
                  className="flex-1 px-3 py-2 bg-cyan-600/20 text-cyan-400 border border-cyan-500/30 rounded text-sm font-medium hover:bg-cyan-600/30 transition-colors"
                >
                  <i className="ri-eye-line mr-1"></i>
                  View
                </button>
                {confirmation.status === "PENDING" && (
                  <button
                    onClick={() => handleConfirm(confirmation)}
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
                Carrier Distribution
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={carrierDistribution.slice(0, 10)}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis
                    dataKey="carrier"
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
              Daily Ship Confirmation Trend
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
                  dataKey="confirmed"
                  stroke="#06b6d4"
                  strokeWidth={2}
                  name="Confirmed"
                />
                <Line
                  type="monotone"
                  dataKey="delivered"
                  stroke="#10b981"
                  strokeWidth={2}
                  name="Delivered"
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
          setSelectedConfirmation(null);
        }}
        title={`Ship Confirmation - ${selectedConfirmation?.shipConfirmationNumber || ""}`}
        size="lg"
      >
        {selectedConfirmation && (
          <div className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-[#9ca3af] mb-1">
                  Ship Confirmation Number
                </div>
                <div className="text-white font-medium font-mono">
                  {selectedConfirmation.shipConfirmationNumber}
                </div>
              </div>
              <div>
                <div className="text-sm text-[#9ca3af] mb-1">
                  Shipment Number
                </div>
                <button
                  onClick={() =>
                    router.push(
                      `/shipments?shipment=${selectedConfirmation.shipmentNumber}`,
                    )
                  }
                  className="text-cyan-400 hover:text-cyan-300 font-mono"
                >
                  {selectedConfirmation.shipmentNumber}
                </button>
              </div>
              <div>
                <div className="text-sm text-[#9ca3af] mb-1">Sales Order</div>
                <button
                  onClick={() =>
                    router.push(
                      `/sales-orders?so=${selectedConfirmation.soNumber}`,
                    )
                  }
                  className="text-cyan-400 hover:text-cyan-300 font-mono"
                >
                  {selectedConfirmation.soNumber}
                </button>
              </div>
              <div>
                <div className="text-sm text-[#9ca3af] mb-1">Status</div>
                <span
                  className={`px-2 py-1 rounded text-xs font-medium ${
                    selectedConfirmation.status === "DELIVERED"
                      ? "bg-green-500/20 text-green-400"
                      : selectedConfirmation.status === "IN_TRANSIT"
                        ? "bg-blue-500/20 text-blue-400"
                        : selectedConfirmation.status === "CONFIRMED"
                          ? "bg-cyan-500/20 text-cyan-400"
                          : "bg-yellow-500/20 text-yellow-400"
                  }`}
                >
                  {selectedConfirmation.status.replace(/_/g, " ")}
                </span>
              </div>
              <div>
                <div className="text-sm text-[#9ca3af] mb-1">Customer</div>
                <div className="text-white">
                  {selectedConfirmation.customerName}
                </div>
              </div>
              <div>
                <div className="text-sm text-[#9ca3af] mb-1">Carrier</div>
                <div className="text-white">
                  {selectedConfirmation.carrierName}
                </div>
              </div>
              <div>
                <div className="text-sm text-[#9ca3af] mb-1">Ship Date</div>
                <div className="text-white">
                  {format(new Date(selectedConfirmation.shipDate), "PPp")}
                </div>
              </div>
              {selectedConfirmation.confirmedAt && (
                <div>
                  <div className="text-sm text-[#9ca3af] mb-1">
                    Confirmed At
                  </div>
                  <div className="text-white">
                    {format(new Date(selectedConfirmation.confirmedAt), "PPp")}
                  </div>
                </div>
              )}
              {selectedConfirmation.waybillNumber && (
                <div>
                  <div className="text-sm text-[#9ca3af] mb-1">
                    Waybill Number
                  </div>
                  <div className="text-white font-mono">
                    {selectedConfirmation.waybillNumber}
                  </div>
                </div>
              )}
              {selectedConfirmation.trackingNumber && (
                <div>
                  <div className="text-sm text-[#9ca3af] mb-1">
                    Tracking Number
                  </div>
                  <button
                    onClick={() =>
                      router.push(
                        `/tracking?tracking=${selectedConfirmation.trackingNumber}`,
                      )
                    }
                    className="text-cyan-400 hover:text-cyan-300 font-mono"
                  >
                    {selectedConfirmation.trackingNumber}
                  </button>
                </div>
              )}
              {selectedConfirmation.vehicleNumber && (
                <div>
                  <div className="text-sm text-[#9ca3af] mb-1">
                    Vehicle Number
                  </div>
                  <div className="text-white font-mono">
                    {selectedConfirmation.vehicleNumber}
                  </div>
                </div>
              )}
              {selectedConfirmation.driverName && (
                <div>
                  <div className="text-sm text-[#9ca3af] mb-1">Driver</div>
                  <div className="text-white">
                    {selectedConfirmation.driverName}
                  </div>
                  {selectedConfirmation.driverPhone && (
                    <div className="text-xs text-[#9ca3af]">
                      {selectedConfirmation.driverPhone}
                    </div>
                  )}
                </div>
              )}
            </div>
            <div className="grid grid-cols-4 gap-3">
              <div className="p-3 bg-white/5 rounded-lg">
                <div className="text-xs text-[#9ca3af] mb-1">Total Items</div>
                <div className="text-lg font-semibold text-white">
                  {selectedConfirmation.totalItems}
                </div>
              </div>
              <div className="p-3 bg-white/5 rounded-lg">
                <div className="text-xs text-[#9ca3af] mb-1">Total Weight</div>
                <div className="text-lg font-semibold text-white">
                  {selectedConfirmation.totalWeight.toFixed(2)} kg
                </div>
              </div>
              <div className="p-3 bg-white/5 rounded-lg">
                <div className="text-xs text-[#9ca3af] mb-1">Total Volume</div>
                <div className="text-lg font-semibold text-white">
                  {selectedConfirmation.totalVolume.toFixed(2)} m³
                </div>
              </div>
              <div className="p-3 bg-white/5 rounded-lg">
                <div className="text-xs text-[#9ca3af] mb-1">Total Value</div>
                <div className="text-lg font-semibold text-white">
                  {selectedConfirmation.totalValue.toLocaleString()}{" "}
                  {selectedConfirmation.currency}
                </div>
              </div>
            </div>
            <div>
              <div className="text-sm text-[#9ca3af] mb-1">Shipping Method</div>
              <div className="text-white">
                {selectedConfirmation.shippingMethod}
              </div>
            </div>
            <div>
              <div className="text-sm text-[#9ca3af] mb-1">
                Confirmation Method
              </div>
              <div className="text-white">
                {selectedConfirmation.confirmationMethod}
              </div>
            </div>
            {selectedConfirmation.notes && (
              <div>
                <div className="text-sm text-[#9ca3af] mb-1">Notes</div>
                <div className="text-white">{selectedConfirmation.notes}</div>
              </div>
            )}
            <ModuleLinks
              links={[
                ...getShipmentLinks(selectedConfirmation.shipmentNumber),
                ...getSalesOrderLinks(selectedConfirmation.soNumber),
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
          setSelectedConfirmation(null);
        }}
        title="Confirm Shipment"
        size="md"
      >
        {selectedConfirmation && (
          <div className="space-y-4">
            <p className="text-white">
              Confirm shipment{" "}
              <strong>{selectedConfirmation.shipmentNumber}</strong>?
            </p>
            <div className="bg-white/5 rounded-lg p-4">
              <div className="text-sm text-[#9ca3af] mb-2">
                Shipment Details
              </div>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-[#9ca3af]">Customer:</span>
                  <span className="text-white">
                    {selectedConfirmation.customerName}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#9ca3af]">Carrier:</span>
                  <span className="text-white">
                    {selectedConfirmation.carrierName}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#9ca3af]">Items:</span>
                  <span className="text-white">
                    {selectedConfirmation.totalItems} items
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#9ca3af]">Weight:</span>
                  <span className="text-white">
                    {selectedConfirmation.totalWeight.toFixed(2)} kg
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={confirmShipment}
                className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
              >
                Confirm
              </button>
              <button
                onClick={() => {
                  setShowConfirmModal(false);
                  setSelectedConfirmation(null);
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
