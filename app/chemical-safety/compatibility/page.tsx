/**
 * Chemical Compatibility Module
 * Interactive compatibility matrix, checker, and segregation rules
 */

"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import PageTemplate from "@/components/PageTemplate";
import Modal from "@/components/Modal";
import { CompatibilityLevel, CompatibilityResult } from "@/types/chemical";
import {
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
} from "recharts";

type TabType = "matrix" | "checker" | "segregation" | "incidents";

export default function ChemicalCompatibilityPage() {
  const [activeTab, setActiveTab] = useState<TabType>("matrix");

  const tabs = [
    {
      id: "matrix" as TabType,
      label: "Compatibility Matrix",
      icon: "ri-table-line",
    },
    {
      id: "checker" as TabType,
      label: "Compatibility Checker",
      icon: "ri-search-line",
    },
    {
      id: "segregation" as TabType,
      label: "Segregation Rules",
      icon: "ri-layout-grid-line",
    },
    {
      id: "incidents" as TabType,
      label: "Compatibility Incidents",
      icon: "ri-alert-line",
    },
  ];

  return (
    <PageTemplate
      title="Chemical Compatibility"
      description="Interactive compatibility matrix, checker, and segregation rules"
      icon="ri-links-line"
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
          {activeTab === "matrix" && (
            <motion.div
              key="matrix"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <CompatibilityMatrixTab />
            </motion.div>
          )}

          {activeTab === "checker" && (
            <motion.div
              key="checker"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <CompatibilityCheckerTab />
            </motion.div>
          )}

          {activeTab === "segregation" && (
            <motion.div
              key="segregation"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <SegregationRulesTab />
            </motion.div>
          )}

          {activeTab === "incidents" && (
            <motion.div
              key="incidents"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <CompatibilityIncidentsTab />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </PageTemplate>
  );
}

// ============================================================================
// COMPATIBILITY MATRIX TAB
// ============================================================================

function CompatibilityMatrixTab() {
  const [selectedRow, setSelectedRow] = useState<string | null>(null);
  const [selectedCol, setSelectedCol] = useState<string | null>(null);

  // Mock chemicals for matrix
  const chemicals = [
    { id: "1", name: "Sulfuric Acid" },
    { id: "2", name: "Sodium Hydroxide" },
    { id: "3", name: "Hydrogen Peroxide" },
    { id: "4", name: "Acetone" },
    { id: "5", name: "Water" },
  ];

  const getCompatibilityColor = (level: CompatibilityLevel) => {
    switch (level) {
      case "SAFE":
        return "bg-green-500";
      case "CAUTION":
        return "bg-yellow-500";
      case "DANGER":
        return "bg-orange-500";
      case "EXTREME_DANGER":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

  return (
    <div className="space-y-4">
      <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
        <h3 className="text-lg font-semibold mb-4">
          Interactive Compatibility Matrix
        </h3>

        {/* Matrix */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr>
                <th className="px-4 py-2 text-left text-sm font-semibold text-gray-400"></th>
                {chemicals.map((chem) => (
                  <th
                    key={chem.id}
                    className={`px-4 py-2 text-center text-xs font-semibold ${
                      selectedCol === chem.id ? "bg-cyan-900/30" : ""
                    }`}
                    onMouseEnter={() => setSelectedCol(chem.id)}
                    onMouseLeave={() => setSelectedCol(null)}
                  >
                    {chem.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {chemicals.map((rowChem) => (
                <tr key={rowChem.id}>
                  <td
                    className={`px-4 py-2 text-xs font-semibold ${
                      selectedRow === rowChem.id ? "bg-cyan-900/30" : ""
                    }`}
                    onMouseEnter={() => setSelectedRow(rowChem.id)}
                    onMouseLeave={() => setSelectedRow(null)}
                  >
                    {rowChem.name}
                  </td>
                  {chemicals.map((colChem) => {
                    if (rowChem.id === colChem.id) {
                      return (
                        <td key={colChem.id} className="px-4 py-2 text-center">
                          <div className="w-8 h-8 rounded bg-gray-700"></div>
                        </td>
                      );
                    }

                    // Mock compatibility level
                    const level: CompatibilityLevel =
                      (rowChem.name.includes("Acid") &&
                        colChem.name.includes("Base")) ||
                      (rowChem.name.includes("Base") &&
                        colChem.name.includes("Acid"))
                        ? "EXTREME_DANGER"
                        : rowChem.name === colChem.name
                          ? "SAFE"
                          : "CAUTION";

                    return (
                      <td
                        key={colChem.id}
                        className="px-4 py-2 text-center cursor-pointer hover:opacity-80 transition"
                        title={`${rowChem.name} + ${colChem.name}`}
                      >
                        <div
                          className={`w-8 h-8 rounded ${getCompatibilityColor(level)}`}
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
            <span className="text-sm text-gray-400">Safe</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-yellow-500"></div>
            <span className="text-sm text-gray-400">Caution</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-orange-500"></div>
            <span className="text-sm text-gray-400">Danger</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-red-500"></div>
            <span className="text-sm text-gray-400">Extreme Danger</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// COMPATIBILITY CHECKER TAB
// ============================================================================

function CompatibilityCheckerTab() {
  const [chemical1, setChemical1] = useState("");
  const [chemical2, setChemical2] = useState("");
  const [result, setResult] = useState<CompatibilityResult | null>(null);
  const [checking, setChecking] = useState(false);

  const handleCheck = async () => {
    if (!chemical1 || !chemical2) return;

    setChecking(true);
    // TODO: Call compatibility service
    setTimeout(() => {
      setResult({
        level: "DANGER",
        explanation: "These chemicals may react violently when mixed.",
        recommendations: [
          "Store in separate locations",
          "Use dedicated storage cabinets",
          "Maintain minimum segregation distance of 3 meters",
        ],
        confidence: 0.85,
      });
      setChecking(false);
    }, 1000);
  };

  return (
    <div className="space-y-4">
      <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
        <h3 className="text-lg font-semibold mb-4">Compatibility Checker</h3>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              Chemical 1
            </label>
            <input
              type="text"
              value={chemical1}
              onChange={(e) => setChemical1(e.target.value)}
              placeholder="Enter chemical name or CAS number"
              className="w-full px-4 py-2 rounded-lg bg-gray-900 border border-gray-700 text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              Chemical 2
            </label>
            <input
              type="text"
              value={chemical2}
              onChange={(e) => setChemical2(e.target.value)}
              placeholder="Enter chemical name or CAS number"
              className="w-full px-4 py-2 rounded-lg bg-gray-900 border border-gray-700 text-white"
            />
          </div>

          <button
            onClick={handleCheck}
            disabled={checking || !chemical1 || !chemical2}
            className="w-full px-4 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold transition"
          >
            {checking ? (
              <>
                <i className="ri-loader-4-line animate-spin mr-2"></i>
                Checking Compatibility...
              </>
            ) : (
              <>
                <i className="ri-search-line mr-2"></i>
                Check Compatibility
              </>
            )}
          </button>
        </div>
      </div>

      {/* Result */}
      {result && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <h3 className="text-lg font-semibold mb-4">Compatibility Result</h3>

            <div
              className={`p-4 rounded-lg mb-4 ${
                result.level === "SAFE"
                  ? "bg-green-900/30 border border-green-500/30"
                  : result.level === "CAUTION"
                    ? "bg-yellow-900/30 border border-yellow-500/30"
                    : result.level === "DANGER"
                      ? "bg-orange-900/30 border border-orange-500/30"
                      : "bg-red-900/30 border border-red-500/30"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold text-lg">{result.level}</span>
                <span className="text-sm text-gray-400">
                  Confidence: {(result.confidence * 100).toFixed(0)}%
                </span>
              </div>
              <p className="text-sm text-gray-300">{result.explanation}</p>
            </div>

            {result.recommendations.length > 0 && (
              <div>
                <h4 className="font-semibold mb-2">Recommendations</h4>
                <ul className="space-y-2">
                  {result.recommendations.map((rec, idx) => (
                    <li
                      key={idx}
                      className="flex items-start gap-2 text-sm text-gray-300"
                    >
                      <i className="ri-arrow-right-line text-cyan-400 mt-0.5"></i>
                      {rec}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {result.reactionDetails && (
              <div className="mt-4 p-4 rounded-lg bg-gray-700 border border-gray-600">
                <h4 className="font-semibold mb-2">Reaction Details</h4>
                {result.reactionDetails.reactionType && (
                  <p className="text-sm text-gray-300 mb-1">
                    <strong>Type:</strong> {result.reactionDetails.reactionType}
                  </p>
                )}
                {result.reactionDetails.products &&
                  result.reactionDetails.products.length > 0 && (
                    <div className="mb-2">
                      <p className="text-sm font-semibold text-gray-400 mb-1">
                        Products:
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {result.reactionDetails.products.map((product, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-1 rounded bg-red-900/30 text-red-400 text-xs"
                          >
                            {product}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                {result.reactionDetails.hazards &&
                  result.reactionDetails.hazards.length > 0 && (
                    <div>
                      <p className="text-sm font-semibold text-red-400 mb-1">
                        Hazards:
                      </p>
                      <ul className="space-y-1">
                        {result.reactionDetails.hazards.map((hazard, idx) => (
                          <li
                            key={idx}
                            className="text-sm text-red-300 flex items-start gap-2"
                          >
                            <i className="ri-alert-line mt-0.5"></i>
                            {hazard}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
              </div>
            )}
          </div>
        </motion.div>
      )}
    </div>
  );
}

// ============================================================================
// SEGREGATION RULES TAB
// ============================================================================

function SegregationRulesTab() {
  const storageClasses = [
    {
      id: "A",
      name: "Storage Class A",
      description: "Acids",
      chemicals: ["Sulfuric Acid", "Hydrochloric Acid"],
    },
    {
      id: "B",
      name: "Storage Class B",
      description: "Bases",
      chemicals: ["Sodium Hydroxide", "Potassium Hydroxide"],
    },
    {
      id: "C",
      name: "Storage Class C",
      description: "Oxidizers",
      chemicals: ["Hydrogen Peroxide", "Nitric Acid"],
    },
  ];

  return (
    <div className="space-y-6">
      {/* Storage Classes */}
      <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <i className="ri-layout-grid-line text-cyan-400"></i>
          Storage Class Grouping
        </h3>
        <div className="grid md:grid-cols-3 gap-4">
          {storageClasses.map((sc) => (
            <div
              key={sc.id}
              className="p-4 rounded-lg bg-gray-700 border border-gray-600"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold">{sc.name}</span>
                <span className="px-2 py-1 rounded bg-cyan-900/30 text-cyan-400 text-xs">
                  {sc.id}
                </span>
              </div>
              <p className="text-sm text-gray-400 mb-2">{sc.description}</p>
              <div className="space-y-1">
                {sc.chemicals.map((chem, idx) => (
                  <p key={idx} className="text-xs text-gray-300">
                    • {chem}
                  </p>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Segregation Distance Calculator */}
      <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <i className="ri-ruler-line text-orange-400"></i>
          Segregation Distance Calculator
        </h3>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              Chemical 1
            </label>
            <input
              type="text"
              placeholder="Enter chemical name"
              className="w-full px-4 py-2 rounded-lg bg-gray-900 border border-gray-700 text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              Chemical 2
            </label>
            <input
              type="text"
              placeholder="Enter chemical name"
              className="w-full px-4 py-2 rounded-lg bg-gray-900 border border-gray-700 text-white"
            />
          </div>
        </div>
        <button className="mt-4 w-full px-4 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-600 text-white font-semibold transition">
          <i className="ri-calculator-line mr-2"></i>
          Calculate Minimum Distance
        </button>
        <div className="mt-4 p-4 rounded-lg bg-gray-700">
          <p className="text-sm text-gray-400">Minimum Segregation Distance</p>
          <p className="text-2xl font-bold text-cyan-400">3.0 meters</p>
          <p className="text-xs text-gray-500 mt-1">
            Based on hazard classes and reactivity
          </p>
        </div>
      </div>

      {/* Visual Warehouse Layout */}
      <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <i className="ri-map-pin-line text-green-400"></i>
          Visual Warehouse Layout
        </h3>
        <div className="p-6 rounded-lg bg-gray-900 border border-gray-700">
          <div className="grid grid-cols-4 gap-4">
            {Array.from({ length: 16 }).map((_, idx) => (
              <div
                key={idx}
                className={`aspect-square rounded-lg border-2 flex items-center justify-center ${
                  idx % 4 === 0
                    ? "bg-red-900/30 border-red-500/50"
                    : idx % 4 === 1
                      ? "bg-yellow-900/30 border-yellow-500/50"
                      : idx % 4 === 2
                        ? "bg-green-900/30 border-green-500/50"
                        : "bg-gray-700 border-gray-600"
                }`}
              >
                <span className="text-xs text-gray-400">Zone {idx + 1}</span>
              </div>
            ))}
          </div>
          <div className="mt-4 flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-red-900/30 border border-red-500/50"></div>
              <span className="text-xs text-gray-400">Incompatible</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-yellow-900/30 border border-yellow-500/50"></div>
              <span className="text-xs text-gray-400">Caution</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-green-900/30 border border-green-500/50"></div>
              <span className="text-xs text-gray-400">Safe</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-gray-700 border border-gray-600"></div>
              <span className="text-xs text-gray-400">Empty</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// COMPATIBILITY INCIDENTS TAB
// ============================================================================

function CompatibilityIncidentsTab() {
  const incidents = [
    {
      id: "1",
      chemical1: "Sulfuric Acid",
      chemical2: "Sodium Hydroxide",
      date: new Date("2024-01-15"),
      severity: "High",
      description: "Violent reaction occurred during accidental mixing",
      outcome: "Contained, no injuries",
      lessons: [
        "Always segregate acids and bases",
        "Use dedicated storage areas",
      ],
    },
  ];

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid md:grid-cols-4 gap-4">
        <div className="p-6 rounded-xl bg-gradient-to-br from-red-500/10 to-rose-600/10 border border-red-500/30">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-400">Total Incidents</span>
            <i className="ri-alert-line text-red-400"></i>
          </div>
          <div className="text-3xl font-bold text-white">
            {incidents.length}
          </div>
        </div>
        <div className="p-6 rounded-xl bg-gradient-to-br from-orange-500/10 to-amber-600/10 border border-orange-500/30">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-400">High Severity</span>
            <i className="ri-error-warning-line text-orange-400"></i>
          </div>
          <div className="text-3xl font-bold text-white">
            {incidents.filter((i) => i.severity === "High").length}
          </div>
        </div>
        <div className="p-6 rounded-xl bg-gradient-to-br from-green-500/10 to-emerald-600/10 border border-green-500/30">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-400">Prevented</span>
            <i className="ri-shield-check-line text-green-400"></i>
          </div>
          <div className="text-3xl font-bold text-white">0</div>
        </div>
        <div className="p-6 rounded-xl bg-gradient-to-br from-blue-500/10 to-blue-600/10 border border-blue-500/30">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-400">Avg Response Time</span>
            <i className="ri-time-line text-blue-400"></i>
          </div>
          <div className="text-3xl font-bold text-white">5 min</div>
        </div>
      </div>

      {/* Incidents List */}
      <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
        <h3 className="text-lg font-semibold mb-4">
          Historical Compatibility Incidents
        </h3>
        <div className="space-y-3">
          {incidents.map((incident) => (
            <div
              key={incident.id}
              className="p-4 rounded-lg bg-red-900/20 border border-red-500/30"
            >
              <div className="flex items-start justify-between mb-2">
                <div>
                  <p className="font-semibold">
                    {incident.chemical1} + {incident.chemical2}
                  </p>
                  <p className="text-sm text-gray-400 mt-1">
                    {incident.description}
                  </p>
                </div>
                <span
                  className={`px-2 py-1 rounded text-xs ${
                    incident.severity === "High"
                      ? "bg-red-900/30 text-red-400"
                      : "bg-yellow-900/30 text-yellow-400"
                  }`}
                >
                  {incident.severity}
                </span>
              </div>
              <div className="mt-3 pt-3 border-t border-red-500/20">
                <p className="text-sm text-gray-300 mb-2">
                  <strong>Outcome:</strong> {incident.outcome}
                </p>
                <div>
                  <p className="text-sm font-semibold text-yellow-400 mb-1">
                    Lessons Learned:
                  </p>
                  <ul className="space-y-1">
                    {incident.lessons.map((lesson, idx) => (
                      <li
                        key={idx}
                        className="text-sm text-gray-300 flex items-start gap-2"
                      >
                        <i className="ri-checkbox-circle-line text-yellow-400 mt-0.5"></i>
                        {lesson}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Date: {incident.date.toLocaleDateString()}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
