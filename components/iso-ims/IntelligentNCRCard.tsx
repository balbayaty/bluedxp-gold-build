/**
 * Intelligent NCR Card - Mind-Blowing Deep Drill-Down
 *
 * Features:
 * - AI-powered root cause analysis
 * - Pattern detection
 * - Similar NCR identification
 * - Auto CAPA suggestions
 * - Deep drill-down to all linked entities
 * - Real-time updates
 */

"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import type { NCR } from "@/lib/services/iso-ims/types";

interface IntelligentNCRCardProps {
  ncr: NCR;
  onDrillDown?: (ncrId: string, section: string) => void;
  showAIInsights?: boolean;
  showSimilarNCRs?: boolean;
}

export default function IntelligentNCRCard({
  ncr,
  onDrillDown,
  showAIInsights = true,
  showSimilarNCRs = true,
}: IntelligentNCRCardProps) {
  const router = useRouter();
  const [expanded, setExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState<
    "details" | "root-cause" | "similar" | "links" | "ai"
  >("details");

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "CRITICAL":
        return "bg-red-900/30 text-red-400 border-red-500/50";
      case "HIGH":
        return "bg-orange-900/30 text-orange-400 border-orange-500/50";
      case "MEDIUM":
        return "bg-yellow-900/30 text-yellow-400 border-yellow-500/50";
      default:
        return "bg-gray-700 text-gray-400 border-gray-600";
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "CRITICAL":
        return "text-red-400";
      case "MAJOR":
        return "text-orange-400";
      default:
        return "text-yellow-400";
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gray-800 border border-gray-700 rounded-xl p-6 shadow-lg hover:shadow-xl transition-all"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h3 className="text-lg font-semibold text-white">
              {ncr.ncrNumber}
            </h3>
            <span
              className={`px-2 py-1 rounded text-xs font-medium border ${getPriorityColor(ncr.priority)}`}
            >
              {ncr.priority}
            </span>
            <span
              className={`text-sm font-medium ${getSeverityColor(ncr.severity)}`}
            >
              {ncr.severity}
            </span>
          </div>
          <p className="text-gray-300 text-sm">{ncr.subject}</p>
        </div>
        <button
          onClick={() => setExpanded(!expanded)}
          className="p-2 rounded-lg bg-gray-700 hover:bg-gray-600 transition-colors"
        >
          <i
            className={`ri-${expanded ? "arrow-up" : "arrow-down"}-s-line text-xl text-gray-300`}
          ></i>
        </button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-4 gap-4 mb-4">
        <div className="text-center p-3 rounded-lg bg-gray-700/50">
          <div className="text-xs text-gray-400 mb-1">Status</div>
          <div className="text-sm font-semibold text-white">{ncr.status}</div>
        </div>
        <div className="text-center p-3 rounded-lg bg-gray-700/50">
          <div className="text-xs text-gray-400 mb-1">Type</div>
          <div className="text-sm font-semibold text-white">{ncr.ncType}</div>
        </div>
        <div className="text-center p-3 rounded-lg bg-gray-700/50">
          <div className="text-xs text-gray-400 mb-1">Days Open</div>
          <div className="text-sm font-semibold text-white">
            {ncr.daysOpen || 0}
          </div>
        </div>
        <div className="text-center p-3 rounded-lg bg-gray-700/50">
          <div className="text-xs text-gray-400 mb-1">Reported</div>
          <div className="text-sm font-semibold text-white">
            {new Date(ncr.reportedDate).toLocaleDateString()}
          </div>
        </div>
      </div>

      {/* AI Insights Badge */}
      {showAIInsights && ncr.aiInsights && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="mb-4 p-3 rounded-lg bg-gradient-to-r from-purple-900/30 to-blue-900/30 border border-purple-500/30"
        >
          <div className="flex items-center gap-2 mb-2">
            <i className="ri-ai-generate-line text-purple-400"></i>
            <span className="text-sm font-semibold text-white">
              AI Insights
            </span>
            <span className="text-xs text-purple-400">
              Risk Level: {ncr.aiInsights.riskLevel}
            </span>
          </div>
          {ncr.aiInsights.similarNCRs &&
            ncr.aiInsights.similarNCRs.length > 0 && (
              <p className="text-xs text-gray-300">
                Found {ncr.aiInsights.similarNCRs.length} similar NCRs
              </p>
            )}
        </motion.div>
      )}

      {/* Expanded View */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            {/* Tabs */}
            <div className="flex gap-2 mb-4 border-b border-gray-700">
              {[
                { id: "details", label: "Details", icon: "ri-file-text-line" },
                {
                  id: "root-cause",
                  label: "Root Cause",
                  icon: "ri-search-line",
                },
                { id: "similar", label: "Similar NCRs", icon: "ri-links-line" },
                { id: "links", label: "Links", icon: "ri-link" },
                { id: "ai", label: "AI Insights", icon: "ri-ai-generate-line" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${
                    activeTab === tab.id
                      ? "border-blue-500 text-blue-400"
                      : "border-transparent text-gray-400 hover:text-gray-300"
                  }`}
                >
                  <i className={`${tab.icon} mr-2`}></i>
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Tab Content */}
            <div className="min-h-[200px]">
              {activeTab === "details" && (
                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-semibold text-gray-300 mb-2">
                      Description
                    </h4>
                    <p className="text-sm text-gray-400">{ncr.description}</p>
                  </div>
                  {ncr.immediateAction && (
                    <div>
                      <h4 className="text-sm font-semibold text-gray-300 mb-2">
                        Immediate Action
                      </h4>
                      <p className="text-sm text-gray-400">
                        {ncr.immediateAction}
                      </p>
                      <span
                        className={`inline-block mt-2 px-2 py-1 rounded text-xs ${
                          ncr.immediateActionTaken
                            ? "bg-green-900/30 text-green-400"
                            : "bg-yellow-900/30 text-yellow-400"
                        }`}
                      >
                        {ncr.immediateActionTaken ? "Taken" : "Pending"}
                      </span>
                    </div>
                  )}
                  {ncr.assignedTo && (
                    <div>
                      <h4 className="text-sm font-semibold text-gray-300 mb-2">
                        Assigned To
                      </h4>
                      <p className="text-sm text-gray-400">
                        {ncr.assignedToName || ncr.assignedTo}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {activeTab === "root-cause" && (
                <div className="space-y-4">
                  {ncr.rootCause ? (
                    <>
                      <div>
                        <h4 className="text-sm font-semibold text-gray-300 mb-2">
                          Root Cause
                        </h4>
                        <p className="text-sm text-gray-400">{ncr.rootCause}</p>
                      </div>
                      {ncr.rootCauseAnalysis && (
                        <div>
                          <h4 className="text-sm font-semibold text-gray-300 mb-2">
                            Analysis Method: {ncr.rootCauseAnalysis.method}
                          </h4>
                          <p className="text-sm text-gray-400 mb-2">
                            {ncr.rootCauseAnalysis.analysis}
                          </p>
                          {ncr.rootCauseAnalysis.contributingFactors.length >
                            0 && (
                            <div>
                              <h5 className="text-xs font-semibold text-gray-400 mb-1">
                                Contributing Factors
                              </h5>
                              <ul className="list-disc list-inside text-sm text-gray-400 space-y-1">
                                {ncr.rootCauseAnalysis.contributingFactors.map(
                                  (factor, i) => (
                                    <li key={i}>{factor}</li>
                                  ),
                                )}
                              </ul>
                            </div>
                          )}
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="text-center py-8">
                      <i className="ri-search-line text-4xl text-gray-600 mb-2"></i>
                      <p className="text-sm text-gray-400">
                        No root cause analysis yet
                      </p>
                      <button
                        onClick={() => onDrillDown?.(ncr.id, "root-cause")}
                        className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm"
                      >
                        Perform Root Cause Analysis
                      </button>
                    </div>
                  )}
                </div>
              )}

              {activeTab === "similar" && showSimilarNCRs && (
                <div className="space-y-4">
                  {ncr.aiInsights?.similarNCRs &&
                  ncr.aiInsights.similarNCRs.length > 0 ? (
                    <div>
                      <h4 className="text-sm font-semibold text-gray-300 mb-3">
                        Found {ncr.aiInsights.similarNCRs.length} Similar NCRs
                      </h4>
                      <div className="space-y-2">
                        {ncr.aiInsights.similarNCRs.map((similarId) => (
                          <div
                            key={similarId}
                            className="p-3 rounded-lg bg-gray-700/50 border border-gray-600 hover:border-blue-500 transition-colors cursor-pointer"
                            onClick={() =>
                              router.push(`/ncr-management?ncr=${similarId}`)
                            }
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-gray-300">
                                NCR {similarId}
                              </span>
                              <i className="ri-arrow-right-line text-gray-400"></i>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <i className="ri-links-line text-4xl text-gray-600 mb-2"></i>
                      <p className="text-sm text-gray-400">
                        No similar NCRs found
                      </p>
                    </div>
                  )}
                </div>
              )}

              {activeTab === "links" && (
                <div className="space-y-4">
                  <h4 className="text-sm font-semibold text-gray-300 mb-3">
                    Linked Entities
                  </h4>
                  <div className="grid grid-cols-2 gap-3">
                    {ncr.linkedMaterial && (
                      <button
                        onClick={() =>
                          router.push(
                            `/materials?material=${ncr.linkedMaterial}`,
                          )
                        }
                        className="p-3 rounded-lg bg-gray-700/50 border border-gray-600 hover:border-blue-500 transition-colors text-left"
                      >
                        <i className="ri-box-line text-blue-400 mb-1"></i>
                        <div className="text-xs text-gray-400">Material</div>
                        <div className="text-sm text-white">
                          {ncr.linkedMaterialNumber || ncr.linkedMaterial}
                        </div>
                      </button>
                    )}
                    {ncr.linkedSO && (
                      <button
                        onClick={() =>
                          router.push(`/sales-orders?so=${ncr.linkedSO}`)
                        }
                        className="p-3 rounded-lg bg-gray-700/50 border border-gray-600 hover:border-blue-500 transition-colors text-left"
                      >
                        <i className="ri-shopping-cart-line text-green-400 mb-1"></i>
                        <div className="text-xs text-gray-400">Sales Order</div>
                        <div className="text-sm text-white">
                          {ncr.linkedSONumber || ncr.linkedSO}
                        </div>
                      </button>
                    )}
                    {ncr.linkedPO && (
                      <button
                        onClick={() =>
                          router.push(`/purchase-orders?po=${ncr.linkedPO}`)
                        }
                        className="p-3 rounded-lg bg-gray-700/50 border border-gray-600 hover:border-blue-500 transition-colors text-left"
                      >
                        <i className="ri-shopping-bag-line text-purple-400 mb-1"></i>
                        <div className="text-xs text-gray-400">
                          Purchase Order
                        </div>
                        <div className="text-sm text-white">
                          {ncr.linkedPONumber || ncr.linkedPO}
                        </div>
                      </button>
                    )}
                    {ncr.linkedCAPA && (
                      <button
                        onClick={() =>
                          router.push(`/capa-management?capa=${ncr.linkedCAPA}`)
                        }
                        className="p-3 rounded-lg bg-gray-700/50 border border-gray-600 hover:border-orange-500 transition-colors text-left"
                      >
                        <i className="ri-tools-line text-orange-400 mb-1"></i>
                        <div className="text-xs text-gray-400">CAPA</div>
                        <div className="text-sm text-white">
                          {ncr.linkedCAPANumber || ncr.linkedCAPA}
                        </div>
                      </button>
                    )}
                    {ncr.linkedLocation && (
                      <button
                        onClick={() =>
                          router.push(
                            `/storage-locations?location=${ncr.linkedLocation}`,
                          )
                        }
                        className="p-3 rounded-lg bg-gray-700/50 border border-gray-600 hover:border-cyan-500 transition-colors text-left"
                      >
                        <i className="ri-map-pin-line text-cyan-400 mb-1"></i>
                        <div className="text-xs text-gray-400">Location</div>
                        <div className="text-sm text-white">
                          {ncr.linkedLocationCode || ncr.linkedLocation}
                        </div>
                      </button>
                    )}
                    {ncr.linkedCustomer && (
                      <button
                        onClick={() =>
                          router.push(
                            `/customers?customer=${ncr.linkedCustomer}`,
                          )
                        }
                        className="p-3 rounded-lg bg-gray-700/50 border border-gray-600 hover:border-pink-500 transition-colors text-left"
                      >
                        <i className="ri-user-line text-pink-400 mb-1"></i>
                        <div className="text-xs text-gray-400">Customer</div>
                        <div className="text-sm text-white">
                          {ncr.linkedCustomerNumber || ncr.linkedCustomer}
                        </div>
                      </button>
                    )}
                  </div>
                </div>
              )}

              {activeTab === "ai" && ncr.aiInsights && (
                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-semibold text-gray-300 mb-2">
                      AI Recommendations
                    </h4>
                    {ncr.aiInsights.recommendations &&
                    ncr.aiInsights.recommendations.length > 0 ? (
                      <ul className="space-y-2">
                        {ncr.aiInsights.recommendations.map((rec, i) => (
                          <li
                            key={i}
                            className="p-3 rounded-lg bg-purple-900/20 border border-purple-500/30"
                          >
                            <p className="text-sm text-gray-300">{rec}</p>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm text-gray-400">
                        No recommendations available
                      </p>
                    )}
                  </div>
                  {ncr.aiInsights.suggestedCAPAs &&
                    ncr.aiInsights.suggestedCAPAs.length > 0 && (
                      <div>
                        <h4 className="text-sm font-semibold text-gray-300 mb-2">
                          Suggested CAPAs
                        </h4>
                        <div className="space-y-2">
                          {ncr.aiInsights.suggestedCAPAs.map((capaId, i) => (
                            <button
                              key={i}
                              onClick={() =>
                                router.push(`/capa-management?capa=${capaId}`)
                              }
                              className="w-full p-3 rounded-lg bg-orange-900/20 border border-orange-500/30 hover:border-orange-500 transition-colors text-left"
                            >
                              <div className="flex items-center justify-between">
                                <span className="text-sm text-white">
                                  CAPA {capaId}
                                </span>
                                <i className="ri-arrow-right-line text-orange-400"></i>
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Actions */}
      <div className="mt-4 pt-4 border-t border-gray-700 flex gap-2">
        <button
          onClick={() => router.push(`/ncr-management?ncr=${ncr.id}`)}
          className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
        >
          View Details
        </button>
        {ncr.status !== "CLOSED" && (
          <button
            onClick={() => router.push(`/capa-management?ncr=${ncr.id}`)}
            className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-sm font-medium transition-colors"
          >
            Create CAPA
          </button>
        )}
      </div>
    </motion.div>
  );
}
