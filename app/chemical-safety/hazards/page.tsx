/**
 * Chemical Hazards Module
 * Comprehensive hazard identification, assessment, and communication
 */

"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import PageTemplate from "@/components/PageTemplate";
import NFPADiamond from "@/components/NFPADiamond";
import Modal from "@/components/Modal";
import { Chemical, ChemicalHazards } from "@/types/chemical";
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

type TabType = "identification" | "assessment" | "communication" | "trends";

export default function ChemicalHazardsPage() {
  const [activeTab, setActiveTab] = useState<TabType>("identification");
  const [selectedChemical, setSelectedChemical] = useState<Chemical | null>(
    null,
  );
  const [hazards, setHazards] = useState<ChemicalHazards[]>([]);

  const tabs = [
    {
      id: "identification" as TabType,
      label: "Hazard Identification",
      icon: "ri-search-eye-line",
    },
    {
      id: "assessment" as TabType,
      label: "Hazard Assessment",
      icon: "ri-file-list-3-line",
    },
    {
      id: "communication" as TabType,
      label: "Hazard Communication",
      icon: "ri-message-3-line",
    },
    {
      id: "trends" as TabType,
      label: "Hazard Trends",
      icon: "ri-line-chart-line",
    },
  ];

  return (
    <PageTemplate
      title="Chemical Hazards"
      description="Comprehensive hazard identification, assessment, and communication"
      icon="ri-alert-line"
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
          {activeTab === "identification" && (
            <motion.div
              key="identification"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <HazardIdentificationTab
                selectedChemical={selectedChemical}
                onSelectChemical={setSelectedChemical}
              />
            </motion.div>
          )}

          {activeTab === "assessment" && (
            <motion.div
              key="assessment"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <HazardAssessmentTab />
            </motion.div>
          )}

          {activeTab === "communication" && (
            <motion.div
              key="communication"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <HazardCommunicationTab />
            </motion.div>
          )}

          {activeTab === "trends" && (
            <motion.div
              key="trends"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <HazardTrendsTab />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </PageTemplate>
  );
}

// ============================================================================
// HAZARD IDENTIFICATION TAB
// ============================================================================

interface HazardIdentificationTabProps {
  selectedChemical: Chemical | null;
  onSelectChemical: (chemical: Chemical | null) => void;
}

function HazardIdentificationTab({
  selectedChemical,
  onSelectChemical,
}: HazardIdentificationTabProps) {
  const [hazardType, setHazardType] = useState<string>("");
  const [severity, setSeverity] = useState<string>("");

  if (selectedChemical) {
    return (
      <div className="space-y-4">
        <button
          onClick={() => onSelectChemical(null)}
          className="flex items-center gap-2 text-gray-400 hover:text-white transition"
        >
          <i className="ri-arrow-left-line"></i>
          Back to Hazards
        </button>

        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <h2 className="text-2xl font-bold mb-4">
            {selectedChemical.name} - Hazard Details
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* GHS Classification */}
            <div>
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <i className="ri-shield-line text-cyan-400"></i>
                GHS Classification
              </h3>
              <div className="space-y-2">
                {selectedChemical.hazards.ghs.symbols.map((symbol, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-sm">
                    <span className="px-2 py-1 rounded bg-yellow-900/30 text-yellow-400">
                      {symbol}
                    </span>
                  </div>
                ))}
                <p className="text-sm text-gray-400">
                  Signal Word:{" "}
                  <span className="font-semibold text-white">
                    {selectedChemical.hazards.ghs.signalWord}
                  </span>
                </p>
              </div>
            </div>

            {/* NFPA Diamond */}
            <div>
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <i className="ri-diamond-line text-cyan-400"></i>
                NFPA 704 Diamond
              </h3>
              <div className="flex justify-center">
                {selectedChemical.hazards.nfpa && (
                  <NFPADiamond
                    health={selectedChemical.hazards.nfpa.health}
                    flammability={selectedChemical.hazards.nfpa.flammability}
                    reactivity={selectedChemical.hazards.nfpa.reactivity}
                    special={selectedChemical.hazards.nfpa.special}
                    size="lg"
                  />
                )}
              </div>
            </div>

            {/* Hazard Statements */}
            <div className="md:col-span-2">
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <i className="ri-file-warning-line text-cyan-400"></i>
                Hazard Statements
              </h3>
              <div className="space-y-2">
                {selectedChemical.hazards.hazardStatements.map(
                  (statement, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-lg bg-red-900/20 border border-red-500/30 text-sm"
                    >
                      {statement}
                    </div>
                  ),
                )}
              </div>
            </div>

            {/* Precautionary Statements */}
            <div className="md:col-span-2">
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <i className="ri-information-line text-cyan-400"></i>
                Precautionary Statements
              </h3>
              <div className="space-y-2">
                {selectedChemical.hazards.precautionaryStatements.map(
                  (statement, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-lg bg-blue-900/20 border border-blue-500/30 text-sm"
                    >
                      {statement}
                    </div>
                  ),
                )}
              </div>
            </div>

            {/* Exposure Limits */}
            {selectedChemical.hazards.exposureLimits && (
              <div className="md:col-span-2">
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <i className="ri-time-line text-cyan-400"></i>
                  Exposure Limits
                </h3>
                <div className="grid grid-cols-3 gap-4">
                  {selectedChemical.hazards.exposureLimits.twa && (
                    <div className="p-3 rounded-lg bg-gray-700">
                      <p className="text-sm text-gray-400">TWA (8-hour)</p>
                      <p className="font-semibold">
                        {selectedChemical.hazards.exposureLimits.twa.value}{" "}
                        {selectedChemical.hazards.exposureLimits.twa.units}
                      </p>
                    </div>
                  )}
                  {selectedChemical.hazards.exposureLimits.stel && (
                    <div className="p-3 rounded-lg bg-gray-700">
                      <p className="text-sm text-gray-400">STEL (15-min)</p>
                      <p className="font-semibold">
                        {selectedChemical.hazards.exposureLimits.stel.value}{" "}
                        {selectedChemical.hazards.exposureLimits.stel.units}
                      </p>
                    </div>
                  )}
                  {selectedChemical.hazards.exposureLimits.ceiling && (
                    <div className="p-3 rounded-lg bg-gray-700">
                      <p className="text-sm text-gray-400">Ceiling</p>
                      <p className="font-semibold">
                        {selectedChemical.hazards.exposureLimits.ceiling.value}{" "}
                        {selectedChemical.hazards.exposureLimits.ceiling.units}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <select
            value={hazardType}
            onChange={(e) => setHazardType(e.target.value)}
            className="px-4 py-2 rounded-lg bg-gray-900 border border-gray-700 text-white"
          >
            <option value="">All Hazard Types</option>
            <option value="physical">Physical Hazards</option>
            <option value="health">Health Hazards</option>
            <option value="environmental">Environmental Hazards</option>
          </select>

          <select
            value={severity}
            onChange={(e) => setSeverity(e.target.value)}
            className="px-4 py-2 rounded-lg bg-gray-900 border border-gray-700 text-white"
          >
            <option value="">All Severities</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="very-high">Very High</option>
            <option value="extreme">Extreme</option>
          </select>

          <button className="px-4 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-600 text-white font-semibold transition">
            <i className="ri-search-line mr-2"></i>
            Search Hazards
          </button>
        </div>
      </div>

      {/* Hazard List */}
      <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
        <h3 className="text-lg font-semibold mb-4">Hazard List</h3>
        <p className="text-gray-400 text-center py-8">
          Select a chemical to view detailed hazard information
        </p>
      </div>
    </div>
  );
}

// ============================================================================
// OTHER TAB COMPONENTS
// ============================================================================

function HazardAssessmentTab() {
  const [assessments, setAssessments] = useState<any[]>([]);
  const [selectedAssessment, setSelectedAssessment] = useState<any | null>(
    null,
  );

  // Mock assessment data
  const mockAssessments = [
    {
      id: "1",
      chemical: "Sulfuric Acid",
      riskScore: 85,
      severity: "High",
      date: new Date(),
    },
    {
      id: "2",
      chemical: "Sodium Hydroxide",
      riskScore: 72,
      severity: "Medium",
      date: new Date(),
    },
  ];

  useEffect(() => {
    setAssessments(mockAssessments);
  }, []);

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid md:grid-cols-4 gap-4">
        <div className="p-6 rounded-xl bg-gradient-to-br from-cyan-500/10 to-blue-600/10 border border-cyan-500/30">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-400">Total Assessments</span>
            <i className="ri-file-list-3-line text-cyan-400"></i>
          </div>
          <div className="text-3xl font-bold text-white">
            {assessments.length}
          </div>
        </div>
        <div className="p-6 rounded-xl bg-gradient-to-br from-red-500/10 to-rose-600/10 border border-red-500/30">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-400">High Risk</span>
            <i className="ri-error-warning-line text-red-400"></i>
          </div>
          <div className="text-3xl font-bold text-white">
            {assessments.filter((a) => a.severity === "High").length}
          </div>
        </div>
        <div className="p-6 rounded-xl bg-gradient-to-br from-yellow-500/10 to-amber-600/10 border border-yellow-500/30">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-400">Medium Risk</span>
            <i className="ri-alert-line text-yellow-400"></i>
          </div>
          <div className="text-3xl font-bold text-white">
            {assessments.filter((a) => a.severity === "Medium").length}
          </div>
        </div>
        <div className="p-6 rounded-xl bg-gradient-to-br from-green-500/10 to-emerald-600/10 border border-green-500/30">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-400">Avg Risk Score</span>
            <i className="ri-bar-chart-line text-green-400"></i>
          </div>
          <div className="text-3xl font-bold text-white">
            {assessments.length > 0
              ? Math.round(
                  assessments.reduce((sum, a) => sum + a.riskScore, 0) /
                    assessments.length,
                )
              : 0}
          </div>
        </div>
      </div>

      {/* Risk Distribution Chart */}
      <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
        <h3 className="text-lg font-semibold mb-4">Risk Distribution</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart
            data={[
              {
                level: "High",
                count: assessments.filter((a) => a.severity === "High").length,
              },
              {
                level: "Medium",
                count: assessments.filter((a) => a.severity === "Medium")
                  .length,
              },
              {
                level: "Low",
                count: assessments.filter((a) => a.severity === "Low").length,
              },
            ]}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis dataKey="level" stroke="#9ca3af" />
            <YAxis stroke="#9ca3af" />
            <Tooltip
              contentStyle={{
                backgroundColor: "#1f2937",
                border: "1px solid #374151",
                borderRadius: "8px",
              }}
              labelStyle={{ color: "#fff" }}
            />
            <Bar dataKey="count" radius={[8, 8, 0, 0]}>
              {[
                {
                  level: "High",
                  count: assessments.filter((a) => a.severity === "High")
                    .length,
                  color: "#ef4444",
                },
                {
                  level: "Medium",
                  count: assessments.filter((a) => a.severity === "Medium")
                    .length,
                  color: "#f59e0b",
                },
                {
                  level: "Low",
                  count: assessments.filter((a) => a.severity === "Low").length,
                  color: "#10b981",
                },
              ].map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Assessment List */}
      <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Hazard Assessments</h3>
          <button className="px-4 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-600 text-white font-semibold transition">
            <i className="ri-add-line mr-2"></i>
            New Assessment
          </button>
        </div>
        <div className="space-y-2">
          {assessments.map((assessment) => (
            <div
              key={assessment.id}
              onClick={() => setSelectedAssessment(assessment)}
              className="p-4 rounded-lg bg-gray-700 border border-gray-600 hover:border-cyan-500/50 transition cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold">{assessment.chemical}</p>
                  <p className="text-sm text-gray-400">
                    {new Date(assessment.date).toLocaleDateString()}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold">{assessment.riskScore}</p>
                  <span
                    className={`px-2 py-1 rounded text-xs ${
                      assessment.severity === "High"
                        ? "bg-red-900/30 text-red-400"
                        : assessment.severity === "Medium"
                          ? "bg-yellow-900/30 text-yellow-400"
                          : "bg-green-900/30 text-green-400"
                    }`}
                  >
                    {assessment.severity}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Assessment Detail Modal */}
      <AnimatePresence>
        {selectedAssessment && (
          <Modal
            isOpen={!!selectedAssessment}
            onClose={() => setSelectedAssessment(null)}
            title={`Hazard Assessment: ${selectedAssessment.chemical}`}
            size="xl"
          >
            <div className="space-y-6">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="p-4 rounded-lg bg-gray-700">
                  <p className="text-sm text-gray-400 mb-1">Risk Score</p>
                  <p className="text-3xl font-bold">
                    {selectedAssessment.riskScore}/100
                  </p>
                </div>
                <div className="p-4 rounded-lg bg-gray-700">
                  <p className="text-sm text-gray-400 mb-1">Severity</p>
                  <span
                    className={`px-3 py-1 rounded-lg text-sm font-semibold ${
                      selectedAssessment.severity === "High"
                        ? "bg-red-900/30 text-red-400"
                        : selectedAssessment.severity === "Medium"
                          ? "bg-yellow-900/30 text-yellow-400"
                          : "bg-green-900/30 text-green-400"
                    }`}
                  >
                    {selectedAssessment.severity}
                  </span>
                </div>
              </div>
              <p className="text-gray-400">
                Detailed assessment information coming soon...
              </p>
            </div>
          </Modal>
        )}
      </AnimatePresence>
    </div>
  );
}

function HazardCommunicationTab() {
  const [selectedChemical, setSelectedChemical] = useState<string>("");
  const [labelData, setLabelData] = useState<any>(null);

  const handleGenerateLabel = () => {
    // TODO: Generate GHS-compliant label
    setLabelData({
      chemicalName: selectedChemical || "Sample Chemical",
      ghsSymbols: ["Flammable", "Toxic"],
      signalWord: "Danger",
      hazardStatements: ["H225: Highly flammable liquid and vapor"],
      precautionaryStatements: [
        "P210: Keep away from heat, sparks, open flames",
      ],
    });
  };

  return (
    <div className="space-y-6">
      {/* Label Generator */}
      <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <i className="ri-price-tag-3-line text-cyan-400"></i>
          GHS Label Generator
        </h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              Chemical Name
            </label>
            <input
              type="text"
              value={selectedChemical}
              onChange={(e) => setSelectedChemical(e.target.value)}
              placeholder="Enter chemical name"
              className="w-full px-4 py-2 rounded-lg bg-gray-900 border border-gray-700 text-white"
            />
          </div>
          <button
            onClick={handleGenerateLabel}
            className="w-full px-4 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-600 text-white font-semibold transition"
          >
            <i className="ri-file-generate-line mr-2"></i>
            Generate GHS Label
          </button>
        </div>
      </div>

      {/* Generated Label Preview */}
      {labelData && (
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <h3 className="text-lg font-semibold mb-4">
            Generated Label Preview
          </h3>
          <div className="p-6 rounded-lg bg-white border-2 border-gray-300">
            <div className="text-black">
              <h4 className="text-xl font-bold mb-4">
                {labelData.chemicalName}
              </h4>
              <div className="flex gap-2 mb-4">
                {labelData.ghsSymbols.map((symbol: string, idx: number) => (
                  <span
                    key={idx}
                    className="px-3 py-1 rounded bg-yellow-200 text-yellow-900 text-sm font-semibold"
                  >
                    {symbol}
                  </span>
                ))}
              </div>
              <p className="font-semibold mb-2">
                Signal Word: {labelData.signalWord}
              </p>
              <div className="space-y-1 text-sm">
                {labelData.hazardStatements.map((stmt: string, idx: number) => (
                  <p key={idx}>• {stmt}</p>
                ))}
              </div>
            </div>
          </div>
          <div className="mt-4 flex gap-2">
            <button className="px-4 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 text-white transition">
              <i className="ri-download-line mr-2"></i>
              Download PDF
            </button>
            <button className="px-4 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 text-white transition">
              <i className="ri-printer-line mr-2"></i>
              Print Label
            </button>
          </div>
        </div>
      )}

      {/* Communication Templates */}
      <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <i className="ri-file-text-line text-blue-400"></i>
          Communication Templates
        </h3>
        <div className="grid md:grid-cols-2 gap-4">
          {[
            "Safety Data Sheet",
            "Hazard Communication Sheet",
            "Emergency Response Card",
            "Training Material",
          ].map((template) => (
            <div
              key={template}
              className="p-4 rounded-lg bg-gray-700 border border-gray-600 hover:border-cyan-500/50 transition cursor-pointer"
            >
              <p className="font-semibold">{template}</p>
              <p className="text-xs text-gray-400 mt-1">Generate template</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function HazardTrendsTab() {
  const trendData = Array.from({ length: 12 }, (_, i) => {
    const date = new Date();
    date.setMonth(date.getMonth() - (11 - i));
    return {
      month: date.toLocaleDateString("en-US", { month: "short" }),
      highRisk: Math.floor(Math.random() * 10),
      mediumRisk: Math.floor(Math.random() * 15),
      lowRisk: Math.floor(Math.random() * 20),
    };
  });

  return (
    <div className="space-y-6">
      {/* Trends Chart */}
      <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
        <h3 className="text-lg font-semibold mb-4">
          Hazard Trends (Last 12 Months)
        </h3>
        <ResponsiveContainer width="100%" height={400}>
          <AreaChart data={trendData}>
            <defs>
              <linearGradient id="colorHigh" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorMedium" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorLow" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
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
              dataKey="highRisk"
              stackId="1"
              stroke="#ef4444"
              fillOpacity={1}
              fill="url(#colorHigh)"
            />
            <Area
              type="monotone"
              dataKey="mediumRisk"
              stackId="1"
              stroke="#f59e0b"
              fillOpacity={1}
              fill="url(#colorMedium)"
            />
            <Area
              type="monotone"
              dataKey="lowRisk"
              stackId="1"
              stroke="#10b981"
              fillOpacity={1}
              fill="url(#colorLow)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Summary Stats */}
      <div className="grid md:grid-cols-3 gap-4">
        <div className="p-6 rounded-xl bg-red-500/10 border border-red-500/30">
          <p className="text-sm text-gray-400 mb-1">High Risk Trend</p>
          <p className="text-2xl font-bold text-red-400">
            {trendData[trendData.length - 1].highRisk > trendData[0].highRisk
              ? "↑"
              : "↓"}
            {Math.abs(
              trendData[trendData.length - 1].highRisk - trendData[0].highRisk,
            )}
          </p>
        </div>
        <div className="p-6 rounded-xl bg-yellow-500/10 border border-yellow-500/30">
          <p className="text-sm text-gray-400 mb-1">Medium Risk Trend</p>
          <p className="text-2xl font-bold text-yellow-400">
            {trendData[trendData.length - 1].mediumRisk >
            trendData[0].mediumRisk
              ? "↑"
              : "↓"}
            {Math.abs(
              trendData[trendData.length - 1].mediumRisk -
                trendData[0].mediumRisk,
            )}
          </p>
        </div>
        <div className="p-6 rounded-xl bg-green-500/10 border border-green-500/30">
          <p className="text-sm text-gray-400 mb-1">Low Risk Trend</p>
          <p className="text-2xl font-bold text-green-400">
            {trendData[trendData.length - 1].lowRisk > trendData[0].lowRisk
              ? "↑"
              : "↓"}
            {Math.abs(
              trendData[trendData.length - 1].lowRisk - trendData[0].lowRisk,
            )}
          </p>
        </div>
      </div>
    </div>
  );
}
