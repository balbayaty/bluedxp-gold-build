"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { IntelligentRecommendation } from "@/lib/services/compliance/intelligentComplianceEngine";
import { intelligentComplianceEngine } from "@/lib/services/compliance/intelligentComplianceEngine";
import { complianceService } from "@/lib/services/compliance/complianceService";
import { authorityHierarchyService } from "@/lib/services/compliance/authorityHierarchyService";

interface IntelligentRecommendationsProps {
  tenantId: string;
}

export default function IntelligentRecommendations({
  tenantId,
}: IntelligentRecommendationsProps) {
  const [recommendations, setRecommendations] = useState<
    IntelligentRecommendation[]
  >([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRecommendations();
  }, [tenantId]);

  const loadRecommendations = async () => {
    try {
      setLoading(true);
      const records = complianceService.getRecordsByTenant(tenantId);
      const allAuthorities = authorityHierarchyService.getAllNodes();
      const regulations = allAuthorities.flatMap((auth) =>
        authorityHierarchyService.getRegulationsByAuthority(auth.id),
      );

      const recs =
        intelligentComplianceEngine.generateIntelligentRecommendations(
          records,
          regulations,
        );
      setRecommendations(recs);
    } catch (error) {
      console.error("Error loading recommendations:", error);
    } finally {
      setLoading(false);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "CRITICAL":
        return "bg-red-500/20 border-red-500/30 text-red-400";
      case "HIGH":
        return "bg-orange-500/20 border-orange-500/30 text-orange-400";
      case "MEDIUM":
        return "bg-yellow-500/20 border-yellow-500/30 text-yellow-400";
      default:
        return "bg-blue-500/20 border-blue-500/30 text-blue-400";
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "AUTO_FIX":
        return "ri-magic-line";
      case "PREVENTIVE":
        return "ri-shield-line";
      case "IMPROVEMENT":
        return "ri-arrow-up-line";
      case "OPTIMIZATION":
        return "ri-speed-up-line";
      default:
        return "ri-lightbulb-line";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <i className="ri-brain-line text-cyan-400"></i>
          AI-Powered Recommendations
        </h3>
        <button
          onClick={loadRecommendations}
          className="text-gray-400 hover:text-white transition-colors"
        >
          <i className="ri-refresh-line"></i>
        </button>
      </div>

      {recommendations.length === 0 ? (
        <div className="text-center py-8 text-gray-400">
          <i className="ri-checkbox-circle-line text-4xl mb-2 text-green-400"></i>
          <p>No recommendations at this time</p>
          <p className="text-sm mt-1">
            All compliance requirements are being met
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {recommendations.map((rec, index) => (
            <motion.div
              key={rec.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`p-4 rounded-lg border ${getPriorityColor(rec.priority)}`}
            >
              <div className="flex items-start gap-3">
                <div
                  className={`w-10 h-10 rounded-lg flex items-center justify-center ${getPriorityColor(rec.priority)}`}
                >
                  <i className={`${getTypeIcon(rec.type)} text-xl`}></i>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="text-white font-medium">{rec.title}</h4>
                    <span className="px-2 py-0.5 rounded text-xs bg-white/10 text-white">
                      {rec.confidence}% confidence
                    </span>
                  </div>
                  <p className="text-sm text-gray-300 mb-3">
                    {rec.description}
                  </p>

                  <div className="flex items-center gap-4 text-xs text-gray-400 mb-3">
                    <span>
                      <i className="ri-bar-chart-line mr-1"></i>
                      Impact: {rec.impact}
                    </span>
                    <span>
                      <i className="ri-tools-line mr-1"></i>
                      Effort: {rec.effort}
                    </span>
                    <span>
                      <i className="ri-star-line mr-1"></i>
                      Benefit: {rec.estimatedBenefit}
                    </span>
                  </div>

                  {rec.actions.length > 0 && (
                    <div className="mt-3">
                      <p className="text-xs text-gray-400 mb-2">
                        Recommended Actions:
                      </p>
                      <ul className="space-y-1">
                        {rec.actions.map((action, idx) => (
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

                  <div className="mt-3 flex gap-2">
                    <button className="px-3 py-1.5 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400 text-xs rounded-lg transition-colors border border-cyan-500/30">
                      <i className="ri-check-line mr-1"></i>
                      Apply
                    </button>
                    <button className="px-3 py-1.5 bg-white/5 hover:bg-white/10 text-gray-400 text-xs rounded-lg transition-colors border border-white/10">
                      <i className="ri-eye-line mr-1"></i>
                      View Details
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
