"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { RiskPrediction } from "@/lib/services/compliance/intelligentComplianceEngine";
import { intelligentComplianceEngine } from "@/lib/services/compliance/intelligentComplianceEngine";
import { complianceService } from "@/lib/services/compliance/complianceService";
import { authorityHierarchyService } from "@/lib/services/compliance/authorityHierarchyService";
import {
  RadialBarChart,
  RadialBar,
  ResponsiveContainer,
  Cell,
  Legend,
} from "recharts";

interface RiskPredictionProps {
  tenantId: string;
}

export default function RiskPrediction({ tenantId }: RiskPredictionProps) {
  const [prediction, setPrediction] = useState<RiskPrediction | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRiskPrediction();
  }, [tenantId]);

  const loadRiskPrediction = async () => {
    try {
      setLoading(true);
      const records = complianceService.getRecordsByTenant(tenantId);
      const allAuthorities = authorityHierarchyService.getAllNodes();
      const regulations = allAuthorities.flatMap((auth) =>
        authorityHierarchyService.getRegulationsByAuthority(auth.id),
      );

      const pred = intelligentComplianceEngine.predictComplianceRisk(
        records,
        regulations,
      );
      setPrediction(pred);
    } catch (error) {
      console.error("Error loading risk prediction:", error);
    } finally {
      setLoading(false);
    }
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case "CRITICAL":
        return {
          bg: "bg-red-500/20",
          border: "border-red-500/50",
          text: "text-red-400",
          fill: "#ef4444",
        };
      case "HIGH":
        return {
          bg: "bg-orange-500/20",
          border: "border-orange-500/50",
          text: "text-orange-400",
          fill: "#f97316",
        };
      case "MEDIUM":
        return {
          bg: "bg-yellow-500/20",
          border: "border-yellow-500/50",
          text: "text-yellow-400",
          fill: "#eab308",
        };
      default:
        return {
          bg: "bg-green-500/20",
          border: "border-green-500/50",
          text: "text-green-400",
          fill: "#22c55e",
        };
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-500"></div>
      </div>
    );
  }

  if (!prediction) {
    return (
      <div className="text-center py-8 text-gray-400">
        <p>No risk prediction available</p>
      </div>
    );
  }

  const riskColor = getRiskColor(prediction.overallRisk);

  const chartData = [
    { name: "Risk Score", value: prediction.riskScore, fill: riskColor.fill },
    {
      name: "Remaining",
      value: 100 - prediction.riskScore,
      fill: "rgba(255,255,255,0.1)",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <i className="ri-alert-line text-cyan-400"></i>
          AI Risk Prediction
        </h3>
        <button
          onClick={loadRiskPrediction}
          className="text-gray-400 hover:text-white transition-colors"
        >
          <i className="ri-refresh-line"></i>
        </button>
      </div>

      {/* Risk Score Visualization */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div
          className={`${riskColor.bg} backdrop-blur-xl border ${riskColor.border} rounded-xl p-6`}
        >
          <div className="text-center">
            <h4 className="text-sm text-gray-400 mb-2">Overall Risk Level</h4>
            <div
              className="text-4xl font-bold mb-2"
              style={{ color: riskColor.fill }}
            >
              {prediction.overallRisk}
            </div>
            <div
              className="text-2xl font-semibold mb-4"
              style={{ color: riskColor.fill }}
            >
              {prediction.riskScore.toFixed(1)}%
            </div>
            <div className="text-xs text-gray-400">
              Confidence: {prediction.confidence}%
            </div>
          </div>
        </div>

        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-6">
          <h4 className="text-sm text-gray-400 mb-4">Risk Score Breakdown</h4>
          <ResponsiveContainer width="100%" height={200}>
            <RadialBarChart
              cx="50%"
              cy="50%"
              innerRadius="60%"
              outerRadius="90%"
              data={chartData}
              startAngle={90}
              endAngle={-270}
            >
              <RadialBar dataKey="value" cornerRadius={10}>
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </RadialBar>
            </RadialBarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Risk Factors */}
      {prediction.riskFactors.length > 0 && (
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-6">
          <h4 className="text-lg font-semibold text-white mb-4">
            Risk Factors
          </h4>
          <div className="space-y-3">
            {prediction.riskFactors.map((factor, index) => {
              const factorColor = getRiskColor(factor.severity);
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={`p-4 rounded-lg border ${factorColor.border} ${factorColor.bg}`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <h5 className={`font-medium ${factorColor.text}`}>
                      {factor.factor}
                    </h5>
                    <span
                      className={`px-2 py-1 rounded text-xs ${factorColor.bg} ${factorColor.text}`}
                    >
                      {factor.severity}
                    </span>
                  </div>
                  <p className="text-sm text-gray-300 mb-2">
                    {factor.description}
                  </p>
                  <div className="flex items-center gap-4 text-xs text-gray-400 mb-2">
                    <span>Impact: {factor.impact}</span>
                    <span>Likelihood: {factor.likelihood}%</span>
                  </div>
                  {factor.mitigationStrategy && (
                    <div className="mt-2 p-2 bg-white/5 rounded text-xs text-gray-300">
                      <strong>Mitigation:</strong> {factor.mitigationStrategy}
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        </div>
      )}

      {/* Predicted Violations */}
      {prediction.predictedViolations.length > 0 && (
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-6">
          <h4 className="text-lg font-semibold text-white mb-4">
            Predicted Violations
          </h4>
          <div className="space-y-3">
            {prediction.predictedViolations.map((violation, index) => {
              const violColor = getRiskColor(violation.severity);
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={`p-4 rounded-lg border ${violColor.border} ${violColor.bg}`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <h5 className={`font-medium ${violColor.text}`}>
                      {violation.type}
                    </h5>
                    <span className="text-xs text-gray-400">
                      Likelihood: {violation.likelihood}%
                    </span>
                  </div>
                  <p className="text-sm text-gray-300 mb-2">
                    {violation.description}
                  </p>
                  <div className="text-xs text-gray-400 mb-2">
                    Timeframe: {violation.timeframe}
                  </div>
                  {violation.preventionActions.length > 0 && (
                    <div className="mt-2">
                      <p className="text-xs text-gray-400 mb-1">
                        Prevention Actions:
                      </p>
                      <ul className="space-y-1">
                        {violation.preventionActions.map((action, idx) => (
                          <li
                            key={idx}
                            className="text-xs text-gray-300 flex items-center gap-2"
                          >
                            <i className="ri-checkbox-blank-circle-line text-cyan-400"></i>
                            {action}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        </div>
      )}

      {/* Recommendations */}
      {prediction.recommendations.length > 0 && (
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-6">
          <h4 className="text-lg font-semibold text-white mb-4">
            Risk-Based Recommendations
          </h4>
          <ul className="space-y-2">
            {prediction.recommendations.map((rec, index) => (
              <li
                key={index}
                className="text-sm text-gray-300 flex items-start gap-2"
              >
                <i className="ri-arrow-right-s-line text-cyan-400 mt-1"></i>
                {rec}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
