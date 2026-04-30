/**
 * Intelligent Chemical Insights Component
 * Display AI-powered insights and recommendations
 */

"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Chemical } from "@/types/chemical";
import {
  ChemicalInsight,
  ChemicalRecommendation,
} from "@/lib/services/chemical/intelligentChemicalService";

interface IntelligentInsightsProps {
  chemical: Chemical;
}

export default function IntelligentInsights({
  chemical,
}: IntelligentInsightsProps) {
  const [insights, setInsights] = useState<ChemicalInsight[]>([]);
  const [recommendations, setRecommendations] = useState<
    ChemicalRecommendation[]
  >([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"insights" | "recommendations">(
    "insights",
  );

  useEffect(() => {
    loadIntelligence();
  }, [chemical.id]);

  const loadIntelligence = async () => {
    setLoading(true);
    try {
      // Load insights
      const insightsRes = await fetch("/api/chemical/intelligence/insights", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chemicalId: chemical.id }),
      });
      const insightsData = await insightsRes.json();
      if (insightsData.success) {
        setInsights(insightsData.insights);
      }

      // Load recommendations
      const recRes = await fetch("/api/chemical/intelligence/recommendations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chemicalId: chemical.id }),
      });
      const recData = await recRes.json();
      if (recData.success) {
        setRecommendations(recData.recommendations);
      }
    } catch (error) {
      console.error("Error loading intelligence:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-gray-700">
        <button
          onClick={() => setActiveTab("insights")}
          className={`px-4 py-3 flex items-center gap-2 font-medium transition ${
            activeTab === "insights"
              ? "text-cyan-400 border-b-2 border-cyan-400"
              : "text-gray-400 hover:text-gray-300"
          }`}
        >
          <i className="ri-lightbulb-line"></i>
          AI Insights ({insights.length})
        </button>
        <button
          onClick={() => setActiveTab("recommendations")}
          className={`px-4 py-3 flex items-center gap-2 font-medium transition ${
            activeTab === "recommendations"
              ? "text-cyan-400 border-b-2 border-cyan-400"
              : "text-gray-400 hover:text-gray-300"
          }`}
        >
          <i className="ri-star-line"></i>
          Recommendations ({recommendations.length})
        </button>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-cyan-500"></div>
        </div>
      ) : (
        <AnimatePresence mode="wait">
          {activeTab === "insights" && (
            <motion.div
              key="insights"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-4"
            >
              {insights.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  <i className="ri-lightbulb-line text-4xl mb-4"></i>
                  <p>No insights available</p>
                </div>
              ) : (
                insights.map((insight) => (
                  <div
                    key={insight.id}
                    className={`p-4 rounded-lg border ${
                      insight.severity === "critical"
                        ? "bg-red-900/20 border-red-500/30"
                        : insight.severity === "high"
                          ? "bg-orange-900/20 border-orange-500/30"
                          : insight.severity === "medium"
                            ? "bg-yellow-900/20 border-yellow-500/30"
                            : "bg-blue-900/20 border-blue-500/30"
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <h4 className="font-semibold mb-1">{insight.title}</h4>
                        <p className="text-sm text-gray-300">
                          {insight.description}
                        </p>
                      </div>
                      <span
                        className={`px-2 py-1 rounded text-xs ${
                          insight.severity === "critical"
                            ? "bg-red-900/30 text-red-400"
                            : insight.severity === "high"
                              ? "bg-orange-900/30 text-orange-400"
                              : insight.severity === "medium"
                                ? "bg-yellow-900/30 text-yellow-400"
                                : "bg-blue-900/30 text-blue-400"
                        }`}
                      >
                        {insight.severity}
                      </span>
                    </div>
                    {insight.recommendations.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-gray-700">
                        <p className="text-xs font-semibold text-gray-400 mb-2">
                          Recommendations:
                        </p>
                        <ul className="space-y-1">
                          {insight.recommendations.map((rec, idx) => (
                            <li
                              key={idx}
                              className="text-xs text-gray-300 flex items-start gap-2"
                            >
                              <i className="ri-arrow-right-line text-cyan-400 mt-0.5"></i>
                              {rec}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {insight.impact && (
                      <div className="mt-3 pt-3 border-t border-gray-700">
                        <div className="flex items-center gap-4 text-xs">
                          {insight.impact.estimatedSavings && (
                            <span className="text-green-400">
                              <i className="ri-money-dollar-circle-line mr-1"></i>
                              Est. Savings: $
                              {insight.impact.estimatedSavings.toLocaleString()}
                            </span>
                          )}
                          {insight.impact.riskReduction && (
                            <span className="text-blue-400">
                              <i className="ri-shield-line mr-1"></i>
                              Risk Reduction: {insight.impact.riskReduction}%
                            </span>
                          )}
                          {insight.impact.complianceImprovement && (
                            <span className="text-purple-400">
                              <i className="ri-checkbox-circle-line mr-1"></i>
                              Compliance: +
                              {insight.impact.complianceImprovement}%
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                    <div className="mt-2 text-xs text-gray-500">
                      Confidence: {insight.confidence}%
                    </div>
                  </div>
                ))
              )}
            </motion.div>
          )}

          {activeTab === "recommendations" && (
            <motion.div
              key="recommendations"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-4"
            >
              {recommendations.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  <i className="ri-star-line text-4xl mb-4"></i>
                  <p>No recommendations available</p>
                </div>
              ) : (
                recommendations.map((rec) => (
                  <div
                    key={rec.id}
                    className={`p-4 rounded-lg border ${
                      rec.priority === "critical"
                        ? "bg-red-900/20 border-red-500/30"
                        : rec.priority === "high"
                          ? "bg-orange-900/20 border-orange-500/30"
                          : rec.priority === "medium"
                            ? "bg-yellow-900/20 border-yellow-500/30"
                            : "bg-blue-900/20 border-blue-500/30"
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold">{rec.title}</h4>
                          <span
                            className={`px-2 py-0.5 rounded text-xs ${
                              rec.type === "substitution"
                                ? "bg-green-900/30 text-green-400"
                                : rec.type === "storage"
                                  ? "bg-blue-900/30 text-blue-400"
                                  : rec.type === "compliance"
                                    ? "bg-purple-900/30 text-purple-400"
                                    : "bg-gray-700 text-gray-400"
                            }`}
                          >
                            {rec.type}
                          </span>
                        </div>
                        <p className="text-sm text-gray-300 mb-2">
                          {rec.description}
                        </p>
                        <p className="text-xs text-gray-400 italic">
                          {rec.reasoning}
                        </p>
                      </div>
                      <span
                        className={`px-2 py-1 rounded text-xs ${
                          rec.priority === "critical"
                            ? "bg-red-900/30 text-red-400"
                            : rec.priority === "high"
                              ? "bg-orange-900/30 text-orange-400"
                              : rec.priority === "medium"
                                ? "bg-yellow-900/30 text-yellow-400"
                                : "bg-blue-900/30 text-blue-400"
                        }`}
                      >
                        {rec.priority}
                      </span>
                    </div>

                    {rec.benefits.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-gray-700">
                        <p className="text-xs font-semibold text-green-400 mb-2">
                          Benefits:
                        </p>
                        <ul className="space-y-1">
                          {rec.benefits.map((benefit, idx) => (
                            <li
                              key={idx}
                              className="text-xs text-gray-300 flex items-start gap-2"
                            >
                              <i className="ri-checkbox-circle-line text-green-400 mt-0.5"></i>
                              {benefit}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {rec.implementationSteps.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-gray-700">
                        <p className="text-xs font-semibold text-cyan-400 mb-2">
                          Implementation Steps:
                        </p>
                        <ol className="space-y-1">
                          {rec.implementationSteps.map((step, idx) => (
                            <li
                              key={idx}
                              className="text-xs text-gray-300 flex items-start gap-2"
                            >
                              <span className="flex-shrink-0 w-5 h-5 rounded-full bg-cyan-900/30 text-cyan-400 flex items-center justify-center text-xs">
                                {idx + 1}
                              </span>
                              {step}
                            </li>
                          ))}
                        </ol>
                      </div>
                    )}

                    {(rec.estimatedCost || rec.estimatedSavings) && (
                      <div className="mt-3 pt-3 border-t border-gray-700 flex items-center gap-4 text-xs">
                        {rec.estimatedCost && (
                          <span className="text-red-400">
                            <i className="ri-money-dollar-circle-line mr-1"></i>
                            Est. Cost: ${rec.estimatedCost.toLocaleString()}
                          </span>
                        )}
                        {rec.estimatedSavings && (
                          <span className="text-green-400">
                            <i className="ri-money-dollar-circle-line mr-1"></i>
                            Est. Savings: $
                            {rec.estimatedSavings.toLocaleString()}
                          </span>
                        )}
                      </div>
                    )}

                    <div className="mt-2 text-xs text-gray-500">
                      Confidence: {rec.confidence}%
                    </div>
                  </div>
                ))
              )}
            </motion.div>
          )}
        </AnimatePresence>
      )}
    </div>
  );
}
