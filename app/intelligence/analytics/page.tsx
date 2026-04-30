/**
 * Analytics Command Center
 * Unified analytics from all modules
 */

"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import PageTemplate from "@/components/PageTemplate";
import { motion } from "framer-motion";
import IntelligenceErrorBoundary from "@/components/intelligence-analytics/ErrorBoundary";
import LoadingState from "@/components/intelligence-analytics/LoadingState";
import EmptyState from "@/components/intelligence-analytics/EmptyState";
import type { UnifiedAnalytics } from "@/types/intelligence-analytics";

export default function AnalyticsPage() {
  const { user } = useAuth();
  const [analytics, setAnalytics] = useState<UnifiedAnalytics | null>(null);
  const [loading, setLoading] = useState(false);

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/intelligence-analytics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "analytics",
          tenantId: user?.tenantId || "tenant-1",
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
        setAnalytics(data);
      }
    } catch (error) {
      console.error("Error loading analytics:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAnalytics();
  }, []);

  const stats = [
    {
      label: "Total Events",
      value: analytics?.aggregatedMetrics.totalEvents || 0,
      icon: "ri-database-2-line",
      tooltip: "Total events across modules",
      trend: "up" as const,
    },
    {
      label: "Total Issues",
      value: analytics?.aggregatedMetrics.totalIssues || 0,
      icon: "ri-alert-line",
      tooltip: "Total issues detected",
      trend: "down" as const,
    },
    {
      label: "Compliance Rate",
      value: `${Math.round(analytics?.aggregatedMetrics.complianceRate || 0)}%`,
      icon: "ri-shield-check-line",
      tooltip: "Overall compliance rate",
      trend: "up" as const,
    },
    {
      label: "Efficiency",
      value: `${Math.round(analytics?.aggregatedMetrics.efficiency || 0)}%`,
      icon: "ri-speed-up-line",
      tooltip: "Overall efficiency",
      trend: "up" as const,
    },
  ];

  return (
    <PageTemplate
      title="Analytics"
      description="Unified analytics dashboard aggregating insights from all modules with cross-module comparisons and real-time updates"
      shortDescription="Unified analytics"
      icon="ri-bar-chart-box-line"
      systemInfo={{
        sap: "Analytics",
        oracle: "Business Intelligence",
        manhattan: "Analytics Dashboard",
      }}
      examples={[
        "Cross-module analytics",
        "Unified metrics",
        "Module comparisons",
        "Real-time insights",
        "Trend analysis",
        "Performance tracking",
      ]}
      stats={stats}
      actions={
        <button
          onClick={loadAnalytics}
          disabled={loading}
          className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
        >
          {loading ? (
            <>
              <i className="ri-loader-4-line animate-spin mr-2"></i>
              Loading...
            </>
          ) : (
            <>
              <i className="ri-refresh-line mr-2"></i>
              Refresh
            </>
          )}
        </button>
      }
    >
      <IntelligenceErrorBoundary>
        {error ? (
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <i className="ri-error-warning-line text-2xl text-red-400"></i>
              <h3 className="text-lg font-semibold text-white">
                Error Loading Analytics
              </h3>
            </div>
            <p className="text-sm text-[#9ca3af] mb-4">{error}</p>
            <button
              onClick={loadAnalytics}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors"
            >
              <i className="ri-refresh-line mr-2"></i>
              Retry
            </button>
          </div>
        ) : loading ? (
          <LoadingState message="Aggregating analytics from all modules..." />
        ) : !analytics ? (
          <EmptyState
            icon="ri-bar-chart-box-line"
            title="No Analytics Data Yet"
            description="Analytics will be aggregated from all modules automatically."
            action={{
              label: "Load Analytics",
              onClick: loadAnalytics,
            }}
          />
        ) : (
          <div className="space-y-6">
            {/* Module Analytics */}
            {Object.keys(analytics.moduleAnalytics).length > 0 && (
              <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-white mb-4">
                  Module Analytics
                </h3>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {Object.entries(analytics.moduleAnalytics).map(
                    ([moduleId, moduleAnalytics]) => (
                      <div key={moduleId} className="bg-white/5 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-white">
                            {moduleId.toUpperCase()}
                          </span>
                          <span
                            className={`text-xs px-2 py-1 rounded ${
                              moduleAnalytics.performance.trend === "UP"
                                ? "bg-green-500/20 text-green-400"
                                : moduleAnalytics.performance.trend === "DOWN"
                                  ? "bg-red-500/20 text-red-400"
                                  : "bg-gray-500/20 text-gray-400"
                            }`}
                          >
                            {moduleAnalytics.performance.trend}
                          </span>
                        </div>
                        <div className="text-2xl font-bold text-cyan-400 mb-1">
                          {Math.round(moduleAnalytics.performance.score)}%
                        </div>
                        <div className="text-xs text-[#9ca3af]">
                          Performance Score
                        </div>
                        <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                          <div>
                            <div className="text-[#9ca3af]">Events</div>
                            <div className="text-white font-medium">
                              {moduleAnalytics.metrics.totalEvents}
                            </div>
                          </div>
                          <div>
                            <div className="text-[#9ca3af]">Errors</div>
                            <div className="text-white font-medium">
                              {moduleAnalytics.metrics.errorEvents}
                            </div>
                          </div>
                        </div>
                      </div>
                    ),
                  )}
                </div>
              </div>
            )}

            {/* Insights */}
            {analytics.insights.length > 0 && (
              <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-white mb-4">
                  Intelligence Insights
                </h3>
                <div className="space-y-3">
                  {analytics.insights.map((insight) => (
                    <div key={insight.id} className="bg-white/5 rounded-lg p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span
                              className={`px-2 py-1 rounded text-xs font-medium ${
                                insight.type === "RISK"
                                  ? "bg-red-500/20 text-red-400"
                                  : insight.type === "OPPORTUNITY"
                                    ? "bg-green-500/20 text-green-400"
                                    : "bg-blue-500/20 text-blue-400"
                              }`}
                            >
                              {insight.type}
                            </span>
                            <span
                              className={`px-2 py-1 rounded text-xs font-medium ${
                                insight.impact === "HIGH"
                                  ? "bg-red-500/20 text-red-400"
                                  : insight.impact === "MEDIUM"
                                    ? "bg-yellow-500/20 text-yellow-400"
                                    : "bg-gray-500/20 text-gray-400"
                              }`}
                            >
                              {insight.impact}
                            </span>
                          </div>
                          <h4 className="text-sm font-semibold text-white">
                            {insight.title}
                          </h4>
                          <p className="text-xs text-[#9ca3af] mt-1">
                            {insight.description}
                          </p>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-bold text-cyan-400">
                            {insight.confidence}%
                          </div>
                          <div className="text-xs text-[#9ca3af]">
                            Confidence
                          </div>
                        </div>
                      </div>
                      {insight.recommendations.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-white/10">
                          <div className="text-xs text-[#9ca3af] mb-1">
                            Recommendations
                          </div>
                          <ul className="space-y-1">
                            {insight.recommendations
                              .slice(0, 2)
                              .map((rec, idx) => (
                                <li
                                  key={idx}
                                  className="text-xs text-white flex items-center gap-2"
                                >
                                  <i className="ri-arrow-right-line text-green-400"></i>
                                  {rec}
                                </li>
                              ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </IntelligenceErrorBoundary>
    </PageTemplate>
  );
}
