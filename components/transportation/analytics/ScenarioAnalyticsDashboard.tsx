/**
 * Scenario Analytics Dashboard Component
 *
 * Comprehensive analytics for scenario simulation
 * Modern, professional, sexy UI with full drill-down capabilities
 */

"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  BarChart3,
  TrendingUp,
  DollarSign,
  Clock,
  Activity,
  Target,
  Download,
  Filter,
  Calendar,
  AlertTriangle,
  CheckCircle,
} from "lucide-react";
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
  AreaChart,
  Area,
} from "recharts";
import type {
  ScenarioResult,
  ScenarioSimulation,
} from "@/lib/services/transportation";

interface ScenarioAnalyticsDashboardProps {
  simulations: ScenarioSimulation[];
  onDrillDown?: (simulationId: string) => void;
}

const COLORS = [
  "#3b82f6",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#ec4899",
];

export default function ScenarioAnalyticsDashboard({
  simulations,
  onDrillDown,
}: ScenarioAnalyticsDashboardProps) {
  const [dateRange, setDateRange] = useState<"7D" | "30D" | "90D" | "ALL">(
    "30D",
  );
  const [selectedMetric, setSelectedMetric] = useState<
    "COST" | "TIME" | "EMISSIONS" | "RELIABILITY"
  >("COST");

  // Calculate analytics
  const analytics = calculateAnalytics(simulations, dateRange);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Scenario Analytics</h2>
          <p className="text-sm text-gray-500 mt-1">
            Comprehensive insights into scenario performance
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* Date Range */}
          <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
            {["7D", "30D", "90D", "ALL"].map((range) => (
              <button
                key={range}
                onClick={() => setDateRange(range as any)}
                className={`px-3 py-1.5 rounded text-sm font-medium transition ${
                  dateRange === range
                    ? "bg-blue-500 text-white"
                    : "text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600"
                }`}
              >
                {range}
              </button>
            ))}
          </div>
          <button className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition flex items-center gap-2">
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Total Simulations"
          value={analytics.totalSimulations}
          icon={BarChart3}
          color="blue"
          trend={analytics.simulationsTrend}
        />
        <MetricCard
          title="Avg Cost Savings"
          value={`${analytics.avgCostSavings.toFixed(1)}%`}
          icon={DollarSign}
          color="green"
          trend={analytics.costTrend}
        />
        <MetricCard
          title="Avg Time Reduction"
          value={`${analytics.avgTimeReduction.toFixed(1)}%`}
          icon={Clock}
          color="purple"
          trend={analytics.timeTrend}
        />
        <MetricCard
          title="Success Rate"
          value={`${analytics.successRate.toFixed(1)}%`}
          icon={Target}
          color="orange"
          trend={analytics.successTrend}
        />
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Cost Analysis */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
            <DollarSign className="w-5 h-5" />
            Cost Analysis
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={analytics.costData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="name" stroke="#6b7280" />
              <YAxis stroke="#6b7280" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "rgba(255, 255, 255, 0.95)",
                  border: "1px solid #e5e7eb",
                  borderRadius: "8px",
                }}
              />
              <Area
                type="monotone"
                dataKey="cost"
                stroke="#3b82f6"
                fill="#3b82f6"
                fillOpacity={0.2}
              />
              <Area
                type="monotone"
                dataKey="savings"
                stroke="#10b981"
                fill="#10b981"
                fillOpacity={0.2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Time Analysis */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Time Analysis
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={analytics.timeData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="name" stroke="#6b7280" />
              <YAxis stroke="#6b7280" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "rgba(255, 255, 255, 0.95)",
                  border: "1px solid #e5e7eb",
                  borderRadius: "8px",
                }}
              />
              <Line
                type="monotone"
                dataKey="time"
                stroke="#8b5cf6"
                strokeWidth={2}
              />
              <Line
                type="monotone"
                dataKey="reduction"
                stroke="#10b981"
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Scenario Distribution */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-bold mb-4">Scenario Distribution</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={analytics.scenarioDistribution}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) =>
                  `${name} ${(percent * 100).toFixed(0)}%`
                }
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {analytics.scenarioDistribution.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Risk Distribution */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-bold mb-4">Risk Distribution</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={analytics.riskDistribution}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="name" stroke="#6b7280" />
              <YAxis stroke="#6b7280" />
              <Tooltip />
              <Bar dataKey="value" fill="#f59e0b" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Success Rate */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-bold mb-4">Success Metrics</h3>
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Successful
                </span>
                <span className="font-medium">
                  {analytics.successRate.toFixed(1)}%
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div
                  className="bg-green-500 h-2 rounded-full"
                  style={{ width: `${analytics.successRate}%` }}
                />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Needs Review
                </span>
                <span className="font-medium">
                  {analytics.reviewRate.toFixed(1)}%
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div
                  className="bg-yellow-500 h-2 rounded-full"
                  style={{ width: `${analytics.reviewRate}%` }}
                />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Failed
                </span>
                <span className="font-medium">
                  {analytics.failedRate.toFixed(1)}%
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div
                  className="bg-red-500 h-2 rounded-full"
                  style={{ width: `${analytics.failedRate}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Top Performers */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-bold mb-4">Top Performing Scenarios</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="text-left p-3 font-medium">Scenario</th>
                <th className="text-right p-3 font-medium">Cost Savings</th>
                <th className="text-right p-3 font-medium">Time Reduction</th>
                <th className="text-right p-3 font-medium">
                  Emissions Reduction
                </th>
                <th className="text-right p-3 font-medium">Reliability</th>
                <th className="text-center p-3 font-medium">Risk</th>
                <th className="text-center p-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {analytics.topPerformers.map((scenario, idx) => (
                <tr
                  key={idx}
                  className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition cursor-pointer"
                  onClick={() => onDrillDown?.(scenario.id)}
                >
                  <td className="p-3 font-medium">{scenario.name}</td>
                  <td className="text-right p-3 text-green-600 dark:text-green-400">
                    {scenario.costSavings.toFixed(1)}%
                  </td>
                  <td className="text-right p-3 text-blue-600 dark:text-blue-400">
                    {scenario.timeReduction.toFixed(1)}%
                  </td>
                  <td className="text-right p-3 text-purple-600 dark:text-purple-400">
                    {scenario.emissionsReduction.toFixed(1)}%
                  </td>
                  <td className="text-right p-3">
                    {scenario.reliability.toFixed(1)}%
                  </td>
                  <td className="text-center p-3">
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium ${
                        scenario.risk === "LOW"
                          ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
                          : scenario.risk === "MEDIUM"
                            ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300"
                            : "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300"
                      }`}
                    >
                      {scenario.risk}
                    </span>
                  </td>
                  <td className="text-center p-3">
                    <button className="text-blue-500 hover:text-blue-600 transition">
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
  );
}

function MetricCard({ title, value, icon: Icon, color, trend }: any) {
  const colorClasses = {
    blue: "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400",
    green:
      "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-600 dark:text-green-400",
    purple:
      "bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800 text-purple-600 dark:text-purple-400",
    orange:
      "bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800 text-orange-600 dark:text-orange-400",
  };

  return (
    <div
      className={`rounded-lg p-4 border ${colorClasses[color as keyof typeof colorClasses]}`}
    >
      <div className="flex items-center gap-2 mb-2">
        <Icon className="w-4 h-4" />
        <span className="text-sm font-medium">{title}</span>
      </div>
      <div className="text-2xl font-bold mb-1">{value}</div>
      {trend && (
        <div className="flex items-center gap-1 text-xs">
          <TrendingUp className="w-3 h-3" />
          <span>
            {trend > 0 ? "+" : ""}
            {trend.toFixed(1)}%
          </span>
        </div>
      )}
    </div>
  );
}

function calculateAnalytics(
  simulations: ScenarioSimulation[],
  dateRange: string,
) {
  // Filter by date range
  const now = new Date();
  const daysAgo =
    dateRange === "7D"
      ? 7
      : dateRange === "30D"
        ? 30
        : dateRange === "90D"
          ? 90
          : Infinity;
  const filtered = simulations.filter((s) => {
    const created = new Date(s.createdAt);
    return now.getTime() - created.getTime() <= daysAgo * 24 * 60 * 60 * 1000;
  });

  // Calculate metrics
  const totalSimulations = filtered.length;
  const successful = filtered.filter((s) => s.status === "COMPLETED").length;
  const successRate =
    totalSimulations > 0 ? (successful / totalSimulations) * 100 : 0;

  // Calculate averages
  let totalCostSavings = 0;
  let totalTimeReduction = 0;
  let costCount = 0;
  let timeCount = 0;

  filtered.forEach((sim) => {
    sim.scenarios.forEach((scenario) => {
      if (scenario.comparison?.vsBaseScenario) {
        const costPct = scenario.comparison.vsBaseScenario.costPercentage;
        const timePct = scenario.comparison.vsBaseScenario.timePercentage;

        if (costPct < 0) {
          totalCostSavings += Math.abs(costPct);
          costCount++;
        }
        if (timePct < 0) {
          totalTimeReduction += Math.abs(timePct);
          timeCount++;
        }
      }
    });
  });

  const avgCostSavings = costCount > 0 ? totalCostSavings / costCount : 0;
  const avgTimeReduction = timeCount > 0 ? totalTimeReduction / timeCount : 0;

  // Generate chart data
  const costData = filtered.slice(0, 10).map((sim, idx) => ({
    name: `Sim ${idx + 1}`,
    cost: sim.scenarios[0]?.metrics.totalCost || 0,
    savings: Math.abs(
      sim.scenarios[0]?.comparison?.vsBaseScenario.costPercentage || 0,
    ),
  }));

  const timeData = filtered.slice(0, 10).map((sim, idx) => ({
    name: `Sim ${idx + 1}`,
    time: sim.scenarios[0]?.metrics.totalTime || 0,
    reduction: Math.abs(
      sim.scenarios[0]?.comparison?.vsBaseScenario.timePercentage || 0,
    ),
  }));

  // Scenario distribution
  const scenarioTypes = new Map<string, number>();
  filtered.forEach((sim) => {
    sim.scenarios.forEach((sc) => {
      const type = sc.scenarioName.split(" ")[0] || "Other";
      scenarioTypes.set(type, (scenarioTypes.get(type) || 0) + 1);
    });
  });

  const scenarioDistribution = Array.from(scenarioTypes.entries()).map(
    ([name, value]) => ({
      name,
      value,
    }),
  );

  // Risk distribution
  const riskCounts = { LOW: 0, MEDIUM: 0, HIGH: 0, CRITICAL: 0 };
  filtered.forEach((sim) => {
    sim.scenarios.forEach((sc) => {
      const risk = sc.riskAssessment.overallRisk;
      if (risk in riskCounts) {
        riskCounts[risk as keyof typeof riskCounts]++;
      }
    });
  });

  const riskDistribution = Object.entries(riskCounts).map(([name, value]) => ({
    name,
    value,
  }));

  // Top performers
  const allScenarios = filtered.flatMap((sim) =>
    sim.scenarios.map((sc) => ({
      id: sim.id,
      name: sc.scenarioName,
      costSavings: Math.abs(sc.comparison?.vsBaseScenario.costPercentage || 0),
      timeReduction: Math.abs(
        sc.comparison?.vsBaseScenario.timePercentage || 0,
      ),
      emissionsReduction: Math.abs(
        sc.comparison?.vsBaseScenario.emissionsPercentage || 0,
      ),
      reliability: sc.metrics.reliability,
      risk: sc.riskAssessment.overallRisk,
    })),
  );

  const topPerformers = allScenarios
    .sort(
      (a, b) =>
        b.costSavings + b.timeReduction - (a.costSavings + a.timeReduction),
    )
    .slice(0, 10);

  return {
    totalSimulations,
    avgCostSavings,
    avgTimeReduction,
    successRate,
    reviewRate: ((filtered.length - successful) / totalSimulations) * 100,
    failedRate: 0,
    simulationsTrend: 0,
    costTrend: avgCostSavings,
    timeTrend: avgTimeReduction,
    successTrend: successRate,
    costData,
    timeData,
    scenarioDistribution,
    riskDistribution,
    topPerformers,
  };
}
