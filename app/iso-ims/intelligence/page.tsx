/**
 * ISO IMS Intelligence Dashboard - Mind-Blowing AI-Powered Insights
 *
 * Features:
 * - Real-time AI insights
 * - Pattern detection visualization
 * - Predictive analytics
 * - Smart recommendations
 * - Deep drill-down capabilities
 */

"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import PageTemplate from "@/components/PageTemplate";
import ComplianceScoreCard from "@/components/iso-ims/ComplianceScoreCard";
import PatternDetectionVisualization from "@/components/iso-ims/PatternDetectionVisualization";
import type { ComplianceScore } from "@/lib/services/iso-ims/complianceEngine";
import type {
  NCRPattern,
  SmartRecommendation,
} from "@/lib/services/iso-ims/intelligenceService";

export default function ISOIMSIntelligencePage() {
  const [loading, setLoading] = useState(true);
  const [complianceScore, setComplianceScore] =
    useState<ComplianceScore | null>(null);
  const [patterns, setPatterns] = useState<NCRPattern[]>([]);
  const [recommendations, setRecommendations] = useState<SmartRecommendation[]>(
    [],
  );
  const [predictions, setPredictions] = useState<any[]>([]);
  const [selectedTimeRange, setSelectedTimeRange] = useState<
    "7D" | "30D" | "90D" | "1Y"
  >("30D");

  useEffect(() => {
    fetchIntelligence();
  }, [selectedTimeRange]);

  const fetchIntelligence = async () => {
    try {
      setLoading(true);

      const [complianceRes, patternsRes, recommendationsRes, predictionsRes] =
        await Promise.all([
          fetch("/api/iso-ims/compliance?type=score"),
          fetch("/api/iso-ims/intelligence", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              action: "detect-patterns",
              tenantId: "default-tenant",
              entityType: "NCR",
            }),
          }),
          fetch("/api/iso-ims/intelligence", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              action: "generate-recommendations",
              tenantId: "default-tenant",
            }),
          }),
          fetch("/api/iso-ims/intelligence", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              action: "predict-compliance",
              tenantId: "default-tenant",
              timeframe: selectedTimeRange,
            }),
          }),
        ]);

      if (complianceRes.ok) {
        const score = await complianceRes.json();
        setComplianceScore(score);
      }

      if (patternsRes.ok) {
        const patternsData = await patternsRes.json();
        setPatterns(patternsData || []);
      }

      if (recommendationsRes.ok) {
        const recs = await recommendationsRes.json();
        setRecommendations(recs || []);
      }

      if (predictionsRes.ok) {
        const preds = await predictionsRes.json();
        setPredictions(preds || []);
      }
    } catch (error) {
      console.error("Error fetching intelligence:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageTemplate
      title="ISO IMS Intelligence Dashboard"
      description="AI-Powered Compliance Intelligence • Pattern Detection • Predictive Analytics"
      icon="ri-ai-generate-line"
    >
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <>
          {/* Compliance Score Card */}
          {complianceScore && (
            <div className="mb-8">
              <ComplianceScoreCard
                score={complianceScore}
                showTrends={true}
                showBreakdown={true}
                onDrillDown={(standard) => {
                  console.log("Drill down to:", standard);
                }}
              />
            </div>
          )}

          {/* Pattern Detection */}
          {patterns.length > 0 && (
            <div className="mb-8">
              <PatternDetectionVisualization
                patterns={patterns}
                onPatternClick={(patternId) => {
                  console.log("Pattern clicked:", patternId);
                }}
              />
            </div>
          )}

          {/* Smart Recommendations */}
          {recommendations.length > 0 && (
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <i className="ri-lightbulb-flash-line text-yellow-400"></i>
                AI-Powered Recommendations
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {recommendations.map((rec) => (
                  <motion.div
                    key={rec.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 rounded-lg bg-gradient-to-br from-purple-900/30 to-blue-900/30 border border-purple-500/30"
                  >
                    <div className="flex items-start gap-3">
                      <i className="ri-lightbulb-line text-2xl text-purple-400"></i>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="font-semibold text-white">
                            {rec.title}
                          </h4>
                          <span
                            className={`px-2 py-1 rounded text-xs font-medium ${
                              rec.priority === "CRITICAL"
                                ? "bg-red-900/30 text-red-400"
                                : rec.priority === "HIGH"
                                  ? "bg-orange-900/30 text-orange-400"
                                  : rec.priority === "MEDIUM"
                                    ? "bg-yellow-900/30 text-yellow-400"
                                    : "bg-gray-700 text-gray-400"
                            }`}
                          >
                            {rec.priority}
                          </span>
                        </div>
                        <p className="text-sm text-gray-300 mb-2">
                          {rec.description}
                        </p>
                        <div className="flex items-center justify-between text-xs text-gray-400">
                          <span>Confidence: {rec.confidence}%</span>
                          <span>Impact: {rec.estimatedImpact}</span>
                        </div>
                        {rec.actionUrl && (
                          <button
                            onClick={() =>
                              (window.location.href = rec.actionUrl!)
                            }
                            className="mt-3 w-full px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-medium transition-colors"
                          >
                            Take Action
                          </button>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {/* Predictive Analytics */}
          {predictions.length > 0 && (
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <i className="ri-line-chart-line text-blue-400"></i>
                Predictive Analytics
              </h3>
              <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
                <div className="flex items-center gap-4 mb-4">
                  <span className="text-sm text-gray-400">Time Range:</span>
                  {["7D", "30D", "90D", "1Y"].map((range) => (
                    <button
                      key={range}
                      onClick={() => setSelectedTimeRange(range as any)}
                      className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                        selectedTimeRange === range
                          ? "bg-blue-600 text-white"
                          : "bg-gray-700 text-gray-400 hover:bg-gray-600"
                      }`}
                    >
                      {range}
                    </button>
                  ))}
                </div>
                <div className="h-64 flex items-end justify-between gap-2">
                  {predictions.map((pred, i) => (
                    <motion.div
                      key={i}
                      initial={{ height: 0 }}
                      animate={{
                        height: `${(pred.predictedScore / 100) * 100}%`,
                      }}
                      transition={{ duration: 0.5, delay: i * 0.05 }}
                      className="flex-1 bg-gradient-to-t from-blue-600 to-blue-400 rounded-t hover:from-blue-500 hover:to-blue-300 transition-colors cursor-pointer group relative"
                      title={`${new Date(pred.date).toLocaleDateString()}: ${pred.predictedScore.toFixed(1)}%`}
                    >
                      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="bg-gray-900 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                          {pred.predictedScore.toFixed(1)}%
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </PageTemplate>
  );
}
