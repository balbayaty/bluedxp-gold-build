"use client";

/**
 * ⚡ PERMISSION OPTIMIZATION ENGINE COMPONENT
 *
 * UI for analyzing and optimizing permission configurations
 */

import { useState } from "react";
import {
  permissionOptimizationEngine,
  type OptimizationAnalysis,
  type OptimizationResult,
} from "@/lib/services/permissions";

export default function PermissionOptimizationEngine() {
  const [analysis, setAnalysis] = useState<OptimizationAnalysis | null>(null);
  const [optimizationResult, setOptimizationResult] =
    useState<OptimizationResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isOptimizing, setIsOptimizing] = useState(false);

  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    try {
      const result = await permissionOptimizationEngine.analyze();
      setAnalysis(result);
    } catch (error) {
      console.error("Analysis failed:", error);
      alert("Analysis failed. Please try again.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleOptimize = async () => {
    if (!analysis) {
      alert("Please run analysis first");
      return;
    }

    setIsOptimizing(true);
    try {
      const result = await permissionOptimizationEngine.optimize(analysis, {
        autoApply: false,
        dryRun: true,
      });
      setOptimizationResult(result);
    } catch (error) {
      console.error("Optimization failed:", error);
      alert("Optimization failed. Please try again.");
    } finally {
      setIsOptimizing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-2xl font-bold mb-4">Permission Optimization</h2>
        <div className="space-y-4">
          <button
            onClick={handleAnalyze}
            disabled={isAnalyzing}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {isAnalyzing ? "Analyzing..." : "Analyze Permissions"}
          </button>

          {analysis && (
            <div className="mt-6 space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <span className="font-semibold">Optimization Score</span>
                <span className="text-3xl font-bold">{analysis.score}/100</span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-white border rounded-lg">
                  <p className="text-sm text-gray-600">Total Permissions</p>
                  <p className="text-2xl font-bold">
                    {analysis.metrics.totalPermissions}
                  </p>
                </div>
                <div className="p-4 bg-white border rounded-lg">
                  <p className="text-sm text-gray-600">Redundant</p>
                  <p className="text-2xl font-bold text-orange-600">
                    {analysis.metrics.redundantPermissions}
                  </p>
                </div>
                <div className="p-4 bg-white border rounded-lg">
                  <p className="text-sm text-gray-600">Unused</p>
                  <p className="text-2xl font-bold text-red-600">
                    {analysis.metrics.unusedPermissions}
                  </p>
                </div>
                <div className="p-4 bg-white border rounded-lg">
                  <p className="text-sm text-gray-600">Security Score</p>
                  <p className="text-2xl font-bold text-green-600">
                    {analysis.metrics.securityScore}/100
                  </p>
                </div>
              </div>

              {analysis.issues.length > 0 && (
                <div className="mt-4">
                  <h3 className="font-semibold mb-2">Issues Found</h3>
                  <div className="space-y-2">
                    {analysis.issues.map((issue, index) => (
                      <div
                        key={index}
                        className="p-3 border rounded-lg bg-yellow-50"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-semibold">{issue.type}</span>
                          <span
                            className={`px-2 py-1 rounded text-xs ${
                              issue.severity === "critical"
                                ? "bg-red-200 text-red-800"
                                : issue.severity === "high"
                                  ? "bg-orange-200 text-orange-800"
                                  : "bg-yellow-200 text-yellow-800"
                            }`}
                          >
                            {issue.severity}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">
                          {issue.description}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {analysis.recommendations.length > 0 && (
                <div className="mt-4">
                  <h3 className="font-semibold mb-2">Recommendations</h3>
                  <div className="space-y-2">
                    {analysis.recommendations.map((rec, index) => (
                      <div
                        key={index}
                        className="p-3 border rounded-lg bg-blue-50"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-semibold">{rec.type}</span>
                          <span
                            className={`px-2 py-1 rounded text-xs ${
                              rec.priority === "high"
                                ? "bg-red-200 text-red-800"
                                : rec.priority === "medium"
                                  ? "bg-orange-200 text-orange-800"
                                  : "bg-yellow-200 text-yellow-800"
                            }`}
                          >
                            {rec.priority}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">
                          {rec.description}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          Action: {rec.action}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <button
                onClick={handleOptimize}
                disabled={isOptimizing}
                className="mt-4 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
              >
                {isOptimizing ? "Optimizing..." : "Apply Optimizations"}
              </button>
            </div>
          )}

          {optimizationResult && (
            <div className="mt-6 p-4 bg-green-50 rounded-lg">
              <h3 className="font-semibold mb-2">Optimization Results</h3>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Performance</p>
                  <p className="text-2xl font-bold text-green-600">
                    +{optimizationResult.improvements.performance.toFixed(1)}%
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Security</p>
                  <p className="text-2xl font-bold text-green-600">
                    +{optimizationResult.improvements.security.toFixed(1)}%
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Maintainability</p>
                  <p className="text-2xl font-bold text-green-600">
                    +
                    {optimizationResult.improvements.maintainability.toFixed(1)}
                    %
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
