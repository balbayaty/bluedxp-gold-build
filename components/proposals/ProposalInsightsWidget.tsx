/**
 * Proposal Insights Widget
 *
 * Displays AI insights for a proposal
 * Can be embedded in proposal pages or dashboards
 */

"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import type { AIProposalInsight } from "@/lib/services/proposals/universalIntelligentProposalService";

interface ProposalInsightsWidgetProps {
  proposalId?: string;
  insights?: AIProposalInsight[];
  loading?: boolean;
  compact?: boolean;
}

export default function ProposalInsightsWidget({
  proposalId,
  insights: initialInsights,
  loading: externalLoading,
  compact = false,
}: ProposalInsightsWidgetProps) {
  const [insights, setInsights] = useState<AIProposalInsight[]>(
    initialInsights || [],
  );
  const [loading, setLoading] = useState(externalLoading || false);

  useEffect(() => {
    if (proposalId && !initialInsights) {
      loadInsights();
    }
  }, [proposalId]);

  const loadInsights = async () => {
    if (!proposalId) return;

    setLoading(true);
    try {
      // Try universal insights API first
      let response = await fetch(
        `/api/proposals/universal/${proposalId}/insights`,
      );

      // If not found, try legacy API
      if (!response.ok) {
        response = await fetch(`/api/proposals/${proposalId}/insights`);
      }

      const data = await response.json();

      if (data.success && data.insights) {
        setInsights(data.insights);
      }
    } catch (error) {
      console.error("Error loading insights:", error);
    } finally {
      setLoading(false);
    }
  };

  const getInsightIcon = (type: AIProposalInsight["type"]) => {
    switch (type) {
      case "WIN_RATE":
        return "ri-line-chart-line";
      case "CONTENT":
        return "ri-file-text-line";
      case "PRICING":
        return "ri-price-tag-3-line";
      case "TIMING":
        return "ri-time-line";
      case "COMPETITIVE":
        return "ri-trophy-line";
      case "RISK":
        return "ri-alert-line";
      case "OPPORTUNITY":
        return "ri-lightbulb-line";
      default:
        return "ri-information-line";
    }
  };

  const getPriorityColor = (priority: AIProposalInsight["priority"]) => {
    switch (priority) {
      case "CRITICAL":
        return "text-red-500 bg-red-50 dark:bg-red-900/20";
      case "HIGH":
        return "text-orange-500 bg-orange-50 dark:bg-orange-900/20";
      case "MEDIUM":
        return "text-yellow-500 bg-yellow-50 dark:bg-yellow-900/20";
      case "LOW":
        return "text-blue-500 bg-blue-50 dark:bg-blue-900/20";
      default:
        return "text-gray-500 bg-gray-50 dark:bg-gray-900/20";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <i className="ri-loader-4-line animate-spin text-2xl text-gray-400" />
      </div>
    );
  }

  if (insights.length === 0) {
    return (
      <div className="text-center p-8 text-gray-500 dark:text-gray-400">
        <i className="ri-information-line text-3xl mb-2" />
        <p>No insights available</p>
      </div>
    );
  }

  if (compact) {
    return (
      <div className="space-y-2">
        {insights.slice(0, 3).map((insight) => (
          <div
            key={insight.id}
            className={`p-2 rounded-lg ${getPriorityColor(insight.priority)}`}
          >
            <div className="flex items-start gap-2">
              <i className={`${getInsightIcon(insight.type)} mt-0.5`} />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium truncate">
                  {insight.title}
                </div>
                {insight.impact?.winRateIncrease && (
                  <div className="text-xs opacity-75">
                    +{insight.impact.winRateIncrease}% win rate
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl p-6 text-white">
      <div className="flex items-start gap-4">
        <div className="text-4xl">💡</div>
        <div className="flex-1">
          <h3 className="text-xl font-bold mb-4">AI-Powered Insights</h3>
          <div className="space-y-3">
            {insights.slice(0, 4).map((insight, idx) => (
              <motion.div
                key={insight.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="flex items-start gap-3 bg-white/10 backdrop-blur-sm rounded-lg p-3"
              >
                <i className={`${getInsightIcon(insight.type)} text-xl mt-1`} />
                <div className="flex-1">
                  <div className="font-semibold">{insight.title}</div>
                  {insight.impact?.winRateIncrease && (
                    <div className="text-sm opacity-90">
                      Increases win rate by {insight.impact.winRateIncrease}%
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
