/**
 * Unified Intelligence Dashboard
 *
 * Single entry point for all intelligence capabilities:
 * - Root Cause Analysis
 * - Data Mining
 * - Process Mining
 * - Analytics
 */

"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import PageTemplate from "@/components/PageTemplate";
import { motion } from "framer-motion";
import { IntelligenceErrorBoundary } from "@/components/intelligence-analytics/ErrorBoundary";
import LoadingState from "@/components/intelligence-analytics/LoadingState";

export default function IntelligenceDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalRCAs: 0,
    totalMiningResults: 0,
    totalProcessAnalyses: 0,
    totalInsights: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadStats();
  }, [user?.tenantId]);

  const loadStats = async () => {
    try {
      // Load statistics from unified intelligence analytics API
      const response = await fetch("/api/intelligence-analytics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "analytics",
          tenantId: user?.tenantId,
        }),
      });
      if (response.ok) {
        const data = await response.json();
        // Map analytics data to stats
        setStats({
          totalRCAs: data.result?.rootCauseAnalyses?.length || 0,
          totalMiningResults: data.result?.dataMiningResults?.length || 0,
          totalProcessAnalyses: data.result?.processAnalyses?.length || 0,
          totalInsights: data.result?.insights?.length || 0,
        });
        setError(null);
      } else {
        setError("Failed to load intelligence statistics");
      }
    } catch (error) {
      console.error("Error loading stats:", error);
      setError(
        error instanceof Error
          ? error.message
          : "Failed to load intelligence statistics",
      );
    } finally {
      setLoading(false);
    }
  };

  const dashboardStats = [
    {
      label: "Root Cause Analyses",
      value: stats.totalRCAs,
      icon: "ri-search-line",
      tooltip: "Total root cause analyses performed",
      trend: "up" as const,
      link: "/intelligence/root-cause",
    },
    {
      label: "Data Mining Results",
      value: stats.totalMiningResults,
      icon: "ri-database-2-line",
      tooltip: "Total data mining insights",
      trend: "up" as const,
      link: "/intelligence/data-mining",
    },
    {
      label: "Process Analyses",
      value: stats.totalProcessAnalyses,
      icon: "ri-flow-chart-line",
      tooltip: "Total process mining analyses",
      trend: "neutral" as const,
      link: "/intelligence/process-mining",
    },
    {
      label: "Intelligence Insights",
      value: stats.totalInsights,
      icon: "ri-lightbulb-line",
      tooltip: "Total intelligence insights",
      trend: "up" as const,
      link: "/intelligence/analytics",
    },
  ];

  const quickActions = [
    {
      title: "Root Cause Analysis",
      description: "Analyze root causes across all modules",
      icon: "ri-search-line",
      link: "/intelligence/root-cause",
      color: "cyan",
    },
    {
      title: "Data Mining",
      description: "Discover patterns and anomalies",
      icon: "ri-database-2-line",
      link: "/intelligence/data-mining",
      color: "blue",
    },
    {
      title: "Process Mining",
      description: "Discover and optimize processes",
      icon: "ri-flow-chart-line",
      link: "/intelligence/process-mining",
      color: "purple",
    },
    {
      title: "Analytics",
      description: "Unified analytics from all modules",
      icon: "ri-bar-chart-box-line",
      link: "/intelligence/analytics",
      color: "green",
    },
  ];

  return (
    <PageTemplate
      title="Intelligence & Analytics"
      description="Unified intelligence hub for root cause analysis, data mining, process mining, and analytics across all modules"
      shortDescription="Unified intelligence and analytics"
      icon="ri-brain-line"
      systemInfo={{
        sap: "Intelligence & Analytics",
        oracle: "Intelligence Platform",
        manhattan: "Analytics Hub",
      }}
      examples={[
        "Cross-module root cause analysis",
        "Multi-module data mining",
        "End-to-end process discovery",
        "Unified analytics dashboard",
        "Pattern detection across modules",
        "Automated insights generation",
      ]}
      stats={dashboardStats}
    >
      <IntelligenceErrorBoundary>
        {error && (
          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4 mb-6">
            <div className="flex items-center gap-2">
              <i className="ri-error-warning-line text-yellow-400"></i>
              <p className="text-sm text-[#9ca3af]">{error}</p>
              <button
                onClick={loadStats}
                className="ml-auto px-3 py-1 bg-yellow-600 hover:bg-yellow-700 text-white rounded text-xs font-medium"
              >
                Retry
              </button>
            </div>
          </div>
        )}
        {loading ? (
          <LoadingState message="Loading intelligence dashboard..." />
        ) : (
          <div className="space-y-6">
            {/* Quick Actions */}
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              {quickActions.map((action, index) => (
                <motion.a
                  key={action.title}
                  href={action.link}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={`bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-6 hover:border-${action.color}-500/50 hover:shadow-lg hover:shadow-${action.color}-500/10 transition-all cursor-pointer group`}
                >
                  <div
                    className={`w-12 h-12 rounded-lg bg-${action.color}-500/20 flex items-center justify-center mb-4 group-hover:bg-${action.color}-500/30 transition-colors`}
                  >
                    <i
                      className={`ri-${action.icon} text-2xl text-${action.color}-400`}
                    ></i>
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">
                    {action.title}
                  </h3>
                  <p className="text-sm text-[#9ca3af]">{action.description}</p>
                  <div className="mt-4 flex items-center text-sm text-cyan-400 group-hover:text-cyan-300">
                    <span>Explore</span>
                    <i className="ri-arrow-right-line ml-2"></i>
                  </div>
                </motion.a>
              ))}
            </div>

            {/* Recent Activity */}
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4">
                Recent Intelligence Activity
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-cyan-500/20 flex items-center justify-center">
                      <i className="ri-search-line text-cyan-400"></i>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">
                        Root Cause Analysis
                      </p>
                      <p className="text-xs text-[#9ca3af]">
                        Cross-module analysis completed
                      </p>
                    </div>
                  </div>
                  <span className="text-xs text-[#9ca3af]">2 hours ago</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                      <i className="ri-database-2-line text-blue-400"></i>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">
                        Data Mining
                      </p>
                      <p className="text-xs text-[#9ca3af]">
                        Pattern detected across modules
                      </p>
                    </div>
                  </div>
                  <span className="text-xs text-[#9ca3af]">5 hours ago</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
                      <i className="ri-flow-chart-line text-purple-400"></i>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">
                        Process Mining
                      </p>
                      <p className="text-xs text-[#9ca3af]">
                        Process variant discovered
                      </p>
                    </div>
                  </div>
                  <span className="text-xs text-[#9ca3af]">1 day ago</span>
                </div>
              </div>
            </div>

            {/* Integration Status */}
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4">
                Module Integration Status
              </h3>
              <div className="grid md:grid-cols-3 gap-4">
                <div className="p-4 bg-white/5 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-[#9ca3af]">
                      Connected Modules
                    </span>
                    <span className="text-sm font-medium text-green-400">
                      24
                    </span>
                  </div>
                  <div className="w-full bg-white/10 rounded-full h-2">
                    <div
                      className="bg-green-500 h-2 rounded-full"
                      style={{ width: "100%" }}
                    ></div>
                  </div>
                </div>
                <div className="p-4 bg-white/5 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-[#9ca3af]">
                      Events Captured
                    </span>
                    <span className="text-sm font-medium text-cyan-400">
                      1,234
                    </span>
                  </div>
                  <div className="w-full bg-white/10 rounded-full h-2">
                    <div
                      className="bg-cyan-500 h-2 rounded-full"
                      style={{ width: "85%" }}
                    ></div>
                  </div>
                </div>
                <div className="p-4 bg-white/5 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-[#9ca3af]">
                      Real-time Updates
                    </span>
                    <span className="text-sm font-medium text-blue-400">
                      Active
                    </span>
                  </div>
                  <div className="w-full bg-white/10 rounded-full h-2">
                    <div
                      className="bg-blue-500 h-2 rounded-full animate-pulse"
                      style={{ width: "100%" }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </IntelligenceErrorBoundary>
    </PageTemplate>
  );
}
