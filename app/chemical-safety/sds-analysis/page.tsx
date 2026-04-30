/**
 * SDS Analysis Module
 * Comprehensive SDS parsing, comparison, and compliance checking
 */

"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import PageTemplate from "@/components/PageTemplate";
import Modal from "@/components/Modal";
import { MSDSDocument } from "@/types/chemical";
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

type TabType = "dashboard" | "parser" | "comparison" | "compliance";

export default function SDSAnalysisPage() {
  const [activeTab, setActiveTab] = useState<TabType>("dashboard");

  const tabs = [
    {
      id: "dashboard" as TabType,
      label: "Analysis Dashboard",
      icon: "ri-dashboard-line",
    },
    { id: "parser" as TabType, label: "SDS Parser", icon: "ri-file-text-line" },
    {
      id: "comparison" as TabType,
      label: "SDS Comparison",
      icon: "ri-file-compare-line",
    },
    {
      id: "compliance" as TabType,
      label: "Compliance Check",
      icon: "ri-shield-check-line",
    },
  ];

  return (
    <PageTemplate
      title="SDS Analysis"
      description="Comprehensive SDS parsing, comparison, and compliance checking"
      icon="ri-file-search-line"
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
          {activeTab === "dashboard" && (
            <motion.div
              key="dashboard"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <SDSAnalysisDashboardTab />
            </motion.div>
          )}

          {activeTab === "parser" && (
            <motion.div
              key="parser"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <SDSParserTab />
            </motion.div>
          )}

          {activeTab === "comparison" && (
            <motion.div
              key="comparison"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <SDSComparisonTab />
            </motion.div>
          )}

          {activeTab === "compliance" && (
            <motion.div
              key="compliance"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <SDSComplianceTab />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </PageTemplate>
  );
}

// ============================================================================
// SDS ANALYSIS DASHBOARD TAB
// ============================================================================

function SDSAnalysisDashboardTab() {
  const analyses = [
    {
      id: "1",
      chemical: "Sulfuric Acid",
      confidence: 95,
      compliance: true,
      date: new Date(),
    },
    {
      id: "2",
      chemical: "Sodium Hydroxide",
      confidence: 88,
      compliance: true,
      date: new Date(),
    },
  ];

  const totalAnalyzed = analyses.length;
  const avgConfidence =
    analyses.length > 0
      ? Math.round(
          analyses.reduce((sum, a) => sum + a.confidence, 0) / analyses.length,
        )
      : 0;
  const complianceRate =
    analyses.length > 0
      ? Math.round(
          (analyses.filter((a) => a.compliance).length / analyses.length) * 100,
        )
      : 0;

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="p-6 rounded-xl bg-gradient-to-br from-cyan-500/10 to-blue-600/10 border border-cyan-500/30">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-400">Total Analyzed</span>
            <i className="ri-file-line text-cyan-400"></i>
          </div>
          <div className="text-3xl font-bold text-white">{totalAnalyzed}</div>
        </div>
        <div className="p-6 rounded-xl bg-gradient-to-br from-purple-500/10 to-purple-600/10 border border-purple-500/30">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-400">Avg Confidence</span>
            <i className="ri-cpu-line text-purple-400"></i>
          </div>
          <div className="text-3xl font-bold text-white">{avgConfidence}%</div>
        </div>
        <div className="p-6 rounded-xl bg-gradient-to-br from-green-500/10 to-emerald-600/10 border border-green-500/30">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-400">Compliance Rate</span>
            <i className="ri-shield-check-line text-green-400"></i>
          </div>
          <div className="text-3xl font-bold text-white">{complianceRate}%</div>
        </div>
        <div className="p-6 rounded-xl bg-gradient-to-br from-orange-500/10 to-amber-600/10 border border-orange-500/30">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-400">In Queue</span>
            <i className="ri-time-line text-orange-400"></i>
          </div>
          <div className="text-3xl font-bold text-white">0</div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Confidence Distribution */}
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <h4 className="font-bold mb-4 text-white">Confidence Distribution</h4>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart
              data={[
                { range: "0-50%", count: 0 },
                { range: "50-70%", count: 0 },
                { range: "70-85%", count: 1 },
                { range: "85-95%", count: 1 },
                { range: "95-100%", count: 0 },
              ]}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="range" stroke="#9ca3af" />
              <YAxis stroke="#9ca3af" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#1f2937",
                  border: "1px solid #374151",
                  borderRadius: "8px",
                }}
                labelStyle={{ color: "#fff" }}
              />
              <Bar dataKey="count" fill="#8b5cf6" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Compliance Status */}
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <h4 className="font-bold mb-4 text-white">Compliance Status</h4>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={[
                  {
                    name: "Compliant",
                    value: analyses.filter((a) => a.compliance).length,
                    color: "#10b981",
                  },
                  {
                    name: "Non-Compliant",
                    value: analyses.filter((a) => !a.compliance).length,
                    color: "#ef4444",
                  },
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
                  {
                    name: "Compliant",
                    value: analyses.filter((a) => a.compliance).length,
                    color: "#10b981",
                  },
                  {
                    name: "Non-Compliant",
                    value: analyses.filter((a) => !a.compliance).length,
                    color: "#ef4444",
                  },
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

      {/* Recent Analyses */}
      <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
        <h3 className="text-lg font-semibold mb-4">Recent Analyses</h3>
        <div className="space-y-2">
          {analyses.map((analysis) => (
            <div
              key={analysis.id}
              className="p-4 rounded-lg bg-gray-700 border border-gray-600 hover:border-cyan-500/50 transition"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold">{analysis.chemical}</p>
                  <p className="text-sm text-gray-400">
                    {new Date(analysis.date).toLocaleDateString()}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold">
                    {analysis.confidence}%
                  </p>
                  <span
                    className={`px-2 py-1 rounded text-xs ${
                      analysis.compliance
                        ? "bg-green-900/30 text-green-400"
                        : "bg-red-900/30 text-red-400"
                    }`}
                  >
                    {analysis.compliance ? "Compliant" : "Non-Compliant"}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// SDS PARSER TAB
// ============================================================================

function SDSParserTab() {
  const [file, setFile] = useState<File | null>(null);
  const [parsing, setParsing] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleParse = async () => {
    if (!file) return;

    setParsing(true);
    // TODO: Call SDS parser service
    setTimeout(() => {
      setResult({
        success: true,
        confidence: 0.95,
      });
      setParsing(false);
    }, 2000);
  };

  return (
    <div className="space-y-4">
      <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
        <h3 className="text-lg font-semibold mb-4">SDS Parser & Extraction</h3>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              Upload SDS Document
            </label>
            <input
              type="file"
              onChange={handleFileSelect}
              accept=".pdf,.xls,.xlsx,.csv"
              className="w-full px-4 py-2 rounded-lg bg-gray-900 border border-gray-700 text-white"
            />
            {file && (
              <p className="text-sm text-gray-400 mt-2">
                Selected: {file.name}
              </p>
            )}
          </div>

          <button
            onClick={handleParse}
            disabled={!file || parsing}
            className="w-full px-4 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold transition"
          >
            {parsing ? (
              <>
                <i className="ri-loader-4-line animate-spin mr-2"></i>
                Parsing SDS...
              </>
            ) : (
              <>
                <i className="ri-file-text-line mr-2"></i>
                Parse SDS
              </>
            )}
          </button>
        </div>
      </div>

      {result && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gray-800 rounded-xl p-6 border border-gray-700"
        >
          <h3 className="text-lg font-semibold mb-4">Extraction Results</h3>
          <p className="text-gray-400">Extracted data will be displayed here</p>
        </motion.div>
      )}
    </div>
  );
}

// ============================================================================
// OTHER TAB COMPONENTS
// ============================================================================

function SDSComparisonTab() {
  const [sds1, setSds1] = useState<string>("");
  const [sds2, setSds2] = useState<string>("");
  const [comparing, setComparing] = useState(false);
  const [comparison, setComparison] = useState<any>(null);

  const handleCompare = async () => {
    if (!sds1 || !sds2) return;

    setComparing(true);
    try {
      const response = await fetch("/api/chemical/msds/compare", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ msds1Id: sds1, msds2Id: sds2 }),
      });
      const result = await response.json();
      if (result.success) {
        setComparison(result.comparison);
      }
    } catch (error) {
      console.error("Comparison error:", error);
    } finally {
      setComparing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Comparison Selector */}
      <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <i className="ri-file-compare-line text-cyan-400"></i>
          SDS Comparison Tool
        </h3>
        <div className="grid md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              First SDS
            </label>
            <select
              value={sds1}
              onChange={(e) => setSds1(e.target.value)}
              className="w-full px-4 py-2 rounded-lg bg-gray-900 border border-gray-700 text-white"
            >
              <option value="">Select SDS...</option>
              <option value="sds1">SDS 1 - Sulfuric Acid</option>
              <option value="sds2">SDS 2 - Sodium Hydroxide</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              Second SDS
            </label>
            <select
              value={sds2}
              onChange={(e) => setSds2(e.target.value)}
              className="w-full px-4 py-2 rounded-lg bg-gray-900 border border-gray-700 text-white"
            >
              <option value="">Select SDS...</option>
              <option value="sds1">SDS 1 - Sulfuric Acid</option>
              <option value="sds2">SDS 2 - Sodium Hydroxide</option>
            </select>
          </div>
        </div>
        <button
          onClick={handleCompare}
          disabled={!sds1 || !sds2 || comparing}
          className="w-full px-4 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold transition"
        >
          {comparing ? (
            <>
              <i className="ri-loader-4-line animate-spin mr-2"></i>
              Comparing...
            </>
          ) : (
            <>
              <i className="ri-file-compare-line mr-2"></i>
              Compare SDS Documents
            </>
          )}
        </button>
      </div>

      {/* Comparison Results */}
      {comparison && (
        <div className="space-y-4">
          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <h4 className="font-bold mb-3 text-red-400">
              Differences ({comparison.differences?.length || 0})
            </h4>
            <ul className="space-y-2">
              {comparison.differences?.map((diff: string, idx: number) => (
                <li
                  key={idx}
                  className="flex items-start gap-2 text-sm text-gray-300"
                >
                  <i className="ri-arrow-right-line text-red-400 mt-0.5"></i>
                  {diff}
                </li>
              ))}
            </ul>
          </div>
          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <h4 className="font-bold mb-3 text-green-400">
              Similarities ({comparison.similarities?.length || 0})
            </h4>
            <ul className="space-y-2">
              {comparison.similarities?.map((sim: string, idx: number) => (
                <li
                  key={idx}
                  className="flex items-start gap-2 text-sm text-gray-300"
                >
                  <i className="ri-check-line text-green-400 mt-0.5"></i>
                  {sim}
                </li>
              ))}
            </ul>
          </div>
          {comparison.recommendations &&
            comparison.recommendations.length > 0 && (
              <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
                <h4 className="font-bold mb-3 text-cyan-400">
                  Recommendations
                </h4>
                <ul className="space-y-2">
                  {comparison.recommendations.map(
                    (rec: string, idx: number) => (
                      <li
                        key={idx}
                        className="flex items-start gap-2 text-sm text-gray-300"
                      >
                        <i className="ri-lightbulb-line text-cyan-400 mt-0.5"></i>
                        {rec}
                      </li>
                    ),
                  )}
                </ul>
              </div>
            )}
        </div>
      )}
    </div>
  );
}

function SDSComplianceTab() {
  const [selectedSds, setSelectedSds] = useState<string>("");
  const [checking, setChecking] = useState(false);
  const [compliance, setCompliance] = useState<any>(null);

  const handleCheck = async () => {
    if (!selectedSds) return;

    setChecking(true);
    try {
      const response = await fetch("/api/chemical/msds/compliance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ msdsId: selectedSds }),
      });
      const result = await response.json();
      if (result.success) {
        setCompliance(result.compliance);
      }
    } catch (error) {
      console.error("Compliance check error:", error);
    } finally {
      setChecking(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Compliance Checker */}
      <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <i className="ri-shield-check-line text-cyan-400"></i>
          SDS Compliance Checker
        </h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              Select SDS Document
            </label>
            <select
              value={selectedSds}
              onChange={(e) => setSelectedSds(e.target.value)}
              className="w-full px-4 py-2 rounded-lg bg-gray-900 border border-gray-700 text-white"
            >
              <option value="">Select SDS...</option>
              <option value="sds1">SDS 1 - Sulfuric Acid</option>
              <option value="sds2">SDS 2 - Sodium Hydroxide</option>
            </select>
          </div>
          <button
            onClick={handleCheck}
            disabled={!selectedSds || checking}
            className="w-full px-4 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold transition"
          >
            {checking ? (
              <>
                <i className="ri-loader-4-line animate-spin mr-2"></i>
                Checking Compliance...
              </>
            ) : (
              <>
                <i className="ri-shield-check-line mr-2"></i>
                Check Compliance
              </>
            )}
          </button>
        </div>
      </div>

      {/* Compliance Results */}
      {compliance && (
        <div className="space-y-4">
          <div
            className={`p-6 rounded-xl border ${
              compliance.compliant
                ? "bg-green-900/20 border-green-500/30"
                : "bg-red-900/20 border-red-500/30"
            }`}
          >
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-lg font-bold">
                {compliance.compliant ? "✓ Compliant" : "✗ Non-Compliant"}
              </h4>
              <span className="text-2xl font-bold">{compliance.score}/100</span>
            </div>
            {compliance.issues && compliance.issues.length > 0 && (
              <div>
                <p className="text-sm font-semibold text-red-400 mb-2">
                  Issues Found:
                </p>
                <ul className="space-y-1">
                  {compliance.issues.map((issue: string, idx: number) => (
                    <li
                      key={idx}
                      className="text-sm text-gray-300 flex items-start gap-2"
                    >
                      <i className="ri-close-circle-line text-red-400 mt-0.5"></i>
                      {issue}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
          {compliance.recommendations &&
            compliance.recommendations.length > 0 && (
              <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
                <h4 className="font-bold mb-3 text-cyan-400">
                  Recommendations
                </h4>
                <ul className="space-y-2">
                  {compliance.recommendations.map(
                    (rec: string, idx: number) => (
                      <li
                        key={idx}
                        className="flex items-start gap-2 text-sm text-gray-300"
                      >
                        <i className="ri-lightbulb-line text-cyan-400 mt-0.5"></i>
                        {rec}
                      </li>
                    ),
                  )}
                </ul>
              </div>
            )}
        </div>
      )}
    </div>
  );
}
