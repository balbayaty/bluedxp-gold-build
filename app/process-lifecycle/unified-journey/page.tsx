/**
 * Unified Journey Dashboard
 * Revolutionary dual-dimensional view: Physical Journey + Business Journey
 * Shows both dimensions synchronized in real-time
 */

"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { dualJourneyOrchestrator } from "@/lib/services/dual-journey/dualJourneyOrchestrator";
import type { UnifiedJourney } from "@/lib/services/dual-journey/dualJourneyOrchestrator";
import type { JourneyAnalysis } from "@/types/journey-analysis";
import ErrorBoundary from "@/components/ErrorBoundary";
import dynamic from "next/dynamic";

// Dynamic import for Journey Analysis components (don't modify them)
const InteractiveRouteMap = dynamic(
  () => import("@/components/proposals/InteractiveRouteMap"),
  { ssr: false },
);

const JourneyIntelligencePanel = dynamic(
  () => import("@/components/trade-compliance/JourneyIntelligencePanel"),
  { ssr: false },
);

export default function UnifiedJourneyPage() {
  const [entityId, setEntityId] = useState("ASN-2024-001");
  const [entityType, setEntityType] = useState<
    "ASN" | "SHIPMENT" | "PURCHASE_ORDER" | "SALES_ORDER"
  >("ASN");
  const [unifiedJourney, setUnifiedJourney] = useState<UnifiedJourney | null>(
    null,
  );
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState<
    "unified" | "physical" | "business" | "correlation"
  >("unified");

  useEffect(() => {
    loadUnifiedJourney();
  }, [entityId, entityType]);

  const loadUnifiedJourney = async () => {
    setLoading(true);
    try {
      // In production, would fetch physical journey from Journey Analysis service
      // For now, using mock data structure
      const mockPhysicalJourney: JourneyAnalysis | null = null; // Would be fetched

      const unified = await dualJourneyOrchestrator.getUnifiedJourney(
        entityId,
        entityType,
        mockPhysicalJourney,
        undefined, // Business journey will be fetched automatically
      );

      setUnifiedJourney(unified);
    } catch (error) {
      console.error("Error loading unified journey:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading && !unifiedJourney) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <div className="text-[#9ca3af]">Loading Unified Journey...</div>
        </div>
      </div>
    );
  }

  if (!unifiedJourney) {
    return (
      <ErrorBoundary
        fallback={
          <div className="text-red-400 p-4">Error loading Unified Journey</div>
        }
      >
        <div className="container mx-auto px-4 py-8">
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-12 text-center">
            <i className="ri-information-line text-4xl text-purple-400 mb-4"></i>
            <h3 className="text-xl font-semibold text-white mb-2">
              No Journey Data
            </h3>
            <p className="text-[#9ca3af] mb-6">
              Enter an entity ID to view its unified journey (physical +
              business dimensions)
            </p>
            <div className="flex gap-4 justify-center">
              <input
                type="text"
                value={entityId}
                onChange={(e) => setEntityId(e.target.value)}
                placeholder="Entity ID (e.g., ASN-2024-001)"
                className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-[#9ca3af] focus:outline-none focus:border-purple-500/50"
              />
              <select
                value={entityType}
                onChange={(e) => setEntityType(e.target.value as any)}
                className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-purple-500/50"
              >
                <option value="ASN">ASN</option>
                <option value="SHIPMENT">Shipment</option>
                <option value="PURCHASE_ORDER">Purchase Order</option>
                <option value="SALES_ORDER">Sales Order</option>
              </select>
              <button
                onClick={loadUnifiedJourney}
                className="px-6 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg font-medium transition-colors"
              >
                Load Journey
              </button>
            </div>
          </div>
        </div>
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary
      fallback={
        <div className="text-red-400 p-4">Error loading Unified Journey</div>
      }
    >
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-4xl font-bold text-white mb-2 flex items-center gap-3">
                <i className="ri-global-line text-purple-400"></i>
                Unified Journey Intelligence
              </h1>
              <p className="text-[#9ca3af] text-lg">
                Dual-dimensional tracking: Physical Journey (WHERE) + Business
                Journey (WHAT)
              </p>
            </div>
            <div className="flex items-center gap-3">
              <input
                type="text"
                value={entityId}
                onChange={(e) => setEntityId(e.target.value)}
                placeholder="Entity ID"
                className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-[#9ca3af] focus:outline-none focus:border-purple-500/50"
              />
              <select
                value={entityType}
                onChange={(e) => setEntityType(e.target.value as any)}
                className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-purple-500/50"
              >
                <option value="ASN">ASN</option>
                <option value="SHIPMENT">Shipment</option>
                <option value="PURCHASE_ORDER">Purchase Order</option>
                <option value="SALES_ORDER">Sales Order</option>
              </select>
              <button
                onClick={loadUnifiedJourney}
                className="px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg text-sm font-medium transition-colors"
              >
                <i className="ri-refresh-line mr-2"></i>
                Refresh
              </button>
            </div>
          </div>

          {/* View Mode Tabs */}
          <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-lg p-1">
            {(["unified", "physical", "business", "correlation"] as const).map(
              (mode) => (
                <button
                  key={mode}
                  onClick={() => setViewMode(mode)}
                  className={`flex-1 px-4 py-2 rounded text-sm font-medium transition-colors ${
                    viewMode === mode
                      ? "bg-purple-500 text-white"
                      : "text-[#9ca3af] hover:text-white"
                  }`}
                >
                  <i
                    className={`ri-${mode === "unified" ? "dashboard-line" : mode === "physical" ? "map-pin-line" : mode === "business" ? "flow-chart-line" : "git-branch-line"} mr-2`}
                  ></i>
                  {mode.charAt(0).toUpperCase() + mode.slice(1)}
                </button>
              ),
            )}
          </div>
        </div>

        {/* Unified Analytics Cards */}
        <div className="grid md:grid-cols-4 gap-4 mb-6">
          {[
            {
              label: "Total Journey Time",
              value: `${unifiedJourney.unifiedIntelligence.analytics.totalJourneyTime.toFixed(1)}h`,
              icon: "ri-time-line",
              color: "blue",
            },
            {
              label: "Physical %",
              value: `${unifiedJourney.unifiedIntelligence.analytics.physicalPercentage.toFixed(0)}%`,
              icon: "ri-map-pin-line",
              color: "green",
            },
            {
              label: "Business %",
              value: `${unifiedJourney.unifiedIntelligence.analytics.businessPercentage.toFixed(0)}%`,
              icon: "ri-flow-chart-line",
              color: "purple",
            },
            {
              label: "Efficiency",
              value: `${unifiedJourney.unifiedIntelligence.analytics.efficiency.toFixed(0)}%`,
              icon: "ri-speed-line",
              color: "yellow",
            },
            {
              label: "Bottlenecks",
              value:
                unifiedJourney.unifiedIntelligence.analytics.bottleneckCount,
              icon: "ri-alert-line",
              color: "red",
            },
            {
              label: "Critical",
              value:
                unifiedJourney.unifiedIntelligence.analytics
                  .criticalBottlenecks,
              icon: "ri-error-warning-line",
              color: "orange",
            },
          ].map((stat, idx) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className={`bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-6 hover:border-${stat.color}-500/30 transition-all`}
            >
              <div className="flex items-center justify-between mb-2">
                <i
                  className={`ri-${stat.icon} text-${stat.color}-400 text-xl`}
                ></i>
              </div>
              <div className="text-2xl font-bold text-white mb-1">
                {stat.value}
              </div>
              <div className="text-xs text-[#9ca3af]">{stat.label}</div>
            </motion.div>
          ))}
        </div>

        {/* Unified View */}
        {viewMode === "unified" && (
          <div className="grid md:grid-cols-2 gap-6 mb-6">
            {/* Physical Journey Panel */}
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-6">
              <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                <i className="ri-map-pin-line text-green-400"></i>
                Physical Journey (WHERE)
              </h2>
              {unifiedJourney.physicalJourney.touchpoints.length > 0 ? (
                <div className="space-y-3">
                  {unifiedJourney.physicalJourney.touchpoints.map((tp, idx) => (
                    <div
                      key={idx}
                      className="bg-white/5 rounded-lg p-4 border border-white/10"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-white font-medium">
                          {tp.name}
                        </span>
                        <span
                          className={`px-2 py-1 rounded text-xs ${
                            tp.bottleneckRisk === "CRITICAL"
                              ? "bg-red-500/20 text-red-400"
                              : tp.bottleneckRisk === "HIGH"
                                ? "bg-orange-500/20 text-orange-400"
                                : tp.bottleneckRisk === "MEDIUM"
                                  ? "bg-yellow-500/20 text-yellow-400"
                                  : "bg-green-500/20 text-green-400"
                          }`}
                        >
                          {tp.bottleneckRisk}
                        </span>
                      </div>
                      <div className="text-sm text-[#9ca3af]">
                        {tp.avgHours}h avg • {tp.category}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-[#9ca3af]">
                  <i className="ri-information-line text-3xl mb-2"></i>
                  <p>No physical journey data available</p>
                  <p className="text-xs mt-2">
                    Physical journey data would come from Journey Analysis
                  </p>
                </div>
              )}
            </div>

            {/* Business Journey Panel */}
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-6">
              <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                <i className="ri-flow-chart-line text-purple-400"></i>
                Business Journey (WHAT)
              </h2>
              {unifiedJourney.businessJourney.stages.length > 0 ? (
                <div className="space-y-3">
                  {unifiedJourney.businessJourney.stages.map((stage, idx) => (
                    <div
                      key={idx}
                      className="bg-white/5 rounded-lg p-4 border border-white/10"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-white font-medium">
                          {stage.stageName}
                        </span>
                        <span
                          className={`px-2 py-1 rounded text-xs ${
                            stage.status === "completed"
                              ? "bg-green-500/20 text-green-400"
                              : stage.status === "active"
                                ? "bg-blue-500/20 text-blue-400"
                                : "bg-gray-500/20 text-gray-400"
                          }`}
                        >
                          {stage.status}
                        </span>
                      </div>
                      {stage.startedAt && (
                        <div className="text-sm text-[#9ca3af]">
                          Started: {new Date(stage.startedAt).toLocaleString()}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-[#9ca3af]">
                  <i className="ri-information-line text-3xl mb-2"></i>
                  <p>No business journey data available</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Correlation View */}
        {viewMode === "correlation" && (
          <div className="space-y-6">
            {/* Physical → Business Correlations */}
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4">
                Physical → Business Correlations
              </h3>
              <div className="space-y-3">
                {unifiedJourney.unifiedIntelligence.correlation.physicalToBusiness.map(
                  (corr, idx) => (
                    <div
                      key={idx}
                      className="bg-white/5 rounded-lg p-4 border border-white/10"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-lg bg-green-500/20 flex items-center justify-center">
                          <i className="ri-map-pin-line text-green-400"></i>
                        </div>
                        <div className="flex-1">
                          <div className="text-white font-medium">
                            {corr.touchpoint}
                          </div>
                          <div className="text-sm text-[#9ca3af]">
                            Triggers: {corr.triggers.join(", ")}
                          </div>
                        </div>
                        <span
                          className={`px-2 py-1 rounded text-xs ${
                            corr.impact === "CRITICAL"
                              ? "bg-red-500/20 text-red-400"
                              : corr.impact === "HIGH"
                                ? "bg-orange-500/20 text-orange-400"
                                : corr.impact === "MEDIUM"
                                  ? "bg-yellow-500/20 text-yellow-400"
                                  : "bg-green-500/20 text-green-400"
                          }`}
                        >
                          {corr.impact}
                        </span>
                      </div>
                    </div>
                  ),
                )}
              </div>
            </div>

            {/* Business → Physical Correlations */}
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4">
                Business → Physical Correlations
              </h3>
              <div className="space-y-3">
                {unifiedJourney.unifiedIntelligence.correlation.businessToPhysical.map(
                  (corr, idx) => (
                    <div
                      key={idx}
                      className="bg-white/5 rounded-lg p-4 border border-white/10"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-lg bg-purple-500/20 flex items-center justify-center">
                          <i className="ri-flow-chart-line text-purple-400"></i>
                        </div>
                        <div className="flex-1">
                          <div className="text-white font-medium">
                            {corr.stage}
                          </div>
                          <div className="text-sm text-[#9ca3af]">
                            Affects: {corr.affects.join(", ")}
                          </div>
                        </div>
                        <span
                          className={`px-2 py-1 rounded text-xs ${
                            corr.impact === "CRITICAL"
                              ? "bg-red-500/20 text-red-400"
                              : corr.impact === "HIGH"
                                ? "bg-orange-500/20 text-orange-400"
                                : corr.impact === "MEDIUM"
                                  ? "bg-yellow-500/20 text-yellow-400"
                                  : "bg-green-500/20 text-green-400"
                          }`}
                        >
                          {corr.impact}
                        </span>
                      </div>
                    </div>
                  ),
                )}
              </div>
            </div>

            {/* Cross-Impact Analysis */}
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4">
                Cross-Dimensional Impact Analysis
              </h3>
              <div className="space-y-3">
                {unifiedJourney.unifiedIntelligence.correlation.crossImpact.map(
                  (impact, idx) => (
                    <div
                      key={idx}
                      className="bg-white/5 rounded-lg p-4 border border-white/10"
                    >
                      <div className="flex items-center gap-4">
                        <div className="flex-1">
                          <div className="text-white font-medium mb-1">
                            {impact.physicalEvent}
                          </div>
                          <div className="text-sm text-[#9ca3af]">
                            → {impact.businessEvent}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-white font-semibold">
                            {(impact.correlation * 100).toFixed(0)}% correlation
                          </div>
                          <div className="text-xs text-[#9ca3af]">
                            {impact.delayPropagation.toFixed(1)}h propagation
                          </div>
                        </div>
                      </div>
                    </div>
                  ),
                )}
              </div>
            </div>
          </div>
        )}

        {/* Predictions & Recommendations */}
        <div className="grid md:grid-cols-2 gap-6 mt-6">
          {/* Risk Factors */}
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4">
              Risk Factors
            </h3>
            <div className="space-y-3">
              {unifiedJourney.unifiedIntelligence.predictions.riskFactors.map(
                (risk, idx) => (
                  <div
                    key={idx}
                    className="bg-white/5 rounded-lg p-3 border border-white/10"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-white text-sm font-medium">
                        {risk.description}
                      </span>
                      <span
                        className={`px-2 py-1 rounded text-xs ${
                          risk.severity === "CRITICAL"
                            ? "bg-red-500/20 text-red-400"
                            : risk.severity === "HIGH"
                              ? "bg-orange-500/20 text-orange-400"
                              : risk.severity === "MEDIUM"
                                ? "bg-yellow-500/20 text-yellow-400"
                                : "bg-green-500/20 text-green-400"
                        }`}
                      >
                        {risk.severity}
                      </span>
                    </div>
                    <div className="text-xs text-[#9ca3af]">
                      Source: {risk.source}
                    </div>
                  </div>
                ),
              )}
            </div>
          </div>

          {/* Optimization Opportunities */}
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4">
              Optimization Opportunities
            </h3>
            <div className="space-y-3">
              {unifiedJourney.unifiedIntelligence.predictions.optimizationOpportunities.map(
                (opp, idx) => (
                  <div
                    key={idx}
                    className="bg-white/5 rounded-lg p-3 border border-white/10"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-white text-sm font-medium">
                        {opp.title}
                      </span>
                      <span className="text-green-400 text-sm font-semibold">
                        Save {opp.potentialSavings.toFixed(1)}h
                      </span>
                    </div>
                    <div className="text-xs text-[#9ca3af] mb-1">
                      {opp.description}
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2 py-0.5 rounded text-xs ${
                          opp.type === "PHYSICAL"
                            ? "bg-green-500/20 text-green-400"
                            : opp.type === "BUSINESS"
                              ? "bg-purple-500/20 text-purple-400"
                              : "bg-blue-500/20 text-blue-400"
                        }`}
                      >
                        {opp.type}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded text-xs ${
                          opp.impact === "CRITICAL"
                            ? "bg-red-500/20 text-red-400"
                            : opp.impact === "HIGH"
                              ? "bg-orange-500/20 text-orange-400"
                              : "bg-yellow-500/20 text-yellow-400"
                        }`}
                      >
                        {opp.impact} Impact
                      </span>
                    </div>
                  </div>
                ),
              )}
            </div>
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
}
