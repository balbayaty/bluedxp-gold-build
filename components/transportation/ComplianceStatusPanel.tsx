/**
 * Compliance Status Panel
 *
 * UI component for displaying compliance status and violations
 */

"use client";

import { motion } from "framer-motion";
import {
  Shield,
  AlertTriangle,
  CheckCircle,
  Clock,
  FileText,
} from "lucide-react";
import type {
  RegulatoryCompliance,
  HoursOfService,
} from "@/lib/services/transportation";

interface ComplianceStatusPanelProps {
  compliance: RegulatoryCompliance;
  hoursOfService?: HoursOfService | null;
  onResolve?: (regulationId: string) => void;
}

export default function ComplianceStatusPanel({
  compliance,
  hoursOfService,
  onResolve,
}: ComplianceStatusPanelProps) {
  const compliantRegulations = compliance.regulations.filter(
    (r) => r.status === "COMPLIANT",
  );
  const nonCompliantRegulations = compliance.regulations.filter(
    (r) => r.status === "NON_COMPLIANT",
  );
  const pendingRegulations = compliance.regulations.filter(
    (r) => r.status === "PENDING",
  );

  return (
    <div className="space-y-6">
      <h3 className="text-xl font-bold flex items-center gap-2">
        <Shield className="w-5 h-5 text-green-500" />
        Compliance Status
      </h3>

      {/* Overall Status */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`rounded-lg p-6 ${
          compliance.overallStatus === "COMPLIANT"
            ? "bg-gradient-to-br from-green-500 to-green-600 text-white"
            : compliance.overallStatus === "NON_COMPLIANT"
              ? "bg-gradient-to-br from-red-500 to-red-600 text-white"
              : "bg-gradient-to-br from-yellow-500 to-yellow-600 text-white"
        }`}
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm opacity-90">Overall Compliance</p>
            <p className="text-3xl font-bold mt-1">
              {compliance.overallStatus}
            </p>
            <p className="text-sm opacity-90 mt-2">
              {compliance.regulations.length} regulations checked
            </p>
          </div>
          {compliance.overallStatus === "COMPLIANT" ? (
            <CheckCircle className="w-16 h-16 opacity-50" />
          ) : (
            <AlertTriangle className="w-16 h-16 opacity-50" />
          )}
        </div>
      </motion.div>

      {/* Violations */}
      {compliance.violations.length > 0 && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <h4 className="font-semibold text-red-700 dark:text-red-300 mb-3 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" />
            Violations ({compliance.violations.length})
          </h4>
          <ul className="space-y-2">
            {compliance.violations.map((violation, index) => (
              <li key={index} className="flex items-start gap-2 text-sm">
                <span className="text-red-500 mt-1">•</span>
                <span>{violation}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Hours of Service */}
      {hoursOfService && (
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border">
          <h4 className="font-semibold mb-3 flex items-center gap-2">
            <Clock className="w-5 h-5 text-blue-500" />
            Hours of Service
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-xs text-gray-500">Driving</p>
              <p className="text-lg font-semibold">
                {hoursOfService.hours.driving.toFixed(1)}h
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500">On Duty</p>
              <p className="text-lg font-semibold">
                {hoursOfService.hours.onDuty.toFixed(1)}h
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Off Duty</p>
              <p className="text-lg font-semibold">
                {hoursOfService.hours.offDuty.toFixed(1)}h
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Status</p>
              <p
                className={`text-lg font-semibold ${
                  hoursOfService.compliant ? "text-green-600" : "text-red-600"
                }`}
              >
                {hoursOfService.compliant ? "Compliant" : "Violation"}
              </p>
            </div>
          </div>
          {hoursOfService.violations.length > 0 && (
            <div className="mt-4 pt-4 border-t">
              <p className="text-sm font-semibold text-red-600 mb-2">
                Violations:
              </p>
              <ul className="space-y-1">
                {hoursOfService.violations.map((violation, index) => (
                  <li
                    key={index}
                    className="text-sm text-gray-600 dark:text-gray-400"
                  >
                    • {violation.description} ({violation.severity})
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Regulations */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border">
        <h4 className="font-semibold mb-4">Regulations</h4>
        <div className="space-y-3">
          {compliance.regulations.map((regulation, index) => (
            <motion.div
              key={regulation.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className={`p-3 rounded-lg border ${
                regulation.status === "COMPLIANT"
                  ? "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800"
                  : regulation.status === "NON_COMPLIANT"
                    ? "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800"
                    : regulation.status === "PENDING"
                      ? "bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800"
                      : "bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600"
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    {regulation.status === "COMPLIANT" ? (
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    ) : regulation.status === "NON_COMPLIANT" ? (
                      <AlertTriangle className="w-4 h-4 text-red-500" />
                    ) : (
                      <Clock className="w-4 h-4 text-yellow-500" />
                    )}
                    <span className="font-semibold">{regulation.name}</span>
                    <span
                      className={`text-xs px-2 py-1 rounded ${
                        regulation.status === "COMPLIANT"
                          ? "bg-green-500 text-white"
                          : regulation.status === "NON_COMPLIANT"
                            ? "bg-red-500 text-white"
                            : regulation.status === "PENDING"
                              ? "bg-yellow-500 text-white"
                              : "bg-gray-500 text-white"
                      }`}
                    >
                      {regulation.status}
                    </span>
                  </div>
                  {regulation.details && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      {regulation.details}
                    </p>
                  )}
                  <p className="text-xs text-gray-500 mt-2">
                    Checked: {new Date(regulation.checkedAt).toLocaleString()}
                  </p>
                </div>
                {onResolve && regulation.status === "NON_COMPLIANT" && (
                  <button
                    onClick={() => onResolve(regulation.id)}
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

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 text-center">
          <p className="text-2xl font-bold text-green-600 dark:text-green-400">
            {compliantRegulations.length}
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400">Compliant</p>
        </div>
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 text-center">
          <p className="text-2xl font-bold text-red-600 dark:text-red-400">
            {nonCompliantRegulations.length}
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Non-Compliant
          </p>
        </div>
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 text-center">
          <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
            {pendingRegulations.length}
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400">Pending</p>
        </div>
      </div>
    </div>
  );
}
