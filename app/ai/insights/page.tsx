/**
 * AI-Powered Predictive Insights Page
 * Comprehensive AI insights across all modules
 * Much more intelligent than source apps
 */

"use client";

import { useEffect, useState } from "react";
import type {
  PredictiveInsight,
  AnomalyDetection,
  CrossModuleCorrelation,
} from "@/lib/services/ai/predictiveInsightsService";
import { predictiveInsightsService } from "@/lib/services/ai/predictiveInsightsService";

export default function AIPredictiveInsightsPage() {
  const [insights, setInsights] = useState<PredictiveInsight[]>([]);
  const [anomalies, setAnomalies] = useState<AnomalyDetection[]>([]);
  const [correlations, setCorrelations] = useState<CrossModuleCorrelation[]>(
    [],
  );
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<
    "insights" | "anomalies" | "correlations"
  >("insights");

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    try {
      setLoading(true);

      if (activeTab === "insights") {
        const data = await predictiveInsightsService.getInsights();
        setInsights(data);
      } else if (activeTab === "anomalies") {
        const data = await predictiveInsightsService.getAnomalies();
        setAnomalies(data);
      } else {
        const data = await predictiveInsightsService.getCorrelations();
        setCorrelations(data);
      }
    } catch (error) {
      console.error("Error fetching AI insights:", error);
    } finally {
      setLoading(false);
    }
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
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

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "CRITICAL":
        return "bg-red-100 text-red-800";
      case "HIGH":
        return "bg-orange-100 text-orange-800";
      case "MEDIUM":
        return "bg-yellow-100 text-yellow-800";
      case "LOW":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading AI insights...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            AI-Powered Predictive Insights
          </h1>
          <p className="text-gray-600 mt-1">
            Intelligent analytics and predictions across all modules
          </p>
        </div>
        <button
          onClick={fetchData}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Refresh
        </button>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab("insights")}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === "insights"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            Predictive Insights ({insights.length})
          </button>
          <button
            onClick={() => setActiveTab("anomalies")}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === "anomalies"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            Anomaly Detection ({anomalies.length})
          </button>
          <button
            onClick={() => setActiveTab("correlations")}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === "correlations"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            Cross-Module Correlations ({correlations.length})
          </button>
        </nav>
      </div>

      {/* Insights Tab */}
      {activeTab === "insights" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {insights.length === 0 ? (
            <div className="col-span-full text-center py-12 text-gray-500">
              No predictive insights available. Generate insights by analyzing
              module data.
            </div>
          ) : (
            insights.map((insight) => (
              <div
                key={insight.id}
                className={`bg-white rounded-lg shadow p-6 border-l-4 ${getImpactColor(insight.impact)}`}
              >
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      {insight.title}
                    </h3>
                    <p className="text-xs text-gray-500 mt-1">
                      {insight.moduleId} • {insight.entityType}
                    </p>
                  </div>
                  <span className="px-2 py-1 text-xs font-semibold bg-blue-100 text-blue-800 rounded">
                    {insight.confidence}% confidence
                  </span>
                </div>

                <p className="text-sm text-gray-600 mb-3">
                  {insight.description}
                </p>

                {insight.predictedValue !== undefined && (
                  <div className="mb-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Current:</span>
                      <span className="font-semibold">
                        {insight.currentValue?.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Predicted:</span>
                      <span className="font-semibold text-blue-600">
                        {insight.predictedValue.toFixed(2)}
                      </span>
                    </div>
                  </div>
                )}

                {insight.recommendations.length > 0 && (
                  <div className="mt-4 pt-4 border-t">
                    <p className="text-xs font-medium text-gray-700 mb-2">
                      Recommendations:
                    </p>
                    <ul className="space-y-1">
                      {insight.recommendations.slice(0, 2).map((rec, idx) => (
                        <li
                          key={idx}
                          className="text-xs text-gray-600 flex items-start gap-1"
                        >
                          <i className="ri-checkbox-circle-line text-blue-600 mt-0.5"></i>
                          {rec}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* Anomalies Tab */}
      {activeTab === "anomalies" && (
        <div className="space-y-4">
          {anomalies.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              No anomalies detected. System is operating normally.
            </div>
          ) : (
            anomalies.map((anomaly) => (
              <div key={anomaly.id} className="bg-white rounded-lg shadow p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {anomaly.anomalyType.replace(/_/g, " ")} Detected
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">
                      {anomaly.moduleId} • {anomaly.metric} •{" "}
                      {new Date(anomaly.detectedAt).toLocaleString()}
                    </p>
                  </div>
                  <span
                    className={`px-3 py-1 text-sm font-semibold rounded-full ${getSeverityColor(anomaly.severity)}`}
                  >
                    {anomaly.severity}
                  </span>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div>
                    <p className="text-xs text-gray-500">Expected</p>
                    <p className="text-sm font-semibold text-gray-900">
                      {anomaly.expectedValue.toFixed(2)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Actual</p>
                    <p className="text-sm font-semibold text-red-600">
                      {anomaly.actualValue.toFixed(2)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Deviation</p>
                    <p className="text-sm font-semibold text-orange-600">
                      {anomaly.deviationPercentage.toFixed(1)}%
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Status</p>
                    <span
                      className={`px-2 py-1 text-xs rounded ${
                        anomaly.status === "RESOLVED"
                          ? "bg-green-100 text-green-800"
                          : anomaly.status === "INVESTIGATING"
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-blue-100 text-blue-800"
                      }`}
                    >
                      {anomaly.status.replace(/_/g, " ")}
                    </span>
                  </div>
                </div>

                {anomaly.recommendedActions.length > 0 && (
                  <div className="mt-4 pt-4 border-t">
                    <p className="text-sm font-medium text-gray-700 mb-2">
                      Recommended Actions:
                    </p>
                    <ul className="space-y-1">
                      {anomaly.recommendedActions.map((action, idx) => (
                        <li
                          key={idx}
                          className="text-sm text-gray-600 flex items-start gap-2"
                        >
                          <i className="ri-arrow-right-line text-blue-600 mt-1"></i>
                          {action}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* Correlations Tab */}
      {activeTab === "correlations" && (
        <div className="space-y-4">
          {correlations.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              No cross-module correlations found. Correlations are discovered
              through event pattern analysis.
            </div>
          ) : (
            correlations.map((correlation) => (
              <div
                key={correlation.id}
                className="bg-white rounded-lg shadow p-6"
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {correlation.sourceModule} → {correlation.targetModule}
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">
                      {correlation.description}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-500">Strength</p>
                    <p className="text-2xl font-bold text-blue-600">
                      {(correlation.strength * 100).toFixed(0)}%
                    </p>
                    <p className="text-xs text-gray-500">
                      {correlation.confidence}% confidence
                    </p>
                  </div>
                </div>

                <div className="mb-4">
                  <p className="text-sm font-medium text-gray-700 mb-2">
                    Correlation Type:
                  </p>
                  <span className="px-3 py-1 text-sm bg-purple-100 text-purple-800 rounded">
                    {correlation.correlationType.replace(/_/g, " ")}
                  </span>
                </div>

                {correlation.examples.length > 0 && (
                  <div className="mb-4">
                    <p className="text-sm font-medium text-gray-700 mb-2">
                      Examples:
                    </p>
                    <div className="space-y-1">
                      {correlation.examples.slice(0, 3).map((example, idx) => (
                        <div
                          key={idx}
                          className="text-sm text-gray-600 flex items-center gap-2"
                        >
                          <i className="ri-link text-blue-600"></i>
                          <span>{example.sourceEvent}</span>
                          <i className="ri-arrow-right-line text-gray-400"></i>
                          <span>{example.targetEvent}</span>
                          <span className="text-xs text-gray-400 ml-auto">
                            {new Date(example.timestamp).toLocaleDateString()}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {correlation.recommendations.length > 0 && (
                  <div className="mt-4 pt-4 border-t">
                    <p className="text-sm font-medium text-gray-700 mb-2">
                      Recommendations:
                    </p>
                    <ul className="space-y-1">
                      {correlation.recommendations.map((rec, idx) => (
                        <li
                          key={idx}
                          className="text-sm text-gray-600 flex items-start gap-2"
                        >
                          <i className="ri-lightbulb-line text-yellow-600 mt-0.5"></i>
                          {rec}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
