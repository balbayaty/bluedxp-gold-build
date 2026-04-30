"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { skuAIAnalyticsIntegration } from "@/lib/services/wms/skuAIAnalyticsIntegration";
import type { ReorderRecommendation } from "@/lib/services/wms/skuAIAnalyticsIntegration";

interface ReorderRecommendationsProps {
  skuIds?: string[];
  onReorder?: (recommendation: ReorderRecommendation) => void;
}

export default function ReorderRecommendations({
  skuIds,
  onReorder,
}: ReorderRecommendationsProps) {
  const [loading, setLoading] = useState(true);
  const [recommendations, setRecommendations] = useState<
    ReorderRecommendation[]
  >([]);
  const [filter, setFilter] = useState<
    "ALL" | "CRITICAL" | "HIGH" | "MEDIUM" | "LOW"
  >("ALL");

  useEffect(() => {
    loadRecommendations();
  }, [skuIds]);

  const loadRecommendations = async () => {
    setLoading(true);
    try {
      const data =
        await skuAIAnalyticsIntegration.getReorderRecommendations(skuIds);
      setRecommendations(data);
    } catch (error) {
      console.error("Error loading reorder recommendations:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredRecommendations = recommendations.filter(
    (rec) => filter === "ALL" || rec.urgency === filter,
  );

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case "CRITICAL":
        return "bg-red-500/20 text-red-400 border-red-500/30";
      case "HIGH":
        return "bg-orange-500/20 text-orange-400 border-orange-500/30";
      case "MEDIUM":
        return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
      case "LOW":
        return "bg-blue-500/20 text-blue-400 border-blue-500/30";
      default:
        return "bg-gray-500/20 text-gray-400 border-gray-500/30";
    }
  };

  if (loading) {
    return (
      <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-white/10 rounded w-1/2"></div>
          <div className="h-20 bg-white/10 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white">
          Reorder Recommendations
        </h3>
        <div className="flex items-center gap-2">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as any)}
            className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white"
          >
            <option value="ALL">All</option>
            <option value="CRITICAL">Critical</option>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
          </select>
          <button
            onClick={loadRecommendations}
            className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-700 rounded-lg text-white text-sm font-medium"
          >
            <i className="ri-refresh-line"></i>
          </button>
        </div>
      </div>

      {filteredRecommendations.length === 0 ? (
        <div className="text-center py-8 text-gray-400">
          <i className="ri-checkbox-circle-line text-3xl mb-2"></i>
          <p className="text-sm">No reorder recommendations at this time</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredRecommendations.map((rec, index) => (
            <motion.div
              key={rec.skuId}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`p-4 rounded-lg border ${getUrgencyColor(rec.urgency)}`}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-semibold text-white">
                      SKU: {rec.skuId}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded text-xs font-medium ${getUrgencyColor(rec.urgency)}`}
                    >
                      {rec.urgency}
                    </span>
                  </div>
                  <p className="text-sm text-gray-300">{rec.reason}</p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4 mt-3">
                <div>
                  <div className="text-xs text-gray-400 mb-1">
                    Recommended Qty
                  </div>
                  <div className="text-lg font-semibold text-white">
                    {rec.recommendedQuantity}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-gray-400 mb-1">Est. Arrival</div>
                  <div className="text-sm text-white">
                    {new Date(rec.estimatedArrival).toLocaleDateString()}
                  </div>
                </div>
                <div>
                  {rec.supplierRecommendations &&
                    rec.supplierRecommendations.length > 0 && (
                      <div>
                        <div className="text-xs text-gray-400 mb-1">
                          Best Supplier
                        </div>
                        <div className="text-sm text-white">
                          {rec.supplierRecommendations[0].supplierId}
                          <span className="text-xs text-gray-400 ml-1">
                            ({rec.supplierRecommendations[0].leadTime} days)
                          </span>
                        </div>
                      </div>
                    )}
                </div>
              </div>
              {onReorder && (
                <button
                  onClick={() => onReorder(rec)}
                  className="mt-3 w-full px-4 py-2 bg-cyan-600 hover:bg-cyan-700 rounded-lg text-white text-sm font-medium transition-colors"
                >
                  <i className="ri-shopping-cart-line mr-2"></i>
                  Create Purchase Order
                </button>
              )}
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
