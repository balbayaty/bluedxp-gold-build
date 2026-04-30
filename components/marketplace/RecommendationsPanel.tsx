"use client";

import { useState, useEffect } from "react";
import {
  Sparkles,
  TrendingUp,
  DollarSign,
  Clock,
  ArrowRight,
} from "lucide-react";
import type { Recommendation } from "@/lib/services/marketplace/marketplaceRecommendationService";

interface RecommendationsPanelProps {
  userId: string;
  limit?: number;
}

export default function RecommendationsPanel({
  userId,
  limit = 5,
}: RecommendationsPanelProps) {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRecommendations();
  }, [userId]);

  const loadRecommendations = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/marketplace/recommendations?userId=${userId}&limit=${limit}`,
      );
      const result = await response.json();
      if (result.success) {
        setRecommendations(result.data.recommendations || []);
      }
    } catch (error) {
      console.error("Failed to load recommendations:", error);
    } finally {
      setLoading(false);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "CRITICAL":
        return "border-red-500 bg-red-50";
      case "HIGH":
        return "border-orange-500 bg-orange-50";
      case "MEDIUM":
        return "border-blue-500 bg-blue-50";
      default:
        return "border-slate-300 bg-slate-50";
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "PRICING_OPTIMIZATION":
        return DollarSign;
      case "CAPACITY_PLANNING":
        return Clock;
      case "MARKET_DEMAND":
        return TrendingUp;
      default:
        return Sparkles;
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-slate-200 rounded w-1/2"></div>
          <div className="h-20 bg-slate-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (recommendations.length === 0) {
    return null;
  }

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-slate-800 flex items-center space-x-2">
          <Sparkles className="w-5 h-5 text-blue-600" />
          <span>AI Recommendations</span>
        </h3>
        <span className="text-sm text-slate-500">
          {recommendations.length} suggestions
        </span>
      </div>

      <div className="space-y-4">
        {recommendations.map((rec) => {
          const Icon = getTypeIcon(rec.type);
          return (
            <div
              key={rec.id}
              className={`border rounded-lg p-4 ${getPriorityColor(rec.priority)}`}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-start space-x-3 flex-1">
                  <Icon className="w-5 h-5 text-blue-600 mt-0.5" />
                  <div className="flex-1">
                    <h4 className="font-semibold text-slate-800 mb-1">
                      {rec.title}
                    </h4>
                    <p className="text-sm text-slate-600 mb-2">
                      {rec.description}
                    </p>

                    {rec.impact.expectedImprovement && (
                      <div className="flex items-center space-x-4 text-xs text-slate-500 mb-2">
                        {rec.impact.expectedImprovement && (
                          <span>
                            +{rec.impact.expectedImprovement}% improvement
                          </span>
                        )}
                        {rec.impact.estimatedSavings && (
                          <span>Save {rec.impact.estimatedSavings} SAR</span>
                        )}
                        <span className="text-blue-600">
                          Confidence: {rec.confidence}%
                        </span>
                      </div>
                    )}

                    {rec.actions.length > 0 && (
                      <div className="mt-3">
                        <button className="text-sm text-blue-600 hover:text-blue-700 flex items-center space-x-1">
                          <span>View Actions</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
