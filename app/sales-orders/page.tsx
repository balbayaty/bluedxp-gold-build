"use client";

import { useState, useMemo, useEffect } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import PageTemplate from "@/components/PageTemplate";
import Tooltip from "@/components/Tooltip";
import Modal from "@/components/Modal";
import ModuleLinks from "@/components/ModuleLinks";
import { getSalesOrderLinks } from "@/utils/moduleInterconnectivity";
import { format, differenceInDays, differenceInHours } from "date-fns";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  ComposedChart,
  Area,
  AreaChart,
} from "recharts";
import CurrencyDisplay from "@/components/CurrencyDisplay";
import ExportButton from "@/components/ExportButton";
import LifecycleView from "@/components/process-lifecycle/lifecycle/LifecycleView";
import { lifecycleService } from "@/lib/services/process-lifecycle/lifecycle/lifecycleService";
import { salesOrderLifecycleConfig } from "@/lib/services/process-lifecycle/lifecycle/configurations";
import { logger } from "@/lib/services/observability/logger";
import { errorTrackingService } from "@/lib/services/observability/errorTracking";
import UniversalQRGenerator from "@/components/qr/UniversalQRGenerator";
import QRCodeBadge from "@/components/qr/QRCodeBadge";

interface SalesOrder {
  id: string;
  soNumber: string;
  customerNumber: string;
  customerName: string;
  orderDate: Date | string;
  expectedDeliveryDate: Date | string;
  status:
    | "CREATED"
    | "CONFIRMED"
    | "PICK_RELEASED"
    | "PICKING"
    | "PICKED"
    | "QC_IN_PROGRESS"
    | "DISPATCHED"
    | "IN_TRANSIT"
    | "DELIVERED"
    | "COMPLETED"
    | "CANCELLED";
  totalValue: number;
  currency: string;
  totalItems: number;
  totalQuantity: number;
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  items: Array<{
    materialNumber: string;
    quantity: number;
    unit: string;
    price: number;
  }>;
  fulfillmentProgress?: number;
  slaStatus?: "ON_TIME" | "AT_RISK" | "BREACHED";
  actualDeliveryDate?: Date | string;
  pickingStartTime?: Date | string;
  pickingEndTime?: Date | string;
}

export default function SalesOrders() {
  const router = useRouter();
  const [orders, setOrders] = useState<SalesOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch sales orders from API
  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch('/api/wms/sales-orders?limit=100');
        const result = await response.json();
        
        if (result.success && result.data) {
          // Map API response to component interface
          const mappedOrders: SalesOrder[] = result.data.map((order: any) => {
            const now = new Date();
            const expectedDelivery = order.promisedDeliveryDate || order.requestedDeliveryDate || order.orderDate;
            const expectedDeliveryDate = expectedDelivery ? new Date(expectedDelivery) : new Date();
            const daysToDelivery = differenceInDays(expectedDeliveryDate, now);
            
            // Calculate fulfillment progress based on status
            const fulfillmentProgress = [
              "PICKING",
              "PICKED",
              "QC_IN_PROGRESS",
              "DISPATCHED",
              "IN_TRANSIT",
              "DELIVERED",
              "COMPLETED",
            ].includes(order.status)
              ? Math.min(
                  100,
                  Math.max(
                    0,
                    ([
                      "PICKING",
                      "PICKED",
                      "QC_IN_PROGRESS",
                      "DISPATCHED",
                      "IN_TRANSIT",
                      "DELIVERED",
                      "COMPLETED",
                    ].indexOf(order.status) +
                      1) *
                      15,
                  ),
                )
              : 0;

            // Calculate SLA status
            let slaStatus: "ON_TIME" | "AT_RISK" | "BREACHED" = "ON_TIME";
            if (order.status === "COMPLETED" && order.actualDeliveryDate) {
              const actual = new Date(order.actualDeliveryDate);
              slaStatus = actual > expectedDeliveryDate ? "BREACHED" : "ON_TIME";
            } else if (
              daysToDelivery < 0 &&
              !["COMPLETED", "DELIVERED"].includes(order.status)
            ) {
              slaStatus = "BREACHED";
            } else if (
              daysToDelivery < 2 &&
              !["COMPLETED", "DELIVERED"].includes(order.status)
            ) {
              slaStatus = "AT_RISK";
            }

            return {
              id: order.id,
              soNumber: order.orderNumber,
              customerNumber: order.customerId || '',
              customerName: order.customerName || '',
              orderDate: order.orderDate,
              expectedDeliveryDate: expectedDeliveryDate,
              status: (order.status === 'DRAFT' ? 'CREATED' :
                      order.status === 'PICK_RELEASED' ? 'PICK_RELEASED' :
                      order.status) as SalesOrder["status"],
              totalValue: Number(order.totalAmount || order.subtotal || 0),
              currency: order.currency || 'SAR',
              totalItems: order.lines?.length || 0,
              totalQuantity: order.lines?.reduce((sum: number, line: any) => sum + (line.quantity || 0), 0) || 0,
              priority: (order.priority || 'MEDIUM') as SalesOrder["priority"],
              items: order.lines?.map((line: any) => ({
                materialNumber: line.sku || '',
                quantity: Number(line.quantity || 0),
                unit: line.unit || 'EA',
                price: Number(line.unitPrice || 0),
              })) || [],
              fulfillmentProgress,
              slaStatus,
              actualDeliveryDate: order.actualDeliveryDate ? new Date(order.actualDeliveryDate) : undefined,
              pickingStartTime: [
                "PICKING",
                "PICKED",
                "QC_IN_PROGRESS",
                "DISPATCHED",
                "IN_TRANSIT",
                "DELIVERED",
                "COMPLETED",
              ].includes(order.status)
                ? order.updatedAt ? new Date(order.updatedAt) : undefined
                : undefined,
              pickingEndTime: [
                "PICKED",
                "QC_IN_PROGRESS",
                "DISPATCHED",
                "IN_TRANSIT",
                "DELIVERED",
                "COMPLETED",
              ].includes(order.status)
                ? order.updatedAt ? new Date(order.updatedAt) : undefined
                : undefined,
            };
          });
          setOrders(mappedOrders);
        } else {
          setError(result.error || 'Failed to fetch sales orders');
        }
      } catch (err) {
        console.error('Error fetching sales orders:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch sales orders');
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");
  const [selectedPriority, setSelectedPriority] = useState<string>("ALL");
  const [viewMode, setViewMode] = useState<
    "grid" | "table" | "analytics" | "lifecycle"
  >("grid");
  const [showViewModal, setShowViewModal] = useState(false);
  const [showFulfillmentModal, setShowFulfillmentModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<SalesOrder | null>(null);

  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const matchesSearch =
        order.soNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.customerNumber.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus =
        selectedStatus === "ALL" || order.status === selectedStatus;
      const matchesPriority =
        selectedPriority === "ALL" || order.priority === selectedPriority;
      return matchesSearch && matchesStatus && matchesPriority;
    });
  }, [orders, searchQuery, selectedStatus, selectedPriority]);

  const statusDistribution = useMemo(() => {
    const statusCounts: Record<string, number> = {};
    orders.forEach((order) => {
      statusCounts[order.status] = (statusCounts[order.status] || 0) + 1;
    });
    return Object.entries(statusCounts).map(([status, count]) => ({
      status,
      count,
    }));
  }, [orders]);

  const slaPerformance = useMemo(() => {
    const onTime = orders.filter((o) => o.slaStatus === "ON_TIME").length;
    const atRisk = orders.filter((o) => o.slaStatus === "AT_RISK").length;
    const breached = orders.filter((o) => o.slaStatus === "BREACHED").length;
    return [
      { name: "On Time", value: onTime, color: "#10b981" },
      { name: "At Risk", value: atRisk, color: "#f59e0b" },
      { name: "Breached", value: breached, color: "#ef4444" },
    ];
  }, [orders]);

  const fulfillmentTrend = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (6 - i));
      const dayOrders = orders.filter((o) => {
        const orderDate = new Date(o.orderDate);
        return orderDate.toDateString() === date.toDateString();
      });
      return {
        date: format(date, "MMM dd"),
        orders: dayOrders.length,
        completed: dayOrders.filter((o) => o.status === "COMPLETED").length,
        inProgress: dayOrders.filter((o) =>
          ["PICKING", "PICKED", "QC_IN_PROGRESS", "DISPATCHED"].includes(
            o.status,
          ),
        ).length,
      };
    });
  }, [orders]);

  const atRiskOrders = useMemo(() => {
    return orders.filter(
      (o) => o.slaStatus === "AT_RISK" || o.slaStatus === "BREACHED",
    ).length;
  }, [orders]);

  const stats = [
    {
      label: "Total Orders",
      value: orders.length,
      icon: "ri-shopping-cart-2-line",
      tooltip: "Total sales orders",
      trend: "up" as const,
    },
    {
      label: "In Progress",
      value: orders.filter((o) =>
        [
          "PICKING",
          "PICKED",
          "QC_IN_PROGRESS",
          "DISPATCHED",
          "IN_TRANSIT",
        ].includes(o.status),
      ).length,
      icon: "ri-loader-line",
      tooltip: "Orders currently being processed",
      trend: "neutral" as const,
    },
    {
      label: "SLA At Risk",
      value: atRiskOrders,
      icon: "ri-alarm-warning-line",
      tooltip: "Orders at risk of SLA breach",
      trend: atRiskOrders > 0 ? ("down" as const) : ("neutral" as const),
    },
    {
      label: "Total Value",
      value: orders.reduce((sum, o) => sum + o.totalValue, 0),
      isCurrency: true,
      icon: "ri-money-dollar-circle-line",
      tooltip: "Total value of sales orders",
      trend: "up" as const,
    },
  ];

  const handleView = (order: SalesOrder) => {
    setSelectedOrder(order);
    setShowViewModal(true);
  };

  const handleFulfillment = (order: SalesOrder) => {
    setSelectedOrder(order);
    setShowFulfillmentModal(true);
  };

  const handleNavigateToPicking = (order: SalesOrder) => {
    router.push(`/picking?so=${order.soNumber}`);
  };

  const handleNavigateToTracking = (order: SalesOrder) => {
    router.push(`/tracking?so=${order.soNumber}`);
  };

  const handleNavigateToPOD = (order: SalesOrder) => {
    router.push(`/pod?so=${order.soNumber}`);
  };

  const handleNavigateToCustomer = (order: SalesOrder) => {
    router.push(`/customers?customer=${order.customerNumber}`);
  };

  return (
    <PageTemplate
      title="Sales Orders"
      description="Sales order management with fulfillment tracking - Create, manage, and track sales orders from confirmation to delivery with full order lifecycle visibility and SLA monitoring"
      icon="ri-shopping-cart-2-line"
      systemInfo={{
        sap: "VA01 - Create Sales Order, VA02 - Change Sales Order, VA03 - Display Sales Order",
        oracle: "Sales Order, Order Entry, Order Management",
        manhattan: "Sales Order Management, Order Fulfillment",
      }}
      examples={[
        "Create new sales orders",
        "Confirm customer orders",
        "Release orders for picking",
        "Track order status and fulfillment",
        "Monitor SLA compliance",
        "Manage order changes",
        "Handle order cancellations",
        "View order lifecycle",
      ]}
      stats={stats}
      loading={loading}
      error={error}
      actions={
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-lg p-1">
            {(["grid", "table", "analytics", "lifecycle"] as const).map(
              (mode) => (
                <button
                  key={mode}
                  onClick={() => setViewMode(mode)}
                  className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                    viewMode === mode
                      ? "bg-cyan-500 text-white"
                      : "text-[#9ca3af] hover:text-white"
                  }`}
                >
                  <i
                    className={`ri-${mode === "grid" ? "grid-line" : mode === "table" ? "table-line" : mode === "analytics" ? "bar-chart-line" : "flow-chart-line"} mr-1`}
                  ></i>
                  {mode.charAt(0).toUpperCase() + mode.slice(1)}
                </button>
              ),
            )}
          </div>
          <button className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white px-6 py-3 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 shadow-lg shadow-cyan-500/20">
            <i className="ri-add-line"></i>
            Create Sales Order
          </button>
        </div>
      }
    >
      {/* Alerts */}
      {atRiskOrders > 0 && (
        <div className="mb-6 bg-yellow-500/20 border border-yellow-500/30 rounded-lg p-4 flex items-center gap-3">
          <i className="ri-alarm-warning-line text-yellow-400 text-xl"></i>
          <div className="flex-1">
            <div className="text-yellow-400 font-medium">
              {atRiskOrders} Order{atRiskOrders > 1 ? "s" : ""} At Risk of SLA
              Breach
            </div>
            <div className="text-yellow-300/80 text-sm">
              Immediate action required
            </div>
          </div>
        </div>
      )}

      {/* Analytics View */}
      {viewMode === "analytics" && (
        <div className="grid md:grid-cols-2 gap-6 mb-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
          >
            <h3 className="text-lg font-semibold text-white mb-4">
              SLA Performance
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={slaPerformance}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {slaPerformance.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
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
              Order Status Distribution
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={statusDistribution}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis
                  dataKey="status"
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

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 md:col-span-2"
          >
            <h3 className="text-lg font-semibold text-white mb-4">
              Fulfillment Trend (Last 7 Days)
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <ComposedChart data={fulfillmentTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="date" stroke="#9ca3af" fontSize={12} />
                <YAxis stroke="#9ca3af" fontSize={12} />
                <RechartsTooltip
                  contentStyle={{
                    backgroundColor: "#1f2937",
                    border: "1px solid #374151",
                    borderRadius: "8px",
                  }}
                  labelStyle={{ color: "#fff" }}
                />
                <Area
                  type="monotone"
                  dataKey="orders"
                  fill="#06b6d4"
                  fillOpacity={0.3}
                  stroke="#06b6d4"
                  strokeWidth={2}
                  name="Total Orders"
                />
                <Bar dataKey="completed" fill="#10b981" name="Completed" />
                <Bar dataKey="inProgress" fill="#f59e0b" name="In Progress" />
                <Legend />
              </ComposedChart>
            </ResponsiveContainer>
          </motion.div>
        </div>
      )}

      {/* Lifecycle View - Enhanced Universal Lifecycle System */}
      {viewMode === "lifecycle" && (
        <div className="mb-6">
          {/* Register lifecycle config if not already registered */}
          {(() => {
            try {
              if (!lifecycleService.getLifecycleConfig("SALES_ORDER")) {
                lifecycleService.registerLifecycle(
                  "SALES_ORDER",
                  salesOrderLifecycleConfig,
                );
              }
            } catch (e) {
              const err = e instanceof Error ? e : new Error(String(e));
              logger.error("Error registering lifecycle config", err, {
                module: "sales-orders",
                service: "lifecycle",
              });
              errorTrackingService.captureException(err, {
                module: "sales-orders",
                service: "lifecycle",
              });
            }
            return null;
          })()}

          {/* Header Banner */}
          <div className="mb-4 bg-gradient-to-r from-cyan-500/10 to-blue-600/10 border border-cyan-500/30 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-cyan-500/20 border border-cyan-500/50 flex items-center justify-center">
                <i className="ri-flow-chart-line text-cyan-400 text-xl"></i>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-white">
                  Enhanced Lifecycle Management System
                </h3>
                <p className="text-sm text-[#9ca3af]">
                  Universal platform-wide lifecycle tracking with deep module
                  integration
                </p>
              </div>
              <div className="text-right">
                <div className="text-xs text-[#9ca3af] mb-1">Total Orders</div>
                <div className="text-2xl font-bold text-cyan-400">
                  {filteredOrders.length}
                </div>
              </div>
            </div>
          </div>

          {/* Aggregate Lifecycle Overview */}
          <div className="mb-6 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">
                Order Lifecycle Workflow
              </h3>
              <div className="text-xs text-[#9ca3af]">
                Click on any order below to view detailed lifecycle
              </div>
            </div>
            <div className="flex items-center justify-between">
              {[
                "CREATED",
                "CONFIRMED",
                "PICK_RELEASED",
                "PICKING",
                "PICKED",
                "QC_IN_PROGRESS",
                "DISPATCHED",
                "IN_TRANSIT",
                "DELIVERED",
                "COMPLETED",
              ].map((status, index) => (
                <div key={status} className="flex items-center flex-1">
                  <div className="flex flex-col items-center flex-1">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${
                        index <= 2
                          ? "bg-cyan-500 border-cyan-500"
                          : index <= 5
                            ? "bg-yellow-500 border-yellow-500"
                            : index <= 7
                              ? "bg-blue-500 border-blue-500"
                              : "bg-green-500 border-green-500"
                      }`}
                    >
                      <i className="ri-check-line text-white text-xs"></i>
                    </div>
                    <div className="text-xs text-white mt-2 text-center">
                      {status.replace(/_/g, " ")}
                    </div>
                    <div className="text-xs text-[#9ca3af] mt-1">
                      {orders.filter((o) => o.status === status).length}
                    </div>
                  </div>
                  {index < 9 && (
                    <div
                      className={`h-0.5 flex-1 mx-1 ${
                        index < 3
                          ? "bg-cyan-500"
                          : index < 6
                            ? "bg-yellow-500"
                            : "bg-gray-500"
                      }`}
                    ></div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Individual Order Lifecycle Views */}
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-base font-semibold text-white">
                <i className="ri-flow-chart-line mr-2 text-cyan-400"></i>
                Individual Order Lifecycles
              </h4>
              <div className="text-xs text-[#9ca3af]">
                Showing {Math.min(filteredOrders.length, 5)} of{" "}
                {filteredOrders.length} orders
              </div>
            </div>
            {filteredOrders.slice(0, 5).map((order) => {
              // Initialize lifecycle for this order if needed
              const orderStatusIndex = [
                "CREATED",
                "CONFIRMED",
                "PICK_RELEASED",
                "PICKING",
                "PICKED",
                "QC_IN_PROGRESS",
                "QC_COMPLETED",
                "READY_FOR_DISPATCH",
                "DISPATCHED",
                "IN_TRANSIT",
                "DELIVERED",
                "DELIVERY_NOTE_ISSUED",
                "INVOICED",
                "COMPLETED",
              ].indexOf(order.status);
              const progressPercentage =
                orderStatusIndex >= 0
                  ? Math.round(((orderStatusIndex + 1) / 14) * 100)
                  : 0;

              return (
                <motion.div
                  key={order.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-4 hover:border-cyan-500/30 transition-all"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <h4 className="text-sm font-semibold text-white font-mono">
                          {order.soNumber}
                        </h4>
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium ${
                            order.status === "COMPLETED"
                              ? "bg-green-500/20 text-green-400 border border-green-500/30"
                              : order.status === "DISPATCHED" ||
                                  order.status === "IN_TRANSIT"
                                ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                                : order.status === "PICKING" ||
                                    order.status === "PICKED"
                                  ? "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30"
                                  : "bg-gray-500/20 text-gray-400 border border-gray-500/30"
                          }`}
                        >
                          {order.status.replace(/_/g, " ")}
                        </span>
                        {order.slaStatus && (
                          <span
                            className={`px-2 py-1 rounded text-xs font-medium ${
                              order.slaStatus === "ON_TIME"
                                ? "bg-green-500/20 text-green-400"
                                : order.slaStatus === "AT_RISK"
                                  ? "bg-yellow-500/20 text-yellow-400"
                                  : "bg-red-500/20 text-red-400"
                            }`}
                          >
                            {order.slaStatus === "ON_TIME"
                              ? "✓ On Time"
                              : order.slaStatus === "AT_RISK"
                                ? "⚠ At Risk"
                                : "✗ Breached"}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-[#9ca3af] mt-1">
                        {order.customerName}
                      </p>
                      <div className="mt-2 flex items-center gap-4 text-xs text-[#9ca3af]">
                        <div>Progress: {progressPercentage}%</div>
                        <div>
                          Value: {order.currency}{" "}
                          {order.totalValue.toLocaleString()}
                        </div>
                        <div>Items: {order.totalItems}</div>
                      </div>
                    </div>
                    <button
                      onClick={() => handleView(order)}
                      className="px-4 py-2 bg-cyan-600/20 text-cyan-400 border border-cyan-500/30 rounded-lg text-sm font-medium hover:bg-cyan-600/30 transition-colors flex items-center gap-2"
                    >
                      <i className="ri-eye-line"></i>
                      View Full Lifecycle
                    </button>
                  </div>
                  <div className="mt-3">
                    <LifecycleView
                      entityId={order.id}
                      entityType="SALES_ORDER"
                      viewMode="timeline"
                      showLayers={["overview"]}
                      enableRealTime={false}
                      enablePredictive={false}
                      onModuleLinkClick={(module, action, href) => {
                        if (href) {
                          router.push(href);
                        } else {
                          switch (module) {
                            case "picking":
                              router.push(`/picking?so=${order.soNumber}`);
                              break;
                            case "tracking":
                              router.push(`/tracking?so=${order.soNumber}`);
                              break;
                            case "pod":
                              router.push(`/pod?so=${order.soNumber}`);
                              break;
                            case "customers":
                              router.push(
                                `/customers?customer=${order.customerNumber}`,
                              );
                              break;
                          }
                        }
                      }}
                      height={180}
                    />
                  </div>
                </motion.div>
              );
            })}
            {filteredOrders.length === 0 && (
              <div className="bg-white/5 border border-white/10 rounded-xl p-8 text-center">
                <i className="ri-inbox-line text-4xl text-[#9ca3af] mb-3"></i>
                <div className="text-[#9ca3af]">
                  No orders match your filters
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="mb-6 flex items-center gap-4 flex-wrap">
        <div className="relative flex-1 min-w-[300px] max-w-md">
          <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-[#9ca3af] text-sm"></i>
          <input
            type="text"
            placeholder="Search by SO Number, Customer..."
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
          <option value="CONFIRMED">Confirmed</option>
          <option value="PICK_RELEASED">Pick Released</option>
          <option value="PICKING">Picking</option>
          <option value="PICKED">Picked</option>
          <option value="DISPATCHED">Dispatched</option>
          <option value="DELIVERED">Delivered</option>
          <option value="COMPLETED">Completed</option>
        </select>
        <select
          value={selectedPriority}
          onChange={(e) => setSelectedPriority(e.target.value)}
          className="bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 min-w-[150px]"
        >
          <option value="ALL">All Priority</option>
          <option value="URGENT">Urgent</option>
          <option value="HIGH">High</option>
          <option value="MEDIUM">Medium</option>
          <option value="LOW">Low</option>
        </select>
      </div>

      {/* Grid View */}
      {viewMode === "grid" && (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredOrders.map((order, index) => {
            const daysToDelivery = differenceInDays(
              new Date(order.expectedDeliveryDate),
              new Date(),
            );
            return (
              <motion.div
                key={order.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.03 }}
                className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-6 hover:border-cyan-500/50 hover:shadow-lg hover:shadow-cyan-500/10 transition-all cursor-pointer"
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <Tooltip
                      content={`Sales Order: ${order.soNumber}`}
                      position="top"
                    >
                      <h3 className="text-lg font-semibold text-white font-mono cursor-help mb-1">
                        {order.soNumber}
                      </h3>
                    </Tooltip>
                    <p className="text-sm text-[#9ca3af]">
                      {order.customerName}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium ${
                        order.status === "COMPLETED"
                          ? "bg-green-500/20 text-green-400 border border-green-500/30"
                          : order.status === "DISPATCHED" ||
                              order.status === "IN_TRANSIT"
                            ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                            : order.status === "PICKING" ||
                                order.status === "PICKED"
                              ? "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30"
                              : "bg-gray-500/20 text-gray-400 border border-gray-500/30"
                      }`}
                    >
                      {order.status.replace(/_/g, " ")}
                    </span>
                    {order.slaStatus && (
                      <span
                        className={`px-2 py-0.5 rounded text-xs font-medium ${
                          order.slaStatus === "ON_TIME"
                            ? "bg-green-500/20 text-green-400"
                            : order.slaStatus === "AT_RISK"
                              ? "bg-yellow-500/20 text-yellow-400"
                              : "bg-red-500/20 text-red-400"
                        }`}
                      >
                        {order.slaStatus === "ON_TIME"
                          ? "✓ On Time"
                          : order.slaStatus === "AT_RISK"
                            ? "⚠ At Risk"
                            : "✗ Breached"}
                      </span>
                    )}
                  </div>
                </div>
                <div className="space-y-2 mb-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-[#9ca3af]">Expected Delivery:</span>
                    <span
                      className={`font-medium ${
                        daysToDelivery < 0
                          ? "text-red-400"
                          : daysToDelivery < 2
                            ? "text-yellow-400"
                            : "text-white"
                      }`}
                    >
                      {format(
                        new Date(order.expectedDeliveryDate),
                        "MMM dd, yyyy",
                      )}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-[#9ca3af]">Priority:</span>
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium ${
                        order.priority === "URGENT"
                          ? "bg-red-500/20 text-red-400 border border-red-500/30"
                          : order.priority === "HIGH"
                            ? "bg-orange-500/20 text-orange-400 border border-orange-500/30"
                            : "bg-gray-500/20 text-gray-400 border border-gray-500/30"
                      }`}
                    >
                      {order.priority}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-[#9ca3af]">Total Value:</span>
                    <span className="text-white font-medium">
                      {order.currency} {order.totalValue.toLocaleString()}
                    </span>
                  </div>
                  {order.fulfillmentProgress !== undefined && (
                    <div>
                      <div className="flex items-center justify-between text-xs text-[#9ca3af] mb-1">
                        <span>Fulfillment Progress</span>
                        <span>{order.fulfillmentProgress}%</span>
                      </div>
                      <div className="w-full bg-white/10 rounded-full h-2">
                        <div
                          className="bg-cyan-500 h-2 rounded-full transition-all"
                          style={{ width: `${order.fulfillmentProgress}%` }}
                        ></div>
                      </div>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2 pt-4 border-t border-white/10">
                  <QRCodeBadge
                    entityId={order.id}
                    entityType="sales-order"
                    entityName={order.soNumber}
                    documentType="other"
                    documentUrl={`/sales-orders?so=${order.soNumber}`}
                    module="sales"
                    size="sm"
                  />
                  <Tooltip content="View Order Details" position="top">
                    <button
                      onClick={() => handleView(order)}
                      className="flex-1 px-3 py-2 bg-cyan-600/20 text-cyan-400 border border-cyan-500/30 rounded text-sm font-medium hover:bg-cyan-600/30 transition-colors"
                    >
                      <i className="ri-eye-line mr-1"></i>
                      View
                    </button>
                  </Tooltip>
                  <Tooltip content="Fulfillment Tracking" position="top">
                    <button
                      onClick={() => handleFulfillment(order)}
                      className="px-3 py-2 bg-blue-600/20 text-blue-400 border border-blue-500/30 rounded text-sm font-medium hover:bg-blue-600/30 transition-colors"
                    >
                      <i className="ri-route-line"></i>
                    </button>
                  </Tooltip>
                  {["CONFIRMED", "PICK_RELEASED", "PICKING", "PICKED"].includes(
                    order.status,
                  ) && (
                    <Tooltip content="Go to Picking" position="top">
                      <button
                        onClick={() => handleNavigateToPicking(order)}
                        className="px-3 py-2 bg-green-600/20 text-green-400 border border-green-500/30 rounded text-sm font-medium hover:bg-green-600/30 transition-colors"
                      >
                        <i className="ri-handbag-line"></i>
                      </button>
                    </Tooltip>
                  )}
                  {["DISPATCHED", "IN_TRANSIT"].includes(order.status) && (
                    <Tooltip content="Track Shipment" position="top">
                      <button
                        onClick={() => handleNavigateToTracking(order)}
                        className="px-3 py-2 bg-purple-600/20 text-purple-400 border border-purple-500/30 rounded text-sm font-medium hover:bg-purple-600/30 transition-colors"
                      >
                        <i className="ri-map-pin-line"></i>
                      </button>
                    </Tooltip>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Table View */}
      {viewMode === "table" && (
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden">
          <div className="p-4 border-b border-white/10 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-white">Sales Orders</h3>
            <ExportButton
              data={filteredOrders.map((order) => ({
                soNumber: order.soNumber,
                customerNumber: order.customerNumber,
                customerName: order.customerName,
                orderDate: format(new Date(order.orderDate), "yyyy-MM-dd"),
                expectedDeliveryDate: format(
                  new Date(order.expectedDeliveryDate),
                  "yyyy-MM-dd",
                ),
                status: order.status,
                totalValue: order.totalValue,
                currency: order.currency,
                totalItems: order.totalItems,
                totalQuantity: order.totalQuantity,
                priority: order.priority,
                fulfillmentProgress: order.fulfillmentProgress || 0,
                slaStatus: order.slaStatus || "",
              }))}
              columns={[
                { key: "soNumber", label: "SO Number" },
                { key: "customerName", label: "Customer" },
                { key: "orderDate", label: "Order Date" },
                { key: "expectedDeliveryDate", label: "Expected Delivery" },
                { key: "status", label: "Status" },
                { key: "totalValue", label: "Total Value" },
                { key: "totalItems", label: "Items" },
                { key: "priority", label: "Priority" },
              ]}
              filename="sales-orders"
              title="Sales Orders"
            />
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-white/5 border-b border-white/10">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium text-[#9ca3af] uppercase tracking-wider">
                    SO Number
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-[#9ca3af] uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-[#9ca3af] uppercase tracking-wider">
                    Order Date
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-[#9ca3af] uppercase tracking-wider">
                    Expected Delivery
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-[#9ca3af] uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-[#9ca3af] uppercase tracking-wider">
                    SLA
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-[#9ca3af] uppercase tracking-wider">
                    Progress
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-[#9ca3af] uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {filteredOrders.map((order, index) => {
                  const daysToDelivery = differenceInDays(
                    new Date(order.expectedDeliveryDate),
                    new Date(),
                  );
                  return (
                    <motion.tr
                      key={order.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.02 }}
                      className="hover:bg-white/5 transition-colors"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-white font-mono">
                          {order.soNumber}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-white">
                          {order.customerName}
                        </div>
                        <div className="text-xs text-[#9ca3af] font-mono">
                          {order.customerNumber}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-white">
                          {format(new Date(order.orderDate), "MMM dd, yyyy")}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div
                          className={`text-sm font-medium ${
                            daysToDelivery < 0
                              ? "text-red-400"
                              : daysToDelivery < 2
                                ? "text-yellow-400"
                                : "text-white"
                          }`}
                        >
                          {format(
                            new Date(order.expectedDeliveryDate),
                            "MMM dd, yyyy",
                          )}
                        </div>
                        <div className="text-xs text-[#9ca3af]">
                          {daysToDelivery < 0
                            ? `${Math.abs(daysToDelivery)}d overdue`
                            : `${daysToDelivery}d remaining`}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium ${
                            order.status === "COMPLETED"
                              ? "bg-green-500/20 text-green-400 border border-green-500/30"
                              : order.status === "DISPATCHED" ||
                                  order.status === "IN_TRANSIT"
                                ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                                : order.status === "PICKING" ||
                                    order.status === "PICKED"
                                  ? "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30"
                                  : "bg-gray-500/20 text-gray-400 border border-gray-500/30"
                          }`}
                        >
                          {order.status.replace(/_/g, " ")}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {order.slaStatus && (
                          <span
                            className={`px-2 py-1 rounded text-xs font-medium ${
                              order.slaStatus === "ON_TIME"
                                ? "bg-green-500/20 text-green-400"
                                : order.slaStatus === "AT_RISK"
                                  ? "bg-yellow-500/20 text-yellow-400"
                                  : "bg-red-500/20 text-red-400"
                            }`}
                          >
                            {order.slaStatus === "ON_TIME"
                              ? "✓ On Time"
                              : order.slaStatus === "AT_RISK"
                                ? "⚠ At Risk"
                                : "✗ Breached"}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="w-24 bg-white/10 rounded-full h-2">
                          <div
                            className="bg-cyan-500 h-2 rounded-full transition-all"
                            style={{
                              width: `${order.fulfillmentProgress || 0}%`,
                            }}
                          ></div>
                        </div>
                        <div className="text-xs text-[#9ca3af] mt-1">
                          {order.fulfillmentProgress || 0}%
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <QRCodeBadge
                            entityId={order.id}
                            entityType="sales-order"
                            entityName={order.soNumber}
                            documentType="other"
                            documentUrl={`/sales-orders?so=${order.soNumber}`}
                            module="sales"
                            size="sm"
                          />
                          <Tooltip content="View Details" position="top">
                            <button
                              onClick={() => handleView(order)}
                              className="p-2 bg-cyan-600/20 text-cyan-400 border border-cyan-500/30 rounded hover:bg-cyan-600/30 transition-colors"
                            >
                              <i className="ri-eye-line"></i>
                            </button>
                          </Tooltip>
                          <Tooltip
                            content="Fulfillment Tracking"
                            position="top"
                          >
                            <button
                              onClick={() => handleFulfillment(order)}
                              className="p-2 bg-blue-600/20 text-blue-400 border border-blue-500/30 rounded hover:bg-blue-600/30 transition-colors"
                            >
                              <i className="ri-route-line"></i>
                            </button>
                          </Tooltip>
                          {[
                            "CONFIRMED",
                            "PICK_RELEASED",
                            "PICKING",
                            "PICKED",
                          ].includes(order.status) && (
                            <Tooltip content="Go to Picking" position="top">
                              <button
                                onClick={() => handleNavigateToPicking(order)}
                                className="p-2 bg-green-600/20 text-green-400 border border-green-500/30 rounded hover:bg-green-600/30 transition-colors"
                              >
                                <i className="ri-handbag-line"></i>
                              </button>
                            </Tooltip>
                          )}
                          {["DISPATCHED", "IN_TRANSIT"].includes(
                            order.status,
                          ) && (
                            <Tooltip content="Track Shipment" position="top">
                              <button
                                onClick={() => handleNavigateToTracking(order)}
                                className="p-2 bg-purple-600/20 text-purple-400 border border-purple-500/30 rounded hover:bg-purple-600/30 transition-colors"
                              >
                                <i className="ri-map-pin-line"></i>
                              </button>
                            </Tooltip>
                          )}
                        </div>
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* View Details Modal */}
      <Modal
        isOpen={showViewModal}
        onClose={() => {
          setShowViewModal(false);
          setSelectedOrder(null);
        }}
        title={`Sales Order Details - ${selectedOrder?.soNumber || ""}`}
        size="lg"
      >
        {selectedOrder && (
          <div className="space-y-4">
            {/* QR Code Section */}
            <div className="bg-white/5 rounded-lg p-4 border border-cyan-500/20">
              <UniversalQRGenerator
                entityId={selectedOrder.id}
                entityType="sales-order"
                entityName={selectedOrder.soNumber}
                documentType="other"
                documentUrl={`/sales-orders?so=${selectedOrder.soNumber}`}
                module="sales"
                showAdvanced={false}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-[#9ca3af] mb-1 block">
                  SO Number
                </label>
                <div className="text-sm text-white font-mono">
                  {selectedOrder.soNumber}
                </div>
              </div>
              <div>
                <label className="text-xs text-[#9ca3af] mb-1 block">
                  Customer
                </label>
                <div className="text-sm text-white">
                  {selectedOrder.customerName}
                </div>
                <div className="text-xs text-[#9ca3af] font-mono">
                  {selectedOrder.customerNumber}
                </div>
              </div>
              <div>
                <label className="text-xs text-[#9ca3af] mb-1 block">
                  Order Date
                </label>
                <div className="text-sm text-white">
                  {format(new Date(selectedOrder.orderDate), "MMM dd, yyyy")}
                </div>
              </div>
              <div>
                <label className="text-xs text-[#9ca3af] mb-1 block">
                  Expected Delivery
                </label>
                <div className="text-sm text-white">
                  {format(
                    new Date(selectedOrder.expectedDeliveryDate),
                    "MMM dd, yyyy",
                  )}
                </div>
              </div>
              <div>
                <label className="text-xs text-[#9ca3af] mb-1 block">
                  Status
                </label>
                <span
                  className={`px-2 py-1 rounded text-xs font-medium ${
                    selectedOrder.status === "COMPLETED"
                      ? "bg-green-500/20 text-green-400"
                      : selectedOrder.status === "DISPATCHED"
                        ? "bg-blue-500/20 text-blue-400"
                        : "bg-yellow-500/20 text-yellow-400"
                  }`}
                >
                  {selectedOrder.status.replace(/_/g, " ")}
                </span>
              </div>
              <div>
                <label className="text-xs text-[#9ca3af] mb-1 block">
                  SLA Status
                </label>
                {selectedOrder.slaStatus && (
                  <span
                    className={`px-2 py-1 rounded text-xs font-medium ${
                      selectedOrder.slaStatus === "ON_TIME"
                        ? "bg-green-500/20 text-green-400"
                        : selectedOrder.slaStatus === "AT_RISK"
                          ? "bg-yellow-500/20 text-yellow-400"
                          : "bg-red-500/20 text-red-400"
                    }`}
                  >
                    {selectedOrder.slaStatus === "ON_TIME"
                      ? "On Time"
                      : selectedOrder.slaStatus === "AT_RISK"
                        ? "At Risk"
                        : "Breached"}
                  </span>
                )}
              </div>
              <div>
                <label className="text-xs text-[#9ca3af] mb-1 block">
                  Total Value
                </label>
                <CurrencyDisplay
                  amount={selectedOrder.totalValue}
                  size="sm"
                  variant="highlight"
                />
              </div>
              <div>
                <label className="text-xs text-[#9ca3af] mb-1 block">
                  Priority
                </label>
                <span
                  className={`px-2 py-1 rounded text-xs font-medium ${
                    selectedOrder.priority === "URGENT"
                      ? "bg-red-500/20 text-red-400"
                      : selectedOrder.priority === "HIGH"
                        ? "bg-orange-500/20 text-orange-400"
                        : "bg-gray-500/20 text-gray-400"
                  }`}
                >
                  {selectedOrder.priority}
                </span>
              </div>
            </div>
            <div className="pt-4 border-t border-white/10">
              <label className="text-xs text-[#9ca3af] mb-2 block">
                Order Items
              </label>
              <div className="space-y-2">
                {selectedOrder.items.map((item, idx) => (
                  <div
                    key={idx}
                    className="bg-white/5 rounded-lg p-3 flex items-center justify-between"
                  >
                    <div>
                      <button
                        onClick={() =>
                          router.push(
                            `/inventory?material=${item.materialNumber}`,
                          )
                        }
                        className="text-sm text-white font-mono hover:text-cyan-400 transition-colors cursor-pointer"
                      >
                        {item.materialNumber}
                      </button>
                      <div className="text-xs text-[#9ca3af]">
                        Qty: {item.quantity.toFixed(2)} {item.unit}
                      </div>
                    </div>
                    <div className="text-sm text-white font-medium">
                      {selectedOrder.currency} {item.price.toFixed(2)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="pt-4 border-t border-white/10">
              <ModuleLinks links={getSalesOrderLinks(selectedOrder.soNumber)} />
            </div>

            {/* Enhanced Lifecycle View in Modal */}
            <div className="pt-4 border-t border-white/10">
              <h4 className="text-sm font-semibold text-white mb-3">
                Order Lifecycle
              </h4>
              <div className="max-h-[400px] overflow-y-auto">
                <LifecycleView
                  entityId={selectedOrder.id}
                  entityType="SALES_ORDER"
                  viewMode="timeline"
                  showLayers={["overview", "details", "modules"]}
                  enableRealTime={true}
                  enablePredictive={false}
                  onModuleLinkClick={(module, action, href) => {
                    if (href) {
                      router.push(href);
                    } else {
                      switch (module) {
                        case "picking":
                          router.push(`/picking?so=${selectedOrder.soNumber}`);
                          break;
                        case "tracking":
                          router.push(`/tracking?so=${selectedOrder.soNumber}`);
                          break;
                        case "pod":
                          router.push(`/pod?so=${selectedOrder.soNumber}`);
                          break;
                        case "customers":
                          router.push(
                            `/customers?customer=${selectedOrder.customerNumber}`,
                          );
                          break;
                      }
                    }
                  }}
                  height={350}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 pt-4 border-t border-white/10">
              {["CONFIRMED", "PICK_RELEASED", "PICKING", "PICKED"].includes(
                selectedOrder.status,
              ) && (
                <button
                  onClick={() => handleNavigateToPicking(selectedOrder)}
                  className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  <i className="ri-handbag-line"></i>
                  View Picking
                </button>
              )}
              {["DISPATCHED", "IN_TRANSIT", "DELIVERED", "COMPLETED"].includes(
                selectedOrder.status,
              ) && (
                <button
                  onClick={() => handleNavigateToTracking(selectedOrder)}
                  className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  <i className="ri-map-pin-line"></i>
                  Track Shipment
                </button>
              )}
              {["DELIVERED", "COMPLETED"].includes(selectedOrder.status) && (
                <button
                  onClick={() => handleNavigateToPOD(selectedOrder)}
                  className="px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  <i className="ri-file-check-line"></i>
                  View POD
                </button>
              )}
              <button
                onClick={() => handleNavigateToCustomer(selectedOrder)}
                className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <i className="ri-user-line"></i>
                View Customer
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Fulfillment Tracking Modal */}
      <Modal
        isOpen={showFulfillmentModal}
        onClose={() => {
          setShowFulfillmentModal(false);
          setSelectedOrder(null);
        }}
        title={`Fulfillment Tracking - ${selectedOrder?.soNumber || ""}`}
        size="lg"
      >
        {selectedOrder && (
          <div className="space-y-4">
            <div className="bg-white/5 rounded-lg p-4">
              <h4 className="text-sm font-semibold text-white mb-3">
                Order Fulfillment Timeline
              </h4>
              <div className="space-y-3">
                {[
                  "CREATED",
                  "CONFIRMED",
                  "PICK_RELEASED",
                  "PICKING",
                  "PICKED",
                  "QC_IN_PROGRESS",
                  "DISPATCHED",
                  "IN_TRANSIT",
                  "DELIVERED",
                  "COMPLETED",
                ].map((status, idx) => {
                  const isCompleted =
                    [
                      "CREATED",
                      "CONFIRMED",
                      "PICK_RELEASED",
                      "PICKING",
                      "PICKED",
                      "QC_IN_PROGRESS",
                      "DISPATCHED",
                      "IN_TRANSIT",
                      "DELIVERED",
                      "COMPLETED",
                    ].indexOf(selectedOrder.status) >= idx;
                  return (
                    <div key={status} className="flex items-center gap-3">
                      <div
                        className={`w-3 h-3 rounded-full ${isCompleted ? "bg-green-400" : "bg-gray-500"}`}
                      ></div>
                      <div className="flex-1">
                        <div
                          className={`text-sm ${isCompleted ? "text-white" : "text-[#9ca3af]"}`}
                        >
                          {status.replace(/_/g, " ")}
                        </div>
                        {isCompleted &&
                          idx ===
                            [
                              "CREATED",
                              "CONFIRMED",
                              "PICK_RELEASED",
                              "PICKING",
                              "PICKED",
                              "QC_IN_PROGRESS",
                              "DISPATCHED",
                              "IN_TRANSIT",
                              "DELIVERED",
                              "COMPLETED",
                            ].indexOf(selectedOrder.status) && (
                            <div className="text-xs text-[#9ca3af]">
                              Current Status
                            </div>
                          )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            {selectedOrder.fulfillmentProgress !== undefined && (
              <div>
                <div className="flex items-center justify-between text-sm text-[#9ca3af] mb-2">
                  <span>Fulfillment Progress</span>
                  <span>{selectedOrder.fulfillmentProgress}%</span>
                </div>
                <div className="w-full bg-white/10 rounded-full h-3">
                  <div
                    className="bg-cyan-500 h-3 rounded-full transition-all"
                    style={{ width: `${selectedOrder.fulfillmentProgress}%` }}
                  ></div>
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </PageTemplate>
  );
}
