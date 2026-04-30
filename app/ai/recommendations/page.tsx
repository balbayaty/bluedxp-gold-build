/**
 * Intelligent Recommendations Page
 * AI-powered recommendations across all modules
 * Much more comprehensive than source apps
 */

"use client";

import { useEffect, useState } from "react";
import type { IntelligentRecommendation } from "@/lib/services/ai/intelligentRecommendationsService";
import { intelligentRecommendationsService } from "@/lib/services/ai/intelligentRecommendationsService";

export default function IntelligentRecommendationsPage() {
  const [recommendations, setRecommendations] = useState<
    IntelligentRecommendation[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<{
    moduleId?: string;
    category?: IntelligentRecommendation["category"];
    priority?: IntelligentRecommendation["priority"];
    status?: IntelligentRecommendation["status"];
  }>({});

  useEffect(() => {
    fetchRecommendations();
  }, [filter]);

  const fetchRecommendations = async () => {
    try {
      setLoading(true);
      const data = await intelligentRecommendationsService.getRecommendations(
        filter.moduleId,
        filter.category,
        filter.priority,
        filter.status,
      );
      setRecommendations(data);
    } catch (error) {
      console.error("Error fetching recommendations:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (
    id: string,
    status: IntelligentRecommendation["status"],
  ) => {
    try {
      await intelligentRecommendationsService.updateRecommendationStatus(
        id,
        status,
      );
      await fetchRecommendations();
    } catch (error) {
      console.error("Error updating recommendation status:", error);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "CRITICAL":
        return "bg-red-100 text-red-800 border-red-500";
      case "HIGH":
        return "bg-orange-100 text-orange-800 border-orange-500";
      case "MEDIUM":
        return "bg-yellow-100 text-yellow-800 border-yellow-500";
      case "LOW":
        return "bg-blue-100 text-blue-800 border-blue-500";
      default:
        return "bg-gray-100 text-gray-800 border-gray-500";
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "EFFICIENCY":
        return "ri-speed-line";
      case "COST_SAVING":
        return "ri-money-dollar-circle-line";
      case "COMPLIANCE":
        return "ri-shield-check-line";
      case "SAFETY":
        return "ri-shield-star-line";
      case "QUALITY":
        return "ri-award-line";
      case "SUSTAINABILITY":
        return "ri-leaf-line";
      case "AUTOMATION":
        return "ri-robot-line";
      default:
        return "ri-lightbulb-line";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading recommendations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Intelligent Recommendations
          </h1>
          <p className="text-gray-600 mt-1">
            AI-powered recommendations to optimize your operations
          </p>
        </div>
        <button
          onClick={() => {
            // Generate new recommendations
            intelligentRecommendationsService
              .generateRecommendations({
                moduleId: "all",
                tenantId: "default",
              })
              .then(() => fetchRecommendations());
          }}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Generate Recommendations
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        <select
          value={filter.priority || ""}
          onChange={(e) =>
            setFilter({
              ...filter,
              priority: (e.target.value as any) || undefined,
            })
          }
          className="px-4 py-2 border border-gray-300 rounded-lg"
        >
          <option value="">All Priorities</option>
          <option value="CRITICAL">Critical</option>
          <option value="HIGH">High</option>
          <option value="MEDIUM">Medium</option>
          <option value="LOW">Low</option>
        </select>
        <select
          value={filter.category || ""}
          onChange={(e) =>
            setFilter({
              ...filter,
              category: (e.target.value as any) || undefined,
            })
          }
          className="px-4 py-2 border border-gray-300 rounded-lg"
        >
          <option value="">All Categories</option>
          <option value="EFFICIENCY">Efficiency</option>
          <option value="COST_SAVING">Cost Saving</option>
          <option value="COMPLIANCE">Compliance</option>
          <option value="SAFETY">Safety</option>
          <option value="QUALITY">Quality</option>
          <option value="SUSTAINABILITY">Sustainability</option>
          <option value="AUTOMATION">Automation</option>
        </select>
        <select
          value={filter.status || ""}
          onChange={(e) =>
            setFilter({
              ...filter,
              status: (e.target.value as any) || undefined,
            })
          }
          className="px-4 py-2 border border-gray-300 rounded-lg"
        >
          <option value="">All Status</option>
          <option value="NEW">New</option>
          <option value="IN_PROGRESS">In Progress</option>
          <option value="IMPLEMENTED">Implemented</option>
          <option value="DISMISSED">Dismissed</option>
        </select>
      </div>

      {/* Recommendations Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {recommendations.length === 0 ? (
          <div className="col-span-full text-center py-12 text-gray-500">
            <i className="ri-lightbulb-line text-6xl mb-4 text-gray-400"></i>
            <p>
              No recommendations available. Generate recommendations to get
              started.
            </p>
          </div>
        ) : (
          recommendations.map((rec) => (
            <div
              key={rec.id}
              className={`bg-white rounded-lg shadow p-6 border-l-4 ${getPriorityColor(rec.priority)}`}
            >
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-2">
                  <i
                    className={`${getCategoryIcon(rec.category)} text-2xl text-blue-600`}
                  ></i>
                  <div>
                    <h3 className="font-semibold text-gray-900">{rec.title}</h3>
                    <p className="text-xs text-gray-500">
                      {rec.moduleId} • {rec.category}
                    </p>
                  </div>
                </div>
                <span className="px-2 py-1 text-xs font-semibold bg-blue-100 text-blue-800 rounded">
                  {rec.confidence}% confidence
                </span>
              </div>

              <p className="text-sm text-gray-600 mb-4">{rec.description}</p>

              {/* Impact */}
              {rec.impact && (
                <div className="mb-4 p-3 bg-gray-50 rounded">
                  <p className="text-xs font-medium text-gray-700 mb-2">
                    Expected Impact:
                  </p>
                  <div className="space-y-1 text-xs">
                    {rec.impact.estimatedSavings && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Cost Savings:</span>
                        <span className="font-semibold text-green-600">
                          ${rec.impact.estimatedSavings.toLocaleString()}
                        </span>
                      </div>
                    )}
                    {rec.impact.efficiencyGain && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Efficiency Gain:</span>
                        <span className="font-semibold text-blue-600">
                          +{rec.impact.efficiencyGain}%
                        </span>
                      </div>
                    )}
                    {rec.impact.riskReduction && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Risk Reduction:</span>
                        <span className="font-semibold text-purple-600">
                          -{rec.impact.riskReduction}%
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Actions */}
              {rec.actions.length > 0 && (
                <div className="mb-4">
                  <p className="text-xs font-medium text-gray-700 mb-2">
                    Recommended Actions:
                  </p>
                  <ol className="space-y-1">
                    {rec.actions.slice(0, 2).map((action) => (
                      <li
                        key={action.step}
                        className="text-xs text-gray-600 flex items-start gap-2"
                      >
                        <span className="font-semibold text-blue-600">
                          {action.step}.
                        </span>
                        <span>{action.action}</span>
                      </li>
                    ))}
                  </ol>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2 mt-4 pt-4 border-t">
                <button
                  onClick={() => handleStatusUpdate(rec.id, "IN_PROGRESS")}
                  className="flex-1 px-3 py-2 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Start
                </button>
                <button
                  onClick={() => handleStatusUpdate(rec.id, "DISMISSED")}
                  className="px-3 py-2 text-xs bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                >
                  Dismiss
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
