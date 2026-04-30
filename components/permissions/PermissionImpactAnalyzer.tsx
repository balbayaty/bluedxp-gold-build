/**
 * 🔍 PERMISSION IMPACT ANALYZER UI
 *
 * Beautiful visualization of permission change impacts:
 * - Before/after preview
 * - Risk assessment
 * - Cascade effects
 * - Rollback plan
 * - Interactive impact tree
 */

"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { userService } from "@/lib/services/user";
import { permissionImpactAnalyzer } from "@/lib/services/permissions/permissionImpactAnalyzer";
import type { User, HierarchicalPermission } from "@/types/user";
import type {
  ImpactAnalysis,
  PermissionImpact,
} from "@/lib/services/permissions/permissionImpactAnalyzer";

export default function PermissionImpactAnalyzerComponent() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [proposedChanges, setProposedChanges] = useState<
    HierarchicalPermission[]
  >([]);
  const [changeType, setChangeType] = useState<
    "GRANT" | "REVOKE" | "MODIFY" | "BULK"
  >("GRANT");
  const [analysis, setAnalysis] = useState<ImpactAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

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

  const analyzeImpact = async () => {
    if (!selectedUser || proposedChanges.length === 0) return;

    setLoading(true);
    try {
      const result = await permissionImpactAnalyzer.analyzeImpact(
        selectedUser,
        proposedChanges,
        changeType,
      );
      setAnalysis(result);
      setShowPreview(true);
    } catch (error) {
      console.error("Failed to analyze impact:", error);
    } finally {
      setLoading(false);
    }
  };

  const addPermission = () => {
    setProposedChanges([
      ...proposedChanges,
      {
        moduleId: "wms" as any,
        moduleAccess: "full",
        actions: ["read", "write"],
        scope: "TENANT",
      },
    ]);
  };

  const getSeverityColor = (severity: string) => {
    const colors = {
      CRITICAL: "bg-red-500/20 text-red-400 border-red-500/30",
      HIGH: "bg-orange-500/20 text-orange-400 border-orange-500/30",
      MEDIUM: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
      LOW: "bg-green-500/20 text-green-400 border-green-500/30",
    };
    return colors[severity as keyof typeof colors] || colors.LOW;
  };

  const getImpactTypeIcon = (type: string) => {
    const icons = {
      DIRECT: "ri-focus-3-line",
      CASCADE: "ri-node-tree",
      CONFLICT: "ri-error-warning-line",
      DEPENDENCY: "ri-links-line",
      BREAKING: "ri-alert-line",
    };
    return icons[type as keyof typeof icons] || "ri-information-line";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 flex items-center gap-3">
            <i className="ri-search-eye-line text-cyan-400"></i>
            Permission Impact Analyzer
          </h1>
          <p className="text-gray-400">
            Analyze the impact of permission changes before applying them
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Configuration */}
          <div className="lg:col-span-1 space-y-6">
            {/* User Selection */}
            <div className="bg-white/5 backdrop-blur-xl rounded-xl border border-white/10 p-6">
              <h2 className="text-xl font-bold mb-4">Select User</h2>
              <select
                value={selectedUser?.id || ""}
                onChange={(e) => {
                  const user = users.find((u) => u.id === e.target.value);
                  setSelectedUser(user || null);
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
                <div className="p-4 bg-white/5 rounded-lg">
                  <div className="text-sm text-gray-400 mb-1">
                    Current Permissions
                  </div>
                  <div className="text-lg font-semibold">
                    {(selectedUser.hierarchicalPermissions || []).length}
                  </div>
                </div>
              )}
            </div>

            {/* Change Type */}
            <div className="bg-white/5 backdrop-blur-xl rounded-xl border border-white/10 p-6">
              <h2 className="text-xl font-bold mb-4">Change Type</h2>
              <div className="space-y-2">
                {(["GRANT", "REVOKE", "MODIFY", "BULK"] as const).map(
                  (type) => (
                    <button
                      key={type}
                      onClick={() => setChangeType(type)}
                      className={`w-full px-4 py-2 rounded-lg text-left transition-all ${
                        changeType === type
                          ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30"
                          : "bg-white/5 hover:bg-white/10 border border-transparent"
                      }`}
                    >
                      {type}
                    </button>
                  ),
                )}
              </div>
            </div>

            {/* Proposed Changes */}
            <div className="bg-white/5 backdrop-blur-xl rounded-xl border border-white/10 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold">Proposed Changes</h2>
                <button
                  onClick={addPermission}
                  className="px-3 py-1 text-sm bg-cyan-500/20 text-cyan-400 rounded-lg hover:bg-cyan-500/30"
                >
                  <i className="ri-add-line mr-1"></i>
                  Add
                </button>
              </div>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {proposedChanges.length === 0 ? (
                  <div className="text-center py-8 text-gray-400">
                    <i className="ri-inbox-line text-3xl mb-2"></i>
                    <p className="text-sm">No changes proposed</p>
                  </div>
                ) : (
                  proposedChanges.map((perm, idx) => (
                    <div
                      key={idx}
                      className="p-3 bg-white/5 rounded-lg text-sm font-mono"
                    >
                      {perm.moduleId}
                      {perm.featureId && ` → ${perm.featureId.split(".")[1]}`}
                      {perm.tabId && ` → ${perm.tabId.split(".").pop()}`}
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Analyze Button */}
            <button
              onClick={analyzeImpact}
              disabled={
                !selectedUser || proposedChanges.length === 0 || loading
              }
              className="w-full px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-lg font-semibold hover:from-cyan-600 hover:to-blue-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <i className="ri-loader-4-line animate-spin"></i>
                  Analyzing...
                </>
              ) : (
                <>
                  <i className="ri-search-eye-line"></i>
                  Analyze Impact
                </>
              )}
            </button>
          </div>

          {/* Right: Analysis Results */}
          <div className="lg:col-span-2">
            {analysis ? (
              <div className="space-y-6">
                {/* Summary Card */}
                <div className="bg-white/5 backdrop-blur-xl rounded-xl border border-white/10 p-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="text-center p-4 bg-white/5 rounded-lg">
                      <div className="text-3xl font-bold text-cyan-400 mb-1">
                        {analysis.totalAffectedUsers}
                      </div>
                      <div className="text-sm text-gray-400">
                        Affected Users
                      </div>
                    </div>
                    <div className="text-center p-4 bg-white/5 rounded-lg">
                      <div className="text-3xl font-bold text-yellow-400 mb-1">
                        {analysis.totalRiskScore}
                      </div>
                      <div className="text-sm text-gray-400">Risk Score</div>
                    </div>
                    <div className="text-center p-4 bg-white/5 rounded-lg">
                      <div
                        className={`text-3xl font-bold mb-1 ${
                          analysis.canProceed
                            ? "text-green-400"
                            : "text-red-400"
                        }`}
                      >
                        {analysis.canProceed ? "✓" : "✗"}
                      </div>
                      <div className="text-sm text-gray-400">Can Proceed</div>
                    </div>
                  </div>

                  {analysis.warnings.length > 0 && (
                    <div className="mb-4 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                      {analysis.warnings.map((warning, idx) => (
                        <div key={idx} className="text-yellow-400 text-sm mb-1">
                          {warning}
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="text-sm text-gray-300">
                    <strong>Estimated Impact:</strong>{" "}
                    {analysis.estimatedImpact}
                  </div>
                </div>

                {/* Impacts List */}
                <div className="bg-white/5 backdrop-blur-xl rounded-xl border border-white/10 p-6">
                  <h2 className="text-xl font-bold mb-4">Impact Details</h2>
                  <div className="space-y-4">
                    {analysis.impacts.map((impact, idx) => (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`p-4 rounded-lg border ${getSeverityColor(impact.severity)}`}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <i
                              className={`${getImpactTypeIcon(impact.type)} text-lg`}
                            ></i>
                            <span className="font-semibold">{impact.type}</span>
                            <span className="text-xs px-2 py-1 rounded-full bg-white/10">
                              {impact.severity}
                            </span>
                          </div>
                          <div className="text-sm">
                            Risk: {impact.riskScore}%
                          </div>
                        </div>
                        <p className="text-sm mb-3">{impact.description}</p>
                        <div className="text-xs text-gray-400 mb-3">
                          Affected: {impact.affectedUsers} user(s),{" "}
                          {impact.affectedModules.length} module(s)
                        </div>
                        {impact.recommendations.length > 0 && (
                          <div className="mt-3 pt-3 border-t border-white/10">
                            <div className="text-xs font-semibold mb-2">
                              Recommendations:
                            </div>
                            <ul className="text-xs space-y-1">
                              {impact.recommendations.map((rec, recIdx) => (
                                <li
                                  key={recIdx}
                                  className="flex items-start gap-2"
                                >
                                  <i className="ri-arrow-right-s-line mt-0.5"></i>
                                  {rec}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </motion.div>
                    ))}
                  </div>
                </div>

                {/* Rollback Plan */}
                {analysis.rollbackPlan && (
                  <div className="bg-white/5 backdrop-blur-xl rounded-xl border border-white/10 p-6">
                    <h2 className="text-xl font-bold mb-4">Rollback Plan</h2>
                    <div className="space-y-2">
                      {analysis.rollbackPlan.steps.map((step, idx) => (
                        <div
                          key={idx}
                          className="flex items-start gap-3 p-3 bg-white/5 rounded-lg"
                        >
                          <div className="w-6 h-6 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center text-xs font-semibold">
                            {idx + 1}
                          </div>
                          <div className="flex-1 text-sm">{step}</div>
                        </div>
                      ))}
                      <div className="mt-4 p-3 bg-white/5 rounded-lg">
                        <div className="text-sm">
                          <strong>Complexity:</strong>{" "}
                          {analysis.rollbackPlan.complexity}
                        </div>
                        <div className="text-sm">
                          <strong>Estimated Time:</strong>{" "}
                          {analysis.rollbackPlan.estimatedTime} minutes
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-white/5 backdrop-blur-xl rounded-xl border border-white/10 p-12 text-center">
                <i className="ri-search-eye-line text-6xl text-gray-600 mb-4"></i>
                <p className="text-gray-400">
                  Select a user and propose changes to see impact analysis
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
