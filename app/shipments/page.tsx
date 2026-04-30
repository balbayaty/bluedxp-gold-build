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
import { format as formatDate } from "date-fns";
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
import {
  exportService,
  type ExportFormat,
} from "@/lib/services/export/exportService";
import { useNotifications } from "@/lib/utils/notifications";
import { NotificationPatterns } from "@/lib/utils/notifications";
import { apiFetch } from "@/utils/apiFetch";
import type { Shipment } from "@/types/tms";
import QRCodeBadge from "@/components/qr/QRCodeBadge";
import UniversalQRGenerator from "@/components/qr/UniversalQRGenerator";

type ShipmentRow = Shipment & {
  // Optional legacy UI fields (may not exist in the domain model yet)
  soNumber?: string;
  customerNumber?: string;
  customerName?: string;
  carrierCode?: string;
  originLabel?: string;
  destinationLabel?: string;
  totalItems?: number;
  totalValue?: number;
  consolidationLevel?: "SINGLE" | "CONSOLIDATED" | "MASTER";
  consolidatedShipments?: string[];
  masterShipment?: string;
  lastUpdate?: Date | string;
};

export default function ShipmentsPage() {
  const router = useRouter();
  const notifications = useNotifications();
  const [shipments, setShipments] = useState<ShipmentRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");
  const [selectedCarrier, setSelectedCarrier] = useState<string>("ALL");
  const [selectedConsolidation, setSelectedConsolidation] =
    useState<string>("ALL");
  const [viewMode, setViewMode] = useState<
    "table" | "grid" | "analytics" | "consolidation"
  >("table");
  const [selectedShipment, setSelectedShipment] = useState<Shipment | null>(
    null,
  );
  const [showViewModal, setShowViewModal] = useState(false);
  const [realTimeEnabled, setRealTimeEnabled] = useState(true);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [realTimeStats, setRealTimeStats] = useState({
    totalShipments: 0,
    inTransit: 0,
    delivered: 0,
    totalValue: 0,
  });

  const filteredShipments = useMemo(() => {
    return shipments.filter((shipment) => {
      const matchesSearch =
        (shipment.trackingNumber || "")
          .toLowerCase()
          .includes(searchQuery.toLowerCase()) ||
        (shipment.shipmentNumber || "")
          .toLowerCase()
          .includes(searchQuery.toLowerCase()) ||
        (shipment.soNumber || "")
          .toLowerCase()
          .includes(searchQuery.toLowerCase()) ||
        (shipment.customerName || "")
          .toLowerCase()
          .includes(searchQuery.toLowerCase());
      const matchesStatus =
        selectedStatus === "ALL" || shipment.status === selectedStatus;
      const matchesCarrier =
        selectedCarrier === "ALL" ||
        shipment.carrierCode === selectedCarrier ||
        shipment.carrierName === selectedCarrier;
      const matchesConsolidation =
        selectedConsolidation === "ALL" ||
        shipment.consolidationLevel === selectedConsolidation;
      return (
        matchesSearch && matchesStatus && matchesCarrier && matchesConsolidation
      );
    });
  }, [
    shipments,
    searchQuery,
    selectedStatus,
    selectedCarrier,
    selectedConsolidation,
  ]);

  useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        setIsLoading(true);
        setLoadError(null);
        const res = await apiFetch("/api/transportation/shipments");
        const data = (await res.json()) as Shipment[];
        if (!mounted) return;
        setShipments((data || []) as ShipmentRow[]);
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

  // Analytics
  const statusDistribution = useMemo(() => {
    const counts: Record<string, number> = {};
    shipments.forEach((s) => {
      counts[s.status] = (counts[s.status] || 0) + 1;
    });
    return Object.entries(counts).map(([status, count]) => ({
      status: status.replace(/_/g, " "),
      count,
    }));
  }, [shipments]);

  const carrierDistribution = useMemo(() => {
    const counts: Record<string, { count: number; totalValue: number }> = {};
    shipments.forEach((s) => {
      if (!counts[s.carrierName]) {
        counts[s.carrierName] = { count: 0, totalValue: 0 };
      }
      counts[s.carrierName].count++;
      counts[s.carrierName].totalValue += s.totalValue;
    });
    return Object.entries(counts).map(([carrier, data]) => ({
      carrier,
      count: data.count,
      totalValue: data.totalValue,
    }));
  }, [shipments]);

  const dailyTrend = useMemo(() => {
    const dailyData: Record<
      string,
      { date: string; created: number; delivered: number }
    > = {};

    shipments.forEach((s) => {
      const date = formatDate(new Date(s.createdAt), "yyyy-MM-dd");
      if (!dailyData[date]) {
        dailyData[date] = { date, created: 0, delivered: 0 };
      }
      dailyData[date].created++;
      if (s.status === "DELIVERED") {
        dailyData[date].delivered++;
      }
    });

    return Object.values(dailyData)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .map((d) => ({
        date: formatDate(new Date(d.date), "MMM dd"),
        created: d.created,
        delivered: d.delivered,
      }));
  }, [shipments]);

  // Aggregate stats
  const aggregateStats = useMemo(() => {
    const total = shipments.length;
    const inTransit = shipments.filter((s) =>
      ["IN_TRANSIT", "OUT_FOR_DELIVERY"].includes(s.status),
    ).length;
    const delivered = shipments.filter((s) => s.status === "DELIVERED").length;
    const totalValue = shipments.reduce((sum, s) => sum + s.totalValue, 0);

    return {
      total,
      inTransit,
      delivered,
      totalValue,
    };
  }, [shipments]);

  // Real-time updates
  useEffect(() => {
    if (!realTimeEnabled) return;

    const unsubscribe = realtimeSimulator.subscribe(
      "shipment-stats",
      (data: typeof realTimeStats) => {
        setRealTimeStats(data);
      },
    );

    const stop = realtimeSimulator.start(
      "shipment-stats",
      () => ({
        totalShipments: aggregateStats.total,
        inTransit: simulateKPIUpdates(aggregateStats.inTransit, 0.1),
        delivered: simulateKPIUpdates(aggregateStats.delivered, 0.05),
        totalValue: simulateKPIUpdates(aggregateStats.totalValue, 0.05),
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
    aggregateStats.inTransit,
    aggregateStats.delivered,
    aggregateStats.totalValue,
  ]);

  // Simulate real-time status updates
  useEffect(() => {
    if (!realTimeEnabled) return;

    const interval = setInterval(() => {
      setShipments((prev) =>
        prev.map((s) => {
          if (
            ["CREATED", "PICKED_UP", "IN_TRANSIT", "OUT_FOR_DELIVERY"].includes(
              s.status,
            ) &&
            Math.random() < 0.05
          ) {
            const statuses: Shipment["status"][] = [
              "PICKED_UP",
              "IN_TRANSIT",
              "OUT_FOR_DELIVERY",
              "DELIVERED",
            ];
            const currentIndex = statuses.indexOf(s.status);
            const nextStatus =
              currentIndex < statuses.length - 1
                ? statuses[currentIndex + 1]
                : s.status;
            return {
              ...s,
              status: nextStatus,
              actualDelivery:
                nextStatus === "DELIVERED" ? new Date() : s.actualDelivery,
              lastUpdate: new Date(),
            };
          }
          return s;
        }),
      );
    }, 20000);

    return () => clearInterval(interval);
  }, [realTimeEnabled]);

  const uniqueCarriers = useMemo(() => {
    return Array.from(new Set(shipments.map((s) => s.carrierName)));
  }, [shipments]);

  const stats = [
    {
      label: "Total Shipments",
      value: realTimeEnabled
        ? realTimeStats.totalShipments
        : aggregateStats.total,
      icon: "ri-truck-line",
      tooltip: "Total shipments",
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
      icon: "ri-checkbox-circle-line",
      tooltip: "Delivered shipments",
      trend: "up" as const,
    },
    {
      label: "Total Value",
      value: `${(realTimeEnabled ? realTimeStats.totalValue : aggregateStats.totalValue).toLocaleString()} AED`,
      icon: "ri-money-dollar-circle-line",
      tooltip: "Total shipment value",
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

  const handleView = (shipment: Shipment) => {
    setSelectedShipment(shipment);
    setShowViewModal(true);
  };

  const handleTrack = (shipment: Shipment) => {
    router.push(`/tracking?tracking=${shipment.trackingNumber}`);
  };

  // Close export menu on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (showExportMenu && !target.closest(".relative")) {
        setShowExportMenu(false);
      }
    };
    if (showExportMenu) {
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [showExportMenu]);

  const handleExport = async (format: ExportFormat) => {
    setIsExporting(true);
    setShowExportMenu(false);

    try {
      const exportData = filteredShipments.map((shipment) => ({
        "Tracking Number": shipment.trackingNumber,
        "Shipment Number": shipment.shipmentNumber,
        "SO Number": shipment.soNumber,
        Customer: shipment.customerName,
        Carrier: shipment.carrierName,
        Status: shipment.status.replace(/_/g, " "),
        "Pickup Date": shipment.pickupDate
          ? formatDate(new Date(shipment.pickupDate), "yyyy-MM-dd")
          : "",
        "Estimated Delivery": shipment.estimatedDelivery
          ? formatDate(new Date(shipment.estimatedDelivery), "yyyy-MM-dd")
          : "",
        "Actual Delivery": shipment.actualDelivery
          ? formatDate(new Date(shipment.actualDelivery), "yyyy-MM-dd")
          : "",
        Origin: shipment.origin,
        Destination: shipment.destination,
        "Total Weight": shipment.totalWeight,
        "Total Volume": shipment.totalVolume,
        "Total Items": shipment.totalItems,
        "Total Value": shipment.totalValue,
        Currency: shipment.currency,
        "Consolidation Level": shipment.consolidationLevel || "SINGLE",
        "Created At": shipment.createdAt
          ? formatDate(new Date(shipment.createdAt), "yyyy-MM-dd")
          : "",
      }));

      const result = await exportService.exportAndDownload({
        format,
        filename: `shipments-export-${new Date().toISOString().split("T")[0]}`,
        title: "Shipments Export",
        description: `Exported ${exportData.length} shipments on ${new Date().toLocaleDateString()}`,
        data: exportData,
        columns: [
          { key: "Tracking Number", label: "Tracking Number", type: "string" },
          { key: "Shipment Number", label: "Shipment Number", type: "string" },
          { key: "SO Number", label: "SO Number", type: "string" },
          { key: "Customer", label: "Customer", type: "string" },
          { key: "Carrier", label: "Carrier", type: "string" },
          { key: "Status", label: "Status", type: "string" },
          { key: "Pickup Date", label: "Pickup Date", type: "date" },
          {
            key: "Estimated Delivery",
            label: "Estimated Delivery",
            type: "date",
          },
          { key: "Actual Delivery", label: "Actual Delivery", type: "date" },
          { key: "Origin", label: "Origin", type: "string" },
          { key: "Destination", label: "Destination", type: "string" },
          { key: "Total Weight", label: "Total Weight", type: "number" },
          { key: "Total Volume", label: "Total Volume", type: "number" },
          { key: "Total Items", label: "Total Items", type: "number" },
          {
            key: "Total Value",
            label: "Total Value",
            type: "currency",
            format: filteredShipments[0]?.currency || "SAR",
          },
          { key: "Currency", label: "Currency", type: "string" },
          {
            key: "Consolidation Level",
            label: "Consolidation Level",
            type: "string",
          },
        ],
        includeHeaders: true,
        includeTimestamp: true,
        includeMetadata: true,
        styling: {
          headerBgColor: "#1F2937",
          headerTextColor: "#FFFFFF",
          alternateRowColor: "#F3F4F6",
        },
      });

      if (!result.success) {
        alert(result.error || "Export failed");
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "Export failed";
      alert(errorMsg);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <PageTemplate
      title="Shipment Management"
      description="Comprehensive shipment management with consolidation, tracking, carrier management, and performance analytics"
      icon="ri-truck-line"
      systemInfo={{
        sap: "Shipment Management, Transportation",
        oracle: "Shipment Management, Logistics",
        manhattan: "Shipment Management, Consolidation",
      }}
      examples={[
        "Shipment consolidation",
        "Multi-carrier management",
        "Real-time tracking",
        "Performance analytics",
        "Exception handling",
        "POD management",
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
              onClick={() => setViewMode("consolidation")}
              className={`p-1.5 sm:p-2 rounded transition-colors ${
                viewMode === "consolidation"
                  ? "bg-cyan-500/20 text-cyan-400"
                  : "text-[#9ca3af] hover:text-white"
              }`}
              title="Consolidation View"
            >
              <i className="ri-stack-line text-sm sm:text-base"></i>
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
          <div className="relative">
            <button
              onClick={() => setShowExportMenu(!showExportMenu)}
              disabled={isExporting}
              className="px-3 sm:px-4 py-2 bg-white/5 border border-white/10 hover:bg-white/10 rounded-lg text-white text-xs sm:text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
            >
              <i
                className={`ri-${isExporting ? "loader-4-line animate-spin" : "download-line"} mr-1`}
              ></i>
              {isExporting ? "Exporting..." : "Export"}
              <i className="ri-arrow-down-s-line ml-1 text-xs"></i>
            </button>
            {showExportMenu && (
              <div className="absolute right-0 top-full mt-2 bg-gray-800 border border-white/10 rounded-lg shadow-xl z-50 min-w-[180px]">
                <button
                  onClick={() => handleExport("csv")}
                  className="w-full px-4 py-2 text-left text-sm text-white hover:bg-white/10 flex items-center gap-2 transition-colors"
                >
                  <i className="ri-file-text-line"></i>
                  Export as CSV
                </button>
                <button
                  onClick={() => handleExport("xlsx")}
                  className="w-full px-4 py-2 text-left text-sm text-white hover:bg-white/10 flex items-center gap-2 transition-colors"
                >
                  <i className="ri-file-excel-line"></i>
                  Export as Excel
                </button>
                <button
                  onClick={() => handleExport("pdf")}
                  className="w-full px-4 py-2 text-left text-sm text-white hover:bg-white/10 flex items-center gap-2 transition-colors"
                >
                  <i className="ri-file-pdf-line"></i>
                  Export as PDF
                </button>
                <button
                  onClick={() => handleExport("json")}
                  className="w-full px-4 py-2 text-left text-sm text-white hover:bg-white/10 flex items-center gap-2 transition-colors"
                >
                  <i className="ri-code-s-slash-line"></i>
                  Export as JSON
                </button>
              </div>
            )}
          </div>
          <button
            onClick={() => router.push("/tracking")}
            className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg text-xs sm:text-sm font-medium transition-colors flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20 whitespace-nowrap"
          >
            <i className="ri-map-pin-line"></i>
            <span className="hidden sm:inline">Track Shipments</span>
            <span className="sm:hidden">Track</span>
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
            placeholder="Search shipments..."
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
          <option value="CREATED">Created</option>
          <option value="PICKED_UP">Picked Up</option>
          <option value="IN_TRANSIT">In Transit</option>
          <option value="OUT_FOR_DELIVERY">Out for Delivery</option>
          <option value="DELIVERED">Delivered</option>
          <option value="EXCEPTION">Exception</option>
          <option value="RETURNED">Returned</option>
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
          value={selectedConsolidation}
          onChange={(e) => setSelectedConsolidation(e.target.value)}
          className="bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 min-w-[180px]"
        >
          <option value="ALL">All Types</option>
          <option value="SINGLE">Single</option>
          <option value="CONSOLIDATED">Consolidated</option>
          <option value="MASTER">Master</option>
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
                    Shipment
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-[#9ca3af] uppercase tracking-wider">
                    Order
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-[#9ca3af] uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-[#9ca3af] uppercase tracking-wider">
                    Carrier
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-[#9ca3af] uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-[#9ca3af] uppercase tracking-wider">
                    Route
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-[#9ca3af] uppercase tracking-wider">
                    Value
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-[#9ca3af] uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {filteredShipments.map((shipment, index) => (
                  <motion.tr
                    key={shipment.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.02 }}
                    className="hover:bg-white/5 transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-white font-mono">
                          {shipment.shipmentNumber}
                        </div>
                        <div className="text-xs text-[#9ca3af]">
                          {shipment.trackingNumber}
                        </div>
                        {shipment.consolidationLevel !== "SINGLE" && (
                          <span className="text-xs px-1 py-0.5 rounded bg-purple-500/20 text-purple-400 mt-1 inline-block">
                            {shipment.consolidationLevel}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() =>
                          router.push(`/sales-orders?so=${shipment.soNumber}`)
                        }
                        className="text-sm text-cyan-400 hover:text-cyan-300 font-mono"
                      >
                        {shipment.soNumber}
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-white">
                        {shipment.customerName}
                      </div>
                      <div className="text-xs text-[#9ca3af] font-mono">
                        {shipment.customerNumber}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-white">
                        {shipment.carrierName}
                      </div>
                      <div className="text-xs text-[#9ca3af] font-mono">
                        {shipment.carrierCode}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${
                          shipment.status === "DELIVERED"
                            ? "bg-green-500/20 text-green-400 border border-green-500/30"
                            : shipment.status === "IN_TRANSIT" ||
                                shipment.status === "OUT_FOR_DELIVERY"
                              ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                              : shipment.status === "EXCEPTION"
                                ? "bg-red-500/20 text-red-400 border border-red-500/30"
                                : shipment.status === "RETURNED"
                                  ? "bg-orange-500/20 text-orange-400 border border-orange-500/30"
                                  : "bg-gray-500/20 text-gray-400 border border-gray-500/30"
                        }`}
                      >
                        {shipment.status.replace(/_/g, " ")}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-xs text-white">
                          {shipment.origin}
                        </div>
                        <div className="text-xs text-[#9ca3af]">
                          → {shipment.destination}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-white font-medium">
                        {shipment.totalValue.toLocaleString()}{" "}
                        {shipment.currency}
                      </div>
                      <div className="text-xs text-[#9ca3af]">
                        {shipment.totalItems} items
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <Tooltip content="View Details" position="top">
                          <button
                            onClick={() => handleView(shipment)}
                            className="p-2 bg-cyan-600/20 text-cyan-400 border border-cyan-500/30 rounded hover:bg-cyan-600/30 transition-colors"
                          >
                            <i className="ri-eye-line"></i>
                          </button>
                        </Tooltip>
                        <Tooltip content="Track Shipment" position="top">
                          <button
                            onClick={() => handleTrack(shipment)}
                            className="p-2 bg-blue-600/20 text-blue-400 border border-blue-500/30 rounded hover:bg-blue-600/30 transition-colors"
                          >
                            <i className="ri-map-pin-line"></i>
                          </button>
                        </Tooltip>
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
          {filteredShipments.map((shipment, index) => (
            <motion.div
              key={shipment.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.03 }}
              className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-6 hover:border-cyan-500/50 hover:shadow-lg hover:shadow-cyan-500/10 transition-all"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-white mb-1 font-mono">
                    {shipment.shipmentNumber}
                  </h3>
                  <p className="text-sm text-[#9ca3af]">
                    {shipment.trackingNumber}
                  </p>
                </div>
                <span
                  className={`px-2 py-1 rounded text-xs font-medium ${
                    shipment.status === "DELIVERED"
                      ? "bg-green-500/20 text-green-400"
                      : shipment.status === "IN_TRANSIT" ||
                          shipment.status === "OUT_FOR_DELIVERY"
                        ? "bg-blue-500/20 text-blue-400"
                        : shipment.status === "EXCEPTION"
                          ? "bg-red-500/20 text-red-400"
                          : "bg-gray-500/20 text-gray-400"
                  }`}
                >
                  {shipment.status.replace(/_/g, " ")}
                </span>
              </div>
              <div className="space-y-2 mb-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-[#9ca3af]">Order:</span>
                  <button
                    onClick={() =>
                      router.push(`/sales-orders?so=${shipment.soNumber}`)
                    }
                    className="text-cyan-400 hover:text-cyan-300 font-mono text-xs"
                  >
                    {shipment.soNumber}
                  </button>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-[#9ca3af]">Customer:</span>
                  <span className="text-white">{shipment.customerName}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-[#9ca3af]">Carrier:</span>
                  <span className="text-white text-xs">
                    {shipment.carrierName}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-[#9ca3af]">Route:</span>
                  <span className="text-white text-xs">
                    {shipment.origin} → {shipment.destination}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-[#9ca3af]">Value:</span>
                  <span className="text-white font-medium">
                    {shipment.totalValue.toLocaleString()} {shipment.currency}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-[#9ca3af]">Items:</span>
                  <span className="text-white">{shipment.totalItems}</span>
                </div>
                {shipment.estimatedDelivery && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-[#9ca3af]">ETA:</span>
                    <span className="text-white text-xs">
                      {formatDate(
                        new Date(shipment.estimatedDelivery),
                        "MMM dd, HH:mm",
                      )}
                    </span>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2 pt-4 border-t border-white/10">
                <QRCodeBadge
                  entityId={shipment.id}
                  entityType="shipment"
                  entityName={shipment.shipmentNumber}
                  documentType="other"
                  documentUrl={`/shipments/${shipment.id}`}
                  module="tms"
                  size="sm"
                />
                <button
                  onClick={() => handleView(shipment)}
                  className="flex-1 px-3 py-2 bg-cyan-600/20 text-cyan-400 border border-cyan-500/30 rounded text-sm font-medium hover:bg-cyan-600/30 transition-colors"
                >
                  <i className="ri-eye-line mr-1"></i>
                  View
                </button>
                <button
                  onClick={() => handleTrack(shipment)}
                  className="px-3 py-2 bg-blue-600/20 text-blue-400 border border-blue-500/30 rounded text-sm font-medium hover:bg-blue-600/30 transition-colors"
                >
                  <i className="ri-map-pin-line"></i>
                </button>
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
                Carrier Performance
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
                    dataKey="count"
                    fill="#06b6d4"
                    name="Shipments"
                  />
                  <Bar
                    yAxisId="right"
                    dataKey="totalValue"
                    fill="#10b981"
                    name="Total Value"
                  />
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
              Daily Shipment Trend
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <ComposedChart data={dailyTrend}>
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
                <Bar dataKey="created" fill="#06b6d4" name="Created" />
                <Bar dataKey="delivered" fill="#10b981" name="Delivered" />
              </ComposedChart>
            </ResponsiveContainer>
          </motion.div>
        </div>
      )}

      {/* Consolidation View */}
      {viewMode === "consolidation" && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
        >
          <h3 className="text-lg font-semibold text-white mb-4">
            Shipment Consolidation
          </h3>
          <div className="space-y-4">
            {filteredShipments
              .filter((s) => s.consolidationLevel !== "SINGLE")
              .map((shipment) => (
                <div
                  key={shipment.id}
                  className="p-4 bg-white/5 rounded-lg border border-white/10"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <div className="text-sm font-medium text-white font-mono">
                        {shipment.shipmentNumber}
                      </div>
                      <div className="text-xs text-[#9ca3af]">
                        {shipment.consolidationLevel} Shipment
                      </div>
                    </div>
                    <span className="px-2 py-1 rounded text-xs bg-purple-500/20 text-purple-400">
                      {shipment.consolidationLevel}
                    </span>
                  </div>
                  <div className="text-sm text-[#9ca3af]">
                    Consolidates {shipment.consolidatedShipments?.length || 0}{" "}
                    shipments
                  </div>
                </div>
              ))}
            {filteredShipments.filter((s) => s.consolidationLevel === "SINGLE")
              .length > 0 && (
              <div className="mt-4 p-4 bg-white/5 rounded-lg border border-dashed border-white/10">
                <div className="text-sm text-[#9ca3af] text-center">
                  {
                    filteredShipments.filter(
                      (s) => s.consolidationLevel === "SINGLE",
                    ).length
                  }{" "}
                  single shipments available for consolidation
                </div>
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* View Modal */}
      <Modal
        isOpen={showViewModal}
        onClose={() => {
          setShowViewModal(false);
          setSelectedShipment(null);
        }}
        title={`Shipment Details - ${selectedShipment?.shipmentNumber || ""}`}
        size="lg"
      >
        {selectedShipment && (
          <div className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-[#9ca3af] mb-1">
                  Shipment Number
                </div>
                <div className="text-white font-medium font-mono">
                  {selectedShipment.shipmentNumber}
                </div>
              </div>
              <div>
                <div className="text-sm text-[#9ca3af] mb-1">
                  Tracking Number
                </div>
                <div className="text-white font-medium font-mono">
                  {selectedShipment.trackingNumber}
                </div>
              </div>
              <div>
                <div className="text-sm text-[#9ca3af] mb-1">Status</div>
                <span
                  className={`px-2 py-1 rounded text-xs font-medium ${
                    selectedShipment.status === "DELIVERED"
                      ? "bg-green-500/20 text-green-400"
                      : selectedShipment.status === "IN_TRANSIT" ||
                          selectedShipment.status === "OUT_FOR_DELIVERY"
                        ? "bg-blue-500/20 text-blue-400"
                        : selectedShipment.status === "EXCEPTION"
                          ? "bg-red-500/20 text-red-400"
                          : "bg-gray-500/20 text-gray-400"
                  }`}
                >
                  {selectedShipment.status.replace(/_/g, " ")}
                </span>
              </div>
              <div>
                <div className="text-sm text-[#9ca3af] mb-1">Consolidation</div>
                <div className="text-white">
                  {selectedShipment.consolidationLevel}
                </div>
              </div>
              <div>
                <div className="text-sm text-[#9ca3af] mb-1">Sales Order</div>
                <button
                  onClick={() =>
                    router.push(`/sales-orders?so=${selectedShipment.soNumber}`)
                  }
                  className="text-cyan-400 hover:text-cyan-300 font-mono"
                >
                  {selectedShipment.soNumber}
                </button>
              </div>
              <div>
                <div className="text-sm text-[#9ca3af] mb-1">Customer</div>
                <div className="text-white">
                  {selectedShipment.customerName}
                </div>
              </div>
              <div>
                <div className="text-sm text-[#9ca3af] mb-1">Carrier</div>
                <div className="text-white">{selectedShipment.carrierName}</div>
              </div>
              <div>
                <div className="text-sm text-[#9ca3af] mb-1">Total Value</div>
                <div className="text-white font-medium">
                  {selectedShipment.totalValue.toLocaleString()}{" "}
                  {selectedShipment.currency}
                </div>
              </div>
              <div>
                <div className="text-sm text-[#9ca3af] mb-1">Origin</div>
                <div className="text-white">{selectedShipment.origin}</div>
              </div>
              <div>
                <div className="text-sm text-[#9ca3af] mb-1">Destination</div>
                <div className="text-white">{selectedShipment.destination}</div>
              </div>
              <div>
                <div className="text-sm text-[#9ca3af] mb-1">Pickup Date</div>
                <div className="text-white">
                  {formatDate(new Date(selectedShipment.pickupDate), "PPp")}
                </div>
              </div>
              {selectedShipment.estimatedDelivery && (
                <div>
                  <div className="text-sm text-[#9ca3af] mb-1">
                    Estimated Delivery
                  </div>
                  <div className="text-white">
                    {formatDate(
                      new Date(selectedShipment.estimatedDelivery),
                      "PPp",
                    )}
                  </div>
                </div>
              )}
              {selectedShipment.actualDelivery && (
                <div>
                  <div className="text-sm text-[#9ca3af] mb-1">
                    Actual Delivery
                  </div>
                  <div className="text-white">
                    {formatDate(
                      new Date(selectedShipment.actualDelivery),
                      "PPp",
                    )}
                  </div>
                </div>
              )}
            </div>
            <div>
              <div className="text-sm text-[#9ca3af] mb-2">
                Shipment Details
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 bg-white/5 rounded-lg">
                  <div className="text-xs text-[#9ca3af] mb-1">Total Items</div>
                  <div className="text-lg font-semibold text-white">
                    {selectedShipment.totalItems}
                  </div>
                </div>
                <div className="p-3 bg-white/5 rounded-lg">
                  <div className="text-xs text-[#9ca3af] mb-1">
                    Total Weight
                  </div>
                  <div className="text-lg font-semibold text-white">
                    {selectedShipment.totalWeight.toFixed(2)} kg
                  </div>
                </div>
                <div className="p-3 bg-white/5 rounded-lg">
                  <div className="text-xs text-[#9ca3af] mb-1">
                    Total Volume
                  </div>
                  <div className="text-lg font-semibold text-white">
                    {selectedShipment.totalVolume.toFixed(2)} m³
                  </div>
                </div>
              </div>
            </div>
            <ModuleLinks
              links={[
                ...getShipmentLinks(selectedShipment.trackingNumber),
                ...getSalesOrderLinks(selectedShipment.soNumber),
              ]}
            />
          </div>
        )}
      </Modal>
    </PageTemplate>
  );
}
