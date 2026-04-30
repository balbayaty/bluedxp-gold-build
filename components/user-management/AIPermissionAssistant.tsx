/**
 * 🚀 AI PERMISSION ASSISTANT
 *
 * AI-powered permission recommendations and optimization
 *
 * BlueDXP Platform - Vision 2040 Aligned • 5IR Human-Centric AI
 */

"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiSparkles,
  FiCheckCircle,
  FiAlertTriangle,
  FiTrendingUp,
  FiShield,
  FiTarget,
} from "react-icons/fi";
// Import will be done via API calls
import type {
  PermissionRecommendation,
  RiskAssessment,
  ComplianceCheck,
} from "@/lib/services/user/aiPermissionService";

interface AIPermissionAssistantProps {
  userId: string;
  onApplyRecommendation?: (recommendation: PermissionRecommendation) => void;
  className?: string;
}

export default function AIPermissionAssistant({
  userId,
  onApplyRecommendation,
  className = "",
}: AIPermissionAssistantProps) {
  const [recommendations, setRecommendations] = useState<
    PermissionRecommendation[]
  >([]);
  const [riskAssessment, setRiskAssessment] = useState<RiskAssessment | null>(
    null,
  );
  const [complianceCheck, setComplianceCheck] =
    useState<ComplianceCheck | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<
    "recommendations" | "risk" | "compliance"
  >("recommendations");

  useEffect(() => {
    loadAIInsights();
  }, [userId]);

  const loadAIInsights = async () => {
    try {
      setLoading(true);

      const [recs, risk, compliance] = await Promise.all([
        fetch(`/api/users/${userId}/ai/recommendations`).then((r) => r.json()),
        fetch(`/api/users/${userId}/ai/risk`).then((r) => r.json()),
        fetch(`/api/users/${userId}/ai/compliance?type=SOC2`).then((r) =>
          r.json(),
        ),
      ]);

      setRecommendations(recs.data || []);
      setRiskAssessment(risk.data || null);
      setComplianceCheck(compliance.data || null);
    } catch (error) {
      console.error("Error loading AI insights:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleApplyRecommendation = async (
    recommendation: PermissionRecommendation,
  ) => {
    try {
      await fetch(`/api/users/${userId}/permissions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ permission: recommendation.permission }),
      });

      if (onApplyRecommendation) {
        onApplyRecommendation(recommendation);
      }

      // Reload recommendations
      await loadAIInsights();
    } catch (error) {
      console.error("Error applying recommendation:", error);
    }
  };

  if (loading) {
    return (
      <div className={`flex items-center justify-center p-8 ${className}`}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
        <FiSparkles className="w-6 h-6 text-blue-600 dark:text-blue-400" />
        <div>
          <h3 className="font-semibold text-gray-900 dark:text-gray-100">
            AI Permission Assistant
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Intelligent recommendations powered by AI
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={() => setActiveTab("recommendations")}
          className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${
            activeTab === "recommendations"
              ? "border-blue-600 text-blue-600 dark:text-blue-400"
              : "border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
          }`}
        >
          Recommendations ({recommendations.length})
        </button>
        <button
          onClick={() => setActiveTab("risk")}
          className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${
            activeTab === "risk"
              ? "border-blue-600 text-blue-600 dark:text-blue-400"
              : "border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
          }`}
        >
          Risk Assessment
          {riskAssessment && (
            <span
              className={`ml-2 px-2 py-0.5 text-xs rounded ${
                riskAssessment.riskLevel === "critical"
                  ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                  : riskAssessment.riskLevel === "high"
                    ? "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200"
                    : riskAssessment.riskLevel === "medium"
                      ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                      : "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
              }`}
            >
              {riskAssessment.riskLevel.toUpperCase()}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab("compliance")}
          className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${
            activeTab === "compliance"
              ? "border-blue-600 text-blue-600 dark:text-blue-400"
              : "border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
          }`}
        >
          Compliance
          {complianceCheck && (
            <span
              className={`ml-2 px-2 py-0.5 text-xs rounded ${
                complianceCheck.compliant
                  ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                  : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
              }`}
            >
              {complianceCheck.compliant ? "COMPLIANT" : "NON-COMPLIANT"}
            </span>
          )}
        </button>
      </div>

      {/* Content */}
      <AnimatePresence mode="wait">
        {activeTab === "recommendations" && (
          <motion.div
            key="recommendations"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-3"
          >
            {recommendations.length === 0 ? (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                No recommendations at this time
              </div>
            ) : (
              recommendations.map((rec, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <FiTarget className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                        <span className="font-medium text-gray-900 dark:text-gray-100">
                          {rec.permission.module.toUpperCase()} /{" "}
                          {rec.permission.action}
                        </span>
                        <span
                          className={`px-2 py-0.5 text-xs rounded ${
                            rec.impact === "high"
                              ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                              : rec.impact === "medium"
                                ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                                : "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                          }`}
                        >
                          {rec.impact.toUpperCase()}
                        </span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {Math.round(rec.confidence * 100)}% confidence
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                        {rec.reason}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                        <span>Based on: {rec.basedOn.replace("_", " ")}</span>
                        <span>•</span>
                        <span>Scope: {rec.permission.scope}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => handleApplyRecommendation(rec)}
                      className="ml-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                    >
                      Apply
                    </button>
                  </div>
                </motion.div>
              ))
            )}
          </motion.div>
        )}

        {activeTab === "risk" && riskAssessment && (
          <motion.div
            key="risk"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-4"
          >
            <div className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-semibold text-gray-900 dark:text-gray-100">
                  Risk Score
                </h4>
                <div
                  className={`text-3xl font-bold ${
                    riskAssessment.riskLevel === "critical"
                      ? "text-red-600 dark:text-red-400"
                      : riskAssessment.riskLevel === "high"
                        ? "text-orange-600 dark:text-orange-400"
                        : riskAssessment.riskLevel === "medium"
                          ? "text-yellow-600 dark:text-yellow-400"
                          : "text-green-600 dark:text-green-400"
                  }`}
                >
                  {riskAssessment.riskScore}/100
                </div>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                <div
                  className={`h-3 rounded-full transition-all ${
                    riskAssessment.riskLevel === "critical"
                      ? "bg-red-600"
                      : riskAssessment.riskLevel === "high"
                        ? "bg-orange-600"
                        : riskAssessment.riskLevel === "medium"
                          ? "bg-yellow-600"
                          : "bg-green-600"
                  }`}
                  style={{ width: `${riskAssessment.riskScore}%` }}
                />
              </div>
            </div>

            {riskAssessment.issues.length > 0 && (
              <div className="space-y-3">
                <h4 className="font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                  <FiAlertTriangle className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                  Issues Found
                </h4>
                {riskAssessment.issues.map((issue, index) => (
                  <div
                    key={index}
                    className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <span
                        className={`px-2 py-1 text-xs rounded font-medium ${
                          issue.severity === "critical"
                            ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                            : issue.severity === "high"
                              ? "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200"
                              : issue.severity === "medium"
                                ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                                : "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                        }`}
                      >
                        {issue.severity.toUpperCase()}
                      </span>
                    </div>
                    <p className="text-sm text-gray-900 dark:text-gray-100 mb-2">
                      {issue.description}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {issue.recommendation}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {activeTab === "compliance" && complianceCheck && (
          <motion.div
            key="compliance"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-4"
          >
            <div
              className={`p-4 rounded-lg border ${
                complianceCheck.compliant
                  ? "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800"
                  : "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800"
              }`}
            >
              <div className="flex items-center gap-3">
                {complianceCheck.compliant ? (
                  <FiCheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
                ) : (
                  <FiAlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
                )}
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-gray-100">
                    {complianceCheck.compliant ? "Compliant" : "Non-Compliant"}
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {complianceCheck.violations.length} violations found
                  </p>
                </div>
              </div>
            </div>

            {complianceCheck.violations.length > 0 && (
              <div className="space-y-3">
                <h4 className="font-semibold text-gray-900 dark:text-gray-100">
                  Violations
                </h4>
                {complianceCheck.violations.map((violation, index) => (
                  <div
                    key={index}
                    className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <span className="font-medium text-gray-900 dark:text-gray-100">
                        {violation.rule}
                      </span>
                      <span
                        className={`px-2 py-1 text-xs rounded ${
                          violation.severity === "high"
                            ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                            : violation.severity === "medium"
                              ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                              : "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                        }`}
                      >
                        {violation.severity.toUpperCase()}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                      {violation.description}
                    </p>
                    <p className="text-sm text-blue-600 dark:text-blue-400">
                      <strong>Fix:</strong> {violation.fix}
                    </p>
                  </div>
                ))}
              </div>
            )}

            {complianceCheck.recommendations.length > 0 && (
              <div className="space-y-3">
                <h4 className="font-semibold text-gray-900 dark:text-gray-100">
                  Recommendations
                </h4>
                {complianceCheck.recommendations.map((rec, index) => (
                  <div
                    key={index}
                    className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800"
                  >
                    <p className="text-sm text-gray-900 dark:text-gray-100">
                      {rec}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
