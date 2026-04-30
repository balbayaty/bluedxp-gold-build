/**
 * Hierarchical Analytics Dashboard
 *
 * Multi-layered breakdown visualization with:
 * - Interactive hierarchical tree
 * - Savings insights cards
 * - Drill-down capability
 * - Multi-dimensional views
 */

"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
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
  Tooltip,
  Legend,
  ResponsiveContainer,
  Treemap,
} from "recharts";
import type {
  HierarchicalBreakdown,
  SavingsInsight,
} from "@/lib/services/facility/utility-bills/hierarchicalAnalyticsService";

interface HierarchicalAnalyticsDashboardProps {
  facilityId?: string;
  warehouseId?: string;
  period?: { start: Date; end: Date };
}

export default function HierarchicalAnalyticsDashboard({
  facilityId,
  warehouseId,
  period,
}: HierarchicalAnalyticsDashboardProps) {
  const [breakdown, setBreakdown] = useState<HierarchicalBreakdown[]>([]);
  const [savingsInsights, setSavingsInsights] = useState<SavingsInsight[]>([]);
  const [selectedLevel, setSelectedLevel] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"tree" | "savings" | "comparison">(
    "tree",
  );

  useEffect(() => {
    loadData();
  }, [facilityId, warehouseId, period]);

  const loadData = async () => {
    setLoading(true);
    try {
      // Build hierarchical structure from warehouse data
      const structure = await buildHierarchicalStructure(
        facilityId,
        warehouseId,
      );

      // Get breakdown
      const breakdownResponse = await fetch(
        "/api/facility/utility-bills/hierarchical",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "breakdown",
            structure,
            period: period
              ? {
                  start: period.start.toISOString(),
                  end: period.end.toISOString(),
                }
              : undefined,
          }),
        },
      );

      const breakdownData = await breakdownResponse.json();
      if (breakdownData.success) {
        setBreakdown(breakdownData.data);
      }

      // Get savings insights
      const savingsResponse = await fetch(
        "/api/facility/utility-bills/hierarchical",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "savings",
            structure,
            period: period
              ? {
                  start: period.start.toISOString(),
                  end: period.end.toISOString(),
                }
              : undefined,
          }),
        },
      );

      const savingsData = await savingsResponse.json();
      if (savingsData.success) {
        setSavingsInsights(savingsData.data);
      }
    } catch (error) {
      console.error("Error loading hierarchical analytics:", error);
    } finally {
      setLoading(false);
    }
  };

  const buildHierarchicalStructure = async (
    facilityId?: string,
    warehouseId?: string,
  ): Promise<any[]> => {
    // This would fetch from WMS to build actual structure
    // For now, using sample structure based on your data
    return [
      {
        level: "area",
        id: "block-12",
        name: "Block 12",
        code: "BLK12",
        children: Array.from({ length: 13 }, (_, i) => ({
          level: "warehouse",
          id: `wh-${i + 1}`,
          name: `Block 12 WH ${String(i + 1).padStart(2, "0")}`,
          code: `BLK12-WH${String(i + 1).padStart(2, "0")}`,
        })),
      },
      {
        level: "area",
        id: "block-14",
        name: "Block 14",
        code: "BLK14",
        children: [
          {
            level: "warehouse",
            id: "wh-26",
            name: "Block 14 WH 26",
            code: "BLK14-WH26",
          },
          {
            level: "warehouse",
            id: "wh-27",
            name: "Block 14 WH 27",
            code: "BLK14-WH27",
          },
        ],
      },
      {
        level: "area",
        id: "block-s22-4",
        name: "Block S22-4",
        code: "BLK-S22-4",
        children: Array.from({ length: 8 }, (_, i) => ({
          level: "warehouse",
          id: `s22-wh-${i + 1}`,
          name: `Block S22-4 WH ${i + 1}`,
          code: `BLK-S22-4-WH${i + 1}`,
        })),
      },
    ];
  };

  const totalSavings = savingsInsights.reduce(
    (sum, i) => sum + i.potentialSavings.amount,
    0,
  );
  const annualSavings = savingsInsights.reduce(
    (sum, i) => sum + (i.potentialSavings.annualSavings || 0),
    0,
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-gray-800 rounded-lg shadow p-6"
        >
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Total Potential Savings
          </div>
          <div className="text-2xl font-bold text-green-600 mt-2">
            {totalSavings.toLocaleString("en-US", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}{" "}
            SAR
          </div>
          <div className="text-xs text-gray-500 mt-1">Per month</div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white dark:bg-gray-800 rounded-lg shadow p-6"
        >
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Annual Savings
          </div>
          <div className="text-2xl font-bold text-green-600 mt-2">
            {annualSavings.toLocaleString("en-US", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}{" "}
            SAR
          </div>
          <div className="text-xs text-gray-500 mt-1">Projected</div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white dark:bg-gray-800 rounded-lg shadow p-6"
        >
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Savings Opportunities
          </div>
          <div className="text-2xl font-bold text-blue-600 mt-2">
            {savingsInsights.length}
          </div>
          <div className="text-xs text-gray-500 mt-1">Insights identified</div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white dark:bg-gray-800 rounded-lg shadow p-6"
        >
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Warehouses Analyzed
          </div>
          <div className="text-2xl font-bold text-purple-600 mt-2">
            {breakdown.reduce(
              (sum, b) => sum + (b.children?.length || 0) + 1,
              0,
            )}
          </div>
          <div className="text-xs text-gray-500 mt-1">Across all levels</div>
        </motion.div>
      </div>

      {/* View Mode Tabs */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
        <div className="flex space-x-2">
          <button
            onClick={() => setViewMode("tree")}
            className={`px-4 py-2 rounded-lg transition ${
              viewMode === "tree"
                ? "bg-blue-600 text-white"
                : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
            }`}
          >
            Hierarchical Tree
          </button>
          <button
            onClick={() => setViewMode("savings")}
            className={`px-4 py-2 rounded-lg transition ${
              viewMode === "savings"
                ? "bg-blue-600 text-white"
                : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
            }`}
          >
            Savings Insights
          </button>
          <button
            onClick={() => setViewMode("comparison")}
            className={`px-4 py-2 rounded-lg transition ${
              viewMode === "comparison"
                ? "bg-blue-600 text-white"
                : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
            }`}
          >
            Comparison
          </button>
        </div>
      </div>

      {/* Hierarchical Tree View */}
      {viewMode === "tree" && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 className="text-xl font-bold mb-4">Hierarchical Breakdown</h3>
          <HierarchicalTreeView
            breakdown={breakdown}
            selectedLevel={selectedLevel}
            onSelectLevel={setSelectedLevel}
          />
        </div>
      )}

      {/* Savings Insights View */}
      {viewMode === "savings" && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 className="text-xl font-bold mb-4">
              Top Savings Opportunities
            </h3>
            <div className="space-y-4">
              {savingsInsights.slice(0, 10).map((insight, index) => (
                <SavingsInsightCard
                  key={insight.id}
                  insight={insight}
                  index={index}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Comparison View */}
      {viewMode === "comparison" && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 className="text-xl font-bold mb-4">Warehouse Comparison</h3>
          <ComparisonChart breakdown={breakdown} />
        </div>
      )}
    </div>
  );
}

function HierarchicalTreeView({
  breakdown,
  selectedLevel,
  onSelectLevel,
}: {
  breakdown: HierarchicalBreakdown[];
  selectedLevel: string | null;
  onSelectLevel: (id: string | null) => void;
}) {
  const renderNode = (node: HierarchicalBreakdown, level: number = 0) => {
    const isSelected = selectedLevel === node.id;
    const hasChildren = node.children && node.children.length > 0;

    return (
      <div key={node.id} className="ml-4">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          onClick={() => onSelectLevel(isSelected ? null : node.id)}
          className={`p-4 rounded-lg border-2 cursor-pointer transition ${
            isSelected
              ? "border-blue-600 bg-blue-50 dark:bg-blue-900/20"
              : "border-gray-200 dark:border-gray-700 hover:border-blue-300"
          }`}
        >
          <div className="flex items-center justify-between">
            <div>
              <div className="font-semibold text-lg">{node.name}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                {node.summary.totalBills} bills •{" "}
                {node.summary.totalAmount.toFixed(2)} SAR •{" "}
                {node.summary.totalConsumption.toFixed(0)} kWh
              </div>
              <div className="text-xs text-gray-500 mt-1">
                Efficiency: {node.summary.efficiency.toFixed(1)}% • Cost/Unit:{" "}
                {node.summary.costPerUnit.toFixed(3)} SAR
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm font-semibold text-green-600">
                {node.savings.length} opportunities
              </div>
              {node.savings.length > 0 && (
                <div className="text-xs text-gray-500">
                  {node.savings
                    .reduce((sum, s) => sum + s.potentialSavings.amount, 0)
                    .toFixed(2)}{" "}
                  SAR/month
                </div>
              )}
            </div>
          </div>
        </motion.div>

        {hasChildren && (isSelected || level === 0) && (
          <div className="mt-2">
            {node.children!.map((child) => renderNode(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-2">{breakdown.map((node) => renderNode(node))}</div>
  );
}

function SavingsInsightCard({
  insight,
  index,
}: {
  insight: SavingsInsight;
  index: number;
}) {
  const priorityColors = {
    critical: "bg-red-100 dark:bg-red-900/20 border-red-500",
    high: "bg-orange-100 dark:bg-orange-900/20 border-orange-500",
    medium: "bg-yellow-100 dark:bg-yellow-900/20 border-yellow-500",
    low: "bg-blue-100 dark:bg-blue-900/20 border-blue-500",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className={`p-4 rounded-lg border-2 ${priorityColors[insight.recommendations[0]?.priority || "low"]}`}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2 py-1 text-xs font-semibold rounded bg-blue-600 text-white">
              {insight.type.replace("-", " ").toUpperCase()}
            </span>
            <span
              className={`px-2 py-1 text-xs font-semibold rounded ${
                insight.recommendations[0]?.priority === "critical"
                  ? "bg-red-600 text-white"
                  : insight.recommendations[0]?.priority === "high"
                    ? "bg-orange-600 text-white"
                    : "bg-gray-600 text-white"
              }`}
            >
              {insight.recommendations[0]?.priority?.toUpperCase() || "MEDIUM"}
            </span>
          </div>
          <h4 className="font-bold text-lg mb-1">{insight.title}</h4>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
            {insight.description}
          </p>

          <div className="grid grid-cols-2 gap-4 mb-3">
            <div>
              <div className="text-xs text-gray-500">Potential Savings</div>
              <div className="text-lg font-bold text-green-600">
                {insight.potentialSavings.amount.toFixed(2)} SAR/month
              </div>
              {insight.potentialSavings.annualSavings && (
                <div className="text-xs text-gray-500">
                  {insight.potentialSavings.annualSavings.toFixed(2)} SAR/year
                </div>
              )}
            </div>
            <div>
              <div className="text-xs text-gray-500">Confidence</div>
              <div className="text-lg font-bold">{insight.confidence}%</div>
              {insight.estimatedROI && (
                <div className="text-xs text-gray-500">
                  ROI: {insight.estimatedROI}%
                </div>
              )}
            </div>
          </div>

          {insight.recommendations.length > 0 && (
            <div className="mt-3">
              <div className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Recommended Actions:
              </div>
              <ul className="list-disc list-inside space-y-1 text-sm">
                {insight.recommendations[0].implementationSteps.map(
                  (step, i) => (
                    <li key={i} className="text-gray-600 dark:text-gray-400">
                      {step}
                    </li>
                  ),
                )}
              </ul>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

function ComparisonChart({
  breakdown,
}: {
  breakdown: HierarchicalBreakdown[];
}) {
  // Flatten breakdown to get all warehouses
  const flattenWarehouses = (
    nodes: HierarchicalBreakdown[],
  ): HierarchicalBreakdown[] => {
    const warehouses: HierarchicalBreakdown[] = [];
    for (const node of nodes) {
      if (node.level === "warehouse") {
        warehouses.push(node);
      }
      if (node.children) {
        warehouses.push(...flattenWarehouses(node.children));
      }
    }
    return warehouses;
  };

  const warehouses = flattenWarehouses(breakdown);
  const chartData = warehouses
    .map((w) => ({
      name: w.name,
      amount: w.summary.totalAmount,
      consumption: w.summary.totalConsumption,
      costPerUnit: w.summary.costPerUnit,
      efficiency: w.summary.efficiency,
    }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 20); // Top 20

  const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"];

  return (
    <div className="space-y-6">
      <ResponsiveContainer width="100%" height={400}>
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="name"
            angle={-45}
            textAnchor="end"
            height={100}
            tick={{ fontSize: 10 }}
          />
          <YAxis />
          <Tooltip />
          <Legend />
          <Bar dataKey="amount" fill="#3b82f6" name="Total Amount (SAR)" />
          <Bar dataKey="consumption" fill="#10b981" name="Consumption (kWh)" />
        </BarChart>
      </ResponsiveContainer>

      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="name"
            angle={-45}
            textAnchor="end"
            height={100}
            tick={{ fontSize: 10 }}
          />
          <YAxis />
          <Tooltip />
          <Legend />
          <Bar
            dataKey="costPerUnit"
            fill="#f59e0b"
            name="Cost per Unit (SAR/kWh)"
          />
          <Bar dataKey="efficiency" fill="#8b5cf6" name="Efficiency (%)" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
