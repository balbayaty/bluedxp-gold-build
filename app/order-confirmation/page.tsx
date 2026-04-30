"use client";

import { useState, useMemo, useEffect } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import PageTemplate from "@/components/PageTemplate";
import Tooltip from "@/components/Tooltip";
import Modal from "@/components/Modal";
import ModuleLinks from "@/components/ModuleLinks";
import {
  getSalesOrderLinks,
  getPurchaseOrderLinks,
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

interface OrderConfirmation {
  id: string;
  confirmationNumber: string;
  orderNumber: string;
  orderType: "SALES_ORDER" | "PURCHASE_ORDER";
  customerNumber?: string;
  customerName?: string;
  vendorNumber?: string;
  vendorName?: string;
  orderDate: Date | string;
  confirmationDate: Date | string;
  confirmedBy: string;
  status: "PENDING" | "CONFIRMED" | "REJECTED" | "CANCELLED";
  totalValue: number;
  currency: string;
  items: Array<{
    materialNumber: string;
    materialDescription: string;
    quantity: number;
    unit: string;
    price: number;
    confirmedQuantity?: number;
  }>;
  confirmationMethod: "EMAIL" | "PHONE" | "PORTAL" | "EDI" | "API";
  notes?: string;
  rejectionReason?: string;
  createdAt: Date | string;
}

const generateOrderConfirmations = (
  count: number = 100,
): OrderConfirmation[] => {
  const salesOrders = generateSalesOrders(150);
  const purchaseOrders = generatePurchaseOrders(150);
  const allOrders = [
    ...salesOrders.map((so) => ({ ...so, type: "SALES_ORDER" as const })),
    ...purchaseOrders.map((po) => ({ ...po, type: "PURCHASE_ORDER" as const })),
  ];

  return Array.from({ length: count }, (_, i) => {
    const order = allOrders[Math.floor(Math.random() * allOrders.length)];
    const confirmationDate = new Date(
      Date.now() - Math.random() * 30 * 86400000,
    );
    const statuses: OrderConfirmation["status"][] = [
      "PENDING",
      "CONFIRMED",
      "REJECTED",
      "CANCELLED",
    ];
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    const methods: OrderConfirmation["confirmationMethod"][] = [
      "EMAIL",
      "PHONE",
      "PORTAL",
      "EDI",
      "API",
    ];

    return {
      id: `OC-${String(i + 1).padStart(6, "0")}`,
      confirmationNumber: `OC-${new Date().getFullYear()}-${String(i + 1).padStart(6, "0")}`,
      orderNumber:
        (order as any).poNumber || (order as any).soNumber || `ORD-${i + 1}`,
      orderType: order.type,
      customerNumber:
        order.type === "SALES_ORDER"
          ? (order as any).customerNumber
          : undefined,
      customerName:
        order.type === "SALES_ORDER" ? (order as any).customerName : undefined,
      vendorNumber:
        order.type === "PURCHASE_ORDER"
          ? (order as any).vendorNumber
          : undefined,
      vendorName:
        order.type === "PURCHASE_ORDER" ? (order as any).vendorName : undefined,
      orderDate: order.orderDate || (order as any).createdAt,
      confirmationDate,
      confirmedBy: `User ${Math.floor(Math.random() * 10) + 1}`,
      status,
      totalValue: order.totalValue || 0,
      currency: order.currency || "SAR",
      items: (order.items || []).map(
        (item: {
          materialNumber: string;
          quantity: number;
          unit: string;
          price: number;
        }) => ({
          materialNumber: item.materialNumber,
          materialDescription: `Material ${item.materialNumber}`,
          quantity: item.quantity,
          unit: item.unit,
          price: item.price,
          confirmedQuantity: status === "CONFIRMED" ? item.quantity : undefined,
        }),
      ),
      confirmationMethod: methods[Math.floor(Math.random() * methods.length)],
      notes: Math.random() > 0.7 ? "Confirmed as per agreement" : undefined,
      rejectionReason: status === "REJECTED" ? "Price mismatch" : undefined,
      createdAt: confirmationDate,
    };
  });
};

export default function OrderConfirmation() {
  const router = useRouter();
  const [confirmations, setConfirmations] = useState<OrderConfirmation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch order confirmations from API
  useEffect(() => {
    const fetchConfirmations = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch('/api/wms/order-confirmation?limit=100');
        const result = await response.json();
        
        if (result.success && result.data) {
          // Map API response to component interface
          const mappedConfirmations: OrderConfirmation[] = result.data.map((conf: any) => ({
            id: conf.id,
            confirmationNumber: conf.confirmationNumber,
            orderNumber: conf.orderNumber,
            orderType: conf.orderType,
            customerNumber: conf.customerNumber,
            customerName: conf.customerName,
            vendorNumber: conf.vendorNumber,
            vendorName: conf.vendorName,
            orderDate: conf.orderDate,
            confirmationDate: conf.confirmationDate,
            confirmedBy: conf.confirmedBy,
            status: conf.status,
            totalValue: conf.totalValue,
            currency: conf.currency,
            items: conf.items || [],
            confirmationMethod: conf.confirmationMethod,
            notes: conf.notes,
            rejectionReason: conf.rejectionReason,
            createdAt: conf.createdAt,
          }));
          setConfirmations(mappedConfirmations);
        } else {
          setError(result.error || 'Failed to fetch order confirmations');
        }
      } catch (err) {
        console.error('Error fetching order confirmations:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch order confirmations');
      } finally {
        setLoading(false);
      }
    };

    fetchConfirmations();
  }, []);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");
  const [selectedType, setSelectedType] = useState<string>("ALL");
  const [selectedMethod, setSelectedMethod] = useState<string>("ALL");
  const [viewMode, setViewMode] = useState<"table" | "grid" | "analytics">(
    "table",
  );
  const [selectedConfirmation, setSelectedConfirmation] =
    useState<OrderConfirmation | null>(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [realTimeEnabled, setRealTimeEnabled] = useState(true);
  const [realTimeStats, setRealTimeStats] = useState({
    totalConfirmations: 0,
    confirmed: 0,
    pending: 0,
    rejected: 0,
  });

  const filteredConfirmations = useMemo(() => {
    return confirmations.filter((conf) => {
      const matchesSearch =
        conf.confirmationNumber
          .toLowerCase()
          .includes(searchQuery.toLowerCase()) ||
        conf.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        conf.customerName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        conf.vendorName?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus =
        selectedStatus === "ALL" || conf.status === selectedStatus;
      const matchesType =
        selectedType === "ALL" || conf.orderType === selectedType;
      const matchesMethod =
        selectedMethod === "ALL" || conf.confirmationMethod === selectedMethod;
      return matchesSearch && matchesStatus && matchesType && matchesMethod;
    });
  }, [
    confirmations,
    searchQuery,
    selectedStatus,
    selectedType,
    selectedMethod,
  ]);

  const statusDistribution = useMemo(() => {
    const counts: Record<string, number> = {};
    confirmations.forEach((c) => {
      counts[c.status] = (counts[c.status] || 0) + 1;
    });
    return Object.entries(counts).map(([status, count]) => ({ status, count }));
  }, [confirmations]);

  const methodDistribution = useMemo(() => {
    const counts: Record<string, number> = {};
    confirmations.forEach((c) => {
      counts[c.confirmationMethod] = (counts[c.confirmationMethod] || 0) + 1;
    });
    return Object.entries(counts).map(([method, count]) => ({ method, count }));
  }, [confirmations]);

  const dailyTrend = useMemo(() => {
    const dailyData: Record<
      string,
      { date: string; confirmed: number; rejected: number }
    > = {};

    confirmations.forEach((c) => {
      const date = format(new Date(c.confirmationDate), "yyyy-MM-dd");
      if (!dailyData[date]) {
        dailyData[date] = { date, confirmed: 0, rejected: 0 };
      }
      if (c.status === "CONFIRMED") {
        dailyData[date].confirmed++;
      } else if (c.status === "REJECTED") {
        dailyData[date].rejected++;
      }
    });

    return Object.values(dailyData)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(-30)
      .map((d) => ({
        date: format(new Date(d.date), "MMM dd"),
        confirmed: d.confirmed,
        rejected: d.rejected,
      }));
  }, [confirmations]);

  const aggregateStats = useMemo(() => {
    const totalConfirmations = confirmations.length;
    const confirmed = confirmations.filter(
      (c) => c.status === "CONFIRMED",
    ).length;
    const pending = confirmations.filter((c) => c.status === "PENDING").length;
    const rejected = confirmations.filter(
      (c) => c.status === "REJECTED",
    ).length;

    return {
      totalConfirmations,
      confirmed,
      pending,
      rejected,
    };
  }, [confirmations]);

  useEffect(() => {
    if (!realTimeEnabled) return;

    const unsubscribe = realtimeSimulator.subscribe(
      "order-confirmation-stats",
      (data: typeof realTimeStats) => {
        setRealTimeStats(data);
      },
    );

    const stop = realtimeSimulator.start(
      "order-confirmation-stats",
      () => ({
        totalConfirmations: aggregateStats.totalConfirmations,
        confirmed: simulateKPIUpdates(aggregateStats.confirmed, 0.05),
        pending: simulateKPIUpdates(aggregateStats.pending, 0.1),
        rejected: simulateKPIUpdates(aggregateStats.rejected, 0.05),
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
    aggregateStats.pending,
    aggregateStats.rejected,
  ]);

  const stats = [
    {
      label: "Total Confirmations",
      value: realTimeEnabled
        ? realTimeStats.totalConfirmations
        : aggregateStats.totalConfirmations,
      icon: "ri-checkbox-circle-line",
      tooltip: "Total order confirmations",
      trend: "up" as const,
    },
    {
      label: "Confirmed",
      value: realTimeEnabled
        ? realTimeStats.confirmed
        : aggregateStats.confirmed,
      icon: "ri-check-line",
      tooltip: "Confirmed orders",
      trend: "up" as const,
    },
    {
      label: "Pending",
      value: realTimeEnabled ? realTimeStats.pending : aggregateStats.pending,
      icon: "ri-time-line",
      tooltip: "Pending confirmations",
      trend: "neutral" as const,
    },
    {
      label: "Rejected",
      value: realTimeEnabled ? realTimeStats.rejected : aggregateStats.rejected,
      icon: "ri-close-circle-line",
      tooltip: "Rejected confirmations",
      trend: "down" as const,
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

  const handleView = (confirmation: OrderConfirmation) => {
    setSelectedConfirmation(confirmation);
    setShowViewModal(true);
  };

  const handleConfirm = (confirmation: OrderConfirmation) => {
    setSelectedConfirmation(confirmation);
    setShowConfirmModal(true);
  };

  const confirmOrder = () => {
    if (selectedConfirmation) {
      setConfirmations((prev) =>
        prev.map((c) =>
          c.id === selectedConfirmation.id
            ? {
                ...c,
                status: "CONFIRMED" as const,
                confirmedBy: "Current User",
                confirmationDate: new Date(),
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
      title="Order Confirmation"
      description="Order confirmation management with multi-channel confirmation (Email, Phone, Portal, EDI, API), approval workflow, and confirmation tracking"
      icon="ri-checkbox-circle-line"
      systemInfo={{
        sap: "Order Confirmation, Sales Order Confirmation",
        oracle: "Order Confirmation, Purchase Order Confirmation",
        manhattan: "Order Confirmation, Order Acknowledgment",
      }}
      examples={[
        "Multi-channel order confirmation",
        "Sales and purchase order confirmation",
        "Confirmation workflow",
        "Rejection handling",
        "Confirmation analytics",
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
            placeholder="Search confirmations..."
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
          <option value="REJECTED">Rejected</option>
          <option value="CANCELLED">Cancelled</option>
        </select>
        <select
          value={selectedType}
          onChange={(e) => setSelectedType(e.target.value)}
          className="bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 min-w-[180px]"
        >
          <option value="ALL">All Types</option>
          <option value="SALES_ORDER">Sales Order</option>
          <option value="PURCHASE_ORDER">Purchase Order</option>
        </select>
        <select
          value={selectedMethod}
          onChange={(e) => setSelectedMethod(e.target.value)}
          className="bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 min-w-[180px]"
        >
          <option value="ALL">All Methods</option>
          <option value="EMAIL">Email</option>
          <option value="PHONE">Phone</option>
          <option value="PORTAL">Portal</option>
          <option value="EDI">EDI</option>
          <option value="API">API</option>
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
                    Order
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-[#9ca3af] uppercase tracking-wider">
                    Party
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-[#9ca3af] uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-[#9ca3af] uppercase tracking-wider">
                    Method
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-[#9ca3af] uppercase tracking-wider">
                    Value
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
                        {confirmation.confirmationNumber}
                      </div>
                      <div className="text-xs text-[#9ca3af]">
                        {format(
                          new Date(confirmation.confirmationDate),
                          "MMM dd, yyyy",
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() =>
                          router.push(
                            confirmation.orderType === "SALES_ORDER"
                              ? `/sales-orders?so=${confirmation.orderNumber}`
                              : `/purchase-orders?po=${confirmation.orderNumber}`,
                          )
                        }
                        className="text-sm text-cyan-400 hover:text-cyan-300 font-mono"
                      >
                        {confirmation.orderNumber}
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-white">
                        {confirmation.customerName || confirmation.vendorName}
                      </div>
                      <div className="text-xs text-[#9ca3af] font-mono">
                        {confirmation.customerNumber ||
                          confirmation.vendorNumber}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-xs px-2 py-1 rounded bg-cyan-500/20 text-cyan-400">
                        {confirmation.orderType.replace(/_/g, " ")}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-xs px-2 py-1 rounded bg-blue-500/20 text-blue-400">
                        {confirmation.confirmationMethod}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-white font-medium">
                        {confirmation.totalValue.toLocaleString()}{" "}
                        {confirmation.currency}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${
                          confirmation.status === "CONFIRMED"
                            ? "bg-green-500/20 text-green-400 border border-green-500/30"
                            : confirmation.status === "PENDING"
                              ? "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30"
                              : confirmation.status === "REJECTED"
                                ? "bg-red-500/20 text-red-400 border border-red-500/30"
                                : "bg-gray-500/20 text-gray-400 border border-gray-500/30"
                        }`}
                      >
                        {confirmation.status}
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
                          <Tooltip content="Confirm Order" position="top">
                            <button
                              onClick={() => handleConfirm(confirmation)}
                              className="p-2 bg-green-600/20 text-green-400 border border-green-500/30 rounded hover:bg-green-600/30 transition-colors"
                            >
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
                    {confirmation.confirmationNumber}
                  </h3>
                  <p className="text-sm text-[#9ca3af]">
                    {format(
                      new Date(confirmation.confirmationDate),
                      "MMM dd, yyyy",
                    )}
                  </p>
                </div>
                <span
                  className={`px-2 py-1 rounded text-xs font-medium ${
                    confirmation.status === "CONFIRMED"
                      ? "bg-green-500/20 text-green-400"
                      : confirmation.status === "PENDING"
                        ? "bg-yellow-500/20 text-yellow-400"
                        : "bg-red-500/20 text-red-400"
                  }`}
                >
                  {confirmation.status}
                </span>
              </div>
              <div className="space-y-2 mb-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-[#9ca3af]">Order:</span>
                  <button
                    onClick={() =>
                      router.push(
                        confirmation.orderType === "SALES_ORDER"
                          ? `/sales-orders?so=${confirmation.orderNumber}`
                          : `/purchase-orders?po=${confirmation.orderNumber}`,
                      )
                    }
                    className="text-cyan-400 hover:text-cyan-300 font-mono text-xs"
                  >
                    {confirmation.orderNumber}
                  </button>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-[#9ca3af]">Type:</span>
                  <span className="text-white text-xs">
                    {confirmation.orderType.replace(/_/g, " ")}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-[#9ca3af]">Party:</span>
                  <span className="text-white text-xs">
                    {confirmation.customerName || confirmation.vendorName}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-[#9ca3af]">Method:</span>
                  <span className="text-white text-xs">
                    {confirmation.confirmationMethod}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-[#9ca3af]">Value:</span>
                  <span className="text-white font-medium">
                    {confirmation.totalValue.toLocaleString()}{" "}
                    {confirmation.currency}
                  </span>
                </div>
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
                Confirmation Method Distribution
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
              Daily Confirmation Trend
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
                  stroke="#10b981"
                  strokeWidth={2}
                  name="Confirmed"
                />
                <Line
                  type="monotone"
                  dataKey="rejected"
                  stroke="#ef4444"
                  strokeWidth={2}
                  name="Rejected"
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
        title={`Order Confirmation - ${selectedConfirmation?.confirmationNumber || ""}`}
        size="lg"
      >
        {selectedConfirmation && (
          <div className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-[#9ca3af] mb-1">
                  Confirmation Number
                </div>
                <div className="text-white font-medium font-mono">
                  {selectedConfirmation.confirmationNumber}
                </div>
              </div>
              <div>
                <div className="text-sm text-[#9ca3af] mb-1">Order Number</div>
                <button
                  onClick={() =>
                    router.push(
                      selectedConfirmation.orderType === "SALES_ORDER"
                        ? `/sales-orders?so=${selectedConfirmation.orderNumber}`
                        : `/purchase-orders?po=${selectedConfirmation.orderNumber}`,
                    )
                  }
                  className="text-cyan-400 hover:text-cyan-300 font-mono"
                >
                  {selectedConfirmation.orderNumber}
                </button>
              </div>
              <div>
                <div className="text-sm text-[#9ca3af] mb-1">Order Type</div>
                <div className="text-white">
                  {selectedConfirmation.orderType.replace(/_/g, " ")}
                </div>
              </div>
              <div>
                <div className="text-sm text-[#9ca3af] mb-1">Status</div>
                <span
                  className={`px-2 py-1 rounded text-xs font-medium ${
                    selectedConfirmation.status === "CONFIRMED"
                      ? "bg-green-500/20 text-green-400"
                      : selectedConfirmation.status === "PENDING"
                        ? "bg-yellow-500/20 text-yellow-400"
                        : "bg-red-500/20 text-red-400"
                  }`}
                >
                  {selectedConfirmation.status}
                </span>
              </div>
              <div>
                <div className="text-sm text-[#9ca3af] mb-1">
                  Confirmation Method
                </div>
                <div className="text-white">
                  {selectedConfirmation.confirmationMethod}
                </div>
              </div>
              <div>
                <div className="text-sm text-[#9ca3af] mb-1">Confirmed By</div>
                <div className="text-white">
                  {selectedConfirmation.confirmedBy}
                </div>
              </div>
            </div>
            <div>
              <div className="text-sm text-[#9ca3af] mb-2">Items</div>
              <div className="bg-white/5 rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead className="bg-white/5 border-b border-white/10">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-[#9ca3af]">
                        Material
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-[#9ca3af]">
                        Quantity
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-[#9ca3af]">
                        Price
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-[#9ca3af]">
                        Confirmed
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/10">
                    {selectedConfirmation.items.map((item, idx) => (
                      <tr key={idx}>
                        <td className="px-4 py-2">
                          <div className="text-sm text-white font-mono">
                            {item.materialNumber}
                          </div>
                          <div className="text-xs text-[#9ca3af]">
                            {item.materialDescription}
                          </div>
                        </td>
                        <td className="px-4 py-2 text-sm text-white">
                          {item.quantity} {item.unit}
                        </td>
                        <td className="px-4 py-2 text-sm text-white">
                          {item.price.toLocaleString()}{" "}
                          {selectedConfirmation.currency}
                        </td>
                        <td className="px-4 py-2 text-sm text-white">
                          {item.confirmedQuantity || "-"} {item.unit}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <div>
              <div className="text-sm text-[#9ca3af] mb-2">Total Value</div>
              <div className="text-2xl font-bold text-white">
                {selectedConfirmation.totalValue.toLocaleString()}{" "}
                {selectedConfirmation.currency}
              </div>
            </div>
            {selectedConfirmation.rejectionReason && (
              <div>
                <div className="text-sm text-[#9ca3af] mb-1">
                  Rejection Reason
                </div>
                <div className="text-white">
                  {selectedConfirmation.rejectionReason}
                </div>
              </div>
            )}
            <ModuleLinks
              links={
                selectedConfirmation.orderType === "SALES_ORDER"
                  ? getSalesOrderLinks(selectedConfirmation.orderNumber)
                  : getPurchaseOrderLinks(selectedConfirmation.orderNumber)
              }
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
        title="Confirm Order"
        size="md"
      >
        {selectedConfirmation && (
          <div className="space-y-4">
            <p className="text-white">
              Confirm order <strong>{selectedConfirmation.orderNumber}</strong>?
            </p>
            <div className="bg-white/5 rounded-lg p-4">
              <div className="text-sm text-[#9ca3af] mb-2">Order Details</div>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-[#9ca3af]">Type:</span>
                  <span className="text-white">
                    {selectedConfirmation.orderType.replace(/_/g, " ")}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#9ca3af]">Party:</span>
                  <span className="text-white">
                    {selectedConfirmation.customerName ||
                      selectedConfirmation.vendorName}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#9ca3af]">Total Value:</span>
                  <span className="text-white font-medium">
                    {selectedConfirmation.totalValue.toLocaleString()}{" "}
                    {selectedConfirmation.currency}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={confirmOrder}
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
