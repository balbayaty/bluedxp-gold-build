/**
 * Goods Receipt Page
 * INTEGRATED: Now uses real Prisma database via /api/wms/goods-receipt
 */

"use client";

import { useState, useMemo, useEffect } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import PageTemplate from "@/components/PageTemplate";
import Tooltip from "@/components/Tooltip";
import Modal from "@/components/Modal";
import ModuleLinks from "@/components/ModuleLinks";
import { getPurchaseOrderLinks } from "@/utils/moduleInterconnectivity";
import { format, differenceInHours } from "date-fns";
import GoodsReceiptVisionIntegration from "@/components/vision/GoodsReceiptVisionIntegration";
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
import { logger } from "@/lib/services/observability/logger";
import UniversalQRGenerator from "@/components/qr/UniversalQRGenerator";
import QRCodeBadge from "@/components/qr/QRCodeBadge";

interface ASNMatch {
  asnNumber: string;
  poNumber: string;
  vendorName: string;
  expectedDate: Date | string;
  actualDate?: Date | string;
  matchStatus: "MATCHED" | "PARTIAL" | "MISMATCH" | "PENDING";
  items: {
    materialNumber: string;
    expectedQuantity: number;
    receivedQuantity?: number;
    variance?: number;
  }[];
}

interface GoodsReceipt {
  id: string;
  grNumber: string;
  poNumber: string;
  asnNumber?: string;
  vendorNumber: string;
  vendorName: string;
  receiptDate: Date | string;
  status:
    | "PENDING"
    | "IN_PROGRESS"
    | "QUALITY_CHECK"
    | "PUTAWAY_PLANNED"
    | "COMPLETED"
    | "REJECTED";
  totalItems: number;
  totalQuantity: number;
  receivedQuantity: number;
  putawayPlanned: boolean;
  qualityCheckRequired: boolean;
  qualityCheckStatus?: "PENDING" | "PASSED" | "FAILED";
  inspectionLotNumber?: string;
  putawayTasks: {
    materialNumber: string;
    quantity: number;
    suggestedLocation: string;
    priority: "HIGH" | "MEDIUM" | "LOW";
  }[];
  receivedBy?: string;
  postedAt?: Date | string;
}

export default function GoodsReceipt() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [grDocuments, setGrDocuments] = useState<GoodsReceipt[]>([]);
  
  // Fetch goods receipts from API
  useEffect(() => {
    const fetchGoodsReceipts = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch('/api/wms/goods-receipt?limit=100');
        const result = await response.json();
        
        if (result.success && result.data) {
          // Map API response to component interface
          const mappedGRs: GoodsReceipt[] = result.data.map((gr: any, index: number) => ({
            id: gr.id || `gr-${index + 1}`,
            grNumber: gr.grNumber || gr.documentNumber || `GR-${String(index + 1).padStart(6, "0")}`,
            poNumber: gr.poNumber || '',
            asnNumber: gr.asnNumber || gr.documentNumber,
            vendorNumber: gr.vendorId || '',
            vendorName: gr.vendorName || '',
            receiptDate: gr.receiptDate || gr.expectedDeliveryDate || new Date(),
            status: (gr.status === 'CREATED' ? 'PENDING' :
                    gr.status === 'IN_PROGRESS' ? 'IN_PROGRESS' :
                    gr.status === 'QUALITY_CHECK' ? 'QUALITY_CHECK' :
                    gr.status === 'PUTAWAY_PLANNED' ? 'PUTAWAY_PLANNED' :
                    gr.status === 'COMPLETED' ? 'COMPLETED' :
                    gr.status === 'REJECTED' ? 'REJECTED' : 'PENDING') as GoodsReceipt["status"],
            totalItems: gr.items?.length || 0,
            totalQuantity: gr.items?.reduce((sum: number, item: any) => sum + (item.expectedQty || 0), 0) || 0,
            receivedQuantity: gr.items?.reduce((sum: number, item: any) => sum + (item.receivedQty || item.expectedQty || 0), 0) || 0,
            putawayPlanned: gr.status === 'PUTAWAY_PLANNED' || gr.status === 'COMPLETED',
            qualityCheckRequired: gr.qualityCheckRequired || false,
            qualityCheckStatus: gr.qualityCheckStatus,
            inspectionLotNumber: gr.inspectionLotNumber,
            putawayTasks: gr.items?.map((item: any) => ({
              materialNumber: item.sku || item.materialNumber || '',
              quantity: item.receivedQty || item.expectedQty || 0,
              suggestedLocation: item.suggestedLocation || '',
              priority: item.priority || 'MEDIUM' as const,
            })) || [],
            receivedBy: gr.receivedBy,
            postedAt: gr.postedAt,
          }));
          setGrDocuments(mappedGRs);
        } else {
          setError(result.error || 'Failed to fetch goods receipts');
        }
      } catch (err) {
        console.error('Error fetching goods receipts:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch goods receipts');
      } finally {
        setLoading(false);
      }
    };
    
    fetchGoodsReceipts();
  }, []);

  // Derive ASN matches from GR documents
  const [asnMatches, setAsnMatches] = useState<ASNMatch[]>([]);
  useEffect(() => {
    if (grDocuments.length > 0) {
      const matches: ASNMatch[] = grDocuments.slice(0, 15).map((gr, index) => ({
        asnNumber: gr.asnNumber || `ASN-${String(index + 1).padStart(6, "0")}`,
        poNumber: gr.poNumber,
        vendorName: gr.vendorName,
        expectedDate: gr.receiptDate,
        actualDate: gr.status === 'COMPLETED' ? gr.receiptDate : undefined,
        matchStatus: gr.status === 'COMPLETED' ? 'MATCHED' as const :
                     gr.status === 'PUTAWAY_PLANNED' ? 'PARTIAL' as const :
                     gr.status === 'QUALITY_CHECK' ? 'MISMATCH' as const : 'PENDING' as const,
        items: gr.putawayTasks.map((task) => ({
          materialNumber: task.materialNumber,
          expectedQuantity: task.quantity,
          receivedQuantity: task.quantity,
          variance: 0,
        })),
      }));
      setAsnMatches(matches);
    }
  }, [grDocuments]);

  const [selectedGR, setSelectedGR] = useState<GoodsReceipt | null>(null);
  const [selectedASN, setSelectedASN] = useState<ASNMatch | null>(null);
  const [showGRModal, setShowGRModal] = useState(false);
  const [showASNModal, setShowASNModal] = useState(false);
  const [showPostModal, setShowPostModal] = useState(false);
  const [showPutawayModal, setShowPutawayModal] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<
    | "overview"
    | "asn"
    | "gr"
    | "putaway"
    | "quality"
    | "analytics"
    | "realtime"
    | "exceptions"
  >("overview");
  const [realTimeEnabled, setRealTimeEnabled] = useState(true);
  const [realTimeStats, setRealTimeStats] = useState({
    totalGRs: 0,
    activeReceiving: 0,
    completionRate: 0,
    averageProcessingTime: 0,
  });

  const filteredGRs = useMemo(() => {
    return grDocuments.filter((gr) => {
      const matchesSearch =
        searchQuery === "" ||
        gr.grNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        gr.poNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        gr.asnNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        gr.vendorName.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus =
        selectedStatus === "ALL" || gr.status === selectedStatus;
      return matchesSearch && matchesStatus;
    });
  }, [grDocuments, selectedStatus, searchQuery]);

  // Status distribution
  const statusDistribution = useMemo(() => {
    const counts: Record<string, number> = {};
    grDocuments.forEach((gr) => {
      counts[gr.status] = (counts[gr.status] || 0) + 1;
    });
    return Object.entries(counts).map(([status, count]) => ({ status, count }));
  }, [grDocuments]);

  // GR trend
  const grTrend = useMemo(() => {
    const dailyData: Record<
      string,
      { date: string; completed: number; pending: number }
    > = {};

    grDocuments.forEach((gr) => {
      const date = format(new Date(gr.receiptDate), "yyyy-MM-dd");
      if (!dailyData[date]) {
        dailyData[date] = { date, completed: 0, pending: 0 };
      }
      if (gr.status === "COMPLETED") {
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
  }, [grDocuments]);

  const aggregateStats = useMemo(() => {
    const totalGRs = grDocuments.length;
    const pending = grDocuments.filter(
      (gr) => gr.status === "PENDING" || gr.status === "IN_PROGRESS",
    ).length;
    const completed = grDocuments.filter(
      (gr) => gr.status === "COMPLETED",
    ).length;
    const qualityCheck = grDocuments.filter(
      (gr) => gr.status === "QUALITY_CHECK",
    ).length;
    const totalReceived = grDocuments.reduce(
      (sum, gr) => sum + gr.receivedQuantity,
      0,
    );
    const putawayPlanned = grDocuments.filter((gr) => gr.putawayPlanned).length;
    const completionRate = totalGRs > 0 ? (completed / totalGRs) * 100 : 0;
    const averageProcessingTime =
      grDocuments
        .filter((gr) => gr.postedAt && gr.receivedBy)
        .reduce((sum, gr) => {
          const receiptTime = new Date(gr.receiptDate).getTime();
          const postedTime = new Date(gr.postedAt!).getTime();
          return sum + (postedTime - receiptTime) / (1000 * 60 * 60); // hours
        }, 0) / Math.max(1, grDocuments.filter((gr) => gr.postedAt).length);

    return {
      totalGRs,
      pending,
      completed,
      qualityCheck,
      totalReceived,
      putawayPlanned,
      completionRate,
      averageProcessingTime,
    };
  }, [grDocuments]);

  // Vendor performance analytics
  const vendorPerformance = useMemo(() => {
    const vendorMap = new Map<
      string,
      {
        count: number;
        totalQuantity: number;
        completed: number;
        avgProcessingTime: number;
      }
    >();

    grDocuments.forEach((gr) => {
      if (!vendorMap.has(gr.vendorName)) {
        vendorMap.set(gr.vendorName, {
          count: 0,
          totalQuantity: 0,
          completed: 0,
          avgProcessingTime: 0,
        });
      }
      const vendor = vendorMap.get(gr.vendorName)!;
      vendor.count++;
      vendor.totalQuantity += gr.receivedQuantity;
      if (gr.status === "COMPLETED") {
        vendor.completed++;
      }
    });

    return Array.from(vendorMap.entries())
      .map(([name, data]) => ({
        name,
        totalGRs: data.count,
        totalQuantity: data.totalQuantity,
        completionRate: (data.completed / data.count) * 100,
      }))
      .sort((a, b) => b.totalGRs - a.totalGRs)
      .slice(0, 10);
  }, [grDocuments]);

  // Hourly performance
  const hourlyPerformance = useMemo(() => {
    const hourlyData: Record<number, { received: number; completed: number }> =
      {};

    grDocuments.forEach((gr) => {
      const hour = new Date(gr.receiptDate).getHours();
      if (!hourlyData[hour]) {
        hourlyData[hour] = { received: 0, completed: 0 };
      }
      hourlyData[hour].received++;
      if (gr.status === "COMPLETED") {
        hourlyData[hour].completed++;
      }
    });

    return Array.from({ length: 24 }, (_, hour) => ({
      hour: `${hour}:00`,
      received: hourlyData[hour]?.received || 0,
      completed: hourlyData[hour]?.completed || 0,
      efficiency: hourlyData[hour]
        ? (hourlyData[hour].completed / hourlyData[hour].received) * 100
        : 0,
    }));
  }, [grDocuments]);

  // Real-time updates
  useEffect(() => {
    if (!realTimeEnabled) return;

    const unsubscribe = realtimeSimulator.subscribe(
      "goods-receipt-stats",
      (data: typeof realTimeStats) => {
        setRealTimeStats(data);
      },
    );

    const stop = realtimeSimulator.start(
      "goods-receipt-stats",
      () => ({
        totalGRs: simulateKPIUpdates(aggregateStats.totalGRs, 0.05),
        activeReceiving: simulateKPIUpdates(aggregateStats.pending, 0.1),
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
    aggregateStats.totalGRs,
    aggregateStats.pending,
    aggregateStats.completionRate,
    aggregateStats.averageProcessingTime,
  ]);

  // Simulate real-time status changes
  useEffect(() => {
    if (!realTimeEnabled) return;

    const interval = setInterval(() => {
      setGrDocuments((prev) =>
        prev.map((gr) => {
          if (gr.status === "PENDING" && Math.random() < 0.03) {
            return {
              ...gr,
              status: "IN_PROGRESS" as const,
              receivedBy: `User-${Math.floor(Math.random() * 5) + 1}`,
            };
          }
          if (gr.status === "IN_PROGRESS" && Math.random() < 0.02) {
            return {
              ...gr,
              status: "QUALITY_CHECK" as const,
              inspectionLotNumber: `INSP-${Date.now()}`,
            };
          }
          if (
            gr.status === "QUALITY_CHECK" &&
            gr.qualityCheckStatus === "PASSED" &&
            Math.random() < 0.02
          ) {
            return {
              ...gr,
              status: "PUTAWAY_PLANNED" as const,
              putawayPlanned: true,
            };
          }
          if (gr.status === "PUTAWAY_PLANNED" && Math.random() < 0.02) {
            return {
              ...gr,
              status: "COMPLETED" as const,
              postedAt: new Date(),
            };
          }
          return gr;
        }),
      );
    }, 10000);

    return () => clearInterval(interval);
  }, [realTimeEnabled]);

  const stats = [
    {
      label: "Total GRs",
      value: realTimeEnabled ? realTimeStats.totalGRs : aggregateStats.totalGRs,
      icon: "ri-inbox-line",
      tooltip: "Total goods receipt documents",
      trend: "up" as const,
    },
    {
      label: "Active Receiving",
      value: realTimeEnabled
        ? realTimeStats.activeReceiving
        : aggregateStats.pending,
      icon: "ri-time-line",
      tooltip: "Active receiving operations",
      trend: "neutral" as const,
    },
    {
      label: "Completion Rate",
      value: `${(realTimeEnabled ? realTimeStats.completionRate : aggregateStats.completionRate).toFixed(1)}%`,
      icon: "ri-checkbox-circle-line",
      tooltip: "GR completion rate",
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

  const handleViewGR = (gr: GoodsReceipt) => {
    setSelectedGR(gr);
    setShowGRModal(true);
  };

  const handleViewASN = (asn: ASNMatch) => {
    setSelectedASN(asn);
    setShowASNModal(true);
  };

  const handlePostGR = (gr: GoodsReceipt) => {
    setSelectedGR(gr);
    setShowPostModal(true);
  };

  const handlePlanPutaway = (gr: GoodsReceipt) => {
    setSelectedGR(gr);
    setShowPutawayModal(true);
  };

  const handlePost = () => {
    if (!selectedGR) return;

    setGrDocuments(
      grDocuments.map((gr) =>
        gr.id === selectedGR.id
          ? { ...gr, status: "COMPLETED" as const, postedAt: new Date() }
          : gr,
      ),
    );
    setShowPostModal(false);
    setSelectedGR(null);
  };

  return (
    <PageTemplate
      title="Goods Receipt"
      description="ASN matching, putaway planning, quality checks, and goods receipt workflow management"
      icon="ri-inbox-line"
      loading={loading}
      error={error}
      systemInfo={{
        sap: "MIGO - Goods Receipt, MB01 - GR for PO",
        oracle: "Receipt, Material Receipt",
        manhattan: "Receiving, Receipt Processing",
      }}
      examples={[
        "ASN matching with purchase orders",
        "Goods receipt posting",
        "Putaway planning and optimization",
        "Quality inspection integration",
        "Variance tracking",
        "GR workflow management",
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
              onClick={() => setViewMode("gr")}
              className={`p-1.5 sm:p-2 rounded transition-colors ${
                viewMode === "gr"
                  ? "bg-cyan-500/20 text-cyan-400"
                  : "text-[#9ca3af] hover:text-white"
              }`}
              title="Goods Receipts"
            >
              <i className="ri-inbox-line text-sm sm:text-base"></i>
            </button>
            <button
              onClick={() => setViewMode("asn")}
              className={`p-1.5 sm:p-2 rounded transition-colors ${
                viewMode === "asn"
                  ? "bg-cyan-500/20 text-cyan-400"
                  : "text-[#9ca3af] hover:text-white"
              }`}
              title="ASN Matching"
            >
              <i className="ri-file-list-line text-sm sm:text-base"></i>
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
            <button
              onClick={() => setViewMode("exceptions")}
              className={`p-1.5 sm:p-2 rounded transition-colors ${
                viewMode === "exceptions"
                  ? "bg-cyan-500/20 text-cyan-400"
                  : "text-[#9ca3af] hover:text-white"
              }`}
              title="Exceptions"
            >
              <i className="ri-error-warning-line text-sm sm:text-base"></i>
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
          placeholder="Search GR, PO, ASN, Vendor..."
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
          <option value="IN_PROGRESS">In Progress</option>
          <option value="QUALITY_CHECK">Quality Check</option>
          <option value="PUTAWAY_PLANNED">Putaway Planned</option>
          <option value="COMPLETED">Completed</option>
          <option value="REJECTED">Rejected</option>
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
              GR Status Distribution
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={statusDistribution}
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

          {/* GR Trend */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
          >
            <h3 className="text-lg font-semibold text-white mb-4">GR Trend</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={grTrend}>
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

      {/* ASN Matching View */}
      {viewMode === "asn" && (
        <div className="space-y-4">
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-white/5">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-[#9ca3af] uppercase">
                      ASN Number
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-[#9ca3af] uppercase">
                      PO Number
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-[#9ca3af] uppercase">
                      Vendor
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-[#9ca3af] uppercase">
                      Expected Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-[#9ca3af] uppercase">
                      Match Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-[#9ca3af] uppercase">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {asnMatches.map((asn) => (
                    <tr
                      key={asn.asnNumber}
                      className="hover:bg-white/5 transition-colors"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-white">
                          {asn.asnNumber}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() =>
                            router.push(`/purchase-orders?po=${asn.poNumber}`)
                          }
                          className="text-sm text-cyan-400 hover:text-cyan-300 transition-colors"
                        >
                          {asn.poNumber}
                        </button>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                        {asn.vendorName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-[#9ca3af]">
                        {format(new Date(asn.expectedDate), "MMM dd, yyyy")}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium ${
                            asn.matchStatus === "MATCHED"
                              ? "bg-green-500/20 text-green-400"
                              : asn.matchStatus === "PARTIAL"
                                ? "bg-yellow-500/20 text-yellow-400"
                                : asn.matchStatus === "MISMATCH"
                                  ? "bg-red-500/20 text-red-400"
                                  : "bg-gray-500/20 text-gray-400"
                          }`}
                        >
                          {asn.matchStatus}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() => handleViewASN(asn)}
                          className="px-3 py-1 bg-cyan-600/20 text-cyan-400 border border-cyan-500/30 rounded text-sm font-medium hover:bg-cyan-600/30 transition-colors"
                        >
                          <i className="ri-eye-line mr-1"></i>
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Goods Receipt View */}
      {viewMode === "gr" && (
        <div className="space-y-4">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredGRs.map((gr, index) => (
              <motion.div
                key={gr.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className={`bg-white/5 backdrop-blur-xl border rounded-2xl p-6 ${
                  gr.status === "COMPLETED"
                    ? "border-green-500/30"
                    : gr.status === "REJECTED"
                      ? "border-red-500/30"
                      : gr.status === "QUALITY_CHECK"
                        ? "border-yellow-500/30"
                        : "border-white/10"
                }`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-white mb-1">
                      {gr.grNumber}
                    </h3>
                    <div className="text-sm text-[#9ca3af] mb-2">
                      PO:{" "}
                      <button
                        onClick={() =>
                          router.push(`/purchase-orders?po=${gr.poNumber}`)
                        }
                        className="text-cyan-400 hover:text-cyan-300 transition-colors"
                      >
                        {gr.poNumber}
                      </button>
                    </div>
                    <div
                      className={`text-xs px-2 py-1 rounded inline-block ${
                        gr.status === "COMPLETED"
                          ? "bg-green-500/20 text-green-400"
                          : gr.status === "REJECTED"
                            ? "bg-red-500/20 text-red-400"
                            : gr.status === "QUALITY_CHECK"
                              ? "bg-yellow-500/20 text-yellow-400"
                              : "bg-gray-500/20 text-gray-400"
                      }`}
                    >
                      {gr.status.replace(/_/g, " ")}
                    </div>
                  </div>
                  <div className="ml-2">
                    <QRCodeBadge
                      entityId={gr.id}
                      entityType="goods-receipt"
                      entityName={gr.grNumber}
                      documentType="other"
                      documentUrl={`/goods-receipt?id=${gr.id}`}
                      module="wms"
                      size="sm"
                    />
                  </div>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="text-xs text-[#9ca3af]">
                    <i className="ri-store-line mr-1"></i>
                    Vendor: {gr.vendorName}
                  </div>
                  <div className="text-xs text-[#9ca3af]">
                    <i className="ri-file-list-line mr-1"></i>
                    Items: {gr.totalItems} | Qty: {gr.receivedQuantity}/
                    {gr.totalQuantity}
                  </div>
                  {gr.qualityCheckRequired && (
                    <div className="text-xs text-[#9ca3af]">
                      <i className="ri-shield-check-line mr-1"></i>
                      Quality Check: {gr.qualityCheckStatus || "PENDING"}
                    </div>
                  )}
                  {gr.putawayPlanned && (
                    <div className="text-xs text-green-400">
                      <i className="ri-checkbox-circle-line mr-1"></i>
                      Putaway Planned
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 pt-4 border-t border-white/10">
                  <button
                    onClick={() => handleViewGR(gr)}
                    className="flex-1 px-3 py-2 bg-cyan-600/20 text-cyan-400 border border-cyan-500/30 rounded text-sm font-medium hover:bg-cyan-600/30 transition-colors"
                  >
                    <i className="ri-eye-line mr-1"></i>
                    View
                  </button>
                  {gr.status !== "COMPLETED" && (
                    <button
                      onClick={() => handlePostGR(gr)}
                      className="px-3 py-2 bg-green-600/20 text-green-400 border border-green-500/30 rounded text-sm font-medium hover:bg-green-600/30 transition-colors"
                    >
                      <i className="ri-check-line"></i>
                    </button>
                  )}
                  {!gr.putawayPlanned && gr.status !== "PENDING" && (
                    <button
                      onClick={() => handlePlanPutaway(gr)}
                      className="px-3 py-2 bg-blue-600/20 text-blue-400 border border-blue-500/30 rounded text-sm font-medium hover:bg-blue-600/30 transition-colors"
                    >
                      <i className="ri-stack-line"></i>
                    </button>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Putaway Planning View */}
      {viewMode === "putaway" && (
        <div className="space-y-4">
          {filteredGRs
            .filter((gr) => gr.putawayPlanned)
            .map((gr) => (
              <motion.div
                key={gr.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-1">
                      {gr.grNumber}
                    </h3>
                    <div className="text-sm text-[#9ca3af]">
                      PO: {gr.poNumber}
                    </div>
                  </div>
                  <button
                    onClick={() => router.push("/putaway")}
                    className="px-4 py-2 bg-cyan-600/20 text-cyan-400 border border-cyan-500/30 rounded text-sm font-medium hover:bg-cyan-600/30 transition-colors"
                  >
                    View Putaway Tasks
                  </button>
                </div>
                <div className="space-y-2">
                  {gr.putawayTasks.map((task, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-3 bg-white/5 rounded-lg"
                    >
                      <div>
                        <div className="text-sm font-medium text-white">
                          {task.materialNumber}
                        </div>
                        <div className="text-xs text-[#9ca3af]">
                          Qty: {task.quantity}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-white">
                          {task.suggestedLocation}
                        </div>
                        <div
                          className={`text-xs ${
                            task.priority === "HIGH"
                              ? "text-red-400"
                              : task.priority === "MEDIUM"
                                ? "text-yellow-400"
                                : "text-[#9ca3af]"
                          }`}
                        >
                          {task.priority} Priority
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            ))}
        </div>
      )}

      {/* Quality Check View */}
      {viewMode === "quality" && (
        <div className="space-y-4">
          {filteredGRs
            .filter((gr) => gr.qualityCheckRequired)
            .map((gr) => (
              <motion.div
                key={gr.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className={`bg-white/5 backdrop-blur-xl border rounded-2xl p-6 ${
                  gr.qualityCheckStatus === "PASSED"
                    ? "border-green-500/30"
                    : gr.qualityCheckStatus === "FAILED"
                      ? "border-red-500/30"
                      : "border-yellow-500/30"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-white mb-1">
                      {gr.grNumber}
                    </h3>
                    <div className="text-sm text-[#9ca3af] mb-2">
                      PO: {gr.poNumber} | Vendor: {gr.vendorName}
                    </div>
                    {gr.inspectionLotNumber && (
                      <div className="text-sm text-cyan-400 mb-2">
                        Inspection Lot:{" "}
                        <button
                          onClick={() =>
                            router.push(
                              `/inspection-lots?lot=${gr.inspectionLotNumber}`,
                            )
                          }
                          className="hover:text-cyan-300 transition-colors"
                        >
                          {gr.inspectionLotNumber}
                        </button>
                      </div>
                    )}
                    <div
                      className={`text-sm px-3 py-1 rounded inline-block mt-2 ${
                        gr.qualityCheckStatus === "PASSED"
                          ? "bg-green-500/20 text-green-400"
                          : gr.qualityCheckStatus === "FAILED"
                            ? "bg-red-500/20 text-red-400"
                            : "bg-yellow-500/20 text-yellow-400"
                      }`}
                    >
                      {gr.qualityCheckStatus || "PENDING"}
                    </div>
                  </div>
                  {gr.inspectionLotNumber && (
                    <button
                      onClick={() =>
                        router.push(
                          `/inspection-lots?lot=${gr.inspectionLotNumber}`,
                        )
                      }
                      className="px-4 py-2 bg-cyan-600/20 text-cyan-400 border border-cyan-500/30 rounded text-sm font-medium hover:bg-cyan-600/30 transition-colors"
                    >
                      View Inspection
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
          {/* Vendor Performance */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">
                Top Vendors Performance
              </h3>
              <button
                onClick={() => {
                  const vendorData = grDocuments
                    .filter(
                      (gr) => gr.vendorName === vendorPerformance[0]?.name,
                    )
                    .map((gr) => ({
                      grNumber: gr.grNumber,
                      poNumber: gr.poNumber,
                      status: gr.status,
                      receivedQuantity: gr.receivedQuantity,
                      totalQuantity: gr.totalQuantity,
                      receiptDate: gr.receiptDate,
                    }));
                  setSelectedStatus(vendorPerformance[0]?.name || "ALL");
                  setViewMode("gr");
                }}
                className="text-xs text-cyan-400 hover:text-cyan-300 transition-colors"
              >
                <i className="ri-arrow-right-line mr-1"></i>
                Drill Down
              </button>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={vendorPerformance}>
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
                <Bar dataKey="totalGRs" fill="#06b6d4" name="Total GRs" />
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
              Hourly Receiving Performance
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
                  dataKey="received"
                  fill="#3b82f6"
                  name="Received"
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
                  label={({ status, count }) =>
                    `${status.replace(/_/g, " ")}: ${count}`
                  }
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

          {/* GR Trend */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
          >
            <h3 className="text-lg font-semibold text-white mb-4">GR Trend</h3>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={grTrend}>
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

      {/* Exception Handling View */}
      {viewMode === "exceptions" && (
        <div className="space-y-6">
          {/* Exception Summary */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
          >
            <h3 className="text-lg font-semibold text-white mb-4">
              Exception Summary
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
                <div className="text-xs text-red-400 mb-1">Mismatches</div>
                <div className="text-2xl font-bold text-red-400">
                  {
                    asnMatches.filter((a) => a.matchStatus === "MISMATCH")
                      .length
                  }
                </div>
              </div>
              <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
                <div className="text-xs text-yellow-400 mb-1">
                  Partial Matches
                </div>
                <div className="text-2xl font-bold text-yellow-400">
                  {asnMatches.filter((a) => a.matchStatus === "PARTIAL").length}
                </div>
              </div>
              <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-4">
                <div className="text-xs text-orange-400 mb-1">
                  Quality Failures
                </div>
                <div className="text-2xl font-bold text-orange-400">
                  {
                    grDocuments.filter(
                      (gr) => gr.qualityCheckStatus === "FAILED",
                    ).length
                  }
                </div>
              </div>
              <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-4">
                <div className="text-xs text-purple-400 mb-1">Variances</div>
                <div className="text-2xl font-bold text-purple-400">
                  {
                    asnMatches.filter((a) =>
                      a.items.some((i) => i.variance && i.variance !== 0),
                    ).length
                  }
                </div>
              </div>
            </div>
          </motion.div>

          {/* ASN Mismatches */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
          >
            <h3 className="text-lg font-semibold text-white mb-4">
              ASN Mismatches & Variances
            </h3>
            <div className="space-y-3">
              {asnMatches
                .filter(
                  (a) =>
                    a.matchStatus === "MISMATCH" ||
                    a.matchStatus === "PARTIAL" ||
                    a.items.some((i) => i.variance && i.variance !== 0),
                )
                .map((asn) => (
                  <div
                    key={asn.asnNumber}
                    className="p-4 bg-white/5 border border-white/10 rounded-lg"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="text-sm font-medium text-white mb-1">
                          {asn.asnNumber}
                        </div>
                        <div className="text-xs text-[#9ca3af]">
                          PO: {asn.poNumber} | Vendor: {asn.vendorName}
                        </div>
                      </div>
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${
                          asn.matchStatus === "MISMATCH"
                            ? "bg-red-500/20 text-red-400"
                            : asn.matchStatus === "PARTIAL"
                              ? "bg-yellow-500/20 text-yellow-400"
                              : "bg-gray-500/20 text-gray-400"
                        }`}
                      >
                        {asn.matchStatus}
                      </span>
                    </div>
                    <div className="space-y-2">
                      {asn.items
                        .filter((item) => item.variance && item.variance !== 0)
                        .map((item, idx) => (
                          <div
                            key={idx}
                            className="flex items-center justify-between p-2 bg-white/5 rounded"
                          >
                            <div>
                              <div className="text-sm text-white">
                                {item.materialNumber}
                              </div>
                              <div className="text-xs text-[#9ca3af]">
                                Expected: {item.expectedQuantity} | Received:{" "}
                                {item.receivedQuantity || "N/A"}
                              </div>
                            </div>
                            <div
                              className={`text-sm font-medium ${
                                item.variance! > 0
                                  ? "text-yellow-400"
                                  : "text-red-400"
                              }`}
                            >
                              {item.variance! > 0 ? "+" : ""}
                              {item.variance}
                            </div>
                          </div>
                        ))}
                    </div>
                    <div className="mt-3 flex items-center gap-2">
                      <button
                        onClick={() => handleViewASN(asn)}
                        className="px-3 py-1.5 bg-cyan-600/20 text-cyan-400 border border-cyan-500/30 rounded text-sm font-medium hover:bg-cyan-600/30 transition-colors"
                      >
                        <i className="ri-eye-line mr-1"></i>
                        View Details
                      </button>
                      <button
                        onClick={() =>
                          router.push(`/purchase-orders?po=${asn.poNumber}`)
                        }
                        className="px-3 py-1.5 bg-white/5 text-white border border-white/10 rounded text-sm font-medium hover:bg-white/10 transition-colors"
                      >
                        <i className="ri-file-list-line mr-1"></i>
                        View PO
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          </motion.div>

          {/* Quality Failures */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
          >
            <h3 className="text-lg font-semibold text-white mb-4">
              Quality Check Failures
            </h3>
            <div className="space-y-3">
              {grDocuments
                .filter((gr) => gr.qualityCheckStatus === "FAILED")
                .map((gr) => (
                  <div
                    key={gr.id}
                    className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="text-sm font-medium text-white mb-1">
                          {gr.grNumber}
                        </div>
                        <div className="text-xs text-[#9ca3af]">
                          PO: {gr.poNumber} | Vendor: {gr.vendorName}
                        </div>
                        {gr.inspectionLotNumber && (
                          <div className="text-xs text-cyan-400 mt-1">
                            Inspection Lot: {gr.inspectionLotNumber}
                          </div>
                        )}
                      </div>
                      <span className="px-2 py-1 rounded text-xs font-medium bg-red-500/20 text-red-400">
                        QUALITY FAILED
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleViewGR(gr)}
                        className="px-3 py-1.5 bg-cyan-600/20 text-cyan-400 border border-cyan-500/30 rounded text-sm font-medium hover:bg-cyan-600/30 transition-colors"
                      >
                        <i className="ri-eye-line mr-1"></i>
                        View GR
                      </button>
                      {gr.inspectionLotNumber && (
                        <button
                          onClick={() =>
                            router.push(
                              `/inspection-lots?lot=${gr.inspectionLotNumber}`,
                            )
                          }
                          className="px-3 py-1.5 bg-yellow-600/20 text-yellow-400 border border-yellow-500/30 rounded text-sm font-medium hover:bg-yellow-600/30 transition-colors"
                        >
                          <i className="ri-file-search-line mr-1"></i>
                          View Inspection
                        </button>
                      )}
                    </div>
                  </div>
                ))}
            </div>
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
                <div className="text-xs text-[#9ca3af] mb-1">Total GRs</div>
                <div className="text-2xl font-bold text-white">
                  {realTimeStats.totalGRs}
                </div>
              </div>
              <div className="bg-white/5 rounded-lg p-4">
                <div className="text-xs text-[#9ca3af] mb-1">
                  Active Receiving
                </div>
                <div className="text-2xl font-bold text-cyan-400">
                  {realTimeStats.activeReceiving}
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
              {filteredGRs
                .sort(
                  (a, b) =>
                    new Date(b.receiptDate).getTime() -
                    new Date(a.receiptDate).getTime(),
                )
                .slice(0, 10)
                .map((gr) => (
                  <div
                    key={gr.id}
                    className="flex items-center justify-between p-3 bg-white/5 rounded-lg"
                  >
                    <div className="flex-1">
                      <div className="text-sm font-medium text-white">
                        {gr.grNumber}
                      </div>
                      <div className="text-xs text-[#9ca3af]">
                        {gr.vendorName} •{" "}
                        {format(new Date(gr.receiptDate), "MMM dd, HH:mm")}
                      </div>
                    </div>
                    <div
                      className={`text-xs px-2 py-1 rounded ${
                        gr.status === "COMPLETED"
                          ? "bg-green-500/20 text-green-400"
                          : gr.status === "IN_PROGRESS"
                            ? "bg-cyan-500/20 text-cyan-400"
                            : "bg-yellow-500/20 text-yellow-400"
                      }`}
                    >
                      {gr.status.replace(/_/g, " ")}
                    </div>
                  </div>
                ))}
            </div>
          </motion.div>
        </div>
      )}

      {/* GR Details Modal */}
      <Modal
        isOpen={showGRModal}
        onClose={() => {
          setShowGRModal(false);
          setSelectedGR(null);
        }}
        title={`Goods Receipt - ${selectedGR?.grNumber || ""}`}
        size="lg"
      >
        {selectedGR && (
          <div className="space-y-4">
            {/* QR Code Section */}
            <div className="bg-white/5 rounded-lg p-4 border border-cyan-500/20">
              <UniversalQRGenerator
                entityId={selectedGR.id}
                entityType="goods-receipt"
                entityName={selectedGR.grNumber}
                documentType="other"
                documentUrl={`/goods-receipt?id=${selectedGR.id}`}
                module="wms"
                showAdvanced={false}
              />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-[#9ca3af] mb-1">GR Number</div>
                <div className="text-white font-medium">
                  {selectedGR.grNumber}
                </div>
              </div>
              <div>
                <div className="text-sm text-[#9ca3af] mb-1">PO Number</div>
                <div className="text-white font-medium">
                  <button
                    onClick={() =>
                      router.push(`/purchase-orders?po=${selectedGR.poNumber}`)
                    }
                    className="text-cyan-400 hover:text-cyan-300 transition-colors"
                  >
                    {selectedGR.poNumber}
                  </button>
                </div>
              </div>
              <div>
                <div className="text-sm text-[#9ca3af] mb-1">Vendor</div>
                <div className="text-white font-medium">
                  {selectedGR.vendorName}
                </div>
              </div>
              <div>
                <div className="text-sm text-[#9ca3af] mb-1">Status</div>
                <div className="text-white font-medium">
                  {selectedGR.status.replace(/_/g, " ")}
                </div>
              </div>
              <div>
                <div className="text-sm text-[#9ca3af] mb-1">
                  Received Quantity
                </div>
                <div className="text-white font-medium">
                  {selectedGR.receivedQuantity} / {selectedGR.totalQuantity}
                </div>
              </div>
              {selectedGR.qualityCheckStatus && (
                <div>
                  <div className="text-sm text-[#9ca3af] mb-1">
                    Quality Check
                  </div>
                  <div
                    className={`font-medium ${
                      selectedGR.qualityCheckStatus === "PASSED"
                        ? "text-green-400"
                        : selectedGR.qualityCheckStatus === "FAILED"
                          ? "text-red-400"
                          : "text-yellow-400"
                    }`}
                  >
                    {selectedGR.qualityCheckStatus}
                  </div>
                </div>
              )}
            </div>
            {selectedGR.putawayTasks.length > 0 && (
              <div>
                <div className="text-sm text-[#9ca3af] mb-2">Putaway Tasks</div>
                <div className="space-y-2">
                  {selectedGR.putawayTasks.map((task, idx) => (
                    <div key={idx} className="p-3 bg-white/5 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-sm font-medium text-white">
                            {task.materialNumber}
                          </div>
                          <div className="text-xs text-[#9ca3af]">
                            Qty: {task.quantity}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm text-white">
                            {task.suggestedLocation}
                          </div>
                          <div className="text-xs text-[#9ca3af]">
                            {task.priority} Priority
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* AI Vision Integration */}
            <div className="mt-4">
              <GoodsReceiptVisionIntegration
                onVerificationComplete={(verification) => {
                  logger.info("AI Vision verification", undefined, {
                    module: "goods-receipt",
                    service: "vision-verification",
                  });
                  // Auto-update GR with verification results
                  if (selectedGR) {
                    setGrDocuments((prev) =>
                      prev.map((gr) =>
                        gr.id === selectedGR.id
                          ? {
                              ...gr,
                              qualityCheckStatus: verification.verified
                                ? ("PASSED" as const)
                                : ("FAILED" as const),
                              receivedQuantity:
                                verification.itemCount || gr.receivedQuantity,
                            }
                          : gr,
                      ),
                    );
                  }
                }}
                formFields={[
                  {
                    id: "receivedQuantity",
                    name: "receivedQuantity",
                    type: "number",
                    label: "Received Quantity",
                  },
                  {
                    id: "qualityCheckStatus",
                    name: "qualityCheckStatus",
                    type: "select",
                    label: "Quality Check",
                  },
                ]}
                onFieldFill={(fieldId, value, confidence) => {
                  logger.debug("Auto-filled field", undefined, {
                    module: "goods-receipt",
                    service: "vision-verification",
                    fieldId,
                    confidence,
                  });
                }}
              />
            </div>

            <ModuleLinks links={getPurchaseOrderLinks(selectedGR.poNumber)} />
          </div>
        )}
      </Modal>

      {/* ASN Match Details Modal */}
      <Modal
        isOpen={showASNModal}
        onClose={() => {
          setShowASNModal(false);
          setSelectedASN(null);
        }}
        title={`ASN Match - ${selectedASN?.asnNumber || ""}`}
        size="lg"
      >
        {selectedASN && (
          <div className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-[#9ca3af] mb-1">ASN Number</div>
                <div className="text-white font-medium">
                  {selectedASN.asnNumber}
                </div>
              </div>
              <div>
                <div className="text-sm text-[#9ca3af] mb-1">PO Number</div>
                <div className="text-white font-medium">
                  <button
                    onClick={() =>
                      router.push(`/purchase-orders?po=${selectedASN.poNumber}`)
                    }
                    className="text-cyan-400 hover:text-cyan-300 transition-colors"
                  >
                    {selectedASN.poNumber}
                  </button>
                </div>
              </div>
              <div>
                <div className="text-sm text-[#9ca3af] mb-1">Match Status</div>
                <div
                  className={`font-medium ${
                    selectedASN.matchStatus === "MATCHED"
                      ? "text-green-400"
                      : selectedASN.matchStatus === "PARTIAL"
                        ? "text-yellow-400"
                        : selectedASN.matchStatus === "MISMATCH"
                          ? "text-red-400"
                          : "text-gray-400"
                  }`}
                >
                  {selectedASN.matchStatus}
                </div>
              </div>
            </div>
            <div>
              <div className="text-sm text-[#9ca3af] mb-2">Items</div>
              <div className="space-y-2">
                {selectedASN.items.map((item, idx) => (
                  <div key={idx} className="p-3 bg-white/5 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm font-medium text-white">
                          {item.materialNumber}
                        </div>
                        <div className="text-xs text-[#9ca3af]">
                          Expected: {item.expectedQuantity}
                          {item.receivedQuantity !== undefined &&
                            ` | Received: ${item.receivedQuantity}`}
                        </div>
                      </div>
                      {item.variance !== undefined && (
                        <div
                          className={`text-sm font-medium ${
                            item.variance === 0
                              ? "text-green-400"
                              : item.variance > 0
                                ? "text-yellow-400"
                                : "text-red-400"
                          }`}
                        >
                          {item.variance > 0 ? "+" : ""}
                          {item.variance}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Post GR Modal */}
      <Modal
        isOpen={showPostModal}
        onClose={() => {
          setShowPostModal(false);
          setSelectedGR(null);
        }}
        title={`Post Goods Receipt - ${selectedGR?.grNumber || ""}`}
        size="md"
      >
        {selectedGR && (
          <div className="space-y-4">
            <div className="p-4 bg-white/5 rounded-lg">
              <div className="text-sm text-[#9ca3af] mb-2">
                Posting Goods Receipt:
              </div>
              <div className="text-white font-medium">
                {selectedGR.grNumber}
              </div>
              <div className="text-sm text-[#9ca3af] mt-2">
                PO: {selectedGR.poNumber} | Vendor: {selectedGR.vendorName}
              </div>
              <div className="text-sm text-[#9ca3af] mt-2">
                Quantity: {selectedGR.receivedQuantity} /{" "}
                {selectedGR.totalQuantity}
              </div>
            </div>
            {selectedGR.qualityCheckRequired &&
              !selectedGR.qualityCheckStatus && (
                <div className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                  <div className="text-sm text-yellow-400">
                    <i className="ri-alert-line mr-1"></i>
                    Quality check is required before posting
                  </div>
                </div>
              )}
            <div className="flex items-center gap-3 pt-4">
              <button
                onClick={handlePost}
                disabled={
                  selectedGR.qualityCheckRequired &&
                  !selectedGR.qualityCheckStatus
                }
                className="flex-1 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white px-6 py-3 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <i className="ri-check-line mr-2"></i>
                Post GR
              </button>
              <button
                onClick={() => {
                  setShowPostModal(false);
                  setSelectedGR(null);
                }}
                className="px-6 py-3 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-lg text-sm font-medium transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Putaway Planning Modal */}
      <Modal
        isOpen={showPutawayModal}
        onClose={() => {
          setShowPutawayModal(false);
          setSelectedGR(null);
        }}
        title={`Plan Putaway - ${selectedGR?.grNumber || ""}`}
        size="lg"
      >
        {selectedGR && (
          <div className="space-y-4">
            <div className="text-sm text-[#9ca3af] mb-4">
              Generate putaway tasks for received materials
            </div>
            <div className="space-y-2">
              {selectedGR.putawayTasks.map((task, idx) => (
                <div key={idx} className="p-3 bg-white/5 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-medium text-white">
                        {task.materialNumber}
                      </div>
                      <div className="text-xs text-[#9ca3af]">
                        Quantity: {task.quantity}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-white">
                        {task.suggestedLocation}
                      </div>
                      <div className="text-xs text-[#9ca3af]">
                        {task.priority} Priority
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex items-center gap-3 pt-4">
              <button
                onClick={() => {
                  setGrDocuments(
                    grDocuments.map((gr) =>
                      gr.id === selectedGR.id
                        ? { ...gr, putawayPlanned: true }
                        : gr,
                    ),
                  );
                  router.push("/putaway");
                  setShowPutawayModal(false);
                  setSelectedGR(null);
                }}
                className="flex-1 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white px-6 py-3 rounded-lg text-sm font-medium transition-colors"
              >
                <i className="ri-stack-line mr-2"></i>
                Create Putaway Tasks
              </button>
              <button
                onClick={() => {
                  setShowPutawayModal(false);
                  setSelectedGR(null);
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
