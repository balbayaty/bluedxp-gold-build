"use client";

import { motion } from "framer-motion";
import { ComplianceViolation } from "@/types/compliance";

interface RecentViolationsProps {
  violations?: ComplianceViolation[];
}

export default function RecentViolations({
  violations,
}: RecentViolationsProps) {
  const violationsData = violations || [];
  const getSeverityStyles = (severity: string) => {
    switch (severity) {
      case "CRITICAL":
        return {
          bg: "bg-red-500/10",
          border: "border-red-500/30",
          badge: "bg-red-500/20 text-red-400 border-red-500/30",
          accent: "border-l-red-500",
        };
      case "HIGH":
        return {
          bg: "bg-orange-500/10",
          border: "border-orange-500/30",
          badge: "bg-orange-500/20 text-orange-400 border-orange-500/30",
          accent: "border-l-orange-500",
        };
      case "MEDIUM":
        return {
          bg: "bg-yellow-500/10",
          border: "border-yellow-500/30",
          badge: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
          accent: "border-l-yellow-500",
        };
      default:
        return {
          bg: "bg-blue-500/10",
          border: "border-blue-500/30",
          badge: "bg-blue-500/20 text-blue-400 border-blue-500/30",
          accent: "border-l-blue-500",
        };
    }
  };

  const getStatusStyles = (status: string) => {
    switch (status) {
      case "RESOLVED":
        return {
          icon: "ri-checkbox-circle-line",
          color: "text-green-400",
          bg: "bg-green-500/20",
        };
      case "APPEALED":
        return {
          icon: "ri-time-line",
          color: "text-blue-400",
          bg: "bg-blue-500/20",
        };
      default:
        return {
          icon: "ri-error-warning-line",
          color: "text-red-400",
          bg: "bg-red-500/20",
        };
    }
  };

  if (violationsData.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-6"
      >
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <i className="ri-alert-line text-cyan-400"></i>
          Recent Violations
        </h2>
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
            <i className="ri-checkbox-circle-line text-3xl text-green-400"></i>
          </div>
          <p className="text-[#9ca3af]">No violations detected</p>
          <p className="text-xs text-[#6b7280] mt-1">
            All compliance requirements are being met
          </p>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-6"
    >
      <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
        <i className="ri-alert-line text-cyan-400"></i>
        Recent Violations
        <span className="ml-auto text-sm font-normal text-[#9ca3af]">
          {violationsData.length} total
        </span>
      </h2>
      <div className="space-y-3">
        {violationsData.map((violation, index) => {
          const severity = getSeverityStyles(violation.severity);
          const status = getStatusStyles(violation.status);

          return (
            <motion.div
              key={violation.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.05 * index }}
              className={`p-4 rounded-lg ${severity.bg} border ${severity.border} border-l-4 ${severity.accent} hover:bg-white/5 transition-all`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <span className={`p-1 rounded ${status.bg}`}>
                      <i className={`${status.icon} ${status.color}`}></i>
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded text-xs font-medium border ${severity.badge}`}
                    >
                      {violation.severity}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded text-xs font-medium ${
                        violation.status === "RESOLVED"
                          ? "bg-green-500/20 text-green-400"
                          : violation.status === "APPEALED"
                            ? "bg-blue-500/20 text-blue-400"
                            : "bg-gray-500/20 text-gray-400"
                      }`}
                    >
                      {violation.status}
                    </span>
                  </div>
                  <p className="text-sm font-medium text-white mb-2">
                    {violation.description}
                  </p>
                  <div className="flex flex-wrap gap-4 text-xs text-[#9ca3af]">
                    <span className="flex items-center gap-1">
                      <i className="ri-calendar-line"></i>
                      Detected:{" "}
                      {new Date(violation.detectedAt).toLocaleString()}
                    </span>
                    {violation.resolvedAt && (
                      <span className="flex items-center gap-1 text-green-400">
                        <i className="ri-checkbox-circle-line"></i>
                        Resolved:{" "}
                        {new Date(violation.resolvedAt).toLocaleString()}
                      </span>
                    )}
                  </div>
                  {violation.penalty && (
                    <div className="mt-2 flex items-center gap-2">
                      <span className="px-2 py-1 bg-red-500/20 text-red-400 rounded text-xs font-medium border border-red-500/30">
                        <i className="ri-money-dollar-circle-line mr-1"></i>
                        Penalty: {violation.penalty.amount.toLocaleString()}{" "}
                        {violation.penalty.currency}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}
