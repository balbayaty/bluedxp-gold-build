"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { complianceService } from "@/lib/services/compliance/complianceService";
import {
  complianceScoringService,
  ComplianceScore,
} from "@/lib/services/compliance/complianceScoringService";

interface ComplianceScoringProps {
  tenantId: string;
}

export default function ComplianceScoring({
  tenantId,
}: ComplianceScoringProps) {
  const [score, setScore] = useState<ComplianceScore | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadScore();
  }, [tenantId]);

  const loadScore = async () => {
    try {
      setLoading(true);
      const records = complianceService.getRecordsByTenant(tenantId);
      const calculatedScore =
        complianceScoringService.calculateComplianceScore(records);
      setScore(calculatedScore);
    } catch (error) {
      console.error("Error loading compliance score:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500"></div>
      </div>
    );
  }

  if (!score) {
    return (
      <div className="text-center py-12 text-gray-400">
        <p>No scoring data available</p>
      </div>
    );
  }

  const getScoreColor = (value: number) => {
    if (value >= 90) return "text-green-400";
    if (value >= 70) return "text-yellow-400";
    if (value >= 50) return "text-orange-400";
    return "text-red-400";
  };

  const getScoreBgColor = (value: number) => {
    if (value >= 90) return "bg-green-500";
    if (value >= 70) return "bg-yellow-500";
    if (value >= 50) return "bg-orange-500";
    return "bg-red-500";
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Compliance Scoring</h2>
          <p className="text-gray-400 mt-1">
            Advanced scoring algorithms and analysis
          </p>
        </div>
        <button
          onClick={loadScore}
          className="px-4 py-2 bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/30 rounded-lg text-cyan-400 transition-colors"
        >
          <i className="ri-refresh-line mr-2"></i>
          Recalculate
        </button>
      </div>

      {/* Overall Score */}
      <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-400 mb-2">
              Overall Compliance Score
            </h3>
            <div className="flex items-baseline gap-3">
              <span
                className={`text-5xl font-bold ${getScoreColor(score.overall)}`}
              >
                {score.overall.toFixed(1)}
              </span>
              <span className="text-2xl text-gray-400">/ 100</span>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-400 mb-1">Risk Level</p>
            <span
              className={`px-4 py-2 rounded-lg font-semibold ${
                score.riskLevel === "LOW"
                  ? "bg-green-500/20 text-green-400"
                  : score.riskLevel === "MEDIUM"
                    ? "bg-yellow-500/20 text-yellow-400"
                    : score.riskLevel === "HIGH"
                      ? "bg-orange-500/20 text-orange-400"
                      : "bg-red-500/20 text-red-400"
              }`}
            >
              {score.riskLevel}
            </span>
          </div>
        </div>

        {/* Score Progress Bar */}
        <div className="relative h-4 bg-white/5 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${score.overall}%` }}
            transition={{ duration: 1, ease: "easeOut" }}
            className={`h-full ${getScoreBgColor(score.overall)}`}
          />
        </div>

        {/* Confidence */}
        <div className="mt-4 flex items-center gap-2">
          <span className="text-sm text-gray-400">Confidence:</span>
          <div className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden">
            <div
              className="h-full bg-cyan-500"
              style={{ width: `${score.confidence * 100}%` }}
            />
          </div>
          <span className="text-sm text-gray-400">
            {(score.confidence * 100).toFixed(0)}%
          </span>
        </div>
      </div>

      {/* Score Factors */}
      <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-white mb-4">
          Score Breakdown
        </h3>
        <div className="space-y-4">
          {score.factors.map((factor, index) => (
            <div key={index} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-white">
                    {factor.name}
                  </span>
                  <span className="text-xs text-gray-400">
                    ({(factor.weight * 100).toFixed(0)}% weight)
                  </span>
                  <span
                    className={`text-xs px-2 py-1 rounded ${
                      factor.impact === "POSITIVE"
                        ? "bg-green-500/20 text-green-400"
                        : factor.impact === "NEGATIVE"
                          ? "bg-red-500/20 text-red-400"
                          : "bg-gray-500/20 text-gray-400"
                    }`}
                  >
                    {factor.impact}
                  </span>
                </div>
                <span
                  className={`text-sm font-semibold ${getScoreColor(factor.score)}`}
                >
                  {factor.score.toFixed(1)}
                </span>
              </div>
              <div className="relative h-2 bg-white/5 rounded-full overflow-hidden">
                <div
                  className={`h-full ${getScoreBgColor(factor.score)}`}
                  style={{ width: `${factor.score}%` }}
                />
              </div>
              <p className="text-xs text-gray-400">{factor.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Scores by Authority */}
      <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-white mb-4">
          Scores by Authority
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Object.entries(score.byAuthority).map(([authority, authScore]) => (
            <div
              key={authority}
              className="p-4 bg-white/5 rounded-lg border border-white/10"
            >
              <p className="text-sm text-gray-400 mb-2">{authority}</p>
              <div className="flex items-center gap-2">
                <div className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${getScoreBgColor(authScore)}`}
                    style={{ width: `${authScore}%` }}
                  />
                </div>
                <span
                  className={`text-sm font-semibold ${getScoreColor(authScore)}`}
                >
                  {authScore.toFixed(1)}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Scores by Category */}
      <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-white mb-4">
          Scores by Category
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Object.entries(score.byCategory).map(([category, catScore]) => (
            <div
              key={category}
              className="p-4 bg-white/5 rounded-lg border border-white/10"
            >
              <p className="text-sm text-gray-400 mb-2">{category}</p>
              <div className="flex items-center gap-2">
                <div className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${getScoreBgColor(catScore)}`}
                    style={{ width: `${catScore}%` }}
                  />
                </div>
                <span
                  className={`text-sm font-semibold ${getScoreColor(catScore)}`}
                >
                  {catScore.toFixed(1)}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Trend */}
      {score.trend && (
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4">
            Trend Analysis
          </h3>
          <div className="flex items-center gap-4">
            <div>
              <p className="text-sm text-gray-400">Current</p>
              <p
                className={`text-2xl font-bold ${getScoreColor(score.trend.current)}`}
              >
                {score.trend.current.toFixed(1)}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-400">Previous</p>
              <p className="text-2xl font-bold text-gray-400">
                {score.trend.previous.toFixed(1)}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-400">Change</p>
              <p
                className={`text-2xl font-bold ${
                  score.trend.change > 0
                    ? "text-green-400"
                    : score.trend.change < 0
                      ? "text-red-400"
                      : "text-gray-400"
                }`}
              >
                {score.trend.change > 0 ? "+" : ""}
                {score.trend.change.toFixed(1)}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-400">Direction</p>
              <span
                className={`px-3 py-1 rounded-lg text-sm font-semibold ${
                  score.trend.direction === "IMPROVING"
                    ? "bg-green-500/20 text-green-400"
                    : score.trend.direction === "DECLINING"
                      ? "bg-red-500/20 text-red-400"
                      : "bg-gray-500/20 text-gray-400"
                }`}
              >
                {score.trend.direction}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
