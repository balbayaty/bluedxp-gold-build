"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import PageTemplate from "@/components/PageTemplate";
import Tooltip from "@/components/Tooltip";
import Modal from "@/components/Modal";
import ModuleLinks from "@/components/ModuleLinks";
import {
  generateSalesOrders,
  generatePurchaseOrders,
  generateCustomerMaster,
} from "@/utils/mockDataGenerators";
import {
  getSalesOrderLinks,
  getPurchaseOrderLinks,
} from "@/utils/moduleInterconnectivity";
import { format, subDays, differenceInDays, differenceInHours } from "date-fns";
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
import { logger } from "@/lib/services/observability/logger";

interface SalesOrder {
  id: string;
  soNumber: string;
  customerNumber: string;
  customerName: string;
  orderDate: Date | string;
  expectedDeliveryDate: Date | string;
  status: string;
  totalValue: number;
  currency: string;
  totalItems: number;
  totalQuantity: number;
  priority: string;
  fulfillmentProgress?: number;
  slaStatus?: string;
  actualDeliveryDate?: Date | string;
}

interface PurchaseOrder {
  id: string;
  poNumber: string;
  vendorNumber: string;
  vendorName: string;
  orderDate: Date | string;
  expectedDeliveryDate: Date | string;
  status: string;
  totalValue: number;
  currency: string;
  totalItems: number;
  totalQuantity: number;
  priority: string;
  receivedQuantity?: number;
  receivedValue?: number;
}

export default function OrderReports() {
  const router = useRouter();
  const [salesOrders, setSalesOrders] = useState<SalesOrder[]>(() =>
    generateSalesOrders(100),
  );
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>(() =>
    generatePurchaseOrders(80),
  );
  const [dateRange, setDateRange] = useState<"7d" | "30d" | "90d" | "custom">(
    "30d",
  );
  const [orderType, setOrderType] = useState<"all" | "sales" | "purchase">(
    "all",
  );
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");
  const [viewMode, setViewMode] = useState<
    "overview" | "fulfillment" | "customer" | "vendor" | "trends"
  >("overview");
  const [showExportModal, setShowExportModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<
    SalesOrder | PurchaseOrder | null
  >(null);
  const [showViewModal, setShowViewModal] = useState(false);

  // Filter orders by date range
  const filteredSalesOrders = useMemo(() => {
    const now = new Date();
    let startDate: Date;
    switch (dateRange) {
      case "7d":
        startDate = subDays(now, 7);
        break;
      case "30d":
        startDate = subDays(now, 30);
        break;
      case "90d":
        startDate = subDays(now, 90);
        break;
      default:
        startDate = subDays(now, 30);
    }

    return salesOrders.filter((order) => {
      const orderDate = new Date(order.orderDate);
      const matchesDate = orderDate >= startDate;
      const matchesStatus =
        selectedStatus === "ALL" || order.status === selectedStatus;
      return matchesDate && matchesStatus;
    });
  }, [salesOrders, dateRange, selectedStatus]);

  const filteredPurchaseOrders = useMemo(() => {
    const now = new Date();
    let startDate: Date;
    switch (dateRange) {
      case "7d":
        startDate = subDays(now, 7);
        break;
      case "30d":
        startDate = subDays(now, 30);
        break;
      case "90d":
        startDate = subDays(now, 90);
        break;
      default:
        startDate = subDays(now, 30);
    }

    return purchaseOrders.filter((order) => {
      const orderDate = new Date(order.orderDate);
      const matchesDate = orderDate >= startDate;
      const matchesStatus =
        selectedStatus === "ALL" || order.status === selectedStatus;
      return matchesDate && matchesStatus;
    });
  }, [purchaseOrders, dateRange, selectedStatus]);

  // Aggregate statistics
  const aggregateStats = useMemo(() => {
    const totalSalesValue = filteredSalesOrders.reduce(
      (sum, order) => sum + order.totalValue,
      0,
    );
    const totalPurchaseValue = filteredPurchaseOrders.reduce(
      (sum, order) => sum + order.totalValue,
      0,
    );
    const totalSalesOrders = filteredSalesOrders.length;
    const totalPurchaseOrders = filteredPurchaseOrders.length;
    const avgSalesOrderValue =
      totalSalesOrders > 0 ? totalSalesValue / totalSalesOrders : 0;
    const avgPurchaseOrderValue =
      totalPurchaseOrders > 0 ? totalPurchaseValue / totalPurchaseOrders : 0;

    // Fulfillment metrics
    const completedSalesOrders = filteredSalesOrders.filter(
      (o) => o.status === "COMPLETED" || o.status === "DELIVERED",
    ).length;
    const completedPurchaseOrders = filteredPurchaseOrders.filter(
      (o) => o.status === "COMPLETED" || o.status === "RECEIVED",
    ).length;
    const salesFulfillmentRate =
      totalSalesOrders > 0
        ? (completedSalesOrders / totalSalesOrders) * 100
        : 0;
    const purchaseFulfillmentRate =
      totalPurchaseOrders > 0
        ? (completedPurchaseOrders / totalPurchaseOrders) * 100
        : 0;

    // On-time delivery
    const onTimeSalesOrders = filteredSalesOrders.filter((o) => {
      if (
        o.status === "COMPLETED" &&
        o.actualDeliveryDate &&
        o.expectedDeliveryDate
      ) {
        return (
          new Date(o.actualDeliveryDate) <= new Date(o.expectedDeliveryDate)
        );
      }
      return false;
    }).length;
    const onTimeSalesRate =
      completedSalesOrders > 0
        ? (onTimeSalesOrders / completedSalesOrders) * 100
        : 0;

    return {
      totalSalesValue,
      totalPurchaseValue,
      totalSalesOrders,
      totalPurchaseOrders,
      avgSalesOrderValue,
      avgPurchaseOrderValue,
      salesFulfillmentRate,
      purchaseFulfillmentRate,
      onTimeSalesRate,
      completedSalesOrders,
      completedPurchaseOrders,
    };
  }, [filteredSalesOrders, filteredPurchaseOrders]);

  // Status distribution
  const salesStatusDistribution = useMemo(() => {
    const statusCounts: Record<string, number> = {};
    filteredSalesOrders.forEach((order) => {
      statusCounts[order.status] = (statusCounts[order.status] || 0) + 1;
    });
    return Object.entries(statusCounts).map(([status, count]) => ({
      status,
      count,
    }));
  }, [filteredSalesOrders]);

  const purchaseStatusDistribution = useMemo(() => {
    const statusCounts: Record<string, number> = {};
    filteredPurchaseOrders.forEach((order) => {
      statusCounts[order.status] = (statusCounts[order.status] || 0) + 1;
    });
    return Object.entries(statusCounts).map(([status, count]) => ({
      status,
      count,
    }));
  }, [filteredPurchaseOrders]);

  // Order value trend
  const orderValueTrend = useMemo(() => {
    const days = dateRange === "7d" ? 7 : dateRange === "30d" ? 30 : 90;
    const dailyData: Record<
      string,
      {
        date: string;
        salesValue: number;
        purchaseValue: number;
        salesCount: number;
        purchaseCount: number;
      }
    > = {};

    filteredSalesOrders.forEach((order) => {
      const date = format(new Date(order.orderDate), "yyyy-MM-dd");
      if (!dailyData[date]) {
        dailyData[date] = {
          date,
          salesValue: 0,
          purchaseValue: 0,
          salesCount: 0,
          purchaseCount: 0,
        };
      }
      dailyData[date].salesValue += order.totalValue;
      dailyData[date].salesCount += 1;
    });

    filteredPurchaseOrders.forEach((order) => {
      const date = format(new Date(order.orderDate), "yyyy-MM-dd");
      if (!dailyData[date]) {
        dailyData[date] = {
          date,
          salesValue: 0,
          purchaseValue: 0,
          salesCount: 0,
          purchaseCount: 0,
        };
      }
      dailyData[date].purchaseValue += order.totalValue;
      dailyData[date].purchaseCount += 1;
    });

    return Object.values(dailyData)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .map((d) => ({
        date: format(new Date(d.date), "MMM dd"),
        salesValue: d.salesValue,
        purchaseValue: d.purchaseValue,
        salesCount: d.salesCount,
        purchaseCount: d.purchaseCount,
      }));
  }, [filteredSalesOrders, filteredPurchaseOrders, dateRange]);

  // Customer performance
  const customerPerformance = useMemo(() => {
    const customerData: Record<
      string,
      {
        customer: string;
        orders: number;
        value: number;
        avgOrderValue: number;
        onTimeRate: number;
        completedOrders: number;
      }
    > = {};

    filteredSalesOrders.forEach((order) => {
      if (!customerData[order.customerNumber]) {
        customerData[order.customerNumber] = {
          customer: order.customerName,
          orders: 0,
          value: 0,
          avgOrderValue: 0,
          onTimeRate: 0,
          completedOrders: 0,
        };
      }
      customerData[order.customerNumber].orders += 1;
      customerData[order.customerNumber].value += order.totalValue;

      if (order.status === "COMPLETED" || order.status === "DELIVERED") {
        customerData[order.customerNumber].completedOrders += 1;
      }
    });

    return Object.values(customerData)
      .map((c) => ({
        ...c,
        avgOrderValue: c.orders > 0 ? c.value / c.orders : 0,
        onTimeRate:
          c.completedOrders > 0 ? (c.completedOrders / c.orders) * 100 : 0,
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 20);
  }, [filteredSalesOrders]);

  // Vendor performance
  const vendorPerformance = useMemo(() => {
    const vendorData: Record<
      string,
      {
        vendor: string;
        orders: number;
        value: number;
        avgOrderValue: number;
        receivedOrders: number;
      }
    > = {};

    filteredPurchaseOrders.forEach((order) => {
      if (!vendorData[order.vendorNumber]) {
        vendorData[order.vendorNumber] = {
          vendor: order.vendorName,
          orders: 0,
          value: 0,
          avgOrderValue: 0,
          receivedOrders: 0,
        };
      }
      vendorData[order.vendorNumber].orders += 1;
      vendorData[order.vendorNumber].value += order.totalValue;

      if (order.status === "COMPLETED" || order.status === "RECEIVED") {
        vendorData[order.vendorNumber].receivedOrders += 1;
      }
    });

    return Object.values(vendorData)
      .map((v) => ({
        ...v,
        avgOrderValue: v.orders > 0 ? v.value / v.orders : 0,
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 20);
  }, [filteredPurchaseOrders]);

  const stats = [
    {
      label: "Total Sales Value",
      value: `$${aggregateStats.totalSalesValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      icon: "ri-shopping-cart-line",
      tooltip: "Total sales order value",
      trend: "up" as const,
    },
    {
      label: "Total Purchase Value",
      value: `$${aggregateStats.totalPurchaseValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      icon: "ri-file-list-line",
      tooltip: "Total purchase order value",
      trend: "up" as const,
    },
    {
      label: "Sales Fulfillment",
      value: `${aggregateStats.salesFulfillmentRate.toFixed(1)}%`,
      icon: "ri-checkbox-circle-line",
      tooltip: "Sales order fulfillment rate",
      trend: "up" as const,
    },
    {
      label: "On-Time Delivery",
      value: `${aggregateStats.onTimeSalesRate.toFixed(1)}%`,
      icon: "ri-time-line",
      tooltip: "On-time delivery rate",
      trend: "up" as const,
    },
  ];

  const handleView = (order: SalesOrder | PurchaseOrder) => {
    setSelectedOrder(order);
    setShowViewModal(true);
  };

  const handleExport = (format: "pdf" | "excel" | "csv") => {
    logger.info("Exporting order report", undefined, {
      module: "reports",
      service: "orders",
      exportFormat: format,
    });
    setShowExportModal(false);
  };

  return (
    <PageTemplate
      title="Order Reports"
      description="Comprehensive order analytics, fulfillment metrics, customer and vendor performance reports"
      icon="ri-shopping-cart-line"
      systemInfo={{
        sap: "Order Reports, Sales Analytics",
        oracle: "Order Analytics, Fulfillment Reports",
        manhattan: "Order Reports, Performance Analytics",
      }}
      examples={[
        "Sales and purchase order analytics",
        "Fulfillment and on-time delivery metrics",
        "Customer and vendor performance",
        "Order value trends",
        "Status distribution analysis",
        "Export to PDF, Excel, CSV",
      ]}
      stats={stats}
      actions={
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-lg p-1">
            {(
              [
                "overview",
                "fulfillment",
                "customer",
                "vendor",
                "trends",
              ] as const
            ).map((mode) => (
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
                  className={`ri-${mode === "overview" ? "dashboard-line" : mode === "fulfillment" ? "checkbox-circle-line" : mode === "customer" ? "user-line" : mode === "vendor" ? "store-line" : "line-chart-line"} mr-1`}
                ></i>
                {mode.charAt(0).toUpperCase() + mode.slice(1)}
              </button>
            ))}
          </div>
          <button
            onClick={() => setShowExportModal(true)}
            className="bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white px-6 py-3 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 shadow-lg shadow-purple-500/20"
          >
            <i className="ri-download-line"></i>
            Export
          </button>
        </div>
      }
    >
      {/* Filters */}
      <div className="mb-6 flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-lg p-1">
          {(["7d", "30d", "90d"] as const).map((range) => (
            <button
              key={range}
              onClick={() => setDateRange(range)}
              className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                dateRange === range
                  ? "bg-cyan-500 text-white"
                  : "text-[#9ca3af] hover:text-white"
              }`}
            >
              {range === "7d"
                ? "7 Days"
                : range === "30d"
                  ? "30 Days"
                  : "90 Days"}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-lg p-1">
          {(["all", "sales", "purchase"] as const).map((type) => (
            <button
              key={type}
              onClick={() => setOrderType(type)}
              className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                orderType === type
                  ? "bg-cyan-500 text-white"
                  : "text-[#9ca3af] hover:text-white"
              }`}
            >
              {type.charAt(0).toUpperCase() + type.slice(1)}
            </button>
          ))}
        </div>
        <select
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
          className="bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 min-w-[150px]"
        >
          <option value="ALL">All Statuses</option>
          {Array.from(
            new Set([
              ...salesOrders.map((o) => o.status),
              ...purchaseOrders.map((o) => o.status),
            ]),
          ).map((status) => (
            <option key={status} value={status}>
              {status.replace(/_/g, " ")}
            </option>
          ))}
        </select>
      </div>

      {/* Overview View */}
      {viewMode === "overview" && (
        <div className="space-y-6">
          {/* Key Metrics */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 cursor-pointer hover:border-cyan-500/50 transition-all"
              onClick={() => router.push("/sales-orders")}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="text-3xl font-bold text-white">
                  {aggregateStats.totalSalesOrders}
                </div>
                <div className="w-12 h-12 rounded-lg bg-cyan-500/20 flex items-center justify-center">
                  <i className="ri-shopping-cart-line text-2xl text-cyan-400"></i>
                </div>
              </div>
              <div className="text-sm text-[#9ca3af]">Sales Orders</div>
              <div className="text-xs text-cyan-400 mt-2">
                Click to view details
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 cursor-pointer hover:border-cyan-500/50 transition-all"
              onClick={() => router.push("/purchase-orders")}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="text-3xl font-bold text-white">
                  {aggregateStats.totalPurchaseOrders}
                </div>
                <div className="w-12 h-12 rounded-lg bg-blue-500/20 flex items-center justify-center">
                  <i className="ri-file-list-line text-2xl text-blue-400"></i>
                </div>
              </div>
              <div className="text-sm text-[#9ca3af]">Purchase Orders</div>
              <div className="text-xs text-cyan-400 mt-2">
                Click to view details
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="text-3xl font-bold text-white">
                  {aggregateStats.salesFulfillmentRate.toFixed(1)}%
                </div>
                <div className="w-12 h-12 rounded-lg bg-green-500/20 flex items-center justify-center">
                  <i className="ri-checkbox-circle-line text-2xl text-green-400"></i>
                </div>
              </div>
              <div className="text-sm text-[#9ca3af]">
                Sales Fulfillment Rate
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="text-3xl font-bold text-white">
                  {aggregateStats.onTimeSalesRate.toFixed(1)}%
                </div>
                <div className="w-12 h-12 rounded-lg bg-purple-500/20 flex items-center justify-center">
                  <i className="ri-time-line text-2xl text-purple-400"></i>
                </div>
              </div>
              <div className="text-sm text-[#9ca3af]">On-Time Delivery</div>
            </motion.div>
          </div>

          {/* Order Value Trend */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
          >
            <h3 className="text-lg font-semibold text-white mb-4">
              Order Value Trend
            </h3>
            <ResponsiveContainer width="100%" height={400}>
              <ComposedChart data={orderValueTrend}>
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
                <Bar
                  yAxisId="left"
                  dataKey="salesValue"
                  fill="#06b6d4"
                  name="Sales Value ($)"
                />
                <Bar
                  yAxisId="left"
                  dataKey="purchaseValue"
                  fill="#3b82f6"
                  name="Purchase Value ($)"
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="salesCount"
                  stroke="#10b981"
                  strokeWidth={2}
                  name="Sales Count"
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="purchaseCount"
                  stroke="#8b5cf6"
                  strokeWidth={2}
                  name="Purchase Count"
                />
                <Legend />
              </ComposedChart>
            </ResponsiveContainer>
          </motion.div>

          {/* Status Distribution */}
          <div className="grid md:grid-cols-2 gap-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
            >
              <h3 className="text-lg font-semibold text-white mb-4">
                Sales Order Status
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={salesStatusDistribution}
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
                    {salesStatusDistribution.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={
                          [
                            "#06b6d4",
                            "#3b82f6",
                            "#10b981",
                            "#8b5cf6",
                            "#f59e0b",
                            "#ef4444",
                          ][index % 6]
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
                Purchase Order Status
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={purchaseStatusDistribution}
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
                    {purchaseStatusDistribution.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={
                          [
                            "#06b6d4",
                            "#3b82f6",
                            "#10b981",
                            "#8b5cf6",
                            "#f59e0b",
                            "#ef4444",
                          ][index % 6]
                        }
                      />
                    ))}
                  </Pie>
                  <RechartsTooltip />
                </PieChart>
              </ResponsiveContainer>
            </motion.div>
          </div>
        </div>
      )}

      {/* Fulfillment View */}
      {viewMode === "fulfillment" && (
        <div className="space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
          >
            <h3 className="text-lg font-semibold text-white mb-4">
              Fulfillment Metrics
            </h3>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="p-4 bg-white/5 rounded-lg">
                <div className="text-2xl font-bold text-white">
                  {aggregateStats.salesFulfillmentRate.toFixed(1)}%
                </div>
                <div className="text-sm text-[#9ca3af]">
                  Sales Fulfillment Rate
                </div>
                <div className="w-full h-2 bg-white/10 rounded-full mt-2">
                  <div
                    className="h-full bg-cyan-500 rounded-full"
                    style={{ width: `${aggregateStats.salesFulfillmentRate}%` }}
                  />
                </div>
              </div>
              <div className="p-4 bg-white/5 rounded-lg">
                <div className="text-2xl font-bold text-white">
                  {aggregateStats.purchaseFulfillmentRate.toFixed(1)}%
                </div>
                <div className="text-sm text-[#9ca3af]">
                  Purchase Fulfillment Rate
                </div>
                <div className="w-full h-2 bg-white/10 rounded-full mt-2">
                  <div
                    className="h-full bg-blue-500 rounded-full"
                    style={{
                      width: `${aggregateStats.purchaseFulfillmentRate}%`,
                    }}
                  />
                </div>
              </div>
              <div className="p-4 bg-white/5 rounded-lg">
                <div className="text-2xl font-bold text-white">
                  {aggregateStats.onTimeSalesRate.toFixed(1)}%
                </div>
                <div className="text-sm text-[#9ca3af]">
                  On-Time Delivery Rate
                </div>
                <div className="w-full h-2 bg-white/10 rounded-full mt-2">
                  <div
                    className="h-full bg-green-500 rounded-full"
                    style={{ width: `${aggregateStats.onTimeSalesRate}%` }}
                  />
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Customer Performance View */}
      {viewMode === "customer" && (
        <div className="space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
          >
            <h3 className="text-lg font-semibold text-white mb-4">
              Top 20 Customers by Value
            </h3>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {customerPerformance.map((customer, index) => (
                <div
                  key={customer.customer}
                  className="flex items-center justify-between p-3 bg-white/5 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
                  onClick={() =>
                    router.push(`/customers?customer=${customer.customer}`)
                  }
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-cyan-500/20 flex items-center justify-center text-cyan-400 font-bold text-sm">
                      {index + 1}
                    </div>
                    <div>
                      <div className="text-sm font-medium text-white">
                        {customer.customer}
                      </div>
                      <div className="text-xs text-[#9ca3af]">
                        {customer.orders} orders
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium text-white">
                      $
                      {customer.value.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </div>
                    <div className="text-xs text-[#9ca3af]">
                      {customer.onTimeRate.toFixed(1)}% on-time
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      )}

      {/* Vendor Performance View */}
      {viewMode === "vendor" && (
        <div className="space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
          >
            <h3 className="text-lg font-semibold text-white mb-4">
              Top 20 Vendors by Value
            </h3>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {vendorPerformance.map((vendor, index) => (
                <div
                  key={vendor.vendor}
                  className="flex items-center justify-between p-3 bg-white/5 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
                  onClick={() =>
                    router.push(`/vendors?vendor=${vendor.vendor}`)
                  }
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center text-blue-400 font-bold text-sm">
                      {index + 1}
                    </div>
                    <div>
                      <div className="text-sm font-medium text-white">
                        {vendor.vendor}
                      </div>
                      <div className="text-xs text-[#9ca3af]">
                        {vendor.orders} orders
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium text-white">
                      $
                      {vendor.value.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </div>
                    <div className="text-xs text-[#9ca3af]">
                      $
                      {vendor.avgOrderValue.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}{" "}
                      avg
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      )}

      {/* Trends View */}
      {viewMode === "trends" && (
        <div className="space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
          >
            <h3 className="text-lg font-semibold text-white mb-4">
              Order Value Trends
            </h3>
            <ResponsiveContainer width="100%" height={400}>
              <AreaChart data={orderValueTrend}>
                <defs>
                  <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient
                    id="colorPurchase"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
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
                <Area
                  type="monotone"
                  dataKey="salesValue"
                  stackId="1"
                  stroke="#06b6d4"
                  fill="url(#colorSales)"
                  name="Sales Value ($)"
                />
                <Area
                  type="monotone"
                  dataKey="purchaseValue"
                  stackId="1"
                  stroke="#3b82f6"
                  fill="url(#colorPurchase)"
                  name="Purchase Value ($)"
                />
                <Legend />
              </AreaChart>
            </ResponsiveContainer>
          </motion.div>
        </div>
      )}

      {/* Export Modal */}
      <Modal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        title="Export Order Report"
        size="md"
      >
        <div className="space-y-4">
          <div className="text-sm text-[#9ca3af] mb-4">
            Select export format:
          </div>
          <div className="grid grid-cols-3 gap-3">
            <button
              onClick={() => handleExport("pdf")}
              className="px-4 py-3 bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30 rounded-lg transition-colors flex flex-col items-center gap-2"
            >
              <i className="ri-file-pdf-line text-2xl"></i>
              <span className="text-sm font-medium">PDF</span>
            </button>
            <button
              onClick={() => handleExport("excel")}
              className="px-4 py-3 bg-green-500/20 hover:bg-green-500/30 text-green-400 border border-green-500/30 rounded-lg transition-colors flex flex-col items-center gap-2"
            >
              <i className="ri-file-excel-line text-2xl"></i>
              <span className="text-sm font-medium">Excel</span>
            </button>
            <button
              onClick={() => handleExport("csv")}
              className="px-4 py-3 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 border border-blue-500/30 rounded-lg transition-colors flex flex-col items-center gap-2"
            >
              <i className="ri-file-text-line text-2xl"></i>
              <span className="text-sm font-medium">CSV</span>
            </button>
          </div>
        </div>
      </Modal>

      {/* View Details Modal */}
      <Modal
        isOpen={showViewModal}
        onClose={() => {
          setShowViewModal(false);
          setSelectedOrder(null);
        }}
        title={
          selectedOrder && "soNumber" in selectedOrder
            ? "Sales Order Details"
            : "Purchase Order Details"
        }
        size="lg"
      >
        {selectedOrder && (
          <div className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              {"soNumber" in selectedOrder ? (
                <>
                  <div>
                    <div className="text-sm text-[#9ca3af] mb-1">
                      Order Number
                    </div>
                    <div className="text-white font-medium">
                      {selectedOrder.soNumber}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-[#9ca3af] mb-1">Customer</div>
                    <div className="text-white font-medium">
                      {selectedOrder.customerName}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-[#9ca3af] mb-1">
                      Order Date
                    </div>
                    <div className="text-white font-medium">
                      {format(new Date(selectedOrder.orderDate), "PPp")}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-[#9ca3af] mb-1">
                      Total Value
                    </div>
                    <div className="text-white font-medium">
                      $
                      {selectedOrder.totalValue.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}{" "}
                      {selectedOrder.currency}
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <div className="text-sm text-[#9ca3af] mb-1">
                      Order Number
                    </div>
                    <div className="text-white font-medium">
                      {selectedOrder.poNumber}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-[#9ca3af] mb-1">Vendor</div>
                    <div className="text-white font-medium">
                      {selectedOrder.vendorName}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-[#9ca3af] mb-1">
                      Order Date
                    </div>
                    <div className="text-white font-medium">
                      {format(new Date(selectedOrder.orderDate), "PPp")}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-[#9ca3af] mb-1">
                      Total Value
                    </div>
                    <div className="text-white font-medium">
                      $
                      {selectedOrder.totalValue.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}{" "}
                      {selectedOrder.currency}
                    </div>
                  </div>
                </>
              )}
            </div>
            {"soNumber" in selectedOrder ? (
              <ModuleLinks links={getSalesOrderLinks(selectedOrder.soNumber)} />
            ) : (
              <ModuleLinks
                links={getPurchaseOrderLinks(selectedOrder.poNumber)}
              />
            )}
          </div>
        )}
      </Modal>
    </PageTemplate>
  );
}
