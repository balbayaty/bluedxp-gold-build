/**
 * Process Mining Explorer
 * Cross-module process discovery and optimization
 */

"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import PageTemplate from "@/components/PageTemplate";
import { motion } from "framer-motion";
import IntelligenceErrorBoundary from "@/components/intelligence-analytics/ErrorBoundary";
import LoadingState from "@/components/intelligence-analytics/LoadingState";
import EmptyState from "@/components/intelligence-analytics/EmptyState";
import type { ProcessMiningResult } from "@/types/intelligence-analytics";

export default function ProcessMiningPage() {
  const { user } = useAuth();
  const [results, setResults] = useState<ProcessMiningResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedProcessType, setSelectedProcessType] = useState("GENERAL");

  const loadResults = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/intelligence-analytics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "process-mining",
          tenantId: user?.tenantId || "tenant-1",
          processType: selectedProcessType,
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
        setResults([data]);
      }
    } catch (error) {
      console.error("Error discovering process:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadResults();
  }, [selectedProcessType]);

  const stats = [
    {
      label: "Processes",
      value: results.length,
      icon: "ri-flow-chart-line",
      tooltip: "Discovered processes",
      trend: "up" as const,
    },
    {
      label: "Variants",
      value: results.reduce((sum, r) => sum + r.variants.length, 0),
      icon: "ri-shape-line",
      tooltip: "Process variants",
      trend: "up" as const,
    },
    {
      label: "Deviations",
      value: results.reduce((sum, r) => sum + r.deviations.length, 0),
      icon: "ri-alert-line",
      tooltip: "Deviations detected",
      trend: "down" as const,
    },
    {
      label: "Avg Efficiency",
      value:
        results.length > 0
          ? Math.round(
              results.reduce((sum, r) => sum + r.performance.efficiency, 0) /
                results.length,
            )
          : 0,
      icon: "ri-speed-up-line",
      tooltip: "Average efficiency",
      trend: "up" as const,
    },
  ];

  return (
    <PageTemplate
      title="Process Mining"
      description="Discover, analyze, and optimize business processes through AI-powered process mining across all modules"
      shortDescription="AI-powered process discovery"
      icon="ri-flow-chart-line"
      systemInfo={{
        sap: "Process Mining",
        oracle: "Process Discovery",
        manhattan: "Process Intelligence",
      }}
      examples={[
        "Cross-module process discovery",
        "Process variant analysis",
        "Conformance checking",
        "Cost mining",
        "Performance optimization",
        "Deviation detection",
      ]}
      stats={stats}
      actions={
        <div className="flex items-center gap-2">
          <select
            value={selectedProcessType}
            onChange={(e) => setSelectedProcessType(e.target.value)}
            className="bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-cyan-500"
          >
            <option value="GENERAL">All Processes</option>
            <option value="ORDER">Order Processing</option>
            <option value="SHIPMENT">Shipment</option>
            <option value="INVENTORY">Inventory</option>
            <option value="COMPLIANCE">Compliance</option>
          </select>
          <button
            onClick={loadResults}
            disabled={loading}
            className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
          >
            {loading ? (
              <>
                <i className="ri-loader-4-line animate-spin mr-2"></i>
                Discovering...
              </>
            ) : (
              <>
                <i className="ri-refresh-line mr-2"></i>
                Discover
              </>
            )}
          </button>
        </div>
      }
    >
      <IntelligenceErrorBoundary>
        {error ? (
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
        ) : loading ? (
          <LoadingState message="Discovering processes across all modules..." />
        ) : results.length === 0 ? (
          <EmptyState
            icon="ri-flow-chart-line"
            title="No Processes Discovered Yet"
            description="Discover processes from event data across all modules."
            action={{
              label: "Discover Processes",
              onClick: loadResults,
            }}
          />
        ) : (
          <div className="space-y-6">
            {results.map((result) => (
              <div
                key={result.id}
                className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-6"
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-1">
                      {result.processName}
                    </h3>
                    <p className="text-sm text-[#9ca3af]">
                      {result.sourceModules.join(", ")} • {result.caseCount}{" "}
                      cases • {result.eventCount} events
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-cyan-400">
                      {Math.round(result.performance.efficiency)}%
                    </div>
                    <div className="text-xs text-[#9ca3af]">Efficiency</div>
                  </div>
                </div>
                <div className="grid md:grid-cols-4 gap-4 mb-4">
                  <div>
                    <div className="text-xs text-[#9ca3af] mb-1">Variants</div>
                    <div className="text-sm font-medium text-white">
                      {result.variants.length}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-[#9ca3af] mb-1">
                      Deviations
                    </div>
                    <div className="text-sm font-medium text-white">
                      {result.deviations.length}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-[#9ca3af] mb-1">
                      Avg Duration
                    </div>
                    <div className="text-sm font-medium text-white">
                      {result.performance.averageDuration.toFixed(1)}h
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-[#9ca3af] mb-1">
                      Compliance
                    </div>
                    <div className="text-sm font-medium text-white">
                      {Math.round(result.performance.complianceRate)}%
                    </div>
                  </div>
                </div>
                {result.variants.length > 0 && (
                  <div className="mt-4">
                    <div className="text-sm font-medium text-white mb-2">
                      Top Variants
                    </div>
                    <div className="space-y-2">
                      {result.variants.slice(0, 3).map((variant) => (
                        <div
                          key={variant.id}
                          className="bg-white/5 rounded-lg p-3"
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="text-sm text-white">
                                {variant.variantId}
                              </div>
                              <div className="text-xs text-[#9ca3af]">
                                {variant.frequency} cases (
                                {variant.percentage.toFixed(1)}%)
                              </div>
                            </div>
                            {variant.isOptimal && (
                              <span className="px-2 py-1 rounded text-xs font-medium bg-green-500/20 text-green-400">
                                Optimal
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </IntelligenceErrorBoundary>
    </PageTemplate>
  );
}
