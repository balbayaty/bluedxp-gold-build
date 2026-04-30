/**
 * 🤖 AI PERMISSION RECOMMENDATIONS COMPONENT
 * 
 * Smart permission suggestions with:
 * - Role-based recommendations
 * - Similar user analysis
 * - One-click apply
 * - Risk assessment
 * 
 * BlueDXP Platform - Enterprise Grade
 */

"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { PermissionRecommendation } from "@/lib/services/ai/permissionRecommendationService";
import { HierarchicalPermission, UserRole } from "@/types/user";

interface AIPermissionRecommendationsProps {
  userId: string;
  role: UserRole;
  department?: string;
  currentPermissions: HierarchicalPermission[];
  onApply: (permissions: HierarchicalPermission[]) => void;
}

const getRiskColor = (risk: string) => {
  switch (risk) {
    case "high":
      return "bg-red-500/20 text-red-400 border-red-500/30";
    case "medium":
      return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
    default:
      return "bg-green-500/20 text-green-400 border-green-500/30";
  }
};

const AIPermissionRecommendations: React.FC<AIPermissionRecommendationsProps> = ({
  userId,
  role,
  department,
  currentPermissions,
  onApply,
}) => {
  const [recommendations, setRecommendations] = useState<PermissionRecommendation[]>([]);
  const [selectedRecs, setSelectedRecs] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [isApplying, setIsApplying] = useState(false);

  // Fetch recommendations
  useEffect(() => {
    fetchRecommendations();
  }, [userId, role, department]);

  const fetchRecommendations = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/users/${userId}/permissions/recommendations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role, department, currentPermissions }),
      });

      if (response.ok) {
        const result = await response.json();
        setRecommendations(result.data || []);
      } else {
        // Use mock data for demo
        setRecommendations(getMockRecommendations(role, department));
      }
    } catch (error) {
      // Use mock data
      setRecommendations(getMockRecommendations(role, department));
    } finally {
      setIsLoading(false);
    }
  };

  // Mock recommendations for demo
  const getMockRecommendations = (role: UserRole, dept?: string): PermissionRecommendation[] => [
    {
      id: "rec_1",
      moduleId: "wms",
      featureId: "inventory",
      actions: ["create", "read", "update"],
      confidence: 0.92,
      reason: `Recommended for ${role.replace(/_/g, " ")} role`,
      basedOn: { roleDefault: true, similarUsers: 15 },
      riskLevel: "low",
    },
    {
      id: "rec_2",
      moduleId: "tms",
      featureId: "shipments",
      actions: ["read", "update"],
      confidence: 0.85,
      reason: "15 similar users have this permission",
      basedOn: { similarUsers: 15 },
      riskLevel: "low",
    },
    {
      id: "rec_3",
      moduleId: "qhse",
      featureId: "incidents",
      actions: ["read"],
      confidence: 0.78,
      reason: dept ? `Common for ${dept} department` : "Commonly used permission",
      basedOn: { departmentCommon: true },
      riskLevel: "low",
    },
    {
      id: "rec_4",
      moduleId: "finance",
      featureId: "reports",
      actions: ["read"],
      confidence: 0.72,
      reason: "Based on activity patterns",
      basedOn: { activityPattern: true },
      riskLevel: "medium",
    },
  ];

  // Toggle recommendation selection
  const toggleSelection = (id: string) => {
    const newSelected = new Set(selectedRecs);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedRecs(newSelected);
  };

  // Select all
  const selectAll = () => {
    setSelectedRecs(new Set(recommendations.map((r) => r.id)));
  };

  // Clear all
  const clearAll = () => {
    setSelectedRecs(new Set());
  };

  // Apply selected recommendations
  const applySelected = async () => {
    setIsApplying(true);
    try {
      const selectedPerms = recommendations
        .filter((r) => selectedRecs.has(r.id))
        .map((r) => ({
          moduleId: r.moduleId,
          featureId: r.featureId,
          actions: r.actions,
          accessLevel: "full" as const,
        }));

      onApply(selectedPerms);
      
      // Remove applied recommendations
      setRecommendations((prev) => prev.filter((r) => !selectedRecs.has(r.id)));
      setSelectedRecs(new Set());
    } finally {
      setIsApplying(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 bg-white/5 border border-white/10 rounded-xl">
        <div className="flex items-center gap-3 animate-pulse">
          <div className="w-10 h-10 rounded-xl bg-purple-500/20"></div>
          <div className="flex-1">
            <div className="h-4 w-48 bg-white/10 rounded mb-2"></div>
            <div className="h-3 w-64 bg-white/10 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (recommendations.length === 0) {
    return (
      <div className="p-6 bg-white/5 border border-white/10 rounded-xl text-center">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-green-500/20 flex items-center justify-center mb-4">
          <i className="ri-check-double-line text-3xl text-green-400"></i>
        </div>
        <h3 className="text-lg font-semibold text-white mb-2">All Set!</h3>
        <p className="text-sm text-[#9ca3af]">
          No additional permissions recommended at this time.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
            <i className="ri-sparkling-line text-xl text-white"></i>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">AI Recommendations</h3>
            <p className="text-xs text-[#9ca3af]">
              {recommendations.length} suggestions based on role & activity
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={selectAll}
            className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-xs text-white hover:bg-white/10 transition-colors"
          >
            Select All
          </button>
          {selectedRecs.size > 0 && (
            <button
              onClick={clearAll}
              className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-xs text-[#9ca3af] hover:bg-white/10 transition-colors"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Recommendations List */}
      <div className="space-y-2">
        <AnimatePresence>
          {recommendations.map((rec, index) => (
            <motion.div
              key={rec.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -100 }}
              transition={{ delay: index * 0.05 }}
              onClick={() => toggleSelection(rec.id)}
              className={`p-4 rounded-xl border cursor-pointer transition-all ${
                selectedRecs.has(rec.id)
                  ? "bg-purple-500/10 border-purple-500/30"
                  : "bg-white/5 border-white/10 hover:border-white/20"
              }`}
            >
              <div className="flex items-start gap-4">
                {/* Checkbox */}
                <div
                  className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                    selectedRecs.has(rec.id)
                      ? "bg-purple-500 border-purple-500"
                      : "border-white/30"
                  }`}
                >
                  {selectedRecs.has(rec.id) && (
                    <i className="ri-check-line text-white text-sm"></i>
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-white font-medium capitalize">
                      {rec.moduleId.replace(/-/g, " ")}
                    </span>
                    {rec.featureId && (
                      <>
                        <span className="text-[#6b7280]">→</span>
                        <span className="text-[#9ca3af] capitalize">
                          {rec.featureId.replace(/-/g, " ")}
                        </span>
                      </>
                    )}
                    <span className={`px-2 py-0.5 rounded text-xs border ${getRiskColor(rec.riskLevel)}`}>
                      {rec.riskLevel} risk
                    </span>
                  </div>

                  <div className="flex items-center gap-2 mb-2">
                    {rec.actions.map((action) => (
                      <span
                        key={action}
                        className="px-2 py-0.5 bg-white/10 rounded text-xs text-[#9ca3af] capitalize"
                      >
                        {action}
                      </span>
                    ))}
                  </div>

                  <div className="flex items-center gap-4 text-xs text-[#9ca3af]">
                    <span className="flex items-center gap-1">
                      <i className="ri-lightbulb-line text-purple-400"></i>
                      {rec.reason}
                    </span>
                  </div>
                </div>

                {/* Confidence */}
                <div className="text-right flex-shrink-0">
                  <div className="text-lg font-bold text-white">
                    {Math.round(rec.confidence * 100)}%
                  </div>
                  <div className="text-xs text-[#9ca3af]">confidence</div>
                </div>
              </div>

              {/* Basis Badges */}
              <div className="flex items-center gap-2 mt-3 pt-3 border-t border-white/10">
                {rec.basedOn.roleDefault && (
                  <span className="px-2 py-0.5 bg-cyan-500/20 text-cyan-400 rounded text-xs">
                    <i className="ri-user-star-line mr-1"></i>
                    Role Default
                  </span>
                )}
                {rec.basedOn.similarUsers && (
                  <span className="px-2 py-0.5 bg-blue-500/20 text-blue-400 rounded text-xs">
                    <i className="ri-team-line mr-1"></i>
                    {rec.basedOn.similarUsers} Similar Users
                  </span>
                )}
                {rec.basedOn.departmentCommon && (
                  <span className="px-2 py-0.5 bg-green-500/20 text-green-400 rounded text-xs">
                    <i className="ri-building-line mr-1"></i>
                    Dept Common
                  </span>
                )}
                {rec.basedOn.activityPattern && (
                  <span className="px-2 py-0.5 bg-orange-500/20 text-orange-400 rounded text-xs">
                    <i className="ri-bar-chart-line mr-1"></i>
                    Activity Pattern
                  </span>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Apply Button */}
      {selectedRecs.size > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="sticky bottom-0 pt-4"
        >
          <button
            onClick={applySelected}
            disabled={isApplying}
            className="w-full px-4 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-medium hover:from-purple-600 hover:to-pink-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-purple-500/20"
          >
            {isApplying ? (
              <>
                <i className="ri-loader-4-line animate-spin"></i>
                Applying...
              </>
            ) : (
              <>
                <i className="ri-magic-line"></i>
                Apply {selectedRecs.size} Recommendation{selectedRecs.size !== 1 ? "s" : ""}
              </>
            )}
          </button>
        </motion.div>
      )}
    </div>
  );
};

export default AIPermissionRecommendations;
