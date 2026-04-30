/**
 * Data Mining Studio
 * Multi-module data mining with pattern detection, anomaly detection, and more
 */

"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import PageTemplate from "@/components/PageTemplate";
import { motion } from "framer-motion";
import { IntelligenceErrorBoundary } from "@/components/intelligence-analytics/ErrorBoundary";
import LoadingState from "@/components/intelligence-analytics/LoadingState";
import EmptyState from "@/components/intelligence-analytics/EmptyState";
import type { DataMiningResult } from "@/types/intelligence-analytics";

export default function DataMiningPage() {
  const { user } = useAuth();
  const [results, setResults] = useState<DataMiningResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedModules, setSelectedModules] = useState<string[]>([]);
  const [selectedAlgorithms, setSelectedAlgorithms] = useState<string[]>([
    "pattern",
    "anomaly",
    "clustering",
  ]);

  const loadResults = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/intelligence-analytics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "data-mining",
          tenantId: user?.tenantId || "tenant-1",
          moduleIds: selectedModules.length > 0 ? selectedModules : undefined,
          algorithms: selectedAlgorithms,
          timeRange: {
            start: new Date(
              Date.now() - 30 * 24 * 60 * 60 * 1000,
            ).toISOString(),
            end: new Date().toISOString(),
          },
        }),
      });
      if (response.ok) {
        const data = await response.json();
        setResults(data.results || []);
        setError(null);
      } else {
        let errorMessage = "Failed to load data mining results";
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorData.message || errorMessage;
        } catch {
          errorMessage = `Failed to load data mining results (${response.status} ${response.statusText})`;
        }
        setError(errorMessage);
        setResults([]);
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : "An unexpected error occurred while running data mining";
      setError(errorMessage);
      console.error("Error running data mining:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadResults();
  }, []);

  const stats = [
    {
      label: "Total Results",
      value: results.length,
      icon: "ri-database-2-line",
      tooltip: "Total data mining results",
      trend: "up" as const,
    },
    {
      label: "Patterns",
      value: results.filter((r) => r.analysisType === "PATTERN").length,
      icon: "ri-shape-line",
      tooltip: "Patterns detected",
      trend: "up" as const,
    },
    {
      label: "Anomalies",
      value: results.filter((r) => r.analysisType === "ANOMALY").length,
      icon: "ri-alert-line",
      tooltip: "Anomalies detected",
      trend: "up" as const,
    },
    {
      label: "Avg Confidence",
      value:
        results.length > 0
          ? Math.round(
              results.reduce((sum, r) => sum + r.confidence, 0) /
                results.length,
            )
          : 0,
      icon: "ri-bar-chart-box-line",
      tooltip: "Average confidence",
      trend: "neutral" as const,
    },
  ];

  const analysisTypeColors = {
    PATTERN: "blue",
    ANOMALY: "red",
    PREDICTION: "purple",
    CLUSTERING: "green",
    ASSOCIATION: "yellow",
    TREND: "cyan",
  };

  return (
    <PageTemplate
      title="Data Mining"
      description="Multi-module data mining with pattern detection, anomaly identification, clustering, association rules, and trend analysis"
      shortDescription="Advanced data mining"
      icon="ri-database-2-line"
      systemInfo={{
        sap: "Data Mining",
        oracle: "Analytics Mining",
        manhattan: "Pattern Detection",
      }}
      examples={[
        "Pattern detection across modules",
        "Anomaly identification",
        "Customer clustering",
        "Association rules",
        "Trend analysis",
        "Predictive insights",
      ]}
      stats={stats}
      actions={
        <div className="flex items-center gap-2">
          <button
            onClick={loadResults}
            disabled={loading}
            className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
          >
            {loading ? (
              <>
                <i className="ri-loader-4-line animate-spin mr-2"></i>
                Mining...
              </>
            ) : (
              <>
                <i className="ri-refresh-line mr-2"></i>
                Run Mining
              </>
            )}
          </button>
        </div>
      }
    >
      <IntelligenceErrorBoundary>
        <div className="space-y-6">
          {/* Filters */}
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-[#9ca3af] mb-2">
                  Algorithms
                </label>
                <div className="flex flex-wrap gap-2">
                  {[
                    "pattern",
                    "anomaly",
                    "clustering",
                    "association",
                    "trend",
                  ].map((alg) => (
                    <button
                      key={alg}
                      onClick={() => {
                        setSelectedAlgorithms((prev) =>
                          prev.includes(alg)
                            ? prev.filter((a) => a !== alg)
                            : [...prev, alg],
                        );
                      }}
                      className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                        selectedAlgorithms.includes(alg)
                          ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30"
                          : "bg-white/5 text-[#9ca3af] border border-white/10"
                      }`}
                    >
                      {alg.charAt(0).toUpperCase() + alg.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Error State */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <i className="ri-error-warning-line text-2xl text-red-400"></i>
                <h3 className="text-lg font-semibold text-white">Error</h3>
              </div>
              <p className="text-sm text-[#9ca3af] mb-4">{error}</p>
              <button
                onClick={loadResults}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors"
              >
                <i className="ri-refresh-line mr-2"></i>
                Retry
              </button>
            </div>
          )}

          {/* Results */}
          {loading ? (
            <LoadingState message="Mining data across all modules..." />
          ) : results.length === 0 ? (
            <EmptyState
              icon="ri-database-2-line"
              title="No Mining Results Yet"
              description="Run data mining to discover patterns, anomalies, and insights across all modules."
              action={{
                label: "Start Mining",
                onClick: loadResults,
              }}
            />
          ) : (
            <div className="grid gap-4">
              {results.map((result, index) => (
                <motion.div
                  key={result.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-6 hover:border-cyan-500/50 transition-all"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium bg-${analysisTypeColors[result.analysisType] || "cyan"}-500/20 text-${analysisTypeColors[result.analysisType] || "cyan"}-400`}
                        >
                          {result.analysisType.replace(/_/g, " ")}
                        </span>
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium ${
                            result.impact === "HIGH"
                              ? "bg-red-500/20 text-red-400"
                              : result.impact === "MEDIUM"
                                ? "bg-yellow-500/20 text-yellow-400"
                                : "bg-gray-500/20 text-gray-400"
                          }`}
                        >
                          {result.impact}
                        </span>
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium ${
                            result.status === "NEW"
                              ? "bg-yellow-500/20 text-yellow-400"
                              : result.status === "REVIEWED"
                                ? "bg-blue-500/20 text-blue-400"
                                : "bg-gray-500/20 text-gray-400"
                          }`}
                        >
                          {result.status.replace(/_/g, " ")}
                        </span>
                      </div>
                      <h3 className="text-lg font-semibold text-white mb-1">
                        {result.title}
                      </h3>
                      <p className="text-sm text-[#9ca3af] mb-2">
                        {result.description}
                      </p>
                      <p className="text-xs text-[#9ca3af]">
                        Modules: {result.sourceModules.join(", ")} •{" "}
                        {new Date(result.generatedAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-cyan-400">
                        {Math.round(result.confidence)}%
                      </div>
                      <div className="text-xs text-[#9ca3af]">Confidence</div>
                    </div>
                  </div>
                  <div className="grid md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <div className="text-xs text-[#9ca3af] mb-2">
                        Key Findings
                      </div>
                      <ul className="space-y-1">
                        {result.findings.slice(0, 3).map((finding, idx) => (
                          <li
                            key={idx}
                            className="text-sm text-white flex items-center gap-2"
                          >
                            <i className="ri-checkbox-circle-line text-cyan-400"></i>
                            {finding.metric}: {finding.value.toFixed(1)}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <div className="text-xs text-[#9ca3af] mb-2">
                        Recommendations
                      </div>
                      <ul className="space-y-1">
                        {result.recommendations.slice(0, 3).map((rec, idx) => (
                          <li
                            key={idx}
                            className="text-sm text-white flex items-center gap-2"
                          >
                            <i className="ri-arrow-right-line text-green-400"></i>
                            {rec}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </IntelligenceErrorBoundary>
    </PageTemplate>
  );
}
