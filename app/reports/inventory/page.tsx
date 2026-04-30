"use client";

import { useState, useMemo } from "react";
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
import { getInventoryLinks } from "@/utils/moduleInterconnectivity";
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

interface StockItem {
  id: string;
  materialNumber: string;
  materialDescription: string;
  storageLocation: string;
  quantity: number;
  reservedQuantity: number;
  availableQuantity: number;
  unit: string;
  batchNumber: string;
  expiryDate?: Date | string;
  valuation: number;
  currency: string;
  lastMovementDate?: Date | string;
}

export default function InventoryReports() {
  const router = useRouter();
  const [stock, setStock] = useState<StockItem[]>(() =>
    generateInventoryStock(200),
  );
  const [dateRange, setDateRange] = useState<"7d" | "30d" | "90d" | "custom">(
    "30d",
  );
  const [selectedLocation, setSelectedLocation] = useState<string>("ALL");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [viewMode, setViewMode] = useState<
    "overview" | "valuation" | "movement" | "aging" | "abc"
  >("overview");
  const [showExportModal, setShowExportModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<StockItem | null>(null);
  const [showViewModal, setShowViewModal] = useState(false);

  const filteredStock = useMemo(() => {
    let filtered = [...stock];

    // Location filter
    if (selectedLocation !== "ALL") {
      filtered = filtered.filter((item) =>
        item.storageLocation.startsWith(selectedLocation),
      );
    }

    return filtered;
  }, [stock, selectedLocation]);

  // Aggregate statistics
  const aggregateStats = useMemo(() => {
    const totalQuantity = filteredStock.reduce(
      (sum, item) => sum + item.quantity,
      0,
    );
    const totalReserved = filteredStock.reduce(
      (sum, item) => sum + item.reservedQuantity,
      0,
    );
    const totalAvailable = filteredStock.reduce(
      (sum, item) => sum + item.availableQuantity,
      0,
    );
    const totalValue = filteredStock.reduce(
      (sum, item) => sum + item.valuation,
      0,
    );
    const uniqueMaterials = new Set(
      filteredStock.map((item) => item.materialNumber),
    ).size;
    const uniqueLocations = new Set(
      filteredStock.map((item) => item.storageLocation),
    ).size;

    return {
      totalQuantity,
      totalReserved,
      totalAvailable,
      totalValue,
      uniqueMaterials,
      uniqueLocations,
      utilizationRate:
        totalReserved > 0 ? (totalReserved / totalQuantity) * 100 : 0,
    };
  }, [filteredStock]);

  // Stock by location
  const stockByLocation = useMemo(() => {
    const locationData: Record<
      string,
      { location: string; quantity: number; value: number; items: number }
    > = {};

    filteredStock.forEach((item) => {
      const zone = item.storageLocation.split("-")[0];
      if (!locationData[zone]) {
        locationData[zone] = {
          location: zone,
          quantity: 0,
          value: 0,
          items: 0,
        };
      }
      locationData[zone].quantity += item.quantity;
      locationData[zone].value += item.valuation;
      locationData[zone].items += 1;
    });

    return Object.values(locationData).sort((a, b) => b.value - a.value);
  }, [filteredStock]);

  // Stock by material
  const stockByMaterial = useMemo(() => {
    const materialData: Record<
      string,
      {
        material: string;
        description: string;
        quantity: number;
        value: number;
        locations: number;
      }
    > = {};

    filteredStock.forEach((item) => {
      if (!materialData[item.materialNumber]) {
        materialData[item.materialNumber] = {
          material: item.materialNumber,
          description: item.materialDescription,
          quantity: 0,
          value: 0,
          locations: 0,
        };
      }
      materialData[item.materialNumber].quantity += item.quantity;
      materialData[item.materialNumber].value += item.valuation;
      materialData[item.materialNumber].locations += 1;
    });

    return Object.values(materialData)
      .sort((a, b) => b.value - a.value)
      .slice(0, 20);
  }, [filteredStock]);

  // Valuation trend (simulated)
  const valuationTrend = useMemo(() => {
    const days = dateRange === "7d" ? 7 : dateRange === "30d" ? 30 : 90;
    return Array.from({ length: days }, (_, i) => {
      const date = subDays(new Date(), days - i - 1);
      const baseValue = aggregateStats.totalValue;
      const variation = (Math.random() - 0.5) * 0.1; // ±5% variation
      return {
        date: format(date, "MMM dd"),
        value: baseValue * (1 + variation),
        quantity: aggregateStats.totalQuantity * (1 + variation * 0.5),
      };
    });
  }, [dateRange, aggregateStats.totalValue, aggregateStats.totalQuantity]);

  // Aging analysis
  const agingAnalysis = useMemo(() => {
    const now = new Date();
    const agingBuckets = {
      "0-30 days": 0,
      "31-60 days": 0,
      "61-90 days": 0,
      "91-180 days": 0,
      "180+ days": 0,
    };

    let totalAgingValue = 0;

    filteredStock.forEach((item) => {
      if (item.lastMovementDate) {
        const daysSince = Math.floor(
          (now.getTime() - new Date(item.lastMovementDate).getTime()) /
            (1000 * 60 * 60 * 24),
        );
        const value = item.valuation;

        if (daysSince <= 30) {
          agingBuckets["0-30 days"] += value;
        } else if (daysSince <= 60) {
          agingBuckets["31-60 days"] += value;
        } else if (daysSince <= 90) {
          agingBuckets["61-90 days"] += value;
        } else if (daysSince <= 180) {
          agingBuckets["91-180 days"] += value;
        } else {
          agingBuckets["180+ days"] += value;
        }

        totalAgingValue += value;
      }
    });

    return Object.entries(agingBuckets).map(([range, value]) => ({
      range,
      value,
      percentage: totalAgingValue > 0 ? (value / totalAgingValue) * 100 : 0,
    }));
  }, [filteredStock]);

  // ABC Analysis
  const abcAnalysis = useMemo(() => {
    const sorted = [...filteredStock].sort((a, b) => b.valuation - a.valuation);
    const totalValue = sorted.reduce((sum, item) => sum + item.valuation, 0);

    let cumulativeValue = 0;
    const abcData = {
      A: { items: [] as StockItem[], value: 0, count: 0 },
      B: { items: [] as StockItem[], value: 0, count: 0 },
      C: { items: [] as StockItem[], value: 0, count: 0 },
    };

    sorted.forEach((item) => {
      cumulativeValue += item.valuation;
      const percentage = (cumulativeValue / totalValue) * 100;

      if (percentage <= 80) {
        abcData.A.items.push(item);
        abcData.A.value += item.valuation;
        abcData.A.count += 1;
      } else if (percentage <= 95) {
        abcData.B.items.push(item);
        abcData.B.value += item.valuation;
        abcData.B.count += 1;
      } else {
        abcData.C.items.push(item);
        abcData.C.value += item.valuation;
        abcData.C.count += 1;
      }
    });

    return abcData;
  }, [filteredStock]);

  const stats = [
    {
      label: "Total Value",
      value: `$${aggregateStats.totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      icon: "ri-money-dollar-circle-line",
      tooltip: "Total inventory valuation",
      trend: "up" as const,
    },
    {
      label: "Total Quantity",
      value: aggregateStats.totalQuantity.toLocaleString(),
      icon: "ri-stack-line",
      tooltip: "Total stock quantity",
      trend: "up" as const,
    },
    {
      label: "Unique Materials",
      value: aggregateStats.uniqueMaterials,
      icon: "ri-box-3-line",
      tooltip: "Number of unique materials",
      trend: "up" as const,
    },
    {
      label: "Utilization Rate",
      value: `${aggregateStats.utilizationRate.toFixed(1)}%`,
      icon: "ri-bar-chart-line",
      tooltip: "Reserved vs total quantity",
      trend: "up" as const,
    },
  ];

  const handleView = (item: StockItem) => {
    setSelectedItem(item);
    setShowViewModal(true);
  };

  const handleExport = (format: "pdf" | "excel" | "csv") => {
    logger.info("Exporting inventory report", undefined, {
      module: "reports",
      service: "inventory",
      exportFormat: format,
    });
    setShowExportModal(false);
  };

  return (
    <PageTemplate
      title="Inventory Reports"
      description="Comprehensive inventory analytics, valuation reports, movement analysis, and ABC classification"
      icon="ri-stack-line"
      systemInfo={{
        sap: "MB5B - Stock Overview, MC.9 - Inventory Valuation",
        oracle: "Inventory Reports, Stock Valuation",
        manhattan: "Inventory Reports, Stock Analytics",
      }}
      examples={[
        "Stock valuation and analytics",
        "Movement and aging analysis",
        "ABC classification",
        "Location-based reports",
        "Material-level insights",
        "Export to PDF, Excel, CSV",
      ]}
      stats={stats}
      actions={
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-lg p-1">
            {(
              ["overview", "valuation", "movement", "aging", "abc"] as const
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
                  className={`ri-${mode === "overview" ? "dashboard-line" : mode === "valuation" ? "money-dollar-circle-line" : mode === "movement" ? "arrow-left-right-line" : mode === "aging" ? "time-line" : "bar-chart-box-line"} mr-1`}
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
        <select
          value={selectedLocation}
          onChange={(e) => setSelectedLocation(e.target.value)}
          className="bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 min-w-[150px]"
        >
          <option value="ALL">All Locations</option>
          {Array.from(
            new Set(stock.map((item) => item.storageLocation.split("-")[0])),
          ).map((loc) => (
            <option key={loc} value={loc}>
              {loc}
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
              onClick={() => router.push("/inventory")}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="text-3xl font-bold text-white">
                  {aggregateStats.totalValue.toLocaleString(undefined, {
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 0,
                  })}
                </div>
                <div className="w-12 h-12 rounded-lg bg-cyan-500/20 flex items-center justify-center">
                  <i className="ri-money-dollar-circle-line text-2xl text-cyan-400"></i>
                </div>
              </div>
              <div className="text-sm text-[#9ca3af]">
                Total Inventory Value
              </div>
              <div className="text-xs text-cyan-400 mt-2">
                Click to view details
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 cursor-pointer hover:border-cyan-500/50 transition-all"
              onClick={() => router.push("/inventory")}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="text-3xl font-bold text-white">
                  {aggregateStats.totalQuantity.toLocaleString()}
                </div>
                <div className="w-12 h-12 rounded-lg bg-blue-500/20 flex items-center justify-center">
                  <i className="ri-stack-line text-2xl text-blue-400"></i>
                </div>
              </div>
              <div className="text-sm text-[#9ca3af]">Total Quantity</div>
              <div className="text-xs text-cyan-400 mt-2">
                Click to view details
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 cursor-pointer hover:border-cyan-500/50 transition-all"
              onClick={() => router.push("/inventory")}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="text-3xl font-bold text-white">
                  {aggregateStats.uniqueMaterials}
                </div>
                <div className="w-12 h-12 rounded-lg bg-green-500/20 flex items-center justify-center">
                  <i className="ri-box-3-line text-2xl text-green-400"></i>
                </div>
              </div>
              <div className="text-sm text-[#9ca3af]">Unique Materials</div>
              <div className="text-xs text-cyan-400 mt-2">
                Click to view details
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 cursor-pointer hover:border-cyan-500/50 transition-all"
              onClick={() => router.push("/inventory")}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="text-3xl font-bold text-white">
                  {aggregateStats.utilizationRate.toFixed(1)}%
                </div>
                <div className="w-12 h-12 rounded-lg bg-purple-500/20 flex items-center justify-center">
                  <i className="ri-bar-chart-line text-2xl text-purple-400"></i>
                </div>
              </div>
              <div className="text-sm text-[#9ca3af]">Utilization Rate</div>
              <div className="text-xs text-cyan-400 mt-2">
                Click to view details
              </div>
            </motion.div>
          </div>

          {/* Stock by Location */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
          >
            <h3 className="text-lg font-semibold text-white mb-4">
              Stock by Location
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={stockByLocation}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="location" stroke="#9ca3af" fontSize={12} />
                <YAxis stroke="#9ca3af" fontSize={12} />
                <RechartsTooltip
                  contentStyle={{
                    backgroundColor: "#1f2937",
                    border: "1px solid #374151",
                    borderRadius: "8px",
                  }}
                  labelStyle={{ color: "#fff" }}
                  formatter={(value: any) => [
                    typeof value === "number" ? value.toLocaleString() : value,
                    "",
                  ]}
                />
                <Bar dataKey="quantity" fill="#06b6d4" name="Quantity" />
                <Bar dataKey="value" fill="#3b82f6" name="Value ($)" />
                <Legend />
              </BarChart>
            </ResponsiveContainer>
          </motion.div>

          {/* Top Materials */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
          >
            <h3 className="text-lg font-semibold text-white mb-4">
              Top 20 Materials by Value
            </h3>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {stockByMaterial.map((material, index) => (
                <div
                  key={material.material}
                  className="flex items-center justify-between p-3 bg-white/5 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
                  onClick={() =>
                    router.push(`/inventory?material=${material.material}`)
                  }
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-cyan-500/20 flex items-center justify-center text-cyan-400 font-bold text-sm">
                      {index + 1}
                    </div>
                    <div>
                      <div className="text-sm font-medium text-white">
                        {material.material}
                      </div>
                      <div className="text-xs text-[#9ca3af]">
                        {material.description}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium text-white">
                      $
                      {material.value.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </div>
                    <div className="text-xs text-[#9ca3af]">
                      {material.quantity.toLocaleString()}{" "}
                      {filteredStock.find(
                        (s) => s.materialNumber === material.material,
                      )?.unit || "units"}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      )}

      {/* Valuation View */}
      {viewMode === "valuation" && (
        <div className="space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
          >
            <h3 className="text-lg font-semibold text-white mb-4">
              Valuation Trend
            </h3>
            <ResponsiveContainer width="100%" height={400}>
              <ComposedChart data={valuationTrend}>
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
                  dataKey="quantity"
                  fill="#06b6d4"
                  name="Quantity"
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="value"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  name="Value ($)"
                />
                <Legend />
              </ComposedChart>
            </ResponsiveContainer>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
            >
              <h3 className="text-lg font-semibold text-white mb-4">
                Value Distribution by Location
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={stockByLocation}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ location, value }) =>
                      `${location}: $${value.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
                    }
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {stockByLocation.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={
                          [
                            "#06b6d4",
                            "#3b82f6",
                            "#10b981",
                            "#8b5cf6",
                            "#f59e0b",
                          ][index % 5]
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
                Top Materials by Value
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={stockByMaterial.slice(0, 10)} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis type="number" stroke="#9ca3af" fontSize={12} />
                  <YAxis
                    dataKey="material"
                    type="category"
                    stroke="#9ca3af"
                    fontSize={10}
                    width={80}
                  />
                  <RechartsTooltip
                    contentStyle={{
                      backgroundColor: "#1f2937",
                      border: "1px solid #374151",
                      borderRadius: "8px",
                    }}
                    labelStyle={{ color: "#fff" }}
                  />
                  <Bar dataKey="value" fill="#06b6d4" name="Value ($)" />
                </BarChart>
              </ResponsiveContainer>
            </motion.div>
          </div>
        </div>
      )}

      {/* Movement View */}
      {viewMode === "movement" && (
        <div className="space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
          >
            <h3 className="text-lg font-semibold text-white mb-4">
              Stock Movement Analysis
            </h3>
            <div className="text-sm text-[#9ca3af] mb-4">
              Analysis of stock movements and activity patterns
            </div>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="p-4 bg-white/5 rounded-lg">
                <div className="text-2xl font-bold text-white">
                  {filteredStock.filter((s) => s.lastMovementDate).length}
                </div>
                <div className="text-sm text-[#9ca3af]">
                  Items with Recent Movement
                </div>
              </div>
              <div className="p-4 bg-white/5 rounded-lg">
                <div className="text-2xl font-bold text-white">
                  {filteredStock.filter((s) => !s.lastMovementDate).length}
                </div>
                <div className="text-sm text-[#9ca3af]">
                  Items with No Movement
                </div>
              </div>
              <div className="p-4 bg-white/5 rounded-lg">
                <div className="text-2xl font-bold text-white">
                  {aggregateStats.totalReserved.toLocaleString()}
                </div>
                <div className="text-sm text-[#9ca3af]">
                  Total Reserved Quantity
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Aging View */}
      {viewMode === "aging" && (
        <div className="space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
          >
            <h3 className="text-lg font-semibold text-white mb-4">
              Inventory Aging Analysis
            </h3>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={agingAnalysis}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="range" stroke="#9ca3af" fontSize={12} />
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
                    "Value",
                  ]}
                />
                <Bar dataKey="value" fill="#06b6d4" name="Value ($)" />
                <Line
                  type="monotone"
                  dataKey="percentage"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  name="Percentage (%)"
                />
                <Legend />
              </BarChart>
            </ResponsiveContainer>
          </motion.div>
        </div>
      )}

      {/* ABC Analysis View */}
      {viewMode === "abc" && (
        <div className="space-y-6">
          <div className="grid md:grid-cols-3 gap-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white/5 backdrop-blur-xl border border-red-500/30 rounded-2xl p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">Class A</h3>
                <div className="w-10 h-10 rounded-lg bg-red-500/20 flex items-center justify-center">
                  <i className="ri-star-fill text-red-400 text-xl"></i>
                </div>
              </div>
              <div className="text-3xl font-bold text-white mb-2">
                $
                {abcAnalysis.A.value.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </div>
              <div className="text-sm text-[#9ca3af] mb-4">
                {abcAnalysis.A.count} items
              </div>
              <div className="text-xs text-[#9ca3af]">
                High-value items (80% of value)
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white/5 backdrop-blur-xl border border-yellow-500/30 rounded-2xl p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">Class B</h3>
                <div className="w-10 h-10 rounded-lg bg-yellow-500/20 flex items-center justify-center">
                  <i className="ri-star-half-fill text-yellow-400 text-xl"></i>
                </div>
              </div>
              <div className="text-3xl font-bold text-white mb-2">
                $
                {abcAnalysis.B.value.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </div>
              <div className="text-sm text-[#9ca3af] mb-4">
                {abcAnalysis.B.count} items
              </div>
              <div className="text-xs text-[#9ca3af]">
                Medium-value items (15% of value)
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white/5 backdrop-blur-xl border border-blue-500/30 rounded-2xl p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">Class C</h3>
                <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                  <i className="ri-star-line text-blue-400 text-xl"></i>
                </div>
              </div>
              <div className="text-3xl font-bold text-white mb-2">
                $
                {abcAnalysis.C.value.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </div>
              <div className="text-sm text-[#9ca3af] mb-4">
                {abcAnalysis.C.count} items
              </div>
              <div className="text-xs text-[#9ca3af]">
                Low-value items (5% of value)
              </div>
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
          >
            <h3 className="text-lg font-semibold text-white mb-4">
              ABC Distribution
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={[
                    { name: "Class A", value: abcAnalysis.A.value },
                    { name: "Class B", value: abcAnalysis.B.value },
                    { name: "Class C", value: abcAnalysis.C.value },
                  ]}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) =>
                    `${name}: $${value.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
                  }
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  <Cell fill="#ef4444" />
                  <Cell fill="#f59e0b" />
                  <Cell fill="#3b82f6" />
                </Pie>
                <RechartsTooltip />
              </PieChart>
            </ResponsiveContainer>
          </motion.div>
        </div>
      )}

      {/* Export Modal */}
      <Modal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        title="Export Inventory Report"
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
          setSelectedItem(null);
        }}
        title="Stock Item Details"
        size="lg"
      >
        {selectedItem && (
          <div className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-[#9ca3af] mb-1">
                  Material Number
                </div>
                <div className="text-white font-medium">
                  {selectedItem.materialNumber}
                </div>
              </div>
              <div>
                <div className="text-sm text-[#9ca3af] mb-1">Description</div>
                <div className="text-white font-medium">
                  {selectedItem.materialDescription}
                </div>
              </div>
              <div>
                <div className="text-sm text-[#9ca3af] mb-1">
                  Storage Location
                </div>
                <div className="text-white font-medium">
                  {selectedItem.storageLocation}
                </div>
              </div>
              <div>
                <div className="text-sm text-[#9ca3af] mb-1">Batch Number</div>
                <div className="text-white font-medium">
                  {selectedItem.batchNumber}
                </div>
              </div>
              <div>
                <div className="text-sm text-[#9ca3af] mb-1">Quantity</div>
                <div className="text-white font-medium">
                  {selectedItem.quantity.toLocaleString()} {selectedItem.unit}
                </div>
              </div>
              <div>
                <div className="text-sm text-[#9ca3af] mb-1">
                  Available Quantity
                </div>
                <div className="text-white font-medium">
                  {selectedItem.availableQuantity.toLocaleString()}{" "}
                  {selectedItem.unit}
                </div>
              </div>
              <div>
                <div className="text-sm text-[#9ca3af] mb-1">Valuation</div>
                <div className="text-white font-medium">
                  $
                  {selectedItem.valuation.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}{" "}
                  {selectedItem.currency}
                </div>
              </div>
              {selectedItem.lastMovementDate && (
                <div>
                  <div className="text-sm text-[#9ca3af] mb-1">
                    Last Movement
                  </div>
                  <div className="text-white font-medium">
                    {format(new Date(selectedItem.lastMovementDate), "PPp")}
                  </div>
                </div>
              )}
            </div>
            <ModuleLinks
              links={getInventoryLinks(
                selectedItem.materialNumber,
                selectedItem.batchNumber,
              )}
            />
          </div>
        )}
      </Modal>
    </PageTemplate>
  );
}
