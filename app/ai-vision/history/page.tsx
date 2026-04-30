/**
 * AI Vision Analysis History Page
 * View, search, and filter past vision analyses
 */

"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import PageTemplate from "@/components/PageTemplate";
import { useRouter } from "next/navigation";

interface AnalysisHistory {
  id: string;
  analysisId: string;
  fileName?: string;
  timestamp: string;
  createdAt: string;
  isCompliant: boolean;
  complianceScore: number;
  mode: string;
  fileUrl?: string;
  thumbnailUrl?: string;
  totalIssues?: number;
  criticalIssues?: number;
  summary?: string;
  hazards?: Array<{
    type: string;
    severity: "low" | "medium" | "high";
    description: string;
  }>;
}

export default function VisionAnalysisHistoryPage() {
  const router = useRouter();
  const [analyses, setAnalyses] = useState<AnalysisHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterMode, setFilterMode] = useState<string>("all");
  const [filterCompliance, setFilterCompliance] = useState<string>("all");
  const [selectedAnalysis, setSelectedAnalysis] =
    useState<AnalysisHistory | null>(null);
  const [dateRange, setDateRange] = useState<{ start: string; end: string }>({
    start: "",
    end: "",
  });

  useEffect(() => {
    loadAnalyses();
  }, [filterMode, filterCompliance, dateRange]);

  const loadAnalyses = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterMode !== "all") params.append("mode", filterMode);
      if (dateRange.start) params.append("startDate", dateRange.start);
      if (dateRange.end) params.append("endDate", dateRange.end);
      params.append("limit", "100");

      const response = await fetch(`/api/vision-analysis?${params.toString()}`);
      const data = await response.json();

      if (data.success && data.analyses) {
        let filtered = data.analyses;

        // Filter by compliance status
        if (filterCompliance === "compliant") {
          filtered = filtered.filter((a: AnalysisHistory) => a.isCompliant);
        } else if (filterCompliance === "non-compliant") {
          filtered = filtered.filter((a: AnalysisHistory) => !a.isCompliant);
        }

        // Filter by search term
        if (searchTerm) {
          filtered = filtered.filter((a: AnalysisHistory) => {
            const searchLower = searchTerm.toLowerCase();
            return (
              a.fileName?.toLowerCase().includes(searchLower) ||
              a.summary?.toLowerCase().includes(searchLower) ||
              a.analysisId.toLowerCase().includes(searchLower)
            );
          });
        }

        setAnalyses(filtered);
      }
    } catch (error) {
      console.error("Error loading analyses:", error);
    } finally {
      setLoading(false);
    }
  };

  const stats = {
    total: analyses.length,
    compliant: analyses.filter((a) => a.isCompliant).length,
    nonCompliant: analyses.filter((a) => !a.isCompliant).length,
    critical: analyses.filter((a) => (a.criticalIssues || 0) > 0).length,
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "high":
        return "bg-red-900/30 text-red-400 border-red-500/30";
      case "medium":
        return "bg-yellow-900/30 text-yellow-400 border-yellow-500/30";
      default:
        return "bg-blue-900/30 text-blue-400 border-blue-500/30";
    }
  };

  return (
    <PageTemplate
      title="Analysis History"
      description="View and search past AI vision analyses"
      icon="ri-history-line"
      stats={[
        {
          label: "Total Analyses",
          value: stats.total,
          icon: "ri-file-list-line",
        },
        {
          label: "Compliant",
          value: stats.compliant,
          icon: "ri-checkbox-circle-line",
        },
        {
          label: "Non-Compliant",
          value: stats.nonCompliant,
          icon: "ri-close-circle-line",
        },
        {
          label: "Critical Issues",
          value: stats.critical,
          icon: "ri-alert-line",
        },
      ]}
    >
      {/* Filters */}
      <div className="mb-6 bg-gray-800 border border-gray-700 rounded-xl p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium mb-2 text-gray-200">
              Search
            </label>
            <div className="relative">
              <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"></i>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by filename, summary, or ID..."
                className="w-full pl-10 pr-4 py-2 rounded-lg bg-gray-700 text-white border border-gray-600 focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          {/* Mode Filter */}
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-200">
              Mode
            </label>
            <select
              value={filterMode}
              onChange={(e) => setFilterMode(e.target.value)}
              className="w-full px-4 py-2 rounded-lg bg-gray-700 text-white border border-gray-600 focus:outline-none focus:border-cyan-500"
            >
              <option value="all">All Modes</option>
              <option value="general">General</option>
              <option value="chemical">Chemical</option>
              <option value="ppe">PPE</option>
              <option value="storage">Storage</option>
            </select>
          </div>

          {/* Compliance Filter */}
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-200">
              Compliance
            </label>
            <select
              value={filterCompliance}
              onChange={(e) => setFilterCompliance(e.target.value)}
              className="w-full px-4 py-2 rounded-lg bg-gray-700 text-white border border-gray-600 focus:outline-none focus:border-cyan-500"
            >
              <option value="all">All</option>
              <option value="compliant">Compliant</option>
              <option value="non-compliant">Non-Compliant</option>
            </select>
          </div>
        </div>

        {/* Date Range */}
        <div className="grid grid-cols-2 gap-4 mt-4">
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-200">
              Start Date
            </label>
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) =>
                setDateRange({ ...dateRange, start: e.target.value })
              }
              className="w-full px-4 py-2 rounded-lg bg-gray-700 text-white border border-gray-600 focus:outline-none focus:border-cyan-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-200">
              End Date
            </label>
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) =>
                setDateRange({ ...dateRange, end: e.target.value })
              }
              className="w-full px-4 py-2 rounded-lg bg-gray-700 text-white border border-gray-600 focus:outline-none focus:border-cyan-500"
            />
          </div>
        </div>
      </div>

      {/* Analyses Grid */}
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-cyan-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading analyses...</p>
        </div>
      ) : analyses.length === 0 ? (
        <div className="text-center py-12 bg-gray-800 border border-gray-700 rounded-xl">
          <i className="ri-file-list-line text-5xl text-gray-500 mb-3"></i>
          <p className="text-gray-400">No analyses found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {analyses.map((analysis) => (
            <motion.div
              key={analysis.id || analysis.analysisId}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              onClick={() => setSelectedAnalysis(analysis)}
              className="bg-gray-800 border border-gray-700 rounded-xl p-6 cursor-pointer hover:border-cyan-500 transition-all"
            >
              {analysis.thumbnailUrl && (
                <div className="mb-4 rounded-lg overflow-hidden">
                  <img
                    src={analysis.thumbnailUrl}
                    alt="Analysis thumbnail"
                    className="w-full h-48 object-cover"
                  />
                </div>
              )}

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-400">
                    {new Date(
                      analysis.timestamp || analysis.createdAt,
                    ).toLocaleString()}
                  </span>
                  <span
                    className={`px-2 py-1 rounded text-xs ${
                      analysis.isCompliant
                        ? "bg-green-900/30 text-green-400"
                        : "bg-red-900/30 text-red-400"
                    }`}
                  >
                    {analysis.isCompliant ? "Compliant" : "Non-Compliant"}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-white capitalize">
                    {analysis.mode}
                  </span>
                  <span
                    className={`text-lg font-bold ${
                      analysis.complianceScore >= 90
                        ? "text-green-400"
                        : analysis.complianceScore >= 70
                          ? "text-yellow-400"
                          : "text-red-400"
                    }`}
                  >
                    {analysis.complianceScore}/100
                  </span>
                </div>

                {analysis.summary && (
                  <p className="text-sm text-gray-300 line-clamp-2">
                    {analysis.summary}
                  </p>
                )}

                {analysis.totalIssues !== undefined && (
                  <div className="flex gap-2 mt-4">
                    {analysis.totalIssues > 0 && (
                      <span className="px-2 py-1 rounded text-xs bg-yellow-900/30 text-yellow-400">
                        {analysis.totalIssues} Issue
                        {analysis.totalIssues !== 1 ? "s" : ""}
                      </span>
                    )}
                    {analysis.criticalIssues && analysis.criticalIssues > 0 && (
                      <span className="px-2 py-1 rounded text-xs bg-red-900/30 text-red-400">
                        {analysis.criticalIssues} Critical
                      </span>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Analysis Detail Modal */}
      {selectedAnalysis && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedAnalysis(null)}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-gray-800 border border-gray-700 rounded-xl p-8 max-w-4xl w-full max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-white">
                Analysis Details
              </h3>
              <button
                onClick={() => setSelectedAnalysis(null)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <i className="ri-close-line text-2xl"></i>
              </button>
            </div>

            {selectedAnalysis.fileUrl && (
              <div className="mb-6 rounded-lg overflow-hidden">
                <img
                  src={selectedAnalysis.fileUrl}
                  alt="Analysis image"
                  className="w-full max-h-96 object-contain bg-gray-900"
                />
              </div>
            )}

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-400">Analysis ID</p>
                  <p className="text-white font-mono text-sm">
                    {selectedAnalysis.analysisId}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Mode</p>
                  <p className="text-white capitalize">
                    {selectedAnalysis.mode}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Compliance Score</p>
                  <p
                    className={`text-2xl font-bold ${
                      selectedAnalysis.complianceScore >= 90
                        ? "text-green-400"
                        : selectedAnalysis.complianceScore >= 70
                          ? "text-yellow-400"
                          : "text-red-400"
                    }`}
                  >
                    {selectedAnalysis.complianceScore}/100
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Status</p>
                  <p
                    className={`font-semibold ${
                      selectedAnalysis.isCompliant
                        ? "text-green-400"
                        : "text-red-400"
                    }`}
                  >
                    {selectedAnalysis.isCompliant
                      ? "Compliant"
                      : "Non-Compliant"}
                  </p>
                </div>
              </div>

              {selectedAnalysis.summary && (
                <div>
                  <p className="text-sm text-gray-400 mb-2">Summary</p>
                  <p className="text-white">{selectedAnalysis.summary}</p>
                </div>
              )}

              {selectedAnalysis.hazards &&
                selectedAnalysis.hazards.length > 0 && (
                  <div>
                    <p className="text-sm text-gray-400 mb-2">
                      Hazards Detected
                    </p>
                    <div className="space-y-2">
                      {selectedAnalysis.hazards.map((hazard, idx) => (
                        <div
                          key={idx}
                          className={`p-3 rounded-lg border ${getSeverityColor(hazard.severity)}`}
                        >
                          <div className="flex justify-between mb-1">
                            <span className="font-medium">{hazard.type}</span>
                            <span className="text-xs capitalize">
                              {hazard.severity}
                            </span>
                          </div>
                          <p className="text-sm">{hazard.description}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              <div>
                <p className="text-sm text-gray-400 mb-2">Timestamp</p>
                <p className="text-white">
                  {new Date(
                    selectedAnalysis.timestamp || selectedAnalysis.createdAt,
                  ).toLocaleString()}
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </PageTemplate>
  );
}
