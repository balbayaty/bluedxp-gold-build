"use client";

import { useState, useMemo, useEffect } from "react";
import { motion } from "framer-motion";
import PageTemplate from "@/components/PageTemplate";
import Tooltip from "@/components/Tooltip";
import Modal from "@/components/Modal";
import {
  generateOperationalMetrics,
  generateInventoryStock,
  generateSalesOrders,
  generatePurchaseOrders,
  generatePickingTasks,
} from "@/utils/mockDataGenerators";
import { format as formatDate, subDays, startOfDay, endOfDay } from "date-fns";
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

interface OperationalMetric {
  id: string;
  date: string;
  warehouse: string;
  shift: string;
  receiptsProcessed: number;
  issuesProcessed: number;
  putawaysCompleted: number;
  picksCompleted: number;
  totalTransactions: number;
  avgReceiptTime: number;
  avgIssueTime: number;
  avgPutawayTime: number;
  avgPickTime: number;
  onTimeReceiptRate: number;
  onTimeIssueRate: number;
  putawayAccuracy: number;
  pickingAccuracy: number;
  laborUtilization: number;
  equipmentUtilization: number;
  spaceUtilization: number;
  damageRate: number;
  errorRate: number;
  reworkRate: number;
  overallScore: number;
  createdAt: Date | string;
}

export default function OperationalReports() {
  const [metrics, setMetrics] = useState<OperationalMetric[]>(() =>
    generateOperationalMetrics(30),
  );
  const [dateRange, setDateRange] = useState<"7d" | "30d" | "90d" | "custom">(
    "30d",
  );
  const [selectedWarehouse, setSelectedWarehouse] = useState<string>("ALL");
  const [selectedShift, setSelectedShift] = useState<string>("ALL");
  const [viewMode, setViewMode] = useState<
    "dashboard" | "throughput" | "performance" | "quality" | "utilization"
  >("dashboard");
  const [showExportModal, setShowExportModal] = useState(false);
  const [drillDownData, setDrillDownData] = useState<any>(null);
  const [showDrillDown, setShowDrillDown] = useState(false);
  const [realTimeEnabled, setRealTimeEnabled] = useState(true);
  const [realTimeStats, setRealTimeStats] = useState({
    totalTransactions: 0,
    avgOverallScore: 0,
    avgOnTimeReceipt: 0,
    avgPickingAccuracy: 0,
  });

  const filteredMetrics = useMemo(() => {
    let filtered = [...metrics];

    // Date range filter
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
    filtered = filtered.filter((m) => new Date(m.date) >= startDate);

    // Warehouse filter
    if (selectedWarehouse !== "ALL") {
      filtered = filtered.filter((m) => m.warehouse === selectedWarehouse);
    }

    // Shift filter
    if (selectedShift !== "ALL") {
      filtered = filtered.filter((m) => m.shift === selectedShift);
    }

    return filtered.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
    );
  }, [metrics, dateRange, selectedWarehouse, selectedShift]);

  // Aggregate metrics
  const aggregatedMetrics = useMemo(() => {
    if (filteredMetrics.length === 0) return null;

    return {
      totalReceipts: filteredMetrics.reduce(
        (sum, m) => sum + m.receiptsProcessed,
        0,
      ),
      totalIssues: filteredMetrics.reduce(
        (sum, m) => sum + m.issuesProcessed,
        0,
      ),
      totalPutaways: filteredMetrics.reduce(
        (sum, m) => sum + m.putawaysCompleted,
        0,
      ),
      totalPicks: filteredMetrics.reduce((sum, m) => sum + m.picksCompleted, 0),
      avgReceiptTime:
        filteredMetrics.reduce((sum, m) => sum + m.avgReceiptTime, 0) /
        filteredMetrics.length,
      avgIssueTime:
        filteredMetrics.reduce((sum, m) => sum + m.avgIssueTime, 0) /
        filteredMetrics.length,
      avgPutawayTime:
        filteredMetrics.reduce((sum, m) => sum + m.avgPutawayTime, 0) /
        filteredMetrics.length,
      avgPickTime:
        filteredMetrics.reduce((sum, m) => sum + m.avgPickTime, 0) /
        filteredMetrics.length,
      avgOnTimeReceipt:
        filteredMetrics.reduce((sum, m) => sum + m.onTimeReceiptRate, 0) /
        filteredMetrics.length,
      avgOnTimeIssue:
        filteredMetrics.reduce((sum, m) => sum + m.onTimeIssueRate, 0) /
        filteredMetrics.length,
      avgPutawayAccuracy:
        filteredMetrics.reduce((sum, m) => sum + m.putawayAccuracy, 0) /
        filteredMetrics.length,
      avgPickingAccuracy:
        filteredMetrics.reduce((sum, m) => sum + m.pickingAccuracy, 0) /
        filteredMetrics.length,
      avgLaborUtilization:
        filteredMetrics.reduce((sum, m) => sum + m.laborUtilization, 0) /
        filteredMetrics.length,
      avgEquipmentUtilization:
        filteredMetrics.reduce((sum, m) => sum + m.equipmentUtilization, 0) /
        filteredMetrics.length,
      avgSpaceUtilization:
        filteredMetrics.reduce((sum, m) => sum + m.spaceUtilization, 0) /
        filteredMetrics.length,
      avgDamageRate:
        filteredMetrics.reduce((sum, m) => sum + m.damageRate, 0) /
        filteredMetrics.length,
      avgErrorRate:
        filteredMetrics.reduce((sum, m) => sum + m.errorRate, 0) /
        filteredMetrics.length,
      avgReworkRate:
        filteredMetrics.reduce((sum, m) => sum + m.reworkRate, 0) /
        filteredMetrics.length,
      avgOverallScore:
        filteredMetrics.reduce((sum, m) => sum + m.overallScore, 0) /
        filteredMetrics.length,
    };
  }, [filteredMetrics]);

  // Throughput trend data
  const throughputTrend = useMemo(() => {
    const dailyData: Record<
      string,
      {
        date: string;
        receipts: number;
        issues: number;
        putaways: number;
        picks: number;
      }
    > = {};

    filteredMetrics.forEach((m) => {
      if (!dailyData[m.date]) {
        dailyData[m.date] = {
          date: m.date,
          receipts: 0,
          issues: 0,
          putaways: 0,
          picks: 0,
        };
      }
      dailyData[m.date].receipts += m.receiptsProcessed;
      dailyData[m.date].issues += m.issuesProcessed;
      dailyData[m.date].putaways += m.putawaysCompleted;
      dailyData[m.date].picks += m.picksCompleted;
    });

    return Object.values(dailyData).sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
    );
  }, [filteredMetrics]);

  // Performance trend data
  const performanceTrend = useMemo(() => {
    const dailyData: Record<
      string,
      {
        date: string;
        receiptTime: number;
        issueTime: number;
        putawayTime: number;
        pickTime: number;
        count: number;
      }
    > = {};

    filteredMetrics.forEach((m) => {
      if (!dailyData[m.date]) {
        dailyData[m.date] = {
          date: m.date,
          receiptTime: 0,
          issueTime: 0,
          putawayTime: 0,
          pickTime: 0,
          count: 0,
        };
      }
      dailyData[m.date].receiptTime += m.avgReceiptTime;
      dailyData[m.date].issueTime += m.avgIssueTime;
      dailyData[m.date].putawayTime += m.avgPutawayTime;
      dailyData[m.date].pickTime += m.avgPickTime;
      dailyData[m.date].count++;
    });

    return Object.values(dailyData)
      .map((d) => ({
        date: formatDate(new Date(d.date), "MMM dd"),
        receiptTime: d.receiptTime / d.count,
        issueTime: d.issueTime / d.count,
        putawayTime: d.putawayTime / d.count,
        pickTime: d.pickTime / d.count,
      }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [filteredMetrics]);

  // Warehouse comparison
  const warehouseComparison = useMemo(() => {
    const warehouseData: Record<
      string,
      {
        warehouse: string;
        receipts: number;
        issues: number;
        putaways: number;
        picks: number;
        score: number;
        count: number;
      }
    > = {};

    filteredMetrics.forEach((m) => {
      if (!warehouseData[m.warehouse]) {
        warehouseData[m.warehouse] = {
          warehouse: m.warehouse,
          receipts: 0,
          issues: 0,
          putaways: 0,
          picks: 0,
          score: 0,
          count: 0,
        };
      }
      warehouseData[m.warehouse].receipts += m.receiptsProcessed;
      warehouseData[m.warehouse].issues += m.issuesProcessed;
      warehouseData[m.warehouse].putaways += m.putawaysCompleted;
      warehouseData[m.warehouse].picks += m.picksCompleted;
      warehouseData[m.warehouse].score += m.overallScore;
      warehouseData[m.warehouse].count++;
    });

    return Object.values(warehouseData).map((w) => ({
      warehouse: w.warehouse,
      receipts: w.receipts,
      issues: w.issues,
      putaways: w.putaways,
      picks: w.picks,
      avgScore: w.score / w.count,
    }));
  }, [filteredMetrics]);

  // Shift comparison
  const shiftComparison = useMemo(() => {
    const shiftData: Record<
      string,
      { shift: string; transactions: number; score: number; count: number }
    > = {};

    filteredMetrics.forEach((m) => {
      if (!shiftData[m.shift]) {
        shiftData[m.shift] = {
          shift: m.shift,
          transactions: 0,
          score: 0,
          count: 0,
        };
      }
      shiftData[m.shift].transactions += m.totalTransactions;
      shiftData[m.shift].score += m.overallScore;
      shiftData[m.shift].count++;
    });

    return Object.values(shiftData).map((s) => ({
      shift: s.shift.replace(/_/g, " "),
      transactions: s.transactions,
      avgScore: s.score / s.count,
    }));
  }, [filteredMetrics]);

  const stats = aggregatedMetrics
    ? [
        {
          label: "Total Transactions",
          value: realTimeEnabled
            ? realTimeStats.totalTransactions.toLocaleString()
            : (
                aggregatedMetrics.totalReceipts +
                aggregatedMetrics.totalIssues +
                aggregatedMetrics.totalPutaways +
                aggregatedMetrics.totalPicks
              ).toLocaleString(),
          icon: "ri-file-list-line",
          tooltip: "Total warehouse transactions",
          trend: "up" as const,
        },
        {
          label: "Avg Overall Score",
          value: realTimeEnabled
            ? realTimeStats.avgOverallScore.toFixed(1)
            : aggregatedMetrics.avgOverallScore.toFixed(1),
          icon: "ri-star-line",
          tooltip: "Average operational performance score",
          trend: "up" as const,
        },
        {
          label: "On-Time Receipt",
          value: realTimeEnabled
            ? `${realTimeStats.avgOnTimeReceipt.toFixed(1)}%`
            : `${aggregatedMetrics.avgOnTimeReceipt.toFixed(1)}%`,
          icon: "ri-time-line",
          tooltip: "Average on-time receipt rate",
          trend: "up" as const,
        },
        {
          label: "Picking Accuracy",
          value: realTimeEnabled
            ? `${realTimeStats.avgPickingAccuracy.toFixed(1)}%`
            : `${aggregatedMetrics.avgPickingAccuracy.toFixed(1)}%`,
          icon: "ri-checkbox-circle-line",
          tooltip: "Average picking accuracy",
          trend: "up" as const,
        },
      ]
    : [];

  const handleDrillDown = (type: string, data: any) => {
    setDrillDownData({ type, data });
    setShowDrillDown(true);
  };

  // Real-time updates
  useEffect(() => {
    if (!realTimeEnabled || !aggregatedMetrics) return;

    const unsubscribe = realtimeSimulator.subscribe(
      "operational-report-stats",
      (data: typeof realTimeStats) => {
        setRealTimeStats(data);
      },
    );

    const stop = realtimeSimulator.start(
      "operational-report-stats",
      () => ({
        totalTransactions: simulateKPIUpdates(
          aggregatedMetrics.totalReceipts +
            aggregatedMetrics.totalIssues +
            aggregatedMetrics.totalPutaways +
            aggregatedMetrics.totalPicks,
          0.05,
        ),
        avgOverallScore: simulateKPIUpdates(
          aggregatedMetrics.avgOverallScore,
          0.02,
        ),
        avgOnTimeReceipt: simulateKPIUpdates(
          aggregatedMetrics.avgOnTimeReceipt,
          0.02,
        ),
        avgPickingAccuracy: simulateKPIUpdates(
          aggregatedMetrics.avgPickingAccuracy,
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
  }, [realTimeEnabled, aggregatedMetrics]);

  // Simulate real-time metric updates
  useEffect(() => {
    if (!realTimeEnabled) return;

    const interval = setInterval(() => {
      setMetrics((prev) => {
        const newMetric = generateOperationalMetrics(1)[0];
        return [newMetric, ...prev.slice(0, 29)];
      });
    }, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, [realTimeEnabled]);

  const handleExport = (exportFormat: "pdf" | "excel" | "csv") => {
    // Export functionality
    const data = filteredMetrics.map((m) => ({
      Date: formatDate(new Date(m.date), "yyyy-MM-dd"),
      Warehouse: m.warehouse,
      Shift: m.shift,
      "Receipts Processed": m.receiptsProcessed,
      "Issues Processed": m.issuesProcessed,
      "Putaways Completed": m.putawaysCompleted,
      "Picks Completed": m.picksCompleted,
      "Total Transactions": m.totalTransactions,
      "Avg Receipt Time": m.avgReceiptTime,
      "Avg Issue Time": m.avgIssueTime,
      "On-Time Receipt Rate": m.onTimeReceiptRate,
      "On-Time Issue Rate": m.onTimeIssueRate,
      "Putaway Accuracy": m.putawayAccuracy,
      "Picking Accuracy": m.pickingAccuracy,
      "Overall Score": m.overallScore,
    }));

    if (exportFormat === "csv") {
      const headers = Object.keys(data[0] || {});
      const csvContent = [
        headers.join(","),
        ...data.map((row) =>
          headers.map((header) => row[header as keyof typeof row]).join(","),
        ),
      ].join("\n");

      const blob = new Blob([csvContent], { type: "text/csv" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `operational-report-${formatDate(new Date(), "yyyy-MM-dd")}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
    } else if (exportFormat === "excel") {
      // Excel export would require a library like xlsx
      alert("Excel export requires xlsx library. CSV export available.");
    } else if (exportFormat === "pdf") {
      // PDF export would require a library like jsPDF or pdfmake
      alert("PDF export requires jsPDF library. CSV export available.");
    }

    setShowExportModal(false);
  };

  return (
    <PageTemplate
      title="Operational Reports"
      description="Real-time operational dashboards with drill-down capabilities, performance metrics, and export functionality"
      icon="ri-file-chart-2-line"
      systemInfo={{
        sap: "Operational Reports, Warehouse Performance",
        oracle: "Operations Reports, Performance Analytics",
        manhattan: "Operational Reports, Real-Time Dashboards",
      }}
      examples={[
        "Real-time operational dashboards",
        "Throughput and performance metrics",
        "Warehouse and shift comparisons",
        "Quality and efficiency tracking",
        "Drill-down analysis",
        "Export to PDF, Excel, CSV",
      ]}
      stats={stats}
      actions={
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
          <div className="flex items-center gap-1 sm:gap-2 bg-white/5 border border-white/10 rounded-lg p-1 sm:p-2">
            {(
              [
                "dashboard",
                "throughput",
                "performance",
                "quality",
                "utilization",
              ] as const
            ).map((mode) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`p-1.5 sm:p-2 rounded transition-colors ${
                  viewMode === mode
                    ? "bg-cyan-500/20 text-cyan-400"
                    : "text-[#9ca3af] hover:text-white"
                }`}
                title={mode.charAt(0).toUpperCase() + mode.slice(1)}
              >
                <i
                  className={`ri-${mode === "dashboard" ? "dashboard-line" : mode === "throughput" ? "speed-line" : mode === "performance" ? "line-chart-line" : mode === "quality" ? "shield-check-line" : "bar-chart-box-line"} text-sm sm:text-base`}
                ></i>
              </button>
            ))}
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
          <button
            onClick={() => setShowExportModal(true)}
            className="bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg text-xs sm:text-sm font-medium transition-colors flex items-center justify-center gap-2 shadow-lg shadow-purple-500/20 whitespace-nowrap"
          >
            <i className="ri-download-line"></i>
            <span className="hidden sm:inline">Export</span>
            <span className="sm:hidden">Export</span>
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
        <select
          value={selectedWarehouse}
          onChange={(e) => setSelectedWarehouse(e.target.value)}
          className="bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 min-w-[150px]"
        >
          <option value="ALL">All Warehouses</option>
          {Array.from(new Set(metrics.map((m) => m.warehouse))).map((wh) => (
            <option key={wh} value={wh}>
              {wh}
            </option>
          ))}
        </select>
        <select
          value={selectedShift}
          onChange={(e) => setSelectedShift(e.target.value)}
          className="bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 min-w-[150px]"
        >
          <option value="ALL">All Shifts</option>
          <option value="MORNING">Morning</option>
          <option value="AFTERNOON">Afternoon</option>
          <option value="NIGHT">Night</option>
        </select>
      </div>

      {/* Dashboard View */}
      {viewMode === "dashboard" && aggregatedMetrics && (
        <div className="space-y-6">
          {/* Key Metrics Cards */}
          <div className="grid md:grid-cols-4 gap-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 cursor-pointer hover:border-cyan-500/50 transition-all"
              onClick={() =>
                handleDrillDown("throughput", {
                  type: "receipts",
                  data: filteredMetrics,
                })
              }
            >
              <div className="flex items-center justify-between mb-4">
                <div className="text-3xl font-bold text-white">
                  {aggregatedMetrics.totalReceipts.toLocaleString()}
                </div>
                <div className="w-12 h-12 rounded-lg bg-cyan-500/20 flex items-center justify-center">
                  <i className="ri-inbox-line text-2xl text-cyan-400"></i>
                </div>
              </div>
              <div className="text-sm text-[#9ca3af]">Receipts Processed</div>
              <div className="text-xs text-cyan-400 mt-2">
                Click to drill down
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 cursor-pointer hover:border-cyan-500/50 transition-all"
              onClick={() =>
                handleDrillDown("throughput", {
                  type: "issues",
                  data: filteredMetrics,
                })
              }
            >
              <div className="flex items-center justify-between mb-4">
                <div className="text-3xl font-bold text-white">
                  {aggregatedMetrics.totalIssues.toLocaleString()}
                </div>
                <div className="w-12 h-12 rounded-lg bg-blue-500/20 flex items-center justify-center">
                  <i className="ri-send-plane-line text-2xl text-blue-400"></i>
                </div>
              </div>
              <div className="text-sm text-[#9ca3af]">Issues Processed</div>
              <div className="text-xs text-cyan-400 mt-2">
                Click to drill down
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 cursor-pointer hover:border-cyan-500/50 transition-all"
              onClick={() =>
                handleDrillDown("throughput", {
                  type: "putaways",
                  data: filteredMetrics,
                })
              }
            >
              <div className="flex items-center justify-between mb-4">
                <div className="text-3xl font-bold text-white">
                  {aggregatedMetrics.totalPutaways.toLocaleString()}
                </div>
                <div className="w-12 h-12 rounded-lg bg-green-500/20 flex items-center justify-center">
                  <i className="ri-stack-line text-2xl text-green-400"></i>
                </div>
              </div>
              <div className="text-sm text-[#9ca3af]">Putaways Completed</div>
              <div className="text-xs text-cyan-400 mt-2">
                Click to drill down
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 cursor-pointer hover:border-cyan-500/50 transition-all"
              onClick={() =>
                handleDrillDown("throughput", {
                  type: "picks",
                  data: filteredMetrics,
                })
              }
            >
              <div className="flex items-center justify-between mb-4">
                <div className="text-3xl font-bold text-white">
                  {aggregatedMetrics.totalPicks.toLocaleString()}
                </div>
                <div className="w-12 h-12 rounded-lg bg-purple-500/20 flex items-center justify-center">
                  <i className="ri-handbag-line text-2xl text-purple-400"></i>
                </div>
              </div>
              <div className="text-sm text-[#9ca3af]">Picks Completed</div>
              <div className="text-xs text-cyan-400 mt-2">
                Click to drill down
              </div>
            </motion.div>
          </div>

          {/* Throughput Trend */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">
                Throughput Trend
              </h3>
              <button
                onClick={() =>
                  handleDrillDown("chart", {
                    type: "throughput",
                    data: throughputTrend,
                  })
                }
                className="text-xs text-cyan-400 hover:text-cyan-300 transition-colors"
              >
                Drill Down
              </button>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={throughputTrend}>
                <defs>
                  <linearGradient
                    id="colorReceipts"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorIssues" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient
                    id="colorPutaways"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorPicks" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
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
                  dataKey="receipts"
                  stackId="1"
                  stroke="#06b6d4"
                  fill="url(#colorReceipts)"
                  name="Receipts"
                />
                <Area
                  type="monotone"
                  dataKey="issues"
                  stackId="1"
                  stroke="#3b82f6"
                  fill="url(#colorIssues)"
                  name="Issues"
                />
                <Area
                  type="monotone"
                  dataKey="putaways"
                  stackId="1"
                  stroke="#10b981"
                  fill="url(#colorPutaways)"
                  name="Putaways"
                />
                <Area
                  type="monotone"
                  dataKey="picks"
                  stackId="1"
                  stroke="#8b5cf6"
                  fill="url(#colorPicks)"
                  name="Picks"
                />
                <Legend />
              </AreaChart>
            </ResponsiveContainer>
          </motion.div>

          {/* Warehouse Comparison */}
          <div className="grid md:grid-cols-2 gap-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">
                  Warehouse Comparison
                </h3>
                <button
                  onClick={() =>
                    handleDrillDown("comparison", {
                      type: "warehouse",
                      data: warehouseComparison,
                    })
                  }
                  className="text-xs text-cyan-400 hover:text-cyan-300 transition-colors"
                >
                  Drill Down
                </button>
              </div>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={warehouseComparison}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="warehouse" stroke="#9ca3af" fontSize={12} />
                  <YAxis stroke="#9ca3af" fontSize={12} />
                  <RechartsTooltip
                    contentStyle={{
                      backgroundColor: "#1f2937",
                      border: "1px solid #374151",
                      borderRadius: "8px",
                    }}
                    labelStyle={{ color: "#fff" }}
                  />
                  <Bar dataKey="receipts" fill="#06b6d4" name="Receipts" />
                  <Bar dataKey="issues" fill="#3b82f6" name="Issues" />
                  <Bar dataKey="putaways" fill="#10b981" name="Putaways" />
                  <Bar dataKey="picks" fill="#8b5cf6" name="Picks" />
                  <Legend />
                </BarChart>
              </ResponsiveContainer>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">
                  Shift Performance
                </h3>
                <button
                  onClick={() =>
                    handleDrillDown("comparison", {
                      type: "shift",
                      data: shiftComparison,
                    })
                  }
                  className="text-xs text-cyan-400 hover:text-cyan-300 transition-colors"
                >
                  Drill Down
                </button>
              </div>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={shiftComparison}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ shift, transactions }) =>
                      `${shift}: ${transactions.toLocaleString()}`
                    }
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="transactions"
                  >
                    {shiftComparison.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={["#06b6d4", "#3b82f6", "#8b5cf6"][index % 3]}
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

      {/* Throughput View */}
      {viewMode === "throughput" && (
        <div className="space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
          >
            <h3 className="text-lg font-semibold text-white mb-4">
              Daily Throughput Trend
            </h3>
            <ResponsiveContainer width="100%" height={400}>
              <ComposedChart data={throughputTrend}>
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
                <Bar dataKey="receipts" fill="#06b6d4" name="Receipts" />
                <Bar dataKey="issues" fill="#3b82f6" name="Issues" />
                <Bar dataKey="putaways" fill="#10b981" name="Putaways" />
                <Bar dataKey="picks" fill="#8b5cf6" name="Picks" />
                <Line
                  type="monotone"
                  dataKey="receipts"
                  stroke="#06b6d4"
                  strokeWidth={2}
                />
                <Line
                  type="monotone"
                  dataKey="issues"
                  stroke="#3b82f6"
                  strokeWidth={2}
                />
                <Line
                  type="monotone"
                  dataKey="putaways"
                  stroke="#10b981"
                  strokeWidth={2}
                />
                <Line
                  type="monotone"
                  dataKey="picks"
                  stroke="#8b5cf6"
                  strokeWidth={2}
                />
                <Legend />
              </ComposedChart>
            </ResponsiveContainer>
          </motion.div>
        </div>
      )}

      {/* Performance View */}
      {viewMode === "performance" && aggregatedMetrics && (
        <div className="space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
          >
            <h3 className="text-lg font-semibold text-white mb-4">
              Average Processing Times
            </h3>
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={performanceTrend}>
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
                <Line
                  type="monotone"
                  dataKey="receiptTime"
                  stroke="#06b6d4"
                  strokeWidth={2}
                  name="Receipt Time (min)"
                />
                <Line
                  type="monotone"
                  dataKey="issueTime"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  name="Issue Time (min)"
                />
                <Line
                  type="monotone"
                  dataKey="putawayTime"
                  stroke="#10b981"
                  strokeWidth={2}
                  name="Putaway Time (min)"
                />
                <Line
                  type="monotone"
                  dataKey="pickTime"
                  stroke="#8b5cf6"
                  strokeWidth={2}
                  name="Pick Time (min)"
                />
                <Legend />
              </LineChart>
            </ResponsiveContainer>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
            >
              <h3 className="text-lg font-semibold text-white mb-4">
                On-Time Performance
              </h3>
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-[#9ca3af]">
                      Receipt On-Time Rate
                    </span>
                    <span className="text-sm text-white font-medium">
                      {aggregatedMetrics.avgOnTimeReceipt.toFixed(1)}%
                    </span>
                  </div>
                  <div className="w-full h-2 bg-white/10 rounded-full">
                    <div
                      className="h-full bg-cyan-500 rounded-full"
                      style={{
                        width: `${aggregatedMetrics.avgOnTimeReceipt}%`,
                      }}
                    />
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-[#9ca3af]">
                      Issue On-Time Rate
                    </span>
                    <span className="text-sm text-white font-medium">
                      {aggregatedMetrics.avgOnTimeIssue.toFixed(1)}%
                    </span>
                  </div>
                  <div className="w-full h-2 bg-white/10 rounded-full">
                    <div
                      className="h-full bg-blue-500 rounded-full"
                      style={{ width: `${aggregatedMetrics.avgOnTimeIssue}%` }}
                    />
                  </div>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
            >
              <h3 className="text-lg font-semibold text-white mb-4">
                Accuracy Metrics
              </h3>
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-[#9ca3af]">
                      Putaway Accuracy
                    </span>
                    <span className="text-sm text-white font-medium">
                      {aggregatedMetrics.avgPutawayAccuracy.toFixed(1)}%
                    </span>
                  </div>
                  <div className="w-full h-2 bg-white/10 rounded-full">
                    <div
                      className="h-full bg-green-500 rounded-full"
                      style={{
                        width: `${aggregatedMetrics.avgPutawayAccuracy}%`,
                      }}
                    />
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-[#9ca3af]">
                      Picking Accuracy
                    </span>
                    <span className="text-sm text-white font-medium">
                      {aggregatedMetrics.avgPickingAccuracy.toFixed(1)}%
                    </span>
                  </div>
                  <div className="w-full h-2 bg-white/10 rounded-full">
                    <div
                      className="h-full bg-purple-500 rounded-full"
                      style={{
                        width: `${aggregatedMetrics.avgPickingAccuracy}%`,
                      }}
                    />
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      )}

      {/* Quality View */}
      {viewMode === "quality" && aggregatedMetrics && (
        <div className="space-y-6">
          <div className="grid md:grid-cols-3 gap-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
            >
              <div className="text-3xl font-bold text-white mb-2">
                {aggregatedMetrics.avgDamageRate.toFixed(2)}%
              </div>
              <div className="text-sm text-[#9ca3af]">Average Damage Rate</div>
              <div
                className={`text-xs mt-2 ${aggregatedMetrics.avgDamageRate < 1 ? "text-green-400" : aggregatedMetrics.avgDamageRate < 2 ? "text-yellow-400" : "text-red-400"}`}
              >
                {aggregatedMetrics.avgDamageRate < 1
                  ? "Excellent"
                  : aggregatedMetrics.avgDamageRate < 2
                    ? "Good"
                    : "Needs Improvement"}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
            >
              <div className="text-3xl font-bold text-white mb-2">
                {aggregatedMetrics.avgErrorRate.toFixed(2)}%
              </div>
              <div className="text-sm text-[#9ca3af]">Average Error Rate</div>
              <div
                className={`text-xs mt-2 ${aggregatedMetrics.avgErrorRate < 1 ? "text-green-400" : aggregatedMetrics.avgErrorRate < 2 ? "text-yellow-400" : "text-red-400"}`}
              >
                {aggregatedMetrics.avgErrorRate < 1
                  ? "Excellent"
                  : aggregatedMetrics.avgErrorRate < 2
                    ? "Good"
                    : "Needs Improvement"}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
            >
              <div className="text-3xl font-bold text-white mb-2">
                {aggregatedMetrics.avgReworkRate.toFixed(2)}%
              </div>
              <div className="text-sm text-[#9ca3af]">Average Rework Rate</div>
              <div
                className={`text-xs mt-2 ${aggregatedMetrics.avgReworkRate < 0.5 ? "text-green-400" : aggregatedMetrics.avgReworkRate < 1 ? "text-yellow-400" : "text-red-400"}`}
              >
                {aggregatedMetrics.avgReworkRate < 0.5
                  ? "Excellent"
                  : aggregatedMetrics.avgReworkRate < 1
                    ? "Good"
                    : "Needs Improvement"}
              </div>
            </motion.div>
          </div>
        </div>
      )}

      {/* Utilization View */}
      {viewMode === "utilization" && aggregatedMetrics && (
        <div className="space-y-6">
          <div className="grid md:grid-cols-3 gap-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
            >
              <h3 className="text-lg font-semibold text-white mb-4">
                Labor Utilization
              </h3>
              <div className="text-4xl font-bold text-white mb-2">
                {aggregatedMetrics.avgLaborUtilization.toFixed(1)}%
              </div>
              <div className="w-full h-3 bg-white/10 rounded-full mt-4">
                <div
                  className="h-full bg-cyan-500 rounded-full"
                  style={{ width: `${aggregatedMetrics.avgLaborUtilization}%` }}
                />
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
            >
              <h3 className="text-lg font-semibold text-white mb-4">
                Equipment Utilization
              </h3>
              <div className="text-4xl font-bold text-white mb-2">
                {aggregatedMetrics.avgEquipmentUtilization.toFixed(1)}%
              </div>
              <div className="w-full h-3 bg-white/10 rounded-full mt-4">
                <div
                  className="h-full bg-blue-500 rounded-full"
                  style={{
                    width: `${aggregatedMetrics.avgEquipmentUtilization}%`,
                  }}
                />
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
            >
              <h3 className="text-lg font-semibold text-white mb-4">
                Space Utilization
              </h3>
              <div className="text-4xl font-bold text-white mb-2">
                {aggregatedMetrics.avgSpaceUtilization.toFixed(1)}%
              </div>
              <div className="w-full h-3 bg-white/10 rounded-full mt-4">
                <div
                  className="h-full bg-green-500 rounded-full"
                  style={{ width: `${aggregatedMetrics.avgSpaceUtilization}%` }}
                />
              </div>
            </motion.div>
          </div>
        </div>
      )}

      {/* Export Modal */}
      <Modal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        title="Export Report"
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

      {/* Drill-Down Modal */}
      <Modal
        isOpen={showDrillDown}
        onClose={() => {
          setShowDrillDown(false);
          setDrillDownData(null);
        }}
        title={`Drill-Down Analysis - ${drillDownData?.type || ""}`}
        size="lg"
      >
        {drillDownData && (
          <div className="space-y-4">
            <div className="text-sm text-white bg-white/5 p-4 rounded-lg">
              <pre className="text-xs overflow-auto max-h-96">
                {JSON.stringify(drillDownData.data, null, 2)}
              </pre>
            </div>
          </div>
        )}
      </Modal>
    </PageTemplate>
  );
}
