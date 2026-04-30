/**
 * Unified Analytics Dashboard
 * Cross-module analytics and insights
 * Much more comprehensive than source apps
 */

"use client";

import { useEffect, useState } from "react";
import type { UnifiedDashboard } from "@/lib/services/integration/crossModuleAnalyticsService";
import { crossModuleAnalyticsService } from "@/lib/services/integration/crossModuleAnalyticsService";
import { useCustomer } from "@/contexts/CustomerContext";

export default function UnifiedAnalyticsPage() {
  const { currentCustomer } = useCustomer();
  const [dashboard, setDashboard] = useState<UnifiedDashboard | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboard();
  }, [currentCustomer]);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const data = await crossModuleAnalyticsService.generateUnifiedDashboard(
        "default-tenant",
        currentCustomer?.id,
      );
      setDashboard(data);
    } catch (error) {
      console.error("Error fetching unified dashboard:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading unified analytics...</p>
        </div>
      </div>
    );
  }

  if (!dashboard) {
    return (
      <div className="p-6 text-center text-gray-500">
        No analytics data available
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Unified Analytics
          </h1>
          <p className="text-gray-600 mt-1">
            Cross-module analytics and insights
          </p>
        </div>
        <button
          onClick={fetchDashboard}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Refresh
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-sm font-medium text-gray-500">Overall Health</h3>
          <p className="text-3xl font-bold text-gray-900 mt-2">
            {dashboard.kpis.overallHealth}%
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-sm font-medium text-gray-500">Efficiency</h3>
          <p className="text-3xl font-bold text-green-600 mt-2">
            {dashboard.kpis.efficiency}%
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-sm font-medium text-gray-500">Compliance</h3>
          <p className="text-3xl font-bold text-blue-600 mt-2">
            {dashboard.kpis.compliance}%
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-sm font-medium text-gray-500">Cost Savings</h3>
          <p className="text-3xl font-bold text-purple-600 mt-2">
            {dashboard.kpis.costSavings}%
          </p>
        </div>
      </div>

      {/* Module Status */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Module Status</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {dashboard.modules.map((module) => (
            <div key={module.moduleId} className="border rounded-lg p-4">
              <div className="flex justify-between items-start mb-3">
                <h3 className="font-semibold text-gray-900">
                  {module.moduleName}
                </h3>
                <span
                  className={`px-2 py-1 text-xs rounded ${
                    module.status === "HEALTHY"
                      ? "bg-green-100 text-green-800"
                      : module.status === "WARNING"
                        ? "bg-yellow-100 text-yellow-800"
                        : "bg-red-100 text-red-800"
                  }`}
                >
                  {module.status}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-gray-500">Total:</span>
                  <span className="ml-2 font-semibold">
                    {module.metrics.total}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500">Active:</span>
                  <span className="ml-2 font-semibold text-blue-600">
                    {module.metrics.active}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500">Completed:</span>
                  <span className="ml-2 font-semibold text-green-600">
                    {module.metrics.completed}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500">Issues:</span>
                  <span className="ml-2 font-semibold text-red-600">
                    {module.metrics.issues}
                  </span>
                </div>
              </div>
              <div className="mt-3 pt-3 border-t">
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500">Trend:</span>
                  <span
                    className={`font-semibold ${
                      module.trends.direction === "IMPROVING"
                        ? "text-green-600"
                        : module.trends.direction === "DETERIORATING"
                          ? "text-red-600"
                          : "text-gray-600"
                    }`}
                  >
                    {module.trends.direction} (
                    {module.trends.changePercentage > 0 ? "+" : ""}
                    {module.trends.changePercentage.toFixed(1)}%)
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Correlations */}
      {dashboard.correlations.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            Module Correlations
          </h2>
          <div className="space-y-4">
            {dashboard.correlations.map((correlation) => (
              <div
                key={`${correlation.sourceModule}-${correlation.targetModule}`}
                className="border rounded-lg p-4"
              >
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      {correlation.sourceModule} → {correlation.targetModule}
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">
                      {correlation.description}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-500">Strength</p>
                    <p className="text-2xl font-bold text-blue-600">
                      {(correlation.correlationStrength * 100).toFixed(0)}%
                    </p>
                  </div>
                </div>
                <div className="flex gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Type:</span>
                    <span className="ml-2 font-semibold">
                      {correlation.correlationType}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500">Frequency:</span>
                    <span className="ml-2 font-semibold">
                      {correlation.metrics.frequency}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500">Confidence:</span>
                    <span className="ml-2 font-semibold">
                      {correlation.metrics.confidence}%
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Insights */}
      {dashboard.insights.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            Unified Insights
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {dashboard.insights.map((insight, idx) => (
              <div key={idx} className="border-l-4 border-blue-500 pl-4 py-2">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-semibold text-gray-900">
                    {insight.title}
                  </h3>
                  <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">
                    Impact: {insight.impact}
                  </span>
                </div>
                <p className="text-sm text-gray-600">{insight.description}</p>
                <div className="mt-2 flex flex-wrap gap-1">
                  {insight.modules.map((moduleId) => (
                    <span
                      key={moduleId}
                      className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded"
                    >
                      {moduleId}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
