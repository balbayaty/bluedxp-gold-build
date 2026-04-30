/**
 * Compliance Tracker Component
 * Multi-jurisdiction compliance tracking and AI verification
 * BlueDXP Platform - 5IR Aligned
 */

"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  regulatoryComplianceService,
  type ComplianceCheckResult,
  type AIComplianceVerification,
} from "@/lib/services/wms/regulatoryComplianceService";
import type { StorageLocation } from "@/types/warehouseLocation";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

interface ComplianceTrackerProps {
  location: StorageLocation;
  onRefresh?: () => void;
}

export default function ComplianceTracker({
  location,
  onRefresh,
}: ComplianceTrackerProps) {
  const [complianceResults, setComplianceResults] = useState<
    ComplianceCheckResult[]
  >([]);
  const [aiVerification, setAiVerification] =
    useState<AIComplianceVerification | null>(null);
  const [overallScore, setOverallScore] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchCompliance();
  }, [location.id]);

  const fetchCompliance = async () => {
    try {
      setLoading(true);

      // Check all compliance
      const results =
        await regulatoryComplianceService.checkAllCompliance(location);
      setComplianceResults(results);

      // Get AI verification
      const aiVer =
        await regulatoryComplianceService.aiVerifyCompliance(location);
      setAiVerification(aiVer);

      // Get overall score
      const score =
        await regulatoryComplianceService.calculateOverallComplianceScore(
          location,
        );
      setOverallScore(score);
    } catch (error) {
      console.error("Error fetching compliance:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchCompliance();
    setRefreshing(false);
    onRefresh?.();
  };

  const chartData = complianceResults.map((result) => ({
    authority: result.authorityId.split("-")[1] || result.authorityId,
    score: result.complianceScore,
    compliant: result.compliant ? 1 : 0,
  }));

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-500"></div>
        <p className="mt-4 text-gray-400">Loading compliance data...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <i className="ri-shield-check-line text-cyan-400"></i>
            Compliance Tracker
          </h3>
          <p className="text-sm text-gray-400">
            Multi-jurisdiction compliance monitoring
          </p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 hover:border-cyan-500/50 hover:bg-cyan-500/10 transition flex items-center gap-2 text-white disabled:opacity-50"
        >
          {refreshing ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-cyan-400"></div>
              Refreshing...
            </>
          ) : (
            <>
              <i className="ri-refresh-line"></i>
              Refresh
            </>
          )}
        </button>
      </div>

      {/* Overall Score */}
      {overallScore !== null && (
        <div className="p-6 rounded-xl bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border border-cyan-500/20">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h4 className="text-lg font-semibold text-white">
                Overall Compliance Score
              </h4>
              <p className="text-sm text-gray-400">
                Average across all regulatory authorities
              </p>
            </div>
            <div className="text-right">
              <div
                className={`text-4xl font-bold ${
                  overallScore >= 90
                    ? "text-green-400"
                    : overallScore >= 70
                      ? "text-yellow-400"
                      : "text-red-400"
                }`}
              >
                {overallScore}%
              </div>
              <div className="text-xs text-gray-400 mt-1">
                {complianceResults.length} authorities checked
              </div>
            </div>
          </div>
          <div className="w-full bg-white/10 rounded-full h-3">
            <div
              className={`h-3 rounded-full transition-all ${
                overallScore >= 90
                  ? "bg-green-500"
                  : overallScore >= 70
                    ? "bg-yellow-500"
                    : "bg-red-500"
              }`}
              style={{ width: `${overallScore}%` }}
            />
          </div>
        </div>
      )}

      {/* AI Verification */}
      {aiVerification && (
        <div className="p-6 rounded-xl bg-white/5 border border-white/10">
          <div className="flex items-center gap-3 mb-4">
            <i className="ri-cpu-line text-2xl text-cyan-400"></i>
            <div>
              <h4 className="text-lg font-semibold text-white">
                AI Compliance Verification (5IR)
              </h4>
              <p className="text-sm text-gray-400">
                Powered by AI - Verified on{" "}
                {new Date(aiVerification.verificationDate).toLocaleDateString()}
              </p>
            </div>
            <span
              className={`ml-auto px-3 py-1 rounded text-sm font-medium ${
                aiVerification.overallCompliant
                  ? "bg-green-500/20 text-green-400"
                  : "bg-red-500/20 text-red-400"
              }`}
            >
              {aiVerification.overallCompliant ? "Compliant" : "Non-Compliant"}
            </span>
          </div>

          <div className="grid md:grid-cols-2 gap-4 mb-4">
            {Object.entries(aiVerification.details).map(
              ([category, data]: [string, any]) => (
                <div
                  key={category}
                  className="p-4 rounded-lg bg-white/5 border border-white/10"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-300 capitalize">
                      {category}
                    </span>
                    <span
                      className={`px-2 py-1 rounded text-xs ${
                        data.compliant
                          ? "bg-green-500/20 text-green-400"
                          : "bg-red-500/20 text-red-400"
                      }`}
                    >
                      {data.compliant ? "Compliant" : "Non-Compliant"}
                    </span>
                  </div>
                  <div className="text-2xl font-bold text-white mb-1">
                    {data.score}%
                  </div>
                  <div className="w-full bg-white/10 rounded-full h-1.5">
                    <div
                      className={`h-1.5 rounded-full ${
                        data.score >= 90
                          ? "bg-green-500"
                          : data.score >= 70
                            ? "bg-yellow-500"
                            : "bg-red-500"
                      }`}
                      style={{ width: `${data.score}%` }}
                    />
                  </div>
                  {data.issues.length > 0 && (
                    <div className="mt-2">
                      {data.issues.map((issue: string, idx: number) => (
                        <p key={idx} className="text-xs text-red-400">
                          • {issue}
                        </p>
                      ))}
                    </div>
                  )}
                </div>
              ),
            )}
          </div>

          {aiVerification.recommendations.length > 0 && (
            <div className="mt-4 p-4 rounded-lg bg-cyan-500/10 border border-cyan-500/20">
              <p className="text-sm font-medium text-cyan-400 mb-2">
                AI Recommendations:
              </p>
              <ul className="space-y-1">
                {aiVerification.recommendations.map((rec, idx) => (
                  <li
                    key={idx}
                    className="text-sm text-gray-300 flex items-start gap-2"
                  >
                    <i className="ri-arrow-right-s-line text-cyan-400 mt-0.5"></i>
                    {rec}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Authority Compliance Results */}
      <div>
        <h4 className="text-lg font-semibold text-white mb-4">
          Authority Compliance Results
        </h4>
        <div className="space-y-4">
          {complianceResults.map((result, index) => (
            <motion.div
              key={result.authorityId}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`p-4 rounded-xl border ${
                result.compliant
                  ? "bg-green-500/10 border-green-500/20"
                  : "bg-red-500/10 border-red-500/20"
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h5 className="font-semibold text-white">
                    {result.authorityId}
                  </h5>
                  <p className="text-xs text-gray-400">
                    Last checked:{" "}
                    {new Date(result.lastCheck).toLocaleDateString()}
                  </p>
                </div>
                <div className="text-right">
                  <div
                    className={`text-2xl font-bold ${
                      result.compliant ? "text-green-400" : "text-red-400"
                    }`}
                  >
                    {result.complianceScore}%
                  </div>
                  <span
                    className={`px-2 py-1 rounded text-xs ${
                      result.compliant
                        ? "bg-green-500/20 text-green-400"
                        : "bg-red-500/20 text-red-400"
                    }`}
                  >
                    {result.compliant ? "Compliant" : "Non-Compliant"}
                  </span>
                </div>
              </div>

              <div className="w-full bg-white/10 rounded-full h-2 mb-3">
                <div
                  className={`h-2 rounded-full ${
                    result.complianceScore >= 90
                      ? "bg-green-500"
                      : result.complianceScore >= 70
                        ? "bg-yellow-500"
                        : "bg-red-500"
                  }`}
                  style={{ width: `${result.complianceScore}%` }}
                />
              </div>

              {result.passedRequirements.length > 0 && (
                <div className="mb-3">
                  <p className="text-xs font-medium text-green-400 mb-1">
                    Passed Requirements:
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {result.passedRequirements.map((req, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 rounded text-xs bg-green-500/20 text-green-400"
                      >
                        ✓ {req}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {result.failedRequirements.length > 0 && (
                <div className="mb-3">
                  <p className="text-xs font-medium text-red-400 mb-1">
                    Failed Requirements:
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {result.failedRequirements.map((req, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 rounded text-xs bg-red-500/20 text-red-400"
                      >
                        ✗ {req}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {result.warnings.length > 0 && (
                <div className="mb-3">
                  <p className="text-xs font-medium text-yellow-400 mb-1">
                    Warnings:
                  </p>
                  <ul className="space-y-1">
                    {result.warnings.map((warning, idx) => (
                      <li
                        key={idx}
                        className="text-xs text-gray-300 flex items-start gap-2"
                      >
                        <i className="ri-alert-line text-yellow-400 mt-0.5"></i>
                        {warning}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {result.recommendations.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-cyan-400 mb-1">
                    Recommendations:
                  </p>
                  <ul className="space-y-1">
                    {result.recommendations.map((rec, idx) => (
                      <li
                        key={idx}
                        className="text-xs text-gray-300 flex items-start gap-2"
                      >
                        <i className="ri-arrow-right-s-line text-cyan-400 mt-0.5"></i>
                        {rec}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="mt-3 pt-3 border-t border-white/10">
                <p className="text-xs text-gray-400">
                  Next check: {new Date(result.nextCheck).toLocaleDateString()}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Compliance Chart */}
      {chartData.length > 0 && (
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
          <h4 className="text-lg font-semibold text-white mb-4">
            Compliance Score by Authority
          </h4>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis
                dataKey="authority"
                stroke="#9ca3af"
                fontSize={10}
                angle={-45}
                textAnchor="end"
                height={80}
              />
              <YAxis stroke="#9ca3af" fontSize={12} />
              <RechartsTooltip
                contentStyle={{
                  backgroundColor: "#1f2937",
                  border: "1px solid #374151",
                  borderRadius: "8px",
                }}
                labelStyle={{ color: "#fff" }}
              />
              <Bar dataKey="score" fill="#06b6d4" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
