/**
 * AI Insights Panel
 * Shows AI-powered recommendations and predictions
 */

"use client";

import { useState, useEffect } from "react";
import type { Shipment } from "@/types/tms";

interface AIInsightsPanelProps {
  context: string;
  shipments: Shipment[];
}

export default function AIInsightsPanel({
  context,
  shipments,
}: AIInsightsPanelProps) {
  const [insights, setInsights] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadInsights();
  }, [shipments]);

  const loadInsights = async () => {
    setLoading(true);
    try {
      // In production: Call AI insights API
      // For now, generate mock insights
      const mockInsights = [
        {
          id: "1",
          type: "DELAY_PREDICTION",
          priority: "HIGH",
          title: "Delay Risk Detected",
          message:
            "Shipment SH-123456 has 75% probability of delay due to port congestion",
          recommendation:
            "Reroute via alternative port or upgrade to air freight",
          potentialImpact: "12 hours delay",
          confidence: 0.85,
        },
        {
          id: "2",
          type: "COST_OPTIMIZATION",
          priority: "MEDIUM",
          title: "Cost Savings Opportunity",
          message: "3 shipments on same route can be consolidated",
          recommendation: "Consolidate to save $450 (18%)",
          potentialImpact: "$450 savings",
          confidence: 0.92,
        },
        {
          id: "3",
          type: "COMPLIANCE",
          priority: "CRITICAL",
          title: "Missing Documents",
          message: "Certificate of Origin required for 2 shipments",
          recommendation:
            "Request from supplier immediately to avoid customs delays",
          potentialImpact: "24-48 hours delay if not addressed",
          confidence: 1.0,
        },
      ];

      setInsights(mockInsights);
    } catch (error) {
      console.error("Error loading insights:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 overflow-hidden flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <i className="ri-robot-line text-purple-400"></i>
          AI Insights
        </h3>
        <span className="px-2 py-1 bg-purple-500/20 text-purple-400 rounded-lg text-sm font-medium">
          {insights.length}
        </span>
      </div>

      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-white/50">Analyzing...</div>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto space-y-3">
          {insights.map((insight) => (
            <div
              key={insight.id}
              className={`p-4 rounded-xl border ${
                insight.priority === "CRITICAL"
                  ? "bg-red-500/10 border-red-500/30"
                  : insight.priority === "HIGH"
                    ? "bg-orange-500/10 border-orange-500/30"
                    : "bg-purple-500/10 border-purple-500/30"
              }`}
            >
              <div className="flex items-start gap-3">
                <div
                  className={`mt-1 w-2 h-2 rounded-full ${
                    insight.priority === "CRITICAL"
                      ? "bg-red-500 animate-pulse"
                      : insight.priority === "HIGH"
                        ? "bg-orange-500"
                        : "bg-purple-500"
                  }`}
                ></div>
                <div className="flex-1">
                  <div className="text-white font-medium mb-1">
                    {insight.title}
                  </div>
                  <div className="text-white/70 text-sm mb-2">
                    {insight.message}
                  </div>
                  <div className="p-3 bg-white/5 rounded-lg mb-2">
                    <div className="text-xs text-white/50 mb-1">
                      AI Recommendation
                    </div>
                    <div className="text-white/90 text-sm">
                      {insight.recommendation}
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-white/50">
                      Confidence: {(insight.confidence * 100).toFixed(0)}%
                    </span>
                    <span className="text-cyan-400">
                      {insight.potentialImpact}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
