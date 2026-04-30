"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import PageTemplate from "@/components/PageTemplate";
import Tooltip from "@/components/Tooltip";
import Modal from "@/components/Modal";
import {
  generateOperationalMetrics,
  generateSalesOrders,
  generatePurchaseOrders,
  generateCarriers,
  generatePickingTasks,
} from "@/utils/mockDataGenerators";
import { format, subDays } from "date-fns";
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

interface KPIMetric {
  id: string;
  name: string;
  category: string;
  currentValue: number;
  targetValue: number;
  unit: string;
  trend: "up" | "down" | "neutral";
  status: "on_target" | "at_risk" | "below_target";
  lastUpdated: Date | string;
}

export default function PerformanceReports() {
  const router = useRouter();
  const [dateRange, setDateRange] = useState<"7d" | "30d" | "90d" | "custom">(
    "30d",
  );
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [viewMode, setViewMode] = useState<
    "overview" | "kpi" | "benchmark" | "trends"
  >("overview");
  const [showExportModal, setShowExportModal] = useState(false);

  // Generate KPI metrics from operational data
  const kpiMetrics = useMemo(() => {
    const operationalMetrics = generateOperationalMetrics(30);
    const salesOrders = generateSalesOrders(50);
    const purchaseOrders = generatePurchaseOrders(50);
    const carriers = generateCarriers(20);
    const pickingTasks = generatePickingTasks(100);

    const kpis: KPIMetric[] = [
      {
        id: "kpi-1",
        name: "On-Time Receipt Rate",
        category: "Warehouse Operations",
        currentValue:
          operationalMetrics.reduce((sum, m) => sum + m.onTimeReceiptRate, 0) /
          operationalMetrics.length,
        targetValue: 95,
        unit: "%",
        trend: "up",
        status: "on_target",
        lastUpdated: new Date(),
      },
      {
        id: "kpi-2",
        name: "Picking Accuracy",
        category: "Warehouse Operations",
        currentValue:
          operationalMetrics.reduce((sum, m) => sum + m.pickingAccuracy, 0) /
          operationalMetrics.length,
        targetValue: 99,
        unit: "%",
        trend: "up",
        status: "on_target",
        lastUpdated: new Date(),
      },
      {
        id: "kpi-3",
        name: "Order Fulfillment Rate",
        category: "Order Management",
        currentValue:
          (salesOrders.filter(
            (o) => o.status === "COMPLETED" || o.status === "DELIVERED",
          ).length /
            salesOrders.length) *
          100,
        targetValue: 98,
        unit: "%",
        trend: "up",
        status: "on_target",
        lastUpdated: new Date(),
      },
      {
        id: "kpi-4",
        name: "On-Time Delivery",
        category: "Order Management",
        currentValue: 92.5,
        targetValue: 95,
        unit: "%",
        trend: "up",
        status: "at_risk",
        lastUpdated: new Date(),
      },
      {
        id: "kpi-5",
        name: "Average Pick Time",
        category: "Warehouse Operations",
        currentValue:
          operationalMetrics.reduce((sum, m) => sum + m.avgPickTime, 0) /
          operationalMetrics.length,
        targetValue: 15,
        unit: "min",
        trend: "down",
        status: "on_target",
        lastUpdated: new Date(),
      },
      {
        id: "kpi-6",
        name: "Labor Utilization",
        category: "Resource Management",
        currentValue:
          operationalMetrics.reduce((sum, m) => sum + m.laborUtilization, 0) /
          operationalMetrics.length,
        targetValue: 85,
        unit: "%",
        trend: "up",
        status: "on_target",
        lastUpdated: new Date(),
      },
      {
        id: "kpi-7",
        name: "Damage Rate",
        category: "Quality",
        currentValue:
          operationalMetrics.reduce((sum, m) => sum + m.damageRate, 0) /
          operationalMetrics.length,
        targetValue: 0.5,
        unit: "%",
        trend: "down",
        status: "at_risk",
        lastUpdated: new Date(),
      },
      {
        id: "kpi-8",
        name: "Carrier On-Time Performance",
        category: "Transportation",
        currentValue:
          carriers.reduce(
            (sum, c) => sum + (c.performance?.onTimeDeliveryRate || 0),
            0,
          ) / carriers.length,
        targetValue: 95,
        unit: "%",
        trend: "up",
        status: "on_target",
        lastUpdated: new Date(),
      },
    ];

    return kpis.map((kpi) => ({
      ...kpi,
      status:
        kpi.currentValue >= kpi.targetValue * 0.95
          ? "on_target"
          : kpi.currentValue >= kpi.targetValue * 0.85
            ? "at_risk"
            : "below_target",
    }));
  }, []);

  const filteredKPIs = useMemo(() => {
    if (selectedCategory === "ALL") return kpiMetrics;
    return kpiMetrics.filter((kpi) => kpi.category === selectedCategory);
  }, [kpiMetrics, selectedCategory]);

  // KPI performance by category
  const categoryPerformance = useMemo(() => {
    const categoryData: Record<
      string,
      {
        category: string;
        kpis: number;
        onTarget: number;
        atRisk: number;
        belowTarget: number;
        avgPerformance: number;
      }
    > = {};

    kpiMetrics.forEach((kpi) => {
      if (!categoryData[kpi.category]) {
        categoryData[kpi.category] = {
          category: kpi.category,
          kpis: 0,
          onTarget: 0,
          atRisk: 0,
          belowTarget: 0,
          avgPerformance: 0,
        };
      }
      categoryData[kpi.category].kpis += 1;
      if (kpi.status === "on_target") categoryData[kpi.category].onTarget += 1;
      else if (kpi.status === "at_risk") categoryData[kpi.category].atRisk += 1;
      else categoryData[kpi.category].belowTarget += 1;
      categoryData[kpi.category].avgPerformance +=
        (kpi.currentValue / kpi.targetValue) * 100;
    });

    return Object.values(categoryData).map((cat) => ({
      ...cat,
      avgPerformance: cat.avgPerformance / cat.kpis,
    }));
  }, [kpiMetrics]);

  // KPI trend data (simulated)
  const kpiTrends = useMemo(() => {
    const days = dateRange === "7d" ? 7 : dateRange === "30d" ? 30 : 90;
    return filteredKPIs.map((kpi) => ({
      name: kpi.name,
      data: Array.from({ length: days }, (_, i) => {
        const date = subDays(new Date(), days - i - 1);
        const variation = (Math.random() - 0.5) * 0.05; // ±2.5% variation
        return {
          date: format(date, "MMM dd"),
          value: kpi.currentValue * (1 + variation),
          target: kpi.targetValue,
        };
      }),
    }));
  }, [filteredKPIs, dateRange]);

  const aggregateStats = useMemo(() => {
    const onTarget = kpiMetrics.filter((k) => k.status === "on_target").length;
    const atRisk = kpiMetrics.filter((k) => k.status === "at_risk").length;
    const belowTarget = kpiMetrics.filter(
      (k) => k.status === "below_target",
    ).length;
    const avgPerformance =
      kpiMetrics.reduce(
        (sum, k) => sum + (k.currentValue / k.targetValue) * 100,
        0,
      ) / kpiMetrics.length;

    return {
      totalKPIs: kpiMetrics.length,
      onTarget,
      atRisk,
      belowTarget,
      avgPerformance,
    };
  }, [kpiMetrics]);

  const stats = [
    {
      label: "Total KPIs",
      value: aggregateStats.totalKPIs,
      icon: "ri-line-chart-line",
      tooltip: "Total KPI metrics tracked",
      trend: "up" as const,
    },
    {
      label: "On Target",
      value: aggregateStats.onTarget,
      icon: "ri-checkbox-circle-line",
      tooltip: "KPIs meeting targets",
      trend: "up" as const,
    },
    {
      label: "At Risk",
      value: aggregateStats.atRisk,
      icon: "ri-alert-line",
      tooltip: "KPIs at risk",
      trend: "neutral" as const,
    },
    {
      label: "Avg Performance",
      value: `${aggregateStats.avgPerformance.toFixed(1)}%`,
      icon: "ri-bar-chart-box-line",
      tooltip: "Average KPI performance vs target",
      trend: "up" as const,
    },
  ];

  const handleExport = (format: "pdf" | "excel" | "csv") => {
    logger.info("Exporting performance report", undefined, {
      module: "reports",
      service: "performance",
      exportFormat: format,
    });
    setShowExportModal(false);
  };

  return (
    <PageTemplate
      title="Performance Reports"
      description="KPI tracking, operational metrics, benchmarking, and performance analytics"
      icon="ri-line-chart-line"
      systemInfo={{
        sap: "Performance Reports, KPI Dashboard",
        oracle: "Performance Analytics, KPI Tracking",
        manhattan: "Performance Reports, Metrics Dashboard",
      }}
      examples={[
        "KPI tracking and monitoring",
        "Performance benchmarking",
        "Category-based analysis",
        "Trend analysis",
        "Target vs actual comparison",
        "Export to PDF, Excel, CSV",
      ]}
      stats={stats}
      actions={
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-lg p-1">
            {(["overview", "kpi", "benchmark", "trends"] as const).map(
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
                    className={`ri-${mode === "overview" ? "dashboard-line" : mode === "kpi" ? "line-chart-line" : mode === "benchmark" ? "bar-chart-box-line" : "trending-up-line"} mr-1`}
                  ></i>
                  {mode.charAt(0).toUpperCase() + mode.slice(1)}
                </button>
              ),
            )}
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
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 min-w-[200px]"
        >
          <option value="ALL">All Categories</option>
          {Array.from(new Set(kpiMetrics.map((k) => k.category))).map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>
      </div>

      {/* Overview View */}
      {viewMode === "overview" && (
        <div className="space-y-6">
          {/* KPI Cards */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {filteredKPIs.map((kpi) => (
              <motion.div
                key={kpi.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className={`bg-white/5 backdrop-blur-xl border rounded-2xl p-6 ${
                  kpi.status === "on_target"
                    ? "border-green-500/30"
                    : kpi.status === "at_risk"
                      ? "border-yellow-500/30"
                      : "border-red-500/30"
                }`}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="text-sm text-[#9ca3af]">{kpi.category}</div>
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                      kpi.status === "on_target"
                        ? "bg-green-500/20"
                        : kpi.status === "at_risk"
                          ? "bg-yellow-500/20"
                          : "bg-red-500/20"
                    }`}
                  >
                    <i
                      className={`ri-${kpi.status === "on_target" ? "check" : kpi.status === "at_risk" ? "alert" : "close"}-line text-lg ${
                        kpi.status === "on_target"
                          ? "text-green-400"
                          : kpi.status === "at_risk"
                            ? "text-yellow-400"
                            : "text-red-400"
                      }`}
                    ></i>
                  </div>
                </div>
                <div className="text-lg font-semibold text-white mb-2">
                  {kpi.name}
                </div>
                <div className="flex items-baseline gap-2 mb-4">
                  <div className="text-3xl font-bold text-white">
                    {kpi.currentValue.toFixed(1)}
                  </div>
                  <div className="text-sm text-[#9ca3af]">{kpi.unit}</div>
                </div>
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="text-[#9ca3af]">
                    Target: {kpi.targetValue}
                    {kpi.unit}
                  </span>
                  <span
                    className={`${kpi.currentValue >= kpi.targetValue ? "text-green-400" : "text-yellow-400"}`}
                  >
                    {((kpi.currentValue / kpi.targetValue) * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="w-full h-2 bg-white/10 rounded-full">
                  <div
                    className={`h-full rounded-full ${
                      kpi.status === "on_target"
                        ? "bg-green-500"
                        : kpi.status === "at_risk"
                          ? "bg-yellow-500"
                          : "bg-red-500"
                    }`}
                    style={{
                      width: `${Math.min(100, (kpi.currentValue / kpi.targetValue) * 100)}%`,
                    }}
                  />
                </div>
              </motion.div>
            ))}
          </div>

          {/* Category Performance */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
          >
            <h3 className="text-lg font-semibold text-white mb-4">
              Performance by Category
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={categoryPerformance}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="category" stroke="#9ca3af" fontSize={12} />
                <YAxis stroke="#9ca3af" fontSize={12} />
                <RechartsTooltip
                  contentStyle={{
                    backgroundColor: "#1f2937",
                    border: "1px solid #374151",
                    borderRadius: "8px",
                  }}
                  labelStyle={{ color: "#fff" }}
                />
                <Bar dataKey="onTarget" fill="#10b981" name="On Target" />
                <Bar dataKey="atRisk" fill="#f59e0b" name="At Risk" />
                <Bar dataKey="belowTarget" fill="#ef4444" name="Below Target" />
                <Legend />
              </BarChart>
            </ResponsiveContainer>
          </motion.div>
        </div>
      )}

      {/* KPI View */}
      {viewMode === "kpi" && (
        <div className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            {filteredKPIs.map((kpi) => (
              <motion.div
                key={kpi.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-white">
                    {kpi.name}
                  </h3>
                  <div
                    className={`px-3 py-1 rounded text-xs font-medium ${
                      kpi.status === "on_target"
                        ? "bg-green-500/20 text-green-400"
                        : kpi.status === "at_risk"
                          ? "bg-yellow-500/20 text-yellow-400"
                          : "bg-red-500/20 text-red-400"
                    }`}
                  >
                    {kpi.status.replace(/_/g, " ").toUpperCase()}
                  </div>
                </div>
                <div className="flex items-baseline gap-2 mb-4">
                  <div className="text-4xl font-bold text-white">
                    {kpi.currentValue.toFixed(1)}
                  </div>
                  <div className="text-lg text-[#9ca3af]">{kpi.unit}</div>
                </div>
                <div className="text-sm text-[#9ca3af] mb-4">
                  Target: {kpi.targetValue}
                  {kpi.unit}
                </div>
                <div className="w-full h-3 bg-white/10 rounded-full">
                  <div
                    className={`h-full rounded-full ${
                      kpi.status === "on_target"
                        ? "bg-green-500"
                        : kpi.status === "at_risk"
                          ? "bg-yellow-500"
                          : "bg-red-500"
                    }`}
                    style={{
                      width: `${Math.min(100, (kpi.currentValue / kpi.targetValue) * 100)}%`,
                    }}
                  />
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Benchmark View */}
      {viewMode === "benchmark" && (
        <div className="space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
          >
            <h3 className="text-lg font-semibold text-white mb-4">
              KPI Benchmarking
            </h3>
            <ResponsiveContainer width="100%" height={400}>
              <ComposedChart data={filteredKPIs}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis
                  dataKey="name"
                  stroke="#9ca3af"
                  fontSize={10}
                  angle={-45}
                  textAnchor="end"
                  height={100}
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
                <Bar
                  dataKey="currentValue"
                  fill="#06b6d4"
                  name="Current Value"
                />
                <Bar dataKey="targetValue" fill="#3b82f6" name="Target Value" />
                <Line
                  type="monotone"
                  dataKey="targetValue"
                  stroke="#ef4444"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  name="Target"
                />
                <Legend />
              </ComposedChart>
            </ResponsiveContainer>
          </motion.div>
        </div>
      )}

      {/* Trends View */}
      {viewMode === "trends" && (
        <div className="space-y-6">
          {kpiTrends.slice(0, 4).map((trend) => (
            <motion.div
              key={trend.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
            >
              <h3 className="text-lg font-semibold text-white mb-4">
                {trend.name}
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={trend.data}>
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
                    dataKey="value"
                    stroke="#06b6d4"
                    strokeWidth={2}
                    name="Current Value"
                  />
                  <Line
                    type="monotone"
                    dataKey="target"
                    stroke="#ef4444"
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    name="Target"
                  />
                  <Legend />
                </LineChart>
              </ResponsiveContainer>
            </motion.div>
          ))}
        </div>
      )}

      {/* Export Modal */}
      <Modal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        title="Export Performance Report"
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
    </PageTemplate>
  );
}
