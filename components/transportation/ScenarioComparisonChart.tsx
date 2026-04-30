/**
 * Scenario Comparison Chart Component
 *
 * Interactive charts for scenario comparison
 * Modern, professional, sexy UI with full drill-down capabilities
 */

"use client";

import { useState } from "react";
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
} from "lucide-react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from "recharts";
import type { ScenarioResult } from "@/lib/services/transportation";

interface ScenarioComparisonChartProps {
  scenarios: ScenarioResult[];
  baseScenario: ScenarioResult;
  metrics?: string[];
  chartType?: "BAR" | "LINE" | "RADAR" | "COMPARISON";
}

export default function ScenarioComparisonChart({
  scenarios,
  baseScenario,
  metrics = ["COST", "TIME", "EMISSIONS", "RELIABILITY"],
  chartType = "BAR",
}: ScenarioComparisonChartProps) {
  const [selectedMetrics, setSelectedMetrics] = useState<string[]>(metrics);
  const [selectedChartType, setSelectedChartType] = useState(chartType);

  // Prepare data for charts
  const barChartData = scenarios.map((scenario) => ({
    name: scenario.scenarioName,
    Cost: scenario.metrics?.totalCost ?? 0,
    Time: scenario.metrics?.totalTime ?? 0,
    Emissions: scenario.metrics?.totalCO2e ?? 0,
    Reliability: scenario.metrics?.reliability ?? 0,
  }));

  const comparisonData = scenarios.map((scenario) => ({
    name: scenario.scenarioName,
    "vs Base Cost": scenario.comparison?.vsBaseScenario.costPercentage || 0,
    "vs Base Time": scenario.comparison?.vsBaseScenario.timePercentage || 0,
    "vs Base Emissions":
      scenario.comparison?.vsBaseScenario.emissionsPercentage || 0,
  }));

  const radarData = scenarios.map((scenario) => ({
    scenario: scenario.scenarioName,
    Cost: (1 - scenario.metrics.totalCost / 100000) * 100, // Normalized
    Time: (1 - scenario.metrics.totalTime / 30) * 100, // Normalized
    Reliability: scenario.metrics.reliability,
    Efficiency: scenario.metrics.capacityUtilization,
  }));

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-bold flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Scenario Comparison
          </h3>
          <p className="text-sm text-gray-500 mt-1">
            Visual comparison of all scenarios
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Chart Type Selector */}
          <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
            {[
              { id: "BAR", label: "Bar", icon: BarChart3 },
              { id: "LINE", label: "Line", icon: TrendingUp },
              { id: "RADAR", label: "Radar", icon: Target },
              { id: "COMPARISON", label: "Comparison", icon: TrendingUp },
            ].map((type) => (
              <button
                key={type.id}
                onClick={() => setSelectedChartType(type.id as any)}
                className={`px-3 py-1.5 rounded text-sm font-medium transition ${
                  selectedChartType === type.id
                    ? "bg-blue-500 text-white"
                    : "text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600"
                }`}
              >
                <type.icon className="w-4 h-4 inline mr-1" />
                {type.label}
              </button>
            ))}
          </div>
          <button className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition">
            <Download className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Metrics Filter */}
      <div className="mb-6 flex items-center gap-2 flex-wrap">
        <Filter className="w-4 h-4 text-gray-500" />
        {["COST", "TIME", "EMISSIONS", "RELIABILITY"].map((metric) => (
          <button
            key={metric}
            onClick={() => {
              setSelectedMetrics((prev) =>
                prev.includes(metric)
                  ? prev.filter((m) => m !== metric)
                  : [...prev, metric],
              );
            }}
            className={`px-3 py-1 rounded text-sm font-medium transition ${
              selectedMetrics.includes(metric)
                ? "bg-blue-500 text-white"
                : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
            }`}
          >
            {metric}
          </button>
        ))}
      </div>

      {/* Charts */}
      <div className="h-[500px]">
        {selectedChartType === "BAR" && (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={barChartData}>
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
              <Legend />
              {selectedMetrics.includes("COST") && (
                <Bar dataKey="Cost" fill="#3b82f6" name="Cost ($)" />
              )}
              {selectedMetrics.includes("TIME") && (
                <Bar dataKey="Time" fill="#10b981" name="Time (days)" />
              )}
              {selectedMetrics.includes("EMISSIONS") && (
                <Bar dataKey="Emissions" fill="#8b5cf6" name="CO2e (kg)" />
              )}
              {selectedMetrics.includes("RELIABILITY") && (
                <Bar
                  dataKey="Reliability"
                  fill="#f59e0b"
                  name="Reliability (%)"
                />
              )}
            </BarChart>
          </ResponsiveContainer>
        )}

        {selectedChartType === "LINE" && (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={barChartData}>
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
              <Legend />
              {selectedMetrics.includes("COST") && (
                <Line
                  type="monotone"
                  dataKey="Cost"
                  stroke="#3b82f6"
                  name="Cost ($)"
                  strokeWidth={2}
                />
              )}
              {selectedMetrics.includes("TIME") && (
                <Line
                  type="monotone"
                  dataKey="Time"
                  stroke="#10b981"
                  name="Time (days)"
                  strokeWidth={2}
                />
              )}
              {selectedMetrics.includes("EMISSIONS") && (
                <Line
                  type="monotone"
                  dataKey="Emissions"
                  stroke="#8b5cf6"
                  name="CO2e (kg)"
                  strokeWidth={2}
                />
              )}
              {selectedMetrics.includes("RELIABILITY") && (
                <Line
                  type="monotone"
                  dataKey="Reliability"
                  stroke="#f59e0b"
                  name="Reliability (%)"
                  strokeWidth={2}
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        )}

        {selectedChartType === "RADAR" && (
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart data={radarData[0]}>
              <PolarGrid stroke="#e5e7eb" />
              <PolarAngleAxis dataKey="scenario" stroke="#6b7280" />
              <PolarRadiusAxis angle={90} domain={[0, 100]} stroke="#6b7280" />
              <Radar
                name="Scenario"
                dataKey="Cost"
                stroke="#3b82f6"
                fill="#3b82f6"
                fillOpacity={0.6}
              />
              <Radar
                name="Scenario"
                dataKey="Time"
                stroke="#10b981"
                fill="#10b981"
                fillOpacity={0.6}
              />
              <Radar
                name="Scenario"
                dataKey="Reliability"
                stroke="#8b5cf6"
                fill="#8b5cf6"
                fillOpacity={0.6}
              />
              <Tooltip />
              <Legend />
            </RadarChart>
          </ResponsiveContainer>
        )}

        {selectedChartType === "COMPARISON" && (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={comparisonData}>
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
              <Legend />
              <Bar
                dataKey="vs Base Cost"
                fill="#3b82f6"
                name="Cost vs Base (%)"
              />
              <Bar
                dataKey="vs Base Time"
                fill="#10b981"
                name="Time vs Base (%)"
              />
              <Bar
                dataKey="vs Base Emissions"
                fill="#8b5cf6"
                name="Emissions vs Base (%)"
              />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Summary Table */}
      <div className="mt-6 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 dark:border-gray-700">
              <th className="text-left p-3 font-medium">Scenario</th>
              {selectedMetrics.includes("COST") && (
                <th className="text-right p-3 font-medium">Cost</th>
              )}
              {selectedMetrics.includes("TIME") && (
                <th className="text-right p-3 font-medium">Time</th>
              )}
              {selectedMetrics.includes("EMISSIONS") && (
                <th className="text-right p-3 font-medium">Emissions</th>
              )}
              {selectedMetrics.includes("RELIABILITY") && (
                <th className="text-right p-3 font-medium">Reliability</th>
              )}
              <th className="text-right p-3 font-medium">Risk</th>
            </tr>
          </thead>
          <tbody>
            {scenarios.map((scenario) => (
              <tr
                key={scenario.scenarioId}
                className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
              >
                <td className="p-3 font-medium">{scenario.scenarioName}</td>
                {selectedMetrics.includes("COST") && (
                  <td className="text-right p-3">
                    ${scenario.metrics.totalCost.toLocaleString()}
                  </td>
                )}
                {selectedMetrics.includes("TIME") && (
                  <td className="text-right p-3">
                    {scenario.metrics.totalTime.toFixed(1)} days
                  </td>
                )}
                {selectedMetrics.includes("EMISSIONS") && (
                  <td className="text-right p-3">
                    {(scenario.metrics?.totalCO2e ?? 0).toFixed(1)} kg
                  </td>
                )}
                {selectedMetrics.includes("RELIABILITY") && (
                  <td className="text-right p-3">
                    {scenario.metrics.reliability.toFixed(1)}%
                  </td>
                )}
                <td className="text-right p-3">
                  <span
                    className={`px-2 py-1 rounded text-xs font-medium ${
                      scenario.riskAssessment.overallRisk === "LOW"
                        ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
                        : scenario.riskAssessment.overallRisk === "MEDIUM"
                          ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300"
                          : scenario.riskAssessment.overallRisk === "HIGH"
                            ? "bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300"
                            : "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300"
                    }`}
                  >
                    {scenario.riskAssessment.overallRisk}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
