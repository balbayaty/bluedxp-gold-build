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
  Area,
  AreaChart,
} from "recharts";
import {
  realtimeSimulator,
  simulateKPIUpdates,
} from "@/utils/realtimeDataSimulator";
import CurrencyDisplay from "@/components/CurrencyDisplay";

export default function ReturnManagement() {
  const router = useRouter();
  const [returns, setReturns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch returns from API
  useEffect(() => {
    const fetchReturns = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch('/api/wms/return-management?limit=100');
        const result = await response.json();
        
        if (result.success && result.data) {
          setReturns(result.data);
        } else {
          setError(result.error || 'Failed to fetch returns');
        }
      } catch (err) {
        console.error('Error fetching returns:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch returns');
      } finally {
        setLoading(false);
      }
    };

    fetchReturns();
  }, []);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");
  const [selectedReason, setSelectedReason] = useState<string>("ALL");
  const [viewMode, setViewMode] = useState<
    "table" | "grid" | "analytics" | "realtime"
  >("table");
  const [selectedReturn, setSelectedReturn] = useState<any>(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [realTimeEnabled, setRealTimeEnabled] = useState(true);
  const [realTimeStats, setRealTimeStats] = useState({
    totalReturns: 0,
    pendingReturns: 0,
    processingRate: 0,
    totalValue: 0,
  });

  const filteredReturns = useMemo(() => {
    return returns.filter((returnItem) => {
      const matchesSearch =
        returnItem.returnNumber
          .toLowerCase()
          .includes(searchQuery.toLowerCase()) ||
        returnItem.originalOrderNumber
          .toLowerCase()
          .includes(searchQuery.toLowerCase()) ||
        returnItem.customerName
          .toLowerCase()
          .includes(searchQuery.toLowerCase()) ||
        returnItem.materialNumber
          .toLowerCase()
          .includes(searchQuery.toLowerCase());
      const matchesStatus =
        selectedStatus === "ALL" || returnItem.status === selectedStatus;
      const matchesReason =
        selectedReason === "ALL" || returnItem.returnReason === selectedReason;
      return matchesSearch && matchesStatus && matchesReason;
    });
  }, [returns, searchQuery, selectedStatus, selectedReason]);

  const totalReturnValue = useMemo(() => {
    return returns.reduce((sum, r) => sum + r.returnValue, 0);
  }, [returns]);

  const statusStats = useMemo(() => {
    const stats: Record<string, { count: number; totalValue: number }> = {};
    returns.forEach((returnItem) => {
      if (!stats[returnItem.status]) {
        stats[returnItem.status] = { count: 0, totalValue: 0 };
      }
      stats[returnItem.status].count++;
      stats[returnItem.status].totalValue += returnItem.returnValue;
    });
    return stats;
  }, [returns]);

  const reasonStats = useMemo(() => {
    const stats: Record<string, number> = {};
    returns.forEach((returnItem) => {
      stats[returnItem.returnReason] =
        (stats[returnItem.returnReason] || 0) + 1;
    });
    return stats;
  }, [returns]);

  const chartData = useMemo(() => {
    return Object.entries(statusStats).map(([status, data]) => ({
      status,
      count: data.count,
      totalValue: data.totalValue,
    }));
  }, [statusStats]);

  const reasonData = useMemo(() => {
    return Object.entries(reasonStats).map(([reason, count]) => ({
      reason: reason.replace(/_/g, " "),
      count,
    }));
  }, [reasonStats]);

  // Customer performance analytics
  const customerPerformance = useMemo(() => {
    const customerMap = new Map<
      string,
      { count: number; totalValue: number; processed: number }
    >();

    returns.forEach((ret) => {
      if (!customerMap.has(ret.customerName)) {
        customerMap.set(ret.customerName, {
          count: 0,
          totalValue: 0,
          processed: 0,
        });
      }
      const customer = customerMap.get(ret.customerName)!;
      customer.count++;
      customer.totalValue += ret.returnValue;
      if (ret.status === "PROCESSED") {
        customer.processed++;
      }
    });

    return Array.from(customerMap.entries())
      .map(([name, data]) => ({
        name,
        totalReturns: data.count,
        totalValue: data.totalValue,
        processingRate: (data.processed / data.count) * 100,
      }))
      .sort((a, b) => b.totalReturns - a.totalReturns)
      .slice(0, 10);
  }, [returns]);

  // Daily trend
  const dailyTrend = useMemo(() => {
    const dailyData: Record<
      string,
      { date: string; requested: number; processed: number; value: number }
    > = {};

    returns.forEach((ret) => {
      const date = ret.returnDate
        ? format(new Date(ret.returnDate), "yyyy-MM-dd")
        : format(new Date(), "yyyy-MM-dd");
      if (!dailyData[date]) {
        dailyData[date] = { date, requested: 0, processed: 0, value: 0 };
      }
      dailyData[date].requested++;
      dailyData[date].value += ret.returnValue;
      if (ret.status === "PROCESSED") {
        dailyData[date].processed++;
      }
    });

    return Object.values(dailyData)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .map((d) => ({
        date: format(new Date(d.date), "MMM dd"),
        requested: d.requested,
        processed: d.processed,
        value: d.value,
        efficiency: d.requested > 0 ? (d.processed / d.requested) * 100 : 0,
      }));
  }, [returns]);

  // Aggregate stats
  const aggregateStats = useMemo(() => {
    const total = returns.length;
    const pending = returns.filter(
      (r) => r.status === "REQUESTED" || r.status === "APPROVED",
    ).length;
    const processed = returns.filter((r) => r.status === "PROCESSED").length;
    const processingRate = total > 0 ? (processed / total) * 100 : 0;

    return {
      total,
      pending,
      processed,
      totalReturnValue,
      processingRate,
    };
  }, [returns, totalReturnValue]);

  // Real-time updates
  useEffect(() => {
    if (!realTimeEnabled) return;

    const unsubscribe = realtimeSimulator.subscribe(
      "return-stats",
      (data: typeof realTimeStats) => {
        setRealTimeStats(data);
      },
    );

    const stop = realtimeSimulator.start(
      "return-stats",
      () => ({
        totalReturns: simulateKPIUpdates(aggregateStats.total, 0.05),
        pendingReturns: simulateKPIUpdates(aggregateStats.pending, 0.1),
        processingRate: simulateKPIUpdates(aggregateStats.processingRate, 0.02),
        totalValue: simulateKPIUpdates(aggregateStats.totalReturnValue, 0.05),
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
    aggregateStats.pending,
    aggregateStats.processingRate,
    aggregateStats.totalReturnValue,
  ]);

  // Simulate real-time status changes
  useEffect(() => {
    if (!realTimeEnabled) return;

    const interval = setInterval(() => {
      setReturns((prev) =>
        prev.map((ret) => {
          if (ret.status === "REQUESTED" && Math.random() < 0.03) {
            return { ...ret, status: "APPROVED" as const };
          }
          if (ret.status === "APPROVED" && Math.random() < 0.02) {
            return { ...ret, status: "IN_TRANSIT" as const };
          }
          if (ret.status === "IN_TRANSIT" && Math.random() < 0.02) {
            return { ...ret, status: "RECEIVED" as const };
          }
          if (ret.status === "RECEIVED" && Math.random() < 0.02) {
            return { ...ret, status: "PROCESSED" as const };
          }
          return ret;
        }),
      );
    }, 10000);

    return () => clearInterval(interval);
  }, [realTimeEnabled]);

  const stats = [
    {
      label: "Total Returns",
      value: realTimeEnabled
        ? realTimeStats.totalReturns
        : aggregateStats.total,
      icon: "ri-arrow-go-back-line",
      tooltip: "Total return requests",
      trend: "up" as const,
    },
    {
      label: "Pending",
      value: realTimeEnabled
        ? realTimeStats.pendingReturns
        : aggregateStats.pending,
      icon: "ri-time-line",
      tooltip: "Returns pending processing",
      trend: "neutral" as const,
    },
    {
      label: "Processing Rate",
      value: `${(realTimeEnabled ? realTimeStats.processingRate : aggregateStats.processingRate).toFixed(1)}%`,
      icon: "ri-checkbox-circle-line",
      tooltip: "Return processing rate",
      trend: "up" as const,
    },
    {
      label: "Total Value",
      value: realTimeEnabled
        ? realTimeStats.totalValue
        : aggregateStats.totalReturnValue,
      isCurrency: true,
      icon: "ri-money-dollar-circle-line",
      tooltip: "Total return value",
      trend: "neutral" as const,
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

  return (
    <PageTemplate
      title="Return Management"
      description="Returns and reverse logistics - Process customer returns, manage return authorization, track return status, and handle reverse logistics"
      icon="ri-arrow-go-back-line"
      systemInfo={{
        sap: "Return Management - Return Processing, Reverse Logistics",
        oracle: "Return Management - Returns Processing, RMA Management",
        manhattan: "Return Management - Reverse Logistics, Return Processing",
      }}
      examples={[
        "Process customer return requests",
        "Manage return authorization (RMA)",
        "Track return status and disposition",
        "Handle return inspection and quality checks",
        "Process credit memos and refunds",
        "Manage reverse logistics flow",
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
            placeholder="Search by Return Number, Order, Customer, Material..."
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
          <option value="REQUESTED">Requested</option>
          <option value="APPROVED">Approved</option>
          <option value="IN_TRANSIT">In Transit</option>
          <option value="RECEIVED">Received</option>
          <option value="INSPECTING">Inspecting</option>
          <option value="PROCESSED">Processed</option>
          <option value="REJECTED">Rejected</option>
          <option value="CANCELLED">Cancelled</option>
        </select>
        <select
          value={selectedReason}
          onChange={(e) => setSelectedReason(e.target.value)}
          className="bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 min-w-[180px]"
        >
          <option value="ALL">All Reasons</option>
          <option value="DEFECTIVE">Defective</option>
          <option value="DAMAGED">Damaged</option>
          <option value="WRONG_ITEM">Wrong Item</option>
          <option value="CUSTOMER_CANCELLATION">Customer Cancellation</option>
          <option value="OVERSTOCK">Overstock</option>
          <option value="EXPIRED">Expired</option>
          <option value="QUALITY_ISSUE">Quality Issue</option>
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
                    Return Number
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-[#9ca3af] uppercase tracking-wider">
                    Original Order
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-[#9ca3af] uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-[#9ca3af] uppercase tracking-wider">
                    Material
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-[#9ca3af] uppercase tracking-wider">
                    Quantity
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-[#9ca3af] uppercase tracking-wider">
                    Value
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-[#9ca3af] uppercase tracking-wider">
                    Return Reason
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-[#9ca3af] uppercase tracking-wider">
                    Disposition
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
                {filteredReturns.map((returnItem, index) => (
                  <motion.tr
                    key={returnItem.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.02 }}
                    className="hover:bg-white/5 transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-white font-mono">
                        {returnItem.returnNumber}
                      </div>
                      <div className="text-xs text-[#9ca3af]">
                        {format(
                          new Date(returnItem.returnRequestDate),
                          "MMM dd, yyyy",
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() =>
                          router.push(
                            `/sales-orders?so=${returnItem.originalOrderNumber}`,
                          )
                        }
                        className="text-sm text-cyan-400 hover:text-cyan-300 transition-colors font-mono"
                      >
                        {returnItem.originalOrderNumber}
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <button
                          onClick={() =>
                            router.push(
                              `/customers?customer=${returnItem.customerNumber}`,
                            )
                          }
                          className="text-sm text-cyan-400 hover:text-cyan-300 transition-colors"
                        >
                          {returnItem.customerName}
                        </button>
                        <div className="text-xs text-[#9ca3af]">
                          {returnItem.customerNumber}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <button
                          onClick={() =>
                            router.push(
                              `/inventory?material=${returnItem.materialNumber}`,
                            )
                          }
                          className="text-sm text-cyan-400 hover:text-cyan-300 transition-colors font-mono"
                        >
                          {returnItem.materialNumber}
                        </button>
                        <div className="text-xs text-[#9ca3af]">
                          {returnItem.materialDescription}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-white font-medium">
                        {returnItem.returnQuantity.toFixed(2)}
                      </div>
                      <div className="text-xs text-[#9ca3af]">
                        {returnItem.unit}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-white font-medium">
                        <CurrencyDisplay
                          amount={returnItem.returnValue}
                          size="sm"
                        />
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-white">
                        {returnItem.returnReason.replace(/_/g, " ")}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {returnItem.disposition ? (
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium ${
                            returnItem.disposition === "RESTOCK"
                              ? "bg-green-500/20 text-green-400"
                              : returnItem.disposition === "DAMAGED"
                                ? "bg-red-500/20 text-red-400"
                                : returnItem.disposition === "DISPOSAL"
                                  ? "bg-gray-500/20 text-gray-400"
                                  : "bg-yellow-500/20 text-yellow-400"
                          }`}
                        >
                          {returnItem.disposition}
                        </span>
                      ) : (
                        <span className="text-xs text-[#9ca3af]">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${
                          returnItem.status === "PROCESSED"
                            ? "bg-green-500/20 text-green-400 border border-green-500/30"
                            : returnItem.status === "RECEIVED" ||
                                returnItem.status === "INSPECTING"
                              ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                              : returnItem.status === "APPROVED"
                                ? "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30"
                                : returnItem.status === "REJECTED"
                                  ? "bg-red-500/20 text-red-400 border border-red-500/30"
                                  : "bg-gray-500/20 text-gray-400 border border-gray-500/30"
                        }`}
                      >
                        {returnItem.status.replace(/_/g, " ")}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => {
                          setSelectedReturn(returnItem);
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
          {filteredReturns.map((returnItem, index) => (
            <motion.div
              key={returnItem.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.03 }}
              className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-6 hover:border-cyan-500/50 hover:shadow-lg hover:shadow-cyan-500/10 transition-all cursor-pointer"
              onClick={() => {
                setSelectedReturn(returnItem);
                setShowViewModal(true);
              }}
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-white font-mono mb-1">
                    {returnItem.returnNumber}
                  </h3>
                  <p className="text-sm text-[#9ca3af]">
                    {returnItem.originalOrderNumber}
                  </p>
                </div>
                <span
                  className={`px-2 py-1 rounded text-xs font-medium ${
                    returnItem.status === "PROCESSED"
                      ? "bg-green-500/20 text-green-400"
                      : returnItem.status === "RECEIVED" ||
                          returnItem.status === "INSPECTING"
                        ? "bg-blue-500/20 text-blue-400"
                        : "bg-gray-500/20 text-gray-400"
                  }`}
                >
                  {returnItem.status.replace(/_/g, " ")}
                </span>
              </div>
              <div className="space-y-2 mb-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-[#9ca3af]">Customer:</span>
                  <span className="text-white">{returnItem.customerName}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-[#9ca3af]">Material:</span>
                  <span className="text-white font-mono text-xs">
                    {returnItem.materialNumber}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-[#9ca3af]">Quantity:</span>
                  <span className="text-white font-medium">
                    {returnItem.returnQuantity.toFixed(2)} {returnItem.unit}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-[#9ca3af]">Value:</span>
                  <span className="text-white font-medium">
                    <CurrencyDisplay
                      amount={returnItem.returnValue}
                      size="sm"
                    />
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-[#9ca3af]">Reason:</span>
                  <span className="text-white text-xs">
                    {returnItem.returnReason.replace(/_/g, " ")}
                  </span>
                </div>
                {returnItem.disposition && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-[#9ca3af]">Disposition:</span>
                    <span
                      className={`text-xs font-medium ${
                        returnItem.disposition === "RESTOCK"
                          ? "text-green-400"
                          : returnItem.disposition === "DAMAGED"
                            ? "text-red-400"
                            : "text-yellow-400"
                      }`}
                    >
                      {returnItem.disposition}
                    </span>
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {viewMode === "analytics" && (
        <div className="space-y-6">
          {/* Status and Reason Distribution */}
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
                    data={chartData}
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
                    {chartData.map((entry, index) => (
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
                Return Reason Distribution
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={reasonData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis
                    dataKey="reason"
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

          {/* Customer Performance */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
          >
            <h3 className="text-lg font-semibold text-white mb-4">
              Top Customers Return Performance
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={customerPerformance}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis
                  dataKey="name"
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
                  dataKey="totalReturns"
                  fill="#06b6d4"
                  name="Total Returns"
                />
                <Bar
                  dataKey="processingRate"
                  fill="#10b981"
                  name="Processing Rate %"
                />
              </BarChart>
            </ResponsiveContainer>
          </motion.div>

          {/* Daily Trend */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
          >
            <h3 className="text-lg font-semibold text-white mb-4">
              Daily Return Trend
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
                  dataKey="requested"
                  fill="#3b82f6"
                  name="Requested"
                />
                <Bar
                  yAxisId="left"
                  dataKey="processed"
                  fill="#10b981"
                  name="Processed"
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="efficiency"
                  stroke="#f59e0b"
                  strokeWidth={2}
                  name="Efficiency %"
                />
                <Area
                  yAxisId="right"
                  type="monotone"
                  dataKey="value"
                  fill="#8b5cf6"
                  fillOpacity={0.3}
                  stroke="#8b5cf6"
                  name="Value (SAR)"
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
                <div className="text-xs text-[#9ca3af] mb-1">Total Returns</div>
                <div className="text-2xl font-bold text-white">
                  {realTimeStats.totalReturns}
                </div>
              </div>
              <div className="bg-white/5 rounded-lg p-4">
                <div className="text-xs text-[#9ca3af] mb-1">Pending</div>
                <div className="text-2xl font-bold text-cyan-400">
                  {realTimeStats.pendingReturns}
                </div>
              </div>
              <div className="bg-white/5 rounded-lg p-4">
                <div className="text-xs text-[#9ca3af] mb-1">
                  Processing Rate
                </div>
                <div className="text-2xl font-bold text-green-400">
                  {realTimeStats.processingRate.toFixed(1)}%
                </div>
              </div>
              <div className="bg-white/5 rounded-lg p-4">
                <div className="text-xs text-[#9ca3af] mb-1">Total Value</div>
                <div className="text-2xl font-bold text-yellow-400">
                  <CurrencyDisplay
                    amount={realTimeStats.totalValue}
                    size="lg"
                    variant="highlight"
                  />
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
              {filteredReturns
                .sort((a, b) => {
                  const dateA = a.returnDate
                    ? new Date(a.returnDate).getTime()
                    : new Date(a.returnRequestDate).getTime();
                  const dateB = b.returnDate
                    ? new Date(b.returnDate).getTime()
                    : new Date(b.returnRequestDate).getTime();
                  return dateB - dateA;
                })
                .slice(0, 10)
                .map((ret) => (
                  <div
                    key={ret.id}
                    className="flex items-center justify-between p-3 bg-white/5 rounded-lg"
                  >
                    <div className="flex-1">
                      <div className="text-sm font-medium text-white">
                        {ret.returnNumber}
                      </div>
                      <div className="text-xs text-[#9ca3af]">
                        {ret.customerName} • {ret.materialNumber}
                        {ret.returnDate &&
                          ` • ${format(new Date(ret.returnDate), "MMM dd, HH:mm")}`}
                      </div>
                    </div>
                    <div
                      className={`text-xs px-2 py-1 rounded ${
                        ret.status === "PROCESSED"
                          ? "bg-green-500/20 text-green-400"
                          : ret.status === "RECEIVED" ||
                              ret.status === "INSPECTING"
                            ? "bg-cyan-500/20 text-cyan-400"
                            : ret.status === "APPROVED"
                              ? "bg-yellow-500/20 text-yellow-400"
                              : "bg-gray-500/20 text-gray-400"
                      }`}
                    >
                      {ret.status.replace(/_/g, " ")}
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
          setSelectedReturn(null);
        }}
        title={`Return Details - ${selectedReturn?.returnNumber || ""}`}
        size="lg"
      >
        {selectedReturn && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-[#9ca3af] mb-1 block">
                  Return Number
                </label>
                <div className="text-sm text-white font-mono">
                  {selectedReturn.returnNumber}
                </div>
              </div>
              <div>
                <label className="text-xs text-[#9ca3af] mb-1 block">
                  Status
                </label>
                <span
                  className={`px-2 py-1 rounded text-xs font-medium ${
                    selectedReturn.status === "PROCESSED"
                      ? "bg-green-500/20 text-green-400"
                      : selectedReturn.status === "RECEIVED" ||
                          selectedReturn.status === "INSPECTING"
                        ? "bg-blue-500/20 text-blue-400"
                        : "bg-gray-500/20 text-gray-400"
                  }`}
                >
                  {selectedReturn.status.replace(/_/g, " ")}
                </span>
              </div>
              <div>
                <label className="text-xs text-[#9ca3af] mb-1 block">
                  Original Order Number
                </label>
                <button
                  onClick={() =>
                    router.push(
                      `/sales-orders?so=${selectedReturn.originalOrderNumber}`,
                    )
                  }
                  className="text-sm text-cyan-400 hover:text-cyan-300 transition-colors font-mono"
                >
                  {selectedReturn.originalOrderNumber}
                </button>
              </div>
              <div>
                <label className="text-xs text-[#9ca3af] mb-1 block">
                  Customer
                </label>
                <button
                  onClick={() =>
                    router.push(
                      `/customers?customer=${selectedReturn.customerNumber}`,
                    )
                  }
                  className="text-sm text-cyan-400 hover:text-cyan-300 transition-colors"
                >
                  {selectedReturn.customerName}
                </button>
                <div className="text-xs text-[#9ca3af]">
                  {selectedReturn.customerNumber}
                </div>
              </div>
              <div>
                <label className="text-xs text-[#9ca3af] mb-1 block">
                  Material Number
                </label>
                <button
                  onClick={() =>
                    router.push(
                      `/inventory?material=${selectedReturn.materialNumber}`,
                    )
                  }
                  className="text-sm text-cyan-400 hover:text-cyan-300 transition-colors font-mono"
                >
                  {selectedReturn.materialNumber}
                </button>
              </div>
              <div>
                <label className="text-xs text-[#9ca3af] mb-1 block">
                  Material Description
                </label>
                <div className="text-sm text-white">
                  {selectedReturn.materialDescription}
                </div>
              </div>
              <div>
                <label className="text-xs text-[#9ca3af] mb-1 block">
                  Return Quantity
                </label>
                <div className="text-sm text-white font-medium">
                  {selectedReturn.returnQuantity.toFixed(2)}{" "}
                  {selectedReturn.unit}
                </div>
              </div>
              <div>
                <label className="text-xs text-[#9ca3af] mb-1 block">
                  Return Value
                </label>
                <div className="text-sm text-white font-medium">
                  <CurrencyDisplay
                    amount={selectedReturn.returnValue}
                    size="sm"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs text-[#9ca3af] mb-1 block">
                  Return Reason
                </label>
                <div className="text-sm text-white">
                  {selectedReturn.returnReason.replace(/_/g, " ")}
                </div>
              </div>
              {selectedReturn.disposition && (
                <div>
                  <label className="text-xs text-[#9ca3af] mb-1 block">
                    Disposition
                  </label>
                  <span
                    className={`px-2 py-1 rounded text-xs font-medium ${
                      selectedReturn.disposition === "RESTOCK"
                        ? "bg-green-500/20 text-green-400"
                        : selectedReturn.disposition === "DAMAGED"
                          ? "bg-red-500/20 text-red-400"
                          : "bg-yellow-500/20 text-yellow-400"
                    }`}
                  >
                    {selectedReturn.disposition}
                  </span>
                </div>
              )}
              <div>
                <label className="text-xs text-[#9ca3af] mb-1 block">
                  Return Request Date
                </label>
                <div className="text-sm text-white">
                  {format(
                    new Date(selectedReturn.returnRequestDate),
                    "MMM dd, yyyy",
                  )}
                </div>
              </div>
              {selectedReturn.approvedDate && (
                <div>
                  <label className="text-xs text-[#9ca3af] mb-1 block">
                    Approved Date
                  </label>
                  <div className="text-sm text-white">
                    {format(
                      new Date(selectedReturn.approvedDate),
                      "MMM dd, yyyy",
                    )}
                  </div>
                </div>
              )}
              {selectedReturn.receivedDate && (
                <div>
                  <label className="text-xs text-[#9ca3af] mb-1 block">
                    Received Date
                  </label>
                  <div className="text-sm text-white">
                    {format(
                      new Date(selectedReturn.receivedDate),
                      "MMM dd, yyyy",
                    )}
                  </div>
                </div>
              )}
              {selectedReturn.processedDate && (
                <div>
                  <label className="text-xs text-[#9ca3af] mb-1 block">
                    Processed Date
                  </label>
                  <div className="text-sm text-white">
                    {format(
                      new Date(selectedReturn.processedDate),
                      "MMM dd, yyyy",
                    )}
                  </div>
                </div>
              )}
              {selectedReturn.creditMemoNumber && (
                <div>
                  <label className="text-xs text-[#9ca3af] mb-1 block">
                    Credit Memo Number
                  </label>
                  <div className="text-sm text-cyan-400 font-mono">
                    {selectedReturn.creditMemoNumber}
                  </div>
                </div>
              )}
            </div>
            {selectedReturn.notes && (
              <div>
                <label className="text-xs text-[#9ca3af] mb-1 block">
                  Notes
                </label>
                <div className="text-sm text-white bg-white/5 p-3 rounded-lg">
                  {selectedReturn.notes}
                </div>
              </div>
            )}
            <div className="pt-4 border-t border-white/10">
              <ModuleLinks
                links={getSalesOrderLinks(selectedReturn.originalOrderNumber)}
              />
            </div>
          </div>
        )}
      </Modal>
    </PageTemplate>
  );
}
