"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { getProcessedInboundData } from "@/data/processedInboundData";
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
import OutboundDetail from "./OutboundDetail";
import PageTemplate from "@/components/PageTemplate";
import React from "react";
import Tooltip from "@/components/Tooltip";
import {
  calculateOutboundAnalytics,
  calculateRealTimeOutboundMetrics,
} from "@/utils/outboundAnalytics";
import {
  realtimeSimulator,
  simulateKPIUpdates,
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
import ExportButton from "@/components/ExportButton";
import WaveCreatorModal from "./outbound/WaveCreatorModal";
import CreateOrderModal from "@/components/outbound/CreateOrderModal";
import OrderTimelineView from "@/components/outbound/OrderTimelineView";
import { getOutboundOrdersAction } from "@/app/actions/wms/outboundActions";

export default function OutboundPage() {
  const { context } = useViewContext();
  const { user } = useAuth();
  const [orders, setOrders] = useState<ASNData[]>([]);
  const [customers] = useState(() =>
    generateMultiTenantCustomers(20, user?.tenantId || "tenant-1"),
  );
  const [warehouses] = useState(() =>
    generateMultiTenantWarehouses(5, user?.tenantId || "tenant-1"),
  );
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");
  const [selectedCarrier, setSelectedCarrier] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<ASNData | null>(null);
  const [viewMode, setViewMode] = useState<
    "table" | "grid" | "analytics" | "realtime" | "timeline"
  >("table");
  const [orderToRequestPickup, setOrderToRequestPickup] =
    useState<ASNData | null>(null);
  const [realTimeStats, setRealTimeStats] = useState({
    totalOrders: 0,
    activePicking: 0,
    onTimeRate: 0,
    slaCompliance: 0,
  });

  // Initialize SIKA SLAs and KPIs on component mount
  useEffect(() => {
    initializeSikaSLAsAndKPIs();
  }, []);

  const [showCreateOrderModal, setShowCreateOrderModal] = useState(false);
  const [showWaveModal, setShowWaveModal] = useState(false);

  useEffect(() => {
    const fetchOrders = async () => {
      const res = await getOutboundOrdersAction();
      if (res.success && res.data) {
        setOrders(res.data as any); // Type assertion until ASNData is fully aligned
      }
    };
    fetchOrders();
  }, []);

  // Calculate analytics
  const analytics = useMemo(() => {
    try {
      return calculateOutboundAnalytics(orders);
    } catch (error) {
      console.error("Error calculating outbound analytics:", error);
      // Return default analytics structure
      return {
        totalOrders: 0,
        completedOrders: 0,
        inProgressOrders: 0,
        pendingOrders: 0,
        averageFulfillmentTime: 0,
        averagePickingTime: 0,
        averageDispatchTime: 0,
        onTimeDeliveryRate: 0,
        slaComplianceRate: 0,
        accuracyRate: 98.5,
        throughput: 0,
        customerPerformance: new Map(),
        carrierPerformance: new Map(),
        statusDistribution: new Map(),
        hourlyPerformance: [],
        topCustomers: [],
        topCarriers: [],
      };
    }
  }, [orders]);

  const realTimeMetrics = useMemo(() => {
    try {
      return calculateRealTimeOutboundMetrics(orders);
    } catch (error) {
      console.error("Error calculating real-time metrics:", error);
      return {
        activePicking: 0,
        readyForDispatch: 0,
        inTransit: 0,
        expectedToday: 0,
        averageWaitTime: 0,
        bottleneckCustomers: [],
        efficiencyTrend: "STABLE" as const,
      };
    }
  }, [orders]);

  // Real-time updates
  useEffect(() => {
    const unsubscribe = realtimeSimulator.subscribe(
      "outbound-stats",
      (data: typeof realTimeStats) => {
        setRealTimeStats(data);
      },
    );

    const stop = realtimeSimulator.start(
      "outbound-stats",
      () => ({
        totalOrders: simulateKPIUpdates(orders.length, 0.05),
        activePicking: simulateKPIUpdates(
          realTimeMetrics?.activePicking || 0,
          0.1,
        ),
        onTimeRate: simulateKPIUpdates(
          analytics?.onTimeDeliveryRate || 0,
          0.02,
        ),
        slaCompliance: simulateKPIUpdates(
          analytics?.slaComplianceRate || 0,
          0.02,
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
    orders.length,
    realTimeMetrics?.activePicking,
    analytics?.onTimeDeliveryRate,
    analytics?.slaComplianceRate,
  ]);

  // Simulate real-time status changes
  useEffect(() => {
    const interval = setInterval(() => {
      setOrders((prev) =>
        prev.map((order) => {
          if (order.status === "PICK_RELEASED" && Math.random() < 0.05) {
            return { ...order, status: "PICKING" as OrderStatus };
          }
          if (order.status === "PICKING" && Math.random() < 0.03) {
            return { ...order, status: "PICKED" as OrderStatus };
          }
          if (order.status === "PICKED" && Math.random() < 0.04) {
            return { ...order, status: "READY_FOR_DISPATCH" as OrderStatus };
          }
          if (order.status === "READY_FOR_DISPATCH" && Math.random() < 0.02) {
            return { ...order, status: "DISPATCHED" as OrderStatus };
          }
          return order;
        }),
      );
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  const getStatusBadge = (status: ASNStatus | OrderStatus): string => {
    const styles: Record<string, string> = {
      // Inbound ASN Statuses
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
      // Outbound Order Statuses (SAP/Oracle compatible)
      CONFIRMED: "bg-blue-500/20 text-blue-400 border-blue-500/30",
      PICK_RELEASED: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
      PICKING: "bg-indigo-500/20 text-indigo-400 border-indigo-500/30",
      PICKED: "bg-purple-500/20 text-purple-400 border-purple-500/30",
      QC_IN_PROGRESS: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
      QC_COMPLETED: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
      READY_FOR_DISPATCH:
        "bg-orange-500/20 text-orange-400 border-orange-500/30",
      DISPATCHED: "bg-green-500/20 text-green-400 border-green-500/30",
      GOODS_ISSUED: "bg-green-500/20 text-green-400 border-green-500/30",
      DELIVERED: "bg-teal-500/20 text-teal-400 border-teal-500/30",
      DELIVERY_NOTE_ISSUED: "bg-teal-500/20 text-teal-400 border-teal-500/30",
      ON_HOLD: "bg-orange-500/20 text-orange-400 border-orange-500/30",
      REJECTED: "bg-red-500/20 text-red-400 border-red-500/30",
      RETURNED: "bg-red-500/20 text-red-400 border-red-500/30",
    };
    return styles[status] || styles.CREATED;
  };

  const getStatusLabel = (status: ASNStatus | OrderStatus): string => {
    const labels: Record<string, string> = {
      // Inbound ASN Statuses
      CREATED: "Created",
      SENT: "Sent",
      ACKNOWLEDGED: "Acknowledged",
      IN_TRANSIT: "In Transit",
      ARRIVED: "Arrived",
      PARTIAL_GR: "Partial",
      GR_POSTED: "GR Posted",
      INVOICED: "Invoiced",
      COMPLETED: "Completed",
      CANCELLED: "Cancelled",
      BLOCKED: "Blocked",
      // Outbound Order Statuses (SAP/Oracle compatible)
      CONFIRMED: "Confirmed",
      PICK_RELEASED: "Pick Released",
      PICKING: "Picking",
      PICKED: "Picked",
      QC_IN_PROGRESS: "QC In Progress",
      QC_COMPLETED: "QC Completed",
      READY_FOR_DISPATCH: "Ready for Dispatch",
      DISPATCHED: "Dispatched",
      GOODS_ISSUED: "Goods Issued",
      DELIVERED: "Delivered",
      DELIVERY_NOTE_ISSUED: "Delivery Note Issued",
      ON_HOLD: "On Hold",
      REJECTED: "Rejected",
      RETURNED: "Returned",
    };
    return labels[status] || status;
  };

  // Filter orders based on view context (customer filtering)
  const filteredOrders = useMemo(() => {
    let filtered = orders;

    // Filter by customer
    if (
      context.customerFilter.type !== "ALL" &&
      context.customerFilter.customerIds
    ) {
      const customerNumbers = customers
        .filter((c) => context.customerFilter.customerIds?.includes(c.id))
        .map((c) => c.customerNumber);

      filtered = filtered.filter(
        (order) =>
          order.customerNumber &&
          customerNumbers.includes(order.customerNumber),
      );
    }

    // Apply search and status filters
    return filtered.filter((order) => {
      const matchesSearch =
        order.documentNumber
          .toLowerCase()
          .includes(searchQuery.toLowerCase()) ||
        order.customerName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.customerNumber
          ?.toLowerCase()
          .includes(searchQuery.toLowerCase()) ||
        order.plProjectDnNumber
          ?.toLowerCase()
          .includes(searchQuery.toLowerCase()) ||
        order.trackingNumber
          ?.toLowerCase()
          .includes(searchQuery.toLowerCase()) ||
        order.carrier?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.carrierName?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus =
        selectedStatus === "ALL" || order.status === selectedStatus;

      // Carrier filter
      const matchesCarrier =
        selectedCarrier === "ALL" ||
        (selectedCarrier === "HAS_CARRIER" &&
          (order.carrier || order.carrierName)) ||
        (selectedCarrier === "NO_CARRIER" &&
          !order.carrier &&
          !order.carrierName) ||
        order.carrier === selectedCarrier ||
        order.carrierName === selectedCarrier;

      return matchesSearch && matchesStatus && matchesCarrier;
    });
  }, [
    orders,
    context.customerFilter,
    customers,
    searchQuery,
    selectedStatus,
    selectedCarrier,
  ]);

  // Stats for dashboard
  const stats = [
    {
      label: "Total Orders",
      value: orders.length,
      icon: "ri-shopping-cart-line",
      tooltip: "Total outbound orders",
      trend: "up" as const,
    },
    {
      label: "Active Picking",
      value: realTimeMetrics.activePicking,
      icon: "ri-handbag-line",
      tooltip: "Currently being picked",
      trend: "neutral" as const,
    },
    {
      label: "On-Time Rate",
      value: `${(analytics?.onTimeDeliveryRate || 0).toFixed(1)}%`,
      icon: "ri-time-line",
      tooltip: "On-time delivery rate",
      trend: ((analytics?.onTimeDeliveryRate || 0) > 95 ? "up" : "neutral") as
        | "up"
        | "neutral",
    },
    {
      label: "SLA Compliance",
      value: `${(analytics?.slaComplianceRate || 0).toFixed(1)}%`,
      icon: "ri-checkbox-circle-line",
      tooltip: "SLA compliance rate",
      trend: ((analytics?.slaComplianceRate || 0) > 90 ? "up" : "neutral") as
        | "up"
        | "neutral",
    },
    {
      label: "Avg Fulfillment",
      value: `${((analytics?.averageFulfillmentTime || 0) / 3600).toFixed(1)}h`,
      icon: "ri-speed-line",
      tooltip: "Average fulfillment time",
      trend: ((analytics?.averageFulfillmentTime || 0) < 24 * 3600
        ? "up"
        : "neutral") as "up" | "neutral",
    },
    {
      label: "Accuracy Rate",
      value: `${(analytics?.accuracyRate || 98.5).toFixed(1)}%`,
      icon: "ri-target-line",
      tooltip: "Order accuracy rate",
      trend: ((analytics?.accuracyRate || 98.5) > 98 ? "up" : "neutral") as
        | "up"
        | "neutral",
    },
    {
      label: "Ready for Dispatch",
      value: realTimeMetrics.readyForDispatch,
      icon: "ri-truck-line",
      tooltip: "Orders ready for dispatch",
      trend: "neutral" as const,
    },
    {
      label: "Throughput",
      value: `${(analytics?.throughput || 0).toFixed(1)}/hr`,
      icon: "ri-dashboard-line",
      tooltip: "Orders processed per hour",
      trend: "up" as const,
    },
  ];

  // Chart data
  const statusDistribution = Array.from(
    (analytics?.statusDistribution || new Map()).entries(),
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

  const hourlyPerformanceData = (analytics?.hourlyPerformance || []).map(
    (h) => ({
      hour: `${h.hour}:00`,
      dispatches: h.dispatches,
      completions: h.completions,
      avgTime: h.averageFulfillmentTime / 3600, // Convert to hours
    }),
  );

  const customerPerformanceData = (analytics?.topCustomers || [])
    .slice(0, 10)
    .map((c) => ({
      customer: c.customerName.substring(0, 15),
      onTimeRate: c.onTimeRate,
      performanceScore: c.performanceScore,
      orderCount: c.orderCount,
    }));

  const carrierPerformanceData = (analytics?.topCarriers || [])
    .slice(0, 10)
    .map((c) => ({
      carrier: c.carrierName.substring(0, 15),
      onTimeRate: c.onTimeRate,
      performanceScore: c.performanceScore,
      orderCount: c.orderCount,
    }));

  // Get unique carriers for filter
  const uniqueCarriers = useMemo(() => {
    const carriers = new Set<string>();
    orders.forEach((order) => {
      if (order.carrier) carriers.add(order.carrier);
      if (order.carrierName) carriers.add(order.carrierName);
    });
    return Array.from(carriers).sort();
  }, [orders]);

  return (
    <PageTemplate
      title="World-Class Outbound Operations"
      description="Industry-leading outbound operations with multi-carrier shipping, wave planning, real-time tracking, load optimization, POD management, returns handling, and carrier performance analytics. Beats SAP, Oracle, Manhattan, and all top-tier WMS systems."
      icon="ri-upload-line"
      systemInfo={{
        sap: "Outbound Delivery, Goods Issue, Ship Confirm, POD",
        oracle: "Outbound Processing, Shipment Management, POD",
        manhattan: "Outbound Management, Shipping, POD Management",
      }}
      examples={[
        "Multi-carrier shipping management",
        "Advanced wave planning visualization",
        "Real-time order status tracking",
        "Load optimization and planning",
        "POD management integration",
        "Returns management",
        "Shipping cost optimization",
        "Carrier performance analytics",
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
            onClick={() => setShowCreateOrderModal(true)}
            className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg text-xs sm:text-sm font-medium transition-colors flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20 whitespace-nowrap"
          >
            <i className="ri-add-line"></i>
            <span className="hidden sm:inline">Create Order</span>
            <span className="sm:hidden">Create</span>
          </button>

          <button
            onClick={() => setShowWaveModal(true)}
            className="bg-[#1f2937] hover:bg-[#374151] border border-[#374151] text-cyan-400 px-4 sm:px-6 py-2 sm:py-3 rounded-lg text-xs sm:text-sm font-medium transition-colors flex items-center justify-center gap-2 whitespace-nowrap"
          >
            <i className="ri-stack-line"></i>
            <span className="hidden sm:inline">Plan Wave</span>
          </button>
        </div>
      }
    >
      {/* Multi-Tenant Filters */}
      <div className="mb-4 sm:mb-6 flex items-center gap-3 flex-wrap">
        <CustomerSelector
          customers={customers}
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
            placeholder="Search by Order Number, Customer, PL Number, Tracking, Carrier..."
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
          <option value="CONFIRMED">Confirmed</option>
          <option value="PICK_RELEASED">Pick Released</option>
          <option value="PICKING">Picking</option>
          <option value="PICKED">Picked</option>
          <option value="QC_IN_PROGRESS">QC In Progress</option>
          <option value="QC_COMPLETED">QC Completed</option>
          <option value="READY_FOR_DISPATCH">Ready for Dispatch</option>
          <option value="DISPATCHED">Dispatched</option>
          <option value="GOODS_ISSUED">Goods Issued</option>
          <option value="DELIVERED">Delivered</option>
          <option value="COMPLETED">Completed</option>
          <option value="ON_HOLD">On Hold</option>
          <option value="CANCELLED">Cancelled</option>
          <option value="RETURNED">Returned</option>
        </select>
        <select
          value={selectedCarrier}
          onChange={(e) => setSelectedCarrier(e.target.value)}
          className="bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 w-full sm:w-auto sm:min-w-[160px]"
          title="Filter by Carrier"
        >
          <option value="ALL">All Carriers</option>
          <option value="HAS_CARRIER">Has Carrier</option>
          <option value="NO_CARRIER">No Carrier</option>
          {uniqueCarriers.map((carrier) => (
            <option key={carrier} value={carrier}>
              {carrier}
            </option>
          ))}
        </select>
      </div>

      {/* View Modes */}
      {filteredOrders.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center justify-center py-16 px-6 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl"
        >
          <div className="mb-6">
            <i className="ri-shopping-cart-line text-8xl text-[#6b7280]"></i>
          </div>
          <h3 className="text-2xl font-semibold text-white mb-2">
            No Outbound Orders Found
          </h3>
          <p className="text-[#9ca3af] text-base mb-8 text-center max-w-md">
            You don't have any outbound orders yet. Create an order to get
            started.
          </p>
          <button
            onClick={() => setShowCreateOrderModal(true)}
            className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white px-6 py-3 rounded-lg text-base font-medium transition-colors flex items-center gap-2 shadow-lg shadow-cyan-500/20"
          >
            <i className="ri-add-line text-lg"></i>
            Create Your First Order
          </button>
        </motion.div>
      ) : viewMode === "grid" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredOrders.map((order, index) => (
            <motion.div
              key={order.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 hover:border-cyan-500/50 hover:shadow-lg hover:shadow-cyan-500/20 transition-all cursor-pointer"
              onClick={() => setSelectedOrder(order)}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap mb-2">
                    <h3 className="text-lg font-semibold text-white font-mono">
                      {order.documentNumber}
                    </h3>
                    {order.isUrgent && (
                      <span className="px-2 py-1 bg-red-500/20 text-red-400 border border-red-500/30 rounded text-xs font-medium flex items-center gap-1">
                        <i className="ri-alert-line"></i>
                        URGENT
                      </span>
                    )}
                    {order.carrierPickupRequested && (
                      <span className="px-2 py-1 bg-green-500/20 text-green-400 border border-green-500/30 rounded text-xs font-medium flex items-center gap-1">
                        <i className="ri-truck-line"></i>
                        PICKUP
                      </span>
                    )}
                    {(order.carrier || order.carrierName) && (
                      <span className="px-2 py-1 bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded text-xs">
                        <i className="ri-truck-line mr-1"></i>
                        {order.carrier || order.carrierName}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-[#9ca3af]">Order Number</p>
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusBadge(order.status)}`}
                >
                  {getStatusLabel(order.status)}
                </span>
              </div>

              <div className="space-y-3">
                <div>
                  <p className="text-xs text-[#9ca3af] mb-1">Customer</p>
                  <p className="text-sm font-medium text-white">
                    {order.customerName || "N/A"}
                  </p>
                  {order.customerNumber && (
                    <p className="text-xs text-cyan-400 font-mono">
                      {order.customerNumber}
                    </p>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs text-[#9ca3af] mb-1">
                      Expected Delivery
                    </p>
                    <p className="text-sm text-white">
                      {order.expectedDeliveryDate
                        ? format(
                            new Date(order.expectedDeliveryDate),
                            "MMM dd, HH:mm",
                          )
                        : "N/A"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-[#9ca3af] mb-1">Destination</p>
                    <p className="text-sm text-white truncate">
                      {order.destination}
                    </p>
                  </div>
                </div>
                {(order.totalQuantity || order.totalWeight) && (
                  <div className="grid grid-cols-2 gap-3 pt-3 border-t border-white/10">
                    {order.totalQuantity && (
                      <div>
                        <p className="text-xs text-[#9ca3af] mb-1">Quantity</p>
                        <p className="text-sm text-white">
                          {order.totalQuantity} {order.baseUnit || "EA"}
                        </p>
                      </div>
                    )}
                    {order.totalWeight && (
                      <div>
                        <p className="text-xs text-[#9ca3af] mb-1">Weight</p>
                        <p className="text-sm text-white">
                          {order.totalWeight} kg
                        </p>
                      </div>
                    )}
                  </div>
                )}
                <div className="flex items-center gap-2 pt-3 border-t border-white/10">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedOrder(order);
                    }}
                    className="px-3 py-1.5 bg-cyan-600/20 text-cyan-400 border border-cyan-500/30 rounded text-xs font-medium hover:bg-cyan-600/30 transition-colors"
                  >
                    <i className="ri-eye-line mr-1"></i>
                    View Details
                  </button>
                  {order.slaCompliancePercentage !== undefined && (
                    <div className="ml-auto flex items-center gap-2">
                      <div className="text-xs text-[#9ca3af]">SLA:</div>
                      <div
                        className={`text-xs font-medium ${
                          order.slaCompliancePercentage >= 80
                            ? "text-green-400"
                            : order.slaCompliancePercentage >= 60
                              ? "text-yellow-400"
                              : "text-red-400"
                        }`}
                      >
                        {order.slaCompliancePercentage.toFixed(0)}%
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      ) : viewMode === "table" ? (
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden w-full">
          <div className="overflow-x-auto w-full">
            <table className="w-full min-w-[1200px]">
              <thead className="bg-white/5 border-b border-white/10">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium text-[#9ca3af] uppercase tracking-wider">
                    Order Number
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-[#9ca3af] uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-[#9ca3af] uppercase tracking-wider">
                    Expected Delivery
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-[#9ca3af] uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-[#9ca3af] uppercase tracking-wider">
                    Carrier
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
                {filteredOrders.map((order, index) => (
                  <motion.tr
                    key={order.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.02 }}
                    className="hover:bg-white/5 transition-colors cursor-pointer"
                    onClick={() => setSelectedOrder(order)}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <Tooltip
                          content={`Order: ${order.documentNumber}`}
                          position="right"
                        >
                          <span className="text-sm font-medium text-white font-mono cursor-help">
                            {order.documentNumber}
                          </span>
                        </Tooltip>
                        {order.isUrgent && (
                          <span className="px-1.5 py-0.5 bg-red-500/20 text-red-400 border border-red-500/30 rounded text-xs">
                            URGENT
                          </span>
                        )}
                        {order.carrierPickupRequested && (
                          <Tooltip
                            content="Carrier pickup requested"
                            position="top"
                          >
                            <i className="ri-truck-line text-green-400 text-sm"></i>
                          </Tooltip>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-white">
                        {order.customerName || "N/A"}
                      </div>
                      {order.customerNumber && (
                        <div className="text-xs text-[#9ca3af] font-mono">
                          {order.customerNumber}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-white">
                        {order.expectedDeliveryDate
                          ? format(
                              new Date(order.expectedDeliveryDate),
                              "MMM dd, yyyy HH:mm",
                            )
                          : "N/A"}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium border ${getStatusBadge(order.status)}`}
                      >
                        {getStatusLabel(order.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-white">
                        {order.carrier || order.carrierName || "N/A"}
                      </div>
                      {order.trackingNumber && (
                        <div className="text-xs text-cyan-400 font-mono">
                          {order.trackingNumber}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-white font-medium">
                        {order.totalQuantity
                          ? `${order.totalQuantity} ${order.baseUnit || "EA"}`
                          : "N/A"}
                      </div>
                      {order.totalWeight && (
                        <div className="text-xs text-[#9ca3af]">
                          {order.totalWeight} kg
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {order.slaCompliancePercentage !== undefined ? (
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-white/10 rounded-full h-2 min-w-[60px]">
                            <div
                              className={`h-2 rounded-full transition-all ${
                                order.slaCompliancePercentage >= 80
                                  ? "bg-green-500"
                                  : order.slaCompliancePercentage >= 60
                                    ? "bg-yellow-500"
                                    : "bg-red-500"
                              }`}
                              style={{
                                width: `${Math.min(100, order.slaCompliancePercentage)}%`,
                              }}
                            ></div>
                          </div>
                          <span
                            className={`text-xs font-medium ${
                              order.slaCompliancePercentage >= 80
                                ? "text-green-400"
                                : order.slaCompliancePercentage >= 60
                                  ? "text-yellow-400"
                                  : "text-red-400"
                            }`}
                          >
                            {order.slaCompliancePercentage.toFixed(0)}%
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
                              setSelectedOrder(order);
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

          {/* Customer Performance */}
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4">
              Top Customer Performance
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={customerPerformanceData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis
                  dataKey="customer"
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

          {/* Carrier Performance */}
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4">
              Top Carrier Performance
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={carrierPerformanceData}>
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
                  dataKey="dispatches"
                  stroke="#06b6d4"
                  name="Dispatches"
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
        </div>
      ) : viewMode === "realtime" ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Real-time Metrics */}
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4">
              Real-Time Metrics
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
                <div>
                  <div className="text-sm text-[#9ca3af]">Active Picking</div>
                  <div className="text-2xl font-bold text-cyan-400">
                    {realTimeStats.activePicking}
                  </div>
                </div>
                <i className="ri-handbag-line text-3xl text-cyan-400"></i>
              </div>
              <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
                <div>
                  <div className="text-sm text-[#9ca3af]">
                    Ready for Dispatch
                  </div>
                  <div className="text-2xl font-bold text-green-400">
                    {realTimeMetrics.readyForDispatch}
                  </div>
                </div>
                <i className="ri-truck-line text-3xl text-green-400"></i>
              </div>
              <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
                <div>
                  <div className="text-sm text-[#9ca3af]">In Transit</div>
                  <div className="text-2xl font-bold text-blue-400">
                    {realTimeMetrics.inTransit}
                  </div>
                </div>
                <i className="ri-road-map-line text-3xl text-blue-400"></i>
              </div>
              <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
                <div>
                  <div className="text-sm text-[#9ca3af]">Expected Today</div>
                  <div className="text-2xl font-bold text-yellow-400">
                    {realTimeMetrics.expectedToday}
                  </div>
                </div>
                <i className="ri-time-line text-3xl text-yellow-400"></i>
              </div>
              <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
                <div>
                  <div className="text-sm text-[#9ca3af]">Avg Wait Time</div>
                  <div className="text-2xl font-bold text-white">
                    {realTimeMetrics.averageWaitTime.toFixed(1)} min
                  </div>
                </div>
                <i className="ri-time-line text-3xl text-white"></i>
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

          {/* Active Orders */}
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4">
              Active Orders
            </h3>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {filteredOrders
                .filter(
                  (o) =>
                    o.status === "PICKING" ||
                    o.status === "PICKED" ||
                    o.status === "READY_FOR_DISPATCH" ||
                    o.status === "DISPATCHED" ||
                    o.status === "IN_TRANSIT",
                )
                .slice(0, 10)
                .map((order) => (
                  <motion.div
                    key={order.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 bg-white/5 rounded-lg border border-white/10 hover:border-cyan-500/50 transition-colors cursor-pointer"
                    onClick={() => setSelectedOrder(order)}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm font-medium text-white font-mono">
                          {order.documentNumber}
                        </div>
                        <div className="text-xs text-[#9ca3af]">
                          {order.customerName || "N/A"}
                        </div>
                        {order.expectedDeliveryDate && (
                          <div className="text-xs text-cyan-400 mt-1">
                            ETA:{" "}
                            {format(
                              new Date(order.expectedDeliveryDate),
                              "MMM dd HH:mm",
                            )}
                          </div>
                        )}
                      </div>
                      <div className="text-right">
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium border ${getStatusBadge(order.status)}`}
                        >
                          {getStatusLabel(order.status)}
                        </span>
                        {order.slaCompliancePercentage !== undefined && (
                          <div
                            className={`text-xs mt-1 ${
                              order.slaCompliancePercentage >= 80
                                ? "text-green-400"
                                : order.slaCompliancePercentage >= 60
                                  ? "text-yellow-400"
                                  : "text-red-400"
                            }`}
                          >
                            SLA: {order.slaCompliancePercentage.toFixed(0)}%
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
            </div>
          </div>

          {/* Bottleneck Customers */}
          {realTimeMetrics.bottleneckCustomers.length > 0 && (
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 lg:col-span-2">
              <h3 className="text-lg font-semibold text-white mb-4">
                Bottleneck Customers
              </h3>
              <div className="flex flex-wrap gap-3">
                {realTimeMetrics.bottleneckCustomers.map((customerNumber) => {
                  const customer = orders.find(
                    (o) => o.customerNumber === customerNumber,
                  );
                  return customer ? (
                    <div
                      key={customerNumber}
                      className="px-4 py-2 bg-orange-500/20 text-orange-400 border border-orange-500/30 rounded-lg"
                    >
                      <div className="text-sm font-medium">
                        {customer.customerName || customerNumber}
                      </div>
                      <div className="text-xs text-orange-300">
                        {customerNumber}
                      </div>
                    </div>
                  ) : null;
                })}
              </div>
            </div>
          )}
        </div>
      ) : viewMode === "timeline" ? (
        <OrderTimelineView
          orders={filteredOrders}
          onOrderClick={(order) => {
            setSelectedOrder(order);
            setShowOrderModal(true);
          }}
        />
      ) : null}

      {/* Detail Modal */}
      <AnimatePresence>
        {selectedOrder && (
          <OutboundDetail
            order={selectedOrder}
            onClose={() => {
              setSelectedOrder(null);
              setOrderToRequestPickup(null);
            }}
          />
        )}
      </AnimatePresence>

      {/* Open detail modal with pickup request if orderToRequestPickup is set */}
      <AnimatePresence>
        {orderToRequestPickup && !selectedOrder && (
          <OutboundDetail
            order={orderToRequestPickup}
            onClose={() => {
              setOrderToRequestPickup(null);
            }}
            initialShowPickupModal={true}
          />
        )}
      </AnimatePresence>

      {/* Create Order Modal */}
      <AnimatePresence>
        {showCreateOrderModal && (
          <CreateOrderModal
            onClose={() => setShowCreateOrderModal(false)}
            onSuccess={(newOrder) => {
              setOrders([...orders, newOrder]);
              setShowCreateOrderModal(false);
            }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showWaveModal && (
          <WaveCreatorModal onClose={() => setShowWaveModal(false)} />
        )}
      </AnimatePresence>
    </PageTemplate>
  );
}
