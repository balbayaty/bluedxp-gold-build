/**
 * SKU Analytics Dashboard Component
 * Comprehensive analytics and insights for SKU performance
 * 4IR & 5IR Aligned • Real-time Analytics
 */

"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { SKU, SKUAnalytics } from "@/types/sku";
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
  AreaChart,
  Area,
} from "recharts";
import CurrencyDisplay from "@/components/CurrencyDisplay";

interface SKUAnalyticsDashboardProps {
  sku: SKU;
  analytics: SKUAnalytics;
  onRefresh?: () => Promise<void>;
}

export default function SKUAnalyticsDashboard({
  sku,
  analytics,
  onRefresh,
}: SKUAnalyticsDashboardProps) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [timeRange, setTimeRange] = useState<"7d" | "30d" | "90d" | "1y">(
    "30d",
  );

  const handleRefresh = async () => {
    if (onRefresh) {
      setIsRefreshing(true);
      try {
        await onRefresh();
      } finally {
        setIsRefreshing(false);
      }
    }
  };

  // Stock level data
  const stockData = [
    { name: "Total Stock", value: analytics.totalStock, color: "#06b6d4" },
    { name: "Reserved", value: analytics.reservedStock, color: "#f59e0b" },
    { name: "Available", value: analytics.availableStock, color: "#10b981" },
  ];

  // ABC Classification data
  const abcData = [
    {
      name: "A Items",
      value: analytics.abcClassification === "A" ? 1 : 0,
      color: "#ef4444",
    },
    {
      name: "B Items",
      value: analytics.abcClassification === "B" ? 1 : 0,
      color: "#f59e0b",
    },
    {
      name: "C Items",
      value: analytics.abcClassification === "C" ? 1 : 0,
      color: "#10b981",
    },
  ];

  // Velocity data
  const velocityData = [
    {
      name: "Fast",
      value: analytics.velocity === "FAST" ? 1 : 0,
      color: "#10b981",
    },
    {
      name: "Medium",
      value: analytics.velocity === "MEDIUM" ? 1 : 0,
      color: "#f59e0b",
    },
    {
      name: "Slow",
      value: analytics.velocity === "SLOW" ? 1 : 0,
      color: "#ef4444",
    },
  ];

  // Stock utilization
  const utilizationPercentage = sku.maxStock
    ? (analytics.totalStock / sku.maxStock) * 100
    : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-white">{sku.skuCode}</h2>
          <p className="text-[#9ca3af]">{sku.materialDescription}</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value as any)}
            className="bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-sm text-white"
          >
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
            <option value="90d">Last 90 Days</option>
            <option value="1y">Last Year</option>
          </select>
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="px-4 py-2 bg-cyan-500 hover:bg-cyan-600 rounded-lg text-white text-sm font-medium disabled:opacity-50"
          >
            <i
              className={`ri-refresh-line ${isRefreshing ? "animate-spin" : ""}`}
            ></i>
          </button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 bg-white/5 border border-white/10 rounded-lg"
        >
          <div className="text-sm text-[#9ca3af] mb-1">Total Stock</div>
          <div className="text-2xl font-bold text-white">
            {analytics.totalStock.toLocaleString()}
          </div>
          <div className="text-xs text-[#9ca3af] mt-1">{sku.baseUnit}</div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="p-4 bg-white/5 border border-white/10 rounded-lg"
        >
          <div className="text-sm text-[#9ca3af] mb-1">Available Stock</div>
          <div className="text-2xl font-bold text-green-400">
            {analytics.availableStock.toLocaleString()}
          </div>
          <div className="text-xs text-[#9ca3af] mt-1">{sku.baseUnit}</div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="p-4 bg-white/5 border border-white/10 rounded-lg"
        >
          <div className="text-sm text-[#9ca3af] mb-1">Total Value</div>
          <div className="text-2xl font-bold text-cyan-400">
            <CurrencyDisplay
              value={analytics.totalValue}
              currency={sku.currency}
            />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="p-4 bg-white/5 border border-white/10 rounded-lg"
        >
          <div className="text-sm text-[#9ca3af] mb-1">Average Cost</div>
          <div className="text-2xl font-bold text-white">
            <CurrencyDisplay
              value={analytics.averageCost}
              currency={sku.currency}
            />
          </div>
        </motion.div>
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Stock Breakdown */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="p-6 bg-white/5 border border-white/10 rounded-lg"
        >
          <h3 className="text-lg font-semibold text-white mb-4">
            Stock Breakdown
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={stockData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) =>
                  `${name}: ${(percent * 100).toFixed(0)}%`
                }
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {stockData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <RechartsTooltip />
            </PieChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Stock Utilization */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="p-6 bg-white/5 border border-white/10 rounded-lg"
        >
          <h3 className="text-lg font-semibold text-white mb-4">
            Stock Utilization
          </h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-[#9ca3af]">Current Stock</span>
                <span className="text-white font-medium">
                  {analytics.totalStock} / {sku.maxStock || "N/A"}
                </span>
              </div>
              <div className="w-full bg-white/10 rounded-full h-3">
                <div
                  className={`h-3 rounded-full ${
                    utilizationPercentage > 90
                      ? "bg-red-500"
                      : utilizationPercentage > 70
                        ? "bg-yellow-500"
                        : "bg-green-500"
                  }`}
                  style={{ width: `${Math.min(utilizationPercentage, 100)}%` }}
                ></div>
              </div>
              <div className="text-xs text-[#9ca3af] mt-1">
                {utilizationPercentage.toFixed(1)}% of max stock
              </div>
            </div>

            {sku.reorderPoint && (
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-[#9ca3af]">Reorder Point</span>
                  <span className="text-white font-medium">
                    {sku.reorderPoint}
                  </span>
                </div>
                <div className="w-full bg-white/10 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${
                      analytics.totalStock <= sku.reorderPoint
                        ? "bg-red-500"
                        : "bg-cyan-500"
                    }`}
                    style={{
                      width: `${Math.min((sku.reorderPoint / (sku.maxStock || 1)) * 100, 100)}%`,
                    }}
                  ></div>
                </div>
              </div>
            )}

            {sku.safetyStock && (
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-[#9ca3af]">Safety Stock</span>
                  <span className="text-white font-medium">
                    {sku.safetyStock}
                  </span>
                </div>
                <div className="w-full bg-white/10 rounded-full h-2">
                  <div
                    className="h-2 rounded-full bg-blue-500"
                    style={{
                      width: `${Math.min((sku.safetyStock / (sku.maxStock || 1)) * 100, 100)}%`,
                    }}
                  ></div>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ABC Classification */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-6 bg-white/5 border border-white/10 rounded-lg"
        >
          <h3 className="text-lg font-semibold text-white mb-4">
            ABC Classification
          </h3>
          <div className="text-center">
            <div
              className={`text-6xl font-bold mb-2 ${
                analytics.abcClassification === "A"
                  ? "text-red-400"
                  : analytics.abcClassification === "B"
                    ? "text-yellow-400"
                    : "text-green-400"
              }`}
            >
              {analytics.abcClassification}
            </div>
            <p className="text-sm text-[#9ca3af]">
              {analytics.abcClassification === "A"
                ? "High Value - Priority Management"
                : analytics.abcClassification === "B"
                  ? "Medium Value - Standard Management"
                  : "Low Value - Basic Management"}
            </p>
          </div>
        </motion.div>

        {/* Velocity */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="p-6 bg-white/5 border border-white/10 rounded-lg"
        >
          <h3 className="text-lg font-semibold text-white mb-4">
            Movement Velocity
          </h3>
          <div className="text-center">
            <div
              className={`text-4xl font-bold mb-2 ${
                analytics.velocity === "FAST"
                  ? "text-green-400"
                  : analytics.velocity === "MEDIUM"
                    ? "text-yellow-400"
                    : "text-red-400"
              }`}
            >
              {analytics.velocity}
            </div>
            {analytics.turnoverRate && (
              <p className="text-sm text-[#9ca3af] mt-2">
                Turnover Rate: {analytics.turnoverRate.toFixed(2)}x
              </p>
            )}
            {analytics.daysOnHand && (
              <p className="text-sm text-[#9ca3af]">
                Days on Hand: {analytics.daysOnHand.toFixed(0)}
              </p>
            )}
          </div>
        </motion.div>

        {/* Performance Metrics */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="p-6 bg-white/5 border border-white/10 rounded-lg"
        >
          <h3 className="text-lg font-semibold text-white mb-4">
            Performance Metrics
          </h3>
          <div className="space-y-3">
            {analytics.turnoverRate && (
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-[#9ca3af]">Turnover Rate</span>
                  <span className="text-white font-medium">
                    {analytics.turnoverRate.toFixed(2)}x
                  </span>
                </div>
                <div className="w-full bg-white/10 rounded-full h-2">
                  <div
                    className="h-2 rounded-full bg-cyan-500"
                    style={{
                      width: `${Math.min((analytics.turnoverRate / 12) * 100, 100)}%`,
                    }}
                  ></div>
                </div>
              </div>
            )}
            {analytics.daysOnHand && (
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-[#9ca3af]">Days on Hand</span>
                  <span className="text-white font-medium">
                    {analytics.daysOnHand.toFixed(0)} days
                  </span>
                </div>
                <div className="w-full bg-white/10 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${
                      analytics.daysOnHand > 90
                        ? "bg-red-500"
                        : analytics.daysOnHand > 30
                          ? "bg-yellow-500"
                          : "bg-green-500"
                    }`}
                    style={{
                      width: `${Math.min((analytics.daysOnHand / 180) * 100, 100)}%`,
                    }}
                  ></div>
                </div>
              </div>
            )}
            {analytics.movementFrequency && (
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-[#9ca3af]">Movement Frequency</span>
                  <span className="text-white font-medium">
                    {analytics.movementFrequency}/month
                  </span>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* Additional Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-6 bg-white/5 border border-white/10 rounded-lg">
          <h3 className="text-lg font-semibold text-white mb-4">
            Stock Status
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-[#9ca3af]">Reserved Stock</span>
              <span className="text-white font-medium">
                {analytics.reservedStock.toLocaleString()} {sku.baseUnit}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#9ca3af]">Available Stock</span>
              <span className="text-green-400 font-medium">
                {analytics.availableStock.toLocaleString()} {sku.baseUnit}
              </span>
            </div>
            {sku.reorderPoint && (
              <div className="flex justify-between">
                <span className="text-[#9ca3af]">Reorder Point</span>
                <span
                  className={`font-medium ${
                    analytics.totalStock <= sku.reorderPoint
                      ? "text-red-400"
                      : "text-white"
                  }`}
                >
                  {sku.reorderPoint} {sku.baseUnit}
                  {analytics.totalStock <= sku.reorderPoint && (
                    <span className="ml-2 text-xs">⚠️ Reorder Needed</span>
                  )}
                </span>
              </div>
            )}
            {analytics.lastMovementDate && (
              <div className="flex justify-between">
                <span className="text-[#9ca3af]">Last Movement</span>
                <span className="text-white font-medium">
                  {new Date(analytics.lastMovementDate).toLocaleDateString()}
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="p-6 bg-white/5 border border-white/10 rounded-lg">
          <h3 className="text-lg font-semibold text-white mb-4">
            Costing Information
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-[#9ca3af]">Average Cost</span>
              <span className="text-white font-medium">
                <CurrencyDisplay
                  value={analytics.averageCost}
                  currency={sku.currency}
                />
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#9ca3af]">Total Value</span>
              <span className="text-cyan-400 font-medium">
                <CurrencyDisplay
                  value={analytics.totalValue}
                  currency={sku.currency}
                />
              </span>
            </div>
            {sku.standardCost && (
              <div className="flex justify-between">
                <span className="text-[#9ca3af]">Standard Cost</span>
                <span className="text-white font-medium">
                  <CurrencyDisplay
                    value={sku.standardCost}
                    currency={sku.currency}
                  />
                </span>
              </div>
            )}
            {sku.lastCost && (
              <div className="flex justify-between">
                <span className="text-[#9ca3af]">Last Cost</span>
                <span className="text-white font-medium">
                  <CurrencyDisplay
                    value={sku.lastCost}
                    currency={sku.currency}
                  />
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
