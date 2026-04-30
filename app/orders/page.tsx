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
import {
  getPurchaseOrderLinks,
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
  ComposedChart,
  Area,
} from "recharts";
import {
  realtimeSimulator,
  simulateKPIUpdates,
} from "@/utils/realtimeDataSimulator";
import CurrencyDisplay from "@/components/CurrencyDisplay";
import ExportButton from "@/components/ExportButton";

interface CombinedOrder {
  id: string;
  orderNumber: string;
  orderType: "PURCHASE_ORDER" | "SALES_ORDER";
  partyName: string;
  partyNumber: string;
  orderDate: Date | string;
  expectedDate: Date | string;
  status: string;
  totalValue: number;
  currency: string;
  totalItems: number;
  priority?: string;
}

export default function OrdersPage() {
  const router = useRouter();
  const [purchaseOrders] = useState(() => generatePurchaseOrders(50) as any[]);
  const [salesOrders] = useState(() => generateSalesOrders(50));

  const [combinedOrders, setCombinedOrders] = useState<CombinedOrder[]>(() => {
    const pos = purchaseOrders.map((po) => ({
      id: po.id,
      orderNumber: po.poNumber,
      orderType: "PURCHASE_ORDER" as const,
      partyName: po.vendorName,
      partyNumber: po.vendorNumber,
      orderDate: po.orderDate,
      expectedDate: po.expectedDeliveryDate,
      status: po.status,
      totalValue: po.totalValue,
      currency: po.currency,
      totalItems: po.totalItems,
      priority: (po as any).priority,
    }));

    const sos = salesOrders.map((so) => ({
      id: so.id,
      orderNumber: so.soNumber,
      orderType: "SALES_ORDER" as const,
      partyName: so.customerName,
      partyNumber: so.customerNumber,
      orderDate: so.orderDate,
      expectedDate:
        so.expectedDeliveryDate || (so as any).requestedDeliveryDate,
      status: so.status,
      totalValue: so.totalValue,
      currency: so.currency,
      totalItems: so.totalItems,
      priority: so.priority,
    }));

    return [...pos, ...sos].sort(
      (a, b) =>
        new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime(),
    );
  });

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState<string>("ALL");
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");
  const [viewMode, setViewMode] = useState<"table" | "grid" | "analytics">(
    "table",
  );
  const [selectedOrder, setSelectedOrder] = useState<CombinedOrder | null>(
    null,
  );
  const [showViewModal, setShowViewModal] = useState(false);
  const [realTimeEnabled, setRealTimeEnabled] = useState(true);
  const [realTimeStats, setRealTimeStats] = useState({
    totalOrders: 0,
    purchaseOrders: 0,
    salesOrders: 0,
    totalValue: 0,
  });

  const filteredOrders = useMemo(() => {
    return combinedOrders.filter((order) => {
      const matchesSearch =
        order.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.partyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.partyNumber.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesType =
        selectedType === "ALL" || order.orderType === selectedType;
      const matchesStatus =
        selectedStatus === "ALL" || order.status === selectedStatus;
      return matchesSearch && matchesType && matchesStatus;
    });
  }, [combinedOrders, searchQuery, selectedType, selectedStatus]);

  const typeDistribution = useMemo(() => {
    const counts: Record<string, number> = {};
    combinedOrders.forEach((order) => {
      counts[order.orderType] = (counts[order.orderType] || 0) + 1;
    });
    return Object.entries(counts).map(([type, count]) => ({
      type: type.replace(/_/g, " "),
      count,
    }));
  }, [combinedOrders]);

  const statusDistribution = useMemo(() => {
    const counts: Record<string, number> = {};
    combinedOrders.forEach((order) => {
      counts[order.status] = (counts[order.status] || 0) + 1;
    });
    return Object.entries(counts).map(([status, count]) => ({
      status: status.replace(/_/g, " "),
      count,
    }));
  }, [combinedOrders]);

  const dailyTrend = useMemo(() => {
    const dailyData: Record<
      string,
      { date: string; purchase: number; sales: number }
    > = {};

    combinedOrders.forEach((order) => {
      const date = format(new Date(order.orderDate), "yyyy-MM-dd");
      if (!dailyData[date]) {
        dailyData[date] = { date, purchase: 0, sales: 0 };
      }
      if (order.orderType === "PURCHASE_ORDER") {
        dailyData[date].purchase++;
      } else {
        dailyData[date].sales++;
      }
    });

    return Object.values(dailyData)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(-30)
      .map((d) => ({
        date: format(new Date(d.date), "MMM dd"),
        purchase: d.purchase,
        sales: d.sales,
      }));
  }, [combinedOrders]);

  const aggregateStats = useMemo(() => {
    return {
      totalOrders: combinedOrders.length,
      purchaseOrders: combinedOrders.filter(
        (o) => o.orderType === "PURCHASE_ORDER",
      ).length,
      salesOrders: combinedOrders.filter((o) => o.orderType === "SALES_ORDER")
        .length,
      totalValue: combinedOrders.reduce((sum, o) => sum + o.totalValue, 0),
    };
  }, [combinedOrders.length, combinedOrders]);

  useEffect(() => {
    if (!realTimeEnabled) return;

    const unsubscribe = realtimeSimulator.subscribe(
      "orders-stats",
      (data: typeof realTimeStats) => {
        setRealTimeStats(data);
      },
    );

    const stop = realtimeSimulator.start(
      "orders-stats",
      () => ({
        totalOrders: aggregateStats.totalOrders,
        purchaseOrders: simulateKPIUpdates(aggregateStats.purchaseOrders, 0.05),
        salesOrders: simulateKPIUpdates(aggregateStats.salesOrders, 0.05),
        totalValue: simulateKPIUpdates(aggregateStats.totalValue, 0.02),
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
    aggregateStats.totalOrders,
    aggregateStats.purchaseOrders,
    aggregateStats.salesOrders,
    aggregateStats.totalValue,
  ]);

  const stats = [
    {
      label: "Total Orders",
      value: realTimeEnabled
        ? realTimeStats.totalOrders
        : aggregateStats.totalOrders,
      icon: "ri-file-list-3-line",
      tooltip: "Total orders (PO + SO)",
      trend: "up" as const,
    },
    {
      label: "Purchase Orders",
      value: realTimeEnabled
        ? realTimeStats.purchaseOrders
        : aggregateStats.purchaseOrders,
      icon: "ri-shopping-bag-line",
      tooltip: "Total purchase orders",
      trend: "up" as const,
    },
    {
      label: "Sales Orders",
      value: realTimeEnabled
        ? realTimeStats.salesOrders
        : aggregateStats.salesOrders,
      icon: "ri-shopping-cart-line",
      tooltip: "Total sales orders",
      trend: "up" as const,
    },
    {
      label: "Total Value",
      value: realTimeEnabled
        ? realTimeStats.totalValue
        : aggregateStats.totalValue,
      isCurrency: true,
      icon: "ri-money-dollar-circle-line",
      tooltip: "Total order value",
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

  const handleView = (order: CombinedOrder) => {
    setSelectedOrder(order);
    setShowViewModal(true);
  };

  const handleNavigate = (order: CombinedOrder) => {
    if (order.orderType === "PURCHASE_ORDER") {
      router.push(`/purchase-orders?po=${order.orderNumber}`);
    } else {
      router.push(`/sales-orders?so=${order.orderNumber}`);
    }
  };

  return (
    <PageTemplate
      title="Orders"
      description="Unified order management - View and manage all purchase orders and sales orders in one place with comprehensive analytics"
      icon="ri-file-list-3-line"
      systemInfo={{
        sap: "Purchase Orders: ME21N/ME22N/ME23N, Sales Orders: VA01/VA02/VA03",
        oracle: "Order Management, PO Management, SO Management",
        manhattan: "Order Management, Unified Order View",
      }}
      examples={[
        "Unified view of all orders",
        "Purchase and sales order management",
        "Order status tracking",
        "Order analytics and trends",
        "Quick navigation to order details",
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
            placeholder="Search orders..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-lg pl-10 pr-4 py-2.5 text-sm text-white placeholder-[#6b7280] focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all"
          />
        </div>
        <select
          value={selectedType}
          onChange={(e) => setSelectedType(e.target.value)}
          className="bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 min-w-[180px]"
        >
          <option value="ALL">All Types</option>
          <option value="PURCHASE_ORDER">Purchase Orders</option>
          <option value="SALES_ORDER">Sales Orders</option>
        </select>
        <select
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
          className="bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 min-w-[180px]"
        >
          <option value="ALL">All Status</option>
          <option value="CREATED">Created</option>
          <option value="CONFIRMED">Confirmed</option>
          <option value="IN_PROGRESS">In Progress</option>
          <option value="COMPLETED">Completed</option>
          <option value="CANCELLED">Cancelled</option>
        </select>
      </div>

      {/* Analytics View */}
      {viewMode === "analytics" && (
        <div className="space-y-6 mb-6">
          <div className="grid md:grid-cols-2 gap-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
            >
              <h3 className="text-lg font-semibold text-white mb-4">
                Order Type Distribution
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={typeDistribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ type, count }) => `${type}: ${count}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="count"
                  >
                    {typeDistribution.map((entry, index) => (
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
                Status Distribution
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={statusDistribution.slice(0, 10)}>
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
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
          >
            <h3 className="text-lg font-semibold text-white mb-4">
              Daily Order Trend
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
                <Bar dataKey="purchase" fill="#06b6d4" name="Purchase Orders" />
                <Bar dataKey="sales" fill="#10b981" name="Sales Orders" />
              </ComposedChart>
            </ResponsiveContainer>
          </motion.div>
        </div>
      )}

      {/* Table View */}
      {viewMode === "table" && (
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden">
          <div className="p-4 border-b border-white/10 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-white">All Orders</h3>
            <ExportButton
              data={filteredOrders.map((order) => ({
                orderNumber: order.orderNumber,
                orderType: order.orderType,
                partyName: order.partyName,
                partyNumber: order.partyNumber,
                orderDate: format(new Date(order.orderDate), "yyyy-MM-dd"),
                expectedDate: format(
                  new Date(order.expectedDate),
                  "yyyy-MM-dd",
                ),
                status: order.status,
                totalValue: order.totalValue,
                currency: order.currency,
                totalItems: order.totalItems,
              }))}
              columns={[
                { key: "orderNumber", label: "Order Number" },
                { key: "orderType", label: "Type" },
                { key: "partyName", label: "Party" },
                { key: "orderDate", label: "Order Date" },
                { key: "status", label: "Status" },
                { key: "totalValue", label: "Total Value" },
              ]}
              filename="orders"
              title="All Orders"
            />
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-white/5 border-b border-white/10">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium text-[#9ca3af] uppercase tracking-wider">
                    Order Number
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-[#9ca3af] uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-[#9ca3af] uppercase tracking-wider">
                    Party
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-[#9ca3af] uppercase tracking-wider">
                    Order Date
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-[#9ca3af] uppercase tracking-wider">
                    Expected Date
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-[#9ca3af] uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-[#9ca3af] uppercase tracking-wider">
                    Total Value
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
                    onClick={() => handleNavigate(order)}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-white font-mono">
                        {order.orderNumber}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`text-xs px-2 py-1 rounded ${
                          order.orderType === "PURCHASE_ORDER"
                            ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                            : "bg-green-500/20 text-green-400 border border-green-500/30"
                        }`}
                      >
                        {order.orderType === "PURCHASE_ORDER" ? "PO" : "SO"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-white">
                        {order.partyName}
                      </div>
                      <div className="text-xs text-[#9ca3af] font-mono">
                        {order.partyNumber}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-white">
                        {format(new Date(order.orderDate), "MMM dd, yyyy")}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-white">
                        {format(new Date(order.expectedDate), "MMM dd, yyyy")}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${
                          order.status === "COMPLETED"
                            ? "bg-green-500/20 text-green-400 border border-green-500/30"
                            : order.status === "IN_PROGRESS"
                              ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                              : "bg-gray-500/20 text-gray-400 border border-gray-500/30"
                        }`}
                      >
                        {order.status.replace(/_/g, " ")}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <CurrencyDisplay
                        amount={order.totalValue}
                        size="sm"
                        variant="default"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Tooltip content="View Details" position="top">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleView(order);
                          }}
                          className="p-2 bg-cyan-600/20 text-cyan-400 border border-cyan-500/30 rounded hover:bg-cyan-600/30 transition-colors"
                        >
                          <i className="ri-eye-line"></i>
                        </button>
                      </Tooltip>
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
          {filteredOrders.map((order, index) => (
            <motion.div
              key={order.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.03 }}
              className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-6 hover:border-cyan-500/50 hover:shadow-lg hover:shadow-cyan-500/10 transition-all cursor-pointer"
              onClick={() => handleNavigate(order)}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-white mb-1 font-mono">
                    {order.orderNumber}
                  </h3>
                  <p className="text-sm text-[#9ca3af]">{order.partyName}</p>
                </div>
                <span
                  className={`text-xs px-2 py-1 rounded ${
                    order.orderType === "PURCHASE_ORDER"
                      ? "bg-blue-500/20 text-blue-400"
                      : "bg-green-500/20 text-green-400"
                  }`}
                >
                  {order.orderType === "PURCHASE_ORDER" ? "PO" : "SO"}
                </span>
              </div>
              <div className="space-y-2 mb-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-[#9ca3af]">Order Date:</span>
                  <span className="text-white">
                    {format(new Date(order.orderDate), "MMM dd, yyyy")}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-[#9ca3af]">Expected Date:</span>
                  <span className="text-white">
                    {format(new Date(order.expectedDate), "MMM dd, yyyy")}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-[#9ca3af]">Status:</span>
                  <span
                    className={`text-xs px-2 py-0.5 rounded ${
                      order.status === "COMPLETED"
                        ? "bg-green-500/20 text-green-400"
                        : order.status === "IN_PROGRESS"
                          ? "bg-blue-500/20 text-blue-400"
                          : "bg-gray-500/20 text-gray-400"
                    }`}
                  >
                    {order.status.replace(/_/g, " ")}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-[#9ca3af]">Total Value:</span>
                  <CurrencyDisplay
                    amount={order.totalValue}
                    size="sm"
                    variant="highlight"
                  />
                </div>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleView(order);
                }}
                className="w-full px-3 py-2 bg-cyan-600/20 text-cyan-400 border border-cyan-500/30 rounded text-sm font-medium hover:bg-cyan-600/30 transition-colors"
              >
                <i className="ri-eye-line mr-1"></i>
                View Details
              </button>
            </motion.div>
          ))}
        </div>
      )}

      {/* View Modal */}
      <Modal
        isOpen={showViewModal}
        onClose={() => {
          setShowViewModal(false);
          setSelectedOrder(null);
        }}
        title={`Order Details - ${selectedOrder?.orderNumber || ""}`}
        size="lg"
      >
        {selectedOrder && (
          <div className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-[#9ca3af] mb-1">Order Number</div>
                <div className="text-white font-medium font-mono">
                  {selectedOrder.orderNumber}
                </div>
              </div>
              <div>
                <div className="text-sm text-[#9ca3af] mb-1">Order Type</div>
                <span
                  className={`text-xs px-2 py-1 rounded ${
                    selectedOrder.orderType === "PURCHASE_ORDER"
                      ? "bg-blue-500/20 text-blue-400"
                      : "bg-green-500/20 text-green-400"
                  }`}
                >
                  {selectedOrder.orderType.replace(/_/g, " ")}
                </span>
              </div>
              <div>
                <div className="text-sm text-[#9ca3af] mb-1">Party</div>
                <div className="text-white">{selectedOrder.partyName}</div>
                <div className="text-xs text-[#9ca3af] font-mono">
                  {selectedOrder.partyNumber}
                </div>
              </div>
              <div>
                <div className="text-sm text-[#9ca3af] mb-1">Status</div>
                <span
                  className={`text-xs px-2 py-1 rounded ${
                    selectedOrder.status === "COMPLETED"
                      ? "bg-green-500/20 text-green-400"
                      : "bg-gray-500/20 text-gray-400"
                  }`}
                >
                  {selectedOrder.status.replace(/_/g, " ")}
                </span>
              </div>
              <div>
                <div className="text-sm text-[#9ca3af] mb-1">Order Date</div>
                <div className="text-white">
                  {format(new Date(selectedOrder.orderDate), "PP")}
                </div>
              </div>
              <div>
                <div className="text-sm text-[#9ca3af] mb-1">Expected Date</div>
                <div className="text-white">
                  {format(new Date(selectedOrder.expectedDate), "PP")}
                </div>
              </div>
              <div>
                <div className="text-sm text-[#9ca3af] mb-1">Total Items</div>
                <div className="text-white font-medium">
                  {selectedOrder.totalItems}
                </div>
              </div>
              <div>
                <div className="text-sm text-[#9ca3af] mb-1">Total Value</div>
                <CurrencyDisplay
                  amount={selectedOrder.totalValue}
                  size="lg"
                  variant="highlight"
                />
              </div>
            </div>
            <div className="pt-4 border-t border-white/10">
              <ModuleLinks
                links={
                  selectedOrder.orderType === "PURCHASE_ORDER"
                    ? getPurchaseOrderLinks(selectedOrder.orderNumber)
                    : getSalesOrderLinks(selectedOrder.orderNumber)
                }
              />
            </div>
            <div className="flex items-center gap-3 pt-4 border-t border-white/10">
              <button
                onClick={() => handleNavigate(selectedOrder)}
                className="flex-1 px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <i className="ri-arrow-right-line"></i>
                Go to{" "}
                {selectedOrder.orderType === "PURCHASE_ORDER"
                  ? "Purchase Order"
                  : "Sales Order"}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </PageTemplate>
  );
}
