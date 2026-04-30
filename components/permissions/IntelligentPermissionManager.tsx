/**
 * Intelligent Permission Manager Component
 *
 * World-class UI/UX for permission management with:
 * - Visual permission builder
 * - AI-powered recommendations
 * - Pros/cons analysis
 * - Risk warnings
 * - Approval workflow
 * - Conflict detection
 * - Best practice suggestions
 *
 * Industry Standard: Enterprise Permission Management UX
 */

"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  User,
  HierarchicalPermission,
  ModuleId,
  FeatureId,
  TabId,
  Action,
} from "@/types/user";
import {
  permissionEngine,
  PermissionAnalysis,
  PermissionRecommendation,
  PermissionWarning,
} from "@/lib/services/auth/permissionEngine";
import {
  RiShieldUserLine,
  RiAlertLine,
  RiCheckboxCircleLine,
  RiCloseCircleLine,
  RiInformationLine,
  RiLockLine,
  RiEyeLine,
  RiEditLine,
  RiDeleteBinLine,
  RiSettings3Line,
  RiArrowRightLine,
  RiLightbulbLine,
  RiErrorWarningLine,
  RiCheckLine,
  RiCloseLine,
} from "react-icons/ri";

interface IntelligentPermissionManagerProps {
  user: User;
  onPermissionsChange: (permissions: HierarchicalPermission[]) => void;
  mode?: "view" | "edit" | "approve";
  showRecommendations?: boolean;
  showWarnings?: boolean;
  requireApproval?: boolean;
}

export default function IntelligentPermissionManager({
  user,
  onPermissionsChange,
  mode = "edit",
  showRecommendations = true,
  showWarnings = true,
  requireApproval = true,
}: IntelligentPermissionManagerProps) {
  const [permissions, setPermissions] = useState<HierarchicalPermission[]>(
    user.hierarchicalPermissions || [],
  );
  const [analysis, setAnalysis] = useState<PermissionAnalysis | null>(null);
  const [selectedPermission, setSelectedPermission] =
    useState<HierarchicalPermission | null>(null);
  const [showBuilder, setShowBuilder] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [approvalReason, setApprovalReason] = useState("");

  // Analyze permissions when they change
  useEffect(() => {
    if (permissions.length > 0) {
      analyzePermissions();
    }
  }, [permissions]);

  const analyzePermissions = async () => {
    setIsAnalyzing(true);
    try {
      const result = await permissionEngine.analyzePermissions(
        user,
        permissions,
      );
      setAnalysis(result);
    } catch (error) {
      console.error("Permission analysis error:", error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleAddPermission = (permission: HierarchicalPermission) => {
    const newPermissions = [...permissions, permission];
    setPermissions(newPermissions);
    onPermissionsChange(newPermissions);
  };

  const handleRemovePermission = (index: number) => {
    const newPermissions = permissions.filter((_, i) => i !== index);
    setPermissions(newPermissions);
    onPermissionsChange(newPermissions);
  };

  const handleRequestApproval = () => {
    if (analysis?.requiresApproval) {
      setShowApprovalModal(true);
    }
  };

  const getRiskColor = (riskLevel: string) => {
    switch (riskLevel) {
      case "CRITICAL":
        return "text-red-400 bg-red-500/10 border-red-500/30";
      case "HIGH":
        return "text-orange-400 bg-orange-500/10 border-orange-500/30";
      case "MEDIUM":
        return "text-yellow-400 bg-yellow-500/10 border-yellow-500/30";
      case "LOW":
        return "text-green-400 bg-green-500/10 border-green-500/30";
      default:
        return "text-gray-400 bg-gray-500/10 border-gray-500/30";
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "CRITICAL":
        return "text-red-400";
      case "HIGH":
        return "text-orange-400";
      case "MEDIUM":
        return "text-yellow-400";
      case "LOW":
        return "text-blue-400";
      default:
        return "text-gray-400";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with Risk Score */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-semibold text-white mb-2">
            Permission Management
          </h3>
          <p className="text-sm text-gray-400">
            Intelligent permission analysis and recommendations
          </p>
        </div>
        {analysis && (
          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="text-sm text-gray-400">Risk Score</div>
              <div
                className={`text-2xl font-bold ${analysis.riskScore >= 70 ? "text-red-400" : analysis.riskScore >= 40 ? "text-orange-400" : "text-green-400"}`}
              >
                {analysis.riskScore}
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-400">Compliance</div>
              <div
                className={`text-2xl font-bold ${analysis.complianceScore >= 80 ? "text-green-400" : analysis.complianceScore >= 60 ? "text-yellow-400" : "text-red-400"}`}
              >
                {analysis.complianceScore}%
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Warnings Banner */}
      {showWarnings && analysis && analysis.warnings.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-orange-500/10 to-red-500/10 border border-orange-500/30 rounded-lg p-4"
        >
          <div className="flex items-start gap-3">
            <RiErrorWarningLine className="text-orange-400 text-xl mt-0.5" />
            <div className="flex-1">
              <h4 className="text-orange-400 font-semibold mb-2">
                Security Warnings
              </h4>
              <div className="space-y-2">
                {analysis.warnings.slice(0, 3).map((warning, idx) => (
                  <div key={idx} className="text-sm text-gray-300">
                    <span
                      className={`font-medium ${getSeverityColor(warning.severity)}`}
                    >
                      [{warning.severity}] {warning.type}:
                    </span>{" "}
                    {warning.message}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Recommendations */}
      {showRecommendations &&
        analysis &&
        analysis.recommendations.length > 0 && (
          <div className="bg-white/5 border border-white/10 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-4">
              <RiLightbulbLine className="text-yellow-400 text-xl" />
              <h4 className="text-white font-semibold">AI Recommendations</h4>
            </div>
            <div className="space-y-3">
              {analysis.recommendations.map((rec, idx) => (
                <PermissionRecommendationCard
                  key={idx}
                  recommendation={rec}
                  onAdd={() => handleAddPermission(rec.permission)}
                  onDismiss={() => {}}
                />
              ))}
            </div>
          </div>
        )}

      {/* Suggestions */}
      {analysis && analysis.suggestions.length > 0 && (
        <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <RiInformationLine className="text-blue-400 text-xl" />
            <h4 className="text-blue-400 font-semibold">
              Best Practice Suggestions
            </h4>
          </div>
          <ul className="space-y-2">
            {analysis.suggestions.map((suggestion, idx) => (
              <li
                key={idx}
                className="text-sm text-gray-300 flex items-start gap-2"
              >
                <RiCheckLine className="text-blue-400 mt-0.5 flex-shrink-0" />
                <span>{suggestion}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Current Permissions */}
      <div className="bg-white/5 border border-white/10 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-white font-semibold">Current Permissions</h4>
          {mode === "edit" && (
            <button
              onClick={() => setShowBuilder(true)}
              className="px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all"
            >
              + Add Permission
            </button>
          )}
        </div>

        {permissions.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <RiShieldUserLine className="text-4xl mx-auto mb-2 opacity-50" />
            <p>No permissions assigned</p>
          </div>
        ) : (
          <div className="space-y-3">
            {permissions.map((perm, idx) => (
              <PermissionCard
                key={idx}
                permission={perm}
                recommendation={analysis?.recommendations[idx]}
                onRemove={() => handleRemovePermission(idx)}
                mode={mode}
              />
            ))}
          </div>
        )}
      </div>

      {/* Approval Required */}
      {requireApproval && analysis?.requiresApproval && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-gradient-to-r from-red-500/10 to-orange-500/10 border-2 border-red-500/50 rounded-lg p-6"
        >
          <div className="flex items-start gap-4">
            <RiLockLine className="text-red-400 text-2xl mt-1" />
            <div className="flex-1">
              <h4 className="text-red-400 font-semibold text-lg mb-2">
                Approval Required
              </h4>
              <p className="text-gray-300 mb-4">
                These permission changes require approval due to security
                implications.
              </p>
              <button
                onClick={handleRequestApproval}
                className="px-6 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-all"
              >
                Request Approval
              </button>
            </div>
          </div>
        </motion.div>
      )}

      {/* Conflicts */}
      {analysis && analysis.conflicts.length > 0 && (
        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <RiAlertLine className="text-yellow-400 text-xl" />
            <h4 className="text-yellow-400 font-semibold">
              Permission Conflicts Detected
            </h4>
          </div>
          <div className="space-y-2">
            {analysis.conflicts.map((conflict, idx) => (
              <div key={idx} className="text-sm text-gray-300">
                <span className="font-medium text-yellow-400">
                  {conflict.type}:
                </span>{" "}
                {conflict.description}
                <div className="text-xs text-gray-400 mt-1">
                  {conflict.resolution}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Loading State */}
      {isAnalyzing && (
        <div className="text-center py-8">
          <div className="inline-block w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-400 mt-2">Analyzing permissions...</p>
        </div>
      )}
    </div>
  );
}

// Permission Card Component
function PermissionCard({
  permission,
  recommendation,
  onRemove,
  mode,
}: {
  permission: HierarchicalPermission;
  recommendation?: PermissionRecommendation;
  onRemove: () => void;
  mode: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className="bg-white/5 border border-white/10 rounded-lg p-4 hover:border-white/20 transition-all"
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <RiShieldUserLine className="text-blue-400" />
            <span className="font-semibold text-white">
              {permission.moduleId || "General Access"}
            </span>
            {recommendation && (
              <span
                className={`px-2 py-0.5 rounded text-xs font-medium ${getRiskColor(recommendation.riskLevel)}`}
              >
                {recommendation.riskLevel}
              </span>
            )}
          </div>
          {permission.featureId && (
            <div className="text-sm text-gray-400 mb-1">
              Feature: {permission.featureId}
            </div>
          )}
          <div className="flex flex-wrap gap-2 mt-2">
            {permission.actions.map((action, idx) => (
              <span
                key={idx}
                className="px-2 py-1 bg-blue-500/20 text-blue-300 rounded text-xs"
              >
                {action}
              </span>
            ))}
          </div>
          <div className="text-xs text-gray-500 mt-2">
            Scope: {permission.scope}
          </div>
        </div>
        {mode === "edit" && (
          <button
            onClick={onRemove}
            className="text-red-400 hover:text-red-300 transition-colors"
          >
            <RiCloseLine className="text-xl" />
          </button>
        )}
      </div>
    </motion.div>
  );
}

// Permission Recommendation Card
function PermissionRecommendationCard({
  recommendation,
  onAdd,
  onDismiss,
}: {
  recommendation: PermissionRecommendation;
  onAdd: () => void;
  onDismiss: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/30 rounded-lg p-4"
    >
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="font-semibold text-white">
              {recommendation.permission.moduleId || "Recommended Permission"}
            </span>
            <span className="text-xs text-gray-400">
              {recommendation.confidence}% confidence
            </span>
          </div>
          <p className="text-sm text-gray-400">{recommendation.reasoning}</p>
        </div>
        <button
          onClick={onDismiss}
          className="text-gray-400 hover:text-gray-300"
        >
          <RiCloseLine />
        </button>
      </div>

      {/* Pros/Cons */}
      <div className="grid grid-cols-2 gap-4 mb-3">
        <div>
          <div className="flex items-center gap-1 mb-2 text-green-400 text-sm font-medium">
            <RiCheckboxCircleLine />
            Pros
          </div>
          <ul className="space-y-1">
            {recommendation.pros.slice(0, 2).map((pro, idx) => (
              <li
                key={idx}
                className="text-xs text-gray-300 flex items-start gap-1"
              >
                <RiCheckLine className="text-green-400 mt-0.5 flex-shrink-0" />
                {pro}
              </li>
            ))}
          </ul>
        </div>
        <div>
          <div className="flex items-center gap-1 mb-2 text-red-400 text-sm font-medium">
            <RiCloseCircleLine />
            Cons
          </div>
          <ul className="space-y-1">
            {recommendation.cons.slice(0, 2).map((con, idx) => (
              <li
                key={idx}
                className="text-xs text-gray-300 flex items-start gap-1"
              >
                <RiCloseLine className="text-red-400 mt-0.5 flex-shrink-0" />
                {con}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        <button
          onClick={onAdd}
          className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm transition-all"
        >
          Add Permission
        </button>
        {recommendation.requiresApproval && (
          <span className="text-xs text-orange-400 flex items-center gap-1">
            <RiLockLine />
            Requires Approval
          </span>
        )}
      </div>
    </motion.div>
  );
}

function getRiskColor(riskLevel: string): string {
  switch (riskLevel) {
    case "CRITICAL":
      return "text-red-400 bg-red-500/10 border-red-500/30";
    case "HIGH":
      return "text-orange-400 bg-orange-500/10 border-orange-500/30";
    case "MEDIUM":
      return "text-yellow-400 bg-yellow-500/10 border-yellow-500/30";
    case "LOW":
      return "text-green-400 bg-green-500/10 border-green-500/30";
    default:
      return "text-gray-400 bg-gray-500/10 border-gray-500/30";
  }
}

function getSeverityColor(severity: string): string {
  switch (severity) {
    case "CRITICAL":
      return "text-red-400";
    case "HIGH":
      return "text-orange-400";
    case "MEDIUM":
      return "text-yellow-400";
    case "LOW":
      return "text-blue-400";
    default:
      return "text-gray-400";
  }
}
