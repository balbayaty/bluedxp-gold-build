"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import PageTemplate from "@/components/PageTemplate";
import Tooltip from "@/components/Tooltip";
import Modal from "@/components/Modal";
import {
  generateSalesOrders,
  generatePurchaseOrders,
  generateInventoryStock,
  generateCarriers,
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

export default function FinancialReports() {
  const router = useRouter();
  const [salesOrders] = useState(() => generateSalesOrders(100));
  const [purchaseOrders] = useState(() => generatePurchaseOrders(80));
  const [inventoryStock] = useState(() => generateInventoryStock(200));
  const [carriers] = useState(() => generateCarriers(20));
  const [dateRange, setDateRange] = useState<"7d" | "30d" | "90d" | "custom">(
    "30d",
  );
  const [viewMode, setViewMode] = useState<
    "overview" | "revenue" | "costs" | "profitability" | "cashflow"
  >("overview");
  const [showExportModal, setShowExportModal] = useState(false);

  // Financial calculations
  const financialData = useMemo(() => {
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

    const filteredSales = salesOrders.filter(
      (o) => new Date(o.orderDate) >= startDate,
    );
    const filteredPurchases = purchaseOrders.filter(
      (o) => new Date(o.orderDate) >= startDate,
    );

    // Revenue
    const totalRevenue = filteredSales
      .filter((o) => o.status === "COMPLETED" || o.status === "DELIVERED")
      .reduce((sum, o) => sum + o.totalValue, 0);

    // Costs
    const purchaseCosts = filteredPurchases
      .filter((o) => o.status === "COMPLETED" || o.status === "DELIVERED")
      .reduce((sum, o) => sum + o.totalValue, 0);

    const inventoryValue = inventoryStock.reduce(
      (sum, item) => sum + item.valuation,
      0,
    );
    const inventoryCarryingCost = inventoryValue * 0.15; // 15% carrying cost

    const transportationCosts = carriers.reduce((sum, c) => {
      const shipments = Math.floor(Math.random() * 50) + 10;
      const rate =
        (c as any).rates?.standardRate || (c as any).standardRate || 100;
      return sum + shipments * rate;
    }, 0);

    const laborCosts = 50000; // Estimated monthly labor
    const overheadCosts = 20000; // Estimated monthly overhead

    const totalCosts =
      purchaseCosts +
      inventoryCarryingCost +
      transportationCosts +
      laborCosts +
      overheadCosts;

    // Profitability
    const grossProfit = totalRevenue - purchaseCosts;
    const netProfit = totalRevenue - totalCosts;
    const grossMargin =
      totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;
    const netMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

    // Cash flow (simplified)
    const cashInflow = totalRevenue;
    const cashOutflow = totalCosts;
    const netCashFlow = cashInflow - cashOutflow;

    return {
      totalRevenue,
      purchaseCosts,
      inventoryValue,
      inventoryCarryingCost,
      transportationCosts,
      laborCosts,
      overheadCosts,
      totalCosts,
      grossProfit,
      netProfit,
      grossMargin,
      netMargin,
      cashInflow,
      cashOutflow,
      netCashFlow,
    };
  }, [salesOrders, purchaseOrders, inventoryStock, carriers, dateRange]);

  // Revenue trend
  const revenueTrend = useMemo(() => {
    const days = dateRange === "7d" ? 7 : dateRange === "30d" ? 30 : 90;
    const dailyData: Record<
      string,
      { date: string; revenue: number; costs: number; profit: number }
    > = {};

    salesOrders.forEach((order) => {
      if (order.status === "COMPLETED" || order.status === "DELIVERED") {
        const date = format(new Date(order.orderDate), "yyyy-MM-dd");
        if (!dailyData[date]) {
          dailyData[date] = { date, revenue: 0, costs: 0, profit: 0 };
        }
        dailyData[date].revenue += order.totalValue;
      }
    });

    purchaseOrders.forEach((order) => {
      if (order.status === "COMPLETED" || order.status === "DELIVERED") {
        const date = format(new Date(order.orderDate), "yyyy-MM-dd");
        if (!dailyData[date]) {
          dailyData[date] = { date, revenue: 0, costs: 0, profit: 0 };
        }
        dailyData[date].costs += order.totalValue;
      }
    });

    return Object.values(dailyData)
      .map((d) => ({
        ...d,
        profit: d.revenue - d.costs,
      }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .map((d) => ({
        date: format(new Date(d.date), "MMM dd"),
        revenue: d.revenue,
        costs: d.costs,
        profit: d.profit,
      }));
  }, [salesOrders, purchaseOrders, dateRange]);

  // Cost breakdown
  const costBreakdown = useMemo(() => {
    return [
      {
        name: "Purchase Costs",
        value: financialData.purchaseCosts,
        color: "#ef4444",
      },
      {
        name: "Transportation",
        value: financialData.transportationCosts,
        color: "#3b82f6",
      },
      {
        name: "Inventory Carrying",
        value: financialData.inventoryCarryingCost,
        color: "#8b5cf6",
      },
      { name: "Labor", value: financialData.laborCosts, color: "#10b981" },
      {
        name: "Overhead",
        value: financialData.overheadCosts,
        color: "#f59e0b",
      },
    ];
  }, [financialData]);

  const stats: Array<{
    label: string;
    value: number;
    icon: string;
    tooltip: string;
    trend: "up" | "down" | "neutral";
    isCurrency?: boolean;
  }> = [
    {
      label: "Total Revenue",
      value: financialData.totalRevenue,
      icon: "ri-money-dollar-circle-line",
      tooltip: "Total revenue from sales",
      trend: "up",
      isCurrency: true,
    },
    {
      label: "Total Costs",
      value: financialData.totalCosts,
      icon: "ri-file-list-line",
      tooltip: "Total operational costs",
      trend: "neutral",
      isCurrency: true,
    },
    {
      label: "Net Profit",
      value: financialData.netProfit,
      icon: "ri-line-chart-line",
      tooltip: "Net profit (revenue - costs)",
      trend: (financialData.netProfit > 0 ? "up" : "down") as "up" | "down",
      isCurrency: true,
    },
    {
      label: "Net Margin",
      value: financialData.netMargin,
      icon: "ri-percent-line",
      tooltip: "Net profit margin",
      trend: (financialData.netMargin > 0 ? "up" : "down") as "up" | "down",
    },
  ];

  const handleExport = (format: "pdf" | "excel" | "csv") => {
    logger.info("Exporting financial report", undefined, {
      module: "reports",
      service: "financial",
      exportFormat: format,
    });
    setShowExportModal(false);
  };

  return (
    <PageTemplate
      title="Financial Reports"
      description="Cost analysis, revenue tracking, profitability analysis, and cash flow management"
      icon="ri-money-dollar-circle-line"
      systemInfo={{
        sap: "Financial Reports, Cost Analysis",
        oracle: "Financial Analytics, Profitability Reports",
        manhattan: "Financial Reports, Revenue Tracking",
      }}
      examples={[
        "Revenue and cost analysis",
        "Profitability metrics",
        "Cash flow tracking",
        "Cost breakdown by category",
        "Financial trends and forecasting",
        "Export to PDF, Excel, CSV",
      ]}
      stats={stats}
      actions={
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-lg p-1">
            {(
              [
                "overview",
                "revenue",
                "costs",
                "profitability",
                "cashflow",
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
                  className={`ri-${mode === "overview" ? "dashboard-line" : mode === "revenue" ? "money-dollar-circle-line" : mode === "costs" ? "file-list-line" : mode === "profitability" ? "line-chart-line" : "wallet-line"} mr-1`}
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
      </div>

      {/* Overview View */}
      {viewMode === "overview" && (
        <div className="space-y-6">
          {/* Key Financial Metrics */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white/5 backdrop-blur-xl border border-green-500/30 rounded-2xl p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="text-3xl font-bold text-white">
                  ${(financialData.totalRevenue / 1000).toFixed(0)}K
                </div>
                <div className="w-12 h-12 rounded-lg bg-green-500/20 flex items-center justify-center">
                  <i className="ri-money-dollar-circle-line text-2xl text-green-400"></i>
                </div>
              </div>
              <div className="text-sm text-[#9ca3af]">Total Revenue</div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white/5 backdrop-blur-xl border border-red-500/30 rounded-2xl p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="text-3xl font-bold text-white">
                  ${(financialData.totalCosts / 1000).toFixed(0)}K
                </div>
                <div className="w-12 h-12 rounded-lg bg-red-500/20 flex items-center justify-center">
                  <i className="ri-file-list-line text-2xl text-red-400"></i>
                </div>
              </div>
              <div className="text-sm text-[#9ca3af]">Total Costs</div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className={`bg-white/5 backdrop-blur-xl border rounded-2xl p-6 ${
                financialData.netProfit > 0
                  ? "border-green-500/30"
                  : "border-red-500/30"
              }`}
            >
              <div className="flex items-center justify-between mb-4">
                <div
                  className={`text-3xl font-bold ${financialData.netProfit > 0 ? "text-green-400" : "text-red-400"}`}
                >
                  ${(financialData.netProfit / 1000).toFixed(0)}K
                </div>
                <div
                  className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                    financialData.netProfit > 0
                      ? "bg-green-500/20"
                      : "bg-red-500/20"
                  }`}
                >
                  <i
                    className={`ri-line-chart-line text-2xl ${financialData.netProfit > 0 ? "text-green-400" : "text-red-400"}`}
                  ></i>
                </div>
              </div>
              <div className="text-sm text-[#9ca3af]">Net Profit</div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white/5 backdrop-blur-xl border border-cyan-500/30 rounded-2xl p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="text-3xl font-bold text-white">
                  {financialData.netMargin.toFixed(1)}%
                </div>
                <div className="w-12 h-12 rounded-lg bg-cyan-500/20 flex items-center justify-center">
                  <i className="ri-percent-line text-2xl text-cyan-400"></i>
                </div>
              </div>
              <div className="text-sm text-[#9ca3af]">Net Margin</div>
            </motion.div>
          </div>

          {/* Revenue vs Costs Trend */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
          >
            <h3 className="text-lg font-semibold text-white mb-4">
              Revenue vs Costs Trend
            </h3>
            <ResponsiveContainer width="100%" height={400}>
              <ComposedChart data={revenueTrend}>
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
                  formatter={(value: any) => [
                    `$${typeof value === "number" ? value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : value}`,
                    "",
                  ]}
                />
                <Bar dataKey="revenue" fill="#10b981" name="Revenue ($)" />
                <Bar dataKey="costs" fill="#ef4444" name="Costs ($)" />
                <Line
                  type="monotone"
                  dataKey="profit"
                  stroke="#06b6d4"
                  strokeWidth={2}
                  name="Profit ($)"
                />
                <Legend />
              </ComposedChart>
            </ResponsiveContainer>
          </motion.div>

          {/* Cost Breakdown */}
          <div className="grid md:grid-cols-2 gap-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
            >
              <h3 className="text-lg font-semibold text-white mb-4">
                Cost Breakdown
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={costBreakdown}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) =>
                      `${name}: $${(value / 1000).toFixed(0)}K`
                    }
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {costBreakdown.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <RechartsTooltip
                    formatter={(value: any) => [
                      `$${typeof value === "number" ? value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : value}`,
                      "Cost",
                    ]}
                  />
                </PieChart>
              </ResponsiveContainer>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
            >
              <h3 className="text-lg font-semibold text-white mb-4">
                Profitability Metrics
              </h3>
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-[#9ca3af]">Gross Margin</span>
                    <span className="text-sm text-white font-medium">
                      {financialData.grossMargin.toFixed(1)}%
                    </span>
                  </div>
                  <div className="w-full h-2 bg-white/10 rounded-full">
                    <div
                      className="h-full bg-green-500 rounded-full"
                      style={{
                        width: `${Math.min(100, financialData.grossMargin)}%`,
                      }}
                    />
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-[#9ca3af]">Net Margin</span>
                    <span className="text-sm text-white font-medium">
                      {financialData.netMargin.toFixed(1)}%
                    </span>
                  </div>
                  <div className="w-full h-2 bg-white/10 rounded-full">
                    <div
                      className={`h-full rounded-full ${financialData.netMargin > 0 ? "bg-cyan-500" : "bg-red-500"}`}
                      style={{
                        width: `${Math.min(100, Math.abs(financialData.netMargin))}%`,
                      }}
                    />
                  </div>
                </div>
                <div className="pt-4 border-t border-white/10">
                  <div className="text-sm text-[#9ca3af] mb-2">
                    Gross Profit
                  </div>
                  <div className="text-2xl font-bold text-white">
                    $
                    {financialData.grossProfit.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-[#9ca3af] mb-2">Net Profit</div>
                  <div
                    className={`text-2xl font-bold ${financialData.netProfit > 0 ? "text-green-400" : "text-red-400"}`}
                  >
                    $
                    {financialData.netProfit.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      )}

      {/* Revenue View */}
      {viewMode === "revenue" && (
        <div className="space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
          >
            <h3 className="text-lg font-semibold text-white mb-4">
              Revenue Trend
            </h3>
            <ResponsiveContainer width="100%" height={400}>
              <AreaChart data={revenueTrend}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
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
                  formatter={(value: any) => [
                    `$${typeof value === "number" ? value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : value}`,
                    "Revenue",
                  ]}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#10b981"
                  fill="url(#colorRevenue)"
                  name="Revenue ($)"
                />
                <Legend />
              </AreaChart>
            </ResponsiveContainer>
          </motion.div>
        </div>
      )}

      {/* Costs View */}
      {viewMode === "costs" && (
        <div className="space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
          >
            <h3 className="text-lg font-semibold text-white mb-4">
              Cost Breakdown
            </h3>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={costBreakdown}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="name" stroke="#9ca3af" fontSize={12} />
                <YAxis stroke="#9ca3af" fontSize={12} />
                <RechartsTooltip
                  contentStyle={{
                    backgroundColor: "#1f2937",
                    border: "1px solid #374151",
                    borderRadius: "8px",
                  }}
                  labelStyle={{ color: "#fff" }}
                  formatter={(value: any) => [
                    `$${typeof value === "number" ? value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : value}`,
                    "Cost",
                  ]}
                />
                <Bar dataKey="value" fill="#ef4444" name="Cost ($)">
                  {costBreakdown.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
                <Legend />
              </BarChart>
            </ResponsiveContainer>
          </motion.div>
        </div>
      )}

      {/* Profitability View */}
      {viewMode === "profitability" && (
        <div className="space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
          >
            <h3 className="text-lg font-semibold text-white mb-4">
              Profit Trend
            </h3>
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={revenueTrend}>
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
                  formatter={(value: any) => [
                    `$${typeof value === "number" ? value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : value}`,
                    "Profit",
                  ]}
                />
                <Line
                  type="monotone"
                  dataKey="profit"
                  stroke="#06b6d4"
                  strokeWidth={3}
                  name="Profit ($)"
                />
                <Legend />
              </LineChart>
            </ResponsiveContainer>
          </motion.div>
        </div>
      )}

      {/* Cash Flow View */}
      {viewMode === "cashflow" && (
        <div className="space-y-6">
          <div className="grid md:grid-cols-3 gap-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white/5 backdrop-blur-xl border border-green-500/30 rounded-2xl p-6"
            >
              <div className="text-3xl font-bold text-white mb-2">
                ${(financialData.cashInflow / 1000).toFixed(0)}K
              </div>
              <div className="text-sm text-[#9ca3af]">Cash Inflow</div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white/5 backdrop-blur-xl border border-red-500/30 rounded-2xl p-6"
            >
              <div className="text-3xl font-bold text-white mb-2">
                ${(financialData.cashOutflow / 1000).toFixed(0)}K
              </div>
              <div className="text-sm text-[#9ca3af]">Cash Outflow</div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className={`bg-white/5 backdrop-blur-xl border rounded-2xl p-6 ${
                financialData.netCashFlow > 0
                  ? "border-green-500/30"
                  : "border-red-500/30"
              }`}
            >
              <div
                className={`text-3xl font-bold mb-2 ${financialData.netCashFlow > 0 ? "text-green-400" : "text-red-400"}`}
              >
                ${(financialData.netCashFlow / 1000).toFixed(0)}K
              </div>
              <div className="text-sm text-[#9ca3af]">Net Cash Flow</div>
            </motion.div>
          </div>
        </div>
      )}

      {/* Export Modal */}
      <Modal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        title="Export Financial Report"
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
