/**
 * Root Cause Analysis Hub
 * Unified root cause analysis from all modules
 */

"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import PageTemplate from "@/components/PageTemplate";
import { motion } from "framer-motion";
import type { UnifiedRootCauseAnalysis } from "@/types/intelligence-analytics";
import { IntelligenceErrorBoundary } from "@/components/intelligence-analytics/ErrorBoundary";
import LoadingState from "@/components/intelligence-analytics/LoadingState";
import EmptyState from "@/components/intelligence-analytics/EmptyState";

export default function RootCauseAnalysisPage() {
  const { user } = useAuth();
  const [rcas, setRcas] = useState<UnifiedRootCauseAnalysis[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedRCA, setSelectedRCA] =
    useState<UnifiedRootCauseAnalysis | null>(null);

  useEffect(() => {
    loadRCAs();
  }, [user?.tenantId]);

  const loadRCAs = async () => {
    try {
      setLoading(true);
      setError(null);
      const tenantId = user?.tenantId || "tenant-1";
      const response = await fetch(
        `/api/intelligence/root-cause?tenantId=${encodeURIComponent(tenantId)}`,
        {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        },
      );
      if (response.ok) {
        const data = await response.json();
        // Handle both response formats: { rcas } or { result }
        const rcas =
          data.rcas ||
          (Array.isArray(data.result)
            ? data.result
            : [data.result].filter(Boolean));
        setRcas(Array.isArray(rcas) ? rcas : []);
        setError(null);
      } else {
        const errorData = await response.json().catch(() => ({}));
        setError(errorData.error || "Failed to load root cause analyses");
      }
    } catch (error) {
      console.error("Error loading RCAs:", error);
      setError(
        error instanceof Error
          ? error.message
          : "Failed to load root cause analyses",
      );
    } finally {
      setLoading(false);
    }
  };

  const stats = [
    {
      label: "Total Analyses",
      value: rcas.length,
      icon: "ri-search-line",
      tooltip: "Total root cause analyses",
      trend: "up" as const,
    },
    {
      label: "Validated",
      value: rcas.filter((r) => r.validated).length,
      icon: "ri-checkbox-circle-line",
      tooltip: "Validated root causes",
      trend: "up" as const,
    },
    {
      label: "Avg Confidence",
      value:
        rcas.length > 0
          ? Math.round(
              rcas.reduce((sum, r) => sum + r.confidence, 0) / rcas.length,
            )
          : 0,
      icon: "ri-target-line",
      tooltip: "Average confidence level",
      trend: "neutral" as const,
    },
    {
      label: "Cross-Module",
      value: rcas.filter((r) => r.sourceModules.length > 1).length,
      icon: "ri-link-m",
      tooltip: "Cross-module analyses",
      trend: "up" as const,
    },
  ];

  return (
    <PageTemplate
      title="Root Cause Analysis"
      description="Unified root cause analysis across all modules with AI-powered analysis, evidence collection, and cross-module correlation"
      shortDescription="AI-powered root cause analysis"
      icon="ri-search-line"
      systemInfo={{
        sap: "Root Cause Analysis",
        oracle: "RCA Engine",
        manhattan: "Issue Analysis",
      }}
      examples={[
        "Cross-module root cause analysis",
        "AI-powered primary cause identification",
        "Evidence from all modules",
        "Correlation analysis",
        "Causal chain visualization",
        "Automated recommendations",
      ]}
      stats={stats}
    >
      <IntelligenceErrorBoundary>
        {error ? (
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <i className="ri-error-warning-line text-2xl text-red-400"></i>
              <h3 className="text-lg font-semibold text-white">
                Error Loading Data
              </h3>
            </div>
            <p className="text-sm text-[#9ca3af] mb-4">{error}</p>
            <button
              onClick={loadRCAs}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors"
            >
              <i className="ri-refresh-line mr-2"></i>
              Retry
            </button>
          </div>
        ) : loading ? (
          <LoadingState message="Loading root cause analyses..." />
        ) : rcas.length === 0 ? (
          <EmptyState
            icon="ri-search-line"
            title="No Root Cause Analyses Yet"
            description="Root cause analyses will appear here automatically when issues are detected across modules."
            action={{
              label: "Refresh",
              onClick: loadRCAs,
            }}
          />
        ) : (
          <div className="grid gap-4">
            {rcas.map((rca, index) => (
              <motion.div
                key={rca.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-6 hover:border-cyan-500/50 transition-all cursor-pointer"
                onClick={() => setSelectedRCA(rca)}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="px-2 py-1 rounded text-xs font-medium bg-cyan-500/20 text-cyan-400">
                        {rca.issueType}
                      </span>
                      {rca.sourceModules.length > 1 && (
                        <span className="px-2 py-1 rounded text-xs font-medium bg-purple-500/20 text-purple-400">
                          Cross-Module
                        </span>
                      )}
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${
                          rca.validated
                            ? "bg-green-500/20 text-green-400"
                            : "bg-yellow-500/20 text-yellow-400"
                        }`}
                      >
                        {rca.validated ? "Validated" : "Pending"}
                      </span>
                    </div>
                    <h3 className="text-lg font-semibold text-white mb-1">
                      {rca.issueDescription}
                    </h3>
                    <p className="text-sm text-[#9ca3af]">
                      {rca.sourceModules.join(", ")} •{" "}
                      {new Date(rca.detectedAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-cyan-400">
                      {Math.round(rca.confidence)}%
                    </div>
                    <div className="text-xs text-[#9ca3af]">Confidence</div>
                  </div>
                </div>
                <div className="grid md:grid-cols-3 gap-4 mb-4">
                  <div>
                    <div className="text-xs text-[#9ca3af] mb-1">
                      Root Causes
                    </div>
                    <div className="text-sm font-medium text-white">
                      {rca.rootCauses.length}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-[#9ca3af] mb-1">Evidence</div>
                    <div className="text-sm font-medium text-white">
                      {rca.evidence.length}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-[#9ca3af] mb-1">
                      Recommendations
                    </div>
                    <div className="text-sm font-medium text-white">
                      {rca.recommendations.length}
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between pt-4 border-t border-white/10">
                  <div className="text-xs text-[#9ca3af]">
                    Method: {rca.analysisMethod.replace(/_/g, " ")}
                  </div>
                  <button className="text-sm text-cyan-400 hover:text-cyan-300">
                    View Details <i className="ri-arrow-right-line ml-1"></i>
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </IntelligenceErrorBoundary>
    </PageTemplate>
  );
}
