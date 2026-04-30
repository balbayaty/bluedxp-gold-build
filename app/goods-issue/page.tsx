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
  generatePickingTasks,
} from "@/utils/mockDataGenerators";
import { getSalesOrderLinks } from "@/utils/moduleInterconnectivity";
import { format } from "date-fns";
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
import {
  realtimeSimulator,
  simulateKPIUpdates,
} from "@/utils/realtimeDataSimulator";
import UniversalQRGenerator from "@/components/qr/UniversalQRGenerator";
import QRCodeBadge from "@/components/qr/QRCodeBadge";

interface GoodsIssue {
  id: string;
  giNumber: string;
  soNumber: string;
  customerNumber: string;
  customerName: string;
  issueDate: Date | string;
  status:
    | "PENDING"
    | "PICKING"
    | "STAGED"
    | "SHIPPING"
    | "COMPLETED"
    | "CANCELLED";
  totalItems: number;
  totalQuantity: number;
  pickedQuantity: number;
  stagedQuantity: number;
  shippedQuantity: number;
  pickingTaskId?: string;
  stagingArea?: string;
  shipmentNumber?: string;
  carrier?: string;
  trackingNumber?: string;
  issuedBy?: string;
  postedAt?: Date | string;
}

export default function GoodsIssue() {
  const router = useRouter();
  const [giDocuments, setGiDocuments] = useState<GoodsIssue[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch goods issue documents from API
  useEffect(() => {
    const fetchGoodsIssues = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch('/api/wms/goods-issue?limit=100');
        const result = await response.json();

        if (result.success && result.data) {
          // Map API response to GoodsIssue format
          const mappedGIs: GoodsIssue[] = result.data.map((gi: any) => ({
            id: gi.id,
            giNumber: gi.giNumber,
            soNumber: gi.soNumber,
            customerNumber: gi.customerNumber,
            customerName: gi.customerName,
            issueDate: gi.issueDate ? new Date(gi.issueDate) : new Date(),
            status: gi.status as GoodsIssue["status"],
            totalItems: gi.totalItems || 0,
            totalQuantity: gi.totalQuantity || 0,
            pickedQuantity: gi.pickedQuantity || 0,
            stagedQuantity: gi.stagedQuantity || 0,
            shippedQuantity: gi.shippedQuantity || 0,
            pickingTaskId: gi.pickingTaskId,
            stagingArea: gi.stagingArea,
            shipmentNumber: gi.shipmentNumber,
            carrier: gi.carrier,
            trackingNumber: gi.trackingNumber,
            issuedBy: gi.issuedBy,
            postedAt: gi.postedAt ? new Date(gi.postedAt) : undefined,
          }));
          setGiDocuments(mappedGIs);
        } else {
          setError(result.error || 'Failed to fetch goods issue documents');
        }
      } catch (err) {
        console.error('Error fetching goods issue documents:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch goods issue documents');
      } finally {
        setLoading(false);
      }
    };

    fetchGoodsIssues();
  }, []);

  const [selectedGI, setSelectedGI] = useState<GoodsIssue | null>(null);
  const [showGIModal, setShowGIModal] = useState(false);
  const [showPostModal, setShowPostModal] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<
    "overview" | "pending" | "staging" | "shipping" | "analytics" | "realtime"
  >("overview");
  const [realTimeEnabled, setRealTimeEnabled] = useState(true);
  const [realTimeStats, setRealTimeStats] = useState({
    totalGIs: 0,
    activePicking: 0,
    completionRate: 0,
    averageProcessingTime: 0,
  });

  const filteredGIs = useMemo(() => {
    return giDocuments.filter((gi) => {
      const matchesSearch =
        searchQuery === "" ||
        gi.giNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        gi.soNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        gi.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        gi.shipmentNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        gi.trackingNumber?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus =
        selectedStatus === "ALL" || gi.status === selectedStatus;
      return matchesSearch && matchesStatus;
    });
  }, [giDocuments, selectedStatus, searchQuery]);

  // Status distribution
  const statusDistribution = useMemo(() => {
    const counts: Record<string, number> = {};
    giDocuments.forEach((gi) => {
      counts[gi.status] = (counts[gi.status] || 0) + 1;
    });
    return Object.entries(counts).map(([status, count]) => ({ status, count }));
  }, [giDocuments]);

  // GI trend
  const giTrend = useMemo(() => {
    const dailyData: Record<
      string,
      { date: string; completed: number; pending: number }
    > = {};

    giDocuments.forEach((gi) => {
      const date = format(new Date(gi.issueDate), "yyyy-MM-dd");
      if (!dailyData[date]) {
        dailyData[date] = { date, completed: 0, pending: 0 };
      }
      if (gi.status === "COMPLETED") {
        dailyData[date].completed += 1;
      } else {
        dailyData[date].pending += 1;
      }
    });

    return Object.values(dailyData)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .map((d) => ({
        date: format(new Date(d.date), "MMM dd"),
        completed: d.completed,
        pending: d.pending,
      }));
  }, [giDocuments]);

  const aggregateStats = useMemo(() => {
    const totalGIs = giDocuments.length;
    const pending = giDocuments.filter(
      (gi) => gi.status === "PENDING" || gi.status === "PICKING",
    ).length;
    const completed = giDocuments.filter(
      (gi) => gi.status === "COMPLETED",
    ).length;
    const staged = giDocuments.filter(
      (gi) => gi.status === "STAGED" || gi.status === "SHIPPING",
    ).length;
    const totalShipped = giDocuments.reduce(
      (sum, gi) => sum + gi.shippedQuantity,
      0,
    );
    const completionRate = totalGIs > 0 ? (completed / totalGIs) * 100 : 0;
    const averageProcessingTime =
      giDocuments
        .filter((gi) => gi.postedAt && gi.issuedBy)
        .reduce((sum, gi) => {
          const issueTime = new Date(gi.issueDate).getTime();
          const postedTime = new Date(gi.postedAt!).getTime();
          return sum + (postedTime - issueTime) / (1000 * 60 * 60); // hours
        }, 0) / Math.max(1, giDocuments.filter((gi) => gi.postedAt).length);

    return {
      totalGIs,
      pending,
      completed,
      staged,
      totalShipped,
      completionRate,
      averageProcessingTime,
    };
  }, [giDocuments]);

  // Customer performance analytics
  const customerPerformance = useMemo(() => {
    const customerMap = new Map<
      string,
      { count: number; totalQuantity: number; completed: number }
    >();

    giDocuments.forEach((gi) => {
      if (!customerMap.has(gi.customerName)) {
        customerMap.set(gi.customerName, {
          count: 0,
          totalQuantity: 0,
          completed: 0,
        });
      }
      const customer = customerMap.get(gi.customerName)!;
      customer.count++;
      customer.totalQuantity += gi.totalQuantity;
      if (gi.status === "COMPLETED") {
        customer.completed++;
      }
    });

    return Array.from(customerMap.entries())
      .map(([name, data]) => ({
        name,
        totalGIs: data.count,
        totalQuantity: data.totalQuantity,
        completionRate: (data.completed / data.count) * 100,
      }))
      .sort((a, b) => b.totalGIs - a.totalGIs)
      .slice(0, 10);
  }, [giDocuments]);

  // Hourly performance
  const hourlyPerformance = useMemo(() => {
    const hourlyData: Record<number, { issued: number; completed: number }> =
      {};

    giDocuments.forEach((gi) => {
      const hour = new Date(gi.issueDate).getHours();
      if (!hourlyData[hour]) {
        hourlyData[hour] = { issued: 0, completed: 0 };
      }
      hourlyData[hour].issued++;
      if (gi.status === "COMPLETED") {
        hourlyData[hour].completed++;
      }
    });

    return Array.from({ length: 24 }, (_, hour) => ({
      hour: `${hour}:00`,
      issued: hourlyData[hour]?.issued || 0,
      completed: hourlyData[hour]?.completed || 0,
      efficiency: hourlyData[hour]
        ? (hourlyData[hour].completed / hourlyData[hour].issued) * 100
        : 0,
    }));
  }, [giDocuments]);

  // Real-time updates
  useEffect(() => {
    if (!realTimeEnabled) return;

    const unsubscribe = realtimeSimulator.subscribe(
      "goods-issue-stats",
      (data: typeof realTimeStats) => {
        setRealTimeStats(data);
      },
    );

    const stop = realtimeSimulator.start(
      "goods-issue-stats",
      () => ({
        totalGIs: simulateKPIUpdates(aggregateStats.totalGIs, 0.05),
        activePicking: simulateKPIUpdates(aggregateStats.pending, 0.1),
        completionRate: simulateKPIUpdates(aggregateStats.completionRate, 0.02),
        averageProcessingTime: simulateKPIUpdates(
          aggregateStats.averageProcessingTime,
          0.05,
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
    realTimeEnabled,
    aggregateStats.totalGIs,
    aggregateStats.pending,
    aggregateStats.completionRate,
    aggregateStats.averageProcessingTime,
  ]);

  // Simulate real-time status changes
  useEffect(() => {
    if (!realTimeEnabled) return;

    const interval = setInterval(() => {
      setGiDocuments((prev) =>
        prev.map((gi) => {
          if (gi.status === "PENDING" && Math.random() < 0.03) {
            return {
              ...gi,
              status: "PICKING" as const,
              pickingTaskId: `PICK-${Date.now()}`,
            };
          }
          if (
            gi.status === "PICKING" &&
            gi.pickedQuantity >= gi.totalQuantity * 0.9 &&
            Math.random() < 0.02
          ) {
            return {
              ...gi,
              status: "STAGED" as const,
              stagingArea: `STAGE-${Math.floor(Math.random() * 5) + 1}`,
            };
          }
          if (gi.status === "STAGED" && Math.random() < 0.02) {
            return {
              ...gi,
              status: "SHIPPING" as const,
              shipmentNumber: `SHIP-${Date.now()}`,
              carrier: ["Carrier A", "Carrier B", "Wajeeh"][
                Math.floor(Math.random() * 3)
              ],
            };
          }
          if (gi.status === "SHIPPING" && Math.random() < 0.02) {
            return {
              ...gi,
              status: "COMPLETED" as const,
              postedAt: new Date(),
              issuedBy: `User-${Math.floor(Math.random() * 5) + 1}`,
            };
          }
          return gi;
        }),
      );
    }, 10000);

    return () => clearInterval(interval);
  }, [realTimeEnabled]);

  const stats = [
    {
      label: "Total GIs",
      value: realTimeEnabled ? realTimeStats.totalGIs : aggregateStats.totalGIs,
      icon: "ri-send-plane-line",
      tooltip: "Total goods issue documents",
      trend: "up" as const,
    },
    {
      label: "Active Picking",
      value: realTimeEnabled
        ? realTimeStats.activePicking
        : aggregateStats.pending,
      icon: "ri-time-line",
      tooltip: "Active picking operations",
      trend: "neutral" as const,
    },
    {
      label: "Completion Rate",
      value: `${(realTimeEnabled ? realTimeStats.completionRate : aggregateStats.completionRate).toFixed(1)}%`,
      icon: "ri-checkbox-circle-line",
      tooltip: "GI completion rate",
      trend: "up" as const,
    },
    {
      label: "Avg Processing",
      value: `${(realTimeEnabled ? realTimeStats.averageProcessingTime : aggregateStats.averageProcessingTime).toFixed(1)}h`,
      icon: "ri-speed-line",
      tooltip: "Average processing time",
      trend: "down" as const,
    },
  ];

  const handleViewGI = (gi: GoodsIssue) => {
    setSelectedGI(gi);
    setShowGIModal(true);
  };

  const handlePostGI = (gi: GoodsIssue) => {
    setSelectedGI(gi);
    setShowPostModal(true);
  };

  const handlePost = async () => {
    if (!selectedGI) return;

    try {
      // Update via API if needed
      setGiDocuments(
        giDocuments.map((gi) =>
          gi.id === selectedGI.id
            ? { ...gi, status: "COMPLETED" as const, postedAt: new Date() }
            : gi,
        ),
      );
      setShowPostModal(false);
      setSelectedGI(null);
    } catch (err) {
      console.error('Error posting goods issue:', err);
    }
  };

  if (loading) {
    return (
      <PageTemplate
        title="Goods Issue"
        description="Outbound goods issue management and tracking"
        icon="ri-send-plane-line"
      >
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
            <p className="text-white">Loading goods issue documents...</p>
          </div>
        </div>
      </PageTemplate>
    );
  }

  if (error) {
    return (
      <PageTemplate
        title="Goods Issue"
        description="Outbound goods issue management and tracking"
        icon="ri-send-plane-line"
      >
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <p className="text-red-400 mb-4">Error: {error}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Retry
            </button>
          </div>
        </div>
      </PageTemplate>
    );
  }

  if (loading) {
    return (
      <PageTemplate
        title="Goods Issue"
        description="Picking integration, staging, shipping, and goods issue workflow management"
        icon="ri-send-plane-line"
      >
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
            <p className="text-white">Loading goods issue documents...</p>
          </div>
        </div>
      </PageTemplate>
    );
  }

  if (error) {
    return (
      <PageTemplate
        title="Goods Issue"
        description="Picking integration, staging, shipping, and goods issue workflow management"
        icon="ri-send-plane-line"
      >
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <p className="text-red-400 mb-4">Error: {error}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Retry
            </button>
          </div>
        </div>
      </PageTemplate>
    );
  }

  return (
    <PageTemplate
      title="Goods Issue"
      description="Picking integration, staging, shipping, and goods issue workflow management"
      icon="ri-send-plane-line"
      systemInfo={{
        sap: "MIGO - Goods Issue, MB1A - Goods Issue",
        oracle: "Issue, Material Issue",
        manhattan: "Shipping, Issue Processing",
      }}
      examples={[
        "Picking integration",
        "Staging area management",
        "Shipping coordination",
        "Goods issue posting",
        "Tracking integration",
        "GI workflow management",
      ]}
      stats={stats}
      actions={
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
          <div className="flex items-center gap-1 sm:gap-2 bg-white/5 border border-white/10 rounded-lg p-1 sm:p-2">
            <button
              onClick={() => setViewMode("overview")}
              className={`p-1.5 sm:p-2 rounded transition-colors ${
                viewMode === "overview"
                  ? "bg-cyan-500/20 text-cyan-400"
                  : "text-[#9ca3af] hover:text-white"
              }`}
              title="Overview"
            >
              <i className="ri-dashboard-line text-sm sm:text-base"></i>
            </button>
            <button
              onClick={() => setViewMode("pending")}
              className={`p-1.5 sm:p-2 rounded transition-colors ${
                viewMode === "pending"
                  ? "bg-cyan-500/20 text-cyan-400"
                  : "text-[#9ca3af] hover:text-white"
              }`}
              title="Pending"
            >
              <i className="ri-time-line text-sm sm:text-base"></i>
            </button>
            <button
              onClick={() => setViewMode("staging")}
              className={`p-1.5 sm:p-2 rounded transition-colors ${
                viewMode === "staging"
                  ? "bg-cyan-500/20 text-cyan-400"
                  : "text-[#9ca3af] hover:text-white"
              }`}
              title="Staging"
            >
              <i className="ri-stack-line text-sm sm:text-base"></i>
            </button>
            <button
              onClick={() => setViewMode("analytics")}
              className={`p-1.5 sm:p-2 rounded transition-colors ${
                viewMode === "analytics"
                  ? "bg-cyan-500/20 text-cyan-400"
                  : "text-[#9ca3af] hover:text-white"
              }`}
              title="Analytics"
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
              title="Real-time"
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
      <div className="mb-4 sm:mb-6 flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
        <input
          type="text"
          placeholder="Search GI, SO, Customer, Shipment, Tracking..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="flex-1 bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white placeholder-[#6b7280] focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
        />
        <select
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
          className="bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 min-w-[150px]"
        >
          <option value="ALL">All Statuses</option>
          <option value="PENDING">Pending</option>
          <option value="PICKING">Picking</option>
          <option value="STAGED">Staged</option>
          <option value="SHIPPING">Shipping</option>
          <option value="COMPLETED">Completed</option>
          <option value="CANCELLED">Cancelled</option>
        </select>
      </div>

      {/* Overview View */}
      {viewMode === "overview" && (
        <div className="space-y-6">
          {/* Status Distribution */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
          >
            <h3 className="text-lg font-semibold text-white mb-4">
              GI Status Distribution
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
                      fill={
                        [
                          "#06b6d4",
                          "#3b82f6",
                          "#10b981",
                          "#f59e0b",
                          "#8b5cf6",
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

          {/* GI Trend */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
          >
            <h3 className="text-lg font-semibold text-white mb-4">GI Trend</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={giTrend}>
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
                <Bar dataKey="completed" fill="#10b981" name="Completed" />
                <Bar dataKey="pending" fill="#f59e0b" name="Pending" />
                <Legend />
              </BarChart>
            </ResponsiveContainer>
          </motion.div>
        </div>
      )}

      {/* Pending View */}
      {viewMode === "pending" && (
        <div className="space-y-4">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredGIs
              .filter(
                (gi) => gi.status === "PENDING" || gi.status === "PICKING",
              )
              .map((gi, index) => (
                <motion.div
                  key={gi.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="bg-white/5 backdrop-blur-xl border border-yellow-500/30 rounded-2xl p-6"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-white mb-1">
                        {gi.giNumber}
                      </h3>
                      <div className="text-sm text-[#9ca3af] mb-2">
                        SO:{" "}
                        <button
                          onClick={() =>
                            router.push(`/sales-orders?so=${gi.soNumber}`)
                          }
                          className="text-cyan-400 hover:text-cyan-300 transition-colors"
                        >
                          {gi.soNumber}
                        </button>
                      </div>
                      <div
                        className={`text-xs px-2 py-1 rounded inline-block ${
                          gi.status === "PICKING"
                            ? "bg-yellow-500/20 text-yellow-400"
                            : "bg-gray-500/20 text-gray-400"
                        }`}
                      >
                        {gi.status}
                      </div>
                    </div>
                    <div className="ml-2">
                      <QRCodeBadge
                        entityId={gi.id}
                        entityType="goods-issue"
                        entityName={gi.giNumber}
                        documentType="other"
                        documentUrl={`/goods-issue?id=${gi.id}`}
                        module="wms"
                        size="sm"
                      />
                    </div>
                  </div>

                  <div className="space-y-2 mb-4">
                    <div className="text-xs text-[#9ca3af]">
                      <i className="ri-user-line mr-1"></i>
                      Customer: {gi.customerName}
                    </div>
                    <div className="text-xs text-[#9ca3af]">
                      <i className="ri-file-list-line mr-1"></i>
                      Items: {gi.totalItems} | Qty: {gi.pickedQuantity}/
                      {gi.totalQuantity}
                    </div>
                    {gi.pickingTaskId && (
                      <div className="text-xs text-cyan-400">
                        <i className="ri-handbag-line mr-1"></i>
                        Picking Task:{" "}
                        <button
                          onClick={() =>
                            router.push(`/picking?task=${gi.pickingTaskId}`)
                          }
                          className="hover:text-cyan-300 transition-colors"
                        >
                          {gi.pickingTaskId}
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 pt-4 border-t border-white/10">
                    <button
                      onClick={() => handleViewGI(gi)}
                      className="flex-1 px-3 py-2 bg-cyan-600/20 text-cyan-400 border border-cyan-500/30 rounded text-sm font-medium hover:bg-cyan-600/30 transition-colors"
                    >
                      <i className="ri-eye-line mr-1"></i>
                      View
                    </button>
                    {gi.pickingTaskId && (
                      <button
                        onClick={() =>
                          router.push(`/picking?task=${gi.pickingTaskId}`)
                        }
                        className="px-3 py-2 bg-blue-600/20 text-blue-400 border border-blue-500/30 rounded text-sm font-medium hover:bg-blue-600/30 transition-colors"
                      >
                        <i className="ri-handbag-line"></i>
                      </button>
                    )}
                  </div>
                </motion.div>
              ))}
          </div>
        </div>
      )}

      {/* Staging View */}
      {viewMode === "staging" && (
        <div className="space-y-4">
          {filteredGIs
            .filter((gi) => gi.status === "STAGED" || gi.status === "SHIPPING")
            .map((gi, index) => (
              <motion.div
                key={gi.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white/5 backdrop-blur-xl border border-blue-500/30 rounded-2xl p-6"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-white mb-1">
                      {gi.giNumber}
                    </h3>
                    <div className="text-sm text-[#9ca3af] mb-2">
                      SO:{" "}
                      <button
                        onClick={() =>
                          router.push(`/sales-orders?so=${gi.soNumber}`)
                        }
                        className="text-cyan-400 hover:text-cyan-300 transition-colors"
                      >
                        {gi.soNumber}
                      </button>
                    </div>
                    <div className="text-sm text-[#9ca3af] mb-2">
                      Customer: {gi.customerName}
                    </div>
                    {gi.stagingArea && (
                      <div className="text-sm text-blue-400">
                        <i className="ri-map-pin-line mr-1"></i>
                        Staging Area: {gi.stagingArea}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2 ml-2">
                    <QRCodeBadge
                      entityId={gi.id}
                      entityType="goods-issue"
                      entityName={gi.giNumber}
                      documentType="other"
                      documentUrl={`/goods-issue?id=${gi.id}`}
                      module="wms"
                      size="sm"
                    />
                    <div
                      className={`px-3 py-1 rounded text-sm font-medium ${
                        gi.status === "STAGED"
                          ? "bg-blue-500/20 text-blue-400"
                          : "bg-green-500/20 text-green-400"
                      }`}
                    >
                      {gi.status}
                    </div>
                  </div>
                </div>

                <div className="grid md:grid-cols-3 gap-4 mb-4">
                  <div className="p-3 bg-white/5 rounded-lg">
                    <div className="text-xs text-[#9ca3af] mb-1">Picked</div>
                    <div className="text-lg font-bold text-white">
                      {gi.pickedQuantity}
                    </div>
                  </div>
                  <div className="p-3 bg-white/5 rounded-lg">
                    <div className="text-xs text-[#9ca3af] mb-1">Staged</div>
                    <div className="text-lg font-bold text-white">
                      {gi.stagedQuantity}
                    </div>
                  </div>
                  <div className="p-3 bg-white/5 rounded-lg">
                    <div className="text-xs text-[#9ca3af] mb-1">Shipped</div>
                    <div className="text-lg font-bold text-white">
                      {gi.shippedQuantity}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-4 border-t border-white/10">
                  <button
                    onClick={() => handleViewGI(gi)}
                    className="flex-1 px-3 py-2 bg-cyan-600/20 text-cyan-400 border border-cyan-500/30 rounded text-sm font-medium hover:bg-cyan-600/30 transition-colors"
                  >
                    View Details
                  </button>
                  {gi.shipmentNumber && (
                    <button
                      onClick={() =>
                        router.push(`/tracking?shipment=${gi.shipmentNumber}`)
                      }
                      className="px-3 py-2 bg-purple-600/20 text-purple-400 border border-purple-500/30 rounded text-sm font-medium hover:bg-purple-600/30 transition-colors"
                    >
                      <i className="ri-map-pin-line mr-1"></i>
                      Track
                    </button>
                  )}
                </div>
              </motion.div>
            ))}
        </div>
      )}

      {/* Shipping View */}
      {viewMode === "shipping" && (
        <div className="space-y-4">
          {filteredGIs
            .filter(
              (gi) => gi.status === "SHIPPING" || gi.status === "COMPLETED",
            )
            .map((gi, index) => (
              <motion.div
                key={gi.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white/5 backdrop-blur-xl border border-green-500/30 rounded-2xl p-6"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-white mb-1">
                      {gi.giNumber}
                    </h3>
                    <div className="mt-2">
                      <QRCodeBadge
                        entityId={gi.id}
                        entityType="goods-issue"
                        entityName={gi.giNumber}
                        documentType="other"
                        documentUrl={`/goods-issue?id=${gi.id}`}
                        module="wms"
                        size="sm"
                      />
                    </div>
                    <div className="text-sm text-[#9ca3af] mb-2 mt-2">
                      SO:{" "}
                      <button
                        onClick={() =>
                          router.push(`/sales-orders?so=${gi.soNumber}`)
                        }
                        className="text-cyan-400 hover:text-cyan-300 transition-colors"
                      >
                        {gi.soNumber}
                      </button>
                    </div>
                    {gi.shipmentNumber && (
                      <div className="text-sm text-cyan-400 mb-2">
                        Shipment:{" "}
                        <button
                          onClick={() =>
                            router.push(
                              `/tracking?shipment=${gi.shipmentNumber}`,
                            )
                          }
                          className="hover:text-cyan-300 transition-colors"
                        >
                          {gi.shipmentNumber}
                        </button>
                      </div>
                    )}
                    {gi.trackingNumber && (
                      <div className="text-sm text-purple-400 mb-2">
                        Tracking: {gi.trackingNumber}
                      </div>
                    )}
                    {gi.carrier && (
                      <div className="text-sm text-[#9ca3af]">
                        Carrier: {gi.carrier}
                      </div>
                    )}
                  </div>
                  <div
                    className={`px-3 py-1 rounded text-sm font-medium ${
                      gi.status === "COMPLETED"
                        ? "bg-green-500/20 text-green-400"
                        : "bg-yellow-500/20 text-yellow-400"
                    }`}
                  >
                    {gi.status}
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-4 border-t border-white/10">
                  <button
                    onClick={() => handleViewGI(gi)}
                    className="flex-1 px-3 py-2 bg-cyan-600/20 text-cyan-400 border border-cyan-500/30 rounded text-sm font-medium hover:bg-cyan-600/30 transition-colors"
                  >
                    View Details
                  </button>
                  {gi.trackingNumber && (
                    <button
                      onClick={() =>
                        router.push(`/tracking?tracking=${gi.trackingNumber}`)
                      }
                      className="px-3 py-2 bg-purple-600/20 text-purple-400 border border-purple-500/30 rounded text-sm font-medium hover:bg-purple-600/30 transition-colors"
                    >
                      <i className="ri-map-pin-line mr-1"></i>
                      Track Shipment
                    </button>
                  )}
                  {gi.status === "SHIPPING" && (
                    <button
                      onClick={() => handlePostGI(gi)}
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

      {/* GI Details Modal */}
      <Modal
        isOpen={showGIModal}
        onClose={() => {
          setShowGIModal(false);
          setSelectedGI(null);
        }}
        title={`Goods Issue - ${selectedGI?.giNumber || ""}`}
        size="lg"
      >
        {selectedGI && (
          <div className="space-y-4">
            {/* QR Code Section */}
            <div className="bg-white/5 rounded-lg p-4 border border-cyan-500/20">
              <UniversalQRGenerator
                entityId={selectedGI.id}
                entityType="goods-issue"
                entityName={selectedGI.giNumber}
                documentType="other"
                documentUrl={`/goods-issue?id=${selectedGI.id}`}
                module="wms"
                showAdvanced={false}
              />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-[#9ca3af] mb-1">GI Number</div>
                <div className="text-white font-medium">
                  {selectedGI.giNumber}
                </div>
              </div>
              <div>
                <div className="text-sm text-[#9ca3af] mb-1">Sales Order</div>
                <div className="text-white font-medium">
                  <button
                    onClick={() =>
                      router.push(`/sales-orders?so=${selectedGI.soNumber}`)
                    }
                    className="text-cyan-400 hover:text-cyan-300 transition-colors"
                  >
                    {selectedGI.soNumber}
                  </button>
                </div>
              </div>
              <div>
                <div className="text-sm text-[#9ca3af] mb-1">Customer</div>
                <div className="text-white font-medium">
                  {selectedGI.customerName}
                </div>
              </div>
              <div>
                <div className="text-sm text-[#9ca3af] mb-1">Status</div>
                <div className="text-white font-medium">
                  {selectedGI.status.replace(/_/g, " ")}
                </div>
              </div>
              <div>
                <div className="text-sm text-[#9ca3af] mb-1">Progress</div>
                <div className="text-white font-medium">
                  Picked: {selectedGI.pickedQuantity} | Staged:{" "}
                  {selectedGI.stagedQuantity} | Shipped:{" "}
                  {selectedGI.shippedQuantity}
                </div>
              </div>
              {selectedGI.stagingArea && (
                <div>
                  <div className="text-sm text-[#9ca3af] mb-1">
                    Staging Area
                  </div>
                  <div className="text-white font-medium">
                    {selectedGI.stagingArea}
                  </div>
                </div>
              )}
              {selectedGI.shipmentNumber && (
                <div>
                  <div className="text-sm text-[#9ca3af] mb-1">Shipment</div>
                  <div className="text-white font-medium">
                    <button
                      onClick={() =>
                        router.push(
                          `/tracking?shipment=${selectedGI.shipmentNumber}`,
                        )
                      }
                      className="text-cyan-400 hover:text-cyan-300 transition-colors"
                    >
                      {selectedGI.shipmentNumber}
                    </button>
                  </div>
                </div>
              )}
              {selectedGI.trackingNumber && (
                <div>
                  <div className="text-sm text-[#9ca3af] mb-1">
                    Tracking Number
                  </div>
                  <div className="text-white font-medium">
                    {selectedGI.trackingNumber}
                  </div>
                </div>
              )}
            </div>
            <ModuleLinks links={getSalesOrderLinks(selectedGI.soNumber)} />
          </div>
        )}
      </Modal>

      {/* Analytics View */}
      {viewMode === "analytics" && (
        <div className="space-y-6">
          {/* Customer Performance */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
          >
            <h3 className="text-lg font-semibold text-white mb-4">
              Top Customers Performance
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
                <Bar dataKey="totalGIs" fill="#06b6d4" name="Total GIs" />
                <Bar
                  dataKey="completionRate"
                  fill="#10b981"
                  name="Completion Rate %"
                />
              </BarChart>
            </ResponsiveContainer>
          </motion.div>

          {/* Hourly Performance */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
          >
            <h3 className="text-lg font-semibold text-white mb-4">
              Hourly Issue Performance
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <ComposedChart data={hourlyPerformance}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="hour" stroke="#9ca3af" fontSize={10} />
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
                  dataKey="issued"
                  fill="#3b82f6"
                  name="Issued"
                />
                <Bar
                  yAxisId="left"
                  dataKey="completed"
                  fill="#10b981"
                  name="Completed"
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="efficiency"
                  stroke="#f59e0b"
                  strokeWidth={2}
                  name="Efficiency %"
                />
              </ComposedChart>
            </ResponsiveContainer>
          </motion.div>

          {/* Status Distribution */}
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
                      fill={
                        [
                          "#06b6d4",
                          "#3b82f6",
                          "#10b981",
                          "#f59e0b",
                          "#8b5cf6",
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

          {/* GI Trend */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
          >
            <h3 className="text-lg font-semibold text-white mb-4">GI Trend</h3>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={giTrend}>
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
                <Area
                  type="monotone"
                  dataKey="completed"
                  stackId="1"
                  stroke="#10b981"
                  fill="#10b981"
                  fillOpacity={0.6}
                  name="Completed"
                />
                <Area
                  type="monotone"
                  dataKey="pending"
                  stackId="1"
                  stroke="#f59e0b"
                  fill="#f59e0b"
                  fillOpacity={0.6}
                  name="Pending"
                />
              </AreaChart>
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
                <div className="text-xs text-[#9ca3af] mb-1">Total GIs</div>
                <div className="text-2xl font-bold text-white">
                  {realTimeStats.totalGIs}
                </div>
              </div>
              <div className="bg-white/5 rounded-lg p-4">
                <div className="text-xs text-[#9ca3af] mb-1">
                  Active Picking
                </div>
                <div className="text-2xl font-bold text-cyan-400">
                  {realTimeStats.activePicking}
                </div>
              </div>
              <div className="bg-white/5 rounded-lg p-4">
                <div className="text-xs text-[#9ca3af] mb-1">
                  Completion Rate
                </div>
                <div className="text-2xl font-bold text-green-400">
                  {realTimeStats.completionRate.toFixed(1)}%
                </div>
              </div>
              <div className="bg-white/5 rounded-lg p-4">
                <div className="text-xs text-[#9ca3af] mb-1">
                  Avg Processing
                </div>
                <div className="text-2xl font-bold text-yellow-400">
                  {realTimeStats.averageProcessingTime.toFixed(1)}h
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
              {filteredGIs
                .sort(
                  (a, b) =>
                    new Date(b.issueDate).getTime() -
                    new Date(a.issueDate).getTime(),
                )
                .slice(0, 10)
                .map((gi) => (
                  <div
                    key={gi.id}
                    className="flex items-center justify-between p-3 bg-white/5 rounded-lg"
                  >
                    <div className="flex-1">
                      <div className="text-sm font-medium text-white">
                        {gi.giNumber}
                      </div>
                      <div className="text-xs text-[#9ca3af]">
                        {gi.customerName} •{" "}
                        {format(new Date(gi.issueDate), "MMM dd, HH:mm")}
                      </div>
                    </div>
                    <div
                      className={`text-xs px-2 py-1 rounded ${
                        gi.status === "COMPLETED"
                          ? "bg-green-500/20 text-green-400"
                          : gi.status === "SHIPPING"
                            ? "bg-cyan-500/20 text-cyan-400"
                            : gi.status === "PICKING"
                              ? "bg-yellow-500/20 text-yellow-400"
                              : "bg-gray-500/20 text-gray-400"
                      }`}
                    >
                      {gi.status.replace(/_/g, " ")}
                    </div>
                  </div>
                ))}
            </div>
          </motion.div>
        </div>
      )}

      {/* Post GI Modal */}
      <Modal
        isOpen={showPostModal}
        onClose={() => {
          setShowPostModal(false);
          setSelectedGI(null);
        }}
        title={`Post Goods Issue - ${selectedGI?.giNumber || ""}`}
        size="md"
      >
        {selectedGI && (
          <div className="space-y-4">
            <div className="p-4 bg-white/5 rounded-lg">
              <div className="text-sm text-[#9ca3af] mb-2">
                Posting Goods Issue:
              </div>
              <div className="text-white font-medium">
                {selectedGI.giNumber}
              </div>
              <div className="text-sm text-[#9ca3af] mt-2">
                SO: {selectedGI.soNumber} | Customer: {selectedGI.customerName}
              </div>
              <div className="text-sm text-[#9ca3af] mt-2">
                Shipped Quantity: {selectedGI.shippedQuantity} /{" "}
                {selectedGI.totalQuantity}
              </div>
            </div>
            <div className="flex items-center gap-3 pt-4">
              <button
                onClick={handlePost}
                className="flex-1 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white px-6 py-3 rounded-lg text-sm font-medium transition-colors"
              >
                <i className="ri-check-line mr-2"></i>
                Post GI
              </button>
              <button
                onClick={() => {
                  setShowPostModal(false);
                  setSelectedGI(null);
                }}
                className="px-6 py-3 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-lg text-sm font-medium transition-colors"
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
