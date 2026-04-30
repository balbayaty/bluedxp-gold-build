"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  getInboundDeliveries,
  createASN,
} from "@/app/actions/wms/inboundActions"; // Real Logic
import { format } from "date-fns";
import { ASNData, ASNStatus, OrderStatus } from "@/types/asn";
import { initializeSikaSLAsAndKPIs } from "@/data/sikaSLAs";
import { useViewContext } from "@/contexts/ViewContextProvider";
import { useAuth } from "@/contexts/AuthContext";
import {
  generateMultiTenantCustomers,
  generateMultiTenantWarehouses,
} from "@/utils/mockDataGenerators";
import CustomerSelector from "@/components/multi-tenant/CustomerSelector";
import WarehouseSelector from "@/components/multi-tenant/WarehouseSelector";
import InboundDetail from "./InboundDetail";
import PageTemplate from "@/components/PageTemplate";
import Tooltip from "@/components/Tooltip";
import {
  calculateInboundAnalytics,
  calculateRealTimeInboundMetrics,
} from "@/utils/inboundAnalytics";
import {
  realtimeSimulator,
  simulateKPIUpdates,
  simulateStatusChange,
} from "@/utils/realtimeDataSimulator";
import {
  LineChart,
  Line,
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
import { ASNTimelineView } from "./inbound/ASNTimelineView";

export default function InboundPage() {
  const { context } = useViewContext();
  const { user } = useAuth();
  const [asns, setAsns] = useState<ASNData[]>([]);
  const [allCustomers] = useState(() =>
    generateMultiTenantCustomers(20, user?.tenantId || "tenant-1"),
  );
  const [warehouses] = useState(() =>
    generateMultiTenantWarehouses(5, user?.tenantId || "tenant-1"),
  );
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");
  const [selectedTransportMode, setSelectedTransportMode] =
    useState<string>("ALL");
  const [selectedCrossBorder, setSelectedCrossBorder] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedASN, setSelectedASN] = useState<ASNData | null>(null);
  const [viewMode, setViewMode] = useState<
    "table" | "grid" | "analytics" | "realtime" | "timeline"
  >("table");
  const [showCreateASNModal, setShowCreateASNModal] = useState(false);
  const [realTimeStats, setRealTimeStats] = useState({
    totalASNs: 0,
    activeReceiving: 0,
    onTimeRate: 0,
    slaCompliance: 0,
  });

  // Initialize SIKA SLAs and KPIs on component mount
  useEffect(() => {
    initializeSikaSLAsAndKPIs();
  }, []);

  useEffect(() => {
    async function loadRealData() {
      try {
        const dbAsns = await getInboundDeliveries(user?.tenantId || "tenant-1");
        const mapped: ASNData[] = dbAsns.map(
          (d) =>
            ({
              id: d.id,
              documentNumber: d.documentNumber,
              vendorName: d.vendorName || "Unknown",
              vendorNumber: d.vendorId || "V-000",
              status: d.status as ASNStatus,
              expectedDeliveryDate: d.expectedDeliveryDate || new Date(),
              actualDeliveryDate: d.actualDeliveryDate,
              entity: "Global Trade",
              destination: "Riyadh Hub",
              totalItems: d.items.length,
              // Add other required fields with defaults
              priority: "MEDIUM",
              complianceStatus: "COMPLIANT",
              createdAt: d.createdAt,
              createdAt: d.createdAt,
              lastUpdate: d.updatedAt,
              items: d.items.map((item: any, idx: number) => ({
                id: item.id,
                asnId: d.id,
                lineNumber: idx + 1,
                materialNumber: item.material?.materialNumber || "UNKNOWN",
                materialDescription:
                  item.material?.description || "Unknown Material",
                quantity: item.expectedQty,
                receivedQuantity: item.receivedQty,
                unitOfMeasure: item.material?.baseUnitOfMeasure || "EA",
                expectedQuantity: item.expectedQty,
                openQuantity: item.expectedQty - item.receivedQty,
              })),
            }) as ASNData,
        );

        if (mapped.length > 0) {
          setAsns(mapped);
        } else {
          // If empty, keep empty or show seed?
          // Don't fallback to mock so we know it's real.
          setAsns([]);
        }
      } catch (e) {
        console.error("Real Data Fetch Failed", e);
      }
    }
    loadRealData();
  }, [user?.tenantId]);

  // Calculate analytics
  const analytics = useMemo(() => calculateInboundAnalytics(asns), [asns]);
  const realTimeMetrics = useMemo(
    () => calculateRealTimeInboundMetrics(asns),
    [asns],
  );

  // Real-time updates
  useEffect(() => {
    const unsubscribe = realtimeSimulator.subscribe(
      "inbound-stats",
      (data: typeof realTimeStats) => {
        setRealTimeStats(data);
      },
    );

    const stop = realtimeSimulator.start(
      "inbound-stats",
      () => ({
        totalASNs: simulateKPIUpdates(asns.length, 0.05),
        activeReceiving: simulateKPIUpdates(
          realTimeMetrics.activeReceiving,
          0.1,
        ),
        onTimeRate: simulateKPIUpdates(analytics.onTimeArrivalRate, 0.02),
        slaCompliance: simulateKPIUpdates(analytics.slaComplianceRate, 0.02),
      }),
      5000,
      true,
    );

    return () => {
      unsubscribe();
      stop();
    };
  }, [
    asns.length,
    realTimeMetrics.activeReceiving,
    analytics.onTimeArrivalRate,
    analytics.slaComplianceRate,
  ]);

  // Simulate real-time status changes
  useEffect(() => {
    const interval = setInterval(() => {
      setAsns((prev) =>
        prev.map((asn) => {
          if (asn.status === "IN_TRANSIT" && Math.random() < 0.05) {
            return { ...asn, status: "ARRIVED" as ASNStatus };
          }
          if (asn.status === "ARRIVED" && Math.random() < 0.03) {
            return { ...asn, status: "PARTIAL_GR" as ASNStatus };
          }
          return asn;
        }),
      );
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  const getStatusBadge = (status: ASNStatus | OrderStatus | string) => {
    const styles: Record<string, string> = {
      CREATED: "bg-gray-500/20 text-gray-400 border-gray-500/30",
      SENT: "bg-blue-500/20 text-blue-400 border-blue-500/30",
      ACKNOWLEDGED: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
      IN_TRANSIT: "bg-indigo-500/20 text-indigo-400 border-indigo-500/30",
      ARRIVED: "bg-purple-500/20 text-purple-400 border-purple-500/30",
      PARTIAL_GR: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
      GR_POSTED: "bg-green-500/20 text-green-400 border-green-500/30",
      INVOICED: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
      COMPLETED: "bg-teal-500/20 text-teal-400 border-teal-500/30",
      CANCELLED: "bg-red-500/20 text-red-400 border-red-500/30",
      BLOCKED: "bg-orange-500/20 text-orange-400 border-orange-500/30",
      CONFIRMED: "bg-blue-500/20 text-blue-400 border-blue-500/30",
      PICK_RELEASED: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
      PICKING: "bg-indigo-500/20 text-indigo-400 border-indigo-500/30",
      PICKED: "bg-purple-500/20 text-purple-400 border-purple-500/30",
      DISPATCHED: "bg-green-500/20 text-green-400 border-green-500/30",
      DELIVERED: "bg-teal-500/20 text-teal-400 border-teal-500/30",
    };
    return styles[status] || styles.CREATED;
  };

  const getStatusLabel = (status: ASNStatus | OrderStatus | string): string => {
    const labels: Record<string, string> = {
      CREATED: "Created",
      SENT: "Sent to Vendor",
      ACKNOWLEDGED: "Acknowledged",
      IN_TRANSIT: "In Transit",
      ARRIVED: "Arrived",
      PARTIAL_GR: "Partial GR",
      GR_POSTED: "GR Posted",
      INVOICED: "Invoiced",
      COMPLETED: "Completed",
      CANCELLED: "Cancelled",
      BLOCKED: "Blocked",
      CONFIRMED: "Confirmed",
      PICK_RELEASED: "Pick Released",
      PICKING: "Picking",
      PICKED: "Picked",
      DISPATCHED: "Dispatched",
      DELIVERED: "Delivered",
    };
    return labels[status] || String(status);
  };

  // Filter ASNs based on view context (customer filtering)
  const filteredAsns = useMemo(() => {
    let filtered = asns;

    // Filter by customer
    if (
      context.customerFilter.type !== "ALL" &&
      context.customerFilter.customerIds
    ) {
      const customerNumbers = allCustomers
        .filter((c) => context.customerFilter.customerIds?.includes(c.id))
        .map((c) => c.customerNumber);

      filtered = filtered.filter(
        (asn) =>
          asn.customerNumber && customerNumbers.includes(asn.customerNumber),
      );
    }

    // Apply search and status filters
    return filtered.filter((asn) => {
      const matchesSearch =
        asn.documentNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        asn.vendorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        asn.vendorNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        asn.purchaseOrderNumber
          ?.toLowerCase()
          .includes(searchQuery.toLowerCase()) ||
        asn.trackingNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        asn.customerNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        asn.customerName?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus =
        selectedStatus === "ALL" || asn.status === selectedStatus;

      // Transport mode filter
      const matchesTransportMode =
        selectedTransportMode === "ALL" ||
        (selectedTransportMode === "TRUCK" &&
          (asn.shipmentClassification === "FCL" ||
            asn.shipmentClassification === "LTL" ||
            asn.shipmentClassification === "LOCAL_DELIVERY")) ||
        (selectedTransportMode === "AIR" &&
          asn.shipmentClassification === "AIR_FREIGHT") ||
        (selectedTransportMode === "SEA" &&
          asn.shipmentClassification === "SEA_FREIGHT") ||
        (selectedTransportMode === "CROSS_BORDER" &&
          asn.shipmentClassification === "CROSS_BORDER");

      // Cross-border filter
      const matchesCrossBorder =
        selectedCrossBorder === "ALL" ||
        (selectedCrossBorder === "YES" &&
          asn.shipmentClassification === "CROSS_BORDER") ||
        (selectedCrossBorder === "NO" &&
          asn.shipmentClassification !== "CROSS_BORDER");

      return (
        matchesSearch &&
        matchesStatus &&
        matchesTransportMode &&
        matchesCrossBorder
      );
    });
  }, [
    asns,
    context.customerFilter,
    allCustomers,
    searchQuery,
    selectedStatus,
    selectedTransportMode,
    selectedCrossBorder,
  ]);

  // Stats for dashboard
  const stats = [
    {
      label: "Total ASNs",
      value: asns.length,
      icon: "ri-file-list-3-line",
      tooltip: "Total inbound ASNs",
      trend: "up" as const,
    },
    {
      label: "Active Receiving",
      value: realTimeMetrics.activeReceiving,
      icon: "ri-truck-line",
      tooltip: "Currently receiving shipments",
      trend: "neutral" as const,
    },
    {
      label: "On-Time Rate",
      value: `${analytics.onTimeArrivalRate.toFixed(1)}%`,
      icon: "ri-time-line",
      tooltip: "On-time arrival rate",
      trend: (analytics.onTimeArrivalRate > 95 ? "up" : "neutral") as
        | "up"
        | "neutral",
    },
    {
      label: "SLA Compliance",
      value: `${analytics.slaComplianceRate.toFixed(1)}%`,
      icon: "ri-checkbox-circle-line",
      tooltip: "SLA compliance rate",
      trend: (analytics.slaComplianceRate > 90 ? "up" : "neutral") as
        | "up"
        | "neutral",
    },
    {
      label: "Avg Processing",
      value: `${(analytics.averageProcessingTime / 3600).toFixed(1)}h`,
      icon: "ri-speed-line",
      tooltip: "Average processing time",
      trend: (analytics.averageProcessingTime < 4 * 3600 ? "up" : "neutral") as
        | "up"
        | "neutral",
    },
    {
      label: "Accuracy Rate",
      value: `${analytics.accuracyRate.toFixed(1)}%`,
      icon: "ri-target-line",
      tooltip: "Receiving accuracy rate",
      trend: (analytics.accuracyRate > 98 ? "up" : "neutral") as
        | "up"
        | "neutral",
    },
    {
      label: "Damage Rate",
      value: `${analytics.damageRate.toFixed(2)}%`,
      icon: "ri-error-warning-line",
      tooltip: "Damage rate",
      trend: (analytics.damageRate < 2 ? "up" : "neutral") as "up" | "neutral",
    },
    {
      label: "Throughput",
      value: `${analytics.throughput.toFixed(1)}/hr`,
      icon: "ri-dashboard-line",
      tooltip: "ASNs processed per hour",
      trend: "up" as const,
    },
  ];

  // Chart data
  const statusDistribution = Array.from(
    analytics.statusDistribution.entries(),
  ).map(([status, count]) => ({
    name: getStatusLabel(status),
    value: count,
    color: getStatusBadge(status).includes("green")
      ? "#10b981"
      : getStatusBadge(status).includes("blue")
        ? "#3b82f6"
        : getStatusBadge(status).includes("yellow")
          ? "#f59e0b"
          : getStatusBadge(status).includes("red")
            ? "#ef4444"
            : getStatusBadge(status).includes("purple")
              ? "#a855f7"
              : "#6b7280",
  }));

  const hourlyPerformanceData = analytics.hourlyPerformance.map((h) => ({
    hour: `${h.hour}:00`,
    arrivals: h.arrivals,
    completions: h.completions,
    avgTime: h.averageProcessingTime / 3600, // Convert to hours
  }));

  const vendorPerformanceData = analytics.topVendors.slice(0, 10).map((v) => ({
    vendor: v.vendorName.substring(0, 15),
    onTimeRate: v.onTimeRate,
    performanceScore: v.performanceScore,
    asnCount: v.asnCount,
  }));

  return (
    <PageTemplate
      title="World-Class Inbound Operations"
      description="Industry-leading inbound operations with multi-modal receiving, cross-border processing, advanced quality gates, real-time tracking, SLA compliance, and AI-powered putaway suggestions. Beats SAP, Oracle, Manhattan, and all top-tier WMS systems."
      icon="ri-inbox-line"
      systemInfo={{
        sap: "Inbound Delivery, Goods Receipt, ASN Processing, Putaway",
        oracle: "Receiving, Inbound Processing, ASN Management, Putaway",
        manhattan: "Inbound Management, Receiving, ASN Processing, Putaway",
      }}
      examples={[
        "Multi-modal receiving (Truck, Air, Sea, Rail)",
        "Cross-border ASN processing",
        "Advanced quality gates and inspection",
        "Real-time receiving dashboard",
        "AI-powered putaway suggestions",
        "SLA compliance tracking",
        "Document management",
        "Exception handling and alerts",
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
              onClick={() => setViewMode("timeline")}
              className={`p-1.5 sm:p-2 rounded transition-colors ${
                viewMode === "timeline"
                  ? "bg-cyan-500/20 text-cyan-400"
                  : "text-[#9ca3af] hover:text-white"
              }`}
              title="Timeline View"
            >
              <i className="ri-time-line text-sm sm:text-base"></i>
            </button>
          </div>
          <button
            onClick={() => setShowCreateASNModal(true)}
            className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg text-xs sm:text-sm font-medium transition-colors flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20 whitespace-nowrap"
          >
            <i className="ri-add-line"></i>
            <span className="hidden sm:inline">Create ASN</span>
            <span className="sm:hidden">Create</span>
          </button>
        </div>
      }
    >
      {/* Multi-Tenant Filters */}
      <div className="mb-4 sm:mb-6 flex items-center gap-3 flex-wrap">
        <CustomerSelector
          customers={allCustomers}
          className="min-w-[180px] flex-shrink-0"
        />
        <WarehouseSelector
          warehouses={warehouses}
          className="min-w-[180px] flex-shrink-0"
        />
      </div>

      {/* Filters */}
      <div className="mb-4 sm:mb-6 flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
        <div className="relative flex-1 w-full sm:min-w-[200px] sm:max-w-md">
          <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-[#9ca3af] text-sm z-10"></i>
          <input
            type="text"
            placeholder="Search by Document Number, Vendor, PO Number, Tracking, Customer..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-lg pl-10 pr-4 py-2.5 text-sm text-white placeholder-[#6b7280] focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all"
          />
        </div>
        <select
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
          className="bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 w-full sm:w-auto sm:min-w-[160px] relative z-20"
        >
          <option value="ALL">All Status</option>
          <option value="CREATED">Created</option>
          <option value="SENT">Sent to Vendor</option>
          <option value="ACKNOWLEDGED">Acknowledged</option>
          <option value="IN_TRANSIT">In Transit</option>
          <option value="ARRIVED">Arrived</option>
          <option value="PARTIAL_GR">Partial GR</option>
          <option value="GR_POSTED">GR Posted</option>
          <option value="INVOICED">Invoiced</option>
          <option value="COMPLETED">Completed</option>
          <option value="BLOCKED">Blocked</option>
          <option value="CANCELLED">Cancelled</option>
        </select>
        <select
          value={selectedTransportMode}
          onChange={(e) => setSelectedTransportMode(e.target.value)}
          className="bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 w-full sm:w-auto sm:min-w-[160px]"
          title="Filter by Transport Mode"
        >
          <option value="ALL">All Transport Modes</option>
          <option value="TRUCK">Truck</option>
          <option value="AIR">Air Freight</option>
          <option value="SEA">Sea Freight</option>
          <option value="CROSS_BORDER">Cross-Border</option>
        </select>
        <select
          value={selectedCrossBorder}
          onChange={(e) => setSelectedCrossBorder(e.target.value)}
          className="bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 w-full sm:w-auto sm:min-w-[140px]"
          title="Filter by Cross-Border"
        >
          <option value="ALL">All Shipments</option>
          <option value="YES">Cross-Border</option>
          <option value="NO">Local</option>
        </select>
      </div>

      {/* View Modes */}
      {filteredAsns.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center justify-center py-16 px-6 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl"
        >
          <div className="mb-6">
            <i className="ri-file-list-3-line text-8xl text-[#6b7280]"></i>
          </div>
          <h3 className="text-2xl font-semibold text-white mb-2">
            No Inbound Shipments Found
          </h3>
          <p className="text-[#9ca3af] text-base mb-8 text-center max-w-md">
            You don't have any inbound shipments yet. Create an ASN to get
            started.
          </p>
          <button
            onClick={() => setShowCreateASNModal(true)}
            className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white px-6 py-3 rounded-lg text-base font-medium transition-colors flex items-center gap-2 shadow-lg shadow-cyan-500/20"
          >
            <i className="ri-add-line text-lg"></i>
            Create Your First ASN
          </button>
        </motion.div>
      ) : viewMode === "grid" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredAsns.map((asn, index) => (
            <motion.div
              key={asn.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 hover:border-cyan-500/50 hover:shadow-lg hover:shadow-cyan-500/20 transition-all cursor-pointer"
              onClick={() => setSelectedASN(asn)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 space-y-3">
                  {/* Document Header */}
                  <div className="flex items-center gap-4">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-lg font-semibold text-white">
                          {asn.documentNumber}
                        </h3>
                        {asn.isUrgent && (
                          <span className="px-2 py-1 bg-red-500/20 text-red-400 border border-red-500/30 rounded text-xs font-medium flex items-center gap-1">
                            <i className="ri-alert-line"></i>
                            URGENT
                          </span>
                        )}
                        {/* Transport Mode Badge */}
                        {asn.shipmentClassification && (
                          <span
                            className={`px-2 py-1 rounded text-xs font-medium ${
                              asn.shipmentClassification === "AIR_FREIGHT"
                                ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                                : asn.shipmentClassification === "SEA_FREIGHT"
                                  ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30"
                                  : asn.shipmentClassification ===
                                      "CROSS_BORDER"
                                    ? "bg-purple-500/20 text-purple-400 border border-purple-500/30"
                                    : "bg-green-500/20 text-green-400 border border-green-500/30"
                            }`}
                          >
                            <i
                              className={`${
                                asn.shipmentClassification === "AIR_FREIGHT"
                                  ? "ri-plane-line"
                                  : asn.shipmentClassification === "SEA_FREIGHT"
                                    ? "ri-ship-line"
                                    : asn.shipmentClassification ===
                                        "CROSS_BORDER"
                                      ? "ri-global-line"
                                      : "ri-truck-line"
                              } mr-1`}
                            ></i>
                            {asn.shipmentClassification === "AIR_FREIGHT"
                              ? "AIR"
                              : asn.shipmentClassification === "SEA_FREIGHT"
                                ? "SEA"
                                : asn.shipmentClassification === "CROSS_BORDER"
                                  ? "CROSS-BORDER"
                                  : "TRUCK"}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-[#9ca3af]">
                        ASN Document Number
                      </p>
                    </div>
                    {asn.purchaseOrderNumber && (
                      <div className="border-l border-[#374151] pl-4">
                        <p className="text-sm font-medium text-white mb-1">
                          {asn.purchaseOrderNumber}
                        </p>
                        <p className="text-xs text-[#9ca3af]">Purchase Order</p>
                      </div>
                    )}
                    <div className="ml-auto">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusBadge(asn.status)}`}
                      >
                        {getStatusLabel(asn.status)}
                      </span>
                    </div>
                  </div>

                  {/* Vendor Information */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-[#9ca3af] mb-1">Vendor</p>
                      <p className="text-sm font-medium text-white">
                        {asn.vendorName}
                      </p>
                      <p className="text-xs text-cyan-400 font-mono">
                        {asn.vendorNumber}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-[#9ca3af] mb-1">Destination</p>
                      <p className="text-sm font-medium text-white">
                        {asn.destination}
                      </p>
                      {asn.plant && (
                        <p className="text-xs text-cyan-400">
                          Plant: {asn.plant}
                        </p>
                      )}
                    </div>
                  </div>
                  {asn.deliveryType && (
                    <div className="mt-3 pt-3 border-t border-white/10">
                      <div className="flex items-center gap-2">
                        {asn.deliveryType === "EX_WORKS" ? (
                          <i className="ri-truck-line text-orange-400"></i>
                        ) : (
                          <i className="ri-store-line text-green-400"></i>
                        )}
                        <p className="text-xs text-[#9ca3af]">Delivery Type:</p>
                        <span
                          className={`px-2 py-0.5 rounded text-xs font-medium ${
                            asn.deliveryType === "EX_WORKS"
                              ? "bg-orange-500/20 text-orange-400 border border-orange-500/30"
                              : "bg-green-500/20 text-green-400 border border-green-500/30"
                          }`}
                        >
                          {asn.deliveryType === "EX_WORKS"
                            ? "Ex-Works"
                            : "Vendor Delivery"}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Delivery Information */}
                  <div className="grid grid-cols-2 gap-4 pt-3 border-t border-white/10">
                    <div>
                      <p className="text-xs text-[#9ca3af] mb-1">
                        Expected Arrival
                      </p>
                      <p className="text-sm text-white">
                        {asn.expectedDeliveryDate
                          ? format(
                              new Date(asn.expectedDeliveryDate),
                              "MMM dd, yyyy HH:mm",
                            )
                          : "N/A"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-[#9ca3af] mb-1">
                        Actual Arrival
                      </p>
                      <p className="text-sm text-white">
                        {asn.actualDeliveryDate
                          ? format(
                              new Date(asn.actualDeliveryDate),
                              "MMM dd, yyyy HH:mm",
                            )
                          : asn.vehicleArrivalDate
                            ? format(
                                new Date(asn.vehicleArrivalDate),
                                "MMM dd, yyyy HH:mm",
                              )
                            : "Not Arrived"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-[#9ca3af] mb-1">
                        Planned GR Date
                      </p>
                      <p className="text-sm text-white">
                        {asn.plannedGoodsReceiptDate
                          ? format(
                              new Date(asn.plannedGoodsReceiptDate),
                              "MMM dd, yyyy",
                            )
                          : "N/A"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-[#9ca3af] mb-1">
                        Goods Receipt Date
                      </p>
                      <p className="text-sm text-white">
                        {asn.goodsReceiptDate
                          ? format(
                              new Date(asn.goodsReceiptDate),
                              "MMM dd, yyyy HH:mm",
                            )
                          : "Not Posted"}
                      </p>
                    </div>
                  </div>

                  {/* Shipment Information */}
                  <div className="grid grid-cols-2 gap-4 pt-3 border-t border-white/10">
                    <div>
                      <p className="text-xs text-[#9ca3af] mb-1">Destination</p>
                      <p className="text-sm text-white">{asn.destination}</p>
                    </div>
                    {asn.trackingNumber && (
                      <div>
                        <p className="text-xs text-[#9ca3af] mb-1">
                          Tracking Number
                        </p>
                        <p className="text-sm text-white font-mono">
                          {asn.trackingNumber}
                        </p>
                      </div>
                    )}
                    {asn.carrier && (
                      <div>
                        <p className="text-xs text-[#9ca3af] mb-1">Carrier</p>
                        <p className="text-sm text-white">{asn.carrier}</p>
                      </div>
                    )}
                    {asn.vehicleId && (
                      <div>
                        <p className="text-xs text-[#9ca3af] mb-1">
                          Vehicle ID
                        </p>
                        <p className="text-sm text-white font-mono">
                          {asn.vehicleId}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Material Information */}
                  {(asn.totalQuantity || asn.totalWeight || asn.totalItems) && (
                    <div className="grid grid-cols-2 gap-4 pt-3 border-t border-white/10">
                      {asn.totalQuantity && (
                        <div>
                          <p className="text-xs text-[#9ca3af] mb-1">
                            Total Quantity
                          </p>
                          <p className="text-sm text-white">
                            {asn.totalQuantity} {asn.baseUnit || "EA"}
                          </p>
                        </div>
                      )}
                      {asn.totalWeight && (
                        <div>
                          <p className="text-xs text-[#9ca3af] mb-1">
                            Total Weight
                          </p>
                          <p className="text-sm text-white">
                            {asn.totalWeight} kg
                          </p>
                        </div>
                      )}
                      {asn.totalItems && (
                        <div>
                          <p className="text-xs text-[#9ca3af] mb-1">
                            Total Items
                          </p>
                          <p className="text-sm text-white">{asn.totalItems}</p>
                        </div>
                      )}
                      {asn.totalVolume && (
                        <div>
                          <p className="text-xs text-[#9ca3af] mb-1">
                            Total Volume
                          </p>
                          <p className="text-sm text-white">
                            {asn.totalVolume} m³
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex items-center gap-2 pt-3 border-t border-white/10">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedASN(asn);
                      }}
                      className="px-3 py-1.5 bg-cyan-600/20 text-cyan-400 border border-cyan-500/30 rounded text-xs font-medium hover:bg-cyan-600/30 transition-colors"
                    >
                      <i className="ri-eye-line mr-1"></i>
                      View Details
                    </button>
                    {asn.slaCompliancePercentage !== undefined && (
                      <div className="ml-auto flex items-center gap-2">
                        <div className="text-xs text-[#9ca3af]">SLA:</div>
                        <div
                          className={`text-xs font-medium ${
                            asn.slaCompliancePercentage <= 80
                              ? "text-green-400"
                              : asn.slaCompliancePercentage <= 100
                                ? "text-yellow-400"
                                : "text-red-400"
                          }`}
                        >
                          {asn.slaCompliancePercentage.toFixed(0)}%
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      ) : viewMode === "table" ? (
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden w-full">
          <div className="overflow-x-auto w-full">
            <table className="w-full min-w-[1000px]">
              <thead className="bg-white/5 border-b border-white/10">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium text-[#9ca3af] uppercase tracking-wider">
                    ASN Number
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-[#9ca3af] uppercase tracking-wider">
                    Vendor
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-[#9ca3af] uppercase tracking-wider">
                    PO Number
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-[#9ca3af] uppercase tracking-wider">
                    Expected Arrival
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-[#9ca3af] uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-[#9ca3af] uppercase tracking-wider">
                    Quantity
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-[#9ca3af] uppercase tracking-wider">
                    SLA Compliance
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-[#9ca3af] uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {filteredAsns.map((asn, index) => (
                  <motion.tr
                    key={asn.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.02 }}
                    className="hover:bg-white/5 transition-colors cursor-pointer"
                    onClick={() => setSelectedASN(asn)}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Tooltip
                        content={`ASN: ${asn.documentNumber}`}
                        position="right"
                      >
                        <span className="text-sm font-medium text-white font-mono cursor-help">
                          {asn.documentNumber}
                        </span>
                      </Tooltip>
                      {asn.isUrgent && (
                        <span className="ml-2 px-1.5 py-0.5 bg-red-500/20 text-red-400 border border-red-500/30 rounded text-xs">
                          URGENT
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-white">{asn.vendorName}</div>
                      <div className="text-xs text-[#9ca3af] font-mono">
                        {asn.vendorNumber}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-white font-mono">
                        {asn.purchaseOrderNumber || "N/A"}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-white">
                        {asn.expectedDeliveryDate
                          ? format(
                              new Date(asn.expectedDeliveryDate),
                              "MMM dd, yyyy HH:mm",
                            )
                          : "N/A"}
                      </div>
                      {asn.vehicleArrivalDate && (
                        <div className="text-xs text-cyan-400">
                          Arrived:{" "}
                          {format(
                            new Date(asn.vehicleArrivalDate),
                            "MMM dd HH:mm",
                          )}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium border ${getStatusBadge(asn.status)}`}
                      >
                        {getStatusLabel(asn.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-white font-medium">
                        {asn.totalQuantity
                          ? `${asn.totalQuantity} ${asn.baseUnit || "EA"}`
                          : "N/A"}
                      </div>
                      {asn.receivedQuantity && (
                        <div className="text-xs text-cyan-400">
                          Received: {asn.receivedQuantity}{" "}
                          {asn.baseUnit || "EA"}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {asn.slaCompliancePercentage !== undefined ? (
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-white/10 rounded-full h-2 min-w-[60px]">
                            <div
                              className={`h-2 rounded-full transition-all ${
                                asn.slaCompliancePercentage <= 80
                                  ? "bg-green-500"
                                  : asn.slaCompliancePercentage <= 100
                                    ? "bg-yellow-500"
                                    : "bg-red-500"
                              }`}
                              style={{
                                width: `${Math.min(100, asn.slaCompliancePercentage)}%`,
                              }}
                            ></div>
                          </div>
                          <span
                            className={`text-xs font-medium ${
                              asn.slaCompliancePercentage <= 80
                                ? "text-green-400"
                                : asn.slaCompliancePercentage <= 100
                                  ? "text-yellow-400"
                                  : "text-red-400"
                            }`}
                          >
                            {asn.slaCompliancePercentage.toFixed(0)}%
                          </span>
                        </div>
                      ) : (
                        <span className="text-xs text-[#9ca3af]">N/A</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <Tooltip content="View Details" position="top">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedASN(asn);
                            }}
                            className="p-2 bg-cyan-600/20 text-cyan-400 border border-cyan-500/30 rounded hover:bg-cyan-600/30 transition-colors"
                          >
                            <i className="ri-eye-line"></i>
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
      ) : viewMode === "analytics" ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Status Distribution */}
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
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
                  label={({ name, percent }) =>
                    `${name} ${(percent * 100).toFixed(0)}%`
                  }
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {statusDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <RechartsTooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Vendor Performance */}
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4">
              Top Vendor Performance
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={vendorPerformanceData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis
                  dataKey="vendor"
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
                  dataKey="onTimeRate"
                  fill="#06b6d4"
                  name="On-Time Rate %"
                />
                <Bar
                  dataKey="performanceScore"
                  fill="#10b981"
                  name="Performance Score"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Hourly Performance */}
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 lg:col-span-2">
            <h3 className="text-lg font-semibold text-white mb-4">
              Hourly Performance
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={hourlyPerformanceData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="hour" stroke="#9ca3af" fontSize={12} />
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
                  dataKey="arrivals"
                  stroke="#06b6d4"
                  name="Arrivals"
                  strokeWidth={2}
                />
                <Line
                  type="monotone"
                  dataKey="completions"
                  stroke="#10b981"
                  name="Completions"
                  strokeWidth={2}
                />
                <Line
                  type="monotone"
                  dataKey="avgTime"
                  stroke="#f59e0b"
                  name="Avg Time (hrs)"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Modal Performance */}
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 lg:col-span-2">
            <h3 className="text-lg font-semibold text-white mb-4">
              Transportation Mode Performance
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white/5 rounded-lg p-4">
                <div className="text-sm text-[#9ca3af] mb-1">Truck</div>
                <div className="text-2xl font-bold text-white">
                  {analytics.modalPerformance.truck.count}
                </div>
                <div className="text-xs text-cyan-400 mt-1">
                  Avg:{" "}
                  {(analytics.modalPerformance.truck.avgTime / 3600).toFixed(1)}
                  h
                </div>
              </div>
              <div className="bg-white/5 rounded-lg p-4">
                <div className="text-sm text-[#9ca3af] mb-1">Air</div>
                <div className="text-2xl font-bold text-white">
                  {analytics.modalPerformance.air.count}
                </div>
                <div className="text-xs text-cyan-400 mt-1">
                  Avg:{" "}
                  {(analytics.modalPerformance.air.avgTime / 3600).toFixed(1)}h
                </div>
              </div>
              <div className="bg-white/5 rounded-lg p-4">
                <div className="text-sm text-[#9ca3af] mb-1">Sea</div>
                <div className="text-2xl font-bold text-white">
                  {analytics.modalPerformance.sea.count}
                </div>
                <div className="text-xs text-cyan-400 mt-1">
                  Avg:{" "}
                  {(analytics.modalPerformance.sea.avgTime / 3600).toFixed(1)}h
                </div>
              </div>
              <div className="bg-white/5 rounded-lg p-4">
                <div className="text-sm text-[#9ca3af] mb-1">Rail</div>
                <div className="text-2xl font-bold text-white">
                  {analytics.modalPerformance.rail.count}
                </div>
                <div className="text-xs text-cyan-400 mt-1">
                  Avg:{" "}
                  {(analytics.modalPerformance.rail.avgTime / 3600).toFixed(1)}h
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : viewMode === "realtime" ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Real-time Metrics */}
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4">
              Real-Time Metrics
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
                <div>
                  <div className="text-sm text-[#9ca3af]">Active Receiving</div>
                  <div className="text-2xl font-bold text-white">
                    {realTimeMetrics.activeReceiving}
                  </div>
                </div>
                <i className="ri-truck-line text-3xl text-cyan-400"></i>
              </div>
              <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
                <div>
                  <div className="text-sm text-[#9ca3af]">Expected Today</div>
                  <div className="text-2xl font-bold text-white">
                    {realTimeMetrics.expectedToday}
                  </div>
                </div>
                <i className="ri-calendar-line text-3xl text-blue-400"></i>
              </div>
              <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
                <div>
                  <div className="text-sm text-[#9ca3af]">Arrived Today</div>
                  <div className="text-2xl font-bold text-white">
                    {realTimeMetrics.arrivedToday}
                  </div>
                </div>
                <i className="ri-checkbox-circle-line text-3xl text-green-400"></i>
              </div>
              <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
                <div>
                  <div className="text-sm text-[#9ca3af]">Completed Today</div>
                  <div className="text-2xl font-bold text-white">
                    {realTimeMetrics.completedToday}
                  </div>
                </div>
                <i className="ri-check-double-line text-3xl text-emerald-400"></i>
              </div>
              <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
                <div>
                  <div className="text-sm text-[#9ca3af]">Avg Wait Time</div>
                  <div className="text-2xl font-bold text-white">
                    {realTimeMetrics.averageWaitTime.toFixed(1)} min
                  </div>
                </div>
                <i className="ri-time-line text-3xl text-yellow-400"></i>
              </div>
              <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
                <div>
                  <div className="text-sm text-[#9ca3af]">Efficiency Trend</div>
                  <div
                    className={`text-2xl font-bold ${
                      realTimeMetrics.efficiencyTrend === "UP"
                        ? "text-green-400"
                        : realTimeMetrics.efficiencyTrend === "DOWN"
                          ? "text-red-400"
                          : "text-yellow-400"
                    }`}
                  >
                    {realTimeMetrics.efficiencyTrend}
                  </div>
                </div>
                <i
                  className={`ri-arrow-${realTimeMetrics.efficiencyTrend === "UP" ? "up" : realTimeMetrics.efficiencyTrend === "DOWN" ? "down" : "right"}-line text-3xl ${
                    realTimeMetrics.efficiencyTrend === "UP"
                      ? "text-green-400"
                      : realTimeMetrics.efficiencyTrend === "DOWN"
                        ? "text-red-400"
                        : "text-yellow-400"
                  }`}
                ></i>
              </div>
            </div>
          </div>

          {/* Active ASNs */}
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4">
              Active Receiving
            </h3>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {filteredAsns
                .filter(
                  (a) =>
                    a.status === "ARRIVED" ||
                    a.status === "PARTIAL_GR" ||
                    a.status === "IN_TRANSIT",
                )
                .slice(0, 10)
                .map((asn) => (
                  <motion.div
                    key={asn.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 bg-white/5 rounded-lg border border-white/10 hover:border-cyan-500/50 transition-colors cursor-pointer"
                    onClick={() => setSelectedASN(asn)}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm font-medium text-white font-mono">
                          {asn.documentNumber}
                        </div>
                        <div className="text-xs text-[#9ca3af]">
                          {asn.vendorName}
                        </div>
                        {asn.vehicleArrivalDate && (
                          <div className="text-xs text-cyan-400 mt-1">
                            Arrived:{" "}
                            {format(new Date(asn.vehicleArrivalDate), "HH:mm")}
                          </div>
                        )}
                      </div>
                      <div className="text-right">
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium border ${getStatusBadge(asn.status)}`}
                        >
                          {getStatusLabel(asn.status)}
                        </span>
                        {asn.slaCompliancePercentage !== undefined && (
                          <div
                            className={`text-xs mt-1 ${
                              asn.slaCompliancePercentage <= 80
                                ? "text-green-400"
                                : asn.slaCompliancePercentage <= 100
                                  ? "text-yellow-400"
                                  : "text-red-400"
                            }`}
                          >
                            SLA: {asn.slaCompliancePercentage.toFixed(0)}%
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
            </div>
          </div>

          {/* Bottleneck Vendors */}
          {realTimeMetrics.bottleneckVendors.length > 0 && (
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 lg:col-span-2">
              <h3 className="text-lg font-semibold text-white mb-4">
                Bottleneck Vendors
              </h3>
              <div className="flex flex-wrap gap-3">
                {realTimeMetrics.bottleneckVendors.map((vendorNumber) => {
                  const vendor = asns.find(
                    (a) => a.vendorNumber === vendorNumber,
                  );
                  return vendor ? (
                    <div
                      key={vendorNumber}
                      className="px-4 py-2 bg-orange-500/20 text-orange-400 border border-orange-500/30 rounded-lg"
                    >
                      <div className="text-sm font-medium">
                        {vendor.vendorName}
                      </div>
                      <div className="text-xs text-orange-300">
                        {vendorNumber}
                      </div>
                    </div>
                  ) : null;
                })}
              </div>
            </div>
          )}
        </div>
      ) : viewMode === "timeline" ? (
        <ASNTimelineView asns={filteredAsns} onSelectASN={setSelectedASN} />
      ) : null}

      {/* Detail Modal */}
      <AnimatePresence>
        {selectedASN && (
          <InboundDetail
            asn={selectedASN}
            onClose={() => setSelectedASN(null)}
          />
        )}
      </AnimatePresence>

      {/* Create ASN Modal */}
      <AnimatePresence>
        {showCreateASNModal && (
          <CreateASNModal
            onClose={() => setShowCreateASNModal(false)}
            onSuccess={async (newASN) => {
              // Call Real Server Action
              const result = await createASN({
                documentNumber: newASN.documentNumber,
                vendorId: newASN.vendorNumber,
                vendorName: newASN.vendorName,
                expectedDeliveryDate: new Date(
                  newASN.expectedDeliveryDate as string,
                ),
                tenantId: user?.tenantId || "tenant-1",
                items: [], // Header only creation for now
              });

              if (result.success) {
                // Refresh list
                window.location.reload();
              } else {
                alert("Failed to create ASN: " + result.error);
              }
            }}
          />
        )}
      </AnimatePresence>
    </PageTemplate>
  );
}

// Create ASN Modal Component
function CreateASNModal({
  onClose,
  onSuccess,
}: {
  onClose: () => void;
  onSuccess: (asn: ASNData) => void;
}) {
  const [formData, setFormData] = useState({
    documentNumber: "",
    purchaseOrderNumber: "",
    vendorNumber: "",
    vendorName: "",
    plant: "",
    storageLocation: "",
    deliveryType: "VENDOR_DELIVERY" as "EX_WORKS" | "VENDOR_DELIVERY",
    destination: "",
    expectedDeliveryDate: "",
    trackingNumber: "",
    carrier: "",
    vehicleId: "",
    totalQuantity: "",
    totalWeight: "",
    totalItems: "",
    totalVolume: "",
    baseUnit: "EA",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newASN: ASNData = {
      id: `asn-${Date.now()}`,
      documentNumber:
        formData.documentNumber ||
        `ASN-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 10000)).padStart(4, "0")}`,
      entity: "DEFAULT",
      vendorNumber: formData.vendorNumber || "VND-001",
      vendorName: formData.vendorName || "Unknown Vendor",
      expectedDeliveryDate: formData.expectedDeliveryDate
        ? new Date(formData.expectedDeliveryDate).toISOString()
        : new Date().toISOString(),
      status: "CREATED",
      priority: "MEDIUM",
      complianceStatus: "UNDER_REVIEW",
      destination: formData.destination || "DEFAULT_WAREHOUSE",
      createdAt: new Date().toISOString(),
      lastUpdate: new Date().toISOString(),
      processType: "INBOUND",
      documentType: "ASN",
      purchaseOrderNumber: formData.purchaseOrderNumber || undefined,
      plant: formData.plant || undefined,
      storageLocation: formData.storageLocation || undefined,
      deliveryType: formData.deliveryType,
      trackingNumber: formData.trackingNumber || undefined,
      carrier: formData.carrier || undefined,
      vehicleId: formData.vehicleId || undefined,
      totalQuantity: formData.totalQuantity
        ? parseFloat(formData.totalQuantity)
        : undefined,
      totalWeight: formData.totalWeight
        ? parseFloat(formData.totalWeight)
        : undefined,
      totalItems: formData.totalItems
        ? parseInt(formData.totalItems)
        : undefined,
      totalVolume: formData.totalVolume
        ? parseFloat(formData.totalVolume)
        : undefined,
      baseUnit: formData.baseUnit,
    };
    onSuccess(newASN);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95 }}
        animate={{ scale: 1 }}
        exit={{ scale: 0.95 }}
        className="bg-[#1f2937] border border-[#374151] rounded-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 border-b border-[#374151] flex items-center justify-between sticky top-0 bg-[#1f2937] z-10">
          <h3 className="text-2xl font-bold text-white">Create ASN</h3>
          <button
            onClick={onClose}
            className="text-[#9ca3af] hover:text-white transition-colors p-2 hover:bg-[#374151] rounded-lg"
          >
            <i className="ri-close-line text-xl"></i>
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Document Information */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold text-white">
              Document Information
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-[#9ca3af] mb-2">
                  ASN Number
                </label>
                <input
                  type="text"
                  value={formData.documentNumber}
                  onChange={(e) =>
                    setFormData({ ...formData, documentNumber: e.target.value })
                  }
                  className="w-full bg-[#111827] border border-[#374151] rounded-lg px-4 py-2 text-white"
                  placeholder="Auto-generated if left empty"
                />
              </div>
              <div>
                <label className="block text-sm text-[#9ca3af] mb-2">
                  Purchase Order Number
                </label>
                <input
                  type="text"
                  value={formData.purchaseOrderNumber}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      purchaseOrderNumber: e.target.value,
                    })
                  }
                  className="w-full bg-[#111827] border border-[#374151] rounded-lg px-4 py-2 text-white"
                />
              </div>
            </div>
          </div>

          {/* Vendor Information */}
          <div className="space-y-4 pt-4 border-t border-[#374151]">
            <h4 className="text-lg font-semibold text-white">
              Vendor Information
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-[#9ca3af] mb-2">
                  Vendor Number *
                </label>
                <input
                  type="text"
                  value={formData.vendorNumber}
                  onChange={(e) =>
                    setFormData({ ...formData, vendorNumber: e.target.value })
                  }
                  className="w-full bg-[#111827] border border-[#374151] rounded-lg px-4 py-2 text-white"
                  required
                />
              </div>
              <div>
                <label className="block text-sm text-[#9ca3af] mb-2">
                  Vendor Name *
                </label>
                <input
                  type="text"
                  value={formData.vendorName}
                  onChange={(e) =>
                    setFormData({ ...formData, vendorName: e.target.value })
                  }
                  className="w-full bg-[#111827] border border-[#374151] rounded-lg px-4 py-2 text-white"
                  required
                />
              </div>
              <div>
                <label className="block text-sm text-[#9ca3af] mb-2">
                  Plant
                </label>
                <input
                  type="text"
                  value={formData.plant}
                  onChange={(e) =>
                    setFormData({ ...formData, plant: e.target.value })
                  }
                  className="w-full bg-[#111827] border border-[#374151] rounded-lg px-4 py-2 text-white"
                />
              </div>
              <div>
                <label className="block text-sm text-[#9ca3af] mb-2">
                  Storage Location
                </label>
                <input
                  type="text"
                  value={formData.storageLocation}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      storageLocation: e.target.value,
                    })
                  }
                  className="w-full bg-[#111827] border border-[#374151] rounded-lg px-4 py-2 text-white"
                />
              </div>
              <div>
                <label className="block text-sm text-[#9ca3af] mb-2">
                  Delivery Type *
                </label>
                <select
                  value={formData.deliveryType}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      deliveryType: e.target.value as
                        | "EX_WORKS"
                        | "VENDOR_DELIVERY",
                    })
                  }
                  className="w-full bg-[#111827] border border-[#374151] rounded-lg px-4 py-2 text-white"
                  required
                >
                  <option value="VENDOR_DELIVERY">
                    Vendor Delivery to Warehouse
                  </option>
                  <option value="EX_WORKS">
                    Ex-Works (Customer Collection)
                  </option>
                </select>
                <p className="text-xs text-[#6b7280] mt-1">
                  {formData.deliveryType === "EX_WORKS"
                    ? "Customer collects goods directly from vendor location"
                    : "Vendor delivers goods to warehouse"}
                </p>
              </div>
            </div>
          </div>

          {/* Shipment Information */}
          <div className="space-y-4 pt-4 border-t border-[#374151]">
            <h4 className="text-lg font-semibold text-white">
              Shipment Information
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-[#9ca3af] mb-2">
                  Destination *
                </label>
                <input
                  type="text"
                  value={formData.destination}
                  onChange={(e) =>
                    setFormData({ ...formData, destination: e.target.value })
                  }
                  className="w-full bg-[#111827] border border-[#374151] rounded-lg px-4 py-2 text-white"
                  required
                />
              </div>
              <div>
                <label className="block text-sm text-[#9ca3af] mb-2">
                  Expected Delivery Date *
                </label>
                <input
                  type="datetime-local"
                  value={formData.expectedDeliveryDate}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      expectedDeliveryDate: e.target.value,
                    })
                  }
                  className="w-full bg-[#111827] border border-[#374151] rounded-lg px-4 py-2 text-white"
                  required
                />
              </div>
              <div>
                <label className="block text-sm text-[#9ca3af] mb-2">
                  Tracking Number
                </label>
                <input
                  type="text"
                  value={formData.trackingNumber}
                  onChange={(e) =>
                    setFormData({ ...formData, trackingNumber: e.target.value })
                  }
                  className="w-full bg-[#111827] border border-[#374151] rounded-lg px-4 py-2 text-white"
                />
              </div>
              <div>
                <label className="block text-sm text-[#9ca3af] mb-2">
                  Carrier
                </label>
                <input
                  type="text"
                  value={formData.carrier}
                  onChange={(e) =>
                    setFormData({ ...formData, carrier: e.target.value })
                  }
                  className="w-full bg-[#111827] border border-[#374151] rounded-lg px-4 py-2 text-white"
                />
              </div>
              <div>
                <label className="block text-sm text-[#9ca3af] mb-2">
                  Vehicle ID
                </label>
                <input
                  type="text"
                  value={formData.vehicleId}
                  onChange={(e) =>
                    setFormData({ ...formData, vehicleId: e.target.value })
                  }
                  className="w-full bg-[#111827] border border-[#374151] rounded-lg px-4 py-2 text-white"
                />
              </div>
            </div>
          </div>

          {/* Material Information */}
          <div className="space-y-4 pt-4 border-t border-[#374151]">
            <h4 className="text-lg font-semibold text-white">
              Material Information
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm text-[#9ca3af] mb-2">
                  Total Quantity
                </label>
                <input
                  type="number"
                  value={formData.totalQuantity}
                  onChange={(e) =>
                    setFormData({ ...formData, totalQuantity: e.target.value })
                  }
                  className="w-full bg-[#111827] border border-[#374151] rounded-lg px-4 py-2 text-white"
                />
              </div>
              <div>
                <label className="block text-sm text-[#9ca3af] mb-2">
                  Unit of Measure
                </label>
                <select
                  value={formData.baseUnit}
                  onChange={(e) =>
                    setFormData({ ...formData, baseUnit: e.target.value })
                  }
                  className="w-full bg-[#111827] border border-[#374151] rounded-lg px-4 py-2 text-white"
                >
                  <option value="EA">EA</option>
                  <option value="KG">KG</option>
                  <option value="M">M</option>
                  <option value="L">L</option>
                  <option value="M2">M²</option>
                  <option value="M3">M³</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-[#9ca3af] mb-2">
                  Total Weight (kg)
                </label>
                <input
                  type="number"
                  value={formData.totalWeight}
                  onChange={(e) =>
                    setFormData({ ...formData, totalWeight: e.target.value })
                  }
                  className="w-full bg-[#111827] border border-[#374151] rounded-lg px-4 py-2 text-white"
                />
              </div>
              <div>
                <label className="block text-sm text-[#9ca3af] mb-2">
                  Total Items
                </label>
                <input
                  type="number"
                  value={formData.totalItems}
                  onChange={(e) =>
                    setFormData({ ...formData, totalItems: e.target.value })
                  }
                  className="w-full bg-[#111827] border border-[#374151] rounded-lg px-4 py-2 text-white"
                />
              </div>
              <div>
                <label className="block text-sm text-[#9ca3af] mb-2">
                  Total Volume (m³)
                </label>
                <input
                  type="number"
                  value={formData.totalVolume}
                  onChange={(e) =>
                    setFormData({ ...formData, totalVolume: e.target.value })
                  }
                  className="w-full bg-[#111827] border border-[#374151] rounded-lg px-4 py-2 text-white"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 pt-4 border-t border-[#374151]">
            <button
              type="submit"
              className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
            >
              Create ASN
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 bg-[#374151] hover:bg-[#4b5563] text-white rounded-lg font-medium transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}
