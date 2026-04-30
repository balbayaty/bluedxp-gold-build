/**
 * ✅ PERMISSION COMPLIANCE CHECKER UI
 *
 * Beautiful compliance interface:
 * - Compliance scoring
 * - Rule checking
 * - Auto-fix capabilities
 * - Compliance reports
 * - Regulatory alignment
 */

"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { userService } from "@/lib/services/user";
import { permissionComplianceChecker } from "@/lib/services/permissions/permissionComplianceChecker";
import type { User } from "@/types/user";
import type { ComplianceReport } from "@/lib/services/permissions/permissionComplianceChecker";

export default function PermissionComplianceCheckerComponent() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [report, setReport] = useState<ComplianceReport | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const data = await userService.getUsers({});
      setUsers(data);
    } catch (error) {
      console.error("Failed to load users:", error);
    }
  };

  const checkCompliance = async (user: User) => {
    setLoading(true);
    try {
      const result = await permissionComplianceChecker.checkCompliance(user);
      setReport(result);
    } catch (error) {
      console.error("Failed to check compliance:", error);
    } finally {
      setLoading(false);
    }
  };

  const autoFix = async () => {
    if (!selectedUser || !report) return;

    setLoading(true);
    try {
      const fixedPermissions =
        await permissionComplianceChecker.autoFixCompliance(selectedUser);
      await userService.updateUserPermissions(
        selectedUser.id,
        fixedPermissions,
      );
      await checkCompliance(selectedUser);
    } catch (error) {
      console.error("Failed to auto-fix:", error);
    } finally {
      setLoading(false);
    }
  };

  const getComplianceColor = (level: string) => {
    const colors = {
      COMPLIANT: "bg-green-500/20 text-green-400",
      PARTIAL: "bg-yellow-500/20 text-yellow-400",
      NON_COMPLIANT: "bg-orange-500/20 text-orange-400",
      CRITICAL: "bg-red-500/20 text-red-400",
    };
    return colors[level as keyof typeof colors] || colors.NON_COMPLIANT;
  };

  const getSeverityColor = (severity: string) => {
    const colors = {
      CRITICAL: "bg-red-500/20 text-red-400",
      HIGH: "bg-orange-500/20 text-orange-400",
      MEDIUM: "bg-yellow-500/20 text-yellow-400",
      LOW: "bg-blue-500/20 text-blue-400",
    };
    return colors[severity as keyof typeof colors] || colors.LOW;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 flex items-center gap-3">
            <i className="ri-shield-check-line text-cyan-400"></i>
            Permission Compliance Checker
          </h1>
          <p className="text-gray-400">
            Ensure permissions comply with security and regulatory requirements
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: User Selection */}
          <div className="lg:col-span-1">
            <div className="bg-white/5 backdrop-blur-xl rounded-xl border border-white/10 p-6">
              <h2 className="text-xl font-bold mb-4">Select User</h2>
              <select
                value={selectedUser?.id || ""}
                onChange={(e) => {
                  const user = users.find((u) => u.id === e.target.value);
                  setSelectedUser(user || null);
                  setReport(null);
                }}
                className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg mb-4"
              >
                <option value="">Select a user...</option>
                {users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.name} ({user.role})
                  </option>
                ))}
              </select>

              {selectedUser && (
                <button
                  onClick={() => checkCompliance(selectedUser)}
                  disabled={loading}
                  className="w-full px-6 py-3 bg-cyan-500 text-white rounded-lg font-semibold hover:bg-cyan-600 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <i className="ri-loader-4-line animate-spin"></i>
                      Checking...
                    </>
                  ) : (
                    <>
                      <i className="ri-shield-check-line"></i>
                      Check Compliance
                    </>
                  )}
                </button>
              )}
            </div>
          </div>

          {/* Right: Compliance Report */}
          <div className="lg:col-span-2">
            {report ? (
              <div className="space-y-6">
                {/* Summary Card */}
                <div className="bg-white/5 backdrop-blur-xl rounded-xl border border-white/10 p-6">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h2 className="text-2xl font-bold mb-2">
                        Compliance Report
                      </h2>
                      <div className="text-sm text-gray-400">
                        {report.userName}
                      </div>
                    </div>
                    <div
                      className={`px-4 py-2 rounded-lg ${getComplianceColor(report.complianceLevel)}`}
                    >
                      {report.complianceLevel}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <div className="text-center p-4 bg-white/5 rounded-lg">
                      <div className="text-3xl font-bold text-green-400 mb-1">
                        {report.overallScore.toFixed(0)}%
                      </div>
                      <div className="text-xs text-gray-400">Score</div>
                    </div>
                    <div className="text-center p-4 bg-white/5 rounded-lg">
                      <div className="text-3xl font-bold text-green-400 mb-1">
                        {report.passed}
                      </div>
                      <div className="text-xs text-gray-400">Passed</div>
                    </div>
                    <div className="text-center p-4 bg-white/5 rounded-lg">
                      <div className="text-3xl font-bold text-red-400 mb-1">
                        {report.failed}
                      </div>
                      <div className="text-xs text-gray-400">Failed</div>
                    </div>
                    <div className="text-center p-4 bg-white/5 rounded-lg">
                      <div className="text-3xl font-bold text-yellow-400 mb-1">
                        {report.critical}
                      </div>
                      <div className="text-xs text-gray-400">Critical</div>
                    </div>
                  </div>

                  {report.recommendations.length > 0 && (
                    <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                      <div className="font-semibold mb-2">Recommendations</div>
                      <ul className="space-y-1 text-sm">
                        {report.recommendations.map((rec, idx) => (
                          <li key={idx}>{rec}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {report.checks.some((c) => c.canAutoFix && !c.passed) && (
                    <button
                      onClick={autoFix}
                      disabled={loading}
                      className="mt-4 w-full px-6 py-3 bg-green-500/20 text-green-400 rounded-lg font-semibold hover:bg-green-500/30 disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      <i className="ri-magic-line"></i>
                      Auto-Fix Issues
                    </button>
                  )}
                </div>

                {/* Compliance Checks */}
                <div className="bg-white/5 backdrop-blur-xl rounded-xl border border-white/10 p-6">
                  <h2 className="text-xl font-bold mb-4">Compliance Checks</h2>
                  <div className="space-y-3">
                    {report.checks.map((check, idx) => (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`p-4 rounded-lg border ${
                          check.passed
                            ? "bg-green-500/10 border-green-500/20"
                            : "bg-red-500/10 border-red-500/20"
                        }`}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <i
                              className={`ri-${check.passed ? "check" : "close"}-circle-line text-lg ${
                                check.passed ? "text-green-400" : "text-red-400"
                              }`}
                            ></i>
                            <span className="font-semibold">
                              {check.ruleName}
                            </span>
                            <span
                              className={`text-xs px-2 py-1 rounded ${getSeverityColor(check.severity)}`}
                            >
                              {check.severity}
                            </span>
                          </div>
                          {check.canAutoFix && !check.passed && (
                            <span className="text-xs text-cyan-400">
                              Auto-fixable
                            </span>
                          )}
                        </div>
                        <p className="text-sm mb-2">{check.message}</p>
                        {check.violations.length > 0 && (
                          <div className="text-xs text-red-400 mb-2">
                            Violations: {check.violations.join(", ")}
                          </div>
                        )}
                        {check.suggestions.length > 0 && (
                          <div className="text-xs text-gray-300">
                            Suggestions: {check.suggestions.join("; ")}
                          </div>
                        )}
                      </motion.div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white/5 backdrop-blur-xl rounded-xl border border-white/10 p-12 text-center">
                <i className="ri-shield-check-line text-6xl text-gray-600 mb-4"></i>
                <p className="text-gray-400">
                  Select a user and check compliance
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
