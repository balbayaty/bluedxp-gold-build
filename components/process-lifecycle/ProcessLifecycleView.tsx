/**
 * Unified Process Lifecycle View
 * The ultimate component that shows lifecycle, workflow, process mining, and analytics together
 * Mind-blowing, layered, deep, and fully interactive
 */

"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  processOrchestrator,
  getUnifiedProcessData,
} from "@/lib/services/process-lifecycle";
import LifecycleView from "./lifecycle/LifecycleView";
import type { UnifiedProcessViewProps } from "@/types/process-lifecycle";
import ErrorBoundary from "@/components/ErrorBoundary";

export default function ProcessLifecycleView({
  entityId,
  entityType,
  showLifecycle = true,
  showWorkflow = true,
  showProcessMining = true,
  showAnalytics = true,
  showCrossModule = true,
  defaultView = "unified",
  height = 800,
  enableRealTime = true,
  enablePredictive = true,
}: UnifiedProcessViewProps) {
  const [unifiedData, setUnifiedData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<
    "lifecycle" | "workflow" | "mining" | "analytics" | "unified"
  >(defaultView as any);
  const [expandedLayers, setExpandedLayers] = useState<Set<string>>(
    new Set(["overview", "details"]),
  );

  useEffect(() => {
    loadUnifiedData();

    if (enableRealTime) {
      const interval = setInterval(loadUnifiedData, 5000); // Update every 5 seconds
      return () => clearInterval(interval);
    }
  }, [entityId, entityType, enableRealTime]);

  const loadUnifiedData = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getUnifiedProcessData(entityId, entityType);
      setUnifiedData(data);
    } catch (err) {
      console.error("Error loading unified process data:", err);
      setError(
        err instanceof Error ? err.message : "Failed to load process data",
      );
    } finally {
      setLoading(false);
    }
  };

  const toggleLayer = (layer: string) => {
    setExpandedLayers((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(layer)) {
        newSet.delete(layer);
      } else {
        newSet.add(layer);
      }
      return newSet;
    });
  };

  if (loading && !unifiedData) {
    return (
      <div className="flex items-center justify-center" style={{ height }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-cyan-500 mx-auto mb-4"></div>
          <div className="text-[#9ca3af]">Loading unified process view...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className="bg-red-500/10 border border-red-500/30 rounded-lg p-6"
        style={{ height }}
      >
        <div className="flex items-center gap-3 text-red-400">
          <i className="ri-error-warning-line text-xl"></i>
          <div>
            <div className="font-semibold">Error Loading Process Data</div>
            <div className="text-sm text-red-300/80">{error}</div>
          </div>
        </div>
      </div>
    );
  }

  if (!unifiedData) {
    return (
      <div
        className="bg-white/5 border border-white/10 rounded-lg p-6"
        style={{ height }}
      >
        <div className="text-center text-[#9ca3af]">
          <i className="ri-information-line text-2xl mb-2"></i>
          <div>No process data found</div>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary
      fallback={
        <div className="text-red-400 p-4">Error rendering process view</div>
      }
    >
      <div
        className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden"
        style={{ minHeight: height }}
      >
        {/* Header with Tabs */}
        <div className="p-6 border-b border-white/10 bg-gradient-to-r from-cyan-500/10 to-blue-600/10">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-2xl font-bold text-white mb-1 flex items-center gap-2">
                <i className="ri-flow-chart-line text-cyan-400"></i>
                Process & Lifecycle View
              </h2>
              <p className="text-sm text-[#9ca3af]">
                {entityType.replace(/_/g, " ")} • {entityId}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {enableRealTime && (
                <div className="flex items-center gap-2 px-3 py-1.5 bg-green-500/20 text-green-400 rounded-lg border border-green-500/30">
                  <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
                  <span className="text-xs font-medium">Live</span>
                </div>
              )}
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-lg p-1">
            {showLifecycle && (
              <button
                onClick={() => setActiveTab("lifecycle")}
                className={`flex-1 px-4 py-2 rounded text-sm font-medium transition-colors ${
                  activeTab === "lifecycle"
                    ? "bg-cyan-500 text-white"
                    : "text-[#9ca3af] hover:text-white"
                }`}
              >
                <i className="ri-time-line mr-2"></i>
                Lifecycle
              </button>
            )}
            {showWorkflow && unifiedData.workflow && (
              <button
                onClick={() => setActiveTab("workflow")}
                className={`flex-1 px-4 py-2 rounded text-sm font-medium transition-colors ${
                  activeTab === "workflow"
                    ? "bg-purple-500 text-white"
                    : "text-[#9ca3af] hover:text-white"
                }`}
              >
                <i className="ri-node-tree mr-2"></i>
                Workflow
              </button>
            )}
            {showProcessMining && unifiedData.processMining && (
              <button
                onClick={() => setActiveTab("mining")}
                className={`flex-1 px-4 py-2 rounded text-sm font-medium transition-colors ${
                  activeTab === "mining"
                    ? "bg-yellow-500 text-white"
                    : "text-[#9ca3af] hover:text-white"
                }`}
              >
                <i className="ri-bar-chart-box-line mr-2"></i>
                Process Mining
              </button>
            )}
            {showAnalytics && (
              <button
                onClick={() => setActiveTab("analytics")}
                className={`flex-1 px-4 py-2 rounded text-sm font-medium transition-colors ${
                  activeTab === "analytics"
                    ? "bg-blue-500 text-white"
                    : "text-[#9ca3af] hover:text-white"
                }`}
              >
                <i className="ri-line-chart-line mr-2"></i>
                Analytics
              </button>
            )}
            <button
              onClick={() => setActiveTab("unified")}
              className={`flex-1 px-4 py-2 rounded text-sm font-medium transition-colors ${
                activeTab === "unified"
                  ? "bg-gradient-to-r from-cyan-500 to-blue-600 text-white"
                  : "text-[#9ca3af] hover:text-white"
              }`}
            >
              <i className="ri-dashboard-3-line mr-2"></i>
              Unified
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="p-6">
          <AnimatePresence mode="wait">
            {/* Lifecycle Tab */}
            {activeTab === "lifecycle" &&
              showLifecycle &&
              unifiedData.lifecycle && (
                <motion.div
                  key="lifecycle"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                >
                  <LifecycleView
                    entityId={entityId}
                    entityType={entityType}
                    viewMode="timeline"
                    showLayers={Array.from(expandedLayers) as any}
                    enableRealTime={enableRealTime}
                    enablePredictive={enablePredictive}
                  />
                </motion.div>
              )}

            {/* Workflow Tab */}
            {activeTab === "workflow" &&
              showWorkflow &&
              unifiedData.workflow && (
                <motion.div
                  key="workflow"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="bg-white/5 rounded-xl p-6 border border-white/10"
                >
                  <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <i className="ri-node-tree text-purple-400"></i>
                    Workflow Execution
                  </h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm text-[#9ca3af]">Status</div>
                        <div
                          className={`text-lg font-semibold ${
                            unifiedData.workflow.status === "completed"
                              ? "text-green-400"
                              : unifiedData.workflow.status === "running"
                                ? "text-blue-400"
                                : "text-red-400"
                          }`}
                        >
                          {unifiedData.workflow.status.toUpperCase()}
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-[#9ca3af]">
                          Current Step
                        </div>
                        <div className="text-lg font-semibold text-white">
                          {unifiedData.workflow.currentStep}
                        </div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      {unifiedData.workflow.steps.map(
                        (step: any, idx: number) => (
                          <div
                            key={step.stepId}
                            className="flex items-center gap-3 p-3 bg-white/5 rounded-lg"
                          >
                            <div
                              className={`w-8 h-8 rounded-full flex items-center justify-center ${
                                step.status === "completed"
                                  ? "bg-green-500/20 text-green-400"
                                  : step.status === "running"
                                    ? "bg-blue-500/20 text-blue-400 animate-pulse"
                                    : "bg-gray-500/20 text-gray-400"
                              }`}
                            >
                              {step.status === "completed" ? (
                                <i className="ri-check-line"></i>
                              ) : step.status === "running" ? (
                                <i className="ri-loader-4-line animate-spin"></i>
                              ) : (
                                <i className="ri-circle-line"></i>
                              )}
                            </div>
                            <div className="flex-1">
                              <div className="text-sm font-medium text-white">
                                Step {idx + 1}
                              </div>
                              <div className="text-xs text-[#9ca3af]">
                                {step.stepId}
                              </div>
                            </div>
                            <div className="text-xs text-[#9ca3af]">
                              {step.completedAt
                                ? new Date(
                                    step.completedAt,
                                  ).toLocaleTimeString()
                                : "Pending"}
                            </div>
                          </div>
                        ),
                      )}
                    </div>
                  </div>
                </motion.div>
              )}

            {/* Process Mining Tab */}
            {activeTab === "mining" &&
              showProcessMining &&
              unifiedData.processMining && (
                <motion.div
                  key="mining"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="bg-white/5 rounded-xl p-6 border border-white/10"
                >
                  <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <i className="ri-bar-chart-box-line text-yellow-400"></i>
                    Process Mining Analysis
                  </h3>
                  <div className="space-y-4">
                    <div className="grid grid-cols-3 gap-4">
                      <div className="bg-white/5 rounded-lg p-4">
                        <div className="text-sm text-[#9ca3af] mb-1">
                          Duration
                        </div>
                        <div className="text-xl font-bold text-white">
                          {Math.floor(
                            unifiedData.processMining.performance.duration /
                              3600,
                          )}
                          h{" "}
                          {Math.floor(
                            (unifiedData.processMining.performance.duration %
                              3600) /
                              60,
                          )}
                          m
                        </div>
                      </div>
                      <div className="bg-white/5 rounded-lg p-4">
                        <div className="text-sm text-[#9ca3af] mb-1">
                          Efficiency
                        </div>
                        <div className="text-xl font-bold text-white">
                          {unifiedData.processMining.performance.efficiency.toFixed(
                            1,
                          )}
                          %
                        </div>
                      </div>
                      <div className="bg-white/5 rounded-lg p-4">
                        <div className="text-sm text-[#9ca3af] mb-1">
                          Deviations
                        </div>
                        <div className="text-xl font-bold text-white">
                          {unifiedData.processMining.deviations.length}
                        </div>
                      </div>
                    </div>
                    {unifiedData.processMining.deviations.length > 0 && (
                      <div>
                        <div className="text-sm font-semibold text-white mb-2">
                          Detected Deviations
                        </div>
                        <div className="space-y-2">
                          {unifiedData.processMining.deviations.map(
                            (dev: any) => (
                              <div
                                key={dev.id}
                                className={`p-3 rounded-lg border ${
                                  dev.severity === "CRITICAL"
                                    ? "bg-red-500/10 border-red-500/30"
                                    : dev.severity === "HIGH"
                                      ? "bg-orange-500/10 border-orange-500/30"
                                      : "bg-yellow-500/10 border-yellow-500/30"
                                }`}
                              >
                                <div className="text-sm font-medium text-white">
                                  {dev.type}
                                </div>
                                <div className="text-xs text-white/80">
                                  {dev.description}
                                </div>
                              </div>
                            ),
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}

            {/* Analytics Tab */}
            {activeTab === "analytics" && showAnalytics && (
              <motion.div
                key="analytics"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="bg-white/5 rounded-xl p-6 border border-white/10"
              >
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <i className="ri-line-chart-line text-blue-400"></i>
                  Predictive Insights
                </h3>
                {unifiedData.insights && unifiedData.insights.length > 0 ? (
                  <div className="space-y-3">
                    {unifiedData.insights.map((insight: any) => (
                      <div
                        key={insight.id}
                        className="bg-white/5 rounded-lg p-4 border border-white/10"
                      >
                        <div className="flex items-start gap-3">
                          <i
                            className={`ri-${insight.type === "bottleneck" ? "speed-up-line" : "lightbulb-line"} text-yellow-400 text-xl`}
                          ></i>
                          <div className="flex-1">
                            <div className="font-semibold text-white mb-1">
                              {insight.title}
                            </div>
                            <div className="text-sm text-white/80 mb-2">
                              {insight.description}
                            </div>
                            {insight.recommendations &&
                              insight.recommendations.length > 0 && (
                                <div className="text-xs text-white/60">
                                  <div className="font-medium mb-1">
                                    Recommendations:
                                  </div>
                                  <ul className="list-disc list-inside space-y-1">
                                    {insight.recommendations
                                      .slice(0, 3)
                                      .map((rec: string, i: number) => (
                                        <li key={i}>{rec}</li>
                                      ))}
                                  </ul>
                                </div>
                              )}
                          </div>
                          <div className="text-right">
                            <div className="text-xs text-white/60 mb-1">
                              Confidence
                            </div>
                            <div className="text-sm font-bold text-white">
                              {insight.confidence}%
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center text-[#9ca3af] py-8">
                    <i className="ri-information-line text-3xl mb-2"></i>
                    <div>No insights available</div>
                  </div>
                )}
              </motion.div>
            )}

            {/* Unified Tab - Shows Everything */}
            {activeTab === "unified" && (
              <motion.div
                key="unified"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >
                {/* Lifecycle Section */}
                {showLifecycle && unifiedData.lifecycle && (
                  <div className="bg-white/5 rounded-xl p-6 border border-white/10">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                        <i className="ri-time-line text-cyan-400"></i>
                        Lifecycle
                      </h3>
                      <button
                        onClick={() => toggleLayer("lifecycle")}
                        className="text-cyan-400 hover:text-cyan-300"
                      >
                        <i
                          className={`ri-${expandedLayers.has("lifecycle") ? "arrow-up-s" : "arrow-down-s"}-line`}
                        ></i>
                      </button>
                    </div>
                    {expandedLayers.has("lifecycle") && (
                      <LifecycleView
                        entityId={entityId}
                        entityType={entityType}
                        viewMode="timeline"
                        showLayers={["overview", "details"]}
                        enableRealTime={enableRealTime}
                        enablePredictive={enablePredictive}
                        height={400}
                      />
                    )}
                  </div>
                )}

                {/* Workflow Section */}
                {showWorkflow && unifiedData.workflow && (
                  <div className="bg-white/5 rounded-xl p-6 border border-white/10">
                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                      <i className="ri-node-tree text-purple-400"></i>
                      Active Workflow
                    </h3>
                    <div className="space-y-2">
                      {unifiedData.workflow.steps
                        .slice(0, 3)
                        .map((step: any, idx: number) => (
                          <div
                            key={step.stepId}
                            className="flex items-center gap-3 p-3 bg-white/5 rounded-lg"
                          >
                            <div
                              className={`w-8 h-8 rounded-full flex items-center justify-center ${
                                step.status === "completed"
                                  ? "bg-green-500/20 text-green-400"
                                  : step.status === "running"
                                    ? "bg-blue-500/20 text-blue-400"
                                    : "bg-gray-500/20 text-gray-400"
                              }`}
                            >
                              {step.status === "completed" ? (
                                <i className="ri-check-line"></i>
                              ) : step.status === "running" ? (
                                <i className="ri-loader-4-line animate-spin"></i>
                              ) : (
                                <i className="ri-circle-line"></i>
                              )}
                            </div>
                            <div className="flex-1 text-sm text-white">
                              Step {idx + 1}
                            </div>
                            <div className="text-xs text-[#9ca3af]">
                              {step.status}
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                )}

                {/* Process Mining Section */}
                {showProcessMining && unifiedData.processMining && (
                  <div className="bg-white/5 rounded-xl p-6 border border-white/10">
                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                      <i className="ri-bar-chart-box-line text-yellow-400"></i>
                      Process Mining
                    </h3>
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <div className="text-xs text-[#9ca3af] mb-1">
                          Efficiency
                        </div>
                        <div className="text-xl font-bold text-white">
                          {unifiedData.processMining.performance.efficiency.toFixed(
                            1,
                          )}
                          %
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-[#9ca3af] mb-1">
                          Duration
                        </div>
                        <div className="text-xl font-bold text-white">
                          {Math.floor(
                            unifiedData.processMining.performance.duration /
                              3600,
                          )}
                          h
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-[#9ca3af] mb-1">
                          Deviations
                        </div>
                        <div className="text-xl font-bold text-white">
                          {unifiedData.processMining.deviations.length}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Insights Section */}
                {showAnalytics &&
                  unifiedData.insights &&
                  unifiedData.insights.length > 0 && (
                    <div className="bg-white/5 rounded-xl p-6 border border-white/10">
                      <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                        <i className="ri-lightbulb-line text-yellow-400"></i>
                        AI Insights
                      </h3>
                      <div className="space-y-2">
                        {unifiedData.insights
                          .slice(0, 3)
                          .map((insight: any) => (
                            <div
                              key={insight.id}
                              className="bg-white/5 rounded-lg p-3 border border-white/10"
                            >
                              <div className="text-sm font-medium text-white">
                                {insight.title}
                              </div>
                              <div className="text-xs text-white/60 mt-1">
                                {insight.description}
                              </div>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </ErrorBoundary>
  );
}
