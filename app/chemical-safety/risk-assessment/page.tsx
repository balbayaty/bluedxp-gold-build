/**
 * Chemical Risk Assessment Module
 * Comprehensive risk assessment with scenarios, controls, and emergency procedures
 */

"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import PageTemplate from "@/components/PageTemplate";
import Modal from "@/components/Modal";
import { RiskLevel, RiskAssessment } from "@/types/chemical";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
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

type TabType = "assessments" | "scenarios" | "matrix" | "trends";

export default function ChemicalRiskAssessmentPage() {
  const [activeTab, setActiveTab] = useState<TabType>("assessments");

  const tabs = [
    {
      id: "assessments" as TabType,
      label: "Risk Assessments",
      icon: "ri-file-list-3-line",
    },
    {
      id: "scenarios" as TabType,
      label: "Risk Scenarios",
      icon: "ri-file-edit-line",
    },
    { id: "matrix" as TabType, label: "Risk Matrix", icon: "ri-table-line" },
    {
      id: "trends" as TabType,
      label: "Risk Trends",
      icon: "ri-line-chart-line",
    },
  ];

  return (
    <PageTemplate
      title="Risk Assessment"
      description="Comprehensive risk assessment with scenarios, controls, and emergency procedures"
      icon="ri-shield-cross-line"
    >
      <div className="space-y-6">
        {/* Tabs */}
        <div className="flex items-center gap-2 border-b border-gray-700">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-3 flex items-center gap-2 font-medium transition ${
                activeTab === tab.id
                  ? "text-cyan-400 border-b-2 border-cyan-400"
                  : "text-gray-400 hover:text-gray-300"
              }`}
            >
              <i className={tab.icon}></i>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          {activeTab === "assessments" && (
            <motion.div
              key="assessments"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <RiskAssessmentsTab />
            </motion.div>
          )}

          {activeTab === "scenarios" && (
            <motion.div
              key="scenarios"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <RiskScenariosTab />
            </motion.div>
          )}

          {activeTab === "matrix" && (
            <motion.div
              key="matrix"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <RiskMatrixTab />
            </motion.div>
          )}

          {activeTab === "trends" && (
            <motion.div
              key="trends"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <RiskTrendsTab />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </PageTemplate>
  );
}

// ============================================================================
// RISK ASSESSMENTS TAB
// ============================================================================

function RiskAssessmentsTab() {
  const [selectedAssessment, setSelectedAssessment] =
    useState<RiskAssessment | null>(null);

  const getRiskLevelColor = (level: RiskLevel) => {
    switch (level) {
      case "LOW":
        return "bg-green-500";
      case "MEDIUM":
        return "bg-yellow-500";
      case "HIGH":
        return "bg-orange-500";
      case "VERY_HIGH":
        return "bg-red-500";
      case "EXTREME":
        return "bg-red-700";
      default:
        return "bg-gray-500";
    }
  };

  if (selectedAssessment) {
    return (
      <div className="space-y-4">
        <button
          onClick={() => setSelectedAssessment(null)}
          className="flex items-center gap-2 text-gray-400 hover:text-white transition"
        >
          <i className="ri-arrow-left-line"></i>
          Back to Assessments
        </button>

        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="text-2xl font-bold mb-2">
                {selectedAssessment.chemicalName} - Risk Assessment
              </h2>
              <p className="text-gray-400">
                Scenario: {selectedAssessment.scenarioName} | Workplace:{" "}
                {selectedAssessment.workplaceName}
              </p>
            </div>
            <div
              className={`px-4 py-2 rounded-lg ${getRiskLevelColor(selectedAssessment.riskLevel)} text-white font-semibold`}
            >
              {selectedAssessment.riskLevel}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Risk Score */}
            <div className="p-4 rounded-lg bg-gray-700">
              <p className="text-sm text-gray-400 mb-1">Risk Score</p>
              <p className="text-3xl font-bold">
                {selectedAssessment.riskScore}/100
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Confidence:{" "}
                {(selectedAssessment.confidenceScore * 100).toFixed(0)}%
              </p>
            </div>

            {/* Exposure Details */}
            <div className="p-4 rounded-lg bg-gray-700">
              <p className="text-sm text-gray-400 mb-2">Exposure Scenario</p>
              <div className="space-y-1 text-sm">
                <p>
                  <span className="text-gray-400">Route:</span>{" "}
                  {selectedAssessment.exposure.route}
                </p>
                <p>
                  <span className="text-gray-400">Duration:</span>{" "}
                  {selectedAssessment.exposure.duration}
                </p>
                <p>
                  <span className="text-gray-400">Frequency:</span>{" "}
                  {selectedAssessment.exposure.frequency}
                </p>
                <p>
                  <span className="text-gray-400">Magnitude:</span>{" "}
                  {selectedAssessment.exposure.magnitude}
                </p>
              </div>
            </div>

            {/* Control Measures */}
            <div className="md:col-span-2">
              <h3 className="text-lg font-semibold mb-3">Control Measures</h3>
              <div className="space-y-2">
                {selectedAssessment.controls.recommended.map((control, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-lg bg-blue-900/20 border border-blue-500/30"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold">{control.type}</p>
                        <p className="text-sm text-gray-400">
                          {control.description}
                        </p>
                      </div>
                      <span
                        className={`px-2 py-1 rounded text-xs ${
                          control.priority === "High"
                            ? "bg-red-900/30 text-red-400"
                            : control.priority === "Medium"
                              ? "bg-yellow-900/30 text-yellow-400"
                              : "bg-gray-700 text-gray-400"
                        }`}
                      >
                        {control.priority}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Emergency Procedures */}
            <div className="md:col-span-2">
              <h3 className="text-lg font-semibold mb-3">
                Emergency Procedures
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold mb-2 text-sm">Spill Response</h4>
                  <ul className="space-y-1 text-sm text-gray-300">
                    {selectedAssessment.emergency.spill.map((step, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <i className="ri-arrow-right-line text-cyan-400 mt-0.5"></i>
                        {step}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold mb-2 text-sm">First Aid</h4>
                  <ul className="space-y-1 text-sm text-gray-300">
                    {selectedAssessment.emergency.firstAid.map((step, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <i className="ri-arrow-right-line text-cyan-400 mt-0.5"></i>
                        {step}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Risk Assessments</h3>
          <button className="px-4 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-600 text-white font-semibold transition">
            <i className="ri-add-line mr-2"></i>
            New Assessment
          </button>
        </div>
        <p className="text-gray-400 text-center py-8">
          Risk assessments will be displayed here. Click "New Assessment" to
          create one.
        </p>
      </div>
    </div>
  );
}

// ============================================================================
// OTHER TAB COMPONENTS
// ============================================================================

function RiskScenariosTab() {
  const [scenarios, setScenarios] = useState<any[]>([]);
  const [showScenarioBuilder, setShowScenarioBuilder] = useState(false);

  const scenarioTemplates = [
    { name: "Storage Scenario", description: "Chemical storage in warehouse" },
    {
      name: "Handling Scenario",
      description: "Manual handling during operations",
    },
    { name: "Transport Scenario", description: "Transportation and shipping" },
    { name: "Spill Scenario", description: "Accidental spill response" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Risk Scenarios</h3>
        <button
          onClick={() => setShowScenarioBuilder(true)}
          className="px-4 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-600 text-white font-semibold transition"
        >
          <i className="ri-add-line mr-2"></i>
          New Scenario
        </button>
      </div>

      {/* Scenario Templates */}
      <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
        <h4 className="font-semibold mb-4">Scenario Templates</h4>
        <div className="grid md:grid-cols-2 gap-4">
          {scenarioTemplates.map((template, idx) => (
            <div
              key={idx}
              className="p-4 rounded-lg bg-gray-700 border border-gray-600 hover:border-cyan-500/50 transition cursor-pointer"
            >
              <p className="font-semibold">{template.name}</p>
              <p className="text-sm text-gray-400 mt-1">
                {template.description}
              </p>
              <button className="mt-3 text-sm text-cyan-400 hover:text-cyan-300">
                Use Template →
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Scenario Builder Modal */}
      <AnimatePresence>
        {showScenarioBuilder && (
          <Modal
            isOpen={showScenarioBuilder}
            onClose={() => setShowScenarioBuilder(false)}
            title="Create Risk Scenario"
            size="lg"
          >
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Scenario Name
                </label>
                <input
                  type="text"
                  placeholder="Enter scenario name"
                  className="w-full px-4 py-2 rounded-lg bg-gray-900 border border-gray-700 text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Description
                </label>
                <textarea
                  rows={4}
                  placeholder="Describe the scenario..."
                  className="w-full px-4 py-2 rounded-lg bg-gray-900 border border-gray-700 text-white"
                />
              </div>
              <button className="w-full px-4 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-600 text-white font-semibold transition">
                Create Scenario
              </button>
            </div>
          </Modal>
        )}
      </AnimatePresence>
    </div>
  );
}

function RiskMatrixTab() {
  const riskMatrix = [
    {
      probability: "Very Low",
      impact: "Very Low",
      risk: "LOW",
      color: "#10b981",
    },
    { probability: "Low", impact: "Very Low", risk: "LOW", color: "#10b981" },
    {
      probability: "Medium",
      impact: "Very Low",
      risk: "MEDIUM",
      color: "#f59e0b",
    },
    {
      probability: "High",
      impact: "Very Low",
      risk: "MEDIUM",
      color: "#f59e0b",
    },
    {
      probability: "Very High",
      impact: "Very Low",
      risk: "HIGH",
      color: "#ef4444",
    },
    { probability: "Very Low", impact: "Low", risk: "LOW", color: "#10b981" },
    { probability: "Low", impact: "Low", risk: "LOW", color: "#10b981" },
    { probability: "Medium", impact: "Low", risk: "MEDIUM", color: "#f59e0b" },
    { probability: "High", impact: "Low", risk: "HIGH", color: "#ef4444" },
    { probability: "Very High", impact: "Low", risk: "HIGH", color: "#ef4444" },
    {
      probability: "Very Low",
      impact: "Medium",
      risk: "LOW",
      color: "#10b981",
    },
    { probability: "Low", impact: "Medium", risk: "MEDIUM", color: "#f59e0b" },
    { probability: "Medium", impact: "Medium", risk: "HIGH", color: "#ef4444" },
    { probability: "High", impact: "Medium", risk: "HIGH", color: "#ef4444" },
    {
      probability: "Very High",
      impact: "Medium",
      risk: "VERY_HIGH",
      color: "#dc2626",
    },
    {
      probability: "Very Low",
      impact: "High",
      risk: "MEDIUM",
      color: "#f59e0b",
    },
    { probability: "Low", impact: "High", risk: "HIGH", color: "#ef4444" },
    { probability: "Medium", impact: "High", risk: "HIGH", color: "#ef4444" },
    {
      probability: "High",
      impact: "High",
      risk: "VERY_HIGH",
      color: "#dc2626",
    },
    {
      probability: "Very High",
      impact: "High",
      risk: "EXTREME",
      color: "#991b1b",
    },
    {
      probability: "Very Low",
      impact: "Very High",
      risk: "HIGH",
      color: "#ef4444",
    },
    { probability: "Low", impact: "Very High", risk: "HIGH", color: "#ef4444" },
    {
      probability: "Medium",
      impact: "Very High",
      risk: "VERY_HIGH",
      color: "#dc2626",
    },
    {
      probability: "High",
      impact: "Very High",
      risk: "EXTREME",
      color: "#991b1b",
    },
    {
      probability: "Very High",
      impact: "Very High",
      risk: "EXTREME",
      color: "#991b1b",
    },
  ];

  const probabilities = ["Very Low", "Low", "Medium", "High", "Very High"];
  const impacts = ["Very Low", "Low", "Medium", "High", "Very High"];

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case "LOW":
        return "bg-green-500";
      case "MEDIUM":
        return "bg-yellow-500";
      case "HIGH":
        return "bg-orange-500";
      case "VERY_HIGH":
        return "bg-red-500";
      case "EXTREME":
        return "bg-red-700";
      default:
        return "bg-gray-500";
    }
  };

  return (
    <div className="space-y-6">
      {/* Risk Matrix Visualization */}
      <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
        <h3 className="text-lg font-semibold mb-4">Visual Risk Matrix</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr>
                <th className="px-4 py-2 text-left text-sm font-semibold text-gray-400"></th>
                {impacts.map((impact) => (
                  <th
                    key={impact}
                    className="px-4 py-2 text-center text-xs font-semibold text-gray-400"
                  >
                    {impact}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {probabilities.map((prob) => (
                <tr key={prob}>
                  <td className="px-4 py-2 text-xs font-semibold text-gray-400">
                    {prob}
                  </td>
                  {impacts.map((impact) => {
                    const cell = riskMatrix.find(
                      (m) => m.probability === prob && m.impact === impact,
                    );
                    return (
                      <td key={impact} className="px-2 py-2 text-center">
                        <div
                          className={`w-12 h-12 rounded ${getRiskColor(cell?.risk || "LOW")} cursor-pointer hover:opacity-80 transition`}
                          title={`${prob} × ${impact} = ${cell?.risk || "LOW"}`}
                        ></div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Legend */}
        <div className="mt-6 flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-green-500"></div>
            <span className="text-sm text-gray-400">Low</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-yellow-500"></div>
            <span className="text-sm text-gray-400">Medium</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-orange-500"></div>
            <span className="text-sm text-gray-400">High</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-red-500"></div>
            <span className="text-sm text-gray-400">Very High</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-red-700"></div>
            <span className="text-sm text-gray-400">Extreme</span>
          </div>
        </div>
      </div>

      {/* Risk Distribution Chart */}
      <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
        <h3 className="text-lg font-semibold mb-4">Risk Distribution</h3>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={[
                { name: "Low", value: 5, color: "#10b981" },
                { name: "Medium", value: 8, color: "#f59e0b" },
                { name: "High", value: 6, color: "#ef4444" },
                { name: "Very High", value: 4, color: "#dc2626" },
                { name: "Extreme", value: 2, color: "#991b1b" },
              ]}
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
              {[
                { name: "Low", value: 5, color: "#10b981" },
                { name: "Medium", value: 8, color: "#f59e0b" },
                { name: "High", value: 6, color: "#ef4444" },
                { name: "Very High", value: 4, color: "#dc2626" },
                { name: "Extreme", value: 2, color: "#991b1b" },
              ].map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function RiskTrendsTab() {
  const trendData = Array.from({ length: 12 }, (_, i) => {
    const date = new Date();
    date.setMonth(date.getMonth() - (11 - i));
    return {
      month: date.toLocaleDateString("en-US", { month: "short" }),
      averageRisk: 65 + Math.random() * 20,
      highRiskCount: Math.floor(Math.random() * 10),
    };
  });

  return (
    <div className="space-y-6">
      {/* Trends Chart */}
      <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
        <h3 className="text-lg font-semibold mb-4">
          Risk Trends (Last 12 Months)
        </h3>
        <ResponsiveContainer width="100%" height={400}>
          <AreaChart data={trendData}>
            <defs>
              <linearGradient id="colorRisk" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis dataKey="month" stroke="#9ca3af" />
            <YAxis stroke="#9ca3af" />
            <Tooltip
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
              dataKey="averageRisk"
              stroke="#ef4444"
              fillOpacity={1}
              fill="url(#colorRisk)"
            />
            <Line
              type="monotone"
              dataKey="highRiskCount"
              stroke="#f59e0b"
              strokeWidth={2}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Summary Stats */}
      <div className="grid md:grid-cols-3 gap-4">
        <div className="p-6 rounded-xl bg-red-500/10 border border-red-500/30">
          <p className="text-sm text-gray-400 mb-1">Average Risk Score</p>
          <p className="text-2xl font-bold text-red-400">
            {Math.round(
              trendData.reduce((sum, d) => sum + d.averageRisk, 0) /
                trendData.length,
            )}
          </p>
        </div>
        <div className="p-6 rounded-xl bg-orange-500/10 border border-orange-500/30">
          <p className="text-sm text-gray-400 mb-1">High Risk Assessments</p>
          <p className="text-2xl font-bold text-orange-400">
            {trendData[trendData.length - 1].highRiskCount}
          </p>
        </div>
        <div className="p-6 rounded-xl bg-yellow-500/10 border border-yellow-500/30">
          <p className="text-sm text-gray-400 mb-1">Trend</p>
          <p className="text-2xl font-bold text-yellow-400">
            {trendData[trendData.length - 1].averageRisk >
            trendData[0].averageRisk
              ? "↑ Increasing"
              : "↓ Decreasing"}
          </p>
        </div>
      </div>
    </div>
  );
}
