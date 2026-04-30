/**
 * Proposal Compliance Status Component
 * Displays compliance check/validation status with detailed breakdown
 */

"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";

// ============================================================================
// TYPES
// ============================================================================

interface ComplianceCheck {
  proposalId: string;
  compliant: boolean;
  complianceScore: number;
  requirements: Array<{
    requirementId: string;
    requirementCode: string;
    requirementTitle: string;
    compliant: boolean;
    severity: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
    violations: string[];
    recommendations: string[];
  }>;
  missingDocuments: string[];
  missingCertifications: string[];
  regulatoryGaps: string[];
  recommendations: string[];
  checkedAt: string;
}

interface ComplianceValidation {
  proposalId: string;
  validationStatus:
    | "COMPLIANT"
    | "PARTIALLY_COMPLIANT"
    | "NON_COMPLIANT"
    | "PENDING";
  overallScore: number;
  criticalIssues: number;
  highPriorityIssues: number;
  mediumPriorityIssues: number;
  lowPriorityIssues: number;
  autoApproved: boolean;
  requiresManualReview: boolean;
  validatedAt: string;
}

interface ProposalComplianceStatusProps {
  proposalId: string;
  className?: string;
  showValidation?: boolean;
}

// ============================================================================
// COMPONENT
// ============================================================================

export default function ProposalComplianceStatus({
  proposalId,
  className = "",
  showValidation = false,
}: ProposalComplianceStatusProps) {
  const [check, setCheck] = useState<ComplianceCheck | null>(null);
  const [validation, setValidation] = useState<ComplianceValidation | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadComplianceData();
  }, [proposalId, showValidation]);

  const loadComplianceData = async () => {
    setLoading(true);
    try {
      // Load compliance check
      const checkRes = await fetch(
        `/api/proposals/${proposalId}/compliance?type=check`,
      );
      if (checkRes.ok) {
        const checkData = await checkRes.json();
        setCheck(checkData);
      }

      // Load validation if requested
      if (showValidation) {
        const validationRes = await fetch(
          `/api/proposals/${proposalId}/compliance?type=validation`,
        );
        if (validationRes.ok) {
          const validationData = await validationRes.json();
          setValidation(validationData);
        }
      }
    } catch (error) {
      console.error("Error loading compliance data:", error);
    } finally {
      setLoading(false);
    }
  };

  const triggerCheck = async () => {
    setRefreshing(true);
    try {
      const res = await fetch(`/api/proposals/${proposalId}/compliance`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "check" }),
      });
      if (res.ok) {
        const data = await res.json();
        setCheck(data);
      }
    } catch (error) {
      console.error("Error triggering compliance check:", error);
    } finally {
      setRefreshing(false);
    }
  };

  const triggerValidation = async () => {
    setRefreshing(true);
    try {
      const res = await fetch(`/api/proposals/${proposalId}/compliance`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "validation" }),
      });
      if (res.ok) {
        const data = await res.json();
        setValidation(data);
      }
    } catch (error) {
      console.error("Error triggering compliance validation:", error);
    } finally {
      setRefreshing(false);
    }
  };

  const getStatusColor = (status: string, score?: number) => {
    if (status === "COMPLIANT" || (score !== undefined && score >= 95)) {
      return "text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800";
    }
    if (
      status === "PARTIALLY_COMPLIANT" ||
      (score !== undefined && score >= 80)
    ) {
      return "text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800";
    }
    if (status === "NON_COMPLIANT" || (score !== undefined && score < 80)) {
      return "text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800";
    }
    return "text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600";
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "CRITICAL":
        return "text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20";
      case "HIGH":
        return "text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/20";
      case "MEDIUM":
        return "text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/20";
      case "LOW":
        return "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20";
      default:
        return "text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-700";
    }
  };

  if (loading) {
    return (
      <div
        className={`bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 ${className}`}
      >
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 ${className}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Compliance Status
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Regulatory compliance check and validation
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={triggerCheck}
            disabled={refreshing}
            className="px-3 py-1.5 text-sm font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 disabled:opacity-50"
          >
            {refreshing ? "Checking..." : "Check Compliance"}
          </button>
          {showValidation && (
            <button
              onClick={triggerValidation}
              disabled={refreshing}
              className="px-3 py-1.5 text-sm font-medium text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/20 rounded-lg hover:bg-purple-100 dark:hover:bg-purple-900/30 disabled:opacity-50"
            >
              Validate
            </button>
          )}
        </div>
      </div>

      {/* Validation Status (if available) */}
      {validation && (
        <div
          className={`mb-6 p-4 rounded-lg border ${getStatusColor(validation.validationStatus, validation.overallScore)}`}
        >
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-sm font-medium mb-1">Validation Status</p>
              <p className="text-2xl font-bold">
                {validation.validationStatus}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm font-medium mb-1">Overall Score</p>
              <p className="text-2xl font-bold">{validation.overallScore}%</p>
            </div>
          </div>
          <div className="grid grid-cols-4 gap-4 mt-4">
            <div>
              <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                Critical
              </p>
              <p className="text-lg font-semibold text-red-600 dark:text-red-400">
                {validation.criticalIssues}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                High
              </p>
              <p className="text-lg font-semibold text-orange-600 dark:text-orange-400">
                {validation.highPriorityIssues}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                Medium
              </p>
              <p className="text-lg font-semibold text-yellow-600 dark:text-yellow-400">
                {validation.mediumPriorityIssues}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                Low
              </p>
              <p className="text-lg font-semibold text-blue-600 dark:text-blue-400">
                {validation.lowPriorityIssues}
              </p>
            </div>
          </div>
          {validation.autoApproved && (
            <div className="mt-3 p-2 bg-green-100 dark:bg-green-900/30 rounded text-sm text-green-700 dark:text-green-300">
              ✓ Auto-approved (no manual review required)
            </div>
          )}
          {validation.requiresManualReview && (
            <div className="mt-3 p-2 bg-amber-100 dark:bg-amber-900/30 rounded text-sm text-amber-700 dark:text-amber-300">
              ⚠ Manual review required
            </div>
          )}
        </div>
      )}

      {/* Compliance Check Status */}
      {check ? (
        <div className="space-y-4">
          {/* Overall Status */}
          <div
            className={`p-4 rounded-lg border ${getStatusColor("", check.complianceScore)}`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium mb-1">Compliance Score</p>
                <p className="text-3xl font-bold">{check.complianceScore}%</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium mb-1">Status</p>
                <p
                  className={`text-lg font-semibold ${check.compliant ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}
                >
                  {check.compliant ? "✓ Compliant" : "✗ Non-Compliant"}
                </p>
              </div>
            </div>
          </div>

          {/* Requirements */}
          {check.requirements.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
                Requirements ({check.requirements.length})
              </h4>
              <div className="space-y-2">
                {check.requirements.map((req, index) => (
                  <motion.div
                    key={req.requirementId}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className={`p-3 rounded-lg border ${
                      req.compliant
                        ? "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800"
                        : "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800"
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span
                            className={`px-2 py-0.5 rounded text-xs font-medium ${getSeverityColor(req.severity)}`}
                          >
                            {req.severity}
                          </span>
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {req.requirementCode}
                          </span>
                        </div>
                        <p className="font-medium text-gray-900 dark:text-white text-sm">
                          {req.requirementTitle}
                        </p>
                        {!req.compliant && req.violations.length > 0 && (
                          <ul className="mt-2 text-xs text-red-600 dark:text-red-400 space-y-1">
                            {req.violations.map((violation, i) => (
                              <li key={i}>• {violation}</li>
                            ))}
                          </ul>
                        )}
                        {!req.compliant && req.recommendations.length > 0 && (
                          <div className="mt-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded text-xs">
                            <p className="font-medium text-blue-900 dark:text-blue-200 mb-1">
                              Recommendations:
                            </p>
                            <ul className="space-y-1 text-blue-800 dark:text-blue-300">
                              {req.recommendations.map((rec, i) => (
                                <li key={i}>• {rec}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                      <div className="ml-4">
                        {req.compliant ? (
                          <i className="ri-checkbox-circle-fill text-green-600 dark:text-green-400 text-xl" />
                        ) : (
                          <i className="ri-close-circle-fill text-red-600 dark:text-red-400 text-xl" />
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {/* Missing Items */}
          {(check.missingDocuments.length > 0 ||
            check.missingCertifications.length > 0) && (
            <div>
              <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
                Missing Items
              </h4>
              {check.missingDocuments.length > 0 && (
                <div className="mb-2 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
                  <p className="text-sm font-medium text-amber-900 dark:text-amber-200 mb-1">
                    Missing Documents:
                  </p>
                  <ul className="text-xs text-amber-800 dark:text-amber-300 space-y-1">
                    {check.missingDocuments.map((doc, i) => (
                      <li key={i}>• {doc}</li>
                    ))}
                  </ul>
                </div>
              )}
              {check.missingCertifications.length > 0 && (
                <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
                  <p className="text-sm font-medium text-amber-900 dark:text-amber-200 mb-1">
                    Missing Certifications:
                  </p>
                  <ul className="text-xs text-amber-800 dark:text-amber-300 space-y-1">
                    {check.missingCertifications.map((cert, i) => (
                      <li key={i}>• {cert}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Recommendations */}
          {check.recommendations.length > 0 && (
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-200 mb-2">
                General Recommendations
              </h4>
              <ul className="text-sm text-blue-800 dark:text-blue-300 space-y-1">
                {check.recommendations.map((rec, i) => (
                  <li key={i}>• {rec}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-8">
          <i className="ri-file-shield-line text-4xl text-gray-400 dark:text-gray-600 mb-3" />
          <p className="text-sm text-gray-500 dark:text-gray-400">
            No compliance check performed yet
          </p>
          <button
            onClick={triggerCheck}
            className="mt-4 px-4 py-2 text-sm font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30"
          >
            Run Compliance Check
          </button>
        </div>
      )}
    </div>
  );
}
