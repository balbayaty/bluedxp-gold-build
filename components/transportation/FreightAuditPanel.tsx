/**
 * Freight Audit Panel
 *
 * UI component for displaying freight audit results
 */

"use client";

import { motion } from "framer-motion";
import {
  FileCheck,
  AlertTriangle,
  CheckCircle,
  XCircle,
  DollarSign,
} from "lucide-react";
import type {
  FreightAuditResult,
  AuditIssue,
} from "@/lib/services/transportation";

interface FreightAuditPanelProps {
  auditResult: FreightAuditResult;
  onResolve?: (issueId: string) => void;
}

export default function FreightAuditPanel({
  auditResult,
  onResolve,
}: FreightAuditPanelProps) {
  const criticalIssues = auditResult.issues.filter(
    (i) => i.severity === "CRITICAL",
  );
  const highIssues = auditResult.issues.filter((i) => i.severity === "HIGH");
  const mediumIssues = auditResult.issues.filter(
    (i) => i.severity === "MEDIUM",
  );
  const lowIssues = auditResult.issues.filter((i) => i.severity === "LOW");

  return (
    <div className="space-y-6">
      <h3 className="text-xl font-bold flex items-center gap-2">
        <FileCheck className="w-5 h-5 text-blue-500" />
        Freight Audit Results
      </h3>

      {/* Status Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`rounded-lg p-6 ${
          auditResult.valid
            ? "bg-gradient-to-br from-green-500 to-green-600 text-white"
            : "bg-gradient-to-br from-red-500 to-red-600 text-white"
        }`}
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm opacity-90">Audit Status</p>
            <p className="text-3xl font-bold mt-1">
              {auditResult.valid ? "APPROVED" : "REJECTED"}
            </p>
            <p className="text-sm opacity-90 mt-2">
              Confidence: {auditResult.confidence}%
            </p>
          </div>
          {auditResult.valid ? (
            <CheckCircle className="w-16 h-16 opacity-50" />
          ) : (
            <XCircle className="w-16 h-16 opacity-50" />
          )}
        </div>

        {auditResult.savings && auditResult.savings > 0 && (
          <div className="mt-4 pt-4 border-t border-white/20">
            <div className="flex items-center gap-2">
              <DollarSign className="w-5 h-5" />
              <div>
                <p className="text-sm opacity-90">Potential Savings</p>
                <p className="text-2xl font-bold">
                  {auditResult.savings.toFixed(2)} USD
                </p>
              </div>
            </div>
          </div>
        )}
      </motion.div>

      {/* Issues Summary */}
      {auditResult.issues.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {criticalIssues.length > 0 && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="w-5 h-5 text-red-500" />
                <span className="font-semibold text-red-700 dark:text-red-300">
                  Critical
                </span>
              </div>
              <p className="text-3xl font-bold text-red-600 dark:text-red-400">
                {criticalIssues.length}
              </p>
            </div>
          )}

          {highIssues.length > 0 && (
            <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="w-5 h-5 text-orange-500" />
                <span className="font-semibold text-orange-700 dark:text-orange-300">
                  High
                </span>
              </div>
              <p className="text-3xl font-bold text-orange-600 dark:text-orange-400">
                {highIssues.length}
              </p>
            </div>
          )}

          {mediumIssues.length > 0 && (
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="w-5 h-5 text-yellow-500" />
                <span className="font-semibold text-yellow-700 dark:text-yellow-300">
                  Medium
                </span>
              </div>
              <p className="text-3xl font-bold text-yellow-600 dark:text-yellow-400">
                {mediumIssues.length}
              </p>
            </div>
          )}

          {lowIssues.length > 0 && (
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="w-5 h-5 text-blue-500" />
                <span className="font-semibold text-blue-700 dark:text-blue-300">
                  Low
                </span>
              </div>
              <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                {lowIssues.length}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Issues List */}
      {auditResult.issues.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border">
          <h4 className="font-semibold mb-4">
            Issues Found ({auditResult.issues.length})
          </h4>
          <div className="space-y-3">
            {auditResult.issues.map((issue, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className={`p-4 rounded-lg border ${
                  issue.severity === "CRITICAL"
                    ? "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800"
                    : issue.severity === "HIGH"
                      ? "bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800"
                      : issue.severity === "MEDIUM"
                        ? "bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800"
                        : "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span
                        className={`text-xs px-2 py-1 rounded font-semibold ${
                          issue.severity === "CRITICAL"
                            ? "bg-red-500 text-white"
                            : issue.severity === "HIGH"
                              ? "bg-orange-500 text-white"
                              : issue.severity === "MEDIUM"
                                ? "bg-yellow-500 text-white"
                                : "bg-blue-500 text-white"
                        }`}
                      >
                        {issue.severity}
                      </span>
                      <span className="text-xs text-gray-500">
                        {issue.type.replace(/_/g, " ")}
                      </span>
                    </div>
                    <p className="font-medium mb-1">{issue.description}</p>
                    {issue.expectedValue !== undefined &&
                      issue.actualValue !== undefined && (
                        <div className="grid grid-cols-2 gap-4 mt-2 text-sm">
                          <div>
                            <p className="text-gray-500">Expected</p>
                            <p className="font-semibold">
                              {issue.expectedValue}
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-500">Actual</p>
                            <p className="font-semibold">{issue.actualValue}</p>
                          </div>
                          {issue.difference !== undefined && (
                            <div className="col-span-2">
                              <p className="text-gray-500">Difference</p>
                              <p
                                className={`font-semibold ${
                                  issue.difference > 0
                                    ? "text-red-600"
                                    : "text-green-600"
                                }`}
                              >
                                {issue.difference > 0 ? "+" : ""}
                                {issue.difference.toFixed(2)}
                              </p>
                            </div>
                          )}
                        </div>
                      )}
                    {issue.evidence && issue.evidence.length > 0 && (
                      <div className="mt-2">
                        <p className="text-xs text-gray-500 mb-1">Evidence:</p>
                        <div className="flex flex-wrap gap-1">
                          {issue.evidence.map((ev, i) => (
                            <span
                              key={i}
                              className="text-xs bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded"
                            >
                              {ev}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  {onResolve && (
                    <button
                      onClick={() => onResolve(issue.type)}
                      className="ml-4 px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 transition text-sm"
                    >
                      Resolve
                    </button>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Recommendations */}
      {auditResult.recommendations &&
        auditResult.recommendations.length > 0 && (
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <h4 className="font-semibold mb-3">Recommendations</h4>
            <ul className="space-y-2">
              {auditResult.recommendations.map((rec, index) => (
                <li key={index} className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
                  <span className="text-sm">{rec}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

      {/* Audit Info */}
      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-gray-500">Audit Date</p>
            <p className="font-semibold">
              {new Date(auditResult.auditDate).toLocaleString()}
            </p>
          </div>
          <div>
            <p className="text-gray-500">Audited By</p>
            <p className="font-semibold">{auditResult.auditedBy}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
