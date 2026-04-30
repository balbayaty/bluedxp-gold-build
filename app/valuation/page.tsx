"use client";

import { useState, useMemo, useEffect } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import PageTemplate from "@/components/PageTemplate";
import Tooltip from "@/components/Tooltip";
import Modal from "@/components/Modal";
import ModuleLinks from "@/components/ModuleLinks";
import {
  generateInventoryStock,
  generateMaterialMaster,
} from "@/utils/mockDataGenerators";
import {
  getInventoryLinks,
  getMaterialLinks,
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

interface Valuation {
  id: string;
  materialNumber: string;
  materialDescription: string;
  category: string;
  location: string;
  quantity: number;
  unit: string;
  standardCost: number;
  lastCost: number;
  averageCost: number;
  fifoCost?: number;
  lifoCost?: number;
  weightedAverageCost: number;
  valuationMethod:
    | "STANDARD"
    | "FIFO"
    | "LIFO"
    | "WEIGHTED_AVERAGE"
    | "MOVING_AVERAGE";
  standardValue: number;
  actualValue: number;
  variance: number;
  variancePercentage: number;
  currency: string;
  lastValuationDate: Date | string;
  valuationDate: Date | string;
}

export default function StockValuation() {
  const router = useRouter();
  const [valuations, setValuations] = useState<Valuation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedMethod, setSelectedMethod] = useState<string>("STANDARD");

  // Fetch valuations from API
  useEffect(() => {
    const fetchValuations = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch(`/api/wms/valuation?method=${selectedMethod}`);
        const result = await response.json();

        if (result.success && result.data) {
          // Map API response to Valuation format
          const mappedValuations: Valuation[] = result.data.map((val: any) => ({
            id: val.id,
            materialNumber: val.materialNumber,
            materialDescription: val.materialDescription,
            category: val.category,
            location: val.location,
            quantity: val.quantity,
            unit: val.unit,
            standardCost: val.standardCost,
            lastCost: val.lastCost,
            averageCost: val.averageCost,
            fifoCost: val.fifoCost,
            lifoCost: val.lifoCost,
            weightedAverageCost: val.weightedAverageCost,
            valuationMethod: val.valuationMethod,
            standardValue: val.standardValue,
            actualValue: val.actualValue,
            variance: val.variance,
            variancePercentage: val.variancePercentage,
            currency: val.currency,
            lastValuationDate: val.lastValuationDate ? new Date(val.lastValuationDate) : new Date(),
            valuationDate: val.valuationDate ? new Date(val.valuationDate) : new Date(),
          }));
          setValuations(mappedValuations);
        } else {
          setError(result.error || 'Failed to fetch valuations');
        }
      } catch (err) {
        console.error('Error fetching valuations:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch valuations');
      } finally {
        setLoading(false);
      }
    };

    fetchValuations();
  }, [selectedMethod]);

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [viewMode, setViewMode] = useState<"table" | "grid" | "analytics">(
    "table",
  );
  const [selectedValuation, setSelectedValuation] = useState<Valuation | null>(
    null,
  );
  const [showViewModal, setShowViewModal] = useState(false);
  const [realTimeEnabled, setRealTimeEnabled] = useState(true);
  const [realTimeStats, setRealTimeStats] = useState({
    totalItems: 0,
    totalStandardValue: 0,
    totalActualValue: 0,
    totalVariance: 0,
  });

  const filteredValuations = useMemo(() => {
    return valuations.filter((val) => {
      const matchesSearch =
        val.materialNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        val.materialDescription
          .toLowerCase()
          .includes(searchQuery.toLowerCase()) ||
        val.location.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory =
        selectedCategory === "ALL" || val.category === selectedCategory;
      const matchesMethod =
        selectedMethod === "ALL" || val.valuationMethod === selectedMethod;
      return matchesSearch && matchesCategory && matchesMethod;
    });
  }, [valuations, searchQuery, selectedCategory, selectedMethod]);

  // Analytics
  const methodDistribution = useMemo(() => {
    const counts: Record<string, { count: number; totalValue: number }> = {};
    valuations.forEach((v) => {
      if (!counts[v.valuationMethod]) {
        counts[v.valuationMethod] = { count: 0, totalValue: 0 };
      }
      counts[v.valuationMethod].count++;
      counts[v.valuationMethod].totalValue += v.actualValue;
    });
    return Object.entries(counts).map(([method, data]) => ({
      method: method.replace(/_/g, " "),
      count: data.count,
      totalValue: data.totalValue,
    }));
  }, [valuations]);

  const categoryValue = useMemo(() => {
    const categoryData: Record<
      string,
      { count: number; standardValue: number; actualValue: number }
    > = {};
    valuations.forEach((v) => {
      if (!categoryData[v.category]) {
        categoryData[v.category] = {
          count: 0,
          standardValue: 0,
          actualValue: 0,
        };
      }
      categoryData[v.category].count++;
      categoryData[v.category].standardValue += v.standardValue;
      categoryData[v.category].actualValue += v.actualValue;
    });
    return Object.entries(categoryData).map(([category, data]) => ({
      category,
      count: data.count,
      standardValue: data.standardValue,
      actualValue: data.actualValue,
      variance: data.actualValue - data.standardValue,
    }));
  }, [valuations]);

  const varianceAnalysis = useMemo(() => {
    const positive = valuations.filter((v) => v.variance > 0).length;
    const negative = valuations.filter((v) => v.variance < 0).length;
    const zero = valuations.filter((v) => v.variance === 0).length;

    return [
      { type: "Positive Variance", count: positive, color: "#10b981" },
      { type: "Negative Variance", count: negative, color: "#ef4444" },
      { type: "No Variance", count: zero, color: "#6b7280" },
    ];
  }, [valuations]);

  // Aggregate stats
  const aggregateStats = useMemo(() => {
    const totalItems = valuations.length;
    const totalStandardValue = valuations.reduce(
      (sum, v) => sum + v.standardValue,
      0,
    );
    const totalActualValue = valuations.reduce(
      (sum, v) => sum + v.actualValue,
      0,
    );
    const totalVariance = totalActualValue - totalStandardValue;

    return {
      totalItems,
      totalStandardValue,
      totalActualValue,
      totalVariance,
    };
  }, [valuations]);

  // Real-time updates
  useEffect(() => {
    if (!realTimeEnabled) return;

    const unsubscribe = realtimeSimulator.subscribe(
      "valuation-stats",
      (data: typeof realTimeStats) => {
        setRealTimeStats(data);
      },
    );

    const stop = realtimeSimulator.start(
      "valuation-stats",
      () => ({
        totalItems: aggregateStats.totalItems,
        totalStandardValue: simulateKPIUpdates(
          aggregateStats.totalStandardValue,
          0.02,
        ),
        totalActualValue: simulateKPIUpdates(
          aggregateStats.totalActualValue,
          0.02,
        ),
        totalVariance: simulateKPIUpdates(aggregateStats.totalVariance, 0.05),
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
    aggregateStats.totalItems,
    aggregateStats.totalStandardValue,
    aggregateStats.totalActualValue,
    aggregateStats.totalVariance,
  ]);

  const uniqueCategories = useMemo(() => {
    return Array.from(new Set(valuations.map((v) => v.category))).sort();
  }, [valuations]);

  const stats = [
    {
      label: "Total Items",
      value: realTimeEnabled
        ? realTimeStats.totalItems
        : aggregateStats.totalItems,
      icon: "ri-stack-line",
      tooltip: "Total items valued",
      trend: "up" as const,
    },
    {
      label: "Standard Value",
      value: realTimeEnabled
        ? realTimeStats.totalStandardValue
        : aggregateStats.totalStandardValue,
      isCurrency: true,
      icon: "ri-money-dollar-circle-line",
      tooltip: "Total standard cost value",
      trend: "neutral" as const,
    },
    {
      label: "Actual Value",
      value: realTimeEnabled
        ? realTimeStats.totalActualValue
        : aggregateStats.totalActualValue,
      isCurrency: true,
      icon: "ri-money-cny-circle-line",
      tooltip: "Total actual cost value",
      trend: "neutral" as const,
    },
    {
      label: "Total Variance",
      value: realTimeEnabled
        ? realTimeStats.totalVariance
        : aggregateStats.totalVariance,
      isCurrency: true,
      icon: "ri-line-chart-line",
      tooltip: "Total variance (Actual - Standard)",
      trend:
        aggregateStats.totalVariance > 0 ? ("up" as const) : ("down" as const),
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

  const handleView = (valuation: Valuation) => {
    setSelectedValuation(valuation);
    setShowViewModal(true);
  };

  if (loading) {
    return (
      <PageTemplate
        title="Stock Valuation"
        description="Inventory valuation management"
        icon="ri-money-dollar-circle-line"
      >
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
            <p className="text-white">Loading valuations...</p>
          </div>
        </div>
      </PageTemplate>
    );
  }

  if (error) {
    return (
      <PageTemplate
        title="Stock Valuation"
        description="Inventory valuation management"
        icon="ri-money-dollar-circle-line"
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
      title="Stock Valuation"
      description="Inventory valuation management with multiple costing methods (Standard, FIFO, LIFO, Weighted Average), variance analysis, and value reporting"
      icon="ri-money-dollar-circle-line"
      systemInfo={{
        sap: "Material Valuation, Inventory Valuation",
        oracle: "Inventory Valuation, Cost Management",
        manhattan: "Inventory Valuation, Cost Accounting",
      }}
      examples={[
        "Multiple valuation methods",
        "Standard vs actual cost comparison",
        "Variance analysis",
        "Category-wise valuation",
        "Cost method distribution",
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
            placeholder="Search valuations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-lg pl-10 pr-4 py-2.5 text-sm text-white placeholder-[#6b7280] focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all"
          />
        </div>
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 min-w-[180px]"
        >
          <option value="ALL">All Categories</option>
          {uniqueCategories.map((category) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </select>
        <select
          value={selectedMethod}
          onChange={(e) => setSelectedMethod(e.target.value)}
          className="bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 min-w-[180px]"
        >
          <option value="ALL">All Methods</option>
          <option value="STANDARD">Standard</option>
          <option value="FIFO">FIFO</option>
          <option value="LIFO">LIFO</option>
          <option value="WEIGHTED_AVERAGE">Weighted Average</option>
          <option value="MOVING_AVERAGE">Moving Average</option>
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
                    Material
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-[#9ca3af] uppercase tracking-wider">
                    Location
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-[#9ca3af] uppercase tracking-wider">
                    Quantity
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-[#9ca3af] uppercase tracking-wider">
                    Valuation Method
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-[#9ca3af] uppercase tracking-wider">
                    Standard Value
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-[#9ca3af] uppercase tracking-wider">
                    Actual Value
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-[#9ca3af] uppercase tracking-wider">
                    Variance
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-[#9ca3af] uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {filteredValuations.map((valuation, index) => (
                  <motion.tr
                    key={valuation.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.02 }}
                    className="hover:bg-white/5 transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() =>
                          router.push(
                            `/materials?material=${valuation.materialNumber}`,
                          )
                        }
                        className="text-sm text-cyan-400 hover:text-cyan-300 font-mono"
                      >
                        {valuation.materialNumber}
                      </button>
                      <div className="text-xs text-[#9ca3af]">
                        {valuation.materialDescription}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() =>
                          router.push(
                            `/storage-locations?location=${valuation.location}`,
                          )
                        }
                        className="text-sm text-cyan-400 hover:text-cyan-300 font-mono"
                      >
                        {valuation.location}
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-white font-medium">
                        {valuation.quantity} {valuation.unit}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-xs px-2 py-1 rounded bg-cyan-500/20 text-cyan-400">
                        {valuation.valuationMethod.replace(/_/g, " ")}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-white font-medium">
                        {valuation.standardValue.toLocaleString()}{" "}
                        {valuation.currency}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-white font-medium">
                        {valuation.actualValue.toLocaleString()}{" "}
                        {valuation.currency}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div
                        className={`text-sm font-medium ${valuation.variance >= 0 ? "text-green-400" : "text-red-400"}`}
                      >
                        {valuation.variance >= 0 ? "+" : ""}
                        {valuation.variance.toLocaleString()}{" "}
                        {valuation.currency}
                      </div>
                      <div
                        className={`text-xs ${valuation.variancePercentage >= 0 ? "text-green-400" : "text-red-400"}`}
                      >
                        ({valuation.variancePercentage >= 0 ? "+" : ""}
                        {valuation.variancePercentage.toFixed(2)}%)
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Tooltip content="View Details" position="top">
                        <button
                          onClick={() => handleView(valuation)}
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
          {filteredValuations.map((valuation, index) => (
            <motion.div
              key={valuation.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.03 }}
              className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-6 hover:border-cyan-500/50 hover:shadow-lg hover:shadow-cyan-500/10 transition-all"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <button
                    onClick={() =>
                      router.push(
                        `/materials?material=${valuation.materialNumber}`,
                      )
                    }
                    className="text-lg font-semibold text-cyan-400 hover:text-cyan-300 font-mono mb-1"
                  >
                    {valuation.materialNumber}
                  </button>
                  <p className="text-sm text-[#9ca3af]">
                    {valuation.materialDescription}
                  </p>
                </div>
                <span className="text-xs px-2 py-1 rounded bg-cyan-500/20 text-cyan-400">
                  {valuation.valuationMethod.replace(/_/g, " ")}
                </span>
              </div>
              <div className="space-y-2 mb-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-[#9ca3af]">Location:</span>
                  <button
                    onClick={() =>
                      router.push(
                        `/storage-locations?location=${valuation.location}`,
                      )
                    }
                    className="text-cyan-400 hover:text-cyan-300 font-mono text-xs"
                  >
                    {valuation.location}
                  </button>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-[#9ca3af]">Quantity:</span>
                  <span className="text-white font-medium">
                    {valuation.quantity} {valuation.unit}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-[#9ca3af]">Standard Value:</span>
                  <span className="text-white">
                    {valuation.standardValue.toLocaleString()}{" "}
                    {valuation.currency}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-[#9ca3af]">Actual Value:</span>
                  <span className="text-white font-medium">
                    {valuation.actualValue.toLocaleString()}{" "}
                    {valuation.currency}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-[#9ca3af]">Variance:</span>
                  <span
                    className={`font-medium ${valuation.variance >= 0 ? "text-green-400" : "text-red-400"}`}
                  >
                    {valuation.variance >= 0 ? "+" : ""}
                    {valuation.variance.toLocaleString()} {valuation.currency}
                  </span>
                </div>
              </div>
              <button
                onClick={() => handleView(valuation)}
                className="w-full px-3 py-2 bg-cyan-600/20 text-cyan-400 border border-cyan-500/30 rounded text-sm font-medium hover:bg-cyan-600/30 transition-colors"
              >
                <i className="ri-eye-line mr-1"></i>
                View Details
              </button>
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
                Valuation Method Distribution
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={methodDistribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ method, count }) => `${method}: ${count}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="count"
                  >
                    {methodDistribution.map((entry, index) => (
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
                Variance Analysis
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={varianceAnalysis}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="type" stroke="#9ca3af" fontSize={10} />
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
              Category Value Comparison
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <ComposedChart data={categoryValue.slice(0, 10)}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis
                  dataKey="category"
                  stroke="#9ca3af"
                  fontSize={10}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
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
                  dataKey="standardValue"
                  fill="#06b6d4"
                  name="Standard Value"
                />
                <Bar
                  yAxisId="left"
                  dataKey="actualValue"
                  fill="#10b981"
                  name="Actual Value"
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="variance"
                  stroke="#f59e0b"
                  strokeWidth={2}
                  name="Variance"
                />
              </ComposedChart>
            </ResponsiveContainer>
          </motion.div>
        </div>
      )}

      {/* View Modal */}
      <Modal
        isOpen={showViewModal}
        onClose={() => {
          setShowViewModal(false);
          setSelectedValuation(null);
        }}
        title={`Valuation Details - ${selectedValuation?.materialNumber || ""}`}
        size="lg"
      >
        {selectedValuation && (
          <div className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-[#9ca3af] mb-1">
                  Material Number
                </div>
                <button
                  onClick={() =>
                    router.push(
                      `/materials?material=${selectedValuation.materialNumber}`,
                    )
                  }
                  className="text-cyan-400 hover:text-cyan-300 font-mono"
                >
                  {selectedValuation.materialNumber}
                </button>
              </div>
              <div>
                <div className="text-sm text-[#9ca3af] mb-1">Location</div>
                <button
                  onClick={() =>
                    router.push(
                      `/storage-locations?location=${selectedValuation.location}`,
                    )
                  }
                  className="text-cyan-400 hover:text-cyan-300 font-mono"
                >
                  {selectedValuation.location}
                </button>
              </div>
              <div>
                <div className="text-sm text-[#9ca3af] mb-1">Quantity</div>
                <div className="text-white font-medium">
                  {selectedValuation.quantity} {selectedValuation.unit}
                </div>
              </div>
              <div>
                <div className="text-sm text-[#9ca3af] mb-1">
                  Valuation Method
                </div>
                <div className="text-white">
                  {selectedValuation.valuationMethod.replace(/_/g, " ")}
                </div>
              </div>
            </div>
            <div>
              <div className="text-sm text-[#9ca3af] mb-2">
                Cost Information
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="p-3 bg-white/5 rounded-lg">
                  <div className="text-xs text-[#9ca3af] mb-1">
                    Standard Cost
                  </div>
                  <div className="text-lg font-semibold text-white">
                    {selectedValuation.standardCost.toFixed(2)}{" "}
                    {selectedValuation.currency}
                  </div>
                </div>
                <div className="p-3 bg-white/5 rounded-lg">
                  <div className="text-xs text-[#9ca3af] mb-1">Last Cost</div>
                  <div className="text-lg font-semibold text-white">
                    {selectedValuation.lastCost.toFixed(2)}{" "}
                    {selectedValuation.currency}
                  </div>
                </div>
                <div className="p-3 bg-white/5 rounded-lg">
                  <div className="text-xs text-[#9ca3af] mb-1">
                    Average Cost
                  </div>
                  <div className="text-lg font-semibold text-white">
                    {selectedValuation.averageCost.toFixed(2)}{" "}
                    {selectedValuation.currency}
                  </div>
                </div>
                <div className="p-3 bg-white/5 rounded-lg">
                  <div className="text-xs text-[#9ca3af] mb-1">
                    Weighted Avg
                  </div>
                  <div className="text-lg font-semibold text-cyan-400">
                    {selectedValuation.weightedAverageCost.toFixed(2)}{" "}
                    {selectedValuation.currency}
                  </div>
                </div>
              </div>
            </div>
            <div>
              <div className="text-sm text-[#9ca3af] mb-2">
                Value Comparison
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-white/5 rounded-lg">
                  <div className="text-xs text-[#9ca3af] mb-1">
                    Standard Value
                  </div>
                  <div className="text-xl font-semibold text-white">
                    {selectedValuation.standardValue.toLocaleString()}{" "}
                    {selectedValuation.currency}
                  </div>
                </div>
                <div className="p-3 bg-white/5 rounded-lg">
                  <div className="text-xs text-[#9ca3af] mb-1">
                    Actual Value
                  </div>
                  <div className="text-xl font-semibold text-cyan-400">
                    {selectedValuation.actualValue.toLocaleString()}{" "}
                    {selectedValuation.currency}
                  </div>
                </div>
              </div>
            </div>
            <div>
              <div className="text-sm text-[#9ca3af] mb-2">Variance</div>
              <div
                className={`p-3 rounded-lg ${selectedValuation.variance >= 0 ? "bg-green-500/20" : "bg-red-500/20"}`}
              >
                <div className="text-2xl font-bold text-white">
                  {selectedValuation.variance >= 0 ? "+" : ""}
                  {selectedValuation.variance.toLocaleString()}{" "}
                  {selectedValuation.currency}
                </div>
                <div
                  className={`text-sm ${selectedValuation.variancePercentage >= 0 ? "text-green-400" : "text-red-400"}`}
                >
                  ({selectedValuation.variancePercentage >= 0 ? "+" : ""}
                  {selectedValuation.variancePercentage.toFixed(2)}%)
                </div>
              </div>
            </div>
            <ModuleLinks
              links={[
                ...getMaterialLinks(selectedValuation.materialNumber),
                ...getInventoryLinks(selectedValuation.materialNumber),
              ]}
            />
          </div>
        )}
      </Modal>
    </PageTemplate>
  );
}
